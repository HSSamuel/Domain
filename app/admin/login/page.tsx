'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function FacilitatorLogin() {
  const router = useRouter();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (localStorage.getItem('domainAssess_auth') === 'granted') {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      if (isForgotPasswordMode) {
        const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to request password reset.');
        setSuccessMsg('If an account exists, a recovery link has been sent to your email.');
        setIsLoading(false);
        return;
      }

      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const payload = isLoginMode ? { email, password } : { name, email, password };

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed. Please try again.');

      localStorage.setItem('domainassess_admin_token', data.token);
      localStorage.setItem('domainassess_admin_name', data.user.name);
      localStorage.setItem('domainAssess_auth', 'granted');

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[150px] opacity-40"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="DomainAssess Logo" width={40} height={40} className="w-10 h-10 rounded-xl shadow-sm" />
          </div>
          
          <h1 className="text-2xl font-black text-center text-slate-900 mb-1.5">
            {isForgotPasswordMode ? 'Reset Password' : isLoginMode ? 'Facilitator Portal' : 'Create Account'}
          </h1>
          <p className="text-center text-slate-500 text-sm font-medium mb-6">
            {isForgotPasswordMode 
              ? 'Enter your email to receive a secure recovery link.' 
              : isLoginMode 
                ? 'Sign in to access your curriculum dashboard.' 
                : 'Set up your secure workspace.'}
          </p>

          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLoginMode && !isForgotPasswordMode && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block pl-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  autoComplete="name"
                  required 
                  suppressHydrationWarning
                  placeholder="First & Last name" 
                  className="w-full px-4 py-2.5 border-2 rounded-xl text-sm font-bold text-slate-800 border-slate-200 focus:border-indigo-500 focus:outline-none transition-all" 
                  value={name} 
                  onChange={(e) => { setName(e.target.value); setError(''); }} 
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block pl-1">Email Address</label>
              <input 
                type="email" 
                name="email"
                autoComplete="email"
                required 
                suppressHydrationWarning
                placeholder="your@email.com" 
                className="w-full px-4 py-2.5 border-2 rounded-xl text-sm font-bold text-slate-800 border-slate-200 focus:border-indigo-500 focus:outline-none transition-all" 
                value={email} 
                onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }} 
              />
            </div>

            {!isForgotPasswordMode && (
              <div>
                <div className="flex justify-between items-end mb-1 pl-1 pr-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Password</label>
                  {isLoginMode && (
                    <button type="button" onClick={() => { setIsForgotPasswordMode(true); setError(''); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    autoComplete={isLoginMode ? "current-password" : "new-password"}
                    required 
                    suppressHydrationWarning
                    placeholder="••••••••" 
                    className={`w-full pl-4 pr-12 py-2.5 border-2 rounded-xl text-sm font-bold text-slate-800 border-slate-200 focus:border-indigo-500 focus:outline-none transition-all ${!showPassword && password ? 'tracking-widest' : ''}`} 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); setError(''); }} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 mt-2 text-sm">
              {isLoading && <Spinner />}
              {isLoading ? 'Processing...' : isForgotPasswordMode ? 'Send Recovery Link' : isLoginMode ? 'Secure Sign In' : 'Create Workspace'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            {isForgotPasswordMode ? (
              <p className="text-sm font-medium text-slate-500">
                Remembered your password?{' '}
                <button type="button" onClick={() => { setIsForgotPasswordMode(false); setError(''); setSuccessMsg(''); }} className="text-indigo-600 font-bold hover:underline">
                  Sign in here
                </button>
              </p>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="text-indigo-600 font-bold hover:underline">
                  {isLoginMode ? 'Sign up here' : 'Sign in here'}
                </button>
              </p>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">&larr; Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}