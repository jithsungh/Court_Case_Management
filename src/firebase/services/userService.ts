
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";
import { User, UserRole } from "@/services/types";

// Get collection name based on role
const getUserCollectionName = (role: UserRole): string => {
  return `users_${role}s`;
};

// Get all users - combining from all role collections
export const getAllUsers = async (): Promise<User[]> => {
  console.log("userService: getAllUsers function called");
  console.log("userService: getAllUsers - START");
  try {
    const roles: UserRole[] = ["client", "lawyer", "clerk", "judge"];
    const allUsers: User[] = [];

    for (const role of roles) {
      console.log("userService: Fetching users from role:", role);
      const collectionName = getUserCollectionName(role);
      const usersSnapshot = await getDocs(collection(db, collectionName));

      const usersOfRole = usersSnapshot.docs.map((doc) => {
        const userData = {
          ...doc.data(),
          id: doc.id,
          role: role, // Explicitly set role to match collection
        };
        if (role === "lawyer") {
          console.log("Lawyer fetched:", userData);
        }
        return userData as User;
      });
      console.log(
        "Number of users fetched from",
        collectionName,
        ":",
        usersOfRole.length
      );
      allUsers.push(...usersOfRole);
    }

    return allUsers;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

// Get user by ID and role
export const getUserById = async (
  id: string,
  role?: UserRole
): Promise<User | null> => {
  try {
    // If role is provided, directly access that collection
    if (role) {
      const collectionName = getUserCollectionName(role);
      console.log(`Looking for user with ID: ${id} in ${collectionName}`);
      const userDoc = await getDoc(doc(db, collectionName, id));

      if (!userDoc.exists()) {
        console.log(`User not found in ${collectionName}`);
        return null;
      }

      const userData = userDoc.data();
      return {
        ...userData,
        id: userDoc.id,
        role: role, // Explicitly set role
      } as User;
    }

    // If role is not provided, search across all user collections
    console.log(`Searching for user with ID: ${id} across all role collections`);
    const rolesToSearch: UserRole[] = ["client", "lawyer", "clerk", "judge"];
    for (const searchRole of rolesToSearch) {
      const collectionName = getUserCollectionName(searchRole);
      console.log(`Checking ${collectionName}`);
      const userDoc = await getDoc(doc(db, collectionName, id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`Found user in ${collectionName}:`, userData);
        return {
          ...userData,
          id: userDoc.id,
          role: searchRole, // Ensure role is included and matches collection
        } as User;
      }
    }
    
    // Check main users collection as last resort
    console.log(`Checking main users collection`);
    const mainUserDoc = await getDoc(doc(db, "users", id));
    if (mainUserDoc.exists()) {
      const userData = mainUserDoc.data();
      const userRole = userData.role as UserRole;
      console.log(`Found user in main users collection with role: ${userRole}`);
      
      // Try to get complete data from role collection
      const roleCollectionName = getUserCollectionName(userRole);
      const roleUserDoc = await getDoc(doc(db, roleCollectionName, id));
      if (roleUserDoc.exists()) {
        const fullUserData = roleUserDoc.data();
        return {
          ...fullUserData,
          id: roleUserDoc.id,
          role: userRole,
        } as User;
      }
      
      // If not found in role collection but in main, return the main data
      return {
        ...userData,
        id: mainUserDoc.id,
        role: userRole,
      } as User;
    }
    
    // User not found in any collection
    console.log(`User with ID: ${id} not found in any collection`);
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

// Get users by role
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  try {
    const collectionName = getUserCollectionName(role);
    console.log(`Getting all users from ${collectionName}`);
    const usersSnapshot = await getDocs(collection(db, collectionName));

    console.log(`Number of ${role}s fetched:`, usersSnapshot.docs.length);

    return usersSnapshot.docs.map((doc) => {
      const userData = doc.data();
      return {
        ...userData,
        id: doc.id,
        role: role, // Explicitly set role to match collection
      } as User;
    });
  } catch (error) {
    console.error(`Error getting users by role: ${role}`, error);
    return [];
  }
};

// Update user
export const updateUser = async (
  id: string,
  role: UserRole,
  updates: Partial<User>
): Promise<User> => {
  try {
    const collectionName = getUserCollectionName(role);
    const userRef = doc(db, collectionName, id);

    // Ensure role isn't inadvertently changed
    const updateData = {
      ...updates,
      role: role, // Ensure role stays the same
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updateData);
    console.log(`Updated user ${id} in ${collectionName}`);

    // Also update the main users collection basic info
    const mainUserRef = doc(db, "users", id);
    await updateDoc(mainUserRef, {
      name: updates.name,
      updatedAt: serverTimestamp(),
    });
    console.log(`Updated user basic data in main users collection`);

    // Get the updated user
    const updatedUser = await getUserById(id, role);

    if (!updatedUser) {
      throw new Error("Failed to retrieve updated user");
    }

    // Update localStorage
    const storedUserStr = localStorage.getItem("courtwise_user");
    if (storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);
      localStorage.setItem("courtwise_user", JSON.stringify({
        ...storedUser,
        ...updatedUser,
        role: role, // Explicitly ensure role
      }));
    }

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Get clients by lawyer ID
export const getClientsByLawyerId = async (
  lawyerId: string
): Promise<User[]> => {
  try {
    // First, get all cases with this lawyer
    const casesQuery = query(
      collection(db, "cases"),
      where("lawyerId", "==", lawyerId)
    );

    const casesSnapshot = await getDocs(casesQuery);

    // Extract client IDs
    const clientIds = Array.from(
      new Set(casesSnapshot.docs.map((doc) => doc.data().clientId))
    );

    if (clientIds.length === 0) {
      return [];
    }

    // Get client data for each client ID
    const clients = await Promise.all(
      clientIds.map((id) => getUserById(id, "client"))
    );

    return clients.filter((client) => client !== null) as User[];
  } catch (error) {
    console.error("Error getting clients for lawyer:", error);
    return [];
  }
};

// Get lawyers by client ID
export const getLawyersByClientId = async (
  clientId: string
): Promise<User[]> => {
  try {
    // First, get all cases with this client
    const casesQuery = query(
      collection(db, "cases"),
      where("clientId", "==", clientId)
    );

    const casesSnapshot = await getDocs(casesQuery);

    // Extract lawyer IDs
    const lawyerIds = Array.from(
      new Set(
        casesSnapshot.docs.map((doc) => doc.data().lawyerId).filter((id) => id) // Filter out null or undefined
      )
    );

    if (lawyerIds.length === 0) {
      return [];
    }

    // Get lawyer data for each lawyer ID
    const lawyers = await Promise.all(
      lawyerIds.map((id) => getUserById(id, "lawyer"))
    );

    return lawyers.filter((lawyer) => lawyer !== null) as User[];
  } catch (error) {
    console.error("Error getting lawyers for client:", error);
    return [];
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  console.log("userService: getCurrentUser function called");
  try {
    // Get the current user from localStorage
    const authUser = localStorage.getItem("courtwise_user");
    console.log("userService: authUser from localStorage:", authUser);

    if (!authUser) {
      console.log("userService: No auth user found in localStorage");
      return null;
    }

    const user = JSON.parse(authUser);
    console.log("userService: user parsed from localStorage:", user);

    if (!user.role || !user.id) {
      console.log("userService: Invalid user data in localStorage - missing role or id");
      return null;
    }

    // Get the user from Firestore to ensure we have fresh data
    const userDocRef = doc(db, `users_${user.role}s`, user.id);
    console.log(`userService: Fetching from ${`users_${user.role}s`} collection with ID ${user.id}`);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log(`userService: No user found in ${`users_${user.role}s`} collection`);
      return null;
    }

    const userData = userDoc.data() as User;
    console.log("userService: userData from Firestore:", userData);

    // Ensure role and ID are explicitly set
    userData.role = user.role;
    userData.id = user.id;

    return userData;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Get all lawyers (for client to browse)
export const getAllLawyers = async (): Promise<User[]> => {
  try {
    const collectionName = getUserCollectionName("lawyer");
    const usersSnapshot = await getDocs(collection(db, collectionName));

    return usersSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      role: "lawyer", // Explicitly set role
    })) as User[];
  } catch (error) {
    console.error("Error getting all lawyers:", error);
    return [];
  }
};
