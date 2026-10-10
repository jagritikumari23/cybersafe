import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { ReportStatus, ReportType } from '@/lib/types';

export async function POST(request: NextRequest) {
  let reportData: any;
  try {
    reportData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (
    !reportData ||
    typeof reportData !== 'object' ||
    !Object.values(ReportType).includes(reportData.type) ||
    typeof reportData.description !== 'string' ||
    reportData.description.trim().length < 50 ||
    !reportData.incidentDate ||
    Number.isNaN(Date.parse(reportData.incidentDate)) ||
    !Array.isArray(reportData.evidenceFiles)
  ) {
    return NextResponse.json({ error: 'Report details are invalid or incomplete.' }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('reports')
      .insert({ data: reportData, status: ReportStatus.FILED })
      .select('id, data, status, submission_date')
      .single();
    if (error) throw error;

    const report = {
      ...data.data,
      id: data.id,
      submissionDate: data.submission_date,
      status: data.status,
    };
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating report:', errorMessage);
    if (errorMessage.includes('Set NEXT_PUBLIC_SUPABASE_URL')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to save the report.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const limitCount = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 10;
    let query = getSupabaseAdminClient()
      .from('reports')
      .select('id, data, status, submission_date')
      .order('submission_date', { ascending: false })
      .limit(limitCount);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data.map((row) => ({
      ...row.data,
      id: row.id,
      submissionDate: row.submission_date,
      status: row.status,
    })), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isConfigurationError = errorMessage.includes('Set NEXT_PUBLIC_SUPABASE_URL');
    console.error('Error fetching reports:', errorMessage);
    return NextResponse.json(
      { error: isConfigurationError ? errorMessage : 'Failed to fetch reports.' },
      { status: isConfigurationError ? 503 : 500 }
    );
  }
}
