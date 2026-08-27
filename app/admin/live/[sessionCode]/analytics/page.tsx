'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ParticipantAnalytics {
  rank: number;
  name: string;
  totalScore: number;
  accuracyPercentage: number;
  correctAnswersCount: number;
  totalQuestions: number;
}

interface DomainStats {
  domain: string;
  accuracyPercentage: number;
}

interface QuestionStats {
  questionIndex: number;
  averageScore: number;
  accuracyPercentage: number;
  questionType?: string;
}

interface AnalyticsPayload {
  title: string;
  totalParticipants: number;
  averageScore: number;
  leaderboard: ParticipantAnalytics[];
  domainStats?: DomainStats[];
  questionStats?: QuestionStats[];
}

const getDescriptiveRating = (acc: number) => {
  if (acc >= 90) return { label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (acc >= 75) return { label: 'Very Good', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (acc >= 60) return { label: 'Good', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (acc >= 40) return { label: 'Fair', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  return { label: 'Poor', color: 'bg-rose-100 text-rose-800 border-rose-200' };
};

export default function SessionAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = (params?.sessionCode as string)?.toUpperCase();

  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sessions/${sessionCode}/analytics`);
        if (!res.ok) throw new Error("Server returned an error");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytical report', err);
        setError("Unable to connect to the server. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    }
    if (sessionCode) loadReport();
  }, [sessionCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center text-slate-500 font-sans p-6 text-center">
        <span className="text-5xl mb-4">🔌</span>
        <h2 className="text-2xl font-black text-slate-800">Connection Lost</h2>
        <p className="font-medium mt-2 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
          Retry Connection
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center text-slate-500 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-tight">Compiling hybrid assessment metrics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 p-4 md:p-6 lg:p-8 font-sans pb-28">
      <div className="max-w-screen-xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-sm gap-5">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-black text-slate-900">{analytics?.title || 'Assessment Analytics'}</h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-mono font-black text-sm tracking-widest">{sessionCode}</span>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="px-6 py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition-colors active:scale-95">
            &larr; Back to Dashboard
          </button>
        </div>

        {/* Global Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6 rounded-3xl shadow-sm text-center relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10 text-9xl">👥</div>
            <span className="text-xs uppercase font-black tracking-widest text-blue-500 mb-2 block relative z-10">Total Participants</span>
            <p className="text-5xl font-black text-blue-600 relative z-10">{analytics?.totalParticipants || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-6 rounded-3xl shadow-sm text-center relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10 text-9xl">🎯</div>
            <span className="text-xs uppercase font-black tracking-widest text-indigo-500 mb-2 block relative z-10">Room Average Score</span>
            <p className="text-5xl font-black text-indigo-600 relative z-10">{analytics?.averageScore || 0} <span className="text-2xl text-indigo-400">pts</span></p>
          </div>
        </div>

        {/* PRO FEATURE: Domain Breakdown WITH DESCRIPTIVE RATINGS */}
        {analytics?.domainStats && analytics.domainStats.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-800">Knowledge Gaps Analysis</h2>
              <p className="text-sm text-slate-500 font-medium">Average participant accuracy mapped globally across educational domains and assessment types.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {analytics.domainStats.map((ds, idx) => {
                let themeColor = 'bg-slate-100 text-slate-600';
                let barColor = 'bg-slate-500';
                
                const lowerDomain = ds.domain.toLowerCase();
                if (lowerDomain.includes('cognitive')) { themeColor = 'bg-blue-50 text-blue-700 border-blue-100'; barColor = 'bg-blue-500'; }
                if (lowerDomain.includes('psychomotor')) { themeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100'; barColor = 'bg-emerald-500'; }
                if (lowerDomain.includes('affective')) { themeColor = 'bg-rose-50 text-rose-700 border-rose-100'; barColor = 'bg-rose-500'; }
                if (lowerDomain.includes('case study')) { themeColor = 'bg-amber-50 text-amber-700 border-amber-100'; barColor = 'bg-amber-500'; }
                if (lowerDomain.includes('scenario')) { themeColor = 'bg-purple-50 text-purple-700 border-purple-100'; barColor = 'bg-purple-500'; }

                const rating = getDescriptiveRating(ds.accuracyPercentage);

                return (
                  <div key={idx} className={`p-5 rounded-2xl border flex flex-col justify-between ${themeColor}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black tracking-wide uppercase text-sm">{ds.domain}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border shadow-sm ${rating.color}`}>
                        {rating.label}
                      </span>
                    </div>
                    
                    <div className="text-3xl font-black mb-3">{ds.accuracyPercentage}%</div>
                    
                    <div className="w-full bg-white/50 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${ds.accuracyPercentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRO FEATURE: Question Breakdown */}
        {analytics?.questionStats && analytics.questionStats.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-800">Question Performance</h2>
              <p className="text-sm text-slate-500 font-medium">Identify specific knowledge gaps across different assessment formats.</p>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
              {analytics.questionStats.map((qs, idx) => (
                <div key={idx} className="min-w-[220px] bg-slate-50 border border-slate-200 rounded-2xl p-5 snap-center flex-shrink-0">
                  <span className={`text-[9px] font-black text-white uppercase tracking-widest px-2.5 py-1 rounded inline-block mb-4 shadow-sm
                    ${qs.questionType === 'MULTIPLE_CHOICE' ? 'bg-amber-500' : qs.questionType === 'TAXONOMY_LEVEL' ? 'bg-emerald-500' : qs.questionType === 'CASE_STUDY_BLOCK' ? 'bg-orange-500' : 'bg-purple-500'}
                  `}>
                    Q{qs.questionIndex + 1} | {qs.questionType === 'MULTIPLE_CHOICE' ? 'Scenario MCQ' : qs.questionType === 'TAXONOMY_LEVEL' ? 'Domain Mastery' : qs.questionType === 'CASE_STUDY_BLOCK' ? 'Case Study' : 'Scenario Categorization'}
                  </span>
                  <div className="text-3xl font-black text-slate-700 mb-4">{qs.accuracyPercentage}% <span className="text-sm font-bold text-slate-400">Acc.</span></div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
                    <span className="text-sm font-black text-indigo-600">{qs.averageScore} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-800">Participant Leaderboard</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Overall Accuracy</th>
                  <th className="px-6 py-4 text-right">Final Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {!analytics?.leaderboard || analytics.leaderboard.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No submission data available.</td></tr>
                ) : (
                  analytics.leaderboard.map((item) => (
                    <tr key={item.rank} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${item.rank === 1 ? 'bg-amber-100 text-amber-700' : item.rank === 2 ? 'bg-slate-200 text-slate-700' : item.rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
                          #{item.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-base">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                          {item.accuracyPercentage}% 
                          <span className="opacity-50 font-medium">({item.correctAnswersCount}/{item.totalQuestions})</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-indigo-600 text-right">{item.totalScore} pts</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}