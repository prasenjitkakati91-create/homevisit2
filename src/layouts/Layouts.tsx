import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, CreditCard, Plus, Bell, User, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { cn } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-safe">
      <nav className="flex items-center justify-around pointer-events-auto bg-white/90 backdrop-blur-2xl border-t border-indigo-100 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)] w-full max-w-md px-2 h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              cn(
                "flex flex-col items-center justify-center transition-all relative group flex-1 h-full rounded-2xl",
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { y: -2, scale: 1.05 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10"
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill"
                      className="absolute inset-x-3 inset-y-1.5 bg-indigo-50 rounded-xl -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
    const { searchQuery, setSearchQuery, clearSearch } = useSearch();
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

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 px-5 py-3 flex items-center justify-between gap-3 pt-[calc(0.75rem+env(safe-area-inset-top))] transition-all duration-300 max-w-md mx-auto bg-white border-b",
            scrolled ? "shadow-lg border-indigo-100 rounded-b-3xl" : "border-indigo-100"
        )}>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{getTimeGreeting()}</span>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none mt-1 max-w-[120px] truncate">
                {user?.name ? (
                  <>
                    {user.name.split(' ').slice(0, -1).join(' ')} <span className="text-indigo-600">{user.name.split(' ').slice(-1)}</span>
                  </>
                ) : (
                  <>
                    Trishnamoni <span className="text-indigo-600">Haloi</span>
                  </>
                )}
              </h1>
            </div>
            
            <div className="relative w-full max-w-[200px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
        </header>
    );
};

export const AppLayout: React.FC = () => {
    const location = useLocation();
    const { loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
                    <div className="relative">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.2)] relative z-20"
                        >
                            <Users size={44} className="text-blue-400" />
                        </motion.div>
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-4 border border-blue-400/20 rounded-full border-dashed"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-indigo-50/80">
            <Header />
            <main className="max-w-md mx-auto px-5 px-safe pb-40 pt-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 pt-safe pb-safe relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-12 space-y-3">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center mx-auto shadow-xl premium-shadow mb-6">
            <CreditCard size={32} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Physio<span className="text-blue-500 font-bold">Track</span></h1>
        </div>
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] premium-shadow">
            <Outlet />
        </div>
      </div>
    </div>
  );
};



