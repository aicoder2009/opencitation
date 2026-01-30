'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * Safari Install Banner - Apple Smart App Banner style
 * Shows install instructions when VIEW is clicked (Safari can't trigger install programmatically)
 */
export function SafariInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
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

  const handleView = () => {
    setShowInstructions(true);
  };

  if (!showBanner) return null;

  // Share icon for iOS instructions
  const ShareIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 inline-block align-middle" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    </svg>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] safe-area-top bg-[#f2f2f2] border-b border-[#c8c8c8]">
      {/* Main banner row */}
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
        <div className="w-[57px] h-[57px] rounded-[12px] overflow-hidden flex-shrink-0 shadow-sm">
          <Image
            src="/logo.png"
            alt="OpenCitation"
            width={57}
            height={57}
            className="w-full h-full object-cover"
          />
        </div>

        {/* App info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-black text-[13px]">OpenCitation</div>
          <div className="text-[11px] text-[#888]">
            {isIOS ? 'Add to Home Screen' : 'Add to Dock'}
          </div>
        </div>

        {/* View/Install button */}
        {!showInstructions ? (
          <button
            onClick={handleView}
            className="bg-[#007AFF] text-white text-[12px] font-semibold px-3 py-1 rounded-full"
          >
            INSTALL
          </button>
        ) : (
          <button
            onClick={() => setShowInstructions(false)}
            className="text-[#007AFF] text-[12px] font-semibold px-2"
          >
            Hide
          </button>
        )}
      </div>

      {/* Expanded instructions */}
      {showInstructions && (
        <div className="px-4 py-3 bg-white border-t border-[#e5e5e5]">
          {isIOS ? (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-black">To install OpenCitation:</p>
              <ol className="text-[12px] text-[#333] space-y-1.5 list-none pl-0">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[11px] flex items-center justify-center flex-shrink-0">1</span>
                  <span>Tap the <span className="text-[#007AFF]"><ShareIcon /></span> Share button in Safari</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[11px] flex items-center justify-center flex-shrink-0">2</span>
                  <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[11px] flex items-center justify-center flex-shrink-0">3</span>
                  <span>Tap <strong>&quot;Add&quot;</strong> in the top right</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-black">To install OpenCitation:</p>
              <ol className="text-[12px] text-[#333] space-y-1.5 list-none pl-0">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[11px] flex items-center justify-center flex-shrink-0">1</span>
                  <span>Click <strong>File</strong> in the menu bar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[11px] flex items-center justify-center flex-shrink-0">2</span>
                  <span>Click <strong>&quot;Add to Dock&quot;</strong></span>
                </li>
              </ol>
            </div>
          )}
          <button
            onClick={handleDismiss}
            className="mt-3 text-[12px] text-[#888] underline"
          >
            Don&apos;t show again
          </button>
        </div>
      )}
    </div>
  );
}

export default SafariInstallBanner;
