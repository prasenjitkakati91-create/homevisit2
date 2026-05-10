import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot,
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  collectionGroup,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const FIXED_PHYSIO_ID = 'default_physio';

// PATIENTS
export const patientService = {
  async addPatient(data: any) {
    const path = 'patients';
    try {
      return await addDoc(collection(db, path), {
        ...data,
        physioId: FIXED_PHYSIO_ID,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getPatients() {
    const path = 'patients';
    try {
      console.log('[PatientService] Fetching ledger for index: ', FIXED_PHYSIO_ID);
      const q = query(
        collection(db, path), 
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`[PatientService] Retrieved ${data.length} records`);
      return data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (e: any) {
      console.error('[PatientService] Critical Index Error:', e.message);
      // Fallback if index is missing or permissions fail partially
      if (e.message?.includes('index') || e.message?.includes('permission')) {
          console.warn('[PatientService] Attempting unsecured fallback fetch...');
          try {
              const snapshot = await getDocs(collection(db, path));
              return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((p: any) => p.physioId === FIXED_PHYSIO_ID || !p.physioId)
                .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          } catch (innerE) {
              handleFirestoreError(e, OperationType.LIST, path);
          }
      }
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async getPatient(id: string) {
    const path = `patients/${id}`;
    try {
      const docRef = doc(db, 'patients', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  async updatePatient(id: string, data: any) {
    const path = `patients/${id}`;
    try {
      const docRef = doc(db, 'patients', id);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async updatePatientStatus(id: string, status: string) {
    const path = `patients/${id}`;
    try {
      const docRef = doc(db, 'patients', id);
      await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deletePatient(id: string) {
    const path = `patients/${id}`;
    try {
      const docRef = doc(db, 'patients', id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }
};

// CASES
export const caseService = {
  async addCase(patientId: string, data: any) {
    const path = `patients/${patientId}/cases`;
    try {
      return await addDoc(collection(db, 'patients', patientId, 'cases'), {
        ...data,
        patientId,
        physioId: FIXED_PHYSIO_ID,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getCases(patientId: string) {
    const path = `patients/${patientId}/cases`;
    try {
      const q = query(
        collection(db, 'patients', patientId, 'cases'),
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async updateCase(patientId: string, caseId: string, data: any) {
    const path = `patients/${patientId}/cases/${caseId}`;
    try {
      const docRef = doc(db, 'patients', patientId, 'cases', caseId);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  }
};

// SESSIONS
export const sessionService = {
  async addSession(patientId: string, caseId: string, data: any) {
    const path = `patients/${patientId}/cases/${caseId}/sessions`;
    try {
      return await addDoc(collection(db, 'patients', patientId, 'cases', caseId, 'sessions'), {
        ...data,
        patientId,
        caseId,
        physioId: FIXED_PHYSIO_ID,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getSessions(patientId: string, caseId: string) {
    const path = `patients/${patientId}/cases/${caseId}/sessions`;
    try {
      const q = query(
        collection(db, 'patients', patientId, 'cases', caseId, 'sessions'),
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async updateSession(patientId: string, caseId: string, sessionId: string, data: any) {
    const path = `patients/${patientId}/cases/${caseId}/sessions/${sessionId}`;
    try {
      const docRef = doc(db, 'patients', patientId, 'cases', caseId, 'sessions', sessionId);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteSession(patientId: string, caseId: string, sessionId: string) {
    const path = `patients/${patientId}/cases/${caseId}/sessions/${sessionId}`;
    try {
      const docRef = doc(db, 'patients', patientId, 'cases', caseId, 'sessions', sessionId);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async getAllSessions() {
    try {
      const q = query(
        collectionGroup(db, 'sessions'),
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getVisitsByDate(date: string) {
    try {
      const q = query(
        collectionGroup(db, 'sessions'),
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(s => s.date === date)
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getTodayVisits() {
    try {
      const q = query(
        collectionGroup(db, 'sessions'),
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      const today = new Date().toISOString().split('T')[0];
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(s => s.date === today)
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getUpcomingVisits() {
    try {
      const q = query(
        collectionGroup(db, 'sessions'),
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      const today = new Date().toISOString().split('T')[0];
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(s => s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getPatientTransactions(patientId: string) {
    try {
      // Query by physioId first (which we know has an index because it's used in dashboard stats)
      const q = query(
        collectionGroup(db, 'sessions'),
        where('physioId', '==', FIXED_PHYSIO_ID)
      );
      const snapshot = await getDocs(q);
      // Filter by patientId client-side to be extra robust against missing multi-field indexes
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(s => s.patientId === patientId);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getDashboardStats() {
    try {
      // For a production app, we'd use aggregation docs or cloud functions
      // For this demo, we'll fetch recently active entities
      const patientsSnapshot = await getDocs(query(collection(db, 'patients'), where('physioId', '==', FIXED_PHYSIO_ID)));
      const activePatients = patientsSnapshot.size;

      const sessionsSnapshot = await getDocs(query(collectionGroup(db, 'sessions'), where('physioId', '==', FIXED_PHYSIO_ID)));
      
      let totalEarnings = 0;
      let pendingPayments = 0;
      let todaySessionsCount = 0;
      
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7); // YYYY-MM

      let monthlySessionsCount = 0;

      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalEarnings += data.amountPaid || 0;
        if (data.paymentStatus === 'Pending') {
          pendingPayments += (data.sessionFee || 500); // fallback fee
        }
        if (data.date === today) {
          todaySessionsCount++;
        }
        if (data.date && data.date.startsWith(currentMonth)) {
          monthlySessionsCount++;
        }
      });

      return {
        todaySessions: todaySessionsCount,
        activePatients,
        pendingPayments,
        monthlyEarnings: totalEarnings,
        totalSessions: sessionsSnapshot.size,
        monthlySessions: monthlySessionsCount
      };
    } catch (e) {
      console.error(e);
      return { todaySessions: 0, activePatients: 0, pendingPayments: 0, monthlyEarnings: 0, totalSessions: 0, monthlySessions: 0 };
    }
  }
};

// FILES & REPORTS
export const fileService = {
  async addFile(patientId: string, data: any) {
    const path = `patients/${patientId}/files`;
    console.log('fileService: Saving metadata for file to Firestore...', path);
    try {
      const docRef = await addDoc(collection(db, 'patients', patientId, 'files'), {
        ...data,
        patientId,
        uploadedBy: auth.currentUser?.uid || FIXED_PHYSIO_ID,
        uploadedAt: serverTimestamp(),
      });
      console.log('fileService: Firestore document created with ID:', docRef.id);
      return docRef;
    } catch (e) {
      console.error('fileService: addFile Error:', e);
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getFiles(patientId: string) {
    const path = `patients/${patientId}/files`;
    try {
      const q = query(collection(db, 'patients', patientId, 'files'), orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  subscribeFiles(patientId: string, callback: (files: any[]) => void) {
    const q = collection(db, 'patients', patientId, 'files'); // No orderBy here to prevent omission of null timestamps in local cache
    return onSnapshot(q, (snapshot) => {
      const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client side to handle serverTimestamp synchronization
      const sortedFiles = files.sort((a: any, b: any) => {
        const dateA = a.uploadedAt?.toMillis ? a.uploadedAt.toMillis() : (a.uploadedAt || 0);
        const dateB = b.uploadedAt?.toMillis ? b.uploadedAt.toMillis() : (b.uploadedAt || 0);
        return dateB - dateA;
      });
      callback(sortedFiles);
    }, (error) => {
      console.error('[FileService] Snapshot subscription failure:', error);
      callback([]); 
    });
  }
};
