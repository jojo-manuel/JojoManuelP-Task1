import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { GraduationCap, Sparkles, ShieldCheck, Users, ArrowRight } from 'lucide-react';

function MainContent() {
  const { user, loading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | assignments | analytics

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Joineazy Academic Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          /* Landing Hero view when unauthenticated */
          <div className="py-16 text-center space-y-8 animate-fadeIn">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>Full-Stack Student & Group Management System</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
              Collaborate in Student Groups & Confirm Course Submissions
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Form student teams, invite members, view OneDrive assignment links, and provide two-step verification confirm status. Built for seamless professor monitoring and visual group analytics.
            </p>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-90 text-white shadow-xl shadow-indigo-600/30 transition-all text-sm"
              >
                <span>Launch Portal & Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-5xl mx-auto text-left">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 glass-panel">
                <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Student Group Formation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Students create groups, invite teammates via Email or Student ID, and track roster completion.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 glass-panel">
                <div className="h-10 w-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Two-Step Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Access OneDrive links, certify external uploads, and submit "Yes, I have submitted" confirmations.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 glass-panel">
                <div className="h-10 w-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-4">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Professor Tracking & Analytics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Professors manage assignments, filter group scoping, track submission matrix, and view visual analytics.
                </p>
              </div>
            </div>
          </div>
        ) : user.role === 'ADMIN' ? (
          /* Admin / Professor Dashboard */
          <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          /* Student Dashboard */
          <StudentDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Joineazy Academic Portal • Full-Stack Task 1</span>
          <span>Role-Based Auth • React + Node.js + PostgreSQL & SQLite Adapter</span>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
