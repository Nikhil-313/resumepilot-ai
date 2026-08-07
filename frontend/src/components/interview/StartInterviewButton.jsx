import React from 'react';
import { Sparkles, Play, Loader2 } from 'lucide-react';

export default function StartInterviewButton({ onClick, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full py-4 px-6 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-xl glow-cyan-sm transition-all duration-200 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          <span>Initializing Session...</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-white" />
          <span>Start AI Mock Interview</span>
          <Sparkles className="w-4 h-4 text-cyan-200 ml-1" />
        </>
      )}
    </button>
  );
}
