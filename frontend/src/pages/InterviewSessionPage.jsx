import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { interviewService } from '../services/interviewService';
import {
  Sparkles,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  HelpCircle,
  Save,
  Flag
} from 'lucide-react';

export default function InterviewSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  // Fetch session data on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getSession(sessionId);
        const sess = data.session;
        setSession(sess);
        setQuestions(sess.questions || []);

        // Initialize local answers state from DB records
        const initialAnswers = {};
        (sess.questions || []).forEach((q) => {
          initialAnswers[q.id] = q.candidate_answer || '';
        });
        setAnswers(initialAnswers);

        if (sess.status === 'completed') {
          setIsCompleted(true);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load interview session.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const currentQuestion = questions[currentIndex];

  // Helper to save current question's answer to backend
  const saveCurrentAnswer = async () => {
    if (!currentQuestion) return;
    const currentAns = answers[currentQuestion.id] || '';
    setSavingAnswer(true);
    try {
      await interviewService.submitAnswer(sessionId, currentQuestion.id, currentAns);
    } catch (err) {
      console.error('Failed to auto-save answer:', err);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleNext = async () => {
    await saveCurrentAnswer();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = async () => {
    await saveCurrentAnswer();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswerChange = (val) => {
    if (!currentQuestion) return;
    setAnswers({
      ...answers,
      [currentQuestion.id]: val,
    });
  };

  const handleFinish = async () => {
    await saveCurrentAnswer();
    if (!window.confirm('Are you sure you want to finish this mock interview session?')) return;

    setFinishing(true);
    setError('');
    try {
      await interviewService.finishSession(sessionId);
      setIsCompleted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to finish interview.');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Initializing AI Interview Arena...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto w-full p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-brand-rose mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Session Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/interview')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
          >
            Back to Interview Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 z-10">
        {/* Top Header Card */}
        <div className="glass-panel p-6 mb-6 border border-slate-800/90 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-white">{session?.role}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-semibold">
                    {session?.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Question {currentIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            {/* Timer Placeholder */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
              <Clock className="w-4 h-4 text-brand-cyan animate-pulse" />
              <span className="text-xs font-mono font-semibold text-slate-200">15:00</span>
              <span className="text-[10px] text-slate-500 font-mono">TIMER</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
            <div
              className="bg-gradient-to-r from-brand-indigo to-brand-cyan h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Completion Banner Modal */}
        {isCompleted ? (
          <div className="glass-panel p-8 text-center border border-emerald-500/30 bg-emerald-500/5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-brand-emerald">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Mock Interview Session Completed!</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
              Great job! All {questions.length} questions have been answered and saved to your candidate history.
            </p>
            <button
              onClick={() => navigate('/interview')}
              className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm"
            >
              Start Another Mock Interview
            </button>
          </div>
        ) : (
          /* Active Question Arena */
          <div className="space-y-6">
            {/* Question Card */}
            <div className="glass-panel p-6 md:p-8 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-brand-cyan">
                  {currentQuestion?.category || 'Technical Question'}
                </span>
                {savingAnswer && (
                  <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                    <Save className="w-3 h-3 animate-spin" />
                    <span>Auto-saving answer...</span>
                  </span>
                )}
              </div>

              <h3 className="text-lg md:text-xl font-bold text-white leading-relaxed mb-4">
                {currentQuestion?.question_text}
              </h3>

              {/* STAR Method Hint Pill */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 text-xs text-slate-400">
                <HelpCircle className="w-4 h-4 text-brand-indigo shrink-0" />
                <span>
                  <strong className="text-slate-200">STAR Method Tip:</strong> Structure response with Situation, Task, Action & Result.
                </span>
              </div>
            </div>

            {/* Candidate Answer Input Card */}
            <div className="glass-panel p-6 border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Your Answer Response
              </label>
              <textarea
                rows={7}
                value={answers[currentQuestion?.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your structured response here..."
                className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-800 flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={finishing}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  {finishing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  ) : (
                    <Flag className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Finish Interview</span>
                </button>

                {currentIndex < questions.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm flex items-center space-x-2 transition-all"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. Live AI Mock Interview Arena.
      </footer>
    </div>
  );
}
