import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Badge, Card, Button, Input, Select, Textarea, GlassCard, Skeleton } from '../components/ui/Generic';
import { patientService } from '../services/db';
import { ArrowLeft, UserPlus, Search as SearchIcon, Phone, Users, ChevronRight, Activity, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';
import { useSearch } from '../context/SearchContext';

export const AddPatient = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      phone: '',
      age: '',
      gender: 'Male',
      address: '',
    });
    const [phoneError, setPhoneError] = useState('');
  
    const validatePhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 0) return '';
        if (cleaned.length !== 10) return 'Enter a valid 10-digit number';
        return '';
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setFormData({ ...formData, phone: val });
        setPhoneError(validatePhone(val));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const error = validatePhone(formData.phone);
      if (error) {
          setPhoneError(error);
          toast.error(error);
          return;
      }

      setLoading(true);
      try {
        const age = parseInt(formData.age);
        if (isNaN(age)) {
          toast.error('Please enter a valid age');
          return;
        }
        const docRef = await patientService.addPatient({
          ...formData,
          age: age,
          status: 'Active'
        });
        if (docRef) {
          toast.success('Patient added successfully');
          navigate(`/patients/${docRef.id}`);
        }
      } catch (err: any) {
        toast.error('Failed to add patient');
      } finally {
        setLoading(false);
      }
    };
  
  return (
    <div className="space-y-8 pb-16 pt-2">
      <div className="flex items-center gap-5 px-4">
        <motion.button 
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)} 
          className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer group"
        >
          <ArrowLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
        </motion.button>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Admission</p>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Registration</h1>
        </div>
      </div>
  
        <motion.form 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
          onSubmit={handleSubmit} 
          className="space-y-10 px-4"
        >
          <GlassCard className="!p-8 space-y-8 border-2 border-slate-50 shadow-[0_20px_60px_rgba(0,0,0,0.02)] rounded-[2.75rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-[90px] pointer-events-none -mr-32 -mt-32" />
            
            <div className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Enter patient's name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-slate-50/30 border-slate-100 focus:bg-white h-14"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Input
                    label="Contact No."
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    className={cn(
                        "bg-slate-50/30 border-slate-100 focus:bg-white transition-all h-14",
                        phoneError ? "border-rose-200 focus:border-rose-400" : "focus:border-indigo-400"
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {phoneError && (
                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-rose-500 px-1">
                            {phoneError}
                        </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <Input
                  label="Age"
                  type="number"
                  placeholder="00"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="bg-slate-50/30 border-slate-100 focus:bg-white h-14"
                />
              </div>

              <Select
                label="Gender"
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="bg-slate-50/30 border-slate-100 h-14"
              />

              <Textarea
                label="Address"
                placeholder="Full residential address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="min-h-[140px] bg-slate-50/30 border-slate-100 focus:bg-white transition-all resize-none"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                  type="submit" 
                  variant="primary" 
                  className={cn(
                      "w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]",
                      loading ? "opacity-50" : "bg-slate-900 text-white hover:bg-black shadow-lg"
                  )} 
                  loading={loading}
              >
                Save
              </Button>
            </div>
          </GlassCard>
        </motion.form>
      </div>
    );
};

export const EditPatient = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
      name: '',
      phone: '',
      age: '',
      gender: 'Male',
      address: '',
    });
    const [phoneError, setPhoneError] = useState('');
  
    const validatePhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 0) return '';
        if (cleaned.length !== 10) return 'Enter a valid 10-digit number';
        return '';
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setFormData({ ...formData, phone: val });
        setPhoneError(validatePhone(val));
    };

    React.useEffect(() => {
      const fetchPatient = async () => {
        if (!patientId) return;
        const data = await patientService.getPatient(patientId) as any;
        if (data) {
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            age: data.age?.toString() || '',
            gender: data.gender || 'Male',
            address: data.address || '',
          });
        }
        setFetching(false);
      };
      fetchPatient();
    }, [patientId]);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const error = validatePhone(formData.phone);
      if (error) {
          setPhoneError(error);
          toast.error(error);
          return;
      }

      setLoading(true);
      try {
        const age = parseInt(formData.age);
        if (isNaN(age)) {
          toast.error('Please enter a valid age');
          return;
        }
        await patientService.updatePatient(patientId!, {
          ...formData,
          age: age,
        });
        toast.success('Patient record updated');
        navigate(`/patients/${patientId}`);
      } catch (err: any) {
        toast.error('Failed to update patient');
      } finally {
        setLoading(false);
      }
    };

    if (fetching) return (
        <div className="p-10 space-y-8 px-4">
            <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-48" />
                </div>
            </div>
            <div className="bg-white border-2 border-slate-50 rounded-[2.75rem] p-10 space-y-8">
                <div className="space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-14 w-full rounded-2xl" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-14 w-full rounded-2xl" />
                    </div>
                </div>
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
        </div>
    );
  
  return (
    <div className="space-y-8 pb-16 pt-2">
      <div className="flex items-center gap-5 px-4">
        <motion.button 
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)} 
          className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95 cursor-pointer group"
        >
          <ArrowLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
        </motion.button>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Diagnostic Update</p>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Edit Profile</h1>
        </div>
      </div>
  
        <motion.form 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
          onSubmit={handleSubmit} 
          className="space-y-10 px-4"
        >
          <GlassCard className="!p-8 space-y-8 border-2 border-slate-50 shadow-[0_20px_60px_rgba(0,0,0,0.02)] rounded-[2.75rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-[80px] pointer-events-none -mr-32 -mt-32" />
            
            <div className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Enter patient's name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-slate-50/30 border-slate-100 focus:bg-white h-14"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Input
                    label="Contact No."
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    className={cn(
                        "bg-slate-50/30 border-slate-100 focus:bg-white transition-all h-14",
                        phoneError ? "border-rose-200 focus:border-rose-400" : "focus:border-indigo-400"
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {phoneError && (
                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-rose-500 px-1">
                            {phoneError}
                        </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <Input
                  label="Age"
                  type="number"
                  placeholder="00"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="bg-slate-50/30 border-slate-100 focus:bg-white h-14"
                />
              </div>

              <Select
                label="Gender"
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="bg-slate-50/30 border-slate-100 h-14"
              />

              <Textarea
                label="Address"
                placeholder="Full residential address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="min-h-[140px] bg-slate-50/30 border-slate-100 focus:bg-white transition-all resize-none"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                  type="submit" 
                  variant="primary" 
                  className={cn(
                      "w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]",
                      loading ? "opacity-50" : "bg-slate-900 text-white hover:bg-black shadow-lg"
                  )} 
                  loading={loading}
              >
                Save
              </Button>
            </div>
          </GlassCard>
        </motion.form>
      </div>
    );
};

export const PatientList = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useSearch();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('All');

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Run background cleanup check
        patientService.cleanupOldPatients();
        
        const data = await patientService.getPatients();
        setPatients(data || []);
      } catch (err: any) {
        console.error('[PatientList] load fault:', err);
        let errorMsg = 'Failed to load clinical records';
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
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    const queryMatch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      p.phone?.includes(searchQuery);
    const statusMatch = filter === 'All' || p.status === filter;
    return queryMatch && statusMatch;
  });

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'Active').length,
    completed: patients.filter(p => p.status === 'Completed').length
  };

  return (
    <div className="space-y-6 pb-6 pt-2">
      {/* Header & Stats Header */}
      <div className="px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Unified Registry</p>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Records</h1>
          </div>
          <Button 
            onClick={() => navigate('/patients/add')} 
            className="rounded-2xl h-12 px-5 bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2 group"
          >
             <UserPlus size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-widest">New Patient</span>
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="flex bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden">
            {[
              { label: 'Total', count: stats.total, color: 'from-indigo-600 to-blue-700' },
              { label: 'Active', count: stats.active, color: 'from-blue-500 to-indigo-600' },
              { label: 'Done', count: stats.completed, color: 'from-emerald-500 to-teal-600' }
            ].map((s, i) => (
              <div key={s.label} className={cn(
                "flex-1 py-3 px-4 flex flex-col items-center justify-center relative",
                i !== 0 && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-px before:h-6 before:bg-slate-100"
              )}>
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{s.label}</span>
                  <span className={cn("text-xl font-black leading-none mt-1 bg-gradient-to-br bg-clip-text text-transparent transition-all", s.color)}>{s.count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Utilities: Search & Filters */}
      <div className="px-4 space-y-3">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
              <SearchIcon size={16} strokeWidth={2.5} />
          </div>
          <input 
            type="text"
            placeholder="Search records by name or phone..."
            className="w-full pl-11 pr-5 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none shadow-sm transition-all placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 p-1 bg-slate-100/40 border border-slate-200/40 rounded-2xl">
            {['All', 'Active', 'Completed'].map(t => (
                <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                        "flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all",
                        filter === t ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    {t}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 px-4">
          {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex items-center justify-between animate-pulse h-20"></div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="px-4 pt-10">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
               <Users size={32} strokeWidth={1.5} />
            </div>
            <div className="space-y-1 text-center">
               <p className="text-slate-900 font-bold text-sm tracking-tight text-center">No Records Found</p>
               <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest text-center">Try a different search term</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          <AnimatePresence mode="popLayout">
            {filteredPatients.map((patient: any, idx: number) => (
              <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.02 }}
              >
                  <Link to={`/patients/${patient.id}`}>
                      <div className="bg-white border border-slate-100 rounded-[1.75rem] p-4 flex items-center justify-between group hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300">
                          <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl group-hover:scale-105 transition-transform shadow-lg",
                                patient.status === 'Completed' ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-100" : "bg-gradient-to-br from-slate-400 to-slate-900 shadow-slate-200"
                              )}>
                                  {(patient.name?.[0] || 'P').toUpperCase()}
                              </div>
                              <div className="space-y-1">
                                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight text-base leading-none capitalize">{patient.name || 'Unknown'}</h3>
                                  <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 text-slate-500">
                                          <Phone size={10} className="text-slate-300" />
                                          <p className="text-[10px] font-bold text-slate-400">{patient.phone || 'N/A'}</p>
                                      </div>
                                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{patient.age ? `${patient.age}Y` : ''} • {patient.gender?.[0] || 'U'}</p>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                              <div className={cn(
                                "hidden sm:flex px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                patient.status === 'Completed' ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100" :
                                patient.status === 'Inactive' ? "bg-slate-50 text-slate-400" : "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100"
                              )}>
                                {patient.status || 'Active'}
                              </div>
                              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 group-hover:translate-x-0.5 transition-all text-slate-300">
                                  <ChevronRight size={18} strokeWidth={3} />
                              </div>
                          </div>
                      </div>
                  </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

