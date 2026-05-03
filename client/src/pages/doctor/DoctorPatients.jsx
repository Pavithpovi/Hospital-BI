import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { appointmentAPI, logAPI, slipAPI } from '../../api/api';

export default function DoctorPatients() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [logForm, setLogForm] = useState({ action: 'check-in', details: '' });
  const [slipForm, setSlipForm] = useState({ diagnosis: '', prescription: '', recommendations: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    appointmentAPI.getAll().then(res => setAppointments(res.data)).finally(() => setLoading(false));
  }, []);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Get unique patients from appointments
  const uniquePatients = [];
  const seen = new Set();
  appointments.forEach(a => {
    if (!seen.has(a.patient_id)) {
      seen.add(a.patient_id);
      uniquePatients.push({
        id: a.patient_id,
        name: a.patient_name,
        email: a.patient_email,
        phone: a.patient_phone,
        latestAppointment: a,
      });
    }
  });

  const openLogModal = (patient) => {
    setSelectedPatient(patient);
    setLogForm({ action: 'check-in', details: '' });
    setShowLogModal(true);
  };

  const openSlipModal = (patient) => {
    setSelectedPatient(patient);
    setSlipForm({ diagnosis: '', prescription: '', recommendations: '' });
    setShowSlipModal(true);
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      await logAPI.create({ patient_id: selectedPatient.id, ...logForm });
      showToastMsg('Patient log created!');
      setShowLogModal(false);
    } catch {
      showToastMsg('Failed to create log', 'error');
    }
  };

  const handleCreateSlip = async (e) => {
    e.preventDefault();
    try {
      await slipAPI.create({
        patient_id: selectedPatient.id,
        appointment_id: selectedPatient.latestAppointment?.id,
        ...slipForm,
      });
      showToastMsg('Health slip created!');
      setShowSlipModal(false);
    } catch {
      showToastMsg('Failed to create slip', 'error');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-title">
        <h2>🏥 My Patients</h2>
        <p>Manage assigned patients, create logs and health slips</p>
      </div>

      <motion.div className="glass-card-static" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Latest Appointment</th>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uniquePatients.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td style={{ color: '#67e8f9' }}>{p.email}</td>
                  <td>{p.phone}</td>
                  <td style={{ fontSize: '13px' }}>
                    {p.latestAppointment ? new Date(p.latestAppointment.appointment_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A'}
                  </td>
                  <td><span className="badge badge-scheduled">🏠 {p.latestAppointment?.room_number || 'N/A'}</span></td>
                  <td>
                    <span className={`badge badge-${p.latestAppointment?.status || 'scheduled'}`}>
                      {p.latestAppointment?.status || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openLogModal(p)}>📝 Log</button>
                      <button className="btn btn-primary btn-sm" onClick={() => openSlipModal(p)}>📋 Slip</button>
                    </div>
                  </td>
                </tr>
              ))}
              {uniquePatients.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No patients assigned yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Log Modal */}
      {showLogModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3>📝 Log Patient Activity — {selectedPatient.name}</h3>
            <form onSubmit={handleCreateLog}>
              <div className="form-group">
                <label>Action Type</label>
                <select className="form-select" value={logForm.action} onChange={e => setLogForm({...logForm, action: e.target.value})}>
                  <option value="check-in">🔵 Check-in</option>
                  <option value="diagnosis">🟣 Diagnosis</option>
                  <option value="prescription">🟠 Prescription</option>
                  <option value="discharge">🟢 Discharge</option>
                </select>
              </div>
              <div className="form-group">
                <label>Details</label>
                <textarea className="form-textarea" placeholder="Describe the activity..." value={logForm.details} onChange={e => setLogForm({...logForm, details: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">✅ Save Log</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Health Slip Modal */}
      {showSlipModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowSlipModal(false)}>
          <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3>📋 Issue Health Slip — {selectedPatient.name}</h3>
            <form onSubmit={handleCreateSlip}>
              <div className="form-group">
                <label>Diagnosis</label>
                <textarea className="form-textarea" placeholder="Enter diagnosis..." value={slipForm.diagnosis} onChange={e => setSlipForm({...slipForm, diagnosis: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Prescription</label>
                <textarea className="form-textarea" placeholder="Enter prescription details..." value={slipForm.prescription} onChange={e => setSlipForm({...slipForm, prescription: e.target.value})} required rows={4} />
              </div>
              <div className="form-group">
                <label>Recommendations & Follow-up</label>
                <textarea className="form-textarea" placeholder="Any recommendations..." value={slipForm.recommendations} onChange={e => setSlipForm({...slipForm, recommendations: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">✅ Issue Slip</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSlipModal(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.message}</div>}
    </div>
  );
}
