'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';

const FIXED_TAXONOMY_WORDS = [
  { id: 'tax_c1', text: 'Remembering', domain: 'Cognitive' }, { id: 'tax_c2', text: 'Understanding', domain: 'Cognitive' },
  { id: 'tax_c3', text: 'Applying', domain: 'Cognitive' }, { id: 'tax_c4', text: 'Analyzing', domain: 'Cognitive' },
  { id: 'tax_c5', text: 'Evaluating', domain: 'Cognitive' }, { id: 'tax_c6', text: 'Creating', domain: 'Cognitive' },
  { id: 'tax_p1', text: 'Perception', domain: 'Psychomotor' }, { id: 'tax_p2', text: 'Set', domain: 'Psychomotor' },
  { id: 'tax_p3', text: 'Guided Response', domain: 'Psychomotor' }, { id: 'tax_p4', text: 'Mechanism', domain: 'Psychomotor' },
  { id: 'tax_p5', text: 'Complex Overt Response', domain: 'Psychomotor' }, { id: 'tax_p6', text: 'Adaptation', domain: 'Psychomotor' },
  { id: 'tax_p7', text: 'Origination', domain: 'Psychomotor' }, { id: 'tax_a1', text: 'Receiving Phenomena', domain: 'Affective' },
  { id: 'tax_a2', text: 'Responding', domain: 'Affective' }, { id: 'tax_a3', text: 'Valuing', domain: 'Affective' },
  { id: 'tax_a4', text: 'Organization', domain: 'Affective' }, { id: 'tax_a5', text: 'Internalizing Values', domain: 'Affective' }
];

const AutoExpandTextarea = ({ value, onChange, placeholder, required = false, className = "", minHeight = 42 }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startY = useRef(0);
  const startH = useRef(0);

  const handleAutoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(minHeight, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => { handleAutoResize(); }, [value]);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        rows={1}
        required={required}
        value={value}
        onChange={(e) => { onChange(e); handleAutoResize(); }}
        placeholder={placeholder}
        className={`w-full resize-y overflow-y-auto pr-6 ${className}`}
        style={{ minHeight: `${minHeight}px` }}
      />
      <div
        onTouchStart={(e) => {
          startY.current = e.touches[0].clientY;
          if (textareaRef.current) startH.current = textareaRef.current.clientHeight;
        }}
        onTouchMove={(e) => {
          const delta = e.touches[0].clientY - startY.current;
          if (textareaRef.current) {
            textareaRef.current.style.height = `${Math.max(minHeight, startH.current + delta)}px`;
          }
        }}
        className="absolute bottom-1 right-1 w-8 h-8 cursor-ns-resize flex items-end justify-end p-1.5 text-slate-400 opacity-60 hover:opacity-100 touch-none z-10"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="14" x2="14" y2="21"></line><line x1="21" y1="7" x2="7" y2="21"></line>
        </svg>
      </div>
    </div>
  );
};

interface Word { id: string; text: string; domain: string; }
interface Objective {
  id: string; questionType: 'RAPID_SORT' | 'TAXONOMY_LEVEL'; words: Word[]; aiTopic: string; wordCount: number; isGeneratingAi: boolean; isExpanded: boolean;
}

export default function CreateTrainingModulePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlueprintExpanded, setIsBlueprintExpanded] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [objectives, setObjectives] = useState<Objective[]>([{ id: `obj_${Date.now()}`, questionType: 'RAPID_SORT', words: [], aiTopic: '', wordCount: 15, isGeneratingAi: false, isExpanded: true }]);

  const startY = useRef<{ [key: number]: number }>({});
  const startH = useRef<{ [key: number]: number }>({});

  const handleAddObjective = () => setObjectives([...objectives, { id: `obj_${Date.now()}`, questionType: 'RAPID_SORT', words: [], aiTopic: '', wordCount: 15, isGeneratingAi: false, isExpanded: true }]);
  
  const handleRemoveObjective = (index: number) => { 
    if (objectives.length === 1) return showToast('You must have at least one question block.', 'error'); 
    const updated = [...objectives]; 
    updated.splice(index, 1); 
    setObjectives(updated); 
  };
  
  const handleObjectiveChange = (index: number, field: keyof Objective, value: any) => { 
    const updated = [...objectives]; 
    (updated[index] as any)[field] = value; 
    
    if (field === 'questionType' && value === 'TAXONOMY_LEVEL') {
      updated[index].words = [...FIXED_TAXONOMY_WORDS];
      updated[index].aiTopic = 'Sort the 18 educational taxonomy levels into their correct learning domains.';
    } else if (field === 'questionType' && value === 'RAPID_SORT') {
      updated[index].words = [];
      updated[index].aiTopic = '';
    }
    setObjectives(updated); 
  };
  
  const handleToggleExpand = (index: number) => { const updated = [...objectives]; updated[index].isExpanded = !updated[index].isExpanded; setObjectives(updated); };

  const handleGenerateAI = async (index: number) => {
    const obj = objectives[index];
    if (obj.questionType === 'TAXONOMY_LEVEL') return; 
    if (!obj.aiTopic.trim()) return showToast("Please enter a training topic first.", "info");
    
    const loadingState = [...objectives]; loadingState[index].isGeneratingAi = true; setObjectives(loadingState);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const payload = { topic: obj.aiTopic, mode: obj.questionType, wordCount: obj.wordCount };

      const res = await fetch(`${baseUrl}/api/ai/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'AI Generation failed.');
      
      const updatedDone = [...objectives]; updatedDone[index].words = data.words; updatedDone[index].isGeneratingAi = false; setObjectives(updatedDone);
      showToast('AI Generation Complete!', 'success');

    } catch (err: any) {
      showToast(err.message || 'Error communicating with AI service.', 'error');
      const errorState = [...objectives]; errorState[index].isGeneratingAi = false; setObjectives(errorState);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!title.trim()) return showToast("Please enter an Assessment Title.", "error");
    setIsSubmitting(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const formattedQuestions = objectives.map((obj, index) => {
        if (!obj.words || obj.words.length === 0) throw new Error(`Question block #${index + 1} requires words.`);
        
        // BUG FIX: Cap the max points to 1000 so the database doesn't reject it
        const calculatedPoints = Math.min(obj.words.length * 50, 1000); 

        return {
          questionType: obj.questionType, 
          prompt: obj.questionType === 'RAPID_SORT' ? `Rapid Sort: Categorize terms related to ${obj.aiTopic}` : `Taxonomy Level: ${obj.aiTopic}`, 
          timeLimitSeconds: obj.questionType === 'RAPID_SORT' ? 60 : 120, 
          points: calculatedPoints, 
          explanation: `Categorized ${obj.words.length} items into 3 domains.`,
          words: obj.words, options: [] 
        };
      });
      
      const response = await fetch(`${baseUrl}/api/banks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category: 'AI Assessment', createdBy: 'admin_host', questions: formattedQuestions })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Backend Error`);
      
      showToast('Assessment successfully published!', 'success');
      router.push('/admin/dashboard');

    } catch (error: any) { 
      showToast(error.message, 'error'); 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-28 text-sm">
      
      {/* SIMPLIFIED: Publish Assessment */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div><h2 className="font-bold text-slate-800">Publish Assessment</h2></div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">{isSubmitting ? 'Publishing...' : 'Publish'}</button>
      </div>

      {/* SIMPLIFIED: Basic Information */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-slate-900 cursor-pointer" onClick={() => setIsBlueprintExpanded(!isBlueprintExpanded)}>Basic Information</h2>
        </div>
        {isBlueprintExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutoExpandTextarea 
              required 
              value={title} 
              onChange={(e: any) => setTitle(e.target.value)} 
              placeholder="Assessment Title (Leadership Training)" 
              className="px-3 py-2 bg-slate-50 border rounded-lg outline-none font-medium text-slate-900" 
            />
            <AutoExpandTextarea 
              value={description} 
              onChange={(e: any) => setDescription(e.target.value)} 
              placeholder="Short description..." 
              className="px-3 py-2 bg-slate-50 border rounded-lg outline-none font-medium text-slate-900" 
            />
          </div>
        )}
      </section>

      <div className="space-y-4">
        {objectives.map((obj, index) => (
          <section key={obj.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${obj.questionType === 'TAXONOMY_LEVEL' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">{index + 1}</span>
                <div className="flex bg-slate-100 p-1 rounded-md">
                  <button type="button" onClick={() => handleObjectiveChange(index, 'questionType', 'RAPID_SORT')} className={`px-2 py-1 text-xs font-bold rounded transition-all ${obj.questionType === 'RAPID_SORT' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-purple-600'}`}>✨ AI Rapid Sort</button>
                  <button type="button" onClick={() => handleObjectiveChange(index, 'questionType', 'TAXONOMY_LEVEL')} className={`px-2 py-1 text-xs font-bold rounded transition-all ${obj.questionType === 'TAXONOMY_LEVEL' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-600'}`}>✨ Taxonomy Level</button>
                </div>
              </div>
              <button onClick={() => handleRemoveObjective(index)} className="text-rose-400 hover:text-rose-600">&times;</button>
            </div>

            <div className={`p-4 rounded-xl border space-y-4 ${obj.questionType === 'TAXONOMY_LEVEL' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-purple-50/50 border-purple-100'}`}>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  {/* SIMPLIFIED: Training Topic */}
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                    {obj.questionType === 'RAPID_SORT' ? 'Training Topic' : 'Assessment Instructions'}
                  </label>
                  <AutoExpandTextarea 
                    value={obj.aiTopic} 
                    onChange={(e: any) => handleObjectiveChange(index, 'aiTopic', e.target.value)} 
                    placeholder="e.g., Customer Service, Fire Safety..." 
                    className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-900 shadow-sm" 
                  />
                </div>

                {obj.questionType === 'RAPID_SORT' && (
                  <div className="w-full md:w-24">
                    {/* SIMPLIFIED: Word Counts */}
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">Word Counts</label>
                    <input type="number" min="3" max="50" value={obj.wordCount} onChange={(e) => handleObjectiveChange(index, 'wordCount', Number(e.target.value))} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-bold shadow-sm" />
                  </div>
                )}
                
                {obj.questionType === 'RAPID_SORT' && (
                  <button type="button" onClick={(e) => { e.preventDefault(); handleGenerateAI(index); }} disabled={obj.isGeneratingAi || !obj.aiTopic.trim()} className="px-4 py-2 text-white text-xs font-black rounded-lg shadow-sm w-full md:w-auto bg-purple-600 mb-[1px]">
                    {obj.isGeneratingAi ? 'Generating...' : '✨ Generate'}
                  </button>
                )}
              </div>

              {obj.words.length > 0 && (
                <div className="pt-3 border-t border-slate-200/50">
                  <span className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center justify-between">
                    Generated Preview ({obj.words.length})
                    {obj.questionType === 'RAPID_SORT' && <button type="button" onClick={() => handleObjectiveChange(index, 'words', [])} className="text-rose-400 hover:text-rose-600">Clear</button>}
                  </span>
                  
                  <div className="relative group">
                    <div 
                      id={`preview-box-${index}`}
                      className="resize-y overflow-y-auto min-h-[140px] p-3 bg-white/60 rounded-xl border border-slate-200 flex flex-wrap justify-center content-start gap-2.5 shadow-inner transition-colors duration-200"
                    >
                      {obj.words.map((word, wIdx) => (
                        <span key={wIdx} className="px-3 py-1.5 text-[13px] md:text-sm font-bold rounded-lg border bg-white flex items-center gap-1.5 shadow-sm">
                          {word.text} <span className="text-[10px] md:text-xs text-slate-400">({word.domain})</span>
                          {obj.questionType === 'RAPID_SORT' && <button type="button" onClick={() => { const newWords = [...obj.words]; newWords.splice(wIdx, 1); handleObjectiveChange(index, 'words', newWords); }} className="text-rose-400 hover:text-rose-600 ml-1 transition-colors">&times;</button>}
                        </span>
                      ))}
                    </div>
                    
                    <div 
                      onTouchStart={(e) => {
                        startY.current[index] = e.touches[0].clientY;
                        const el = document.getElementById(`preview-box-${index}`);
                        if (el) startH.current[index] = el.clientHeight;
                      }}
                      onTouchMove={(e) => {
                        const delta = e.touches[0].clientY - startY.current[index];
                        const el = document.getElementById(`preview-box-${index}`);
                        if (el) { el.style.height = `${Math.max(140, startH.current[index] + delta)}px`; }
                      }}
                      className="absolute bottom-0 right-0 w-10 h-10 cursor-ns-resize flex items-end justify-end p-2 text-slate-400 opacity-60 hover:opacity-100 touch-none z-10"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="21" y1="14" x2="14" y2="21"></line><line x1="21" y1="7" x2="7" y2="21"></line>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}
        {/* SIMPLIFIED: Add Question Block */}
        <button type="button" onClick={handleAddObjective} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 text-sm font-bold shadow-sm hover:bg-slate-50">
          + Add Question Block
        </button>
      </div>
    </div>
  );
}