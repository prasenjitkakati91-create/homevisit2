import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, CreditCard, Plus, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/payments', icon: CreditCard, label: 'Ledger' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Background fill for safe area to prevent white gaps during overscroll/elastic scroll */}
      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-3xl border-t border-white/5 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] pointer-events-auto" />
      
      <nav className="relative h-16 px-6 flex items-start justify-between pointer-events-auto pt-3 mb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              cn(
                "flex flex-col items-center justify-center transition-all relative group py-1 flex-1 h-12",
                isActive ? "text-white" : "text-white/40 hover:text-white/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                  className="relative"
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div 
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-blue-500/25 blur-xl rounded-full -z-10"
                    />
                  )}
                </motion.div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.15em] mt-1.5 transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className="absolute -top-3 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
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
        <header className="sticky top-0 transition-all duration-500 z-40 px-6 py-5 flex items-center justify-between pt-[calc(1.25rem+env(safe-area-inset-top))] bg-slate-950 text-white shadow-xl border-b border-white/5">
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
        </header>
    );
};

export const AppLayout: React.FC = () => {
    const location = useLocation();
    const { loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Glows */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />
                </motion.div>

                <div className="relative z-10 flex flex-col items-center space-y-10">
                    {/* Central Icon with advanced animation */}
                    <div className="relative">
                        <motion.div
                            animate={{ 
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ 
                                duration: 4, 
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.3)] relative z-20"
                        >
                            <Users size={44} className="text-blue-600" />
                        </motion.div>
                        
                        {/* Orbiting rings */}
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-4 border border-blue-500/20 rounded-full border-dashed"
                        />
                        <motion.div 
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-8 border border-white/5 rounded-full border-dashed"
                        />
                    </div>

                    {/* Progress Text */}
                    <div className="space-y-4 text-center">
                        <div className="flex flex-col items-center space-y-2">
                            <h2 className="text-white text-xl font-black tracking-tight uppercase italic font-display">
                                Physio<span className="text-blue-500 not-italic">Track</span>
                            </h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                                Initializing Secure Protocol
                            </p>
                        </div>

                        {/* Minimalist Progress Bar */}
                        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5 mx-auto">
                            <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                }}
                                className="w-1/2 h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-0 right-0 text-center">
                    <p className="text-slate-600 text-[8px] font-bold uppercase tracking-[0.2em] font-mono">
                        System v2.4.9 // Neural Sync Active
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />
            <main className="max-w-md mx-auto px-5 px-safe pb-32 pt-2">
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
        </div>
    );
};

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 pt-safe pb-safe relative overflow-hidden">
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

