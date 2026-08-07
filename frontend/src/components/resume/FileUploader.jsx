import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { resumeService } from '../../services/resumeService';

export default function FileUploader({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRef = useRef(null);

  const validateFile = (file) => {
    setError('');
    setSuccessMsg('');

    if (!file) return false;

    // Validate PDF Extension
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file type. Only PDF files are supported.');
      return false;
    }

    // Validate Max Size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File size exceeds the 10MB limit.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError('');
    setSuccessMsg('');

    try {
      // Step 1: Upload PDF File
      const uploadRes = await resumeService.uploadResume(selectedFile, (pct) => {
        setProgress(pct);
      });

      const resumeId = uploadRes.resume_id;

      // Step 2: Trigger AI Parsing Pipeline
      setUploading(false);
      setParsing(true);
      
      const parseRes = await resumeService.parseResume(resumeId);

      setSuccessMsg('Resume uploaded & parsed successfully with Gemini AI!');
      setParsing(false);

      if (onUploadSuccess) {
        onUploadSuccess(parseRes.resume || uploadRes.resume);
      }
    } catch (err) {
      setUploading(false);
      setParsing(false);
      const msg = err.response?.data?.error || err.message || 'Failed to upload or parse resume.';
      setError(msg);
    }
  };

  return (
    <div className="w-full">
      {/* Drag & Drop Container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={`glass-panel p-8 md:p-12 border-2 border-dashed text-center transition-all cursor-pointer relative ${
          dragActive
            ? 'border-brand-cyan bg-brand-cyan/10 glow-cyan-sm'
            : selectedFile
            ? 'border-brand-indigo/80 bg-slate-900/90'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-indigo/20 to-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center glow-cyan-sm">
              <UploadCloud className="w-8 h-8 text-brand-cyan" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                Drag & Drop your Resume PDF here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports standard PDF resumes up to <span className="text-brand-cyan font-mono font-bold">10MB</span>
              </p>
            </div>
            <button
              type="button"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              Browse PDF File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center space-x-3 bg-slate-900 p-4 rounded-xl border border-slate-800 w-full max-w-md">
              <FileText className="w-8 h-8 text-brand-indigo shrink-0" />
              <div className="flex-1 text-left truncate">
                <p className="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!uploading && !parsing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Action Upload & Parse CTA */}
            {!uploading && !parsing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadAndParse();
                }}
                className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-lg glow-cyan-sm text-xs flex items-center space-x-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upload & Extract with Gemini AI</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress & Status Indicators */}
      {uploading && (
        <div className="mt-4 p-4 glass-panel border border-slate-800">
          <div className="flex justify-between text-xs text-slate-300 font-mono mb-2">
            <span>Uploading PDF file...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-indigo to-brand-cyan h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {parsing && (
        <div className="mt-4 p-4 glass-panel border border-slate-800 flex items-center space-x-3">
          <Loader2 className="w-5 h-5 text-brand-cyan animate-spin shrink-0" />
          <div className="text-xs text-slate-300">
            <span className="font-bold text-brand-cyan">Gemini AI Active:</span> Extracting skills, work experience, education & contacts...
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
          <p className="text-xs text-rose-300 font-medium">{error}</p>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0" />
          <p className="text-xs text-emerald-300 font-medium">{successMsg}</p>
        </div>
      )}
    </div>
  );
}
