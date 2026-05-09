import React from 'react';
import { FileText, ExternalLink, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { uploadService, FileMetadata } from '../../services/uploadService';
import { Card } from '../ui/Generic';
import { cn, formatDate } from '../../utils/helpers';
import { toast } from 'sonner';

interface FileListProps {
  patientId: string;
  files: any[]; // using any for now to reflect firestore data
  onDeleteSuccess?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ patientId, files, onDeleteSuccess }) => {
  const handleDelete = async (fileId: string, storagePath: string) => {
    if (!window.confirm('Permanent Delete: Are you sure you want to remove this medical record?')) return;

    try {
      toast.loading('Removing record...', { id: 'delete-toast' });
      await uploadService.deleteFile(patientId, fileId, storagePath);
      toast.success('Record removed', { id: 'delete-toast' });
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err) {
      console.error('[FileList] Deletion failure:', err);
      toast.error('Failed to remove record', { id: 'delete-toast' });
    }
  };

  if (files.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem]">
        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
            <FileText size={32} strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
            <p className="text-slate-900 font-bold text-lg">Empty Medical Archive</p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Securely store MRI, X-ray & reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {files.map((file, idx) => (
        <motion.div 
          key={file.id} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="p-0 overflow-hidden group border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
            {/* Visual Container */}
            <div className="aspect-[16/10] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                {file.fileType?.startsWith('image/') ? (
                    <img 
                      src={file.fileUrl} 
                      alt={file.fileName} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-red-500 shadow-sm border border-slate-100">
                          <FileText size={32} />
                       </div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Clinical Report</p>
                    </div>
                )}
                
                {/* Overlay Action */}
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-all duration-500" />
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                   <button 
                      onClick={() => handleDelete(file.id, file.storagePath)} 
                      className="p-3 bg-white/90 backdrop-blur-md text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl border border-white/50"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>
            </div>

            {/* Meta Container */}
            <div className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate leading-tight mb-1.5">
                      {file.fileName || 'Untitled Specimen'}
                    </h3>
                    <div className="flex items-center gap-2.5">
                       <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <p className="text-[10px] font-bold text-slate-400 capitalize">{formatDate(file.uploadedAt)}</p>
                       </div>
                       <span className="text-slate-200 text-xs">|</span>
                       <p className="text-[10px] font-black text-slate-400 uppercase">
                        {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                       </p>
                    </div>
                </div>
                
                <button 
                  onClick={() => window.open(file.fileUrl, '_blank')} 
                  className="w-12 h-12 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center active:scale-90"
                >
                    <ExternalLink size={18} />
                </button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
