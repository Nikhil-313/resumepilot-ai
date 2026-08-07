import api from './api';

export const interviewService = {
  /**
   * Fetch configuration parameters (roles, difficulty levels).
   */
  async getConfig() {
    const response = await api.get('/interview/config');
    return response.data;
  },

  /**
   * Initialize a new interview session.
   */
  async startInterview(payload) {
    const response = await api.post('/interview/start', payload);
    return response.data;
  },
};
