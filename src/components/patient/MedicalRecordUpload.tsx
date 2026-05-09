import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadService } from '../../services/uploadService';
import { cn } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface MedicalRecordUploadProps {
  patientId: string;
  onSuccess?: () => void;
}

export const MedicalRecordUpload: React.FC<MedicalRecordUploadProps> = ({ patientId, onSuccess }) => {
  const { user, loading: authLoading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (!user) {
      toast.error('Clinical session not initialized. Please wait.', { id: 'upload-status' });
      return;
    }

    if (!patientId) {
      toast.error('Patient context lost. Please refresh clinical dashboard.', { id: 'upload-status' });
      return;
    }

    // Diagnostic Logging
    console.log('[MedicalRecordUpload] Data Trace:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      isBlob: file instanceof Blob,
      isFile: file instanceof File
    });

    try {
      console.log(`[MedicalRecordUpload] Initiating vault transfer: ${file.name}`);
      setIsUploading(true);
      setProgress(0);
      
      const toastId = toast.loading(`Archiving ${file.name}... 0%`, { id: 'upload-status' });
      
      await uploadService.uploadFile(patientId, file, (p) => {
        setProgress(p);
        toast.loading(`Archiving ${file.name}... ${Math.round(p)}%`, { id: 'upload-status' });
      });
      
      console.log('[MedicalRecordUpload] Archive verified');
      toast.success('Document secured in clinical vault', { id: 'upload-status' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('[MedicalRecordUpload] Synchronization failure:', err);
      toast.error(err.message || 'Archive synchronization failed', { id: 'upload-status' });
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (authLoading) return <div className="h-40 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex items-center justify-center animate-pulse" />;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept=".pdf,image/jpeg,image/png,image/jpg"
        disabled={isUploading}
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-[2.5rem] p-8 transition-all cursor-pointer overflow-hidden",
          dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <AnimatePresence mode="wait">
          {!isUploading ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                <Upload size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold">Archive Medical Records</p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none">PDF, JPG, PNG • MAX 10MB</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center space-y-6 py-4"
            >
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-slate-100"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
                    className="text-blue-600 transition-all duration-300 stroke-round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-[10px]">
                  Archiving... {Math.round(progress)}%
                </p>
                <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 rounded-full" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
