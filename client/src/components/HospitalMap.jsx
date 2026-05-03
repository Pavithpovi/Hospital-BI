import { useState, useEffect } from 'react';
import { mapAPI } from '../api/api';

const roomColors = {
  reception: '#06b6d4',
  emergency: '#ef4444',
  pharmacy: '#10b981',
  billing: '#f59e0b',
  waiting: '#8b5cf6',
  cafeteria: '#ec4899',
  doctor: '#3b82f6',
  lab: '#6366f1',
  ward: '#14b8a6',
  surgery: '#f43f5e',
};

export default function HospitalMap({ highlightRoom }) {
  const [mapData, setMapData] = useState(null);
  const [activeFloor, setActiveFloor] = useState('ground');
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    mapAPI.get().then(res => setMapData(res.data)).catch(() => {});
  }, []);

  if (!mapData) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  const floor = mapData.floors[activeFloor];
  if (!floor) return null;

  const rooms = floor.rooms;
  const doctorRooms = mapData.doctor_rooms || {};

  return (
    <div className="hospital-map-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>🗺️ Hospital Navigation Map</h3>
        {highlightRoom && (
          <span className="badge badge-scheduled">📍 Navigate to Room {highlightRoom}</span>
        )}
      </div>

      <div className="floor-tabs">
        {Object.entries(mapData.floors).map(([key, f]) => (
          <button
            key={key}
            className={`floor-tab ${activeFloor === key ? 'active' : ''}`}
            onClick={() => setActiveFloor(key)}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="map-svg-wrapper">
        <svg viewBox="0 0 700 450" style={{ width: '100%', height: 'auto', minHeight: '300px' }}>
          {/* Background */}
          <rect x="10" y="10" width="680" height="430" rx="16" fill="rgba(15,22,41,0.6)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          
          {/* Floor title */}
          <text x="350" y="45" textAnchor="middle" fill="#67e8f9" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">
            {floor.name}
          </text>

          {/* Corridors */}
          <rect x="30" y="155" width="640" height="8" rx="4" fill="rgba(255,255,255,0.04)" />
          <rect x="30" y="295" width="640" height="8" rx="4" fill="rgba(255,255,255,0.04)" />
          <rect x="345" y="155" width="8" height="148" rx="4" fill="rgba(255,255,255,0.04)" />

          {/* Corridor labels */}
          <text x="350" y="145" textAnchor="middle" fill="#475569" fontSize="10" fontFamily="Inter">
            ─── Main Corridor ───
          </text>

          {/* Rooms */}
          {Object.entries(rooms).map(([roomId, room]) => {
            const isHighlighted = highlightRoom === roomId;
            const color = roomColors[room.type] || '#64748b';
            const doctorInfo = doctorRooms[roomId];

            return (
              <g
                key={roomId}
                className={`map-room ${isHighlighted ? 'highlighted' : ''}`}
                onMouseEnter={() => setTooltip({ ...room, roomId, doctorInfo, x: room.x + room.w / 2, y: room.y - 10 })}
                onMouseLeave={() => setTooltip(null)}
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx="8"
                  fill={isHighlighted ? `${color}44` : `${color}18`}
                  stroke={isHighlighted ? color : `${color}44`}
                  strokeWidth={isHighlighted ? 2.5 : 1}
                />
                {/* Room icon */}
                <text x={room.x + 14} y={room.y + 24} fill={color} fontSize="16">
                  {room.type === 'reception' ? '🏢' : room.type === 'emergency' ? '🚑' : room.type === 'pharmacy' ? '💊' :
                   room.type === 'billing' ? '💳' : room.type === 'waiting' ? '🪑' : room.type === 'cafeteria' ? '☕' :
                   room.type === 'doctor' ? '👨‍⚕️' : room.type === 'lab' ? '🔬' : room.type === 'ward' ? '🛏️' :
                   room.type === 'surgery' ? '🔪' : '📍'}
                </text>
                {/* Room name */}
                <text x={room.x + 36} y={room.y + 26} fill="#e2e8f0" fontSize="11" fontWeight="600" fontFamily="Inter">
                  {room.name}
                </text>
                {/* Doctor info for doctor rooms */}
                {doctorInfo && (
                  <text x={room.x + 14} y={room.y + 46} fill="#94a3b8" fontSize="9" fontFamily="Inter">
                    Dr. {doctorInfo.doctor_name.split(' ').slice(-1)[0]} • {doctorInfo.specialization}
                  </text>
                )}
                {/* Room ID */}
                <text x={room.x + room.w - 8} y={room.y + room.h - 8} textAnchor="end" fill="#475569" fontSize="9" fontFamily="Inter">
                  {roomId}
                </text>

                {/* Highlight pulse */}
                {isHighlighted && (
                  <rect
                    x={room.x - 3}
                    y={room.y - 3}
                    width={room.w + 6}
                    height={room.h + 6}
                    rx="10"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.5"
                    style={{ animation: 'pulse 2s infinite' }}
                  />
                )}
              </g>
            );
          })}

          {/* Elevator & Stairs */}
          <rect x="635" y="60" width="40" height="35" rx="6" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
          <text x="655" y="76" textAnchor="middle" fill="#f59e0b" fontSize="14">🛗</text>
          <text x="655" y="90" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="Inter">Lift</text>

          <rect x="25" y="60" width="40" height="35" rx="6" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          <text x="45" y="76" textAnchor="middle" fill="#10b981" fontSize="14">🪜</text>
          <text x="45" y="90" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="Inter">Stairs</text>

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={Math.min(tooltip.x - 90, 520)}
                y={tooltip.y - 55}
                width="180"
                height={tooltip.doctorInfo ? 50 : 32}
                rx="8"
                fill="rgba(15,22,41,0.95)"
                stroke="rgba(6,182,212,0.3)"
                strokeWidth="1"
              />
              <text x={Math.min(tooltip.x, 610)} y={tooltip.y - 36} textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="600" fontFamily="Inter">
                {tooltip.name} ({tooltip.roomId})
              </text>
              {tooltip.doctorInfo && (
                <text x={Math.min(tooltip.x, 610)} y={tooltip.y - 20} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Inter">
                  Dr. {tooltip.doctorInfo.doctor_name} • {tooltip.doctorInfo.specialization}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="map-legend">
        {Object.entries(roomColors).map(([type, color]) => (
          <div className="legend-item" key={type}>
            <div className="legend-color" style={{ background: color }}></div>
            <span style={{ textTransform: 'capitalize' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
