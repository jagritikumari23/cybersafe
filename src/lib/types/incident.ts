export type IncidentStatus = 'pending' | 'in_review' | 'resolved' | 'rejected';

export interface Incident {
  id?: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  evidenceUrls?: string[];
}