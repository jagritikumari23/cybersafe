import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
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

  if (!adminDb) {
    return NextResponse.json({ error: 'Report storage is unavailable.' }, { status: 503 });
  }

  try {
    const reportRef = adminDb.collection('reports').doc();
    const report = {
      ...reportData,
      id: reportRef.id,
      submissionDate: new Date().toISOString(),
      status: ReportStatus.FILED,
    };

    await reportRef.set(report);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to save the report.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitCount = parseInt(searchParams.get('limit') || '10');

    if (adminDb) {
      let queryRef: any = adminDb.collection('reports').orderBy('submissionDate', 'desc').limit(limitCount);
      if (status) {
        queryRef = queryRef.where('status', '==', status);
      }
      const snapshot = await queryRef.get();
      const reports = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      return NextResponse.json(reports, { status: 200 });
    }

    return NextResponse.json([], { status: 200 });
  } catch (error: any) {
    console.warn('Notice getting reports (falling back to empty array):', error?.message || error);
    return NextResponse.json([], { status: 200 });
  }
}
