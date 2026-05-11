import React from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, sessionService, caseService } from '../services/db';
import { formatDate, formatCurrency, cn } from '../utils/helpers';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Card, GlassCard, Badge, Button, Select, Input } from '../components/ui/Generic';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useSearch } from '../context/SearchContext';

export const CalendarPage = () => {
    const { searchQuery } = useSearch();
    const [allSessions, setAllSessions] = React.useState<any[]>([]);
    const [allPatients, setAllPatients] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [isScheduling, setIsScheduling] = React.useState(false);
    const [scheduleData, setScheduleData] = React.useState({ patientId: '', time: '10:00', notes: '' });
    const [schedulingLoading, setSchedulingLoading] = React.useState(false);
    
    // Completion popup state
    const [completingVisit, setCompletingVisit] = React.useState<any | null>(null);
    const [completionData, setCompletionData] = React.useState({ paymentStatus: 'Paid', amountPaid: 500 });
    const [completingLoading, setCompletingLoading] = React.useState(false);

    const navigate = useNavigate();

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

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getSessionsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return allSessions.filter(s => s.date === dateStr);
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startOffset = firstDayOfMonth(currentDate);

    // Add empty slots for start offset
    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} className="h-10 w-full" />);
    }

    // Add actual days
    for (let day = 1; day <= totalDays; day++) {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const daySessions = getSessionsForDate(dateObj);
        const isToday = dateObj.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
        const isSelected = dateObj.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];

        days.push(
            <button 
                key={day}
                onClick={() => setSelectedDate(dateObj)}
                className={cn(
                    "h-10 w-full flex flex-col items-center justify-center rounded-[1.25rem] relative transition-all active:scale-90 cursor-pointer overflow-hidden",
                    isSelected ? "bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]" : 
                    isToday ? "bg-blue-50/80 text-blue-600 border border-blue-100/50" : "text-slate-600 hover:bg-slate-100/50"
                )}
            >
                {isSelected && <motion.div layoutId="calendar-selection" className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600" />}
                <span className={cn("text-xs font-black z-10", isSelected ? "text-white" : "")}>{day}</span>
                {daySessions.length > 0 && (
                    <div className={cn(
                        "absolute bottom-1.5 w-1 h-1 rounded-full z-10",
                        isSelected ? "bg-white" : "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"
                    )} />
                )}
            </button>
        );
    }

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
            const cases = await caseService.getCases(scheduleData.patientId);
            let activeCase: any = cases?.find((c: any) => c.status === 'Active');
            
            if (!activeCase) {
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
            }

            await sessionService.addSession(scheduleData.patientId, activeCase.id, {
                date: selectedDate.toISOString().split('T')[0],
                painScore: 0,
                treatmentDone: `Scheduled: ${scheduleData.notes}`,
                notes: scheduleData.notes,
                paymentStatus: 'Pending',
                amountPaid: 0,
                nextVisitDate: '',
                patientName: patient?.name
            });

            toast.success("Appointment scheduled!");
            setIsScheduling(false);
            setScheduleData({ patientId: '', time: '10:00', notes: '' });
            
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
        <div className="space-y-8 pb-32 px-1">
            <div className="space-y-1">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Practice Timeline</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic font-display">Clinical <span className="not-italic text-blue-800">Calendar</span></h1>
            </div>

            {/* Calendar Widget */}
            <GlassCard className="!p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="space-y-0.5">
                        <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight">{monthName}</h3>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-[1.25rem] text-slate-400 hover:text-blue-600 transition-colors shadow-sm active:scale-95 cursor-pointer">
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-[1.25rem] text-slate-400 hover:text-blue-600 transition-colors shadow-sm active:scale-95 cursor-pointer">
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2 relative z-10">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <div key={`${day}-${idx}`} className="h-6 flex items-center justify-center">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{day}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 relative z-10">
                    {days}
                </div>
            </GlassCard>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Sessions on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-white/50 backdrop-blur-md rounded-[2rem] skeleton border-none" />)}
                    </div>
                ) : filteredVisits.length === 0 ? (
                    <GlassCard className="!p-12 text-center space-y-5 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white/50 rounded-3xl flex items-center justify-center text-slate-300 shadow-sm border border-white mx-auto">
                            <CalendarIcon size={32} />
                        </div>
                        <div className="space-y-1">
                           <p className="text-slate-900 font-bold text-sm tracking-tight text-center">No Clinical Data</p>
                           <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest text-center leading-relaxed">No records found<br/>for this specific date</p>
                        </div>
                    </GlassCard>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredVisits.map((visit, idx) => (
                                <motion.div
                                    key={visit.id}
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <GlassCard 
                                        onClick={() => navigate(`/patients/${visit.patientId}/cases/${visit.caseId}`)}
                                        className="flex items-center justify-between !p-5 hover:border-blue-300 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.05)] rounded-[1.25rem] flex items-center justify-center text-slate-800 font-black text-xl group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white group-hover:border-blue-400 group-hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all duration-500">
                                                {visit.patientName?.[0] || 'P'}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-base tracking-tight leading-none italic">{visit.patientName || 'Patient'}</h4>
                                                <p className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest leading-none pt-1">{visit.diagnosis || 'Therapy Session'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900 mb-1.5 font-mono">{formatCurrency(visit.amountPaid)}</p>
                                            <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0 mb-2 block w-fit ml-auto shadow-none">
                                                {visit.paymentStatus}
                                            </Badge>
                                            {visit.treatmentDone?.startsWith('Scheduled:') && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCompletionData({ paymentStatus: 'Paid', amountPaid: 500 });
                                                        setCompletingVisit(visit);
                                                    }}
                                                    className="text-[9px] font-black uppercase tracking-widest text-white bg-blue-600 px-4 py-2 rounded-xl active:scale-95 transition-transform shadow-[0_2px_8px_rgba(37,99,235,0.3)] cursor-pointer hover:bg-blue-700"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    </GlassCard>
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
                            <GlassCard className="!p-8 relative overflow-visible mt-2">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
                                <form onSubmit={handleSchedule} className="space-y-6 relative z-10">
                                    <Select 
                                        label="Select Patient"
                                        required
                                        value={scheduleData.patientId}
                                        onChange={e => setScheduleData({...scheduleData, patientId: e.target.value})}
                                        options={[
                                            { label: 'Select Patient...', value: '' },
                                            ...allPatients.map(p => ({ label: p.name, value: p.id }))
                                        ]}
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input 
                                            label="Time (Optional)"
                                            type="time"
                                            value={scheduleData.time}
                                            onChange={e => setScheduleData({...scheduleData, time: e.target.value})}
                                        />
                                        <Input 
                                            label="Date"
                                            type="date"
                                            value={selectedDate.toISOString().split('T')[0]}
                                            disabled
                                        />
                                    </div>

                                    <Input 
                                        label="Notes / Reason"
                                        placeholder="Consultation, follow-up..."
                                        value={scheduleData.notes}
                                        onChange={e => setScheduleData({...scheduleData, notes: e.target.value})}
                                    />
                                    
                                    <div className="flex gap-3 pt-2">
                                        <Button type="button" variant="outline" className="flex-1 py-5 rounded-[2rem] bg-white border-slate-200" onClick={() => setIsScheduling(false)}>Cancel</Button>
                                        <Button type="submit" variant="primary" className="flex-1 py-5 rounded-[2rem] shadow-[0_4px_15px_-4px_rgba(37,99,235,0.4)]" loading={schedulingLoading}>Confirm</Button>
                                    </div>
                                </form>
                            </GlassCard>
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
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">{completingVisit.patientName || 'Patient'}</h3>
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
