import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      currentStep: 1,
      selectedIndustry: null, // 'ecommerce', 'education', 'finance'
      selectedWorkflows: [], // domain-specific workflows
      selectedAutomations: [],
      connectedChannels: {
        gmail: false,
        whatsapp: false,
      },
      userInfo: {
        name: '',
        email: '',
      },
      aiClassification: {
        enabled: true,
        categories: ['hot', 'cold'], // hot = urgent/immediate response, cold = can wait
      },
      isDeploying: false,
      deploymentProgress: 0,

      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setSelectedIndustry: (industry) => set({ selectedIndustry: industry }),
      
      toggleWorkflow: (workflow) => set((state) => {
        const isSelected = state.selectedWorkflows.includes(workflow);
        return {
          selectedWorkflows: isSelected
            ? state.selectedWorkflows.filter((w) => w !== workflow)
            : [...state.selectedWorkflows, workflow],
        };
      }),
      
      toggleAutomation: (automation) => set((state) => {
        const isSelected = state.selectedAutomations.includes(automation);
        return {
          selectedAutomations: isSelected
            ? state.selectedAutomations.filter((a) => a !== automation)
            : [...state.selectedAutomations, automation],
        };
      }),

      setConnectedChannels: (channels) => set({ connectedChannels: channels }),
      
      connectChannel: (channel) => set((state) => ({
        connectedChannels: {
          ...state.connectedChannels,
          [channel]: true,
        },
      })),

      setUserInfo: (info) => set((state) => ({
        userInfo: { ...state.userInfo, ...info },
      })),

      updateAIClassification: (config) => set((state) => ({
        aiClassification: { ...state.aiClassification, ...config },
      })),

      startDeployment: () => set({ 
        isDeploying: true,
        deploymentProgress: 0 
      }),

      updateDeploymentProgress: (progress) => set({ deploymentProgress: progress }),

      completeDeployment: () => set({ 
        isDeploying: false,
        deploymentProgress: 100 
      }),

      resetOnboarding: () => set({
        currentStep: 1,
        selectedIndustry: null,
        selectedWorkflows: [],
        selectedAutomations: [],
        connectedChannels: {
          gmail: false,
          whatsapp: false,
        },
        userInfo: {
          name: '',
          email: '',
        },
        isDeploying: false,
        deploymentProgress: 0,
      }),

      saveOnboardingData: () => {
        const state = get();
        const data = {
          userInfo: state.userInfo,
          automations: state.selectedAutomations,
          channels: state.connectedChannels,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('onboardingData', JSON.stringify(data));
        return data;
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
