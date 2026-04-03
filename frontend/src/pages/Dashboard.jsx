import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useOnboardingStore } from '../store/onboardingStore';
import { getAutomationApi, getLogsApi, analyzeMessageApi } from '../services/api';
import toast from 'react-hot-toast';
import api from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MessageSquare, Mail, MessageCircle, LogOut, Send, BarChart3, TrendingUp, CheckCircle, AlertTriangle, Menu } from 'lucide-react';

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard', id: 'automations' },
  { icon: '⚡', label: 'Automations', id: 'automations' },
  { icon: '📊', label: 'Analytics', id: 'analytics' },
  { icon: '🔥', label: 'Leads', id: 'leads' },
  { icon: '🤖', label: 'Simulate AI', id: 'simulate' },
  { icon: '🔌', label: 'Escalations', id: 'escalations' },
  { icon: '👤', label: 'Settings', id: 'settings' },
];

const TYPE_COLORS = {
  complaint: '#ef4444',
  query: '#06b6d4',
  order: '#f59e0b',
  cancellation: '#8b5cf6',
  unknown: '#64748b'
};

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
              {[0, 1, 2].map(d => (
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

const Dashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { selectedAutomations, connectedChannels, resetOnboarding } = useOnboardingStore();

  const [activeNav, setActiveNav] = useState('automations');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [automationStatus, setAutomationStatus] = useState('active');
  const [escalations, setEscalations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Simulate section
  const [simMsg, setSimMsg] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState('');
  const [showSimDetails, setShowSimDetails] = useState(false);

  // Lead Intelligence
  const [conversations, setConversations]   = useState([]);
  const [leadStats, setLeadStats]           = useState({ HOT: 0, WARM: 0, COLD: 0, avgScores: {} });
  const [leadsLoading, setLeadsLoading]     = useState(true);
  const [leadFilter, setLeadFilter]         = useState('ALL'); // ALL | HOT | WARM | COLD

  const userId = user?._id || user?.id || 'mock_user_001';

  useEffect(() => {
    getLogsApi(userId)
      .then(({ data }) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));

    api.get(`/escalations/pending/${userId}`)
      .then((res) => setEscalations(res.data.escalations || []))
      .catch(() => setEscalations([]));

    api.get(`/escalations/metrics/${userId}`)
      .then((res) => setMetrics(res.data))
      .catch(() => setMetrics(null));

    // Lead / Conversation intelligence
    api.get(`/conversations/${userId}`)
      .then((res) => setConversations(res.data || []))
      .catch(() => setConversations([]))
      .finally(() => setLeadsLoading(false));

    api.get(`/conversations/stats/${userId}`)
      .then((res) => setLeadStats(res.data || { HOT: 0, WARM: 0, COLD: 0, avgScores: {} }))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    const typeCount = {};
    logs.forEach((log) => {
      typeCount[log.type] = (typeCount[log.type] || 0) + 1;
    });
    const data = Object.entries(typeCount).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      messages: count,
    }));
    setChartData(data);
  }, [logs]);

  const handleLogout = async () => {
    await logout();
    resetOnboarding();
    navigate('/');
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!simMsg.trim()) return;
    setSimLoading(true);
    setSimResult(null);
    setSimError('');
    try {
      const { data } = await analyzeMessageApi(simMsg, userId);
      setSimResult(data);
      setShowSimDetails(true);
      toast.success('Message analyzed!');
      getLogsApi(userId).then(({ data }) => setLogs(data)).catch(() => {});
      api.get(`/escalations/pending/${userId}`).then(res => setEscalations(res.data.escalations || [])).catch(() => {});
    } catch (err) {
      setSimError(err.response?.data?.error || 'AI request failed. Is the backend running?');
      toast.error('Analysis failed');
    } finally {
      setSimLoading(false);
    }
  };

  const handleReviewEscalation = async (escalationId, action) => {
    try {
      await api.post(`/escalations/${escalationId}/review`, {
        feedback: action,
        manualReply: `${action} by merchant`,
      });
      toast.success(`Escalation ${action}!`);
      api.get(`/escalations/pending/${userId}`)
        .then((res) => setEscalations(res.data.escalations || []))
        .catch(() => {});
    } catch (err) {
      toast.error('Failed to review escalation');
    }
  };

  const stats = {
    complaints: logs.filter(l => l.type === 'complaint').length,
    queries: logs.filter(l => l.type === 'query').length,
    orders: logs.filter(l => l.type === 'order').length,
    escalated: logs.filter(l => l.escalated).length,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: 240,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'rgba(10,10,15,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          backdropFilter: 'blur(20px)',
          zIndex: 100,
          overflow: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, padding: '0 8px' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>MerchantAI</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(item => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveNav(item.id); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: activeNav === item.id ? 600 : 400,
                background: activeNav === item.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: activeNav === item.id ? '#7c3aed' : 'rgba(255,255,255,0.6)',
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
        <div style={{
          padding: '12px 14px',
          borderRadius: 10,
          marginTop: 16,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700
            }}>
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{user?.name || 'Demo User'}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{user?.email?.slice(0, 22) || 'demo@merchantai.app'}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#fff',
            fontSize: '0.78rem',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontFamily: 'inherit'
          }} onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px 20px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: automationStatus === 'active' ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
            border: automationStatus === 'active' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            marginLeft: 24,
            marginRight: 24,
            marginTop: 24
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: automationStatus === 'active' ? '#10b981' : '#f59e0b',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontWeight: 600 }}>
              Automation {automationStatus === 'active' ? 'Active' : 'Paused'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
              {automationStatus === 'active' ? 'AI is handling customer messages in real-time' : 'No messages are being processed'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setActiveNav('simulate')} style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid rgba(124,58,237,0.3)',
              background: 'rgba(124,58,237,0.15)',
              color: '#7c3aed',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit'
            }} onMouseEnter={e => e.target.style.background = 'rgba(124,58,237,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(124,58,237,0.15)'}>
              ⚡ Simulate
            </button>
            <button onClick={() => { setAutomationStatus(s => s === 'active' ? 'paused' : 'active'); toast.success(automationStatus === 'active' ? 'Paused' : 'Resumed'); }} style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit'
            }} onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
              {automationStatus === 'active' ? '⏸ Pause' : '▶ Resume'}
            </button>
          </div>
        </motion.div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          {/* Page Title */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 4, fontSize: '1.75rem', fontWeight: 600 }}>Dashboard</h2>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>Monitor your AI automations and customer interactions</p>
          </div>

          {/* Dashboard Section */}
          {activeNav === 'automations' && (
            <>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                <StatCard icon="😤" label="Complaints Handled" value={stats.complaints} delta={stats.complaints > 0 ? 12 : null} color="#ef4444" />
                <StatCard icon="❓" label="Queries Resolved" value={stats.queries} delta={stats.queries > 0 ? 8 : null} color="#06b6d4" />
                <StatCard icon="📦" label="Orders Tracked" value={stats.orders} delta={null} color="#f59e0b" />
                <StatCard icon="🔴" label="Escalated" value={stats.escalated} delta={null} color="#ef4444" />
              </div>

              {/* Workflow Diagram */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  padding: '28px 24px',
                  marginBottom: 28,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 600 }}>AI Workflow</h3>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>How every message is handled automatically</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: 'rgba(124,58,237,0.2)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      color: '#7c3aed',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>AI Active</span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: 'rgba(16,185,129,0.2)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10b981',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>● Live</span>
                  </div>
                </div>
                <WorkflowDiagram />
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  padding: '24px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Activity</h3>
                  <button onClick={() => setActiveNav('simulate')} style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: '1px solid rgba(124,58,237,0.3)',
                    background: 'rgba(124,58,237,0.15)',
                    color: '#7c3aed',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit'
                  }} onMouseEnter={e => e.target.style.background = 'rgba(124,58,237,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(124,58,237,0.15)'}>
                    + Simulate Message
                  </button>
                </div>

                {logsLoading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.5)' }}>Loading logs...</div>
                ) : logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>No messages processed yet.</div>
                    <button onClick={() => setActiveNav('simulate')} style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      border: '1px solid rgba(124,58,237,0.3)',
                      background: 'rgba(124,58,237,0.15)',
                      color: '#7c3aed',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit'
                    }} onMouseEnter={e => e.target.style.background = 'rgba(124,58,237,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(124,58,237,0.15)'}>
                      Try Live Simulation →
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {['Message', 'Type', 'Sentiment', 'Priority', 'Time'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
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
                              <td style={{ padding: '12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</td>
                              <td style={{ padding: '12px', color: TYPE_COLORS[log.type] || '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>{log.type}</td>
                              <td style={{ padding: '12px', textTransform: 'capitalize', color: log.sentiment === 'negative' ? '#f87171' : log.sentiment === 'positive' ? '#34d399' : 'rgba(255,255,255,0.6)' }}>{log.sentiment}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  background: 'rgba(124,58,237,0.2)',
                                  color: '#a78bfa',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textTransform: 'capitalize'
                                }}>{log.priority}</span>
                              </td>
                              <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
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
            </>
          )}

          {/* Analytics Section */}
          {activeNav === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Lead Intelligence KPI cards */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                {[{ label: 'HOT Leads 🔥', key: 'HOT', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
                  { label: 'WARM Leads 🟠', key: 'WARM', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
                  { label: 'COLD Leads ❄️', key: 'COLD', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)' },
                ].map(({ label, key, color, bg, border }) => (
                  <motion.div key={key}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ flex: 1, minWidth: 160, padding: '20px 18px', borderRadius: 12,
                      background: bg, border: `1px solid ${border}` }}>
                    <div style={{ fontSize: '0.78rem', color, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1 }}>{leadStats[key] ?? 0}</div>
                    {leadStats.avgScores?.[key] != null && (
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>avg score {leadStats.avgScores[key]}</div>
                    )}
                  </motion.div>
                ))}
                <StatCard icon="💬" label="Total Messages" value={logs.length} color="#3b82f6" />
                <StatCard icon="🔴" label="Escalated" value={logs.filter(l => l.escalated).length} color="#ef4444" />
              </div>

              {/* KPI Cards — existing */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <StatCard icon="✅" label="Auto-Replied" value={logs.filter(l => l.hasReplied && !l.escalated).length} color="#10b981" />
                <StatCard icon="📈" label="Approval Rate" value={logs.length > 0 ? ((logs.filter(l => l.hasReplied && !l.escalated).length / logs.length) * 100).toFixed(0) + '%' : '0%'} color="#f59e0b" />
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                {/* Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '24px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 600 }}>Messages by Type</h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Distribution of message classifications</p>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Bar dataKey="messages" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      No data available
                    </div>
                  )}
                </motion.div>

                {/* Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    padding: '24px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 600 }}>Escalation Distribution</h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Escalated vs Auto-Replied messages</p>
                  {logs.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Escalated', value: logs.filter(l => l.escalated).length },
                            { name: 'Auto-Replied', value: logs.filter(l => l.hasReplied && !l.escalated).length }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      No data available
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Escalation Queue */}
              {escalations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '24px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 600 }}>Escalation Queue</h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Messages pending human review</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {escalations.map((esc) => (
                      <div key={esc._id} style={{
                        padding: '16px',
                        borderRadius: 8,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                          <div>
                            <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{esc.messageContent}</p>
                            <span style={{
                              display: 'inline-block',
                              marginTop: 8,
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              background: 'rgba(239,68,68,0.2)',
                              color: '#ef4444',
                              borderRadius: 4,
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>{esc.escalationReason}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(esc.escalatedAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button onClick={() => handleReviewEscalation(esc._id, 'approved')} style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(16,185,129,0.3)',
                            background: 'rgba(16,185,129,0.15)',
                            color: '#10b981',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            fontFamily: 'inherit'
                          }} onMouseEnter={e => e.target.style.background = 'rgba(16,185,129,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(16,185,129,0.15)'}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleReviewEscalation(esc._id, 'rejected')} style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            fontFamily: 'inherit'
                          }} onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ── Leads Section ── */}
          {activeNav === 'leads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Lead KPI pills */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[{ label: 'HOT 🔥', key: 'HOT', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
                  { label: 'WARM 🟠', key: 'WARM', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
                  { label: 'COLD ❄️', key: 'COLD', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)' },
                ].map(({ label, key, color, bg, border }) => (
                  <motion.div key={key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ padding: '16px 24px', borderRadius: 12, background: bg, border: `1px solid ${border}`,
                      textAlign: 'center', minWidth: 130 }}>
                    <div style={{ fontSize: '0.75rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{leadStats[key] ?? 0}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>avg {leadStats.avgScores?.[key] ?? '—'}</div>
                  </motion.div>
                ))}
              </div>

              {/* Filter chips */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Filter:</span>
                {['ALL', 'HOT', 'WARM', 'COLD'].map(f => (
                  <button key={f} onClick={() => setLeadFilter(f)} style={{
                    padding: '4px 14px', borderRadius: 20, border: '1px solid',
                    borderColor: leadFilter === f ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                    background: leadFilter === f ? 'rgba(124,58,237,0.2)' : 'transparent',
                    color: leadFilter === f ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{f}</button>
                ))}
              </div>

              {/* Customer conversation table */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>Customer Conversations</h3>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>One row per WhatsApp number — powered by AI conversation intelligence</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{conversations.length} customer{conversations.length !== 1 ? 's' : ''}</span>
                </div>

                {leadsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📱</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>No WhatsApp conversations yet.</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', marginTop: 4 }}>Send a message to your Twilio sandbox number to get started.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Customer', 'Lead', 'Score', 'Intent', 'AI Summary', 'Last Message', 'Msgs', 'Last Seen'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 12px',
                              color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '0.72rem',
                              textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {conversations
                            .filter(c => leadFilter === 'ALL' || c.lead?.type === leadFilter)
                            .map((conv, i) => {
                              const lt = conv.lead?.type;
                              const badgeColor   = lt === 'HOT' ? '#ef4444' : lt === 'WARM' ? '#f59e0b' : lt === 'COLD' ? '#06b6d4' : '#64748b';
                              const badgeBg      = lt === 'HOT' ? 'rgba(239,68,68,0.15)' : lt === 'WARM' ? 'rgba(245,158,11,0.15)' : lt === 'COLD' ? 'rgba(6,182,212,0.15)' : 'rgba(100,116,139,0.15)';
                              const scoreColor   = (conv.lead?.score ?? 0) >= 70 ? '#ef4444' : (conv.lead?.score ?? 0) >= 40 ? '#f59e0b' : '#06b6d4';
                              const phone        = (conv.conversationId || '').replace('whatsapp:', '');
                              return (
                                <motion.tr key={conv._id || i}
                                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

                                  {/* Customer phone */}
                                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 28, height: 28, borderRadius: '50%',
                                        background: `${badgeColor}20`, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 12, color: badgeColor, fontWeight: 700 }}>
                                        {(lt || '?')[0]}
                                      </div>
                                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                                        {phone || 'unknown'}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Lead badge */}
                                  <td style={{ padding: '12px' }}>
                                    <span style={{ padding: '3px 10px', borderRadius: 5,
                                      background: badgeBg, color: badgeColor,
                                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                                      {lt || '—'}
                                    </span>
                                  </td>

                                  {/* Score bar */}
                                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <div style={{ width: `${conv.lead?.score ?? 0}%`, height: '100%',
                                          background: scoreColor, borderRadius: 3, transition: 'width 0.4s' }} />
                                      </div>
                                      <span style={{ fontSize: '0.78rem', color: scoreColor, fontWeight: 600 }}>{conv.lead?.score ?? '—'}</span>
                                    </div>
                                  </td>

                                  {/* Intent */}
                                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                                    {(conv.lead?.intent || '—').replace(/_/g, ' ')}
                                  </td>

                                  {/* AI Summary */}
                                  <td style={{ padding: '12px', maxWidth: 260, color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
                                    <span title={conv.summary || ''}>
                                      {conv.summary ? (conv.summary.length > 80 ? conv.summary.slice(0, 80) + '…' : conv.summary) : <span style={{ color: 'rgba(255,255,255,0.25)' }}>No summary yet</span>}
                                    </span>
                                  </td>

                                  {/* Last message */}
                                  <td style={{ padding: '12px', maxWidth: 180, color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {conv.lastMessage || '—'}
                                  </td>

                                  {/* Message count */}
                                  <td style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
                                    {conv.totalMessages ?? 0}
                                  </td>

                                  {/* Last seen */}
                                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </td>
                                </motion.tr>
                              );
                            })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Simulate Section with ENHANCEMENTS */}
          {activeNav === 'simulate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Input Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '24px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  maxWidth: 800
                }}
              >
                <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 600 }}>Live AI Simulation</h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Test how the AI classifies, analyzes, and responds to customer messages in real-time</p>

                <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    value={simMsg}
                    onChange={e => setSimMsg(e.target.value)}
                    placeholder='e.g. "My order arrived broken and I want a refund immediately!"'
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff'
                    }}
                  />
                  <button type="submit" disabled={simLoading || !simMsg.trim()} style={{
                    alignSelf: 'flex-end',
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: '1px solid rgba(124,58,237,0.3)',
                    background: simLoading || !simMsg.trim() ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.15)',
                    color: '#7c3aed',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: simLoading || !simMsg.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: simLoading || !simMsg.trim() ? 0.5 : 1
                  }} onMouseEnter={e => !simLoading && simMsg.trim() && (e.target.style.background = 'rgba(124,58,237,0.25)')} onMouseLeave={e => !simLoading && simMsg.trim() && (e.target.style.background = 'rgba(124,58,237,0.15)')}>
                    <Send size={16} />
                    {simLoading ? 'Analysing...' : 'Analyse Message'}
                  </button>
                </form>

                {simError && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem' }}>
                    ⚠️ {simError}
                  </div>
                )}
              </motion.div>

              {/* Result Card with ENHANCEMENTS */}
              {simResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '24px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Analysis Result</h3>
                    <button onClick={() => setShowSimDetails(!showSimDetails)} style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      color: '#7c3aed',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}>
                      {showSimDetails ? '← Collapse' : 'Expand →'}
                    </button>
                  </div>

                  {/* Quick Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                    <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>TYPE</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 4, color: '#3b82f6', textTransform: 'capitalize' }}>{simResult.type}</p>
                    </div>
                    <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(123,58,237,0.1)', border: '1px solid rgba(123,58,237,0.2)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>SENTIMENT</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 4, color: simResult.sentiment === 'negative' ? '#f87171' : simResult.sentiment === 'positive' ? '#34d399' : '#f59e0b', textTransform: 'capitalize' }}>{simResult.sentiment}</p>
                    </div>
                    <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>ACTION</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 4, color: '#ef4444', textTransform: 'capitalize' }}>{simResult.action}</p>
                    </div>
                    <div style={{ padding: '12px', borderRadius: 8, background: simResult.escalated ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: simResult.escalated ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>ESCALATION</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 4, color: simResult.escalated ? '#ef4444' : '#10b981' }}>{simResult.escalated ? '🔴 Yes' : '✅ No'}</p>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  {showSimDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{
                        paddingTop: 20,
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>📊 Detailed Analysis</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {simResult.confidence && (
                          <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: '0.85rem' }}>Classification Confidence</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7c3aed' }}>{(simResult.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', width: `${simResult.confidence * 100}%`, transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        )}
                        {simResult.requiresHumanReview && (
                          <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>⚠️ Human Review Required</p>
                            <p style={{ fontSize: '0.8rem', marginTop: 6, color: 'rgba(255,255,255,0.6)' }}>{simResult.reviewReason || 'This message may need merchant attention'}</p>
                          </div>
                        )}
                        {simResult.suggestedReply && (
                          <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>💬 Suggested Reply</p>
                            <p style={{ fontSize: '0.85rem', marginTop: 8, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>"{simResult.suggestedReply}"</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Escalations Section */}
          {activeNav === 'escalations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '24px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 600 }}>🚨 Escalated Messages</h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Messages requiring human review and response</p>

              {escalations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)' }}>No escalated messages. Great job!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {escalations.map((esc) => (
                    <div
                      key={esc._id}
                      style={{
                        padding: '16px',
                        borderRadius: 8,
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderLeft: '4px solid #ef4444',
                        background: 'rgba(239,68,68,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600 }}>From: {esc.from}</p>
                          <p style={{ marginTop: 8, color: 'rgba(255,255,255,0.8)' }}>"{esc.messageContent}"</p>
                          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'rgba(239,68,68,0.2)',
                              color: '#ef4444',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              {esc.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'rgba(124,58,237,0.2)',
                              color: '#a78bfa',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}>
                              {esc.type}
                            </span>
                          </div>
                          <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                            <strong>Reason:</strong> {esc.escalationReason}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                          <button onClick={() => handleReviewEscalation(esc._id, 'approved')} style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: '1px solid rgba(16,185,129,0.3)',
                            background: 'rgba(16,185,129,0.15)',
                            color: '#10b981',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            fontFamily: 'inherit'
                          }} onMouseEnter={e => e.target.style.background = 'rgba(16,185,129,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(16,185,129,0.15)'}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleReviewEscalation(esc._id, 'rejected')} style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            fontFamily: 'inherit'
                          }} onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Settings Section */}
          {activeNav === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                maxWidth: 600,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              <div style={{
                padding: '16px',
                borderRadius: 8,
                border: '1px solid rgba(59,130,246,0.3)',
                background: 'rgba(59,130,246,0.05)'
              }}>
                <h4 style={{ marginBottom: 8, fontWeight: 600 }}>Reconfigure Automations</h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Restart the onboarding flow to change your automations and channels.</p>
                <button onClick={() => navigate('/onboarding')} style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid rgba(59,130,246,0.3)',
                  background: 'rgba(59,130,246,0.15)',
                  color: '#3b82f6',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit'
                }} onMouseEnter={e => e.target.style.background = 'rgba(59,130,246,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(59,130,246,0.15)'}>
                  Restart Onboarding
                </button>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.05)'
              }}>
                <h4 style={{ marginBottom: 8, fontWeight: 600, color: '#ef4444' }}>Danger Zone</h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Reset all configurations and start fresh.</p>
                <button onClick={() => { if (confirm('Reset everything?')) { resetOnboarding(); navigate('/'); } }} style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit'
                }} onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.15)'}>
                  Reset Everything
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;