import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { appointmentAPI, slipAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import AppointmentCard from '../../components/AppointmentCard';
import AIChatBot from '../../components/AIChatBot';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentAPI.getAll(),
      slipAPI.getAll(),
    ]).then(([apptRes, slipRes]) => {
      setAppointments(apptRes.data);
      setSlips(slipRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const upcoming = appointments.filter(a => a.status === 'scheduled');
  const completed = appointments.filter(a => a.status === 'completed');

  return (
    <div>
      <div className="page-title">
        <h2>Welcome, {user?.name} 👋</h2>
        <p>Your health dashboard — Hospital BI</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📅" value={upcoming.length} label="Upcoming Appointments" color="cyan" delay={0} />
        <StatCard icon="✅" value={completed.length} label="Completed Visits" color="green" delay={0.1} />
        <StatCard icon="📋" value={slips.length} label="Health Slips" color="purple" delay={0.2} />
        <StatCard icon="🏥" value={appointments.length} label="Total Appointments" color="orange" delay={0.3} />
      </div>

      {/* Quick Actions */}
      <motion.div className="glass-card-static" style={{ marginBottom: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/patient/appointments" className="btn btn-primary">📅 Book Appointment</Link>
          <Link to="/patient/slips" className="btn btn-secondary">📋 View Health Slips</Link>
          <Link to="/patient/map" className="btn btn-secondary">🗺️ Hospital Map</Link>
          <Link to="/patient/chat" className="btn btn-secondary">🤖 AI Health Chat</Link>
        </div>
      </motion.div>

      {/* Upcoming Appointments */}
      <motion.div className="glass-card-static" style={{ marginBottom: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📅 Upcoming Appointments</h3>
        {upcoming.length > 0 ? (
          <div className="appointments-list">
            {upcoming.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-icon">📅</div>
            <h3>No upcoming appointments</h3>
            <p>Book an appointment to get started</p>
          </div>
        )}
      </motion.div>

      {/* Latest Health Slip */}
      {slips.length > 0 && (
        <motion.div className="glass-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📋 Latest Health Report</h3>
          <div style={{ padding: '16px', background: 'rgba(6,182,212,0.06)', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.1)' }}>
            <p style={{ marginBottom: '8px' }}><strong>Diagnosis:</strong> {slips[0].diagnosis}</p>
            <p style={{ marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}>
              By Dr. {slips[0].doctor_name} • Room {slips[0].doctor_room} • {new Date(slips[0].issued_at).toLocaleDateString()}
            </p>
            <Link to="/patient/slips" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>View all slips →</Link>
          </div>
        </motion.div>
      )}

      <AIChatBot />
    </div>
  );
}
