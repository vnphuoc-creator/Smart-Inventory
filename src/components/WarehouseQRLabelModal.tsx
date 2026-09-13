import React, { useState, useEffect } from 'react';
import { X, Printer, Info, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { WarehouseShelfEntity, WarehouseCompartment, Material, CalculatedMaterialStock } from '../types';

interface WarehouseQRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  entities: WarehouseShelfEntity[];
  initialShelfId?: string;
  initialCompartmentId?: string;
  materials: Material[];
  calculatedStocks?: Record<string, CalculatedMaterialStock> | CalculatedMaterialStock[];
}

interface PrintableLabelItem {
  id: string;
  type: 'COMPARTMENT' | 'SHELF';
  shelfName: string;
  shelfCode: string;
  tierNumber?: number;
  tierLabel?: string;
  code: string;
  name: string;
  qrValue: string;
  qrDisplayCode: string;
  qrDataUrl: string;
  assignedMaterials: {
    code: string;
    name: string;
    specification?: string;
    unit?: string;
    currentStock?: number;
  }[];
  note?: string;
}

export const WarehouseQRLabelModal: React.FC<WarehouseQRLabelModalProps> = ({
  isOpen,
  onClose,
  entities,
  initialShelfId,
  initialCompartmentId,
  materials,
  calculatedStocks,
}) => {
  if (!isOpen) return null;

  const [printScope, setPrintScope] = useState<'SINGLE_COMP' | 'SHELF_TIERS' | 'SHELF_HEADER' | 'ALL_WAREHOUSE'>(
    initialCompartmentId ? 'SINGLE_COMP' : 'SHELF_TIERS'
  );

  const [selectedShelfId, setSelectedShelfId] = useState<string>(
    initialShelfId || entities[0]?.id || 'KE-01'
  );

  const [selectedCompId, setSelectedCompId] = useState<string>(
    initialCompartmentId || ''
  );

  const [labels, setLabels] = useState<PrintableLabelItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  // Stock Map
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

  // Selected shelf
  const activeShelf = entities.find((e) => e.id === selectedShelfId) || entities[0];

  // All compartments of active shelf
  const shelfCompartments: { tierNum: number; tierLabel: string; comp: WarehouseCompartment }[] = [];
  if (activeShelf?.tiers) {
    activeShelf.tiers.forEach((tier) => {
      (tier.compartments || []).forEach((comp) => {
        shelfCompartments.push({
          tierNum: tier.tierNumber,
          tierLabel: tier.label,
          comp,
        });
      });
    });
  }

  // Generate labels
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    async function buildLabels() {
      const result: PrintableLabelItem[] = [];

      if (printScope === 'SINGLE_COMP') {
        const found = shelfCompartments.find((sc) => sc.comp.id === selectedCompId);
        if (found) {
          const displayCode = found.comp.qrCodeValue || `DNCT-WH-${activeShelf.code}-T${found.tierNum}-${found.comp.code}`;
          // Build smartphone-scannable deep link
          const qrVal = baseUrl
            ? `${baseUrl}/?action=tray&tray=${encodeURIComponent(displayCode)}`
            : displayCode;

          const qrData = await QRCode.toDataURL(qrVal, {
            width: 280,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });

          const assigned = (found.comp.assignedMaterialCodes || []).map((code) => {
            const m = materials.find((mat) => mat.code === code);
            const stock = stockMap.get(code.toUpperCase());
            return {
              code,
              name: m?.name || code,
              specification: m?.specification || '',
              unit: m?.unit || '',
              currentStock: stock ? stock.currentStock : (m?.initialStock ?? 0),
            };
          });

          result.push({
            id: found.comp.id,
            type: 'COMPARTMENT',
            shelfName: activeShelf.name,
            shelfCode: activeShelf.code,
            tierNumber: found.tierNum,
            tierLabel: found.tierLabel,
            code: found.comp.code,
            name: found.comp.name,
            qrValue: qrVal,
            qrDisplayCode: displayCode,
            qrDataUrl: qrData,
            assignedMaterials: assigned,
            note: found.comp.description,
          });
        }
      } else if (printScope === 'SHELF_TIERS') {
        // All compartments in active shelf
        for (const sc of shelfCompartments) {
          const displayCode = sc.comp.qrCodeValue || `DNCT-WH-${activeShelf.code}-T${sc.tierNum}-${sc.comp.code}`;
          const qrVal = baseUrl
            ? `${baseUrl}/?action=tray&tray=${encodeURIComponent(displayCode)}`
            : displayCode;

          const qrData = await QRCode.toDataURL(qrVal, {
            width: 250,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });

          const assigned = (sc.comp.assignedMaterialCodes || []).map((code) => {
            const m = materials.find((mat) => mat.code === code);
            const stock = stockMap.get(code.toUpperCase());
            return {
              code,
              name: m?.name || code,
              specification: m?.specification || '',
              unit: m?.unit || '',
              currentStock: stock ? stock.currentStock : (m?.initialStock ?? 0),
            };
          });

          result.push({
            id: sc.comp.id,
            type: 'COMPARTMENT',
            shelfName: activeShelf.name,
            shelfCode: activeShelf.code,
            tierNumber: sc.tierNum,
            tierLabel: sc.tierLabel,
            code: sc.comp.code,
            name: sc.comp.name,
            qrValue: qrVal,
            qrDisplayCode: displayCode,
            qrDataUrl: qrData,
            assignedMaterials: assigned,
            note: sc.comp.description,
          });
        }
      } else if (printScope === 'SHELF_HEADER') {
        // Big shelf identification header
        const displayCode = activeShelf.qrCodeValue || `DNCT-WH-SHELF-${activeShelf.code}`;
        const qrVal = baseUrl
          ? `${baseUrl}/?action=shelf&shelf=${encodeURIComponent(activeShelf.code)}`
          : displayCode;

        const qrData = await QRCode.toDataURL(qrVal, {
          width: 320,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });

        result.push({
          id: activeShelf.id,
          type: 'SHELF',
          shelfName: activeShelf.name,
          shelfCode: activeShelf.code,
          code: activeShelf.code,
          name: `${activeShelf.name} (${activeShelf.categoryLabel})`,
          qrValue: qrVal,
          qrDisplayCode: displayCode,
          qrDataUrl: qrData,
          assignedMaterials: [],
          note: `Kích thước: ${activeShelf.dimensions.lengthMm / 1000}m x ${activeShelf.dimensions.widthMm / 1000}m`,
        });
      } else if (printScope === 'ALL_WAREHOUSE') {
        // All compartments of all shelves
        for (const ent of entities) {
          for (const t of ent.tiers || []) {
            for (const comp of t.compartments || []) {
              const displayCode = comp.qrCodeValue || `DNCT-WH-${ent.code}-T${t.tierNumber}-${comp.code}`;
              const qrVal = baseUrl
                ? `${baseUrl}/?action=tray&tray=${encodeURIComponent(displayCode)}`
                : displayCode;

              const qrData = await QRCode.toDataURL(qrVal, {
                width: 250,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
              });

              const assigned = (comp.assignedMaterialCodes || []).map((code) => {
                const m = materials.find((mat) => mat.code === code);
                const stock = stockMap.get(code.toUpperCase());
                return {
                  code,
                  name: m?.name || code,
                  specification: m?.specification || '',
                  unit: m?.unit || '',
                  currentStock: stock ? stock.currentStock : (m?.initialStock ?? 0),
                };
              });

              result.push({
                id: comp.id,
                type: 'COMPARTMENT',
                shelfName: ent.name,
                shelfCode: ent.code,
                tierNumber: t.tierNumber,
                tierLabel: t.label,
                code: comp.code,
                name: comp.name,
                qrValue: qrVal,
                qrDisplayCode: displayCode,
                qrDataUrl: qrData,
                assignedMaterials: assigned,
                note: comp.description,
              });
            }
          }
        }
      }

      if (!isCancelled) {
        setLabels(result);
        setIsGenerating(false);
      }
    }

    buildLabels();

    return () => {
      isCancelled = true;
    };
  }, [printScope, selectedShelfId, selectedCompId, entities, materials, stockMap]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[95vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header - Screen only */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <span>In Tem Nhãn Mã QR Dán Khay Vật Tư (Chuẩn 5S)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Mỗi khay có 1 mã QR riêng. Quét bằng camera điện thoại hoặc camera hệ thống để xuất / nhập tồn ngay.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating || labels.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay ({labels.length} Tem)</span>
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

        {/* Filter / Scope Toolbar - Screen only */}
        <div className="print:hidden p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold">Phạm vi in:</span>
            <button
              type="button"
              onClick={() => setPrintScope('SINGLE_COMP')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                printScope === 'SINGLE_COMP'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1 Khay Đang Chọn
            </button>
            <button
              type="button"
              onClick={() => setPrintScope('SHELF_TIERS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                printScope === 'SHELF_TIERS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Toàn Bộ Khay Của Kệ ({activeShelf?.code})
            </button>
            <button
              type="button"
              onClick={() => setPrintScope('SHELF_HEADER')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                printScope === 'SHELF_HEADER'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tem Biển Kệ Lớn
            </button>
            <button
              type="button"
              onClick={() => setPrintScope('ALL_WAREHOUSE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                printScope === 'ALL_WAREHOUSE'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tất Cả Khay Cả Kho
            </button>
          </div>

          {/* Selectors for single shelf / comp */}
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Chọn kệ:
              </label>
              <select
                value={selectedShelfId}
                onChange={(e) => {
                  setSelectedShelfId(e.target.value);
                  const s = entities.find((ent) => ent.id === e.target.value);
                  if (s?.tiers?.[0]?.compartments?.[0]) {
                    setSelectedCompId(s.tiers[0].compartments[0].id);
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {entities.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.code} - {ent.name}
                  </option>
                ))}
              </select>
            </div>

            {printScope === 'SINGLE_COMP' && (
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Chọn khay:
                </label>
                <select
                  value={selectedCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 max-w-[200px]"
                >
                  {shelfCompartments.map((sc) => (
                    <option key={sc.comp.id} value={sc.comp.id}>
                      T{sc.tierNum}-{sc.comp.code}: {sc.comp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Instruction Note */}
        <div className="print:hidden px-6 py-2.5 bg-blue-950/30 border-b border-blue-900/40 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              💡 <strong>Tiện ích quét thông minh:</strong> Mã QR in ra đã được mã hóa liên kết sâu. Dùng <strong>Camera điện thoại</strong> (hoặc Zalo/QR scanner) quét là máy tự động mở ứng dụng vào đúng khay này để Lập Phiếu Xuất/Nhập tức thì!
            </span>
          </div>
        </div>

        {/* Printable Labels Canvas */}
        <div className="flex-1 p-6 overflow-y-auto print:overflow-visible print:p-0 bg-slate-950 print:bg-white">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400">Đang kết xuất mã QR độ nét cao cho các khay...</p>
            </div>
          ) : labels.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Info className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-sm">Không tìm thấy khay nào để hiển thị trong phạm vi này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
              {labels.map((item) => (
                <div
                  key={item.id}
                  className="bg-white text-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-md flex flex-col justify-between break-inside-avoid print:shadow-none print:border-black print:rounded-lg"
                  style={{ minHeight: '190px' }}
                >
                  {/* Top Branding Bar */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-700 print:bg-black" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-950">
                        CẢNG HKQT ĐÀ NẴNG • NHÀ GA T2 • ĐNCT
                      </span>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-400">
                      TIÊU CHUẨN 5S
                    </span>
                  </div>

                  {/* Main Content: QR Code & Shelf Details */}
                  <div className="flex items-start space-x-3">
                    {/* Left: QR Code */}
                    <div className="shrink-0 flex flex-col items-center bg-white p-1 border border-slate-400 rounded-lg">
                      <img
                        src={item.qrDataUrl}
                        alt={item.qrDisplayCode}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                      />
                      <span className="text-[8px] font-mono font-bold text-slate-700 mt-1 max-w-[110px] truncate text-center block">
                        {item.qrDisplayCode}
                      </span>
                      <span className="text-[7.5px] font-semibold text-blue-700 print:text-black mt-0.5 text-center block">
                        📱 Quét bằng camera điện thoại
                      </span>
                    </div>

                    {/* Right: Shelf, Compartment & Assigned Materials */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 text-[11px] font-bold text-blue-900 print:text-black">
                        <span>{item.shelfName}</span>
                        {item.tierNumber && <span>• TẦNG {item.tierNumber}</span>}
                      </div>

                      <div className="text-sm font-black text-slate-950 leading-tight mt-0.5">
                        {item.name}
                      </div>

                      {/* Materials List Inside this Tray */}
                      <div className="mt-2 pt-1.5 border-t border-slate-300">
                        <div className="flex items-center justify-between text-[9px] font-black text-slate-700 uppercase tracking-wider mb-1">
                          <span>VẬT TƯ TRONG KHAY ({item.assignedMaterials.length} MÃ):</span>
                        </div>

                        {item.assignedMaterials.length === 0 ? (
                          <div className="text-[10px] italic text-slate-500 py-1">
                            (Khay chưa gán vật tư định danh)
                          </div>
                        ) : item.assignedMaterials.length <= 3 ? (
                          <div className="space-y-1">
                            {item.assignedMaterials.map((mat) => (
                              <div
                                key={mat.code}
                                className="p-1.5 bg-slate-50 border border-slate-300 rounded text-[10px] leading-snug"
                              >
                                <div className="font-mono font-black text-slate-950">
                                  {mat.code}
                                </div>
                                <div className="font-semibold text-slate-800">
                                  {mat.name}
                                </div>
                                {(mat.specification || mat.unit) && (
                                  <div className="text-[9px] text-slate-600 mt-0.5">
                                    {mat.specification ? `${mat.specification} • ` : ''}ĐVT: <strong>{mat.unit}</strong>
                                    {typeof mat.currentStock === 'number' && (
                                      <span className="ml-1 text-emerald-700 print:text-black font-bold">
                                        (Tồn: {mat.currentStock} {mat.unit})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="max-h-24 overflow-hidden border border-slate-300 rounded text-[9.5px]">
                            <table className="w-full text-left">
                              <thead className="bg-slate-100 border-b border-slate-300 text-[8.5px] font-bold text-slate-700">
                                <tr>
                                  <th className="p-1">Mã VT</th>
                                  <th className="p-1">Tên Vật Tư</th>
                                  <th className="p-1 text-right">ĐVT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.assignedMaterials.slice(0, 4).map((mat) => (
                                  <tr key={mat.code} className="border-b border-slate-200">
                                    <td className="p-1 font-mono font-bold text-slate-900">{mat.code}</td>
                                    <td className="p-1 font-medium truncate max-w-[120px]">{mat.name}</td>
                                    <td className="p-1 text-right">{mat.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {item.assignedMaterials.length > 4 && (
                              <div className="text-[8.5px] text-slate-500 text-center py-0.5 bg-slate-50">
                                +{item.assignedMaterials.length - 4} vật tư khác...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Bar */}
                  <div className="mt-2 pt-1.5 border-t border-dashed border-slate-400 flex items-center justify-between text-[9px] font-mono text-slate-600">
                    <span>MÃ KHAY: <strong>{item.code}</strong></span>
                    <span>HỆ THỐNG KHO THÔNG MINH ĐNCT</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions - Screen only */}
        <div className="print:hidden px-6 py-3 bg-slate-850 border-t border-slate-750 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Tem được thiết kế theo kích thước chuẩn Decal dán khay. Hỗ trợ máy in tem nhiệt Decal và giấy A4 Decal.
            </span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow"
          >
            <Printer className="w-4 h-4" />
            <span>In Tem Nhãn Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
