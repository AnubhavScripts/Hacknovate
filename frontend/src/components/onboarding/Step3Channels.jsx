import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { useOnboardingStore } from '../../store/onboardingStore';
import { Mail, MessageCircle, Check, Loader2, AlertCircle } from 'lucide-react';

const Step3Channels = () => {
  const { connectedChannels, connectChannel, setCurrentStep, saveChannels } = useOnboardingStore();
  const [connecting, setConnecting] = useState({});
  const [error, setError] = useState(null);

  const channels = [
    {
      id: 'gmail',
      label: 'Gmail',
      icon: Mail,
      description: 'Connect your Gmail account',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      description: 'Connect via Twilio',
    },
  ];

  const handleConnect = async (channelId) => {
    setConnecting((prev) => ({ ...prev, [channelId]: true }));
    setError(null);

    try {
      if (channelId === 'gmail') {
        // Redirect to Gmail auth flow
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://hacknovate-production.up.railway.app';
        window.location.href = `${apiBase}/auth/gmail/connect`;
        return;
      } else if (channelId === 'whatsapp') {
        // Simulate WhatsApp connection
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      connectChannel(channelId);
      setConnecting((prev) => ({ ...prev, [channelId]: false }));
    } catch (err) {
      console.error(`Error connecting to ${channelId}:`, err);
      setError(`Failed to connect ${channelId}`);
      setConnecting((prev) => ({ ...prev, [channelId]: false }));
    }
  };

  const handleContinue = async () => {
    const hasAtLeastOneChannel = channels.some((ch) => connectedChannels[ch.id]);
    if (!hasAtLeastOneChannel) {
      setError('Please connect at least one channel');
      return;
    }

    // First save channels to backend
    try {
      const result = await saveChannels();
      console.log('✅ Channels saved:', result);
    } catch (err) {
      console.error('Failed to save channels:', err);
      // Still proceed to next step
    }
    
    // Then proceed to next step
    setCurrentStep(5);
  };

  const allConnected = channels.every((ch) => connectedChannels[ch.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="mx-auto max-w-2xl bg-slate-900/90 border-slate-800 backdrop-blur-xl">
        <CardHeader>
          <div className="mb-6">
            <Progress value={75} />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Connect Your Channels</CardTitle>
          <CardDescription className="text-slate-300 mt-2">
            Choose which channels to connect for automations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-600/20 border border-red-500/30 p-3 flex items-start gap-2 mb-4">
                <AlertCircle className="text-red-400 mt-0.5" size={18} />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {channels.map((channel) => {
              const Icon = channel.icon;
              const isConnected = connectedChannels[channel.id];
              const isConnecting = connecting[channel.id];

              return (
                <motion.div
                  key={channel.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`rounded-xl border-2 p-5 transition-all ${
                    isConnected 
                      ? 'border-blue-500/60 bg-gradient-to-br from-blue-600/20 to-indigo-600/20'
                      : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-lg p-3 ${ 
                          isConnected 
                            ? 'bg-blue-500/20' 
                            : 'bg-slate-700/50'
                        }`}>
                          <Icon size={24} className={isConnected ? 'text-blue-400' : 'text-gray-300'} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${isConnected ? 'text-blue-300' : 'text-white'}`}>{channel.label}</h3>
                          <p className={`text-sm ${isConnected ? 'text-blue-200/70' : 'text-gray-300'}`}>{channel.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {isConnected && (
                          <Badge variant="success" className="min-w-max">
                            <Check size={14} className="mr-1" />
                            Connected
                          </Badge>
                        )}

                        {!isConnected && (
                          <Button
                            variant={isConnecting ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleConnect(channel.id)}
                            disabled={isConnecting}
                            className="min-w-max"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 size={14} className="mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 p-4 backdrop-blur-sm">
            <p className="text-sm text-slate-300">
              <span className="text-blue-300 font-bold">ℹ️ Note:</span> You need at least one channel connected to proceed. You can add more channels later from settings.
            </p>
          </div>

          {/* Connected Summary */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-sm font-semibold text-slate-200 mb-3">Connected Channels</p>
            <div className="flex flex-wrap gap-2">
              {channels.length > 0 ? (
                channels.map((ch) => (
                  <Badge
                    key={ch.id}
                    variant={connectedChannels[ch.id] ? 'success' : 'secondary'}
                  >
                    {ch.label}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400">No channels connected</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(3)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={!channels.some((ch) => connectedChannels[ch.id])}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step3Channels;
