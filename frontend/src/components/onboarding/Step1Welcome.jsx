import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { useOnboardingStore } from '../../store/onboardingStore';

const Step1Welcome = () => {
  const { setCurrentStep } = useOnboardingStore();

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
            <Progress value={25} />
          </div>
          <CardTitle className="text-3xl">Set up your AI assistant in under 60 seconds</CardTitle>
          <CardDescription className="mt-2 text-base">
            Let's personalize your automation experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <p className="text-sm text-gray-600">
                Get ready to automate your customer support and boost productivity
              </p>
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full"
              onClick={() => setCurrentStep(2)}
            >
              Start Setup
            </Button>
            
            <div className="space-y-2 text-center">
              <p className="text-xs text-gray-500">⏱️ Takes about 2 minutes</p>
              <p className="text-xs text-gray-500">✨ No credit card required</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step1Welcome;
