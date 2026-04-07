import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { useOnboardingStore } from '../../store/onboardingStore';

const Step1IndustrySelection = () => {
  const { setSelectedIndustry, setCurrentStep } = useOnboardingStore();

  const industries = [
    {
      id: 'ecommerce',
      name: 'E-Commerce',
      icon: '🛒',
      description: 'Handle orders, complaints, returns, and customer queries',
      color: 'from-blue-100 to-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'education',
      name: 'Education',
      icon: '🎓',
      description: 'Manage student inquiries, course info, enrollment, and support',
      color: 'from-purple-100 to-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: '💰',
      description: 'Handle loans, insurance queries, account support, and policies',
      color: 'from-green-100 to-green-50',
      borderColor: 'border-green-200',
    },
  ];

  const handleIndustrySelect = (industryId) => {
    setSelectedIndustry(industryId);
    setCurrentStep(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="mb-4">
            <Progress value={20} />
          </div>
          <CardTitle className="text-3xl">Select Your Industry</CardTitle>
          <CardDescription className="mt-2 text-base">
            Choose the industry that best matches your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {industries.map((industry) => (
              <motion.button
                key={industry.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleIndustrySelect(industry.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all bg-gradient-to-br ${industry.color} ${industry.borderColor} hover:shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{industry.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{industry.name}</h3>
                    <p className="text-sm text-gray-700 mt-1">{industry.description}</p>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step1IndustrySelection;
