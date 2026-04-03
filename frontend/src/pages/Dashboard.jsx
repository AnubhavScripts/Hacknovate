import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import Sidebar from '../components/Sidebar';
import { useOnboardingStore } from '../store/onboardingStore';
import { useUser } from '../context/UserContext';
import { MessageSquare, Mail, MessageCircle, Settings, LogOut, AlertCircle, BarChart3, Send, Zap, Clock, Pause, Trash2 } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your AI assistant and automations</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </div>

          {/* Automations Section */}
          {activeSection === 'automations' && (
            <div className="space-y-6">
              {successMessage && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">Success</h3>
                        <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <h3 className="font-semibold text-red-900">Error Loading Data</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>My Automations</CardTitle>
                  <CardDescription>
                    Currently active automations in your AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-600">Loading automations...</div>
                    </div>
                  ) : automations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {automations.map((automation) => {
                        // Handle Automation document from backend
                        const selectedOptions = automation?.selectedOptions || [];
                        
                        return (
                          <div
                            key={automation._id}
                            className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {automation.name || 'Automation'}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                  Active flows:
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {selectedOptions.length > 0 ? (
                                    selectedOptions.map((option) => (
                                      <Badge key={option} variant="secondary" className="text-xs">
                                        {automationLabels[option] || option}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-500">No automations selected</span>
                                  )}
                                </div>
                              </div>
                              <Badge variant={automation.status === 'active' ? 'success' : automation.status === 'paused' ? 'warning' : 'secondary'}>
                                {automation.status === 'active' ? 'Active' : automation.status === 'paused' ? 'Paused' : automation.status}
                              </Badge>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4">
                              {automation.status === 'active' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePauseAutomation(automation._id)}
                                  disabled={actionLoading === `pause-${automation._id}`}
                                  className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                                >
                                  <Pause size={16} />
                                  {actionLoading === `pause-${automation._id}` ? 'Pausing...' : 'Pause'}
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAutomation(automation._id, automation.userId)}
                                disabled={actionLoading === `delete-${automation._id}`}
                                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                {actionLoading === `delete-${automation._id}` ? 'Deleting...' : 'Delete'}
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
                    <div className="rounded-lg bg-gray-50 p-8 text-center">
                      <p className="text-gray-600">No automations selected yet</p>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate('/onboarding')}
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
