import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.jsx';
import { analyzeMessage } from '../services/api';

const EXAMPLE_MESSAGES = [
  'My order arrived damaged. I want a refund immediately!',
  'Where is my order #78234? It was supposed to arrive yesterday.',
  "I'd like to cancel my subscription.",
  'What is your return policy for electronics?',
  'The product description said it was waterproof but it broke in the rain.',
  'How long does standard shipping take?',
];

const TYPE_CONFIG = {
  complaint:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.25)',    label: '😤 Complaint',    icon: '😤' },
  query:        { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',    border: 'rgba(6,182,212,0.25)',    label: '❓ Query',         icon: '❓' },
  order:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.25)',   label: '📦 Order Tracking', icon: '📦' },
  cancellation: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',   border: 'rgba(139,92,246,0.25)',   label: '❌ Cancellation',  icon: '❌' },
  unknown:      { color: '#64748b', bg: 'rgba(100,116,139,0.12)',  border: 'rgba(100,116,139,0.25)', label: '❔ Unknown',       icon: '❔' },
};

const PRIORITY_COLOR = { urgent: '#ef4444', high: '#f59e0b', medium: '#06b6d4', low: '#10b981' };
const SENTIMENT_EMOJI = { positive: '😊', neutral: '😐', negative: '😠' };

export default function Simulate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const textareaRef = useRef(null);
  const resultsRef = useRef(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    const userId = user?._id || user?.id || 'mock_user_001';
    try {
      const { data } = await analyzeMessage(message, userId);
      setResult(data);
      setHistory(prev => [{ message, result: data, id: Date.now() }, ...prev.slice(0, 9)]);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to backend. Make sure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const useExample = (ex) => {
    setMessage(ex);
    setResult(null);
    setError('');
    textareaRef.current?.focus();
  };

  const typeConf = result ? (TYPE_CONFIG[result.type] || TYPE_CONFIG.unknown) : null;

  return (
    <div style={{ minHeight: '100vh', maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => navigate('/dashboard')}
          className="btn btn-ghost btn-sm"
          style={{ padding: '8px 12px' }}
        >
          ← Back
        </motion.button>
        <div>
          <h2 style={{ marginBottom: 4 }}>Live AI Simulation</h2>
          <p style={{ fontSize: '0.85rem' }}>Test how the AI classifies and responds to customer messages</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24 }}>
        {/* Left */}
        <div>
          {/* Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-lg"
            style={{ padding: '28px', marginBottom: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Customer Message</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Paste or type any customer message</div>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                className="input"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. My package hasn't arrived after 2 weeks, I want a refund!"
                rows={5}
                style={{ resize: 'vertical', minHeight: 120 }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⌘+Enter to submit · {message.length} chars</span>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                      />
                      Analysing...
                    </>
                  ) : '⚡ Analyse Message'}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, fontSize: '0.87rem', color: '#f87171' }}
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result && typeConf && (
              <motion.div
                ref={resultsRef}
                key={result.type + result.reply}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="glass-lg"
                style={{ padding: '28px', borderColor: typeConf.border, background: typeConf.bg }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${typeConf.color}25`, border: `1px solid ${typeConf.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{typeConf.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: typeConf.color }}>{typeConf.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI Classification Result</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: `${PRIORITY_COLOR[result.priority]}20`, color: PRIORITY_COLOR[result.priority], border: `1px solid ${PRIORITY_COLOR[result.priority]}40` }}>
                      {result.priority?.toUpperCase()} PRIORITY
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {SENTIMENT_EMOJI[result.sentiment]} {result.sentiment}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Recommended Action</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>⚡ {result.action}</div>
                </div>

                {/* Reply */}
                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🤖</div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-light)' }}>AI GENERATED REPLY</span>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{result.reply}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — Examples + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Examples */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass"
            style={{ padding: '20px' }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Try Examples</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXAMPLE_MESSAGES.map((ex, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => useExample(ex)}
                  style={{
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    transition: 'all 0.15s',
                  }}
                >
                  "{ex.slice(0, 60)}{ex.length > 60 ? '…' : ''}"
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* History */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass"
              style={{ padding: '20px' }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Session History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h) => {
                  const c = TYPE_CONFIG[h.result.type] || TYPE_CONFIG.unknown;
                  return (
                    <div
                      key={h.id}
                      onClick={() => { setMessage(h.message); setResult(h.result); }}
                      style={{ cursor: 'pointer', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12 }}>{c.icon}</span>
                        <span style={{ fontSize: '0.72rem', color: c.color, fontWeight: 600, textTransform: 'capitalize' }}>{h.result.type}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.message}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
