import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Calendar, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Trash2,
  Edit2,
  MoreVertical,
  ImageIcon,
  ExternalLink,
  User,
  Activity,
  CreditCard,
  Wallet
} from 'lucide-react';
import { Badge, Card, Button, Input, Textarea, Select, GlassCard } from '../components/ui/Generic';
import { patientService, caseService, sessionService, fileService } from '../services/db';
import { MedicalRecordUpload } from '../components/patient/MedicalRecordUpload';
import { FileList } from '../components/patient/FileList';
import { PhysioInvoice } from '../components/PhysioInvoice';
import { formatDate, formatCurrency, cn } from '../utils/helpers';
import { toast } from 'sonner';
import { useSearch } from '../context/SearchContext';

export const EditSession = () => {
    const { patientId, caseId, sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
      date: '',
      time: '',
      painScore: '5',
      romScore: '80',
      strengthScore: '4',
      functionScore: '6',
      treatmentDone: '',
      notes: '',
      paymentStatus: 'Paid',
      amountPaid: '500',
      nextVisitDate: ''
    });
  
    useEffect(() => {
        const fetchSession = async () => {
            if (!patientId || !caseId || !sessionId) return;
            const ss = await sessionService.getSessions(patientId, caseId);
            const current = ss?.find(s => s.id === sessionId) as any;
            if (current) {
                setFormData({
                    date: current.date,
                    time: current.time || '',
                    painScore: current.painScore?.toString() || '5',
                    romScore: current.romScore?.toString() || '80',
                    strengthScore: current.strengthScore?.toString() || '4',
                    functionScore: current.functionScore?.toString() || '6',
                    treatmentDone: current.treatmentDone || '',
                    notes: current.notes || '',
                    paymentStatus: current.paymentStatus || 'Paid',
                    amountPaid: current.amountPaid?.toString() || '500',
                    nextVisitDate: current.nextVisitDate || '',
                });
            }
            setFetching(false);
        };
        fetchSession();
    }, [patientId, caseId, sessionId]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await sessionService.updateSession(patientId!, caseId!, sessionId!, {
          ...formData,
          painScore: parseInt(formData.painScore),
          romScore: parseInt(formData.romScore),
          strengthScore: parseInt(formData.strengthScore),
          functionScore: parseInt(formData.functionScore),
          amountPaid: parseFloat(formData.amountPaid),
        });
        toast.success('Session updated');
        navigate(`/patients/${patientId}/cases/${caseId}`);
      } catch (err) {
        toast.error('Failed to update session');
      } finally {
        setLoading(false);
      }
    };
  
    if (fetching) return (
        <div className="p-10 space-y-6 px-2">
            <div className="h-10 w-24 bg-slate-100 skeleton rounded-2xl border-none" />
            <div className="h-64 bg-white/50 backdrop-blur-md border border-slate-50 rounded-[2.5rem] skeleton overflow-hidden" />
        </div>
    );

    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center gap-4 px-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Diagnostic Update</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">Edit <span className="not-italic text-indigo-600">Protocol</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Protocol date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Input
                    label="Sync Time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Pain response"
                    options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Scale`, value: `${i}` }))}
                    value={formData.painScore}
                    onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Select
                    label="Movement ROM"
                    options={Array.from({length: 11}, (_, i) => ({ label: `${i * 10}% Efficiency`, value: `${i * 10}` }))}
                    value={formData.romScore}
                    onChange={(e) => setFormData({ ...formData, romScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Muscle Strength"
                    options={[
                      { label: '0: No contraction', value: '0' },
                      { label: '1: Flicker', value: '1' },
                      { label: '2: Full ROM (Gravity Elim)', value: '2' },
                      { label: '3: Full ROM (Against G)', value: '3' },
                      { label: '4: Full ROM (Resistance)', value: '4' },
                      { label: '5: Normal', value: '5' },
                    ]}
                    value={formData.strengthScore}
                    onChange={(e) => setFormData({ ...formData, strengthScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Select
                    label="Functional Score"
                    options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Quality`, value: `${i}` }))}
                    value={formData.functionScore}
                    onChange={(e) => setFormData({ ...formData, functionScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Next protocol sync"
                    type="date"
                    value={formData.nextVisitDate}
                    onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Input
                    label="Unit value (₹)"
                    type="number"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>

              <Select
                label="Ledger status"
                options={[
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Pending', value: 'Pending' },
                ]}
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="!text-xs font-black italic tracking-tight"
              />

              <Textarea
                  label="Intervention matrix"
                  placeholder="Describe interventions..."
                  value={formData.treatmentDone}
                  onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                  required
                  className="!text-[13px] font-bold italic leading-relaxed min-h-[120px]"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-widest" loading={loading}>
            Synchronize Metrics
          </Button>
        </form>
      </div>
    );
};

export const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showBill, setShowBill] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const fetchData = async () => {
      try {
        const [p, c, s] = await Promise.all([
          patientService.getPatient(patientId),
          caseService.getCases(patientId),
          sessionService.getPatientTransactions(patientId)
        ]);
        setPatient(p);
        setCases(c || []);
        
        // Calculate stats from transactions
        const sessions = s || [];
        setTotalSessions(sessions.length);
        const pending = sessions.filter((x: any) => x.paymentStatus === 'Pending');
        setPendingSessions(pending);
        const due = pending.reduce((acc: number, x: any) => acc + (Number(x.amountPaid) || Number(x.sessionFee) || 500), 0);
        setTotalDue(due);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Real-time files
    const unsubscribe = fileService.subscribeFiles(patientId, (f) => {
      setFiles(f || []);
    });

    return () => unsubscribe();
  }, [patientId]);

  const handleDeletePatient = async () => {
    try {
      await patientService.deletePatient(patientId!);
      toast.success('Patient deleted');
      navigate('/patients');
    } catch (err) {
      toast.error('Failed to delete patient');
    }
  };

  const handleUpdateStatus = async () => {
    const newStatus = patient.status === 'Completed' ? 'Active' : 'Completed';
    try {
      await patientService.updatePatientStatus(patientId!, newStatus);
      setPatient({ ...patient, status: newStatus });
      toast.success(`Patient marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const isCompleted = patient?.status === 'Completed';

  if (loading) return (
    <div className="p-8 space-y-6 px-2">
        <div className="h-10 w-32 bg-slate-100 skeleton rounded-2xl border-none" />
        <div className="space-y-4">
            <div className="h-48 bg-slate-900 rounded-[3rem] skeleton border-none" />
            <div className="h-64 bg-slate-100 rounded-[3rem] skeleton border-none" />
        </div>
    </div>
  );
  if (!patient) return <div className="p-10 text-center text-slate-500 font-bold">Record not found</div>;

  return (
    <div className="space-y-6 pb-10 pt-2">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/patients')} 
            className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer group"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Perspective</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {!isCompleted && (
                <button 
                    onClick={() => navigate(`/patients/${patientId}/edit`)} 
                    className="w-10 h-10 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
                    title="Edit Record"
                >
                    <Edit2 size={16} />
                </button>
            )}
            <button 
                onClick={handleUpdateStatus} 
                className={cn(
                    "h-10 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 cursor-pointer border flex items-center gap-1.5",
                    isCompleted 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-indigo-50 text-indigo-600 border-indigo-100"
                )}
            >
                {isCompleted ? <CheckCircle2 size={12} /> : <Activity size={12} />}
                {isCompleted ? 'Completed' : 'Active'}
            </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 space-y-4"
      >
        {/* Simple Clinical Profile Card */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-5 flex gap-5 items-center shadow-sm relative overflow-hidden group">
            {/* Visual Identity */}
            <div className="relative shrink-0">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                    {(patient.name?.[0] || 'P').toUpperCase()}
                </div>
            </div>

            {/* Identity Details */}
            <div className="flex-1 space-y-2 min-w-0">
                <div className="space-y-0.5">
                    <h2 className="text-xl font-black tracking-tight text-slate-900 capitalize truncate leading-none">{patient.name}</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{patient.age}Y • {patient.gender}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Phone size={10} className="text-slate-300" />
                        <span className="text-[10px] font-bold truncate">{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={10} className="text-slate-300" />
                        <span className="text-[10px] font-bold truncate">{patient.address}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Clean Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pb-2">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm active:scale-95 transition-all group">
                <div className="flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Clock size={18} />
                    </div>
                    <div>
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Total Sessions</p>
                        <p className="text-2xl font-black text-slate-900 italic tracking-tight">{totalSessions}</p>
                    </div>
                </div>
            </div>
            
            <div 
                onClick={() => totalDue > 0 && setShowBill(true)}
                className={cn(
                    "bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm transition-all active:scale-95 cursor-pointer group relative",
                    totalDue > 0 ? "hover:border-rose-200" : ""
                )}
            >
                <div className="flex flex-col gap-3">
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                        totalDue > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                    )}>
                        <Wallet size={18} />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Due</p>
                        <div className="flex items-center justify-between gap-1">
                            <p className={cn("text-xl font-black italic tracking-tighter", totalDue > 0 ? "text-rose-600" : "text-slate-900")}>
                                {formatCurrency(totalDue)}
                            </p>
                            {totalDue > 0 && (
                                <div className="p-1.5 bg-slate-900 text-white rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                                    <FileText size={10} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Legal Invoice Engine Integration */}
        <PhysioInvoice
            isOpen={showBill}
            onClose={() => setShowBill(false)}
            patient={patient}
            dues={{
                total: totalDue,
                count: pendingSessions.length,
                sessions: pendingSessions
            }}
        />

        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1.5">Lifecycle Milestone</p>
                <p className="text-lg font-black text-emerald-950 leading-none italic">Protocol Successfully Completed</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Diagnostic Assets - Digital Clinical Vault */}
      <section className="space-y-6 px-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Diagnostic Assets</h2>
            </div>
            {files.length > 0 && (
                <button 
                  onClick={() => document.getElementById('medical-upload-trigger')?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                >
                    <Plus size={12} /> Add Script
                </button>
            )}
        </div>
        
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative group">
            {/* Background Texture/Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
                {files.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100 relative group-hover:scale-110 transition-transform duration-500">
                            <FileText size={32} strokeWidth={1.5} />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-900 font-black text-lg italic tracking-tight">Empty Specimen Vault</p>
                            <p className="max-w-[200px] mx-auto text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">Securely store and indexed digital clinical scripts, MRI & reports</p>
                        </div>
                        <MedicalRecordUpload 
                            patientId={patientId!} 
                            onSuccess={() => {}} 
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            {files.slice(0, 4).map((file, i) => (
                                <motion.div 
                                    key={file.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => window.open(file.fileUrl, '_blank')}
                                    className="p-3 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group/item flex flex-col gap-3"
                                >
                                    <div className="aspect-square rounded-2xl bg-white border border-slate-100 overflow-hidden relative">
                                        {file.fileType?.startsWith('image/') ? (
                                            <img src={file.fileUrl} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-indigo-500">
                                                <FileText size={24} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-slate-950/0 group-hover/item:bg-slate-950/20 flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100">
                                            <ExternalLink size={16} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{file.fileName}</p>
                                        <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">{formatDate(file.uploadedAt)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        <div className="hidden">
                           <MedicalRecordUpload 
                                patientId={patientId!} 
                                onSuccess={() => {}} 
                            />
                        </div>

                        <button 
                            onClick={() => document.getElementById('medical-upload-trigger')?.click()}
                            className="w-full py-4 border-2 border-dashed border-slate-100 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Add new diagnostic script
                        </button>
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* Treatment Protocols */}
      <section className="space-y-5 px-4 pt-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Care Cycles</h2>
           </div>
           {!isCompleted && (
              <button 
                onClick={() => navigate(`/patients/${patientId}/cases/add`)}
                className="flex items-center gap-1.5 py-1 px-3 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
              >
                <Plus size={12} strokeWidth={3} />
                Initialize
              </button>
           )}
        </div>

        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] space-y-4">
             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-100">
               <Activity size={26} strokeWidth={1.5} />
             </div>
             <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm tracking-tight">No Active Protocols</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting assessment baseline</p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {cases.map((trCase) => (
              <div 
                key={trCase.id} 
                className="group relative bg-white border border-slate-100 rounded-[2rem] p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/patients/${patientId}/cases/${trCase.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <Badge className={cn(
                         "py-0.5 text-[8px] font-black uppercase tracking-widest",
                         trCase.status === 'Active' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-400 border-slate-100"
                       )}>
                         {trCase.status}
                       </Badge>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{trCase.condition}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight tracking-tight text-lg italic truncate pr-4">{trCase.diagnosis}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 shrink-0">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};


export const CaseAdd = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      diagnosis: '',
      condition: 'Orthopedic',
      startDate: new Date().toISOString().split('T')[0],
      expectedSessions: '10',
      sessionFee: '500',
      status: 'Active',
      notes: ''
    });
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await caseService.addCase(patientId!, {
          ...formData,
          expectedSessions: parseInt(formData.expectedSessions),
          sessionFee: parseFloat(formData.sessionFee),
        });
        toast.success('Treatment case started');
        navigate(`/patients/${patientId}`);
      } catch (err) {
        toast.error('Failed to start case');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="p-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-right">
            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] leading-none mb-1">System Init</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocol 1.0</p>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-8 max-w-lg mx-auto">
          <header className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">New Case <span className="text-indigo-600 not-italic block mt-1">Foundation</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] max-w-[200px] leading-relaxed">Establish the clinical baseline for the therapeutic journey ahead.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 space-y-6 relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Diagnosis</label>
                        <Input
                            placeholder="Cervical Spondylosis / Post-Op Rehab"
                            className="!h-14 !rounded-2xl !bg-slate-50/50 border-transparent focus:border-indigo-500 transition-all text-sm font-bold"
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Classification</label>
                        <Select
                            className="!h-14 !rounded-2xl !bg-slate-50/50 border-transparent focus:border-indigo-500 transition-all text-sm font-bold"
                            options={[
                                { label: 'Orthopedic Support', value: 'Orthopedic' },
                                { label: 'Neurological Rehab', value: 'Neurological' },
                                { label: 'Pediatric Care', value: 'Pediatric' },
                                { label: 'Geriatric Maintenance', value: 'Geriatric' },
                                { label: 'Sports Medicine', value: 'Sports' },
                                { label: 'Cardiovascular & Pulmonary', value: 'Cardio' },
                                { label: 'Women\'s Health (Pelvic)', value: 'WomensHealth' },
                                { label: 'Oncology Rehabilitation', value: 'Oncology' },
                                { label: 'Post-Operative Management', value: 'PostOp' },
                                { label: 'Chronic Pain Management', value: 'PainManagement' },
                                { label: 'Others', value: 'Others' },
                            ]}
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement</label>
                            <Input
                                type="date"
                                className="!h-14 !rounded-2xl !bg-slate-50/50 border-transparent focus:border-indigo-500 transition-all text-sm font-bold w-full block"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Valuation (₹)</label>
                            <Input
                                type="number"
                                className="!h-14 !rounded-2xl !bg-slate-50/50 border-transparent focus:border-indigo-500 transition-all text-sm font-bold"
                                value={formData.sessionFee}
                                onChange={(e) => setFormData({ ...formData, sessionFee: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Module Count</label>
                        <Input
                            type="number"
                            placeholder="e.g. 10 sessions"
                            className="!h-14 !rounded-2xl !bg-slate-50/50 border-transparent focus:border-indigo-500 transition-all text-sm font-bold"
                            value={formData.expectedSessions}
                            onChange={(e) => setFormData({ ...formData, expectedSessions: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assessment Baseline</label>
                        <Textarea
                            placeholder="Pain levels, ROM, functional deficits..."
                            className="!rounded-2xl !bg-slate-50/50 border-transparent focus:border-indigo-500 transition-all text-sm font-semibold min-h-[120px]"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <Button 
                type="submit" 
                className="w-full py-6 rounded-3xl bg-slate-900 border-none hover:bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all text-xs" 
                loading={loading}
            >
                Execute Case Protocol
            </Button>
          </form>
        </div>
      </div>
    );
  };
  
export const CaseDetail = () => {
    const { patientId, caseId } = useParams();
    const navigate = useNavigate();
    const { searchQuery } = useSearch();
    const [trCase, setTrCase] = useState<any>(null);
    const [patient, setPatient] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          if (!patientId || !caseId) return;
          const [pat, cs, ss] = await Promise.all([
              patientService.getPatient(patientId),
              caseService.getCases(patientId),
              sessionService.getSessions(patientId, caseId)
          ]);
          const current = cs?.find(c => c.id === caseId);
          setPatient(pat);
          setTrCase(current);
          setSessions(ss || []);
        } catch (err) {
          console.error(err);
          toast.error('Failed to load case data');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [patientId, caseId]);
  
    if (loading) return (
        <div className="p-8 space-y-6 px-2">
            <div className="h-10 w-48 bg-slate-100 skeleton rounded-2xl border-none" />
            <div className="grid grid-cols-2 gap-4">
                <div className="h-40 bg-slate-900 rounded-[2.5rem] skeleton border-none" />
                <div className="h-40 bg-slate-100 rounded-[2.5rem] skeleton border-none" />
            </div>
        </div>
    );
    if (!trCase) return <div className="p-10 text-center text-slate-500 font-bold">Case record not found</div>;
  
    const totalEarnings = sessions.filter(s => s.paymentStatus === 'Paid').reduce((acc, s) => acc + (Number(s.amountPaid) || 0), 0);
    const pendingEarnings = sessions.filter(s => s.paymentStatus === 'Pending').reduce((acc, s) => acc + (Number(s.amountPaid) || Number(trCase?.sessionFee) || 500), 0);
  
    const handleUpdateStatus = async (status: string) => {
      try {
        await caseService.updateCase(patientId!, caseId!, { status });
        setTrCase({ ...trCase, status });
        toast.success(`Case marked as ${status}`);
      } catch (err) {
        toast.error('Failed to update status');
      }
    };

    const handleCollectAll = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        const pendingSessions = sessions.filter(s => s.paymentStatus === 'Pending');
        if (pendingSessions.length === 0) return;

        setLoading(true);
        try {
            await Promise.all(pendingSessions.map(s => 
                sessionService.updateSession(patientId!, caseId!, s.id, { 
                    paymentStatus: 'Paid',
                    amountPaid: Number(s.amountPaid) || Number(trCase?.sessionFee) || 500
                })
            ));
            setSessions(sessions.map(s => s.paymentStatus === 'Pending' ? { 
                ...s, 
                paymentStatus: 'Paid',
                amountPaid: Number(s.amountPaid) || Number(trCase?.sessionFee) || 500
            } : s));
            toast.success(`Collected all ${pendingSessions.length} dues`);
        } catch (err) {
            toast.error('Failed to collect all dues');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await sessionService.deleteSession(patientId!, caseId!, sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            toast.success('Session deleted');
        } catch (err) {
            toast.error('Failed to delete session');
        }
    }

    const isCompleted = patient?.status === 'Completed';

    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(`/patients/${patientId}`)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <div className="space-y-0.5">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Therapeutic Ledger</p>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">{trCase.diagnosis}</h1>
                </div>
            </div>
            {!isCompleted && (
                <button 
                  onClick={() => handleUpdateStatus(trCase.status === 'Active' ? 'Completed' : 'Active')} 
                  className={cn(
                    "p-3 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer border",
                    trCase.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  )}
                >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                </button>
            )}
        </div>
  
        {/* Case Summary Cards */}
        <div className="grid grid-cols-2 gap-4 px-4">
          <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="flex flex-col gap-4 relative z-10">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Activity size={20} />
                </div>
                <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Phase Progression</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter italic">
                        {sessions.length}
                        <span className="text-xs font-bold text-slate-300 not-italic ml-1">/ {Math.max(sessions.length, Number(trCase.expectedSessions || 0))}</span>
                    </p>
                </div>
                {/* Minimal Progress Bar */}
                <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((sessions.length / Math.max(sessions.length, Number(trCase.expectedSessions || 1))) * 100, 100)}%` }}
                        className="h-full bg-indigo-600"
                    />
                </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="flex flex-col gap-4 relative z-10">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Wallet size={20} />
                </div>
                <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Revenue Yield</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{formatCurrency(totalEarnings)}</p>
                </div>
                <div className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">
                    Clinical Value
                </div>
            </div>
          </div>

          {pendingEarnings > 0 && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-2">
                <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-4 group transition-all">
                    <div className="flex items-center gap-5 relative z-10 w-full">
                        <div className="w-14 h-14 bg-white border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                            <AlertCircle size={24} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] font-black uppercase text-rose-400 tracking-[0.3em] leading-none mb-1.5">Unsettled Ledger</p>
                            <p className="text-2xl font-black text-rose-950 italic tracking-tight leading-none">{formatCurrency(pendingEarnings)}</p>
                        </div>
                    </div>
                    {!isCompleted && (
                        <button 
                            type="button"
                            onClick={handleCollectAll}
                            className="w-full sm:w-auto shrink-0 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-rose-600 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Wallet size={14} />
                            Collect All Due
                        </button>
                    )}
                </div>
             </motion.div>
          )}
        </div>
  
        {/* Sessions Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-5">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-display">Module Logs</h2>
            </div>
            <div className="flex gap-3">
                {!isCompleted && (
                    <button 
                        onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/add`)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                        <Plus size={16} /> Record
                    </button>
                )}
            </div>
          </div>
   
          {sessions.length === 0 ? (
            <div className="px-4">
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
               <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 shadow-sm border border-slate-50">
                 <Plus size={40} />
               </div>
               <div className="space-y-1">
                  <p className="text-slate-900 text-lg font-black tracking-tight leading-none italic">Timeline Latency</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em]">Clinical interventions have not yet commenced</p>
               </div>
               <Button variant="outline" onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/add`)} className="rounded-2xl px-10 border-slate-200 text-[10px] font-black uppercase tracking-widest">Initialize Module 01</Button>
            </div></div>
          ) : (
            <div className="space-y-6 relative ml-4 px-2">
              <div className="absolute left-[13px] top-6 bottom-4 w-[2px] bg-gradient-to-b from-blue-500/50 via-indigo-500/20 to-transparent" />
              {sessions
                .filter(session => 
                  !searchQuery || 
                  session.treatmentDone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  session.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  formatDate(session.date).toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((session, idx) => {
                    // Helper to format 24h time string to 12h
                    const format12h = (timeStr: string) => {
                        if (!timeStr) return '';
                        try {
                            const [hours, minutes] = timeStr.split(':');
                            const h = parseInt(hours);
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            const h12 = h % 12 || 12;
                            return `${h12}:${minutes} ${ampm}`;
                        } catch (e) {
                            return timeStr;
                        }
                    };

                    return (
                        <motion.div 
                            key={`${session.id || 'sess'}-${idx}`} 
                            className="relative pl-10"
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                        >
                          <div className={cn(
                            "absolute left-[-2px] top-6 w-[22px] h-[22px] rounded-full border-[5px] border-white shadow-sm z-10 transition-all",
                            session.paymentStatus === 'Paid' ? "bg-emerald-500" : "bg-rose-500"
                          )} />
                          
                          <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] group hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-300 relative overflow-visible">
                            <div className="flex flex-col gap-6">
                                {/* Header Section */}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xl font-black text-slate-900 tracking-tighter italic leading-none">{formatDate(session.date)}</p>
                                            {session.time && (
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100/50">
                                                    {format12h(session.time)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] border",
                                                session.paymentStatus === 'Paid' 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" 
                                                    : "bg-rose-50 text-rose-600 border-rose-100/50"
                                            )}>
                                                {session.paymentStatus}
                                            </div>
                                            <span className="text-[11px] font-black text-slate-400 italic tracking-tight">Units: {formatCurrency(session.amountPaid || 0)}</span>
                                        </div>
                                    </div>

                                    {!isCompleted && (
                                        <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
                                            <button 
                                                onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/${session.id}/edit`)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-90"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSession(session.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-90"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="space-y-4">
                                    <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] group-hover:bg-indigo-50/10 transition-colors duration-500">
                                        <p className="text-[13px] text-slate-700 leading-relaxed font-bold italic text-balance">
                                            {session.treatmentDone || 'Protocol progress recorded.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                                            <div className="space-y-1">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Pain</p>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    <span className="text-[11px] font-black text-slate-900 italic tracking-tighter leading-none">{session.painScore}/10</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 border-l border-slate-100 pl-4">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">ROM</p>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="text-[11px] font-black text-slate-900 italic tracking-tighter leading-none">{session.romScore}% Efficiency</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 border-l border-slate-100 pl-4">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Strength</p>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[11px] font-black text-slate-900 italic tracking-tighter leading-none">{session.strengthScore}/5 MMT</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 border-l border-slate-100 pl-4">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Function</p>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    <span className="text-[11px] font-black text-slate-900 italic tracking-tighter leading-none">{session.functionScore}/10 Qual</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                          </div>
                        </motion.div>
                    );
                })}
            </div>
          )}
        </div>
      </div>
    );
};

export const SessionAdd = () => {
    const { patientId, caseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [patient, setPatient] = useState<any>(null);
    const [trCase, setTrCase] = useState<any>(null);
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      painScore: '5',
      romScore: '80', // Range of Motion %
      strengthScore: '4', // MMT Scale 0-5
      functionScore: '6', // ADL/Functional score 0-10
      treatmentDone: '',
      notes: '',
      paymentStatus: 'Paid',
      amountPaid: '500',
      nextVisitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchContext = async () => {
            if (!patientId || !caseId) return;
            const [p, c] = await Promise.all([
                patientService.getPatient(patientId),
                caseService.getCases(patientId)
            ]);
            setPatient(p);
            const currentCase = c?.find((x: any) => x.id === caseId) as any;
            setTrCase(currentCase);
            if (currentCase?.sessionFee) {
                setFormData(prev => ({ ...prev, amountPaid: currentCase.sessionFee.toString() }));
            }
        };
        fetchContext();
    }, [patientId, caseId]);
  
    const applyTemplate = (type: string) => {
      const templates: Record<string, string> = {
        'Cervical': 'Cervical mobilization, IFT for 10 mins, neck isometrics, postural correction.',
        'Lumbar': 'Back extension exercises, TENS, core strengthening, pelvic tilts.',
        'Stroke': 'Gait training, weight bearing, upper limb ROM, mirror therapy.',
        'ACL': 'Quad sets, knee mobilization, patellar gliding, SLRs.',
        'Knee OA': 'Ultrasound therapy, quad strengthening, knee ROM exercises.',
        'Frozen Shoulder': 'Pendulum exercises, pulley work, rhythmic initiation, heat therapy.',
        'Ankle Sprain': 'Balance board training, proprioception drills, theraband resistance, ice.',
        'Plantar Fasciitis': 'Taping, calf stretching, intrinsic foot muscle exercises, ultrasound.',
        'Tennis Elbow': 'Eccentric loading, forearm massage, grip strengthening, bracing guidance.',
        'Carpal Tunnel': 'Nerve gliding, wrist splinting, ergonomical assessment, tendon glides.',
        'Back Pain': 'Mc素质zie protocols, aquatic therapy, neural mobilization, heat/cold cycles.'
      };
      setFormData({ ...formData, treatmentDone: templates[type] || '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await sessionService.addSession(patientId!, caseId!, {
          ...formData,
          patientName: patient?.name || 'Patient',
          diagnosis: trCase?.diagnosis || 'Treatment',
          sessionFee: trCase?.sessionFee || 500,
          painScore: parseInt(formData.painScore),
          romScore: parseInt(formData.romScore),
          strengthScore: parseInt(formData.strengthScore),
          functionScore: parseInt(formData.functionScore),
          amountPaid: parseFloat(formData.amountPaid),
        });
        
        const existingSessions = await sessionService.getSessions(patientId!, caseId!);
        const newTotal = existingSessions.length;
        if (trCase && newTotal > Number(trCase.expectedSessions || 0)) {
          await caseService.updateCase(patientId!, caseId!, { expectedSessions: newTotal.toString() });
        }

        toast.success('Session recorded');
        navigate(`/patients/${patientId}/cases/${caseId}`);
      } catch (err) {
        toast.error('Failed to save session');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center gap-4 px-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Deployment</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">New <span className="not-italic text-indigo-600">Protocol</span></h1>
          </div>
        </div>
  
        {/* Templates */}
        <div className="space-y-4 px-4">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Protocol Templates</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                {['Cervical', 'Lumbar', 'Stroke', 'ACL', 'Knee OA', 'Frozen Shoulder', 'Ankle Sprain', 'Back Pain'].map(t => (
                    <motion.button 
                        key={t}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => applyTemplate(t)}
                        className="whitespace-nowrap px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:bg-indigo-50/50 cursor-pointer shadow-sm"
                    >
                        {t}
                    </motion.button>
                ))}
            </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Module date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Input
                    label="Sync Time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Pain response"
                    options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Scale`, value: `${i}` }))}
                    value={formData.painScore}
                    onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Select
                    label="Movement ROM"
                    options={Array.from({length: 11}, (_, i) => ({ label: `${i * 10}% Efficiency`, value: `${i * 10}` }))}
                    value={formData.romScore}
                    onChange={(e) => setFormData({ ...formData, romScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Muscle Strength"
                    options={[
                      { label: '0: No contraction', value: '0' },
                      { label: '1: Flicker', value: '1' },
                      { label: '2: Full ROM (Gravity Elim)', value: '2' },
                      { label: '3: Full ROM (Against G)', value: '3' },
                      { label: '4: Full ROM (Resistance)', value: '4' },
                      { label: '5: Normal', value: '5' },
                    ]}
                    value={formData.strengthScore}
                    onChange={(e) => setFormData({ ...formData, strengthScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Select
                    label="Functional Score"
                    options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Quality`, value: `${i}` }))}
                    value={formData.functionScore}
                    onChange={(e) => setFormData({ ...formData, functionScore: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Next protocol sync"
                    type="date"
                    value={formData.nextVisitDate}
                    onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
                  <Input
                    label="Unit value (₹)"
                    type="number"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    className="!text-xs font-black italic tracking-tight"
                  />
              </div>

              <Select
                label="Ledger status"
                options={[
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Pending', value: 'Pending' },
                ]}
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="!text-xs font-black italic tracking-tight"
              />

              <Textarea
                  label="Intervention matrix"
                  placeholder="What interventions were prioritized?"
                  value={formData.treatmentDone}
                  onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                  required
                  className="!text-[13px] font-bold italic leading-relaxed min-h-[120px]"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-widest" loading={loading}>
            Deploy Module Entry
          </Button>
        </form>
      </div>
    );
};
