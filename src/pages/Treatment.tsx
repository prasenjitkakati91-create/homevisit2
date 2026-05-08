import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { patientService, caseService, sessionService } from '../services/db';
import { FileUpload } from '../components/ui/FileUpload';
import { formatDate, formatCurrency, cn } from '../utils/helpers';
import { generateReceiptPDF, shareOnWhatsApp, generateAppointmentMessage, generatePaymentMessage } from '../utils/sharing';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

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
        <div className="p-10 space-y-6">
            <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-2xl" />
            <div className="h-64 bg-white border border-slate-50 rounded-[2.5rem] animate-pulse" />
        </div>
    );

    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Diagnostic Update</p>
            <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none italic">Edit <span className="not-italic">Protocol</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <Card className="p-8 space-y-6">
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
          </Card>

          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem]" loading={loading}>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!patientId) return;
        const p = await patientService.getPatient(patientId);
        const c = await caseService.getCases(patientId);
        setPatient(p);
        setCases(c || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const isCompleted = patient?.status === 'Completed';

  if (loading) return (
    <div className="p-8 space-y-6">
        <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="space-y-4">
            <div className="h-48 bg-slate-900 rounded-[3rem] animate-pulse" />
            <div className="h-64 bg-white rounded-[3rem] animate-pulse" />
        </div>
    </div>
  );
  if (!patient) return <div className="p-10 text-center text-slate-500 font-bold">Record not found</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patients')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Record Index</p>
            <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none italic">Clinical <span className="not-italic">Context</span></h1>
          </div>
        </div>
        <div className="flex gap-2">
            {!isCompleted && (
                <>
                    <button 
                        onClick={() => navigate(`/patients/${patientId}/edit`)} 
                        className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <Edit2 size={18} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={handleDeletePatient} 
                        className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-red-600 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Patient Profile Widget - Dark UI for Premium feel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-2"
      >
        <div className="relative p-7 rounded-[3rem] bg-slate-900 text-white overflow-hidden shadow-2xl shadow-slate-200">
           <div className="relative z-10 flex flex-col gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-16 h-16 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10 flex items-center justify-center font-black text-2xl text-white">
                      {patient.name?.[0] || 'P'}
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black font-display tracking-tight leading-none italic">{patient.name}</h2>
                      <div className="flex gap-2">
                         <Badge className="bg-white/5 text-white/60 border-white/5 text-[9px] uppercase tracking-widest leading-none py-1.5">{patient.gender}</Badge>
                         <Badge className="bg-white/5 text-white/60 border-white/5 text-[9px] uppercase tracking-widest leading-none py-1.5">{patient.age}Y</Badge>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <a href={`tel:${patient.phone}`} className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                       <Phone size={16} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                       <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">Contact</p>
                       <p className="text-xs font-bold text-white/90 truncate">{patient.phone}</p>
                    </div>
                 </a>
                 <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                       <MapPin size={16} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                       <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">Location</p>
                       <p className="text-xs font-bold text-white/90 truncate">{patient.address}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Decorative elements */}
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl opacity-50" />
           <div className="absolute left-1/4 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-30" />
        </div>
      </motion.div>

      {/* Diagnostic Records */}
      <section className="space-y-4 px-2">
        <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-blue-600 rounded-full" />
            <h2 className="text-xs font-black text-slate-950 uppercase tracking-widest leading-none">Digital Archive</h2>
        </div>
        
        <GlassCard className="p-6 border-dashed border-slate-200">
            <FileUpload 
            path={`patients/${patientId}/reports`} 
            onUploadComplete={async (url) => {
                const reports = [...(patient.reports || []), { url, date: new Date().toISOString() }];
                await patientService.updatePatient(patientId!, { reports });
                setPatient({ ...patient, reports });
            }} 
            />
        </GlassCard>
        
        <div className="grid grid-cols-1 gap-3">
          {patient.reports?.map((report: any, idx: number) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="p-4 group border-slate-50/50">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-100/50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <FileText size={18} />
                          </div>
                          <div className="space-y-0.5">
                              <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest leading-none">Report R{idx + 1}</span>
                              <p className="text-[9px] font-bold text-slate-400">{formatDate(report.date)}</p>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => window.open(report.url, '_blank')} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100/50">
                              <ExternalLink size={14} />
                          </button>
                      </div>
                  </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Treatment Protocols */}
      <section className="space-y-4 px-2 pt-2">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-600 rounded-full" />
                <h2 className="text-xs font-black text-slate-950 uppercase tracking-widest leading-none">Treatment cycles</h2>
           </div>
           {!isCompleted && (
              <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-blue-600 p-0 hover:bg-transparent" onClick={() => navigate(`/patients/${patientId}/cases/add`)}>
                <Plus size={14} className="mr-1" /> New Case
              </Button>
           )}
        </div>

        {cases.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-dashed border-slate-200">
             <div className="w-14 h-14 bg-white/50 rounded-2xl flex items-center justify-center text-slate-200 border border-white">
               <Activity size={26} />
             </div>
             <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm tracking-tight text-center">No Active Cycles</p>
                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest text-center">Baseline not established</p>
             </div>
             <Button variant="outline" size="sm" onClick={() => navigate(`/patients/${patientId}/cases/add`)} className="rounded-xl mt-2 bg-white border-slate-200">Initialize Case</Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {cases.map((trCase) => (
              <Card 
                key={trCase.id} 
                className="p-5 group hover:border-blue-100 transition-all border-slate-50/50"
                onClick={() => navigate(`/patients/${patientId}/cases/${trCase.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-950 group-hover:text-blue-600 transition-colors leading-tight tracking-tight text-base italic">{trCase.diagnosis}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={trCase.status === 'Active' ? 'success' : 'neutral'}>
                        {trCase.status}
                      </Badge>
                      <Badge variant="info" className="bg-slate-100 text-slate-400 border-none">{trCase.condition}</Badge>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-105 transition-all">
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600" />
                  </div>
                </div>
              </Card>
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
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Initialization</p>
            <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none italic">New Case <span className="not-italic">Protocol</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 space-y-6">
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
          </Card>

          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem]" loading={loading}>
            Deploy Treatment Case
          </Button>
        </form>
      </div>
    );
  };
  
export const CaseDetail = () => {
    const { patientId, caseId } = useParams();
    const navigate = useNavigate();
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
        <div className="p-8 space-y-6">
            <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
                <div className="h-40 bg-slate-900 rounded-[2.5rem] animate-pulse" />
                <div className="h-40 bg-slate-100 rounded-[2.5rem] animate-pulse" />
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
                <button onClick={() => navigate(`/patients/${patientId}`)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Therapeutic Ledger</p>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">{trCase.diagnosis}</h1>
                </div>
            </div>
            {!isCompleted && (
                <button 
                  onClick={() => handleUpdateStatus(trCase.status === 'Active' ? 'Completed' : 'Active')} 
                  className={cn(
                    "p-3 rounded-2xl transition-all shadow-sm active:scale-95",
                    trCase.status === 'Active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                  )}
                >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                </button>
            )}
        </div>
  
        {/* Case Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 bg-blue-600 text-white border-none shadow-xl shadow-blue-200 relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 mb-2 relative z-10">Phase Progression</p>
            <p className="text-3xl font-black relative z-10">{sessions.length}<span className="text-base font-medium text-white/50 ml-2 italic">/ {trCase.expectedSessions}</span></p>
            <div className="absolute -right-4 -bottom-4 bg-white/10 w-20 h-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          </Card>
          <Card className="p-6 bg-slate-950 text-white border-none shadow-xl shadow-slate-900/20 relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 relative z-10">Revenue Yield</p>
            <p className="text-xl font-black font-mono relative z-10">{formatCurrency(totalEarnings)}</p>
            <div className="absolute -right-4 -bottom-4 bg-blue-500/10 w-20 h-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          </Card>
          {pendingEarnings > 0 && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-2">
                <Card className="p-5 sm:p-6 bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-200/60 flex items-center justify-between rounded-[1.75rem] relative overflow-hidden group shadow-[0_8px_30px_-4px_rgba(249,115,22,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(249,115,22,0.2)] transition-all duration-300">
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full">
                        <div className="w-14 h-14 bg-white border border-orange-100 text-orange-500 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                            <AlertCircle size={24} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-orange-600/70 tracking-[0.2em] leading-none mb-1.5">Outstanding Ledger</p>
                            <p className="text-2xl font-black text-orange-950 font-mono tracking-tight leading-none group-hover:text-orange-600 transition-colors">{formatCurrency(pendingEarnings)}</p>
                        </div>
                    </div>
                </Card>
             </motion.div>
          )}
        </div>
  
        {/* Sessions Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <h2 className="text-xs font-bold text-slate-950 uppercase tracking-[0.15em] font-display">Module Logs</h2>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleShareReminders}
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all medical-shadow active:scale-95"
                >
                    <Share2 size={18} />
                </button>
                {!isCompleted && (
                    <button 
                        onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/add`)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-950 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                        <Plus size={16} /> Record
                    </button>
                )}
            </div>
          </div>
  
          {sessions.length === 0 ? (
            <Card className="bg-slate-50 border-none flex flex-col items-center justify-center py-20 text-center space-y-6 border-2 border-dashed border-slate-200">
               <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 shadow-sm border border-slate-100">
                 <Plus size={40} />
               </div>
               <div className="space-y-1">
                  <p className="text-slate-900 text-lg font-black tracking-tight">Timeline Latency</p>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.15em]">Clinical interventions have not yet commenced for this cycle</p>
               </div>
               <Button variant="primary" onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/add`)} className="rounded-xl px-10">Initialize Module 01</Button>
            </Card>
          ) : (
            <div className="space-y-6 relative ml-4">
              <div className="absolute left-[7px] top-6 bottom-4 w-[2px] bg-slate-200/50" />
              {sessions.map((session, idx) => (
                <motion.div 
                    key={session.id} 
                    className="relative pl-10"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                >
                  <div className={cn(
                    "absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-2 z-10 transition-all",
                    session.paymentStatus === 'Paid' ? "bg-emerald-500 ring-emerald-100" : "bg-orange-500 ring-orange-100"
                  )} />
                  
                  <Card className="hover:border-blue-400 bg-white p-6 rounded-[2rem] transition-all group overflow-visible">
                    <div className="flex justify-between items-start mb-6">
                       <div className="space-y-1">
                          <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{formatDate(session.date)}</p>
                          <div className="flex items-center gap-2">
                             <Badge variant={session.paymentStatus === 'Paid' ? 'success' : 'warning'} className="py-0.5">
                                 {session.paymentStatus}
                             </Badge>
                             <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest">{formatCurrency(session.amountPaid || 0)}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 medical-shadow">
                            {!isCompleted && (
                                <>
                                    <button 
                                        onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/${session.id}/edit`)}
                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"
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
                                    className="p-2.5 bg-blue-600 text-white rounded-xl transition-all medical-shadow active:scale-95"
                                >
                                    <Download size={16} />
                                </button>
                            )}
                       </div>
                    </div>

                    <div className="bg-slate-50/80 p-5 rounded-[1.5rem] mb-6 relative border border-slate-100/50 backdrop-blur-sm">
                       <p className="text-sm text-slate-600 leading-relaxed font-semibold italic text-balance">
                           <span className="text-blue-500 text-lg mr-1 tracking-tighter">"</span>
                           {session.treatmentDone || 'Session progress recorded.'}
                           <span className="text-blue-500 text-lg ml-1 tracking-tighter">"</span>
                        </p>
                       {session.paymentStatus === 'Pending' && !isCompleted && (
                           <button 
                            onClick={() => handleMarkAsPaid(session)}
                            className="absolute -top-3 right-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl shadow-lg shadow-orange-500/30 active:scale-95 border border-orange-400"
                           >
                            Finalize Due
                           </button>
                       )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-6">
                            <div className="space-y-0.5">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Pain Threshold</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="text-sm font-black font-mono text-slate-900">{session.painScore}/10</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                const msg = `Session Acknowledgement. Hello ${patient?.name || 'Patient'}, modular summary recorded for ${session.date}. Amount optimized: ${formatCurrency(session.amountPaid)}. Ref: PhysioTrack System.`;
                                shareOnWhatsApp(patient?.phone || '9111111111', msg);
                            }}
                            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95 medical-shadow"
                        >
                            <Share2 size={14} /> Distribute
                        </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Global Action Fab */}
        {!isCompleted && (
            <button 
                className="fixed bottom-28 right-8 w-16 h-16 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-900/40 z-50 active:scale-90 transition-all border border-white/10 md:hidden"
                onClick={() => navigate(`/patients/${patientId}/cases/${caseId}/sessions/add`)}
            >
                <Plus size={32} />
            </button>
        )}
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
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Deployment</p>
            <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none italic">New <span className="not-italic">Protocol</span></h1>
          </div>
        </div>
  
        {/* Templates */}
        <div className="space-y-4 px-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Protocol Templates</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                {['Cervical', 'Lumbar', 'Stroke', 'ACL', 'Knee OA'].map(t => (
                    <motion.button 
                        key={t}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => applyTemplate(t)}
                        className="whitespace-nowrap px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all active:bg-blue-50"
                    >
                        {t}
                    </motion.button>
                ))}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 space-y-6">
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
          </Card>

          <Button type="submit" variant="primary" className="w-full py-6 rounded-[2rem]" loading={loading}>
            Deploy Module Entry
          </Button>
        </form>
      </div>
    );
};
