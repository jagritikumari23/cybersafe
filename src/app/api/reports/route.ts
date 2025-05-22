
import { NextResponse, type NextRequest } from 'next/server';
import type { Report, ReportType, SuspectDetails, IncidentLocation, EvidenceFile, AITriageCategory, AITriageUrgency, EscalationTarget, ReportStatus } from '@/lib/types';
import { translateText, type TranslateTextInput } from '@/ai/flows/translate-text-flow';
import { autoTriage, type AutoTriageInput } from '@/ai/flows/auto-triage';
import { suggestEscalation, type SuggestEscalationInput } from '@/ai/flows/suggest-escalation-flow';
import { detectFraudPatterns, type DetectFraudPatternsInput } from '@/ai/flows/detect-fraud-patterns-flow';
import { ComplaintLanguages } from '@/lib/types';

// In-memory store for reports (resets on server restart - for prototype purposes)
const reportsStore: Map<string, Report> = new Map();

// Helper function to generate structured ID (moved from report-incident-form)
function generateStructuredId(city?: string, state?: string): string {
  const stateAbbr = state ? state.substring(0, 2).toUpperCase() : 'XX';
  const cityAbbr = city ? city.substring(0, 3).toUpperCase() : 'YYY';
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${stateAbbr}-${cityAbbr}-${year}-${randomSuffix}`;
}

// KNOWN_FRAUD_INDICATORS_TEXT (moved from report-incident-form)
const KNOWN_FRAUD_INDICATORS_TEXT = `
Known scammer emails: danger@scamdomain.com, phisher@fakebank.org, urgent@verify-account.net
Known scam phone numbers: +911234500000, +18005551001
Suspicious IP addresses: 10.0.0.1 (internal, likely a mistake if reported), 203.0.113.45
Flagged bank accounts: 12345678900 (Generic Bank), 98765432100 (Another Bank)
Website patterns: sites ending in .xyz, .top, .live that ask for credentials; sites impersonating official government portals with slight misspellings.
Other suspicious info: "Received SMS asking to click link to update KYC", "Job offer asking for upfront payment via UPI to unofficial ID"
`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // --- Initial Report Data Construction ---
    const incidentLocationData: IncidentLocation = formData.incidentLocation || { type: 'not_provided' };
    const reportId = generateStructuredId(incidentLocationData.city, incidentLocationData.state);

    const suspectDetails: SuspectDetails | undefined = formData.suspectDetails && Object.values(formData.suspectDetails).some(val => val && String(val).trim().length > 0)
      ? formData.suspectDetails
      : undefined;

    const selectedLanguageLabel = ComplaintLanguages.find(lang => lang.value === formData.originalDescriptionLanguage)?.label || formData.originalDescriptionLanguage;

    let currentReport: Report = {
      id: reportId,
      type: formData.type as ReportType,
      description: formData.description,
      originalDescriptionLanguage: selectedLanguageLabel,
      incidentDate: formData.incidentDate, // Assuming it's already an ISO string from client
      reporterName: formData.reporterName,
      reporterContact: formData.reporterContact,
      suspectDetails: suspectDetails,
      incidentLocation: incidentLocationData.type !== 'not_provided' && (incidentLocationData.details || incidentLocationData.city) ? incidentLocationData : undefined,
      additionalEvidenceText: formData.additionalEvidenceText,
      evidenceFiles: formData.evidenceFiles as EvidenceFile[], // Assuming client sends this structure
      submissionDate: new Date().toISOString(),
      status: ReportStatus.FILED,
      timelineNotes: "Report submitted. Server processing initiated."
    };

    // --- AI Processing Pipeline ---
    let descriptionForAI = formData.description;

    // 1. Translation
    if (formData.originalDescriptionLanguage !== 'en' && selectedLanguageLabel !== 'English') {
      currentReport.status = ReportStatus.TRANSLATION_PENDING;
      currentReport.timelineNotes = "Translating description to English...";
      
      const translateInput: TranslateTextInput = {
        textToTranslate: formData.description,
        targetLanguage: 'English',
        sourceLanguage: selectedLanguageLabel,
      };
      const translationResult = await translateText(translateInput);
      currentReport.descriptionInEnglish = translationResult.translatedText;
      descriptionForAI = translationResult.translatedText;
      currentReport.status = ReportStatus.TRANSLATION_COMPLETED;
      currentReport.timelineNotes = "Description translated. Starting AI Triage...";
    } else {
      currentReport.descriptionInEnglish = formData.description;
      currentReport.timelineNotes = "AI Triage in progress...";
    }

    // 2. AI Triage
    currentReport.status = ReportStatus.AI_TRIAGE_PENDING; // Set before call
    const triageInput: AutoTriageInput = {
      reportText: descriptionForAI,
      reportType: formData.type as ReportType,
    };
    const triageResult = await autoTriage(triageInput);
    currentReport.aiTriage = {
      category: triageResult.category as AITriageCategory | string,
      urgency: triageResult.urgency as AITriageUrgency | string,
      summary: triageResult.summary,
    };
    currentReport.status = ReportStatus.AI_TRIAGE_COMPLETED;
    currentReport.timelineNotes = `AI Triage complete. Category: ${triageResult.category}. Urgency: ${triageResult.urgency}. Preparing escalation suggestion...`;

    // 3. Escalation Suggestion
    currentReport.status = ReportStatus.ESCALATION_SUGGESTION_PENDING;
    let suspectInfoForAI = "No specific suspect details provided.";
    if (currentReport.suspectDetails) {
      suspectInfoForAI = Object.entries(currentReport.suspectDetails)
        .filter(([, value]) => value && String(value).trim() !== "")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`)
        .join(', ') || suspectInfoForAI;
    }
    let locationInfoForAI = "Location not specified or not relevant.";
    if (currentReport.incidentLocation && currentReport.incidentLocation.type !== 'not_provided') {
      locationInfoForAI = `Incident location: ${currentReport.incidentLocation.details}.`;
    }

    const escalationInput: SuggestEscalationInput = {
      reportText: descriptionForAI,
      reportType: formData.type as ReportType,
      suspectInfo: suspectInfoForAI,
      locationInfo: locationInfoForAI,
      additionalEvidenceText: formData.additionalEvidenceText || 'None',
      triageCategory: triageResult.category,
      triageUrgency: triageResult.urgency,
    };
    const escalationResult = await suggestEscalation(escalationInput);
    currentReport.aiEscalation = {
      target: escalationResult.suggestedTarget as EscalationTarget | string,
      reasoning: escalationResult.reasoning,
    };
    currentReport.status = ReportStatus.ESCALATION_SUGGESTION_COMPLETED;
    currentReport.timelineNotes = `Escalation suggested: ${escalationResult.suggestedTarget}. Analyzing for fraud patterns...`;

    // 4. Fraud Pattern Detection
    if (currentReport.suspectDetails && Object.values(currentReport.suspectDetails).some(val => val && String(val).trim().length > 0)) {
      currentReport.status = ReportStatus.FRAUD_PATTERN_ANALYSIS_PENDING;
      const fraudPatternInput: DetectFraudPatternsInput = {
        currentReportSuspectInfo: currentReport.suspectDetails,
        knownFraudulentIndicatorsText: KNOWN_FRAUD_INDICATORS_TEXT,
      };
      const fraudPatternResult = await detectFraudPatterns(fraudPatternInput);
      currentReport.fraudPatternInfo = fraudPatternResult;
      currentReport.status = ReportStatus.FRAUD_PATTERN_ANALYSIS_COMPLETED;
      currentReport.timelineNotes += ` Fraud Pattern Analysis: ${fraudPatternResult.detected ? `Detected (${fraudPatternResult.details})` : 'No specific patterns detected.'}`;
    } else {
      currentReport.fraudPatternInfo = { detected: false, details: "No suspect information provided for pattern analysis." };
      currentReport.status = ReportStatus.FRAUD_PATTERN_ANALYSIS_COMPLETED;
    }
    
    // 5. Final Status, Officer Assignment, Chat ID
    if (currentReport.aiTriage.urgency === AITriageUrgency.HIGH || currentReport.aiTriage.urgency === AITriageUrgency.MEDIUM) {
      currentReport.assignedOfficerName = "Officer K (System Assigned)";
      currentReport.chatId = `chat_${reportId}`;
      currentReport.status = ReportStatus.OFFICER_ASSIGNED;
      currentReport.timelineNotes = `AI analysis complete. ${currentReport.fraudPatternInfo?.detected ? 'Fraud pattern detected. ' : ''}Officer K assigned. Investigation will commence shortly. You can use the chat feature for updates. Suggested Escalation: ${escalationResult.suggestedTarget}.`;
    } else {
      currentReport.status = ReportStatus.CASE_ACCEPTED;
      currentReport.timelineNotes = `AI analysis complete. ${currentReport.fraudPatternInfo?.detected ? 'Fraud pattern detected. ' : ''}Case accepted for review. Suggested Escalation: ${escalationResult.suggestedTarget}.`;
    }

    reportsStore.set(reportId, currentReport);
    console.log(`[API Reports POST] Report ${reportId} processed and stored. Total reports: ${reportsStore.size}`);
    return NextResponse.json(currentReport, { status: 201 });

  } catch (error) {
    console.error('[API Reports POST] Error processing report:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process report', details: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const allReports = Array.from(reportsStore.values());
    // Sort by submissionDate descending to show newest first
    allReports.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
    console.log(`[API Reports GET] Retrieving ${allReports.length} reports.`);
    return NextResponse.json(allReports, { status: 200 });
  } catch (error) {
    console.error('[API Reports GET] Error retrieving reports:', error);
    return NextResponse.json({ error: 'Failed to retrieve reports' }, { status: 500 });
  }
}
