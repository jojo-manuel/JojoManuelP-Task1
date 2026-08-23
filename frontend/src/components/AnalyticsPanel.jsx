import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, Users, BookOpen, CheckCircle2, TrendingUp, Award } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

export function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-sm">Loading course analytics...</div>;
  }

  if (!analytics) return null;

  const { summary, assignmentMetrics, groupPerformance } = analytics;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.totalStudents}</div>
          <div className="text-[10px] text-slate-400 mt-1">Enrolled in portal</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Student Groups</span>
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.totalGroups}</div>
          <div className="text-[10px] text-purple-300 mt-1">Formed teams</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Assignments</span>
            <BookOpen className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.totalAssignments}</div>
          <div className="text-[10px] text-blue-300 mt-1">Active coursework</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{summary.overallCompletionRate}%</div>
          <div className="text-[10px] text-emerald-300 mt-1">{summary.totalSubmissions} Total submissions</div>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Assignment Completion Rates Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl glass-panel">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
                <span>Assignment Completion Rates (%)</span>
              </h3>
              <p className="text-xs text-slate-400">Percentage of groups that submitted per assignment.</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assignmentMetrics}>
                <XAxis dataKey="title" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(':')[0]} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="completionRate" fill="#6366f1" radius={[8, 8, 0, 0]}>
                  {assignmentMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Performance Leaderboard Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl glass-panel">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-400" />
                <span>Group Performance Comparison</span>
              </h3>
              <p className="text-xs text-slate-400">Number of assignments completed per group.</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupPerformance} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, summary.totalAssignments || 5]} />
                <YAxis dataKey="groupName" type="category" stroke="#64748b" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="submittedCount" fill="#a855f7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
