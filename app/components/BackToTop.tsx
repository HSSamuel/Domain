'use client';

import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      // Get the scroll position whether it's the window or a nested admin layout container
      const scrollTop = target === document ? document.documentElement.scrollTop : target?.scrollTop || 0;
      
      // Reduced threshold to 150px so it appears a bit earlier
      if (scrollTop > 150) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // The 'true' capture phase forces React to catch nested scrolling!
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const scrollToTop = () => {
    // 1. Scroll the main window
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 2. Scroll any nested admin containers handling overflow
    const layoutContainers = document.querySelectorAll('main, .overflow-y-auto, .overflow-auto');
    layoutContainers.forEach(container => container.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-1 right-1 z-[90] w-7 h-7 bg-indigo-600 text-white rounded-full shadow-[0_8px_20px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      <svg 
        className="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}