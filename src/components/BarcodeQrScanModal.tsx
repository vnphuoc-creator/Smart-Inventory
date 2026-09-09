import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  Layers,
  MapPin,
  Barcode,
} from 'lucide-react';
import jsQR from 'jsqr';
import { Material } from '../types';
import { extractBrand, extractDifferentiators } from '../utils/materialDifferentiator';

interface BarcodeQrScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onSelectMaterial: (material: Material) => void;
}

export const BarcodeQrScanModal: React.FC<BarcodeQrScanModalProps> = ({
  isOpen,
  onClose,
  materials,
  onSelectMaterial,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedMaterial, setMatchedMaterial] = useState<Material | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setScannedCode(null);
      setMatchedMaterial(null);
      setManualInput('');
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Không thể mở camera (trình duyệt chưa cấp quyền hoặc đang mở trong iFrame). Bạn có thể gõ mã hoặc tải ảnh lên để quét!'
      );
      setCameraActive(false);
    }
  };

  const findMaterialByCode = (rawCode: string): Material | null => {
    if (!rawCode) return null;
    const clean = rawCode.trim().toUpperCase();

    // 1. Direct code match
    let found = materials.find((m) => m.code.toUpperCase() === clean);
    if (found) return found;

    // 2. Barcode match
    found = materials.find((m) => m.barcode && m.barcode.toUpperCase() === clean);
    if (found) return found;

    // 3. QR code match
    found = materials.find((m) => m.qrCode && m.qrCode.toUpperCase() === clean);
    if (found) return found;

    // 4. Code includes or name match
    found = materials.find((m) => {
      const c = m.code.toUpperCase();
      const n = m.name.toUpperCase();
      return c.includes(clean) || (clean.length >= 4 && n.includes(clean));
    });

    return found || null;
  };

  const handleDetectedCode = (code: string) => {
    setScannedCode(code);
    const mat = findMaterialByCode(code);
    if (mat) {
      setMatchedMaterial(mat);
      // Play subtle beep if audio context available
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        setTimeout(() => {
          osc.stop();
          audioCtx.close();
        }, 120);
      } catch {}
    } else {
      setMatchedMaterial(null);
    }
  };

  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrResult && qrResult.data) {
            handleDetectedCode(qrResult.data);
            stopCamera();
            return;
          }
        }
      }
    }
    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

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
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDetectedCode(code.data);
          } else {
            setCameraError('Không tìm thấy mã QR rõ ràng trong ảnh này. Hãy thử ảnh chụp góc gần hơn.');
          }
        }
        setIsScanningImage(false);
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
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
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
                <span>Quét Mã QR &amp; Barcode Đối Chiếu Ảnh Thật</span>
                <span className="text-[10px] bg-purple-950 border border-purple-600/60 text-purple-300 font-mono px-1.5 py-0.2 rounded">
                  2D / 1D
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Nhận diện tức thì linh kiện, xem ảnh phóng to và thông số kỹ thuật chống lấy nhầm
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
              <span className="text-[10px] text-slate-500 font-normal">Hỗ trợ tự động enter</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Quét mã vạch hoặc gõ: DN_CC_*, bu lông, rơ le, ABB, Schneider..."
                  className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition"
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

          {/* Camera Stage */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative min-h-[220px] flex flex-col items-center justify-center p-3">
            {cameraActive ? (
              <div className="relative w-full max-w-sm aspect-square mx-auto overflow-hidden rounded-xl border border-blue-500/50 shadow-2xl">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser scan line animation */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-bounce top-1/2 absolute"></div>
                  <div className="absolute inset-6 border-2 border-cyan-400/40 rounded-lg"></div>
                </div>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 transition backdrop-blur-xs"
                >
                  Tắt Camera
                </button>
              </div>
            ) : (
              <div className="text-center p-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-850 border border-slate-700 mx-auto flex items-center justify-center text-blue-400 shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-slate-200 font-bold text-xs">Quét trực tiếp qua Camera điện thoại / máy tính</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Đưa mã QR hoặc Barcode trên bao bì vật tư vào khung ngắm để đối chiếu ảnh thật
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Bật Camera Quét</span>
                  </button>

                  <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Ảnh Mã Lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {cameraError && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed max-w-md mx-auto">
                    {cameraError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scanned Result Banner */}
          {matchedMaterial ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-slate-850 to-slate-900 border border-emerald-500/50 shadow-xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã Nhận Diện Khớp Vật Tư Trong Kho
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Mã quét: <strong className="text-white">{scannedCode}</strong>
                </span>
              </div>

              <div className="flex items-start gap-3.5 pt-1">
                {/* Photo Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {matchedMaterial.image ? (
                    <img
                      src={matchedMaterial.image}
                      alt={matchedMaterial.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-1 text-slate-500">
                      <Eye className="w-5 h-5 mx-auto opacity-50" />
                      <span className="text-[9px]">Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1">
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

                  <h3 className="font-bold text-white text-sm line-clamp-1">{matchedMaterial.name}</h3>

                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    {matchedMaterial.specification}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <MapPin className="w-3 h-3" /> {matchedMaterial.location || 'Kho Tổng'}
                    </span>
                    <span>• Tồn: <strong className="text-white font-mono">{matchedMaterial.initialStock}</strong></span>
                  </div>
                </div>
              </div>

              {/* Differentiator warning if any */}
              {extractDifferentiators(matchedMaterial).length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-medium space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Chú Ý Tránh Nhầm Lẫn:
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
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-1">
              <p className="font-semibold text-xs">Không tìm thấy mã "{scannedCode}" trong danh mục kho</p>
              <p className="text-[11px] text-slate-400">
                Hãy kiểm tra lại mã hoặc bấm vào một trong các món thử nghiệm bên dưới.
              </p>
            </div>
          ) : null}

          {/* Quick Demo Test Chips (Linh kiện thường dễ nhầm lẫn theo ý kiến người dùng) */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Thử Nhanh Các Mẫu Linh Kiện Dễ Nhầm Lẫn (Ca Đêm / Mới Vào):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {materials.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    handleDetectedCode(m.code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-blue-500/60 text-[11px] font-mono transition flex items-center gap-1"
                >
                  <span className="font-bold text-cyan-400">{m.code}</span>
                  <span className="text-slate-400 max-w-[120px] truncate text-[10px]">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
