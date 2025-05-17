
export enum ReportType {
  HACKING = 'Hacking',
  ONLINE_FRAUD = 'Online Fraud',
  IDENTITY_THEFT = 'Identity Theft',
  CYBERBULLYING = 'Cyberbullying',
  SEXTORTION = 'Sextortion',
  PHISHING = 'Phishing',
  OTHER = 'Other',
}

export enum AITriageCategory {
  FINANCIAL_FRAUD = 'Financial Fraud',
  SEXTORTION = 'Sextortion',
  CYBERBULLYING = 'Cyberbullying',
  HACKING = 'Hacking',
  IDENTITY_THEFT = 'Identity Theft',
  OTHER = 'Other',
}

export enum AITriageUrgency {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum ReportStatus {
  FILED = 'Filed', // Initial submission before any processing
  AI_TRIAGE_PENDING = 'AI Triage Pending',
  AI_TRIAGE_COMPLETED = 'AI Triage Completed',
  ESCALATION_SUGGESTION_PENDING = 'Escalation Suggestion Pending',
  ESCALATION_SUGGESTION_COMPLETED = 'Escalation Suggestion Completed', // AI part done
  CASE_ACCEPTED = 'Case Accepted for Review', // Formal acceptance post-AI
  OFFICER_ASSIGNED = 'Investigating Officer Assigned',
  INVESTIGATION_INITIATED = 'Investigation Initiated',
  INVESTIGATION_UPDATES = 'Investigation Updates', // Generic status for ongoing updates
  ESCALATED_TO_AUTHORITY = 'Escalated to External Authority', // If AI suggestion is acted upon
  CASE_CLOSED = 'Case Closed',
}

export enum EscalationTarget {
  LOCAL_DISTRICT_CYBER_CELL = "Local District Cyber Cell",
  STATE_CYBER_HQ = "State Cyber HQ",
  I4C_NATIONAL_COORDINATION = "I4C (Indian Cyber Crime Coordination Centre)",
  CERT_IN_TECHNICAL_EMERGENCY = "CERT-In (Indian Computer Emergency Response Team)",
  INTERPOL_INTERNATIONAL_CRIME = "Interpol (International Crime)",
  MEA_LIAISON_FOREIGN_ENTITIES = "MEA Liaison (Foreign Entities Involved)",
  NATIONAL_SECURITY_AGENCY_ALERT = "National Security Agency Alert (e.g., NIA/CBI)",
  INTERNAL_REVIEW_FURTHER_INFO_NEEDED = "Internal Review / Further Information Needed",
}


export interface AIAssistedTriageResult {
  category: AITriageCategory | string;
  urgency: AITriageUrgency | string;
  summary: string;
}

export interface AISuggestedEscalationResult {
  target: EscalationTarget | string;
  reasoning: string;
}

export interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  // dataUri?: string; 
}

export interface SuspectDetails {
  phone?: string;
  email?: string;
  ipAddress?: string;
  website?: string; // Added for websites from decision tree
  bankAccount?: string; // Added for bank accounts from decision tree
  otherInfo?: string; // General field for other suspect related info
}

export interface IncidentLocation {
  type: 'auto' | 'manual' | 'not_provided';
  city?: string;
  state?: string;
  country?: string; // For foreign element detection
  details?: string; // Full string like "Bihar" or "Mumbai server"
  latitude?: number;
  longitude?: number;
}

export interface Report {
  id: string; // Will be more structured, e.g., STATE-CITY-YYYY-#####
  type: ReportType;
  description: string;
  incidentDate: string; // ISO string
  
  reporterName?: string;
  reporterContact?: string;
  
  suspectDetails?: SuspectDetails;
  incidentLocation?: IncidentLocation;
  additionalEvidenceText?: string; // For URLs, email contents, etc.

  evidenceFiles: EvidenceFile[];
  submissionDate: string; // ISO string
  status: ReportStatus;
  
  aiTriage?: AIAssistedTriageResult;
  aiEscalation?: AISuggestedEscalationResult;
  
  assignedOfficerName?: string;
  chatId?: string;

  timelineNotes?: string; // To guide the user on what to expect next
}

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'user' | 'officer';
  text: string;
  timestamp: string; // ISO string
}
