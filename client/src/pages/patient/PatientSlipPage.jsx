import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { slipAPI } from '../../api/api';
import PatientSlip from '../../components/PatientSlip';

export default function PatientSlipPage() {
  const [slips, setSlips] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    slipAPI.getAll().then(res => setSlips(res.data)).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-title">
        <h2>📋 My Health Slips</h2>
        <p>View and print your health report slips</p>
      </div>

      {selectedSlip ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button className="btn btn-secondary no-print" onClick={() => setSelectedSlip(null)} style={{ marginBottom: '20px' }}>
            ← Back to all slips
          </button>
          <PatientSlip slip={selectedSlip} onPrint={handlePrint} />
        </motion.div>
      ) : (
        <>
          {slips.length > 0 ? (
            <div className="appointments-list">
              {slips.map((slip, i) => (
                <motion.div
                  key={slip.id}
                  className="appointment-card"
                  style={{ cursor: 'pointer' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedSlip(slip)}
                >
                  <div className="appt-info" style={{ flex: 1 }}>
                    <h4>📋 Health Slip #{slip.id}</h4>
                    <p style={{ marginTop: '4px' }}><strong>Diagnosis:</strong> {slip.diagnosis}</p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                      👨‍⚕️ Dr. {slip.doctor_name} ({slip.doctor_specialization}) &nbsp;|&nbsp; 🏠 Room {slip.doctor_room}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(slip.issued_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>View Slip →</button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No health slips yet</h3>
              <p>Health slips will appear here after your doctor consultations</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
