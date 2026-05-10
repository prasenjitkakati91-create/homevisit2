import React from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, sessionService } from '../services/db';
import { formatDate, formatCurrency, cn } from '../utils/helpers';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Badge } from '../components/ui/Generic';

export const CalendarPage = () => {
    const [allSessions, setAllSessions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchSessions = async () => {
            const sessions = await sessionService.getAllSessions();
            setAllSessions(sessions || []);
            setLoading(false);
        };
        fetchSessions();
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
                    "h-10 w-full flex flex-col items-center justify-center rounded-xl relative transition-all active:scale-90",
                    isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                    isToday ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-700 hover:bg-slate-50"
                )}
            >
                <span className={cn("text-xs font-black", isSelected ? "text-white" : "")}>{day}</span>
                {daySessions.length > 0 && (
                    <div className={cn(
                        "absolute bottom-1.5 w-1 h-1 rounded-full",
                        isSelected ? "bg-white/60" : "bg-blue-500"
                    )} />
                )}
            </button>
        );
    }

    const filteredVisits = getSessionsForDate(selectedDate);

    return (
        <div className="space-y-8 pb-32 px-1">
            <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2 duration-700">Practice Timeline</p>
                <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-3 duration-700 font-display italic">Clinical <span className="not-italic text-blue-600">Calendar</span></h1>
            </div>

            {/* Calendar Widget */}
            <Card className="p-6 bg-white border-slate-200/60 shadow-xl shadow-slate-100 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-slate-900 leading-none">{monthName}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors active:scale-95">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextMonth} className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors active:scale-95">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <div key={`${day}-${idx}`} className="h-6 flex items-center justify-center">
                            <span className="text-[10px] font-black text-slate-300">{day}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <h2 className="text-xs font-black text-slate-950 uppercase tracking-[0.2em]">Sessions on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />)}
                    </div>
                ) : filteredVisits.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                            <CalendarIcon size={24} />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">No clinical data recorded<br/>for this specific date</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredVisits.map((visit) => (
                            <Card 
                                key={visit.id} 
                                onClick={() => navigate(`/patients/${visit.patientId}/cases/${visit.caseId}`)}
                                className="flex items-center justify-between p-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 active:scale-[0.98] transition-all duration-300 cursor-pointer group bg-white border-slate-200 rounded-3xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-colors">
                                        {visit.patientName?.[0] || 'P'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-sm">{visit.patientName || 'Patient'}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{visit.diagnosis || 'Therapy Session'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900 mb-1">{formatCurrency(visit.amountPaid)}</p>
                                    <Badge variant={visit.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0">
                                        {visit.paymentStatus}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
