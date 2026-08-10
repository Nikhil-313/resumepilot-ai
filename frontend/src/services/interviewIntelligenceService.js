import api from './api';

export const interviewIntelligenceService = {
  /**
   * Fetch complete interview intelligence dashboard data.
   */
  async getDashboard() {
    const response = await api.get('/interview-intelligence/dashboard');
    return response.data;
  },

  /**
   * Fetch performance trends.
   */
  async getTrends() {
    const response = await api.get('/interview-intelligence/trends');
    return response.data;
  },

  /**
   * Fetch recurring strengths.
   */
  async getStrengths() {
    const response = await api.get('/interview-intelligence/strengths');
    return response.data;
  },

  /**
   * Fetch recurring weaknesses.
   */
  async getWeaknesses() {
    const response = await api.get('/interview-intelligence/weaknesses');
    return response.data;
  },

  /**
   * Fetch adaptive practice recommendations.
   */
  async getRecommendations() {
    const response = await api.get('/interview-intelligence/recommendations');
    return response.data;
  },

  /**
   * Update practice recommendation status ('pending', 'in_progress', 'completed', 'dismissed').
   */
  async updateRecommendation(id, status) {
    const response = await api.put(`/interview-intelligence/recommendations/${id}`, { status });
    return response.data;
  },

  /**
   * Generate AI Interview Coaching.
   */
  async getCoaching() {
    const response = await api.post('/interview-intelligence/coach');
    return response.data;
  },
};
