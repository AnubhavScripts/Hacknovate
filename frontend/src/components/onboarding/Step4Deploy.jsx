import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useUser } from '../../context/UserContext';
import { Loader2, Check, AlertCircle } from 'lucide-react';

const Step4Deploy = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    startDeployment,
    updateDeploymentProgress,
    completeDeployment,
    saveOnboardingData,
  } = useOnboardingStore();
  
  const [deployError, setDeployError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const deploymentSteps = [
    'Setting up automations...',
    'Connecting channels...',
    'Finalizing deployment...',
  ];

  useEffect(() => {
    startDeployment();

    // Simulate deployment process
    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < deploymentSteps.length) {
        updateDeploymentProgress((currentStep + 1) * 33);
        currentStep += 1;
      } else {
        clearInterval(interval);
        
        // Save onboarding data to backend
        try {
          const userId = user?.id || user?._id || user?.userId;
          
          if (!userId) {
            setDeployError('User information not available. Please log in again.');
            completeDeployment();
            return;
          }
          
          const result = await saveOnboardingData(userId);
          if (result.success) {
            completeDeployment();
            setIsComplete(true);
            
            // Redirect to dashboard after 1 second
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } else {
            setDeployError(result.error || 'Failed to save automation setup');
            completeDeployment();
          }
        } catch (err) {
          setDeployError(err.message || 'An error occurred during deployment');
          completeDeployment();
        }
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [user]);

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
            {deployError ? (
              <>
                {/* Error State */}
                <div className="flex justify-center py-8">
                  <AlertCircle className="text-red-600" size={48} />
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                  <p className="text-sm text-red-900 font-medium">⚠️ Deployment Error</p>
                  <p className="text-xs text-red-700 mt-2">{deployError}</p>
                  <button
                    onClick={() => navigate('/onboarding')}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Go Back
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Loading Animation */}
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

                {/* Deployment Steps */}
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

                {/* Success Message */}
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-lg bg-green-50 border border-green-200 p-4 text-center"
                  >
                    <p className="text-sm text-green-900 font-medium">
                      ✨ Your AI assistant is ready to go!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Redirecting to dashboard...
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step4Deploy;
