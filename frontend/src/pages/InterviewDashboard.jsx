import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import InterviewCard from '../components/interview/InterviewCard';
import { useAuth } from '../context/AuthContext';
import { interviewService } from '../services/interviewService';
import { resumeService } from '../services/resumeService';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Bot } from 'lucide-react';

export default function InterviewDashboard() {
  const { user } = useAuth();

  const [roles, setRoles] = useState([
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'ML Engineer',
  ]);
  const [difficulties, setDifficulties] = useState(['Easy', 'Medium', 'Hard']);
  const [resumes, setResumes] = useState([]);

  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [starting, setStarting] = useState(false);
  const [sessionResponse, setSessionResponse] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingConfig(true);
        // Fetch API Config & Uploaded Resumes
        const [configData, resumeData] = await Promise.all([
          interviewService.getConfig().catch(() => null),
          resumeService.getAllResumes().catch(() => ({ resumes: [] })),
        ]);

        if (configData) {
          if (configData.roles) setRoles(configData.roles);
          if (configData.difficulty) setDifficulties(configData.difficulty);
        }

        const userResumes = resumeData.resumes || [];
        setResumes(userResumes);
        if (userResumes.length > 0) {
          setSelectedResumeId(userResumes[0].id);
        }
      } catch (err) {
        setError('Failed to load interview configuration.');
      } finally {
        setLoadingConfig(false);
      }
    };

    initData();
  }, []);

  const handleStartInterview = async () => {
    setStarting(true);
    setError('');
    setSessionResponse(null);

    try {
      const payload = {
        role: selectedRole,
        difficulty: selectedDifficulty,
        question_count: questionCount,
        resume_id: selectedResumeId,
      };

      const res = await interviewService.startInterview(payload);
      setSessionResponse(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start interview session.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 z-10">
        {/* Welcome Banner */}
        <div className="glass-panel p-6 md:p-8 mb-8 border border-slate-800/90 relative">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>AI Interview Copilot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Practice Mock Interviews
              </h1>
            </div>
          </div>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed mt-2">
            Welcome, <span className="text-white font-semibold">{user?.full_name || 'Candidate'}</span>! Select your target role, difficulty, and resume to configure a personalized AI mock interview arena.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* Success Placeholder Response */}
        {sessionResponse && (
          <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0" />
              <span>{sessionResponse.message || 'Interview session initialized.'}</span>
            </div>
            <p className="text-xs text-emerald-400/80 font-mono">
              Status: {sessionResponse.status} • Role: {selectedRole} • Questions: {questionCount} • Difficulty: {selectedDifficulty}
            </p>
          </div>
        )}

        {/* Main Interview Config Card */}
        {loadingConfig ? (
          <div className="glass-panel p-8 text-center border border-slate-800 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-cyan animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading interview environment options...</p>
          </div>
        ) : (
          <InterviewCard
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onResumeChange={setSelectedResumeId}
            roles={roles}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            difficulties={difficulties}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            onStart={handleStartInterview}
            loading={starting}
          />
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Interview Copilot Arena.
      </footer>
    </div>
  );
}
