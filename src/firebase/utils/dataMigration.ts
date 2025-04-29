
import { collection, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../config';
import clerksData from '@/data/users_clerks.json';
import clientsData from '@/data/users_clients.json';
import lawyersData from '@/data/users_lawyers.json';
import judgesData from '@/data/users_judges.json';
import casesData from '@/data/cases.json';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * This utility function imports the sample JSON data into Firebase Firestore
 * It should only be run once during initial setup
 */
export const migrateDataToFirebase = async () => {
  const userData = {
    clients: clientsData,
    lawyers: lawyersData,
    clerks: clerksData,
    judges: judgesData,
  };
  const cases = casesData;

  try {
    // First, check if data already exists (checking one user collection and cases)
    const clientUsersSnapshot = await getDocs(collection(db, 'users_clients'));
    const casesSnapshot = await getDocs(collection(db, 'cases'));

    if (clientUsersSnapshot.docs.length > 0 || casesSnapshot.docs.length > 0) {
      console.log('Data already exists in Firestore. Skipping migration.');
      return false;
    }
    
    // Migrate users by role
    console.log('Migrating users to Firestore...');
    for (const [role, users] of Object.entries(userData)) {
      const collectionName = `users_${role}`; // e.g., users_clients
      console.log(`Migrating ${users.length} users to ${collectionName}...`);
      for (const user of users) {
        const userDocData = {
          ...user,
          // Ensure role field exists if not present in JSON, matching the collection type
          role: role.slice(0, -1), // 'clients' -> 'client'
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        // Use the existing ID for each user
        await setDoc(doc(db, collectionName, user.id), userDocData);
      }
    }
    
    // Migrate cases
    console.log('Migrating cases to Firestore...');
    for (const caseItem of cases) {
      const caseData = {
        ...caseItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        filedDate: caseItem.filedDate ? Timestamp.fromDate(new Date(caseItem.filedDate)) : null,
        nextHearingDate: caseItem.nextHearingDate ? Timestamp.fromDate(new Date(caseItem.nextHearingDate)) : null
      };
      
      // Use the existing ID for each case
      await setDoc(doc(db, 'cases', caseItem.id), caseData);
    }
    
    console.log('Data migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error migrating data to Firebase:', error);
    return false;
  }
};

// Function to check if initial migration is needed
export const checkDataMigrationNeeded = async () => {
  try {
    // Check one of the user collections, e.g., users_clients
    const clientUsersSnapshot = await getDocs(collection(db, 'users_clients'));
    // If no clients, assume migration hasn't happened (or check cases too if needed)
    return clientUsersSnapshot.docs.length === 0;
  } catch (error) {
    console.error('Error checking if migration is needed:', error);
    return false;
  }
};
