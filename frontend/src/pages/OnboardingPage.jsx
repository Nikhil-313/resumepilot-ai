import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, Briefcase, Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { TARGET_ROLES, EXPERIENCE_LEVELS } from '../utils/constants';

export default function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [targetRole, setTargetRole] = useState(user?.target_role || 'Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || 'fresher');
  const [customSkill, setCustomSkill] = useState('');
  const [primarySkills, setPrimarySkills] = useState(user?.primary_skills || ['Python', 'React', 'SQL']);
  const [submitting, setSubmitting] = useState(false);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !primarySkills.includes(customSkill.trim())) {
      setPrimarySkills([...primarySkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setPrimarySkills(primarySkills.filter((s) => s !== skillToRemove));
  };

  const handleCompleteOnboarding = async () => {
    setSubmitting(true);
    try {
      await updateProfile({
        target_role: targetRole,
        experience_level: experienceLevel,
        primary_skills: primarySkills,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Glow Backgrounds */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-indigo/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl glass-panel p-8 md:p-12 z-10 border border-slate-800/90 shadow-2xl">
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Personalization</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Customize Your Career Profile
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Welcome, <span className="text-slate-200 font-semibold">{user?.full_name || 'Candidate'}</span>! Tell us your career targets so Gemini AI can tailor resume scoring and mock interviews.
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1: Target Role Selection */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              <Target className="w-4 h-4 text-brand-indigo" />
              <span>Target Role</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TARGET_ROLES.map((role) => {
                const selected = targetRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex flex-col justify-between h-20 ${
                      selected
                        ? 'bg-brand-indigo/20 border-brand-indigo text-white ring-1 ring-brand-indigo shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="leading-snug">{role}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-brand-cyan self-end" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Experience Level Selection */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              <Briefcase className="w-4 h-4 text-brand-cyan" />
              <span>Experience Level</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPERIENCE_LEVELS.map((exp) => {
                const selected = experienceLevel === exp.id;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setExperienceLevel(exp.id)}
                    className={`p-3.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                      selected
                        ? 'bg-brand-cyan/20 border-brand-cyan text-white ring-1 ring-brand-cyan shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{exp.label}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-brand-cyan" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Key Tech Stack Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Primary Tech Stack / Skills
            </label>
            <form onSubmit={handleAddSkill} className="flex space-x-2 mb-3">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Add skill (e.g. Node.js, PyTorch, Docker)"
                className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-indigo"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                + Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {primarySkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-400 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Finish CTA */}
          <button
            type="button"
            onClick={handleCompleteOnboarding}
            disabled={submitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-xl glow-cyan-sm transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Saving Profile Settings...</span>
              </>
            ) : (
              <>
                <span>Launch My Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
