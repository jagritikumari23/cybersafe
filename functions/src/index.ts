// functions/src/index.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { processChatMessage } from './chat';
import { calculateRiskScore, updateRiskAssessment } from './risk-assessment';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export { processChatMessage, calculateRiskScore, updateRiskAssessment };

// Example Cloud Function for AI Triage
export const processNewReport = onDocumentCreated(
  'reports/{reportId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const report = snapshot.data();
    console.log('Processing report:', report?.title || snapshot.id);
    
    // TODO: Implement AI triage logic
    const aiAnalysis = {
      category: 'suspicious_activity',
      confidence: 0.85,
      riskScore: 0.72,
      isHighRisk: true,
      summary: 'Report contains indicators of potential fraud',
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    return snapshot.ref.update({ aiTriage: aiAnalysis });
  }
);