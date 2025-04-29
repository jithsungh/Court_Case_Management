
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config";
import { Hearing, ReschedulingRecord } from "@/services/types";
import { formatTimestamp, timestampToDate } from "@/utils/dateUtils";

// Get all hearings
export const getAllHearings = async (): Promise<Hearing[]> => {
  try {
    const hearingsSnapshot = await getDocs(collection(db, "hearings"));
    return hearingsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: data.date || null,
        reschedulingHistory: data.reschedulingHistory || [],
      } as Hearing;
    });
  } catch (error) {
    console.error("Error getting hearings:", error);
    return [];
  }
};

// Get hearings by case ID
export const getHearingsByCaseId = async (
  caseId: string
): Promise<Hearing[]> => {
  try {
    const hearingsQuery = query(
      collection(db, "hearings"),
      where("caseId", "==", caseId)
    );

    const hearingsSnapshot = await getDocs(hearingsQuery);

    return hearingsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: data.date || null,
        reschedulingHistory: data.reschedulingHistory || [],
      } as Hearing;
    });
  } catch (error) {
    console.error("Error getting hearings by case ID:", error);
    return [];
  }
};

// Create a new hearing
export const createHearing = async (
  hearingData: Omit<Hearing, "id">
): Promise<Hearing> => {
  try {
    const newHearing = {
      ...hearingData,
      date: hearingData.date || null,
      rescheduled: false,
      reschedulingHistory: [],
    };

    const docRef = await addDoc(collection(db, "hearings"), newHearing);

    return {
      ...hearingData,
      id: docRef.id,
      rescheduled: false,
      reschedulingHistory: [],
    } as Hearing;
  } catch (error) {
    console.error("Error creating hearing:", error);
    throw error;
  }
};

// Update a hearing
export const updateHearing = async (
  id: string,
  updates: Partial<Hearing>
): Promise<Hearing> => {
  try {
    const hearingRef = doc(db, "hearings", id);

    // Convert date string to Firestore timestamp if needed
    const firestoreUpdates: any = { ...updates };

    await updateDoc(hearingRef, firestoreUpdates);

    // Get the updated hearing
    const hearingDoc = await getDoc(hearingRef);

    if (!hearingDoc.exists()) {
      throw new Error("Hearing not found");
    }

    const data = hearingDoc.data();
    return {
      ...data,
      id,
      date: data.date || null,
      reschedulingHistory: data.reschedulingHistory || [],
    } as Hearing;
  } catch (error) {
    console.error("Error updating hearing:", error);
    throw error;
  }
};

// Add rescheduling record to hearing
export const addReschedulingRecord = async (
  hearingId: string,
  record: Omit<ReschedulingRecord, "rescheduledAt">
): Promise<Hearing> => {
  try {
    const hearingRef = doc(db, "hearings", hearingId);
    const hearingDoc = await getDoc(hearingRef);

    if (!hearingDoc.exists()) {
      throw new Error("Hearing not found");
    }

    const hearingData = hearingDoc.data();

    const reschedulingRecord = {
      previousDate: record.previousDate,
      newDate: record.newDate,
      reason: record.reason,
      judgeId: record.judgeId,
      rescheduledAt: serverTimestamp(),
    };

    const reschedulingHistory = hearingData.reschedulingHistory || [];
    reschedulingHistory.push(reschedulingRecord);

    await updateDoc(hearingRef, {
      rescheduled: true,
      date: reschedulingRecord.newDate,
      reschedulingHistory,
    });

    // Get the updated hearing
    const updatedHearingDoc = await getDoc(hearingRef);
    const updatedData = updatedHearingDoc.data();

    return {
      ...updatedData,
      id: hearingId,
      date: updatedData.date || null,
      reschedulingHistory: updatedData.reschedulingHistory || [],
    } as Hearing;
  } catch (error) {
    console.error("Error adding rescheduling record:", error);
    throw error;
  }
};

// Delete a hearing
export const deleteHearing = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "hearings", id));
  } catch (error) {
    console.error("Error deleting hearing:", error);
    throw error;
  }
};

// Get hearings for stakeholders (involved parties)
export const getHearingsForStakeholder = async (
  userId: string,
  cases: any[]
): Promise<Hearing[]> => {
  try {
    // Find all cases where the user is involved as plaintiff, defendant, lawyer or judge
    const userCaseIds = cases.filter(caseItem => {
      return (
        caseItem.clientId === userId || 
        caseItem.defendantClientId === userId ||
        caseItem.lawyerId === userId ||
        caseItem.defendantLawyerId === userId ||
        (caseItem.judge && caseItem.judge.judgeId === userId)
      );
    }).map(caseItem => caseItem.id);

    if (userCaseIds.length === 0) {
      return [];
    }

    // Get all hearings for these cases
    const userHearings: Hearing[] = [];
    
    // Firestore doesn't support "in" queries with more than 10 values, so we need to batch
    const batchSize = 10;
    
    for (let i = 0; i < userCaseIds.length; i += batchSize) {
      const batch = userCaseIds.slice(i, i + batchSize);
      
      const hearingsQuery = query(
        collection(db, "hearings"),
        where("caseId", "in", batch)
      );
      
      const hearingsSnapshot = await getDocs(hearingsQuery);
      
      const batchHearings = hearingsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date || null,
          reschedulingHistory: data.reschedulingHistory || [],
        } as Hearing;
      });
      
      userHearings.push(...batchHearings);
    }
    
    return userHearings;
  } catch (error) {
    console.error("Error getting hearings for stakeholder:", error);
    return [];
  }
};
