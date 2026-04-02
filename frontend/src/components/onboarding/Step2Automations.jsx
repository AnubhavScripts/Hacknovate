import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { useOnboardingStore } from '../../store/onboardingStore';
import { MessageSquare, Package, FileText, XCircle } from 'lucide-react';

const automationOptions = [
  {
    id: 'complaint_handling',
    label: 'Complaint Handling',
    description: 'Auto-respond to customer complaints',
    icon: MessageSquare,
  },
  {
    id: 'query_answering',
    label: 'Query Answering',
    description: 'Answer common customer questions',
    icon: FileText,
  },
  {
    id: 'order_tracking',
    label: 'Order Tracking',
    description: 'Provide real-time order updates',
    icon: Package,
  },
  {
    id: 'cancellation_requests',
    label: 'Cancellation Requests',
    description: 'Handle cancellation workflows',
    icon: XCircle,
  },
];

const Step2Automations = () => {
  const { selectedAutomations, toggleAutomation, setCurrentStep } = useOnboardingStore();

  const previewText = selectedAutomations.length > 0
    ? `Hi! I can now help you with ${selectedAutomations.map(a => 
        automationOptions.find(opt => opt.id === a)?.label
      ).join(', ')}.`
    : 'Hi! I can help you with customer support automation.';

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="mb-4">
                <Progress value={50} />
              </div>
              <CardTitle>Select Automations</CardTitle>
              <CardDescription>
                Choose which automation workflows to enable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {automationOptions.map((automation) => {
                  const Icon = automation.icon;
                  const isSelected = selectedAutomations.includes(automation.id);
                  
                  return (
                    <motion.div
                      key={automation.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        onClick={() => toggleAutomation(automation.id)}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={isSelected} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon size={18} className="text-blue-600" />
                              <h3 className="font-semibold text-gray-900">
                                {automation.label}
                              </h3>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {automation.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Bubble */}
                <div className="rounded-lg bg-blue-600 p-4 text-white">
                  <p className="text-sm">{previewText}</p>
                </div>

                {/* Selected Badges */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-700">SELECTED</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAutomations.length > 0 ? (
                      selectedAutomations.map((automation) => (
                        <Badge key={automation} variant="success" className="text-xs">
                          {automationOptions.find(opt => opt.id === automation)?.label}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No automations selected yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-xs text-blue-900">
                💡 <strong>Tip:</strong> You can modify these choices later from your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() => setCurrentStep(3)}
          disabled={selectedAutomations.length === 0}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

export default Step2Automations;
