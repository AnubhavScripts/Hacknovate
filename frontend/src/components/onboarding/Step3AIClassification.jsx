import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Checkbox } from '../ui/Checkbox';
import { useOnboardingStore } from '../../store/onboardingStore';
import { Flame, Snowflake, Zap } from 'lucide-react';

const Step3AIClassification = () => {
  const {
    setCurrentStep,
    aiClassification,
    updateAIClassification,
  } = useOnboardingStore();

  const classificationOptions = [
    {
      id: 'hot',
      title: 'Hot Queries',
      icon: Flame,
      iconBg: 'from-red-100 to-orange-100',
      borderColor: 'border-red-200',
      description: 'Urgent & Time-Sensitive',
      examples: [
        '🚨 Emergency requests',
        '⏰ Time-sensitive issues',
        '💰 High-value transactions',
        '📞 VIP customer concerns',
      ],
      config: {
        priority: 'high',
        routing: 'immediate',
        escalation: 'auto',
        response_time: 'within 5 minutes',
      },
    },
    {
      id: 'cold',
      title: 'Cold Queries',
      icon: Snowflake,
      iconBg: 'from-blue-100 to-cyan-100',
      borderColor: 'border-blue-200',
      description: 'Standard & Non-Urgent',
      examples: [
        '❓ General inquiries',
        '📚 Information requests',
        '📋 Form submissions',
        '🔍 Research questions',
      ],
      config: {
        priority: 'normal',
        routing: 'queue',
        escalation: 'manual',
        response_time: 'within 24 hours',
      },
    },
  ];

  const handleContinue = () => {
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <div className="mb-4">
            <Progress value={50} />
          </div>
          <div className="flex items-center gap-2">
            <Zap className="text-purple-600" size={28} />
            <div>
              <CardTitle className="text-3xl">AI Query Classification</CardTitle>
              <CardDescription className="mt-2 text-base">
                Configure how your AI assistant will classify and prioritize incoming requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Classification Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classificationOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.div
                    key={option.id}
                    whileHover={{ y: -4 }}
                    className={`p-6 rounded-lg border-2 transition-all ${option.borderColor} bg-gradient-to-br ${option.iconBg}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-white/50 backdrop-blur">
                          <Icon size={24} className="text-gray-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{option.title}</h3>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Examples */}
                    <div className="mb-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Examples</p>
                      {option.examples.map((example, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span className="text-sm text-gray-700">{example}</span>
                        </div>
                      ))}
                    </div>

                    {/* Configuration Details */}
                    <div className="pt-4 border-t border-gray-300/50">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Configuration</p>
                      <div className="space-y-1 text-xs text-gray-700">
                        <div className="flex justify-between">
                          <span>Priority:</span>
                          <span className="font-medium capitalize">{option.config.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Routing:</span>
                          <span className="font-medium capitalize">{option.config.routing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Escalation:</span>
                          <span className="font-medium capitalize">{option.config.escalation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Response Time:</span>
                          <span className="font-medium">{option.config.response_time}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* AI Classification Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={aiClassification.enabled}
                  onChange={(checked) => updateAIClassification({ enabled: checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Enable AI Classification</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically classify incoming queries as hot (urgent) or cold (standard) based on content, sender, and context. This helps prioritize responses and route to appropriate teams.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 How it works</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>AI analyzes message content, urgency markers, and customer history</li>
                <li>Hot queries are routed immediately for quick response</li>
                <li>Cold queries are queued for batch processing</li>
                <li>Escalation settings automatically move issues up when needed</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step3AIClassification;
