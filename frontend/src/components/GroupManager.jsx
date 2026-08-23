import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Users, UserPlus, Trash2, Shield, PlusCircle, Search, Mail, IdCard, Check, AlertCircle } from 'lucide-react';

export function GroupManager({ onGroupUpdated }) {
  const { user, group, refreshProfile } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Handle group creation
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await api.createGroup({ name: groupName.trim() });
      setGroupName('');
      refreshProfile();
      if (onGroupUpdated) onGroupUpdated();
      setMessage('Group created successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Search students for member invitation
  const handleSearchStudents = async (queryStr) => {
    setInviteInput(queryStr);
    if (!queryStr || queryStr.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await api.searchStudents(queryStr);
      setSearchResults(data.students || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  // Invite/add student to group
  const handleAddMember = async (studentEmailOrId) => {
    if (!group) return;
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.addMember(group.id, { emailOrStudentId: studentEmailOrId });
      setMessage(res.message);
      setShowInviteModal(false);
      setInviteInput('');
      setSearchResults([]);
      refreshProfile();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove member or leave group
  const handleRemoveMember = async (userId, memberName) => {
    if (!group) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) return;

    setError(null);
    setLoading(true);
    try {
      await api.removeMember(group.id, userId);
      setMessage(`${memberName} removed from group.`);
      refreshProfile();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl glass-panel">
      
      {/* Group Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Student Group Hub</h2>
            <p className="text-xs text-slate-400">Form your team to collaborate and submit assignments together.</p>
          </div>
        </div>

        {group && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
          <Check className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* No Group State: Create Group Form */}
      {!group ? (
        <div className="text-center py-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 items-center justify-center mb-3 text-slate-400">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Group Formed Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
            You must form or join a student group to work on assignments and complete submissions.
          </p>

          <form onSubmit={handleCreateGroup} className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Enter Group Name (e.g. Team CyberPulse)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !groupName.trim()}
              className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all text-xs disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      ) : (
        /* Active Group View */
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6">
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Team</div>
              <div className="text-xl font-extrabold text-white flex items-center space-x-2 mt-0.5">
                <span>{group.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold">
                  {group.code || 'GRP-ACTIVE'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Group Members</div>
              <div className="text-lg font-bold text-indigo-400">{group.members?.length || 1} / 5 Students</div>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Roster</div>
            {group.members && group.members.map((member) => {
              const isCreator = member.id === group.created_by;
              const isSelf = member.id === user.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center space-x-2">
                        <span>{member.name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">You</span>
                        )}
                        {isCreator && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex items-center space-x-1">
                            <Shield className="h-2.5 w-2.5" />
                            <span>Leader</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-3">
                        <span>{member.email}</span>
                        {member.student_id && <span>• ID: {member.student_id}</span>}
                      </div>
                    </div>
                  </div>

                  {(isSelf || user.id === group.created_by) && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                      title={isSelf ? 'Leave Group' : 'Remove Member'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl glass-panel">
            <h3 className="text-lg font-bold text-white mb-2">Invite Student to Group</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter student email address or Student ID (e.g. STU1002) to add them to {group?.name}.
            </p>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type email or Student ID..."
                  value={inviteInput}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Direct Add Button */}
              {inviteInput.trim().length > 0 && (
                <button
                  onClick={() => handleAddMember(inviteInput.trim())}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding Member...' : `Add "${inviteInput}" Directly`}
                </button>
              )}

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 border-t border-slate-800 pt-3">
                  <div className="text-[11px] text-slate-400 font-medium">Matching Students:</div>
                  {searchResults.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleAddMember(s.email)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 cursor-pointer transition-all border border-slate-800"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.email} • ID: {s.student_id || 'N/A'}</div>
                      </div>
                      <span className="text-[11px] text-indigo-400 font-medium hover:underline">+ Invite</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
