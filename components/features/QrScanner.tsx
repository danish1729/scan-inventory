"use client";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { AlertCircle } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Config
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    // 2. Init
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner("reader", config, false);

      scannerRef.current.render(
        (decodedText) => {
          // Pause scanning on success to prevent multiple triggers
          if (scannerRef.current) {
            scannerRef.current.pause();
          }
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore frequent "Scanning..." errors
        }
      );
    }

    // 3. Cleanup
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.error("Scanner clear error", e);
        }
      }
    };
  }, [onScan]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="relative overflow-hidden rounded-2xl border-4 border-slate-900 bg-black shadow-2xl">
        <div
          id="reader"
          className="w-full h-full min-h-[300px] bg-black text-white"
        />
      </div>
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <p className="text-center text-xs text-slate-400 font-mono">
        Scanner Active
      </p>
    </div>
  );
}
