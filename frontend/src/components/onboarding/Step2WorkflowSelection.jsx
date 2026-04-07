import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Checkbox } from '../ui/Checkbox';
import { useOnboardingStore } from '../../store/onboardingStore';

const Step2WorkflowSelection = () => {
  const { selectedIndustry, selectedWorkflows, toggleWorkflow, setCurrentStep } = useOnboardingStore();

  // Domain-specific workflow options
  const workflowOptions = {
    ecommerce: [
      {
        id: 'complaint_handling',
        name: 'Complaint Handling',
        description: 'Auto-classify and route customer complaints',
        icon: '⚠️',
      },
      {
        id: 'query_answering',
        name: 'Query Answering',
        description: 'Automated responses to common questions',
        icon: '❓',
      },
      {
        id: 'order_tracking',
        name: 'Order Tracking',
        description: 'Provide real-time order status updates',
        icon: '📦',
      },
      {
        id: 'cancellation_requests',
        name: 'Cancellation Requests',
        description: 'Handle returns and cancellations',
        icon: '❌',
      },
    ],
    education: [
      {
        id: 'enrollment_support',
        name: 'Enrollment Support',
        description: 'Guide students through enrollment process',
        icon: '📝',
      },
      {
        id: 'course_inquiries',
        name: 'Course Inquiries',
        description: 'Answer questions about courses and programs',
        icon: '📚',
      },
      {
        id: 'academic_support',
        name: 'Academic Support',
        description: 'Provide tutoring and homework assistance',
        icon: '🎯',
      },
      {
        id: 'admission_queries',
        name: 'Admission Queries',
        description: 'Handle admission-related questions',
        icon: '🎓',
      },
    ],
    finance: [
      {
        id: 'loan_queries',
        name: 'Loan Inquiries',
        description: 'Answer questions about loan products',
        icon: '🏦',
      },
      {
        id: 'insurance_support',
        name: 'Insurance Support',
        description: 'Handle insurance queries and claims',
        icon: '🛡️',
      },
      {
        id: 'account_support',
        name: 'Account Support',
        description: 'Manage account-related requests',
        icon: '👤',
      },
      {
        id: 'policy_assistance',
        name: 'Policy Assistance',
        description: 'Explain policies and benefits',
        icon: '📋',
      },
    ],
  };

  const workflows = workflowOptions[selectedIndustry] || [];

  const handleNext = () => {
    if (selectedWorkflows.length > 0) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
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
            <Progress value={40} />
          </div>
          <CardTitle className="text-3xl">Select Workflow Types</CardTitle>
          <CardDescription className="mt-2 text-base">
            Choose which workflows you want to automate (select at least one)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                whileHover={{ x: 4 }}
                onClick={() => toggleWorkflow(workflow.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedWorkflows.includes(workflow.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedWorkflows.includes(workflow.id)}
                    onChange={() => toggleWorkflow(workflow.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{workflow.icon}</span>
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={selectedWorkflows.length === 0}
              onClick={handleNext}
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step2WorkflowSelection;
