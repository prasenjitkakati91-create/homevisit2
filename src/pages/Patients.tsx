import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Badge, Card, Button, Input, Select, Textarea } from '../components/ui/Generic';
import { patientService } from '../services/db';
import { ArrowLeft, UserPlus, Search as SearchIcon, Phone, Trash2, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
        console.error('Registration full error:', err);
        let errorMsg = 'Failed to create patient profile';
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error.includes('permissions')) {
            errorMsg += ': Permission Denied. Please check Firestore rules.';
          }
        } catch (e) {}
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all medical-shadow active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em]">Patient Records Service</p>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight font-display italic">Registration <span className="not-italic text-blue-600">Protocol</span></h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 space-y-6 border-slate-200 shadow-xl shadow-slate-100 bg-white">
            <Input
              label="Patient Full Name"
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
              placeholder="Enter complete address for primary visits..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </Card>
          
          <Button type="submit" className="w-full py-6 text-sm rounded-[1.5rem]" loading={loading}>
            Initialize Patient Record
          </Button>
        </form>
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
        console.error('Update error:', err);
        toast.error('Failed to update patient profile');
      } finally {
        setLoading(false);
      }
    };

    if (fetching) return (
        <div className="p-10 space-y-6">
            <div className="h-10 w-24 bg-slate-200 animate-pulse rounded-xl" />
            <div className="h-96 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
        </div>
    );
  
    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all medical-shadow active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Maintenance</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Edit Record</h1>
          </div>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 space-y-6 border-slate-200 shadow-xl shadow-slate-100 bg-white">
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
          <Button type="submit" className="w-full py-6 text-sm rounded-[1.5rem]" loading={loading}>
            Commit Changes
          </Button>
        </form>
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
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2 duration-700">Central Database</p>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-3 duration-700 font-display italic">Patient <span className="not-italic text-blue-600">Index</span></h1>
        </div>
        <Button size="sm" onClick={() => navigate('/patients/add')} className="rounded-xl px-4 h-11 font-display font-bold">
           <UserPlus size={18} className="mr-2" />
           New Entry
        </Button>
      </div>

      <div className="relative group mx-1">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
            <SearchIcon size={18} />
        </div>
        <input 
          type="text"
          placeholder="Lookup name or contact record..."
          className="w-full pl-12 pr-6 py-4.5 bg-white border border-slate-200/60 rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all placeholder:text-slate-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4 px-1">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 bg-white border border-slate-100 rounded-[2rem] animate-pulse" />)}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white mx-1 p-16 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
             <Users size={32} />
          </div>
          <div className="space-y-1">
             <p className="text-slate-900 font-bold">Registry Empty</p>
             <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.05em]">No matching records found in database</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSearchTerm('')} className="rounded-xl mt-2">Reset Buffer</Button>
        </div>
      ) : (
        <div className="space-y-3 px-1">
          {filteredPatients.map((patient: any, idx: number) => (
            <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
            >
                <Link to={`/patients/${patient.id}`}>
                    <Card 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 active:scale-[0.98] transition-all duration-300 cursor-pointer group bg-white border-slate-200 rounded-[2rem] relative overflow-hidden"
                    >
                        {/* Decorative background element */}
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 rounded-[1.25rem] flex items-center justify-center text-slate-700 font-extrabold text-2xl group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300 shadow-sm shrink-0">
                                {patient.name?.[0] || 'P'}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-lg text-slate-900 group-hover:text-blue-700 transition-colors leading-tight tracking-tight">{patient.name || 'Unknown'}</h3>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
                                        <Phone size={10} strokeWidth={3} />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{patient.phone || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{patient.age ? `${patient.age}Y` : 'N/A'} • {patient.gender?.[0] || 'U'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 relative z-10 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="flex flex-col sm:items-end">
                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] leading-none mb-1.5">Current Status</p>
                                <Badge variant={patient?.status === 'Completed' ? 'success' : patient?.status === 'Inactive' ? 'neutral' : 'info'} className="px-3 py-1 font-bold text-[10px] shadow-sm">
                                    {patient?.status || 'Active'}
                                </Badge>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
                                <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </Card>
                </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
