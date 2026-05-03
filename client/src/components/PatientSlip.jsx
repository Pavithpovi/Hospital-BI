export default function PatientSlip({ slip, onPrint }) {
  if (!slip) return null;

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="patient-slip" id="patient-slip">
      {/* Header */}
      <div className="slip-header">
        <div>
          <h2>🏥 Hospital BI</h2>
          <p>Healthcare Excellence Since 1985</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#67e8f9', fontWeight: 600 }}>HEALTH REPORT SLIP</p>
          <p>Slip #{slip.id}</p>
          <p>{formatDate(slip.issued_at)}</p>
        </div>
      </div>

      {/* Body */}
      <div className="slip-body">
        {/* Patient & Doctor Info */}
        <div className="slip-grid" style={{ marginBottom: '24px' }}>
          <div className="slip-section">
            <h4>Patient Information</h4>
            <p><strong>Name:</strong> {slip.patient_name}</p>
            <p><strong>Phone:</strong> {slip.patient_phone || 'N/A'}</p>
            <p><strong>Blood Group:</strong> {slip.patient_blood_group || 'N/A'}</p>
          </div>
          <div className="slip-section">
            <h4>Doctor Information</h4>
            <p><strong>Doctor:</strong> Dr. {slip.doctor_name}</p>
            <p><strong>Specialization:</strong> {slip.doctor_specialization}</p>
            <p><strong>Room Number:</strong> 🏠 {slip.doctor_room}</p>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="slip-section">
          <h4>Diagnosis</h4>
          <p>{slip.diagnosis || 'No diagnosis recorded'}</p>
        </div>

        {/* Prescription */}
        <div className="slip-section">
          <h4>Prescription</h4>
          <div style={{ whiteSpace: 'pre-line', fontSize: '14px', color: '#334155', lineHeight: 1.8 }}>
            {slip.prescription || 'No prescription issued'}
          </div>
        </div>

        {/* Recommendations */}
        <div className="slip-section">
          <h4>Recommendations & Follow-up</h4>
          <p>{slip.recommendations || 'No additional recommendations'}</p>
        </div>

        {/* Doctor Room Direction */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px 16px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>📍</span>
          <div>
            <p style={{ fontWeight: 600, color: '#1e40af', fontSize: '13px' }}>Doctor's Room Location</p>
            <p style={{ color: '#3b82f6', fontSize: '12px' }}>Room {slip.doctor_room} — Use the Hospital Map for navigation directions</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="slip-footer">
        <div>
          <p>Hospital BI</p>
          <p>123 Health Avenue, Medical District</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>Emergency: +91-1234567890</p>
          <p>www.hospital-bi.app</p>
        </div>
      </div>

      {/* Print Button */}
      {onPrint && (
        <div className="no-print" style={{ padding: '16px', textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={onPrint}
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
          >
            🖨️ Print Slip
          </button>
        </div>
      )}
    </div>
  );
}
