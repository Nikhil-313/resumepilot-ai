import api from './api';

export const careerService = {
  /**
   * Generate or regenerate personalized AI Career Development Plan.
   */
  async generatePlan(payload = {}) {
    const response = await api.post('/career/plan', payload);
    return response.data;
  },

  /**
   * Retrieve active candidate career plan.
   */
  async getPlan() {
    const response = await api.get('/career/plan');
    return response.data;
  },

  /**
   * Retrieve career goals.
   */
  async getGoals() {
    const response = await api.get('/career/goals');
    return response.data;
  },

  /**
   * Update status of a career goal (not_started, in_progress, completed).
   */
  async updateGoalStatus(goalId, status) {
    const response = await api.put(`/career/goals/${goalId}`, { status });
    return response.data;
  },

  /**
   * Retrieve skill roadmap items.
   */
  async getRoadmap() {
    const response = await api.get('/career/roadmap');
    return response.data;
  },

  /**
   * Update status of a skill roadmap item (not_started, in_progress, completed).
   */
  async updateRoadmapStatus(roadmapId, status) {
    const response = await api.put(`/career/roadmap/${roadmapId}`, { status });
    return response.data;
  },

  /**
   * Delete current career plan.
   */
  async deletePlan() {
    const response = await api.delete('/career/plan');
    return response.data;
  },
};
