import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveAutomationApi } from '../services/api';

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      currentStep: 1,
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

      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      
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

      saveOnboardingData: async (userId) => {
        const state = get();
        
        if (!userId) {
          console.error('userId is required to save automation data');
          return { success: false, error: 'User ID is required' };
        }
        
        const automationData = {
          userId,
          selectedOptions: state.selectedAutomations,
          connectedChannels: state.connectedChannels,
          status: 'active',
        };
        
        try {
          await saveAutomationApi(automationData);
          
          const data = {
            userInfo: state.userInfo,
            automations: state.selectedAutomations,
            channels: state.connectedChannels,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('onboardingData', JSON.stringify(data));
          return { success: true, data };
        } catch (err) {
          console.error('Failed to save onboarding data:', err);
          return { success: false, error: err.response?.data?.error || err.message };
        }
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
