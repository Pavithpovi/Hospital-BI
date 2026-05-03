import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { statsAPI, logAPI } from '../../api/api';
import StatCard from '../../components/StatCard';
import LiveLogFeed from '../../components/LiveLogFeed';
import { getSocketOrigin } from '../../lib/runtimeConfig';
import { io } from 'socket.io-client';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [doctorLogs, setDoctorLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsAPI.get(),
      logAPI.getAll(),
      logAPI.getDoctorLogs(),
    ]).then(([statsRes, logsRes, docRes]) => {
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setDoctorLogs(docRes.data);
    }).finally(() => setLoading(false));

    // Connect to live feed
    const socketUrl = getSocketOrigin();
    const socket = socketUrl ? io(`${socketUrl}/admin`, { transports: ['websocket', 'polling'] }) : null;
    if (socket) {
      socket.on('new_patient_log', (log) => {
        setLogs(prev => [log, ...prev].slice(0, 50));
      });
      socket.on('new_doctor_log', (log) => {
        setDoctorLogs(prev => [log, ...prev].slice(0, 50));
      });
    }
    return () => { if (socket) socket.disconnect(); };
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const appointmentChart = {
    labels: ['Scheduled', 'Completed', 'Cancelled'],
    datasets: [{
      data: [
        stats?.active_appointments || 0,
        stats?.completed_appointments || 0,
        (stats?.total_appointments || 0) - (stats?.active_appointments || 0) - (stats?.completed_appointments || 0),
      ],
      backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
      borderColor: ['rgba(59,130,246,1)', 'rgba(16,185,129,1)', 'rgba(239,68,68,1)'],
      borderWidth: 2,
    }],
  };

  const categoryChart = {
    labels: ['Patients', 'Doctors', 'Appointments', 'Health Slips'],
    datasets: [{
      label: 'Count',
      data: [stats?.total_patients || 0, stats?.total_doctors || 0, stats?.total_appointments || 0, stats?.total_slips || 0],
      backgroundColor: [
        'rgba(6,182,212,0.6)', 'rgba(139,92,246,0.6)', 'rgba(245,158,11,0.6)', 'rgba(236,72,153,0.6)',
      ],
      borderColor: [
        'rgba(6,182,212,1)', 'rgba(139,92,246,1)', 'rgba(245,158,11,1)', 'rgba(236,72,153,1)',
      ],
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  return (
    <div>
      <div className="page-title">
        <h2>Admin Dashboard</h2>
        <p>Real-time overview — Hospital BI</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="🏥" value={stats?.total_patients || 0} label="Total Patients" color="cyan" delay={0} />
        <StatCard icon="👨‍⚕️" value={stats?.total_doctors || 0} label="Total Doctors" color="purple" delay={0.1} />
        <StatCard icon="📅" value={stats?.active_appointments || 0} label="Active Appointments" color="green" delay={0.2} />
        <StatCard icon="📋" value={stats?.total_slips || 0} label="Health Slips Issued" color="orange" delay={0.3} />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3>📊 Appointment Status</h3>
          <div style={{ maxWidth: '280px', margin: '0 auto' }}>
            <Doughnut data={appointmentChart} options={{ ...chartOptions, scales: undefined }} />
          </div>
        </motion.div>
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3>📈 Hospital Overview</h3>
          <Bar data={categoryChart} options={chartOptions} />
        </motion.div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Live Patient Logs */}
        <motion.div className="glass-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>📋 Live Patient Activity</h3>
            <div className="live-indicator">
              <div className="live-dot"></div>
              LIVE
            </div>
          </div>
          <LiveLogFeed logs={logs} />
        </motion.div>

        <motion.div className="glass-card-static" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>👨‍⚕️ Doctor Activity Log</h3>
            <div className="live-indicator">
              <div className="live-dot"></div>
              LIVE
            </div>
          </div>
          <LiveLogFeed logs={doctorLogs} />
        </motion.div>
      </div>
    </div>
  );
}
