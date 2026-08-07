import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import FileUploader from '../components/resume/FileUploader';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function UploadPage() {
  const navigate = useNavigate();

  const handleUploadSuccess = (resume) => {
    if (resume && resume.id) {
      setTimeout(() => {
        navigate(`/resume/${resume.id}`);
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Dashboard</span>
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Resume Parsing Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload Your Resume</h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload your resume PDF to extract skills, experience, and contact details with Gemini AI.
          </p>
        </div>

        <FileUploader onUploadSuccess={handleUploadSuccess} />
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Resume Extraction & Parsing.
      </footer>
    </div>
  );
}
