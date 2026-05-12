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
  Share2,
  Trash2,
  Edit2,
  MoreVertical,
  Download,
  Image as ImageIcon,
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
import { generateReceiptPDF, shareOnWhatsApp, generateAppointmentMessage, generatePaymentMessage } from '../utils/sharing';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { useSearch } from '../context/SearchContext';

export const EditSession = () => {
    const { patientId, caseId, sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
      date: '',
      painScore: '5',
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
                    painScore: current.painScore?.toString() || '5',
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
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Diagnostic Update</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">Edit <span className="not-italic text-blue-900">Protocol</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <GlassCard className="!p-8 space-y-6 relative overflow-visible">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
            <div className="grid grid-cols-2 gap-4">
                <Input
                label="Protocol date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                />
                <Select
                label="Pain response"
                options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Scale`, value: `${i}` }))}
                value={formData.painScore}
                onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                />
            </div>
            
            <Textarea
                label="Intervention matrix"
                placeholder="Describe interventions..."
                value={formData.treatmentDone}
                onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                required
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                label="Ledger status"
                options={[
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Pending', value: 'Pending' },
                ]}
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                />
                <Input
                label="Unit value (₹)"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
            </div>

            <Input
                label="Next protocol sync"
                type="date"
                value={formData.nextVisitDate}
                onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
            />
          </GlassCard>

          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem] text-base" loading={loading}>
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
        const due = pending.reduce((acc: number, x: any) => acc + (x.sessionFee || 500), 0);
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
    if (!window.confirm('Are you sure you want to delete this patient profile?')) return;
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

      {/* Diagnostic Records */}
      <section className="space-y-6 px-4">
        <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Diagnostic Assets</h2>
        </div>
        
        <div className="space-y-3">
          <MedicalRecordUpload 
            patientId={patientId!} 
            onSuccess={() => {}} 
          />
          
          <FileList 
            patientId={patientId!} 
            files={files} 
            onDeleteSuccess={() => {}}
          />
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
      <div className="space-y-8 pb-10">
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Initialization</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">New Case <span className="not-italic text-blue-900">Protocol</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard className="!p-8 space-y-6 relative overflow-visible">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
            <Input
                label="Primary diagnosis"
                placeholder="e.g. Cervical Spondylosis / Post-Op ACL"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                required
            />
            <Select
                label="Clinical classification"
                options={[
                { label: 'Orthopedic Support', value: 'Orthopedic' },
                { label: 'Neurological Rehab', value: 'Neurological' },
                { label: 'Pediatric Care', value: 'Pediatric' },
                { label: 'Geriatric Maintenance', value: 'Geriatric' },
                { label: 'Sports Medicine', value: 'Sports' },
                ]}
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                label="Commencement date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                />
                <Input
                label="Valuation unit (₹)"
                type="number"
                value={formData.sessionFee}
                onChange={(e) => setFormData({ ...formData, sessionFee: e.target.value })}
                required
                />
            </div>
            <Input
                label="Targeted modules"
                type="number"
                value={formData.expectedSessions}
                onChange={(e) => setFormData({ ...formData, expectedSessions: e.target.value })}
            />
            <Textarea
                label="Assessment baseline"
                placeholder="Initial range of motion, functional limitations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </GlassCard>

          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem] text-base" loading={loading}>
            Deploy Treatment Case
          </Button>
        </form>
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
  
    const totalEarnings = sessions.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
    const pendingEarnings = sessions.filter(s => s.paymentStatus === 'Pending').reduce((acc, s) => acc + (trCase.sessionFee || 500), 0);
  
    const handleUpdateStatus = async (status: string) => {
      try {
        await caseService.updateCase(patientId!, caseId!, { status });
        setTrCase({ ...trCase, status });
        toast.success(`Case marked as ${status}`);
      } catch (err) {
        toast.error('Failed to update status');
      }
    };

    const handleMarkAsPaid = async (session: any) => {
        try {
            await sessionService.updateSession(patientId!, caseId!, session.id, { paymentStatus: 'Paid' });
            setSessions(sessions.map(s => s.id === session.id ? { ...s, paymentStatus: 'Paid' } : s));
            toast.success('Session marked as paid');
        } catch (err) {
            toast.error('Failed to update payment status');
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!window.confirm('Delete this session record?')) return;
        try {
            await sessionService.deleteSession(patientId!, caseId!, sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            toast.success('Session deleted');
        } catch (err) {
            toast.error('Failed to delete session');
        }
    }

    const handleShareReminders = () => {
        const nextSession = sessions.find(s => s.nextVisitDate);
        if (nextSession) {
            const msg = generateAppointmentMessage(trCase.patientName || 'Patient', nextSession.nextVisitDate);
            shareOnWhatsApp(trCase.patientPhone || '9111111111', msg);
        } else {
            toast.info('No upcoming visit scheduled yet');
        }
    }

    const isCompleted = patient?.status === 'Completed';

    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(`/patients/${patientId}`)} className="p-3 bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">Therapeutic Ledger</p>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">{trCase.diagnosis}</h1>
                </div>
            </div>
            {!isCompleted && (
                <button 
                  onClick={() => handleUpdateStatus(trCase.status === 'Active' ? 'Completed' : 'Active')} 
                  className={cn(
                    "p-3 rounded-[1.25rem] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.05)] active:scale-95 cursor-pointer",
                    trCase.status === 'Active' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                  )}
                >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                </button>
            )}
        </div>
  
        {/* Case Summary Cards */}
        <div className="grid grid-cols-2 gap-4 px-2">
          <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[2rem] shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)] relative overflow-hidden group">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2 relative z-10">Phase Progression</p>
            <p className="text-3xl font-black relative z-10 font-mono tracking-tighter">{sessions.length}<span className="text-base font-medium text-blue-300 ml-2 italic">/ {trCase.expectedSessions}</span></p>
            <div className="absolute -right-10 -bottom-10 bg-white/20 w-32 h-32 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Activity size={48} />
            </div>
          </div>
          <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-[0_12px_24px_-8px_rgba(15,23,42,0.4)] relative overflow-hidden group">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 relative z-10">Revenue Yield</p>
            <p className="text-xl font-black font-mono relative z-10">{formatCurrency(totalEarnings)}</p>
            <div className="absolute -right-10 -bottom-10 bg-indigo-500/20 w-32 h-32 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <Wallet size={48} />
            </div>
          </div>
          {pendingEarnings > 0 && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-2">
                <GlassCard className="!p-5 sm:!p-6 bg-gradient-to-r from-orange-50/80 to-amber-50/50 border-orange-200/60 flex items-center justify-between rounded-[2rem] relative overflow-hidden group shadow-[0_8px_30px_-4px_rgba(249,115,22,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(249,115,22,0.2)] transition-all duration-300">
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full">
                        <div className="w-14 h-14 bg-white border border-orange-100 text-orange-500 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                            <AlertCircle size={24} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-orange-600/70 tracking-[0.2em] leading-none mb-1.5">Outstanding Ledger</p>
                            <p className="text-2xl font-black text-orange-950 font-mono tracking-tight leading-none group-hover:text-orange-600 transition-colors">{formatCurrency(pendingEarnings)}</p>
                        </div>
                    </div>
                </GlassCard>
             </motion.div>
          )}
        </div>
  
        {/* Sessions Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-display">Module Logs</h2>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleShareReminders}
                    className="p-3 bg-white/60 backdrop-blur-xl border border-slate-200/50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <Share2 size={18} />
                </button>
                {!isCompleted && (
                    <button 
                        onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/add`)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.4)] cursor-pointer"
                    >
                        <Plus size={16} /> Record
                    </button>
                )}
            </div>
          </div>
   
          {sessions.length === 0 ? (
            <div className="px-2">
            <GlassCard className="flex flex-col items-center justify-center py-16 text-center space-y-6 border-2 border-dashed border-slate-200">
               <div className="w-20 h-20 bg-white/50 rounded-[2rem] flex items-center justify-center text-slate-300 shadow-sm border border-slate-100">
                 <Plus size={40} />
               </div>
               <div className="space-y-1">
                  <p className="text-slate-900 text-lg font-black tracking-tight leading-none">Timeline Latency</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em]">Clinical interventions have not yet commenced</p>
               </div>
               <Button variant="outline" onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/add`)} className="rounded-xl px-10 bg-white border-slate-200">Initialize Module 01</Button>
            </GlassCard></div>
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
                .map((session, idx) => (
                <motion.div 
                    key={session.id} 
                    className="relative pl-10"
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div className={cn(
                    "absolute left-[-2px] top-1.5 w-[22px] h-[22px] rounded-full border-[5px] border-white/80 backdrop-blur-md shadow-sm z-10 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)]",
                    session.paymentStatus === 'Paid' ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  
                  <GlassCard className="!p-6 !rounded-[2rem] group hover:border-blue-300 transition-all overflow-visible">
                    <div className="flex justify-between items-start mb-6">
                       <div className="space-y-1">
                          <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{formatDate(session.date)}</p>
                          <div className="flex items-center gap-2">
                             <Badge variant={session.paymentStatus === 'Paid' ? 'success' : 'warning'} className="py-0.5 shadow-none">
                                 {session.paymentStatus}
                             </Badge>
                             <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">{formatCurrency(session.amountPaid || 0)}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 bg-white/60 p-1.5 rounded-[1.25rem] border border-slate-200/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            {!isCompleted && (
                                <>
                                    <button 
                                        onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/${session.id}/edit`)}
                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all cursor-pointer"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all cursor-pointer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                            {session.paymentStatus === 'Paid' && (
                                <button 
                                    onClick={() => {
                                        toast.promise(Promise.resolve(generateReceiptPDF(patient || {name: 'Patient'}, session)), {
                                            loading: 'Compiling PDF...',
                                            success: 'Protocol Receipt Optimized',
                                            error: 'Compilation Error'
                                        });
                                    }}
                                    className="p-2.5 bg-blue-600 text-white rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:scale-95 cursor-pointer hover:bg-blue-700"
                                >
                                    <Download size={16} />
                                </button>
                            )}
                       </div>
                    </div>

                    <div className="bg-white/50 p-5 rounded-[1.5rem] mb-6 relative border border-white/60 shadow-[0_2px_15px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                       <p className="text-sm text-slate-700 leading-relaxed font-semibold italic text-balance">
                           <span className="text-blue-400 text-xl mr-1 tracking-tighter leading-none">"</span>
                           {session.treatmentDone || 'Session progress recorded.'}
                           <span className="text-blue-400 text-xl ml-1 tracking-tighter leading-none">"</span>
                        </p>
                       {session.paymentStatus === 'Pending' && !isCompleted && (
                           <button 
                            onClick={() => handleMarkAsPaid(session)}
                            className="absolute -top-3 right-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(249,115,22,0.4)] active:scale-95 border border-orange-400 cursor-pointer"
                           >
                            Finalize Due
                           </button>
                       )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Pain Threshold</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <span className="text-sm font-black font-mono text-slate-900 leading-none">{session.painScore}/10</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                const msg = `Session Acknowledgement. Hello ${patient?.name || 'Patient'}, modular summary recorded for ${session.date}. Amount optimized: ${formatCurrency(session.amountPaid)}. Ref: PhysioTrack System.`;
                                shareOnWhatsApp(patient?.phone || '9111111111', msg);
                            }}
                            className="flex items-center gap-2 px-5 py-3 bg-white/60 backdrop-blur-md border border-slate-200/50 text-emerald-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer"
                        >
                            <Share2 size={14} /> Distribute
                        </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
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
      painScore: '5',
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
        'Knee OA': 'Ultrasound therapy, quad strengthening, knee ROM exercises.'
      };
      setFormData({ ...formData, treatmentDone: templates[type] });
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
          amountPaid: parseFloat(formData.amountPaid),
        });
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
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Deployment</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">New <span className="not-italic text-blue-900">Protocol</span></h1>
          </div>
        </div>
  
        {/* Templates */}
        <div className="space-y-4 px-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Protocol Templates</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                {['Cervical', 'Lumbar', 'Stroke', 'ACL', 'Knee OA'].map(t => (
                    <motion.button 
                        key={t}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => applyTemplate(t)}
                        className="whitespace-nowrap px-6 py-3 bg-white/60 backdrop-blur-lg border border-slate-200/50 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all active:bg-blue-50/50 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_15px_rgba(59,130,246,0.1)]"
                    >
                        {t}
                    </motion.button>
                ))}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard className="!p-8 space-y-6 relative overflow-visible">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
            <div className="grid grid-cols-2 gap-4">
                <Input
                label="Module date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                />
                <Select
                label="Pain response"
                options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Scale`, value: `${i}` }))}
                value={formData.painScore}
                onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                />
            </div>
            
            <Textarea
                label="Intervention matrix"
                placeholder="What interventions were prioritized?"
                value={formData.treatmentDone}
                onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                required
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                label="Ledger status"
                options={[
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Pending', value: 'Pending' },
                ]}
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                />
                <Input
                label="Unit value (₹)"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
            </div>

            <Input
                label="Next protocol sync"
                type="date"
                value={formData.nextVisitDate}
                onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
            />
          </GlassCard>

          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem] text-base" loading={loading}>
            Deploy Module Entry
          </Button>
        </form>
      </div>
    );
};
