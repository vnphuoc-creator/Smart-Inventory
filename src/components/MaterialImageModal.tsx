import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Copy,
  Hash,
  Coins,
  Warehouse,
  Boxes,
} from 'lucide-react';
import { Material, CalculatedMaterialStock } from '../types';
import { formatVND, formatNumber } from '../utils/inventoryEngine';

interface MaterialDetailModalProps {
  material: Material;
  calculatedStock?: CalculatedMaterialStock;
  isOpen: boolean;
  onClose: () => void;
  onOpenStockCard?: (materialCode: string) => void;
}

export const MaterialImageModal: React.FC<MaterialDetailModalProps> = ({
  material,
  calculatedStock,
  isOpen,
  onClose,
  onOpenStockCard,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !material) return null;

  const currentStock = calculatedStock?.currentStock ?? material.initialStock;
  const isLowStock = currentStock <= material.minStock;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(material.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes('Dây') || cat.includes('cáp')) return 'from-amber-600/30 to-amber-900/10 border-amber-500/40 text-amber-300';
    if (cat.includes('đóng cắt') || cat.includes('Trung thế')) return 'from-red-600/30 to-red-900/10 border-red-500/40 text-red-300';
    if (cat.includes('chiếu sáng') || cat.includes('Đèn')) return 'from-yellow-600/30 to-yellow-900/10 border-yellow-500/40 text-yellow-300';
    if (cat.includes('Đường ống') || cat.includes('cấp thoát nước')) return 'from-cyan-600/30 to-cyan-900/10 border-cyan-500/40 text-cyan-300';
    if (cat.includes('vệ sinh')) return 'from-teal-600/30 to-teal-900/10 border-teal-500/40 text-teal-300';
    return 'from-blue-600/30 to-blue-900/10 border-blue-500/40 text-blue-300';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-md text-xs bg-blue-950/90 border border-blue-600/80 text-cyan-300 shadow-sm">
                  {material.code}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  ĐVT: {material.unit}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">{material.name}</h3>
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Quick Technical Overview Box */}
          <div className={`p-4 rounded-xl border bg-gradient-to-br ${getCategoryColor(material.category)} flex items-start justify-between`}>
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold opacity-80">Nhóm Ngành Hàng</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {material.category}
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Vị trí lưu kho: <strong className="text-white">{material.location || 'Kho Tổng AHT'}</strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tình Trạng Tồn Kho</div>
              <div className={`text-base font-black font-mono mt-0.5 ${currentStock <= 0 ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatNumber(currentStock)} <span className="text-xs font-medium text-slate-300">{material.unit}</span>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Quy Cách Kỹ Thuật &amp; Tiêu Chuẩn Áp Dụng:</span>
            </div>
            <p className="text-slate-200 pl-6 leading-relaxed text-sm bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
              {material.specification || material.name}
            </p>
          </div>

          {/* Stock Metrics & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-blue-400" />
                Định Mức Tồn Kho
              </div>
              <div className="mt-1.5 space-y-1 text-slate-300 text-[11px]">
                <div>Tồn tối thiểu (Min): <strong className="text-amber-400 font-mono">{material.minStock}</strong> {material.unit}</div>
                <div>Tồn tối đa (Max): <strong className="text-blue-400 font-mono">{material.maxStock}</strong> {material.unit}</div>
              </div>
            </div>

            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                Đơn Giá Tiêu Chuẩn
              </div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                {formatVND(material.unitPrice)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Đơn giá hạch toán / {material.unit}
              </div>
            </div>

            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-purple-400" />
                Tổng Giá Trị Tồn
              </div>
              <div className="text-base font-bold font-mono text-purple-300 mt-1">
                {formatVND(currentStock * material.unitPrice)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tính theo tồn kho hiện thời
              </div>
            </div>
          </div>

          {/* Notes */}
          {material.notes && (
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50 text-[11px] text-slate-300">
              <strong className="text-amber-400">Ghi chú lưu kho:</strong> {material.notes}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors font-medium"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Đã sao chép mã vật tư' : 'Sao chép mã vật tư'}</span>
            </button>

            <div className="flex items-center gap-2">
              {onOpenStockCard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStockCard(material.code);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors font-semibold shadow-md shadow-blue-600/30"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Mở Sổ Thẻ Kho</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
