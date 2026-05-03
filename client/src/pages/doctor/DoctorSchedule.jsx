import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { appointmentAPI } from '../../api/api';
import AppointmentCard from '../../components/AppointmentCard';

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchAppts(); }, [filter]);

  const fetchAppts = () => {
    setLoading(true);
    appointmentAPI.getAll(filter || undefined).then(res => setAppointments(res.data)).finally(() => setLoading(false));
  };

  const handleAction = async (action, appt) => {
    try {
      if (action === 'complete') {
        await appointmentAPI.update(appt.id, { status: 'completed' });
      } else if (action === 'cancel') {
        await appointmentAPI.update(appt.id, { status: 'cancelled' });
      } else if (action === 'email') {
        await appointmentAPI.sendConfirmation(appt.id);
      }
      setToast({ message: `Action "${action}" completed!`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
      fetchAppts();
    } catch {
      setToast({ message: 'Action failed', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div>
      <div className="page-title">
        <h2>📅 My Schedule</h2>
        <p>Manage your appointment schedule</p>
      </div>

      <div className="tab-group">
        {['', 'scheduled', 'completed', 'cancelled'].map(s => (
          <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <motion.div className="appointments-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {appointments.map((appt, i) => (
            <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <AppointmentCard appointment={appt} onAction={handleAction} />
            </motion.div>
          ))}
          {appointments.length === 0 && (
            <div className="empty-state"><div className="empty-icon">📅</div><h3>No appointments</h3></div>
          )}
        </motion.div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
