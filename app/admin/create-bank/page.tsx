'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { apiFetch } from '../../../lib/api';

const Spinner = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

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
interface SubQuestion { question: string; options: string[]; correctOptionIndex: number; explanation: string; }
interface CaseStudyBlock { title: string; caseStudy: string; questions: SubQuestion[]; }

interface Objective {
  id: string; 
  questionType: 'RAPID_SORT' | 'TAXONOMY_LEVEL' | 'SCENARIO_MCQ'; 
  words: Word[]; 
  caseStudyBlock: CaseStudyBlock | null;
  aiTopic: string; 
  wordCount: number; 
  isGeneratingAi: boolean; 
  isExpanded: boolean;
}

export default function CreateTrainingModulePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlueprintExpanded, setIsBlueprintExpanded] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [objectives, setObjectives] = useState<Objective[]>([{ 
    id: `obj_${Date.now()}`, questionType: 'RAPID_SORT', words: [], caseStudyBlock: null, aiTopic: '', wordCount: 15, isGeneratingAi: false, isExpanded: true 
  }]);

  useEffect(() => {
    const draftData = sessionStorage.getItem('domainAssess_draft_bank');
    if (draftData) {
      try {
        const { title: draftTitle, aiTopic, words } = JSON.parse(draftData);
        setTitle(draftTitle);
        setDescription('Imported from Objective Studio.');
        setObjectives([{ id: `obj_${Date.now()}`, questionType: 'RAPID_SORT', words: words, caseStudyBlock: null, aiTopic: aiTopic, wordCount: words.length, isGeneratingAi: false, isExpanded: true }]);
        sessionStorage.removeItem('domainAssess_draft_bank');
        showToast('Draft imported successfully! Ready to publish.', 'success');
      } catch (e) {
        console.error('Failed to parse draft data');
      }
    }
  }, [showToast]);

  const handleAddObjective = () => setObjectives([...objectives, { id: `obj_${Date.now()}`, questionType: 'RAPID_SORT', words: [], caseStudyBlock: null, aiTopic: '', wordCount: 15, isGeneratingAi: false, isExpanded: true }]);
  
  const handleRemoveObjective = (index: number) => { 
    if (objectives.length === 1) return showToast('You must have at least one module block.', 'error'); 
    const updated = [...objectives]; updated.splice(index, 1); setObjectives(updated); 
  };
  
  const handleObjectiveChange = (index: number, field: keyof Objective, value: any) => { 
    const updated = [...objectives]; 
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'questionType') {
      updated[index].aiTopic = '';
      if (value === 'TAXONOMY_LEVEL') {
        updated[index].words = [...FIXED_TAXONOMY_WORDS];
        updated[index].caseStudyBlock = null;
        updated[index].aiTopic = 'Sort the 18 educational taxonomy levels into their correct learning domains.';
      } else if (value === 'RAPID_SORT') {
        updated[index].words = [];
        updated[index].caseStudyBlock = null;
        updated[index].wordCount = 15;
      } else if (value === 'SCENARIO_MCQ') {
        updated[index].words = [];
        updated[index].caseStudyBlock = null;
        updated[index].wordCount = 5;
      }
    }
    setObjectives(updated); 
  };

  const handleDeleteSubQuestion = (objIndex: number, qIndex: number) => {
    const updated = [...objectives];
    if (updated[objIndex].caseStudyBlock) {
      updated[objIndex].caseStudyBlock!.questions.splice(qIndex, 1);
      setObjectives(updated);
      showToast('Question removed from the block.', 'info');
    }
  };

  const handleGenerateAI = async (index: number) => {
    const obj = objectives[index];
    if (obj.questionType === 'TAXONOMY_LEVEL') return; 
    if (!obj.aiTopic.trim()) return showToast("Please enter a training topic first.", "info");
    
    const loadingState = [...objectives]; 
    loadingState[index] = { ...loadingState[index], isGeneratingAi: true };
    setObjectives(loadingState);

    try {
      const res = await apiFetch('/api/ai/generate', { 
        method: 'POST', 
        body: JSON.stringify({ topic: obj.aiTopic, mode: obj.questionType, wordCount: obj.wordCount }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Generation failed.');
      
      const updatedDone = [...objectives]; 
      if (obj.questionType === 'SCENARIO_MCQ') {
        const blockData = data.caseStudyBlock;
        if (!blockData.title) blockData.title = `${obj.aiTopic} Case Study`;
        updatedDone[index] = { ...updatedDone[index], caseStudyBlock: blockData, isGeneratingAi: false };
      } else {
        updatedDone[index] = { ...updatedDone[index], words: data.words, isGeneratingAi: false };
      }
      setObjectives(updatedDone);
      showToast('AI Generation Complete! Review your block.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error communicating with AI service.', 'error');
      const errorState = [...objectives]; errorState[index] = { ...errorState[index], isGeneratingAi: false };
      setObjectives(errorState);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!title.trim()) return showToast("Please enter an Assessment Title.", "error");
    setIsSubmitting(true);
    
    try {
      const formattedQuestions: any[] = [];
      
      objectives.forEach((obj, index) => {
        if (obj.questionType === 'SCENARIO_MCQ') {
          if (!obj.caseStudyBlock || obj.caseStudyBlock.questions.length === 0) throw new Error(`Block #${index + 1} requires generated scenarios.`);
          
          const subQs = obj.caseStudyBlock.questions.map((q, idx) => ({
            questionText: q.question,
            options: q.options.map((opt, oIdx) => ({
              id: `opt_${Date.now()}_${idx}_${oIdx}`,
              text: opt,
              isCorrect: oIdx === q.correctOptionIndex
            })),
            explanation: q.explanation
          }));

          const safePayload = JSON.stringify({
            title: obj.caseStudyBlock.title,
            caseStudy: obj.caseStudyBlock.caseStudy,
            subQuestions: subQs
          });

          // Trojan Horse Data: Transforms sub-question logic to be seamlessly graded by the server's sorting engine
          const wordsHack: any[] = subQs.map((q, idx) => {
             const correctOpt = q.options.find(o => o.isCorrect);
             return {
                id: `sq_${idx}`,
                text: `Question ${idx + 1}`,
                domain: correctOpt?.id || 'unknown'
             };
          });

          // ADDED BACK: Guarantees the data is never lost by the backend
          wordsHack.push({
             id: 'case_study_payload',
             text: safePayload,
             domain: 'Payload'
          });

          formattedQuestions.push({
            questionType: 'CASE_STUDY_BLOCK',
            title: obj.caseStudyBlock.title,
            prompt: obj.caseStudyBlock.caseStudy + '|||PAYLOAD|||' + safePayload,
            timeLimitSeconds: obj.caseStudyBlock.questions.length * 60,
            points: obj.caseStudyBlock.questions.length * 100, 
            words: wordsHack, 
            options: [], 
            subQuestions: subQs,
            explanation: safePayload
          });
        } else {
          if (!obj.words || obj.words.length === 0) throw new Error(`Question block #${index + 1} requires words.`);
          const calculatedPoints = Math.min(obj.words.length * 50, 1000); 
          formattedQuestions.push({
            questionType: obj.questionType, 
            prompt: obj.questionType === 'RAPID_SORT' ? `Rapid Sort: Categorize terms related to ${obj.aiTopic}` : `Taxonomy Level: ${obj.aiTopic}`, 
            timeLimitSeconds: obj.questionType === 'RAPID_SORT' ? 60 : 120, 
            points: calculatedPoints, 
            explanation: `Categorized ${obj.words.length} items into 3 domains.`,
            words: obj.words, options: [] 
          });
        }
      });
      
      const creatorName = localStorage.getItem('domainassess_admin_name') || 'admin';

      const response = await apiFetch('/api/banks', {
        method: 'POST',
        body: JSON.stringify({ title, description, category: 'AI Hybrid Assessment', createdBy: creatorName, questions: formattedQuestions })
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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div><h2 className="font-bold text-slate-800">Publish Assessment</h2></div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-75 transition-all">
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </div>

      <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-slate-900 cursor-pointer" onClick={() => setIsBlueprintExpanded(!isBlueprintExpanded)}>Basic Information</h2>
        </div>
        {isBlueprintExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutoExpandTextarea required value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Assessment Title (e.g., Compliance Hybrid Review)" className="px-3 py-2 bg-slate-50 border rounded-lg outline-none font-medium text-slate-900" />
            <AutoExpandTextarea value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Short description..." className="px-3 py-2 bg-slate-50 border rounded-lg outline-none font-medium text-slate-900" />
          </div>
        )}
      </section>

      <div className="space-y-4">
        {objectives.map((obj, index) => (
          <section key={obj.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
            <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${obj.questionType === 'TAXONOMY_LEVEL' ? 'bg-emerald-500' : obj.questionType === 'SCENARIO_MCQ' ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
            <div className="flex justify-between items-center mb-3 pl-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">{index + 1}</span>
                <div className="flex bg-slate-100 p-1 rounded-md">
                  <button type="button" onClick={() => handleObjectiveChange(index, 'questionType', 'RAPID_SORT')} className={`px-2 py-1 text-xs font-bold rounded transition-all ${obj.questionType === 'RAPID_SORT' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-purple-600'}`}>Scenario Categorization</button>
                  <button type="button" onClick={() => handleObjectiveChange(index, 'questionType', 'SCENARIO_MCQ')} className={`px-2 py-1 text-xs font-bold rounded transition-all ${obj.questionType === 'SCENARIO_MCQ' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:text-amber-600'}`}>Case Study</button>
                  <button type="button" onClick={() => handleObjectiveChange(index, 'questionType', 'TAXONOMY_LEVEL')} className={`px-2 py-1 text-xs font-bold rounded transition-all ${obj.questionType === 'TAXONOMY_LEVEL' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-600'}`}>Domain Mastery</button>
                </div>
              </div>
              <button onClick={() => handleRemoveObjective(index)} className="text-rose-400 hover:text-rose-600">&times;</button>
            </div>

            <div className={`p-4 rounded-xl border space-y-4 ml-2 ${obj.questionType === 'TAXONOMY_LEVEL' ? 'bg-emerald-50/50 border-emerald-100' : obj.questionType === 'SCENARIO_MCQ' ? 'bg-amber-50/30 border-amber-100' : 'bg-purple-50/50 border-purple-100'}`}>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                    {obj.questionType === 'TAXONOMY_LEVEL' ? 'Instructions' : obj.questionType === 'SCENARIO_MCQ' ? 'Real-World Case Study / Topic' : 'Core Topic & Context'}
                  </label>
                  <AutoExpandTextarea value={obj.aiTopic} onChange={(e: any) => handleObjectiveChange(index, 'aiTopic', e.target.value)} placeholder={obj.questionType === 'SCENARIO_MCQ' ? "e.g., Corporate Governance Enron Scandal..." : "e.g., Customer Service, Fire Safety..."} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-900 shadow-sm" />
                </div>

                {obj.questionType !== 'TAXONOMY_LEVEL' && (
                  <div className="w-full md:w-24 flex-shrink-0">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">{obj.questionType === 'SCENARIO_MCQ' ? 'Questions' : 'Words'}</label>
                    <input type="number" min="1" max={obj.questionType === 'SCENARIO_MCQ' ? 15 : 50} value={obj.wordCount} onChange={(e) => handleObjectiveChange(index, 'wordCount', Number(e.target.value))} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none font-bold shadow-sm" />
                  </div>
                )}
                
                {obj.questionType !== 'TAXONOMY_LEVEL' && (
                  <button type="button" onClick={(e) => { e.preventDefault(); handleGenerateAI(index); }} disabled={obj.isGeneratingAi || !obj.aiTopic.trim()} className={`flex items-center justify-center gap-2 px-4 py-2 text-white text-xs font-black rounded-lg shadow-sm w-full md:w-auto mb-[1px] disabled:opacity-75 transition-all ${obj.questionType === 'SCENARIO_MCQ' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-600 hover:bg-purple-700'}`}>
                    {obj.isGeneratingAi ? <Spinner /> : '✨'}
                    {obj.isGeneratingAi ? 'Drafting...' : 'Generate'}
                  </button>
                )}
              </div>

              {obj.questionType === 'RAPID_SORT' && obj.words.length > 0 && (
                <div className="pt-3 border-t border-slate-200/50">
                  <span className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center justify-between">
                    Generated Preview ({obj.words.length})
                    <button type="button" onClick={() => handleObjectiveChange(index, 'words', [])} className="text-rose-400 hover:text-rose-600">Clear</button>
                  </span>
                  
                  <div className="relative group">
                    <div id={`preview-box-${index}`} className="resize-y overflow-y-auto min-h-[140px] p-3 bg-white/60 rounded-xl border border-slate-200 flex flex-wrap justify-center content-start gap-2.5 shadow-inner transition-colors duration-200">
                      {obj.words.map((word, wIdx) => (
                        <span key={wIdx} className="px-3 py-1.5 text-[13px] md:text-sm font-bold rounded-lg border bg-white flex items-center gap-1.5 shadow-sm">
                          {word.text} <span className="text-[10px] md:text-xs text-slate-400">({word.domain})</span>
                          <button type="button" onClick={() => { const newWords = [...obj.words]; newWords.splice(wIdx, 1); handleObjectiveChange(index, 'words', newWords); }} className="text-rose-400 hover:text-rose-600 ml-1 transition-colors">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {obj.questionType === 'TAXONOMY_LEVEL' && obj.words.length > 0 && (
                <div className="pt-3 border-t border-slate-200/50">
                  <span className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center justify-between">
                    Generated Preview ({obj.words.length})
                  </span>
                  <div className="relative group">
                    <div className="overflow-y-auto min-h-[140px] p-3 bg-white/60 rounded-xl border border-slate-200 flex flex-wrap justify-center content-start gap-2.5 shadow-inner">
                      {obj.words.map((word, wIdx) => (
                        <span key={wIdx} className="px-3 py-1.5 text-[13px] md:text-sm font-bold rounded-lg border bg-white flex items-center gap-1.5 shadow-sm">
                          {word.text} <span className="text-[10px] md:text-xs text-slate-400">({word.domain})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {obj.questionType === 'SCENARIO_MCQ' && obj.caseStudyBlock && (
                <div className="pt-3 border-t border-slate-200/50">
                  <span className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center justify-between">
                    Generated Case Study ({obj.caseStudyBlock.questions.length} Questions)
                    <button type="button" onClick={() => handleObjectiveChange(index, 'caseStudyBlock', null)} className="text-rose-400 hover:text-rose-600">Clear</button>
                  </span>
                  
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Refined Title</span>
                    <input 
                      type="text"
                      value={obj.caseStudyBlock.title || ''}
                      onChange={(e) => {
                        const updated = [...objectives];
                        if(updated[index].caseStudyBlock) updated[index].caseStudyBlock!.title = e.target.value;
                        setObjectives(updated);
                      }}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-slate-900 shadow-sm mb-4 text-justify"
                    />

                    <span className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Case Study Narrative</span>
                    <AutoExpandTextarea 
                       value={obj.caseStudyBlock.caseStudy} 
                       onChange={(e: any) => {
                          const updated = [...objectives];
                          if(updated[index].caseStudyBlock) updated[index].caseStudyBlock!.caseStudy = e.target.value;
                          setObjectives(updated);
                       }} 
                       className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed border border-slate-100 w-full text-justify hyphens-auto" 
                    />
                  </div>

                  <div className="space-y-4">
                    {obj.caseStudyBlock.questions.map((mcq, mIdx) => (
                      <div key={mIdx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group">
                        <button onClick={() => handleDeleteSubQuestion(index, mIdx)} className="absolute top-3 right-3 p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        
                        <p className="font-bold text-slate-900 mb-3 pr-8 text-justify hyphens-auto"><span className="text-amber-500 mr-1">{mIdx + 1}.</span> {mcq.question}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          {mcq.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-2 border rounded-lg text-xs font-bold text-justify hyphens-auto ${oIdx === mcq.correctOptionIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                              <span className="mr-2 uppercase opacity-50">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 items-start mt-2 border-t pt-3">
                          <span className="text-amber-500 font-black mt-0.5">💡</span>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed italic text-justify hyphens-auto">{mcq.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}
        <button type="button" onClick={handleAddObjective} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 text-sm font-bold shadow-sm hover:bg-slate-50">
          + Add Section
        </button>
      </div>
    </div>
  );
}