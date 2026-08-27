'use client';

import { useEffect, useState } from 'react';

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  // Add a state to track if the user clicked the 'X'
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing automatically
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the native browser install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
  };

  // Only render if it's installable AND the user hasn't dismissed it this session
  if (!isInstallable || isDismissed) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center bg-slate-900 text-white rounded-full shadow-2xl animate-in slide-in-from-top-8 fade-in duration-500 overflow-hidden pr-1 border border-slate-700">
      
      {/* Main Install Button Area */}
      <button 
        onClick={handleInstallClick}
        className="px-5 py-2.5 font-black hover:bg-slate-800 transition-colors flex items-center gap-2 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="text-sm">Install App</span>
      </button>
      
      {/* Vertical Divider */}
      <div className="w-px h-5 bg-slate-700 mx-1"></div>
      
      {/* Dismiss 'X' Button Area */}
      <button 
        onClick={() => setIsDismissed(true)}
        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
    </div>
  );
}