import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import { careerService } from '../services/careerService';
import {
  Sparkles,
  Compass,
  Target,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Cpu,
  Layers,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Briefcase,
  Check,
  Play,
  RotateCcw,
  Trash2,
  FileText,
  MessageSquare,
  ChevronRight
} from 'lucide-react';

export default function CareerPlannerPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState('Software Engineer');
  const [error, setError] = useState('');
  const [updatingGoalId, setUpdatingGoalId] = useState(null);
  const [updatingSkillId, setUpdatingSkillId] = useState(null);

  const fetchCareerPlan = async () => {
    try {
      setLoading(true);
      const data = await careerService.getPlan();
      if (data && data.plan) {
        setPlan(data.plan);
        if (data.plan.target_role) {
          setTargetRoleInput(data.plan.target_role);
        }
      } else {
        setPlan(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch career plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareerPlan();
  }, []);

  const handleGeneratePlan = async () => {
    if (plan && !window.confirm('Regenerate Career Plan? This will update your goals and skill roadmap with fresh AI insights.')) {
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const res = await careerService.generatePlan({ target_role: targetRoleInput });
      setPlan(res.plan);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate AI career plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGoalStatusChange = async (goalId, newStatus) => {
    setUpdatingGoalId(goalId);
    try {
      const res = await careerService.updateGoalStatus(goalId, newStatus);
      // Update local state
      setPlan((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === goalId ? { ...g, status: newStatus } : g)),
      }));
    } catch (err) {
      alert('Failed to update goal status.');
    } finally {
      setUpdatingGoalId(null);
    }
  };

  const handleSkillStatusChange = async (skillId, newStatus) => {
    setUpdatingSkillId(skillId);
    try {
      const res = await careerService.updateRoadmapStatus(skillId, newStatus);
      // Update local state
      setPlan((prev) => ({
        ...prev,
        roadmap: prev.roadmap.map((s) => (s.id === skillId ? { ...s, status: newStatus } : s)),
      }));
    } catch (err) {
      alert('Failed to update roadmap skill status.');
    } finally {
      setUpdatingSkillId(null);
    }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm('Are you sure you want to delete your current AI Career Development Plan?')) return;
    try {
      await careerService.deletePlan();
      setPlan(null);
    } catch (err) {
      alert('Failed to delete career plan.');
    }
  };

  const getReadinessBadge = (score) => {
    if (score >= 80) return { label: 'High Career Readiness', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (score >= 60) return { label: 'Mid-Level Competent', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    return { label: 'Needs Active Upskilling', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10">
        {/* Top Header Banner */}
        <div className="glass-panel p-6 md:p-8 mb-8 border border-slate-800/90 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>AI Career Development & Skill Roadmap</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Personalized Career Architect
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Synthesize cross-module data from your resume, ATS scans, mock interview evaluations, and job matches to build your customized career progression roadmap.
            </p>
          </div>

          {/* Target Role Input & CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <input
              type="text"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="Target Job Title"
              className="px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
            />

            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-lg glow-cyan-sm text-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Career Profile...</span>
                </>
              ) : plan ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Regenerate Career Plan</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate My Career Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* Generating AI State */}
        {generating ? (
          <div className="glass-panel p-12 text-center border border-slate-800 flex flex-col items-center justify-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm mb-6 animate-pulse">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI is analyzing your career profile...</h3>
            <p className="text-xs text-brand-cyan font-mono animate-pulse mb-6 max-w-md">
              Synthesizing resume skills, ATS keyword gaps, mock interview feedback, and job market requirements for {targetRoleInput}...
            </p>
            <div className="w-full max-w-xs bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-brand-indigo to-brand-cyan h-2 rounded-full animate-pulse-slow w-full" />
            </div>
          </div>
        ) : loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
            <p className="text-xs text-slate-500 font-mono">Loading personalized career roadmap...</p>
          </div>
        ) : !plan ? (
          /* Empty Initial State */
          <div className="glass-panel p-12 text-center border border-slate-800/90 flex flex-col items-center justify-center my-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
              <Compass className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Active Career Plan Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Enter your target job role above and click <strong>"Generate My Career Plan"</strong> to analyze your profile and construct a personalized skill roadmap.
            </p>
            <button
              onClick={handleGeneratePlan}
              className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm"
            >
              Generate My Career Plan 🚀
            </button>
          </div>
        ) : (
          /* Full AI Career Development Dashboard */
          <div className="space-y-8">
            {/* 1. Career Readiness Overview */}
            <div className="glass-panel p-6 md:p-8 border border-slate-800/90 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  {/* Readiness Score Gauge */}
                  <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                    <span className="text-3xl font-extrabold text-white">{plan.overall_readiness_score}%</span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">READINESS</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getReadinessBadge(plan.overall_readiness_score).color}`}>
                        {getReadinessBadge(plan.overall_readiness_score).label}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Target Role: {plan.target_role}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Current Experience Level: <strong className="text-slate-200">{plan.current_level}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDeletePlan}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded-xl text-xs border border-slate-800 flex items-center space-x-1.5 transition-all self-start md:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Career Plan</span>
                </button>
              </div>

              {/* Career Assessment Summary */}
              {plan.career_summary && (
                <div className="mt-6 pt-5 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider block mb-1">
                    AI Executive Career Assessment
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {plan.career_summary}
                  </p>
                </div>
              )}
            </div>

            {/* 2. Skill Gap Analysis & Verified Strengths Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verified Strengths */}
              <div className="glass-panel p-6 border border-emerald-500/20 bg-emerald-500/5">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
                  <span>Verified Candidate Strengths</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  {(plan.strengths || []).map((str, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-2">
                      <span className="text-brand-emerald font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Skill Gaps */}
              <div className="glass-panel p-6 border border-amber-500/20 bg-amber-500/5">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-brand-amber shrink-0" />
                  <span>Identified Skill Gaps for {plan.target_role}</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  {(plan.skill_gaps || []).map((gap, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{gap.skill}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          gap.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {gap.priority || 'High'} Priority
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{gap.why_it_matters}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Personalized Skill Roadmap Table / Card Matrix */}
            <div className="glass-panel p-6 border border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-brand-cyan" />
                <span>Personalized Skill Roadmap</span>
              </h3>

              <div className="space-y-3">
                {(plan.roadmap || []).map((item) => {
                  const isCompleted = item.status === 'completed';
                  const isInProgress = item.status === 'in_progress';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : isInProgress
                          ? 'bg-brand-indigo/10 border-brand-indigo/30'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-white">{item.skill_name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-brand-cyan">
                            {item.current_level} → {item.target_level}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.priority === 'High' ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{item.reason}</p>

                        {item.recommended_resources && item.recommended_resources.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500 font-mono">Resources:</span>
                            {item.recommended_resources.map((res, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-slate-300">
                                {res}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Action & Status Switcher */}
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{item.estimated_time || '2 weeks'}</span>
                        </span>

                        <select
                          value={item.status}
                          onChange={(e) => handleSkillStatusChange(item.id, e.target.value)}
                          disabled={updatingSkillId === item.id}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-indigo cursor-pointer"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed ✓</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Categorized Career Goals (Short-term, Medium-term, Long-term) */}
            <div className="glass-panel p-6 border border-slate-800 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Target className="w-4 h-4 text-brand-indigo" />
                <span>Strategic Career Goals</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Short-term', 'Medium-term', 'Long-term'].map((cat) => {
                  const catGoals = (plan.goals || []).filter((g) => g.category === cat);
                  return (
                    <div key={cat} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                      <h4 className="text-xs font-bold text-brand-cyan uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                        <span>{cat} Goals</span>
                        <span className="text-[10px] font-mono text-slate-500">{catGoals.length}</span>
                      </h4>

                      {catGoals.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic py-2">No goals specified.</p>
                      ) : (
                        catGoals.map((goal) => {
                          const isDone = goal.status === 'completed';
                          const isInProg = goal.status === 'in_progress';

                          return (
                            <div
                              key={goal.id}
                              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                                isDone
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : isInProg
                                  ? 'bg-brand-indigo/10 border-brand-indigo/30'
                                  : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-bold text-white leading-snug">{goal.title}</h5>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                  goal.priority === 'High' ? 'text-rose-400' : 'text-amber-400'
                                }`}>
                                  {goal.priority}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400 leading-relaxed">{goal.description}</p>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                                <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{goal.target_date || 'Target'}</span>
                                </span>

                                <select
                                  value={goal.status}
                                  onChange={(e) => handleGoalStatusChange(goal.id, e.target.value)}
                                  disabled={updatingGoalId === goal.id}
                                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] font-semibold text-slate-200 focus:outline-none cursor-pointer"
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed ✓</option>
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Recommended Projects Card Grid */}
            {plan.recommended_projects && plan.recommended_projects.length > 0 && (
              <div className="glass-panel p-6 border border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <span>Recommended Employability Projects</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.recommended_projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                      <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{proj.description}</p>
                      
                      {proj.skills_developed && proj.skills_developed.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.skills_developed.map((s, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded text-[10px] font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {proj.employability_impact && (
                        <p className="text-[10px] text-brand-cyan font-mono pt-1">
                          ★ Employability Impact: {proj.employability_impact}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Interview Preparation & Resume/ATS Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Interview Prep Recommendations */}
              <div className="glass-panel p-6 border border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-brand-indigo shrink-0" />
                  <span>Interview Preparation Focus Areas</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(plan.interview_prep_recommendations || []).map((rec, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2">
                      <span className="text-brand-indigo font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resume & ATS Optimization */}
              <div className="glass-panel p-6 border border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Resume & ATS Optimization Steps</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(plan.ats_resume_recommendations || []).map((rec, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2">
                      <span className="text-brand-cyan font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 7. Career Progression Trajectory Explanation */}
            {plan.career_progression_explanation && (
              <div className="glass-panel p-6 border border-slate-800 bg-slate-950/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Target Growth Trajectory (1-2 Year Outlook)</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {plan.career_progression_explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Career Development & Skill Roadmap Planner.
      </footer>
    </div>
  );
}
