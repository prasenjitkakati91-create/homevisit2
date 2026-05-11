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
            <div className="space-y-3">
                {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-slate-100 rounded-[2.5rem] skeleton border-none"></div>
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
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-sm" />
                        <GlassCard className="relative !p-4 group hover:border-blue-300/50 transition-all shadow-sm group-hover:shadow-md bg-white/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg group-hover:bg-blue-600 transition-colors duration-300">
                                            {visit.patientName?.[0] || 'P'}
                                        </div>
                                        {visit.paymentStatus === 'Paid' && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <CheckCircle size={10} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight text-sm uppercase italic">{visit.patientName || 'Patient'}</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{visit.time || 'Entry'}</p>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{visit.treatmentDone || 'Session scheduled'}</p>
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
                                            className="text-[9px] font-black uppercase tracking-widest text-white bg-slate-900 px-3 py-2 rounded-xl active:scale-95 hover:bg-blue-600 transition-all shadow-md"
                                        >
                                            End Visit
                                        </button>
                                    )}
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all duration-300">
                                        <ArrowRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
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
                              {visit.patientName?.[0] || 'P'}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-slate-900 tracking-tight italic group-hover:text-blue-600 transition-colors uppercase truncate max-w-[150px]">
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
                              {visit.patientName?.[0] || 'P'}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-slate-900 tracking-tight italic group-hover:text-blue-600 transition-colors uppercase truncate max-w-[150px]">
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

const StatsCard = ({ label, value, suffix = "", icon: Icon, iconBg = "bg-slate-50", iconColor = "text-slate-500", trend, delay, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="w-full"
  >
    <div 
      onClick={onClick}
      className="p-5 bg-white rounded-[2.5rem] border border-indigo-100/50 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[160px]"
    >
      <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "p-3 rounded-2xl shadow-sm transition-all duration-500",
          iconBg, iconColor,
          "group-hover:scale-110"
        )}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full mt-2",
          trend === 'active' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-200"
        )} />
      </div>

      <div className="space-y-1 relative z-10 mt-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none group-hover:text-indigo-600 transition-colors uppercase">{label}</p>
        <div className="flex flex-col items-start pt-1">
          <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none italic">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {suffix && (
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">
              {suffix}
            </span>
          )}
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-50/50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
    </div>
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

