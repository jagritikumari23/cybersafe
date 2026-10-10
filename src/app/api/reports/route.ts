import { NextRequest, NextResponse } from 'next/server';
import { getDocs, query, orderBy, limit, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// In your GET handler:
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitCount = parseInt(searchParams.get('limit') || '10');
    const lastDocId = searchParams.get('lastDocId');
    
    let q = query(
      collection(db, 'reports'),
      orderBy('submissionDate', 'desc'),
      limit(limitCount)
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error('Error getting reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
