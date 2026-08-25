'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Onboarding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 font-sans relative overflow-hidden selection:bg-indigo-100">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse"></div>
        <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        
        {/* Header Area */}
        <div className="text-center mb-16 space-y-6">
          
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest shadow-sm">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            100% AI-Powered
          </div>

          <div className="flex justify-center">
            {/* UPDATED: Native Next.js Image Component */}
            <Image 
              src="/logo.png" 
              alt="DomainAssess Logo" 
              width={64} 
              height={64} 
              className="w-16 h-16 rounded-2xl shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300" 
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Welcome to the <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Future of Training.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Three simple steps to instantly transform your standard training modules into high-octane, interactive assessments.
          </p>
        </div>

        {/* Feature Cards (Centered for Mobile & Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          
          {/* Step 1: Generate */}
          <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-100 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <h3 className="text-xl font-black mb-3 text-slate-800">1. Generate with AI</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">
              Input your training topic and let our AI instantly generate hundreds of domain-specific learner outcomes and taxonomy levels.
            </p>
          </div>

          {/* Step 2: Launch */}
          <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-100 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black mb-3 text-slate-800">2. Launch Live Arena</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">
              Project the live leaderboard on the big screen. Trainees use their phones to rapidly sort and drag concepts into the correct buckets before time expires.
            </p>
          </div>

          {/* Step 3: Analyze */}
          <div className="flex flex-col items-center text-center bg-white/80 backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-emerald-100 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-xl font-black mb-3 text-slate-800">3. Analyze Gaps</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">
              Conclude the session to instantly reveal a detailed post-training analytics report, highlighting the most misunderstood concepts in the room.
            </p>
          </div>

        </div>

        {/* Call to Action */}
        <div className="flex justify-center pb-10">
          <button 
            onClick={() => router.push('/admin/login')}
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 font-black text-white transition-all duration-200 bg-slate-900 rounded-2xl hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
          >
            Get Started
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>

      </div>
    </div>
  );
}