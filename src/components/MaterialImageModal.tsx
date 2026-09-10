import React, { useState, useRef } from 'react';
import {
  X,
  Package,
  Layers,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Copy,
  Coins,
  Warehouse,
  Boxes,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  Camera,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Tag,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Material, CalculatedMaterialStock } from '../types';
import { formatVND, formatNumber } from '../utils/inventoryEngine';
import { extractBrand, extractDifferentiators } from '../utils/materialDifferentiator';
import { saveMaterialToCloud } from '../services/firebaseSync';

interface MaterialDetailModalProps {
  material: Material;
  calculatedStock?: CalculatedMaterialStock;
  isOpen: boolean;
  onClose: () => void;
  onOpenStockCard?: (materialCode: string) => void;
  onCreateExport?: (materialCode: string) => void;
}

export const MaterialImageModal: React.FC<MaterialDetailModalProps> = ({
  material,
  calculatedStock,
  isOpen,
  onClose,
  onOpenStockCard,
  onCreateExport,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [checkedSteps, setCheckedSteps] = useState<{ [key: string]: boolean }>({
    step1: false,
    step2: false,
    step3: false,
  });

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !material) return;
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
            ...material,
            image: optimized,
            updatedAt: new Date().toISOString(),
          };
          await saveMaterialToCloud(updated);
          setImageLoadError(false);
        }
        setIsUploadingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !material) return null;

  const currentStock = calculatedStock?.currentStock ?? material.initialStock;
  const isLowStock = currentStock <= material.minStock;
  const isOut = currentStock <= 0;

  const brandInfo = extractBrand(material);
  const differentiators = extractDifferentiators(material);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(material.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintShelfLabel = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shelfScanUrl = `${origin}/?scan=${encodeURIComponent(material.code)}`;
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shelfScanUrl)}`;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép mở cửa sổ popup để in tem dán kệ.');
      return;
    }

    const specText = material.specification || material.name;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tem Nhãn Kệ - ${material.code}</title>
        <style>
          @page { size: 100mm 60mm; margin: 4mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; background: #fff; }
          .label-box { border: 2px solid #000; padding: 6px 8px; border-radius: 6px; width: 92mm; height: 52mm; display: flex; flex-direction: column; justify-content: space-between; }
          .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 3px; }
          .title { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; }
          .loc { font-size: 11px; font-weight: bold; background: #000; color: #fff; padding: 1px 6px; border-radius: 3px; }
          .middle { display: flex; gap: 8px; align-items: center; margin: 3px 0; flex: 1; min-height: 0; }
          .photo { width: 50px; height: 50px; object-fit: cover; border: 1px solid #999; border-radius: 4px; }
          .info { flex: 1; min-width: 0; }
          .code { font-size: 13px; font-weight: 900; font-family: monospace; }
          .name { font-size: 10.5px; font-weight: bold; line-height: 1.2; margin: 2px 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
          .spec { font-size: 9px; color: #222; line-height: 1.2; margin-top: 1px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
          .foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #666; padding-top: 3px; }
          .qr-part { display: flex; align-items: center; gap: 5px; }
          .qr-part img { width: 42px; height: 42px; }
          .qr-txt { font-size: 7.5px; font-weight: bold; line-height: 1.1; }
          .meta { font-size: 9.5px; font-weight: bold; text-align: right; line-height: 1.25; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="head">
            <span class="title">TEM ĐỊNH DANH KỆ KHO</span>
            <span class="loc">VỊ TRÍ: ${material.location || 'Kho Tổng'}</span>
          </div>
          <div class="middle">
            ${material.image ? `<img src="${material.image}" class="photo" alt="Photo" />` : ''}
            <div class="info">
              <div class="code">${material.code}</div>
              <div class="name">${material.name}</div>
              <div class="spec"><strong>Quy cách:</strong> ${specText}</div>
            </div>
          </div>
          <div class="foot">
            <div class="qr-part">
              <img src="${qrImgSrc}" alt="QR" />
              <div class="qr-txt">
                <div>QUÉT CAMERA</div>
                <div>XEM ẢNH THẬT</div>
              </div>
            </div>
            <div class="meta">
              <div>ĐVT: ${material.unit}</div>
              <div>ĐỊNH MỨC: ${material.minStock} - ${material.maxStock}</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleCheck = (key: string) => {
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecksPassed = checkedSteps.step1 && checkedSteps.step2 && checkedSteps.step3;

  // Placeholder fallback illustration when no image is uploaded
  const getCategoryColor = (cat: string) => {
    if (cat.includes('Dây') || cat.includes('cáp')) return 'from-amber-600/30 to-amber-900/10 border-amber-500/40 text-amber-300';
    if (cat.includes('đóng cắt') || cat.includes('Trung thế')) return 'from-red-600/30 to-red-900/10 border-red-500/40 text-red-300';
    if (cat.includes('chiếu sáng') || cat.includes('Đèn')) return 'from-yellow-600/30 to-yellow-900/10 border-yellow-500/40 text-yellow-300';
    if (cat.includes('Đường ống') || cat.includes('cấp thoát nước')) return 'from-cyan-600/30 to-cyan-900/10 border-cyan-500/40 text-cyan-300';
    if (cat.includes('vệ sinh')) return 'from-teal-600/30 to-teal-900/10 border-teal-500/40 text-teal-300';
    return 'from-blue-600/30 to-blue-900/10 border-blue-500/40 text-blue-300';
  };

  // Generate a mock barcode pattern SVG for print/preview
  const rawBarcode = material.barcode || material.code.replace(/[^A-Z0-9]/gi, '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Camera className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-md bg-blue-950/90 border border-blue-600/80 text-cyan-300 shadow-sm">
                  {material.code}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${brandInfo.color}`}>
                  HÃNG: {brandInfo.name.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  ĐVT: {material.unit}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-1 truncate max-w-lg" title={material.name}>
                {material.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyCode}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
              title="Sao chép mã"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Đã chép' : 'Chép mã'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Main 2-Column Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Sharp Image Viewer & Zoom Controls */}
            <div className="lg:col-span-6 space-y-3">
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
                {/* Photo Viewer Header Bar */}
                <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Eye className="w-4 h-4" />
                    <span>ẢNH THỰC TẾ TRONG KHO</span>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                      disabled={zoomLevel <= 1}
                      className="p-1 hover:text-white text-slate-400 disabled:opacity-30 transition"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[10px] text-slate-300 font-bold px-1 min-w-[28px] text-center">
                      {zoomLevel}x
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                      disabled={zoomLevel >= 3}
                      className="p-1 hover:text-white text-slate-400 disabled:opacity-30 transition"
                      title="Phóng to"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    {zoomLevel > 1 && (
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className="p-1 hover:text-cyan-400 text-slate-400 transition ml-0.5"
                        title="Đặt lại kích thước"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFullscreenImage(!isFullscreenImage)}
                      className="p-1 hover:text-amber-400 text-slate-400 transition ml-1"
                      title="Xem toàn màn hình"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Image Stage */}
                <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center overflow-hidden select-none group">
                  {material.image && !imageLoadError ? (
                    <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
                      <img
                        src={material.image}
                        alt={material.name}
                        referrerPolicy="no-referrer"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.2s ease-out',
                        }}
                        onError={() => setImageLoadError(true)}
                        className="max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl cursor-zoom-in"
                        onClick={() => setZoomLevel((z) => (z >= 2 ? 1 : z + 1))}
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500 shadow-inner">
                        <Package className="w-8 h-8 text-blue-400 opacity-60" />
                      </div>
                      <div>
                        <p className="text-slate-300 font-semibold text-xs">Chưa có ảnh thật trong hồ sơ</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                          Bạn có thể chụp ảnh trực tiếp tại kệ hoặc dán link ảnh trên Google Sheet.
                        </p>
                      </div>

                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? 'Đang lưu ảnh...' : 'Chụp Ảnh Vật Tư Tại Kệ'}</span>
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleUploadPhoto}
                          disabled={isUploadingPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Verification Watermark Badge */}
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-300 shadow-lg pointer-events-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Kho ĐNCT • Nhà Ga Quốc Tế T2</span>
                  </div>

                  {material.image && !imageLoadError && (
                    <div className="absolute top-2.5 right-2.5 bg-black/60 text-slate-400 text-[10px] px-2 py-0.5 rounded backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Nhấp để phóng to / Cuộn xem chi tiết
                    </div>
                  )}
                </div>

                {/* Quick Identification Tags underneath the photo */}
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vị trí kho: <strong className="text-white font-mono">{material.location || 'Kho Tổng ĐNCT'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Tồn kho hiện thời:</span>
                    <span className={`font-mono font-black text-xs ${isOut ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatNumber(currentStock)} {material.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barcode & QR Code Reference Card */}
              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-purple-400" />
                      Mã Vạch &amp; QR Định Danh Kệ (Google Sheet)
                    </div>
                    <div className="font-mono text-xs text-cyan-300 font-bold tracking-wider truncate">
                      {material.qrCode || `${material.name} | ${material.code}`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Barcode 1D: <strong className="text-slate-200">{material.barcode || rawBarcode}</strong>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Quét trực tiếp bằng camera điện thoại hoặc súng bắn mã vạch trên kệ kho
                    </p>
                  </div>

                  <div className="shrink-0 bg-white p-1.5 rounded-lg shadow-md flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                        typeof window !== 'undefined'
                          ? `${window.location.origin}/?scan=${encodeURIComponent(material.code)}`
                          : material.code
                      )}`}
                      alt="QR Code"
                      className="w-16 h-16 object-contain"
                    />
                    <span className="text-[8px] font-mono text-slate-800 mt-0.5 font-bold">QR QUÉT KỆ</span>
                  </div>
                </div>

                {/* Print Shelf Label Action */}
                <button
                  type="button"
                  onClick={handlePrintShelfLabel}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 hover:border-blue-500/50 transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>In Tem Nhãn Kệ Kho (Mã QR + Ảnh Thật + Quy Cách)</span>
                </button>
              </div>
            </div>

            {/* Right Column: Technical Dossier, Anti-Mix-up Rules & Verification */}
            <div className="lg:col-span-6 space-y-3.5">
              {/* CRITICAL ANTI-MIXUP WARNING BOX (Lợi ích thực tế chống nhầm bu lông, rơ-le, đầu cos) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/40 space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Đặc Điểm Nhận Diện Chống Lấy Nhầm</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {differentiators.length > 0 ? (
                    differentiators.map((diff, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                        <span>{diff}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-300 italic">
                      Đối chiếu quy cách kỹ thuật và nhãn in trên thân linh kiện với hình ảnh trước khi xuất.
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                  💡 <strong>Quy tắc an toàn:</strong> Nhân viên đi ca đêm hoặc người mới bắt buộc phải soi ảnh thật đối chiếu đúng đầu bu lông, số chân rơ-le hoặc ký hiệu cosse trước khi giao nhận.
                </p>
              </div>

              {/* Technical Specifications Dossier */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Quy Cách Kỹ Thuật &amp; Tiêu Chuẩn (Mô Tả Vật Tư):</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${brandInfo.color}`}>
                    {brandInfo.name}
                  </span>
                </div>
                <div className="text-slate-100 leading-relaxed text-xs sm:text-sm bg-slate-900 p-3 rounded-lg border border-slate-800 font-medium select-text">
                  {material.specification || material.name}
                </div>
              </div>

              {/* Stock Thresholds & Value */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-blue-400" />
                    Định Mức Min - Max
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-200">
                    <span className="text-amber-400 font-bold">{material.minStock}</span> / <span className="text-blue-400">{material.maxStock}</span> {material.unit}
                  </div>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Coins className="w-3 h-3 text-emerald-400" />
                    Đơn Giá Tiêu Chuẩn
                  </div>
                  <div className="mt-1 font-mono text-xs text-emerald-400 font-bold">
                    {formatVND(material.unitPrice)}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-purple-400" />
                    Tổng Giá Trị Tồn
                  </div>
                  <div className="mt-1 font-mono text-xs text-purple-300 font-bold">
                    {formatVND(currentStock * material.unitPrice)}
                  </div>
                </div>
              </div>

              {/* Interactive 3-Step Verification Checklist */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Checklist Đối Chiếu Thực Tế Trước Khi Giao/Nhận
                  </span>
                  {allChecksPassed && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      ✓ Đạt 100%
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <label
                    onClick={() => toggleCheck('step1')}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition text-xs ${
                      checkedSteps.step1
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkedSteps.step1}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                    />
                    <span>1. Nhìn ảnh thật: Hình dạng, chân cắm/đầu ốc trùng khớp mẫu trên màn hình</span>
                  </label>

                  <label
                    onClick={() => toggleCheck('step2')}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition text-xs ${
                      checkedSteps.step2
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkedSteps.step2}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                    />
                    <span>2. Đúng Hãng <strong>{brandInfo.name}</strong> &amp; đúng điện áp / kích thước</span>
                  </label>

                  <label
                    onClick={() => toggleCheck('step3')}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition text-xs ${
                      checkedSteps.step3
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkedSteps.step3}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                    />
                    <span>3. Đúng vị trí kệ <strong>{material.location || 'Kho Tổng'}</strong> &amp; mã <strong>{material.code}</strong></span>
                  </label>
                </div>
              </div>

              {/* Notes if any */}
              {material.notes && (
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-[11px] text-slate-300">
                  <strong className="text-amber-400">Ghi chú lưu kho:</strong> {material.notes}
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition text-xs font-semibold"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Đã sao chép mã' : 'Sao chép mã vật tư'}</span>
              </button>

              {onOpenStockCard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStockCard(material.code);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Mở Sổ Thẻ Kho</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onCreateExport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateExport(material.code);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white flex items-center gap-2 transition text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  <span>Tạo Phiếu Xuất Món Này</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreenImage && material.image && !imageLoadError && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 select-none animate-in fade-in"
          onClick={() => setIsFullscreenImage(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <span className="text-white text-xs font-mono font-bold bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
              {material.code} • {material.name}
            </span>
            <button
              onClick={() => setIsFullscreenImage(false)}
              className="p-2 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <img
            src={material.image}
            alt={material.name}
            referrerPolicy="no-referrer"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-slate-400 text-xs mt-3">Nhấp chuột ra ngoài hoặc bấm Đóng để quay lại</p>
        </div>
      )}
    </div>
  );
};
export { MaterialImageModal as VisualMaterialCardModal };
