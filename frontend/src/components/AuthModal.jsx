import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, IdCard, Sparkles, CheckCircle2 } from 'lucide-react';

export function AuthModal({ isOpen, onClose }) {
  const { login, register, error: authError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('STUDENT'); // STUDENT | ADMIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    student_id: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ ...formData, role });
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (demoEmail) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 glass-panel">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center mb-3 text-indigo-400">
            {role === 'ADMIN' ? <ShieldCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isRegister ? 'Create Joineazy Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access student group tools and assignment submission confirmation.
          </p>
        </div>

        {/* Quick Demo Accounts Banner */}
        <div className="mb-6 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Quick 1-Click Demo Logins</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill('prof.smith@joineazy.edu')}
              className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-200 hover:bg-purple-900/60 transition-all text-left"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Professor Demo</span>
                <CheckCircle2 className="h-3 w-3 text-purple-400" />
              </div>
              <div className="text-[10px] text-purple-300/70 truncate">prof.smith@joineazy.edu</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('alex.johnson@joineazy.edu')}
              className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 hover:bg-indigo-900/60 transition-all text-left"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Student Demo</span>
                <CheckCircle2 className="h-3 w-3 text-indigo-400" />
              </div>
              <div className="text-[10px] text-indigo-300/70 truncate">alex.johnson@joineazy.edu</div>
            </button>
          </div>
        </div>

        {/* Auth Error Banner */}
        {(error || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error || authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role selector for registration */}
          {isRegister && (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  role === 'STUDENT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Student Role
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  role === 'ADMIN' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Professor / Admin
              </button>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                placeholder="your.email@joineazy.edu"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {isRegister && role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Student ID</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  name="student_id"
                  required
                  placeholder="e.g. STU1009"
                  value={formData.student_id}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-xs text-slate-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-bold text-indigo-400 hover:underline"
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>

      </div>
    </div>
  );
}
