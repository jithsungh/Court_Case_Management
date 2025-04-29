import React, { createContext, useContext, useState, useEffect } from "react";
import { useFirebaseAuth } from "./FirebaseAuthContext";
import {
  Case,
  CaseStatus,
  Evidence,
  Hearing,
  Message,
  ReschedulingRecord,
  User,
  PartyInfo,
  LawyerInfo,
  JudgeInfo, // Import helper types
} from "@/services/types";

// Import sample data
// Firebase imports
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  getDocs, // Keep getDocs for initial load or specific queries if needed
  getDoc, // Added for fetching single documents like case requests
} from "firebase/firestore";
import { db } from "@/firebase/config";

// Remove sample data imports (already done)

// Remove empty data imports
// import emptyUsers from '@/data/empty_users.json';
// import emptyCases from '@/data/empty_cases.json';

// Define the context type
export type DataContextType = {
  cases: Case[];
  users: User[];
  messages: Message[];
  hearings: Hearing[];
  evidence: Evidence[];
  getCaseById: (id: string) => Case | undefined;
  getUserById: (id: string) => User | undefined;
  getMessagesByCaseId: (caseId: string) => Message[];
  getHearingsByCaseId: (caseId: string) => Hearing[];
  getEvidenceByCaseId: (caseId: string) => Evidence[];
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  addMessage: (message: Message) => Promise<void>; // Or Promise<Message> if returning the created message
  addHearing: (hearing: Hearing) => Promise<void>; // Or Promise<Hearing>
  addEvidence: (evidence: Evidence) => Promise<void>; // Or Promise<Evidence>
  getClientsByLawyerId: (lawyerId: string) => User[];
  getLawyersByClientId: (clientId: string) => User[];
  sendCaseRequest: (
    clientId: string,
    lawyerId: string,
    caseTitle: string,
    description: string
  ) => Promise<void>; // Or Promise<CaseRequest>
  getLawyerCaseRequests: (lawyerId: string) => any[]; // This might remain sync if data is already in state
  acceptCaseRequest: (requestId: string) => Promise<void>; // Involves creating a case
  rejectCaseRequest: (requestId: string) => Promise<void>; // Involves updating request status
  addReschedulingHistory: (
    hearingId: string,
    record: ReschedulingRecord
  ) => Promise<void>; // Involves updating hearing
  getUsersByRole: (role: string) => User[];
  sendMessage: (message: Partial<Message>) => Promise<void>; // Or Promise<Message>
  getCasesByUser: (userId: string, role: string) => Case[]; // This might remain sync
  updateHearing: (
    hearingId: string,
    updates: Partial<Hearing>
  ) => Promise<void>;
  createCase: (caseData: Partial<Case>) => Promise<Case>; // Returns a Promise now
  getCasesByUserId: (userId: string) => Case[];
  getAcceptedLawyers: (clientId: string) => User[];
  getAllLawyers: () => User[];
  // Remove dummy data related types
};

// Create the context
export const DataContext = createContext<DataContextType | undefined>(
  undefined
);

// Helper to flatten chat data to Message array
const flattenChatData = (chatData: any[]): Message[] => {
  const messages: Message[] = [];

  chatData.forEach((chat) => {
    chat.messages.forEach((msg: any) => {
      // Extract user roles based on the chat type
      let senderRole: "client" | "lawyer" | "clerk" | "judge" = "client";
      let recipientRole: "client" | "lawyer" | "clerk" | "judge" = "lawyer";

      // Determine sender and recipient roles based on IDs
      if (msg.senderId.startsWith("lawyer")) {
        senderRole = "lawyer";
        recipientRole = chat.user1 === msg.senderId ? "client" : "clerk";
      } else if (msg.senderId.startsWith("clerk")) {
        senderRole = "clerk";
        recipientRole = chat.user1 === msg.senderId ? "lawyer" : "judge";
      } else if (msg.senderId.startsWith("judge")) {
        senderRole = "judge";
        recipientRole = "clerk";
      } else if (msg.senderId.startsWith("client")) {
        senderRole = "client";
        recipientRole = "lawyer";
      }

      // Find the recipientId
      const recipientId = msg.senderId === chat.user1 ? chat.user2 : chat.user1;

      messages.push({
        id: msg.id,
        senderId: msg.senderId,
        senderRole,
        recipientId,
        recipientRole,
        caseId: msg.caseId || undefined,
        content: msg.content,
        read: msg.read,
        createdAt: msg.timestamp,
      });
    });
  });

  return messages;
};

// Create the provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    user: currentUser,
    userData: authUserData,
    loading: authLoading,
  } = useFirebaseAuth(); // Get userData and loading state
  // Remove useEmptyData state
  // const [useEmptyData, setUseEmptyData] = useState(() => {
  //   // Check localStorage for preference
  //   const storedPreference = localStorage.getItem('courtwise_use_empty_data');
  //   return storedPreference === 'true';
  // });

  // Remove testUsers array

  // Initialize state with empty arrays
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [caseRequests, setCaseRequests] = useState<any[]>([]); // Consider defining a CaseRequest type

  // useEffect to fetch data from Firebase using real-time listeners
  useEffect(() => {
    if (!currentUser || !authUserData) {
      // Clear data if user logs out or data is not available
      setCases([]);
      setUsers([]);
      setMessages([]);
      setHearings([]);
      setEvidence([]);
      setCaseRequests([]);
      return;
    }

    const userRole = authUserData.role;
    const userId = currentUser.uid;

    // --- Cases Listener ---
    // Adjust query based on role
    let casesQuery;
    if (userRole === "client") {
      casesQuery = query(
        collection(db, "Cases"),
        where("clientId", "==", userId)
      );
    } else if (userRole === "lawyer") {
      casesQuery = query(
        collection(db, "Cases"),
        where("lawyerId", "==", userId)
      );
    } else if (userRole === "judge") {
      casesQuery = query(
        collection(db, "Cases"),
        where("judge.judgeId", "==", userId)
      );
    } else {
      // Clerk might see all cases or based on courtId - adjust as needed
      casesQuery = query(collection(db, "Cases"));
    }

    const unsubscribeCases = onSnapshot(
      casesQuery,
      (snapshot) => {
        const casesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Case)
        );
        setCases(casesData);
      },
      (error) => {
        console.error("Error fetching cases:", error);
        // Handle error appropriately (e.g., show toast)
      }
    );

    // --- Users Listener (Fetch all for now, might need optimization) ---
    // Consider fetching only relevant users based on context later
    const unsubscribeUsers = onSnapshot(
      collection(db, "Users"),
      (snapshot) => {
        // Assuming 'Users' collection holds all user types
        const usersData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as User)
        );
        setUsers(usersData);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );

    // --- Messages Listener (Example: messages involving the current user) ---
    // This query might need refinement based on how messages are structured (e.g., separate collections per chat)
    const messagesQuery = query(
      collection(db, "Chats"),
      where("participants", "array-contains", userId)
    ); // Assuming 'participants' array field

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Message)
        ); // Adjust type if needed
        setMessages(messagesData);
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    // --- Hearings Listener (Example: hearings for user's cases) ---
    // This requires knowing the case IDs the user is involved in. Fetch cases first.
    // For simplicity, fetching all for now. Refine based on user role.
    const hearingsQuery = query(collection(db, "Hearings")); // Adjust query based on role/case involvement
    const unsubscribeHearings = onSnapshot(
      hearingsQuery,
      (snapshot) => {
        const hearingsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Hearing)
        );
        setHearings(hearingsData);
      },
      (error) => {
        console.error("Error fetching hearings:", error);
      }
    );

    // --- Evidence Listener (Example: evidence for user's cases) ---
    // Similar to hearings, fetch all for now. Refine based on role/case involvement.
    const evidenceQuery = query(collection(db, "Evidence")); // Adjust query based on role/case involvement
    const unsubscribeEvidence = onSnapshot(
      evidenceQuery,
      (snapshot) => {
        const evidenceData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Evidence)
        );
        setEvidence(evidenceData);
      },
      (error) => {
        console.error("Error fetching evidence:", error);
      }
    );

    // --- Case Requests Listener ---
    let requestsQuery;
    if (userRole === "client") {
      requestsQuery = query(
        collection(db, "CaseRequests"),
        where("clientId", "==", userId)
      );
    } else if (userRole === "lawyer") {
      requestsQuery = query(
        collection(db, "CaseRequests"),
        where("lawyerId", "==", userId)
      );
    } else {
      // Judges/Clerks might not see requests directly, or see all pending? Adjust as needed.
      requestsQuery = query(
        collection(db, "CaseRequests"),
        where("status", "==", "pending")
      ); // Example: Clerk/Judge see pending
    }

    const unsubscribeRequests = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })); // Define type if available
        setCaseRequests(requestsData);
      },
      (error) => {
        console.error("Error fetching case requests:", error);
      }
    );

    // Cleanup function
    return () => {
      unsubscribeCases();
      unsubscribeUsers();
      unsubscribeMessages();
      unsubscribeHearings();
      unsubscribeEvidence();
      unsubscribeRequests();
    };
  }, [currentUser, authUserData]); // Re-run when user or user data changes

  // Remove resetData function related to dummy data

  // Remove previous useEffect for filtering (now handled by Firestore queries)

  // Helper functions
  const getCaseById = (id: string) => cases.find((c) => c.id === id);

  const getUserById = (id: string) => users.find((u) => u.id === id);

  const getMessagesByCaseId = (caseId: string) =>
    messages.filter((m) => m.caseId === caseId);

  const getHearingsByCaseId = (caseId: string) =>
    hearings.filter((h) => h.caseId === caseId);

  const getEvidenceByCaseId = (caseId: string) =>
    evidence.filter((e) => e.caseId === caseId);

  const updateCase = async (id: string, updates: Partial<Case>) => {
    const caseRef = doc(db, "Cases", id); // Use "Cases" collection name
    try {
      await updateDoc(caseRef, {
        ...updates,
        updatedAt: Timestamp.now(), // Automatically update the timestamp
      });
      // Local state updates are now handled by the onSnapshot listener,
      // so no need to call setCases here.
      console.log("Case updated successfully in Firestore:", id);
    } catch (error) {
      console.error("Error updating case in Firestore:", id, error);
      // Consider adding user feedback, e.g., using toast notifications
      // toast({ title: "Error", description: "Failed to update case.", variant: "destructive" });
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    // Note: Updating user data might require knowing the user's role
    // to target the correct collection if users are stored separately (e.g., "Clients", "Lawyers").
    // Assuming a single "Users" collection for now, where 'id' is the Firestore document ID (usually the auth UID).
    const userRef = doc(db, "Users", id); // Adjust collection name if needed
    try {
      await updateDoc(userRef, updates);
      // Local state updates handled by onSnapshot listener for "Users"
      console.log("User updated successfully in Firestore:", id);
    } catch (error) {
      console.error("Error updating user in Firestore:", id, error);
      // Add user feedback (toast)
    }
  };

  const addMessage = async (message: Omit<Message, "id" | "createdAt">) => {
    // Expect message data without id/timestamp
    try {
      const messageData = {
        ...message,
        createdAt: Timestamp.now(), // Add server timestamp
      };
      // Assuming messages are stored in the 'Chats' collection
      const docRef = await addDoc(collection(db, "Chats"), messageData);
      console.log("Message added successfully with ID:", docRef.id);
      // Local state update handled by onSnapshot
      // We might return the ID or the full message object if needed elsewhere
      // return { id: docRef.id, ...messageData };
    } catch (error) {
      console.error("Error adding message:", error);
      // Add user feedback (toast)
    }
  };

  const addHearing = async (
    hearing: Omit<Hearing, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const hearingData = {
        ...hearing,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "Hearings"), hearingData); // Use "Hearings" collection
      console.log("Hearing added successfully with ID:", docRef.id);
      // Local state update handled by onSnapshot
    } catch (error) {
      console.error("Error adding hearing:", error);
      // Add user feedback (toast)
    }
  };

  const addEvidence = async (evidence: Omit<Evidence, "id" | "uploadedAt">) => {
    try {
      const evidenceData = {
        ...evidence,
        uploadedAt: Timestamp.now(), // Add server timestamp
      };
      const docRef = await addDoc(collection(db, "Evidence"), evidenceData); // Use "Evidence" collection
      console.log("Evidence added successfully with ID:", docRef.id);
      // Local state update handled by onSnapshot
    } catch (error) {
      console.error("Error adding evidence:", error);
      // Add user feedback (toast)
    }
  };

  const getClientsByLawyerId = (lawyerId: string) => {
    // Get all cases where this lawyer is assigned
    const lawyerCases = cases.filter((c) => c.lawyerId === lawyerId);

    // Get unique client IDs from these cases
    const clientIds = [...new Set(lawyerCases.map((c) => c.clientId))];

    // Return client users
    return users.filter((u) => clientIds.includes(u.id) && u.role === "client");
  };

  const getLawyersByClientId = (clientId: string) => {
    // Get all cases for this client
    const clientCases = cases.filter((c) => c.clientId === clientId);

    // Get unique lawyer IDs from these cases
    const lawyerIds = [
      ...new Set(
        clientCases.map((c) => c.lawyerId).filter(Boolean) as string[]
      ),
    ];

    // Return lawyer users
    return users.filter((u) => lawyerIds.includes(u.id) && u.role === "lawyer");
  };

  // Case request system
  const sendCaseRequest = async (
    clientId: string,
    lawyerId: string,
    caseTitle: string,
    description: string
  ) => {
    try {
      const requestData = {
        clientId,
        lawyerId,
        caseTitle,
        description,
        status: "pending",
        createdAt: Timestamp.now(), // Use server timestamp
      };
      const docRef = await addDoc(collection(db, "CaseRequests"), requestData); // Use "CaseRequests" collection
      console.log("Case request sent successfully with ID:", docRef.id);
      // Local state update handled by onSnapshot
    } catch (error) {
      console.error("Error sending case request:", error);
      // Add user feedback (toast)
    }
  };

  const getLawyerCaseRequests = (lawyerId: string) => {
    return caseRequests.filter((req) => req.lawyerId === lawyerId);
  };

  const acceptCaseRequest = async (requestId: string) => {
    const requestRef = doc(db, "CaseRequests", requestId);
    try {
      await updateDoc(requestRef, { status: "accepted" });
      console.log("Case request accepted:", requestId);

      // // 2. Create a new case document
      // const newCaseData: Omit<Case, "id"> = {
      //   // Define structure based on Case type, excluding id
      //   title: requestData.caseTitle,
      //   description: requestData.description,
      //   caseNumber: `C-${Math.floor(10000 + Math.random() * 90000)}`, // Or generate differently
      //   status: "active", // Use a valid CaseStatus enum member
      //   clientId: requestData.clientId,
      //   lawyerId: requestData.lawyerId,
      //   // Add other necessary fields from your Case type, potentially with defaults
      //   // Initialize with empty structures matching the types
      //   plaintiff: {
      //     name: "",
      //     governmentIdType: "Aadhar",
      //     governmentIdNumber: "",
      //     phoneNumber: "",
      //   },
      //   defendant: {
      //     name: "",
      //     governmentIdType: "Aadhar",
      //     governmentIdNumber: "",
      //     phoneNumber: "",
      //   },
      //   plaintifflawyer: { name: "", barId: "" },
      //   defendantlawyer: { name: "", barId: "" },
      //   judge: { judgeId: "", judgeName: "" }, // Judge might be assigned later
      //   createdAt: Timestamp.now(),
      //   updatedAt: Timestamp.now(),
      //   filedDate: Timestamp.now(), // Or specific date
      //   // Initialize arrays/other fields as needed
      //   plaintiffEvidences: [],
      //   defendantEvidences: [],
      //   witnesses: [],
      //   hearings: [],
      // };
      // const caseDocRef = await addDoc(collection(db, "Cases"), newCaseData);
      // console.log("New case created from request with ID:", caseDocRef.id);

      // Local state updates handled by onSnapshot listeners for both collections
    } catch (error) {
      console.error("Error accepting case request:", requestId, error);
      // Add user feedback (toast)
    }
  };

  const rejectCaseRequest = async (requestId: string) => {
    const requestRef = doc(db, "CaseRequests", requestId);
    try {
      await updateDoc(requestRef, { status: "rejected" });
      console.log("Case request rejected:", requestId);
      // Local state update handled by onSnapshot
    } catch (error) {
      console.error("Error rejecting case request:", requestId, error);
      // Add user feedback (toast)
    }
  };

  // Add the addReschedulingHistory method
  const addReschedulingHistory = async (
    hearingId: string,
    record: ReschedulingRecord
  ) => {
    const hearingRef = doc(db, "Hearings", hearingId);
    try {
      // Fetch current history to append (or use FieldValue.arrayUnion if structure allows)
      const hearingSnap = await getDoc(hearingRef);
      if (!hearingSnap.exists()) {
        console.error("Hearing not found for rescheduling:", hearingId);
        return;
      }
      const currentHistory = hearingSnap.data().reschedulingHistory || [];

      await updateDoc(hearingRef, {
        rescheduled: true,
        reschedulingHistory: [...currentHistory, record],
        updatedAt: Timestamp.now(), // Update timestamp
      });
      console.log("Rescheduling history added to hearing:", hearingId);
      // Local state update handled by onSnapshot
    } catch (error) {
      console.error("Error adding rescheduling history:", hearingId, error);
      // Add user feedback (toast)
    }
  };

  // Add missing functions implementation
  const getUsersByRole = (role: string) => {
    return users.filter((u) => u.role === role);
  };

  const sendMessage = async (messageData: Partial<Message>) => {
    // This seems redundant with addMessage. Let's consolidate or clarify purpose.
    // Assuming this is intended to be the primary way to send messages:
    if (
      !messageData.senderId ||
      !messageData.recipientId ||
      !messageData.content
    ) {
      console.error("sendMessage requires senderId, recipientId, and content.");
      return; // Or throw error/show toast
    }
    try {
      const fullMessageData = {
        senderId: messageData.senderId,
        senderRole: messageData.senderRole || "client", // Default role if not provided
        recipientId: messageData.recipientId,
        recipientRole: messageData.recipientRole || "lawyer", // Default role
        caseId: messageData.caseId || null, // Ensure caseId is null if undefined
        content: messageData.content,
        read: false,
        createdAt: Timestamp.now(),
      };
      // Use the 'Chats' collection as established in addMessage
      const docRef = await addDoc(collection(db, "Chats"), fullMessageData);
      console.log(
        "Message sent (via sendMessage) successfully with ID:",
        docRef.id
      );
      // Local state update handled by onSnapshot
    } catch (error) {
      console.error("Error sending message (via sendMessage):", error);
      // Add user feedback (toast)
    }
  };

  const getCasesByUser = (userId: string, role: string) => {
    if (role === "lawyer") {
      return cases.filter((c) => c.lawyerId === userId);
    } else if (role === "client") {
      return cases.filter((c) => c.clientId === userId);
    } else if (role === "judge") {
      // Assume judgeName field contains judge ID
      return cases.filter((c) => c.judge.judgeId === userId); // Access nested judgeId
    }
    return [];
  };

  const updateHearing = async (
    hearingId: string,
    updates: Partial<Hearing>
  ) => {
    const hearingRef = doc(db, "Hearings", hearingId);
    try {
      await updateDoc(hearingRef, {
        ...updates,
        updatedAt: Timestamp.now(), // Update timestamp
      });
      console.log("Hearing updated successfully:", hearingId);
      // Local state update handled by onSnapshot
    } catch (error) {
      console.error("Error updating hearing:", hearingId, error);
      // Add user feedback (toast)
    }
  };

  const createCase = async (
    caseData: Partial<Omit<Case, "id" | "createdAt" | "updatedAt">>
  ): Promise<Case | null> => {
    // Helper function to create empty PartyInfo
    // Helper functions moved outside or types imported directly
    const createEmptyPartyInfo = (): PartyInfo => ({
      name: "",
      governmentIdType: "Aadhar",
      governmentIdNumber: "",
      phoneNumber: "",
    });
    const createEmptyLawyerInfo = (): LawyerInfo => ({ name: "", barId: "" });

    // Ensure required fields for creation are present or provide defaults
    const fullCaseData = {
      caseNumber:
        caseData.caseNumber || `C-${Math.floor(10000 + Math.random() * 90000)}`,
      title: caseData.title || "Untitled Case",
      description: caseData.description || "",
      plaintiff: caseData.plaintiff || createEmptyPartyInfo(),
      defendant: caseData.defendant || createEmptyPartyInfo(),
      plaintifflawyer: caseData.plaintifflawyer || createEmptyLawyerInfo(),
      defendantlawyer: caseData.defendantlawyer || createEmptyLawyerInfo(),
      judge: caseData.judge || { judgeId: "", judgeName: "" },
      status: caseData.status || "pending", // Ensure this is a valid CaseStatus
      clientId: caseData.clientId || "", // Client ID is crucial
      createdAt: Timestamp.now(), // Use Firestore Timestamp
      updatedAt: Timestamp.now(), // Use Firestore Timestamp
      plaintiffEvidences: caseData.plaintiffEvidences || [],
      defendantEvidences: caseData.defendantEvidences || [],
      witnesses: caseData.witnesses || [],
      hearings: caseData.hearings || [],
      filedDate: caseData.filedDate || Timestamp.now(), // Default filedDate
      ...caseData, // Spread remaining optional fields like lawyerId, nextHearingDate etc.
    };

    // Validate required fields before adding
    if (!fullCaseData.clientId) {
      console.error("Cannot create case without a clientId.");
      return null; // Or throw an error
    }

    try {
      const docRef = await addDoc(collection(db, "Cases"), fullCaseData);
      console.log("Case created successfully with ID:", docRef.id);
      // Return the newly created case object including the ID
      // Note: The listener will update the state, but returning the object might be useful
      return { id: docRef.id, ...fullCaseData };
    } catch (error) {
      console.error("Error creating case:", error);
      // Add user feedback (toast)
      return null; // Return null on error
    }
  };

  // Add new functions needed based on errors
  const getCasesByUserId = (userId: string) => {
    return cases.filter(
      (c) =>
        c.clientId === userId ||
        c.lawyerId === userId ||
        c.judge.judgeId === userId || // Access nested judgeId
        (c.defendant && c.defendant.name === userId) // Access nested defendant name
    );
  };

  const getAcceptedLawyers = (clientId: string) => {
    // Get all cases for this client
    const clientCases = cases.filter((c) => c.clientId === clientId);

    // Get unique lawyer IDs from these cases
    const lawyerIds = [
      ...new Set(
        clientCases.map((c) => c.lawyerId).filter(Boolean) as string[]
      ),
    ];

    // Return lawyer users
    return users.filter((u) => lawyerIds.includes(u.id) && u.role === "lawyer");
  };

  const getAllLawyers = (): User[] => {
    try {
      return getUsersByRole("lawyer");
    } catch (error) {
      console.error("Error getting all lawyers:", error);
      return [];
    }
  };

  return (
    <DataContext.Provider
      value={{
        cases,
        users,
        messages,
        hearings,
        evidence,
        getCaseById,
        getUserById,
        getMessagesByCaseId,
        getHearingsByCaseId,
        getEvidenceByCaseId,
        updateCase,
        updateUser,
        addMessage,
        addHearing,
        addEvidence,
        getClientsByLawyerId,
        getLawyersByClientId,
        sendCaseRequest,
        getLawyerCaseRequests,
        acceptCaseRequest,
        rejectCaseRequest,
        addReschedulingHistory,
        getUsersByRole,
        sendMessage,
        getCasesByUser,
        updateHearing,
        createCase,
        getCasesByUserId,
        getAcceptedLawyers,
        getAllLawyers,
        // Dummy data props (resetData, useEmptyData, setUseEmptyData) are removed
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Create a hook to use the context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
