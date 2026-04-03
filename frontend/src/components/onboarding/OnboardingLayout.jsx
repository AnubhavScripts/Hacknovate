import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Step1Welcome from './Step1Welcome';
import Step2Automations from './Step2Automations';
import Step3Channels from './Step3Channels';
import Step4Deploy from './Step4Deploy';
import { useOnboardingStore } from '../../store/onboardingStore';

const OnboardingLayout = () => {
  const { currentStep, setCurrentStep, connectChannel } = useOnboardingStore();

  useEffect(() => {
    // Check for Gmail connection status in URL params
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('gmail') === 'connected') {
      console.log('✅ Gmail connection detected in URL params, updating store');
      connectChannel('gmail');
    }
    
    // Set step if provided in URL
    const step = params.get('step');
    if (step && parseInt(step) !== currentStep) {
      console.log('📍 Setting onboarding step to:', step);
      setCurrentStep(parseInt(step));
    }
    
    // Clean up the URL without reloading
    if (params.get('gmail') || params.get('step')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [connectChannel, setCurrentStep, currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome />;
      case 2:
        return <Step2Automations />;
      case 3:
        return <Step3Channels />;
      case 4:
        return <Step4Deploy />;
      default:
        return <Step1Welcome />;
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
