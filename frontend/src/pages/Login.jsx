import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.jsx';
import toast from 'react-hot-toast';

const features = [
  { icon: '🤖', label: 'AI-Powered Responses' },
  { icon: '📧', label: 'Gmail Integration' },
  { icon: '💬', label: 'WhatsApp Messaging' },
  { icon: '📊', label: 'Real-time Analytics' },
];

export default function Login() {
  const { mockLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/google';
  };

  const handleMockLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mockLogin(name || 'Demo Merchant', email || 'demo@merchantai.app');
      toast.success('Welcome to MerchantAI!');
      navigate('/onboarding');
    } catch {
      toast.error('Login failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', width: '100%', maxWidth: 1100, gap: 60, alignItems: 'center' }}>
        {/* Left — Branding */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ flex: 1, display: 'none' }}
          className="hero-left"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
            <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>MerchantAI</span>
          </div>
          <h1 style={{ marginBottom: 20, lineHeight: 1.15 }}>
            Automate your<br />
            <span className="gradient-text">customer support</span><br />
            with AI
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: 48, maxWidth: 420 }}>
            Handle complaints, queries, order tracking, and cancellations automatically — so you can focus on what matters.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</div>
                <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-lg"
          style={{ padding: '48px 40px', width: '100%', maxWidth: 440, margin: '0 auto' }}
        >
          {/* Logo in card */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>⚡</div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Welcome back</h2>
            <p style={{ fontSize: '0.9rem' }}>Sign in to your MerchantAI account</p>
          </div>

          {/* Google OAuth */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="btn btn-secondary btn-lg"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', marginBottom: 16 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>or use demo login</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          {!showForm ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              🚀 Try Demo (No account needed)
            </motion.button>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleMockLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <input
                className="input"
                placeholder="Your name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className="input"
                type="email"
                placeholder="Your email (optional)"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ justifyContent: 'center' }}
              >
                {loading ? 'Signing in...' : '🚀 Launch Demo'}
              </motion.button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-ghost"
                style={{ justifyContent: 'center', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
            </motion.form>
          )}

          <p style={{ textAlign: 'center', fontSize: '0.78rem', marginTop: 24, color: 'var(--text-muted)' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .hero-left { display: flex !important; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
