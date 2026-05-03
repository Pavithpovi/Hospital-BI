import { useState } from 'react';

export default function DoctorCard({ doctor, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);

  const categoryEmojis = {
    'Cardiology': '❤️', 'Neurology': '🧠', 'Orthopedics': '🦴',
    'Pediatrics': '👶', 'Dermatology': '🧴', 'General Medicine': '💊',
    'ENT': '👂', 'Ophthalmology': '👁️',
  };

  const categoryColors = {
    'Cardiology': '#ef4444', 'Neurology': '#8b5cf6', 'Orthopedics': '#f59e0b',
    'Pediatrics': '#ec4899', 'Dermatology': '#06b6d4', 'General Medicine': '#10b981',
    'ENT': '#3b82f6', 'Ophthalmology': '#6366f1',
  };

  const emoji = categoryEmojis[doctor.category] || '⚕️';
  const color = categoryColors[doctor.category] || '#06b6d4';
  const hasImg = doctor.image_url && /^https?:\/\//i.test(doctor.image_url) && !imgFailed;

  return (
    <div className="doctor-card" onClick={() => onClick?.(doctor)} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="doctor-card-image" style={{
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        borderBottom: `2px solid ${color}33`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '140px',
      }}>
        {hasImg ? (
          <img
            src={doctor.image_url}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '140px', objectFit: 'cover' }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span style={{ fontSize: '56px' }}>{emoji}</span>
        )}
      </div>
      <div className="doctor-card-body">
        <h3>{doctor.name}</h3>
        <p className="specialization">{doctor.specialization}</p>
        <div className="doctor-card-info">
          <span>🏠 Room: <strong style={{ color: '#f1f5f9' }}>{doctor.room_number}</strong></span>
          <span>🎓 {doctor.qualification}</span>
          <span>📅 {doctor.experience_years} years experience</span>
          <span>
            <span className={`badge ${doctor.is_available ? 'badge-available' : 'badge-unavailable'}`}>
              {doctor.is_available ? '● Available' : '● Unavailable'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
