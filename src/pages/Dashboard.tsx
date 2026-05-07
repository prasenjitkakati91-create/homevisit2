import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Wallet, Clock, PlusCircle, Search, ArrowRight } from 'lucide-react';
import { Card, Button } from '../components/ui/Generic';
import { patientService, sessionService } from '../services/db';
import { formatCurrency, cn, formatDate } from '../utils/helpers';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Generic';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySessions: 0,
    activePatients: 0,
    pendingPayments: 0,
    monthlyEarnings: 0
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
        setTodayVisits(visits);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statsCards = [
    { label: 'Today Visits', value: stats.todaySessions, icon: Clock, variant: 'info' },
    { label: 'Active Patients', value: stats.activePatients, icon: Users, variant: 'neutral' },
    { label: 'Pending Dues', value: formatCurrency(stats.pendingPayments), icon: Wallet, variant: 'warning' },
    { label: 'Net Earnings', value: formatCurrency(stats.monthlyEarnings), icon: TrendingUp, variant: 'success' },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse px-1">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] border border-slate-100" />)}
        </div>
        <div className="h-64 bg-white rounded-[2rem] border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="px-1 space-y-1">
        <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2 duration-700">Central Records Authority</p>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight font-display leading-tight animate-in fade-in slide-in-from-bottom-3 duration-700 italic">Practice <span className="not-italic text-blue-600">Overview</span></h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-1">
        {statsCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Card className="relative overflow-hidden p-5 group flex flex-col justify-between h-36 border-slate-200/60 shadow-xs hover:border-blue-400">
               <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-500 group-hover:scale-110",
                    stat.variant === 'info' ? "bg-blue-50 text-blue-600" :
                    stat.variant === 'success' ? "bg-emerald-50 text-emerald-600" :
                    stat.variant === 'warning' ? "bg-amber-50 text-amber-600" :
                    "bg-slate-50 text-slate-600"
                  )}>
                    <stat.icon size={18} />
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                  <p className="text-2xl font-display font-extrabold text-slate-950 tracking-tight leading-none">
                    {stat.value}
                  </p>
               </div>
               {/* Subtle background decoration */}
               <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <stat.icon size={80} />
               </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <section className="space-y-4 px-1">
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em] font-display">Active Protocols</h2>
            </div>
            <button onClick={() => navigate('/calendar')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline underline-offset-4">View All</button>
        </div>

        {todayVisits.length === 0 ? (
          <Card className="border-none bg-slate-50 flex flex-col items-center justify-center py-12 text-center space-y-4 shadow-none border-2 border-dashed border-slate-200">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-200 medical-shadow">
              <Clock size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 font-bold text-sm tracking-tight">Schedule Clear</p>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.05em]">No sessions indexed for today</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/patients')} className="rounded-xl mt-2">Find Patient</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
             {todayVisits.map((visit, idx) => (
               <motion.div
                key={visit.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
               >
                <Link to={`/patients/${visit.patientId}/cases/${visit.caseId}`}>
                    <Card 
                        className="flex items-center justify-between p-4 hover:border-blue-400 active:scale-[0.99] transition-all cursor-pointer bg-white group border-slate-200/60"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all medical-shadow">
                                {visit.patientName?.[0] || 'P'}
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{visit.patientName || 'Patient'}</h4>
                                <div className="flex items-center gap-2">
                                    <Badge variant="neutral" className="text-[8px] bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700">Session ID: {visit.id.substring(0, 4)}</Badge>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{formatDate(visit.date)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right flex flex-col items-end">
                                <p className="text-sm font-mono font-black text-slate-950">{formatCurrency(visit.amountPaid)}</p>
                                <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'}>{visit.paymentStatus}</Badge>
                            </div>
                            <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Card>
                </Link>
               </motion.div>
             ))}
          </div>
        )}
      </section>

      {/* Quick Access Rails */}
      <section className="space-y-4 px-1">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Terminal Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/patients/add')}
            className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-[1.5rem] active:scale-95 transition-all shadow-lg shadow-slate-200 group overflow-hidden relative"
          >
            <div className="p-2 bg-white/10 rounded-xl relative z-10">
                <PlusCircle size={20} className="text-blue-400" />
            </div>
            <div className="text-left relative z-10">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Intelligence</p>
                <p className="text-xs font-bold mt-1">New Patient</p>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] opacity-10 group-hover:scale-125 transition-transform">
                <Users size={80} />
            </div>
          </button>
          <button 
            onClick={() => navigate('/patients')}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-[1.5rem] active:scale-95 transition-all medical-shadow group overflow-hidden relative"
          >
            <div className="p-2 bg-blue-50 rounded-xl relative z-10">
                <Search size={20} className="text-blue-600" />
            </div>
            <div className="text-left relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Database</p>
                <p className="text-xs font-bold text-slate-900 mt-1">Patient Index</p>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:scale-125 transition-transform">
                <Search size={80} />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
