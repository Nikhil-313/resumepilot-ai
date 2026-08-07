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
   * Initialize a new interview session and generate AI questions.
   */
  async startInterview(payload) {
    const response = await api.post('/interview/start', payload);
    return response.data;
  },

  /**
   * Fetch details for an active/completed session.
   */
  async getSession(sessionId) {
    const response = await api.get(`/interview/session/${sessionId}`);
    return response.data;
  },

  /**
   * Save candidate's answer for a specific question.
   */
  async submitAnswer(sessionId, questionId, answer) {
    const response = await api.post('/interview/answer', {
      session_id: sessionId,
      question_id: questionId,
      answer: answer,
    });
    return response.data;
  },

  /**
   * Conclude an interview session.
   */
  async finishSession(sessionId) {
    const response = await api.post(`/interview/finish/${sessionId}`);
    return response.data;
  },

  /**
   * Trigger AI evaluation of all candidate answers in a session.
   */
  async evaluateSession(sessionId, force = false) {
    const response = await api.post(`/interview/evaluate/${sessionId}`, { force });
    return response.data;
  },

  /**
   * Fetch complete performance scorecard report.
   */
  async getReport(sessionId) {
    const response = await api.get(`/interview/report/${sessionId}`);
    return response.data;
  },
};
