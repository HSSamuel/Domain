'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { apiFetch } from '../../../lib/api';
import pptxgen from "pptxgenjs";

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

interface VisualSuggestion {
  type: 'image' | 'smart_art' | 'process_flow' | 'none';
  data: {
    keyword?: string;
    items?: { title: string; description: string }[];
    steps?: string[];
    chartData?: { label: string; value: number }[];
  };
}

interface Slide {
  slideNumber: number;
  title: string;
  domainLevel: string;
  keyPoints: string[];
  visualSuggestion?: VisualSuggestion;
  facilitatorNotes: string;
  engagementPrompt: string;
  durationMinutes: number;
}

interface Presentation {
  deckTitle: string;
  estimatedDurationMinutes: number;
  slides: Slide[];
}

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

  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [activeTab, setActiveTab] = useState<'OBJECTIVES' | 'PRESENTATION'>('OBJECTIVES');
  const [slideCount, setSlideCount] = useState<number>(5);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownIndex(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);
  
  useEffect(() => {
    const savedState = sessionStorage.getItem('domainAssess_builder_draft');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.audience) setAudience(parsed.audience);
        if (parsed.objectives) setObjectives(parsed.objectives);
        if (parsed.presentation) setPresentation(parsed.presentation);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.slideCount) setSlideCount(parsed.slideCount);
      } catch (e) {
        console.error("Failed to parse saved builder state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem('domainAssess_builder_draft', JSON.stringify({
        topic, audience, objectives, presentation, activeTab, slideCount
      }));
    }
  }, [topic, audience, objectives, presentation, activeTab, slideCount, isLoaded]);

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
      setActiveTab('OBJECTIVES');
      showToast('Learning objectives generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating objectives.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePresentation = async () => {
    setIsGeneratingPresentation(true);
    try {
      const res = await apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          topic, 
          audience, 
          objectives: objectives.map(o => `${o.verb} ${o.context}`),
          mode: 'SLIDE_DECK_NOTES',
          wordCount: slideCount 
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'AI Presentation Generation failed.');
      
      setPresentation(data.presentation);
      setActiveTab('PRESENTATION');
      showToast('Presentation Deck generated with visuals!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating presentation.', 'error');
    } finally {
      setIsGeneratingPresentation(false);
    }
  };

  const exportToPPTX = async () => {
    if (!presentation) return;
    
    try {
      showToast('Compiling PowerPoint... This may take a moment to generate images.', 'info');
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';
  
      const titleSlide = pptx.addSlide();
      titleSlide.addText(presentation.deckTitle, { x: 1, y: 2, w: 8, h: 1.5, fontSize: 36, bold: true, color: '363636', align: 'center' });
      titleSlide.addText(`Target Audience: ${audience}`, { x: 1, y: 3.5, w: 8, h: 1, fontSize: 18, color: '666666', align: 'center' });
  
      const fetchImageBase64 = async (keyword: string): Promise<string | null> => {
        const sanitizedKeyword = keyword.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 100);
        const encoded = encodeURIComponent(`corporate professional ${sanitizedKeyword}`);
        
        const seed = Math.floor(Math.random() * 1000000);
        const primaryUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&nologo=true&seed=${seed}`;
        const fallbackUrl = `https://loremflickr.com/800/600/corporate,office?lock=${seed}`;

        const fetchWithTimeout = async (url: string, timeoutMs: number) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            if (!res.ok) throw new Error('Bad response');
            const blob = await res.blob();
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            clearTimeout(id);
            throw e;
          }
        };

        try {
          return await fetchWithTimeout(primaryUrl, 15000);
        } catch (e) {
          try {
            return await fetchWithTimeout(fallbackUrl, 5000);
          } catch (err) {
            return null;
          }
        }
      };

      for (const slide of presentation.slides) {
        const s = pptx.addSlide();
        
        const hasVisual = slide.visualSuggestion && slide.visualSuggestion.type !== 'none';
        const textWidth = hasVisual ? 4.5 : 9;
  
        s.addText(slide.title, { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 28, bold: true, color: '4F46E5' });
        s.addText(`Domain Strategy: ${slide.domainLevel}  |  Duration: ${slide.durationMinutes} minutes`, { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 12, italic: true, color: '888888' });
        
        const bullets = slide.keyPoints.map(pt => ({ 
          text: pt,
          options: { bullet: true, breakLine: true }
        }));
        
        s.addText(bullets, { 
          x: 0.5, y: 1.8, w: textWidth, h: 3.4, fontSize: 16, color: '333333', valign: 'top', paraSpaceAfter: 14 
        });
        
        if (hasVisual && slide.visualSuggestion) {
          const visType = slide.visualSuggestion.type;
          const visData = slide.visualSuggestion.data;
  
          if (visType === 'smart_art' && visData.items) {
            const itemCount = visData.items.length;
            const itemHeight = 3.2 / itemCount; 
            
            visData.items.forEach((item, i) => {
              const yPos = 1.8 + (i * itemHeight);
              
              // @ts-ignore
              s.addShape(pptx.ShapeType.rect, {
                x: 5.2, y: yPos, w: 1.3, h: itemHeight - 0.15,
                fill: { color: "4F46E5" }, align: "center",
              });
              s.addText(item.title, {
                x: 5.2, y: yPos, w: 1.3, h: itemHeight - 0.15,
                color: "FFFFFF", fontSize: 11, bold: true, align: "center", valign: "middle"
              });
              
              // @ts-ignore
              s.addShape(pptx.ShapeType.rect, {
                x: 6.6, y: yPos, w: 2.9, h: itemHeight - 0.15,
                fill: { color: "F8FAFC" }, line: { color: "CBD5E1", width: 1 },
              });
              s.addText(item.description, {
                x: 6.7, y: yPos, w: 2.7, h: itemHeight - 0.15,
                color: "333333", fontSize: 10, align: "left", valign: "middle"
              });
            });
          } 
          else if (visType === 'process_flow' && visData.steps) {
            const stepCount = visData.steps.length;
            const stepWidth = 4.3 / stepCount;
            visData.steps.forEach((step, i) => {
              // BUG FIX: Use addText with the 'shape' property to guarantee text rendering inside the arrow
              // @ts-ignore
              s.addText(step.toUpperCase(), {
                shape: pptx.ShapeType.rightArrow,
                x: 5.2 + (i * stepWidth), 
                y: 2.7, 
                w: stepWidth - 0.15, 
                h: 0.9,
                fill: { color: "4F46E5" },
                line: { color: "FFFFFF", width: 1.5 },
                color: "FFFFFF", 
                fontSize: 10, 
                bold: true, 
                align: "center", 
                valign: "middle"
              });
            });
          }
          else if (visType === 'chart' && visData.chartData) {
            const chartData = [{
              name: "Data",
              labels: visData.chartData.map(d => d.label),
              values: visData.chartData.map(d => d.value)
            }];
            // @ts-ignore
            s.addChart(pptx.ChartType.bar, chartData, { 
              x: 5.2, y: 1.8, w: 4.3, h: 3.2, 
              showLegend: false, barDir: 'col', 
              chartColors: ['4F46E5', '10B981', 'F59E0B'] 
            });
          }
          else if (visType === 'image' && visData.keyword) {
            const base64Data = await fetchImageBase64(visData.keyword);
            
            if (base64Data) {
              // @ts-ignore
              s.addImage({
                data: base64Data, 
                x: 5.2, y: 1.8, w: 4.3, h: 3.2,
                sizing: { type: "cover", w: 4.3, h: 3.2 }
              });
            } else {
              // @ts-ignore
              s.addShape(pptx.ShapeType.rect, {
                x: 5.2, y: 1.8, w: 4.3, h: 3.2,
                fill: { color: "F8FAFC" }, line: { color: "CBD5E1", width: 1.5, dashType: "dash" }
              });
              s.addText(`📸 Image Unavailable\n"${visData.keyword}"`, {
                x: 5.2, y: 1.8, w: 4.3, h: 3.2, color: "64748B", align: "center", fontSize: 14, bold: true
              });
            }
          }
        }
        s.addNotes(`FACILITATOR SCRIPT:\n${slide.facilitatorNotes}\n\nENGAGEMENT PROMPT:\n${slide.engagementPrompt}`);
      }
  
      await pptx.writeFile({ fileName: `${topic.replace(/\s+/g, '_')}_Deck.pptx` });
      showToast('Download complete!', 'success');
    } catch (error) {
      console.error('PPTX Export Error:', error);
      showToast('Failed to generate presentation file.', 'error');
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

  const VisualPreview = ({ suggestion }: { suggestion: VisualSuggestion }) => {
    const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [seed] = useState(() => Math.floor(Math.random() * 1000000));

    if (!suggestion || suggestion.type === 'none') return null;

    if (suggestion.type === 'smart_art' && suggestion.data.items) {
      return (
        <div className="flex flex-col h-full justify-center w-full gap-2.5">
          {suggestion.data.items.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-stretch gap-2 w-full h-full">
              <div className="bg-indigo-600 text-white rounded-lg p-2 flex items-center justify-center sm:w-1/3 shadow-sm border border-indigo-700">
                <span className="text-[11px] font-black uppercase text-center leading-tight">{item.title}</span>
              </div>
              <div className="bg-white text-slate-700 rounded-lg p-2 flex items-center sm:w-2/3 shadow-sm border border-slate-200">
                <span className="text-[10px] font-bold leading-relaxed">{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (suggestion.type === 'process_flow' && suggestion.data.steps) {
      return (
        <div className="flex items-center justify-center h-full gap-1 flex-wrap">
          {suggestion.data.steps.map((step, i) => (
            <React.Fragment key={i}>
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-emerald-200">
                {step}
              </div>
              {i < suggestion.data.steps!.length - 1 && (
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }

    if (suggestion.type === 'image' && suggestion.data.keyword) {
      const sanitizedKeyword = suggestion.data.keyword.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 100);
      const encodedKeyword = encodeURIComponent(`corporate professional ${sanitizedKeyword}`);
      
      const primaryUrl = `https://image.pollinations.ai/prompt/${encodedKeyword}?width=800&height=600&nologo=true&seed=${seed}`;
      const fallbackUrl = `https://loremflickr.com/800/600/corporate,office?lock=${seed}`;

      return (
        <div className="relative w-full h-full min-h-[160px] flex items-center justify-center overflow-hidden rounded-lg group bg-slate-100">
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-0">
            {imgStatus === 'loading' ? (
              <>
                <svg className="animate-spin w-6 h-6 mb-2 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Generating Visual...</span>
              </>
            ) : imgStatus === 'error' ? (
              <>
                <svg className="w-6 h-6 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Image Unavailable<br/>(AI Timeout)</span>
              </>
            ) : null}
          </div>

          {imgStatus !== 'error' && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={primaryUrl} 
              alt={suggestion.data.keyword}
              onLoad={() => setImgStatus('loaded')}
              onError={(e) => {
                if (e.currentTarget.src !== fallbackUrl) {
                  e.currentTarget.src = fallbackUrl;
                } else {
                  setImgStatus('error');
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 z-10 ${imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center z-20 pointer-events-none">
            <svg className="w-6 h-6 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">
              Keyword: "{suggestion.data.keyword}"
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-28 text-sm relative">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">✨ AI Smart Objectives</h2>
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex bg-slate-50 border-b border-slate-200 rounded-t-3xl">
            <button 
              onClick={() => setActiveTab('OBJECTIVES')}
              className={`flex-1 py-4 font-black text-sm uppercase tracking-widest transition-colors rounded-tl-3xl ${activeTab === 'OBJECTIVES' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              1. Learning Objectives
            </button>
            <div className={`flex-1 flex justify-center items-center gap-3 transition-colors rounded-tr-3xl ${activeTab === 'PRESENTATION' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>
              
              {!presentation && (
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                  <span className="text-[10px] font-black uppercase text-slate-500">Slides:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="30" 
                    value={slideCount} 
                    onChange={(e) => setSlideCount(Number(e.target.value))} 
                    className="w-10 text-xs font-bold text-slate-800 bg-transparent outline-none text-center" 
                  />
                </div>
              )}

              <button 
                onClick={() => presentation ? setActiveTab('PRESENTATION') : handleGeneratePresentation()}
                disabled={isGeneratingPresentation}
                className="py-4 font-black text-sm uppercase tracking-widest flex items-center gap-2"
              >
                {isGeneratingPresentation ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : '📊'}
                {isGeneratingPresentation ? 'Generating Deck...' : presentation ? '2. Presentation Deck' : '2. Generate Deck & Notes'}
              </button>
            </div>
          </div>

          {activeTab === 'OBJECTIVES' && (
            <div className="p-6 md:p-8">
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

              <div className="space-y-6 pb-24">
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
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownIndex(openDropdownIndex === idx ? null : idx);
                            }}
                            className="font-black text-indigo-600 border-b-2 border-dashed border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 px-1 rounded transition-colors inline-flex items-center gap-1"
                          >
                            {obj.verb.toLowerCase()}
                            <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          
                          <div 
                            className={`absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden transition-all ${openDropdownIndex === idx ? 'opacity-100 visible' : 'opacity-0 invisible md:group-hover/dropdown:opacity-100 md:group-hover/dropdown:visible'}`}
                          >
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">Taxonomy Alternatives</div>
                            {obj.alternatives.map((alt, altIdx) => (
                              <button 
                                key={altIdx} 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSwapVerb(idx, alt);
                                  setOpenDropdownIndex(null);
                                }} 
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                              >
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

          {activeTab === 'PRESENTATION' && presentation && (
            <div className="p-6 md:p-8 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="font-black text-xl text-slate-900">{presentation.deckTitle}</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Est. Duration: {presentation.estimatedDurationMinutes} Minutes</p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button onClick={() => { setPresentation(null); setActiveTab('OBJECTIVES'); }} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-black rounded-xl transition-all shadow-sm active:scale-95 text-xs">
                    🔄 New Deck
                  </button>
                  <button onClick={exportToPPTX} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md active:scale-95 text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download .PPTX File
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {presentation.slides.map((slide, idx) => {
                  const hasVisual = slide.visualSuggestion && slide.visualSuggestion.type !== 'none';
                  
                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-indigo-200 transition-colors">
                      <div className="p-6 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-center mb-4">
                          <span className="bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest border border-indigo-100">Slide {slide.slideNumber}</span>
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">⏱️ {slide.durationMinutes} min</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-2 leading-snug">{slide.title}</h4>
                        <span className="text-[9px] uppercase font-black tracking-widest text-emerald-500 block mb-6">{slide.domainLevel}</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <ul className="space-y-4">
                            {slide.keyPoints.map((pt, i) => (
                              <li key={i} className="flex gap-2.5 text-sm font-bold text-slate-700 leading-relaxed text-justify hyphens-auto">
                                <span className="text-indigo-400 mt-[3px] flex-shrink-0">•</span> {pt}
                              </li>
                            ))}
                          </ul>
                          
                          {hasVisual && slide.visualSuggestion && (
                            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden">
                              <VisualPreview suggestion={slide.visualSuggestion} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-5 shrink-0">
                        <h5 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                          Facilitator Script
                        </h5>
                        <p className="text-[11.5px] font-medium text-slate-600 leading-relaxed italic text-justify hyphens-auto">{slide.facilitatorNotes}</p>
                        
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex gap-2 items-start">
                          <span className="text-amber-500 text-base leading-none mt-0.5">💡</span>
                          <p className="text-[11px] font-black text-slate-700 text-justify hyphens-auto">{slide.engagementPrompt}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}