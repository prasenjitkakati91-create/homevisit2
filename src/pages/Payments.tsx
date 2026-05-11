import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Wallet, 
    Search, 
    CheckCircle, 
    Clock, 
    ArrowUpRight, 
    Filter, 
    CreditCard, 
    ArrowLeft,
    ChevronRight,
    FileText,
    TrendingUp,
    Calendar,
    Users
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui/Generic';
import { patientService, sessionService } from '../services/db';
import { formatCurrency, formatDate, cn } from '../utils/helpers';
import { PhysioInvoice } from '../components/PhysioInvoice';
import { toast } from 'sonner';

export const Payments = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [calculating, setCalculating] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [dues, setDues] = useState<{ total: number, count: number, sessions: any[] } | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
    const [txLoading, setTxLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [pts, dashboardStats, allTx] = await Promise.all([
                    patientService.getPatients(),
                    sessionService.getDashboardStats(),
                    sessionService.getAllSessions()
                ]);
                setPatients(pts || []);
                setStats(dashboardStats);
                setTransactions(allTx || []);
            } catch (err) {
                console.error('Failed to load ledger data:', err);
                toast.error('Database sync failure');
            } finally {
                setLoading(false);
                setTxLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const calculateDues = async (patient: any) => {
        setCalculating(true);
        setSelectedPatient(patient);
        setSearchQuery('');
        try {
            const sessions = await sessionService.getPatientTransactions(patient.id);
            const pending = sessions.filter((s: any) => s.paymentStatus === 'Pending');
            const total = pending.reduce((acc: number, s: any) => {
                const fee = parseFloat(s.sessionFee?.toString()) || 500;
                return acc + fee;
            }, 0);
            setDues({ total, count: pending.length, sessions: pending });
        } catch (e) {
            console.error(e);
            toast.error('Calculation failure');
        } finally {
            setCalculating(false);
        }
    };

    const filteredPatients = searchQuery.length >= 2 
        ? patients.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.paymentStatus === filter;
    });

    return (
        <div className="space-y-10 pb-32">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Financial Ledger</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic font-display">Practice <span className="not-italic text-blue-600">Economy</span></h1>
                </div>
                <div className="flex gap-2">
                    <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 active:scale-95 transition-all shadow-sm">
                        <TrendingUp size={20} />
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Card 
                    className={cn(
                        "p-5 border-white/5 relative overflow-hidden group cursor-pointer transition-all active:scale-95",
                        filter === 'Paid' ? "bg-emerald-600 ring-4 ring-emerald-500/20" : "bg-slate-950"
                    )}
                    onClick={() => setFilter(filter === 'Paid' ? 'all' : 'Paid')}
                >
                    <div className="relative z-10 space-y-3">
                        <div className={cn(
                            "p-2 rounded-xl w-fit transition-colors",
                            filter === 'Paid' ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-400"
                        )}>
                            <TrendingUp size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest", filter === 'Paid' ? "text-white/60" : "text-white/40")}>Revenue</p>
                            <p className="text-xl font-black text-white font-mono tracking-tighter">
                                {loading ? '---' : formatCurrency(stats?.monthlyEarnings || 0)}
                            </p>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full" />
                </Card>
                
                <Card 
                    className={cn(
                        "p-5 relative overflow-hidden cursor-pointer transition-all active:scale-95",
                        filter === 'Pending' ? "bg-amber-500 border-amber-400 ring-4 ring-amber-500/20" : "bg-white border-slate-100"
                    )}
                    onClick={() => setFilter(filter === 'Pending' ? 'all' : 'Pending')}
                >
                    <div className="relative z-10 space-y-3">
                        <div className={cn(
                            "p-2 rounded-xl w-fit transition-colors",
                            filter === 'Pending' ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"
                        )}>
                            <Clock size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest", filter === 'Pending' ? "text-white/60" : "text-slate-400")}>Pending</p>
                            <p className={cn("text-xl font-black font-mono tracking-tighter", filter === 'Pending' ? "text-white" : "text-slate-900")}>
                                {loading ? '---' : formatCurrency(stats?.pendingPayments || 0)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Bill Generation Authority */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Billing Terminal</h2>
                </div>

                <Card className="p-6 bg-white shadow-xl shadow-slate-100/50 border-slate-200/60 overflow-hidden relative">
                    <div className="space-y-6 relative z-10">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input 
                                label=""
                                placeholder="Patient lookup (Name or ID)..."
                                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 hover:bg-slate-300 p-1 rounded-lg transition-all"
                                >
                                    <ArrowLeft size={14} className="rotate-90" />
                                </button>
                            )}
                        </div>

                        {/* Search Results */}
                        <AnimatePresence>
                            {filteredPatients.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 border-t border-slate-50 pt-4 overflow-hidden"
                                >
                                    {filteredPatients.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => calculateDues(p)}
                                            className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-2xl transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm">
                                                    {p.name?.[0]}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-slate-900 group-hover:text-blue-700">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.phone}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Selected Result Summary */}
                        <AnimatePresence>
                            {selectedPatient && !calculating && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-6 relative overflow-hidden"
                                >
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">Practice Account</p>
                                            <h4 className="text-2xl font-black italic font-display">{selectedPatient.name}</h4>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                            <Wallet size={20} className="text-blue-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pb-2">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Open Invoices</p>
                                            <p className="text-2xl font-black font-mono">{dues?.count || 0}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Total Due</p>
                                            <p className="text-2xl font-black font-mono text-blue-400">
                                                {formatCurrency(dues?.total || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {dues && dues.count > 0 && (
                                        <Button 
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none h-14 rounded-2xl font-black text-sm relative z-10"
                                            onClick={() => setIsInvoiceOpen(true)}
                                        >
                                            <FileText size={16} className="mr-2" />
                                            Generate Legal Bill
                                        </Button>
                                    )}

                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {calculating && (
                            <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Transaction History...</p>
                            </div>
                        )}
                    </div>
                </Card>

                <PhysioInvoice 
                    isOpen={isInvoiceOpen} 
                    onClose={() => setIsInvoiceOpen(false)} 
                    patient={selectedPatient} 
                    dues={dues} 
                />
            </section>

            {/* General Ledger Index */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Internal Ledger</h2>
                    </div>
                    
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        {(['all', 'Paid', 'Pending'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {txLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-slate-50 rounded-3xl animate-pulse" />)
                    ) : filteredTransactions.length === 0 ? (
                        <div className="py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm">
                                <CreditCard size={20} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching ledger entries</p>
                        </div>
                    ) : (
                        filteredTransactions.map((tx, idx) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card 
                                    className="p-4 bg-white border-slate-100 hover:border-blue-200/50 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer group"
                                    onClick={() => navigate(`/patients/${tx.patientId}/cases/${tx.caseId}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all",
                                                tx.paymentStatus === 'Paid' ? "bg-emerald-600/90 shadow-lg shadow-emerald-900/10" : "bg-slate-900"
                                            )}>
                                                {tx.paymentStatus === 'Paid' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{tx.patientName || 'Clinical Record'}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.diagnosis || 'Therapy'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">
                                                {formatCurrency(tx.amountPaid || tx.sessionFee || 500)}
                                            </p>
                                            <Badge variant={tx.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0 uppercase">
                                                {tx.paymentStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
                
                {!txLoading && stats && (
                    <div className="pt-6 grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1">
                            <Users size={14} className="mx-auto text-slate-400" />
                            <p className="text-[10px] font-black text-slate-900">{stats.activePatients}</p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active Patients</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1">
                            <Calendar size={14} className="mx-auto text-slate-400" />
                            <p className="text-[10px] font-black text-slate-900">{stats.totalSessions}</p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Clinical Sessions</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1">
                            <FileText size={14} className="mx-auto text-slate-400" />
                            <p className="text-[10px] font-black text-slate-900">{stats.monthlySessions}</p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Monthly Throughput</p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
