import api from './api';

export const commandCenterService = {
  /**
   * Fetch complete command center dashboard summary.
   */
  async getDashboard() {
    const response = await api.get('/command-center');
    return response.data;
  },

  /**
   * Fetch lightweight dashboard statistics.
   */
  async getSummary() {
    const response = await api.get('/command-center/summary');
    return response.data;
  },

  /**
   * Fetch prioritized recommended actions.
   */
  async getActions() {
    const response = await api.get('/command-center/actions');
    return response.data;
  },

  /**
   * Fetch candidate notifications & unread count.
   */
  async getNotifications() {
    const response = await api.get('/command-center/notifications');
    return response.data;
  },

  /**
   * Mark single notification as read.
   */
  async markNotificationRead(notificationId) {
    const response = await api.put(`/command-center/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllNotificationsRead() {
    const response = await api.put('/command-center/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId) {
    const response = await api.delete(`/command-center/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Generate AI Career Executive Summary.
   */
  async generateAiSummary() {
    const response = await api.post('/command-center/ai-summary');
    return response.data;
  },
};
