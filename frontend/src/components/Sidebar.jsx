import { Card, CardContent } from './ui/Card';
import { MessageSquare, Mail, Settings, Home, BarChart3 } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    {
      id: 'automations',
      label: 'My Automations',
      icon: MessageSquare,
    },
    {
      id: 'channels',
      label: 'Channels',
      icon: Mail,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6">
      {/* Logo/Branding */}
      <div className="mb-8 flex items-center gap-2">
        <div className="rounded-lg bg-blue-600 p-2">
          <MessageSquare size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Assistly</h1>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Info Card */}
      <div className="mt-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-blue-900 mb-2">💡 TIP</p>
            <p className="text-xs text-blue-800">
              Your AI assistant is now live and handling customer interactions across all connected channels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sidebar;
