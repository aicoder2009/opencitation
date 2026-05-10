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

// ASCII Art Frames for the printer animation
const PRINTER_FRAMES = [
  `
    ╔═══════════════════════════════════╗
    ║  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  ║
    ║  █ EPSON MX-80 DOT MATRIX    █  ║
    ║  █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█  ║
    ║  █  ░░░░░░░░░░░░░░░░░░░░░░  █  ║
    ║  █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█  ║
    ║  ████████████████████████████  ║
    ║  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │  ║
    ║  └────────────────────────────┘  ║
    ╚═══════════════════════════════════╝`,
  `
    ╔═══════════════════════════════════╗
    ║  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  ║
    ║  █ EPSON MX-80 DOT MATRIX    █  ║
    ║  █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█  ║
    ║  █  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  █  ║
    ║  █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█  ║
    ║  ████████████████████████████  ║
    ║  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │  ║
    ║  └────────────────────────────┘  ║
    ╚═══════════════════════════════════╝`,
];

const PAPER_TOP = `┌────────────────────────────────┐`;
const PAPER_LINE = `│                                │`;
const PAPER_BOTTOM = `└────────────────────────────────┘`;

const SPINNERS = ["◐", "◓", "◑", "◒"];
const PROGRESS_CHARS = ["░", "▒", "▓", "█"];

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
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [printedLines, setPrintedLines] = useState<string[]>([]);
  const [currentChar, setCurrentChar] = useState(0);
  const [paperOffset, setPaperOffset] = useState(0);
  const [glitchText, setGlitchText] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const printIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sample citation lines to "print"
  const citationLines = [
    "═══════════════════════════════",
    "       WORKS CITED",
    "═══════════════════════════════",
    "",
    ...Array.from({ length: itemCount }, (_, i) => [
      `[${i + 1}] Author, A. (2024).`,
      `    "Citation Entry #${i + 1}"`,
      `    Journal of Research.`,
      "",
    ]).flat(),
    "═══════════════════════════════",
    `  Total: ${itemCount} citation(s)`,
    `  File: ${fileName}`,
    "═══════════════════════════════",
  ];

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play dot matrix printer sound
  const playDotMatrix = useCallback(() => {
    if (!localSoundEnabled) return;

    try {
      const ctx = getAudioContext();
      const duration = 0.05;

      // Create buzzy dot-matrix sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "square";
      oscillator.frequency.value = 150 + Math.random() * 100;

      filter.type = "lowpass";
      filter.frequency.value = 800;

      gainNode.gain.value = 0.05;
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, [localSoundEnabled, getAudioContext]);

  // Play line feed sound
  const playLineFeed = useCallback(() => {
    if (!localSoundEnabled) return;

    try {
      const ctx = getAudioContext();
      const duration = 0.15;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);

      gainNode.gain.value = 0.03;
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, [localSoundEnabled, getAudioContext]);

  // Play completion sound
  const playComplete = useCallback(() => {
    if (!localSoundEnabled) return;

    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "square";
        oscillator.frequency.value = freq;

        gainNode.gain.value = 0.08;
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.2 + i * 0.15
        );

        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + 0.3 + i * 0.15);
      });
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, [localSoundEnabled, getAudioContext]);

  // Start the printing animation
  const startPrinting = useCallback(() => {
    setStatus("printing");
    setProgress(0);
    setPrintedLines([]);
    setCurrentChar(0);
    setPaperOffset(0);

    let lineIndex = 0;
    let charIndex = 0;
    let currentLine = "";

    const printChar = () => {
      if (lineIndex >= citationLines.length) {
        // Done printing
        setStatus("done");
        playComplete();
        if (printIntervalRef.current) {
          clearInterval(printIntervalRef.current);
        }
        setTimeout(() => {
          onComplete();
        }, 1500);
        return;
      }

      const targetLine = citationLines[lineIndex];

      if (charIndex < targetLine.length) {
        // Print next character
        currentLine += targetLine[charIndex];
        charIndex++;
        setCurrentChar((prev) => prev + 1);
        playDotMatrix();

        // Update glitch text occasionally
        if (Math.random() > 0.8) {
          setGlitchText(
            Array.from({ length: 3 }, () =>
              String.fromCharCode(33 + Math.floor(Math.random() * 93))
            ).join("")
          );
        }
      } else {
        // Move to next line
        setPrintedLines((prev) => [...prev.slice(-7), currentLine || " "]);
        setPaperOffset((prev) => prev + 1);
        playLineFeed();
        lineIndex++;
        charIndex = 0;
        currentLine = "";

        // Update progress
        const newProgress = (lineIndex / citationLines.length) * 100;
        setProgress(newProgress);
      }
    };

    // Print at variable speed for realism
    printIntervalRef.current = setInterval(printChar, 30);
  }, [citationLines, playDotMatrix, playLineFeed, playComplete, onComplete]);

  // Spinner and frame animation
  useEffect(() => {
    if (status !== "printing") return;

    const spinnerInterval = setInterval(() => {
      setSpinnerIndex((prev) => (prev + 1) % SPINNERS.length);
      setCurrentFrame((prev) => (prev + 1) % PRINTER_FRAMES.length);
    }, 100);

    return () => clearInterval(spinnerInterval);
  }, [status]);

  useEffect(() => {
    if (isOpen && status === "idle") {
      // Small delay before starting
      const timeout = setTimeout(startPrinting, 500);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (printIntervalRef.current) {
        clearInterval(printIntervalRef.current);
      }
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
      setPrintedLines([]);
      setCurrentChar(0);
      setPaperOffset(0);
      setGlitchText("");
    }
  }, [isOpen]);

  const toggleSound = () => {
    const newValue = !localSoundEnabled;
    setLocalSoundEnabled(newValue);
    onSoundToggle?.(newValue);
  };

  const handleCancel = () => {
    if (printIntervalRef.current) {
      clearInterval(printIntervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Build progress bar with ASCII characters
  const progressBarWidth = 30;
  const filledWidth = Math.floor((progress / 100) * progressBarWidth);
  const progressBar =
    "█".repeat(filledWidth) + "░".repeat(progressBarWidth - filledWidth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* CRT Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)",
          zIndex: 60,
        }}
      />

      {/* Main terminal window */}
      <div
        className="relative bg-black border-4 border-green-900 p-6 max-w-2xl w-full mx-4 font-mono text-green-400 shadow-2xl"
        style={{
          boxShadow: "0 0 60px rgba(34, 197, 94, 0.3), inset 0 0 60px rgba(0,0,0,0.5)",
          textShadow: "0 0 10px rgba(34, 197, 94, 0.8)",
        }}
      >
        {/* Terminal header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-green-800">
          <div className="flex items-center gap-2">
            <span className="text-green-600">█</span>
            <span className="text-xs">PRINT.EXE v2.04</span>
            <span className="text-green-600 animate-pulse">●</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSound}
              className="text-xs hover:text-green-300 transition-colors"
              title={localSoundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              [{localSoundEnabled ? "♪ ON" : "♪ OFF"}]
            </button>
            <span className="text-xs text-green-600">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* ASCII Printer */}
        <div className="text-center mb-4">
          <pre
            className="text-xs leading-none inline-block text-left"
            style={{ fontSize: "10px" }}
          >
            {PRINTER_FRAMES[currentFrame]}
          </pre>
        </div>

        {/* Paper output simulation */}
        <div
          className="bg-green-950/30 border border-green-800 p-3 mb-4 overflow-hidden"
          style={{ height: "180px" }}
        >
          <div className="text-xs text-green-300 mb-2 flex justify-between">
            <span>┌─ PAPER OUTPUT ─┐</span>
            <span className="text-green-600">
              {SPINNERS[spinnerIndex]} PRINTING...
            </span>
          </div>
          <div className="font-mono text-xs space-y-0 overflow-hidden">
            {printedLines.map((line, i) => (
              <div
                key={`${paperOffset}-${i}`}
                className="text-green-400 whitespace-pre animate-fadeIn"
                style={{
                  opacity: 0.5 + (i / printedLines.length) * 0.5,
                  animation: "fadeIn 0.1s ease-in",
                }}
              >
                {line || " "}
              </div>
            ))}
            {status === "printing" && (
              <div className="text-green-300 whitespace-pre">
                <span className="animate-pulse">▌</span>
                {glitchText && (
                  <span className="text-green-600 ml-1">{glitchText}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status display */}
        <div className="space-y-2 text-xs">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="text-green-600 w-16">PROGRESS:</span>
            <span className="text-green-400">[{progressBar}]</span>
            <span className="text-green-300 w-12 text-right">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Status line */}
          <div className="flex items-center gap-2">
            <span className="text-green-600 w-16">STATUS:</span>
            <span
              className={
                status === "done" ? "text-green-300" : "text-yellow-400"
              }
            >
              {status === "idle" && "INITIALIZING..."}
              {status === "printing" && (
                <>
                  SPOOLING TO LPT1: {SPINNERS[spinnerIndex]}{" "}
                  {PROGRESS_CHARS[currentFrame % 4]}
                </>
              )}
              {status === "done" && "✓ PRINT JOB COMPLETE"}
            </span>
          </div>

          {/* File info */}
          <div className="flex items-center gap-2">
            <span className="text-green-600 w-16">FILE:</span>
            <span className="text-green-400">{fileName}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-green-600 w-16">ENTRIES:</span>
            <span className="text-green-400">{itemCount} citation(s)</span>
          </div>

          {/* Character counter */}
          <div className="flex items-center gap-2">
            <span className="text-green-600 w-16">CHARS:</span>
            <span className="text-green-400 tabular-nums">{currentChar}</span>
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="mt-4 pt-4 border-t border-green-800">
          <div className="flex justify-between items-center">
            <div className="text-xs text-green-700">
              ═══════════════════════════════════════
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-green-600">
              {status === "printing" ? "Press [ESC] to cancel" : ""}
            </span>
            <div className="flex gap-3">
              {status === "done" ? (
                <button
                  onClick={onClose}
                  className="px-4 py-1 bg-green-900 border border-green-600 text-green-300 text-xs hover:bg-green-800 hover:text-green-200 transition-colors"
                >
                  [ OK ]
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="px-4 py-1 bg-red-950 border border-red-800 text-red-400 text-xs hover:bg-red-900 hover:text-red-300 transition-colors"
                >
                  [ CANCEL ]
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CRT screen edge glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            boxShadow: "inset 0 0 100px rgba(34, 197, 94, 0.1)",
          }}
        />
      </div>

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.1s ease-in;
        }
      `}</style>
    </div>
  );
}
