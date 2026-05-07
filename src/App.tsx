import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout, AuthLayout } from './layouts/Layouts';
import { Toaster } from 'sonner';
import { Dashboard } from './pages/Dashboard';
import { PatientList, AddPatient, EditPatient } from './pages/Patients';
import { PatientDetail, CaseAdd, CaseDetail, SessionAdd, EditSession } from './pages/Treatment';

import { patientService, sessionService } from './services/db';
import { formatDate, formatCurrency, cn } from './utils/helpers';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Wallet, ArrowRight, CheckCircle, Clock, Search, User } from 'lucide-react';
import { Card, Button, Input } from './components/ui/Generic';

import { Badge } from './components/ui/Generic';

import { PhysioInvoice } from './components/PhysioInvoice';

// Functional Calendar/Visits Page
const CalendarPage = () => {
    const [upcoming, setUpcoming] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchVisits = async () => {
            const sessions = await sessionService.getUpcomingVisits();
            setUpcoming(sessions || []);
            setLoading(false);
        };
        fetchVisits();
    }, []);

    return (
        <div className="space-y-8 pb-24">
            <div className="px-1 space-y-1">
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2 duration-700">Protocol Timeline</p>
                <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-3 duration-700 font-display italic">Scheduled <span className="not-italic text-blue-600">Visits</span></h1>
            </div>

            {loading ? (
                <div className="space-y-4 px-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />)}
                </div>
            ) : upcoming.length === 0 ? (
                <div className="bg-white p-16 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-4 mx-1">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                        <CalendarIcon size={32} />
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold">Schedule Vacant</p>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">No visits recorded for the current cycle</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/patients')} className="rounded-xl">Go to Patients</Button>
                </div>
            ) : (
                <div className="space-y-3 px-1">
                    {upcoming.map((visit, idx) => (
                        <Card 
                            key={visit.id} 
                            onClick={() => navigate(`/patients/${visit.patientId}/cases/${visit.caseId}`)}
                            className="flex items-center justify-between p-4 group hover:border-blue-400 active:scale-[0.99] transition-all bg-white border-slate-200/60"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    {visit.patientName?.[0] || 'P'}
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{visit.patientName || 'Patient'}</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="neutral" className="text-[8px] bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700">Time Indexed</Badge>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(visit.date)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-xs font-mono font-black text-slate-900">{formatCurrency(visit.amountPaid)}</p>
                                    <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'}>{visit.paymentStatus}</Badge>
                                </div>
                                <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

// Functional Payments Page
const PaymentsPage = () => {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [patients, setPatients] = React.useState<any[]>([]);
    const [calculating, setCalculating] = React.useState(false);
    const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
    const [dues, setDues] = React.useState<{ total: number, count: number, sessions: any[] } | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchStats = async () => {
            const [data, pts] = await Promise.all([
                sessionService.getDashboardStats(),
                patientService.getPatients()
            ]);
            setStats(data);
            setPatients(pts || []);
            setLoading(false);
        };
        fetchStats();
    }, []);

    const calculateDues = async (patient: any) => {
        setCalculating(true);
        setSelectedPatient(patient);
        setSearchQuery(''); // Clear search after selection to make it more intuitive
        try {
            const sessions = await sessionService.getPatientTransactions(patient.id);
            const pending = sessions.filter((s: any) => s.paymentStatus === 'Pending');
            const total = pending.reduce((acc: number, s: any) => {
                const fee = parseFloat(s.sessionFee?.toString()) || parseFloat(s.amountPaid?.toString()) || 500;
                return acc + fee;
            }, 0);
            setDues({ total, count: pending.length, sessions: pending });
        } catch (e) {
            console.error(e);
        } finally {
            setCalculating(false);
        }
    };

    const filteredPatients = searchQuery.length >= 2 
        ? patients.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    return (
        <div className="space-y-10 pb-24 px-1">
            <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2 duration-700">Financial Ledger</p>
                <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-3 duration-700 font-display italic">Revenue <span className="not-italic text-blue-600">Assets</span></h1>
            </div>
            
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-44 bg-white border border-slate-100 rounded-[2rem]" />
                    <div className="h-24 bg-white border border-slate-100 rounded-[2rem]" />
                </div>
            ) : (
                <div className="space-y-10">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl shadow-slate-200">
                        <div className="relative z-10 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-blue-400 tracking-[0.2em] font-display">Net Collection (Aggregate)</p>
                                <p className="text-5xl font-extrabold tracking-tighter font-display leading-tight">{formatCurrency(stats?.monthlyEarnings || 0)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-hidden no-scrollbar">
                                <Badge className="bg-white/10 text-white/80 border-white/5 font-mono">Live Metrics</Badge>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/10 font-mono">Verified</Badge>
                            </div>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-600 blur-[100px] opacity-20" />
                        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-indigo-500 blur-[80px] opacity-10" />
                    </div>

                    {/* Total Patient Billing Authority Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <h2 className="text-xs font-bold text-slate-950 uppercase tracking-[0.15em] font-display">Instant Billing Protocol</h2>
                        </div>
                        
                        <Card className="p-6 bg-white border-slate-200/60 shadow-xl shadow-slate-100 space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <Input 
                                    label=""
                                    placeholder="Lookup patient to calculate total outstanding..."
                                    className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedPatient(null);
                                            setDues(null);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {searchQuery.length > 0 && searchQuery.length < 2 && (
                                <p className="text-[10px] text-slate-400 italic text-center">Type at least 2 characters to search...</p>
                            )}

                            {filteredPatients.length > 0 && searchQuery.length >= 2 && (
                                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pt-2 border-t border-slate-50">
                                    {filteredPatients.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => calculateDues(p)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-xl transition-all",
                                                selectedPatient?.id === p.id ? "bg-blue-50 text-blue-600 border border-blue-100" : "hover:bg-slate-50 text-slate-700"
                                            )}
                                        >
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs">
                                                {p.name?.[0] || 'P'}
                                            </div>
                                            <span className="text-sm font-bold">{p.name || 'Anonymous'}</span>
                                            <Badge variant="neutral" className="ml-auto text-[8px] uppercase tracking-tighter opacity-50">{p.phone}</Badge>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedPatient && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 bg-slate-950 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden border border-white/5 active:scale-[0.99] transition-all"
                                >
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">Statement Summary</p>
                                            <h4 className="text-2xl font-black font-display tracking-tight italic">{selectedPatient.name}</h4>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                            <Wallet size={24} className="text-blue-400" />
                                        </div>
                                    </div>
                                    
                                    {calculating ? (
                                        <div className="h-20 flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest">Auditing Ledger...</span>
                                        </div>
                                    ) : (
                                            <>
                                                <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-white/5 pt-6 pb-2">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">Unpaid Invoices</p>
                                                        <p className="text-3xl font-black font-mono tracking-tighter">{dues?.count || 0}</p>
                                                    </div>
                                                    <div className="space-y-1 text-right">
                                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">Total Outstanding</p>
                                                        <p className="text-3xl font-black font-mono text-blue-400 tracking-tighter">{formatCurrency(dues?.total || 0)}</p>
                                                    </div>
                                                </div>

                                                {dues && dues.count > 0 && (
                                                    <div className="relative z-10 space-y-3 bg-white/5 p-5 rounded-3xl border border-white/5 max-h-40 overflow-y-auto no-scrollbar">
                                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.25em] mb-2">Ledger Exceptions (Unpaid)</p>
                                                        {dues.sessions?.map((s: any) => (
                                                            <div key={s.id} className="flex justify-between items-center text-[10px] pb-2 border-b border-white/5 last:border-0 last:pb-0">
                                                                <div className="space-y-1">
                                                                    <p className="font-bold text-white/80">{s.diagnosis || 'Session Entry'}</p>
                                                                    <p className="text-white/40 font-mono italic">{s.date}</p>
                                                                </div>
                                                                <p className="font-black text-blue-400">{formatCurrency(s.sessionFee || 500)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {dues && dues.count > 0 && (
                                                    <Button 
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none h-14 rounded-2xl relative z-10 font-bold"
                                                        onClick={() => setIsInvoiceOpen(true)}
                                                    >
                                                        Generate Bill
                                                    </Button>
                                                )}
                                            </>
                                    )}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 blur-[80px] -z-0" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -z-0" />
                                </motion.div>
                            )}
                        </Card>

                        <PhysioInvoice 
                            isOpen={isInvoiceOpen} 
                            onClose={() => setIsInvoiceOpen(false)} 
                            patient={selectedPatient} 
                            dues={dues} 
                        />
                    </div>

                    <Card className="p-6 bg-white flex justify-between items-center group hover:border-blue-300 border-slate-200/60">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all medical-shadow">
                                <Wallet size={24} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Accounts Receivable</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{formatCurrency(stats?.pendingPayments || 0)}</p>
                            </div>
                        </div>
                        <Badge variant="warning" className="px-3 h-6 flex items-center">Outstanding</Badge>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-950 uppercase tracking-[0.2em] ml-1">Internal Ledger Index</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-slate-200/60 shadow-xs group hover:border-blue-400 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        <CheckCircle size={18} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-extrabold text-slate-900">Total Valid Sessions</span>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical Database Count</p>
                                    </div>
                                </div>
                                <span className="font-mono text-lg font-black text-slate-900">{stats?.totalSessions || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/add" element={<AddPatient />} />
            <Route path="/patients/:patientId" element={<PatientDetail />} />
            <Route path="/patients/:patientId/edit" element={<EditPatient />} />
            <Route path="/patients/:patientId/cases/add" element={<CaseAdd />} />
            <Route path="/patients/:patientId/cases/:caseId" element={<CaseDetail />} />
            <Route path="/patients/:patientId/cases/:caseId/sessions/add" element={<SessionAdd />} />
            <Route path="/patients/:patientId/cases/:caseId/sessions/:sessionId/edit" element={<EditSession />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
