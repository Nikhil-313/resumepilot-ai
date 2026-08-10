import api from './api';

export const applicationService = {
  /**
   * Create a manual job application.
   */
  async createManual(payload) {
    const response = await api.post('/applications', payload);
    return response.data;
  },

  /**
   * Track application directly from an existing JobPosting.
   */
  async createFromJob(jobId, payload = {}) {
    const response = await api.post(`/applications/from-job/${jobId}`, payload);
    return response.data;
  },

  /**
   * Retrieve applications with optional filters.
   */
  async getApplications(params = {}) {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  /**
   * Retrieve application statistics and smart recommendations.
   */
  async getStatistics() {
    const response = await api.get('/applications/statistics');
    return response.data;
  },

  /**
   * Retrieve single application by ID.
   */
  async getApplicationById(applicationId) {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  },

  /**
   * Update application information.
   */
  async updateApplication(applicationId, payload) {
    const response = await api.put(`/applications/${applicationId}`, payload);
    return response.data;
  },

  /**
   * Update application stage and status.
   */
  async updateStage(applicationId, stage, status = null) {
    const response = await api.put(`/applications/${applicationId}/stage`, { stage, status });
    return response.data;
  },

  /**
   * Add timeline activity log.
   */
  async addActivity(applicationId, payload) {
    const response = await api.post(`/applications/${applicationId}/activity`, payload);
    return response.data;
  },

  /**
   * Retrieve application activities.
   */
  async getActivities(applicationId) {
    const response = await api.get(`/applications/${applicationId}/activities`);
    return response.data;
  },

  /**
   * Create follow-up reminder.
   */
  async createFollowup(applicationId, payload) {
    const response = await api.post(`/applications/${applicationId}/follow-up`, payload);
    return response.data;
  },

  /**
   * Update follow-up status or details.
   */
  async updateFollowup(followUpId, payload) {
    const response = await api.put(`/applications/follow-up/${followUpId}`, payload);
    return response.data;
  },

  /**
   * Generate AI follow-up message for application.
   */
  async generateAIFollowup(applicationId) {
    const response = await api.post(`/applications/${applicationId}/generate-followup`);
    return response.data;
  },

  /**
   * Delete job application.
   */
  async deleteApplication(applicationId) {
    const response = await api.delete(`/applications/${applicationId}`);
    return response.data;
  },
};
