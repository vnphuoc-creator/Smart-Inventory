import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ZoomIn,
  Package,
  Layers,
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Link2,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { Material, CalculatedMaterialStock } from '../types';
import { formatVND, formatNumber } from '../utils/inventoryEngine';
import {
  getMaterialVisualDossier,
  resolveMaterialImageUrl,
  generateTechnicalSchematicSvg,
} from '../utils/materialImageResolver';

interface MaterialImageModalProps {
  material: Material;
  calculatedStock?: CalculatedMaterialStock;
  isOpen: boolean;
  onClose: () => void;
  onUpdateImage?: (materialId: string, newImageUrl: string) => void;
  onOpenStockCard?: (materialCode: string) => void;
}

export const MaterialImageModal: React.FC<MaterialImageModalProps> = ({
  material,
  calculatedStock,
  isOpen,
  onClose,
  onUpdateImage,
  onOpenStockCard,
}) => {
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customUrl, setCustomUrl] = useState(material.image || '');
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !material) return null;

  const dossier = getMaterialVisualDossier(material);
  const displayImage = imgError
    ? generateTechnicalSchematicSvg(
        material.code,
        material.name,
        material.category,
        material.specification
      )
    : customUrl.trim()
    ? customUrl.trim()
    : dossier.imageUrl;

  const currentStock = calculatedStock?.currentStock ?? material.initialStock;

  const handleSaveImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateImage) {
      onUpdateImage(material.id, customUrl.trim());
    }
    setIsEditingUrl(false);
    setImgError(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(material.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold px-2.5 py-1 rounded-lg text-xs bg-blue-950/90 border border-blue-600/80 text-cyan-300 shadow-sm">
              {material.code}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{material.name}</h3>
              <p className="text-[11px] text-slate-400">
                Hồ Sơ Kỹ Thuật &amp; Hình Ảnh Chính Thống Chuẩn MEP AHT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Big Image Display & Controls (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group shadow-inner">
              <img
                src={displayImage}
                alt={material.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              {/* Badges on Top of Image */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${dossier.badgeColor}`}>
                  {dossier.brand}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 border border-slate-700 text-slate-300 font-mono">
                  {material.unit}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-slate-200 text-[11px]">
                <div className="font-semibold text-white truncate">{material.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{material.specification}</div>
              </div>
            </div>

            {/* Quick Actions & Image URL Management */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors text-[11px]"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép mã' : 'Sao chép mã'}</span>
                </button>

                {onOpenStockCard && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStockCard(material.code);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 text-blue-300 flex items-center gap-1.5 transition-colors text-[11px]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Xem Sổ Thẻ Kho</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors text-[11px]"
              >
                <Link2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{isEditingUrl ? 'Đóng chỉnh link' : 'Tùy chỉnh link ảnh'}</span>
              </button>
            </div>

            {/* Edit Image URL Form */}
            {isEditingUrl && (
              <form onSubmit={handleSaveImage} className="p-3 bg-slate-850 rounded-xl border border-slate-700 space-y-2 animate-in fade-in">
                <label className="block text-[11px] font-medium text-slate-300">
                  Nhập link ảnh chính hãng (URL trực tiếp):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shrink-0"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Complete Technical Dossier & Stock Metrics (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Category & Location Box */}
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-slate-200">Nhóm Ngành Hàng:</span>
                </div>
                <div className="text-white font-medium pl-6">{material.category}</div>

                <div className="flex items-center gap-2 text-slate-400 pt-2 border-t border-slate-800/80">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Vị Trí Lưu Kho:</span>
                </div>
                <div className="text-white font-medium pl-6">{material.location || 'Kho Tổng AHT'}</div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">Quy Cách &amp; Tiêu Chuẩn:</span>
                </div>
                <p className="text-slate-300 pl-6 leading-relaxed">
                  {material.specification || 'Vật tư tiêu chuẩn theo danh mục trang bị kỹ thuật sân bay.'}
                </p>
                <div className="pl-6 pt-1 text-[11px] text-slate-400">
                  Tiêu chuẩn sản xuất: <strong className="text-slate-200">{dossier.technicalStandard}</strong>
                </div>
              </div>

              {/* Stock Status & Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tồn Kho Hiện Tại</div>
                  <div className={`text-lg font-black font-mono mt-1 ${currentStock <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatNumber(currentStock)} <span className="text-xs font-normal text-slate-300">{material.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Định mức an toàn: <strong>{material.minStock}</strong> {material.unit}
                  </div>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Đơn Giá Tiêu Chuẩn</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    {formatVND(material.unitPrice)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Tổng giá trị: <strong>{formatVND(currentStock * material.unitPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* Highlights & Notes */}
              {material.notes && (
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-[11px] text-slate-300">
                  <strong className="text-amber-400">Lưu ý kho:</strong> {material.notes}
                </div>
              )}
            </div>

            {/* Print Tag / QR Helper */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Đội Điện Nước Công Trình AHT</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>In Thẻ Kỹ Thuật</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
