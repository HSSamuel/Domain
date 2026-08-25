'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const Spinner = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState('Facilitator');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const hasAccess = localStorage.getItem('domainAssess_auth');
    if (hasAccess === 'granted') {
      setIsAuthorized(true);
      const storedName = localStorage.getItem('domainassess_admin_name');
      if (storedName) setAdminName(storedName);
    } else if (pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('domainAssess_auth');
    localStorage.removeItem('domainassess_admin_token');
    localStorage.removeItem('domainassess_admin_name');
    router.push('/admin/login');
  };

  if (!isAuthorized && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        Securing connection...
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  let pageTitle = 'Admin Portal';
  if (pathname === '/admin/dashboard') pageTitle = 'Dashboard';
  if (pathname === '/admin/create-bank') pageTitle = 'Create Assessment';
  if (pathname === '/admin/objective-builder') pageTitle = 'Objective Builder';
  if (pathname.includes('/admin/edit-bank')) pageTitle = 'Edit Assessment';
  if (pathname.includes('/admin/live/') && !pathname.includes('/analytics')) pageTitle = 'Live Control Room';
  if (pathname.includes('/analytics')) pageTitle = 'Session Analytics';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans selection:bg-indigo-100 text-slate-900">
      
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-slate-900 shadow-2xl p-4 flex flex-col border-r border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-8 px-2 mt-2">
              <Image src="/logo.png" alt="DomainAssess Logo" width={40} height={40} className="w-10 h-10 rounded shadow-md flex-shrink-0 object-contain bg-white p-[2px]" />
              <span className="font-black tracking-tight text-lg text-white">DomainAssess</span>
            </div>
            
            <nav className="flex-1 flex flex-col space-y-2">
              <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-xl font-bold flex items-center gap-3 ${pathname === '/admin/dashboard' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'}`}>Dashboard</Link>
              
              <Link href="/admin/objective-builder" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-xl font-bold flex items-center gap-3 ${pathname === '/admin/objective-builder' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'}`}>Objective Builder</Link>

              <Link href="/admin/create-bank" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-xl font-bold flex items-center gap-3 ${pathname === '/admin/create-bank' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'}`}>Create Assessment</Link>
              
              <div className="my-2 border-t border-slate-800 mx-2"></div>

              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl font-bold flex items-center gap-3 text-slate-300 hover:bg-slate-800">Live Arena (Home)</Link>
            </nav>

            <div className="pt-4 mt-auto border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-300">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-tight">{adminName}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Facilitator</span>
                </div>
              </div>
              <button onClick={handleLogout} disabled={isLoggingOut} className="w-full p-3 rounded-xl font-bold flex items-center justify-center gap-3 text-rose-400 hover:bg-rose-500/10 disabled:opacity-50">
                {isLoggingOut ? <Spinner /> : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`hidden md:flex bg-slate-900 text-slate-300 flex-col transition-all duration-300 ease-in-out relative shadow-xl z-40 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-14 flex items-center justify-center border-b border-slate-800 shrink-0 px-3">
          <Image src="/logo.png" alt="DomainAssess Logo" width={36} height={36} className={`rounded shadow-md flex-shrink-0 object-contain bg-white transition-all duration-300 ${isSidebarOpen ? 'w-9 h-9 p-[2px]' : 'w-7 h-7 p-1'}`} />
          <span className={`ml-3 font-black text-white text-base tracking-tight whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>DomainAssess</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          <Link href="/admin/dashboard" className={`flex items-center p-2.5 rounded-lg transition-colors group ${pathname === '/admin/dashboard' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'} ${isSidebarOpen ? '' : 'justify-center'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            {isSidebarOpen && <span className="ml-3 font-bold text-sm whitespace-nowrap">Dashboard</span>}
          </Link>
          
          <Link href="/admin/objective-builder" className={`flex items-center p-2.5 rounded-lg transition-colors group ${pathname === '/admin/objective-builder' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'} ${isSidebarOpen ? '' : 'justify-center'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {isSidebarOpen && <span className="ml-3 font-bold text-sm whitespace-nowrap">Objective Builder</span>}
          </Link>

          <Link href="/admin/create-bank" className={`flex items-center p-2.5 rounded-lg transition-colors group ${pathname === '/admin/create-bank' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'} ${isSidebarOpen ? '' : 'justify-center'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            {isSidebarOpen && <span className="ml-3 font-bold text-sm whitespace-nowrap">Create Assessment</span>}
          </Link>

          <div className="my-4 border-t border-slate-800 mx-2"></div>

          <Link href="/" className={`flex items-center p-2.5 rounded-lg transition-colors group text-slate-300 hover:bg-slate-800 ${isSidebarOpen ? '' : 'justify-center'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            {isSidebarOpen && <span className="ml-3 font-bold text-sm whitespace-nowrap">Live Arena (Home)</span>}
          </Link>
        </nav>

        <div className="p-3 border-t border-slate-800 flex flex-col gap-2">
          <button onClick={handleLogout} disabled={isLoggingOut} className={`w-full flex items-center p-2.5 rounded-lg transition-colors text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50 ${isSidebarOpen ? '' : 'justify-center'}`} title="Log Out">
            {isLoggingOut ? <Spinner /> : <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>}
            {isSidebarOpen && <span className="ml-3 font-bold text-sm whitespace-nowrap">{isLoggingOut ? 'Logging Out' : 'Log Out'}</span>}
          </button>

          {isSidebarOpen && (
            <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl mt-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-black text-slate-300 flex-shrink-0 border border-slate-600">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-white truncate">{adminName}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Facilitator</span>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-16 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-md transition-all focus:outline-none z-50">
          <svg className={`w-3 h-3 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 relative">
        <header className="h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">{pageTitle}</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}