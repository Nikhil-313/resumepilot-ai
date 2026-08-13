import React, { useEffect, useState, useRef } from 'react';
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
  Flag,
  Cpu
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
  const [evaluating, setEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState('Analyzing answer STAR structure...');
  const [error, setError] = useState('');

  // Dynamic Session Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState(null);
  const isFinishingRef = useRef(false); // Duplicate-submission protection ref

  // Duration calculation logic based on questions.length
  // 5 questions -> 15 min (900s), 10 questions -> 25 min (1500s), 15 questions -> 35 min (2100s)
  const calculateInitialSeconds = (count) => {
    if (!count || count <= 0) return 15 * 60;
    if (count === 5) return 15 * 60;
    if (count === 10) return 25 * 60;
    if (count === 15) return 35 * 60;
    // General fallback formula: 5 + count * 2 minutes
    const mins = 5 + (count * 2);
    return mins * 60;
  };

  // Fetch session data on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getSession(sessionId);
        const sess = data.session;
        setSession(sess);

        const loadedQuestions = sess.questions || [];
        setQuestions(loadedQuestions);

        // Initialize timer based on questions.length
        setTimeLeft(calculateInitialSeconds(loadedQuestions.length));

        // Initialize local answers state from DB records
        const initialAnswers = {};
        loadedQuestions.forEach((q) => {
          initialAnswers[q.id] = q.candidate_answer || '';
        });
        setAnswers(initialAnswers);

        // If already evaluated, jump directly to report page
        if (sess.is_evaluated || sess.overall_score > 0) {
          navigate(`/interview/report/${sessionId}`, { replace: true });
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
  }, [sessionId, navigate]);

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

  // Auto-finish handler when timer reaches 00:00
  const handleAutoFinish = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    await saveCurrentAnswer();
    setEvaluating(true);
    setError('');

    try {
      setEvalStep('Session time expired. Auto-evaluating responses...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      setEvalStep('Scoring communication clarity & completeness...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      setEvalStep('Generating personalized AI recommendations...');
      const evalRes = await interviewService.evaluateSession(sessionId);

      if (evalRes && evalRes.report) {
        navigate(`/interview/report/${sessionId}`);
      } else {
        throw new Error('Evaluation report missing.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to evaluate interview responses.');
      setEvaluating(false);
      isFinishingRef.current = false;
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (loading || evaluating || timeLeft === null || isFinishingRef.current) return;

    if (timeLeft <= 0) {
      handleAutoFinish();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [loading, evaluating, timeLeft]);

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
    if (!currentQuestion || timeLeft === 0 || evaluating) return;
    setAnswers({
      ...answers,
      [currentQuestion.id]: val,
    });
  };

  const handleFinish = async () => {
    if (isFinishingRef.current) return;

    await saveCurrentAnswer();
    if (!window.confirm('Are you sure you want to finish this interview and generate your AI evaluation report?')) return;

    isFinishingRef.current = true;
    setEvaluating(true);
    setError('');

    try {
      setEvalStep('Evaluating candidate technical accuracy...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      setEvalStep('Scoring communication clarity & completeness...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      setEvalStep('Generating personalized AI recommendations...');
      const evalRes = await interviewService.evaluateSession(sessionId);

      if (evalRes && evalRes.report) {
        navigate(`/interview/report/${sessionId}`);
      } else {
        throw new Error('Evaluation report missing.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to evaluate interview responses.');
      setEvaluating(false);
      isFinishingRef.current = false;
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '15:00';
    const totalSecs = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return `${mm}:${ss}`;
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

  if (evaluating) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto w-full p-8 flex flex-col items-center justify-center text-center my-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm mb-6 animate-pulse">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Gemini AI Evaluating Responses...</h2>
          <p className="text-xs text-brand-cyan font-mono animate-pulse mb-6">{evalStep}</p>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-cyan h-2 rounded-full animate-pulse-slow w-full" />
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Generating per-question scores, strengths, weaknesses & ideal responses...</p>
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
  const isExpired = timeLeft === 0;

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

            {/* Dynamic Real-Time Countdown Timer Badge */}
            {(() => {
              const isWarning = timeLeft !== null && timeLeft > 0 && timeLeft < 180; // < 3 mins

              let badgeStyle = "bg-slate-900 border-slate-800 text-slate-200";
              let iconStyle = "text-brand-cyan animate-pulse";
              let labelText = "TIMER";

              if (isExpired) {
                badgeStyle = "bg-rose-500/20 border-rose-500/40 text-rose-300";
                iconStyle = "text-rose-400";
                labelText = "TIME'S UP";
              } else if (isWarning) {
                badgeStyle = "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse";
                iconStyle = "text-amber-400";
                labelText = "FINAL MINS";
              }

              return (
                <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border shrink-0 transition-all ${badgeStyle}`}>
                  <Clock className={`w-4 h-4 ${iconStyle}`} />
                  <span className="text-xs font-mono font-bold tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[10px] font-mono font-semibold opacity-75">{labelText}</span>
                </div>
              );
            })()}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
            <div
              className="bg-gradient-to-r from-brand-indigo to-brand-cyan h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* Active Question Arena */}
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
              disabled={isExpired || evaluating}
              placeholder={isExpired ? "Time's up! Session submitted for AI evaluation." : "Type your structured response here..."}
              className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all font-sans leading-relaxed resize-y disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isExpired || evaluating}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-800 flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleFinish}
                disabled={isExpired || evaluating}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flag className="w-4 h-4 text-rose-400" />
                <span>Finish & Evaluate</span>
              </button>

              {currentIndex < questions.length - 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isExpired || evaluating}
                  className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. Live AI Mock Interview Arena.
      </footer>
    </div>
  );
}
