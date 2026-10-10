import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/types/firebase';
import { Incident } from '@/lib/types/incident';

export function useReports(status: string | null = null, limitCount: number = 10) {
  const [reports, setReports] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query(
      collection(db, 'reports'),
      orderBy('submissionDate', 'desc'),
      limit(limitCount)
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Incident, 'id'>)
        }));
        setReports(reportsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error getting reports:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [status, limitCount]);

  return { reports, loading, error };
}