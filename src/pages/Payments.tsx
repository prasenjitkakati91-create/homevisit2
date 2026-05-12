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
import { Card, GlassCard, Button, Input, Badge } from '../components/ui/Generic';
import { patientService, sessionService } from '../services/db';
import { formatCurrency, formatDate, cn } from '../utils/helpers';
import { PhysioInvoice } from '../components/PhysioInvoice';
import { toast } from 'sonner';
import { useSearch } from '../context/SearchContext';

export const Payments = () => {
    const navigate = useNavigate();
    const { searchQuery, setSearchQuery } = useSearch();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<any[]>([]);
    const [calculating, setCalculating] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [dues, setDues] = useState<{ total: number, count: number, sessions: any[] } | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
    const [txLoading, setTxLoading] = useState(true);
    const [showAllTx, setShowAllTx] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));

    const computedStats = React.useMemo(() => {
        let monthlyEarnings = 0;
        let pendingPayments = 0;
        
        transactions.forEach(tx => {
            const isCompleted = !tx.treatmentDone || !tx.treatmentDone.startsWith('Scheduled:');
            const inMonth = tx.date && tx.date.startsWith(selectedMonth);
            
            if (inMonth && isCompleted) {
                if (tx.paymentStatus === 'Paid') {
                    monthlyEarnings += Number(tx.amountPaid) || 0;
                }
                if (tx.paymentStatus === 'Pending') {
                    pendingPayments += (Number(tx.amountPaid) || Number(tx.sessionFee) || 500);
                }
            }
        });
        
        return { monthlyEarnings, pendingPayments };
    }, [transactions, selectedMonth]);

    const format12Hour = (timeStr?: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        if (!h || !m) return timeStr;
        let hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12; 
        return `${hour}:${m} ${ampm}`;
    };

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
        const matchesSearch = !searchQuery || 
                             tx.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             tx.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());
        const inMonth = tx.date && tx.date.startsWith(selectedMonth);
        const matchesFilter = filter === 'all' || tx.paymentStatus === filter;
        
        return matchesSearch && inMonth && matchesFilter;
    });

    return (
        <div className="space-y-8 pb-6">
            {/* Grand Financial Overview */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 flex flex-col gap-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Gross Revenue</p>
                        </div>
                        <h2 className="text-4xl font-black font-mono tracking-tighter text-white">
                            {loading ? '---' : formatCurrency(computedStats.monthlyEarnings)}
                        </h2>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-white/10 text-white border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:ring-0 outline-none backdrop-blur-md appearance-none"
                        />
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner hidden sm:flex">
                            <TrendingUp size={16} strokeWidth={2.5} className="text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setFilter(filter === 'Pending' ? 'all' : 'Pending')}
                        className={cn(
                            "p-5 rounded-[1.5rem] border backdrop-blur-sm text-left transition-all group active:scale-95 cursor-pointer relative overflow-hidden",
                            filter === 'Pending' ? "bg-amber-500 border-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.3)] text-amber-950" : "bg-white/5 border-white/5 hover:bg-white/10"
                        )}
                    >
                        <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 transition-colors", filter === 'Pending' ? "text-amber-900" : "text-amber-400")}>Unsettled</p>
                        <p className={cn("text-xl font-bold font-mono transition-colors", filter === 'Pending' ? "text-amber-950" : "text-white")}>{loading ? '---' : formatCurrency(computedStats.pendingPayments)}</p>
                    </button>
                    <button 
                        onClick={() => setFilter(filter === 'Paid' ? 'all' : 'Paid')}
                        className={cn(
                            "p-5 rounded-[1.5rem] border backdrop-blur-sm text-left transition-all group active:scale-95 cursor-pointer relative overflow-hidden",
                            filter === 'Paid' ? "bg-emerald-500 border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)] text-emerald-950" : "bg-white/5 border-white/5 hover:bg-white/10"
                        )}
                    >
                        <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 transition-colors", filter === 'Paid' ? "text-emerald-900" : "text-emerald-400")}>Received</p>
                        <p className={cn("text-xl font-bold font-mono transition-colors", filter === 'Paid' ? "text-emerald-950" : "text-white")}>{loading ? '---' : formatCurrency(computedStats.monthlyEarnings)}</p>
                    </button>
                </div>
            </div>

            {/* Bill Generation Authority */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Billing Terminal</h2>
                </div>

                <GlassCard className="!p-6 overflow-visible relative z-20">
                    <div className="space-y-6 relative z-10">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2.5} />
                            <Input 
                                label=""
                                placeholder="Patient lookup..."
                                className="pl-14 h-14 bg-white/50 backdrop-blur-sm border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm shadow-inner"
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200/80 hover:bg-slate-300 text-slate-500 p-1.5 rounded-[0.5rem] transition-all cursor-pointer shadow-sm"
                                >
                                    <ArrowLeft size={16} className="rotate-90" strokeWidth={2.5} />
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
                                    className="space-y-2 pt-2"
                                >
                                    {filteredPatients.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => calculateDues(p)}
                                            className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 border border-slate-100 hover:border-blue-200/50 rounded-2xl transition-all group shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[1rem] flex items-center justify-center font-black text-blue-600 shadow-sm border border-slate-200/50 group-hover:shadow-[0_4px_15px_rgba(59,130,246,0.15)] group-hover:border-blue-300 transition-all">
                                                    {(p.name?.[0] || 'P').toUpperCase()}
                                                </div>
                                                <div className="text-left space-y-0.5">
                                                    <p className="text-sm font-black text-slate-900 group-hover:text-blue-700 tracking-tight leading-none italic capitalize">{p.name}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none pt-1">{p.phone}</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <ChevronRight size={16} strokeWidth={2.5}/>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Selected Result Summary */}
                        <AnimatePresence>
                            {selectedPatient && !calculating && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-8 relative overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.3)] mt-4"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
                                    
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Practice Account</p>
                                            <h4 className="text-3xl font-black italic font-display tracking-tight leading-none capitalize">{selectedPatient.name}</h4>
                                        </div>
                                        <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-[1.25rem] border border-white/10 shadow-inner backdrop-blur-md">
                                            <Wallet size={20} className="text-blue-400" strokeWidth={2.5} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="p-5 bg-white/5 rounded-[1.25rem] border border-white/5 backdrop-blur-sm space-y-1">
                                            <p className="text-[9px] font-black text-blue-200/50 uppercase tracking-widest leading-none">Open Invoices</p>
                                            <p className="text-3xl font-black font-mono leading-none pt-1">{dues?.count || 0}</p>
                                        </div>
                                        <div className="p-5 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-[1.25rem] border border-blue-500/20 backdrop-blur-sm space-y-1 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-400/20 blur-xl rounded-full" />
                                            <p className="text-[9px] font-black text-blue-300/70 uppercase tracking-widest leading-none relative z-10">Total Due</p>
                                            <p className="text-3xl font-black font-mono text-blue-400 leading-none pt-1 relative z-10">
                                                {formatCurrency(dues?.total || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {dues && dues.count > 0 && (
                                        <Button 
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none py-6 rounded-[2rem] font-black text-base relative z-10 shadow-[0_8px_25px_-5px_rgba(37,99,235,0.5)] transform-gpu transition-all active:scale-[0.98]"
                                            onClick={() => setIsInvoiceOpen(true)}
                                        >
                                            <FileText size={18} className="mr-2" strokeWidth={2.5} />
                                            Generate Legal Bill
                                        </Button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {calculating && (
                            <div className="py-16 flex flex-col items-center justify-center space-y-5">
                                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Transaction History...</p>
                            </div>
                        )}
                    </div>
                </GlassCard>

                <PhysioInvoice 
                    isOpen={isInvoiceOpen} 
                    onClose={() => setIsInvoiceOpen(false)} 
                    patient={selectedPatient} 
                    dues={dues} 
                />
            </section>

            {/* General Ledger Index */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Internal Ledger</h2>
                    </div>
                    
                    <div className="flex gap-1 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        {(['all', 'Paid', 'Pending'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-[0.75rem] text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                    filter === f ? "bg-white text-blue-600 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {txLoading ? (
                        [1, 2, 3].map(i => <div key={`pay-skeleton-${i}`} className="h-24 bg-white/50 backdrop-blur-md rounded-[2rem] skeleton border-none" />)
                    ) : filteredTransactions.length === 0 ? (
                        <GlassCard className="!p-12 border-dashed border-slate-200 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/50 rounded-3xl flex items-center justify-center text-slate-300 shadow-sm border border-white mx-auto">
                                <CreditCard size={28} strokeWidth={2} />
                            </div>
                            <div className="space-y-1">
                               <p className="text-slate-900 font-bold text-sm tracking-tight text-center">Empty Ledger</p>
                               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest text-center leading-relaxed">No matching transactions</p>
                            </div>
                        </GlassCard>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100/60 flex flex-col">
                            {(showAllTx ? filteredTransactions : filteredTransactions.slice(0, 5)).map((tx, idx) => (
                                <motion.div
                                    key={`${tx.id}-${idx}`}
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <div 
                                        className={cn("flex items-center justify-between p-4 hover:bg-slate-50 transition-all cursor-pointer group border-b border-slate-50 last:border-0", idx === 0 && "rounded-t-2xl", idx === (showAllTx ? filteredTransactions.length - 1 : Math.min(filteredTransactions.length, 5) - 1) && "rounded-b-2xl")}
                                        onClick={() => navigate(`/patients/${tx.patientId}/cases/${tx.caseId}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-10">
                                                <span className="text-[10px] font-black uppercase text-slate-400 leading-none">{new Date(tx.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                <span className="text-lg font-black text-slate-700 leading-none">{new Date(tx.date).getDate()}</span>
                                                {tx.time && <span className="text-[7.5px] font-black uppercase text-slate-400 mt-0.5 tracking-tighter leading-none">{format12Hour(tx.time)}</span>}
                                            </div>
                                            <div className="w-[1px] h-8 bg-slate-100" />
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors tracking-tight leading-none capitalize">{tx.patientName || 'Clinical Record'}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{tx.diagnosis || 'Therapy'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1.5 flex flex-col items-end">
                                            <p className="text-sm font-black text-slate-900 font-mono tracking-tighter leading-none">
                                                {formatCurrency(tx.amountPaid || tx.sessionFee || 500)}
                                            </p>
                                            <span className={cn("text-[7px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm line-height-none", tx.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                                {tx.paymentStatus}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            </div>
                            
                            {!showAllTx && filteredTransactions.length > 5 && (
                                <motion.div 
                                    className="flex justify-center mt-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <button 
                                        onClick={() => setShowAllTx(true)}
                                        className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95 shadow-sm"
                                    >
                                        See all {filteredTransactions.length} records
                                    </button>
                                </motion.div>
                            )}
                            
                            {showAllTx && filteredTransactions.length > 5 && (
                                <motion.div 
                                    className="flex justify-center mt-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <button 
                                        onClick={() => setShowAllTx(false)}
                                        className="px-6 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95 shadow-sm"
                                    >
                                        Show Less
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
                
                {!txLoading && stats && (
                    <div className="pt-6 grid grid-cols-3 gap-3">
                        <GlassCard className="!p-4 text-center space-y-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                                <Users size={14} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-900 leading-none">{stats.activePatients}</p>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest pt-1">Active</p>
                            </div>
                        </GlassCard>
                        <GlassCard className="!p-4 text-center space-y-2">
                             <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                                <Calendar size={14} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-900 leading-none">{stats.totalSessions}</p>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest pt-1">Sessions</p>
                            </div>
                        </GlassCard>
                        <GlassCard className="!p-4 text-center space-y-2">
                             <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                                <FileText size={14} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-900 leading-none">{stats.monthlySessions}</p>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest pt-1">Monthly</p>
                            </div>
                        </GlassCard>
                    </div>
                )}
            </section>
        </div>
    );
};
