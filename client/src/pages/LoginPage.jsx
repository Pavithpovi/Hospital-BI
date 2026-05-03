import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const routes = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">🏥</div>
            <h1>Hospital BI</h1>
            <p>Hospital Management System</p>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>

          {/* Demo Credentials */}
          <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(6,182,212,0.06)', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.15)' }}>
            <p style={{ fontSize: '12px', color: '#67e8f9', fontWeight: 600, marginBottom: '8px' }}>Demo Credentials</p>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>👑 Admin: admin@medvista.com / admin123</span>
              <span>👨‍⚕️ Doctor: aisha@medvista.com / doctor123</span>
              <span>🏥 Patient: rahul.v@email.com / patient123</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
