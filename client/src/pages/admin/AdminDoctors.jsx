import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doctorAPI } from '../../api/api';
import DoctorCard from '../../components/DoctorCard';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: 'doctor123',
    specialization: '', category: 'General Medicine', room_number: '',
    qualification: '', experience_years: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Medicine', 'ENT', 'Ophthalmology'];

  useEffect(() => { fetchDoctors(); }, [filter]);

  const fetchDoctors = () => {
    setLoading(true);
    doctorAPI.getAll(filter || undefined).then(res => setDoctors(res.data)).finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await doctorAPI.create(form);
      setSuccess('Doctor added successfully!');
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', password: 'doctor123', specialization: '', category: 'General Medicine', room_number: '', qualification: '', experience_years: 0 });
      fetchDoctors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add doctor');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <h2>👨‍⚕️ Doctor Management</h2>
          <p>Manage hospital doctors and their assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Doctor</button>
      </div>

      {success && <div className="success-message">✅ {success}</div>}

      {/* Category Filter */}
      <div className="tab-group" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className={`tab-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
        {categories.map(cat => (
          <button key={cat} className={`tab-btn ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <motion.div className="doctors-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {doctors.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <DoctorCard doctor={doc} />
            </motion.div>
          ))}
          {doctors.length === 0 && (
            <div className="empty-state"><div className="empty-icon">👨‍⚕️</div><h3>No doctors found</h3></div>
          )}
        </motion.div>
      )}

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3>➕ Add New Doctor</h3>
            {error && <div className="error-message">⚠️ {error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="text" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Specialization</label>
                  <input type="text" className="form-input" placeholder="e.g. Cardiac Surgery" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Room Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 201" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Experience (years)</label>
                  <input type="number" className="form-input" value={form.experience_years} onChange={e => setForm({...form, experience_years: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-group">
                <label>Qualification</label>
                <input type="text" className="form-input" placeholder="e.g. MD, DM Cardiology" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary">✅ Add Doctor</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
