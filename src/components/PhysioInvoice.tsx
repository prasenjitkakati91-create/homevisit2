import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Printer, Download, Share2, MessageCircle, Send, 
    TrendingUp, User, Calendar, MapPin, Phone, 
    CreditCard, Activity, CheckCircle2, Clock, AlertTriangle 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { Button, Badge } from './ui/Generic';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PhysioInvoiceProps {
    isOpen: boolean;
    onClose: () => void;
    patient: any;
    dues: {
        total: number;
        count: number;
        sessions: any[];
    } | null;
}

export const PhysioInvoice: React.FC<PhysioInvoiceProps> = ({ isOpen, onClose, patient, dues }) => {
    const { user } = useAuth();
    const invoiceRef = useRef<HTMLDivElement>(null);
    
    if (!isOpen || !patient || !dues) return null;

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const downloadPDF = async () => {
        if (!invoiceRef.current) return;
        
        try {
            const element = invoiceRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);
                        
                        // Force standard colors for everything in computed styles
                        ['backgroundColor', 'color', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                            const val = style.getPropertyValue(prop);
                            if (val && val.includes('oklch')) {
                                // Default fallback to blue if it was a blue-ish oklch, or just black/white
                                if (prop === 'backgroundColor') el.style.setProperty(prop, '#ffffff', 'important');
                                else if (prop === 'color') el.style.setProperty(prop, '#0f172a', 'important');
                                else el.style.setProperty(prop, '#3b82f6', 'important');
                            }
                        });

                        // CSS variables are the biggest culprits in Tailwind v4
                        // We already have the .invoice-container style tag, but let's be double sure
                        if (el.style.cssText.includes('oklch')) {
                            el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#3b82f6');
                        }

                        // Remove shadows as they often use complex color functions that fail in PDFs
                        if (style.boxShadow && style.boxShadow !== 'none') {
                            el.style.boxShadow = 'none';
                        }
                    }
                }
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`PhysioTrack_Invoice_${patient.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
        }
    };

    const shareWhatsApp = () => {
        const message = `Hello ${patient.name}, \nYour physiotherapy home visit invoice (${invoiceNumber}) for ${formatCurrency(dues.total)} is ready. \nThank you. \n- ${user?.name || 'PhysioTrack'}`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${encoded}`, '_blank');
    };

    const getStatusBadge = () => {
        return (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full border" style={{ backgroundColor: '#fffbeb', color: '#d97706', borderColor: '#fef3c7' }}>
                <Clock size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Payment Pending</span>
            </div>
        );
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm print:p-0 print:bg-white print:backdrop-none overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-3xl bg-slate-50/50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:rounded-none print:static"
                >
                    {/* Header - Control Bar (Hidden on Print) */}
                    <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <CreditCard size={20} />
                            </div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">Invoice <span className="not-italic text-blue-600">Engine</span></h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl px-4 h-10 border-slate-200">
                                <Printer size={16} className="mr-2" />
                                <span className="hidden sm:inline">Print</span>
                            </Button>
                            <Button variant="neutral" size="sm" onClick={downloadPDF} className="rounded-xl px-4 h-10 bg-slate-900 text-white border-none hover:bg-slate-800">
                                <Download size={16} className="mr-2" />
                                <span className="hidden sm:inline">PDF</span>
                            </Button>
                            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Printable Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 print:overflow-visible print:p-0">
                        <div ref={invoiceRef} className="invoice-container bg-white rounded-[2rem] p-8 sm:p-12 space-y-10 print:p-0" style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderWidth: '1px', borderStyle: 'solid' }}>
                            <style dangerouslySetInnerHTML={{ __html: `
                                .invoice-container {
                                    --color-blue-600: #2563eb !important;
                                    --color-blue-400: #60a5fa !important;
                                    --color-slate-50: #f8fafc !important;
                                    --color-slate-100: #f1f5f9 !important;
                                    --color-slate-200: #e2e8f0 !important;
                                    --color-slate-300: #cbd5e1 !important;
                                    --color-slate-400: #94a3b8 !important;
                                    --color-slate-500: #64748b !important;
                                    --color-slate-600: #475569 !important;
                                    --color-slate-700: #334155 !important;
                                    --color-slate-800: #1e293b !important;
                                    --color-slate-900: #0f172a !important;
                                    --color-amber-50: #fffbeb !important;
                                    --color-amber-600: #d97706 !important;
                                    --color-amber-100: #fef3c7 !important;
                                }
                                .invoice-container * {
                                    color-scheme: light !important;
                                }
                            `}} />
                            
                            {/* Medical Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: '#2563eb', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.1)' }}>
                                            <Activity size={24} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-black tracking-tighter leading-none italic" style={{ color: '#0f172a' }}>
                                                Physio<span className="font-bold not-italic" style={{ color: '#2563eb' }}>Track</span>
                                            </h1>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1" style={{ color: '#94a3b8' }}>Clinical Ledger System</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black leading-tight" style={{ color: '#0f172a' }}>{user?.name || 'Trishnamoni Haloi (PT)'}</h3>
                                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2563eb' }}>BPT, MPT (Orthopedic Physiotherapy)</p>
                                        <div className="pt-2 space-y-1">
                                            <p className="text-[10px] font-semibold flex items-center gap-2" style={{ color: '#64748b' }}>
                                                <Phone size={10} /> +91-XXXXXXXXXX
                                            </p>
                                            <p className="text-[10px] font-semibold flex items-center gap-2" style={{ color: '#64748b' }}>
                                                <MapPin size={10} /> Guwahati, Assam, India
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end gap-3 w-full sm:w-auto">
                                    {getStatusBadge()}
                                    <div className="space-y-1 pt-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#cbd5e1' }}>Voucher Number</p>
                                        <p className="text-sm font-mono font-black" style={{ color: '#0f172a' }}># {invoiceNumber}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#cbd5e1' }}>Date of Issue</p>
                                        <p className="text-sm font-mono font-black" style={{ color: '#0f172a' }}>{invoiceDate}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section Divider */}
                            <div className="relative h-[2px]" style={{ backgroundColor: '#f8fafc' }}>
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }} />
                            </div>

                            {/* Patient Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2" style={{ color: '#2563eb' }}>
                                        <User size={14} strokeWidth={2.5} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Patient Records</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-2xl font-black leading-tight" style={{ color: '#0f172a' }}>{patient.name}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold" style={{ color: '#64748b' }}>
                                            <span className="flex items-center gap-1.5"><Phone size={12} style={{ color: '#60a5fa' }} /> {patient.phone}</span>
                                            <span className="flex items-center gap-1.5"><MapPin size={12} style={{ color: '#60a5fa' }} /> {patient.address || 'Not Provided'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                                        <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Diagnosis / Clinical Condition</p>
                                        <p className="text-sm font-bold italic" style={{ color: '#334155' }}>" {patient.diagnosis || 'General Physiotherapy Rehabilitation'} "</p>
                                    </div>
                                </div>
                                <div className="rounded-[2.5rem] p-8 flex flex-col justify-center gap-1 overflow-hidden relative group" style={{ backgroundColor: '#2563eb', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.1)' }}>
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] relative z-10">Total Bill Amount</p>
                                    <p className="text-5xl font-black text-white font-mono tracking-tighter relative z-10">{formatCurrency(dues.total)}</p>
                                    <div className="mt-4 flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest relative z-10">
                                        <Activity size={12} />
                                        <span>Subsidized Home Care Fee</span>
                                    </div>
                                </div>
                            </div>

                            {/* Treatment Table */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2" style={{ color: '#94a3b8' }}>
                                        <Calendar size={14} strokeWidth={2.5} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Treatment Breakup</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-full border-none font-black text-[9px] uppercase tracking-tighter" style={{ color: '#64748b', backgroundColor: '#f1f5f9' }}>
                                        {dues.count} Unpaid Sessions
                                    </div>
                                </div>
                                <div className="border rounded-[2rem] overflow-hidden" style={{ borderColor: '#f1f5f9' }}>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Protocol / Treatment</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: '#94a3b8' }}>Fee</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dues.sessions.map((s, i) => (
                                                <tr key={i} className="text-sm border-b" style={{ borderColor: '#f8fafc' }}>
                                                    <td className="px-6 py-4 font-mono font-bold whitespace-nowrap" style={{ color: '#64748b' }}>{formatDate(s.date)}</td>
                                                    <td className="px-6 py-4 font-bold" style={{ color: '#0f172a' }}>
                                                        <div className="space-y-0.5">
                                                            <p className="font-black leading-tight" style={{ color: '#0f172a' }}>{s.diagnosis || 'Therapeutic Session'}</p>
                                                            <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#60a5fa' }}>Home Visit Protocol</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-black" style={{ color: '#020617' }}>{formatCurrency(s.sessionFee || 500)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                                <td colSpan={2} className="px-6 py-8 text-right">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Grand Total to Pay</p>
                                                        <p className="text-xs font-bold italic" style={{ color: '#64748b' }}>Net inclusive of all consultation charges</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-right">
                                                    <p className="text-3xl font-black font-mono tracking-tighter" style={{ color: '#2563eb' }}>{formatCurrency(dues.total)}</p>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Clinical Notes & Footer */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-4">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>Post-Session Advice</p>
                                    <div className="p-6 rounded-[2rem] border space-y-3 relative overflow-hidden" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                                        <div className="absolute right-4 top-4 scale-150" style={{ color: '#f1f5f9' }}>
                                            <AlertTriangle size={48} />
                                        </div>
                                        <div className="relative z-10 flex gap-3 text-[11px] font-bold leading-relaxed italic" style={{ color: '#475569' }}>
                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#60a5fa' }} />
                                            Maintain consistent ice-packs as prescribed.
                                        </div>
                                        <div className="relative z-10 flex gap-3 text-[11px] font-bold leading-relaxed italic" style={{ color: '#475569' }}>
                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#60a5fa' }} />
                                            Perform home exercise program (HEP) twice daily.
                                        </div>
                                        <div className="relative z-10 flex gap-3 text-[11px] font-bold leading-relaxed italic" style={{ color: '#475569' }}>
                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#60a5fa' }} />
                                            Next follow-up review after 24 hours.
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end items-end space-y-10">
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-8" style={{ color: '#cbd5e1' }}>Clinical Head Signature</p>
                                        <div className="w-48 h-[2px] mb-2 ml-auto" style={{ backgroundColor: '#f1f5f9' }} />
                                        <p className="font-black tracking-tighter italic text-xl" style={{ color: '#0f172a' }}>
                                            {user?.name || 'Practitioner Name'}
                                        </p>
                                        <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#3b82f6' }}>Verified Digital Entry</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 text-center border-t" style={{ borderColor: '#f8fafc' }}>
                                <p className="text-[9px] font-black uppercase tracking-[0.5em]" style={{ color: '#cbd5e1' }}>Thank you for choosing PhysioTrack • Your Recovery is Our Priority</p>
                            </div>
                        </div>

                        {/* Action Buttons Container (Hidden on Print) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden px-4 sm:px-0">
                            <Button 
                                className="h-16 rounded-[1.5rem] bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-100 space-x-3 transition-all active:scale-95 flex items-center justify-center"
                                onClick={shareWhatsApp}
                            >
                                <MessageCircle size={20} />
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-60">Send via</p>
                                    <p className="text-sm font-bold">WhatsApp</p>
                                </div>
                            </Button>
                            <Button 
                                className="h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-100 space-x-3 transition-all active:scale-95 flex items-center justify-center"
                                onClick={downloadPDF}
                            >
                                <Download size={20} />
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-60">Export to</p>
                                    <p className="text-sm font-bold">PDF Invoice</p>
                                </div>
                            </Button>
                            <Button 
                                variant="outline"
                                className="h-16 rounded-[1.5rem] bg-white border-slate-200 text-slate-600 space-x-3 transition-all active:scale-95 hover:border-blue-400 group flex items-center justify-center"
                                onClick={() => {}}
                            >
                                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-40">Direct</p>
                                    <p className="text-sm font-bold">Email to Patient</p>
                                </div>
                            </Button>
                        </div>
                    </div>
                </motion.div>
                
                {/* Print/PDF Helper Styles */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body { background: white !important; }
                        * { -webkit-print-color-adjust: exact !important; }
                        .print\\:hidden { display: none !important; }
                        .print\\:static { position: static !important; transform: none !important; }
                        .fixed { position: static !important; background: white !important; padding: 0 !important; }
                    }
                `}} />
            </div>
        </AnimatePresence>
    );
};
