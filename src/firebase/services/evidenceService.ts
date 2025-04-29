
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../config";
import { Evidence } from "@/services/types";
import { formatTimestamp, timestampToDate } from "@/utils/dateUtils";
import { uploadToCloudinary } from "@/utils/cloudinaryService";

// Get evidence by case ID
export const getEvidenceByCaseId = async (
  caseId: string
): Promise<Evidence[]> => {
  try {
    const evidenceQuery = query(
      collection(db, "evidence"),
      where("caseId", "==", caseId)
    );

    const evidenceSnapshot = await getDocs(evidenceQuery);

    return evidenceSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        uploadedAt: data.uploadedAt || null,
      } as Evidence;
    });
  } catch (error) {
    console.error("Error getting evidence:", error);
    return [];
  }
};

// Upload and add evidence
export const addEvidence = async (
  caseId: string,
  title: string,
  description: string,
  file: File,
  uploadedBy: string
): Promise<Evidence> => {
  try {
    // Upload file to Cloudinary instead of Firebase Storage
    console.log(`Uploading evidence file to Cloudinary: ${file.name}`);
    const fileUrl = await uploadToCloudinary(file, `evidence/${caseId}`);

    // Create evidence record in Firestore
    const newEvidence = {
      caseId,
      title,
      description,
      fileUrl,
      uploadedBy,
      uploadedAt: serverTimestamp(),
      fileType: file.type,
    };

    const docRef = await addDoc(collection(db, "evidence"), newEvidence);

    // Cast the response to Evidence after adding the ID
    const returnData = {
      ...newEvidence,
      id: docRef.id,
      // For the return value, we can use serverTimestamp which will be a Timestamp
      uploadedAt: serverTimestamp(),
    } as unknown as Evidence;

    return returnData;
  } catch (error) {
    console.error("Error adding evidence:", error);
    throw error;
  }
};

// Delete evidence
export const deleteEvidence = async (evidenceId: string): Promise<void> => {
  try {
    // Get evidence document
    const evidenceDoc = await getDoc(doc(db, "evidence", evidenceId));

    if (!evidenceDoc.exists()) {
      throw new Error("Evidence not found");
    }

    const evidenceData = evidenceDoc.data();

    // For Cloudinary, we would need to make an API call to delete the file
    // But for simplicity, we'll just delete the Firestore document
    // In a production environment, you'd want to delete the Cloudinary file too

    // Delete evidence document
    await deleteDoc(doc(db, "evidence", evidenceId));
  } catch (error) {
    console.error("Error deleting evidence:", error);
    throw error;
  }
};
