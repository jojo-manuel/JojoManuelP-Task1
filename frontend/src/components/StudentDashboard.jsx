import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GroupManager } from './GroupManager';
import { SubmissionModal } from './SubmissionModal';
import { BookOpen, ExternalLink, CheckCircle2, Clock, AlertCircle, Award, BarChart3, Lock, ShieldCheck } from 'lucide-react';

export function StudentDashboard() {
  const { user, group, refreshProfile } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [group]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await api.getAssignments();
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error('Failed to fetch assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirmModal = (asg) => {
    setSelectedAssignment(asg);
    setShowSubModal(true);
  };

  // Calculate visual completion percentage
  const totalAssigned = assignments.length;
  const confirmedSubmissions = assignments.filter(a => a.submission && a.submission.confirmed).length;
  const completionPercentage = totalAssigned > 0 ? Math.round((confirmedSubmissions / totalAssigned) * 100) : 0;

  // Determine Completion Badge Tier
  let badgeTier = { label: 'Getting Started', color: 'bg-slate-800 text-slate-400 border-slate-700' };
  if (completionPercentage === 100 && totalAssigned > 0) {
    badgeTier = { label: 'Master Achiever (100%)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  } else if (completionPercentage >= 50) {
    badgeTier = { label: 'On Track', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Visual Progress Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-900/50 via-slate-900 to-purple-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl glass-panel relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
                <BarChart3 className="h-4 w-4" />
                <span>Group Completion Progress</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {group ? group.name : 'Join a Group to Track Progress'}
              </h2>
            </div>

            <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center space-x-1.5 ${badgeTier.color}`}>
              <Award className="h-3.5 w-3.5" />
              <span>{badgeTier.label}</span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Submitted: {confirmedSubmissions} of {totalAssigned} Assignments</span>
              <span className="text-indigo-400 font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Group Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl glass-panel flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Group Status</div>
            <div className="text-xl font-bold text-white">
              {group ? group.name : 'Single Student'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {group ? `${group.members?.length || 1} Members in team` : 'Create or join a group below to start submitting.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Team Code:</span>
            <span className="font-mono text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
              {group ? group.code || 'ACTIVE' : 'NO GROUP'}
            </span>
          </div>
        </div>
      </div>

      {/* Student Group Manager Component */}
      <GroupManager onGroupUpdated={fetchAssignments} />

      {/* Assignments Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl glass-panel">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Course Assignments</h2>
              <p className="text-xs text-slate-400">Review professor OneDrive links and confirm submission verification.</p>
            </div>
          </div>

          <button
            onClick={fetchAssignments}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading course assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No assignments posted at this time.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((asg) => {
              const isSubmitted = asg.submission && asg.submission.confirmed;
              const dueDate = new Date(asg.due_date);
              const isPastDue = new Date() > dueDate && !isSubmitted;

              return (
                <div
                  key={asg.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSubmitted
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : isPastDue
                      ? 'bg-red-950/20 border-red-800/40'
                      : 'bg-slate-950/60 border-slate-800/80 glass-panel-hover'
                  }`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {asg.target_type === 'SPECIFIC_GROUPS' ? 'Targeted Assignment' : 'All Students'}
                      </span>

                      {isSubmitted ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Submitted & Confirmed</span>
                        </span>
                      ) : isPastDue ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold flex items-center space-x-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Overdue</span>
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">{asg.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">{asg.description}</p>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between border-t border-slate-800/60 pt-3">
                      <span>Due Date:</span>
                      <span className="font-semibold text-slate-200">{dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <a
                        href={asg.onedrive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                        <span>OneDrive Link</span>
                      </a>

                      {!group ? (
                        <button
                          disabled
                          title="Form a group to submit"
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed flex items-center space-x-1"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Group Required</span>
                        </button>
                      ) : isSubmitted ? (
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 cursor-default"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Confirmed</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenConfirmModal(asg)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Confirm Submission</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Two Step Verification Submission Modal */}
      <SubmissionModal
        assignment={selectedAssignment}
        group={group}
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        onSuccess={() => {
          fetchAssignments();
          refreshProfile();
        }}
      />

    </div>
  );
}
