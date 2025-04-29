import { doc, setDoc, getDoc, collection, DocumentData, FirestoreError, query, where, getDocs } from "firebase/firestore";
import { db } from "../config"; // Import the db instance from config.ts

// Define user roles and corresponding collection names
export type UserRole = 'client' | 'lawyer' | 'clerk' | 'judge'; // Add other roles as needed
const userCollectionMap: Record<UserRole, string> = {
    client: 'users_clients',
    lawyer: 'users_lawyers',
    clerk: 'users_clerks',
    judge: 'users_judges',
};
const userCollections = Object.values(userCollectionMap);

/**
 * Adds user data to the appropriate Firestore collection based on their role.
 * Uses the UID as the document ID.
 *
 * @param uid - The user's Firebase Authentication UID.
 * @param role - The user's role (e.g., 'client', 'lawyer').
 * @param data - An object containing the user data to store (e.g., { name: 'John Doe', email: 'john@example.com' }).
 */
export const addUserData = async (uid: string, role: UserRole, data: Omit<DocumentData, 'role' | 'uid'>): Promise<void> => {
    const collectionName = userCollectionMap[role];
    if (!collectionName) {
        throw new Error(`Invalid user role specified: ${role}`);
    }
    try {
        const userDocRef = doc(db, collectionName, uid);
        // Add uid and role to the data being stored
        const dataToStore = { ...data, uid, role };
        await setDoc(userDocRef, dataToStore);
        console.log(`User data added to ${collectionName} for UID: ${uid}`);
    } catch (error) {
        console.error(`Error adding user data to ${collectionName}: `, error);
        // Rethrow or handle as needed
        throw error;
    }
};

/**
 * Fetches user data from Firestore by checking all potential user collections.
 *
 * @param uid - The user's Firebase Authentication UID.
 * @returns An object containing the user's data and role { ...userData, role: string } | null if not found.
 */
export const getUserData = async (uid: string): Promise<(DocumentData & { role: string }) | null> => {
    console.log("getUserData: Function called for UID:", uid);
    if (!uid) {
        console.error("getUserData called with invalid UID:", uid);
        return null;
    }
    console.log(`getUserData: Attempting to fetch data for UID: ${uid} from collections: ${userCollections.join(', ')}`);
    for (const collectionName of userCollections) {
        console.log(`getUserData: Checking collection: ${collectionName} for UID: ${uid}`);
        try {
            const userDocRef = doc(db, collectionName, uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                console.log(`getUserData: User data found in ${collectionName} for UID: ${uid}`);
                const userData = docSnap.data();
                console.log(`getUserData: Fetched user data:`, userData);
                // Ensure the role field exists, fallback to deriving from collection if needed
                const role = userData.role || Object.keys(userCollectionMap).find(key => userCollectionMap[key as UserRole] === collectionName);
                return { ...userData, role: role || 'unknown' }; // Return data including the role
            } else {
                 console.log(`getUserData: No document found for UID ${uid} in ${collectionName}.`);
            }
        } catch (error) {
            // Log error but continue checking other collections
            console.error(`getUserData: Error fetching user data from ${collectionName} for UID ${uid}: `, error);
             if ((error as FirestoreError).code === 'permission-denied') {
                 console.warn(`getUserData: Permission denied accessing ${collectionName}. Check Firestore rules.`);
                 // If permission denied, we likely won't find it here, maybe stop early? Or continue? Let's continue for now.
             }
        }
    }

    console.log(`getUserData: User data not found in any collection for UID: ${uid}`);
    return null; // User not found in any specified collection
};
// Add other Firestore service functions as needed (e.g., updateUserData, deleteUserData, fetchCases, etc.)


/**
 * Creates a new case document in Firestore.
 * @param caseData - The data for the new case.
 * @returns A promise that resolves when the case is created.
 */
export const createCaseData = async (caseData: any): Promise<void> => {
  await createCaseHelper(caseData);
};

const createCaseHelper = async (caseData: any): Promise<void> => {
  try {
    const casesCollection = collection(db, 'cases');
    // Assuming caseData has an 'id' field to use as the document ID
    const caseDocRef = doc(casesCollection, caseData.id);
    await setDoc(caseDocRef, caseData);
    console.log(`Case data added to cases collection with ID: ${caseData.id}`);
  } catch (error) {
    console.error("Error creating case data: ", error);
    throw error;
  }
};
/**
 * Retrieves cases associated with a specific user ID.
 * @param userId - The ID of the user.
 * @returns A promise that resolves with an array of case data.
 */

/**
 * Retrieves cases associated with a specific user ID.
 * @param userId - The ID of the user.
 * @returns A promise that resolves with an array of case data.
 */
export const getCasesByUserId = async (userId: string): Promise<any[]> => {
  try {
    const casesCollection = collection(db, 'cases');
    const q = query(casesCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const cases: any[] = [];
    querySnapshot.forEach((doc) => {
      cases.push({ id: doc.id, ...doc.data() });
    });
    return cases;
  } catch (error) {
    console.error("Error getting cases by user ID: ", error);
    throw error;
  }
};

/**
 * Retrieves a list of lawyers who have accepted a particular case.
 * @param caseId - The ID of the case.
 * @returns A promise that resolves with an array of lawyer data.
 */
export const getAcceptedLawyers = async (caseId: string): Promise<any[]> => {
  try {
    const caseDocRef = doc(db, 'cases', caseId);
    const docSnap = await getDoc(caseDocRef);
    if (docSnap.exists()) {
      const caseData = docSnap.data();
      const acceptedLawyers = caseData.acceptedLawyers || []; // Assuming acceptedLawyers is an array of lawyer IDs
      return acceptedLawyers;
    } else {
      console.log("No such case!");
      return [];
    }
  } catch (error) {
    console.error("Error getting accepted lawyers: ", error);
    throw error;
  }
};