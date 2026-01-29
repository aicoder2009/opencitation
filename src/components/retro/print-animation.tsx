"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PrintAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  itemCount: number;
  fileName: string;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
}

export function PrintAnimation({
  isOpen,
  onClose,
  onComplete,
  itemCount,
  fileName,
  soundEnabled = true,
  onSoundToggle,
}: PrintAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "printing" | "done">("idle");
  const [paperStack, setPaperStack] = useState<number[]>([]);
  const [currentPaper, setCurrentPaper] = useState<number | null>(null);
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a beep sound
  const playBeep = useCallback((frequency: number, duration: number, type: OscillatorType = "sine") => {
    if (!localSoundEnabled) return;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.1;
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, [localSoundEnabled, getAudioContext]);

  // Play printer sound (white noise)
  const playPrinterNoise = useCallback((duration: number) => {
    if (!localSoundEnabled) return;

    try {
      const ctx = getAudioContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.03;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn("Printer noise failed:", e);
    }
  }, [localSoundEnabled, getAudioContext]);

  // Play completion ding
  const playCompleteDing = useCallback(() => {
    if (!localSoundEnabled) return;

    playBeep(880, 0.15, "sine");
    setTimeout(() => playBeep(1175, 0.25, "sine"), 150);
  }, [localSoundEnabled, playBeep]);

  // Start the printing animation
  const startPrinting = useCallback(() => {
    setStatus("printing");
    setProgress(0);
    setPaperStack([]);
    setCurrentPaper(null);

    const totalDuration = 3000 + itemCount * 500; // Base time + time per item
    const startTime = Date.now();
    const paperInterval = totalDuration / itemCount;

    // Play initial printer start sound
    playPrinterNoise(0.5);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Add papers to stack at intervals
      const papersToShow = Math.floor(elapsed / paperInterval);
      if (papersToShow > paperStack.length && papersToShow <= itemCount) {
        setCurrentPaper(papersToShow);
        playBeep(400 + papersToShow * 50, 0.1, "square"); // Paper feed sound
        setTimeout(() => {
          setPaperStack((prev) => [...prev, papersToShow]);
          setCurrentPaper(null);
        }, 300);
      }

      if (elapsed < totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setStatus("done");
        playCompleteDing();
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [itemCount, paperStack.length, playPrinterNoise, playBeep, playCompleteDing, onComplete]);

  useEffect(() => {
    if (isOpen && status === "idle") {
      startPrinting();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, status, startPrinting]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setProgress(0);
      setPaperStack([]);
      setCurrentPaper(null);
    }
  }, [isOpen]);

  const toggleSound = () => {
    const newValue = !localSoundEnabled;
    setLocalSoundEnabled(newValue);
    onSoundToggle?.(newValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-wiki-white border-2 border-wiki-border p-6 max-w-md w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Printing Works Cited...</h2>
          <button
            onClick={toggleSound}
            className="text-sm text-wiki-link hover:underline"
            title={localSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {localSoundEnabled ? "[sound on]" : "[sound off]"}
          </button>
        </div>

        {/* Printer Animation */}
        <div className="relative bg-gray-100 border border-gray-300 rounded p-4 mb-4 min-h-[200px]">
          {/* Printer Body */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-20 bg-gray-400 rounded-t border-2 border-gray-500">
            {/* Printer Face */}
            <div className="absolute top-2 left-4 right-4 h-4 bg-gray-600 rounded" />
            {/* Paper Feed Slot */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-gray-700" />
            {/* LED */}
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                status === "printing" ? "bg-green-400 animate-pulse" : status === "done" ? "bg-green-400" : "bg-gray-500"
              }`}
            />
          </div>

          {/* Paper Output Tray */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-4 bg-gray-300 border border-gray-400 rounded-b" />

          {/* Current Printing Paper */}
          {currentPaper !== null && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-28 bg-white border border-gray-300 shadow-sm animate-paper-feed"
              style={{
                top: "70px",
                height: "60px",
                animation: "paperFeed 0.3s ease-out forwards",
              }}
            >
              <div className="p-1 text-[6px] text-gray-400 leading-tight">
                <div className="h-1 bg-gray-200 w-3/4 mb-0.5" />
                <div className="h-1 bg-gray-200 w-full mb-0.5" />
                <div className="h-1 bg-gray-200 w-2/3" />
              </div>
            </div>
          )}

          {/* Paper Stack */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            {paperStack.map((paper, index) => (
              <div
                key={paper}
                className="absolute w-28 h-10 bg-white border border-gray-300 shadow-sm"
                style={{
                  bottom: `${index * 2}px`,
                  left: `${(index % 2) * 2 - 1}px`,
                  transform: `rotate(${(index % 2) * 2 - 1}deg)`,
                }}
              >
                <div className="p-1 text-[4px] text-gray-300 leading-tight">
                  <div className="h-0.5 bg-gray-200 w-3/4 mb-0.5" />
                  <div className="h-0.5 bg-gray-200 w-full mb-0.5" />
                  <div className="h-0.5 bg-gray-200 w-2/3" />
                </div>
              </div>
            ))}
          </div>

          {/* Status Text */}
          <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500">
            {status === "printing"
              ? `Printing citation ${paperStack.length + 1} of ${itemCount}...`
              : status === "done"
              ? "Print complete!"
              : "Initializing..."}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-4 bg-gray-200 border border-gray-300 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* File Info */}
        <div className="text-sm text-gray-600 mb-4">
          <p>
            <span className="font-bold">File:</span> {fileName}
          </p>
          <p>
            <span className="font-bold">Citations:</span> {itemCount}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {status === "done" && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Done
            </button>
          )}
          {status !== "done" && (
            <button
              onClick={() => {
                if (animationRef.current) {
                  cancelAnimationFrame(animationRef.current);
                }
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes paperFeed {
          0% {
            top: 70px;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 130px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
