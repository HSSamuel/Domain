'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import QRCode from 'react-qr-code';

const Spinner = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

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

  const [activityFeed, setActivityFeed] = useState<string[]>([]);
  const [topScorer, setTopScorer] = useState<{ name: string; score: number } | null>(null);

  const [customTimeOverride, setCustomTimeOverride] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const [showBigQR, setShowBigQR] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostIp = process.env.NEXT_PUBLIC_HOST_IP;
      const baseUrl = hostIp ? `http://${hostIp}:3000` : window.location.origin;
      setJoinUrl(`${baseUrl}/play/${sessionCode.toLowerCase()}`);
    }
  }, [sessionCode]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const s = io(socketUrl, { transports: ['websocket', 'polling'] });

    s.on('connect', () => {
      const token = localStorage.getItem('domainassess_admin_token');
      const adminName = localStorage.getItem('domainassess_admin_name') || 'Host';
      
      s.emit('join_session', { 
        sessionCode, 
        participantId: `host_${adminName.replace(/\s+/g, '_')}`, 
        name: adminName, 
        isHost: true, 
        token 
      });
    });

    s.on('session_roster_update', (data) => {
      setParticipantsCount(data.participantsCount);
      const sorted = [...data.participants].sort((a, b) => b.score - a.score);
      setParticipants(sorted);
      if (sorted.length > 0) setTopScorer({ name: sorted[0].name, score: sorted[0].score });
    });

    s.on('live_score_update', (data) => {
      setParticipants(prev => {
        const updated = prev.map(p => p.participantId === data.participantId ? { ...p, score: data.newScore } : p);
        const sorted = updated.sort((a, b) => b.score - a.score);
        if (sorted.length > 0) setTopScorer({ name: sorted[0].name, score: sorted[0].score });
        return sorted;
      });

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
    
    s.on('error', (err) => {
      console.error("Socket Error:", err.message);
      if (err.message.includes('Unauthorized')) {
        router.push('/admin/login');
      }
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

  const executeEndSession = () => {
    if (!socket) return;
    setIsConcluding(true);
    socket.emit('admin_end_session', { sessionCode });
  };

  const downloadQR = () => {
    const svg = document.getElementById('hidden-hq-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 2048; 
      canvas.height = 2048;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 2048, 2048);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `DomainAssess-QR-${sessionCode}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const hasMoreQuestions = currentQuestionIndex < totalQuestions - 1;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 p-4 md:p-6 lg:p-8 font-sans pb-28 relative">
      
      <div style={{ display: 'none' }}>
        {joinUrl && <QRCode id="hidden-hq-qr" value={joinUrl} size={2048} bgColor="#ffffff" fgColor="#0f172a" level="L" />}
      </div>

      <div className="max-w-screen-2xl w-full mx-auto space-y-6">
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 lg:p-5 rounded-3xl border border-slate-200 shadow-sm gap-5">
          <div className="flex items-center gap-5">
            <div 
              className="bg-white p-3 rounded-2xl border hidden sm:block relative group overflow-hidden cursor-pointer"
              onClick={() => setShowBigQR(true)}
            >
              {joinUrl && (
                <>
                  <QRCode value={joinUrl} size={256} style={{ width: '90px', height: '90px' }} bgColor="#ffffff" fgColor="#0f172a" level="L" />
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200">
                    <svg className="w-6 h-6 text-white drop-shadow-md mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Expand</span>
                  </div>
                </>
              )}
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
                 <option value={30}>Time: 30s</option>
                 <option value={60}>Time: 60s</option>
                 <option value={120}>Time: 120s (2m)</option>
                 <option value={180}>Time: 180s (3m)</option>
                 <option value={300}>Time: 300s (5m)</option>
                 <option value={600}>Time: 600s (10m)</option>
               </select>
            )}

            {sessionStatus !== 'COMPLETED' && hasMoreQuestions ? (
              <button onClick={handleTriggerNextQuestion} disabled={sessionStatus === 'ACTIVE_QUESTION'} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl shadow-sm transition-all">
                {currentQuestionIndex === -1 ? 'Launch Assessment' : sessionStatus === 'ACTIVE_QUESTION' ? 'In Progress' : 'Next Question'}
              </button>
            ) : null}
            <button onClick={() => setIsConfirmingEnd(true)} className="px-6 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-sm font-bold rounded-xl shadow-sm">
              End Session
            </button>
          </div>
        </div>

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

        {activityFeed.length > 0 && (
          <div className="bg-slate-900 text-slate-100 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <p className="text-xs font-bold font-mono tracking-wide truncate">{activityFeed[0]}</p>
          </div>
        )}

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

      {showBigQR && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4" onClick={() => setShowBigQR(false)}>
          <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-2xl flex flex-col items-center relative animate-in zoom-in-95 duration-200 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowBigQR(false)} className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 tracking-tight">Scan to Join</h2>
            
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-100 shadow-sm w-full max-w-[320px] aspect-square flex items-center justify-center mb-6">
              {joinUrl && <QRCode value={joinUrl} style={{ width: "100%", height: "100%" }} bgColor="#ffffff" fgColor="#0f172a" level="L" />}
            </div>

            <div className="text-center space-y-1 w-full px-4">
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Or visit URL</p>
              <p className="text-xl md:text-2xl font-black text-indigo-600 tracking-tight break-words">{joinUrl.replace(/^https?:\/\//, '')}</p>
            </div>

            <button onClick={downloadQR} className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-md text-sm active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download High-Res QR
            </button>
          </div>
        </div>
      )}

      {isConfirmingEnd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-indigo-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012-2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-black text-slate-900 text-xl mb-2">Conclude Assessment?</h3>
              <p className="text-sm text-slate-500 font-medium px-2">
                Are you sure you want to end this live session? This will lock all participant screens and generate the final analytical reports.
              </p>
            </div>
            
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setIsConfirmingEnd(false)}
                disabled={isConcluding}
                className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <div className="w-px bg-slate-100"></div>
              <button 
                onClick={executeEndSession}
                disabled={isConcluding}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {isConcluding && <Spinner />}
                {isConcluding ? 'Compiling...' : 'Compile Reports'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}