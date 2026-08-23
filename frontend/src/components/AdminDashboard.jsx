import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AssignmentFormModal } from './AssignmentFormModal';
import { AnalyticsPanel } from './AnalyticsPanel';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, ExternalLink, ShieldCheck, Search, Users, BookOpen, Clock } from 'lucide-react';

export function AdminDashboard({ activeTab, setActiveTab }) {
  const [overview, setOverview] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const data = await api.getAdminOverview();
        setOverview(data);
      } else if (activeTab === 'assignments') {
        const data = await api.getAssignments();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingAssignment(null);
    setShowAssignmentModal(true);
  };

  const handleEdit = (asg) => {
    setEditingAssignment(asg);
    setShowAssignmentModal(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${title}"?`)) return;
    try {
      await api.deleteAssignment(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  if (activeTab === 'analytics') {
    return <AnalyticsPanel />;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* MANAGE ASSIGNMENTS TAB */}
      {activeTab === 'assignments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl glass-panel">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                <span>Course Assignment Management</span>
              </h2>
              <p className="text-xs text-slate-400">Post assignments, edit details, and set targeted group access.</p>
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Assignment</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No assignments posted yet. Click "Create Assignment" to post work.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((asg) => {
                const dueDate = new Date(asg.due_date);

                return (
                  <div key={asg.id} className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 glass-panel-hover flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                          {asg.target_type === 'SPECIFIC_GROUPS' ? 'Targeted Groups' : 'All Students'}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEdit(asg)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asg.id, asg.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2">{asg.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">{asg.description}</p>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between border-t border-slate-800/60 pt-3">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>

                      <a
                        href={asg.onedrive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                        <span>OneDrive Link</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBMISSIONS OVERVIEW GRID TAB */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl glass-panel">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Group Submission Tracking Grid</span>
              </h2>
              <p className="text-xs text-slate-400">Monitor live two-step submission confirmations across all student groups.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Filter groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading submission overview...</div>
          ) : !overview || overview.groups.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No student groups created yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/60">
                    <th className="py-3.5 px-4 rounded-l-xl">Group & Roster</th>
                    {overview.assignments.map(a => (
                      <th key={a.id} className="py-3.5 px-4 text-center max-w-[200px] truncate" title={a.title}>
                        {a.title.split(':')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {overview.groups
                    .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((group) => (
                      <tr key={group.id} className="hover:bg-slate-800/30 transition-all">
                        
                        {/* Group Name & Members */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm">{group.name}</div>
                          <div className="text-[11px] text-purple-300 font-mono">{group.code}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Members: {group.members?.map(m => m.name).join(', ') || 'None'}
                          </div>
                        </td>

                        {/* Submission Status Per Assignment */}
                        {overview.assignments.map((asg) => {
                          const sub = overview.submissions.find(s => s.group_id === group.id && s.assignment_id === asg.id);
                          const isConfirmed = sub && sub.confirmed;

                          return (
                            <td key={asg.id} className="py-4 px-4 text-center">
                              {isConfirmed ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center space-x-1 mb-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Confirmed</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">by {sub.submitter_name}</span>
                                  <span className="text-[9px] text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700 text-[11px] font-medium flex items-center space-x-1">
                                    <XCircle className="h-3 w-3" />
                                    <span>Pending</span>
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}

                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Assignment Modal */}
      <AssignmentFormModal
        assignment={editingAssignment}
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSuccess={() => fetchData()}
      />

    </div>
  );
}
