import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User, ShieldCheck, Users, RefreshCw } from 'lucide-react';

export function Navbar({ onOpenAuth, activeTab, setActiveTab }) {
  const { user, logout, login } = useAuth();

  const handleQuickSwitch = async (email) => {
    try {
      await login(email, 'password123');
    } catch (err) {
      console.error('Quick switch failed', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab && setActiveTab('assignments')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
              Joineazy
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Academic Portal
            </span>
          </div>
        </div>

        {/* User Role Navigation / Quick Switch */}
        {user ? (
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Admin / Student Dashboard Tabs */}
            {user.role === 'ADMIN' && (
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm font-medium">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'overview'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Submissions Grid
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'assignments'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manage Assignments
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Analytics
                </button>
              </div>
            )}

            {/* Quick Role Switcher Dropdown */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400">Demo Switch:</span>
              <button
                onClick={() => handleQuickSwitch('prof.smith@joineazy.edu')}
                className={`px-2 py-1 rounded-md transition-all ${
                  user.email === 'prof.smith@joineazy.edu'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Prof. Smith
              </button>
              <button
                onClick={() => handleQuickSwitch('alex.johnson@joineazy.edu')}
                className={`px-2 py-1 rounded-md transition-all ${
                  user.email === 'alex.johnson@joineazy.edu'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Student Alex
              </button>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                {user.role === 'ADMIN' ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {user.role === 'ADMIN' ? 'Professor (Admin)' : `Student • ${user.student_id || 'STU'}`}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Sign In / Register
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
