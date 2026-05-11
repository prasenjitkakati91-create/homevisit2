import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Wallet, Clock, Plus, Search, ArrowRight, Activity, CreditCard, CheckCircle } from 'lucide-react';
import { Card, GlassCard, Button, Badge, Skeleton, Input, Select } from '../components/ui/Generic';
import { sessionService } from '../services/db';
import { formatCurrency, cn, formatDate } from '../utils/helpers';
import { toast } from 'sonner';
import { useSearch } from '../context/SearchContext';

const AnimatedCounter = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const animatedValue = useSpring(0, { bounce: 0, duration: 2000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.set(value);
  }, [value, animatedValue]);

  useEffect(() => {
    return animatedValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [animatedValue]);

  return <span>{prefix}{displayValue}{suffix}</span>;
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { searchQuery } = useSearch();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    todaySessions: 0,
    activePatients: 0,
    pendingPayments: 0,
    monthlyEarnings: 0,
    totalSessions: 0,
    monthlySessions: 0
  });

  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);

  // Completion popup state
  const [completingVisit, setCompletingVisit] = useState<any | null>(null);
  const [completionData, setCompletionData] = useState({ paymentStatus: 'Paid', amountPaid: 500 });
  const [completingLoading, setCompletingLoading] = useState(false);

  const handleCompleteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingVisit) return;
    setCompletingLoading(true);
    try {
        await sessionService.updateSession(completingVisit.patientId, completingVisit.caseId, completingVisit.id, {
            paymentStatus: completionData.paymentStatus,
            amountPaid: completionData.paymentStatus === 'Paid' ? Number(completionData.amountPaid) : 0,
            treatmentDone: completingVisit.treatmentDone?.replace(/^Scheduled:\s*/, 'Completed: ') || 'Completed'
        });
        toast.success("Visit marked as complete!");
        setCompletingVisit(null);
        
        // Refresh visits
        const data = await sessionService.getAllSessions();
        const dailyVisits = data?.filter((s: any) => s.date === selectedDate) || [];
        // Sort
        dailyVisits.sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            return a.time ? -1 : 1;
        });
        setVisits(dailyVisits);
    } catch (err) {
        toast.error("Failed to complete appointment");
        console.error(err);
    } finally {
        setCompletingLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await sessionService.getDashboardStats();
        setStats(statsData);
      } catch (err: any) {
        console.error('[Dashboard] Stats sync failure:', err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchVisits = async () => {
      setVisitsLoading(true);
      try {
        const data = await sessionService.getVisitsByDate(selectedDate);
        setVisits(data || []);
      } catch (err: any) {
        console.error('[Dashboard] Visits fetch failure:', err);
        toast.error('Failed to load schedule for selected date');
      } finally {
        setVisitsLoading(false);
        setLoading(false);
      }
    };
    fetchVisits();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="space-y-8 px-1">
        <div className="h-48 bg-slate-100 rounded-[3rem] p-7 space-y-4 skeleton border-none"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-36 bg-slate-100 rounded-[2.5rem] p-5 skeleton border-none"></div>
          ))}
        </div>
        <div className="space-y-4">
            <div className="h-4 w-24 bg-slate-100 rounded skeleton" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-100 rounded-[2.5rem] p-4 skeleton border-none"></div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Patient Care Overview Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => navigate('/patients')}
        className="px-1 cursor-pointer group active:scale-[0.98] transition-all relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-[3rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse" />
        <div className="relative p-7 rounded-[3rem] bg-slate-900 text-white overflow-hidden shadow-2xl shadow-blue-900/40 border border-white/10 group-hover:border-blue-500/30 transition-all duration-500">
           <div className="relative z-10 flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">Clinical Care</p>
                <h3 className="text-2xl font-black font-display tracking-tight leading-none italic">Active <span className="not-italic text-white">Patients</span></h3>
              </div>
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-all"
              >
                <Users size={24} className="text-blue-400" />
              </motion.div>
           </div>
           
           <div className="relative z-10 space-y-2">
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black font-mono tracking-tighter leading-none">
                  <AnimatedCounter value={stats.activePatients} />
                </p>
                <ArrowRight size={20} className="text-blue-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/10 font-mono text-[9px] uppercase tracking-widest leading-none">Under continuous care</Badge>
              </div>
           </div>

           {/* Decorative elements */}
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/30 rounded-full blur-[80px]" />
           <div className="absolute left-1/4 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px]" />
        </div>
      </motion.div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard 
          label="Today's Sessions" 
          value={stats.todaySessions} 
          icon={Activity} 
          trend={stats.todaySessions > 0 ? "active" : "standby"}
          delay={0.1}
          onClick={() => navigate('/calendar')}
        />
        <StatsCard 
          label="This Month" 
          value={stats.monthlySessions}
          suffix=" sessions"
          icon={CheckCircle} 
          trend="active"
          delay={0.2}
          onClick={() => navigate('/calendar')}
        />
      </div>

      {/* Date Selector */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Schedule Filter</h2>
        </div>
        <GlassCard className="!p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Date</p>
                <p className="text-sm font-bold text-slate-900">{formatDate(selectedDate)}</p>
            </div>
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm transition-all"
            />
        </GlassCard>
      </motion.section>

      {/* Today's Schedule - Timeline Style */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
                {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Schedule" : `${formatDate(selectedDate)}`}
              </h2>
           </div>
           {visits.length > 0 && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{visits.length} items</span>}
        </div>

        {visitsLoading ? (
            <div className="space-y-3">
                {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-slate-100 rounded-[2.5rem] skeleton border-none"></div>
                ))}
            </div>
        ) : visits.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-dashed">
            <div className="w-14 h-14 bg-white/50 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-white">
              <Calendar size={26} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 font-bold text-sm tracking-tight text-center">Schedule Vacant</p>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.1em] text-center">No appointments on this date</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/patients')} className="mt-2 border-slate-200">Add Session</Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
             {visits
               .filter(visit => 
                 !searchQuery || 
                 visit.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 visit.treatmentDone?.toLowerCase().includes(searchQuery.toLowerCase())
               )
               .map((visit, idx) => (
               <motion.div
                key={visit.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
               >
                <Link to={`/patients/${visit.patientId}/cases/${visit.caseId}`}>
                    <GlassCard className="!p-4 group hover:border-blue-300 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 shadow-inner rounded-2xl flex items-center justify-center text-slate-800 font-black text-lg group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white group-hover:border-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500">
                                    {visit.patientName?.[0] || 'P'}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors tracking-tight text-sm">{visit.patientName || 'Patient'}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Clock size={10} />
                                            <p className="text-[9px] font-bold uppercase tracking-wider">{visit.time || 'Schedule Entry'}</p>
                                        </div>
                                        <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'} className="px-2 py-0.5 text-[8px] transform scale-90 origin-left">
                                            {visit.paymentStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {visit.treatmentDone?.startsWith('Scheduled:') && (
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setCompletionData({ paymentStatus: 'Paid', amountPaid: 500 });
                                            setCompletingVisit(visit);
                                        }}
                                        className="text-[10px] font-bold text-white bg-blue-600 border border-blue-500 shadow-[0_4px_12px_rgba(37,99,235,0.3)] px-3 py-1.5 rounded-xl active:scale-95 hover:scale-105 transition-all"
                                    >
                                        Complete
                                    </button>
                                )}
                                <div className="w-10 h-10 rounded-2xl bg-white/50 border border-slate-100 shadow-sm flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:scale-110 transition-all duration-300">
                                    <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </Link>
               </motion.div>
             ))}
          </div>
        )}
      </motion.section>

      {/* Quick Launchpad */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="space-y-4 pt-4"
      >
        <div className="flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Quick Launch</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <LaunchBtn 
            label="In-take" 
            sub="New Patient" 
            icon={Plus} 
            color="indigo" 
            onClick={() => navigate('/patients/add')} 
          />
          <LaunchBtn 
            label="Index" 
            sub="Database" 
            icon={Search} 
            color="blue" 
            onClick={() => navigate('/patients')} 
          />
        </div>
      </motion.section>

      {/* Completion Popup */}
      <AnimatePresence>
      {completingVisit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setCompletingVisit(null)}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white/90 backdrop-blur-3xl rounded-[3rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/60 w-full max-w-md relative overflow-hidden" 
                onClick={e => e.stopPropagation()}
              >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="relative z-10 space-y-1.5 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 rounded-[1.25rem] shadow-sm mb-4">
                        <CheckCircle size={24} strokeWidth={2.5}/>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">Complete Session</h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{completingVisit.patientName || 'Patient'}</p>
                  </div>
                  
                  <form onSubmit={handleCompleteVisit} className="space-y-6 relative z-10">
                      <Select 
                          label="Payment Status"
                          value={completionData.paymentStatus}
                          onChange={(e: any) => setCompletionData({...completionData, paymentStatus: e.target.value})}
                          options={[
                              { label: 'Paid', value: 'Paid' },
                              { label: 'Unpaid / Pending', value: 'Pending' }
                          ]}
                      />
                      
                      <AnimatePresence>
                      {completionData.paymentStatus === 'Paid' && (
                          <motion.div
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             exit={{ opacity: 0, height: 0 }}
                             className="overflow-hidden"
                          >
                            <Input 
                                label="Amount Paid"
                                type="number"
                                min="0"
                                required
                                value={completionData.amountPaid}
                                onChange={(e: any) => setCompletionData({...completionData, amountPaid: Number(e.target.value)})}
                            />
                          </motion.div>
                      )}
                      </AnimatePresence>
                      
                      <div className="flex gap-4 pt-4">
                          <Button type="button" variant="outline" className="flex-1 h-14 rounded-[1.5rem]" onClick={() => setCompletingVisit(null)}>Cancel</Button>
                          <Button type="submit" variant="primary" className="flex-1 h-14 rounded-[1.5rem] shadow-lg shadow-blue-500/20" loading={completingLoading}>Save</Button>
                      </div>
                  </form>
              </motion.div>
          </div>
      )}
      </AnimatePresence>
    </div>
  );
};

const StatsCard = ({ label, value, suffix = "", icon: Icon, trend, delay, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 200, damping: 25 }}
    className="w-full relative group"
  >
    <div className="absolute inset-0 bg-blue-500/0 rounded-[2.5rem] blur-xl group-hover:bg-blue-500/10 transition-colors duration-500" />
    <GlassCard onClick={onClick} className="h-36 flex flex-col justify-between !p-5 relative overflow-hidden group-hover:-translate-y-1 transition-all duration-500">
      <div className="p-2.5 w-fit bg-slate-50 border border-slate-200/50 shadow-inner rounded-[1.25rem] text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="space-y-0.5 relative z-10">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900 tracking-tight leading-none truncate pr-2 flex items-center">
          {typeof value === 'number' ? <AnimatedCounter value={value} suffix={suffix} /> : value}
        </p>
      </div>
      <div className={cn(
        "absolute top-5 right-5 w-2 h-2 rounded-full",
        trend === 'active' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" :
        trend === 'pending' ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]" :
        "bg-slate-300"
      )} />
    </GlassCard>
  </motion.div>
);

const LaunchBtn = ({ label, sub, icon: Icon, color, onClick }: any) => (
  <motion.button 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-start gap-4 p-5 rounded-[2.5rem] transition-all duration-300 relative overflow-hidden group border",
      color === 'indigo' ? "bg-white/60 backdrop-blur-xl border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]" : "bg-white/60 backdrop-blur-xl border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
    )}
  >
    <div className={cn(
      "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
      color === 'indigo' ? "bg-indigo-500" : "bg-blue-500"
    )} />
    <div className={cn(
      "p-3 rounded-2xl relative z-10 transition-all duration-500 shadow-sm border",
      color === 'indigo' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-blue-50 text-blue-600 border-blue-100"
    )}>
        <Icon size={22} strokeWidth={2.5} />
    </div>
    <div className="text-left relative z-10 space-y-0.5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none opacity-80">{sub}</p>
        <p className="text-sm font-black text-slate-900 tracking-tight leading-none">{label}</p>
    </div>
    <div className={cn(
      "absolute -right-4 -bottom-4 opacity-[0.03] transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12",
      color === 'indigo' ? "text-indigo-600" : "text-blue-600"
    )}>
        <Icon size={80} />
    </div>
  </motion.button>
);

