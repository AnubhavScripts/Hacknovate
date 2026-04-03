import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * AIFlowSimulation - Visual representation of the automation flow
 * Shows: Input → Classification → Rules → Action (Escalate vs Auto-Reply)
 */
const AIFlowSimulation = ({ classificationData, action, isEscalated }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!classificationData) {
    return (
      <div className="text-center py-8 text-gray-500">
        Send a message to see the AI flow visualization
      </div>
    );
  }

  const { type, sentiment, priority, reply } = classificationData;
  const steps = [
    {
      title: '1️⃣ Input',
      description: 'Customer Message',
      status: 'complete',
      detail: 'Message received and validated',
    },
    {
      title: '2️⃣ AI Classification',
      description: 'Analyze & Classify',
      status: 'complete',
      data: { Type: type, Sentiment: sentiment, Priority: priority },
    },
    {
      title: '3️⃣ Rule Engine',
      description: 'Check Business Rules',
      status: 'complete',
      detail: `Rule matched: ${isEscalated ? 'Escalation Required' : 'Auto-Reply Enabled'}`,
    },
    {
      title: isEscalated ? '4️⃣ 🚨 ESCALATE' : '4️⃣ 💬 AUTO-REPLY',
      description: isEscalated ? 'Route to Human' : 'Send Automated Response',
      status: 'decision',
      decision: isEscalated ? 'escalate' : 'reply',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔄 Automation Flow Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Flow Diagram */}
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx}>
              {/* Step Card */}
              <div
                className={`rounded-lg p-4 transition-all ${
                  step.status === 'complete'
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : step.decision === 'escalate'
                    ? 'bg-red-50 border-l-4 border-red-500'
                    : 'bg-blue-50 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                    {step.data && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {Object.entries(step.data).map(([key, value]) => (
                          <Badge
                            key={key}
                            variant={
                              key === 'Type'
                                ? 'info'
                                : key === 'Sentiment'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {key}: {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {step.detail && (
                      <p className="mt-2 text-sm text-gray-700">✓ {step.detail}</p>
                    )}
                  </div>

                  {step.status === 'complete' && (
                    <CheckCircle2 className="text-green-600 ml-4 flex-shrink-0" size={24} />
                  )}
                  {step.status === 'decision' && (
                    <AlertCircle
                      className={`ml-4 flex-shrink-0 ${
                        step.decision === 'escalate'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                      size={24}
                    />
                  )}
                </div>
              </div>

              {/* Arrow between steps */}
              {idx < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="text-gray-400 transform rotate-90" size={20} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final Action */}
        <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <h3 className="text-lg font-bold mb-3">📋 Final Decision</h3>
          {isEscalated ? (
            <div>
              <p className="text-sm mb-3">
                This message requires human attention and has been added to the escalation queue.
              </p>
              <div className="bg-white/20 rounded p-3 text-sm">
                <strong>Reason:</strong> {action || 'High-priority or urgent message classified'}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3">
                This message has been processed and an automated reply has been sent.
              </p>
              <div className="bg-white/20 rounded p-3 text-sm max-h-24 overflow-y-auto">
                <strong>AI Reply:</strong> {reply || 'Thank you for reaching out!'}
              </div>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm"
          >
            {showDetails ? '▼ Hide Technical Details' : '▶ Show Technical Details'}
          </Button>

          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm font-mono text-gray-700">
              <p>
                <strong>Classification:</strong>
              </p>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs">
                {JSON.stringify(
                  {
                    type,
                    sentiment,
                    priority,
                    action: isEscalated ? 'escalate' : 'auto_reply',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIFlowSimulation;
