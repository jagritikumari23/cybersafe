
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { enforceReportRateLimit } from '@/lib/server/report-rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const rateLimitResponse = await enforceReportRateLimit(request, 'track', 30, 15 * 60);
  if (rateLimitResponse) return rateLimitResponse;

  const { reportId } = await params;
  const trackingSecret = request.headers.get('x-report-tracking-secret');
  if (!trackingSecret || trackingSecret.length < 40 || trackingSecret.length > 100) {
    return NextResponse.json(
      { error: 'Report not found or tracking credentials are invalid.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!z.string().uuid().safeParse(reportId).success) {
    return NextResponse.json(
      { error: 'Report not found or tracking credentials are invalid.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const trackingSecretHash = createHash('sha256').update(trackingSecret).digest('hex');
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('reports')
      .select('id, data, status, submission_date')
      .eq('id', reportId)
      .eq('tracking_secret_hash', trackingSecretHash)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: 'Report not found or tracking credentials are invalid.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json({
      ...data.data,
      id: data.id,
      submissionDate: data.submission_date,
      status: data.status,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isConfigurationError = message.includes('Set NEXT_PUBLIC_SUPABASE_URL');
    return NextResponse.json(
      { error: isConfigurationError ? message : 'Failed to fetch report.' },
      { status: isConfigurationError ? 503 : 500 }
    );
  }
}

// PUT handler for updates (placeholder)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  void request;
  void params;
  return NextResponse.json({ error: 'Report updates are not supported.' }, { status: 405 });
}
