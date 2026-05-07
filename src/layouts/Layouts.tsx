import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Home, Users, Calendar, CreditCard, LogOut, PlusCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { cn } from '../utils/helpers';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Panel' },
    { to: '/patients', icon: Users, label: 'Index' },
    { to: '/calendar', icon: Calendar, label: 'Visits' },
    { to: '/payments', icon: CreditCard, label: 'Ledger' },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] px-2 h-16 flex items-center justify-around z-50 shadow-2xl shadow-slate-900/20">
      {navItems.map((item) => (
        <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
                cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-all relative group",
                isActive ? "text-blue-400" : "text-white/40 hover:text-white/60"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <item.icon size={20} className={cn("transition-transform", isActive && "scale-110")} />
                    <span className="text-[8px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                    {isActive && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                    )}
                </>
            )}
        </NavLink>
      ))}
    </nav>
  );
};

const Header = () => {
    return (
        <header className="sticky top-0 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/40 px-6 py-5 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white medical-shadow">
                <TrendingUp size={16} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display italic">
                Physio<span className="text-blue-600 font-bold not-italic">Track</span>
            </h1>
        </div>
        </header>
    );
};

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />
      <main className="max-w-md mx-auto px-4 py-6">
        <Outlet />
      </main>
      <BottomNav />
      
      {/* Floating Action Button for mobile utility */}
      <NavLink 
        to="/patients/add"
        className="fixed right-6 bottom-28 bg-slate-900 text-white p-4 rounded-full shadow-2xl shadow-slate-900/40 active:scale-90 transition-all z-50 border border-white/10 flex items-center justify-center medical-shadow"
      >
        <PlusCircle size={24} />
      </NavLink>
    </div>
  );
};

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-12 space-y-3">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl medical-shadow mb-6">
            <TrendingUp size={32} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none font-display italic">Physio<span className="text-blue-500 font-bold not-italic">Track</span></h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Clinical practice management, redefined.</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] medical-shadow">
            <Outlet />
        </div>
        <p className="text-center mt-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Secure Medical Environment</p>
      </div>
    </div>
  );
};
