import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
// ─── SVG Illustrations ───────────────────────────────────────────────────────
const DashboardIllustration = () => (
  <svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f0f4ff" />
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#2563EB" floodOpacity="0.12" />
      </filter>
      <filter id="cardShadow" x="-5%" y="-5%" width="115%" height="125%">
        <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#1e3a8a" floodOpacity="0.08" />
      </filter>
    </defs>
    {/* Main card */}
    <rect x="20" y="20" width="440" height="280" rx="16" fill="url(#cardGrad)" filter="url(#softShadow)" />
    {/* Top bar */}
    <rect x="20" y="20" width="440" height="44" rx="16" fill="#1d4ed8" />
    <rect x="20" y="48" width="440" height="16" rx="0" fill="#1d4ed8" />
    <circle cx="44" cy="42" r="6" fill="#60a5fa" opacity="0.7" />
    <circle cx="62" cy="42" r="6" fill="#93c5fd" opacity="0.5" />
    <circle cx="80" cy="42" r="6" fill="#bfdbfe" opacity="0.4" />
    <text x="110" y="47" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="white" opacity="0.9">Assistly Dashboard</text>
    {/* Stat cards */}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={36 + i * 148} y="84" width="128" height="64" rx="10" fill="white" filter="url(#cardShadow)" />
        <text x={60 + i * 148} y="108" fontFamily="'DM Sans', sans-serif" fontSize="9" fill="#94a3b8">{["Tickets Resolved","Avg. Response","CSAT Score"][i]}</text>
        <text x={60 + i * 148} y="130" fontFamily="'DM Sans', sans-serif" fontSize="20" fontWeight="700" fill="#1e40af">{["1,284","1.4m","98%"][i]}</text>
        <rect x={36 + i * 148} y="138" width={[80, 55, 62][i]} height="4" rx="2" fill={["#3b82f6","#10b981","#f59e0b"][i]} opacity="0.6" />
      </g>
    ))}
    {/* Chart */}
    <rect x="36" y="166" width="260" height="112" rx="10" fill="white" filter="url(#cardShadow)" />
    <text x="52" y="186" fontFamily="'DM Sans', sans-serif" fontSize="9" fontWeight="600" fill="#64748b">Weekly Tickets</text>
    {[0,1,2,3,4,5,6].map((i) => {
      const h = [42,58,38,72,50,66,44][i];
      return (
        <rect key={i} x={56 + i * 33} y={258 - h} width="18" height={h} rx="4"
          fill={i === 3 ? "#2563EB" : "#bfdbfe"} />
      );
    })}
    {/* Chat panel */}
    <rect x="312" y="166" width="148" height="112" rx="10" fill="white" filter="url(#cardShadow)" />
    <text x="326" y="186" fontFamily="'DM Sans', sans-serif" fontSize="9" fontWeight="600" fill="#64748b">Recent Queries</text>
    {[
      { y: 202, w: 90, c: "#dbeafe" },
      { y: 220, w: 70, c: "#dcfce7" },
      { y: 238, w: 100, c: "#dbeafe" },
      { y: 256, w: 60, c: "#dcfce7" },
    ].map((r, i) => (
      <g key={i}>
        <circle cx="332" cy={r.y + 4} r="4" fill={i % 2 === 0 ? "#93c5fd" : "#86efac"} />
        <rect x="342" cy={r.y} y={r.y} width={r.w} height="8" rx="4" fill={r.c} />
      </g>
    ))}
  </svg>
);

const FullDashboardPreview = () => (
  <svg viewBox="0 0 860 460" xmlns="http://www.w3.org/2000/svg" className="w-full">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#eff6ff" />
        <stop offset="100%" stopColor="#dbeafe" />
      </linearGradient>
      <filter id="s1"><feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#2563EB" floodOpacity="0.1" /></filter>
      <filter id="s2"><feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#1e3a8a" floodOpacity="0.07" /></filter>
    </defs>
    <rect width="860" height="460" rx="20" fill="url(#bgGrad)" />
    {/* Sidebar */}
    <rect x="0" y="0" width="180" height="460" rx="20" fill="#1e3a8a" />
    <rect x="180" y="0" width="10" height="460" fill="#1e40af" opacity="0.3"/>
    <text x="24" y="46" fontFamily="'DM Sans', sans-serif" fontSize="16" fontWeight="800" fill="white">Assistly</text>
    {["Dashboard","Inbox","Automations","Analytics","Settings"].map((item, i) => (
      <g key={i}>
        <rect x="12" y={80 + i * 46} width="156" height="34" rx="8"
          fill={i === 0 ? "#2563EB" : "transparent"} opacity={i === 0 ? 1 : 0.5} />
        <text x="30" y={102 + i * 46} fontFamily="'DM Sans', sans-serif" fontSize="11"
          fill={i === 0 ? "white" : "#93c5fd"}>{item}</text>
      </g>
    ))}
    {/* Header */}
    <rect x="190" y="10" width="660" height="48" rx="10" fill="white" filter="url(#s2)" />
    <text x="210" y="40" fontFamily="'DM Sans', sans-serif" fontSize="13" fontWeight="600" fill="#1e3a8a">Good morning, Anushka 👋</text>
    <rect x="720" y="22" width="100" height="24" rx="6" fill="#2563EB" />
    <text x="742" y="38" fontFamily="'DM Sans', sans-serif" fontSize="10" fill="white">+ New Rule</text>
    {/* Stat cards */}
    {[
      { label: "Open Tickets", val: "142", color: "#eff6ff", accent: "#2563EB" },
      { label: "Resolved Today", val: "89", color: "#f0fdf4", accent: "#16a34a" },
      { label: "Avg. Response", val: "1.2m", color: "#fff7ed", accent: "#ea580c" },
      { label: "CSAT Score", val: "97%", color: "#fdf4ff", accent: "#9333ea" },
    ].map((s, i) => (
      <g key={i}>
        <rect x={200 + i * 158} y="76" width="144" height="80" rx="12" fill={s.color} filter="url(#s2)" />
        <text x={220 + i * 158} y="104" fontFamily="'DM Sans', sans-serif" fontSize="9" fill="#64748b">{s.label}</text>
        <text x={220 + i * 158} y="132" fontFamily="'DM Sans', sans-serif" fontSize="24" fontWeight="700" fill={s.accent}>{s.val}</text>
      </g>
    ))}
    {/* Chart */}
    <rect x="200" y="172" width="395" height="178" rx="12" fill="white" filter="url(#s2)" />
    <text x="220" y="196" fontFamily="'DM Sans', sans-serif" fontSize="11" fontWeight="700" fill="#1e3a8a">Ticket Volume (7-day)</text>
    {[42, 65, 38, 80, 55, 72, 60].map((h, i) => (
      <g key={i}>
        <rect x={226 + i * 48} y={318 - h} width="30" height={h} rx="6"
          fill={i === 3 ? "#2563EB" : "#bfdbfe"} />
        <text x={231 + i * 48} y="335" fontFamily="'DM Sans', sans-serif" fontSize="8" fill="#94a3b8">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}
        </text>
      </g>
    ))}
    {/* Activity Feed */}
    <rect x="607" y="172" width="243" height="268" rx="12" fill="white" filter="url(#s2)" />
    <text x="625" y="197" fontFamily="'DM Sans', sans-serif" fontSize="11" fontWeight="700" fill="#1e3a8a">Live Activity</text>
    {[
      { msg: "Auto-replied to Riya M.", tag: "AI", tc: "#2563EB", bc: "#dbeafe" },
      { msg: "Ticket #2048 escalated", tag: "Alert", tc: "#dc2626", bc: "#fee2e2" },
      { msg: "New workflow triggered", tag: "Flow", tc: "#16a34a", bc: "#dcfce7" },
      { msg: "CSAT survey sent (x12)", tag: "Auto", tc: "#9333ea", bc: "#fae8ff" },
      { msg: "SLA breach prevented", tag: "SLA", tc: "#ea580c", bc: "#ffedd5" },
    ].map((a, i) => (
      <g key={i}>
        <rect x="615" y={212 + i * 44} width="227" height="34" rx="8" fill="#f8fafc" />
        <text x="628" y={233 + i * 44} fontFamily="'DM Sans', sans-serif" fontSize="9" fill="#374151">{a.msg}</text>
        <rect x="780" y={216 + i * 44} width="36" height="16" rx="4" fill={a.bc} />
        <text x="787" y={228 + i * 44} fontFamily="'DM Sans', sans-serif" fontSize="7.5" fill={a.tc} fontWeight="700">{a.tag}</text>
      </g>
    ))}
    {/* Automation card */}
    <rect x="200" y="362" width="395" height="78" rx="12" fill="white" filter="url(#s2)" />
    <text x="220" y="386" fontFamily="'DM Sans', sans-serif" fontSize="11" fontWeight="700" fill="#1e3a8a">Active Automations</text>
    {["Billing FAQ Auto-Reply","Refund Routing Flow","Escalation Handler"].map((name, i) => (
      <g key={i}>
        <rect x={220 + i * 128} y="396" width="116" height="30" rx="6" fill="#eff6ff" />
        <circle cx={234 + i * 128} cy={411} r="3" fill="#22c55e" />
        <circle cx={234 + i * 128} cy="411" r="3" fill="#22c55e" />
        <text x={244 + i * 128} y="415" fontFamily="'DM Sans', sans-serif" fontSize="8" fill="#1e40af">{name}</text>
      </g>
    ))}
  </svg>
);

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  Channels: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Automation: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  AI: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  Sparkle: () => (
    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/95 backdrop-blur-md shadow-md shadow-blue-100/60 py-3" : "bg-white/80 backdrop-blur-sm py-4"
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Assistly</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How it Works", "Pricing"].map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer">
              {link}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-blue-50">
            Login
          </button>
          <button onClick={() => navigate("/signup")}
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 hover:-translate-y-0.5">
            Get Started
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
          {["Features", "How it Works", "Pricing"].map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="block text-sm font-medium text-slate-700 py-2">
              {link}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => navigate("/login")}
              className="flex-1 text-sm font-medium border border-slate-200 text-slate-700 py-2.5 rounded-xl">
              Login
            </button>
            <button onClick={() => navigate("/signup")}
              className="flex-1 text-sm font-semibold text-white bg-blue-600 py-2.5 rounded-xl">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 pt-20">
      {/* Decorative background blobs */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-72 h-72 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-56 h-56 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
            <Icons.Sparkle />
            Powered by AI — No coding required
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Automate Your{" "}
            <span className="relative">
              <span className="text-blue-600">Customer</span>
            </span>{" "}
            Support{" "}
            <span className="text-blue-600">in Minutes</span>
          </h1>

          <p className="text-lg text-slate-500 leading-relaxed max-w-lg font-light">
            Connect all your support channels, automate responses, and save hours every day —
            no coding required. Built for modern support teams.
          </p>

          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate("/signup")}
              className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-2xl shadow-lg shadow-blue-300/50 hover:shadow-blue-400/60 transition-all duration-200 hover:-translate-y-0.5 text-sm">
              Get Started Free
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-7 py-3.5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-sm">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              See a demo
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400 pt-2">
            {["Free 14-day trial", "No credit card", "Setup in 5 min"].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Dashboard illustration */}
        <div className="relative">
          <div className="relative bg-white rounded-3xl shadow-2xl shadow-blue-200/50 border border-blue-100/60 overflow-hidden p-4">
            <DashboardIllustration />
          </div>
          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">1,284 tickets resolved today</span>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 px-4 py-2.5">
            <div className="text-xs text-slate-500 font-medium">AI Response Rate</div>
            <div className="text-lg font-bold text-blue-600">94.7%</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: <Icons.Channels />,
    title: "Multi-channel Support",
    desc: "Unify WhatsApp, Email, Live Chat, and more into a single, powerful inbox. Respond everywhere without switching tabs.",
    color: "from-blue-50 to-indigo-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: <Icons.Automation />,
    title: "Automation Builder",
    desc: "Drag-and-drop workflows that handle repetitive tasks automatically. Build powerful automations without writing a single line of code.",
    color: "from-violet-50 to-purple-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    icon: <Icons.AI />,
    title: "AI-powered Responses",
    desc: "Smart reply suggestions trained on your knowledge base. Our AI understands context and generates human-like responses instantly.",
    color: "from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: <Icons.Analytics />,
    title: "Analytics Dashboard",
    desc: "Real-time insights into ticket volume, response times, CSAT scores, and team performance — all in one glanceable dashboard.",
    color: "from-orange-50 to-amber-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

function Features() {
  return (
    <section id="features" className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block text-blue-600 text-sm font-semibold uppercase tracking-widest">Features</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Everything your support team needs
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-light">
            One platform to manage, automate, and optimize your entire customer support operation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i}
              className={`group relative bg-gradient-to-br ${f.color} rounded-3xl p-8 border border-white/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1.5 cursor-default overflow-hidden`}>
              {/* Subtle decorative circle */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/40 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <div className={`inline-flex p-3 rounded-2xl ${f.iconBg} ${f.iconColor} mb-5 shadow-sm`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2.5">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
              <div className={`mt-5 inline-flex items-center text-sm font-semibold ${f.iconColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                Learn more <Icons.ArrowRight />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const steps = [
  {
    num: "01",
    title: "Connect your support channels",
    desc: "Plug in WhatsApp, Gmail, Intercom, Zendesk, or any other support tool in seconds using our one-click integrations.",
    icon: "🔌",
  },
  {
    num: "02",
    title: "Build automation workflows",
    desc: "Use our visual builder to create rules, triggers, and flows. Set conditions, auto-replies, and escalation paths visually.",
    icon: "⚙️",
  },
  {
    num: "03",
    title: "Let Assistly handle the rest",
    desc: "Watch your ticket queue shrink. Assistly resolves routine queries automatically while your team focuses on complex issues.",
    icon: "🚀",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block text-blue-600 text-sm font-semibold uppercase tracking-widest">Process</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Up and running in 3 steps
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto font-light">
            No engineers needed. No weeks of setup. Go from zero to automated in under an hour.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" style={{ left: "20%", right: "20%" }} />

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              {/* Step circle */}
              <div className="relative z-10 w-28 h-28 bg-white rounded-3xl shadow-lg shadow-blue-100/70 border border-blue-100/80 flex flex-col items-center justify-center mb-6 group-hover:shadow-xl group-hover:shadow-blue-200/60 group-hover:-translate-y-1 transition-all duration-300">
                <div className="text-3xl mb-0.5">{step.icon}</div>
                <span className="text-xs font-bold text-blue-400 tracking-wider">{step.num}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Preview ──────────────────────────────────────────────────────────
function ProductPreview() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <span className="inline-block text-blue-600 text-sm font-semibold uppercase tracking-widest">Product</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            A workspace built for speed
          </h2>
          <p className="text-slate-500 text-lg font-light max-w-lg mx-auto">
            Clean, fast, and built for support teams that move quickly.
          </p>
        </div>

        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100/40 to-indigo-100/30 rounded-3xl blur-2xl scale-95 -z-10" />
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-4 shadow-2xl shadow-blue-900/30 border border-white/10">
            {/* Window chrome */}
            <div className="flex items-center gap-2 pb-3 px-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <div className="flex-1 mx-4 bg-white/10 rounded-md h-5 flex items-center px-3">
                <span className="text-white/40 text-xs">app.assistly.io/dashboard</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <FullDashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Priya Sharma",
    role: "Head of Support, Razorpay",
    avatar: "PS",
    text: "Assistly cut our first-response time from 4 hours to under 3 minutes. The AI handles 70% of tickets automatically.",
    stars: 5,
  },
  {
    name: "Marcus Webb",
    role: "CX Lead, Notion",
    avatar: "MW",
    text: "The automation builder is genuinely intuitive. We built our entire triage workflow in an afternoon without touching any code.",
    stars: 5,
  },
  {
    name: "Aisha Patel",
    role: "Support Ops, Figma",
    avatar: "AP",
    text: "CSAT went from 82% to 97% within the first month. Our team actually enjoys their jobs now — that says everything.",
    stars: 5,
  },
];

function Testimonials() {
  return (
    <section className="py-28 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block text-blue-600 text-sm font-semibold uppercase tracking-widest">Testimonials</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Loved by support teams</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex gap-1 mb-5">
                {Array(t.stars).fill(0).map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed text-sm mb-6 font-light">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    desc: "Perfect for small teams just getting started.",
    features: ["Up to 3 agents", "1,000 tickets/mo", "Email & chat channels", "Basic automations", "Standard support"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$79",
    period: "/mo",
    desc: "For growing teams that need more power.",
    features: ["Up to 15 agents", "10,000 tickets/mo", "All channels", "AI-powered replies", "Custom workflows", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Tailored for large-scale support operations.",
    features: ["Unlimited agents", "Unlimited tickets", "Dedicated infrastructure", "SLA guarantees", "SSO & SAML", "24/7 support"],
    cta: "Contact Sales",
    highlight: false,
  },
];

function Pricing() {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block text-blue-600 text-sm font-semibold uppercase tracking-widest">Pricing</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-slate-500 text-lg font-light">No hidden fees. No surprises. Scale as you grow.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => (
            <div key={i} className={`relative rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
              plan.highlight
                ? "bg-blue-600 border-blue-500 shadow-2xl shadow-blue-300/50 scale-105"
                : "bg-white border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/60"
            }`}>
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
              )}
              <div className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-blue-200" : "text-blue-600"}`}>{plan.name}</div>
              <div className="flex items-end gap-1 mb-2">
                <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                <span className={`text-sm mb-1.5 ${plan.highlight ? "text-blue-200" : "text-slate-400"}`}>{plan.period}</span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? "text-blue-200" : "text-slate-500"}`}>{plan.desc}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm">
                    <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-emerald-500"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={plan.highlight ? "text-blue-100" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/signup")}
                className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg shadow-blue-800/20"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────
function CTA() {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative bg-blue-600 rounded-3xl px-10 py-16 text-center overflow-hidden shadow-2xl shadow-blue-300/40">
          {/* Decorative orbs */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Start automating your<br />support today
            </h2>
            <p className="text-blue-200 text-lg mb-10 font-light max-w-xl mx-auto">
              Join 2,400+ support teams that have cut response times by 80% with Assistly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => navigate("/signup")}
                className="bg-white text-blue-600 font-semibold px-8 py-3.5 rounded-2xl hover:bg-blue-50 shadow-xl shadow-blue-800/20 transition-all duration-200 hover:-translate-y-0.5 text-sm">
                Get Started Free — No credit card
              </button>
              <button onClick={() => navigate("/login")}
                className="bg-blue-500/50 border border-blue-400/60 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-blue-500/80 transition-all duration-200 hover:-translate-y-0.5 text-sm">
                Schedule a demo
              </button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
              {["14-day free trial", "Cancel anytime", "SOC 2 Type II certified"].map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">Assistly</span>
            </div>
            <p className="text-sm leading-relaxed">Automate your customer support. Save hours every day.</p>
            <div className="flex gap-3">
              {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                <div key={s} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200">
                  <span className="text-xs text-slate-400">{s[0]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Links */}
          {[
            { title: "Product", links: ["Features", "How it Works", "Pricing", "Changelog"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
            { title: "Support", links: ["Documentation", "API Reference", "Status", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition-colors duration-200">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <span>© 2025 Assistly, Inc. All rights reserved.</span>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "Cookies"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors duration-200">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page (main) ──────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="font-sans antialiased" style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
      `}</style>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ProductPreview />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}


