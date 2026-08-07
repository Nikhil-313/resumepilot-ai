import api from './api';

export const atsService = {
  /**
   * Run ATS compatibility analysis comparing candidate resume against JD.
   */
  async analyzeResume(payload) {
    const response = await api.post('/ats/analyze', payload);
    return response.data;
  },

  /**
   * Fetch single ATS report by ID.
   */
  async getReport(analysisId) {
    const response = await api.get(`/ats/report/${analysisId}`);
    return response.data;
  },

  /**
   * Fetch candidate past ATS analysis history.
   */
  async getHistory() {
    const response = await api.get('/ats/history');
    return response.data;
  },

  /**
   * Delete an ATS analysis report by ID.
   */
  async deleteReport(analysisId) {
    const response = await api.delete(`/ats/report/${analysisId}`);
    return response.data;
  },
};
