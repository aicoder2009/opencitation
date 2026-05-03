"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onDetect: (isbn: string) => void;
  onClose: () => void;
}

function isIsbn(value: string): boolean {
  const digits = value.replace(/[^\dX]/gi, "");
  if (digits.length === 13) return /^97[89]\d{10}$/.test(digits);
  if (digits.length === 10) return /^\d{9}[\dX]$/i.test(digits);
  return false;
}

export function BarcodeScanner({ onDetect, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("Camera not available in this browser. Type the ISBN manually instead.");
        setIsStarting(false);
        return;
      }

      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);

        const reader = new BrowserMultiFormatReader(hints);
        const video = videoRef.current;
        if (!video || cancelled) return;

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result) => {
            if (!result) return;
            const text = result.getText();
            if (isIsbn(text)) {
              controls.stop();
              onDetect(text.replace(/[^\dX]/gi, ""));
            }
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setIsStarting(false);
      } catch (err) {
        console.error(err);
        setError("Could not access the camera. Check permissions or type the ISBN manually.");
        setIsStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onDetect]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-wiki-white border border-wiki-border-light max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-wiki-border-light flex items-center justify-between bg-wiki-tab-bg">
          <span className="font-medium text-sm">Scan ISBN barcode</span>
          <button
            type="button"
            onClick={onClose}
            className="text-wiki-link text-sm hover:underline"
          >
            [close]
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <p className="text-sm text-wiki-text-muted">{error}</p>
          ) : (
            <>
              <div className="relative bg-black aspect-video overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {isStarting && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                    Starting camera...
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-wiki-text-muted">
                Point your camera at the barcode on the back of the book. ISBN-13
                (starts with 978 or 979) works best.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
