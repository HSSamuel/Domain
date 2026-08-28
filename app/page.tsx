'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from './components/ToastProvider';

export default function LandingPage() {
  const [pin, setPin] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  
  const router = useRouter();
  const { showToast } = useToast();

  // FIXED: Synchronous evaluation on click prevents hydration misrouting
  const handlePortalNavigation = () => {
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('domainAssess_auth') === 'granted';
    router.push(isAuth ? '/admin/dashboard' : '/onboarding');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length === 6) {
      router.push(`/play/${pin}`);
    } else {
      showToast('Please enter a valid 6-character PIN', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative overflow-hidden selection:bg-indigo-100">
      
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden -z-10 pointer-events-none fixed">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-[pulse_6s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
        <div className="absolute top-40 -left-20 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-[pulse_8s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
      </div>

      <header className="px-4 md:px-8 py-4 flex justify-between items-center max-w-7xl mx-auto w-full relative z-20">
        <div className="flex items-center gap-2 md:gap-3 group cursor-pointer" onClick={() => { window.scrollTo(0,0); }}>
          <Image src="/logo.png" alt="DomainAssess Logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-sm group-hover:scale-105 transition-transform" />
          <span className="text-lg md:text-xl font-black tracking-tight text-slate-900">DomainAssess</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#methodology" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Methodology</a>
          <a href="#support" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Support</a>
          <button onClick={handlePortalNavigation} className="text-sm font-black text-white hover:text-white bg-slate-900 hover:bg-indigo-600 transition-all px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95">
            Facilitator's Portal &rarr;
          </button>
        </nav>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none bg-white/80 rounded-xl border border-slate-200 backdrop-blur-md active:scale-95 transition-transform">
          {isMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </header>

      <div className={`md:hidden fixed w-full bg-white/95 backdrop-blur-xl shadow-2xl border-b border-slate-200 z-50 transition-all duration-300 ease-out ${isMenuOpen ? 'top-[72px] opacity-100 visible' : 'top-10 opacity-0 invisible pointer-events-none'}`}>
        <div className="flex flex-col px-6 py-6 gap-2">
          <a href="#methodology" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-slate-600 py-3 border-b border-slate-100">Methodology</a>
          <a href="#support" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-slate-600 py-3 border-b border-slate-100">Support</a>
          <button onClick={() => { setIsMenuOpen(false); handlePortalNavigation(); }} className="mt-4 text-center text-sm font-black text-white bg-slate-900 hover:bg-indigo-600 py-4 rounded-xl transition-colors shadow-md">
            Facilitator's Portal
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 text-center max-w-4xl mx-auto relative z-0 py-20">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          100% AI-Powered
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-5 tracking-tight leading-tight">
          Master Bloom's Taxonomy in <br className="hidden md:block" />
          <span className="whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500">
            Real-Time
          </span>
        </h1>
        
        <p className="text-base md:text-lg text-slate-500 mb-10 max-w-2xl font-medium leading-relaxed px-2">
          Transform standard public sector curricula into highly engaging, AI-generated assessment arenas. Gamify learning and analyze knowledge gaps instantly.
        </p>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-lg border border-slate-100 w-full max-w-sm mx-auto relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"></div>
          <h2 className="text-xl md:text-2xl font-black mb-1.5 text-slate-900 tracking-tight">Join Live Arena</h2>
          <p className="text-slate-500 text-xs font-bold mb-6 uppercase tracking-wider">Enter your 6-character PIN</p>
          
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. A7X9BQ"
              className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-center text-2xl font-black tracking-[0.2em] text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 placeholder:tracking-normal uppercase shadow-inner"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base py-3.5 rounded-xl transition-all shadow-md active:scale-95 mt-1">
              Enter Session
            </button>
          </form>
        </div>
      </main>

      <section id="methodology" className="py-24 bg-white border-y border-slate-200 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">The Educational Methodology</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              DomainAssess bridges the gap between traditional learning and active recall by grounding AI-generated scenarios strictly within Bloom's Taxonomy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cognitive Domain - Blue Accent */}
            <div className="bg-slate-50 hover:bg-gradient-to-b hover:from-blue-50/60 hover:to-white p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all duration-500 hover:shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Cognitive Domain</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Focuses on intellectual skills and knowledge. Trainees sort mental tasks ranging from simple recall ("Remembering") up to complex critical thinking ("Creating").
              </p>
            </div>

            {/* Psychomotor Domain - Emerald Accent */}
            <div className="bg-slate-50 hover:bg-gradient-to-b hover:from-emerald-50/60 hover:to-white p-8 rounded-[2rem] border border-slate-100 hover:border-emerald-200 transition-all duration-500 hover:shadow-[0_10px_40px_-15px_rgba(16,185,129,0.2)] flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Psychomotor Domain</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Focuses on physical movement, coordination, and motor skills. Scenarios train users to identify physical mastery from "Perception" to complete "Origination."
              </p>
            </div>

            {/* Affective Domain - Rose Accent */}
            <div className="bg-slate-50 hover:bg-gradient-to-b hover:from-rose-50/60 hover:to-white p-8 rounded-[2rem] border border-slate-100 hover:border-rose-200 transition-all duration-500 hover:shadow-[0_10px_40px_-15px_rgba(244,63,94,0.2)] flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Affective Domain</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Focuses on attitudes, emotions, and values. The engine helps participants identify emotional intelligence levels from "Receiving Phenomena" to "Internalizing Values."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="support" className="py-20 relative z-10">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Need Support?</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium mb-8">
            Whether you are a facilitator trying to set up your first AI curriculum, or a trainee having trouble joining a room, we are here to help.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
            <button onClick={() => setIsSupportModalOpen(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all text-sm active:scale-95">
              Contact IT Support
            </button>
            <button onClick={handlePortalNavigation} className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all text-sm active:scale-95">
              View Facilitator's Guide
            </button>
          </div>
        </div>
      </section>

      {isSupportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative flex justify-center items-center p-5 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-lg">Contact Support</h3>
              <button onClick={() => setIsSupportModalOpen(false)} className="absolute right-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 font-medium text-center mb-6 px-2">
                Choose how you would like to reach us. We typically respond within a few hours.
              </p>
              <a href="https://wa.me/2348084737049" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 w-full p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors group active:scale-[0.98]">
                <div className="w-12 h-12 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 21.054c-1.745 0-3.411-.468-4.896-1.353l-.35-.208-3.641.954.97-3.548-.228-.363a9.907 9.907 0 01-1.522-5.32C2.364 5.614 6.697 1.28 12.031 1.28c5.333 0 9.667 4.333 9.667 9.668 0 5.334-4.334 9.668-9.667 9.668zm0-18.064c-4.498 0-8.15 3.652-8.15 8.148 0 1.439.373 2.846 1.082 4.084l1.084 1.89-1.28 4.685 4.795-1.258 1.81.996c1.218.67 2.59 1.024 3.987 1.024 4.497 0 8.148-3.652 8.148-8.148 0-4.496-3.65-8.148-8.148-8.148zm4.468 11.238c-.244-.123-1.448-.713-1.672-.795-.224-.082-.387-.123-.55.123-.163.245-.632.795-.774.957-.143.163-.286.184-.53.061-.245-.123-1.034-.38-1.968-1.173-.728-.617-1.22-1.38-1.363-1.624-.143-.245-.015-.378.107-.5.11-.11.245-.286.368-.429.122-.143.163-.245.244-.408.082-.163.041-.306-.02-.429-.061-.123-.55-1.326-.754-1.816-.198-.479-.4-.414-.55-.421-.142-.007-.305-.007-.468-.007-.163 0-.428.061-.652.306-.224.245-.856.836-.856 2.04 0 1.203.876 2.366.999 2.53.123.163 1.725 2.63 4.177 3.687 2.052.884 2.45.713 2.898.673.449-.041 1.448-.592 1.652-1.163.204-.572.204-1.061.143-1.163-.061-.102-.224-.163-.469-.286z"/></svg>
                </div>
                <div className="text-left">
                  <span className="block font-black text-[#128C7E] text-base">WhatsApp</span>
                  <span className="block text-xs font-bold text-[#25D366]">Fastest response</span>
                </div>
              </a>

              <a href="mailto:smkmayomisamuel@gmail.com" className="flex items-center gap-4 w-full p-4 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors group active:scale-[0.98]">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div className="text-left">
                  <span className="block font-black text-indigo-900 text-base">Email Us</span>
                  <span className="block text-xs font-bold text-indigo-600">For detailed inquiries</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-xs md:text-sm font-medium relative z-20 border-t border-slate-800">
        <div className="flex flex-col items-center justify-center">
          <p>&copy; {new Date().getFullYear()} DomainAssess Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}