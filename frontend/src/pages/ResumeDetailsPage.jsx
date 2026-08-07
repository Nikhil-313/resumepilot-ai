import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { resumeService } from '../services/resumeService';
import {
  User as UserIcon,
  Mail,
  Phone,
  Link as LinkIcon,
  BookOpen,
  Briefcase,
  Code,
  Award,
  Globe,
  Sparkles,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function ResumeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [parsedData, setParsedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const fetchResumeDetails = async () => {
    try {
      setLoading(true);
      const data = await resumeService.getResumeById(id);
      setResume(data);
      setParsedData(data.parsed_json || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch resume details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchResumeDetails();
  }, [id]);

  const handleParseNow = async () => {
    setParsing(true);
    setError('');
    try {
      const res = await resumeService.parseResume(id);
      setParsedData(res.parsed_json);
      setResume(res.resume);
      setSuccessMsg('Resume parsed with Gemini AI!');
    } catch (err) {
      setError(err.response?.data?.error || 'Parsing failed.');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await resumeService.updateResume(id, parsedData);
      setResume(res.resume);
      setSuccessMsg('Resume details saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim()) {
      const currentSkills = parsedData.skills || [];
      if (!currentSkills.includes(newSkill.trim())) {
        setParsedData({ ...parsedData, skills: [...currentSkills, newSkill.trim()] });
      }
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = parsedData.skills || [];
    setParsedData({
      ...parsedData,
      skills: currentSkills.filter((s) => s !== skillToRemove),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Loading resume details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 z-10">
        {/* Top Navigation & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            {!resume?.is_parsed && (
              <button
                type="button"
                onClick={handleParseNow}
                disabled={parsing}
                className="px-4 py-2 bg-brand-indigo hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
              >
                {parsing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Extract with Gemini AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg glow-cyan-sm transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Resume Changes</span>
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="glass-panel p-6 mb-8 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {resume?.filename}
              </h1>
              {resume?.is_parsed && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                  AI Parsed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              ID: {resume?.id} • Uploaded on {new Date(resume?.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0" />
            <p className="text-xs text-emerald-300 font-medium">{successMsg}</p>
          </div>
        )}

        {/* Editable Resume Cards */}
        <div className="space-y-6">
          {/* Section 1: Personal Info & Links */}
          <div className="glass-panel p-6 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-brand-cyan" />
              <span>Personal Information & Links</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={parsedData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={parsedData.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={parsedData.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={parsedData.linkedin || ''}
                  onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={parsedData.github || ''}
                  onChange={(e) => handleFieldChange('github', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Portfolio / Website</label>
                <input
                  type="text"
                  value={parsedData.portfolio || ''}
                  onChange={(e) => handleFieldChange('portfolio', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Summary */}
          <div className="glass-panel p-6 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-brand-indigo" />
              <span>Professional Summary</span>
            </h2>
            <textarea
              rows={3}
              value={parsedData.summary || ''}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
            />
          </div>

          {/* Section 3: Skills */}
          <div className="glass-panel p-6 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Code className="w-4 h-4 text-brand-cyan" />
              <span>Extracted Skills Tag Cloud</span>
            </h2>

            <form onSubmit={handleAddSkill} className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add new skill (e.g. AWS, GraphQL, Docker)"
                className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700"
              >
                + Add Skill
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {(parsedData.skills || []).map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-brand-cyan"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-500 hover:text-rose-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Work Experience */}
          <div className="glass-panel p-6 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-brand-emerald" />
              <span>Work Experience</span>
            </h2>

            {(parsedData.experience || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No work experience entries extracted.</p>
            ) : (
              <div className="space-y-4">
                {parsedData.experience.map((exp, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company || ''}
                        onChange={(e) => {
                          const updated = [...parsedData.experience];
                          updated[idx].company = e.target.value;
                          handleFieldChange('experience', updated);
                        }}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-white font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={exp.role || ''}
                        onChange={(e) => {
                          const updated = [...parsedData.experience];
                          updated[idx].role = e.target.value;
                          handleFieldChange('experience', updated);
                        }}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Duration"
                        value={exp.duration || ''}
                        onChange={(e) => {
                          const updated = [...parsedData.experience];
                          updated[idx].duration = e.target.value;
                          handleFieldChange('experience', updated);
                        }}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-400 font-mono"
                      />
                    </div>
                    {exp.bullets && (
                      <div className="space-y-1 pl-2">
                        {exp.bullets.map((b, bIdx) => (
                          <p key={bIdx} className="text-xs text-slate-300 font-sans leading-relaxed">
                            • {b}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Projects */}
          <div className="glass-panel p-6 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Code className="w-4 h-4 text-purple-400" />
              <span>Projects</span>
            </h2>

            {(parsedData.projects || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No project entries extracted.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedData.projects.map((proj, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title || ''}
                      onChange={(e) => {
                        const updated = [...parsedData.projects];
                        updated[idx].title = e.target.value;
                        handleFieldChange('projects', updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-bold text-white mb-2"
                    />
                    <textarea
                      rows={2}
                      placeholder="Description"
                      value={proj.description || ''}
                      onChange={(e) => {
                        const updated = [...parsedData.projects];
                        updated[idx].description = e.target.value;
                        handleFieldChange('projects', updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-300 mb-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Education */}
          <div className="glass-panel p-6 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-brand-indigo" />
              <span>Education</span>
            </h2>

            {(parsedData.education || []).map((edu, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-2">
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree || ''}
                  onChange={(e) => {
                    const updated = [...parsedData.education];
                    updated[idx].degree = e.target.value;
                    handleFieldChange('education', updated);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={edu.institution || ''}
                  onChange={(e) => {
                    const updated = [...parsedData.education];
                    updated[idx].institution = e.target.value;
                    handleFieldChange('education', updated);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-300"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={edu.year || ''}
                  onChange={(e) => {
                    const updated = [...parsedData.education];
                    updated[idx].year = e.target.value;
                    handleFieldChange('education', updated);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-400 font-mono"
                />
                <input
                  type="text"
                  placeholder="GPA"
                  value={edu.gpa || ''}
                  onChange={(e) => {
                    const updated = [...parsedData.education];
                    updated[idx].gpa = e.target.value;
                    handleFieldChange('education', updated);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-400 font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. Editable Resume Studio.
      </footer>
    </div>
  );
}
