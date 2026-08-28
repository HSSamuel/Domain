'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      // Automatically log them in with the new token
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
    <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200">
      <div className="flex justify-center mb-4">
        <Image src="/logo.png" alt="DomainAssess Logo" width={40} height={40} className="w-10 h-10 rounded-xl shadow-sm" />
      </div>
      
      <h1 className="text-2xl font-black text-center text-slate-900 mb-1.5">Set New Password</h1>
      <p className="text-center text-slate-500 text-sm font-medium mb-6">
        Please enter your new password below to regain access to your workspace.
      </p>

      {error && (
        <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block pl-1">New Password</label>
          <input 
            type="password" 
            required 
            placeholder="••••••••" 
            className="w-full px-4 py-2.5 border-2 rounded-xl text-sm font-bold text-slate-800 border-slate-200 focus:border-indigo-500 focus:outline-none transition-all tracking-widest" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block pl-1">Confirm New Password</label>
          <input 
            type="password" 
            required 
            placeholder="••••••••" 
            className="w-full px-4 py-2.5 border-2 rounded-xl text-sm font-bold text-slate-800 border-slate-200 focus:border-indigo-500 focus:outline-none transition-all tracking-widest" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
          />
        </div>

        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 mt-4 text-sm">
          {isLoading && <Spinner />}
          {isLoading ? 'Updating...' : 'Update Password & Login'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[150px] opacity-40"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Next.js 13+ requires useSearchParams to be wrapped in a Suspense boundary */}
        <Suspense fallback={<div className="font-bold text-slate-500 flex items-center gap-2"><Spinner /> Verifying Secure Link...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}