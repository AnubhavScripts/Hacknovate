import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useUser } from '../../context/UserContext';
import { deployOnboardingApi } from '../../services/api';
import { Loader2, Check, AlertCircle } from 'lucide-react';

const Step4Deploy = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    startDeployment,
    updateDeploymentProgress,
    completeDeployment,
    selectedAutomations,
    selectedSubcategories,
    connectedChannels,
  } = useOnboardingStore();
  
  const [deployError, setDeployError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isDeploying, setIsDeploying] = useState(true);

  const deploymentSteps = [
    'Saving configuration...',
    'Deploying AI assistant...',
    'Finalizing setup...',
  ];

  useEffect(() => {
    // Capture values at mount time — avoid re-running on state changes
    const currentUser = user;
    const currentAutomations = selectedAutomations;
    const currentSubcategories = selectedSubcategories;
    const currentChannels = connectedChannels;

    startDeployment();

    // Simulate deployment process
    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < deploymentSteps.length) {
        updateDeploymentProgress((currentStep + 1) * 33);
        currentStep += 1;
      } else {
        clearInterval(interval);
        
        // Deploy onboarding to backend
        try {
          const userId = currentUser?.id || currentUser?._id || currentUser?.userId;
          
          if (!userId) {
            setDeployError('User information not available. Please log in again.');
            completeDeployment();
            setIsDeploying(false);
            return;
          }
          
          const response = await deployOnboardingApi({
            userId,
            selectedAutomations: currentAutomations,
            selectedSubcategories: currentSubcategories,
            connectedChannels: currentChannels,
          });

          if (response.data.success) {
            completeDeployment();
            setIsComplete(true);
            setIsDeploying(false);
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            setDeployError(response.data.error || 'Failed to deploy automation setup');
            completeDeployment();
            setIsDeploying(false);
          }
        } catch (err) {
          console.error('❌ Deployment error:', err);
          setDeployError(err.response?.data?.error || err.message || 'An error occurred during deployment');
          completeDeployment();
          setIsDeploying(false);
        }
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="mx-auto max-w-xl bg-slate-900/90 border-slate-800 backdrop-blur-xl">
        <CardHeader>
          <div className="mb-6">
            <Progress value={100} />
          </div>
          <CardTitle className="text-center text-3xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Setting Up Your Assistant</CardTitle>
          <CardDescription className="mt-3 text-center text-gray-100">
            Configuring your automation in just a moment...
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
                <div className="rounded-lg bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/30 p-4 text-center backdrop-blur-sm">
                  <p className="text-sm text-red-300 font-medium">⚠️ Deployment Error</p>
                  <p className="text-xs text-red-200 mt-2">{deployError}</p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/onboarding')}
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
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
                      <div className="w-full h-full rounded-full border-4 border-slate-700 border-t-blue-400" />
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
                            <Loader2 className="text-blue-400" size={20} />
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
                      <span className="text-sm font-medium text-gray-100">{step}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Success Message */}
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-lg bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 p-4 text-center backdrop-blur-sm"
                  >
                    <p className="text-sm text-green-300 font-medium">
                      ✨ Your AI assistant is ready to go!
                    </p>
                    <p className="text-xs text-green-200/80 mt-1">
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
