import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { enforceReportRateLimit } from '@/lib/server/report-rate-limit';
import { ReportStatus, ReportType } from '@/lib/types';

const MAX_REPORT_BODY_BYTES = 32 * 1024;
const allowedEvidenceTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain',
  'video/mp4',
  'video/quicktime',
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional();
async function readBoundedBody(request: NextRequest, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) return { tooLarge: false, text: '' };

  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > maxBytes) {
      await reader.cancel();
      return { tooLarge: true, text: '' };
    }
    text += decoder.decode(value, { stream: true });
  }

  return { tooLarge: false, text: text + decoder.decode() };
}

const reportSchema = z.object({
  type: z.nativeEnum(ReportType),
  originalDescriptionLanguage: z.enum(['en', 'hi', 'ta', 'bn', 'te', 'mr']),
  description: z.string().trim().min(50).max(5000),
  incidentDate: z.string().datetime({ offset: true }),
  reporterName: optionalText(120),
  reporterContact: z.string().trim().max(254).optional().refine(
    (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\d{10}$/.test(value),
    'Enter a valid email address or 10-digit phone number.'
  ),
  suspectDetails: z.object({
    phone: optionalText(32),
    email: z.union([z.string().email().max(254), z.literal('')]).optional(),
    ipAddress: z.union([z.string().ip().max(45), z.literal('')]).optional(),
    website: z.union([z.string().url().max(2048), z.literal('')]).optional(),
    bankAccount: optionalText(100),
    otherInfo: optionalText(500),
  }).strict().optional(),
  incidentLocation: z.object({
    type: z.enum(['auto', 'manual', 'not_provided']),
    city: optionalText(100),
    state: optionalText(100),
    country: optionalText(100),
    details: optionalText(500),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).strict().refine(
    (location) => location.type !== 'manual' || Boolean(location.city && location.state && location.country),
    'Manual location requires city, state, and country.'
  ),
  additionalEvidenceText: z.string().trim().max(2000).optional(),
  evidenceFiles: z.array(z.object({
    name: z.string().trim().min(1).max(255),
    type: z.enum(allowedEvidenceTypes),
    size: z.number().int().min(0).max(5 * 1024 * 1024),
  }).strict()).max(5),
}).strict();

export async function POST(request: NextRequest) {
  const rateLimitResponse = await enforceReportRateLimit(request, 'submit', 5, 15 * 60);
  if (rateLimitResponse) return rateLimitResponse;

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REPORT_BODY_BYTES) {
    return NextResponse.json({ error: 'Report request is too large.' }, { status: 413 });
  }

  let requestBody: unknown;
  try {
    const body = await readBoundedBody(request, MAX_REPORT_BODY_BYTES);
    if (body.tooLarge) {
      return NextResponse.json({ error: 'Report request is too large.' }, { status: 413 });
    }
    requestBody = JSON.parse(body.text);
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const validation = reportSchema.safeParse(requestBody);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Report details are invalid or incomplete.' },
      { status: 400 }
    );
  }

  const reportData = validation.data;
  const trackingSecret = randomBytes(32).toString('base64url');
  const trackingSecretHash = createHash('sha256').update(trackingSecret).digest('hex');

  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('reports')
      .insert({
        data: reportData,
        status: ReportStatus.FILED,
        tracking_secret_hash: trackingSecretHash,
      })
      .select('id, data, status, submission_date')
      .single();
    if (error) throw error;

    const trackingReceipt = {
      id: data.id,
      submissionDate: data.submission_date,
      status: data.status,
      trackingSecret,
    };
    return NextResponse.json(trackingReceipt, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : 'unknown';
    console.error('Error creating report. Supabase code:', errorCode);
    if (errorMessage.includes('Set NEXT_PUBLIC_SUPABASE_URL')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to save the report.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Listing reports is disabled. Retrieve a report by its ID.' },
    { status: 405 }
  );
}
