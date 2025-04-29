
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOutAuth,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config";
import { User, UserRole } from "@/services/types";
import { Timestamp } from "firebase/firestore";

// Add or update the getUserCollectionName function to ensure consistent collection naming
export const getUserCollectionName = (role: UserRole) => {
  return `users_${role}s`;
};

export const signUp = async (
  email: string, 
  password: string, 
  name: string, 
  role: UserRole,
  additionalData?: Record<string, any>
): Promise<User | null> => {
  try {
    console.log(`signUp: Creating user with email ${email} and role ${role}`);
    
    // Create the Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    if (!firebaseUser) {
      throw new Error("Failed to create Firebase user");
    }

    // Update the display name
    await updateProfile(firebaseUser, {
      displayName: name
    });

    // Get the correct collection name for the role
    const collectionName = getUserCollectionName(role);
    console.log(`signUp: Using collection ${collectionName} for role ${role}`);

    // Convert serverTimestamp to Timestamp for compatability
    const currentTimestamp = Timestamp.now();

    // Process governmentId data correctly from additionalData
    const governmentId = {
      type: additionalData?.governmentIdType || additionalData?.idType || "",
      number: additionalData?.governmentIdNumber || additionalData?.idNumber || ""
    };
    
    // Format phone number correctly
    const phoneNumber = additionalData?.phoneNumber || additionalData?.phone || "";

    // Prepare base userData object according to schema for all user types
    const baseUserData = {
      id: firebaseUser.uid,
      name,
      email: firebaseUser.email || email,
      role,
      phoneNumber,
      governmentId,
      createdAt: currentTimestamp,
      REFRESH_TOKEN: null,
    };

    // Add role-specific fields based on schema
    let userData: User = { ...baseUserData };

    if (role === 'lawyer') {
      userData = {
        ...baseUserData,
        barId: additionalData?.barId || "",
        yearsOfExperience: additionalData?.yearsOfExperience?.toString() || "0", // Fix: Convert to string
        specialization: additionalData?.specialization || "",
        clients: []
      };
    } else if (role === 'clerk') {
      userData = {
        ...baseUserData,
        courtId: additionalData?.courtId || "",
        department: additionalData?.department || ""
      };
    } else if (role === 'judge') {
      userData = {
        ...baseUserData,
        chamberNumber: additionalData?.chamberNumber || "",
        yearsOnBench: additionalData?.yearsOnBench?.toString() || "0", // Fix: Convert to string
        courtDistrict: additionalData?.courtDistrict || ""
      };
    } else if (role === 'client') {
      // Client schema is already covered by baseUserData
    }

    // Log what we're storing to help debug
    console.log(`signUp: Storing user data in ${collectionName}:`, userData);

    // Create a new document in the appropriate collection
    await setDoc(doc(db, collectionName, firebaseUser.uid), userData);
    
    // Also add to a general users collection for easier role-based querying
    await setDoc(doc(db, "users", firebaseUser.uid), {
      id: firebaseUser.uid,
      email: firebaseUser.email || email,
      role,
      name,
      phoneNumber,
      governmentId,
      createdAt: currentTimestamp
    });

    console.log(`signUp: User created successfully with role ${role}:`, userData);
    return userData;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Next, update the signIn function to enforce role checks
export const signIn = async (
  email: string, 
  password: string, 
  expectedRole: UserRole
): Promise<User> => {
  try {
    console.log(`signIn: Attempting to sign in ${email} as ${expectedRole}`);
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    if (!firebaseUser) {
      throw new Error("Failed to authenticate with Firebase");
    }
    
    // First check if the user exists in the specific role collection
    const roleCollectionName = getUserCollectionName(expectedRole);
    const userDocRef = doc(db, roleCollectionName, firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      // If not found in the expected role collection, check if they exist in any other role collection
      const roles: UserRole[] = ["client", "lawyer", "clerk", "judge"];
      let actualRole: UserRole | null = null;
      let userData: User | null = null;
      
      for (const role of roles) {
        if (role === expectedRole) continue; // Already checked
        
        const otherCollectionRef = doc(db, getUserCollectionName(role), firebaseUser.uid);
        const otherDocSnap = await getDoc(otherCollectionRef);
        
        if (otherDocSnap.exists()) {
          actualRole = role;
          userData = otherDocSnap.data() as User;
          break;
        }
      }
      
      if (actualRole) {
        // User exists but with a different role
        console.error(`signIn: Role mismatch - user is a ${actualRole}, but trying to log in as ${expectedRole}`);
        throw new Error(`This account is registered as a ${actualRole}, not as a ${expectedRole}. Please use the correct login form.`);
      } else {
        // User doesn't exist in any role collection, create them in the expected role
        console.warn(`signIn: User ${firebaseUser.uid} exists in Auth but not in Firestore. Creating document in ${roleCollectionName}`);
        
        const newUserData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          name: firebaseUser.displayName || email.split('@')[0],
          role: expectedRole,
          createdAt: Timestamp.now()
        };
        
        await setDoc(userDocRef, newUserData);
        
        // Also add to general users collection
        await setDoc(doc(db, "users", firebaseUser.uid), {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          role: expectedRole,
          name: newUserData.name,
          createdAt: Timestamp.now()
        });
        
        return newUserData;
      }
    }
    
    // User exists with the correct role, return their data
    const userData = userDocSnap.data() as User;
    
    // Ensure the role is explicitly set in the returned data
    if (!userData.role) {
      userData.role = expectedRole;
    } else if (userData.role !== expectedRole) {
      console.error(`signIn: Role mismatch in Firestore - stored as ${userData.role}, but trying to log in as ${expectedRole}`);
      throw new Error(`Role mismatch in your account data. Please contact support.`);
    }
    
    console.log(`signIn: Successfully authenticated user with role ${expectedRole}:`, userData);
    return userData;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Update getCurrentUser to check role-specific collections first
export const getCurrentUser = async (roleHint?: UserRole): Promise<User | null> => {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.log("getCurrentUser: No authenticated user");
      return null;
    }
    
    console.log(`getCurrentUser: Fetching data for ${firebaseUser.uid}, role hint: ${roleHint || "none"}`);
    
    // If we have a role hint, check that collection first
    if (roleHint) {
      const roleCollection = getUserCollectionName(roleHint);
      const userDoc = await getDoc(doc(db, roleCollection, firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log(`getCurrentUser: Found user in ${roleCollection}:`, userData);
        return { ...userData, id: firebaseUser.uid };
      }
    }
    
    // If no role hint or not found with hint, check all role collections
    const roles: UserRole[] = ["client", "lawyer", "clerk", "judge"];
    
    for (const role of roles) {
      const collectionName = getUserCollectionName(role);
      console.log(`getCurrentUser: Checking ${collectionName}`);
      
      const userDoc = await getDoc(doc(db, collectionName, firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log(`getCurrentUser: Found user in ${collectionName}:`, userData);
        return { ...userData, id: firebaseUser.uid, role };
      }
    }
    
    console.log(`getCurrentUser: User ${firebaseUser.uid} not found in any role collection`);
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Update createMissingUserDocuments to respect role parameter
export const createMissingUserDocuments = async (
  firebaseUser: FirebaseUser,
  role: UserRole
): Promise<boolean> => {
  if (!firebaseUser) {
    console.error("createMissingUserDocuments: No user provided");
    return false;
  }

  try {
    console.log(`createMissingUserDocuments: Attempting to create documents for ${firebaseUser.uid} with role ${role}`);

    // Get the correct collection name for this role
    const collectionName = getUserCollectionName(role);
    console.log(`createMissingUserDocuments: Using collection ${collectionName}`);

    // Double-check if the user document already exists in the correct collection
    const existingDoc = await getDoc(doc(db, collectionName, firebaseUser.uid));
    if (existingDoc.exists()) {
      console.log(`User document already exists in ${collectionName}, skipping creation`);
      return true; // Document already exists in the right place
    }

    const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User";
    const email = firebaseUser.email || "";

    // Create a basic user document in the role-specific collection
    const userData: User = {
      id: firebaseUser.uid,
      email: email,
      name: name,
      role: role,
      createdAt: Timestamp.now()
    };

    // Create the document
    await setDoc(doc(db, collectionName, firebaseUser.uid), userData);
    console.log(`createMissingUserDocuments: Created document in ${collectionName} for ${firebaseUser.uid}`);

    // Also ensure the user exists in the general users collection
    await setDoc(doc(db, "users", firebaseUser.uid), {
      id: firebaseUser.uid,
      email: email,
      role: role,
      name: name,
      createdAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error("Error creating missing user documents:", error);
    return false;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOutAuth(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
