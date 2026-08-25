'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { apiFetch } from '../../../lib/api';

const Spinner = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface QuestionBank {
  _id: string;
  title: string;
  description: string;
  category: string;
  questions: any[];
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [bankToDelete, setBankToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  async function fetchBanks() {
    try {
      const response = await apiFetch(`/api/banks`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setBanks(data);
    } catch (err: any) {
      console.error('Failed to fetch banks:', err);
      setError(err.message || 'Failed to load question banks');
    } finally {
      setIsLoading(false);
    }
  }

  const handleLaunchSession = async (bankId: string) => {
    setLaunchingId(bankId);
    try {
      const hostName = localStorage.getItem('domainassess_admin_name') || 'admin';
      const res = await apiFetch(`/api/sessions/create`, {
        method: 'POST',
        body: JSON.stringify({ questionBankId: bankId, hostId: hostName })
      });
      
      const data = await res.json();
      if (res.ok && data.sessionCode) {
        showToast('Live session created successfully!', 'success');
        router.push(`/admin/live/${data.sessionCode}`);
      } else {
        showToast(data.error || 'Failed to initialize session', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while launching session.', 'error');
    } finally {
      setLaunchingId(null);
    }
  };

  const executeDelete = async () => {
    if (!bankToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/banks/${bankToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setBanks((prevBanks) => prevBanks.filter((bank) => bank._id !== bankToDelete));
        showToast('Module deleted successfully.', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete module', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while deleting module.', 'error');
    } finally {
      setIsDeleting(false);
      setBankToDelete(null); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-28 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Active Question Banks</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and launch your live assessments</p>
        </div>
        <Link href="/admin/create-bank" className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Create Question Bank
        </Link>
      </div>

      <main>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (<div key={n} className="h-64 bg-white rounded-3xl border border-slate-200 shadow-sm"></div>))}
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
            <div className="text-rose-700 font-bold text-lg">Connection Error</div>
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        ) : banks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-3xl border-dashed shadow-sm">
            <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Data Available</h3>
            <p className="text-slate-500 text-center max-w-md">Start by building your first interactive module using the Create Assessment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map((bank) => (
              <div key={bank._id} className="group relative flex flex-col bg-gradient-to-b from-indigo-50/80 to-slate-50/50 rounded-3xl border border-indigo-100/80 overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-300">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-400 to-emerald-400 opacity-90" />

                <button onClick={() => setBankToDelete(bank._id)} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-full transition-colors z-10 shadow-sm border border-transparent hover:border-rose-100" title="Delete Module">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <div className="px-4 pt-6 pb-4 flex-1 flex flex-col items-center text-center space-y-2.5 relative z-0">
                  <span className="inline-flex px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-white text-indigo-700 border border-indigo-100 shadow-sm rounded-full">{bank.category}</span>
                  <div className="w-full space-y-1.5">
                    <h2 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-950 transition-colors">{bank.title}</h2>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 px-1">{bank.description || 'No description provided for this assessment.'}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 mt-auto w-full">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200/80 shadow-sm px-2.5 py-1.5 rounded-xl">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {bank.questions.length} Questions
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-200/80 shadow-sm px-2.5 py-1.5 rounded-xl">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(bank.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white/40 backdrop-blur-sm border-t border-indigo-50 flex gap-2 relative z-0">
                  <button onClick={() => handleLaunchSession(bank._id)} disabled={launchingId === bank._id} className="flex-[2] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-black py-2 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:-translate-y-0.5">
                    {launchingId === bank._id ? <Spinner /> : <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    {launchingId === bank._id ? 'Launching...' : 'Host Live'}
                  </button>
                  <button onClick={() => router.push(`/admin/edit-bank/${bank._id}`)} className="flex-1 bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold py-2 rounded-xl transition-all shadow-sm">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {bankToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="font-black text-slate-900 text-xl mb-2">Delete Module?</h3>
              <p className="text-sm text-slate-500 font-medium px-2">Are you sure you want to delete this module? This action cannot be undone and will permanently remove all associated questions.</p>
            </div>
            <div className="flex border-t border-slate-100">
              <button onClick={() => setBankToDelete(null)} disabled={isDeleting} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
              <div className="w-px bg-slate-100"></div>
              <button onClick={executeDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-black text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
                {isDeleting && <Spinner />}
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}