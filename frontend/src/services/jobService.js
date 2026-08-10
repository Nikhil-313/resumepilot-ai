import api from './api';

export const jobService = {
  /**
   * Retrieve available job postings with filtering parameters.
   */
  async getJobs(params = {}) {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  /**
   * Generate personalized AI job compatibility match reports.
   */
  async generateMatches(payload = {}) {
    const response = await api.post('/jobs/match', payload);
    return response.data;
  },

  /**
   * Retrieve candidate's previous job match reports.
   */
  async getMatchReports() {
    const response = await api.get('/jobs/matches');
    return response.data;
  },

  /**
   * View single detailed job compatibility report.
   */
  async getMatchReportById(reportId) {
    const response = await api.get(`/jobs/match/${reportId}`);
    return response.data;
  },

  /**
   * Delete a job match report.
   */
  async deleteMatchReport(reportId) {
    const response = await api.delete(`/jobs/match/${reportId}`);
    return response.data;
  },
};
