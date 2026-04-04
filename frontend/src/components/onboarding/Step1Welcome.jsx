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
      <Card className="mx-auto max-w-xl bg-slate-900/90 border-slate-800 backdrop-blur-xl">
        <CardHeader>
          <div className="mb-6">
            <Progress value={25} />
          </div>
          <CardTitle className="text-4xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Set up your AI assistant</CardTitle>
          <CardDescription className="mt-3 text-base text-slate-300">
            Let's personalize your automation experience in under a minute
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 p-8 text-center backdrop-blur-sm hover:border-blue-500/50 transition-colors">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🤖
              </motion.div>
              <p className="text-sm text-slate-300">
                Automate your customer support and boost productivity with our AI assistant
              </p>
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full rounded-lg font-semibold"
              onClick={() => setCurrentStep(2)}
            >
              Start Setup
            </Button>
            
            <div className="space-y-2 text-center">
              <p className="text-sm text-slate-400">✨ <span className="text-blue-300 font-semibold">Takes about 2 minutes</span></p>
              <p className="text-sm text-slate-400">🎁 <span className="text-indigo-300 font-semibold">No credit card required</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step1Welcome;
