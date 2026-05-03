import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { appointmentAPI, doctorAPI } from '../../api/api';
import AppointmentCard from '../../components/AppointmentCard';
import DoctorCard from '../../components/DoctorCard';

export default function PatientAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      appointmentAPI.getAll(),
      doctorAPI.getAll(),
    ]).then(([apptRes, docRes]) => {
      setAppointments(apptRes.data);
      setDoctors(docRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleBook = async () => {
    if (!selectedDoctor || !bookingDate) {
      showToastMsg('Please select a doctor and date', 'error');
      return;
    }
    try {
      await appointmentAPI.create({
        doctor_id: selectedDoctor.id,
        appointment_date: bookingDate,
        notes: bookingNotes,
      });
      showToastMsg('Appointment booked successfully! 🎉');
      setShowBooking(false);
      setSelectedDoctor(null);
      setBookingDate('');
      setBookingNotes('');
      const res = await appointmentAPI.getAll();
      setAppointments(res.data);
    } catch (err) {
      showToastMsg(err.response?.data?.error || 'Booking failed', 'error');
    }
  };

  const selectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setShowBooking(true);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-title">
        <h2>📅 Appointments</h2>
        <p>Book new appointments and view your history</p>
      </div>

      {/* My Appointments */}
      <motion.div className="glass-card-static" style={{ marginBottom: '28px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>My Appointments</h3>
        {appointments.length > 0 ? (
          <div className="appointments-list">
            {appointments.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-icon">📅</div>
            <h3>No appointments yet</h3>
            <p>Select a doctor below to book your first appointment</p>
          </div>
        )}
      </motion.div>

      {/* Available Doctors */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>👨‍⚕️ Available Doctors — Click to Book</h3>
        <div className="doctors-grid">
          {doctors.filter(d => d.is_available).map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <DoctorCard doctor={doc} onClick={selectDoctor} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Booking Modal */}
      {showBooking && selectedDoctor && (
        <div className="modal-overlay" onClick={() => setShowBooking(false)}>
          <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3>📅 Book Appointment</h3>
            <div style={{ padding: '16px', background: 'rgba(6,182,212,0.06)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(6,182,212,0.1)' }}>
              <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
              <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
              <p><strong>Room:</strong> {selectedDoctor.room_number}</p>
            </div>
            <div className="form-group">
              <label>Appointment Date & Time</label>
              <input type="datetime-local" className="form-input" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea className="form-textarea" placeholder="Describe your symptoms or reason for visit..." value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={handleBook}>✅ Confirm Booking</button>
              <button className="btn btn-secondary" onClick={() => setShowBooking(false)}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.message}</div>}
    </div>
  );
}
