import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

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
