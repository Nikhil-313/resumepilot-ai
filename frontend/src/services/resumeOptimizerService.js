import api from './api';

export const resumeOptimizerService = {
  /**
   * Run AI resume optimization analysis.
   */
  async analyzeResume(payload) {
    const response = await api.post('/resume-optimizer/analyze', payload);
    return response.data;
  },

  /**
   * Fetch single optimization report by ID.
   */
  async getReport(optimizationId) {
    const response = await api.get(`/resume-optimizer/${optimizationId}`);
    return response.data;
  },

  /**
   * Fetch candidate past optimization reports history.
   */
  async getHistory() {
    const response = await api.get('/resume-optimizer/history');
    return response.data;
  },

  /**
   * Update recommendation status (pending, accepted, rejected).
   */
  async updateRecommendation(recommendationId, status) {
    const response = await api.put(`/resume-optimizer/recommendation/${recommendationId}`, { status });
    return response.data;
  },

  /**
   * Delete an optimization report.
   */
  async deleteOptimization(optimizationId) {
    const response = await api.delete(`/resume-optimizer/${optimizationId}`);
    return response.data;
  },
};
