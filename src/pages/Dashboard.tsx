import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Wallet, Clock, Plus, Search, ArrowRight, Activity, CreditCard, CheckCircle } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/Generic';
import { sessionService } from '../services/db';
import { formatCurrency, cn, formatDate } from '../utils/helpers';
import { toast } from 'sonner';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySessions: 0,
    activePatients: 0,
    pendingPayments: 0,
    monthlyEarnings: 0,
    totalSessions: 0,
    monthlySessions: 0
  });

  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, visits] = await Promise.all([
          sessionService.getDashboardStats(),
          sessionService.getTodayVisits()
        ]);
        setStats(statsData);
        setTodayVisits(visits || []);
      } catch (err: any) {
        console.error('[Dashboard] sync failure:', err);
        let errorMsg = 'Clinical dashboard sync failure';
        try {
            const detail = JSON.parse(err.message);
            errorMsg = detail.error || errorMsg;
        } catch(e) {
            errorMsg = err.message || errorMsg;
        }
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse px-1">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white rounded-[2.5rem] border border-slate-100" />)}
        </div>
        <div className="h-64 bg-white rounded-[2.5rem] border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Patient Care Overview Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => navigate('/patients')}
        className="px-1 cursor-pointer group active:scale-[0.98] transition-all"
      >
        <div className="relative p-7 rounded-[3rem] bg-indigo-950 text-white overflow-hidden shadow-2xl shadow-indigo-200 group-hover:shadow-indigo-300/30 transition-all">
           <div className="relative z-10 flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.25em]">Clinical Care</p>
                <h3 className="text-2xl font-black font-display tracking-tight leading-none italic">Active <span className="not-italic text-indigo-400">Patients</span></h3>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-all">
                <Users size={24} className="text-indigo-400" />
              </div>
           </div>
           
           <div className="relative z-10 space-y-2">
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black font-mono tracking-tighter leading-none">{stats.activePatients}</p>
                <ArrowRight size={20} className="text-indigo-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/10 font-mono tracking-tight text-[9px] uppercase tracking-widest leading-none">Under continuous care</Badge>
              </div>
           </div>

           {/* Decorative elements */}
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl" />
           <div className="absolute left-1/4 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
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
          value={`${stats.monthlySessions} sessions`} 
          icon={CheckCircle} 
          trend="active"
          delay={0.2}
          onClick={() => navigate('/calendar')}
        />
      </div>

      {/* Today's Schedule - Timeline Style */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-600 rounded-full" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Today's Timeline</h2>
           </div>
           {todayVisits.length > 0 && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{todayVisits.length} appointments</span>}
        </div>

        {todayVisits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed border-slate-200 bg-white/60 backdrop-blur-xl rounded-[2.5rem]">
            <div className="w-14 h-14 bg-white/50 rounded-2xl flex items-center justify-center text-slate-200 shadow-sm border border-white">
              <Calendar size={26} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 font-bold text-sm tracking-tight text-center">Schedule Vacant</p>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.1em] text-center">Ready for input</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/patients')} className="rounded-xl mt-2 border-slate-200 bg-white">Add Session</Button>
          </div>
        ) : (
          <div className="space-y-3">
             {todayVisits.map((visit, idx) => (
               <motion.div
                key={visit.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
               >
                <Link to={`/patients/${visit.patientId}/cases/${visit.caseId}`}>
                    <Card className="p-4 group hover:border-blue-200/50 transition-all border-slate-100/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-800 font-black text-lg group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                                    {visit.patientName?.[0] || 'P'}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors tracking-tight text-sm">{visit.patientName || 'Patient'}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Clock size={10} />
                                            <p className="text-[9px] font-bold uppercase tracking-wider">{formatDate(visit.date)}</p>
                                        </div>
                                        <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'} className="px-2 py-0.5 text-[8px] transform scale-90 origin-left">
                                            {visit.paymentStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-105 transition-all">
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                            </div>
                        </div>
                    </Card>
                </Link>
               </motion.div>
             ))}
          </div>
        )}
      </section>

      {/* Quick Launchpad */}
      <section className="space-y-4 pt-4">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest ml-2 leading-none">Quick Launch</h2>
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
      </section>
    </div>
  );
};

const StatsCard = ({ label, value, icon: Icon, trend, delay, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
    className="w-full"
  >
    <Card onClick={onClick} className="h-36 flex flex-col justify-between p-5 relative overflow-hidden">
      <div className="p-2.5 w-fit bg-slate-50 border border-slate-100 rounded-[1.25rem] text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="space-y-0.5 relative z-10">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900 tracking-tight leading-none truncate pr-2">
          {value}
        </p>
      </div>
      <div className={cn(
        "absolute top-4 right-4 w-1.5 h-1.5 rounded-full",
        trend === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" :
        trend === 'pending' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" :
        "bg-slate-300"
      )} />
    </Card>
  </motion.div>
);

const LaunchBtn = ({ label, sub, icon: Icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-start gap-4 p-5 rounded-[2.5rem] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group border",
      color === 'indigo' ? "bg-white border-slate-100 shadow-sm" : "bg-white border-slate-100 shadow-sm"
    )}
  >
    <div className={cn(
      "p-3 rounded-2xl relative z-10 transition-all duration-500 shadow-sm",
      color === 'indigo' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
    )}>
        <Icon size={22} strokeWidth={2.5} />
    </div>
    <div className="text-left relative z-10 space-y-0.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none opacity-80">{sub}</p>
        <p className="text-sm font-black text-slate-900 tracking-tight leading-none">{label}</p>
    </div>
    <div className={cn(
      "absolute -right-4 -bottom-4 opacity-[0.03] transition-all duration-500 group-hover:scale-110",
      color === 'indigo' ? "text-indigo-600" : "text-blue-600"
    )}>
        <Icon size={80} />
    </div>
  </button>
);

