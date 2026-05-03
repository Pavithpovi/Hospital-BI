import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { patientAPI, logAPI } from '../../api/api';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientLogs, setPatientLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    patientAPI.getAll().then(res => setPatients(res.data)).finally(() => setLoading(false));
  }, []);

  const viewPatientLogs = async (patient) => {
    setSelectedPatient(patient);
    try {
      const allLogs = await logAPI.getAll();
      const filtered = allLogs.data.filter(l => l.patient_id === patient.id);
      setPatientLogs(filtered);
    } catch { setPatientLogs([]); }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div>
      <div className="page-title">
        <h2>🏥 Patient Management</h2>
        <p>View and manage all registered patients</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <motion.div className="glass-card-static" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Blood Group</th>
                  <th>Emergency Contact</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td><strong>{p.name}</strong></td>
                    <td style={{ color: '#67e8f9' }}>{p.email}</td>
                    <td>{p.phone}</td>
                    <td><span className="badge badge-scheduled">{p.blood_group || 'N/A'}</span></td>
                    <td>{p.emergency_contact || 'N/A'}</td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewPatientLogs(p)}>
                        📋 View Logs
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No patients found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Patient Logs Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ maxWidth: '640px' }}>
            <h3>📋 Patient Logs — {selectedPatient.name}</h3>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#94a3b8' }}>
              <p>📧 {selectedPatient.email} &nbsp;|&nbsp; 📱 {selectedPatient.phone} &nbsp;|&nbsp; 🩸 {selectedPatient.blood_group || 'N/A'}</p>
              {selectedPatient.address && <p>📍 {selectedPatient.address}</p>}
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {patientLogs.length > 0 ? patientLogs.map((log, idx) => (
                <div key={idx} className={`log-entry ${log.action}`} style={{ marginBottom: '8px' }}>
                  <span className="log-time">{new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <div className="log-content">
                    <p><strong>{log.action}</strong> — by Dr. {log.doctor_name}</p>
                    <p>{log.details}</p>
                  </div>
                </div>
              )) : (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <p>No logs found for this patient</p>
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedPatient(null)}>Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
