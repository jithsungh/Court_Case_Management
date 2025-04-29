import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  DocumentData,
  or,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config";
import { Case, CaseStatus, CaseRequest, GovernmentIdType } from "@/services/types";

// Get all cases
export const getAllCases = async (): Promise<Case[]> => {
  try {
    const casesSnapshot = await getDocs(collection(db, "cases"));
    return casesSnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt
            : Timestamp.now(),
        filedDate:
          data.filedDate instanceof Timestamp ? data.filedDate : undefined,
        nextHearingDate:
          data.nextHearingDate instanceof Timestamp
            ? data.nextHearingDate
            : undefined,
      } as Case;
    });
  } catch (error) {
    console.error("Error getting cases:", error);
    return [];
  }
};

// Get case by ID
export const getCaseById = async (id: string): Promise<Case | null> => {
  try {
    const caseDoc = await getDoc(doc(db, "cases", id));

    if (!caseDoc.exists()) {
      return null;
    }

    const data = caseDoc.data() as DocumentData;
    return {
      ...data,
      id: caseDoc.id,
      createdAt:
        data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      updatedAt:
        data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
      filedDate:
        data.filedDate instanceof Timestamp ? data.filedDate : undefined,
      nextHearingDate:
        data.nextHearingDate instanceof Timestamp
          ? data.nextHearingDate
          : undefined,
    } as Case;
  } catch (error) {
    console.error("Error getting case:", error);
    return null;
  }
};

// Get cases associated with a user ID (client, lawyer, or judge)
export const getCasesByUserId = async (userId: string): Promise<Case[]> => {
  if (!userId) {
    console.error("getCasesByUserId called with undefined or null userId");
    return [];
  }
  try {
    const caseQuery = query(
      collection(db, "cases"),
      or(
        where("clientId", "==", userId),
        where("lawyerId", "==", userId),
        where("defendantClientId", "==", userId),
        where("defendantLawyerId", "==", userId),
        where("judge.judgeId", "==", userId)
      )
    );

    const casesSnapshot = await getDocs(caseQuery);

    return casesSnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt
            : Timestamp.now(),
        filedDate:
          data.filedDate instanceof Timestamp ? data.filedDate : undefined,
        nextHearingDate:
          data.nextHearingDate instanceof Timestamp
            ? data.nextHearingDate
            : undefined,
      } as Case;
    });
  } catch (error) {
    console.error("Error getting cases by user ID:", error);
    return [];
  }
};

// Create a new case
export const createCase = async (
  caseData: Omit<Case, "id" | "createdAt" | "updatedAt">
): Promise<Case> => {
  try {
    const now = serverTimestamp();
    const completeCase = {
      ...caseData,
      createdAt: now,
      updatedAt: now,
      plaintiff: caseData.plaintiff || {
        name: "",
        governmentIdType: "Aadhar",
        governmentIdNumber: "",
        phoneNumber: "",
      },
      defendant: caseData.defendant || {
        name: "",
        governmentIdType: "Aadhar",
        governmentIdNumber: "",
        phoneNumber: "",
      },
      status: caseData.status || "pending",
      plaintiffEvidences: caseData.plaintiffEvidences || [],
      defendantEvidences: caseData.defendantEvidences || [],
      witnesses: caseData.witnesses || [],
      hearings: caseData.hearings || [],
    };

    const docRef = await addDoc(collection(db, "cases"), completeCase);

    return {
      ...completeCase,
      id: docRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Case;
  } catch (error) {
    console.error("Error creating case:", error);
    throw error;
  }
};

// Update an existing case
const convertToTimestamp = (value: any): Timestamp | null | undefined => {
  if (value instanceof Timestamp || value === null || value === undefined) {
    return value;
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  if (typeof value === "string" || typeof value === "number") {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return Timestamp.fromDate(date);
      } else {
        console.error(
          "Invalid date value (string/number) provided for conversion:",
          value
        );
        return undefined;
      }
    } catch (e) {
      console.error(
        "Error converting date value (string/number) to Timestamp:",
        value,
        e
      );
      return undefined;
    }
  }
  console.error(
    "Unsupported date type provided for conversion:",
    typeof value,
    value
  );
  return undefined;
};

export const updateCase = async (
  id: string,
  updates: Partial<Case>
): Promise<Case> => {
  try {
    const caseRef = doc(db, "cases", id);

    const firestoreUpdates: { [key: string]: any } = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.hasOwnProperty("filedDate")) {
      const convertedFiledDate = convertToTimestamp(updates.filedDate);
      if (convertedFiledDate !== undefined) {
        firestoreUpdates.filedDate = convertedFiledDate;
      } else {
        console.warn(
          `filedDate conversion failed for case ${id}. Field will not be updated.`
        );
        delete firestoreUpdates.filedDate;
      }
    }

    if (updates.hasOwnProperty("nextHearingDate")) {
      const convertedNextHearingDate = convertToTimestamp(
        updates.nextHearingDate
      );
      if (convertedNextHearingDate !== undefined) {
        firestoreUpdates.nextHearingDate = convertedNextHearingDate;
      } else {
        console.warn(
          `nextHearingDate conversion failed for case ${id}. Field will not be updated.`
        );
        delete firestoreUpdates.nextHearingDate;
      }
    }

    delete firestoreUpdates.id;
    delete firestoreUpdates.createdAt;

    await updateDoc(caseRef, firestoreUpdates);

    const updatedCase = await getCaseById(id);

    if (!updatedCase) {
      throw new Error("Failed to retrieve updated case after update");
    }

    return updatedCase;
  } catch (error) {
    console.error("Error updating case:", error);
    throw error;
  }
};

export const deleteCase = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "cases", id));
  } catch (error) {
    console.error("Error deleting case:", error);
    throw error;
  }
};

export const createCaseRequest = async (
  requestData: Omit<CaseRequest, "id" | "createdAt" | "updatedAt" | "status">
): Promise<CaseRequest> => {
  try {
    const newRequest = {
      ...requestData,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "caseRequests"), newRequest);

    const createdDoc = await getDoc(docRef);
    const data = createdDoc.data() as DocumentData;

    return {
      ...data,
      id: docRef.id,
    } as CaseRequest;
  } catch (error) {
    console.error("Error creating case request:", error);
    throw error;
  }
};

export const createDefenseRequest = async (
  clientId: string,
  lawyerId: string,
  caseId: string,
  description: string
): Promise<CaseRequest> => {
  try {
    const caseDoc = await getDoc(doc(db, "cases", caseId));
    if (!caseDoc.exists()) {
      throw new Error("Case not found");
    }
    
    const caseData = caseDoc.data() as DocumentData;
    
    const requestData = {
      clientId,
      lawyerId,
      caseId,
      caseTitle: caseData.title || `Case #${caseData.caseNumber}`,
      description,
      type: "defense",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "caseRequests"), requestData);

    await updateDoc(doc(db, "cases", caseId), {
      defendantClientId: clientId,
      updatedAt: serverTimestamp()
    });

    return {
      ...requestData,
      id: docRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as CaseRequest;
  } catch (error) {
    console.error("Error creating defense request:", error);
    throw error;
  }
};

export const getCaseRequestsByLawyerId = async (
  lawyerId: string
): Promise<CaseRequest[]> => {
  console.log("getCaseRequestsByLawyerId: lawyerId:", lawyerId);
  try {
    const requestQuery = query(
      collection(db, "caseRequests"),
      where("lawyerId", "==", lawyerId)
    );

    const requestsSnapshot = await getDocs(requestQuery);

    const requests = requestsSnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      console.log("getCaseRequestsByLawyerId: Case request data:", data);
      return {
        id: doc.id,
        clientId: data.clientId,
        lawyerId: data.lawyerId,
        caseTitle: data.caseTitle,
        description: data.description,
        status: data.status,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt
            : Timestamp.now(),
        type: "new_case",
      } as CaseRequest;
    });
    return requests;
  } catch (error) {
    console.error("Error getting case requests:", error);
    return [];
  }
};

export const getCaseRequestsByClientId = async (
  clientId: string
): Promise<CaseRequest[]> => {
  console.log("getCaseRequestsByClientId: clientId:", clientId);
  try {
    const requestQuery = query(
      collection(db, "caseRequests"),
      where("clientId", "==", clientId)
    );

    const requestsSnapshot = await getDocs(requestQuery);

    const requests = requestsSnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      console.log("getCaseRequestsByClientId: Case request data:", data);
      return {
        id: doc.id,
        clientId: data.clientId,
        lawyerId: data.lawyerId,
        caseTitle: data.caseTitle,
        caseId: data.caseId,
        description: data.description,
        status: data.status,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt
            : Timestamp.now(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt
            : Timestamp.now(),
        type: data.type || "new_case",
      } as CaseRequest;
    });
    return requests;
  } catch (error) {
    console.error("Error getting case requests:", error);
    return [];
  }
};

export const findCasesAgainstDefendant = async (
  governmentIdType: GovernmentIdType,
  governmentIdNumber: string,
  phoneNumber?: string
): Promise<Case[]> => {
  try {
    const casesSnapshot = await getDocs(collection(db, "cases"));
    
    return casesSnapshot.docs
      .map(doc => {
        const data = doc.data() as DocumentData;
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
          filedDate: data.filedDate instanceof Timestamp ? data.filedDate : undefined,
          nextHearingDate: data.nextHearingDate instanceof Timestamp ? data.nextHearingDate : undefined,
        } as Case;
      })
      .filter(caseItem => {
        if (!caseItem.defendant) return false;
        
        const matchesIdType = caseItem.defendant.governmentIdType === governmentIdType;
        const matchesIdNumber = caseItem.defendant.governmentIdNumber === governmentIdNumber;
        
        if (phoneNumber && phoneNumber.trim()) {
          return matchesIdType && matchesIdNumber && caseItem.defendant.phoneNumber === phoneNumber;
        }
        
        return matchesIdType && matchesIdNumber;
      });
  } catch (error) {
    console.error("Error finding cases against defendant:", error);
    return [];
  }
};

export const claimDefendantCase = async (
  caseId: string,
  clientId: string
): Promise<void> => {
  try {
    const caseRef = doc(db, "cases", caseId);
    
    await updateDoc(caseRef, {
      defendantClientId: clientId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error claiming defendant case:", error);
    throw error;
  }
};

export const updateCaseRequestStatus = async (
  requestId: string,
  status: "accepted" | "rejected"
): Promise<void> => {
  try {
    const requestRef = doc(db, "caseRequests", requestId);
    
    const requestDoc = await getDoc(requestRef);
    const requestData = requestDoc.data();
    
    if (!requestData) {
      throw new Error("Case request document not found");
    }

    await updateDoc(requestRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    if (status === "accepted") {
      if (requestData.type === "new_case") {
        const lawyerRef = doc(db, "users_lawyers", requestData.lawyerId);
        try {
          await updateDoc(lawyerRef, {
            clients: arrayUnion(requestData.clientId),
          });
        } catch (error) {
          console.warn("Could not update lawyer's clients array:", error);
        }
      } else if (requestData.type === "defense" && requestData.caseId) {
        const caseRef = doc(db, "cases", requestData.caseId);
        const caseDoc = await getDoc(caseRef);
        const caseData = caseDoc.data();
        
        if (!caseData) {
          throw new Error("Case not found");
        }
        
        const clientRef = doc(db, "users_clients", requestData.clientId);
        const clientDoc = await getDoc(clientRef);
        const clientData = clientDoc.data();
        
        const lawyerRef = doc(db, "users_lawyers", requestData.lawyerId);
        const lawyerDoc = await getDoc(lawyerRef);
        const lawyerData = lawyerDoc.data();
        
        await updateDoc(caseRef, {
          status: "filed",
          defendantLawyerId: requestData.lawyerId,
          defendantLawyerName: lawyerData?.name || "Defense Lawyer",
          defendantClientId: requestData.clientId,
          defendant: {
            ...(caseData.defendant || {}),
            name: clientData?.name || caseData.defendant?.name || "Defendant",
            phoneNumber: clientData?.phone || caseData.defendant?.phoneNumber || "",
            governmentIdType: caseData.defendant?.governmentIdType || "Passport" as const,
            governmentIdNumber: caseData.defendant?.governmentIdNumber || ""
          },
          updatedAt: serverTimestamp(),
        });
        
        try {
          await updateDoc(lawyerRef, {
            clients: arrayUnion(requestData.clientId),
          });
        } catch (error) {
          console.warn("Could not update lawyer's clients array:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error updating case request:", error);
    throw error;
  }
};

export const getDefenseCasesByClientId = async (clientId: string): Promise<Case[]> => {
  if (!clientId) {
    console.error("getDefenseCasesByClientId called with undefined or null clientId");
    return [];
  }
  
  try {
    const caseQuery = query(
      collection(db, "cases"),
      where("defendantClientId", "==", clientId)
    );
    
    const casesSnapshot = await getDocs(caseQuery);
    
    return casesSnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
        filedDate: data.filedDate instanceof Timestamp ? data.filedDate : undefined,
        nextHearingDate: data.nextHearingDate instanceof Timestamp ? data.nextHearingDate : undefined,
      } as Case;
    });
  } catch (error) {
    console.error("Error getting defense cases by client ID:", error);
    return [];
  }
};

export const getDefenseCasesByLawyerId = async (lawyerId: string): Promise<Case[]> => {
  if (!lawyerId) {
    console.error("getDefenseCasesByLawyerId called with undefined or null lawyerId");
    return [];
  }
  
  try {
    const caseQuery = query(
      collection(db, "cases"),
      where("defendantLawyerId", "==", lawyerId)
    );
    
    const casesSnapshot = await getDocs(caseQuery);
    
    return casesSnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
        filedDate: data.filedDate instanceof Timestamp ? data.filedDate : undefined,
        nextHearingDate: data.nextHearingDate instanceof Timestamp ? data.nextHearingDate : undefined,
      } as Case;
    });
  } catch (error) {
    console.error("Error getting defense cases by lawyer ID:", error);
    return [];
  }
};
