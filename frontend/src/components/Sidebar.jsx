import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { MessageSquare, Mail, Settings, BarChart3, ChevronLeft, ChevronRight, Zap, Activity } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'automations',
      label: 'Automations',
      icon: MessageSquare,
      description: 'Manage workflows',
    },
    {
      id: 'channels',
      label: 'Channels',
      icon: Mail,
      description: 'Connected platforms',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Insights & metrics',
    },
    {
      id: 'logs',
      label: 'Activity',
      icon: Activity,
      description: 'Message logs',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Configuration',
    },
  ];

  return (
    <>
      {/* Fixed Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/50 backdrop-blur-xl flex flex-col transition-all duration-300 ease-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
        
        {/* Header */}
        <div className="px-4 py-6 border-b border-slate-800/50 flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-2.5 shadow-lg flex-shrink-0 hover:shadow-blue-500/50 transition-shadow">
                <Zap size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg text-blue-200 font-semibold text-white tracking-tight truncate">Assistly</h1>
                <p className="text-xs text-slate-400">AI Assistant</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 group/item relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/90 to-blue-500/90 text-white shadow-lg shadow-blue-600/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-transparent to-transparent opacity-20 animate-pulse" />
                )}
                <Icon size={20} className="flex-shrink-0 relative z-10" />
                {!isCollapsed && (
                  <div className="text-left flex-1 min-w-0 relative z-10">
                    <p className="font-semibold text-sm text-white truncate">{item.label}</p>
                    <p className="text-xs text-slate-300 group-hover/item:text-slate-100 truncate">{item.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer - User Profile */}
        {!isCollapsed && user && (
          <div className="p-4 border-t border-slate-800/50 flex-shrink-0">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-850/50 border border-slate-700/50 rounded-xl p-3.5 backdrop-blur-sm hover:border-slate-600/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white font-bold text-sm">{user.email?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">Profile</p>
                  <p className="text-xs text-blue-200 truncate">{user.email || 'No email'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacing div to prevent content overlap */}
      <div className={`transition-all duration-300 ease-out ${isCollapsed ? 'w-20' : 'w-72'} flex-shrink-0`} />
    </>
  );
};

export default Sidebar;
