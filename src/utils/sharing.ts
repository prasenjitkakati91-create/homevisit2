import { jsPDF } from 'jspdf';
import { formatDate, formatCurrency } from './helpers';

export const generateReceiptPDF = (patient: any, session: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('PhysioTrack Receipt', 105, 20, { align: 'center' });
  
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(20, 30, 190, 30);
  
  // Patient Info
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('PATIENT DETAILS', 20, 45);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.text(patient.name, 20, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`Phone: ${patient.phone}`, 20, 58);
  doc.text(`Address: ${patient.address}`, 20, 64);
  
  // Session Info
  doc.setTextColor(100, 116, 139);
  doc.text('SESSION DETAILS', 120, 45);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date: ${formatDate(session.date)}`, 120, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID: ${(session.id || '').substring(0, 8).toUpperCase()}`, 120, 58);
  
  // Treatment Table Header
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(20, 80, 170, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Treatment Done', 25, 87);
  doc.text('Amount', 160, 87);
  
  // Table Content
  doc.setFont('helvetica', 'normal');
  const treatmentLines = doc.splitTextToSize(session.treatmentDone, 120);
  doc.text(treatmentLines, 25, 100);
  doc.text(formatCurrency(session.amountPaid), 160, 100);
  
  // Total
  doc.line(20, 140, 190, 140);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAID', 25, 150);
  doc.text(formatCurrency(session.amountPaid), 160, 150);
  
  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(156, 163, 175); // slate-400
  doc.text('This is a computer generated receipt.', 105, 280, { align: 'center' });
  
  doc.save(`Receipt_${patient.name.replace(/\s/g, '_')}_${formatDate(session.date)}.pdf`);
};

export const shareOnWhatsApp = (phone: string, message: string) => {
  const formattedPhone = phone.startsWith('+') ? phone.replace('+', '') : `91${phone}`;
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const generateAppointmentMessage = (patientName: string, date: string) => {
  return `Hello ${patientName}, this is a reminder for your next Physiotherapy session scheduled on ${formatDate(date)}. Please be ready. Thanks, PhysioTrack.`;
};

export const generatePaymentMessage = (patientName: string, amount: number, date: string) => {
  return `Hello ${patientName}, thank you for the payment of ${formatCurrency(amount)} for the session on ${formatDate(date)}. Receipt has been generated in your profile. Thanks, PhysioTrack.`;
};
