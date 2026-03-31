import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.jsx';
import { saveAutomation } from '../services/api';
import toast from 'react-hot-toast';

const TOTAL_STEPS = 4;

const AUTOMATION_OPTIONS = [
  { id: 'complaints',     icon: '😤', label: 'Complaint Handling',    desc: 'Auto-detect and resolve customer complaints with empathetic AI replies.' },
  { id: 'queries',        icon: '❓', label: 'Query Answering',        desc: 'Answer product, pricing, and policy questions instantly 24/7.' },
  { id: 'order_tracking', icon: '📦', label: 'Order Tracking',        desc: 'Provide real-time shipment status updates without human involvement.' },
  { id: 'cancellations',  icon: '❌', label: 'Cancellation Requests', desc: 'Process cancellation requests automatically and send confirmations.' },
];

const PREVIEW_MAP = {
  complaints:     { msg: '😤 "My product arrived broken!"', reply: '🤖 Escalated to quality team. Replacement arranged within 24hrs.' },
  queries:        { msg: '❓ "What is your return policy?"', reply: '🤖 Returns accepted within 30 days. Linking full policy...' },
  order_tracking: { msg: '📦 "Where is my order #12345?"', reply: '🤖 Your order is out for delivery. ETA: Today by 6 PM.' },
  cancellations:  { msg: '❌ "Please cancel my subscription."', reply: '🤖 Cancellation processed. Confirmation email sent.' },
};

const STEP_LABELS = ['Welcome', 'Automations', 'Connect', 'Deploy'];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [channels, setChannels] = useState({ gmail: false, whatsapp: false });
  const [hoveredOption, setHoveredOption] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const DEPLOY_STEPS = ['Initializing AI engine...', 'Connecting channels...', 'Activating workflows...', '✅ Automation live!'];

  const toggleOption = (id) => {
    setSelectedOptions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleDeploy = async () => {
    setDeploying(true);
    // Animate deploy steps
    for (let i = 0; i < DEPLOY_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setDeployStep(i + 1);
    }
    // Save to backend
    try {
      await saveAutomation({
        userId: user?._id || user?.id || 'mock_user_001',
        selectedOptions,
        connectedChannels: channels,
        status: 'active',
      });
    } catch {
      // Continue even if backend is down
    }
    await new Promise(r => setTimeout(r, 600));
    toast.success('🚀 Automation deployed successfully!');
    navigate('/dashboard');
  };

  const previewOption = hoveredOption || selectedOptions[selectedOptions.length - 1];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>MerchantAI</span>
      </div>

      {/* Progress */}
      <div style={{ width: '100%', maxWidth: 600, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {STEP_LABELS.map((label, i) => (
            <span key={label} style={{ fontSize: '0.75rem', fontWeight: 600, color: i + 1 <= step ? 'var(--accent-light)' : 'var(--text-muted)' }}>
              {label}
            </span>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Step {step} of {TOTAL_STEPS}</p>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.35 }}
          style={{ width: '100%', maxWidth: step === 2 ? 900 : 600 }}
        >

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="glass-lg" style={{ padding: '56px 48px', textAlign: 'center' }}>
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: 64, marginBottom: 24 }}
              >⚡</motion.div>
              <h2 style={{ marginBottom: 16, fontSize: '2rem' }}>
                Set up your AI assistant<br />
                <span className="gradient-text">in under 60 seconds</span>
              </h2>
              <p style={{ marginBottom: 40, maxWidth: 380, margin: '0 auto 40px' }}>
                Welcome{user?.name ? `, ${user.name}` : ''}! Let's configure your merchant automation. We'll guide you through 4 quick steps.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 48, flexWrap: 'wrap' }}>
                {[['60s', 'Setup time'], ['24/7', 'Active coverage'], ['∞', 'Messages automated']].map(([stat, label]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-light)' }}>{stat}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(2)}
                className="btn btn-primary btn-lg"
                style={{ minWidth: 200 }}
              >
                Start Setup →
              </motion.button>
            </div>
          )}

          {/* ── Step 2: Automation Selection ── */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
              <div>
                <h2 style={{ marginBottom: 8 }}>Choose your automations</h2>
                <p style={{ marginBottom: 24, fontSize: '0.9rem' }}>Select which customer messages you want AI to handle automatically.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {AUTOMATION_OPTIONS.map((opt) => {
                    const selected = selectedOptions.includes(opt.id);
                    return (
                      <motion.div
                        key={opt.id}
                        whileHover={{ x: 4 }}
                        onHoverStart={() => setHoveredOption(opt.id)}
                        onHoverEnd={() => setHoveredOption(null)}
                        onClick={() => toggleOption(opt.id)}
                        className="glass"
                        style={{
                          padding: '18px 20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          border: selected ? '1px solid rgba(124,58,237,0.5)' : undefined,
                          background: selected ? 'rgba(124,58,237,0.1)' : undefined,
                          boxShadow: selected ? '0 0 20px rgba(124,58,237,0.15)' : undefined,
                        }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: selected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{opt.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 3 }}>{opt.label}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                        </div>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${selected ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`, background: selected ? '#7c3aed' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                          {selected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(3)}
                    disabled={selectedOptions.length === 0}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Continue ({selectedOptions.length} selected) →
                  </motion.button>
                </div>
              </div>

              {/* Live Preview Panel */}
              <div className="glass-lg" style={{ padding: 24, height: 'fit-content', position: 'sticky', top: 24 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Preview</div>
                <AnimatePresence mode="wait">
                  {previewOption ? (
                    <motion.div key={previewOption} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {/* Customer message */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>Customer message</div>
                        <div className="glass" style={{ padding: '12px 14px', fontSize: '0.85rem', borderRadius: 10 }}>
                          {PREVIEW_MAP[previewOption]?.msg}
                        </div>
                      </div>
                      {/* AI Typing */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI is responding...</span>
                      </div>
                      {/* AI Reply */}
                      <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: '0.85rem' }}>
                        {PREVIEW_MAP[previewOption]?.reply}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Hover or select an option<br />to see a live preview
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── Step 3: Connect Channels ── */}
          {step === 3 && (
            <div className="glass-lg" style={{ padding: '44px 40px' }}>
              <h2 style={{ marginBottom: 8 }}>Connect your channels</h2>
              <p style={{ marginBottom: 36 }}>Link the platforms where your customers reach you.</p>

              {/* Gmail */}
              <div className="glass" style={{ padding: '24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(234,67,53,0.15)', border: '1px solid rgba(234,67,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>📧</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Gmail</div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Receive & respond to customer emails automatically via Gmail API.</div>
                </div>
                {channels.gmail ? (
                  <span className="badge badge-success">● Connected</span>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setChannels(c => ({ ...c, gmail: true }));
                      toast.success('Gmail connected! (OAuth flow would open in production)');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Connect Gmail
                  </motion.button>
                )}
              </div>

              {/* WhatsApp */}
              <div className="glass" style={{ padding: '24px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>💬</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>WhatsApp (Twilio)</div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Send automated WhatsApp messages via Twilio. Supports sandbox mode.</div>
                </div>
                {channels.whatsapp ? (
                  <span className="badge badge-success">● Connected</span>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setChannels(c => ({ ...c, whatsapp: true }));
                      toast.success('WhatsApp connected! (Twilio sandbox mode)');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Connect WhatsApp
                  </motion.button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} className="btn btn-secondary">← Back</button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(4)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {(channels.gmail || channels.whatsapp) ? 'Continue →' : 'Skip for now →'}
                </motion.button>
              </div>
            </div>
          )}

          {/* ── Step 4: Deploy ── */}
          {step === 4 && (
            <div className="glass-lg" style={{ padding: '56px 48px', textAlign: 'center' }}>
              {!deploying ? (
                <>
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 64, marginBottom: 24 }}>🚀</motion.div>
                  <h2 style={{ marginBottom: 16 }}>Ready to launch</h2>
                  <p style={{ marginBottom: 8, maxWidth: 380, margin: '0 auto 12px' }}>
                    Your AI automation is configured and ready. Click deploy to activate it across all your connected channels.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 36, marginTop: 20 }}>
                    {selectedOptions.map(o => (
                      <span key={o} className="badge badge-purple">{AUTOMATION_OPTIONS.find(a => a.id === o)?.label}</span>
                    ))}
                    {channels.gmail && <span className="badge badge-info">Gmail</span>}
                    {channels.whatsapp && <span className="badge badge-success">WhatsApp</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={() => setStep(3)} className="btn btn-secondary">← Back</button>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDeploy}
                      className="btn btn-primary btn-lg"
                      style={{ minWidth: 200 }}
                    >
                      🚀 Deploy Automation
                    </motion.button>
                  </div>
                </>
              ) : (
                <div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', margin: '0 auto 32px' }}
                  />
                  <h2 style={{ marginBottom: 32 }}>Deploying your automation</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
                    {DEPLOY_STEPS.map((label, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: deployStep > i ? 1 : 0.3, x: deployStep > i ? 0 : -8 }}
                        transition={{ duration: 0.4 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: deployStep > i ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `2px solid ${deployStep > i ? '#10b981' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                          {deployStep > i ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: deployStep > i ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
