import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { interviewService } from '../services/interviewService';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Printer,
  RotateCcw,
  LayoutDashboard,
  Loader2,
  AlertCircle,
  Code,
  MessageSquare,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function InterviewReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getReport(sessionId);
        setReport(data.report);

        // Expand first question by default
        if (data.report?.questions?.length > 0) {
          setExpandedQuestions({ [data.report.questions[0].id]: true });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch interview evaluation report.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  const toggleExpand = (qId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Loading performance scorecard report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto w-full p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-brand-rose mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report Load Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overallScore = report.overall_score || 0;
  const getHireBadge = (score) => {
    if (score >= 80) return { label: 'Strong Hire Candidate', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (score >= 65) return { label: 'Qualified Candidate', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    return { label: 'Needs Practice & Improvement', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  };
  const badgeInfo = getHireBadge(overallScore);

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 z-10 print:p-0 print:max-w-none">
        {/* Print-only Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-black">ResumePilot AI - Interview Scorecard Report</h1>
          <p className="text-sm text-gray-600">Role: {report.role} | Difficulty: {report.difficulty}</p>
        </div>

        {/* Actions Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span>Interview Evaluation Report</span>
            <span>•</span>
            <span>{report.role}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-800 flex items-center space-x-1.5 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/interview')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Another</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm flex items-center space-x-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* 1. Top Overall Performance Score Banner */}
        <div className="glass-panel p-6 md:p-8 mb-6 border border-slate-800/90 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              {/* Circular Score Badge */}
              <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                <span className="text-3xl font-extrabold text-white">{overallScore}</span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">out of 100</span>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeInfo.color}`}>
                    {badgeInfo.label}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {report.role} Interview Evaluation
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Difficulty: {report.difficulty} • Total Questions Evaluated: {report.total_questions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Category Metrics Grid Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel p-4 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Technical Skills</span>
              <Code className="w-4 h-4 text-brand-cyan" />
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-white">{report.technical_score}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-cyan h-1.5 rounded-full" style={{ width: `${report.technical_score}%` }} />
            </div>
          </div>

          <div className="glass-panel p-4 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Communication</span>
              <MessageSquare className="w-4 h-4 text-brand-indigo" />
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-white">{report.communication_score}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-indigo h-1.5 rounded-full" style={{ width: `${report.communication_score}%` }} />
            </div>
          </div>

          <div className="glass-panel p-4 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Problem Solving</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-white">{report.problem_solving_score}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${report.problem_solving_score}%` }} />
            </div>
          </div>

          <div className="glass-panel p-4 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Confidence</span>
              <ShieldCheck className="w-4 h-4 text-brand-emerald" />
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-white">{report.confidence_score}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-emerald h-1.5 rounded-full" style={{ width: `${report.confidence_score}%` }} />
            </div>
          </div>
        </div>

        {/* 3. Strengths & Weaknesses Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-panel p-6 border border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
              <span>Key Strengths</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {(report.strengths_summary || []).map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brand-emerald font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-6 border border-amber-500/20 bg-amber-500/5">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-brand-amber shrink-0" />
              <span>Areas to Improve</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {(report.weaknesses_summary || []).map((wk, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brand-amber font-bold">•</span>
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. AI Recommendations Card */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="glass-panel p-6 border border-slate-800 mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>Personalized AI Recommendations</span>
            </h3>
            <div className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2">
                  <span className="px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan font-mono font-bold text-[10px] shrink-0">
                    Step {idx + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Per-Question Detailed Diagnostic Accordions */}
        <div className="space-y-4 mb-8">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-brand-indigo" />
            <span>Per-Question Evaluation Diagnostics</span>
          </h2>

          {(report.questions || []).map((q) => {
            const isExpanded = !!expandedQuestions[q.id];
            return (
              <div key={q.id} className="glass-panel border border-slate-800/90 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(q.id)}
                  className="w-full p-5 text-left flex items-center justify-between bg-slate-950/40 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-brand-cyan flex items-center justify-center shrink-0">
                      Q{q.question_number}
                    </span>
                    <span className="text-sm font-semibold text-white leading-snug">
                      {q.question_text}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-brand-cyan">
                      {q.score}/10
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-6 border-t border-slate-800/80 space-y-4 bg-slate-900/40">
                    {/* Candidate Answer */}
                    <div>
                      <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Your Submitted Response</span>
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed">
                        {q.candidate_answer || <span className="italic text-slate-500">No answer submitted.</span>}
                      </div>
                    </div>

                    {/* AI Feedback & Score Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 block">Technical</span>
                        <span className="text-xs font-bold text-brand-cyan">{q.technical_accuracy}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 block">Clarity</span>
                        <span className="text-xs font-bold text-brand-indigo">{q.communication_clarity}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 block">Completeness</span>
                        <span className="text-xs font-bold text-purple-400">{q.completeness}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 block">Confidence</span>
                        <span className="text-xs font-bold text-brand-emerald">{q.confidence_level}</span>
                      </div>
                    </div>

                    {/* Feedback Text */}
                    {q.feedback && (
                      <div className="p-4 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 text-xs text-slate-200">
                        <span className="font-bold text-brand-indigo block mb-1">AI Evaluator Feedback:</span>
                        {q.feedback}
                      </div>
                    )}

                    {/* Ideal Response Blueprint */}
                    {q.ideal_answer && (
                      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300">
                        <span className="font-bold text-brand-cyan block mb-1">Exemplary Ideal Response:</span>
                        <p className="leading-relaxed text-slate-400 font-sans">{q.ideal_answer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900 print:hidden">
        ResumePilot AI &copy; 2026. Performance Evaluation Scorecard.
      </footer>
    </div>
  );
}
