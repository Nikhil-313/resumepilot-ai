import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ResumeDetailsPage from './pages/ResumeDetailsPage';
import InterviewDashboard from './pages/InterviewDashboard';
import InterviewSessionPage from './pages/InterviewSessionPage';
import InterviewReportPage from './pages/InterviewReportPage';
import ATSAnalyzerPage from './pages/ATSAnalyzerPage';
import JobMatchesPage from './pages/JobMatchesPage';
import JobReportPage from './pages/JobReportPage';
import CareerPlannerPage from './pages/CareerPlannerPage';
import ResumeOptimizerPage from './pages/ResumeOptimizerPage';
import ApplicationTrackerPage from './pages/ApplicationTrackerPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Candidate Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/:id"
            element={
              <ProtectedRoute>
                <ResumeDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/session/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewSessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/report/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ats"
            element={
              <ProtectedRoute>
                <ATSAnalyzerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ats/report/:id"
            element={
              <ProtectedRoute>
                <ATSAnalyzerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobMatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/match/:id"
            element={
              <ProtectedRoute>
                <JobReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career"
            element={
              <ProtectedRoute>
                <CareerPlannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-optimizer"
            element={
              <ProtectedRoute>
                <ResumeOptimizerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <ApplicationTrackerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute>
                <ApplicationDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Default Route Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
