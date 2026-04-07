/**
 * AI Classification Service - Frontend
 * Handles API calls to the classification service
 */

import api from './api';

/**
 * Classify a single message
 */
export const classifyMessage = async (message, industry = 'ecommerce') => {
  try {
    const response = await api.post('/classify/message', {
      message,
      industry,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error classifying message:', error);
    throw error;
  }
};

/**
 * Classify multiple messages in batch
 */
export const classifyBatch = async (messages, industry = 'ecommerce') => {
  try {
    const response = await api.post('/classify/batch', {
      messages,
      industry,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error classifying batch:', error);
    throw error;
  }
};

/**
 * Check classification service health
 */
export const checkClassificationHealth = async () => {
  try {
    const response = await api.get('/classify/health');
    return response.data;
  } catch (error) {
    console.error('Error checking classification health:', error);
    throw error;
  }
};

export default {
  classifyMessage,
  classifyBatch,
  checkClassificationHealth,
};
