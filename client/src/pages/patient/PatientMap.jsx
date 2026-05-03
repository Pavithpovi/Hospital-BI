import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { appointmentAPI } from '../../api/api';
import HospitalMap from '../../components/HospitalMap';

export default function PatientMap() {
  const [appointments, setAppointments] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    appointmentAPI.getAll().then(res => {
      setAppointments(res.data);
      // Auto-highlight the next appointment's room
      const scheduled = res.data.filter(a => a.status === 'scheduled');
      if (scheduled.length > 0) {
        setSelectedRoom(scheduled[0].room_number);
      }
    }).catch(() => {});
  }, []);

  const scheduled = appointments.filter(a => a.status === 'scheduled');

  return (
    <div>
      <div className="page-title">
        <h2>🗺️ Hospital Map</h2>
        <p>Navigate to rooms, departments, and facilities</p>
      </div>

      {/* Appointment room navigation */}
      {scheduled.length > 0 && (
        <motion.div className="glass-card-static" style={{ marginBottom: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>📍 Navigate to Your Appointments</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {scheduled.map(appt => (
              <button
                key={appt.id}
                className={`btn ${selectedRoom === appt.room_number ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setSelectedRoom(appt.room_number)}
              >
                🏠 Room {appt.room_number} — Dr. {appt.doctor_name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <HospitalMap highlightRoom={selectedRoom} />
      </motion.div>
    </div>
  );
}
