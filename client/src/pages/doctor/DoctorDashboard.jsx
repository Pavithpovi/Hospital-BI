import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { appointmentAPI, statsAPI, logAPI } from '../../api/api';
import StatCard from '../../components/StatCard';
import AppointmentCard from '../../components/AppointmentCard';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentAPI.getAll(),
      logAPI.getAll(),
    ]).then(([apptRes, logRes]) => {
      setAppointments(apptRes.data);
      setLogs(logRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const scheduled = appointments.filter(a => a.status === 'scheduled');
  const completed = appointments.filter(a => a.status === 'completed');
  const today = new Date().toDateString();
  const todayAppts = scheduled.filter(a => new Date(a.appointment_date).toDateString() === today);

  return (
    <div>
      <div className="page-title">
        <h2>Doctor Dashboard</h2>
        <p>Welcome back! Here's your overview for today.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📅" value={todayAppts.length} label="Today's Appointments" color="cyan" delay={0} />
        <StatCard icon="⏳" value={scheduled.length} label="Scheduled" color="purple" delay={0.1} />
        <StatCard icon="✅" value={completed.length} label="Completed" color="green" delay={0.2} />
        <StatCard icon="📋" value={logs.length} label="Patient Logs" color="orange" delay={0.3} />
      </div>

      {/* Today's Appointments */}
      <motion.div className="glass-card-static" style={{ marginBottom: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📅 Today's Schedule</h3>
        {todayAppts.length > 0 ? (
          <div className="appointments-list">
            {todayAppts.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-icon">☀️</div>
            <h3>No appointments today</h3>
            <p>Enjoy your day!</p>
          </div>
        )}
      </motion.div>

      {/* Upcoming */}
      <motion.div className="glass-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>⏳ Upcoming Appointments</h3>
        <div className="appointments-list">
          {scheduled.slice(0, 5).map(appt => (
            <AppointmentCard key={appt.id} appointment={appt} showActions={false} />
          ))}
          {scheduled.length === 0 && (
            <div className="empty-state" style={{ padding: '24px' }}><p>No upcoming appointments</p></div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
