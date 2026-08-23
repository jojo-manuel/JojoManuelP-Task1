import React, { useState, useEffect } from 'react';
import { X, BookOpen, ExternalLink, Calendar, Users, Save } from 'lucide-react';
import { api } from '../services/api';

export function AssignmentFormModal({ assignment, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    onedrive_link: '',
    target_type: 'ALL',
    target_group_ids: []
  });

  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      if (assignment) {
        // Format ISO date for datetime-local input
        const dateObj = new Date(assignment.due_date);
        const formattedDate = dateObj.toISOString().slice(0, 16);

        setFormData({
          title: assignment.title || '',
          description: assignment.description || '',
          due_date: formattedDate,
          onedrive_link: assignment.onedrive_link || '',
          target_type: assignment.target_type || 'ALL',
          target_group_ids: assignment.target_group_ids || []
        });
      } else {
        // Default new assignment due 7 days from now
        const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        setFormData({
          title: '',
          description: '',
          due_date: defaultDue,
          onedrive_link: 'https://onedrive.live.com/share?id=Joineazy_Folder',
          target_type: 'ALL',
          target_group_ids: []
        });
      }
    }
  }, [isOpen, assignment]);

  const fetchGroups = async () => {
    try {
      const data = await api.getAllGroups();
      setAvailableGroups(data.groups || []);
    } catch (err) {
      console.error('Failed to fetch groups for scoping', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGroupToggle = (groupId) => {
    const current = [...formData.target_group_ids];
    if (current.includes(groupId)) {
      setFormData({ ...formData, target_group_ids: current.filter(id => id !== groupId) });
    } else {
      setFormData({ ...formData, target_group_ids: [...current, groupId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (assignment) {
        await api.updateAssignment(assignment.id, formData);
      } else {
        await api.createAssignment(formData);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl glass-panel max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex h-10 w-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 items-center justify-center mb-2">
            <BookOpen className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {assignment ? 'Edit Assignment' : 'Create New Assignment'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Post course work and share external OneDrive submission folder link.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Assignment Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Assignment 1: Microservice Architecture"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description & Submission Guidelines</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Detailed instructions for students..."
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Due Date & Time</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="due_date"
                  required
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
              <select
                name="target_type"
                value={formData.target_type}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Students & Groups</option>
                <option value="SPECIFIC_GROUPS">Specific Groups Only</option>
              </select>
            </div>
          </div>

          {/* Specific Groups Scoping Checkboxes */}
          {formData.target_type === 'SPECIFIC_GROUPS' && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-purple-300">Select Targeted Groups:</label>
              {availableGroups.length === 0 ? (
                <div className="text-[11px] text-slate-500">No student groups created yet.</div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {availableGroups.map((g) => (
                    <label key={g.id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.target_group_ids.includes(g.id)}
                        onChange={() => handleGroupToggle(g.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{g.name} ({g.code})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Shared OneDrive Folder Link</label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="url"
                name="onedrive_link"
                required
                placeholder="https://onedrive.live.com/share?id=..."
                value={formData.onedrive_link}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all text-xs disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : assignment ? 'Update Assignment' : 'Post Assignment'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
