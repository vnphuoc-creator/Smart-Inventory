import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers,
  Search,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Info,
  Package,
  QrCode,
  Zap,
  BatteryCharging,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Compass,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Tag,
  Wrench,
  Boxes,
  Eye,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Material, CalculatedMaterialStock, WarehouseShelfEntity, User, ShelfTierInfo } from '../types';
import { DEFAULT_WAREHOUSE_ENTITIES } from '../data/warehouseLayoutData';
import { formatNumber } from '../utils/inventoryEngine';
import { resolveMaterialWarehouseLocation } from '../utils/warehouseLocationHelper';

interface WarehouseMapViewProps {
  materials: Material[];
  calculatedStocks: { [materialCode: string]: CalculatedMaterialStock } | CalculatedMaterialStock[];
  onSelectMaterial: (material: Material) => void;
  onUpdateMaterialLocation?: (materialCode: string, newLocation: string) => Promise<void> | void;
  entities?: WarehouseShelfEntity[];
  currentUser?: User | null;
  onOpenMasterEditor?: () => void;
  onOpenPrintModal?: (shelfId?: string, compId?: string) => void;
}

// Note: Shelf entities and layout are centrally defined in warehouseLayoutData.ts and synchronized via Firestore

export const WarehouseMapView: React.FC<WarehouseMapViewProps> = ({
  materials,
  calculatedStocks,
  onSelectMaterial,
  onUpdateMaterialLocation,
  entities: propEntities,
  currentUser,
  onOpenMasterEditor,
  onOpenPrintModal,
}) => {
  const WAREHOUSE_ENTITIES = propEntities && propEntities.length > 0 ? propEntities : DEFAULT_WAREHOUSE_ENTITIES;
  const isMasterAdmin =
    currentUser?.email === 'vn.phuoc235@gmail.com' ||
    currentUser?.role === 'ADMIN' ||
    (currentUser?.email || '').toLowerCase().includes('phuoc');
  // State management
  const [selectedEntityId, setSelectedEntityId] = useState<string>('KE-01'); // Default to Shelf 1
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedCompartmentId, setSelectedCompartmentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2D_MAP' | 'FRONT_ELEVATION' | 'ISOMETRIC_3D'>('2D_MAP');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SHELVES' | 'TOOL_CABINETS' | 'ELECTRICAL_UPS' | 'LOW_STOCK'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLocationAssignModal, setShowLocationAssignModal] = useState(false);
  const [materialToAssign, setMaterialToAssign] = useState<Material | null>(null);
  const [targetLocationString, setTargetLocationString] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // 3D Camera Controls State
  const [pitch3D, setPitch3D] = useState<number>(55);
  const [yaw3D, setYaw3D] = useState<number>(45);
  const [zoom3D, setZoom3D] = useState<number>(0.85);
  const [isAutoRotating3D, setIsAutoRotating3D] = useState<boolean>(false);
  const [hoveredEntity3D, setHoveredEntity3D] = useState<string | null>(null);
  const isDragging3DRef = useRef(false);
  const dragStart3DRef = useRef<{ x: number; y: number; yaw: number; pitch: number }>({ x: 0, y: 0, yaw: 45, pitch: 55 });

  useEffect(() => {
    if (!isAutoRotating3D || viewMode !== 'ISOMETRIC_3D') return;
    const interval = setInterval(() => {
      setYaw3D((prev) => (prev + 0.4) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating3D, viewMode]);

  const handle3DMouseDown = (e: React.MouseEvent) => {
    isDragging3DRef.current = true;
    dragStart3DRef.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: yaw3D,
      pitch: pitch3D,
    };
  };

  const handle3DMouseMove = (e: React.MouseEvent) => {
    if (!isDragging3DRef.current) return;
    const deltaX = e.clientX - dragStart3DRef.current.x;
    const deltaY = e.clientY - dragStart3DRef.current.y;
    setYaw3D((dragStart3DRef.current.yaw + deltaX * 0.4) % 360);
    setPitch3D(Math.max(15, Math.min(85, dragStart3DRef.current.pitch + deltaY * 0.35)));
  };

  const handle3DMouseUp = () => {
    isDragging3DRef.current = false;
  };

  const handle3DTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging3DRef.current = true;
      dragStart3DRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        yaw: yaw3D,
        pitch: pitch3D,
      };
    }
  };

  const handle3DTouchMove = (e: React.TouchEvent) => {
    if (!isDragging3DRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart3DRef.current.x;
    const deltaY = e.touches[0].clientY - dragStart3DRef.current.y;
    setYaw3D((dragStart3DRef.current.yaw + deltaX * 0.4) % 360);
    setPitch3D(Math.max(15, Math.min(85, dragStart3DRef.current.pitch + deltaY * 0.35)));
  };

  // Normalized stock map (handling array or record)
  const stockMap = useMemo(() => {
    if (Array.isArray(calculatedStocks)) {
      const map: { [code: string]: CalculatedMaterialStock } = {};
      calculatedStocks.forEach((cs) => {
        if (cs && cs.code) {
          map[cs.code] = cs;
        }
      });
      return map;
    }
    return (calculatedStocks as { [code: string]: CalculatedMaterialStock }) || {};
  }, [calculatedStocks]);

  // Active selected entity
  const activeEntity = useMemo(() => {
    return WAREHOUSE_ENTITIES.find((e) => e.id === selectedEntityId) || WAREHOUSE_ENTITIES[0];
  }, [selectedEntityId, WAREHOUSE_ENTITIES]);

  // Strict Material Mapping Algorithm: Only display materials explicitly assigned to shelf/tray
  const entityMaterialsMap = useMemo(() => {
    const map: { [entityId: string]: Material[] } = {};
    WAREHOUSE_ENTITIES.forEach((e) => {
      map[e.id] = [];
    });

    // Direct assignments from entity compartments (Master Layout & Shelf Data)
    WAREHOUSE_ENTITIES.forEach((ent) => {
      (ent.tiers || []).forEach((tier) => {
        (tier.compartments || []).forEach((comp) => {
          (comp.assignedMaterialCodes || []).forEach((code) => {
            const foundMat = materials.find((m) => m.code === code);
            if (foundMat && map[ent.id] && !map[ent.id].some((m) => m.id === foundMat.id)) {
              map[ent.id].push(foundMat);
            }
          });
        });
      });
    });

    return map;
  }, [materials, WAREHOUSE_ENTITIES]);

  // Filter materials for active entity
  const activeMaterials = useMemo(() => {
    let list = entityMaterialsMap[activeEntity.id] || [];

    if (selectedCompartmentId && activeEntity.tiers) {
      let targetCodes: string[] = [];
      activeEntity.tiers.forEach((t) => {
        (t.compartments || []).forEach((c) => {
          if (c.id === selectedCompartmentId || c.code === selectedCompartmentId) {
            targetCodes = c.assignedMaterialCodes || [];
          }
        });
      });
      const codeSet = new Set(targetCodes);
      list = list.filter((m) => codeSet.has(m.code));
    } else if (selectedTier !== null && activeEntity.tiers) {
      const tierInfo = activeEntity.tiers.find((t) => t.tierNumber === selectedTier);
      if (tierInfo) {
        const compMaterialCodes = new Set<string>();
        (tierInfo.compartments || []).forEach((c) => {
          (c.assignedMaterialCodes || []).forEach((code) => compMaterialCodes.add(code));
        });

        list = list.filter((m) => compMaterialCodes.has(m.code));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.specification.toLowerCase().includes(q) ||
          (m.brand && m.brand.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entityMaterialsMap, activeEntity, selectedTier, selectedCompartmentId, searchQuery]);

  // Entities highlighted by search query
  const matchedEntityIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    const matched = new Set<string>();

    WAREHOUSE_ENTITIES.forEach((ent) => {
      // Check entity name or notes
      if (
        ent.name.toLowerCase().includes(q) ||
        ent.categoryLabel.toLowerCase().includes(q) ||
        ent.description.toLowerCase().includes(q)
      ) {
        matched.add(ent.id);
      }

      // Check materials inside this entity
      const mats = entityMaterialsMap[ent.id] || [];
      const hasMat = mats.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.specification.toLowerCase().includes(q) ||
          (m.brand && m.brand.toLowerCase().includes(q))
      );
      if (hasMat) matched.add(ent.id);
    });

    return matched;
  }, [searchQuery, entityMaterialsMap]);

  // Quick statistics
  const totalShelvesCount = 5; // Kệ 1 -> Kệ 5
  const totalToolCabinetsCount = 2; // Tủ đồ nghề 1 & 2
  const totalAssignedMaterials = Object.values(entityMaterialsMap).reduce((acc, curr) => acc + curr.length, 0);

  // Handle location update assignment
  const handleAssignLocation = async () => {
    if (!materialToAssign || !targetLocationString.trim() || !onUpdateMaterialLocation) return;
    setIsAssigning(true);
    try {
      await onUpdateMaterialLocation(materialToAssign.code, targetLocationString.trim());
      setShowLocationAssignModal(false);
      setMaterialToAssign(null);
      setTargetLocationString('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Print shelf label
  const handlePrintShelfLabel = (entity: WarehouseShelfEntity) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      typeof window !== 'undefined'
        ? `${window.location.origin}/?scan=${encodeURIComponent(entity.code)}`
        : entity.code
    )}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tem Nhãn Kệ Kho - ${entity.name}</title>
          <style>
            @page { size: 100mm 75mm landscape; margin: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 10mm; background: #fff; color: #000; }
            .label-card { border: 2.5px solid #0f172a; border-radius: 8px; padding: 12px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
            .title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
            .sub { font-size: 10px; color: #475569; font-weight: 600; }
            .content { display: flex; gap: 14px; align-items: center; margin: 10px 0; }
            .qr-box { flex-shrink: 0; text-align: center; }
            .qr-box img { width: 90px; height: 90px; }
            .info { flex-grow: 1; }
            .entity-code { font-size: 24px; font-weight: 900; font-family: monospace; color: #1d4ed8; letter-spacing: 1px; }
            .dim { font-size: 11px; color: #334155; margin-top: 4px; font-weight: 600; }
            .footer { border-top: 1px dashed #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <div>
                <div class="title">CẢNG HKQT ĐÀ NẴNG - ĐỘI ĐNCT</div>
                <div class="sub">PHÒNG KỸ THUẬT ĐIỆN & KHO VẬT TƯ NHÀ GA T2</div>
              </div>
              <div style="font-size: 10px; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">QUẢN LÝ 5S</div>
            </div>
            <div class="content">
              <div class="qr-box">
                <img src="${qrUrl}" alt="QR" />
                <div style="font-size: 8px; font-weight: bold; margin-top: 2px;">QUÉT ĐỊNH DANH KỆ</div>
              </div>
              <div class="info">
                <div class="entity-code">${entity.code}</div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${entity.name}</div>
                <div class="dim">Kệ 4 Tầng Tiêu Chuẩn 5S</div>
                <div style="font-size: 10px; color: #475569; margin-top: 4px;">Phân loại: <strong>${entity.categoryLabel}</strong></div>
              </div>
            </div>
            <div class="footer">
              <span>Định danh hệ thống Smart Warehouse ĐNCT</span>
              <span>Tem dán giá kệ tiêu chuẩn</span>
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

  return (
    <div className="space-y-4 select-none">
      {/* Top Header & Interactive Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                  Sơ Đồ Phòng Kỹ Thuật &amp; Kệ Vật Tư Kho ĐNCT
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Bản Vẽ Kỹ Thuật 1:1 Chuẩn Thực Tế
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhà Ga Quốc Tế T2 • 2 Tủ Đồ Nghề • 5 Kệ Vật Tư 4 Tầng • Cụm Nguồn UPS Socomec &amp; Tủ Điện Schneider
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & View Mode Switcher */}
          <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('2D_MAP')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === '2D_MAP'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mặt Bằng 2D Kỹ Thuật</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('FRONT_ELEVATION')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'FRONT_ELEVATION'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Mặt Đứng Kệ (4 Tầng Thực Tế)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('ISOMETRIC_3D')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'ISOMETRIC_3D'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phối Cảnh 3D Không Gian</span>
              </button>
            </div>

            {/* Master Layout Edit Action */}
            {isMasterAdmin && onOpenMasterEditor && (
              <button
                type="button"
                onClick={onOpenMasterEditor}
                className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="Chỉnh sửa chi tiết khay, ngăn và gán vật tư (Master Admin)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Chỉnh Sửa Layout (Master)</span>
              </button>
            )}

            {/* Print Shelf Label Action */}
            {onOpenPrintModal ? (
              <button
                type="button"
                onClick={() => onOpenPrintModal(activeEntity.id)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="In tem nhãn dán khay kệ theo tiêu chuẩn 5S"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Tem Mã QR (Chuẩn 5S)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePrintShelfLabel(activeEntity)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-blue-500/40 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="In tem nhãn dán khay kệ theo tiêu chuẩn 5S"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>In Tem Kệ {activeEntity.code}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Smart Material Locator Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm vật tư: MCB, CADIVI, TOTO, Lavabo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-[11px]">
            <span className="text-slate-500 font-semibold shrink-0">Lọc nhanh:</span>
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === 'ALL'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tất Cả Thiết Bị ({WAREHOUSE_ENTITIES.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SHELVES')}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === 'SHELVES'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              5 Kệ Vật Tư (5 Tầng Chuẩn 5S)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ELECTRICAL_UPS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === 'ELECTRICAL_UPS'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Hệ Thống Nguồn UPS &amp; Tủ Điện
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left/Top Main Map & Visualizer Canvas (8 cols) */}
        <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
          {/* Canvas Toolbar overlay */}
          <div className="p-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Vị Trí Đang Chọn:
              </span>
              <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {activeEntity.name} ({activeEntity.code})
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {activeEntity.type === 'SHELF_4_TIER' ? `• ${activeEntity.tiers?.length || 5} Tầng Tiêu Chuẩn` : ''}
              </span>
            </div>

            {/* Zoom Controls for SVG */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition ml-1"
                title="Đặt lại góc nhìn chuẩn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Render Area */}
          <div className="relative min-h-[520px] lg:min-h-[580px] bg-slate-950 overflow-auto flex items-center justify-center p-3 select-none">
            {/* VIEW MODE 1: 2D ARCHITECTURAL CAD FLOOR PLAN */}
            {viewMode === '2D_MAP' && (
              <div
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
                className="w-full max-w-[960px] aspect-[960/540]"
              >
                <svg
                  viewBox="0 0 960 540"
                  className="w-full h-full drop-shadow-2xl"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Architectural hatch pattern for structural pillars & ventilation shafts */}
                    <pattern id="pillarHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
                    </pattern>

                    {/* Industrial Electrical Safety Warning Stripes (Vàng - Đen an toàn điện) */}
                    <pattern id="hazardStripe" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <rect width="10" height="20" fill="#eab308" />
                      <rect x="10" width="10" height="20" fill="#0f172a" />
                    </pattern>

                    {/* Floor tile grid pattern */}
                    <pattern id="floorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                  </defs>

                  {/* ROOM BACKGROUND (Mặt bằng kỹ thuật phòng nguồn & kho vật tư AHT 2D CAD) */}
                  <rect x="15" y="15" width="930" height="510" fill="#040d1e" stroke="#38bdf8" strokeWidth="2.5" rx="4" />
                  <rect x="15" y="15" width="930" height="510" fill="url(#floorGrid)" />

                  {/* L-SHAPED TECHNICAL CAD CORNER BRACKETS */}
                  <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <path d="M 925 15 L 945 15 L 945 35" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <path d="M 15 505 L 15 525 L 35 525" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <path d="M 925 525 L 945 525 L 945 505" fill="none" stroke="#38bdf8" strokeWidth="2.5" />

                  {/* CỬA RA VÀO 2 CÁNH PHÍA TƯỜNG PHẢI (Right Wall Double Swing Door) */}
                  <g id="entrance-double-door">
                    {/* Khuyết tường tại vị trí cửa */}
                    <line x1="945" y1="35" x2="945" y2="115" stroke="#040d1e" strokeWidth="4" />
                    {/* Cánh cửa 1 (trên) mở vào 90 độ */}
                    <line x1="945" y1="35" x2="905" y2="35" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Cung quay cánh cửa 1 */}
                    <path d="M 945 75 A 40 40 0 0 1 905 35" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
                    {/* Cánh cửa 2 (dưới) mở vào 90 độ */}
                    <line x1="945" y1="115" x2="905" y2="115" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Cung quay cánh cửa 2 */}
                    <path d="M 945 75 A 40 40 0 0 0 905 115" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
                    {/* Nhãn cửa */}
                    <text x="932" y="75" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 932 75)">
                      CỬA VÀO (2 CÁNH)
                    </text>
                  </g>

                  {/* BÌNH CHỮA CHÁY PCCC (Hộp đỏ PCCC tường phải gần cửa ra vào) */}
                  <g id="fire-extinguisher">
                    <rect x="916" y="125" width="22" height="22" rx="3" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="927" y="139" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle">
                      PCCC
                    </text>
                  </g>

                  {/* SAFETY HAZARD STRIPES: Vạch sơn cảnh báo an toàn điện CHỈ quanh 3 cụm thiết bị */}
                  {/* Zone 1: Dãy Pin & Tủ New UPS Phía Tây */}
                  <rect x="22" y="124" width="134" height="318" fill="none" stroke="url(#hazardStripe)" strokeWidth="3.5" rx="4" opacity="0.85" />
                  {/* Zone 2: Cụm UPS 1 (UPS-1 EQPT + BATT.2 + BATT.1) */}
                  <rect x="466" y="142" width="440" height="116" fill="none" stroke="url(#hazardStripe)" strokeWidth="3.5" rx="4" opacity="0.85" />
                  {/* Zone 3: Cụm UPS 2 (UPS-2 EQPT + BATT.3 + BATT.2 + BATT.1) */}
                  <rect x="386" y="302" width="520" height="116" fill="none" stroke="url(#hazardStripe)" strokeWidth="3.5" rx="4" opacity="0.85" />

                  {/* RENDER ALL INTERACTIVE WAREHOUSE ENTITIES */}
                  {WAREHOUSE_ENTITIES.map((entity) => {
                    const isSelected = selectedEntityId === entity.id;
                    const isMatched = matchedEntityIds.has(entity.id);
                    const matCount = (entityMaterialsMap[entity.id] || []).length;
                    const isShelf = entity.type === 'SHELF_4_TIER';
                    const isTool = entity.type === 'TOOL_CABINET';
                    const isDist = entity.type === 'DISTRIBUTION_BOARD';
                    const tierCount = entity.tiers?.length || 5;

                    // Determine stroke color and width
                    let strokeColor = isSelected ? '#38bdf8' : isMatched ? '#f59e0b' : '#38bdf8';
                    let strokeW = isSelected ? 3.5 : isMatched ? 3 : 2;
                    if (entity.type === 'UPS_CABINET' && !entity.code.includes('NEW UPS') && !entity.id.includes('UPS-')) {
                      strokeColor = isSelected ? '#38bdf8' : isMatched ? '#f59e0b' : '#475569';
                      strokeW = isSelected ? 3.5 : 1.5;
                    }

                    return (
                      <g
                        key={entity.id}
                        id={`entity-svg-${entity.id}`}
                        className="cursor-pointer transition-all duration-200 group"
                        onClick={() => {
                          setSelectedEntityId(entity.id);
                          setSelectedTier(null);
                          setSelectedCompartmentId(null);
                        }}
                      >
                        {/* Radar Pulse Effect for Searched / Selected Shelf */}
                        {(isSelected || isMatched) && (
                          <rect
                            x={entity.svgRect.x - 3}
                            y={entity.svgRect.y - 3}
                            width={entity.svgRect.width + 6}
                            height={entity.svgRect.height + 6}
                            fill="none"
                            stroke={isSelected ? '#38bdf8' : '#f59e0b'}
                            strokeWidth="2"
                            rx="5"
                            className="animate-pulse"
                            opacity="0.85"
                          />
                        )}

                        {/* Shelf/Cabinet Base Rect */}
                        <rect
                          x={entity.svgRect.x}
                          y={entity.svgRect.y}
                          width={entity.svgRect.width}
                          height={entity.svgRect.height}
                          fill={
                            isShelf
                              ? '#071529'
                              : isTool
                              ? '#0284c7'
                              : isDist
                              ? '#e0f2fe'
                              : '#0f172a'
                          }
                          stroke={strokeColor}
                          strokeWidth={strokeW}
                          rx="4"
                          className="drop-shadow-lg transition-colors group-hover:brightness-110"
                        />

                        {/* Visual Shelf Tier Dividers dynamically rendered for all tiers */}
                        {isShelf && (entity.tiers || []).map((_, idx, arr) => {
                          if (idx === 0) return null;
                          const yOffset = entity.svgRect.y + (entity.svgRect.height / arr.length) * idx;
                          return (
                            <line
                              key={idx}
                              x1={entity.svgRect.x}
                              y1={yOffset}
                              x2={entity.svgRect.x + entity.svgRect.width}
                              y2={yOffset}
                              stroke="#1e293b"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                          );
                        })}

                        {/* Top-left indicator dot */}
                        <circle
                          cx={entity.svgRect.x + 10}
                          cy={entity.svgRect.y + 10}
                          r="3"
                          fill={isDist ? '#0284c7' : '#38bdf8'}
                        />

                        {/* Label Badge on Shelf / Cabinet */}
                        <text
                          x={entity.svgRect.x + entity.svgRect.width / 2}
                          y={entity.svgRect.y + entity.svgRect.height / 2 - (isShelf || isTool ? 6 : 2)}
                          fill={isDist ? '#0f172a' : '#ffffff'}
                          fontSize={isShelf ? 13 : isTool ? 12 : isDist ? 11 : 9.5}
                          fontWeight="900"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {entity.code}
                        </text>

                        {/* Shelf specs or subtitle */}
                        <text
                          x={entity.svgRect.x + entity.svgRect.width / 2}
                          y={entity.svgRect.y + entity.svgRect.height / 2 + 10}
                          fill={isDist ? '#0369a1' : isTool ? '#e0f2fe' : '#94a3b8'}
                          fontSize={isShelf ? 8 : isTool ? 7.5 : isDist ? 7.5 : 7}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {isShelf ? (
                            `${tierCount} TẦNG`
                          ) : isTool ? (
                            'TỦ ĐỒ NGHỀ'
                          ) : isDist ? (
                            'TỦ ĐIỆN PHÂN PHỐI'
                          ) : entity.code.includes('NEW UPS') ? (
                            <tspan fill="#22c55e" fontWeight="bold">Schneider</tspan>
                          ) : entity.id.includes('UPS-') ? (
                            <tspan fill="#38bdf8" fontWeight="bold">SOCOMEC</tspan>
                          ) : (
                            'ẮC QUY'
                          )}
                        </text>

                        {/* Material Count Pill on Shelves */}
                        {(isShelf || isTool) && matCount > 0 && (
                          <g transform={`translate(${entity.svgRect.x + entity.svgRect.width - 24}, ${entity.svgRect.y + 3})`}>
                            <rect width="20" height="13" rx="4" fill="#3b82f6" />
                            <text x="10" y="9.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                              {matCount}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* VIEW MODE 2: REALISTIC FRONT ELEVATION OF 4-TIER SHELVES (Khớp ảnh thực tế 100%) */}
            {viewMode === 'FRONT_ELEVATION' && (
              <div className="w-full max-w-4xl py-2 space-y-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-mono font-black text-xs">
                        {activeEntity.code}
                      </span>
                      <h3 className="text-base font-black text-white">{activeEntity.name}</h3>
                      <span className="text-xs text-amber-400 font-semibold">
                        ({activeEntity.tiers?.length || 5} Tầng Tiêu Chuẩn 5S - Nóc Trên Tận Dụng)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{activeEntity.description}</p>
                  </div>

                  {/* Direct Shelf Switcher Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                    {WAREHOUSE_ENTITIES.filter((e) => e.type === 'SHELF_4_TIER').map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setSelectedEntityId(e.id);
                          setSelectedTier(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                          selectedEntityId === e.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {e.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* THE 5-TIER METALLIC INDUSTRIAL SHELF RACK (Sắt V lỗ xám công nghiệp) */}
                <div className="border-4 border-slate-700 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-xl p-4 shadow-2xl relative space-y-3">
                  {/* Top Rack Header Beam */}
                  <div className="h-6 bg-slate-800 border-b-2 border-slate-700 rounded-t flex items-center justify-between px-3 text-[10px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      <Tag className="w-3 h-3 text-blue-400" />
                      KỆ KHO ĐNCT • TIÊU CHUẨN 5S • PHÂN KHAY NGĂN CHI TIẾT
                    </span>
                    <span>KHAY KỆ {activeEntity.tiers?.length || 5} TẦNG TIÊU CHUẨN (TẦNG 1 Ở TRÊN CÙNG)</span>
                  </div>

                  {/* Render Tiers from Top (Tầng 1 - Nóc trên) to Bottom (Tầng 5 - Mâm đáy) */}
                  {(activeEntity.tiers || []).slice().sort((a, b) => a.tierNumber - b.tierNumber).map((tier) => {
                    const isTierSelected = selectedTier === tier.tierNumber;
                    const compMaterialCodes = new Set<string>();
                    (tier.compartments || []).forEach((c) => {
                      (c.assignedMaterialCodes || []).forEach((code) => compMaterialCodes.add(code));
                    });

                    const tierMats = (entityMaterialsMap[activeEntity.id] || []).filter((m) =>
                      compMaterialCodes.has(m.code)
                    );

                    return (
                      <div
                        key={tier.tierNumber}
                        onClick={() => setSelectedTier(isTierSelected ? null : tier.tierNumber)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isTierSelected
                            ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Tier Beam Header & Label Tag */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-black text-xs border border-slate-700">
                              {tier.label}
                            </span>
                            {tier.tierNumber === 1 && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                                🌟 Nóc Trên Cùng - Tận Dụng Lưu Trữ
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-200">
                              {tier.categoryDesc}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {tierMats.length} vật tư đang lưu trữ
                          </span>
                        </div>

                        {/* Physical Item Visualizer on Shelf: Use customized Compartments if available */}
                        {tier.compartments && tier.compartments.length > 0 ? (
                          <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {tier.compartments.map((comp) => {
                              const compMats = (entityMaterialsMap[activeEntity.id] || []).filter((m) =>
                                (comp.assignedMaterialCodes || []).includes(m.code)
                              );
                              return (
                                <div
                                  key={comp.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCompartmentId(selectedCompartmentId === comp.id ? null : comp.id);
                                  }}
                                  className={`border-2 rounded-lg p-2.5 flex flex-col justify-between min-h-[85px] shadow-md transition group/comp relative cursor-pointer ${
                                    selectedCompartmentId === comp.id
                                      ? 'bg-blue-900/90 border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-500/20'
                                      : 'bg-slate-800/80 border-blue-500/50 hover:border-blue-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] text-blue-300 font-bold">
                                    <span className="bg-blue-900/60 px-1.5 py-0.5 rounded text-white font-mono">
                                      {comp.code}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400">
                                      {compMats.length || comp.assignedMaterialCodes?.length || 0} VT
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-white mt-1 line-clamp-2">
                                    {comp.name}
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono mt-1 truncate">
                                    QR: {comp.qrCodeValue || `DNCT-WH-${activeEntity.code}-T${tier.tierNumber}-${comp.code}`}
                                  </div>
                                  {onOpenPrintModal && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenPrintModal(activeEntity.id, comp.id);
                                      }}
                                      className="mt-1.5 py-0.5 px-1.5 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-[9px] font-semibold flex items-center justify-center gap-1 transition"
                                    >
                                      <Printer className="w-2.5 h-2.5" /> In Tem Khay
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {/* Visual representation based on photo archetype */}
                          {tier.visualType === 'blue-bins' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-blue-600/20 border-2 border-blue-500/60 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md hover:bg-blue-600/30 transition"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-blue-300 font-bold">
                                    <span>KHAY XANH #{idx + 1}</span>
                                    <Boxes className="w-3 h-3" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-blue-200/80 font-mono">
                                    Phân loại khí cụ đóng cắt
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'cadivi-coils' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-amber-500/10 border-2 border-amber-500/50 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                                    <span>CUỘN CADIVI</span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-amber-300/80 font-mono">
                                    Dây cáp điện Tầng 1
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'clear-boxes' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-800/80 border-2 border-slate-600 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md relative overflow-hidden"
                                >
                                  {/* Red/Orange handle on top of clear plastic box */}
                                  <div className="h-1.5 w-10 bg-red-500 rounded-full mx-auto mb-1" />
                                  <div className="text-[10px] text-slate-400 font-bold">
                                    HỘP QUAI ĐỎ #{idx + 1}
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-100 line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-emerald-400 font-mono">
                                    Linh kiện TOTO / Rơ-le
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'cardboard-boxes' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-yellow-900/20 border-2 border-yellow-700/60 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-yellow-500 font-bold">
                                    <span>THÙNG CARTON</span>
                                    <Package className="w-3 h-3" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-yellow-400/80 font-mono">
                                    Phụ kiện nguyên hộp
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'tool-case' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-cyan-950/30 border-2 border-cyan-500/50 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold">
                                    <span>DỤNG CỤ THI CÔNG</span>
                                    <Wrench className="w-3 h-3" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-cyan-300 font-mono">
                                    Thiết bị kiểm chuẩn
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW MODE 3: 3D ISOMETRIC INDUSTRIAL WAREHOUSE PROJECTION */}
            {viewMode === 'ISOMETRIC_3D' && (
              <div className="w-full flex flex-col items-center select-none">
                {/* 3D Camera Controls HUD */}
                <div className="w-full mb-3 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm z-20">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-blue-400" />
                      Góc nhìn:
                    </span>
                    <button
                      type="button"
                      onClick={() => { setYaw3D(45); setPitch3D(55); }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                        yaw3D === 45 && pitch3D === 55
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      📐 Isometric 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => { setYaw3D(-30); setPitch3D(50); }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                        yaw3D === -30 && pitch3D === 50
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🚪 Hướng Cửa Vào
                    </button>
                    <button
                      type="button"
                      onClick={() => { setYaw3D(0); setPitch3D(35); }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                        yaw3D === 0 && pitch3D === 35
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      📦 Trực Diện Kệ
                    </button>
                    <button
                      type="button"
                      onClick={() => { setYaw3D(0); setPitch3D(82); }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                        yaw3D === 0 && pitch3D === 82
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🗺️ Mặt Bằng Trên
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsAutoRotating3D((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
                        isAutoRotating3D
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="Bật/Tắt tự động xoay 360 độ"
                    >
                      <RotateCcw className={`w-3 h-3 ${isAutoRotating3D ? 'animate-spin' : ''}`} />
                      <span>{isAutoRotating3D ? 'Đang Xoay 360°' : 'Tự Xoay'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setZoom3D((z) => Math.max(0.5, z - 0.1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Thu nhỏ 3D"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 w-8 text-center">
                      {Math.round(zoom3D * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom3D((z) => Math.min(1.4, z + 0.1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Phóng to 3D"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setYaw3D(45); setPitch3D(55); setZoom3D(0.85); }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Reset góc 3D chuẩn"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mouse Drag Instruction Pill */}
                <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>💡 Giữ chuột hoặc vuốt ngón tay kéo để xoay 360° • Click vào kệ/tủ để soi chi tiết vật tư</span>
                </div>

                {/* 3D Perspective Stage Container */}
                <div
                  onMouseDown={handle3DMouseDown}
                  onMouseMove={handle3DMouseMove}
                  onMouseUp={handle3DMouseUp}
                  onMouseLeave={handle3DMouseUp}
                  onTouchStart={handle3DTouchStart}
                  onTouchMove={handle3DTouchMove}
                  onTouchEnd={handle3DMouseUp}
                  className="w-full h-[580px] bg-slate-950/90 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{
                    perspective: '1200px',
                  }}
                >
                  {/* Subtle Grid Ambient Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-slate-950/60 to-slate-950 pointer-events-none" />

                  {/* 3D Root World Object */}
                  <div
                    style={{
                      transform: `scale(${zoom3D}) rotateX(${pitch3D}deg) rotateZ(${-yaw3D}deg)`,
                      transformStyle: 'preserve-3d',
                      transition: isDragging3DRef.current ? 'none' : 'transform 0.15s ease-out',
                      width: '960px',
                      height: '540px',
                      position: 'relative',
                    }}
                  >
                    {/* 3D Concrete Industrial Floor Plate */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#0c1322',
                        backgroundImage: `
                          linear-gradient(to right, rgba(51, 65, 85, 0.25) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(51, 65, 85, 0.25) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                        border: '3px solid #3b82f6',
                        borderRadius: '8px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(15, 23, 42, 0.8)',
                        transform: 'translateZ(0px)',
                      }}
                    >
                      {/* Safety Hazard Stripes around UPS-1 and UPS-2 Areas */}
                      {/* West Battery & New UPS Area */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '18px',
                          top: '120px',
                          width: '142px',
                          height: '315px',
                          border: '3px dashed #eab308',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(234, 179, 8, 0.05)',
                        }}
                      >
                        <span className="text-[8px] font-black text-amber-400 font-mono tracking-wider absolute top-1 left-1.5 opacity-80">
                          ⚡ DÃY PIN &amp; TỦ NEW UPS
                        </span>
                      </div>

                      {/* UPS-1 Warning Area */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '455px',
                          top: '135px',
                          width: '465px',
                          height: '130px',
                          border: '4px dashed #eab308',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(234, 179, 8, 0.05)',
                        }}
                      >
                        <span className="text-[10px] font-black text-amber-400 font-mono tracking-wider absolute bottom-1 right-2 opacity-70">
                          ⚡ VÙNG CẢNH BÁO ĐIỆN CAO THẾ UPS-1
                        </span>
                      </div>

                      {/* UPS-2 Warning Area */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '375px',
                          top: '290px',
                          width: '545px',
                          height: '130px',
                          border: '4px dashed #eab308',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(234, 179, 8, 0.05)',
                        }}
                      >
                        <span className="text-[10px] font-black text-amber-400 font-mono tracking-wider absolute bottom-1 right-2 opacity-70">
                          ⚡ VÙNG CẢNH BÁO ĐIỆN CAO THẾ UPS-2
                        </span>
                      </div>

                      {/* Distribution Board Safety Area along Bottom Wall */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '18px',
                          top: '450px',
                          width: '880px',
                          height: '75px',
                          border: '3px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(30, 58, 138, 0.1)',
                        }}
                      >
                        <span className="text-[9px] font-bold text-blue-300 font-mono absolute top-1 left-2 opacity-70">
                          DÃY TỦ ĐIỆN PHÂN PHỐI HẠ THẾ (ESB / DP / DB)
                        </span>
                      </div>

                      {/* Entrance Threshold (Top Right) */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '885px',
                          top: '16px',
                          width: '55px',
                          height: '14px',
                          backgroundColor: '#ef4444',
                          borderRadius: '3px',
                          boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span className="text-[7.5px] font-black text-white">CỬA VÀO</span>
                      </div>

                      {/* 5S Walkway Guideline */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '175px',
                          top: '110px',
                          width: '710px',
                          height: '330px',
                          border: '2px dashed rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>

                    {/* RENDER ALL 3D ENTITIES ON THE ROOM FLOOR */}
                    {WAREHOUSE_ENTITIES.map((entity) => {
                      const isSelected = selectedEntityId === entity.id;
                      const isHovered = hoveredEntity3D === entity.id;
                      const isShelf = entity.type === 'SHELF_4_TIER';
                      const isTool = entity.type === 'TOOL_CABINET';
                      const isUps = entity.type === 'UPS_CABINET';
                      const isBatt = entity.type === 'BATTERY_RACK';

                      // Determine 3D height in Z dimension (pixels)
                      const zHeight = isShelf
                        ? 90
                        : isTool
                        ? 110
                        : isUps
                        ? 115
                        : isBatt
                        ? 85
                        : 120;

                      // Colors for 3D faces
                      const primaryColor = isShelf
                        ? '#059669' // Emerald for Shelves
                        : isTool
                        ? '#2563eb' // Blue for Tool Cabinets
                        : isUps
                        ? '#eab308' // Amber for UPS
                        : isBatt
                        ? '#64748b' // Slate for Batteries
                        : '#0284c7'; // Sky Blue for DB

                      return (
                        <div
                          key={entity.id}
                          onMouseEnter={() => setHoveredEntity3D(entity.id)}
                          onMouseLeave={() => setHoveredEntity3D(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntityId(entity.id);
                            setSelectedTier(null);
                          }}
                          style={{
                            position: 'absolute',
                            left: `${entity.svgRect.x}px`,
                            top: `${entity.svgRect.y}px`,
                            width: `${entity.svgRect.width}px`,
                            height: `${entity.svgRect.height}px`,
                            transformStyle: 'preserve-3d',
                            transform: `translateZ(${isSelected ? '8px' : '0px'})`,
                            transition: 'transform 0.2s ease, filter 0.2s ease',
                            cursor: 'pointer',
                          }}
                          className="group"
                        >
                          {/* 3D Box Geometry Construction */}
                          {/* 1. TOP FACE (Z = zHeight) */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              height: `${entity.svgRect.height}px`,
                              transform: `translateZ(${zHeight}px)`,
                              backgroundColor: isSelected
                                ? '#38bdf8'
                                : isHovered
                                ? '#60a5fa'
                                : primaryColor,
                              border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)',
                              borderRadius: '3px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px',
                              boxShadow: isSelected
                                ? '0 0 20px rgba(56, 189, 248, 0.8)'
                                : 'none',
                            }}
                          >
                            <span className="text-[10px] font-black text-white truncate max-w-full drop-shadow">
                              {entity.code}
                            </span>
                            {isShelf && (
                              <span className="text-[8px] font-bold text-white/90">
                                {entity.tiers?.length || 5} TẦNG
                              </span>
                            )}
                          </div>

                          {/* 2. FRONT FACE (Facing viewer along Y) */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              bottom: 0,
                              width: `${entity.svgRect.width}px`,
                              height: `${zHeight}px`,
                              transformOrigin: 'bottom center',
                              transform: 'rotateX(-90deg)',
                              backgroundColor: isSelected ? '#0284c7' : '#0f172a',
                              border: '1px solid rgba(255,255,255,0.2)',
                              backgroundImage: isShelf
                                ? `linear-gradient(to bottom, 
                                    rgba(16, 185, 129, 0.3) 0%, 
                                    rgba(15, 23, 42, 0.9) 20%, 
                                    rgba(16, 185, 129, 0.3) 21%, 
                                    rgba(15, 23, 42, 0.9) 40%,
                                    rgba(16, 185, 129, 0.3) 41%, 
                                    rgba(15, 23, 42, 0.9) 60%,
                                    rgba(16, 185, 129, 0.3) 61%, 
                                    rgba(15, 23, 42, 0.9) 80%,
                                    rgba(16, 185, 129, 0.3) 81%,
                                    rgba(15, 23, 42, 0.9) 100%)`
                                : isTool
                                ? `linear-gradient(to right, #1e3a8a 49%, #3b82f6 50%, #1e3a8a 51%)`
                                : isUps
                                ? `linear-gradient(to bottom, #ca8a04 0%, #1e293b 30%, #0f172a 100%)`
                                : '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-around',
                              padding: '2px',
                            }}
                          >
                            {/* Realistic Details on Front Face */}
                            {isShelf && (
                              <div className="w-full h-full flex flex-col justify-between py-1 px-1 pointer-events-none">
                                {(entity.tiers || []).slice().sort((a, b) => a.tierNumber - b.tierNumber).map((t) => (
                                  <div key={t.tierNumber} className="h-1.5 w-full bg-emerald-500/40 rounded-xs flex items-center justify-between px-0.5">
                                    <span className="text-[6px] font-mono font-bold text-white leading-none">T{t.tierNumber}</span>
                                    <span className="w-2 h-0.5 bg-amber-400 rounded-xs" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {isTool && (
                              <div className="flex flex-col items-center justify-center space-y-1 w-full text-center">
                                <div className="flex items-center space-x-1">
                                  <div className="w-0.5 h-3 bg-slate-300 rounded" />
                                  <div className="w-0.5 h-3 bg-slate-300 rounded" />
                                </div>
                                <span className="text-[7px] font-mono text-cyan-300">2 CÁNH</span>
                              </div>
                            )}

                            {isUps && (
                              <div className="flex flex-col items-center justify-center space-y-1 w-full text-center">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-[7px] font-mono font-bold text-amber-300">
                                  {entity.code.includes('NEW UPS') ? 'Schneider' : 'SOCOMEC'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 3. RIGHT SIDE FACE */}
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              width: `${entity.svgRect.height}px`,
                              height: `${zHeight}px`,
                              transformOrigin: 'top right',
                              transform: 'rotateY(90deg) rotateX(-90deg)',
                              backgroundColor: '#090d16',
                              border: '1px solid rgba(255,255,255,0.15)',
                            }}
                          />

                          {/* 4. LEFT SIDE FACE */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: `${entity.svgRect.height}px`,
                              height: `${zHeight}px`,
                              transformOrigin: 'top left',
                              transform: 'rotateY(-90deg) rotateX(-90deg)',
                              backgroundColor: '#090d16',
                              border: '1px solid rgba(255,255,255,0.15)',
                            }}
                          />

                          {/* 5. BACK FACE */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: `${entity.svgRect.width}px`,
                              height: `${zHeight}px`,
                              transformOrigin: 'top center',
                              transform: 'rotateX(90deg)',
                              backgroundColor: '#030712',
                              border: '1px solid rgba(255,255,255,0.15)',
                            }}
                          />

                          {/* 3D FLOATING BILLBOARD CALLOUT (When Selected or Hovered) */}
                          {(isSelected || isHovered) && (
                            <div
                              style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: `translate3d(-50%, -50%, ${zHeight + 35}px) rotateZ(${yaw3D}deg) rotateX(${-pitch3D}deg)`,
                                transformStyle: 'preserve-3d',
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                              }}
                              className="z-50"
                            >
                              <div className="bg-slate-900/95 text-white px-2.5 py-1.5 rounded-xl border border-blue-400/80 shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-bounce">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <div className="text-left">
                                  <div className="text-[11px] font-black text-amber-300">
                                    {entity.name}
                                  </div>
                                  <div className="text-[9px] text-slate-300">
                                    {isShelf ? '4 Tầng • 16 Khay vật tư' : entity.categoryLabel}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right/Sidebar Detail Drawer: Material Dossier at Selected Location (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Active Shelf/Equipment Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
            {/* Header info */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white font-mono font-black text-xs">
                    {activeEntity.code}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {activeEntity.type === 'SHELF_4_TIER'
                      ? 'Kệ Vật Tư 4 Tầng'
                      : activeEntity.type === 'TOOL_CABINET'
                      ? 'Tủ Đồ Nghề Kỹ Thuật'
                      : 'Hệ Thống Nguồn Điện'}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">{activeEntity.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{activeEntity.description}</p>
              </div>

              {/* Shelf QR Code preview */}
              <div className="shrink-0 bg-white p-1.5 rounded-lg shadow-md flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/?scan=${encodeURIComponent(activeEntity.code)}`
                      : activeEntity.code
                  )}`}
                  alt="QR"
                  className="w-14 h-14 object-contain"
                />
                <span className="text-[8px] font-mono text-slate-800 mt-0.5 font-black">QR KỆ</span>
              </div>
            </div>

            {/* Print Shelf Label Action */}
            <button
              type="button"
              onClick={() => handlePrintShelfLabel(activeEntity)}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-blue-500/40 transition text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>In Tem Nhãn Định Danh Kệ (Dán Lên Khay/Kệ)</span>
            </button>
          </div>

          {/* List of Materials stored at this location */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Danh Sách Vật Tư Tại Vị Trí Này
                  </h4>
                  <div className="text-[11px] text-cyan-300 font-mono font-medium flex items-center gap-1.5 mt-0.5">
                    <span>{activeEntity.code}</span>
                    {selectedTier !== null && (
                      <span className="bg-slate-800 px-1.5 py-0.2 rounded text-amber-300">
                        Tầng {selectedTier}
                      </span>
                    )}
                    {selectedCompartmentId && (() => {
                      let cCode = '';
                      activeEntity.tiers?.forEach(t => t.compartments?.forEach(c => {
                        if (c.id === selectedCompartmentId || c.code === selectedCompartmentId) cCode = c.code;
                      }));
                      return cCode ? (
                        <span className="bg-blue-900/80 px-1.5 py-0.2 rounded text-cyan-200">
                          Khay {cCode}
                        </span>
                      ) : null;
                    })()}
                    {(selectedTier !== null || selectedCompartmentId !== null) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTier(null);
                          setSelectedCompartmentId(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white underline ml-1"
                      >
                        (Hiện tất cả)
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {activeMaterials.length} mã vật tư
              </span>
            </div>

            {/* Scrollable Material Items List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activeMaterials.length > 0 ? (
                activeMaterials.map((mat) => {
                  const stock = stockMap[mat.code]?.currentStock ?? mat.initialStock;
                  const isLow = stock <= mat.minStock;
                  const isOut = stock <= 0;
                  const loc = resolveMaterialWarehouseLocation(mat, WAREHOUSE_ENTITIES);

                  return (
                    <div
                      key={mat.id}
                      onClick={() => onSelectMaterial(mat)}
                      className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 hover:border-blue-500/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-300">
                            {mat.code}
                          </span>
                          {loc.isAssigned && (
                            <span className="text-[9px] font-mono font-bold text-cyan-300 bg-blue-950/90 px-1.5 py-0.2 rounded border border-blue-600/40">
                              T{loc.tierNumber} • {loc.compartmentCode}
                            </span>
                          )}
                          {mat.brand && (
                            <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                              {mat.brand}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold text-white truncate mt-0.5 group-hover:text-blue-300 transition">
                          {mat.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {mat.specification || 'Quy cách chuẩn ĐNCT'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono text-xs font-black ${
                            isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatNumber(stock)} {mat.unit}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          Định mức: {mat.minStock}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center space-y-2 bg-slate-950 rounded-xl border border-slate-800/60">
                  <Package className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Chưa có vật tư nào được gán cụ thể cho vị trí này.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bạn có thể cập nhật vị trí trong danh mục vật tư hoặc dán cột Vị Trí trên Google Sheet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
