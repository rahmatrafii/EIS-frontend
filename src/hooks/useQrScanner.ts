// src/hooks/useQrScanner.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

interface UseQrScannerProps {
  onScanSuccess: (code: string) => void;
  onScanError?: (err: string) => void;
}

export function useQrScanner({ onScanSuccess, onScanError }: UseQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [permissionStatus, setPermissionStatus] = useState<"loading" | "granted" | "denied">("loading");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !isScanning) return;

    const video = videoRef.current;
    
    // Create canvas if it doesn't exist
    if (!canvasRef.current && typeof window !== "undefined") {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    if (canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          onScanSuccess(code.data);
          stopScanning();
          return; // Stop scan loop upon success
        }
      }
    }

    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  }, [isScanning, onScanSuccess, stopScanning]);

  const startScanning = useCallback(async () => {
    setError(null);
    setPermissionStatus("loading");
    stopScanning(); // Clean up any existing instances first

    // List of constraints to try, from modern/compatible mobile format to basic fallback
    const constraintsList: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: "environment",
        },
        audio: false,
      },
      {
        video: true, // absolute fallback to any camera (e.g. front camera)
        audio: false,
      }
    ];

    let lastError: any = null;
    let stream: MediaStream | null = null;

    for (const constraints of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) {
          console.log("Successfully accessed camera with constraints:", constraints);
          break;
        }
      } catch (err: any) {
        console.warn("Failed camera access with constraints:", constraints, err);
        lastError = err;
      }
    }

    if (!stream) {
      console.error("All camera initialization attempts failed:", lastError);
      setPermissionStatus("denied");
      setError(
        lastError?.message || "Izin akses kamera ditolak atau kamera tidak ditemukan."
      );
      if (onScanError) {
        onScanError(
          lastError?.message || "Izin akses kamera ditolak atau kamera tidak ditemukan."
        );
      }
      return;
    }

    try {
      streamRef.current = stream;
      setPermissionStatus("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS safari
        videoRef.current.play().catch((err) => {
          console.error("Video play error:", err);
        });
      }

      setIsScanning(true);
    } catch (err: any) {
      console.error("Error setting video stream:", err);
      setPermissionStatus("denied");
      setError(err.message || "Gagal memproses video kamera.");
      if (onScanError) {
        onScanError(err.message || "Gagal memproses video kamera.");
      }
    }
  }, [onScanError, stopScanning]);

  // Start checking permissions status in standard way
  useEffect(() => {
    // Check if browser supports mediaDevices
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setError("Browser Anda tidak mendukung akses kamera.");
      setPermissionStatus("denied");
      return;
    }

    // Auto prompt on load according to SOP V-07 ("Minta permission kamera saat halaman load")
    startScanning();

    return () => {
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  // Restart scanning loop when isScanning becomes true
  useEffect(() => {
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, scanFrame]);

  // Ensure stream is attached to the video element if it's available but not yet bound
  useEffect(() => {
    if (isScanning && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.play().catch((err) => {
        console.error("Video play error in auto-attach effect:", err);
      });
    }
  });

  return {
    videoRef,
    isScanning,
    permissionStatus,
    error,
    startScanning,
    stopScanning,
  };
}
