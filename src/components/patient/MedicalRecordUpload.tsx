import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../ui/Generic';
import { uploadService } from '../../services/uploadService';
import { cn, compressImage } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setError(null);

    if (!user) {
      toast.error('Session not initialized');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);
      
      const prepareToast = toast.loading(`Preparing ${file.name}...`, { id: 'upload-status' });

      // Compression logic
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImage(file);
        } catch (e) {
          console.warn('Compression skipped', e);
        }
      }
      
      toast.loading(`Archiving ${fileToUpload.name}... 0%`, { id: 'upload-status' });
      
      await uploadService.uploadFile(patientId, fileToUpload, (p) => {
        const roundedProgress = Math.round(p);
        setProgress(roundedProgress);
        // Throttle toast updates to avoid UI lag
        if (roundedProgress % 5 === 0 || roundedProgress === 100) {
          toast.loading(`Archiving ${fileToUpload.name}... ${roundedProgress}%`, { id: 'upload-status' });
        }
      });
      
      toast.success('Document archived successfully', { id: 'upload-status' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('[MedicalRecordUpload] Error:', err);
      const msg = err.message || 'Transmission failure';
      setError(msg);
      toast.error(msg, { id: 'upload-status' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleUpload(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  if (authLoading) return <Skeleton className="h-48 w-full rounded-[2rem]" />;

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept=".pdf,image/jpeg,image/png,image/jpg"
        disabled={isUploading}
      />

      <motion.div
        layout
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative min-h-[160px] border-2 border-dashed rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center text-center group",
          dragActive ? "border-blue-500 bg-blue-50/50 scale-[0.99] shadow-inner" : "border-slate-100 hover:border-blue-200 bg-white hover:shadow-xl hover:shadow-blue-500/5",
          isUploading ? "cursor-wait" : "cursor-pointer",
          error && !isUploading && "border-red-100 bg-red-50/30"
        )}
      >
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xs space-y-6"
            >
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-700">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                  Synchronizing with Vault...
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={cn(
                "w-16 h-16 mx-auto rounded-3xl flex items-center justify-center transition-all duration-300",
                error ? "bg-red-50 text-red-400" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:scale-110 group-hover:rotate-6"
              )}>
                <Upload size={28} />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-slate-900 font-bold">
                  {error ? 'Upload Failed' : 'Add Medical Records'}
                </h4>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] leading-none",
                  error ? "text-red-400" : "text-slate-400"
                )}>
                  {error ? error : 'PDF, JPG, PNG • MAX 10MB'}
                </p>
              </div>

              {!error && (
                <div className="pt-2">
                  <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    Click to browse
                  </span>
                </div>
              )}
              
              {error && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setError(null);
                  }}
                  className="text-[10px] font-bold text-red-500 hover:underline underline-offset-4"
                >
                  Clear error and try again
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
