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
            <Card className="relative overflow-hidden p-5 group flex flex-col justify-between h-40 bg-white border-transparent shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 rounded-[1.75rem]">
               <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                    stat.variant === 'info' ? "bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 border border-blue-100/50" :
                    stat.variant === 'success' ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 border border-emerald-100/50" :
                    stat.variant === 'warning' ? "bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-600 border border-amber-100/50" :
                    "bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-600 border border-slate-100/50"
                  )}>
                    <stat.icon size={20} strokeWidth={2.5} />
                  </div>
               </div>
               <div className="space-y-1.5 relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-2">{stat.label}</p>
                  <p className="text-3xl font-display font-extrabold text-slate-900 tracking-tighter leading-none group-hover:text-blue-700 transition-colors">
                    {stat.value}
                  </p>
               </div>
               {/* Subtle background decoration */}
               <div className="absolute -right-6 -top-6 opacity-[0.02] group-hover:opacity-[0.06] transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                  <stat.icon size={120} />
               </div>
               {/* Gradient overlay */}
               <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-slate-50/50 transition-opacity duration-500 group-hover:opacity-0" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <section className="space-y-4 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-blue-50 text-blue-600 border border-blue-100 shadow-sm relative">
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                    <Clock size={20} strokeWidth={2.5} />
                </div>
                <div className="space-y-0.5">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none text-left">Active Protocols</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-left mt-1">Today's Operating Schedule</p>
                </div>
            </div>
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 active:scale-[0.98] transition-all duration-300 cursor-pointer group bg-white border-slate-200 rounded-[1.75rem] relative overflow-hidden"
                    >
                        {/* Decorative hover bg */}
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 rounded-[1.2rem] flex items-center justify-center text-slate-700 font-extrabold text-xl group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300 shadow-sm shrink-0">
                                {visit.patientName?.[0] || 'P'}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight tracking-tight text-base">{visit.patientName || 'Patient'}</h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
                                        <Clock size={10} strokeWidth={3} />
                                        <p className="text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">{formatDate(visit.date)}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                        <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5">ID: {visit.id.substring(0, 4)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6 mt-3 sm:mt-0 relative z-10 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="flex flex-col sm:items-end">
                                <p className="text-[10px] font-mono font-black text-slate-900 tracking-tight leading-none mb-1.5">{formatCurrency(visit.amountPaid)}</p>
                                <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'} className="px-2.5 py-0.5 font-bold text-[9px] shadow-sm uppercase tracking-wider">
                                    {visit.paymentStatus}
                                </Badge>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
                                <ArrowRight size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                            </div>
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
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/patients/add')}
            className="flex flex-col items-start gap-4 p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[1.75rem] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-slate-900/10 group overflow-hidden relative hover:shadow-blue-900/20 hover:-translate-y-1"
          >
            <div className="p-3 bg-white/10 rounded-2xl relative z-10 border border-white/5 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                <PlusCircle size={24} className="text-blue-300" />
            </div>
            <div className="text-left relative z-10 space-y-1">
                <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em] leading-none opacity-80">Intelligence</p>
                <p className="text-sm font-extrabold tracking-tight">New Patient</p>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-[0.05] group-hover:opacity-10 group-hover:scale-125 transition-all duration-500 group-hover:-rotate-12">
                <Users size={120} />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-colors duration-500" />
          </button>
          <button 
            onClick={() => navigate('/patients')}
            className="flex flex-col items-start gap-4 p-5 bg-white rounded-[1.75rem] active:scale-[0.98] transition-all duration-300 shadow-sm border border-slate-100 group overflow-hidden relative hover:shadow-[0_8px_30px_-4px_rgba(59,130,246,0.1)] hover:-translate-y-1 hover:border-blue-100"
          >
            <div className="p-3 bg-blue-50 rounded-2xl relative z-10 border border-blue-100/50 group-hover:bg-blue-600 group-hover:scale-110 transition-colors duration-500 group-hover:transition-transform">
                <Search size={24} className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left relative z-10 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none group-hover:text-blue-500 transition-colors">Database</p>
                <p className="text-sm font-extrabold text-slate-900 tracking-tight">Patient Index</p>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-125 transition-all duration-500 group-hover:rotate-12">
                <Search size={120} />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
