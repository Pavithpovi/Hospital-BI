import { useEffect, useRef } from 'react';

export default function LiveLogFeed({ logs, emptyHint }) {
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [logs]);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const actionIcons = {
    'check-in': '🔵', 'diagnosis': '🟣', 'prescription': '🟠',
    'discharge': '🟢', 'scheduled': '📅', 'completed': '✅', 'cancelled': '❌',
    'login': '🔐', 'health_slip': '📋', 'appointment': '🗓️',
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px' }}>
        <div className="empty-icon">📋</div>
        <h3>No logs yet</h3>
        <p>Patient activity will appear here in real-time</p>
      </div>
    );
  }

  return (
    <div className="live-log-feed" ref={feedRef}>
      {logs.map((log, idx) => (
        <div key={log.id || idx} className={`log-entry ${log.action}`}>
          <span className="log-time">
            {actionIcons[log.action] || '⚪'} {formatTime(log.timestamp)}
          </span>
          <div className="log-content">
            <p>
              {log.patient_name ? (
                <>
                  <strong>{log.patient_name}</strong>
                  {log.doctor_name && log.doctor_name !== 'System' && (
                    <> — by Dr. {log.doctor_name}</>
                  )}
                </>
              ) : (
                <strong>{log.doctor_name ? `Dr. ${log.doctor_name}` : 'Staff'}</strong>
              )}
            </p>
            <p>{log.details}</p>
            <span className={`badge badge-${log.action}`} style={{ marginTop: '4px' }}>
              {log.action}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
