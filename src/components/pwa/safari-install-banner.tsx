'use client';

import { useState, useEffect } from 'react';

/**
 * Safari Install Banner - Apple Smart App Banner style
 * Simple top banner like Apple's native smart app banners
 */
export function SafariInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wasDismissed = localStorage.getItem('safari-install-dismissed');
    if (wasDismissed) return;

    const ua = navigator.userAgent.toLowerCase();
    const isSafari = /safari/.test(ua) && !/chrome|chromium|android|crios|fxios|edgios/.test(ua);
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsIOS(isIOSDevice);

    if (isSafari && !isStandalone) {
      setTimeout(() => setShowBanner(true), 1500);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('safari-install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] safe-area-top bg-[#f2f2f2] border-b border-[#c8c8c8]">
      <div className="flex items-center px-3 py-2 gap-3">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="text-[#888] text-xl leading-none px-1"
          aria-label="Close"
        >
          ×
        </button>

        {/* App icon */}
        <div className="w-[57px] h-[57px] rounded-[12px] bg-white border border-[#d8d8d8] flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 text-[#007AFF]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z" opacity="0.3"/>
            <path d="M2 12l10 5 10-5M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* App info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-black text-[13px]">OpenCitation</div>
          <div className="text-[11px] text-[#888]">
            {isIOS ? 'Add to Home Screen' : 'Add to Dock'}
          </div>
        </div>

        {/* View button */}
        <button
          onClick={handleDismiss}
          className="bg-[#007AFF] text-white text-[13px] font-semibold px-4 py-1.5 rounded-full"
        >
          VIEW
        </button>
      </div>
    </div>
  );
}

export default SafariInstallBanner;
