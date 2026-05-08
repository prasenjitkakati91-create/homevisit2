import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Badge, Card, Button, Input, Select, Textarea, GlassCard } from '../components/ui/Generic';
import { patientService } from '../services/db';
import { ArrowLeft, UserPlus, Search as SearchIcon, Phone, Users, ChevronRight, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const AddPatient = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      phone: '',
      age: '',
      gender: 'Male',
      address: '',
      status: 'Active',
    });
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
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
        });
        if (docRef) {
          toast.success('Patient profile created successfully');
          navigate(`/patients/${docRef.id}`);
        }
      } catch (err: any) {
        console.error('Registration error:', err);
        toast.error('Failed to create patient profile');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Medical Intelligence</p>
            <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none italic">New <span className="not-italic">Registration</span></h1>
          </div>
        </div>
  
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="space-y-6 px-2"
        >
          <Card className="p-7 space-y-6">
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Primary Contact"
                type="tel"
                placeholder="98XXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="Age (Years)"
                type="number"
                placeholder="e.g. 45"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>
            <Select
              label="Biological Gender"
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
                { label: 'Other', value: 'Other' },
              ]}
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            />
            <Select
              label="Status"
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
            <Textarea
              label="Deployment Address"
              placeholder="Enter complete address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </Card>
          
          <Button type="submit" className="w-full py-5 rounded-[2rem]" loading={loading}>
            Confirm Registration
          </Button>
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
      status: 'Active',
    });
  
    React.useEffect(() => {
      const fetchPatient = async () => {
        if (!patientId) return;
        const data = await patientService.getPatient(patientId) as any;
        if (data) {
          setFormData({
            name: data.name,
            phone: data.phone,
            age: data.age.toString(),
            gender: data.gender,
            address: data.address,
            status: data.status || 'Active',
          });
        }
        setFetching(false);
      };
      fetchPatient();
    }, [patientId]);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
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
        toast.success('Patient profile updated');
        navigate(`/patients/${patientId}`);
      } catch (err: any) {
        toast.error('Failed to update patient profile');
      } finally {
        setLoading(false);
      }
    };

    if (fetching) return (
        <div className="p-8 space-y-6">
            <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-2xl" />
            <div className="h-96 bg-white border border-slate-50 rounded-[3rem] animate-pulse" />
        </div>
    );
  
    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Maintenance</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">Edit <span className="not-italic">Record</span></h1>
          </div>
        </div>
  
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="space-y-6 px-2"
        >
          <Card className="p-7 space-y-6">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
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
            />
            <Select
              label="Status"
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
            <Textarea
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </Card>
          <Button type="submit" className="w-full py-5 rounded-[2rem]" loading={loading}>
            Save Changes
          </Button>
        </motion.form>
      </div>
    );
  };

export const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (err) {
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Central Archive</p>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none italic font-display">Patient <span className="not-italic text-blue-600">Database</span></h1>
        </div>
        <Button size="icon" variant="primary" onClick={() => navigate('/patients/add')} className="rounded-2xl w-12 h-12 shadow-blue-500/20">
           <UserPlus size={20} strokeWidth={2.5} />
        </Button>
      </div>

      <div className="px-2">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
              <SearchIcon size={18} strokeWidth={2.5} />
          </div>
          <input 
            type="text"
            placeholder="Search records..."
            className="w-full pl-12 pr-6 py-4.5 bg-white border border-slate-100 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-blue-600/5 focus:border-blue-300 outline-none shadow-sm transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 px-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white border border-slate-50 rounded-[2.5rem] animate-pulse" />)}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="px-2">
          <GlassCard className="flex flex-col items-center justify-center py-16 text-center space-y-5 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white/50 rounded-3xl flex items-center justify-center text-slate-200 shadow-sm border border-white">
               <Users size={32} />
            </div>
            <div className="space-y-1">
               <p className="text-slate-900 font-bold text-sm tracking-tight text-center">No Records Found</p>
               <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest text-center">Update your search parameters</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSearchTerm('')} className="rounded-xl mt-2 bg-white border-slate-200">Clear Search</Button>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-3 px-2">
          <AnimatePresence mode="popLayout">
            {filteredPatients.map((patient: any, idx: number) => (
              <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.02, duration: 0.3 }}
              >
                  <Link to={`/patients/${patient.id}`}>
                      <Card className="p-4 group hover:border-blue-100 transition-all border-slate-50/50">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-800 font-black text-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                                      {patient.name?.[0] || 'P'}
                                  </div>
                                  <div className="space-y-1">
                                      <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors tracking-tight text-base leading-tight">{patient.name || 'Unknown'}</h3>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                          <div className="flex items-center gap-1 text-slate-400">
                                              <Phone size={10} />
                                              <p className="text-[9px] font-bold uppercase tracking-widest">{patient.phone || 'N/A'}</p>
                                          </div>
                                          <div className="w-1 h-1 rounded-full bg-slate-200 ml-1" />
                                          <p className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest ml-1">{patient.age ? `${patient.age}Y` : 'N/A'} • {patient.gender?.[0] || 'U'}</p>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  <div className="hidden sm:block text-right">
                                     <Badge variant={patient?.status === 'Completed' ? 'success' : patient?.status === 'Inactive' ? 'neutral' : 'info'}>
                                        {patient?.status || 'Active'}
                                     </Badge>
                                  </div>
                                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-105 transition-all">
                                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                                  </div>
                              </div>
                          </div>
                      </Card>
                  </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

