import React, { useState } from 'react';
import {
  X,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Printer,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WarehouseShelfEntity, WarehouseCompartment, Material, CalculatedMaterialStock } from '../types';

interface TrayQuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelf: WarehouseShelfEntity;
  tierNumber: number;
  compartment: WarehouseCompartment;
  materials: Material[];
  calculatedStocks?: Record<string, CalculatedMaterialStock> | CalculatedMaterialStock[];
  onOpenCreateTransaction?: (type: 'IMPORT' | 'EXPORT', materialCode?: string, compId?: string) => void;
  onOpenPrintModal?: (shelfId: string, compId?: string) => void;
  onOpenFullMap?: (shelfCode: string) => void;
  onUpdateWarehouseEntities?: (updated: WarehouseShelfEntity[]) => void;
  allEntities?: WarehouseShelfEntity[];
  currentUser?: any;
}

export const TrayQuickActionModal: React.FC<TrayQuickActionModalProps> = ({
  isOpen,
  onClose,
  shelf,
  tierNumber,
  compartment,
  materials,
  calculatedStocks,
  onOpenCreateTransaction,
  onOpenPrintModal,
  onOpenFullMap,
  onUpdateWarehouseEntities,
  allEntities,
  currentUser,
}) => {
  if (!isOpen) return null;

  const isMasterAdmin =
    currentUser?.email === 'vn.phuoc235@gmail.com' ||
    currentUser?.role === 'ADMIN' ||
    (currentUser?.email || '').toLowerCase().includes('phuoc');

  const [searchAddMaterial, setSearchAddMaterial] = useState('');
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

  // Normalize calculated stock map
  const stockMap = React.useMemo(() => {
    const map = new Map<string, CalculatedMaterialStock>();
    if (!calculatedStocks) return map;
    if (Array.isArray(calculatedStocks)) {
      calculatedStocks.forEach((item) => {
        if (item?.code) map.set(item.code.trim().toUpperCase(), item);
      });
    } else if (typeof calculatedStocks === 'object') {
      Object.values(calculatedStocks).forEach((item) => {
        if (item?.code) map.set(item.code.trim().toUpperCase(), item);
      });
    }
    return map;
  }, [calculatedStocks]);

  // Real assigned materials
  const assignedCodes = compartment.assignedMaterialCodes || [];
  const assignedMaterials = React.useMemo(() => {
    return assignedCodes
      .map((code) => materials.find((m) => m.code === code))
      .filter(Boolean) as Material[];
  }, [assignedCodes, materials]);

  // Remove a material from this compartment
  const handleRemoveMaterial = (matCode: string) => {
    if (!allEntities || !onUpdateWarehouseEntities) return;
    const confirmRemove = window.confirm(
      `Bạn có chắc chắn muốn gỡ mã vật tư [${matCode}] khỏi khay [${compartment.name}]?`
    );
    if (!confirmRemove) return;

    const nextEntities = allEntities.map((ent) => {
      if (ent.id !== shelf.id) return ent;
      return {
        ...ent,
        tiers: (ent.tiers || []).map((t) => {
          if (t.tierNumber !== tierNumber) return t;
          return {
            ...t,
            compartments: (t.compartments || []).map((c) => {
              if (c.id !== compartment.id && c.code !== compartment.code) return c;
              return {
                ...c,
                assignedMaterialCodes: (c.assignedMaterialCodes || []).filter((code) => code !== matCode),
              };
            }),
          };
        }),
      };
    });

    onUpdateWarehouseEntities(nextEntities);
  };

  // Add a material to this compartment
  const handleAddMaterial = (matCode: string) => {
    if (!allEntities || !onUpdateWarehouseEntities) return;
    if (assignedCodes.includes(matCode)) {
      alert('Vật tư này đã có trong khay!');
      return;
    }

    const nextEntities = allEntities.map((ent) => {
      if (ent.id !== shelf.id) return ent;
      return {
        ...ent,
        tiers: (ent.tiers || []).map((t) => {
          if (t.tierNumber !== tierNumber) return t;
          return {
            ...t,
            compartments: (t.compartments || []).map((c) => {
              if (c.id !== compartment.id && c.code !== compartment.code) return c;
              return {
                ...c,
                assignedMaterialCodes: [...(c.assignedMaterialCodes || []), matCode],
              };
            }),
          };
        }),
      };
    });

    onUpdateWarehouseEntities(nextEntities);
    setSearchAddMaterial('');
    setIsAddingMaterial(false);
  };

  // Clear all dummy materials if needed
  const handleClearAllMaterials = () => {
    if (!allEntities || !onUpdateWarehouseEntities) return;
    const ok = window.confirm(
      `Xác nhận xóa TẤT CẢ (${assignedCodes.length}) vật tư trong khay [${compartment.name}]? Bạn sẽ có thể thêm lại đúng 1-2 vật tư thực tế.`
    );
    if (!ok) return;

    const nextEntities = allEntities.map((ent) => {
      if (ent.id !== shelf.id) return ent;
      return {
        ...ent,
        tiers: (ent.tiers || []).map((t) => {
          if (t.tierNumber !== tierNumber) return t;
          return {
            ...t,
            compartments: (t.compartments || []).map((c) => {
              if (c.id !== compartment.id && c.code !== compartment.code) return c;
              return {
                ...c,
                assignedMaterialCodes: [],
              };
            }),
          };
        }),
      };
    });

    onUpdateWarehouseEntities(nextEntities);
  };

  // Filter materials for search/add
  const availableMaterialsToAdd = React.useMemo(() => {
    if (!searchAddMaterial.trim()) return [];
    const q = searchAddMaterial.toLowerCase().trim();
    return materials
      .filter(
        (m) =>
          !assignedCodes.includes(m.code) &&
          (m.code.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            (m.specification && m.specification.toLowerCase().includes(q)))
      )
      .slice(0, 10);
  }, [materials, assignedCodes, searchAddMaterial]);

  const trayFullCode = compartment.qrCodeValue || `DNCT-WH-${shelf.code}-T${tierNumber}-${compartment.code}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-950/60 to-slate-900 border-b border-slate-700/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-600 text-white font-mono uppercase tracking-wider">
                  {shelf.code} • TẦNG {tierNumber}
                </span>
                <span className="text-[11px] font-semibold text-slate-300">
                  {compartment.code}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {compartment.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Quick Identification Badge */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Mã định danh tem QR khay (5S):</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{trayFullCode}</span>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPrintModal(shelf.id, compartment.id);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-sm text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Tem Khay Này</span>
                </button>
              )}
              {onOpenFullMap && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFullMap(shelf.code);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Vị Trí Bản Đồ</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Buttons for Mobile Warehouse Workers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (onOpenCreateTransaction) {
                  onOpenCreateTransaction('IMPORT', assignedMaterials[0]?.code, compartment.id);
                  onClose();
                }
              }}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition transform active:scale-98"
            >
              <ArrowDownToLine className="w-5 h-5" />
              <span>LẬP PHIẾU NHẬP KHO VÀO KHAY</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenCreateTransaction) {
                  onOpenCreateTransaction('EXPORT', assignedMaterials[0]?.code, compartment.id);
                  onClose();
                }
              }}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition transform active:scale-98"
            >
              <ArrowUpFromLine className="w-5 h-5" />
              <span>LẬP PHIẾU XUẤT KHO TỪ KHAY</span>
            </button>
          </div>

          {/* Materials in this Tray */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white uppercase tracking-wide">
                  Vật Tư Đang Lưu Trữ Tại Khay ({assignedMaterials.length} Mã):
                </span>
              </div>

              {/* Master Admin Controls */}
              {isMasterAdmin && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingMaterial(!isAddingMaterial)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm VT</span>
                  </button>
                  {assignedMaterials.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllMaterials}
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white transition font-semibold"
                      title="Xóa tất cả vật tư thừa để thiết lập lại chính xác"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Dọn dẹp</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Inline Add Material Search Box */}
            {isAddingMaterial && (
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2 animate-fadeIn">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã hoặc tên vật tư cần gán vào khay..."
                    value={searchAddMaterial}
                    onChange={(e) => setSearchAddMaterial(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                {searchAddMaterial.trim() && (
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {availableMaterialsToAdd.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-2">
                        Không tìm thấy vật tư phù hợp.
                      </p>
                    ) : (
                      availableMaterialsToAdd.map((m) => (
                        <div
                          key={m.code}
                          onClick={() => handleAddMaterial(m.code)}
                          className="p-2 bg-slate-900/80 hover:bg-blue-600/30 border border-slate-700/60 rounded-lg flex items-center justify-between cursor-pointer transition text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-amber-400 mr-2">{m.code}</span>
                            <span className="font-semibold text-white">{m.name}</span>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-bold">+ Chọn</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* List of Materials */}
            {assignedMaterials.length === 0 ? (
              <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Khay này hiện chưa có vật tư nào được gán.
                </p>
                {isMasterAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddingMaterial(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
                  >
                    + Bấm vào đây để chọn vật tư đưa vào khay này
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {assignedMaterials.map((mat, idx) => {
                  const calculated = stockMap.get(mat.code.toUpperCase());
                  const currentStock = calculated ? calculated.currentStock : mat.initialStock ?? 0;
                  const isLow = currentStock <= (mat.minStock || 0) && (mat.minStock || 0) > 0;
                  const isOut = currentStock <= 0;

                  return (
                    <div
                      key={mat.code}
                      className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-400">
                            {idx + 1}
                          </span>
                          <span className="font-mono font-bold text-xs text-amber-400">
                            {mat.code}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {mat.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 ml-7">
                          {mat.specification || 'Quy cách chuẩn'} • ĐVT: <strong>{mat.unit}</strong>
                        </div>
                      </div>

                      {/* Stock Badge & Actions */}
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
                            {isOut ? 'Hết hàng' : isLow ? 'Sắp hết' : 'Có sẵn'}
                          </div>
                        </div>

                        {onOpenCreateTransaction && (
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                onOpenCreateTransaction('IMPORT', mat.code, compartment.id);
                                onClose();
                              }}
                              className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition"
                              title="Nhập thêm vật tư này"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onOpenCreateTransaction('EXPORT', mat.code, compartment.id);
                                onClose();
                              }}
                              className="p-1.5 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white transition"
                              title="Xuất vật tư này"
                            >
                              <ArrowUpFromLine className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(mat.code)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-900/30 transition ml-1"
                            title="Gỡ vật tư này khỏi khay"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tiêu chuẩn 5S Nhà Ga T2 • Cảng HKQT Đà Nẵng</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
