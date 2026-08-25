'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import QRCode from 'react-qr-code';

export default function AdminLiveControlDashboard() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = (params?.sessionCode as string)?.toUpperCase();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<string>('WAITING');
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [joinUrl, setJoinUrl] = useState<string>('');

  // --- NEW: Activity Feed & Top Scorer States ---
  const [activityFeed, setActivityFeed] = useState<string[]>([]);
  const [topScorer, setTopScorer] = useState<{ name: string; score: number } | null>(null);

  const [customTimeOverride, setCustomTimeOverride] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setJoinUrl(`${window.location.origin}`);
  }, []);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const s = io(socketUrl, { transports: ['websocket', 'polling'] });

    s.on('connect', () => {
      s.emit('join_session', { sessionCode, participantId: 'admin_host', name: 'Host Administrator', isHost: true });
    });

    s.on('session_roster_update', (data) => {
      setParticipantsCount(data.participantsCount);
      const sorted = [...data.participants].sort((a, b) => b.score - a.score);
      setParticipants(sorted);
      if (sorted.length > 0) setTopScorer({ name: sorted[0].name, score: sorted[0].score });
    });

    // --- NEW: LIVE SCORE SYNCING & ACTIVITY TICKER ---
    s.on('live_score_update', (data) => {
      setParticipants(prev => {
        const updated = prev.map(p => p.participantId === data.participantId ? { ...p, score: data.newScore } : p);
        const sorted = updated.sort((a, b) => b.score - a.score);
        if (sorted.length > 0) setTopScorer({ name: sorted[0].name, score: sorted[0].score });
        return sorted;
      });

      // Add to activity feed
      setActivityFeed(prev => [`⚡ ${data.name || 'A participant'} locked in their answers (+${data.newScore} pts)`, ...prev.slice(0, 4)]);
    });

    s.on('session_synced', (data) => {
      setSessionStatus(data.status);
      setCurrentQuestionIndex(data.currentQuestionIndex);
      setTotalQuestions(data.totalQuestions);
    });

    s.on('submission_metric_update', (data) => {
      setSubmissionsCount(data.submissionsCount);
    });

    s.on('question_started', (q) => {
      setSessionStatus('ACTIVE_QUESTION');
      setTimeLeft(q.timeLimitSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((new Date(q.endTime).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
      }, 500);
    });

    s.on('question_time_expired', () => {
      setSessionStatus('QUESTION_BREAKDOWN');
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    s.on('session_finalized', () => {
      router.push(`/admin/live/${sessionCode}/analytics`);
    });

    setSocket(s);
    return () => { if (timerRef.current) clearInterval(timerRef.current); s.disconnect(); };
  }, [sessionCode, router]);

  const handleTriggerNextQuestion = () => {
    if (!socket) return;
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= totalQuestions) return; 

    setSubmissionsCount(0);
    socket.emit('admin_start_question', { sessionCode, questionIndex: nextIdx, customTimeLimit: customTimeOverride });
    setCurrentQuestionIndex(nextIdx);
  };

  const handleConcludeSession = () => {
    if (!socket) return;
    if (confirm('Conclude the assessment and compile analytical reports?')) {
      socket.emit('admin_end_session', { sessionCode });
    }
  };

  const hasMoreQuestions = currentQuestionIndex < totalQuestions - 1;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 p-4 md:p-6 lg:p-8 font-sans pb-28">
      <div className="max-w-screen-2xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 lg:p-5 rounded-3xl border border-slate-200 shadow-sm gap-5">
          <div className="flex items-center gap-5">
            <div className="bg-white p-3 rounded-2xl border hidden sm:block">
              {joinUrl && <QRCode value={joinUrl} size={90} bgColor="#ffffff" fgColor="#0f172a" level="L" />}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-none">Host Control Room</h1>
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-slate-500 text-sm font-medium">Join at: <strong className="text-slate-800">{joinUrl.replace(/^https?:\/\//, '')}</strong></span>
                <span className="text-slate-500 text-sm font-medium">PIN: <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-mono font-black">{sessionCode}</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap w-full xl:w-auto gap-3 items-center">
            {sessionStatus !== 'COMPLETED' && hasMoreQuestions && sessionStatus !== 'ACTIVE_QUESTION' && (
               <select value={customTimeOverride} onChange={(e) => setCustomTimeOverride(Number(e.target.value))} className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer shadow-sm">
                 <option value={30}>Time: 30s</option><option value={60}>Time: 60s</option><option value={120}>Time: 120s (2m)</option><option value={180}>Time: 180s (3m)</option><option value={300}>Time: 300s (5m)</option>
               </select>
            )}

            {sessionStatus !== 'COMPLETED' && hasMoreQuestions ? (
              <button onClick={handleTriggerNextQuestion} disabled={sessionStatus === 'ACTIVE_QUESTION'} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl shadow-sm transition-all">
                {currentQuestionIndex === -1 ? 'Launch Assessment' : sessionStatus === 'ACTIVE_QUESTION' ? 'In Progress' : 'Next Question'}
              </button>
            ) : null}
            <button onClick={handleConcludeSession} className="px-6 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-sm font-bold rounded-xl shadow-sm">
              End Session
            </button>
          </div>
        </div>

        {/* Dynamic Metric Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6 rounded-3xl shadow-sm flex flex-col justify-center text-center">
            <span className="text-xs uppercase font-black tracking-widest text-blue-400 mb-2">Connected</span>
            <p className="text-5xl font-black text-blue-600">{participantsCount}</p>
          </div>
          
          <div className={`bg-gradient-to-br p-6 rounded-3xl shadow-sm flex flex-col justify-center text-center ${timeLeft !== null && timeLeft <= 10 && timeLeft > 0 ? 'from-rose-50 to-white border-2 border-rose-400 animate-pulse' : 'from-purple-50 to-white border border-purple-100'}`}>
            <span className={`text-xs uppercase font-black tracking-widest mb-2 ${timeLeft !== null && timeLeft <= 10 && timeLeft > 0 ? 'text-rose-500' : 'text-purple-400'}`}>Timer</span>
            <p className={`font-black font-mono tracking-tight ${timeLeft !== null && timeLeft <= 10 && timeLeft > 0 ? 'text-rose-600 text-5xl' : 'text-purple-600 text-4xl'}`}>
              {sessionStatus === 'ACTIVE_QUESTION' && timeLeft !== null ? `0:${timeLeft.toString().padStart(2, '0')}` : sessionStatus === 'QUESTION_BREAKDOWN' ? 'Time Up' : 'Waiting'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-6 rounded-3xl shadow-sm flex flex-col justify-center text-center">
            <span className="text-xs uppercase font-black tracking-widest text-emerald-400 mb-2">Submissions</span>
            <p className="text-5xl font-black text-emerald-500">{submissionsCount}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-6 rounded-3xl shadow-sm flex flex-col justify-center text-center">
            <span className="text-xs uppercase font-black tracking-widest text-amber-500 mb-2">Top Performer 🏆</span>
            <p className="text-xl font-black text-amber-700 truncate">{topScorer ? `${topScorer.name} (${topScorer.score}pt)` : 'None yet'}</p>
          </div>
        </div>

        {/* Live Activity Ticker Feed */}
        {activityFeed.length > 0 && (
          <div className="bg-slate-900 text-slate-100 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <p className="text-xs font-bold font-mono tracking-wide truncate">{activityFeed[0]}</p>
          </div>
        )}

        {/* Participant Roster */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 mb-4">Participants (Live Leaderboard)</h2>
          <div className="divide-y divide-slate-100">
            {participants.length === 0 ? (
              <p className="text-center py-8 text-slate-400 font-medium">Waiting for participants to join...</p>
            ) : (
              participants.map((p, idx) => (
                <div key={p.participantId} className="py-3 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-slate-400 text-sm">#{idx + 1}</span>
                    <span className={`block h-2.5 w-2.5 rounded-full ${p.isConnected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    <span className="font-bold text-slate-700 text-base">{p.name}</span>
                  </div>
                  <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">{p.score} pts</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}