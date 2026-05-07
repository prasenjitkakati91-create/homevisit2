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
  Activity
} from 'lucide-react';
import { Badge, Card, Button, Input, Textarea, Select } from '../components/ui/Generic';
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
            <div className="h-10 w-24 bg-slate-200 animate-pulse rounded-xl" />
            <div className="h-64 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
        </div>
    );

    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all medical-shadow active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em]">Therapeutic Module</p>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight font-display italic">Edit <span className="not-italic text-blue-600">Session</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <Card className="p-8 space-y-6 border-slate-200 shadow-xl shadow-slate-100 bg-white">
            <div className="grid grid-cols-2 gap-4">
                <Input
                label="Session Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                />
                <Select
                label="Pain Response"
                options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Scale`, value: `${i}` }))}
                value={formData.painScore}
                onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                />
            </div>
            
            <Textarea
                label="Therapeutic Protocol"
                placeholder="Describe interventions..."
                value={formData.treatmentDone}
                onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                required
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                label="Billing Status"
                options={[
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Pending', value: 'Pending' },
                ]}
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                />
                <Input
                label="Amount (₹)"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
            </div>

            <Input
                label="Follow-up Date"
                type="date"
                value={formData.nextVisitDate}
                onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
            />
          </Card>

          <Button type="submit" className="w-full py-6 rounded-[1.5rem]" loading={loading}>
            Save Session Metrics
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

  const handleUpdateStatus = async (status: string) => {
    try {
      await patientService.updatePatientStatus(patientId!, status);
      setPatient({ ...patient, status });
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const isCompleted = patient?.status === 'Completed';

  if (loading) return (
    <div className="p-10 space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 gap-4">
            <div className="h-44 bg-slate-900 rounded-[2.5rem] animate-pulse" />
            <div className="h-64 bg-white rounded-[2.5rem] animate-pulse" />
        </div>
    </div>
  );
  if (!patient) return <div className="p-10 text-center">Patient not found</div>;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patients')} className="p-3 bg-white border border-slate-200 rounded-[1rem] text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all active:scale-95 group">
            <ArrowLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none mt-0.5">Profile Index</p>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Clinical Context</h1>
          </div>
        </div>
        <div className="flex gap-2">
            {!isCompleted && (
                <>
                    <button 
                        onClick={() => navigate(`/patients/${patientId}/edit`)} 
                        className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 rounded-[1rem] transition-all active:scale-95 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                        <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={handleDeletePatient} 
                        className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200 rounded-[1rem] transition-all active:scale-95 hover:shadow-lg hover:shadow-red-500/10"
                    >
                        <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Profile Locked Indicator */}
      {isCompleted && (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-1 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]"
        >
            <CheckCircle2 size={16} /> Clinical Protocol Concluded - Read Only Archive
        </motion.div>
      )}

      {/* Patient Profile Card */}
      <Card className="bg-slate-900 border-white/10 p-7 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-blue-900/10 group">
         <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 z-0" />
         
         {/* Abstract background intelligence */}
         <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] z-0 group-hover:bg-blue-500/30 transition-colors duration-700" />
         <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px] z-0" />
         
         <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">{patient.name}</h2>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-xl backdrop-blur-md shadow-sm">
                    <User size={12} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none mt-0.5">{patient.gender}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 text-white/80 rounded-xl backdrop-blur-md shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none mt-0.5">{patient.age} YRS</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 text-white/80 rounded-xl backdrop-blur-md shadow-sm">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isCompleted ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : patient?.status === 'Inactive' ? "bg-slate-400" : "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse")} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none mt-0.5">{patient?.status || 'Active'}</span>
                </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <a href={`tel:${patient.phone}`} className="flex items-center gap-4 p-4 sm:p-5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-[1.25rem] transition-all duration-300 group/item">
            <div className="p-3 bg-blue-500/20 text-blue-300 rounded-[1rem] group-hover/item:scale-110 group-hover/item:bg-blue-500/30 transition-all duration-300 shadow-sm">
                <Phone size={18} strokeWidth={2.5} />
            </div>
            <div className="space-y-1.5">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-none">Tele-Connectivity</p>
                <p className="text-sm font-mono font-bold text-white/90">{patient.phone}</p>
            </div>
          </a>
          <div className="flex items-start gap-4 p-4 sm:p-5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-[1.25rem] transition-all duration-300 group/item">
            <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-[1rem] group-hover/item:scale-110 group-hover/item:bg-indigo-500/30 transition-all duration-300 shadow-sm shrink-0">
                <MapPin size={18} strokeWidth={2.5} />
            </div>
            <div className="space-y-1.5">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-none">Geographic Deployment</p>
                <p className="text-xs font-semibold text-white/80 leading-tight line-clamp-2">{patient.address}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <h2 className="text-xs font-bold text-slate-950 uppercase tracking-[0.15em] font-display">Diagnostic Records</h2>
        </div>
        
        <Card className="p-6 bg-slate-50 border-slate-200 border-2 border-dashed shadow-none">
            <FileUpload 
            path={`patients/${patientId}/reports`} 
            onUploadComplete={async (url) => {
                const reports = [...(patient.reports || []), { url, date: new Date().toISOString() }];
                await patientService.updatePatient(patientId!, { reports });
                setPatient({ ...patient, reports });
            }} 
            />
        </Card>
        
        {patient.reports && patient.reports.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {patient.reports.map((report: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 flex items-center justify-between group bg-white border-slate-200/60 hover:border-blue-400 active:scale-[0.99] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all medical-shadow">
                            <FileText size={18} />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Record R{idx + 1}</span>
                            <p className="text-[10px] font-bold text-slate-400">{formatDate(report.date)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.open(report.url, '_blank')} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100">
                            <ExternalLink size={16} />
                        </button>
                        <button 
                            onClick={async () => {
                                if (!window.confirm('Delete this report?')) return;
                                try {
                                    const newReports = patient.reports.filter((_: any, i: number) => i !== idx);
                                    await patientService.updatePatient(patientId!, { reports: newReports });
                                    setPatient({ ...patient, reports: newReports });
                                    toast.success('Report deleted');
                                } catch (err) {
                                    toast.error('Failed to delete report');
                                }
                            }} 
                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Treatment Cases */}
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                    <Activity size={20} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Treatment Cycles</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{cases.length} Total Protocol{cases.length !== 1 ? 's' : ''}</p>
                </div>
            </div>
        <div className="flex flex-wrap items-center gap-2">
            {!isCompleted && (
                <>
                    {cases.some(c => c.status === 'Active') ? (
                        <button 
                        onClick={() => {
                            const activeCase = cases.find(c => c.status === 'Active');
                            if (activeCase) navigate(`/patients/${patientId}/cases/${activeCase.id}/sessions/add`);
                        }}
                        className="text-[10px] font-black text-white bg-slate-900 px-4 py-2.5 rounded-[1rem] flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20"
                        >
                            <Calendar size={14} strokeWidth={2.5} /> Schedule Session
                        </button>
                    ) : (
                        <button 
                        onClick={() => toast.info('Please create an active treatment case first to schedule sessions')}
                        className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-2.5 rounded-[1rem] flex items-center gap-2 cursor-not-allowed uppercase tracking-widest opacity-80"
                        >
                            <Calendar size={14} strokeWidth={2.5} /> Schedule Session
                        </button>
                    )}
                    <Link 
                        to={`/patients/${patientId}/cases/add`}
                        className="text-[10px] font-black text-blue-600 border-none bg-blue-50 px-4 py-2.5 rounded-[1rem] flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all active:scale-95 uppercase tracking-widest shadow-sm"
                    >
                        <Plus size={14} strokeWidth={2.5} /> New Case
                    </Link>
                </>
            )}
          </div>
        </div>

        {cases.length === 0 ? (
          <Card className="bg-slate-50 border-none flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed border-slate-200">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-sm border border-slate-100">
               <AlertCircle size={24} />
             </div>
             <div className="space-y-1">
                <p className="text-slate-900 font-bold tracking-tight">Cycle Registry Empty</p>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">No active protocols identified for this patient</p>
             </div>
             <Button variant="outline" size="sm" onClick={() => navigate(`/patients/${patientId}/cases/add`)} className="rounded-xl mt-2 px-6">Start New Case</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {cases.map((trCase) => (
              <Card 
                key={trCase.id} 
                className="hover:border-blue-400 cursor-pointer group bg-white border-slate-200/60 p-6 rounded-[2rem] hover:translate-y-[-2px] transition-all"
                onClick={() => navigate(`/patients/${patientId}/cases/${trCase.id}`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={trCase.status === 'Active' ? 'success' : 'neutral'}>
                        {trCase.status}
                      </Badge>
                      <Badge variant="info" className="bg-slate-100 text-slate-500 border-none">{trCase.condition}</Badge>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xl group-hover:text-blue-600 transition-colors leading-tight tracking-tight">{trCase.diagnosis}</h3>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all medical-shadow">
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                        <Calendar size={14} />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Deployment</p>
                        <p className="text-[11px] font-mono font-bold text-slate-600">{formatDate(trCase.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right space-y-0.5">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Intensity</p>
                        <p className="text-[11px] font-mono font-bold text-slate-600">{trCase.expectedSessions} Modules</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                        <Clock size={14} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
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
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all medical-shadow active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em]">Initialization</p>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight font-display italic">New Case <span className="not-italic text-blue-600">Protocol</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 space-y-6 border-slate-200 shadow-xl shadow-slate-100 bg-white">
            <Input
                label="Primary Diagnosis"
                placeholder="e.g. Cervical Spondylosis / Post-Op ACL"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                required
            />
            <Select
                label="Clinical Classification"
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
                label="Protocol Commencement"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                />
                <Input
                label="Valuation Unit (₹)"
                type="number"
                value={formData.sessionFee}
                onChange={(e) => setFormData({ ...formData, sessionFee: e.target.value })}
                required
                />
            </div>
            <Input
                label="Targeted Modules (Count)"
                type="number"
                value={formData.expectedSessions}
                onChange={(e) => setFormData({ ...formData, expectedSessions: e.target.value })}
            />
            <Textarea
                label="Clinical Assessment Baseline"
                placeholder="Initial range of motion, functional limitations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Card>

          <Button type="submit" className="w-full py-6 rounded-[1.5rem]" loading={loading}>
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
        <div className="p-10 space-y-6">
            <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-blue-600 rounded-3xl animate-pulse" />
                <div className="h-24 bg-slate-900 rounded-3xl animate-pulse" />
            </div>
        </div>
    );
    if (!trCase) return <div className="p-10 text-center">Case not found</div>;
  
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
      <div className="space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 px-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(`/patients/${patientId}`)} className="p-3 bg-white border border-slate-200 rounded-[1rem] text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all active:scale-95 group">
                    <ArrowLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] leading-none mt-0.5">Clinic Archive</p>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{trCase.diagnosis}</h1>
                </div>
            </div>
            {!isCompleted && (
                trCase.status === 'Active' ? (
                    <button 
                      onClick={() => handleUpdateStatus('Completed')} 
                      className="px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[1rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                        Conclude
                    </button>
                ) : (
                    <button 
                      onClick={() => handleUpdateStatus('Active')} 
                      className="px-4 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-[1rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                        Re-Deploy
                    </button>
                )
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
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all medical-shadow active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Deployment</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Module Initialization</h1>
          </div>
        </div>
  
        {/* Templates */}
        <div className="space-y-4 px-1">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Protocol Templates</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                {['Cervical', 'Lumbar', 'Stroke', 'ACL', 'Knee OA'].map(t => (
                    <motion.button 
                        key={t}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => applyTemplate(t)}
                        className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-all medical-shadow active:bg-blue-50"
                    >
                        {t}
                    </motion.button>
                ))}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 space-y-6 border-slate-200 shadow-xl shadow-slate-100 bg-white">
            <div className="grid grid-cols-2 gap-4">
                <Input
                label="Module Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                />
                <Select
                label="Pain Response"
                options={Array.from({length: 11}, (_, i) => ({ label: `${i}/10 Scale`, value: `${i}` }))}
                value={formData.painScore}
                onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                />
            </div>
            
            <Textarea
                label="Therapeutic Protocol"
                placeholder="What interventions were prioritized?"
                value={formData.treatmentDone}
                onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                required
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                label="Billing Status"
                options={[
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Pending', value: 'Pending' },
                ]}
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                />
                <Input
                label="Amount (₹)"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
            </div>

            <Input
                label="Next Protocol Date"
                type="date"
                value={formData.nextVisitDate}
                onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
            />
          </Card>

          <Button type="submit" className="w-full py-6 rounded-[1.5rem]" loading={loading}>
            Deploy Module Entry
          </Button>
        </form>
      </div>
    );
};
