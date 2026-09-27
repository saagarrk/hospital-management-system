import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

// Module Components
import { DashboardModule } from './components/modules/DashboardModule';
import { AppointmentModule } from './components/modules/AppointmentModule';
import { PatientModule } from './components/modules/PatientModule';
import { DoctorModule } from './components/modules/DoctorModule';
import { MedicalRecordModule } from './components/modules/MedicalRecordModule';
import { PrescriptionModule } from './components/modules/PrescriptionModule';
import { PharmacyModule } from './components/modules/PharmacyModule';
import { LaboratoryModule } from './components/modules/LaboratoryModule';
import { InpatientModule } from './components/modules/InpatientModule';
import { BillingModule } from './components/modules/BillingModule';
import { BackendHubModule } from './components/modules/BackendHubModule';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Protected Routes inside Main Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']}>
                <MainLayout>
                  <AppointmentModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE']}>
                <MainLayout>
                  <PatientModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']}>
                <MainLayout>
                  <DoctorModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/records"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']}>
                <MainLayout>
                  <MedicalRecordModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE', 'PATIENT']}>
                <MainLayout>
                  <PrescriptionModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
                <MainLayout>
                  <PharmacyModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/laboratory"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE', 'PATIENT']}>
                <MainLayout>
                  <LaboratoryModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inpatient"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
                <MainLayout>
                  <InpatientModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'PATIENT']}>
                <MainLayout>
                  <BillingModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout>
                  <AuditLogsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/backend-hub"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BackendHubModule />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
