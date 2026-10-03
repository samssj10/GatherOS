import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export type ScannerStatus = 'starting' | 'scanning' | 'denied' | 'unavailable';

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

const SCAN_INTERVAL_MS = 150;
const MAX_FRAME_WIDTH = 640;
/** The camera sees one code many times a second: report a repeat only after this long. */
const REPEAT_AFTER_MS = 4000;

/** Browsers hide the camera API outside secure pages, though the types say it is always there. */
function cameraAvailable(): boolean {
  const devices = (navigator as { mediaDevices?: MediaDevices }).mediaDevices;
  return typeof devices?.getUserMedia === 'function';
}

function createDetector(): BarcodeDetectorLike | null {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (!Detector) return null;
  try {
    return new Detector({ formats: ['qr_code'] });
  } catch {
    return null;
  }
}

/** Reads one frame with jsQR, for browsers without the built-in BarcodeDetector. */
function decodeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
}

interface Result {
  /** Attach to a <video playsInline muted> element. */
  videoRef: RefObject<HTMLVideoElement | null>;
  status: ScannerStatus;
}

/**
 * Opens the camera and reports every QR code it reads through `onResult`. The camera runs only while
 * the component using this hook is mounted, and every track is stopped when it unmounts.
 */
export function useQrScanner(onResult: (text: string) => void): Result {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<ScannerStatus>(() => (cameraAvailable() ? 'starting' : 'unavailable'));
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (!cameraAvailable()) return undefined;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let detector = createDetector();
    let last = { text: '', at: 0 };
    const canvas = document.createElement('canvas');

    const scan = async () => {
      const video = videoRef.current;
      if (cancelled || !video) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        let text: string | null = null;
        try {
          text = detector ? ((await detector.detect(video))[0]?.rawValue ?? null) : decodeFrame(video, canvas);
        } catch {
          // The built-in detector can exist yet fail on some devices: fall back to jsQR.
          detector = null;
        }
        const now = Date.now();
        if (text && !cancelled && (text !== last.text || now - last.at > REPEAT_AFTER_MS)) {
          last = { text, at: now };
          onResultRef.current(text);
        }
      }
      if (!cancelled) timer = window.setTimeout(() => void scan(), SCAN_INTERVAL_MS);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async (opened) => {
        if (cancelled) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = opened;
        await video.play().catch(() => undefined);
        setStatus('scanning');
        void scan();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : '';
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { videoRef, status };
}
