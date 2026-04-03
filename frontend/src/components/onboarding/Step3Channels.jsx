import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { useOnboardingStore } from '../../store/onboardingStore';
import { Mail, MessageCircle, Check, Loader2, AlertCircle } from 'lucide-react';

const channels = [
  {
    id: 'gmail',
    label: 'Gmail',
    icon: Mail,
    description: 'Send automated replies directly from your Gmail inbox',
    iconBg: '#f1f5f9',
    iconColor: '#475569',
    brand: '#EA4335',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    description: 'Respond to customers via WhatsApp using Twilio',
    iconBg: '#f1f5f9',
    iconColor: '#475569',
    brand: '#25D366',
  },
];

const Step3Channels = () => {
  const { connectedChannels, connectChannel, setCurrentStep } = useOnboardingStore();
  const [connecting, setConnecting] = useState({});
  const [gmailError, setGmailError] = useState(null);
  const location = useLocation();

  // Green color for successful connections
  const successColor = '#10b981';

  // Show error banner if OAuth returned ?gmail=error
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('gmail') === 'error') {
      const reason = params.get('reason') ? decodeURIComponent(params.get('reason')) : null;
      setGmailError(reason || 'OAuth failed');
      // Auto-dismiss after 10s
      const t = setTimeout(() => setGmailError(null), 10000);
      return () => clearTimeout(t);
    }
  }, [location.search]);

  const handleConnect = async (channelId) => {
    if (channelId === 'gmail') {
      window.location.href = 'http://localhost:8000/auth/gmail/connect';
      return;
    }
    setConnecting((prev) => ({ ...prev, [channelId]: true }));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    connectChannel(channelId);
    setConnecting((prev) => ({ ...prev, [channelId]: false }));
  };

  const anyConnected = channels.some((ch) => connectedChannels[ch.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="mb-4">
            <Progress value={75} />
          </div>
          <CardTitle>Connect Your Channels</CardTitle>
          <CardDescription>
            Choose which channels to connect for automated responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isConnected = connectedChannels[channel.id];
              const isConnecting = connecting[channel.id];

              return (
                <motion.div key={channel.id} whileHover={{ scale: 1.005 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 12,
                    border: isConnected
                      ? `1.5px solid ${successColor}40`
                      : '1.5px solid #e2e8f0',
                    background: isConnected
                      ? `${successColor}08`
                      : '#fff',
                    transition: 'all 0.2s ease',
                  }}>
                    {/* Left — icon + text */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: isConnected ? `${successColor}15` : '#f8fafc',
                        border: `1px solid ${isConnected ? successColor + '30' : '#e2e8f0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={20} style={{ color: isConnected ? successColor : '#64748b' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>
                          {channel.label}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, marginTop: 2 }}>
                          {channel.description}
                        </p>
                      </div>
                    </div>

                    {/* Right — status / button */}
                    <div style={{ flexShrink: 0, marginLeft: 12 }}>
                      {isConnected ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 99,
                          background: `${successColor}15`,
                          border: `1px solid ${successColor}40`,
                          color: successColor,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}>
                          <Check size={13} />
                          Connected
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(channel.id)}
                          disabled={isConnecting}
                          style={{ minWidth: 100 }}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 size={13} className="mr-1 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Gmail error banner */}
          {gmailError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: 10,
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                marginBottom: 12,
                fontSize: '0.83rem',
                color: '#be123c',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <strong>Gmail connection failed.</strong>
              </div>
              {gmailError !== 'OAuth failed' && (
                <div style={{
                  padding: '0 16px 12px 16px',
                  fontFamily: 'monospace',
                  fontSize: '0.76rem',
                  background: '#ffe4e6',
                  color: '#9f1239',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                }}>
                  {gmailError}
                </div>
              )}
              <div style={{ padding: '8px 16px 12px', fontSize: '0.79rem' }}>
                Check your backend terminal logs for the full error, then follow the steps below.
              </div>
            </motion.div>
          )}

          {/* Note */}
          <div style={{
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '0.82rem',
            color: '#64748b',
          }}>
            ℹ️ Connect at least one channel to proceed. You can add more later from Settings.
          </div>

          {/* Connected summary */}
          {anyConnected && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active:</span>
              {channels.filter(ch => connectedChannels[ch.id]).map(ch => (
                <span key={ch.id} style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: `${ch.brand}12`,
                  border: `1px solid ${ch.brand}30`,
                  color: ch.brand,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}>
                  {ch.label}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 flex gap-3 justify-end max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
        <Button
          variant="primary"
          onClick={() => setCurrentStep(4)}
          disabled={!anyConnected}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

export default Step3Channels;
