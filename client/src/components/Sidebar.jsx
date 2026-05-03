import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = {
  admin: [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/doctors', icon: '👨‍⚕️', label: 'Doctors' },
    { path: '/admin/patients', icon: '🏥', label: 'Patients' },
    { path: '/admin/appointments', icon: '📅', label: 'Appointments' },
  ],
  doctor: [
    { path: '/doctor', icon: '📊', label: 'Dashboard' },
    { path: '/doctor/patients', icon: '🏥', label: 'My Patients' },
    { path: '/doctor/schedule', icon: '📅', label: 'Schedule' },
  ],
  patient: [
    { path: '/patient', icon: '📊', label: 'Dashboard' },
    { path: '/patient/appointments', icon: '📅', label: 'Appointments' },
    { path: '/patient/slips', icon: '📋', label: 'Health Slips' },
    { path: '/patient/map', icon: '🗺️', label: 'Hospital Map' },
    { path: '/patient/chat', icon: '🤖', label: 'AI Health Chat' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, display: 'none'
      }} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🏥</div>
          <div>
            <h2>Hospital BI</h2>
            <p>Hospital Management</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-title">
            {user?.role === 'admin' ? 'Administration' : user?.role === 'doctor' ? 'Doctor Panel' : 'Patient Portal'}
          </span>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${user?.role}`}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
