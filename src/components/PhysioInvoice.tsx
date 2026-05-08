import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    // Temporarily sanitizing styles to prevent html2canvas oklab/oklch errors
    const styleTags = Array.from(document.querySelectorAll("style"));
    const originalStyles = styleTags.map((tag) => tag.innerHTML);

    try {
      // Apply safe fallbacks for oklab, oklch and color-mix
      styleTags.forEach((tag) => {
        if (
          tag.innerHTML.includes("okl") ||
          tag.innerHTML.includes("color-mix")
        ) {
          let text = tag.innerHTML;
          // Replace modern color functions with white (safe fallback to prevent crash)
          text = text.replace(/(oklch|oklab)\([^)]+\)/g, "#ffffff");
          text = text.replace(/color-mix\([^)]+\)/g, "#ffffff");
          // Replace color space indications that might confuse older parsers
          text = text.replace(/in oklab|in oklch/g, "in srgb");
          tag.innerHTML = text;
        }
      });

      const element = invoiceRef.current;

      // Ensure the element is visible and has proper background for capture
      const originalStyle = element.style.cssText;
      element.style.backgroundColor = "#ffffff";

      element.classList.add("pdf-export");

      // STEP 1 & 2: Capture and convert to canvas
      const canvas = await html2canvas(element, {
        scale: 3, // Increased scale for better mobile export quality
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("invoice-container");
          if (clonedElement) {
            clonedElement.style.boxShadow = "none";
            clonedElement.style.border = "none";
            clonedElement.style.width = "800px"; // Force width during capture for consistent layout
            clonedElement.style.margin = "0";
            clonedElement.style.padding = "40px";
          }
        },
      });

      // Cleanup CSS overrides occurs in finally block

      // STEP 3: Generate PDF
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

      // STEP 4: Save
      pdf.save(`Invoice-${invoiceNumber.replace(/\s+/g, "-")}.pdf`);

      showToast("PDF downloaded successfully", "success");
      return pdf; // Return for sharing if needed
    } catch (error) {
      console.error("PDF generation failed:", error);
      showToast("Error generating PDF. Please try again.", "error");
      return null;
    } finally {
      // Restore original styles
      styleTags.forEach((tag, index) => {
        tag.innerHTML = originalStyles[index];
      });
      if (invoiceRef.current) {
        invoiceRef.current.classList.remove("pdf-export");
        invoiceRef.current.style.cssText = ""; // Reset inline styles
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

      // Simple, reliable wa.me link
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
      
      // Open in new tab
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
      <div className="flex items-center gap-1 px-3 py-1 rounded-full border bg-amber-50 text-amber-600 border-amber-100">
        <Clock size={12} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Payment Pending
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6 bg-slate-900/40 backdrop-blur-sm print:p-0 print:bg-white print:backdrop-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full h-full sm:h-auto sm:max-w-3xl bg-slate-50/50 rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:rounded-none print:static"
        >
          {/* Header - Control Bar (Hidden on Print) */}
          <div className="px-4 sm:px-8 py-4 sm:py-5 bg-white border-b border-slate-100 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CreditCard size={18} />
              </div>
              <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest italic">
                Invoice <span className="not-italic text-blue-600">Engine</span>
              </h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handlePrint}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 transition-colors"
                title="Print Invoice"
              >
                <Printer size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div className="flex-1 overflow-y-auto p-0 sm:p-8 space-y-4 sm:space-y-6 print:overflow-visible print:p-0">
            <div
              ref={invoiceRef}
              id="invoice-container"
              className="invoice-container bg-white rounded-none sm:rounded-[2rem] border-x-0 sm:border border-slate-100 p-4 sm:p-12 space-y-8 sm:space-y-10 print:p-0"
            >
              {/* Medical Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black leading-tight text-slate-900">
                      {user?.name || "Trishnamoni Haloi (PT)"}
                    </h3>
                    <div className="pt-2 space-y-1">
                      <p className="text-[10px] font-semibold flex items-center gap-2 text-slate-500">
                        <Phone size={10} /> +91-8473809386
                      </p>
                      <p className="text-[10px] font-semibold flex items-center gap-2 text-slate-500">
                        <MapPin size={10} /> Guwahati, Assam, India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-3 w-full sm:w-auto">
                  {getStatusBadge()}
                  <div className="space-y-1 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Voucher Number
                    </p>
                    <p className="text-sm font-mono font-black text-slate-900">
                      # {invoiceNumber}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Date of Issue
                    </p>
                    <p className="text-sm font-mono font-black text-slate-900">
                      {invoiceDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Divider */}
              <div className="relative h-[2px] bg-slate-50">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full bg-blue-600/10" />
              </div>

              {/* Patient Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <User size={14} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Patient Records
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-black leading-tight text-slate-900">
                      {patient.name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} className="text-blue-400" />{" "}
                        {patient.phone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-blue-400" />{" "}
                        {patient.address || "Not Provided"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border bg-slate-50 border-slate-100">
                    <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-slate-400">
                      Diagnosis / Clinical Condition
                    </p>
                    <p className="text-sm font-bold italic text-slate-700">
                      "{" "}
                      {patient.diagnosis ||
                        "General Physiotherapy Rehabilitation"}{" "}
                      "
                    </p>
                  </div>
                </div>
                <div className="rounded-[2.5rem] p-8 flex flex-col justify-center gap-1 overflow-hidden relative group bg-blue-600 shadow-2xl shadow-blue-600/20">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] relative z-10">
                    Total Bill Amount
                  </p>
                  <p className="text-5xl font-black text-white font-mono tracking-tighter relative z-10">
                    {formatCurrency(dues.total)}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest relative z-10">
                    <Activity size={12} />
                    <span>Subsidized Home Care Fee</span>
                  </div>
                </div>
              </div>

              {/* Treatment Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Treatment Breakup
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full border-none font-black text-[9px] uppercase tracking-tighter bg-slate-100 text-slate-500">
                    {dues.count} Unpaid Sessions
                  </div>
                </div>
                <div className="border rounded-2xl sm:rounded-[2rem] overflow-x-auto border-slate-100">
                  <table className="w-full text-left border-collapse min-w-[450px] sm:min-w-0">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Date
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Protocol / Treatment
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">
                          Fee
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dues.sessions.map((s, i) => (
                        <tr
                          key={i}
                          className="text-sm border-b border-slate-50"
                        >
                          <td className="px-4 sm:px-6 py-4 font-mono font-bold whitespace-nowrap text-slate-500 text-xs sm:text-sm">
                            {formatDate(s.date)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-bold text-slate-900">
                            <div className="space-y-0.5">
                              <p className="font-black leading-tight text-slate-900 text-xs sm:text-sm">
                                {s.diagnosis || "Therapeutic Session"}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-tighter text-blue-400">
                                Home Visit Protocol
                              </p>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right font-mono font-black text-slate-950 text-xs sm:text-sm">
                            {formatCurrency(s.sessionFee || 500)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={2} className="px-4 sm:px-6 py-6 sm:py-8 text-right">
                          <div className="space-y-1">
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
                              Grand Total to Pay
                            </p>
                            <p className="text-[10px] sm:text-xs font-bold italic text-slate-500">
                              Net inclusive of all clinical consultation charges
                            </p>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-6 sm:py-8 text-right">
                          <p className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-blue-600">
                            {formatCurrency(dues.total)}
                          </p>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Clinical Notes & Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-4">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Post-Session Advice
                  </p>
                  <div className="p-6 rounded-[2rem] border space-y-3 relative overflow-hidden bg-slate-50 border-slate-100">
                    <div className="absolute right-4 top-4 scale-150 text-slate-100">
                      <AlertTriangle size={48} />
                    </div>
                    <div className="relative z-10 flex gap-3 text-[11px] font-bold leading-relaxed italic text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-400" />
                      Maintain consistent ice-packs as prescribed.
                    </div>
                    <div className="relative z-10 flex gap-3 text-[11px] font-bold leading-relaxed italic text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-400" />
                      Perform home exercise program (HEP) twice daily.
                    </div>
                    <div className="relative z-10 flex gap-3 text-[11px] font-bold leading-relaxed italic text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-400" />
                      Next follow-up review after 24 hours.
                    </div>
                  </div>
                </div>
              {/* Final Footer Spacer */}
              <div className="pt-6" />
            </div>
          </div>

            {/* Action Buttons Container (Hidden on Print) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden px-4 sm:px-0">
              <Button
                className="h-16 rounded-[1.5rem] bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-100 space-x-3 transition-all active:scale-95 flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed"
                onClick={shareWhatsApp}
                disabled={isWaLoading}
              >
                {isWaLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <MessageCircle size={20} />
                )}
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-60">
                    Send via
                  </p>
                  <p className="text-sm font-bold">WhatsApp</p>
                </div>
              </Button>
              <Button
                className="h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-100 space-x-3 transition-all active:scale-95 flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed"
                onClick={downloadPDF}
                disabled={isPdfLoading}
              >
                {isPdfLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-60">
                    Export to
                  </p>
                  <p className="text-sm font-bold">PDF Invoice</p>
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
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm ${
                toastMessage.type === "success"
                  ? "bg-green-600 text-white shadow-green-900/20"
                  : toastMessage.type === "error"
                    ? "bg-red-600 text-white shadow-red-900/20"
                    : "bg-slate-800 text-white shadow-slate-900/20"
              }`}
            >
              {toastMessage.type === "success" && <CheckCircle2 size={18} />}
              {toastMessage.type === "error" && <AlertTriangle size={18} />}
              {toastMessage.type === "info" && (
                <Loader2 size={18} className="animate-spin" />
              )}
              {toastMessage.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
