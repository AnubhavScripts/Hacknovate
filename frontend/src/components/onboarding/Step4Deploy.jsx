import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useUser } from '../../context/UserContext';
import { saveAutomationApi } from '../../services/api';
import { Loader2, Check } from 'lucide-react';

const Step4Deploy = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    startDeployment,
    updateDeploymentProgress,
    completeDeployment,
    saveOnboardingData,
    selectedAutomations,
    connectedChannels,
  } = useOnboardingStore();

  const deploymentSteps = [
    'Setting up automations...',
    'Connecting channels...',
    'Finalizing deployment...',
  ];

  useEffect(() => {
    startDeployment();

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < deploymentSteps.length) {
        updateDeploymentProgress((currentStep + 1) * 33);
        currentStep += 1;
      } else {
        clearInterval(interval);
        completeDeployment();

        // Save to backend
        const userId = user?._id || user?.id || 'mock_user_001';
        saveAutomationApi({
          userId,
          selectedOptions: selectedAutomations,
          connectedChannels,
          status: 'active',
        }).catch(() => {}); // best-effort — don't block redirect

        saveOnboardingData();

        setTimeout(() => navigate('/dashboard'), 1000);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <div className="mb-4">
            <Progress value={100} />
          </div>
          <CardTitle className="text-center">Setting Up Your Assistant</CardTitle>
          <CardDescription className="mt-2 text-center">
            This should only take a moment...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="flex justify-center py-8">
              <div className="relative w-24 h-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-blue-600" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-3xl">🤖</span>
                </motion.div>
              </div>
            </div>

            <div className="space-y-4">
              {deploymentSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0">
                    {index < deploymentSteps.length - 1 ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="h-5 w-5"
                      >
                        <Loader2 className="text-blue-600" size={20} />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <Check className="text-green-600" size={20} />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{step}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="rounded-lg bg-green-50 border border-green-200 p-4 text-center"
            >
              <p className="text-sm text-green-900 font-medium">
                ✨ Your AI assistant is ready to go!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Redirecting to dashboard...
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step4Deploy;
