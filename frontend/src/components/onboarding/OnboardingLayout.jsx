import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Step1Welcome from './Step1Welcome';
import Step1IndustrySelection from './Step1IndustrySelection';
import Step2WorkflowSelection from './Step2WorkflowSelection';
import Step3Channels from './Step3Channels';
import Step4Deploy from './Step4Deploy';
import { useOnboardingStore } from '../../store/onboardingStore';

const OnboardingLayout = () => {
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);
  const connectChannel = useOnboardingStore((state) => state.connectChannel);
  const location = useLocation();

  // Handle OAuth callback params (?gmail=connected&step=3)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gmailStatus = params.get('gmail');

    if (gmailStatus === 'connected') {
      // 1. Update state FIRST before clearing URL or changing step
      connectChannel('gmail');
      // 2. Navigate to step 4 (Channels is now step 4)
      setCurrentStep(4);
      // 3. Clean URL last — after state is committed
      window.history.replaceState({}, '', '/onboarding');
    } else if (gmailStatus === 'error') {
      setCurrentStep(4);
      window.history.replaceState({}, '', '/onboarding');
    }
  }, [location.search]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1IndustrySelection />;
      case 2: return <Step2WorkflowSelection />;
      case 3: return <Step3Channels />;
      case 4: return <Step4Deploy />;
      default: return <Step1IndustrySelection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingLayout;
