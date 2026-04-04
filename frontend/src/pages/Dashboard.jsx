import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import Sidebar from '../components/Sidebar';
import { useOnboardingStore } from '../store/onboardingStore';
import { useUser } from '../context/UserContext';
import {
  MessageSquare, Mail, MessageCircle, LogOut, AlertCircle,
  BarChart3, Send, Zap, Clock, Pause, Trash2, Activity,
  TrendingUp, TrendingDown, Minus, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAutomationApi, getRulesApi, getLogsApi, logoutApi,
  getAnalyticsApi, deleteAutomationApi, updateStatusApi,
  getOnboardingConfigApi, getLeadsApi
} from '../services/api';

const automationLabels = {
  complaint_handling: 'Complaint Handling',
  query_answering: 'Query Answering',
  order_tracking: 'Order Tracking',
  cancellation_requests: 'Cancellation Requests',
  ecommerce: 'Ecommerce',
  education: 'Education',
  finance: 'Finance',
};

const leadTrendIcon = (trend) => {
  if (trend === 'RISING') return <TrendingUp size={14} className="text-green-400" />;
  if (trend === 'FALLING') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-gray-400" />;
};

const leadBadgeColor = (score) => {
  if (score === 'HOT') return 'bg-red-500/20 text-red-300 border border-red-500/30';
  if (score === 'WARM') return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { selectedAutomations, connectedChannels: storeChannels, resetOnboarding, setConnectedChannels } = useOnboardingStore();
  const [activeSection, setActiveSection] = useState('automations');

  // State for fetched data
  const [automations, setAutomations] = useState([]);
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [connectedChannels, setLocalConnectedChannels] = useState(storeChannels);
  const [onboardingConfig, setOnboardingConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [leadsData, setLeadsData] = useState(null); // real-time lead data
  const [leadsLastFetched, setLeadsLastFetched] = useState(null);

  const userId = user?._id || user?.id || user?.userId;

  const fetchDashboardData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch automations
      try {
        const { data: automationData } = await getAutomationApi(userId);
        if (!automationData) {
          setAutomations([]);
        } else if (Array.isArray(automationData)) {
          setAutomations(automationData);
          if (automationData.length > 0 && automationData[0].connectedChannels) {
            setLocalConnectedChannels(automationData[0].connectedChannels);
            setConnectedChannels(automationData[0].connectedChannels);
          }
        } else {
          setAutomations([automationData]);
          if (automationData.connectedChannels) {
            setLocalConnectedChannels(automationData.connectedChannels);
            setConnectedChannels(automationData.connectedChannels);
          }
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.warn('Could not fetch automations:', err.message);
        }
        setAutomations([]);
      }

      // Fetch logs
      try {
        const { data: logsData } = await getLogsApi(userId);
        setLogs(Array.isArray(logsData) ? logsData : []);
      } catch {
        setLogs([]);
      }

      // Fetch analytics
      try {
        const { data: analyticsData } = await getAnalyticsApi(userId);
        setAnalytics(analyticsData);
      } catch {
        setAnalytics(null);
      }

      // Fetch onboarding config
      try {
        const { data: configData } = await getOnboardingConfigApi();
        if (configData.success) setOnboardingConfig(configData.config);
      } catch {
        setOnboardingConfig(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real-time lead polling every 30 seconds when analytics tab is active ──
  useEffect(() => {
    if (!userId || activeSection !== 'analytics') return;

    const fetchLeads = async () => {
      try {
        const { data } = await getLeadsApi(userId);
        setLeadsData(data);
        setLeadsLastFetched(new Date());
      } catch (err) {
        console.warn('Lead poll failed:', err.message);
      }
    };

    fetchLeads(); // fetch immediately on tab open
    const interval = setInterval(fetchLeads, 30000); // then every 30s
    return () => clearInterval(interval);
  }, [userId, activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handlePauseAutomation = async (automationId) => {
    try {
      setActionLoading(`pause-${automationId}`);
      await updateStatusApi(automationId, 'paused');
      setAutomations(automations.map(auto =>
        auto._id === automationId ? { ...auto, status: 'paused' } : auto
      ));
      setSuccessMessage('Automation paused successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pause automation');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeAutomation = async (automationId) => {
    try {
      setActionLoading(`resume-${automationId}`);
      await updateStatusApi(automationId, 'active');
      setAutomations(automations.map(auto =>
        auto._id === automationId ? { ...auto, status: 'active' } : auto
      ));
      setSuccessMessage('Automation resumed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resume automation');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAutomation = async (automationId, automUserId) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;
    try {
      setActionLoading(`delete-${automationId}`);
      await deleteAutomationApi(automUserId);
      setAutomations([]);
      resetOnboarding();
      setSuccessMessage('Automation deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete automation');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const sectionHeadings = {
    automations: { title: 'Automations', description: 'Manage and monitor your active automations' },
    channels: { title: 'Channels', description: 'Connect and manage your communication channels' },
    analytics: { title: 'Analytics', description: 'View insights and performance metrics' },
    logs: { title: 'Activity Logs', description: 'Real-time log of all processed messages' },
    settings: { title: 'Settings', description: 'Configure your account and preferences' },
  };

  const currentHeading = sectionHeadings[activeSection] || sectionHeadings.automations;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                {currentHeading.title}
              </h1>
              <p className="mt-2 text-slate-400 font-medium">{currentHeading.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDashboardData}
                className="text-slate-400 hover:text-white"
                title="Refresh data"
              >
                <RefreshCw size={16} />
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {successMessage && (
            <div className="mb-6 rounded-xl bg-green-500/10 border border-green-500/30 px-5 py-4 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <p className="text-green-300 font-medium text-sm">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 flex items-center gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
              <p className="text-red-300 font-medium text-sm">{error}</p>
            </div>
          )}

          {/* ── Automations Section ── */}
          {activeSection === 'automations' && (
            <div className="space-y-6">
              {/* Config Overview */}
              {(onboardingConfig || selectedAutomations.length > 0) && (
                <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Configuration Overview</CardTitle>
                    <CardDescription className="text-slate-400">Your onboarding selections and connected channels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Categories</h4>
                        <div className="space-y-2">
                          {(onboardingConfig?.selectedAutomations || selectedAutomations).length > 0 ? (
                            (onboardingConfig?.selectedAutomations || selectedAutomations).map(a => (
                              <div key={a} className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-sm font-medium text-blue-300 capitalize">{automationLabels[a] || a}</p>
                              </div>
                            ))
                          ) : <p className="text-sm text-slate-500">None selected</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Features</h4>
                        <div className="space-y-2">
                          {onboardingConfig?.selectedSubcategories?.length > 0 ? (
                            onboardingConfig.selectedSubcategories.map(s => (
                              <div key={s} className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <p className="text-sm font-medium text-indigo-300 capitalize">{s.replace(/_/g, ' ')}</p>
                              </div>
                            ))
                          ) : <p className="text-sm text-slate-500">None selected</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Channels</h4>
                        <div className="space-y-2">
                          <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${(onboardingConfig?.connectedChannels?.gmail || connectedChannels.gmail) ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/50 border-slate-700/50'}`}>
                            <Mail size={14} className={(onboardingConfig?.connectedChannels?.gmail || connectedChannels.gmail) ? 'text-red-400' : 'text-slate-500'} />
                            <span className={`text-sm font-medium ${(onboardingConfig?.connectedChannels?.gmail || connectedChannels.gmail) ? 'text-red-300' : 'text-slate-500'}`}>
                              Gmail {(onboardingConfig?.connectedChannels?.gmail || connectedChannels.gmail) ? '✓' : '—'}
                            </span>
                          </div>
                          <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${(onboardingConfig?.connectedChannels?.whatsapp || connectedChannels.whatsapp) ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-800/50 border-slate-700/50'}`}>
                            <MessageCircle size={14} className={(onboardingConfig?.connectedChannels?.whatsapp || connectedChannels.whatsapp) ? 'text-green-400' : 'text-slate-500'} />
                            <span className={`text-sm font-medium ${(onboardingConfig?.connectedChannels?.whatsapp || connectedChannels.whatsapp) ? 'text-green-300' : 'text-slate-500'}`}>
                              WhatsApp {(onboardingConfig?.connectedChannels?.whatsapp || connectedChannels.whatsapp) ? '✓' : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Automations List */}
              <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">My Automations</CardTitle>
                  <CardDescription className="text-slate-400">Manage your active automation workflows</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-400 animate-spin" />
                      <p className="text-slate-400 font-medium text-sm">Loading automations...</p>
                    </div>
                  ) : automations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {automations.map((automation) => {
                        const selectedOptions = automation?.selectedOptions || [];
                        const isActive = automation.status === 'active';
                        return (
                          <div key={automation._id} className="rounded-xl border border-slate-700/50 bg-slate-800/50 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-200 overflow-hidden group">
                            <div className="p-5 border-b border-slate-700/50">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">
                                  {automation.name || 'Automation'}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                  {isActive ? '● Active' : '⏸ Paused'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Enabled Flows</p>
                            </div>
                            <div className="p-5">
                              <div className="flex flex-wrap gap-2 mb-5">
                                {selectedOptions.length > 0 ? (
                                  selectedOptions.map(opt => (
                                    <span key={opt} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-300">
                                      {automationLabels[opt] || opt}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-500">No flows configured</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {isActive ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePauseAutomation(automation._id)}
                                    disabled={!!actionLoading}
                                    className="flex-1 text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50"
                                  >
                                    <Pause size={14} />
                                    {actionLoading === `pause-${automation._id}` ? 'Pausing...' : 'Pause'}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResumeAutomation(automation._id)}
                                    disabled={!!actionLoading}
                                    className="flex-1 text-green-400 border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50"
                                  >
                                    <Zap size={14} />
                                    {actionLoading === `resume-${automation._id}` ? 'Resuming...' : 'Resume'}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAutomation(automation._id, automation.userId)}
                                  disabled={!!actionLoading}
                                  className="flex-1 text-red-400 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50"
                                >
                                  <Trash2 size={14} />
                                  {actionLoading === `delete-${automation._id}` ? 'Deleting...' : 'Delete'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-800/30 border-2 border-dashed border-slate-700/50 p-12 text-center">
                      <div className="inline-flex mb-4 p-4 rounded-full bg-blue-500/10">
                        <MessageSquare size={32} className="text-blue-400" />
                      </div>
                      <p className="text-white font-semibold text-lg mb-2">No automations yet</p>
                      <p className="text-slate-400 mb-6 text-sm">Complete the onboarding to configure your first automation</p>
                      <Button variant="primary" size="md" onClick={() => navigate('/onboarding')} className="gap-2">
                        Configure Automations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Channels Section ── */}
          {activeSection === 'channels' && (
            <div className="space-y-6">
              <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Connected Channels</CardTitle>
                  <CardDescription className="text-slate-400">Status of your communication channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Gmail */}
                    <div className={`rounded-xl border-2 p-6 transition-all ${connectedChannels?.gmail ? 'border-red-500/40 bg-red-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl p-3 ${connectedChannels?.gmail ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                            <Mail size={22} className={connectedChannels?.gmail ? 'text-red-400' : 'text-slate-500'} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">Gmail</h3>
                            <p className={`text-sm ${connectedChannels?.gmail ? 'text-red-300' : 'text-slate-500'}`}>
                              {connectedChannels?.gmail ? 'Connected & Active' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {connectedChannels?.gmail ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-semibold">Connected</span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://hacknovate-production.up.railway.app';
                              window.location.href = `${apiBase}/auth/gmail/connect`;
                            }}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                      {!connectedChannels?.gmail && (
                        <p className="text-xs text-slate-500 mt-2">Connect Gmail to enable email automation and AI-powered replies.</p>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className={`rounded-xl border-2 p-6 transition-all ${connectedChannels?.whatsapp ? 'border-green-500/40 bg-green-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl p-3 ${connectedChannels?.whatsapp ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
                            <MessageCircle size={22} className={connectedChannels?.whatsapp ? 'text-green-400' : 'text-slate-500'} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">WhatsApp</h3>
                            <p className={`text-sm ${connectedChannels?.whatsapp ? 'text-green-300' : 'text-slate-500'}`}>
                              {connectedChannels?.whatsapp ? 'Connected via Twilio' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {connectedChannels?.whatsapp ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-semibold">Connected</span>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
                            Set Up
                          </Button>
                        )}
                      </div>
                      {!connectedChannels?.whatsapp && (
                        <p className="text-xs text-slate-500 mt-2">Connect WhatsApp via Twilio to enable messaging automation.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Analytics Section ── */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Messages Received</p>
                        <p className="text-3xl font-bold text-blue-400">{analytics?.summary?.totalMessages || 0}</p>
                      </div>
                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <Send className="text-blue-400" size={22} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Auto-resolved</p>
                        <p className="text-3xl font-bold text-green-400">{analytics?.summary?.autoResolved || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">{analytics?.summary?.resolutionRate || 0}% rate</p>
                      </div>
                      <div className="rounded-xl bg-green-500/10 p-3">
                        <Zap className="text-green-400" size={22} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Escalated</p>
                        <p className="text-3xl font-bold text-amber-400">{analytics?.summary?.escalated || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Needs review</p>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 p-3">
                        <AlertCircle className="text-amber-400" size={22} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Avg Response</p>
                        <p className="text-3xl font-bold text-purple-400">{analytics?.summary?.avgResponseTime || '—'}</p>
                        <p className="text-xs text-slate-500 mt-1">per message</p>
                      </div>
                      <div className="rounded-xl bg-purple-500/10 p-3">
                        <Clock className="text-purple-400" size={22} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Lead Intelligence Section ── */}
              <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Activity size={18} className="text-blue-400" />
                        Lead Intelligence
                      </CardTitle>
                      <CardDescription className="text-slate-400 mt-1">
                        AI-scored lead distribution from WhatsApp conversations
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {leadsLastFetched && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                          Live · {leadsLastFetched.toLocaleTimeString()}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => getLeadsApi(userId).then(r => { setLeadsData(r.data); setLeadsLastFetched(new Date()); })}
                        className="text-slate-400 hover:text-white h-7 w-7 p-0"
                        title="Refresh leads"
                      >
                        <RefreshCw size={13} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Lead Distribution Cards — use real-time leadsData if available */}
                  {(() => {
                    const dist = leadsData?.distribution || analytics?.leads?.distribution || { HOT: 0, WARM: 0, COLD: 0 };
                    const topLeads = leadsData?.topLeads || analytics?.leads?.topLeads || [];
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {/* HOT */}
                          <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-2xl">🔥</span>
                              <span className="text-3xl font-bold text-red-400">{dist.HOT || 0}</span>
                            </div>
                            <p className="text-red-300 font-bold text-sm mb-1">HOT Leads</p>
                            <p className="text-xs text-slate-400 leading-relaxed">High intent, ready to apply. Use <span className="text-red-300 font-semibold">expensive marketing</span>: personalized calls, priority onboarding, exclusive loan offers, dedicated sales rep follow-ups.</p>
                          </div>

                          {/* WARM */}
                          <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-2xl">🌤️</span>
                              <span className="text-3xl font-bold text-amber-400">{dist.WARM || 0}</span>
                            </div>
                            <p className="text-amber-300 font-bold text-sm mb-1">WARM Leads</p>
                            <p className="text-xs text-slate-400 leading-relaxed">Interested but not committed. Use <span className="text-amber-300 font-semibold">decent marketing</span>: targeted WhatsApp follow-ups, eligibility calculators, retargeting ads, loan benefit content.</p>
                          </div>

                          {/* COLD */}
                          <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-2xl">❄️</span>
                              <span className="text-3xl font-bold text-blue-400">{dist.COLD || 0}</span>
                            </div>
                            <p className="text-blue-300 font-bold text-sm mb-1">COLD Leads</p>
                            <p className="text-xs text-slate-400 leading-relaxed">Low intent, just exploring. Use <span className="text-blue-300 font-semibold">low-level outreach</span>: bulk SMS only, automated awareness messages, minimal spend until intent signals emerge.</p>
                          </div>
                        </div>

                        {/* Top Leads Table */}
                        {topLeads.length > 0 ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                              Top Leads by Score
                              <span className="text-xs font-normal text-slate-500 normal-case tracking-normal">({topLeads.length} conversations)</span>
                            </p>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                              {topLeads.map((lead, idx) => (
                                <div key={idx} className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 hover:border-slate-600 transition-colors">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${leadBadgeColor(lead.leadType)}`}>
                                        {leadTrendIcon(lead.trend === 'increasing' ? 'RISING' : lead.trend === 'decreasing' ? 'FALLING' : 'STABLE')}
                                        {lead.leadType}
                                      </span>
                                      <span className="text-sm font-mono font-semibold text-white">{lead.phone || lead.name}</span>
                                      <span className="text-xs text-slate-500 capitalize">{lead.intent?.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-xs text-slate-400">Score</span>
                                      <span className={`text-sm font-bold ${lead.score >= 70 ? 'text-red-400' : lead.score >= 40 ? 'text-amber-400' : 'text-blue-400'}`}>
                                        {lead.score}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Conversation Summary */}
                                  {lead.summary && (
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-blue-500/40 pl-3 mb-2">{lead.summary}</p>
                                  )}

                                  {/* Last Message preview */}
                                  {lead.lastMessage && (
                                    <p className="text-xs text-slate-500 italic mb-2">
                                      Last: &ldquo;{lead.lastMessage.slice(0, 80)}{lead.lastMessage.length > 80 ? '…' : ''}&rdquo;
                                    </p>
                                  )}

                                  {/* Signals chips */}
                                  {lead.signals?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {lead.signals.map((sig, i) => (
                                        <span key={i} className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">{sig.replace(/_/g, ' ')}</span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-slate-600">{lead.totalMessages || 0} messages</span>
                                    {lead.lastInteraction && (
                                      <span className="text-xs text-slate-600">{new Date(lead.lastInteraction).toLocaleString()}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 border border-dashed border-slate-700/50 rounded-xl">
                            <TrendingUp size={32} className="text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm font-medium">No lead data yet</p>
                            <p className="text-slate-600 text-xs mt-1">Lead scores appear once WhatsApp conversations are processed</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>


              {/* Channel + Sentiment */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Messages by Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.channels ? (
                        Object.entries(analytics.channels).map(([channel, count]) => (
                          <div key={channel} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {channel === 'email' && <Mail size={16} className="text-red-400" />}
                              {channel === 'whatsapp' && <MessageCircle size={16} className="text-green-400" />}
                              <span className="capitalize text-slate-300 text-sm">{channel}</span>
                            </div>
                            <span className="px-2.5 py-0.5 bg-slate-700/50 rounded-full text-xs font-semibold text-slate-300">{count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 size={32} className="text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">No data yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Message Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.sentiment ? (
                        Object.entries(analytics.sentiment).map(([sentiment, count]) => (
                          <div key={sentiment} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${sentiment === 'positive' ? 'bg-green-400' : sentiment === 'negative' ? 'bg-red-400' : 'bg-slate-400'}`} />
                              <span className="capitalize text-slate-300 text-sm">{sentiment}</span>
                            </div>
                            <span className="px-2.5 py-0.5 bg-slate-700/50 rounded-full text-xs font-semibold text-slate-300">{count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 size={32} className="text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">No data yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── Logs Section ── */}
          {activeSection === 'logs' && (
            <div className="space-y-6">
              <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Activity Log</CardTitle>
                      <CardDescription className="text-slate-400 mt-1">All messages processed by your AI assistant</CardDescription>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
                      {logs.length} entries
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-400 animate-spin" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity size={40} className="text-slate-600 mx-auto mb-3" />
                      <p className="text-white font-semibold mb-1">No activity yet</p>
                      <p className="text-slate-400 text-sm">Logs will appear here as messages are processed</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {logs.map((log) => (
                        <div key={log._id} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 hover:border-slate-600/70 transition-colors">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {log.channel === 'email' && <Mail size={14} className="text-red-400" />}
                              {log.channel === 'whatsapp' && <MessageCircle size={14} className="text-green-400" />}
                              <span className="text-sm font-semibold text-white truncate max-w-xs">{log.from || 'Unknown'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.escalated ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                {log.escalated ? '⚡ Escalated' : '✓ Auto-resolved'}
                              </span>
                              {log.lead?.score && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${leadBadgeColor(log.lead.score)}`}>
                                  {leadTrendIcon(log.lead.trend)} {log.lead.score}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-2">{log.message || '—'}</p>
                          {log.reply && (
                            <div className="mt-2 pl-3 border-l-2 border-blue-500/30">
                              <p className="text-xs text-blue-300 font-medium mb-0.5">AI Reply:</p>
                              <p className="text-xs text-slate-400 line-clamp-2">{log.reply}</p>
                            </div>
                          )}
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {log.type && <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{log.type}</span>}
                            {log.sentiment && <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{log.sentiment}</span>}
                            {log.priority && <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">P{log.priority}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Settings Section ── */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              {/* Account Info */}
              <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Account</CardTitle>
                  <CardDescription className="text-slate-400">Your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">{user?.name || 'User'}</p>
                      <p className="text-sm text-slate-400">{user?.email}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {String(userId).slice(-8)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Onboarding */}
              <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Onboarding</CardTitle>
                  <CardDescription className="text-slate-400">Restart the setup to reconfigure automations and channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="primary"
                    onClick={() => { resetOnboarding(); navigate('/onboarding'); }}
                  >
                    Restart Onboarding
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-slate-900/70 border-red-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-red-400">Danger Zone</CardTitle>
                  <CardDescription className="text-slate-400">Irreversible actions — proceed with caution</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm('This will delete all your automations and log you out. Are you sure?')) return;
                      try {
                        if (userId) await deleteAutomationApi(userId).catch(() => {});
                      } finally {
                        await logout();
                        resetOnboarding();
                        navigate('/');
                      }
                    }}
                  >
                    Reset Everything
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
