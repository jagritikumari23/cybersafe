export enum ReportType {
  HACKING = 'Hacking',
  ONLINE_FRAUD = 'Online Fraud',
  IDENTITY_THEFT = 'Identity Theft',
  CYBERBULLYING = 'Cyberbullying',
  SEXTORTION = 'Sextortion',
  PHISHING = 'Phishing',
  OTHER = 'Other',
}

// This mirrors the AI output enum but is kept separate for clarity
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
  FILED = 'Filed',
  AI_TRIAGE_PENDING = 'AI Triage Pending',
  AI_TRIAGE_COMPLETED = 'AI Triage Completed',
  OFFICER_ASSIGNED = 'Investigating Officer Assigned',
  INVESTIGATION_UPDATES = 'Investigation Updates',
  CASE_CLOSED = 'Case Closed',
}

export interface AIAssistedTriageResult {
  category: AITriageCategory | string; // string for flexibility if AI returns something unexpected
  urgency: AITriageUrgency | string;
  summary: string;
}

export interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  // dataUri?: string; // Optional: for future evidence scrubbing
}

export interface Report {
  id: string;
  type: ReportType;
  description: string;
  incidentDate: string; // ISO string
  reporterName?: string;
  reporterContact?: string;
  evidenceFiles: EvidenceFile[];
  submissionDate: string; // ISO string
  status: ReportStatus;
  aiTriage?: AIAssistedTriageResult;
}
