import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, CreditCard, Plus, Bell, User, Search, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { cn } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { patientService } from '../services/db';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/calendar', icon: Calendar, label: 'Appointments' },
    { to: '/payments', icon: CreditCard, label: 'Ledger' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-100/60 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <nav className="flex items-center justify-around w-full max-w-md mx-auto px-4 h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              cn(
                "flex flex-col items-center justify-center transition-all duration-300 relative group flex-1 h-full pt-1",
                isActive ? "text-indigo-600" : "text-slate-400"
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { y: -2, scale: 1.1 } : { y: 2, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative z-10"
                >
                  <item.icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div 
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full -z-10"
                    />
                  )}
                </motion.div>
                
                <span className={cn(
                  "text-[10px] font-bold tracking-tight transition-all duration-500 mt-1.5",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 h-0 overflow-hidden"
                )}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-8 h-1 bg-indigo-600 rounded-t-full"
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
    const { user } = useAuth();
    const { searchQuery, setSearchQuery, clearSearch, isSearchFocused, setIsSearchFocused } = useSearch();
    const [scrolled, setScrolled] = React.useState(false);
    const [results, setResults] = React.useState<any[]>([]);
    const navigate = useNavigate();
    
    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    React.useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const searchAll = async () => {
                try {
                    const patients = await patientService.getPatients() || [];
                    const filtered = patients.filter((p: any) => 
                        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.phone?.includes(searchQuery)
                    );
                    setResults(filtered.slice(0, 5));
                } catch (e) {
                    console.error(e);
                }
            };
            searchAll();
        } else {
            setResults([]);
        }
    }, [searchQuery]);

    const handleResultClick = (patientId: string) => {
        navigate(`/patients/${patientId}`);
        clearSearch();
        setIsSearchFocused(false);
    };

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between gap-3 pt-[calc(1rem+env(safe-area-inset-top))] transition-all duration-300 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-b",
            scrolled ? "shadow-sm border-slate-100" : "border-transparent"
        )}>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] leading-none mb-1">{getTimeGreeting()}</span>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none truncate max-w-[140px]">
                {user?.name || 'Dr. Trishnamoni Haloi'}
              </h1>
            </div>
            
            <div className="relative flex-1 max-w-[180px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={14} className={cn("transition-colors", isSearchFocused ? "text-indigo-500" : "text-slate-400")} />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className={cn(
                  "w-full h-9 bg-slate-100/50 border border-transparent rounded-xl pl-9 pr-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 focus:bg-white focus:border-indigo-200",
                  isSearchFocused && "shadow-lg shadow-indigo-500/5"
                )}
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-300 hover:text-slate-500"
                >
                  <X size={12} />
                </button>
              )}

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchFocused && (searchQuery.length > 0 || results.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[60] min-w-[260px] -right-4 sm:right-0"
                  >
                    <div className="p-1.5">
                       <div className="px-3 py-2 border-b border-slate-50 mb-1 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Results</span>
                         <span className="text-[9px] text-slate-300 hidden sm:block">ESC to close</span>
                       </div>
                       {results.length > 0 ? (
                         results.map(patient => (
                           <button
                             key={patient.id}
                             onClick={() => handleResultClick(patient.id)}
                             className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center gap-3 rounded-xl transition-all group"
                           >
                             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                               {patient.name?.[0]?.toUpperCase()}
                             </div>
                             <div className="flex-1 overflow-hidden">
                               <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{patient.name}</p>
                               <p className="text-[10px] text-slate-400 truncate font-medium">{patient.diagnosis || 'No active diagnosis'}</p>
                             </div>
                             <ArrowRight size={12} className="text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                           </button>
                         ))
                       ) : searchQuery.length > 1 ? (
                         <div className="p-6 text-center">
                           <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                             <Search size={16} className="text-slate-300" />
                           </div>
                           <p className="text-xs text-slate-400 font-medium tracking-tight">No patients found matches "{searchQuery}"</p>
                         </div>
                       ) : (
                         <div className="p-4 text-center">
                           <p className="text-xs text-slate-400 font-medium tracking-tight uppercase tracking-widest text-[9px]">Type at least 2 characters...</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Overlay to close search */}
            {isSearchFocused && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40" 
                onClick={() => setIsSearchFocused(false)} 
              />
            )}
        </header>
    );
};

export const AppLayout: React.FC = () => {
    const location = useLocation();
    const { loading } = useAuth();
    const { isSearchFocused } = useSearch();
    
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
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            <Header />
            <main className={cn(
                "flex-1 w-full max-w-md mx-auto px-4 px-safe pb-32 pt-28 transition-all duration-500",
                isSearchFocused ? "opacity-30 pointer-events-none blur-md scale-[0.98]" : "opacity-100"
            )}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
            
            {!isSearchFocused && <BottomNav />}
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



