import React, { createContext, useContext, useState, useEffect } from "react";
import { CaseRequest, PartyInfo } from "@/services/types";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import {
  Case,
  Evidence,
  Hearing,
  Message,
  ReschedulingRecord,
  User,
  UserRole,
} from "@/services/types";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";
import { GovernmentIdType } from "@/services/types";

import {
  getAllCases,
  getCaseById,
  getCasesByUserId,
  updateCase,
  createCase,
  createCaseRequest,
  getCaseRequestsByLawyerId,
  getCaseRequestsByClientId,
  updateCaseRequestStatus,
  createDefenseRequest,
  getDefenseCasesByClientId,
  getDefenseCasesByLawyerId,
} from "@/firebase/services/caseService";

import {
  getAllUsers,
  getUserById,
  getUsersByRole,
  updateUser,
  getClientsByLawyerId,
  getLawyersByClientId,
  getAllLawyers,
} from "@/firebase/services/userService";

import {
  getMessagesByCaseId,
  getMessagesBetweenUsers,
  sendMessage,
  getRecentMessagesForUser,
} from "@/firebase/services/messageService";

import {
  getHearingsByCaseId,
  createHearing,
  updateHearing,
  addReschedulingRecord,
  getAllHearings,
} from "@/firebase/services/hearingService";

import {
  getEvidenceByCaseId,
  addEvidence,
  deleteEvidence,
} from "@/firebase/services/evidenceService";

export type FirebaseDataContextType = {
  cases: Case[];
  users: User[];
  messages: Message[];
  hearings: Hearing[];
  evidence: Evidence[];
  caseRequests: CaseRequest[];
  loading: {
    cases: boolean;
    users: boolean;
    messages: boolean;
    hearings: boolean;
    evidence: boolean;
    caseRequests: boolean;
  };
  error: string | null;
  getAllCases: () => Promise<Case[]>;
  getAllHearings: () => Promise<Hearing[]>;
  refreshData: (userId: string) => Promise<void>;
  getCaseById: (id: string) => Case | undefined;
  getUserById: (id: string) => User | undefined;
  getMessagesByCaseId: (caseId: string) => Promise<Message[]>;
  getHearingsByCaseId: (caseId: string) => Promise<Hearing[]>;
  getEvidenceByCaseId: (caseId: string) => Promise<Evidence[]>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  addMessage: (message: Omit<Message, "id" | "createdAt" | "read">) => Promise<void>;
  addHearing: (hearing: Omit<Hearing, "id">) => Promise<void>;
  addEvidence: (caseId: string, title: string, description: string, file: File, uploadedBy: string) => Promise<void>;
  getClientsByLawyerId: (lawyerId: string) => Promise<User[]>;
  getLawyersByClientId: (clientId: string) => Promise<User[]>;
  sendCaseRequest: (requestData: { clientId: string; lawyerId: string; caseTitle: string; description: string }) => Promise<void>;
  getLawyerCaseRequests: (lawyerId: string) => Promise<CaseRequest[]>;
  getClientCaseRequests: (clientId: string) => Promise<CaseRequest[]>;
  acceptCaseRequest: (requestId: string) => Promise<void>;
  rejectCaseRequest: (requestId: string) => Promise<void>;
  addReschedulingHistory: (hearingId: string, record: Omit<ReschedulingRecord, "rescheduledAt">) => Promise<void>;
  getUsersByRole: (role: UserRole) => Promise<User[]>;
  sendMessage: (message: Omit<Message, "id" | "createdAt" | "read">) => Promise<void>;
  getCasesByUser: (userId: string, role?: string) => Case[];
  updateHearing: (hearingId: string, updates: Partial<Hearing>) => Promise<void>;
  createCaseData: (caseData: Omit<Case, "id" | "createdAt" | "updatedAt">) => Promise<Case>;
  getCasesByUserId: (userId: string, role?: string) => Promise<Case[]>;
  getAcceptedLawyers: (clientId: string) => User[];
  getAllLawyers: () => Promise<User[]>;
  findCasesAgainstMe: (governmentIdType: GovernmentIdType, governmentIdNumber: string, phoneNumber?: string) => Promise<Case[]>;
  claimDefendantIdentity: (caseId: string, clientId: string) => Promise<void>;
  sendDefenseCaseRequest: (caseId: string, clientId: string, lawyerId: string, description: string) => Promise<void>;
  getDefenseCasesByClientId: (clientId: string) => Promise<Case[]>;
  getDefenseCasesByLawyerId: (lawyerId: string) => Promise<Case[]>;
};

export const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

const FirebaseDataProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser, userData, isInitialized } = useFirebaseAuth();
  const { toast } = useToast();

  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [caseRequests, setCaseRequests] = useState<CaseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    cases: true,
    users: true,
    messages: true,
    hearings: true,
    evidence: true,
    caseRequests: true,
  });

  const getCaseByIdHelper = (id: string) => cases.find((c) => c.id === id);
  const getUserByIdHelper = (id: string) => users.find((u) => u.id === id);
  
  const getMessagesByCaseIdHelper = async (caseId: string) => {
    return await getMessagesByCaseId(caseId);
  };

  const getHearingsByCaseIdHelper = async (caseId: string) => {
    return await getHearingsByCaseId(caseId);
  };

  const getEvidenceByCaseIdHelper = async (caseId: string) => {
    return await getEvidenceByCaseId(caseId);
  };

  const updateCaseHelper = async (id: string, updates: Partial<Case>) => {
    await updateCase(id, updates);
    const updatedCases = cases.map(c => c.id === id ? { ...c, ...updates } : c);
    setCases(updatedCases);
  };

  const updateUserHelper = async (id: string, updates: Partial<User>) => {
    const updatedUser = await updateUser(id, userData?.role || 'client', updates);
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
  };

  const addMessageHelper = async (messageData: Omit<Message, "id" | "createdAt" | "read">) => {
    await sendMessage(messageData);
  };

  const addHearingHelper = async (hearingData: Omit<Hearing, "id">) => {
    await createHearing(hearingData);
  };

  const addEvidenceHelper = async (
    caseId: string,
    title: string,
    description: string,
    file: File,
    uploadedBy: string
  ) => {
    await addEvidence(caseId, title, description, file, uploadedBy);
  };

  const getClientsByLawyerIdHelper = async (lawyerId: string) => {
    return await getClientsByLawyerId(lawyerId);
  };

  const getLawyersByClientIdHelper = async (clientId: string) => {
    return await getLawyersByClientId(clientId);
  };

  const sendCaseRequestHelper = async (requestData: {
    clientId: string;
    lawyerId: string;
    caseTitle: string;
    description: string;
  }) => {
    await createCaseRequest({
      ...requestData,
      type: "new_case",
    });
  };

  const getLawyerCaseRequestsHelper = async (lawyerId: string) => {
    return await getCaseRequestsByLawyerId(lawyerId);
  };

  const acceptCaseRequestHelper = async (requestId: string) => {
    await updateCaseRequestStatus(requestId, "accepted");
  };

  useEffect(() => {
    if (isInitialized && currentUser?.uid) {
      refreshData(currentUser.uid);
    }
  }, [currentUser, isInitialized]);

  const refreshData = async (userId: string) => {
    if (!userId) return;

    try {
      setLoading(prev => ({ ...prev, cases: true }));
      const casesData = await getAllCases();
      setCases(casesData);
      setLoading(prev => ({ ...prev, cases: false }));

      setLoading(prev => ({ ...prev, users: true }));
      const usersData = await getAllUsers();
      setUsers(usersData);
      setLoading(prev => ({ ...prev, users: false }));

      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const handleGetAllCases = async () => {
    try {
      const casesData = await getAllCases();
      return casesData;
    } catch (error) {
      console.error("Error fetching all cases:", error);
      throw error;
    }
  };

  const handleGetAllHearings = async () => {
    try {
      const hearingsData = await getAllHearings();
      setHearings(hearingsData);
      return hearingsData;
    } catch (error) {
      console.error("Error fetching all hearings:", error);
      throw error;
    }
  };

  const value: FirebaseDataContextType = {
    cases,
    users,
    messages,
    hearings,
    evidence,
    caseRequests,
    loading,
    error,
    getAllCases: handleGetAllCases,
    getAllHearings: handleGetAllHearings,
    refreshData,
    getCaseById: getCaseByIdHelper,
    getUserById: getUserByIdHelper,
    getMessagesByCaseId,
    getHearingsByCaseId,
    getEvidenceByCaseId,
    updateCase: async (id: string, updates: Partial<Case>) => {
      await updateCase(id, updates);
      const updatedCases = cases.map(c => c.id === id ? { ...c, ...updates } : c);
      setCases(updatedCases);
    },
    updateUser: async (id: string, updates: Partial<User>) => {
      const updatedUser = await updateUser(id, userData?.role || 'client', updates);
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
    },
    addMessage: async (message: Omit<Message, "id" | "createdAt" | "read">) => {
      await sendMessage(message);
    },
    addHearing: async (hearing: Omit<Hearing, "id">) => {
      await createHearing(hearing);
    },
    addEvidence: async (caseId: string, title: string, description: string, file: File, uploadedBy: string) => {
      await addEvidence(caseId, title, description, file, uploadedBy);
    },
    getClientsByLawyerId,
    getLawyersByClientId,
    sendCaseRequest: async (requestData: {
      clientId: string;
      lawyerId: string;
      caseTitle: string;
      description: string;
    }) => {
      await createCaseRequest({
        ...requestData,
        type: "new_case",
      });
    },
    getLawyerCaseRequests: getCaseRequestsByLawyerId,
    acceptCaseRequest: async (requestId: string) => {
      await updateCaseRequestStatus(requestId, "accepted");
    },
    rejectCaseRequest: async (requestId: string) => {
      await updateCaseRequestStatus(requestId, "rejected");
    },
    addReschedulingHistory: async (hearingId: string, record: Omit<ReschedulingRecord, "rescheduledAt">) => {
      await addReschedulingRecord(hearingId, record);
    },
    getUsersByRole,
    sendMessage: async (message: Omit<Message, "id" | "createdAt" | "read">) => {
      await sendMessage(message);
    },
    getCasesByUser: (userId: string, role?: string) => {
      return cases.filter((c) => 
        c.clientId === userId || 
        c.lawyerId === userId || 
        c.defendantClientId === userId || 
        c.defendantLawyerId === userId
      );
    },
    updateHearing: async (hearingId: string, updates: Partial<Hearing>) => {
      await updateHearing(hearingId, updates);
    },
    createCaseData: createCase,
    getCasesByUserId,
    getAcceptedLawyers: (clientId: string) => {
      return users.filter((u) => u.role === "lawyer");
    },
    getAllLawyers: async () => {
      return await getAllLawyers();
    },
    findCasesAgainstMe: async (
      governmentIdType: GovernmentIdType,
      governmentIdNumber: string,
      phoneNumber?: string
    ) => {
      try {
        const allCases = await getAllCases();
        return allCases.filter((c) => {
          const defendant = c.defendant as PartyInfo;
          return defendant &&
            defendant.governmentIdType === governmentIdType &&
            defendant.governmentIdNumber === governmentIdNumber;
        });
      } catch (error) {
        console.error("Error finding cases:", error);
        return [];
      }
    },
    claimDefendantIdentity: async (caseId: string, clientId: string) => {
      const currentCase = await getCaseById(caseId);
      if (!currentCase) return;
      
      await updateCase(caseId, { 
        defendant: {
          name: currentCase.defendant?.name || "Defendant",
          phoneNumber: currentCase.defendant?.phoneNumber || "",
          governmentIdType: currentCase.defendant?.governmentIdType || "Passport" as const,
          governmentIdNumber: currentCase.defendant?.governmentIdNumber || ""
        },
        defendantClientId: clientId,
        status: "active"
      });
    },
    sendDefenseCaseRequest: async (
      caseId: string,
      clientId: string,
      lawyerId: string,
      description: string
    ) => {
      await createDefenseRequest(clientId, lawyerId, caseId, description);
    },
    getClientCaseRequests: getCaseRequestsByClientId,
    getDefenseCasesByClientId,
    getDefenseCasesByLawyerId,
  };

  return (
    <FirebaseDataContext.Provider value={value}>
      {children}
    </FirebaseDataContext.Provider>
  );
};

export default FirebaseDataProviderComponent;
export const useFirebaseData = () => {
  const context = useContext(FirebaseDataContext);
  if (context === undefined) {
    throw new Error("useFirebaseData must be used within a FirebaseDataProvider");
  }
  return context;
};
