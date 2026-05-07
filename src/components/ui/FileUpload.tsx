import React, { useState } from 'react';
import { Upload, X, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { storageService } from '../../services/db';
import { Button } from './Generic';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  path: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, path }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large (max 5MB)');
      return;
    }

    setUploading(true);
    try {
      const url = await storageService.uploadFile(path, file, (p) => setProgress(p));
      onUploadComplete(url);
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        disabled={uploading}
      />
      <label
        htmlFor="file-upload"
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
          uploading ? "bg-slate-50 border-blue-200" : "bg-white border-slate-100 hover:border-blue-200"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center space-y-3">
             <Loader2 className="animate-spin text-blue-600" size={32} />
             <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{Math.round(progress)}% Uploading</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="text-slate-300" size={32} />
            <p className="text-sm font-bold text-slate-500">Upload Reports</p>
            <p className="text-[10px] text-slate-400">PDF, JPG up to 5MB</p>
          </div>
        )}
      </label>
    </div>
  );
};

import { cn } from '../../utils/helpers';
