import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import Sidebar from '../components/Sidebar';
import { useOnboardingStore } from '../store/onboardingStore';
import { useUser } from '../context/UserContext';
import { MessageSquare, Mail, MessageCircle, Settings, LogOut, AlertCircle, BarChart3, Send, Zap, Clock, Pause, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAutomationApi, getRulesApi, getLogsApi, logoutApi, getAnalyticsApi, getChannelDataApi, deleteAutomationApi, updateStatusApi, getRemindersApi, createReminderApi, deleteReminderApi } from '../services/api';

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
  
  // State for fetched data
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

  // Reminders state
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState({ phone: '', subject: '', remindAt: '' });
  const [reminderLoading, setReminderLoading] = useState(false);

  // Fetch automation data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id && !user?._id && !user?.userId) {
        console.warn('⚠️ No user ID found. User:', user);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const userId = user?._id || user?.id || user?.userId;
        
        console.log('📥 Fetching dashboard data for user:', userId);

        // Fetch automations
        try {
          console.log('🔍 Calling getAutomationApi with userId:', userId);
          const { data: automationData } = await getAutomationApi(userId);
          console.log('✅ Automations fetched:', automationData);
          
          if (!automationData) {
            setAutomations([]);
            setLocalConnectedChannels({ gmail: false, whatsapp: false });
          } else if (Array.isArray(automationData)) {
            setAutomations(automationData);
            // Get connected channels from first automation
            if (automationData.length > 0 && automationData[0].connectedChannels) {
              console.log('📱 Updating connected channels from backend:', automationData[0].connectedChannels);
              setLocalConnectedChannels(automationData[0].connectedChannels);
              setConnectedChannels(automationData[0].connectedChannels);
            }
          } else {
            // Single automation object returned
            setAutomations([automationData]);
            if (automationData.connectedChannels) {
              console.log('📱 Updating connected channels from backend:', automationData.connectedChannels);
              setLocalConnectedChannels(automationData.connectedChannels);
              setConnectedChannels(automationData.connectedChannels);
            }
          }
        } catch (err) {
          console.error('❌ Error fetching automations:', err.response?.status, err.response?.data, err.message);
          setAutomations([]);
        }

        // Fetch rules
        try {
          console.log('🔍 Calling getRulesApi with userId:', userId);
          const { data: rulesData } = await getRulesApi(userId);
          console.log('✅ Rules fetched:', rulesData);
          setRules(Array.isArray(rulesData) ? rulesData : []);
        } catch (err) {
          console.warn('⚠️ Could not fetch rules:', err.message);
          setRules([]);
        }

        // Fetch logs
        try {
          console.log('🔍 Calling getLogsApi with userId:', userId);
          const { data: logsData } = await getLogsApi(userId);
          console.log('✅ Logs fetched:', logsData);
          setLogs(Array.isArray(logsData) ? logsData : []);
        } catch (err) {
          console.warn('⚠️ Could not fetch logs:', err.message);
          setLogs([]);
        }

        // Fetch analytics
        try {
          console.log('🔍 Calling getAnalyticsApi with userId:', userId);
          const { data: analyticsData } = await getAnalyticsApi(userId);
          console.log('✅ Analytics fetched:', analyticsData);
          setAnalytics(analyticsData);
        } catch (err) {
          console.warn('⚠️ Could not fetch analytics:', err.message);
          setAnalytics(null);
        }

        // Fetch channel data
        try {
          console.log('🔍 Calling getChannelDataApi with userId:', userId);
          const { data: channelDataResult } = await getChannelDataApi(userId);
          console.log('✅ Channel data fetched:', channelDataResult);
          setChannelData(channelDataResult);
        } catch (err) {
          console.warn('⚠️ Could not fetch channel data:', err.message);
          setChannelData(null);
        }
        // Fetch reminders
        try {
          const { data: remindersData } = await getRemindersApi();
          setReminders(Array.isArray(remindersData) ? remindersData : []);
        } catch (err) {
          console.warn('⚠️ Could not fetch reminders:', err.message);
          setReminders([]);
        }

      } catch (err) {
        console.error('❌ Error fetching dashboard data:', err);
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
      console.log('⏸️ Pausing automation:', automationId);
      await updateStatusApi(automationId, 'paused');
      console.log('✅ Pause API call successful');
      
      // Update state immediately
      setAutomations(automations.map(auto => 
        auto._id === automationId ? { ...auto, status: 'paused' } : auto
      ));
      setSuccessMessage('Automation paused successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      console.log('✅ Automation paused:', automationId);
    } catch (err) {
      console.error('❌ Error pausing automation:', err);
      setError(err.response?.data?.error || 'Failed to pause automation');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAutomation = async (automationId, userId) => {
    if (!window.confirm('Are you sure you want to delete this automation? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(`delete-${automationId}`);
      console.log('🗑️ Deleting automation with userId:', userId, 'automationId:', automationId);
      
      const response = await deleteAutomationApi(userId);
      console.log('✅ Delete API response:', response.data);
      
      // Clear all automations - the user's automation was deleted entirely
      setAutomations([]);
      resetOnboarding(); // Also reset the onboarding store to clear selectedAutomations
      console.log('🧹 Cleared automations array and onboarding state');
      
      setSuccessMessage('Automation deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      console.log('✅ Automation deletion complete');
    } catch (err) {
      console.error('❌ Error deleting automation:', err);
      console.error('Error details:', err.response?.data, err.message);
      setError(err.response?.data?.error || 'Failed to delete automation');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Reminder handlers ──────────────────────────────────────────────────────
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!reminderForm.phone || !reminderForm.subject || !reminderForm.remindAt) return;
    setReminderLoading(true);
    try {
      // phone must have whatsapp: prefix for Twilio
      const phone = reminderForm.phone.startsWith('whatsapp:')
        ? reminderForm.phone
        : `whatsapp:+91${reminderForm.phone.replace(/\D/g,'')}`;
      await createReminderApi({ ...reminderForm, phone });
      const { data } = await getRemindersApi();
      setReminders(Array.isArray(data) ? data : []);
      setReminderForm({ phone: '', subject: '', remindAt: '' });
    } catch (err) {
      console.error('Reminder create error:', err);
    } finally {
      setReminderLoading(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await deleteReminderApi(id);
      setReminders(r => r.filter(x => x._id !== id));
    } catch (err) {
      console.error('Reminder delete error:', err);
    }
  };

  // Section heading data
  const sectionHeadings = {
    automations: { title: 'Automations', description: 'Manage and monitor your active automations' },
    channels:    { title: 'Channels',    description: 'Connect and manage your communication channels' },
    analytics:   { title: 'Analytics',   description: 'View insights and performance metrics' },
    reminders:   { title: 'Reminders',   description: 'Schedule and manage assignment reminders via WhatsApp' },
    settings:    { title: 'Settings',    description: 'Configure your account and preferences' },
  };

  const currentHeading = sectionHeadings[activeSection] || sectionHeadings.automations;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 bg-clip-text text-transparent">{currentHeading.title}</h1>
              <p className="mt-2 text-slate-600 font-medium">{currentHeading.description}</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </Button>
          </div>

          {/* Automations Section */}
          {activeSection === 'automations' && (
            <div className="space-y-6">
              {successMessage && (
                <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 text-base">Success!</h3>
                        <p className="text-sm text-green-700 mt-0.5">{successMessage}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {error && (
                <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 text-base">Error Loading Data</h3>
                        <p className="text-sm text-red-700 mt-0.5">{error}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>My Automations</CardTitle>
                  <CardDescription>
                    Manage and monitor your active automations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                      <p className="text-slate-600 font-medium">Loading automations...</p>
                    </div>
                  ) : automations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {automations.map((automation) => {
                        // Handle Automation document from backend
                        const selectedOptions = automation?.selectedOptions || [];
                        
                        return (
                          <div
                            key={automation._id}
                            className="rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                          >
                            <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-100">
                              <div className="flex items-start justify-between mb-3">
                                <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                  {automation.name || 'Automation'}
                                </h3>
                                <Badge variant={automation.status === 'active' ? 'active' : automation.status === 'paused' ? 'paused' : 'secondary'}>
                                  {automation.status === 'active' ? '🟢 Active' : automation.status === 'paused' ? '⏸ Paused' : automation.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Active Flows</p>
                            </div>
                            
                            <div className="p-5">
                              <div className="flex flex-wrap gap-2 mb-4">
                                {selectedOptions.length > 0 ? (
                                  selectedOptions.map((option) => (
                                    <Badge key={option} variant="secondary" className="text-xs">
                                      {automationLabels[option] || option}
                                    </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-500">No automations configured</span>
                                  )}
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
                              {automation.status === 'active' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePauseAutomation(automation._id)}
                                  disabled={actionLoading === `pause-${automation._id}`}
                                  className="flex items-center justify-center gap-1.5 flex-1 text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-300"
                                >
                                  <Pause size={16} />
                                  <span className="font-medium">{actionLoading === `pause-${automation._id}` ? 'Pausing...' : 'Pause'}</span>
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAutomation(automation._id, automation.userId)}
                                disabled={actionLoading === `delete-${automation._id}`}
                                className="flex items-center justify-center gap-1.5 flex-1 text-red-600 border-red-200 bg-red-50/50 hover:bg-red-100 hover:border-red-300"
                              >
                                <Trash2 size={16} />
                                <span className="font-medium">{actionLoading === `delete-${automation._id}` ? 'Deleting...' : 'Delete'}</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedAutomations.length > 0 ? (
                    // Fallback to onboarding store if no backend data (new user)
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {selectedAutomations.map((automation) => {
                        return (
                          <div
                            key={automation}
                            className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {automationLabels[automation]}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                  Status: <span className="font-medium text-green-600">Active</span>
                                </p>
                              </div>
                              <Badge variant="success">Active</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gradient-to-br from-slate-100 to-blue-100 border-2 border-dashed border-slate-300 p-12 text-center">
                      <div className="inline-block mb-4 p-3 rounded-full bg-blue-100">
                        <MessageSquare size={32} className="text-blue-600" />
                      </div>
                      <p className="text-slate-700 font-semibold text-lg mb-2">No automations yet</p>
                      <p className="text-slate-600 mb-6">Create your first automation to get started</p>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate('/onboarding')}
                        className="gap-2"
                      >
                        Configure Automations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Channels Section */}
          {activeSection === 'channels' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Channels & Performance</CardTitle>
                  <CardDescription>
                    Real-time metrics for each communication channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-600">Loading channel data...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Gmail Channel */}
                      <div className={`rounded-lg border-2 p-4 transition-all ${
                        connectedChannels?.gmail 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-red-100 p-3">
                              <Mail size={20} className="text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Gmail</h3>
                              <p className="text-sm text-gray-600">
                                {connectedChannels?.gmail ? 'Connected & Active' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          {connectedChannels?.gmail && (
                            <Badge variant="success">Connected</Badge>
                          )}
                        </div>
                        
                        {connectedChannels?.gmail && channelData && (
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Messages:</span>
                              <span className="font-semibold">{channelData.metrics?.totalMessages || 0}</span>
                            </div>
                            <div className="flex justify-between bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Auto-resolved:</span>
                              <span className="font-semibold">{channelData.metrics?.autoResolved || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* WhatsApp Channel */}
                      <div className={`rounded-lg border-2 p-4 transition-all ${
                        connectedChannels?.whatsapp 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-3">
                              <MessageCircle size={20} className="text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                              <p className="text-sm text-gray-600">
                                {connectedChannels?.whatsapp ? 'Connected & Active' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          {connectedChannels?.whatsapp && (
                            <Badge variant="success">Connected</Badge>
                          )}
                        </div>
                        
                        {connectedChannels?.whatsapp && channelData && (
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Messages:</span>
                              <span className="font-semibold">{channelData.metrics?.totalMessages || 0}</span>
                            </div>
                            <div className="flex justify-between bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Auto-resolved:</span>
                              <span className="font-semibold">{channelData.metrics?.autoResolved || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Messages Received */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Messages Received</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {analytics?.summary?.totalMessages || 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-100 p-3">
                        <Send className="text-blue-600" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Auto-resolved */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Auto-resolved</p>
                        <p className="text-3xl font-bold text-green-600">
                          {analytics?.summary?.autoResolved || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {analytics?.summary?.resolutionRate || 0}% resolution rate
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-100 p-3">
                        <Zap className="text-green-600" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Escalated */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Escalated</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {analytics?.summary?.escalated || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requires human review
                        </p>
                      </div>
                      <div className="rounded-lg bg-orange-100 p-3">
                        <AlertCircle className="text-orange-600" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Avg Response Time */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Avg Response Time</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {analytics?.summary?.avgResponseTime || '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Per message
                        </p>
                      </div>
                      <div className="rounded-lg bg-purple-100 p-3">
                        <Clock className="text-purple-600" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Channel & Sentiment Breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Channel Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Messages by Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.channels ? (
                        Object.entries(analytics.channels).map(([channel, count]) => (
                          <div key={channel} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {channel === 'email' && <Mail size={18} className="text-red-600" />}
                              {channel === 'whatsapp' && <MessageCircle size={18} className="text-green-600" />}
                              <span className="capitalize text-gray-700">{channel}</span>
                            </div>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Message Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.sentiment ? (
                        Object.entries(analytics.sentiment).map(([sentiment, count]) => (
                          <div key={sentiment} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                sentiment === 'positive' ? 'bg-green-500' :
                                sentiment === 'negative' ? 'bg-red-500' :
                                'bg-gray-400'
                              }`} />
                              <span className="capitalize text-gray-700">{sentiment}</span>
                            </div>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Reminders Section */}
          {activeSection === 'reminders' && (
            <div className="space-y-6">
              {/* Create Reminder */}
              <Card>
                <CardHeader>
                  <CardTitle>⏰ Schedule a New Reminder</CardTitle>
                  <CardDescription>Set a WhatsApp reminder for your students or yourself</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateReminder} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phone (10 digits)</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={reminderForm.phone}
                        maxLength={10}
                        onChange={e => setReminderForm(f => ({ ...f, phone: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Task / Assignment</label>
                      <input
                        type="text"
                        placeholder="Submit Data Science assignment"
                        value={reminderForm.subject}
                        onChange={e => setReminderForm(f => ({ ...f, subject: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Remind At</label>
                      <input
                        type="datetime-local"
                        value={reminderForm.remindAt}
                        onChange={e => setReminderForm(f => ({ ...f, remindAt: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Button type="submit" variant="primary" disabled={reminderLoading} className="w-full gap-2">
                        {reminderLoading ? 'Scheduling...' : '⏰ Schedule Reminder'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Reminders List */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Reminders</CardTitle>
                  <CardDescription>{reminders.length} reminder(s) scheduled</CardDescription>
                </CardHeader>
                <CardContent>
                  {reminders.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <div className="text-4xl mb-3">⏰</div>
                      <p className="font-semibold">No reminders yet</p>
                      <p className="text-sm mt-1">Create one above or have your students message the WhatsApp bot</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reminders.map(r => {
                        const due = new Date(r.remindAt);
                        const isPast = due < new Date();
                        return (
                          <div key={r._id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                            r.sent ? 'border-green-200 bg-green-50' :
                            isPast ? 'border-red-200 bg-red-50' :
                            'border-slate-200 bg-white'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                r.sent ? 'bg-green-100' : isPast ? 'bg-red-100' : 'bg-blue-100'
                              }`}>
                                {r.sent ? '✅' : isPast ? '❗' : '⏳'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{r.subject}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {r.phone.replace('whatsapp:', '')} &nbsp;·&nbsp;
                                  {due.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={r.sent ? 'success' : isPast ? 'paused' : 'secondary'}>
                                {r.sent ? 'Sent' : isPast ? 'Missed' : 'Pending'}
                              </Badge>
                              {!r.sent && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteReminder(r._id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Configure your account preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
                      <h3 className="font-semibold text-blue-900 mb-2">Onboarding</h3>
                      <p className="text-sm text-blue-800 mb-4">
                        Restart the onboarding flow to reconfigure your automations and channels.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          resetOnboarding();
                          navigate('/onboarding');
                        }}
                      >
                        Restart Onboarding
                      </Button>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Danger Zone</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Reset all your configurations and start fresh.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (confirm('Are you sure? This will reset all your configurations and log you out.')) {
                            try {
                              const userId = user?._id || user?.id || user?.userId;
                              if (userId) {
                                console.log('🗑️ Deleting automation for user:', userId);
                                await deleteAutomationApi(userId);
                                console.log('✅ Automation deleted from backend');
                              }
                            } catch (err) {
                              console.error('Error deleting automation:', err);
                            }
                            
                            try {
                              await logoutApi();
                              console.log('✅ Logged out');
                            } catch (err) {
                              console.error('Logout error:', err);
                            } finally {
                              resetOnboarding();
                              navigate('/');
                            }
                          }
                        }}
                      >
                        Reset Everything
                      </Button>
                    </div>
                  </div>
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
