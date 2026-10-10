import { db } from './config';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Example: Add a new incident report
export const addIncident = async (incidentData: Omit<Report, 'id' | 'submissionDate' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, 'incidents'), {
      ...incidentData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      userId: 'current-user-id' // You'll replace this with the actual user ID from auth
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

// Example: Get all incidents
export const getIncidents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'incidents'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting documents: ', error);
    throw error;
  }
};