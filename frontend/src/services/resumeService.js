import api from './api';

export const resumeService = {
  /**
   * Upload a PDF resume file.
   */
  async uploadResume(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Trigger PyMuPDF text extraction + Gemini AI JSON parsing.
   */
  async parseResume(resumeId) {
    const response = await api.post(`/parse/${resumeId}`);
    return response.data;
  },

  /**
   * Get all resumes uploaded by user.
   */
  async getAllResumes() {
    const response = await api.get('/resumes');
    return response.data;
  },

  /**
   * Get single resume details by ID.
   */
  async getResumeById(resumeId) {
    const response = await api.get(`/resume/${resumeId}`);
    return response.data;
  },

  /**
   * Update candidate edited parsed JSON.
   */
  async updateResume(resumeId, parsedJson) {
    const response = await api.put(`/resume/${resumeId}`, { parsed_json: parsedJson });
    return response.data;
  },

  /**
   * Delete resume by ID.
   */
  async deleteResume(resumeId) {
    const response = await api.delete(`/resume/${resumeId}`);
    return response.data;
  },
};
