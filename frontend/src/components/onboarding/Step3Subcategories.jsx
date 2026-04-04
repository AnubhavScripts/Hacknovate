import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { useOnboardingStore } from '../../store/onboardingStore';
import { AlertCircle, Check } from 'lucide-react';

const subcategoryMapping = {
  ecommerce: [
    { id: 'ecommerce_complaint_handling', label: 'Complaint Handling' },
    { id: 'ecommerce_query_answering', label: 'Query Answering' },
  ],
  education: [
    { id: 'education_course_queries', label: 'Course Queries' },
    { id: 'education_assessment_reminder', label: 'Assessment Reminder' },
  ],
  finance: [
    { id: 'finance_fraud_detection', label: 'Fraud Detection' },
    { id: 'finance_loan_automation', label: 'Loan Automation' },
  ],
};

const Step3Subcategories = () => {
  const { 
    selectedAutomations, 
    selectedSubcategories, 
    toggleSubcategory, 
    setCurrentStep,
    saveSubcategories 
  } = useOnboardingStore();

  const [error, setError] = useState(null);

  // Get available subcategories based on selected automations
  const availableSubcategories = selectedAutomations.flatMap(automation => {
    return subcategoryMapping[automation] || [];
  });

  const handleContinue = async () => {
    if (selectedSubcategories.length === 0) {
      setError('Please select at least one subcategory');
      return;
    }

    // Save to backend
    const result = await saveSubcategories();
    if (result.success) {
      setCurrentStep(4);
    } else {
      console.error('Failed to save subcategories:', result.error);
      // Still proceed to next step
      setCurrentStep(4);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full max-w-5xl">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <div className="mb-6">
                <Progress value={60} />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Select Subcategories</CardTitle>
              <CardDescription className="text-slate-300 mt-2">
                Choose specific automations for your selected categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg bg-red-600/20 border border-red-500/30 p-3 flex items-start gap-2">
                  <AlertCircle className="text-red-400 mt-0.5" size={18} />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {selectedAutomations.map((automation) => {
                  const subcats = subcategoryMapping[automation] || [];
                  const automationLabel = automation
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                  return (
                    <div key={automation}>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                        {automationLabel} Subcategories
                      </h4>
                      <div className="space-y-2">
                        {subcats.map((subcat) => {
                          const isSelected = selectedSubcategories.includes(subcat.id);

                          return (
                            <motion.div
                              key={subcat.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div
                                onClick={() => toggleSubcategory(subcat.id)}
                                className={`cursor-pointer rounded-lg border-2 p-3 transition-all flex items-center gap-3 ${
                                  isSelected
                                    ? 'border-blue-500/60 bg-gradient-to-r from-blue-600/20 to-indigo-600/20'
                                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                                }`}
                              >
                                <Checkbox checked={isSelected} />
                                <span className={`text-sm font-medium ${
                                  isSelected ? 'text-blue-300' : 'text-white'
                                }`}>
                                  {subcat.label}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedSubcategories.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubcategories.map((subcat) => (
                      <div key={subcat} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check size={16} className="text-green-400" />
                        <span>{subcategoryMapping[selectedAutomations[0]]?.find(s => s.id === subcat)?.label || subcat}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Select subcategories above</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-300">
                <span className="text-blue-300 font-bold">💡 Tip:</span> Select features relevant to your business needs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(2)}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={selectedSubcategories.length === 0}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

export default Step3Subcategories;
