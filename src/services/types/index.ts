import { Timestamp } from "firebase/firestore";

// Original user types
export type UserRole = "client" | "lawyer" | "clerk" | "judge";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  phoneNumber?: string;
  countryCode?: string;
  address?: string;
  specialization?: string;
  governmentId?: {
    type: string;
    number: string;
  };
  idType?: string;
  idNumber?: string;
  password?: string;
  licenseYear?: string;
  casesHandled?: number;
  casesWon?: number;
  caseTypes?: string[];
  barId?: string;
  yearsOfExperience?: string;
  chamberNumber?: string;
  courtDistrict?: string;
  yearsOnBench?: string;
  courtId?: string;
  department?: string;
  createdAt?: Timestamp;
  clients?: string[]; // Add the clients property to the User interface
}

export type CaseStatus =
  | "pending"  // Initial status when case is first created
  | "filed"    // When defendant has a lawyer and case is ready for court processing
  | "active"
  | "scheduled"
  | "in_progress"
  | "on_hold"
  | "dismissed"
  | "closed";

// Helper types based on Mongoose schema for Case
export type GovernmentIdType =
  | "Aadhar"
  | "PAN"
  | "Driving License"
  | "Voter ID"
  | "Passport";

export interface PartyInfo {
  name: string;
  governmentIdType:
    | "Aadhar"
    | "PAN"
    | "Driving License"
    | "Voter ID"
    | "Passport";
  governmentIdNumber: string;
  phoneNumber: string;
}

export interface LawyerInfo {
  name: string;
  barId: string;
}

export interface JudgeInfo {
  judgeId: string;
  judgeName: string;
}

export interface Witness {
  name: string;
  governmentIdType:
    | "Aadhar"
    | "PAN"
    | "Driving License"
    | "Voter ID"
    | "Passport";
  governmentIdNumber: string;
  phoneNumber: string;
  contactNumber?: string;
  relation: string;
  statement?: string;
}

export interface EvidenceItem {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  fileUrl?: string;
  uploadedAt?: Timestamp;
  uploadedBy?: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type?: string;
  courtRoom?: string;
  status: CaseStatus;
  plaintiff: PartyInfo;
  defendant: PartyInfo;
  plaintifflawyer: LawyerInfo;
  defendantlawyer: LawyerInfo;
  judge: JudgeInfo;
  closeRequestedByLawyer?: string;
  closeRequestStatus?: "pending" | "approved" | "rejected" | null;
  closeRequestTimestamp?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  plaintiffEvidences: EvidenceItem[];
  defendantEvidences: EvidenceItem[];
  witnesses: Witness[];
  hearings?: Hearing[];

  clientId: string;  // ID of the plaintiff client
  lawyerId?: string;  // ID of the plaintiff's lawyer
  nextHearingDate?: Timestamp;
  filedDate: Timestamp;
  
  // New fields for defendant client association
  defendantClientId?: string; // ID of the client who claimed to be the defendant
  defendantLawyerId?: string; // ID of the lawyer representing the defendant

  evidence?: EvidenceItem[];
  parties?: Array<{name: string, role: string}>;
  judgement?: {
    decision: "approved" | "denied" | "partial";
    ruling: string;
    issuedAt: Timestamp;
    issuedBy: string;
    judgeName: string;
    courtRoomNumber: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  senderRole: UserRole;
  recipientId: string;
  recipientRole: UserRole;
  caseId?: string;
  content: string;
  read: boolean;
  createdAt: Timestamp; // Use Timestamp
}

export interface Judgement {
  decision: "approved" | "denied" | "partial";
  ruling: string;
  issuedAt: Timestamp; // Use Timestamp
  issuedBy: string;
  judgeName: string;
  courtRoomNumber: string;
}

export interface ReschedulingRecord {
  previousDate: Timestamp; // Use Timestamp
  newDate: Timestamp; // Use Timestamp
  reason: string;
  judgeId: string;
  rescheduledAt: Timestamp; // Use Timestamp
}

export interface Hearing {
  id: string;
  caseId: string;
  date: Timestamp; // Use Timestamp (consider storing date and time together)
  time?: string; // Add time property
  location: string;
  description: string;
  status: string;
  participants?: string[];
  notes?: string;
  rescheduled?: boolean;
  reschedulingHistory?: ReschedulingRecord[];
}

export interface Evidence {
  id: string;
  caseId: string;
  title: string;
  description: string;
  fileUrl?: string;
  uploadedBy: string;
  uploadedAt: Timestamp; // Use Timestamp
  fileType?: string;
}

// Supabase specific types - these are interfaces that match our Supabase tables
// These can be used when interacting with Supabase directly

export interface SupabaseProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: Timestamp; // Use Timestamp
  updated_at: Timestamp; // Use Timestamp
  // New lawyer fields for Supabase
  license_year?: string;
  cases_handled?: number;
  cases_won?: number;
  case_types?: string[];
}

export interface SupabaseCase {
  id: string;
  case_number: string;
  title: string;
  client_id: string;
  primary_lawyer_id?: string;
  secondary_lawyer_id?: string;
  defendant_id?: string;
  court_id?: string;
  type: string;
  status: CaseStatus;
  description: string;
  next_hearing_date?: Timestamp; // Use Timestamp
  judge_id?: string;
  filed_date?: Timestamp; // Use Timestamp
  court_room?: string;
  created_at: Timestamp; // Use Timestamp
  updated_at: Timestamp; // Use Timestamp
}

export interface SupabaseMessage {
  id: string;
  sender_id: string;
  sender_role: UserRole;
  recipient_id: string;
  recipient_role: UserRole;
  case_id?: string;
  content: string;
  read: boolean;
  created_at: Timestamp; // Use Timestamp
}

export interface SupabaseHearing {
  id: string;
  case_id: string;
  date: Timestamp; // Use Timestamp (consider storing date and time together)
  // time: string; // Remove separate time if stored within date Timestamp
  court_id: string;
  judge_id: string;
  location: string;
  abstract: string;
  details?: string;
  status: "scheduled" | "completed" | "cancelled";
  summary?: string;
  created_at: Timestamp; // Use Timestamp
  updated_at: Timestamp; // Use Timestamp
}

export interface SupabaseEvidence {
  id: string;
  case_id: string;
  title: string;
  description: string;
  type?: string;
  file_url?: string;
  uploaded_by: string;
  uploaded_at: Timestamp; // Use Timestamp
  created_at: Timestamp; // Use Timestamp
  updated_at: Timestamp; // Use Timestamp
}

export interface SupabaseCaseRequest {
  id: string;
  client_id: string;
  lawyer_id: string;
  case_title: string;
  description: string;
  status: "pending" | "accepted" | "rejected";
  created_at: Timestamp; // Use Timestamp
  updated_at: Timestamp; // Use Timestamp
}

// Firestore specific CaseRequest type
export interface CaseRequest {
  id: string;
  clientId: string;
  lawyerId: string;
  caseTitle: string;
  description: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  type: "new_case" | "defense";  // Type of request: new case or defense representation
  caseId?: string;  // Required for defense requests, references the existing case
}

// Mapping functions to convert between Supabase and app types
export function mapSupabaseProfileToUser(profile: SupabaseProfile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    // New lawyer fields
    licenseYear: profile.license_year,
    casesHandled: profile.cases_handled,
    casesWon: profile.cases_won,
    caseTypes: profile.case_types,
  };
}

export function mapSupabaseCaseToCase(supCase: SupabaseCase): Case {
  // Helper function to create empty PartyInfo
  const createEmptyPartyInfo = (): PartyInfo => ({
    name: "",
    governmentIdType: "Aadhar",
    governmentIdNumber: "",
    phoneNumber: "",
  });
  // Helper function to create empty LawyerInfo
  const createEmptyLawyerInfo = (): LawyerInfo => ({ name: "", barId: "" });

  return {
    id: supCase.id,
    title: supCase.title,
    description: supCase.description,
    caseNumber: supCase.case_number,
    type: "", // Required field, needs to be populated
    status: supCase.status,
    clientId: supCase.client_id,
    lawyerId: supCase.primary_lawyer_id || "",
    createdAt: supCase.created_at,
    updatedAt: supCase.updated_at,
    nextHearingDate: supCase.next_hearing_date,
    filedDate: supCase.filed_date,
    courtRoom: supCase.court_room || "",
    judge: {
      judgeId: supCase.judge_id || "",
      judgeName: "", // Needs separate fetching
    },
    // Initialize required fields with empty data that needs population
    plaintiff: createEmptyPartyInfo(),
    defendant: createEmptyPartyInfo(),
    plaintifflawyer: createEmptyLawyerInfo(),
    defendantlawyer: createEmptyLawyerInfo(),
    plaintiffEvidences: [],
    defendantEvidences: [],
    witnesses: [],
  };
}

export function mapSupabaseMessageToMessage(message: SupabaseMessage): Message {
  return {
    id: message.id,
    senderId: message.sender_id,
    senderRole: message.sender_role,
    recipientId: message.recipient_id,
    recipientRole: message.recipient_role,
    caseId: message.case_id,
    content: message.content,
    read: message.read,
    createdAt: message.created_at,
  };
}
