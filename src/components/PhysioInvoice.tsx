import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Printer,
  Download,
  Share2,
  MessageCircle,
  Send,
  TrendingUp,
  User,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { Button, Badge } from "./ui/Generic";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

export const PhysioInvoice: React.FC<PhysioInvoiceProps> = ({
  isOpen,
  onClose,
  patient,
  dues,
}) => {
  const { user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isWaLoading, setIsWaLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  if (!isOpen || !patient || !dues) return null;

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;

    setIsPdfLoading(true);
    showToast("Generating PDF...", "info");

    const styleTags = Array.from(document.querySelectorAll("style"));
    const originalStyles = styleTags.map((tag) => tag.innerHTML);

    try {
      styleTags.forEach((tag) => {
        if (
          tag.innerHTML.includes("okl") ||
          tag.innerHTML.includes("color-mix")
        ) {
          let text = tag.innerHTML;
          text = text.replace(/(oklch|oklab)\([^)]+\)/g, "#ffffff");
          text = text.replace(/color-mix\([^)]+\)/g, "#ffffff");
          text = text.replace(/in oklab|in oklch/g, "in srgb");
          tag.innerHTML = text;
        }
      });

      const element = invoiceRef.current;
      const originalStyle = element.style.cssText;
      element.style.backgroundColor = "#ffffff";
      element.classList.add("pdf-export");

      const canvas = await html2canvas(element, {
        scale: 3, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("invoice-container");
          if (clonedElement) {
            clonedElement.style.boxShadow = "none";
            clonedElement.style.border = "none";
            clonedElement.style.width = "800px"; 
            clonedElement.style.margin = "0";
            clonedElement.style.padding = "40px";
            clonedElement.style.background = "#ffffff";
            clonedElement.style.borderRadius = "0";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
      pdf.save(`Invoice-${invoiceNumber.replace(/\s+/g, "-")}.pdf`);

      showToast("PDF downloaded successfully", "success");
      return pdf; 
    } catch (error) {
      console.error("PDF generation failed:", error);
      showToast("Error generating PDF. Please try again.", "error");
      return null;
    } finally {
      styleTags.forEach((tag, index) => {
        tag.innerHTML = originalStyles[index];
      });
      if (invoiceRef.current) {
        invoiceRef.current.classList.remove("pdf-export");
        invoiceRef.current.style.cssText = ""; 
      }
      setIsPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const shareWhatsApp = async () => {
    setIsWaLoading(true);
    showToast("Opening WhatsApp...", "info");

    try {
      const phoneNumber = patient.phone ? patient.phone.replace(/\D/g, "") : "";
      if (!phoneNumber) {
        showToast("Patient phone number is missing", "error");
        setIsWaLoading(false);
        return;
      }

      const formattedPhone =
        phoneNumber.length === 10 ? `91${phoneNumber}` : phoneNumber;

      const message = `Hello *${patient.name}*,\n\nYour physiotherapy treatment invoice is ready.\n\n*Invoice No:* ${invoiceNumber}\n*Total Outstanding:* ${formatCurrency(dues.total)}\n\nThank you for your visit.\n\n_Dr. Trishnamoni Haloi (PT)_`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
      
      window.open(whatsappUrl, "_blank");
      showToast("WhatsApp opened", "success");
    } catch (err) {
      console.error("WhatsApp error", err);
      showToast("Failed to open WhatsApp", "error");
    } finally {
      setIsWaLoading(false);
    }
  };

  const getStatusBadge = () => {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-[1rem] bg-amber-500/10 text-amber-600 border border-amber-500/20 backdrop-blur-md">
        <Clock size={12} strokeWidth={3} className="animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-widest leading-none pt-0.5">
          Payment Pending
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-md print:p-0 print:bg-white print:backdrop-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full h-full sm:h-auto sm:max-w-3xl bg-slate-50/90 backdrop-blur-3xl border border-white/50 rounded-none sm:rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:rounded-none print:static"
        >
          {/* Header - Control Bar (Hidden on Print) */}
          <div className="px-5 sm:px-8 py-5 sm:py-6 bg-white/80 backdrop-blur-xl border-b border-white/60 flex items-center justify-between print:hidden pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 rounded-[1.25rem] shadow-sm">
                <CreditCard size={18} strokeWidth={2.5}/>
              </div>
              <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Legal</p>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">
                    Invoice <span className="not-italic text-blue-800">Engine</span>
                  </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-[1rem] text-slate-400 hover:text-blue-600 transition-colors shadow-sm active:scale-95 cursor-pointer"
                title="Print Invoice"
              >
                <Printer size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-[1rem] text-slate-400 hover:text-slate-900 transition-colors shadow-sm active:scale-95 cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div className="flex-1 overflow-y-auto p-0 sm:p-8 space-y-4 sm:space-y-6 print:overflow-visible print:p-0 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] pointer-events-none print:hidden" />
            <div
              ref={invoiceRef}
              id="invoice-container"
              className="invoice-container bg-white rounded-none sm:rounded-[2.5rem] border-x-0 sm:border border-slate-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-6 sm:p-14 space-y-10 sm:space-y-12 print:p-0 print:border-none print:shadow-none relative z-10"
            >
              {/* Medical Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight leading-none text-slate-900 italic">
                      {user?.name || "Trishnamoni Haloi (PT)"}
                    </h3>
                    <div className="pt-3 space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                        <Phone size={12} strokeWidth={2.5}/> +91-8473809386
                      </p>
                      <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                        <MapPin size={12} strokeWidth={2.5}/> Guwahati, Assam, India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-5 w-full sm:w-auto">
                  {getStatusBadge()}
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 leading-none">
                      Voucher Number
                    </p>
                    <p className="text-lg font-mono font-black text-slate-900 leading-none pt-1">
                      # {invoiceNumber}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 leading-none">
                      Date of Issue
                    </p>
                    <p className="text-base font-mono font-black text-slate-900 leading-none pt-1">
                      {invoiceDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Divider */}
              <div className="relative h-[1px] bg-slate-100">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
              </div>

              {/* Patient Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] print:hidden" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">
                      Patient Records
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-3xl font-black tracking-tight leading-none text-slate-900 italic pr-4 break-words">
                      {patient.name}
                    </p>
                    <div className="flex flex-col gap-2 pt-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-2">
                        <Phone size={14} className="text-blue-400" strokeWidth={2.5}/>{" "}
                        {patient.phone}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-400 flex-shrink-0" strokeWidth={2.5}/>{" "}
                        <span className="max-w-[200px] truncate" title={patient.address || "Not Provided"}>{patient.address || "Not Provided"}</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-5 rounded-[1.5rem] bg-slate-50/80 border border-slate-100 backdrop-blur-sm relative overflow-hidden mt-4">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none print:hidden"/>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-slate-400 leading-none">
                      Clinical Condition
                    </p>
                    <p className="text-sm font-bold italic text-slate-700 leading-snug">
                      "{" "}
                      {patient.diagnosis ||
                        "General Physiotherapy Rehabilitation"}{" "}
                      "
                    </p>
                  </div>
                </div>
                
                <div className="rounded-[2.5rem] p-8 flex flex-col justify-center gap-2 overflow-hidden relative group bg-gradient-to-br from-slate-900 to-slate-950 shadow-[0_20px_40px_rgba(15,23,42,0.3)] print:shadow-none print:border print:border-slate-300 print:bg-white print:text-slate-900">
                  <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-500/20 blur-[50px] rounded-full group-hover:scale-110 group-hover:bg-blue-400/30 transition-all duration-700 print:hidden" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] relative z-10 leading-none print:text-slate-500">
                    Total Bill Amount
                  </p>
                  <p className="text-5xl font-black text-white font-mono tracking-tighter relative z-10 py-1 print:text-slate-900">
                    {formatCurrency(dues.total)}
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-slate-300 text-[9px] font-black uppercase tracking-[0.2em] relative z-10 leading-none print:border-slate-200 print:text-slate-500">
                    <Activity size={14} className="text-blue-400 print:text-slate-500" strokeWidth={2.5}/>
                    <span>Subsidized Home Care Fee</span>
                  </div>
                </div>
              </div>

              {/* Treatment Table */}
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Calendar size={16} strokeWidth={2.5} className="text-blue-500"/>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                      Treatment Breakup
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-[0.75rem] bg-indigo-50 border border-indigo-100 font-black text-[9px] uppercase tracking-widest text-indigo-600 shadow-sm print:border-none print:bg-slate-100 print:text-slate-600">
                    {dues.count} Unpaid Sessions
                  </div>
                </div>
                <div className="border border-slate-200/60 rounded-[1.5rem] overflow-hidden bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] print:border-slate-300 print:shadow-none">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                        <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 print:bg-slate-50">
                        <tr>
                            <th className="px-5 sm:px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">
                            Date
                            </th>
                            <th className="px-5 sm:px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">
                            Protocol / Treatment
                            </th>
                            <th className="px-5 sm:px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-right text-slate-400 leading-none">
                            Fee
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {dues.sessions.map((s, i) => (
                            <tr
                            key={i}
                            className="bg-white hover:bg-slate-50/50 transition-colors print:bg-white"
                            >
                            <td className="px-5 sm:px-8 py-5">
                                <div className="inline-flex items-center px-2 py-1 rounded-[0.5rem] bg-slate-50 border border-slate-100 text-[11px] font-black font-mono tracking-widest text-slate-500 print:border-none print:p-0 print:bg-transparent">
                                 {formatDate(s.date)}
                                </div>
                            </td>
                            <td className="px-5 sm:px-8 py-5">
                                <div className="space-y-1.5 w-full max-w-[200px] sm:max-w-none">
                                <p className="font-bold leading-snug text-slate-900 text-sm italic truncate" title={s.diagnosis || "Therapeutic Session"}>
                                    {s.diagnosis || "Therapeutic Session"}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-50 rounded-[0.5rem] px-2 py-0.5 inline-block print:bg-transparent print:p-0 print:text-slate-500">
                                    Home Visit Protocol
                                </p>
                                </div>
                            </td>
                            <td className="px-5 sm:px-8 py-5 text-right font-mono font-black text-slate-900 text-base">
                                {formatCurrency(s.sessionFee || 500)}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                        <tfoot className="bg-slate-50/80 backdrop-blur-sm border-t border-slate-200 shadow-inner print:bg-slate-100 print:shadow-none print:border-slate-300">
                        <tr>
                            <td colSpan={2} className="px-5 sm:px-8 py-6 sm:py-8 text-right">
                            <div className="space-y-1.5 flex flex-col items-end">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">
                                Grand Total to Pay
                                </p>
                                <p className="text-[9px] font-bold italic text-slate-400 bg-white/60 px-2 py-1 rounded-[0.5rem] border border-slate-100 print:bg-transparent print:border-none print:p-0">
                                Net inclusive of all clinical consultation charges
                                </p>
                            </div>
                            </td>
                            <td className="px-5 sm:px-8 py-6 sm:py-8 text-right bg-white print:bg-transparent">
                            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-blue-700">
                                {formatCurrency(dues.total)}
                            </p>
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Clinical Notes & Footer */}
              <div className="pt-4 relative z-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">
                    Post-Session Advice
                  </p>
                  <div className="p-8 rounded-[2rem] border bg-amber-50/50 border-amber-100/50 space-y-4 relative overflow-hidden print:border-slate-300 print:bg-white">
                    <div className="absolute right-4 top-4 scale-150 text-amber-500/10 print:hidden">
                      <AlertTriangle size={64} />
                    </div>
                    <div className="relative z-10 flex gap-4 text-xs font-bold leading-relaxed italic text-slate-700">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] print:shadow-none" />
                      Maintain consistent ice-packs as prescribed.
                    </div>
                    <div className="relative z-10 flex gap-4 text-xs font-bold leading-relaxed italic text-slate-700">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] print:shadow-none" />
                      Perform home exercise program (HEP) twice daily.
                    </div>
                    <div className="relative z-10 flex gap-4 text-xs font-bold leading-relaxed italic text-slate-700">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] print:shadow-none" />
                      Next follow-up review after 24 hours.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Container (Hidden on Print) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden px-4 sm:px-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-0 relative z-20">
              <Button
                className="h-20 rounded-[2rem] bg-gradient-to-tr from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white border-none shadow-[0_8px_25px_-5px_rgba(16,185,129,0.4)] space-x-4 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed group"
                onClick={shareWhatsApp}
                disabled={isWaLoading}
              >
                <div className="p-3 bg-white/20 rounded-[1rem] group-hover:bg-white/30 transition-colors">
                  {isWaLoading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <MessageCircle size={24} strokeWidth={2.5}/>
                  )}
                </div>
                <div className="text-left space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] leading-none text-green-100">
                    Send via
                  </p>
                  <p className="text-base font-black leading-none">WhatsApp</p>
                </div>
              </Button>
              <Button
                className="h-20 rounded-[2rem] bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white border-none shadow-[0_8px_25px_-5px_rgba(15,23,42,0.4)] space-x-4 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed group"
                onClick={downloadPDF}
                disabled={isPdfLoading}
              >
                <div className="p-3 bg-white/10 rounded-[1rem] group-hover:bg-white/20 transition-colors border border-white/10">
                  {isPdfLoading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Download size={24} strokeWidth={2.5} />
                  )}
                </div>
                <div className="text-left space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] leading-none text-slate-400">
                    Export to
                  </p>
                  <p className="text-base font-black leading-none">PDF Invoice</p>
                </div>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Print/PDF Helper Styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
                    @media print {
                        body { background: white !important; }
                        * { -webkit-print-color-adjust: exact !important; }
                        .print\\:hidden { display: none !important; }
                        .print\\:static { position: static !important; transform: none !important; }
                        .fixed { position: static !important; background: white !important; padding: 0 !important; }
                        #invoice-container { box-shadow: none !important; border: none !important; margin: 0 auto !important; width: 100% !important; max-width: 800px !important; }
                    }
                `,
          }}
        />

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className={`fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 font-bold text-sm backdrop-blur-md border ${
                toastMessage.type === "success"
                  ? "bg-emerald-900/90 text-emerald-50 border-emerald-500/20"
                  : toastMessage.type === "error"
                    ? "bg-red-900/90 text-red-50 border-red-500/20"
                    : "bg-slate-900/90 text-slate-50 border-slate-500/20"
              }`}
            >
              {toastMessage.type === "success" && <CheckCircle2 size={20} className="text-emerald-400"/>}
              {toastMessage.type === "error" && <AlertTriangle size={20} className="text-red-400"/>}
              {toastMessage.type === "info" && (
                <Loader2 size={20} className="animate-spin text-blue-400" />
              )}
              {toastMessage.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
