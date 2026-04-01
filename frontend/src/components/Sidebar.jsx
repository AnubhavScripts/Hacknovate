import { LayoutDashboard, Zap, Settings, Radio, Plug } from 'lucide-react';

const navItems = [
  { id: 'automations', label: 'Automations', icon: LayoutDashboard },
  { id: 'channels',    label: 'Channels',    icon: Plug },
  { id: 'simulate',   label: 'Simulate AI', icon: Zap },
  { id: 'settings',   label: 'Settings',    icon: Settings },
];

const Sidebar = ({ activeSection, setActiveSection }) => {
  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: '#1e1b4b',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 36 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>MerchantAI</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: active ? 600 : 400,
                background: active ? 'rgba(124,58,237,0.3)' : 'transparent',
                color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                fontFamily: 'inherit',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
