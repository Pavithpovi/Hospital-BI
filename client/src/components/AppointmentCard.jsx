export default function AppointmentCard({ appointment, onAction, showActions = true }) {
  const statusColors = {
    scheduled: 'badge-scheduled',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="appointment-card">
      <div className="appt-info" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h4>📅 {formatDate(appointment.appointment_date)}</h4>
          <span className={`badge ${statusColors[appointment.status] || ''}`}>
            {appointment.status}
          </span>
        </div>
        <p>👨‍⚕️ Dr. {appointment.doctor_name} — {appointment.doctor_specialization}</p>
        <p>🏠 Room: {appointment.room_number} &nbsp;|&nbsp; 🏥 Patient: {appointment.patient_name}</p>
        {appointment.notes && <p style={{ marginTop: '4px', fontStyle: 'italic', color: '#64748b' }}>📝 {appointment.notes}</p>}
      </div>
      {showActions && (
        <div className="appt-actions">
          {appointment.status === 'scheduled' && (
            <>
              <button className="btn btn-success btn-sm" onClick={() => onAction?.('complete', appointment)}>
                ✅ Complete
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onAction?.('cancel', appointment)}>
                ❌ Cancel
              </button>
            </>
          )}
          {!appointment.email_sent && appointment.status === 'scheduled' && (
            <button className="btn btn-primary btn-sm" onClick={() => onAction?.('email', appointment)}>
              📧 Send Email
            </button>
          )}
          {appointment.email_sent && (
            <span className="badge badge-completed">📧 Sent</span>
          )}
        </div>
      )}
    </div>
  );
}
