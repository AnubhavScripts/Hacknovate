import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Step1Welcome from './Step1Welcome';
import Step2Automations from './Step2Automations';
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
      // 2. Navigate to step 3 so the "Connected" badge is visible
      setCurrentStep(3);
      // 3. Clean URL last — after state is committed
      window.history.replaceState({}, '', '/onboarding');
    } else if (gmailStatus === 'error') {
      setCurrentStep(3);
      window.history.replaceState({}, '', '/onboarding');
    }
  }, [location.search]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Welcome />;
      case 2: return <Step2Automations />;
      case 3: return <Step3Channels />;
      case 4: return <Step4Deploy />;
      default: return <Step1Welcome />;
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
