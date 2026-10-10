export interface ReportData {
  id?: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in_progress' | 'resolved' | 'escalated';
  reporterId: string;
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
  evidenceUrls?: string[];
  metadata?: Record<string, any>;
}

export interface AITriageResult {
  category: string;
  confidence: number;
  riskScore: number;
  isHighRisk: boolean;
  summary: string;
  processedAt: FirebaseFirestore.FieldValue | Date;
  recommendedActions?: string[];
  keywords?: string[];
}

export interface RiskAssessment extends AITriageResult {
  reportId: string;
  timestamp: FirebaseFirestore.FieldValue | Date;
  reviewerNotes?: string;
  falsePositive?: boolean;
}
