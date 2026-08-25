'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, TouchSensor, DragOverlay } from '@dnd-kit/core';

const DOMAIN_FRAMEWORKS = {
  Cognitive: ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'],
  Psychomotor: ['Perception', 'Set', 'Guided Response', 'Mechanism', 'Complex Overt Response', 'Adaptation', 'Origination'],
  Affective: ['Receiving Phenomena', 'Responding', 'Valuing', 'Organization', 'Internalizing Values']
};

interface Word { id: string; text: string; domain: string; }
interface QuestionPayload { index: number; prompt: string; timeLimitSeconds: number; points: number; words?: Word[]; startTime: string; endTime: string; }

// --- COMPRESSED CHIP UI ---
const DraggableChip = ({ id, text, inDropZone = false, isTaxonomy = false }: { id: string; text: string; inDropZone?: boolean, isTaxonomy?: boolean }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`cursor-grab touch-none select-none transition-opacity bg-white border border-slate-200 rounded-md shadow-sm hover:border-indigo-300 flex items-start gap-2 ${isDragging ? 'opacity-30' : 'opacity-100'} ${isTaxonomy ? 'w-full text-left p-2.5 mb-1.5' : (inDropZone ? 'w-full text-left px-2.5 py-2 mb-1' : 'px-3 py-2 inline-flex items-center')}`}>
      <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 9h8M8 15h8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span className={`font-bold text-slate-700 leading-tight ${isTaxonomy ? 'text-xs' : 'text-xs truncate'}`}>{text}</span>
    </div>
  );
};

const DraggableChipOverlay = ({ text, isTaxonomy = false }: { text: string; isTaxonomy?: boolean }) => (
  <div className={`cursor-grabbing px-3 py-2 rounded-lg flex items-start gap-2 shadow-2xl ring-2 ring-indigo-500 bg-indigo-600 text-white scale-105 font-bold ${isTaxonomy ? 'w-[85vw] max-w-sm text-xs' : 'inline-flex text-xs'}`}>
    <svg className="w-3.5 h-3.5 opacity-70 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 9h8M8 15h8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <span className="leading-tight">{text}</span>
  </div>
);

// --- UNIFIED & UPGRADED DOMAIN SNAP BUCKETS ---
const DroppableDomainList = ({ id, label, words, isTaxonomy, baseDomain }: { id: string; label: string; words: Word[]; isTaxonomy: boolean; baseDomain: string }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  let theme = 'bg-slate-50/50 border-slate-200'; let headerBg = 'bg-slate-100 text-slate-600';
  let icon = null; let subtitle = '';

  if (baseDomain === 'Cognitive') { 
    theme = 'bg-blue-50/30 border-blue-200'; 
    headerBg = 'bg-blue-50 text-blue-700'; 
    subtitle = "BLOOM'S (6 LEVELS)";
    icon = <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
  }
  if (baseDomain === 'Psychomotor') { 
    theme = 'bg-emerald-50/30 border-emerald-200'; 
    headerBg = 'bg-emerald-50 text-emerald-700'; 
    subtitle = "SIMPSON'S (7 LEVELS)";
    icon = <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
  }
  if (baseDomain === 'Affective') { 
    theme = 'bg-rose-50/30 border-rose-200'; 
    headerBg = 'bg-rose-50 text-rose-700'; 
    subtitle = "KRATHWOHL'S (5 LEVELS)";
    icon = <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
  }

  return (
    <div ref={setNodeRef} className={`min-w-[75%] md:min-w-0 md:flex-1 snap-center flex flex-col rounded-2xl border-2 transition-all duration-300 ${theme} ${isOver ? 'ring-2 ring-indigo-500/30 border-indigo-400 bg-indigo-50/50' : ''}`}>
      <div className={`flex flex-col items-center justify-center py-2.5 rounded-t-2xl border-b border-inherit ${headerBg}`}>
        <div className="flex items-center font-black text-xs mb-0.5 uppercase tracking-wide">
          {icon} {label} ({words.length})
        </div>
        <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">
          {subtitle}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 relative">
        {words.map(w => <DraggableChip key={w.id} id={w.id} text={w.text} inDropZone={true} isTaxonomy={isTaxonomy} />)}
        {words.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Drop Here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ParticipantPlayRoom() {
  const params = useParams(); const router = useRouter(); const sessionCode = (params?.sessionCode as string)?.toUpperCase();
  const [socket, setSocket] = useState<Socket | null>(null); const [participantId, setParticipantId] = useState<string>('');
  const [name, setName] = useState<string>(''); const [isJoined, setIsJoined] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'JOINING' | 'WAITING' | 'QUESTION' | 'FEEDBACK' | 'FINAL_RESULTS'>('JOINING');
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); const [feedback, setFeedback] = useState<any>(null);
  const [finalRankings, setFinalRankings] = useState<any[]>([]);

  // Early Submit State
  const [hasSubmittedEarly, setHasSubmittedEarly] = useState<boolean>(false);

  // Engine State
  const [unsortedWords, setUnsortedWords] = useState<Word[]>([]);
  const [sortedWords, setSortedWords] = useState<Record<string, string>>({}); 
  const [activeDragId, setActiveDragId] = useState<string | null>(null); 

  // Parsed Engine Context
  const promptParts = currentQuestion?.prompt?.split('|') || [];
  const activeMode = promptParts.length >= 2 ? promptParts[0] : 'RAPID_SORT';
  const targetDomain = promptParts.length >= 2 ? promptParts[1] : 'Cognitive';
  const isTaxonomy = activeMode === 'TAXONOMY_LEVEL';

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }));

  useEffect(() => {
    let storedId = sessionStorage.getItem('domainassess_p_id');
    if (!storedId) { storedId = 'p_' + Math.random().toString(36).substring(2, 9); sessionStorage.setItem('domainassess_p_id', storedId); }
    setParticipantId(storedId);
  }, []);

  useEffect(() => {
    if (!isJoined || !sessionCode) return;
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', { transports: ['websocket', 'polling'] });
    s.on('connect', () => s.emit('join_session', { sessionCode, participantId, name, isHost: false }));
    s.on('session_synced', (data) => { 
      if (data.status === 'WAITING') setGameState('WAITING'); 
      else if (data.status === 'COMPLETED') setGameState('FINAL_RESULTS'); 
    });
    
    s.on('question_started', (q: QuestionPayload) => {
      setCurrentQuestion(q); setFeedback(null); setUnsortedWords(q.words || []); setSortedWords({}); setHasSubmittedEarly(false); setGameState('QUESTION'); setTimeLeft(q.timeLimitSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((new Date(q.endTime).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining); if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
      }, 500);
    });

    s.on('answer_acknowledged', (data) => setFeedback((prev: any) => ({ ...prev, ...data })));
    s.on('question_time_expired', (data) => { if (timerRef.current) clearInterval(timerRef.current); setHasSubmittedEarly(false); setGameState('FEEDBACK'); setFeedback((prev: any) => ({ ...prev, wordsMapping: data.wordsMapping })); });
    s.on('session_finalized', (data) => { setFinalRankings(data.leaderboard); setGameState('FINAL_RESULTS'); });
    setSocket(s); 
    
    // FIX: Explictly return a void function to satisfy TypeScript and Netlify build
    return () => { 
      s.disconnect(); 
    };
  }, [isJoined, sessionCode, participantId, name]);

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null); const { active, over } = event;
    if (!over || !over.id || !socket || !currentQuestion) return;
    const wordId = active.id as string; const domainId = over.id as string; 
    setUnsortedWords(prev => prev.filter(w => w.id !== wordId));
    setSortedWords(prev => {
      const updated = { ...prev, [wordId]: domainId };
      socket.emit('submit_answer', { sessionCode, participantId, questionIndex: currentQuestion.index, sortedWords: updated });
      return updated;
    });
  };

  const getSortedWordsForDomain = (domainId: string) => {
    if (!currentQuestion?.words) return [];
    return Object.entries(sortedWords).filter(([_, d]) => d === domainId).map(([id, _]) => currentQuestion.words!.find(w => w.id === id)).filter(Boolean) as Word[];
  };

  const bucketList = isTaxonomy ? (DOMAIN_FRAMEWORKS[targetDomain as keyof typeof DOMAIN_FRAMEWORKS] || DOMAIN_FRAMEWORKS.Cognitive) : ['Cognitive', 'Psychomotor', 'Affective'];
  const draggedWord = currentQuestion?.words?.find(w => w.id === activeDragId);

  let sortedStats = { correct: 0, incorrect: 0, missed: 0, breakdowns: [] as any[] };
  if (gameState === 'FEEDBACK' && feedback?.wordsMapping) {
    feedback.wordsMapping.forEach((dbWord: Word) => {
      const userDomain = sortedWords[dbWord.id];
      if (!userDomain) {
        sortedStats.missed++;
        sortedStats.breakdowns.push({ ...dbWord, status: 'missed', userDroppedDomain: null });
      } else if (userDomain === dbWord.domain) {
        sortedStats.correct++;
      } else {
        sortedStats.incorrect++;
        sortedStats.breakdowns.push({ ...dbWord, status: 'incorrect', userDroppedDomain: userDomain });
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col items-center justify-center p-3 font-sans selection:bg-indigo-100 overflow-hidden">
      
      {gameState === 'JOINING' && (
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h1 className="text-xl font-black text-center mb-2">Join Assessment</h1>
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setIsJoined(true); }} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nickname..." required className="w-full p-3 bg-slate-50 border rounded-xl text-center font-bold text-sm" />
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm shadow-sm transition-all active:scale-95">Take the Exercise</button>
          </form>
        </div>
      )}

      {gameState === 'WAITING' && (
        <div className="text-center space-y-4 max-w-sm">
          <span className="text-4xl block animate-bounce">👋</span>
          <h2 className="text-2xl font-black">You're in!</h2>
          <p className="text-slate-500 font-medium mt-2 text-sm">Look up at the main screen. Waiting for the facilitator...</p>
        </div>
      )}

      {gameState === 'QUESTION' && currentQuestion && (
        <div className="w-full max-w-4xl flex flex-col h-[90vh]">
          <div className="flex justify-between items-center bg-white border rounded-xl p-3 mb-3 shadow-sm flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-100 rounded">Q {currentQuestion.index + 1}</span>
            <div className={`font-mono text-sm font-black px-3 py-1 rounded-lg border ${timeLeft <= 10 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'text-slate-800'}`}>0:{timeLeft.toString().padStart(2, '0')}</div>
          </div>

          {/* Locked Board State when submitted early */}
          <div className={`flex-1 flex flex-col bg-slate-100/50 rounded-3xl p-2 md:p-4 border shadow-inner overflow-hidden transition-opacity duration-300 ${hasSubmittedEarly ? 'opacity-70 pointer-events-none' : ''}`}>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* EXPANDED WORD BANK */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col h-[40%] min-h-[180px] mb-3">
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                  <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Word Bank</h4>
                  <span className="bg-indigo-50 text-indigo-600 font-black text-[10px] px-2 py-0.5 rounded">{unsortedWords.length} Left</span>
                </div>
                <div className={`flex-1 overflow-y-auto pr-2 pb-1 ${isTaxonomy ? 'flex flex-col gap-2' : 'flex flex-wrap content-start gap-2 justify-center'}`}>
                  {unsortedWords.map(w => <DraggableChip key={w.id} id={w.id} text={w.text} isTaxonomy={isTaxonomy} />)}
                </div>
              </div>

              {/* DOMAIN BUCKETS */}
              <div className="flex-1 flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2 items-stretch h-[60%]">
                {bucketList.map(bucketLabel => (
                  <DroppableDomainList key={bucketLabel} id={bucketLabel} label={bucketLabel} words={getSortedWordsForDomain(bucketLabel)} isTaxonomy={isTaxonomy} baseDomain={isTaxonomy ? targetDomain : bucketLabel} />
                ))}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeDragId && draggedWord ? <DraggableChipOverlay text={draggedWord.text} isTaxonomy={isTaxonomy} /> : null}
              </DragOverlay>
            </DndContext>
          </div>

          <button 
            onClick={() => setHasSubmittedEarly(true)} 
            disabled={hasSubmittedEarly}
            className={`mt-4 w-full py-3.5 font-bold rounded-2xl shadow-sm text-sm transition-colors ${hasSubmittedEarly ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'}`}
          >
            {hasSubmittedEarly ? 'Waiting for time to expire...' : "I'm Finished"}
          </button>
        </div>
      )}

      {/* STRETCHED FEEDBACK CARD */}
      {gameState === 'FEEDBACK' && (
        <div className="w-full max-w-lg bg-white border rounded-[2rem] p-6 text-center shadow-lg">
          <div className="text-indigo-600 mb-6">
            <span className="text-4xl block mb-2">⏱️</span>
            <div className="text-3xl font-black">Time's Up!</div>
            <div className="mt-3">
              <span className="text-sm font-black text-indigo-600 bg-indigo-50 inline-block px-5 py-2 rounded-xl border border-indigo-100 shadow-sm">+{feedback?.pointsAwarded || 0} pts</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4 text-left shadow-inner">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Sorting Breakdown</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center"><span className="block text-2xl font-black text-emerald-600">{sortedStats.correct}</span><span className="text-[10px] uppercase font-bold text-emerald-500">Correct</span></div>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-center"><span className="block text-2xl font-black text-rose-600">{sortedStats.incorrect}</span><span className="text-[10px] uppercase font-bold text-rose-500">Incorrect</span></div>
              <div className="bg-white border border-slate-200 p-3 rounded-xl text-center"><span className="block text-2xl font-black text-slate-500">{sortedStats.missed}</span><span className="text-[10px] uppercase font-bold text-slate-400">Missed</span></div>
            </div>

            {sortedStats.breakdowns.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Missed & Incorrect Items</p>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {sortedStats.breakdowns.map((b: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] p-3 rounded-xl bg-white border shadow-sm">
                      <span className="font-bold text-slate-700 truncate mr-2">{b.text}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {b.status === 'incorrect' ? <span className="text-[10px] font-bold text-rose-400 line-through">{b.userDroppedDomain}</span> : null}
                        <span className="font-black text-emerald-500 uppercase flex items-center gap-1">&rarr; {b.domain}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- EXCITING NEW PODIUM FINAL RESULTS UI --- */}
      {gameState === 'FINAL_RESULTS' && (() => {
        const myResult = finalRankings.find(item => item.name === name);
        const isWinner = myResult?.rank === 1;
        const isPodium = myResult?.rank > 1 && myResult?.rank <= 3;

        return (
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
            
            {isWinner && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-80">
                <div className="absolute -top-6 -left-4 text-4xl animate-[spin_3s_linear_infinite]">🎊</div>
                <div className="absolute top-10 -right-6 text-4xl animate-[spin_4s_linear_infinite_reverse]">🎉</div>
                <div className="absolute bottom-12 -left-2 text-3xl animate-bounce">🎈</div>
                <div className="absolute -bottom-2 right-8 text-4xl animate-pulse">✨</div>
              </div>
            )}

            <div className="relative z-10">
              {isWinner ? (
                <div className="space-y-3 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(252,211,77,0.6)] animate-bounce border-4 border-white">
                    <span className="text-4xl">🏆</span>
                  </div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">Outstanding!</h2>
                  <p className="text-slate-600 font-bold text-sm">You took 1st place! 👏👏</p>
                </div>
              ) : isPodium ? (
                <div className="space-y-3 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-300 rounded-full flex items-center justify-center mx-auto shadow-md border-4 border-white">
                    <span className="text-4xl">{myResult?.rank === 2 ? '🥈' : '🥉'}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-800">Podium Finish!</h2>
                  <p className="text-slate-500 font-bold text-sm">Incredible effort! 👏</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border-4 border-indigo-100">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-800">Complete!</h2>
                  <p className="text-slate-500 font-bold text-sm">Great job completing the module. 👏</p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-inner">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Final Result</p>
                <div className="flex justify-around items-center">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Rank</span>
                    <span className={`text-2xl font-black ${isWinner ? 'text-amber-500' : 'text-slate-700'}`}>#{myResult?.rank || '-'}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Score</span>
                    <span className="text-2xl font-black text-indigo-600">{myResult?.score || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6 text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Top 3 Leaderboard</p>
                {finalRankings.slice(0, 3).map((item) => (
                  <div key={item.rank} className={`flex justify-between items-center p-2.5 rounded-xl border text-xs font-bold transition-all ${item.name === name ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] ${item.rank === 1 ? 'bg-amber-100 text-amber-700' : item.rank === 2 ? 'bg-slate-100 text-slate-600' : item.rank === 3 ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>{item.rank}</span>
                      <span className="text-slate-700 truncate max-w-[120px]">{item.name} {item.name === name && '(You)'}</span>
                    </div>
                    <span className="text-indigo-600 font-mono">{item.score}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push('/')} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all active:scale-95 text-sm">Return to Home</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}