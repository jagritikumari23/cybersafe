import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { ReportData, AITriageResult, RiskAssessment } from './types';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Risk factors and their weights
const RISK_FACTORS = {
  SEVERITY: {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    critical: 1.0
  },
  CATEGORY: {
    phishing: 0.9,
    malware: 0.95,
    data_breach: 1.0,
    unauthorized_access: 0.85,
    suspicious_activity: 0.7,
    other: 0.5
  },
  EVIDENCE: {
    none: 0.2,
    low: 0.5,
    medium: 0.8,
    high: 1.0
  }
};

// Keywords that indicate high risk
const HIGH_RISK_KEYWORDS = [
  'hack', 'breach', 'leak', 'ransom', 'malware', 'virus', 'phish', 
  'unauthorized', 'stolen', 'compromised', 'attack', 'exploit'
];

export const calculateRiskScore = onDocumentCreated(
  'reports/{reportId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.error('No data associated with the event');
      return;
    }

    try {
      const report = snapshot.data() as ReportData;
      await performRiskAssessmentUpdate(snapshot.ref, report);
    } catch (error) {
      console.error('Error in calculateRiskScore:', error);
      throw error;
    }
  }
);

export const updateRiskAssessment = onDocumentUpdated(
  'reports/{reportId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.error('No data associated with the event');
      return;
    }

    try {
      const beforeData = snapshot.before.data() as ReportData;
      const afterData = snapshot.after.data() as ReportData;
      
      // Only process if relevant fields have changed
      if (JSON.stringify(beforeData) !== JSON.stringify(afterData)) {
        await performRiskAssessmentUpdate(snapshot.after.ref, afterData);
      }
    } catch (error) {
      console.error('Error in updateRiskAssessment:', error);
      throw error;
    }
  }
);

/**
 * Performs risk assessment on a report
 */
async function performRiskAssessmentUpdate(
  ref: FirebaseFirestore.DocumentReference,
  report: ReportData
): Promise<void> {
  try {
    // Calculate base risk score based on severity and category
    const severityScore = (RISK_FACTORS.SEVERITY[report.severity] || 0.5) * 40;
    const categoryScore = (RISK_FACTORS.CATEGORY[report.category as keyof typeof RISK_FACTORS.CATEGORY] || 0.5) * 40;
    
    // Calculate evidence score
    const evidenceLevel = getEvidenceLevel(report.evidenceUrls || []);
    const evidenceScore = (RISK_FACTORS.EVIDENCE[evidenceLevel] || 0.5) * 20;
    
    // Check for high-risk keywords in title and description
    const content = `${report.title} ${report.description}`.toLowerCase();
    const riskKeywords = HIGH_RISK_KEYWORDS.filter(keyword => content.includes(keyword));
    const keywordScore = Math.min(riskKeywords.length * 5, 20); // Max 20 points for keywords
    
    // Calculate final risk score (0-100)
    const riskScore = Math.round(
      severityScore * 0.4 + 
      categoryScore * 0.3 + 
      evidenceScore * 0.2 +
      keywordScore * 0.1
    );

    // Generate AI triage result
    const aiTriage: AITriageResult = {
      category: determineCategory(report, riskKeywords),
      confidence: calculateConfidence(riskScore, evidenceLevel),
      riskScore: riskScore / 100, // Normalize to 0-1
      isHighRisk: riskScore >= 70,
      summary: generateRiskSummary(report, riskScore, riskKeywords),
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      keywords: riskKeywords,
      recommendedActions: generateRecommendedActions(report, riskScore, riskKeywords)
    };

    // Create risk assessment record
    const riskAssessment: RiskAssessment = {
      ...aiTriage,
      reportId: ref.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      falsePositive: false
    };

    // Update the report with risk assessment
    const batch = admin.firestore().batch();
    
    // Update the report
    batch.update(ref, {
      riskScore,
      lastAssessed: admin.firestore.FieldValue.serverTimestamp(),
      status: determineInitialStatus(riskScore),
      metadata: {
        ...report.metadata,
        lastRiskAssessment: riskAssessment.timestamp,
        riskFactors: {
          severity: severityScore,
          category: categoryScore,
          evidence: evidenceScore,
          keywords: keywordScore
        }
      }
    });

    // Create risk assessment record in subcollection
    const assessmentRef = ref.collection('riskAssessments').doc();
    batch.set(assessmentRef, riskAssessment);

    // Commit the batch
    await batch.commit();
    
    console.log(`Risk assessment completed for report ${ref.id}. Score: ${riskScore}`);
  } catch (error) {
    console.error(`Error in performRiskAssessmentUpdate for report ${ref.id}:`, error);
    throw error;
  }
}

// Helper function to determine evidence level based on number of evidence items
function getEvidenceLevel(evidenceUrls: string[]): keyof typeof RISK_FACTORS.EVIDENCE {
  if (!evidenceUrls || evidenceUrls.length === 0) return 'none';
  if (evidenceUrls.length === 1) return 'low';
  if (evidenceUrls.length <= 3) return 'medium';
  return 'high';
}

// Helper function to determine the most appropriate category
function determineCategory(report: ReportData, riskKeywords: string[]): string {
  // If we have specific keywords that indicate a certain category, use that
  if (riskKeywords.includes('phish')) return 'phishing';
  if (riskKeywords.includes('malware') || riskKeywords.includes('virus')) return 'malware';
  if (riskKeywords.includes('breach') || riskKeywords.includes('leak')) return 'data_breach';
  
  // Default to the report's category if no specific indicators found
  return report.category || 'suspicious_activity';
}

// Helper function to calculate confidence level
function calculateConfidence(riskScore: number, evidenceLevel: string): number {
  // Base confidence on risk score and evidence level
  let confidence = 0.7; // Base confidence
  
  // Adjust based on evidence
  if (evidenceLevel === 'high') confidence += 0.2;
  else if (evidenceLevel === 'medium') confidence += 0.1;
  
  // Adjust based on risk score (more certain about very high or very low scores)
  if (riskScore > 80 || riskScore < 20) confidence += 0.1;
  
  return Math.min(1, Math.max(0, confidence)); // Keep between 0 and 1
}

// Helper function to generate a risk summary
function generateRiskSummary(report: ReportData, riskScore: number, riskKeywords: string[]): string {
  const severity = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const keywordPhrase = riskKeywords.length > 0 
    ? ` Detected high-risk keywords: ${riskKeywords.slice(0, 3).join(', ')}${riskKeywords.length > 3 ? '...' : ''}.`
    : '';
  
  return `Report classified as ${severity} risk.${keywordPhrase} ${report.description.substring(0, 100)}...`;
}

// Helper function to generate recommended actions
function generateRecommendedActions(report: ReportData, riskScore: number, riskKeywords: string[]): string[] {
  const actions: string[] = [];
  
  if (riskScore >= 70) {
    actions.push('Immediate investigation required');
    actions.push('Notify security team');
  } else if (riskScore >= 40) {
    actions.push('Schedule for review');
  }
  
  if (riskKeywords.includes('phish')) {
    actions.push('Check for similar phishing attempts');
  }
  
  if (riskKeywords.includes('malware') || riskKeywords.includes('virus')) {
    actions.push('Scan affected systems');
  }
  
  if (actions.length === 0) {
    actions.push('Monitor for similar reports');
  }
  
  return actions;
}

// Helper function to determine initial status based on risk score
function determineInitialStatus(riskScore: number): ReportData['status'] {
  return riskScore >= 70 ? 'escalated' : 'new';
}
