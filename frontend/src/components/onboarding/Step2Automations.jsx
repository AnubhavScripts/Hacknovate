import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { useOnboardingStore } from '../../store/onboardingStore';
import { ShoppingCart, BookOpen, DollarSign } from 'lucide-react';

const automationOptions = [
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    description: 'Online retail and shopping automation',
    icon: ShoppingCart,
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Educational institution automation',
    icon: BookOpen,
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Financial services automation',
    icon: DollarSign,
  },
];

const Step2Automations = () => {
  const { selectedAutomations, toggleAutomation, setCurrentStep, saveAutomations } = useOnboardingStore();

  const previewText = selectedAutomations.length > 0
    ? `Hi! I can now help you with ${selectedAutomations.map(a => 
        automationOptions.find(opt => opt.id === a)?.label
      ).join(', ')}.`
    : 'Hi! I can help you with customer support automation.';

  const handleContinue = async () => {
    // Save to backend
    const result = await saveAutomations();
    if (result.success) {
      setCurrentStep(3);
    } else {
      console.error('Failed to save automations:', result.error);
      // Still proceed to next step
      setCurrentStep(3);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full max-w-5xl">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <div className="mb-6">
                <Progress value={50} />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Select Automations</CardTitle>
              <CardDescription className="text-slate-300 mt-2">
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
                        className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                          isSelected
                            ? 'border-blue-500/60 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 shadow-lg shadow-blue-600/20'
                            : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={isSelected} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon size={18} className={isSelected ? 'text-blue-400' : 'text-gray-400'} />
                              <h3 className={`font-semibold ${
                                isSelected ? 'text-blue-300' : 'text-white'
                              }`}>
                                {automation.label}
                              </h3>
                            </div>
                            <p className={`mt-1 text-sm ${
                              isSelected ? 'text-blue-200/80' : 'text-gray-300'
                            }`}>
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
          <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Bubble */}
                <div className="rounded-lg bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-4 text-white shadow-lg shadow-blue-600/30">
                  <p className="text-sm font-medium">{previewText}</p>
                </div>

                {/* Selected Badges */}
                <div>
                  <p className="mb-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Selected</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAutomations.length > 0 ? (
                      selectedAutomations.map((automation) => (
                        <Badge key={automation} variant="active" className="text-xs font-semibold">
                          ✓ {automationOptions.find(opt => opt.id === automation)?.label}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">Select automations above</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-300">
                <span className="text-blue-300 font-bold">💡 Tip:</span> You can modify these choices later from your dashboard.
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
          onClick={handleContinue}
          disabled={selectedAutomations.length === 0}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

export default Step2Automations;
