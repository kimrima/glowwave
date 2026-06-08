'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
  onScanSuccess: (roomId: string) => void;
  onClose: () => void;
}

export default function QRScannerModal({ onScanSuccess, onClose }: QRScannerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libLoaded, setLibLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  // 1. Dynamically Load jsQR Script from CDN
  useEffect(() => {
    const scriptId = 'jsqr-cdn-script';
    const existingScript = document.getElementById(scriptId);

    const onScriptLoad = () => {
      setLibLoaded(true);
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      script.onload = onScriptLoad;
      script.onerror = () => {
        setError('QR 코드 스캐너 라이브러리를 불러오지 못했습니다. 네트워크 상태를 확인하세요.');
        setLoading(false);
      };
      document.body.appendChild(script);
    } else {
      // Script already exists, check if loaded
      if ((window as any).jsQR) {
        setLibLoaded(true);
      } else {
        existingScript.addEventListener('load', onScriptLoad);
      }
    }

    return () => {
      const script = document.getElementById(scriptId);
      if (script) {
        script.removeEventListener('load', onScriptLoad);
      }
    };
  }, []);

  // 2. Request Camera Stream once library is loaded
  useEffect(() => {
    if (!libLoaded) return;

    const startCamera = async () => {
      setLoading(true);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Required for iOS Safari play inline
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
        }
        setLoading(false);
      } catch (err: any) {
        console.error('Camera access error:', err);
        setError('카메라 권한을 얻지 못했습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      // Stop media tracks when component disappears
      stopCamera();
    };
  }, [libLoaded]);

  // 3. Scan Loop
  useEffect(() => {
    if (loading || error || !libLoaded) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        requestRef.current = requestAnimationFrame(tick);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Sync canvas size to video aspect ratio
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = (window as any).jsQR?.(
            imageData.data,
            canvas.width,
            canvas.height,
            { inversionAttempts: 'dontInvert' }
          );

          if (code && code.data) {
            console.log('[QRScanner] Scanned code:', code.data);
            
            // Extract code: can be full URL like "http://.../room/WAVE99" or just 6-char string
            const roomId = parseScannedCode(code.data);
            if (roomId) {
              // Stop everything and return code
              stopCamera();
              onScanSuccess(roomId);
              return; // End loop
            }
          }
        }
      }
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [loading, error, libLoaded, onScanSuccess]);

  const parseScannedCode = (data: string): string | null => {
    // 1. Try matching room code format inside URL (6 alphanumeric chars at the end)
    const urlMatch = data.match(/\/room\/([A-Z0-9]{6})/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }

    // 2. If it's a raw 6-character alphanumeric string, accept it
    const rawMatch = data.trim().match(/^[A-Z0-9]{6}$/i);
    if (rawMatch) {
      return data.trim().toUpperCase();
    }

    return null;
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('[QRScanner] Camera track stopped:', track.label);
      });
      streamRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass-effect rounded-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 border border-white/10 text-center">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-400" />
            QR 코드 스캔
          </h3>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Display Window */}
        <div className="relative aspect-square w-full bg-zinc-950/60 rounded-xl border border-white/5 overflow-hidden mb-5 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-zinc-400 z-10">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs font-semibold">카메라 작동 중...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-red-400 p-6 z-10">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Hidden HTML5 video player stream */}
          <video
            ref={videoRef}
            className="hidden"
            muted
            playsInline
          />

          {/* Active Canvas rendering stream */}
          {!loading && !error && (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
              />
              
              {/* Decorative Scanning Box Frame overlay */}
              <div className="absolute inset-10 border-2 border-indigo-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                {/* Horizontal Neon scanner laser bar animation */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_10px_#818cf8] animate-[scan_2s_infinite_ease-in-out]" />
                
                {/* Corner Accents */}
                <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-zinc-400 leading-normal max-w-xs mx-auto">
          전광판 스크린이나 티켓의 QR 코드를 사각형 가이드라인 중앙에 맞춰주시면 자동으로 스캔하여 방에 입장합니다.
        </p>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% {
            top: 0%;
          }
          50% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  );
}
