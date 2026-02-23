import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../api/auth.service';
import { LogIn, Mail, Lock, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authService.login({ email, password });
      
      const routes: Record<string, string> = {
        Admin: '/admin/dashboard',
        Mentor: '/mentor/dashboard',
        Intern: '/intern/dashboard'
      };

      navigate(routes[data.role] || '/intern/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 mb-4 rotate-3">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Intern<span className="text-indigo-600">OS</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 uppercase tracking-[0.2em] text-[10px]">
            Enterprise Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Please enter your details to sign in</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
              <div className="bg-rose-100 p-1 rounded-full">
                <ArrowRight className="rotate-180" size={12} />
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="group">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Work Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-700 font-medium"
                />
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Forgot?</button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-indigo-200 active:scale-[0.98] disabled:bg-slate-300 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Sign Into System</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                <LogIn size={14} />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                Demo access available for testing roles.<br/>Contact admin for credentials.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          &copy; 2026 InternOS Platforms Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;