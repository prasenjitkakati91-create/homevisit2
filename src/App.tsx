import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { AppLayout, AuthLayout } from './layouts/Layouts';
import { Toaster } from 'sonner';
import { Dashboard } from './pages/Dashboard';
import { PatientList, AddPatient, EditPatient } from './pages/Patients';
import { PatientDetail, CaseAdd, CaseDetail, SessionAdd, EditSession } from './pages/Treatment';

import { CalendarPage } from './pages/Calendar';
import { Payments } from './pages/Payments';

export default function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/add" element={<AddPatient />} />
            <Route path="/patients/:patientId" element={<PatientDetail />} />
            <Route path="/patients/:patientId/edit" element={<EditPatient />} />
            <Route path="/patients/:patientId/cases/add" element={<CaseAdd />} />
            <Route path="/patients/:patientId/cases/:caseId" element={<CaseDetail />} />
            <Route path="/patients/:patientId/cases/:caseId/sessions/add" element={<SessionAdd />} />
            <Route path="/patients/:patientId/cases/:caseId/sessions/:sessionId/edit" element={<EditSession />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/payments" element={<Payments />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SearchProvider>
    </AuthProvider>
  );
}
