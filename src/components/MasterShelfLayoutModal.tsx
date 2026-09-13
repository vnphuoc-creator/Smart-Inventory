import React, { useState } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Boxes,
  Layers,
  Sparkles,
  Search,
  Check,
  Package,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  WarehouseShelfEntity,
  ShelfTierInfo,
  WarehouseCompartment,
  ShelfVisualContainerType,
  Material,
  User,
} from '../types';
import { DEFAULT_WAREHOUSE_ENTITIES } from '../data/warehouseLayoutData';

interface MasterShelfLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  entities: WarehouseShelfEntity[];
  onSave: (updatedEntities: WarehouseShelfEntity[]) => Promise<boolean | void>;
  materials: Material[];
  currentUser?: User | null;
}

const CONTAINER_TYPES: { type: ShelfVisualContainerType; label: string; icon: string; desc: string }[] = [
  { type: 'blue-bins', label: 'Khay nhựa xanh', icon: '🟦', desc: 'Khay chia ngăn chuyên đựng MCB, Aptomat, đèn báo' },
  { type: 'clear-boxes', label: 'Hộp nhựa quai đỏ', icon: '📦', desc: 'Hộp nắp gài trong suốt quai đỏ đựng rơ-le, phụ kiện' },
  { type: 'cadivi-coils', label: 'Cuộn dây CADIVI', icon: '🟡', desc: 'Ngăn chứa các cuộn dây điện đơn & cáp tròn' },
  { type: 'cardboard-boxes', label: 'Thùng carton', icon: '🟫', desc: 'Thùng carton đựng nguồn, nắp bồn tiểu, vật tư' },
  { type: 'tool-case', label: 'Hộp đồ nghề kỹ thuật', icon: '🧰', desc: 'Hộp dụng cụ máy khoan, kìm bấm cosse, đồng hồ đo' },
];

export const MasterShelfLayoutModal: React.FC<MasterShelfLayoutModalProps> = ({
  isOpen,
  onClose,
  entities,
  onSave,
  materials,
  currentUser,
}) => {
  if (!isOpen) return null;

  // Local draft of layout entities
  const [draftEntities, setDraftEntities] = useState<WarehouseShelfEntity[]>(() => {
    return JSON.parse(JSON.stringify(entities));
  });

  // Filter entity type in sidebar
  const [entityFilterType, setEntityFilterType] = useState<'ALL' | 'SHELVES' | 'TOOL_CABINETS' | 'UPS_BATTERY' | 'ELECTRICAL'>('ALL');
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);
  const [newEntityData, setNewEntityData] = useState({
    code: 'KE-06',
    name: 'KỆ VẬT TƯ SỐ 6',
    categoryLabel: 'Khu Vực Vật Tư Mới',
    type: 'SHELF_4_TIER' as WarehouseShelfEntity['type'],
    x: 200,
    y: 200,
    width: 120,
    height: 75,
  });

  // Currently selected entity to edit (defaults to KE-01)
  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => {
    return draftEntities.find((e) => e.type === 'SHELF_4_TIER')?.id || 'KE-01';
  });

  // Currently selected tier (Tầng 1 là trên cùng: 1, 2, 3, 4, 5)
  const [selectedTierNumber, setSelectedTierNumber] = useState<number>(1);

  // Material picker modal state
  const [assigningCompartmentId, setAssigningCompartmentId] = useState<string | null>(null);
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteEntityId, setConfirmDeleteEntityId] = useState<string | null>(null);

  // Find active entity
  const activeEntity = draftEntities.find((e) => e.id === selectedEntityId) || draftEntities[0];
  const tiers = activeEntity?.tiers || [];
  const activeTier = tiers.find((t) => t.tierNumber === selectedTierNumber) || tiers[0];

  // Helper to update active entity
  const updateActiveEntity = (updater: (prev: WarehouseShelfEntity) => WarehouseShelfEntity) => {
    setDraftEntities((prev) =>
      prev.map((item) => (item.id === selectedEntityId ? updater(item) : item))
    );
  };

  // Helper to update active tier
  const updateActiveTier = (updater: (prevTier: ShelfTierInfo) => ShelfTierInfo) => {
    updateActiveEntity((prev) => {
      const updatedTiers = (prev.tiers || []).map((t) =>
        t.tierNumber === selectedTierNumber ? updater(t) : t
      );
      return { ...prev, tiers: updatedTiers };
    });
  };

  // Add new tier to active entity
  const handleAddTierToEntity = () => {
    if (!activeEntity) return;
    const currentTiers = activeEntity.tiers || [];
    const nextTierNum = currentTiers.length + 1;
    const newTier: ShelfTierInfo = {
      tierNumber: nextTierNum,
      label: `Tầng ${nextTierNum}`,
      categoryDesc: `Tầng bổ sung số ${nextTierNum} của ${activeEntity.name}`,
      itemKeywords: [],
      visualType: 'clear-boxes',
      sampleItems: [],
      compartments: [
        {
          id: `${activeEntity.code}-T${nextTierNum}-KH01`,
          code: 'KH01',
          name: 'Khay 1',
          visualType: 'clear-boxes',
          description: 'Ngăn chứa vật tư',
          sampleItems: [],
          assignedMaterialCodes: [],
          qrCodeValue: `DNCT-WH-${activeEntity.code}-T${nextTierNum}-KH01`,
        },
      ],
    };
    updateActiveEntity((prev) => ({
      ...prev,
      tiers: [...(prev.tiers || []), newTier],
      dimensions: {
        ...prev.dimensions,
        levels: (prev.tiers || []).length + 1,
      },
    }));
    setSelectedTierNumber(nextTierNum);
  };

  // Remove active tier from active entity
  const handleRemoveActiveTier = () => {
    if (!activeEntity || (activeEntity.tiers || []).length <= 1) return;
    updateActiveEntity((prev) => {
      const filteredTiers = (prev.tiers || []).filter((t) => t.tierNumber !== selectedTierNumber);
      // Re-number remaining tiers sequentially
      const renumbered = filteredTiers.map((t, idx) => ({
        ...t,
        tierNumber: idx + 1,
        label: `Tầng ${idx + 1}${idx === 0 ? ' (Nóc Trên Cùng)' : idx === filteredTiers.length - 1 ? ' (Mâm Đáy)' : ''}`,
      }));
      return {
        ...prev,
        tiers: renumbered,
        dimensions: {
          ...prev.dimensions,
          levels: renumbered.length,
        },
      };
    });
    setSelectedTierNumber(1);
  };

  // Add a brand new functional block / entity
  const handleCreateNewEntity = () => {
    const code = newEntityData.code.trim().toUpperCase() || `KE-${draftEntities.length + 1}`;
    const id = code;
    const qrCode = `DNCT-WH-${code}`;
    const created: WarehouseShelfEntity = {
      id,
      code,
      name: newEntityData.name.trim() || `Khối Chức Năng ${code}`,
      type: newEntityData.type,
      categoryLabel: newEntityData.categoryLabel.trim() || 'Khu Vực Bổ Sung',
      dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1800, levels: 5 },
      svgRect: {
        x: Number(newEntityData.x) || 100,
        y: Number(newEntityData.y) || 100,
        width: Number(newEntityData.width) || 120,
        height: Number(newEntityData.height) || 75,
      },
      colorTheme: {
        base: 'from-blue-600/30 to-slate-900',
        border: 'border-blue-500',
        glow: 'shadow-blue-500/30',
        badgeBg: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
        badgeText: 'text-blue-300',
      },
      description: `Khối chức năng ${code} quản lý trong sơ đồ kho`,
      qrCodeValue: qrCode,
      tiers: [1, 2, 3, 4, 5].map((tierNum) => ({
        tierNumber: tierNum,
        label: `Tầng ${tierNum}${tierNum === 1 ? ' (Nóc Trên Cùng)' : tierNum === 5 ? ' (Mâm Đáy)' : ''}`,
        categoryDesc: `Tầng ${tierNum}`,
        itemKeywords: [],
        visualType: 'clear-boxes' as ShelfVisualContainerType,
        sampleItems: [],
        compartments: [
          {
            id: `${code}-T${tierNum}-KH01`,
            code: 'KH01',
            name: 'Khay 1',
            visualType: 'clear-boxes' as ShelfVisualContainerType,
            description: '',
            sampleItems: [],
            assignedMaterialCodes: [],
            qrCodeValue: `DNCT-WH-${code}-T${tierNum}-KH01`,
          },
        ],
      })),
    };

    setDraftEntities((prev) => [...prev, created]);
    setSelectedEntityId(id);
    setSelectedTierNumber(1);
    setShowAddEntityModal(false);
  };

  // Delete an entity
  const handleDeleteEntity = (entityId: string) => {
    setDraftEntities((prev) => prev.filter((e) => e.id !== entityId));
    if (selectedEntityId === entityId) {
      const remaining = draftEntities.filter((e) => e.id !== entityId);
      if (remaining.length > 0) {
        setSelectedEntityId(remaining[0].id);
        setSelectedTierNumber(1);
      }
    }
    setConfirmDeleteEntityId(null);
  };

  // Add new compartment to current tier following naming rules:
  // Kệ: DNCT-WH-KE-01
  // Khay: DNCT-WH-KE-01-T4-KH01
  const handleAddCompartment = () => {
    const existing = activeTier?.compartments || [];
    const nextIndex = existing.length + 1;
    const newCode = nextIndex < 10 ? `KH0${nextIndex}` : `KH${nextIndex}`;
    const newId = `${activeEntity.code}-T${selectedTierNumber}-${newCode}`;

    const newComp: WarehouseCompartment = {
      id: newId,
      code: newCode,
      name: `Khay ${nextIndex}: Phân loại vật tư mới`,
      visualType: activeTier?.visualType || 'blue-bins',
      description: 'Khay chia ngăn chứa linh kiện',
      sampleItems: [],
      assignedMaterialCodes: [],
      qrCodeValue: `DNCT-WH-${activeEntity.code}-T${selectedTierNumber}-${newCode}`,
    };

    updateActiveTier((prevTier) => ({
      ...prevTier,
      compartments: [...(prevTier.compartments || []), newComp],
    }));
  };

  // Update specific compartment
  const handleUpdateCompartment = (
    compId: string,
    updater: (prev: WarehouseCompartment) => WarehouseCompartment
  ) => {
    updateActiveTier((prevTier) => ({
      ...prevTier,
      compartments: (prevTier.compartments || []).map((c) => (c.id === compId ? updater(c) : c)),
    }));
  };

  // Remove specific compartment
  const handleRemoveCompartment = (compId: string) => {
    updateActiveTier((prevTier) => ({
      ...prevTier,
      compartments: (prevTier.compartments || []).filter((c) => c.id !== compId),
    }));
  };

  // Toggle material code in compartment
  const handleToggleMaterialAssignment = (compId: string, materialCode: string) => {
    handleUpdateCompartment(compId, (prev) => {
      const currentCodes = prev.assignedMaterialCodes || [];
      const exists = currentCodes.includes(materialCode);
      const nextCodes = exists
        ? currentCodes.filter((c) => c !== materialCode)
        : [...currentCodes, materialCode];
      return { ...prev, assignedMaterialCodes: nextCodes };
    });
  };

  // Save to Cloud & Local
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const stamped = draftEntities.map((e) => ({
        ...e,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'Master Admin (vn.phuoc235@gmail.com)',
      }));
      await onSave(stamped);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving layout:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default layout
  const handleResetToFactory = () => {
    const factory = JSON.parse(JSON.stringify(DEFAULT_WAREHOUSE_ENTITIES));
    setDraftEntities(factory);
    setConfirmReset(false);
  };

  // Compartment currently being assigned materials
  const activeAssigningComp = activeTier?.compartments?.find((c) => c.id === assigningCompartmentId);

  // Filter materials for assignment modal
  const filteredMaterials = materials.filter((m) => {
    if (!materialSearchQuery.trim()) return true;
    const q = materialSearchQuery.toLowerCase().trim();
    return (
      m.code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.specification && m.specification.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q))
    );
  }).slice(0, 80);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[94vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Chỉnh Sửa Layout Sơ Đồ Kho (Quyền Master)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Master Admin: vn.phuoc235@gmail.com
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chỉnh sửa cấu trúc 5 Kệ Vật Tư 4 Tầng &amp; 2 Tủ Đồ Nghề • Thêm/bớt Khay/Ngăn • Gán mã vật tư trực tiếp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {confirmReset ? (
              <div className="flex items-center space-x-1.5 bg-rose-950/60 border border-rose-600/60 px-3 py-1.5 rounded-xl">
                <span className="text-xs text-rose-300">Khôi phục gốc?</span>
                <button
                  type="button"
                  onClick={handleResetToFactory}
                  className="text-xs px-2 py-0.5 bg-rose-600 text-white font-medium rounded hover:bg-rose-500 transition"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition"
                title="Khôi phục sơ đồ chuẩn mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mặc định</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-lg transition ${
                saveSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Lên Cloud</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Shelf Selector & Basic Settings */}
          <div className="w-80 sm:w-96 bg-slate-900/95 border-r border-slate-750 flex flex-col shrink-0">
            {/* Filter Tabs & Add Entity Button */}
            <div className="p-3 border-b border-slate-750 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Danh Sách Khối Chức Năng ({draftEntities.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddEntityModal(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Khối/Kệ</span>
                </button>
              </div>

              {/* Entity Type Filter Tabs */}
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'ALL', label: 'Tất Cả' },
                  { key: 'SHELVES', label: 'Kệ 1-5' },
                  { key: 'TOOL_CABINETS', label: 'Tủ Đồ Nghề' },
                  { key: 'UPS_BATTERY', label: 'UPS & Pin' },
                  { key: 'ELECTRICAL', label: 'Tủ DB' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEntityFilterType(tab.key as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      entityFilterType === tab.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {draftEntities
                .filter((e) => {
                  if (entityFilterType === 'SHELVES') return e.type === 'SHELF_4_TIER';
                  if (entityFilterType === 'TOOL_CABINETS') return e.type === 'TOOL_CABINET';
                  if (entityFilterType === 'UPS_BATTERY') return e.type === 'UPS_CABINET' || e.type === 'BATTERY_RACK';
                  if (entityFilterType === 'ELECTRICAL') return e.type === 'DISTRIBUTION_BOARD';
                  return true;
                })
                .map((entity) => {
                  const isSelected = entity.id === selectedEntityId;
                  const totalComps = (entity.tiers || []).reduce(
                    (acc, t) => acc + (t.compartments?.length || 0),
                    0
                  );
                  return (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => {
                        setSelectedEntityId(entity.id);
                        setSelectedTierNumber(1);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-md ring-1 ring-blue-500/30'
                          : 'bg-slate-850/70 border-slate-750 text-slate-300 hover:bg-slate-800 hover:border-slate-650'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs tracking-wide text-white truncate max-w-[180px]">
                          {entity.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {entity.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {entity.categoryLabel || entity.type}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                        <span>
                          {entity.tiers?.length || entity.dimensions?.levels || 1} Tầng • {totalComps} Khay
                        </span>
                        <span>
                          X:{entity.svgRect?.x || 0} Y:{entity.svgRect?.y || 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Shelf / Entity Full Meta & Coordinate Editor */}
            {activeEntity && (
              <div className="p-3 bg-slate-850 border-t border-slate-750 space-y-2 max-h-[42%] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Cấu Hình: {activeEntity.code}
                  </span>
                  {confirmDeleteEntityId === activeEntity.id ? (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity(activeEntity.id)}
                        className="text-[10px] px-1.5 py-0.5 bg-rose-600 text-white font-bold rounded hover:bg-rose-500"
                      >
                        Xóa hẳn
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteEntityId(null)}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteEntityId(activeEntity.id)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center space-x-0.5"
                      title="Xóa khối chức năng này"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa khối</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Mã định danh</label>
                    <input
                      type="text"
                      value={activeEntity.code}
                      onChange={(e) =>
                        updateActiveEntity((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      className="w-full px-2 py-1 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-cyan-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Mã QR Định Danh Kệ</label>
                    <input
                      type="text"
                      value={activeEntity.qrCodeValue || `DNCT-WH-${activeEntity.code}`}
                      onChange={(e) =>
                        updateActiveEntity((prev) => ({ ...prev, qrCodeValue: e.target.value }))
                      }
                      className="w-full px-2 py-1 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Tên hiển thị</label>
                  <input
                    type="text"
                    value={activeEntity.name}
                    onChange={(e) =>
                      updateActiveEntity((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Nhãn chuyên mục</label>
                  <input
                    type="text"
                    value={activeEntity.categoryLabel || ''}
                    onChange={(e) =>
                      updateActiveEntity((prev) => ({ ...prev, categoryLabel: e.target.value }))
                    }
                    className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Coordinates on 2D map */}
                <div className="pt-1 border-t border-slate-750">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Tọa Độ &amp; Kích Thước Bản Vẽ 2D (SVG)
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <label className="text-[9px] text-slate-500 block">X (px)</label>
                      <input
                        type="number"
                        value={activeEntity.svgRect?.x ?? 0}
                        onChange={(e) =>
                          updateActiveEntity((prev) => ({
                            ...prev,
                            svgRect: { ...(prev.svgRect || { y: 0, width: 100, height: 70 }), x: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-1.5 py-0.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Y (px)</label>
                      <input
                        type="number"
                        value={activeEntity.svgRect?.y ?? 0}
                        onChange={(e) =>
                          updateActiveEntity((prev) => ({
                            ...prev,
                            svgRect: { ...(prev.svgRect || { x: 0, width: 100, height: 70 }), y: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-1.5 py-0.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Rộng (W)</label>
                      <input
                        type="number"
                        value={activeEntity.svgRect?.width ?? 100}
                        onChange={(e) =>
                          updateActiveEntity((prev) => ({
                            ...prev,
                            svgRect: { ...(prev.svgRect || { x: 0, y: 0, height: 70 }), width: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-1.5 py-0.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Cao (H)</label>
                      <input
                        type="number"
                        value={activeEntity.svgRect?.height ?? 70}
                        onChange={(e) =>
                          updateActiveEntity((prev) => ({
                            ...prev,
                            svgRect: { ...(prev.svgRect || { x: 0, y: 0, width: 100 }), height: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-1.5 py-0.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tiers & Multi-Compartment Editor */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Tier Tabs (Tầng 1 -> Tầng N, Tầng 1 trên cùng) */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-750 shrink-0 gap-3 overflow-x-auto">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Chọn Tầng:</span>
                </span>
                {(tiers || [])
                  .slice()
                  .sort((a, b) => a.tierNumber - b.tierNumber)
                  .map((tierObj) => {
                    const tierNum = tierObj.tierNumber;
                    const isSelected = tierNum === selectedTierNumber;
                    const compCount = tierObj?.compartments?.length || 0;
                    const isTop = tierNum === 1;
                    const isBottom = tierNum === (tiers.length || 5);
                    return (
                      <button
                        key={tierNum}
                        type="button"
                        onClick={() => setSelectedTierNumber(tierNum)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
                        }`}
                      >
                        <span>
                          Tầng {tierNum} {isTop ? '(Nóc)' : isBottom ? '(Mâm Đáy)' : ''}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-blue-800 text-white' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {compCount}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Tier Management Actions: Add Tier / Delete Tier */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAddTierToEntity}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-blue-300 bg-blue-950/60 hover:bg-blue-900 border border-blue-600/40 rounded-xl transition"
                  title="Thêm tầng mới vào kệ này"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Tầng</span>
                </button>
                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRemoveActiveTier}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 rounded-xl transition"
                    title={`Xóa Tầng ${selectedTierNumber}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Tầng Này</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Tier Config Header */}
            {activeTier && (
              <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">{activeTier.label}</span>
                    <span className="text-xs text-slate-400">• Kích thước chuẩn 1.5m x 0.5m</span>
                  </div>
                  <input
                    type="text"
                    value={activeTier.categoryDesc}
                    onChange={(e) =>
                      updateActiveTier((prev) => ({ ...prev, categoryDesc: e.target.value }))
                    }
                    placeholder="Mô tả nhóm vật tư lưu trữ tại tầng này..."
                    className="w-full mt-1 px-3 py-1 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddCompartment}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/50 rounded-xl transition shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Khay / Ngăn</span>
                  </button>
                </div>
              </div>
            )}

            {/* Compartments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(!activeTier?.compartments || activeTier.compartments.length === 0) ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
                  <Boxes className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-sm font-semibold text-slate-300">
                    Chưa có khay/ngăn nào tại Tầng {selectedTierNumber}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                    Thực tế trên 1 tầng kệ có thể đặt nhiều khay nhựa, hộp quai đỏ hoặc cuộn cáp riêng biệt. Hãy thêm khay để phân bổ vật tư chính xác.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCompartment}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Khay / Ngăn Đầu Tiên</span>
                  </button>
                </div>
              ) : (
                activeTier.compartments.map((comp, idx) => {
                  const assignedCount = comp.assignedMaterialCodes?.length || 0;
                  return (
                    <div
                      key={comp.id}
                      className="p-4 bg-slate-900 border border-slate-750 hover:border-slate-650 rounded-2xl shadow-lg transition-all space-y-3"
                    >
                      {/* Top Bar of Compartment */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono text-blue-400">
                            {comp.code || `K${idx + 1}`}
                          </span>
                          <input
                            type="text"
                            value={comp.name}
                            onChange={(e) =>
                              handleUpdateCompartment(comp.id, (prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Tên khay/ngăn chứa..."
                            className="font-bold text-sm text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 min-w-[260px]"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningCompartmentId(comp.id);
                              setMaterialSearchQuery('');
                            }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 rounded-xl transition"
                          >
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            <span>Gán Vật Tư ({assignedCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveCompartment(comp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            title="Xóa khay này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Visual Container Type Selector */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] text-slate-400 font-medium">Kiểu khay chứa:</span>
                        {CONTAINER_TYPES.map((ct) => {
                          const isTypeActive = comp.visualType === ct.type;
                          return (
                            <button
                              key={ct.type}
                              type="button"
                              onClick={() =>
                                handleUpdateCompartment(comp.id, (prev) => ({
                                  ...prev,
                                  visualType: ct.type,
                                }))
                              }
                              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                                isTypeActive
                                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                                  : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                              }`}
                              title={ct.desc}
                            >
                              <span>{ct.icon}</span>
                              <span>{ct.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* QR Code & Description Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Mã QR In Tem Dán Khay
                          </label>
                          <input
                            type="text"
                            value={comp.qrCodeValue || `DNCT-WH-${comp.id}`}
                            onChange={(e) =>
                              handleUpdateCompartment(comp.id, (prev) => ({
                                ...prev,
                                qrCodeValue: e.target.value,
                              }))
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono bg-slate-800/80 border border-slate-700 rounded-lg text-amber-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Ghi chú / Từ khóa tìm kiếm nhanh
                          </label>
                          <input
                            type="text"
                            value={comp.description || ''}
                            onChange={(e) =>
                              handleUpdateCompartment(comp.id, (prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="MCB, CB tép, Aptomat Schneider..."
                            className="w-full px-2.5 py-1 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Display Assigned Materials Chips */}
                      {comp.assignedMaterialCodes && comp.assignedMaterialCodes.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
                            Vật tư đã gán vào khay này ({comp.assignedMaterialCodes.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950/40 rounded-lg">
                            {comp.assignedMaterialCodes.map((code) => {
                              const mat = materials.find((m) => m.code === code);
                              return (
                                <span
                                  key={code}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700 text-slate-200"
                                >
                                  <span className="font-mono font-bold text-amber-400">{code}</span>
                                  {mat && <span className="text-slate-300 truncate max-w-[160px]">{mat.name}</span>}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMaterialAssignment(comp.id, code)}
                                    className="text-slate-400 hover:text-rose-400 ml-1"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal: Gán Vật Tư Vào Khay */}
        {activeAssigningComp && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-slate-100 overflow-hidden">
              {/* Assign Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-850 border-b border-slate-750">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Gán Vật Tư Vào {activeAssigningComp.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vị trí: {activeEntity.name} • Tầng {selectedTierNumber} • {activeAssigningComp.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningCompartmentId(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Box */}
              <div className="p-3 bg-slate-900 border-b border-slate-750">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    placeholder="Tìm theo mã DN_*, tên vật tư, quy cách (MCB, Aptomat, CADIVI, Lavabo...)"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                  <span>
                    Đã chọn: <strong className="text-amber-400">{activeAssigningComp.assignedMaterialCodes?.length || 0}</strong> vật tư
                  </span>
                  <span>Hiển thị tối đa 80 kết quả phù hợp</span>
                </div>
              </div>

              {/* Material List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/60">
                {filteredMaterials.map((mat) => {
                  const isChecked = (activeAssigningComp.assignedMaterialCodes || []).includes(mat.code);
                  return (
                    <div
                      key={mat.code}
                      onClick={() => handleToggleMaterialAssignment(activeAssigningComp.id, mat.code)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                        isChecked
                          ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                          : 'hover:bg-slate-800/70 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
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
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-300">
                          Tồn: {mat.initialStock ?? 0} {mat.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-850 border-t border-slate-750 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAssigningCompartmentId(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition"
                >
                  Xong &amp; Đóng
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Thêm Khối Chức Năng / Kệ Mới */}
        {showAddEntityModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-850 border-b border-slate-750">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Thêm Khối Chức Năng / Kệ Vật Tư Mới</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddEntityModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">Mã Định Danh</label>
                    <input
                      type="text"
                      value={newEntityData.code}
                      onChange={(e) => setNewEntityData({ ...newEntityData, code: e.target.value.toUpperCase() })}
                      placeholder="KE-06, TDN-03, BAN-01..."
                      className="w-full px-3 py-1.5 font-mono bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">Loại Khối</label>
                    <select
                      value={newEntityData.type}
                      onChange={(e) => setNewEntityData({ ...newEntityData, type: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500"
                    >
                      <option value="SHELF_4_TIER">Kệ Sắt 5 Tầng</option>
                      <option value="TOOL_CABINET">Tủ Đồ Nghề Kỹ Thuật</option>
                      <option value="UPS_CABINET">Tủ Nguồn UPS</option>
                      <option value="BATTERY_RACK">Dàn Ắc Quy Dự Phòng</option>
                      <option value="DISTRIBUTION_BOARD">Tủ Điện Phân Phối (DB)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">Tên Hiển Thị</label>
                  <input
                    type="text"
                    value={newEntityData.name}
                    onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                    placeholder="KỆ VẬT TƯ SỐ 6..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">Nhãn Chuyên Mục</label>
                  <input
                    type="text"
                    value={newEntityData.categoryLabel}
                    onChange={(e) => setNewEntityData({ ...newEntityData, categoryLabel: e.target.value })}
                    placeholder="Vật tư dự phòng mở rộng..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-medium block mb-1">Tọa Độ Bản Vẽ 2D (X, Y, Rộng, Cao)</span>
                  <div className="grid grid-cols-4 gap-2 font-mono">
                    <div>
                      <label className="text-[9px] text-slate-500 block">X</label>
                      <input
                        type="number"
                        value={newEntityData.x}
                        onChange={(e) => setNewEntityData({ ...newEntityData, x: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Y</label>
                      <input
                        type="number"
                        value={newEntityData.y}
                        onChange={(e) => setNewEntityData({ ...newEntityData, y: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Rộng (W)</label>
                      <input
                        type="number"
                        value={newEntityData.width}
                        onChange={(e) => setNewEntityData({ ...newEntityData, width: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Cao (H)</label>
                      <input
                        type="number"
                        value={newEntityData.height}
                        onChange={(e) => setNewEntityData({ ...newEntityData, height: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400">
                  Mã QR định danh kệ tự động tạo: <span className="font-mono text-amber-300 font-bold">DNCT-WH-{newEntityData.code || 'KE-NEW'}</span>. Kệ mới sẽ tự khởi tạo 5 Tầng và các khay theo quy chuẩn.
                </div>
              </div>

              <div className="p-3.5 bg-slate-850 border-t border-slate-750 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddEntityModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewEntity}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow"
                >
                  Tạo Khối / Kệ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
