'use client';

import { useState, useEffect } from 'react';

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
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="bg-[#f2f2f7] border-t border-[#c6c6c8] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-[#007aff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-black">
              Install OpenCitation
            </p>
            <p className="text-[13px] text-[#8e8e93]">
              {isIOS ? (
                <>Tap <span className="inline-block w-4 h-4 align-middle">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#007aff]">
                    <path d="M12 2v13m0-13l4 4m-4-4L8 6M4 14v6h16v-6"/>
                  </svg>
                </span> then &quot;Add to Home Screen&quot;</>
              ) : (
                <>File → Add to Dock</>
              )}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center text-[#8e8e93] hover:text-[#636366] flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SafariInstallBanner;
