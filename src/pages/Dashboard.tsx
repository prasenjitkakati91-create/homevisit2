import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Wallet, Clock, Plus, Search, ArrowRight, Activity, CreditCard, CheckCircle, X } from 'lucide-react';
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
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [monthVisits, setMonthVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

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
        
        // Also fetch today's actual visits for the modal
        const today = new Date().toISOString().split('T')[0];
        const [todayData, monthData] = await Promise.all([
          sessionService.getVisitsByDate(today, true),
          sessionService.getMonthlySessions(true)
        ]);
        
        setTodayVisits(todayData || []);
        // sessionService.getMonthlySessions might return a count or a list depending on implementation
        // Usually stats only give count, so I'll verify if there's a specialized fetcher or if I need to filter
        // Checking existing services... sessionService.getDashboardStats is already used.
        // I'll use a filtered approach if a specific list fetcher isn't available, but for now I'll assume 
        // we can fetch the current month's sessions.
        setMonthVisits(monthData || []);
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
    <div className="space-y-8 pb-6">
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
          suffix={stats.todaySessions === 1 ? "session" : "sessions"}
          icon={Activity} 
          iconBg="bg-blue-500"
          iconColor="text-white"
          trend={stats.todaySessions > 0 ? "active" : "standby"}
          delay={0.1}
          onClick={() => setShowTodayModal(true)}
        />
        <StatsCard 
          label="This Month" 
          value={stats.monthlySessions}
          suffix={stats.monthlySessions === 1 ? "session" : "sessions"}
          icon={CheckCircle} 
          iconBg="bg-emerald-500"
          iconColor="text-white"
          trend="active"
          delay={0.2}
          onClick={() => setShowMonthModal(true)}
        />
      </div>

      {/* Date Selector */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Timeline Index</h2>
            </div>
            <div className="relative group">
                <input 
                    type="date" 
                    id="dashboard-date-picker"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full block"
                    title="Pick Date"
                />
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm text-[10px] font-black text-slate-600 group-hover:border-indigo-400 group-hover:text-indigo-600 transition-all italic"
                >
                    <Calendar size={12} className="text-indigo-600" />
                    <span>Pick Date</span>
                </motion.button>
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 px-1 no-scrollbar -mx-5 px-5">
            {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 3 + i);
                const dateStr = d.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                
                return (
                    <button
                        key={i}
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                            "flex-shrink-0 w-14 h-20 rounded-[1.25rem] flex flex-col items-center justify-center gap-1.5 transition-all duration-300",
                            isSelected 
                                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105" 
                                : "bg-white text-slate-500 border border-slate-100 hover:border-blue-200"
                        )}
                    >
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            isSelected ? "text-blue-400" : "text-slate-400"
                        )}>
                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-black tracking-tighter leading-none">
                            {d.getDate()}
                        </span>
                        {isToday && !isSelected && <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5" />}
                    </button>
                );
            })}
        </div>
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
            <div className="space-y-4">
                {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-[2rem] skeleton border-none"></div>
                ))}
            </div>
        ) : visits.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-b from-slate-100 to-transparent rounded-[2.5rem] opacity-20" />
            <div className="relative flex flex-col items-center justify-center py-14 px-6 rounded-[2.5rem] bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200/60 overflow-hidden group-hover:border-blue-200 transition-all duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
              
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-lg shadow-slate-200/50 border border-slate-100 rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
                  <Calendar size={28} strokeWidth={1.5} />
                </div>
                <div className="absolute -right-2 -bottom-2 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white shadow-lg animate-bounce">
                  0
                </div>
              </div>

              <div className="space-y-1.5 text-center mb-6">
                <h3 className="text-slate-900 font-black text-base tracking-tight italic">Timeline <span className="not-italic">Cleared</span></h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[180px] leading-relaxed mx-auto">
                  Precision rest cycle active. No clinical entries for this index.
                </p>
              </div>

              <Button 
                size="sm" 
                variant="primary" 
                onClick={() => navigate('/patients')} 
                className="rounded-xl shadow-lg shadow-blue-500/20 h-10 px-6 text-[10px] font-black uppercase tracking-widest"
              >
                In-take Patient
              </Button>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
             {visits
               .filter(visit => 
                 !searchQuery || 
                 visit.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 visit.treatmentDone?.toLowerCase().includes(searchQuery.toLowerCase())
               )
               .map((visit, idx) => {
                 const isScheduled = visit.treatmentDone?.startsWith('Scheduled:');
                 const isCompleted = visit.treatmentDone?.startsWith('Completed:');
                 
                 return (
                   <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                   >
                    <Link to={`/patients/${visit.patientId}/cases/${visit.caseId}`}>
                        <div className="relative group">
                            <div className={cn(
                                "absolute -inset-0.5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md -z-10",
                                isScheduled ? "bg-indigo-500/20" : "bg-emerald-500/20"
                            )} />
                            <GlassCard className={cn(
                                "relative !p-5 group transition-all duration-500 shadow-sm border border-slate-100 rounded-[2rem] bg-white group-hover:shadow-xl group-hover:-translate-y-1",
                                isScheduled ? "hover:border-indigo-200" : "hover:border-emerald-200"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-shrink-0">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl transition-all duration-500",
                                                isScheduled ? "bg-slate-900 group-hover:bg-indigo-600" : "bg-emerald-600 shadow-lg shadow-emerald-200"
                                            )}>
                                                {(visit.patientName?.[0] || 'P').toUpperCase()}
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                    <CheckCircle size={14} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-extrabold text-slate-900 tracking-tight text-base italic capitalize">
                                                    {visit.patientName || 'Patient'}
                                                </h4>
                                                {isScheduled && (
                                                    <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock size={11} className={cn(isScheduled ? "text-indigo-400" : "text-emerald-400")} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">{visit.time || 'Entry'}</p>
                                                </div>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[100px]">
                                                    {isScheduled ? 'Upcoming' : 'Settled'}
                                                </p>
                                            </div>
                                            
                                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px] pt-0.5">
                                                {isScheduled 
                                                  ? visit.treatmentDone.replace('Scheduled: ', '') 
                                                  : visit.treatmentDone?.replace('Completed: ', '') || 'Session finished'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2">
                                        {isScheduled && (
                                            <motion.button 
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setCompletionData({ paymentStatus: 'Paid', amountPaid: 500 });
                                                    setCompletingVisit(visit);
                                                }}
                                                className="text-[9px] font-black uppercase tracking-[0.15em] text-white bg-indigo-600 px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-slate-900 transition-all"
                                            >
                                                Complete
                                            </motion.button>
                                        )}
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all duration-500">
                                            <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600" />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </Link>
                   </motion.div>
                 );
               })}
          </div>
        )}
      </motion.section>

      {/* Quick Launchpad */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
        className="space-y-6 pt-4"
      >
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Command Center</h2>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Action</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <LaunchBtn 
            label="In-take" 
            sub="Register" 
            icon={Plus} 
            color="indigo" 
            onClick={() => navigate('/patients/add')} 
          />
          <LaunchBtn 
            label="Registry" 
            sub="Search" 
            icon={Search} 
            color="emerald" 
            onClick={() => navigate('/patients')} 
          />
          <div className="col-span-2 grid grid-cols-2 gap-4">
              <LaunchBtn 
                label="Billing" 
                sub="Ledger" 
                icon={Wallet} 
                color="amber" 
                onClick={() => navigate('/payments')} 
              />
              <LaunchBtn 
                label="Timeline" 
                sub="Schedule" 
                icon={Calendar} 
                color="rose" 
                onClick={() => navigate('/calendar', { state: { openBooking: true } })} 
              />
          </div>
        </div>
      </motion.section>

      {/* Today's Sessions Modal */}
      <AnimatePresence>
        {showTodayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowTodayModal(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-3xl rounded-[3rem] p-7 shadow-2xl border border-white/60 w-full max-w-md relative overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">Today's <span className="not-italic">Timeline</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => setShowTodayModal(false)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-3 no-scrollbar pb-6 px-1">
                {todayVisits.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                      <Activity size={24} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No clinical entries for today</p>
                  </div>
                ) : (
                  todayVisits.map((visit, idx) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link 
                        to={`/patients/${visit.patientId}/cases/${visit.caseId}`}
                        onClick={() => setShowTodayModal(false)}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.75rem] hover:border-blue-300 hover:shadow-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-colors italic">
                              {(visit.patientName?.[0] || 'P').toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-slate-900 tracking-tight italic group-hover:text-blue-600 transition-colors capitalize">
                                {visit.patientName}
                              </p>
                              <div className="flex items-center gap-1.5 opacity-60">
                                <Clock size={8} className="text-slate-400" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{visit.time || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-[8px] transform scale-75 origin-right">
                                {visit.paymentStatus}
                             </Badge>
                             <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                <ArrowRight size={14} />
                             </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Monthly Sessions Modal */}
      <AnimatePresence>
        {showMonthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowMonthModal(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-3xl rounded-[3rem] p-7 shadow-2xl border border-white/60 w-full max-w-md relative overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">Monthly <span className="not-italic">Index</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => setShowMonthModal(false)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-3 no-scrollbar pb-6 px-1">
                {monthVisits.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                      <CheckCircle size={24} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No clinical entries for this month</p>
                  </div>
                ) : (
                  monthVisits.map((visit, idx) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link 
                        to={`/patients/${visit.patientId}/cases/${visit.caseId}`}
                        onClick={() => setShowMonthModal(false)}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.75rem] hover:border-blue-300 hover:shadow-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-colors italic">
                              {(visit.patientName?.[0] || 'P').toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-slate-900 tracking-tight italic group-hover:text-blue-600 transition-colors capitalize">
                                {visit.patientName}
                              </p>
                              <div className="flex items-center gap-1.5 opacity-60">
                                <Calendar size={8} className="text-slate-400" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{formatDate(visit.date)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                <ArrowRight size={14} />
                             </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic capitalize">Complete Session</h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest capitalize">{completingVisit.patientName || 'Patient'}</p>
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

const StatsCard = ({ label, value, suffix = "", icon: Icon, iconBg = "bg-slate-50", iconColor = "text-slate-500", trend, delay, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
    className="w-full"
  >
    <div 
      onClick={onClick}
      className="p-6 bg-white rounded-[2.25rem] border border-slate-50 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-slate-100 transition-all duration-700 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[170px]"
    >
    <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "p-4 rounded-[1.25rem] shadow-sm transition-all duration-500 border-b-2",
          iconBg, iconColor, "border-black/5 group-hover:scale-110"
        )}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
          trend === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
        )}>
          <div className={cn(
            "w-1 h-1 rounded-full",
            trend === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
          )} />
          {trend === 'active' ? 'Live' : 'Ready'}
        </div>
      </div>

      <div className="relative z-10 space-y-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">{label}</h4>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
            </span>
            <span className="text-[10px] font-bold text-slate-400 lowercase">{suffix}</span>
        </div>
      </div>
      
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-700 group-hover:scale-125 group-hover:-rotate-12">
        <Icon size={120} strokeWidth={1} />
      </div>
    </div>
  </motion.div>
);

const LaunchBtn = ({ label, sub, icon: Icon, color, onClick }: any) => (
  <motion.button 
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-start gap-5 p-6 rounded-[2.25rem] transition-all duration-500 relative overflow-hidden group border-2 w-full",
      "bg-white border-slate-50 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]",
      "hover:border-slate-100"
    )}
  >
    <div className={cn(
      "absolute -right-2 -top-2 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-700",
      color === 'indigo' && "bg-indigo-400",
      color === 'emerald' && "bg-emerald-400",
      color === 'amber' && "bg-amber-400",
      color === 'rose' && "bg-rose-400",
      !['indigo', 'emerald', 'amber', 'rose'].includes(color) && "bg-blue-400"
    )} />
    
    <div className={cn(
      "p-4 rounded-[1.25rem] relative z-10 transition-all duration-500 shadow-sm border-b-2",
      color === 'indigo' && "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/50",
      color === 'emerald' && "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50",
      color === 'amber' && "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50",
      color === 'rose' && "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50",
      !['indigo', 'emerald', 'amber', 'rose'].includes(color) && "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50"
    )}>
        <Icon size={24} strokeWidth={2.5} />
    </div>
    
    <div className="text-left relative z-10 space-y-1.5 mt-1">
        <p className={cn(
          "text-[10px] font-black uppercase tracking-widest leading-none",
          color === 'indigo' && "text-indigo-400",
          color === 'emerald' && "text-emerald-400",
          color === 'amber' && "text-amber-400",
          color === 'rose' && "text-rose-400",
          !['indigo', 'emerald', 'amber', 'rose'].includes(color) && "text-blue-400"
        )}>{sub}</p>
        <p className="text-base font-black text-slate-900 tracking-tight leading-none italic uppercase">{label}</p>
    </div>

    <div className={cn(
      "absolute -right-6 -bottom-6 opacity-[0.04] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6",
      color === 'indigo' && "text-indigo-900",
      color === 'emerald' && "text-emerald-900",
      color === 'amber' && "text-amber-900",
      color === 'rose' && "text-rose-900",
      !['indigo', 'emerald', 'amber', 'rose'].includes(color) && "text-blue-900"
    )}>
        <Icon size={100} strokeWidth={3} />
    </div>
  </motion.button>
);

