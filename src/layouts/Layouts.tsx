import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, CreditCard, Plus, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/payments', icon: CreditCard, label: 'Ledger' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-4 h-18 flex items-center justify-around z-50 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)]">
      {navItems.map((item) => (
        <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
                cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-all relative group",
                isActive ? "text-white" : "text-white/40 hover:text-white/60"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <motion.div
                      animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-[0.1em] transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0"
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-indicator"
                        className="absolute -top-1 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_12px_rgba(96,165,250,1)]"
                      />
                    )}
                </>
            )}
        </NavLink>
      ))}
    </nav>
  );
};

const Header = () => {
    const { user, signInWithGoogle, logout } = useAuth();
    const [scrolled, setScrolled] = React.useState(false);
    
    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const handleAuthAction = () => {
        if (user?.isMock) {
            signInWithGoogle()
                .then(() => toast.success('Connected to Clinical Cloud'))
                .catch((err) => {
                    toast.error('Cloud Sync failed. Check credentials.');
                });
        } else {
            if (window.confirm('Disconnect from clinical cloud?')) {
                logout().then(() => toast.info('Reverted to local preview mode'));
            }
        }
    };

    return (
        <header className="sticky top-0 transition-all duration-500 z-40 px-6 py-5 flex items-center justify-between pt-safe bg-slate-950 text-white shadow-xl border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{getTimeGreeting()}</span>
              <h1 className="text-lg font-black text-white tracking-tight font-display italic leading-none uppercase">
                {user?.name ? (
                  <>
                    {user.name.split(' ').slice(0, -1).join(' ')} <span className="text-blue-500 not-italic">{user.name.split(' ').slice(-1)}</span>
                  </>
                ) : (
                  <>
                    Trishnamoni <span className="text-blue-500 not-italic font-black">Haloi</span>
                  </>
                )}
              </h1>
            </div>

            <button 
                onClick={handleAuthAction}
                className={cn(
                    "relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 border",
                    user?.isMock 
                        ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800" 
                        : "bg-blue-600/10 border-blue-500/20 text-blue-500 hover:bg-blue-600/20"
                )}
            >
                {user?.isMock ? (
                    <User size={18} />
                ) : (
                    <div className="relative">
                        <User size={18} />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    </div>
                )}
            </button>
        </header>
    );
};

export const AppLayout: React.FC = () => {
    const location = useLocation();
    const { loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl premium-shadow animate-bounce">
                    <Users size={32} className="text-blue-600" />
                </div>
                <div className="space-y-2 text-center">
                    <div className="w-12 h-1 h-1 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Establishing Secure Clinical Protocol...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />
            <main className="max-w-md mx-auto px-5 pb-32 pt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
            
            <BottomNav />
            
            {/* Premium FAB */}
            <NavLink 
                to="/patients/add"
                className="fixed right-6 bottom-28 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] active:scale-90 hover:scale-105 transition-all z-50 border border-white/20 flex items-center justify-center"
            >
                <Plus size={28} strokeWidth={3} />
                <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl -z-10 animate-pulse" />
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
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl premium-shadow mb-6">
            <CreditCard size={32} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none font-display">Physio<span className="text-blue-500 font-bold">Track</span></h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Clinical practice management, redefined.</p>
        </div>
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] premium-shadow">
            <Outlet />
        </div>
        <p className="text-center mt-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Secure Medical Environment</p>
      </div>
    </div>
  );
};

