import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  MapPin,
  Barcode,
  ZoomIn,
  ZoomOut,
  Zap,
  RotateCcw,
  Check,
} from 'lucide-react';
import jsQR from 'jsqr';
import { Material } from '../types';
import { extractBrand, extractDifferentiators } from '../utils/materialDifferentiator';
import { saveMaterialToCloud } from '../services/firebaseSync';

interface BarcodeQrScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onSelectMaterial: (material: Material) => void;
  onOpenWarehouseMap?: (shelfCode: string) => void;
}

export const BarcodeQrScanModal: React.FC<BarcodeQrScanModalProps> = ({
  isOpen,
  onClose,
  materials,
  onSelectMaterial,
  onOpenWarehouseMap,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedMaterial, setMatchedMaterial] = useState<Material | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Zoom & Camera Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1.5); // Default 1.5x for warehouse shelf distance
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);

  // Initialize Native BarcodeDetector if browser supports it
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix', 'upc_a'],
        });
      } catch {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsStartingCamera(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  const findMaterialByCode = useCallback(
    (rawCode: string): Material | null => {
      if (!rawCode) return null;
      let input = rawCode.trim();
      if (!input) return null;

      // 1. Phân tích nếu mã quét là URL (quét bằng camera điện thoại ngoài hoặc link quét kệ)
      if (input.startsWith('http://') || input.startsWith('https://')) {
        try {
          const url = new URL(input);
          const paramCode =
            url.searchParams.get('scan') ||
            url.searchParams.get('code') ||
            url.searchParams.get('mat') ||
            url.searchParams.get('id') ||
            url.searchParams.get('data');
          if (paramCode) {
            input = paramCode.trim();
          } else if (url.hash) {
            input = url.hash.replace(/^#/, '').trim();
          }
        } catch {}
      }

      const cleanUpper = input.toUpperCase();
      const cleanAlphanumeric = cleanUpper.replace(/[^A-Z0-9]/g, '');

      // 2. So khớp trực tiếp Mã Vật Tư (Code)
      let found = materials.find((m) => m.code && m.code.trim().toUpperCase() === cleanUpper);
      if (found) return found;

      // 3. So khớp Mã QR đồng bộ từ Google Sheet (qrCode)
      found = materials.find((m) => m.qrCode && m.qrCode.trim().toUpperCase() === cleanUpper);
      if (found) return found;

      // 4. So khớp Mã Barcode (barcode)
      found = materials.find((m) => m.barcode && m.barcode.trim().toUpperCase() === cleanUpper);
      if (found) return found;

      // 5. So khớp phân tách ký tự ngăn cách: "Tên Sản Phẩm | Mã Vật Tư" (Cột E Google Sheet)
      if (input.includes('|') || input.includes(' - ') || input.includes(':')) {
        const parts = input.split(/[|\-:]/).map((p) => p.trim());
        for (const part of parts) {
          if (!part) continue;
          const partUpper = part.toUpperCase();
          const partAlpha = partUpper.replace(/[^A-Z0-9]/g, '');
          const sub = materials.find(
            (m) =>
              (m.code && m.code.trim().toUpperCase() === partUpper) ||
              (m.qrCode && m.qrCode.trim().toUpperCase() === partUpper) ||
              (m.barcode && m.barcode.trim().toUpperCase() === partUpper) ||
              (partAlpha.length >= 4 && m.code.toUpperCase().replace(/[^A-Z0-9]/g, '') === partAlpha)
          );
          if (sub) return sub;
        }
      }

      // 6. So khớp ký tự thuần (bỏ gạch dưới, khoảng trắng: BTVT00NEP12 -> BT_VT_00NEP_12)
      if (cleanAlphanumeric.length >= 4) {
        found = materials.find((m) => {
          const mCodeClean = m.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (mCodeClean === cleanAlphanumeric) return true;
          if (m.barcode && m.barcode.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanAlphanumeric) return true;
          if (m.qrCode && m.qrCode.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanAlphanumeric) return true;
          return false;
        });
        if (found) return found;
      }

      // 7. So khớp chuỗi con mã vật tư hoặc tên mô tả vật tư
      found = materials.find((m) => {
        const c = m.code.toUpperCase();
        const n = m.name.toUpperCase();
        const q = (m.qrCode || '').toUpperCase();
        return (
          cleanUpper.includes(c) ||
          (q && cleanUpper.includes(q)) ||
          c.includes(cleanUpper) ||
          (cleanUpper.length >= 5 && (n.includes(cleanUpper) || cleanUpper.includes(n)))
        );
      });

      return found || null;
    },
    [materials]
  );

  const handleDetectedCode = useCallback(
    (code: string) => {
      setScannedCode(code);
      const mat = findMaterialByCode(code);
      if (mat) {
        setMatchedMaterial(mat);

        // Haptic feedback for mobile phones
        try {
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
        } catch {}

        // Audio chime feedback
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = 920;
          gain.gain.value = 0.15;
          osc.start();
          setTimeout(() => {
            osc.stop();
            audioCtx.close();
          }, 140);
        } catch {}

        // Stop camera once found to save battery & freeze preview
        stopCamera();
      } else {
        setMatchedMaterial(null);
      }
    },
    [findMaterialByCode, stopCamera]
  );

  // Scan frame processing loop
  const tickScan = useCallback(async () => {
    if (!isScanningRef.current) return;
    const video = videoRef.current;
    if (!video || !streamRef.current) {
      animFrameIdRef.current = requestAnimationFrame(tickScan);
      return;
    }

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      // 1. Try Native BarcodeDetector first (Ultra-fast, hardware accelerated on iOS Safari 17+ / Chrome Android)
      if (barcodeDetectorRef.current) {
        try {
          const detected = await barcodeDetectorRef.current.detect(video);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            handleDetectedCode(detected[0].rawValue);
            return;
          }
        } catch {}
      }

      // 2. Canvas-based decoder with jsQR & Zoom Center Crop
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            // Target optimal decoding resolution (approx 640-800px)
            const targetDim = Math.min(Math.max(vw, vh), 800);
            canvas.width = targetDim;
            canvas.height = targetDim;

            // When zoomed in, crop center portion so distant shelf QR fills frame
            const currentZoom = zoomLevel;
            if (currentZoom > 1) {
              const cropW = vw / currentZoom;
              const cropH = vh / currentZoom;
              const cropX = (vw - cropW) / 2;
              const cropY = (vh - cropH) / 2;
              ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
            } else {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (qrResult && qrResult.data) {
              handleDetectedCode(qrResult.data);
              return;
            }
          }
        } catch (err) {
          console.warn('Scan frame processing error:', err);
        }
      }
    }

    if (isScanningRef.current) {
      animFrameIdRef.current = requestAnimationFrame(tickScan);
    }
  }, [zoomLevel, handleDetectedCode]);

  const applyZoomConstraint = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps: any = track.getCapabilities();
        if (caps.zoom) {
          try {
            const min = caps.zoom.min || 1;
            const max = caps.zoom.max || 5;
            const clamped = Math.min(Math.max(newZoom, min), max);
            await track.applyConstraints({ advanced: [{ zoom: clamped } as any] });
          } catch {}
        }
      }
    }
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const nextState = !isTorchOn;
          await track.applyConstraints({ advanced: [{ torch: nextState } as any] });
          setIsTorchOn(nextState);
        } catch (e) {
          console.warn('Torch toggle failed:', e);
        }
      }
    }
  };

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      // First attempt with environment facing camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false,
        });
      } catch {
        // Fallback for laptops or devices without environment camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      // Check torch and zoom capabilities
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps: any = track.getCapabilities();
        if (caps.torch) setHasTorch(true);
      }

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('autoplay', 'true');
        video.playsInline = true;
        video.muted = true;
        video.autoplay = true;

        await video.play().catch((e) => console.log('Video play caught:', e));

        setCameraActive(true);
        setIsStartingCamera(false);
        isScanningRef.current = true;

        // Apply default zoom to hardware if supported
        applyZoomConstraint(zoomLevel);

        // Start scanning loop
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsStartingCamera(false);
      setCameraActive(false);
      setCameraError(
        'Chưa thể mở camera (vui lòng bấm "Cho phép" khi trình duyệt hỏi quyền truy cập Camera). Bạn cũng có thể tải ảnh lên hoặc gõ mã trực tiếp!'
      );
    }
  }, [zoomLevel, tickScan]);

  // Auto-start camera as soon as modal is opened
  useEffect(() => {
    if (isOpen) {
      setScannedCode(null);
      setMatchedMaterial(null);
      setManualInput('');
      setCameraError(null);
      setTimeout(() => inputRef.current?.focus(), 150);

      // Automatically launch camera
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  // Image Upload Scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            handleDetectedCode(code.data);
          } else {
            setCameraError('Không tìm thấy mã QR rõ ràng trong ảnh này. Hãy thử chụp góc gần hơn.');
          }
        }
        setIsScanningImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Direct Shelf Photo Capture & Upload into Firestore
  const handleDirectShelfPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !matchedMaterial) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const optimized = canvas.toDataURL('image/jpeg', 0.85);
          const updated: Material = {
            ...matchedMaterial,
            image: optimized,
            updatedAt: new Date().toISOString(),
          };
          setMatchedMaterial(updated);
          await saveMaterialToCloud(updated);
        }
        setIsUploadingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDetectedCode(manualInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Quét Mã QR &amp; Barcode Kệ Kho</span>
                <span className="text-[10px] bg-purple-950 border border-purple-600/60 text-purple-300 font-mono px-1.5 py-0.2 rounded">
                  Tự Động Zoom
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Nhận diện tức thì mã dán trên kệ, xem ảnh thực tế &amp; quy cách kỹ thuật
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Quick Input Bar (Compatible with USB Barcode Scanner Guns) */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-blue-400" />
                Nhập hoặc Bắn Mã Bằng Súng Quét / Bàn Phím:
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Tự động nhận diện</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Quét mã vạch hoặc gõ: BT_VT_*, DN_VT_*, bu lông, rơ le, nẹp..."
                  className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/30 shrink-0"
              >
                Tra Cứu
              </button>
            </div>
          </form>

          {/* Camera Stage with Viewfinder and Optical/Digital Zoom Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center p-3">
            <div className="relative w-full max-w-sm aspect-square mx-auto overflow-hidden rounded-xl border border-blue-500/60 bg-black shadow-2xl">
              {/* Permanent Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
                playsInline
                autoPlay
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Inactive or Loading Overlay */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4 z-20">
                  {isStartingCamera ? (
                    <div className="space-y-2.5">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                      <p className="text-white font-bold text-xs">Đang mở camera &amp; zoom vào mã QR...</p>
                      <p className="text-[11px] text-slate-400">Vui lòng chờ trong giây lát</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-850 border border-slate-700 flex items-center justify-center mx-auto text-blue-400">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">Camera đang tắt</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Bấm để quét mã QR dán trên kệ</p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 mx-auto"
                      >
                        <Camera className="w-3.5 h-3.5" /> Bật Camera Quét
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Scanner Viewfinder & Laser Reticle */}
              {cameraActive && (
                <>
                  {/* Laser line & Aiming reticle */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_14px_#22d3ee] animate-bounce top-1/2 absolute"></div>
                    <div className="absolute inset-7 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center">
                      <span className="text-[10px] text-cyan-200 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-md font-mono border border-cyan-500/30">
                        Căn mã QR kệ kho vào đây ({zoomLevel}x)
                      </span>
                    </div>
                  </div>

                  {/* Top Bar: Torch & Re-center/Pause Controls */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20">
                    {hasTorch ? (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border backdrop-blur-md shadow-sm ${
                          isTorchOn
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900/80 text-white border-slate-700'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>{isTorchOn ? 'Đèn Bật' : 'Bật Đèn'}</span>
                      </button>
                    ) : (
                      <div className="text-[9px] bg-slate-950/70 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        Quét Kệ Kho
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 transition backdrop-blur-md"
                    >
                      Dừng Quét
                    </button>
                  </div>

                  {/* Bottom Zoom Control Bar: 1x, 1.5x, 2x, 3x */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-1.5 z-20 bg-slate-950/85 backdrop-blur-md py-1.5 px-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-cyan-400 mr-1 flex items-center gap-0.5">
                      <ZoomIn className="w-3 h-3" /> Zoom:
                    </span>
                    {[1, 1.5, 2, 3].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => applyZoomConstraint(z)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
                          zoomLevel === z
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50 scale-105'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sub-bar below camera: Re-scan / Upload Image */}
            <div className="flex items-center justify-center gap-2 pt-3 flex-wrap">
              {!cameraActive && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Quét Tiếp</span>
                </button>
              )}

              <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>{isScanningImage ? 'Đang đọc ảnh...' : 'Tải Ảnh QR Lên'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isScanningImage}
                  className="hidden"
                />
              </label>

              {matchedMaterial && (
                <button
                  type="button"
                  onClick={() => {
                    setScannedCode(null);
                    setMatchedMaterial(null);
                    startCamera();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span>Quét Mã Khác</span>
                </button>
              )}
            </div>

            {cameraError && (
              <div className="mt-2.5 p-2 rounded-lg bg-amber-950/60 border border-amber-600/40 text-amber-300 text-[11px] text-center max-w-sm flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Matched Material Display */}
          {matchedMaterial ? (
            <div className="p-4 rounded-2xl bg-slate-850 border-2 border-emerald-500/50 space-y-3.5 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ĐÃ NHẬN DIỆN CHÍNH XÁC VẬT TƯ TRÊN KỆ:</span>
                </div>
                <span className="font-mono text-xs text-cyan-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                  {scannedCode}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-3.5 pt-1">
                {/* Photo Thumbnail + Direct Shelf Snap Button */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 w-full sm:w-auto">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center relative group shadow-inner">
                    {matchedMaterial.image ? (
                      <img
                        src={matchedMaterial.image}
                        alt={matchedMaterial.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400 space-y-1">
                        <Eye className="w-7 h-7 mx-auto opacity-40 text-slate-500" />
                        <span className="text-[10px] font-medium block text-slate-400">Chưa có ảnh thật</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] text-cyan-300 font-mono border border-slate-700">
                      Ảnh Thật
                    </span>
                  </div>

                  {/* Button to Snap/Upload Photo right at the shelf */}
                  <label className="w-full sm:w-32 py-1 px-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-cyan-300 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer text-center">
                    <Camera className="w-3 h-3" />
                    <span>{isUploadingPhoto ? 'Đang lưu...' : 'Chụp Ảnh Tại Kệ'}</span>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleDirectShelfPhoto}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1.5 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-950 border border-blue-600/70 text-cyan-300">
                      {matchedMaterial.code}
                    </span>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded">
                      HÃNG: {extractBrand(matchedMaterial).name}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      ĐVT: <strong className="text-white">{matchedMaterial.unit}</strong>
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Mô Tả Vật Tư:</div>
                    <h3 className="font-bold text-white text-sm">{matchedMaterial.name}</h3>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Quy Cách Kỹ Thuật &amp; Tiêu Chuẩn:
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
                      {matchedMaterial.specification || matchedMaterial.name}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-300 flex items-center gap-3 pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <MapPin className="w-3.5 h-3.5" /> Vị trí kệ: <strong className="text-white">{matchedMaterial.location || 'Kho Tổng'}</strong>
                    </span>
                    <span>• Tồn kho: <strong className="text-white font-mono">{matchedMaterial.initialStock} {matchedMaterial.unit}</strong></span>
                  </div>
                </div>
              </div>

              {/* QR Code & Barcode Shelf Reference */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-purple-400" />
                    Mã QR Định Danh Kệ (Google Sheet):
                  </div>
                  <div className="font-mono text-cyan-300 text-[11px] truncate font-medium">
                    {matchedMaterial.qrCode || `${matchedMaterial.name} | ${matchedMaterial.code}`}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Barcode 1D: {matchedMaterial.barcode || matchedMaterial.code.replace(/[^A-Z0-9]/gi, '')}
                  </div>
                </div>
                <div className="shrink-0 bg-white p-1 rounded-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(
                      matchedMaterial.qrCode || `${matchedMaterial.name} | ${matchedMaterial.code}`
                    )}`}
                    alt="QR"
                    className="w-10 h-10 object-contain"
                  />
                </div>
              </div>

              {/* Differentiator warning if any */}
              {extractDifferentiators(matchedMaterial).length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-medium space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Chú Ý Tránh Nhầm Lẫn (Ca Đêm / Mới Vào):
                  </div>
                  {extractDifferentiators(matchedMaterial).map((d, i) => (
                    <div key={i} className="pl-3">{d}</div>
                  ))}
                </div>
              )}

              {/* Big CTA to open full visual identification card */}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onSelectMaterial(matchedMaterial);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <Eye className="w-4 h-4" />
                <span>Mở Toàn Màn Hình Thẻ Nhận Diện Ảnh Thật &amp; Hồ Sơ Kỹ Thuật</span>
              </button>
            </div>
          ) : scannedCode ? (
            (() => {
              const codeUp = scannedCode.toUpperCase().trim();
              const isShelfMatch =
                codeUp.includes('SHELF') ||
                codeUp.includes('KE-0') ||
                codeUp.includes('KE-') ||
                codeUp.includes('TDN-') ||
                codeUp.includes('CABINET') ||
                codeUp.includes('KỆ');
              
              if (isShelfMatch) {
                return (
                  <div className="p-4 rounded-2xl bg-blue-950/50 border-2 border-blue-500/60 text-blue-200 text-center space-y-2 shadow-xl animate-in zoom-in-95">
                    <div className="flex items-center justify-center gap-2 text-blue-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>ĐÃ QUÉT THÀNH CÔNG MÃ QR KỆ KHO / TỦ ĐỒ NGHỀ:</span>
                    </div>
                    <div className="font-mono text-base font-black text-amber-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700 inline-block">
                      {scannedCode}
                    </div>
                    <p className="text-xs text-slate-300">
                      Mã này là tem định danh vị trí khay kệ 4 tầng hoặc tủ kỹ thuật trong phòng kho ĐNCT.
                    </p>
                    {onOpenWarehouseMap && (
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          onOpenWarehouseMap(scannedCode);
                          onClose();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition mt-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Mở Sơ Đồ Kho &amp; Xem Danh Sách Vật Tư Tại Kệ Này</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-1">
                  <p className="font-semibold text-xs">Không tìm thấy mã "{scannedCode}" trong danh mục kho</p>
                  <p className="text-[11px] text-slate-400">
                    Hãy kiểm tra lại mã hoặc bấm vào một trong các món thử nghiệm bên dưới.
                  </p>
                </div>
              );
            })()
          ) : null}

          {/* Quick Demo Test Chips */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Thử Nhanh Các Mẫu Linh Kiện Dễ Nhầm Lẫn (Ca Đêm / Mới Vào):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(materials.filter((m) => m.differentiator || m.image || m.barcode).length > 0
                ? materials.filter((m) => m.differentiator || m.image || m.barcode).slice(0, 8)
                : materials.slice(0, 6)
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    handleDetectedCode(m.code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-blue-500/60 text-[11px] font-mono transition flex items-center gap-1.5 group"
                >
                  <span className="font-bold text-cyan-400 group-hover:text-cyan-300">{m.code}</span>
                  <span className="text-slate-400 max-w-[140px] truncate text-[10px]">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
