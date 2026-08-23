import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, FileCheck } from 'lucide-react';
import { api } from '../services/api';

export function SubmissionModal({ assignment, group, isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [openedOneDrive, setOpenedOneDrive] = useState(false);
  const [certifiedUpload, setCertifiedUpload] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !assignment) return null;

  const handleOpenOneDrive = () => {
    window.open(assignment.onedrive_link, '_blank');
    setOpenedOneDrive(true);
  };

  const handleNextStep = () => {
    if (!openedOneDrive && !certifiedUpload) {
      setError('Please click the OneDrive link to open the submission folder and certify your file upload.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirmSubmission = async () => {
    if (!certifiedUpload) {
      setError('You must check the confirmation checkbox declaring your external OneDrive upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.confirmSubmission({
        assignmentId: assignment.id,
        notes: notes.trim()
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to confirm submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl glass-panel">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Two-Step Submission Verification</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">{assignment.title}</h2>
          <p className="text-xs text-slate-400 mt-1">Group: <span className="text-indigo-300 font-semibold">{group?.name}</span></p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
          <div className={`flex items-center space-x-2 text-xs font-bold ${step === 1 ? 'text-indigo-400' : 'text-emerald-400'}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {step === 1 ? '1' : <CheckCircle2 className="h-4 w-4" />}
            </span>
            <span>Step 1: External OneDrive Upload</span>
          </div>

          <ArrowRight className="h-4 w-4 text-slate-600" />

          <div className={`flex items-center space-x-2 text-xs font-bold ${step === 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              2
            </span>
            <span>Step 2: Confirm Submission</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1 CONTENT */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs leading-relaxed text-indigo-200">
              <p className="font-semibold text-white mb-1">Instructions:</p>
              Assignments are collected externally via professor shared OneDrive links. Click the button below to open the OneDrive folder and upload your group's completed work.
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <button
                type="button"
                onClick={handleOpenOneDrive}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all text-sm mb-3"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open OneDrive Submission Folder</span>
              </button>
              {openedOneDrive ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>OneDrive folder link accessed</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Click to open OneDrive in a new tab</span>
              )}
            </div>

            <label className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={certifiedUpload}
                onChange={(e) => setCertifiedUpload(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300 leading-normal">
                I certify that our group (<strong className="text-white">{group?.name}</strong>) has uploaded our completed assignment files to the designated OneDrive folder.
              </span>
            </label>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={!certifiedUpload}
              className="w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all text-xs disabled:opacity-50"
            >
              Proceed to Confirmation (Step 2)
            </button>
          </div>
        )}

        {/* STEP 2 CONTENT */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs leading-relaxed text-emerald-200">
              <div className="flex items-center space-x-2 font-bold text-emerald-300 mb-1">
                <FileCheck className="h-4 w-4" />
                <span>Final Two-Step Declaration</span>
              </div>
              By clicking "Confirm Submission", you formally confirm to the professor that your group submission is final.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Submission Notes / Remarks (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Uploaded PDF report and source zip file as Team CyberPulse_Assignment1.zip"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-all"
              >
                Back to Step 1
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all text-xs disabled:opacity-50"
              >
                {loading ? 'Confirming Submission...' : 'Yes, I Have Submitted'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
