import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { storage, db, auth } from '../firebase/config';

export interface FileMetadata {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: any;
  storagePath: string;
  uploadedBy: string | undefined;
}

export const uploadService = {
  /**
   * Uploads a file to Firebase Storage and saves metadata to Firestore
   * @param patientId The ID of the patient
   * @param originalFile The File object from input
   * @param onProgress Callback for upload progress
   */
  uploadFile: async (patientId: string, originalFile: File, onProgress?: (progress: number) => void): Promise<FileMetadata> => {
    const user = auth.currentUser;
    const uid = user?.uid || 'anonymous_physio';
    
    // 1. Basic Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(originalFile.type)) {
      throw new Error('Unsupported file type. Only PDF and Images (JPG, PNG) are allowed.');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (originalFile.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    // 2. Prepare Storage Path & File Object
    const timestamp = Date.now();
    const safeName = originalFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `patient-files/${patientId}/${timestamp}-${safeName}`;
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: originalFile.type || 'application/octet-stream',
      customMetadata: {
        patientId,
        uploadedBy: uid,
        originalName: originalFile.name
      }
    };

    // 3. Start Resumable Upload
    return new Promise((resolve, reject) => {
      console.log('[UploadService] STARTING TASK:', {
          path: storagePath,
          size: originalFile.size,
          type: originalFile.type || 'unknown'
      });
      
      // Ensure we hit 0% immediately for UI feedback
      if (onProgress) onProgress(0);

      const uploadTask = uploadBytesResumable(storageRef, originalFile, metadata);

      // Diagnostic: Monitor state changes manually
      const heartbeat = setInterval(() => {
          console.log('[UploadService] Task State Heartbeat:', uploadTask.snapshot.state, `${uploadTask.snapshot.bytesTransferred}/${uploadTask.snapshot.totalBytes}`);
      }, 5000);

      // 120s timeout detection as requested for stability
      const timeoutId = setTimeout(() => {
        clearInterval(heartbeat);
        console.error('[UploadService] Sync session timed out');
        uploadTask.cancel();
        reject(new Error('Archive synchronization timed out. Check connection or try a smaller file.'));
      }, 120000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.totalBytes > 0) ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
          console.log(`[UploadService] STATE_CHANGED: ${snapshot.state} - ${Math.round(progress)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes})`);
          if (onProgress) onProgress(progress);
        },
        (error) => {
          clearInterval(heartbeat);
          clearTimeout(timeoutId);
          console.error('[UploadService] STORAGE FAIL:', error.code, error.message, error);
          
          if (error.code === 'storage/canceled') {
            reject(new Error('Synchronization session was interrupted or timed out.'));
          } else if (error.code === 'storage/unauthorized') {
            reject(new Error('Security Block: You do not have permission to sync with this archive. Please ensure Storage is enabled in Firebase Console.'));
          } else {
            reject(new Error(`Storage error: ${error.message}`));
          }
        },
        async () => {
          clearInterval(heartbeat);
          clearTimeout(timeoutId);
          try {
            console.log('[UploadService] Storage verified, finalizing clinical ledger entry...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const fileData: Omit<FileMetadata, 'id'> = {
              fileName: originalFile.name,
              fileUrl: downloadURL,
              fileType: originalFile.type,
              fileSize: originalFile.size,
              uploadedAt: serverTimestamp(),
              storagePath: storagePath,
              uploadedBy: uid
            };

            console.log('[UploadService] Committing entry to Patient Ledger...');
            const docRef = await addDoc(collection(db, 'patients', patientId, 'files'), fileData);
            
            console.log('[UploadService] Full synchronization verified clinical archive:', docRef.id);
            resolve({ id: docRef.id, ...fileData });
          } catch (err: any) {
            console.error('[UploadService] Ledger commitment failed:', err);
            reject(new Error(`Ledger error: ${err.message || 'Database unavailable'}`));
          }
        }
      );
    });
  },

  /**
   * Deletes a file from both Storage and Firestore
   */
  deleteFile: async (patientId: string, fileId: string, storagePath: string) => {
    try {
      console.log('[UploadService] Deleting file from storage:', storagePath);
      // 1. Delete from Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef).catch(err => {
        // If file is missing in storage, still try to delete firestore doc
        console.warn('[UploadService] Storage deletion warning (likely already gone):', err);
      });
      
      console.log('[UploadService] Deleting metadata from Firestore:', fileId);
      // 2. Delete from Firestore
      const docRef = doc(db, 'patients', patientId, 'files', fileId);
      await deleteDoc(docRef);
      
      return true;
    } catch (err) {
      console.error('[UploadService] Full deletion failure:', err);
      throw err;
    }
  }
};
