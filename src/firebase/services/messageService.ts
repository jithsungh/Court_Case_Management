import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp, 
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
  or,
  onSnapshot
} from "firebase/firestore";
import { db } from "../config";
import { Message, UserRole } from "@/services/types";
import { getUserCollectionName } from "./authService";

// Get messages by case ID
export const getMessagesByCaseId = async (
  caseId: string
): Promise<Message[]> => {
  try {
    if (!caseId) {
      console.error("getMessagesByCaseId: No caseId provided");
      return [];
    }
    
    console.log(`getMessagesByCaseId: Fetching messages for case ${caseId}`);
    
    const messagesQuery = query(
      collection(db, "messages"),
      where("caseId", "==", caseId),
      orderBy("createdAt", "desc")
    );

    const messagesSnapshot = await getDocs(messagesQuery);

    return messagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt, // Keep as Timestamp
      } as Message;
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    return [];
  }
};

// Get messages between two users
export const getMessagesBetweenUsers = async (
  userId1: string,
  role1: UserRole,
  userId2: string,
  role2: UserRole
): Promise<Message[]> => {
  try {
    if (!userId1 || !userId2) {
      console.error("getMessagesBetweenUsers: Missing user IDs");
      return [];
    }
    
    console.log(`getMessagesBetweenUsers: Fetching messages between ${userId1} (${role1}) and ${userId2} (${role2})`);
    
    // Create query for messages where user1 is sender and user2 is recipient
    const messagesQuery1 = query(
      collection(db, "messages"),
      where("senderId", "==", userId1),
      where("recipientId", "==", userId2)
    );
    
    // Create query for messages where user2 is sender and user1 is recipient
    const messagesQuery2 = query(
      collection(db, "messages"),
      where("senderId", "==", userId2),
      where("recipientId", "==", userId1)
    );

    // Execute both queries in parallel
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(messagesQuery1),
      getDocs(messagesQuery2)
    ]);

    // Process results from both queries
    const messages1 = snapshot1.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt // Keep as Timestamp
    })) as Message[];
    
    const messages2 = snapshot2.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt // Keep as Timestamp
    })) as Message[];

    // Combine and sort the messages
    const allMessages = [...messages1, ...messages2];
    
    console.log(`Found ${allMessages.length} messages between users`);
    return allMessages;
  } catch (error) {
    console.error("Error getting messages between users:", error);
    return [];
  }
};

// Set up real-time message listener between two users
export const subscribeToMessagesBetweenUsers = (
  userId1: string,
  role1: UserRole,
  userId2: string,
  role2: UserRole,
  callback: (messages: Message[]) => void
) => {
  if (!userId1 || !userId2) {
    console.error("subscribeToMessagesBetweenUsers: Missing user IDs");
    return () => {};
  }
  
  console.log(`subscribeToMessagesBetweenUsers: Setting up listener between ${userId1} (${role1}) and ${userId2} (${role2})`);
  
  // Create query for messages where user1 is sender and user2 is recipient
  const messagesQuery1 = query(
    collection(db, "messages"),
    where("senderId", "==", userId1),
    where("recipientId", "==", userId2)
  );
  
  // Create query for messages where user2 is sender and user1 is recipient
  const messagesQuery2 = query(
    collection(db, "messages"),
    where("senderId", "==", userId2),
    where("recipientId", "==", userId1)
  );
  
  // Set up listener for first query (user1 → user2)
  const unsubscribe1 = onSnapshot(messagesQuery1, (snapshot1) => {
    getDocs(messagesQuery2).then(snapshot2 => {
      const messages1 = snapshot1.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt // Keep as Timestamp
      })) as Message[];
      
      const messages2 = snapshot2.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt // Keep as Timestamp
      })) as Message[];
      
      const allMessages = [...messages1, ...messages2];
      
      console.log(`Found ${allMessages.length} messages between users (subscription update)`);
      callback(allMessages);
    });
  });
  
  // Set up listener for second query (user2 → user1)
  const unsubscribe2 = onSnapshot(messagesQuery2, (snapshot2) => {
    getDocs(messagesQuery1).then(snapshot1 => {
      const messages1 = snapshot1.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt // Keep as Timestamp
      })) as Message[];
      
      const messages2 = snapshot2.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt // Keep as Timestamp
      })) as Message[];
      
      const allMessages = [...messages1, ...messages2];
      
      console.log(`Found ${allMessages.length} messages between users (subscription update)`);
      callback(allMessages);
    });
  });
  
  // Return a function to unsubscribe both listeners
  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};

// Send a new message and update the lawyer's clients array if needed
export const sendMessage = async (
  messageData: Omit<Message, "id" | "createdAt" | "read">
): Promise<Message> => {
  try {
    if (!messageData.senderId) {
      throw new Error("sendMessage: Missing senderId");
    }
    if (!messageData.recipientId) {
      throw new Error("sendMessage: Missing recipientId");
    }
    if (!messageData.content) {
      throw new Error("sendMessage: Message must have content");
    }

    const newMessage = {
      ...messageData,
      caseId: messageData.caseId || null,
      read: false,
      createdAt: serverTimestamp(),
    };

    console.log(`sendMessage: Sending message from ${newMessage.senderId} to ${newMessage.recipientId}`, newMessage);
    
    const docRef = await addDoc(collection(db, "messages"), newMessage);
    console.log(`sendMessage: Message sent with ID ${docRef.id}`);

    if (messageData.senderRole === 'lawyer' && messageData.recipientRole === 'client') {
      await updateLawyerClientsArray(messageData.senderId, messageData.recipientId);
    } else if (messageData.senderRole === 'client' && messageData.recipientRole === 'lawyer') {
      await updateLawyerClientsArray(messageData.recipientId, messageData.senderId);
    }

    return {
      ...messageData,
      id: docRef.id,
      read: false,
      caseId: messageData.caseId || null,
      createdAt: Timestamp.now(),
    } as Message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// New function to update the lawyer's clients array
export const updateLawyerClientsArray = async (
  lawyerId: string,
  clientId: string
): Promise<boolean> => {
  try {
    if (!lawyerId || !clientId) {
      console.error("updateLawyerClientsArray: Missing lawyer or client ID");
      return false;
    }
    
    console.log(`updateLawyerClientsArray: Adding client ${clientId} to lawyer ${lawyerId}`);
    
    const lawyerDocRef = doc(db, getUserCollectionName('lawyer'), lawyerId);
    const lawyerDoc = await getDoc(lawyerDocRef);
    
    if (!lawyerDoc.exists()) {
      console.error(`updateLawyerClientsArray: Lawyer document not found for ${lawyerId}`);
      return false;
    }
    
    await updateDoc(lawyerDocRef, {
      clients: arrayUnion(clientId)
    });
    
    console.log(`updateLawyerClientsArray: Successfully added client ${clientId} to lawyer ${lawyerId}`);
    return true;
  } catch (error) {
    console.error("Error updating lawyer clients array:", error);
    return false;
  }
};

// Get recent messages for a user
export const getRecentMessagesForUser = async (
  userId: string | undefined,
  limitCount: number = 10
): Promise<Message[]> => {
  if (!userId) {
    console.error("getRecentMessagesForUser called with undefined userId");
    return [];
  }
  try {
    const sentQuery = query(
      collection(db, "messages"),
      where("senderId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const receivedQuery = query(
      collection(db, "messages"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery),
    ]);

    const sentMessages = sentSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt, // Keep as Timestamp
      } as Message;
    });

    const receivedMessages = receivedSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt, // Keep as Timestamp
      } as Message;
    });

    const combined = [...sentMessages, ...receivedMessages];
    const uniqueMessages = Array.from(
      new Map(combined.map((msg) => [msg.id, msg])).values()
    );

    return (
      uniqueMessages
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .slice(0, limitCount)
    );
  } catch (error) {
    console.error("Error getting recent messages:", error);
    return [];
  }
};

// Set up real-time listener for recent messages
export const subscribeToRecentMessagesForUser = (
  userId: string | undefined,
  limitCount: number = 10,
  callback: (messages: Message[]) => void
) => {
  if (!userId) {
    console.error("subscribeToRecentMessagesForUser called with undefined userId");
    return () => {};
  }
  
  try {
    const sentQuery = query(
      collection(db, "messages"),
      where("senderId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const receivedQuery = query(
      collection(db, "messages"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const unsubscribeSent = onSnapshot(sentQuery, (sentSnapshot) => {
      getDocs(receivedQuery).then(receivedSnapshot => {
        const sentMessages = sentSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt, // Keep as Timestamp
          } as Message;
        });
        
        const receivedMessages = receivedSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt, // Keep as Timestamp
          } as Message;
        });
        
        const combined = [...sentMessages, ...receivedMessages];
        const uniqueMessages = Array.from(
          new Map(combined.map((msg) => [msg.id, msg])).values()
        );
        
        const sortedMessages = uniqueMessages
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          .slice(0, limitCount);
          
        callback(sortedMessages);
      });
    });
    
    const unsubscribeReceived = onSnapshot(receivedQuery, (receivedSnapshot) => {
      getDocs(sentQuery).then(sentSnapshot => {
        const sentMessages = sentSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt, // Keep as Timestamp
          } as Message;
        });
        
        const receivedMessages = receivedSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt, // Keep as Timestamp
          } as Message;
        });
        
        const combined = [...sentMessages, ...receivedMessages];
        const uniqueMessages = Array.from(
          new Map(combined.map((msg) => [msg.id, msg])).values()
        );
        
        const sortedMessages = uniqueMessages
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          .slice(0, limitCount);
          
        callback(sortedMessages);
      });
    });
    
    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  } catch (error) {
    console.error("Error setting up recent messages subscription:", error);
    return () => {};
  }
};
