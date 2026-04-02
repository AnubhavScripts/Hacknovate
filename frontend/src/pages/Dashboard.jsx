import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import Sidebar from '../components/Sidebar';
import { useOnboardingStore } from '../store/onboardingStore';
import { useUser } from '../context/UserContext';
import { getAutomationApi, getLogsApi, analyzeMessageApi } from '../services/api';
import { MessageSquare, Mail, MessageCircle, LogOut, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const automationLabels = {
  complaint_handling: 'Complaint Handling',
  query_answering: 'Query Answering',
  order_tracking: 'Order Tracking',
  cancellation_requests: 'Cancellation Requests',
};

const TYPE_COLOR = {
  complaint: '#ef4444', query: '#06b6d4',
  order: '#f59e0b', cancellation: '#8b5cf6', unknown: '#64748b',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { selectedAutomations, connectedChannels, resetOnboarding } = useOnboardingStore();
  const [activeSection, setActiveSection] = useState('automations');

  // Backend state
  const [automation, setAutomation] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Simulate section
  const [simMsg, setSimMsg] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState('');

  const userId = user?._id || user?.id || 'mock_user_001';

  useEffect(() => {
    getAutomationApi(userId)
      .then(({ data }) => setAutomation(data))
      .catch(() => {});

    getLogsApi(userId)
      .then(({ data }) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [userId]);

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
      // Refresh logs after simulation
      getLogsApi(userId).then(({ data }) => setLogs(data)).catch(() => {});
    } catch (err) {
      setSimError(err.response?.data?.error || 'AI request failed. Is the backend running?');
    } finally {
      setSimLoading(false);
    }
  };

  // Use backend data if available, else fall back to Zustand store
  const activeAutomations = automation?.selectedOptions || selectedAutomations;
  const activeChannels    = automation?.connectedChannels || connectedChannels;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="flex-1 p-8">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back{user?.name ? `, ${user.name}` : ''}!
                {automation?.status === 'active' && (
                  <span style={{ marginLeft: 8, color: '#10b981', fontWeight: 600 }}>● Automation Active</span>
                )}
              </p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut size={18} /> Logout
            </Button>
          </div>

          {/* Automations Section */}
          {activeSection === 'automations' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Automations</CardTitle>
                  <CardDescription>Currently active automations in your AI assistant</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeAutomations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {activeAutomations.map((auto) => (
                        <div key={auto} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{automationLabels[auto] || auto}</h3>
                              <p className="mt-1 text-sm text-gray-600">
                                Status: <span className="font-medium text-green-600">Active</span>
                              </p>
                            </div>
                            <Badge variant="success">Active</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 p-8 text-center">
                      <p className="text-gray-600">No automations selected yet</p>
                      <Button variant="primary" size="sm" className="mt-4" onClick={() => navigate('/onboarding')}>
                        Configure Automations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Messages processed by your AI assistant</CardDescription>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <p className="text-gray-500 text-sm">Loading...</p>
                  ) : logs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages processed yet. Try the Simulate tab!</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            {['Message', 'Type', 'Sentiment', 'Priority', 'Time'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {logs.slice(0, 10).map((log, i) => (
                            <tr key={log._id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '10px 12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</td>
                              <td style={{ padding: '10px 12px', color: TYPE_COLOR[log.type], fontWeight: 600, textTransform: 'capitalize' }}>{log.type}</td>
                              <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{log.sentiment}</td>
                              <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{log.priority}</td>
                              <td style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '0.75rem' }}>
                                {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Channels Section */}
          {activeSection === 'channels' && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Channels</CardTitle>
                <CardDescription>Manage your communication channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { id: 'gmail', label: 'Gmail', Icon: Mail, color: 'bg-red-100 text-red-600' },
                    { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, color: 'bg-green-100 text-green-600' },
                  ].map(({ id, label, Icon, color }) => (
                    <div key={id} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-3 ${color.split(' ')[0]}`}>
                            <Icon size={20} className={color.split(' ')[1]} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{label}</h3>
                            <p className="text-sm text-gray-600">
                              {activeChannels[id] ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {activeChannels[id] && <Badge variant="success">Connected</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Simulate Section */}
          {activeSection === 'simulate' && (
            <Card>
              <CardHeader>
                <CardTitle>Live AI Simulation</CardTitle>
                <CardDescription>Test how the AI classifies and responds to customer messages</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    value={simMsg}
                    onChange={e => setSimMsg(e.target.value)}
                    placeholder='e.g. "My order arrived broken and I want a refund!"'
                    rows={4}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <Button type="submit" variant="primary" disabled={simLoading || !simMsg.trim()} className="self-end flex items-center gap-2">
                    <Send size={16} />
                    {simLoading ? 'Analysing...' : 'Analyse Message'}
                  </Button>
                </form>

                {simError && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem' }}>
                    ⚠️ {simError}
                  </div>
                )}

                {simResult && (
                  <div style={{ marginTop: 20, padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                      <span style={{ padding: '4px 12px', borderRadius: 99, background: `${TYPE_COLOR[simResult.type]}20`, color: TYPE_COLOR[simResult.type], fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize', border: `1px solid ${TYPE_COLOR[simResult.type]}40` }}>
                        {simResult.type}
                      </span>
                      <span style={{ padding: '4px 12px', borderRadius: 99, background: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.82rem', border: '1px solid #bbf7d0' }}>
                        {simResult.priority} priority
                      </span>
                      <span style={{ padding: '4px 12px', borderRadius: 99, background: '#fefce8', color: '#854d0e', fontWeight: 600, fontSize: '0.82rem', border: '1px solid #fde68a' }}>
                        {simResult.sentiment}
                      </span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Recommended Action</p>
                      <p style={{ fontSize: '0.9rem', color: '#374151' }}>⚡ {simResult.action}</p>
                    </div>
                    <div style={{ background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 10, padding: '14px 16px' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6d28d9', marginBottom: 8 }}>🤖 AI REPLY</p>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#1e1b4b' }}>{simResult.reply}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Reconfigure Automations</h3>
                    <p className="text-sm text-blue-800 mb-4">Restart the onboarding flow to change your automations and channels.</p>
                    <Button variant="primary" onClick={() => navigate('/onboarding')}>Restart Onboarding</Button>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-4">Reset all configurations and start fresh.</p>
                    <Button variant="destructive" onClick={() => { if (confirm('Reset everything?')) { resetOnboarding(); navigate('/'); } }}>
                      Reset Everything
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
