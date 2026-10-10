
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const { reportId } = params;
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('reports')
      .select('id, data, status, submission_date')
      .eq('id', reportId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    return NextResponse.json({
      ...data.data,
      id: data.id,
      submissionDate: data.submission_date,
      status: data.status,
    });
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
  { params }: { params: { reportId: string } }
) {
  void request;
  void params;
  return NextResponse.json({ error: 'Report updates are not supported.' }, { status: 405 });
}
