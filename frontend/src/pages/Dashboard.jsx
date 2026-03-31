import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.jsx';
import { getLogs, updateStatus } from '../services/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard',     path: '/dashboard' },
  { icon: '⚡', label: 'Automations',  path: '/dashboard' },
  { icon: '📊', label: 'Analytics',    path: '/dashboard' },
  { icon: '🔌', label: 'Integrations', path: '/dashboard' },
  { icon: '🤖', label: 'Simulate AI',  path: '/simulate' },
  { icon: '👤', label: 'Profile',      path: '/dashboard' },
  { icon: '❓', label: 'Help',         path: '/dashboard' },
];

const TYPE_COLORS = { complaint: '#ef4444', query: '#06b6d4', order: '#f59e0b', cancellation: '#8b5cf6', unknown: '#64748b' };
const PRIORITY_BADGE = { urgent: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-success' };

function StatCard({ icon, label, value, delta, color = '#7c3aed' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{ padding: '24px 20px', flex: 1, minWidth: 180 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {delta && <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: 8 }}>↑ {delta}% this week</div>}
    </motion.div>
  );
}

function WorkflowDiagram() {
  const nodes = [
    { icon: '💬', label: 'Message' },
    { icon: '🤖', label: 'AI Engine' },
    { icon: '⚡', label: 'Decision' },
    { icon: '📤', label: 'Action' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflow: 'auto', padding: '4px 0' }}>
      {nodes.map((node, i) => (
        <div key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0.4)', '0 0 0 10px rgba(124,58,237,0)', '0 0 0 0 rgba(124,58,237,0)'] }}
              transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
              style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
            >
              {node.icon}
            </motion.div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{node.label}</span>
          </motion.div>
          {i < nodes.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.15 + 0.2, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 6px', flexShrink: 0 }}
            >
              {[0,1,2].map(d => (
                <motion.div
                  key={d}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, delay: d * 0.2 + i * 0.3, repeat: Infinity }}
                  style={{ width: 5, height: 2, borderRadius: 1, background: 'var(--accent)' }}
                />
              ))}
              <span style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>›</span>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [automationStatus, setAutomationStatus] = useState('active');

  useEffect(() => {
    const userId = user?._id || user?.id || 'mock_user_001';
    getLogs(userId)
      .then(({ data }) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [user]);

  const stats = {
    complaints: logs.filter(l => l.type === 'complaint').length,
    queries: logs.filter(l => l.type === 'query').length,
    orders: logs.filter(l => l.type === 'order').length,
    cancellations: logs.filter(l => l.type === 'cancellation').length,
    avgMs: logs.length ? '1.2s' : '—',
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page-layout">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: 'var(--sidebar-width)',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'rgba(10,10,15,0.95)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          backdropFilter: 'blur(20px)',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, padding: '0 8px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>MerchantAI</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(item => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveNav(item.label); navigate(item.path); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: activeNav === item.label ? 600 : 400,
                background: activeNav === item.label ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: activeNav === item.label ? 'var(--accent-light)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* User info */}
        <div className="glass" style={{ padding: '12px 14px', borderRadius: 10, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{user?.name || 'Demo User'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email?.slice(0, 22) || 'demo@merchantai.app'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}>
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            padding: '14px 20px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            borderColor: automationStatus === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
            background: automationStatus === 'active' ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="pulse-dot" style={{ background: automationStatus === 'active' ? 'var(--success)' : 'var(--warning)' }} />
            <span style={{ fontWeight: 600 }}>
              Automation {automationStatus === 'active' ? 'Active' : 'Paused'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {automationStatus === 'active' ? 'AI is handling customer messages in real-time' : 'No messages are being processed'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/simulate')}
              className="btn btn-primary btn-sm"
            >⚡ Simulate</button>
            <button
              onClick={() => { setAutomationStatus(s => s === 'active' ? 'paused' : 'active'); toast.success(automationStatus === 'active' ? 'Automation paused' : 'Automation resumed'); }}
              className="btn btn-secondary btn-sm"
            >
              {automationStatus === 'active' ? '⏸ Pause' : '▶ Resume'}
            </button>
          </div>
        </motion.div>

        {/* Page Title */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ marginBottom: 4 }}>Dashboard</h2>
          <p style={{ fontSize: '0.88rem' }}>Monitor your AI automations and customer interactions</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard icon="😤" label="Complaints Handled"   value={stats.complaints}   delta={stats.complaints > 0 ? 12 : null} color="#ef4444" />
          <StatCard icon="❓" label="Queries Resolved"     value={stats.queries}      delta={stats.queries > 0 ? 8 : null}     color="#06b6d4" />
          <StatCard icon="📦" label="Orders Tracked"       value={stats.orders}       delta={null}                             color="#f59e0b" />
          <StatCard icon="⏱" label="Avg Response Time"    value={stats.avgMs}        delta={null}                             color="#10b981" />
        </div>

        {/* Workflow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass"
          style={{ padding: '28px 24px', marginBottom: 28 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4 }}>AI Workflow</h3>
              <p style={{ fontSize: '0.82rem' }}>How every message is handled automatically</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-purple">AI Active</span>
              <span className="badge badge-success">● Live</span>
            </div>
          </div>
          <WorkflowDiagram />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass"
          style={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3>Recent Activity</h3>
            <button onClick={() => navigate('/simulate')} className="btn btn-primary btn-sm">+ Simulate Message</button>
          </div>

          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No messages processed yet.</div>
              <button onClick={() => navigate('/simulate')} className="btn btn-primary btn-sm">Try Live Simulation →</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Message', 'Type', 'Sentiment', 'Priority', 'Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {logs.slice(0, 10).map((log, i) => (
                      <motion.tr
                        key={log._id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td style={{ padding: '12px', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{log.message}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: TYPE_COLORS[log.type] || '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>{log.type}</span>
                        </td>
                        <td style={{ padding: '12px', textTransform: 'capitalize', color: log.sentiment === 'negative' ? '#f87171' : log.sentiment === 'positive' ? '#34d399' : 'var(--text-secondary)' }}>{log.sentiment}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge ${PRIORITY_BADGE[log.priority] || 'badge-info'}`}>{log.priority}</span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
