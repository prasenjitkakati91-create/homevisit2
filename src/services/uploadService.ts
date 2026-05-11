import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

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
   * Reads a file and converts it to a Base64 Data URL, saving directly to Firestore.
   * This avoids the need for a paid Firebase Storage plan.
   * @param patientId The ID of the patient
   * @param originalFile The File object from input
   * @param onProgress Callback for upload progress
   */
  uploadFile: async (patientId: string, originalFile: File, onProgress?: (progress: number) => void): Promise<FileMetadata> => {
    const user = auth.currentUser;
    const uid = user?.uid || 'anonymous_physio';
    const FIXED_PHYSIO_ID = 'default_physio';
    
    // 1. Basic Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(originalFile.type)) {
      throw new Error('Unsupported file type. Only PDF and Images (JPG, PNG) are allowed.');
    }

    // Since we are storing directly in Firestore, limit file size strictly to ~700KB to stay under 1MB doc limit
    const MAX_SIZE = 750 * 1024; // 750KB
    if (originalFile.size > MAX_SIZE) {
      throw new Error('File too large for the Free Plan. Maximum size is 700KB. Images will auto-compress, but PDFs must be small.');
    }

    if (onProgress) onProgress(10); // Start progress

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          // Map file read progress to 10-90%
          const progress = 10 + Math.round((event.loaded / event.total) * 80);
          onProgress(progress);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file for archiving.'));
      };

      reader.onload = async (event) => {
        const base64DataUrl = event.target?.result as string;
        
        if (!base64DataUrl) {
          return reject(new Error('Failed to encode file.'));
        }

        // Just in case the base64 string exceeds Firestore limits (approx 1MB)
        if (base64DataUrl.length > 1000000) {
           return reject(new Error('Encoded file is too large to fit in the free database tier. Try a smaller file.'));
        }

        if (onProgress) onProgress(95); // Wait for database write

        try {
          const timestamp = Date.now();
          const safeName = originalFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          const storagePath = `patient-files/${patientId}/${timestamp}-${safeName}`; // Kept for backwards compatibility

          const fileData: Omit<FileMetadata, 'id'> = {
            fileName: originalFile.name,
            fileUrl: base64DataUrl, // Store base64 directly!!
            fileType: originalFile.type,
            fileSize: originalFile.size,
            uploadedAt: serverTimestamp(),
            storagePath: storagePath,
            uploadedBy: uid,
            // @ts-ignore - including extra field for rules matching
            physioId: FIXED_PHYSIO_ID
          };

          console.log('[UploadService] Saving record directly to Ledger (Firebase Free Tier)...');
          const docRef = await addDoc(collection(db, 'patients', patientId, 'files'), fileData);
          
          if (onProgress) onProgress(100);
          console.log('[UploadService] Archive verified:', docRef.id);
          resolve({ id: docRef.id, ...fileData });
          
        } catch (error: any) {
          console.error('[UploadService] Ledger commitment failed:', error);
          if (error.code === 'resource-exhausted') {
             reject(new Error('File is too large for the database. Try a smaller file.'));
          } else if (error.message?.includes('permission')) {
             reject(new Error('Database Access Denied: You do not have permission to modify this record.'));
          } else {
             reject(new Error('Database error while saving file.'));
          }
        }
      };

      // Read as Data URL (Base64)
      reader.readAsDataURL(originalFile);
    });
  },

  /**
   * Deletes a file from Firestore Base64 Storage
   */
  deleteFile: async (patientId: string, fileId: string, storagePath: string) => {
    try {
      console.log('[UploadService] Deleting metadata and base64 payload from Firestore:', fileId);
      // Delete from Firestore
      const docRef = doc(db, 'patients', patientId, 'files', fileId);
      await deleteDoc(docRef);
      
      return true;
    } catch (err) {
      console.error('[UploadService] Deletion failure:', err);
      throw err;
    }
  }
};
