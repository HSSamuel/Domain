'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { apiFetch } from '../../../lib/api';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface Objective {
  domain: string;
  level: string;
  verb: string;
  context: string;
  alternatives: string[];
}

// Map textual levels to their numerical hierarchy
const getLevelNumber = (domain: string, level: string) => {
  const levels: Record<string, Record<string, number>> = {
    Cognitive: { 'Remembering': 1, 'Understanding': 2, 'Applying': 3, 'Analyzing': 4, 'Evaluating': 5, 'Creating': 6 },
    Psychomotor: { 'Perception': 1, 'Set': 2, 'Guided Response': 3, 'Mechanism': 4, 'Complex Overt Response': 5, 'Adaptation': 6, 'Origination': 7 },
    Affective: { 'Receiving Phenomena': 1, 'Responding': 2, 'Valuing': 3, 'Organization': 4, 'Internalizing Values': 5 }
  };
  const num = levels[domain]?.[level];
  return num ? `Level ${num}: ${level}` : level;
};

export default function ObjectiveBuilderPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return showToast("Please enter a training topic.", "error");
    setIsGenerating(true);

    try {
      const res = await apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ topic, audience, mode: 'OBJECTIVE_BUILDER', wordCount: 6 })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'AI Generation failed.');
      
      setObjectives(data.objectives);
      showToast('Learning objectives generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating objectives.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSwapVerb = (objIndex: number, newVerb: string) => {
    const updated = [...objectives];
    const currentVerb = updated[objIndex].verb;
    updated[objIndex].alternatives = updated[objIndex].alternatives.filter(v => v !== newVerb);
    updated[objIndex].alternatives.push(currentVerb);
    updated[objIndex].verb = newVerb;
    setObjectives(updated);
  };

  const copyToClipboard = () => {
    const text = objectives.map((obj, i) => `${i + 1}. By the end of this session, participants will be able to ${obj.verb.toLowerCase()} ${obj.context}`).join('\n');
    navigator.clipboard.writeText(`Training Topic: ${topic}\nTarget Audience: ${audience}\n\nObjectives:\n${text}`);
    showToast('Copied to clipboard! Ready to paste into your presentation.', 'success');
  };

  const handleSendToArena = () => {
    const formattedWords = objectives.map((obj, i) => ({
      id: `word_${Date.now()}_${i}`,
      text: `${obj.verb} ${obj.context}`,
      domain: obj.domain 
    }));
    
    const draftData = {
      title: `${topic} - Interactive Assessment`,
      aiTopic: topic,
      words: formattedWords
    };
    
    sessionStorage.setItem('domainAssess_draft_bank', JSON.stringify(draftData));
    showToast('Transferring to Arena...', 'info');
    router.push('/admin/create-bank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28 text-sm">
      
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">AI Curriculum Builder</h2>
          <p className="text-slate-500 font-medium mt-1">Generate measurable learning outcomes with interactive, taxonomy-locked action verbs.</p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Broad Topic/Goal</label>
            <input 
              type="text" 
              required
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g., Cybersecurity Awareness, Conflict Resolution..." 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 shadow-inner focus:border-indigo-500 transition-colors" 
            />
          </div>
          <div className="w-full md:w-48 flex-shrink-0">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Target Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 shadow-inner">
              <option value="Beginner">Beginners</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Experts/Leadership</option>
            </select>
          </div>
          <button type="submit" disabled={isGenerating} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-75">
            {isGenerating ? <Spinner /> : '✨'}
            {isGenerating ? 'Drafting...' : 'Draft Objectives'}
          </button>
        </form>
      </div>

      {objectives.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
            <h3 className="font-black text-lg text-slate-800">Your Learning Objectives</h3>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button onClick={copyToClipboard} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy Text
              </button>
              
              <button onClick={handleSendToArena} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg transition-colors text-xs shadow-sm group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Send to Arena
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-slate-500 italic font-medium">By the end of this session, participants will be able to...</p>
            
            {objectives.map((obj, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs flex-shrink-0 mt-1">{idx + 1}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-2 py-0.5 rounded shadow-sm">{obj.domain}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded shadow-sm">
                      {getLevelNumber(obj.domain, obj.level)}
                    </span>
                  </div>
                  
                  <div className="text-base font-medium text-slate-700 leading-relaxed">
                    <div className="relative inline-block mr-1 group/dropdown">
                      <button className="font-black text-indigo-600 border-b-2 border-dashed border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 px-1 rounded transition-colors inline-flex items-center gap-1">
                        {obj.verb.toLowerCase()}
                        <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-20 overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">Taxonomy Alternatives</div>
                        {obj.alternatives.map((alt, altIdx) => (
                          <button key={altIdx} onClick={() => handleSwapVerb(idx, alt)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                            {alt.toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {obj.context}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}