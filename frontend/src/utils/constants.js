export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const APP_NAME = 'ResumePilot AI';
export const APP_TAGLINE = 'AI-Powered Career Intelligence Platform';

export const TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Product Manager',
];

export const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher / Student (0 years)' },
  { id: 'entry', label: 'Entry Level (1-2 years)' },
  { id: 'mid', label: 'Mid Level (3-5 years)' },
  { id: 'senior', label: 'Senior Level (5+ years)' },
];
