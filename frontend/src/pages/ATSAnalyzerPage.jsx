import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import { atsService } from '../services/atsService';
import { resumeService } from '../services/resumeService';
import {
  Sparkles,
  Target,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Loader2,
  AlertCircle,
  Cpu,
  Layers,
  ArrowRight,
  History,
  Eye,
  Trash2,
  Calendar,
  Building2
} from 'lucide-react';

export default function ATSAnalyzerPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  // ATS History States
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await atsService.getHistory();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load ATS history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingResumes(true);
        const [resumeData] = await Promise.all([
          resumeService.getAllResumes().catch(() => ({ resumes: [] })),
          loadHistory(),
        ]);

        const userResumes = resumeData.resumes || [];
        setResumes(userResumes);
        if (userResumes.length > 0) {
          setSelectedResumeId(userResumes[0].id);
        }
      } catch (err) {
        setError('Failed to fetch uploaded resumes.');
      } finally {
        setLoadingResumes(false);
      }
    };

    initData();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedResumeId) {
      setError('Please select a resume to analyze.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setAnalyzing(true);
    setReport(null);

    try {
      const payload = {
        resume_id: selectedResumeId,
        job_description: jobDescription,
        job_title: jobTitle || 'Target Role',
        company_name: companyName || '',
      };

      const res = await atsService.analyzeResume(payload);
      setReport(res.analysis);
      // Automatically refresh history list after new analysis
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to run ATS analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteReport = async (analysisId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this ATS report?')) return;

    setDeletingId(analysisId);
    try {
      await atsService.deleteReport(analysisId);
      if (report && report.id === analysisId) {
        setReport(null);
      }
      await loadHistory();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const getMatchBadge = (score) => {
    if (score >= 80) return { label: 'High Match candidate', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (score >= 65) return { label: 'Moderate Match', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    return { label: 'Low Match - Needs Optimization', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="glass-panel p-6 md:p-8 mb-8 border border-slate-800/90 relative print:hidden">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ATS Compatibility Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            ATS Resume Scanner & JD Matcher
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Compare your resume against any target Job Description to calculate keyword density, skill overlap, ATS compatibility score, and receive 1-click AI improvement recommendations.
          </p>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-black">ResumePilot AI - ATS Compatibility Report</h1>
          <p className="text-sm text-gray-600">Target Role: {report?.job_title} {report?.company_name && `at ${report?.company_name}`}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 print:hidden">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* 2-Column Split Workspace: Form on Left vs Report on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form Column & History List */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            {/* ATS Config Form */}
            <form onSubmit={handleAnalyze} className="glass-panel p-6 border border-slate-800 space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Target className="w-4 h-4 text-brand-indigo" />
                <span>Configure ATS Scanner</span>
              </h2>

              {/* Select Resume */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Uploaded Resume</label>
                {loadingResumes ? (
                  <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-500 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
                    <span>Loading resumes...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-400">
                    No uploaded resumes found. Please upload a resume first.
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo cursor-pointer font-medium"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                        {r.filename} ({new Date(r.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target Job Title & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Stripe"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                  />
                </div>
              </div>

              {/* Job Description Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Description (JD)</label>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description text here..."
                  className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-indigo transition-all font-sans leading-relaxed resize-y"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={analyzing || resumes.length === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-lg glow-cyan-sm text-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Auditing ATS Compatibility...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run ATS Compatibility Scan</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Previous ATS Reports History Section */}
            <div className="glass-panel p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <History className="w-4 h-4 text-brand-cyan" />
                  <span>Previous ATS Reports ({history.length})</span>
                </h2>
                {loadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />}
              </div>

              {loadingHistory && history.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800/80">
                  No previous ATS scans found.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {history.map((item) => {
                    const isSelected = report?.id === item.id;
                    const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <div
                        key={item.id}
                        onClick={() => setReport(item)}
                        className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-brand-indigo/15 border-brand-indigo text-white ring-1 ring-brand-indigo'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white truncate max-w-[180px]">
                              {item.job_title}
                            </h4>
                            {item.company_name && (
                              <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-500" />
                                <span>{item.company_name}</span>
                              </p>
                            )}
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-brand-cyan shrink-0">
                            {item.ats_score}% ATS
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{dateStr}</span>
                          </span>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReport(item);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center space-x-1 transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteReport(item.id, e)}
                              disabled={deletingId === item.id}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-md border border-transparent hover:border-slate-800 transition-all"
                              title="Delete Report"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Results Column */}
          <div className="lg:col-span-7">
            {analyzing ? (
              /* Loading State */
              <div className="glass-panel p-12 text-center border border-slate-800 flex flex-col items-center justify-center my-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm mb-6 animate-pulse">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gemini AI ATS Scanner Active...</h3>
                <p className="text-xs text-brand-cyan font-mono animate-pulse mb-4">
                  Calculating keyword density, skill overlap & formatting score...
                </p>
                <div className="w-full max-w-xs bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-brand-indigo to-brand-cyan h-2 rounded-full animate-pulse-slow w-full" />
                </div>
              </div>
            ) : !report ? (
              /* Empty Initial State */
              <div className="glass-panel p-12 text-center border border-slate-800/90 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
                  <FileText className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No ATS Scan Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Select your resume, paste the target Job Description on the left, and click "Run ATS Compatibility Scan" or view a previous scan from your history below.
                </p>
              </div>
            ) : (
              /* Full ATS Report View */
              <div className="space-y-6">
                {/* 1. Overall Score Banner */}
                <div className="glass-panel p-6 border border-slate-800/90 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center space-x-5">
                      <div className="w-20 h-20 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                        <span className="text-2xl font-extrabold text-white">{report.ats_score}%</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">ATS MATCH</span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getMatchBadge(report.ats_score).color}`}>
                            {getMatchBadge(report.ats_score).label}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                          {report.job_title} {report.company_name && `at ${report.company_name}`}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Resume: {report.resume_filename}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-all shrink-0 print:hidden"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {/* Score Breakdown Bar */}
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block">KEYWORD MATCH</span>
                      <span className="text-sm font-bold text-brand-cyan">{report.keyword_match_score}%</span>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block">EXPERIENCE MATCH</span>
                      <span className="text-sm font-bold text-brand-indigo">{report.experience_match_score}%</span>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block">FORMAT & STRUCTURE</span>
                      <span className="text-sm font-bold text-brand-emerald">{report.formatting_score}%</span>
                    </div>
                  </div>
                </div>

                {/* 2. Matching & Missing Skills Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-5 border border-emerald-500/20 bg-emerald-500/5">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
                      <span>Matching Skills Found ({report.matching_skills?.length || 0})</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(report.matching_skills || []).map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-5 border border-rose-500/20 bg-rose-500/5">
                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-brand-rose shrink-0" />
                      <span>Missing Skills Needed ({report.missing_skills?.length || 0})</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(report.missing_skills || []).map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Matching & Missing Keywords Matrix */}
                <div className="glass-panel p-6 border border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-brand-cyan shrink-0" />
                    <span>Job Description Keyword Density Analysis</span>
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 block mb-2">IDENTIFIED MATCHING KEYWORDS</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(report.matching_keywords || []).map((kw, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-brand-cyan">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-slate-400 block mb-2">CRITICAL MISSING KEYWORDS</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(report.missing_keywords || []).map((kw, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-rose-400">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Section-by-Section Diagnostic Notes */}
                {report.section_analysis && (
                  <div className="glass-panel p-6 border border-slate-800 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-brand-indigo shrink-0" />
                      <span>Section-by-Section Audit</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="font-bold text-slate-200 block mb-1">Skills Section</span>
                        <p className="text-slate-400 leading-relaxed">{report.section_analysis.skills_section}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="font-bold text-slate-200 block mb-1">Experience Section</span>
                        <p className="text-slate-400 leading-relaxed">{report.section_analysis.experience_section}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="font-bold text-slate-200 block mb-1">Projects Section</span>
                        <p className="text-slate-400 leading-relaxed">{report.section_analysis.projects_section}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="font-bold text-slate-200 block mb-1">Education Section</span>
                        <p className="text-slate-400 leading-relaxed">{report.section_analysis.education_section}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. AI Recommendations Action Steps */}
                {report.improvements && report.improvements.length > 0 && (
                  <div className="glass-panel p-6 border border-brand-indigo/30 bg-brand-indigo/5 space-y-3">
                    <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
                      <span>Personalized AI Action Steps to Reach 90%+ ATS Score</span>
                    </h3>
                    <div className="space-y-2">
                      {report.improvements.map((imp, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2">
                          <span className="px-2 py-0.5 rounded bg-brand-indigo/20 text-brand-indigo font-mono font-bold text-[10px] shrink-0">
                            Fix {idx + 1}
                          </span>
                          <span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900 print:hidden">
        ResumePilot AI &copy; 2026. ATS Compatibility Studio.
      </footer>
    </div>
  );
}
