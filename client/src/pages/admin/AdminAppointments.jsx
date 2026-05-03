import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { appointmentAPI } from '../../api/api';
import AppointmentCard from '../../components/AppointmentCard';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchAppointments(); }, [filter]);

  const fetchAppointments = () => {
    setLoading(true);
    appointmentAPI.getAll(filter || undefined)
      .then(res => setAppointments(res.data))
      .finally(() => setLoading(false));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = async (action, appt) => {
    try {
      if (action === 'complete') {
        await appointmentAPI.update(appt.id, { status: 'completed', notes: 'Consultation completed' });
        showToast('Appointment marked as completed!');
      } else if (action === 'cancel') {
        await appointmentAPI.update(appt.id, { status: 'cancelled', notes: 'Appointment cancelled by admin' });
        showToast('Appointment cancelled', 'error');
      } else if (action === 'email') {
        const res = await appointmentAPI.sendConfirmation(appt.id);
        showToast(res.data.message || 'Email sent!', res.data.email_sent ? 'success' : 'info');
      }
      fetchAppointments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    }
  };

  return (
    <div>
      <div className="page-title">
        <h2>📅 Appointment Management</h2>
        <p>View, manage, and send confirmations for all appointments</p>
      </div>

      {/* Filter */}
      <div className="tab-group">
        {['', 'scheduled', 'completed', 'cancelled'].map(s => (
          <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s || 'All'} {s === 'scheduled' ? '📅' : s === 'completed' ? '✅' : s === 'cancelled' ? '❌' : '📊'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <motion.div className="appointments-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {appointments.map((appt, i) => (
            <motion.div key={appt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <AppointmentCard appointment={appt} onAction={handleAction} />
            </motion.div>
          ))}
          {appointments.length === 0 && (
            <div className="empty-state"><div className="empty-icon">📅</div><h3>No appointments found</h3></div>
          )}
        </motion.div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'} {toast.message}
        </div>
      )}
    </div>
  );
}
