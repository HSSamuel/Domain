'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent, 
  DragStartEvent, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor, 
  DragOverlay,
  rectIntersection // FIXED: Switched to rectIntersection for lower sensitivity
} from '@dnd-kit/core';

const Spinner = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const getDescriptiveRating = (acc: number) => {
  if (acc >= 90) return { label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (acc >= 75) return { label: 'Very Good', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (acc >= 60) return { label: 'Good', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (acc >= 40) return { label: 'Fair', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  return { label: 'Poor', color: 'bg-rose-100 text-rose-800 border-rose-200' };
};

interface Word { id: string; text: string; domain: string; }
interface Option { id: string; text: string; isCorrect?: boolean; }
interface SubQuestion { questionText: string; options: Option[]; explanation: string; }
interface QuestionPayload { 
  index: number; questionType?: string; prompt: string; timeLimitSeconds: number; points: number; 
  words?: Word[]; subQuestions?: SubQuestion[]; explanation?: string; startTime: string; endTime: string; title?: string;
}

const DraggableChip = ({ id, text }: { id: string; text: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`cursor-grab touch-none select-none transition-opacity bg-white border border-slate-200 rounded-md shadow-sm hover:border-indigo-300 px-3 py-1.5 inline-flex items-center gap-2 ${isDragging ? 'opacity-30' : 'opacity-100'}`}>
      <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 9h8M8 15h8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span className="font-bold text-slate-700 leading-tight text-[11px] md:text-xs">{text}</span>
    </div>
  );
};

const DraggableChipOverlay = ({ text }: { text: string }) => (
  <div className={`cursor-grabbing px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xl ring-2 ring-indigo-500 bg-indigo-600 text-white scale-105 font-bold inline-flex text-[11px] md:text-xs`}>
    <svg className="w-3.5 h-3.5 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 9h8M8 15h8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <span className="leading-tight">{text}</span>
  </div>
);

const DroppableDomainList = ({ id, label, words, baseDomain }: { id: string; label: string; words: Word[]; baseDomain: string }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  let theme = 'bg-slate-50/50 border-slate-200'; let headerBg = 'bg-slate-100 text-slate-600';
  let icon = null; let subtitle = '';

  if (baseDomain === 'Cognitive') { theme = 'bg-blue-50/30 border-blue-200'; headerBg = 'bg-blue-50 text-blue-700'; subtitle = "BLOOM'S (6 LEVELS)"; icon = <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>; }
  if (baseDomain === 'Psychomotor') { theme = 'bg-emerald-50/30 border-emerald-200'; headerBg = 'bg-emerald-50 text-emerald-700'; subtitle = "SIMPSON'S (7 LEVELS)"; icon = <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
  if (baseDomain === 'Affective') { theme = 'bg-rose-50/30 border-rose-200'; headerBg = 'bg-rose-50 text-rose-700'; subtitle = "KRATHWOHL'S (5 LEVELS)"; icon = <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>; }

  return (
    <div ref={setNodeRef} className={`min-w-[80%] md:min-w-0 md:flex-1 snap-center flex flex-col rounded-2xl border-2 transition-all duration-300 ${theme} ${isOver ? 'ring-2 ring-indigo-500/30 border-indigo-400 bg-indigo-50/50' : ''}`}>
      <div className={`flex flex-col items-center justify-center py-2.5 rounded-t-2xl border-b border-inherit ${headerBg}`}>
        <div className="flex items-center font-black text-xs mb-0.5 uppercase tracking-wide">{icon} {label} ({words.length})</div>
        <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">{subtitle}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 relative flex flex-wrap content-start gap-2 justify-center">
        {words.map(w => <DraggableChip key={w.id} id={w.id} text={w.text} />)}
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
  const params = useParams(); 
  const router = useRouter(); 
  
  const rawParam = params?.sessionCode as string || '';
  let decodedParam = rawParam;
  try { decodedParam = decodeURIComponent(rawParam); } catch (e) {}
  const sessionCode = decodedParam.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();

  const [socket, setSocket] = useState<Socket | null>(null); 
  const [participantId, setParticipantId] = useState<string>('');
  const [name, setName] = useState<string>(''); 
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'JOINING' | 'WAITING' | 'QUESTION' | 'FEEDBACK' | 'FINAL_RESULTS'>('JOINING');
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload | null>(null);
  const [currentSubIndex, setCurrentSubIndex] = useState<number>(0); 
  const [hasCompletedAll, setHasCompletedAll] = useState<boolean>(false);
  
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0); 
  const [feedback, setFeedback] = useState<any>(null);
  const [finalRankings, setFinalRankings] = useState<any[]>([]);

  const [unsortedWords, setUnsortedWords] = useState<Word[]>([]);
  const [sortedWords, setSortedWords] = useState<Record<string, string>>({}); 
  const [activeDragId, setActiveDragId] = useState<string | null>(null); 
  const [activeFilter, setActiveFilter] = useState<'DEFAULT' | 'CORRECT' | 'INCORRECT' | 'MISSED'>('DEFAULT');

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  let parsedBlockData: any = null;
  let caseStudyNarrative = currentQuestion?.prompt || '';

  if (currentQuestion?.questionType === 'CASE_STUDY_BLOCK') {
    if (caseStudyNarrative.includes('|||PAYLOAD|||')) {
       caseStudyNarrative = caseStudyNarrative.split('|||PAYLOAD|||')[0];
    }
    
    const payloadWord = currentQuestion.words?.find(w => w.id === 'case_study_payload');
    if (payloadWord) {
      try { parsedBlockData = JSON.parse(payloadWord.text); } catch(e) {}
    }

    if (!parsedBlockData && currentQuestion.explanation && currentQuestion.explanation.includes('subQuestions')) {
      try { parsedBlockData = JSON.parse(currentQuestion.explanation); } catch(e) {}
    }

    if (!parsedBlockData && currentQuestion.prompt && currentQuestion.prompt.includes('|||PAYLOAD|||')) {
      try { parsedBlockData = JSON.parse(currentQuestion.prompt.split('|||PAYLOAD|||')[1]); } catch(e) {}
    }

    if (!parsedBlockData && currentQuestion.subQuestions && currentQuestion.subQuestions.length > 0) {
      parsedBlockData = { subQuestions: currentQuestion.subQuestions, title: currentQuestion.title };
    }
  }

  const isActuallyCaseStudyType = currentQuestion?.questionType === 'CASE_STUDY_BLOCK';
  const activeSubQuestions = parsedBlockData?.subQuestions || [];
  const blockTitle = parsedBlockData?.title || currentQuestion?.title || 'Case Study Facts';

  const isCaseStudyBlock = isActuallyCaseStudyType && activeSubQuestions.length > 0;
  const isLastSubQuestion = isCaseStudyBlock && currentSubIndex === activeSubQuestions.length - 1;
  const isLastQuestionOverall = currentQuestion && totalQuestions > 0 && currentQuestion.index === totalQuestions - 1;
  
  const currentSubQuestionData = isCaseStudyBlock ? activeSubQuestions[currentSubIndex] : null;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const participantIdRef = useRef(participantId);
  const currentSubIndexRef = useRef(currentSubIndex);
  const selectedOptionIdRef = useRef(selectedOptionId);
  const sortedWordsRef = useRef(sortedWords);
  const currentQuestionRef = useRef(currentQuestion);

  useEffect(() => { participantIdRef.current = participantId; }, [participantId]);
  useEffect(() => { currentSubIndexRef.current = currentSubIndex; }, [currentSubIndex]);
  useEffect(() => { selectedOptionIdRef.current = selectedOptionId; }, [selectedOptionId]);
  useEffect(() => { sortedWordsRef.current = sortedWords; }, [sortedWords]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

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
      if (data.status === 'WAITING' || data.status === 'QUESTION_BREAKDOWN') {
        setGameState('WAITING'); 
      }
      else if (data.status === 'COMPLETED') {
        setGameState('FINAL_RESULTS'); 
      }
      setTotalQuestions(data.totalQuestions);
    });
    
    s.on('question_started', (q: QuestionPayload) => {
      setCurrentQuestion(q); setFeedback(null); setGameState('QUESTION'); setTimeLeft(q.timeLimitSeconds);
      setHasCompletedAll(false);

      if (q.questionType === 'CASE_STUDY_BLOCK') {
        setCurrentSubIndex(0);
        setSelectedOptionId(null);
      } else {
        const validWords = q.words?.filter(w => w.id !== 'case_study_payload') || [];
        setUnsortedWords(validWords); 
        setSortedWords({}); 
        setActiveFilter('DEFAULT');
      }
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((new Date(q.endTime).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining); if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
      }, 500);
    });

    s.on('answer_acknowledged', (data) => {
      setFeedback((prev: any) => {
        if (!prev) return data;
        return { 
          ...data,
          ...prev, 
          pointsAwarded: prev.pointsAwarded !== undefined ? prev.pointsAwarded : data.pointsAwarded,
          options: prev.options || data.options,
          explanation: prev.explanation || data.explanation,
          isCorrect: prev.isCorrect !== undefined ? prev.isCorrect : data.isCorrect,
          wordsMapping: prev.wordsMapping || data.wordsMapping
        };
      });
    });
    
    s.on('question_time_expired', (data) => { 
      if (timerRef.current) clearInterval(timerRef.current); 
      
      const cq = currentQuestionRef.current;
      if (cq) {
        if (cq.questionType === 'CASE_STUDY_BLOCK') {
          
          let pBlockData: any = null;
          const rawPromptTimeout = cq.prompt || '';
          if (rawPromptTimeout.includes('|||PAYLOAD|||')) {
             try { pBlockData = JSON.parse(rawPromptTimeout.split('|||PAYLOAD|||')[1]); } catch(e) {}
          }
          if (!pBlockData && cq.words) {
            const pWord = cq.words.find(w => w.id === 'case_study_payload');
            if (pWord) { try { pBlockData = JSON.parse(pWord.text); } catch(e) {} }
          }

          const activeSubQsTimeout = pBlockData?.subQuestions || [];
          const csData = activeSubQsTimeout[currentSubIndexRef.current];
          const correctOpt = csData?.options?.find((o: Option) => o.isCorrect);
          const isCorrect = selectedOptionIdRef.current === correctOpt?.id;
          const ptsPerQuestion = Math.round((cq.points || 0) / (activeSubQsTimeout.length || 1));

          if (selectedOptionIdRef.current) {
            const newBlockAnswers = { ...sortedWordsRef.current, [`sq_${currentSubIndexRef.current}`]: selectedOptionIdRef.current as string };
            setSortedWords(newBlockAnswers);
            s.emit('submit_answer', { 
              sessionCode, 
              participantId: participantIdRef.current, 
              questionIndex: cq.index, 
              sortedWords: newBlockAnswers 
            });
          }
          
          setFeedback({
            ...data,
            isCorrect,
            pointsAwarded: (isCorrect && selectedOptionIdRef.current) ? ptsPerQuestion : 0,
            selectedOptionId: selectedOptionIdRef.current,
            options: csData?.options,
            explanation: csData?.explanation,
            isTimeout: true
          });
          setGameState('FEEDBACK');

        } else {
           s.emit('submit_answer', { 
             sessionCode, 
             participantId: participantIdRef.current, 
             questionIndex: cq.index, 
             sortedWords: sortedWordsRef.current 
           });
           
           let correctCount = 0;
           const validWords = cq.words?.filter(w => w.id !== 'case_study_payload') || [];
           const wordsMapping = validWords.map(w => {
             const userDroppedDomain = sortedWordsRef.current[w.id] || null;
             if (userDroppedDomain === w.domain) correctCount++;
             return { id: w.id, text: w.text, domain: w.domain, userDroppedDomain };
           });
           const totalWords = validWords.length;
           const percentage = totalWords > 0 ? correctCount / totalWords : 0;
           const pointsAwarded = Math.round((cq.points || 0) * percentage);

           setFeedback({ ...data, wordsMapping, pointsAwarded, isTimeout: true });
           setGameState('FEEDBACK');
        }
      } else {
        setGameState('FEEDBACK'); 
        setFeedback((prev: any) => ({ ...prev, ...data, isTimeout: true }));
      }
    });
    
    s.on('session_finalized', async (data) => { 
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sessions/${sessionCode}/analytics`);
        const analyticsData = await res.json();
        setFinalRankings(analyticsData.leaderboard);
      } catch(e) {
        setFinalRankings(data.leaderboard); 
      }
      setGameState('FINAL_RESULTS'); 
    });
    
    setSocket(s); return () => { s.disconnect(); };
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

  const handleProceed = () => {
    if (isCaseStudyBlock && !selectedOptionId) return;

    if (socket && currentQuestion) {
      if (isCaseStudyBlock) {
        
        const newBlockAnswers = { ...sortedWords, [`sq_${currentSubIndex}`]: selectedOptionId as string };
        setSortedWords(newBlockAnswers);
        
        socket.emit('submit_answer', { 
          sessionCode, 
          participantId, 
          questionIndex: currentQuestion.index, 
          sortedWords: newBlockAnswers 
        });
        
        const correctOpt = currentSubQuestionData?.options?.find((o: Option) => o.isCorrect);
        const isCorrect = selectedOptionId === correctOpt?.id;
        const ptsPerQuestion = Math.round((currentQuestion?.points || 0) / (activeSubQuestions.length || 1));
        
        setFeedback({
          isCorrect,
          pointsAwarded: isCorrect ? ptsPerQuestion : 0,
          selectedOptionId,
          options: currentSubQuestionData?.options,
          explanation: currentSubQuestionData?.explanation || "Explanation will be displayed shortly.",
          isTimeout: false
        });
        setGameState('FEEDBACK');
        
      } else {
        socket.emit('submit_answer', { sessionCode, participantId, questionIndex: currentQuestion.index, sortedWords });
        
        let correctCount = 0;
        const validWords = currentQuestion?.words?.filter(w => w.id !== 'case_study_payload') || [];
        const wordsMapping = validWords.map(w => {
          const userDroppedDomain = sortedWords[w.id] || null;
          if (userDroppedDomain === w.domain) correctCount++;
          return { id: w.id, text: w.text, domain: w.domain, userDroppedDomain };
        });
        
        const totalWords = validWords.length;
        const percentage = totalWords > 0 ? correctCount / totalWords : 0;
        const pointsAwarded = Math.round((currentQuestion?.points || 0) * percentage);

        setFeedback({ wordsMapping, pointsAwarded, isTimeout: false });
        setGameState('FEEDBACK');
      }
    }
  };

  const handleNextSubQuestion = () => {
    if (feedback?.isTimeout) {
      if (isLastQuestionOverall) setHasCompletedAll(true);
      setGameState('WAITING');
    } else if (isCaseStudyBlock && !isLastSubQuestion) {
      setCurrentSubIndex(prev => prev + 1);
      setGameState('QUESTION');
      setSelectedOptionId(null);
      setFeedback(null);
    } else {
      if (isLastQuestionOverall) setHasCompletedAll(true);
      setGameState('WAITING');
    }
  };

  const handleSortingProceed = () => {
    if (isLastQuestionOverall) setHasCompletedAll(true);
    setGameState('WAITING');
  };

  const getSortedWordsForDomain = (domainId: string) => {
    if (!currentQuestion?.words) return [];
    return Object.entries(sortedWords).filter(([_, d]) => d === domainId).map(([id, _]) => currentQuestion.words!.find(w => w.id === id)).filter(Boolean) as Word[];
  };

  const bucketList = ['Cognitive', 'Psychomotor', 'Affective'];
  const draggedWord = currentQuestion?.words?.find(w => w.id === activeDragId);

  let sortedStats = { correct: 0, incorrect: 0, missed: 0, breakdowns: [] as any[] };
  if (!isActuallyCaseStudyType && gameState === 'FEEDBACK' && feedback?.wordsMapping) {
    feedback.wordsMapping.forEach((dbWord: any) => {
      const userDomain = dbWord.userDroppedDomain || sortedWords[dbWord.id];
      if (!userDomain) {
        sortedStats.missed++; sortedStats.breakdowns.push({ ...dbWord, status: 'missed', userDroppedDomain: null });
      } else if (userDomain === dbWord.domain) {
        sortedStats.correct++; sortedStats.breakdowns.push({ ...dbWord, status: 'correct', userDroppedDomain: userDomain });
      } else {
        sortedStats.incorrect++; sortedStats.breakdowns.push({ ...dbWord, status: 'incorrect', userDroppedDomain: userDomain });
      }
    });
  }

  const displayedBreakdowns = sortedStats.breakdowns.filter(b => {
    if (activeFilter === 'DEFAULT') return b.status === 'incorrect' || b.status === 'missed';
    return b.status === activeFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col items-center justify-center p-3 md:p-6 font-sans selection:bg-indigo-100 overflow-x-hidden relative">
      
      {(gameState === 'JOINING' || gameState === 'WAITING') && (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e520_1px,transparent_1px),linear-gradient(to_bottom,#4f46e520_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/30 mix-blend-screen filter blur-[100px] animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/20 mix-blend-screen filter blur-[120px] animate-[spin_25s_linear_infinite_reverse]"></div>
          <div className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-purple-600/30 mix-blend-screen filter blur-[90px] animate-[pulse_8s_ease-in-out_infinite]"></div>
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[50px]"></div>
        </div>
      )}

      {gameState === 'JOINING' && (
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-md border border-slate-200 rounded-[2rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
          <h1 className="text-2xl font-black text-center mb-1 text-slate-800">Join Assessment</h1>
          <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-wider mb-6">PIN: {sessionCode}</p>
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setIsJoined(true); }} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your nickname..." required className="w-full p-4 bg-slate-50/50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-center font-bold text-base outline-none transition-all" />
            <button type="submit" disabled={isJoined} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2">
              {isJoined && <Spinner />}
              {isJoined ? 'Connecting...' : 'Join Arena'}
            </button>
          </form>
        </div>
      )}

      {gameState === 'WAITING' && (
        <div className="text-center space-y-4 max-w-sm bg-white/90 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-500">
          {hasCompletedAll ? (
            <>
              <span className="text-6xl block animate-pulse">⏳</span>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Assessment Completed!</h2>
              <p className="text-slate-500 font-bold mt-2 text-sm leading-relaxed">Waiting for the facilitator to compile final results...</p>
            </>
          ) : (
            <>
              <span className="text-6xl block animate-bounce">👋</span>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">You're in!</h2>
              <p className="text-slate-500 font-bold mt-2 text-sm leading-relaxed">Look up at the main screen. The assessment will begin (or resume) shortly.</p>
            </>
          )}
        </div>
      )}

      {gameState === 'QUESTION' && currentQuestion && (
        <div className={`w-full ${isCaseStudyBlock ? 'max-w-6xl' : 'max-w-4xl'} flex flex-col h-[90vh]`}>
          <div className="flex justify-between items-center bg-white border rounded-xl p-3 mb-2 shadow-sm flex-shrink-0">
            <span className={`text-[10px] font-bold text-white uppercase px-2 py-1 rounded ${isCaseStudyBlock ? 'bg-amber-500' : 'bg-indigo-500'}`}>
              Q {currentQuestion.index + 1} {isCaseStudyBlock && `| Case Study (Part ${currentSubIndex + 1}/${activeSubQuestions.length})`}
            </span>
            <div className={`font-mono text-sm font-black px-3 py-1 rounded-lg border ${timeLeft <= 30 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'text-slate-800'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {isActuallyCaseStudyType ? (
            isCaseStudyBlock && currentSubQuestionData ? (
              <div className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-4 overflow-hidden">
                {/* FIXED: Compressed mobile height to 35%, tightened padding, increased line-spacing to 1.3 */}
                <div className="lg:w-1/2 flex flex-col bg-white rounded-2xl md:rounded-3xl p-3 md:p-6 border shadow-sm h-[35%] lg:h-full overflow-hidden">
                  <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest mb-1.5 shrink-0">{blockTitle}</h3>
                  <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                    <div className="text-xs md:text-base text-slate-700 leading-[1.3] text-justify hyphens-auto font-medium space-y-3">
                      {caseStudyNarrative.split(/\r?\n+/).filter(p => p.trim() !== '').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FIXED: Expanded mobile height to 65% for options, tightened internal paddings */}
                <div className="lg:w-1/2 flex flex-col bg-slate-50 rounded-2xl md:rounded-3xl p-2 md:p-6 border shadow-inner h-[65%] lg:h-full overflow-hidden">
                  <div className="mb-1.5 shrink-0 px-1">
                    <h3 className="text-[11px] md:text-lg font-black text-slate-900 leading-tight text-justify hyphens-auto">
                      <span className="text-indigo-600 mr-1">Q{currentSubIndex + 1}:</span> {currentSubQuestionData.questionText}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 flex-1 overflow-y-auto content-start custom-scrollbar pr-1 mb-1">
                    {currentSubQuestionData.options?.map((opt: Option, i: number) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`px-2.5 py-1.5 md:p-4 rounded-xl border-2 text-left text-justify hyphens-auto transition-all ${
                          selectedOptionId === opt.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]'
                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="uppercase text-[8px] font-black tracking-widest opacity-50 block mb-0.5 leading-none">Option {String.fromCharCode(65 + i)}</span>
                        <span className="text-[11px] md:text-sm font-bold leading-tight block">{opt.text}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    disabled={!selectedOptionId}
                    onClick={handleProceed}
                    className={`w-full py-2.5 md:py-4 font-black rounded-xl shadow-sm text-xs md:text-sm transition-all flex-shrink-0 mt-1 ${
                       selectedOptionId ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Submit Answer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-100/50 rounded-3xl p-4 border shadow-inner text-slate-500">
                <p className="font-bold text-center">Error loading case study structure. Please wait for the host to proceed.</p>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col bg-slate-100/50 rounded-3xl p-2 md:p-4 border shadow-inner overflow-hidden transition-opacity duration-300">
              <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col h-[40%] min-h-[180px] mb-3">
                  <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Word Bank</h4>
                    <span className="bg-indigo-50 text-indigo-600 font-black text-[10px] px-2 py-0.5 rounded">{unsortedWords.length} Left</span>
                  </div>
                  <div className={`flex-1 overflow-y-auto p-2 relative flex flex-wrap content-start gap-2 justify-center`}>
                    {unsortedWords.map(w => <DraggableChip key={w.id} id={w.id} text={w.text} />)}
                  </div>
                </div>

                <div className={`flex-1 flex gap-2.5 overflow-x-auto pb-2 items-stretch h-[60%] ${activeDragId ? '' : 'snap-x snap-mandatory'}`}>
                  {bucketList.map(bucketLabel => (
                    <DroppableDomainList key={bucketLabel} id={bucketLabel} label={bucketLabel} words={getSortedWordsForDomain(bucketLabel)} baseDomain={bucketLabel} />
                  ))}
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeDragId && draggedWord ? <DraggableChipOverlay text={draggedWord.text} /> : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}

          {!isActuallyCaseStudyType && (
            <button 
              onClick={handleProceed} 
              className="mt-4 w-full py-3 font-black rounded-xl shadow-sm text-sm transition-colors bg-slate-900 hover:bg-slate-800 text-white active:scale-95 flex-shrink-0"
            >
              {isLastQuestionOverall ? 'Submit Assessment' : 'Proceed'}
            </button>
          )}
        </div>
      )}

      {gameState === 'FEEDBACK' && (
        <div className="w-full max-w-[500px] bg-white border rounded-3xl p-4 md:p-5 text-center shadow-xl flex flex-col my-2 animate-in fade-in slide-in-from-bottom-8 duration-500 max-h-[92vh]">
          
          {isActuallyCaseStudyType ? (
            <>
              {/* COMPACT FEEDBACK HEADER */}
              <div className="flex items-center justify-center gap-3 mb-3 shrink-0">
                <span className="text-3xl">{feedback?.isCorrect ? '✅' : '❌'}</span>
                <div className="flex flex-col items-start">
                   <span className="text-xl font-black leading-none">{feedback?.isCorrect ? 'Correct!' : 'Incorrect'}</span>
                   <span className="mt-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center font-black text-[10px] border border-indigo-100 shadow-sm leading-none">
                     +{feedback?.pointsAwarded || 0} pts
                   </span>
                </div>
                {feedback?.isTimeout && (
                  <div className="ml-2 px-2 py-1 bg-rose-50 text-rose-500 font-bold text-[9px] uppercase tracking-widest rounded-md border border-rose-100 animate-pulse">
                    ⏱️ Time Up
                  </div>
                )}
              </div>

              {/* COMPACT EXPLANATION BOX */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left shadow-inner flex flex-col flex-1 min-h-0 overflow-hidden relative">
                <h4 className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1 shrink-0">Analytical Breakdown</h4>
                <div className="max-h-[12vh] overflow-y-auto custom-scrollbar pr-2 mb-2 shrink-0">
                  <p className="text-[11px] font-bold text-slate-700 leading-relaxed italic text-justify hyphens-auto">
                    "{feedback?.explanation || 'Explanation details generating...'}"
                  </p>
                </div>

                <h4 className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1 shrink-0 border-t border-slate-200 pt-2">Options Review</h4>
                <div className="space-y-1.5 overflow-y-auto custom-scrollbar pr-1 flex-1 pb-1">
                  {feedback?.options?.map((opt: any) => {
                    const isTheCorrectOne = opt.isCorrect;
                    const isMyWrongAnswer = opt.id === feedback?.selectedOptionId && !isTheCorrectOne;
                    return (
                      <div key={opt.id} className={`p-2.5 rounded-lg border text-[11.5px] font-bold leading-snug flex items-start gap-2 text-justify hyphens-auto
                        ${isTheCorrectOne ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 
                          isMyWrongAnswer ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 
                          'bg-white border-slate-200 text-slate-500 opacity-60'}`}
                      >
                        <span className="flex-shrink-0 mt-[1px]">{isTheCorrectOne ? '✅' : isMyWrongAnswer ? '❌' : '➖'}</span>
                        <span>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <button onClick={handleNextSubQuestion} className="w-full py-3 mt-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all active:scale-95 text-sm shrink-0">
                 {feedback?.isTimeout ? 'Waiting for Host...' : isLastSubQuestion ? 'Finish Case Study' : 'Proceed to Next Question'} &rarr;
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3 mb-3 shrink-0">
                <span className="text-3xl">{feedback?.isTimeout ? '⏱️' : '📊'}</span>
                <div className="flex flex-col items-start">
                   <span className="text-xl font-black leading-none">{feedback?.isTimeout ? "Time's Up!" : "Submitted!"}</span>
                   <span className="mt-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center font-black text-[10px] border border-indigo-100 shadow-sm leading-none">
                     +{feedback?.pointsAwarded || 0} pts
                   </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col text-left shadow-inner relative flex-1 min-h-0 overflow-hidden">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 shrink-0 mt-2">Sorting Breakdown <span className="lowercase text-slate-400 font-medium tracking-normal ml-1">(Tap to filter)</span></p>
                
                <div className="grid grid-cols-3 gap-2 mb-2 shrink-0">
                  <button onClick={() => setActiveFilter(activeFilter === 'CORRECT' ? 'DEFAULT' : 'CORRECT')} className={`flex flex-col items-center justify-center bg-emerald-50 border py-1 px-1 rounded-xl text-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${activeFilter === 'CORRECT' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-100'}`}>
                    <span className="block text-xl font-black text-emerald-600 leading-tight">{sortedStats.correct}</span>
                    <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider mt-0.5">Correct</span>
                  </button>
                  <button onClick={() => setActiveFilter(activeFilter === 'INCORRECT' ? 'DEFAULT' : 'INCORRECT')} className={`flex flex-col items-center justify-center bg-rose-50 border py-1 px-1 rounded-xl text-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${activeFilter === 'INCORRECT' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-100'}`}>
                    <span className="block text-xl font-black text-rose-600 leading-tight">{sortedStats.incorrect}</span>
                    <span className="text-[9px] uppercase font-bold text-rose-500 tracking-wider mt-0.5">Incorrect</span>
                  </button>
                  <button onClick={() => setActiveFilter(activeFilter === 'MISSED' ? 'DEFAULT' : 'MISSED')} className={`flex flex-col items-center justify-center bg-white border py-1 px-1 rounded-xl text-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${activeFilter === 'MISSED' ? 'border-slate-500 ring-2 ring-slate-200' : 'border-slate-200'}`}>
                    <span className="block text-xl font-black text-slate-500 leading-tight">{sortedStats.missed}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Missed</span>
                  </button>
                </div>

                <div className="pt-2 flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5 shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors duration-300">
                      {activeFilter === 'DEFAULT' ? 'Missed & Incorrect' : activeFilter === 'CORRECT' ? 'Correctly Sorted' : activeFilter === 'INCORRECT' ? 'Incorrectly Sorted' : 'Missed Items'}
                    </p>
                    {activeFilter !== 'DEFAULT' && (
                      <button onClick={() => setActiveFilter('DEFAULT')} className="text-[9px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors uppercase tracking-wider">Reset</button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto space-y-1.5 pr-1.5 custom-scrollbar flex-1 pb-4">
                    {displayedBreakdowns.length === 0 ? (
                      <div className="flex items-center justify-center h-full pt-8 text-center text-slate-400 text-xs font-bold">No items match this filter.</div>
                    ) : (
                      displayedBreakdowns.map((b: any, idx: number) => (
                        <div key={idx} className={`flex flex-row justify-between items-center gap-2 px-3 py-2 rounded-lg bg-white border ${b.status === 'correct' ? 'border-emerald-200 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.2)]' : 'border-slate-700 shadow-sm'} transition-all hover:shadow-md`}>
                          <span className={`font-bold ${b.status === 'correct' ? 'text-emerald-700' : 'text-slate-800'} text-[11px] md:text-xs truncate`}>{b.text}</span>
                          <div className={`flex items-center gap-1.5 flex-shrink-0 px-2 py-0.5 rounded-md border ${b.status === 'correct' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                            {b.status === 'incorrect' ? <span className="text-[9px] md:text-[10px] font-bold text-rose-400 line-through tracking-wider">{b.userDroppedDomain}</span> : null}
                            {b.status === 'correct' ? (
                              <span className="font-black text-emerald-600 uppercase flex items-center gap-1 text-[9px] md:text-[10px] tracking-wider"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>{b.domain}</span>
                            ) : (
                              <span className="font-black text-emerald-500 uppercase flex items-center gap-1 text-[9px] md:text-[10px] tracking-wider">&rarr; {b.domain}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <button onClick={handleSortingProceed} className="mt-4 w-full py-3 font-black rounded-xl shadow-sm text-sm transition-colors bg-slate-900 hover:bg-slate-800 text-white active:scale-95 flex-shrink-0">
                {isLastQuestionOverall ? 'Submit Assessment' : 'Proceed'}
              </button>
            </>
          )}
        </div>
      )}

      {gameState === 'FINAL_RESULTS' && (() => {
        const myResult = finalRankings.find(item => item.name === name);
        const isWinner = myResult?.rank === 1;
        const isPodium = myResult?.rank > 1 && myResult?.rank <= 3;

        return (
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
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
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(252,211,77,0.6)] animate-bounce border-4 border-white"><span className="text-5xl">🏆</span></div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 tracking-tight">Outstanding!</h2>
                  <p className="text-slate-600 font-bold text-base">You took 1st place! 👏👏</p>
                </div>
              ) : isPodium ? (
                <div className="space-y-3 mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-300 rounded-full flex items-center justify-center mx-auto shadow-md border-4 border-white"><span className="text-5xl">{myResult?.rank === 2 ? '🥈' : '🥉'}</span></div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Podium Finish!</h2>
                  <p className="text-slate-500 font-bold text-base">Incredible effort! 👏</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border-4 border-indigo-100"><span className="text-5xl">🎯</span></div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Complete!</h2>
                  <p className="text-slate-500 font-bold text-base">Great job completing the module. 👏</p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Your Final Result</p>
                <div className="flex justify-around items-center">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Rank</span>
                    <span className={`text-4xl font-black ${isWinner ? 'text-amber-500' : 'text-slate-700'}`}>#{myResult?.rank || '-'}</span>
                  </div>
                  <div className="w-px h-12 bg-slate-200"></div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Score</span>
                    <span className="text-4xl font-black text-indigo-600">{myResult?.totalScore ?? myResult?.score ?? 0}</span>
                  </div>
                </div>
              </div>

              {myResult?.domainStats && myResult.domainStats.length > 0 && (
                <div className="mb-6 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm text-left">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Knowledge Gap Analysis</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {myResult.domainStats.map((ds: any) => {
                      const rating = getDescriptiveRating(ds.accuracyPercentage);
                      return (
                        <div key={ds.domain} className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-700">{ds.domain}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-slate-900">{ds.accuracyPercentage}%</span>
                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${rating.color}`}>
                               {rating.label}
                             </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => router.push('/')} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all active:scale-95 text-base">Return to Home</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}