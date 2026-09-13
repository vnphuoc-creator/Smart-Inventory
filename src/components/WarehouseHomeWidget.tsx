import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Layers,
  Search,
  Printer,
  QrCode,
  Sparkles,
  ArrowRight,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  Maximize2,
  ChevronRight,
  Lightbulb,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  WarehouseShelfEntity,
  WarehouseCompartment,
  ShelfTierInfo,
  Material,
  CalculatedMaterialStock,
  User,
} from '../types';

interface WarehouseHomeWidgetProps {
  entities: WarehouseShelfEntity[];
  materials: Material[];
  calculatedStocks?: Record<string, CalculatedMaterialStock> | CalculatedMaterialStock[];
  currentUser?: User | null;
  onOpenMasterEditor?: () => void;
  onOpenPrintModal?: (shelfId?: string, compId?: string) => void;
  onOpenFullMap?: () => void;
  onQuickTransaction?: (type: 'IN' | 'OUT', materialCode: string, compId?: string) => void;
}

export const WarehouseHomeWidget: React.FC<WarehouseHomeWidgetProps> = ({
  entities,
  materials,
  calculatedStocks,
  currentUser,
  onOpenMasterEditor,
  onOpenPrintModal,
  onOpenFullMap,
  onQuickTransaction,
}) => {
  // Check if current user is Master Admin
  const isMasterAdmin =
    currentUser?.email === 'vn.phuoc235@gmail.com' ||
    currentUser?.role === 'ADMIN' ||
    (currentUser?.email || '').toLowerCase().includes('phuoc');

  // Currently selected shelf (Defaults to KE-01 or first material shelf)
  const [selectedShelfId, setSelectedShelfId] = useState<string>(() => {
    return entities.find((e) => e.type === 'SHELF_4_TIER')?.id || entities[0]?.id || 'KE-01';
  });

  // Currently focused tier (Tầng 1 đặt ở trên cùng: nóc kệ tận dụng chứa vật tư, Tầng 5 mâm đáy)
  const [hoveredTierNum, setHoveredTierNum] = useState<number>(1);

  // Currently focused compartment
  const [focusedCompId, setFocusedCompId] = useState<string>('KE-01-T1-KH01');

  // Search query within the warehouse
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generated QR data URL for focused compartment
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Advice expand/collapse
  const [showAdvice, setShowAdvice] = useState<boolean>(false);

  // Normalize calculatedStocks
  const stockMap = useMemo(() => {
    const map = new Map<string, CalculatedMaterialStock>();
    if (!calculatedStocks) return map;
    if (Array.isArray(calculatedStocks)) {
      calculatedStocks.forEach((item) => {
        if (item && item.code) {
          map.set(item.code.trim().toUpperCase(), item);
        }
      });
    } else if (typeof calculatedStocks === 'object') {
      Object.values(calculatedStocks).forEach((item) => {
        if (item && item.code) {
          map.set(item.code.trim().toUpperCase(), item);
        }
      });
    }
    return map;
  }, [calculatedStocks]);

  // Active shelf entity
  const activeShelf = entities.find((e) => e.id === selectedShelfId) || entities[0];

  // Only show material shelves (KE-01 to KE-05). Tủ đồ nghề are excluded as requested.
  const mainShelves = entities.filter(
    (e) => e.type === 'SHELF_4_TIER' || (e.code && e.code.startsWith('KE-'))
  );

  // Find active tier and compartment
  const tiers = activeShelf?.tiers || [];
  const activeTier = tiers.find((t) => t.tierNumber === hoveredTierNum) || tiers[0];

  // All compartments in current shelf
  const allShelfComps = useMemo(() => {
    const comps: { tier: ShelfTierInfo; comp: WarehouseCompartment }[] = [];
    tiers.forEach((t) => {
      (t.compartments || []).forEach((c) => {
        comps.push({ tier: t, comp: c });
      });
    });
    return comps;
  }, [tiers]);

  // Active focused compartment
  const activeComp = useMemo(() => {
    if (!focusedCompId) return allShelfComps[0]?.comp;
    const found = allShelfComps.find((item) => item.comp.id === focusedCompId);
    return found?.comp || allShelfComps[0]?.comp;
  }, [focusedCompId, allShelfComps]);

  // Keep focusedCompId in sync when switching shelf
  useEffect(() => {
    if (allShelfComps.length > 0 && !allShelfComps.some((item) => item.comp.id === focusedCompId)) {
      setFocusedCompId(allShelfComps[0].comp.id);
      setHoveredTierNum(allShelfComps[0].tier.tierNumber);
    }
  }, [selectedShelfId, allShelfComps]);

  // Generate QR Code for the focused compartment
  useEffect(() => {
    let isCancelled = false;
    async function generateQR() {
      if (!activeComp) return;
      const qrVal = activeComp.qrCodeValue || `DNCT-WH-${activeComp.id}`;
      try {
        const url = await QRCode.toDataURL(qrVal, {
          width: 220,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (!isCancelled) {
          setQrDataUrl(url);
        }
      } catch (e) {
        console.error('Error generating QR:', e);
      }
    }
    generateQR();
    return () => {
      isCancelled = true;
    };
  }, [activeComp]);

  // Materials assigned or matching the focused compartment
  const compMaterials = useMemo(() => {
    if (!activeComp) return [];

    // 1. Direct assignment
    if (activeComp.assignedMaterialCodes && activeComp.assignedMaterialCodes.length > 0) {
      return activeComp.assignedMaterialCodes
        .map((code) => materials.find((m) => m.code === code))
        .filter(Boolean) as Material[];
    }

    // 2. Keyword fallback matching
    const keywords = [
      ...(activeComp.itemKeywords || []),
      ...(activeTier?.itemKeywords || []),
    ].map((k) => k.toLowerCase().trim());

    if (keywords.length === 0) return [];

    return materials
      .filter((mat) => {
        const name = (mat.name || '').toLowerCase();
        const spec = (mat.specification || '').toLowerCase();
        const cat = (mat.category || '').toLowerCase();
        return keywords.some(
          (kw) => name.includes(kw) || spec.includes(kw) || cat.includes(kw)
        );
      })
      .slice(0, 8);
  }, [activeComp, activeTier, materials]);

  // Search matches across all shelves
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const hits: { shelf: WarehouseShelfEntity; tierNum: number; comp: WarehouseCompartment }[] = [];

    entities.forEach((ent) => {
      (ent.tiers || []).forEach((t) => {
        (t.compartments || []).forEach((comp) => {
          const compMatch =
            comp.name.toLowerCase().includes(q) ||
            comp.code.toLowerCase().includes(q) ||
            (comp.description && comp.description.toLowerCase().includes(q));

          const hasAssignedMatch = (comp.assignedMaterialCodes || []).some((c) => {
            const m = materials.find((mat) => mat.code === c);
            return (
              c.toLowerCase().includes(q) ||
              (m && (m.name.toLowerCase().includes(q) || (m.specification && m.specification.toLowerCase().includes(q))))
            );
          });

          if (compMatch || hasAssignedMatch) {
            hits.push({ shelf: ent, tierNum: t.tierNumber, comp });
          }
        });
      });
    });

    return hits.slice(0, 6);
  }, [searchQuery, entities, materials]);

  return (
    <div className="w-full bg-slate-900 border border-slate-750 rounded-2xl shadow-xl overflow-hidden text-slate-100 mb-8 transition-all">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-750">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Airport Facility Badge */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Boxes className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Sơ Đồ Phòng Kỹ Thuật &amp; Hệ Thống Kệ Vật Tư 4 Tầng
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Đang vận hành • Chuẩn 5S T2
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Nhà Ga Quốc Tế T2 • 2 Tủ Đồ Nghề Kỹ Thuật • 5 Kệ Vật Tư 4 Tầng • Phân chia chi tiết từng Khay / Ngăn
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Master Layout Edit Button */}
            {isMasterAdmin && onOpenMasterEditor && (
              <button
                type="button"
                onClick={onOpenMasterEditor}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 rounded-xl transition shadow"
                title="Chỉnh sửa chi tiết kích thước, khay/ngăn của các kệ"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Chỉnh Sửa Layout (Master)</span>
              </button>
            )}

            {/* Print QR Labels Button */}
            {onOpenPrintModal && (
              <button
                type="button"
                onClick={() => onOpenPrintModal(selectedShelfId, activeComp?.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-650 rounded-xl transition shadow"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>In Tem Mã QR</span>
              </button>
            )}

            {/* Open Full CAD/3D Map */}
            {onOpenFullMap && (
              <button
                type="button"
                onClick={onOpenFullMap}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Bản Vẽ Toàn Phòng</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Search & Filter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh vị trí vật tư (MCB, CADIVI, Omron, Lavabo, Keo Silicon...)"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvice((prev) => !prev)}
            className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 transition shrink-0"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showAdvice ? 'Ẩn kinh nghiệm vận hành' : 'Gợi ý vận hành không nhầm lẫn'}</span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 p-2 bg-slate-800 border border-slate-700 rounded-xl space-y-1 animate-fadeIn">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider">
              Kết quả định vị ({searchResults.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
              {searchResults.map((hit) => (
                <button
                  key={hit.comp.id}
                  type="button"
                  onClick={() => {
                    setSelectedShelfId(hit.shelf.id);
                    setHoveredTierNum(hit.tierNum);
                    setFocusedCompId(hit.comp.id);
                    setSearchQuery('');
                  }}
                  className="text-left p-2 rounded-lg bg-slate-900/80 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 transition"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span>{hit.shelf.name}</span>
                    <span>Tầng {hit.tierNum} • {hit.comp.code}</span>
                  </div>
                  <div className="text-xs text-white font-medium truncate mt-0.5">
                    {hit.comp.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Best Practice Advice Drawer */}
        {showAdvice && (
          <div className="mt-3 p-4 bg-slate-800/90 border border-amber-500/30 rounded-xl text-xs space-y-2 text-slate-300 animate-fadeIn">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Lightbulb className="w-4 h-4" />
              <span>4 Gợi Ý Vận Hành Kho Thông Minh Chuẩn 5S Tránh Bỏ Sót &amp; Nhầm Lẫn</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
                <strong className="text-blue-300 block mb-1">1. Quét QR Kép (Double-Check)</strong>
                Dán mã QR lên từng khay. Nhân viên khi lấy/cất hàng bắt buộc quét mã QR trên khay, hệ thống tự động khóa đúng mã vật tư, loại trừ 100% rủi ro nhầm lẫn.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
                <strong className="text-emerald-300 block mb-1">2. Màu Sắc 5S Trực Quan</strong>
                Khay nhựa xanh đựng MCB/CB, Hộp quai đỏ đựng Rơ-le/Linh kiện nhỏ, Cuộn tròn đựng CADIVI, Thùng carton cho nguồn và nắp bồn tiểu.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
                <strong className="text-amber-300 block mb-1">3. Kiểm Kê Cuốn Chiếu</strong>
                Không cần dừng kho để kiểm kê toàn bộ. Hằng ngày nhân viên chỉ cần quét 2-3 khay trên điện thoại và xác nhận số lượng thực tế trong 30 giây.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
                <strong className="text-purple-300 block mb-1">4. Cảnh Báo Tồn An Toàn</strong>
                Hệ thống tự động phát hiện số lượng tồn trong khay dưới định mức tối thiểu và gợi ý lập phiếu đề xuất vật tư mua sắm ngay lập tức.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shelf Selection Carousel / Tabs */}
      <div className="p-3 sm:px-6 sm:py-3 bg-slate-850/70 border-b border-slate-750 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1 flex items-center space-x-1">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Chọn Kệ:</span>
        </span>
        {mainShelves.map((shelf) => {
          const isSelected = shelf.id === selectedShelfId;
          const compCount = (shelf.tiers || []).reduce(
            (acc, t) => acc + (t.compartments?.length || 0),
            0
          );
          return (
            <button
              key={shelf.id}
              type="button"
              onClick={() => {
                setSelectedShelfId(shelf.id);
                setHoveredTierNum(1);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
              }`}
            >
              <span>{shelf.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-blue-800 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {compCount} Khay
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Main Layout: Left = 5 Tiers & Trays, Right = Enlarged Position Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-750">
        {/* Left Column: 5 Tiers (Tầng 1 Nóc trên cùng -> Tầng 5 Mâm đáy) and their Compartments (7 Cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mặt Đứng: {activeShelf.name}
              </span>
              <span className="text-[11px] text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                5 Tầng Chuẩn 5S (Tầng 1 Nóc Trên Cùng)
              </span>
            </div>
            <span className="text-[11px] text-blue-400 font-medium">
              Lướt chuột hoặc chạm vào khay để xem to rõ
            </span>
          </div>

          {/* 5 Tiers Stacked in Top-Down Order: Tầng 1 (Nóc) -> Tầng 5 (Mâm Đáy) */}
          <div className="space-y-3">
            {tiers
              .slice()
              .sort((a, b) => a.tierNumber - b.tierNumber)
              .map((tier) => {
                const tierNum = tier.tierNumber;
                const isTierHovered = hoveredTierNum === tierNum;
                const comps = tier.compartments || [];
                const isRoofTop = tierNum === 1;
                const isFloorBottom = tierNum === tiers.length;

                return (
                  <div
                    key={tierNum}
                    onMouseEnter={() => setHoveredTierNum(tierNum)}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isTierHovered
                        ? 'bg-slate-850 border-blue-500/60 shadow-lg ring-1 ring-blue-500/20'
                        : isRoofTop
                        ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Tier Label & Category */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                            isRoofTop
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {tier.label}
                        </span>
                        {isRoofTop && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-600/30">
                            🌟 Nóc Trên Cùng (Tận Dụng Chứa Vật Tư)
                          </span>
                        )}
                        {isFloorBottom && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Mâm Đáy Sát Sàn
                          </span>
                        )}
                        <span className="text-xs text-slate-300 font-medium truncate max-w-sm hidden sm:inline">
                          {tier.categoryDesc}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {comps.length} Khay chứa
                      </span>
                    </div>

                    {/* Compartments inside Tier */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {comps.map((comp) => {
                        const isFocused = focusedCompId === comp.id;
                        return (
                          <div
                            key={comp.id}
                            onMouseEnter={() => {
                              setHoveredTierNum(tierNum);
                              setFocusedCompId(comp.id);
                            }}
                            onClick={() => {
                              setHoveredTierNum(tierNum);
                              setFocusedCompId(comp.id);
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isFocused
                                ? 'bg-blue-600/25 border-amber-400 shadow-md ring-2 ring-amber-400/40 text-white scale-[1.02]'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                  isFocused
                                    ? 'bg-amber-400 text-slate-950 font-black'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {comp.code}
                              </span>
                              <span className="text-xs">
                                {comp.visualType === 'blue-bins'
                                  ? '🟦'
                                  : comp.visualType === 'clear-boxes'
                                  ? '📦'
                                  : comp.visualType === 'cadivi-coils'
                                  ? '🟡'
                                  : comp.visualType === 'tool-case'
                                  ? '🧰'
                                  : '🟫'}
                              </span>
                            </div>

                            <div className="text-xs font-semibold line-clamp-2 leading-tight">
                              {comp.name}
                            </div>

                            <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                              <span>{comp.assignedMaterialCodes?.length || 0} Mã VT</span>
                              <ChevronRight className="w-3 h-3 text-slate-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Enlarged Position Dossier (Xem To Rõ Ràng) (5 Cols) */}
        <div className="lg:col-span-5 p-4 sm:p-6 bg-slate-900/90 flex flex-col justify-between space-y-4">
          {activeComp ? (
            <div className="space-y-4">
              {/* Position Header Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-850 border border-blue-500/40 shadow-inner">
                <div className="flex items-center justify-between text-xs text-blue-300 font-bold mb-1">
                  <span>VỊ TRÍ ĐỊNH DANH 5S</span>
                  <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                    {activeComp.qrCodeValue || `DNCT-WH-${activeShelf.code}-T${hoveredTierNum}-${activeComp.code}`}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  {activeShelf.name} • TẦNG {hoveredTierNum} • {activeComp.name}
                </h3>
                {activeComp.description && (
                  <p className="text-xs text-slate-300 mt-1 italic">
                    {activeComp.description}
                  </p>
                )}
              </div>

              {/* QR Code & Position Specification Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center space-x-4">
                {/* QR Code Image */}
                <div className="shrink-0 flex flex-col items-center bg-white p-2 rounded-xl border border-slate-700 shadow-md">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={activeComp.qrCodeValue || activeComp.id}
                      className="w-24 h-24 sm:w-28 sm:h-28"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-slate-400">
                      <QrCode className="w-10 h-10 animate-pulse" />
                    </div>
                  )}
                  <span className="text-[9px] font-mono font-bold text-slate-800 mt-1 text-center max-w-[130px] break-all leading-tight">
                    {activeComp.qrCodeValue || `DNCT-WH-${activeShelf.code}-T${hoveredTierNum}-${activeComp.code}`}
                  </span>
                </div>

                {/* Details & Direct Print Button */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-xs">
                    <span className="text-slate-400 block">Kiểu khay chứa:</span>
                    <span className="font-semibold text-white">
                      {activeComp.visualType === 'blue-bins'
                        ? '🟦 Khay nhựa xanh chia ngăn chuyên dụng'
                        : activeComp.visualType === 'clear-boxes'
                        ? '📦 Hộp nhựa quai đỏ nắp gài kín bụi'
                        : activeComp.visualType === 'cadivi-coils'
                        ? '🟡 Ngăn cuộn cáp & dây điện CADIVI'
                        : activeComp.visualType === 'tool-case'
                        ? '🧰 Hộp đồ nghề kỹ thuật 1000V'
                        : '🟫 Thùng carton linh kiện'}
                    </span>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400 block">Quy chuẩn kệ:</span>
                    <span className="font-semibold text-slate-200">
                      Chuẩn 5S T2 • Tầng {hoveredTierNum}
                    </span>
                  </div>

                  {onOpenPrintModal && (
                    <button
                      type="button"
                      onClick={() => onOpenPrintModal(selectedShelfId, activeComp.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>In Tem Mã QR Khay Này</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real Materials Inside this Compartment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide">
                    Vật Tư Thực Tế Đang Lưu Trữ Tại Khay:
                  </span>
                  <span className="text-slate-400">
                    {compMaterials.length} mã vật tư
                  </span>
                </div>

                {compMaterials.length === 0 ? (
                  <div className="p-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                    Chưa gán vật tư cụ thể vào khay này.
                    {isMasterAdmin && onOpenMasterEditor && (
                      <button
                        type="button"
                        onClick={onOpenMasterEditor}
                        className="block mx-auto mt-2 text-amber-400 hover:underline font-semibold"
                      >
                        + Bấm vào đây để gán vật tư vào khay (Quyền Master)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {compMaterials.map((mat) => {
                      const calculated = stockMap.get(mat.code.toUpperCase());
                      const currentStock = calculated ? calculated.currentStock : mat.initialStock ?? 0;
                      const isLow = currentStock <= (mat.minStock || 0) && (mat.minStock || 0) > 0;
                      const isOut = currentStock <= 0;

                      return (
                        <div
                          key={mat.code}
                          className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-amber-400">
                                {mat.code}
                              </span>
                              <span className="text-xs font-semibold text-white truncate">
                                {mat.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {mat.specification || 'Không có quy cách'} • ĐVT: {mat.unit}
                            </div>
                          </div>

                          {/* Live Stock & Quick Action Buttons */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <div className="text-right">
                              <div
                                className={`text-xs font-bold ${
                                  isOut
                                    ? 'text-rose-400'
                                    : isLow
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {currentStock} {mat.unit}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {isOut ? 'Hết hàng' : isLow ? 'Dưới định mức' : 'Đủ tồn'}
                              </div>
                            </div>

                            {onQuickTransaction && (
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => onQuickTransaction('IN', mat.code, activeComp.id)}
                                  className="p-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition"
                                  title="Nhập kho vật tư vào khay này"
                                >
                                  <ArrowDownToLine className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onQuickTransaction('OUT', mat.code, activeComp.id)}
                                  className="p-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white transition"
                                  title="Xuất kho vật tư từ khay này"
                                >
                                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <Info className="w-8 h-8 mb-2 text-slate-600" />
              <p className="text-xs">Chọn hoặc lướt qua một khay bất kỳ để xem thông tin chi tiết.</p>
            </div>
          )}

          {/* Quick Footer Metric */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Kệ: <strong>{activeShelf.code}</strong> • {activeShelf.dimensions.levels} Tầng
            </span>
            <span className="font-mono text-emerald-400">ĐỘI ĐNCT • NHÀ GA T2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
