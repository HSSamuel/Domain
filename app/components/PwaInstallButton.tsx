'use client';

import { useEffect, useState } from 'react';

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

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

  // Only render the button if the app is installable and hasn't been installed yet
  if (!isInstallable) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-slate-900 text-white font-black rounded-full shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 animate-in slide-in-from-bottom-8 fade-in duration-500"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Install App
    </button>
  );
}