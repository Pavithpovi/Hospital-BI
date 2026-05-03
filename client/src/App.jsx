import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminPatients from './pages/admin/AdminPatients';
import AdminAppointments from './pages/admin/AdminAppointments';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointment from './pages/patient/PatientAppointment';
import PatientSlipPage from './pages/patient/PatientSlipPage';
import PatientMap from './pages/patient/PatientMap';
import PatientChat from './pages/patient/PatientChat';

function DashboardLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: '48px', height: '48px' }}></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <RegisterPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout title="Dashboard" subtitle="Admin Overview">
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/doctors" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout title="Doctors" subtitle="Manage Hospital Doctors">
            <AdminDoctors />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/patients" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout title="Patients" subtitle="Patient Management">
            <AdminPatients />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/appointments" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout title="Appointments" subtitle="All Appointments">
            <AdminAppointments />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Routes */}
      <Route path="/doctor" element={
        <ProtectedRoute roles={['doctor']}>
          <DashboardLayout title="Dashboard" subtitle="Doctor Overview">
            <DoctorDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/patients" element={
        <ProtectedRoute roles={['doctor']}>
          <DashboardLayout title="My Patients" subtitle="Assigned Patients">
            <DoctorPatients />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/schedule" element={
        <ProtectedRoute roles={['doctor']}>
          <DashboardLayout title="Schedule" subtitle="Appointment Schedule">
            <DoctorSchedule />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Patient Routes */}
      <Route path="/patient" element={
        <ProtectedRoute roles={['patient']}>
          <DashboardLayout title="Dashboard" subtitle="Patient Portal">
            <PatientDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/appointments" element={
        <ProtectedRoute roles={['patient']}>
          <DashboardLayout title="Appointments" subtitle="Book & View">
            <PatientAppointment />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/slips" element={
        <ProtectedRoute roles={['patient']}>
          <DashboardLayout title="Health Slips" subtitle="Medical Reports">
            <PatientSlipPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/map" element={
        <ProtectedRoute roles={['patient']}>
          <DashboardLayout title="Hospital Map" subtitle="Navigation">
            <PatientMap />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/chat" element={
        <ProtectedRoute roles={['patient']}>
          <DashboardLayout title="AI Health Chat" subtitle="Ask Hospital BI Assistant">
            <PatientChat />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
