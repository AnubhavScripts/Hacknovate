import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import Sidebar from '../components/Sidebar';
import { useOnboardingStore } from '../store/onboardingStore';
import { useUser } from '../context/UserContext';
import { MessageSquare, Mail, MessageCircle, Settings, LogOut, AlertCircle, BarChart3, Send, Zap, Clock, Pause, Trash2, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAutomationApi, getRulesApi, getLogsApi, logoutApi, getAnalyticsApi, getChannelDataApi, deleteAutomationApi, updateStatusApi } from '../services/api';

const automationLabels = {
  complaint_handling: 'Complaint Handling',
  query_answering: 'Query Answering',
  order_tracking: 'Order Tracking',
  cancellation_requests: 'Cancellation Requests',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { selectedAutomations, connectedChannels: storeChannels, resetOnboarding, setConnectedChannels } = useOnboardingStore();
  const [activeSection, setActiveSection] = useState('automations');
  
  const [automations, setAutomations] = useState([]);
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [connectedChannels, setLocalConnectedChannels] = useState(storeChannels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id && !user?._id && !user?.userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const userId = user?._id || user?.id || user?.userId;
        
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
          setAutomations([]);
        }

        try {
          const { data: rulesData } = await getRulesApi(userId);
          setRules(Array.isArray(rulesData) ? rulesData : []);
        } catch {
          setRules([]);
        }

        try {
          const { data: logsData } = await getLogsApi(userId);
          setLogs(Array.isArray(logsData) ? logsData : []);
        } catch {
          setLogs([]);
        }

        try {
          const { data: analyticsData } = await getAnalyticsApi(userId);
          setAnalytics(analyticsData);
        } catch {
          setAnalytics(null);
        }

        try {
          const { data: channelDataResult } = await getChannelDataApi(userId);
          setChannelData(channelDataResult);
        } catch {
          setChannelData(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      resetOnboarding();
      navigate('/');
    }
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

  const handleDeleteAutomation = async (automationId, userId) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(`delete-${automationId}`);
      await deleteAutomationApi(userId);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="ml-20 lg:ml-72 flex-1 transition-all duration-300">
        {/* Header Bar */}
        <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-slate-800/50 bg-slate-950/50">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Manage automations and monitor performance</p>
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Messages */}
            {successMessage && (
              <div className="animate-in fade-in slide-in-from-top-5 duration-500">
                <Card className="border-l-4 border-green-500 bg-gradient-to-r from-green-50/80 to-emerald-50/40 backdrop-blur">
                  <CardContent className="py-4 flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0">✓</div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">{successMessage}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {error && (
              <div className="animate-in fade-in slide-in-from-top-5 duration-500">
                <Card className="border-l-4 border-red-500 bg-gradient-to-r from-red-50/80 to-rose-50/40 backdrop-blur">
                  <CardContent className="py-4 flex items-start gap-4">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Automations Section */}
            {activeSection === 'automations' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Section Header */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                      <Zap size={28} className="text-blue-400" />
                      Automations
                    </h2>
                    <p className="text-slate-400 mt-2">Create and manage your automated workflows</p>
                  </div>
                  {automations.length === 0 && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate('/onboarding')}
                      className="gap-2 hidden md:flex"
                    >
                      <Zap size={18} />
                      Create Automation
                    </Button>
                  )}
                </div>

                {/* Grid of Automations */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-xl border border-slate-800 bg-slate-800/30 backdrop-blur p-6 animate-pulse">
                        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2 mb-3"></div>
                        <div className="flex gap-2 mt-6">
                          <div className="h-8 bg-slate-700 rounded flex-1"></div>
                          <div className="h-8 bg-slate-700 rounded flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : automations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {automations.map((automation) => {
                      const selectedOptions = automation?.selectedOptions || [];
                      
                      return (
                        <div key={automation._id} className="group animate-in fade-in duration-500">
                          <Card className="h-full bg-slate-800/40 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/60">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-white group-hover:text-blue-400 truncate">
                                    {automation.name || 'Automation'}
                                  </CardTitle>
                                  <CardDescription className="text-slate-400 group-hover:text-slate-300 mt-1">
                                    {selectedOptions.length} flow{selectedOptions.length !== 1 ? 's' : ''} active
                                  </CardDescription>
                                </div>
                                <Badge 
                                  variant={automation.status === 'active' ? 'active' : 'paused'}
                                  className="flex-shrink-0"
                                >
                                  {automation.status === 'active' ? '🟢 Active' : '⏸ Paused'}
                                </Badge>
                              </div>
                            </CardHeader>

                            <CardContent className="pb-0">
                              <div className="flex flex-wrap gap-2 mb-6">
                                {selectedOptions.length > 0 ? (
                                  selectedOptions.map((option) => (
                                    <Badge key={option} variant="secondary" className="text-xs">
                                      {automationLabels[option] || option}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-500">No flows configured</span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 -mx-6 -mb-5 px-6 py-4 border-t border-slate-700/50 bg-slate-900/30">
                                {automation.status === 'active' && (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handlePauseAutomation(automation._id)}
                                    disabled={actionLoading === `pause-${automation._id}`}
                                    className="flex-1 text-xs justify-center"
                                  >
                                    <Pause size={14} />
                                    {actionLoading === `pause-${automation._id}` ? 'Pausing...' : 'Pause'}
                                  </Button>
                                )}
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteAutomation(automation._id, automation.userId)}
                                  disabled={actionLoading === `delete-${automation._id}`}
                                  className="flex-1 text-xs justify-center"
                                >
                                  <Trash2 size={14} />
                                  {actionLoading === `delete-${automation._id}` ? 'Deleting...' : 'Delete'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed border-slate-700 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur py-16">
                    <CardContent className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Zap size={32} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">No automations yet</p>
                        <p className="text-slate-400 mt-1">Create your first automation to get started</p>
                      </div>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate('/onboarding')}
                        className="mt-4"
                      >
                        <Zap size={16} />
                        Create First Automation
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Channels Section */}
            {activeSection === 'channels' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
                    <Mail size={28} className="text-blue-400" />
                    Connected Channels
                  </h2>
                  <p className="text-slate-400">Manage your communication platforms</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'Gmail', icon: '📧', connected: connectedChannels?.gmail },
                    { name: 'WhatsApp', icon: '💬', connected: connectedChannels?.whatsapp }
                  ].map((channel, i) => (
                    <Card key={i} className="bg-slate-800/40 border-slate-700/50 hover:border-blue-500/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{channel.icon}</div>
                            <div>
                              <CardTitle className="text-white">{channel.name}</CardTitle>
                              <CardDescription className="text-slate-400">
                                {channel.connected ? 'Connected' : 'Not connected'}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={channel.connected ? 'active' : 'secondary'}>
                            {channel.connected ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
                    <BarChart3 size={28} className="text-blue-400" />
                    Analytics
                  </h2>
                  <p className="text-slate-400">Monitor your automation metrics</p>
                </div>
                
                {!loading && analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Messages', value: analytics.summary?.totalMessages || 0, icon: Send },
                      { label: 'Auto Resolved', value: analytics.summary?.autoResolved || 0, icon: Zap },
                      { label: 'Response Time', value: '1.2m', icon: Clock },
                      { label: 'Satisfaction', value: '97%', icon: TrendingUp }
                    ].map((stat, i) => (
                      <Card key={i} className="bg-slate-800/40 border-slate-700/50 hover:border-blue-500/50">
                        <CardContent className="p-6 flex items-start justify-between">
                          <div>
                            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                            <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/10">
                            <stat.icon size={24} className="text-blue-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2 mb-8">
                  <Settings size={28} className="text-blue-400" />
                  Settings
                </h2>
                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardContent className="p-8 text-center">
                    <p className="text-slate-400">Settings coming soon</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
