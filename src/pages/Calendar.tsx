import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { patientService, sessionService, caseService } from '../services/db';
import { formatDate, formatCurrency, cn } from '../utils/helpers';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, CheckCircle } from 'lucide-react';
import { Card, GlassCard, Badge, Button, Select, Input } from '../components/ui/Generic';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useSearch } from '../context/SearchContext';

export const CalendarPage = () => {
    const { searchQuery } = useSearch();
    const [allSessions, setAllSessions] = React.useState<any[]>([]);
    const [allPatients, setAllPatients] = React.useState<any[]>([]);
    const [patientCases, setPatientCases] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [isScheduling, setIsScheduling] = React.useState(false);
    const [scheduleData, setScheduleData] = React.useState({ patientId: '', caseId: '', time: '10:00', notes: '' });
    const [schedulingLoading, setSchedulingLoading] = React.useState(false);
    
    // Completion popup state
    const [completingVisit, setCompletingVisit] = React.useState<any | null>(null);
    const [completionData, setCompletionData] = React.useState({ paymentStatus: 'Paid', amountPaid: 500 });
    const [completingLoading, setCompletingLoading] = React.useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (location.state?.openBooking) {
            setIsScheduling(true);
            // Clear the state so it doesn't reopen on every render/navigation
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    React.useEffect(() => {
        const fetchData = async () => {
            const [sessions, patients] = await Promise.all([
                sessionService.getAllSessions(),
                patientService.getPatients()
            ]);
            setAllSessions(sessions || []);
            setAllPatients(patients || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    React.useEffect(() => {
        if (scheduleData.patientId) {
            caseService.getCases(scheduleData.patientId).then(cases => {
                setPatientCases(cases || []);
                const activeCase = cases?.find((c: any) => c.status === 'Active');
                setScheduleData(prev => ({ ...prev, caseId: activeCase ? activeCase.id : (cases && cases.length > 0 ? cases[0].id : '') }));
            });
        } else {
            setPatientCases([]);
            setScheduleData(prev => ({ ...prev, caseId: '' }));
        }
    }, [scheduleData.patientId]);

    const getSessionsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return allSessions.filter(s => s.date === dateStr);
    };

    const filteredVisits = getSessionsForDate(selectedDate).filter(visit => 
        !searchQuery || 
        visit.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.treatmentDone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scheduleData.patientId) return toast.error("Please select a patient");
        
        setSchedulingLoading(true);
        try {
            const patient = allPatients.find(p => p.id === scheduleData.patientId);
            
            let activeCaseId = scheduleData.caseId;
            let activeCase: any = null;

            if (!activeCaseId) {
                const newCaseRef = await caseService.addCase(scheduleData.patientId, {
                    diagnosis: scheduleData.notes || 'General Consultation',
                    condition: 'Orthopedic',
                    startDate: selectedDate.toISOString().split('T')[0],
                    expectedSessions: 1,
                    sessionFee: 500,
                    status: 'Active',
                    notes: 'Auto-generated for scheduled appointment'
                });
                activeCase = { id: newCaseRef!.id } as any;
                activeCaseId = newCaseRef!.id;
            } else {
                activeCase = patientCases.find(c => c.id === activeCaseId) || { id: activeCaseId } as any;
            }

            await sessionService.addSession(scheduleData.patientId, activeCaseId, {
                date: selectedDate.toISOString().split('T')[0],
                time: scheduleData.time,
                painScore: 0,
                treatmentDone: `Scheduled: ${scheduleData.notes}`,
                notes: scheduleData.notes,
                paymentStatus: 'Pending',
                amountPaid: 0,
                nextVisitDate: '',
                patientName: patient?.name
            });

            const existingSessions = await sessionService.getSessions(scheduleData.patientId, activeCaseId);
            const newTotal = existingSessions.length;
            if (activeCase.expectedSessions && newTotal > Number(activeCase.expectedSessions || 0)) {
                await caseService.updateCase(scheduleData.patientId, activeCaseId, { expectedSessions: newTotal.toString() });
            }

            toast.success("Appointment scheduled!");
            setIsScheduling(false);
            setScheduleData({ patientId: '', caseId: '', time: '10:00', notes: '' });
            
            // Refresh sessions
            const sessions = await sessionService.getAllSessions();
            setAllSessions(sessions || []);
        } catch (err) {
            toast.error("Failed to schedule appointment");
            console.error(err);
        } finally {
            setSchedulingLoading(false);
        }
    };

    const handleCompleteVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!completingVisit) return;
        setCompletingLoading(true);
        try {
            await sessionService.updateSession(completingVisit.patientId, completingVisit.caseId, completingVisit.id, {
                paymentStatus: completionData.paymentStatus,
                amountPaid: completionData.paymentStatus === 'Paid' ? Number(completionData.amountPaid) : 0,
                // Remove the "Scheduled: " prefix if it exists to indicate it's complete
                treatmentDone: completingVisit.treatmentDone?.replace(/^Scheduled:\s*/, 'Completed: ') || 'Completed'
            });
            toast.success("Visit marked as complete!");
            setCompletingVisit(null);
            
            // Refresh sessions
            const sessions = await sessionService.getAllSessions();
            setAllSessions(sessions || []);
        } catch (err) {
            toast.error("Failed to complete appointment");
            console.error(err);
        } finally {
            setCompletingLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-6 px-1">
            <div className="space-y-1">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Practice Timeline</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic font-display">Clinical <span className="not-italic text-blue-800">Calendar</span></h1>
            </div>

            {/* Date Selector */}
            <div className="relative inline-flex items-center">
                <input 
                    type="date" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                        if (e.target.value) {
                            setSelectedDate(new Date(e.target.value));
                        }
                    }}
                />
                <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-slate-200 flex items-center gap-2.5 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <CalendarIcon size={14} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col pr-2">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Select Date</span>
                        <span className="text-[13px] font-bold text-slate-900 leading-none">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none italic">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
                    </div>
                    {filteredVisits.length > 0 && <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{filteredVisits.length} appointments</span>}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={`cal-skeleton-${i}`} className="h-24 bg-white/50 backdrop-blur-md rounded-[2rem] skeleton border-none" />)}
                    </div>
                ) : filteredVisits.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-b from-slate-100 to-transparent rounded-[2.5rem] opacity-20" />
                        <div className="relative flex flex-col items-center justify-center py-14 px-6 rounded-[2.5rem] bg-white border-2 border-dashed border-slate-200/60 overflow-hidden group-hover:border-blue-200 transition-all duration-500">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
                            
                            <div className="relative mb-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-lg shadow-slate-100/50 border border-slate-100 rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
                                    <CalendarIcon size={28} strokeWidth={1.5} />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-center">
                                <h3 className="text-slate-900 font-black text-base tracking-tight italic">Registry <span className="not-italic">Empty</span></h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[180px] leading-relaxed mx-auto">
                                    No clinical appointments indexed for this specific date.
                                </p>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredVisits.map((visit, idx) => (
                                <motion.div
                                    key={`${visit.id || 'visit'}-${idx}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2rem] opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-sm" />
                                        <GlassCard 
                                            onClick={() => navigate(`/patients/${visit.patientId}/cases/${visit.caseId}`)}
                                            className="relative flex items-center justify-between !p-5 hover:border-blue-300/50 transition-all cursor-pointer group shadow-sm bg-white/60"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl group-hover:bg-blue-600 transition-colors duration-500">
                                                        {(visit.patientName?.[0] || 'P').toUpperCase()}
                                                    </div>
                                                    {visit.paymentStatus === 'Paid' && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                            <CheckCircle size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h4 className="font-black text-slate-900 group-hover:text-blue-700 transition-colors text-base tracking-tight leading-none italic uppercase capitalize">{visit.patientName || 'Patient'}</h4>
                                                    <p className="text-[9px] font-black text-indigo-500/80 uppercase tracking-widest leading-none pt-1">{visit.diagnosis || 'Therapy Index'}</p>
                                                    <p className="text-[8px] text-slate-400 font-medium truncate max-w-[140px] mt-1">{visit.treatmentDone || 'Session record'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1.5">
                                                <p className="text-sm font-black text-slate-900 font-mono italic">{formatCurrency(visit.amountPaid)}</p>
                                                {visit.treatmentDone?.startsWith('Scheduled:') ? (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCompletionData({ paymentStatus: 'Paid', amountPaid: 500 });
                                                            setCompletingVisit(visit);
                                                        }}
                                                        className="text-[8px] font-black uppercase tracking-widest text-white bg-slate-900 px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-md hover:bg-blue-600"
                                                    >
                                                        End Visit
                                                    </button>
                                                ) : (
                                                    <Badge variant="success" className="text-[8px] px-2 py-0.5 font-black uppercase tracking-widest transform scale-90 origin-right">
                                                        COMPLETED
                                                    </Badge>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Schedule Appointment Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Schedule Appointment</h2>
                    </div>
                    {!isScheduling && (
                        <button 
                            onClick={() => setIsScheduling(true)}
                            className="p-3 bg-slate-900 border border-slate-800 shadow-[0_4px_15px_-4px_rgba(15,23,42,0.4)] text-white rounded-[1.25rem] active:scale-95 transition-transform cursor-pointer"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
                
                <AnimatePresence>
                    {isScheduling && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 relative overflow-visible mt-2 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                                <form onSubmit={handleSchedule} className="space-y-5 relative z-10">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patient</label>
                                            <Select 
                                                required
                                                value={scheduleData.patientId}
                                                onChange={e => setScheduleData({...scheduleData, patientId: e.target.value})}
                                                options={[
                                                    { label: 'Select Patient...', value: '' },
                                                    ...allPatients.map(p => ({ label: p.name, value: p.id }))
                                                ]}
                                                className="!bg-white !rounded-2xl border-slate-200"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Care Cycle</label>
                                            <Select 
                                                value={scheduleData.caseId}
                                                onChange={e => setScheduleData({...scheduleData, caseId: e.target.value})}
                                                disabled={!scheduleData.patientId}
                                                options={[
                                                    { label: patientCases.length > 0 ? 'Select Care Cycle...' : 'No active cycle (New will be created)', value: '' },
                                                    ...patientCases.map(c => ({ label: `${c.diagnosis} (${c.status})`, value: c.id }))
                                                ]}
                                                className="!bg-white !rounded-2xl border-slate-200"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Time</label>
                                            <Input 
                                                type="time"
                                                value={scheduleData.time}
                                                onChange={e => setScheduleData({...scheduleData, time: e.target.value})}
                                                className="!bg-white !rounded-2xl border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                            <Input 
                                                type="date"
                                                value={selectedDate.toISOString().split('T')[0]}
                                                disabled
                                                className="!opacity-70 !bg-slate-100 !rounded-2xl border-slate-200 !px-3 !py-2 !text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notes</label>
                                        <Input 
                                            placeholder="Consultation, follow-up..."
                                            value={scheduleData.notes}
                                            onChange={e => setScheduleData({...scheduleData, notes: e.target.value})}
                                            className="!bg-white !rounded-2xl border-slate-200"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" className="flex-1 py-4 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-[1.25rem] hover:bg-slate-100 active:scale-95 transition-all cursor-pointer" onClick={() => setIsScheduling(false)}>Cancel</button>
                                        <button disabled={schedulingLoading} type="submit" className="flex-1 py-4 text-sm font-bold text-white bg-blue-600 rounded-[1.25rem] hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-[0_4px_15px_-4px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2">
                                            {schedulingLoading ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <CheckCircle size={18} strokeWidth={2.5} />
                                            )}
                                            Confirm
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Completion Popup */}
            <AnimatePresence>
                {completingVisit && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" 
                        onClick={() => setCompletingVisit(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white/90 backdrop-blur-3xl border border-white rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-md relative overflow-hidden" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                            <button 
                                onClick={() => setCompletingVisit(null)}
                                className="absolute right-6 top-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors z-10"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>

                            <div className="space-y-1 mb-8 relative z-10">
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Session Finalization</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic capitalize">{completingVisit.patientName || 'Patient'}</h3>
                            </div>
                            
                            <form onSubmit={handleCompleteVisit} className="space-y-6 relative z-10">
                                <Select 
                                    label="Payment Status"
                                    value={completionData.paymentStatus}
                                    onChange={e => setCompletionData({...completionData, paymentStatus: e.target.value})}
                                    options={[
                                        { label: 'Paid', value: 'Paid' },
                                        { label: 'Unpaid / Pending', value: 'Pending' }
                                    ]}
                                />
                                
                                <AnimatePresence>
                                    {completionData.paymentStatus === 'Paid' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Input 
                                                label="Amount Paid"
                                                type="number"
                                                min="0"
                                                required
                                                value={completionData.amountPaid}
                                                onChange={e => setCompletionData({...completionData, amountPaid: Number(e.target.value)})}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className="pt-4">
                                    <Button type="submit" variant="primary" className="w-full py-5 rounded-[2rem] text-base shadow-[0_8px_20px_-8px_rgba(37,99,235,0.4)]" loading={completingLoading}>Confirm Completion</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
