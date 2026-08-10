import api from './api';

export const progressService = {
  /**
   * Fetch complete career progress dashboard data.
   */
  async getDashboard() {
    const response = await api.get('/progress/dashboard');
    return response.data;
  },

  /**
   * Fetch candidate progress tasks.
   */
  async getTasks(category = '', status = '') {
    const params = {};
    if (category) params.category = category;
    if (status) params.status = status;
    const response = await api.get('/progress/tasks', { params });
    return response.data;
  },

  /**
   * Update progress task status ('pending', 'in_progress', 'completed', 'dismissed').
   */
  async updateTask(taskId, status) {
    const response = await api.put(`/progress/tasks/${taskId}`, { status });
    return response.data;
  },

  /**
   * Fetch career milestones.
   */
  async getMilestones() {
    const response = await api.get('/progress/milestones');
    return response.data;
  },

  /**
   * Fetch weekly progress summary.
   */
  async getWeekly() {
    const response = await api.get('/progress/weekly');
    return response.data;
  },

  /**
   * Fetch monthly progress summary.
   */
  async getMonthly() {
    const response = await api.get('/progress/monthly');
    return response.data;
  },

  /**
   * Fetch progress trend data.
   */
  async getTrends() {
    const response = await api.get('/progress/trends');
    return response.data;
  },

  /**
   * Synchronize actionable tasks from existing modules.
   */
  async syncProgress() {
    const response = await api.post('/progress/sync');
    return response.data;
  },

  /**
   * Generate AI Progress Coaching.
   */
  async getCoach() {
    const response = await api.post('/progress/coach');
    return response.data;
  },
};
