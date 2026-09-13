import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, QrCode, Layers, Check, Download, Info } from 'lucide-react';
import QRCode from 'qrcode';
import { WarehouseShelfEntity, WarehouseCompartment, Material } from '../types';

interface WarehouseQRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  entities: WarehouseShelfEntity[];
  initialShelfId?: string;
  initialCompartmentId?: string;
  materials: Material[];
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
  qrDataUrl: string;
  assignedMaterials: { code: string; name: string }[];
  note?: string;
}

export const WarehouseQRLabelModal: React.FC<WarehouseQRLabelModalProps> = ({
  isOpen,
  onClose,
  entities,
  initialShelfId,
  initialCompartmentId,
  materials,
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

  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'a4_sheet'>('standard');
  const [labels, setLabels] = useState<PrintableLabelItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  // Selected shelf
  const activeShelf = entities.find((e) => e.id === selectedShelfId) || entities[0];

  // All compartments of active shelf
  const shelfCompartments: { tierNum: number; tierLabel: string; comp: WarehouseCompartment }[] = [];
  (activeShelf?.tiers || []).forEach((t) => {
    (t.compartments || []).forEach((c) => {
      shelfCompartments.push({
        tierNum: t.tierNumber,
        tierLabel: t.label,
        comp: c,
      });
    });
  });

  // Ensure selectedCompId is valid
  useEffect(() => {
    if (shelfCompartments.length > 0 && !shelfCompartments.some((sc) => sc.comp.id === selectedCompId)) {
      setSelectedCompId(shelfCompartments[0].comp.id);
    }
  }, [selectedShelfId, shelfCompartments, selectedCompId]);

  // Generate QR Data URLs and build labels list
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    async function buildLabels() {
      const result: PrintableLabelItem[] = [];

      if (printScope === 'SINGLE_COMP') {
        const found = shelfCompartments.find((sc) => sc.comp.id === selectedCompId);
        if (found) {
          const qrVal = found.comp.qrCodeValue || `DNCT-WH-${found.comp.id}`;
          const qrData = await QRCode.toDataURL(qrVal, {
            width: 250,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });

          const assigned = (found.comp.assignedMaterialCodes || []).map((code) => {
            const m = materials.find((mat) => mat.code === code);
            return { code, name: m?.name || code };
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
            qrDataUrl: qrData,
            assignedMaterials: assigned,
            note: found.comp.description,
          });
        }
      } else if (printScope === 'SHELF_TIERS') {
        // All compartments in active shelf
        for (const sc of shelfCompartments) {
          const qrVal = sc.comp.qrCodeValue || `DNCT-WH-${sc.comp.id}`;
          const qrData = await QRCode.toDataURL(qrVal, {
            width: 220,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });

          const assigned = (sc.comp.assignedMaterialCodes || []).map((code) => {
            const m = materials.find((mat) => mat.code === code);
            return { code, name: m?.name || code };
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
            qrDataUrl: qrData,
            assignedMaterials: assigned,
            note: sc.comp.description,
          });
        }
      } else if (printScope === 'SHELF_HEADER') {
        // Big shelf identification header
        const qrVal = activeShelf.qrCodeValue || `DNCT-WH-SHELF-${activeShelf.code}`;
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
          qrDataUrl: qrData,
          assignedMaterials: [],
          note: `Kích thước: ${activeShelf.dimensions.lengthMm / 1000}m x ${activeShelf.dimensions.widthMm / 1000}m • 4 Tầng`,
        });
      } else if (printScope === 'ALL_WAREHOUSE') {
        // All compartments of all shelves
        for (const ent of entities) {
          for (const t of ent.tiers || []) {
            for (const comp of t.compartments || []) {
              const qrVal = comp.qrCodeValue || `DNCT-WH-${comp.id}`;
              const qrData = await QRCode.toDataURL(qrVal, {
                width: 220,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
              });

              const assigned = (comp.assignedMaterialCodes || []).map((code) => {
                const m = materials.find((mat) => mat.code === code);
                return { code, name: m?.name || code };
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
  }, [printScope, selectedShelfId, selectedCompId, entities, materials]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header - Screen only */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                In Tem Nhãn Mã QR Dán Kệ &amp; Khay Vật Tư
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chuẩn hóa định danh 5S • Dán trực tiếp lên khay nhựa, hộp quai đỏ và đầu kệ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating || labels.length === 0}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-lg transition"
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

        {/* Print Configuration Controls - Screen only */}
        <div className="print:hidden p-4 bg-slate-850/60 border-b border-slate-800 flex flex-wrap items-center gap-4 shrink-0 text-xs">
          {/* Scope Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-medium">Chế độ in:</span>
            <div className="inline-flex bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintScope('SINGLE_COMP')}
                className={`px-3 py-1 rounded-lg transition ${
                  printScope === 'SINGLE_COMP' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                1 Khay Cụ Thể
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('SHELF_TIERS')}
                className={`px-3 py-1 rounded-lg transition ${
                  printScope === 'SHELF_TIERS' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Cả Kệ ({activeShelf?.tiers?.length || 5} Tầng)
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('SHELF_HEADER')}
                className={`px-3 py-1 rounded-lg transition ${
                  printScope === 'SHELF_HEADER' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Tem Đầu Kệ Lớn
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('ALL_WAREHOUSE')}
                className={`px-3 py-1 rounded-lg transition ${
                  printScope === 'ALL_WAREHOUSE' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Toàn Bộ Kệ Vật Tư (Batch)
              </button>
            </div>
          </div>

          {/* Shelf Selector */}
          {printScope !== 'ALL_WAREHOUSE' && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Kệ:</span>
              <select
                value={selectedShelfId}
                onChange={(e) => setSelectedShelfId(e.target.value)}
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {entities
                  .filter((e) => e.type === 'SHELF_4_TIER')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.code})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Compartment Selector (if single mode) */}
          {printScope === 'SINGLE_COMP' && shelfCompartments.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Khay:</span>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 max-w-xs truncate"
              >
                {shelfCompartments.map((sc) => (
                  <option key={sc.comp.id} value={sc.comp.id}>
                    Tầng {sc.tierNum} • {sc.comp.code}: {sc.comp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Size Format */}
          <div className="flex items-center space-x-1.5 ml-auto">
            <span className="text-slate-400 font-medium">Khổ tem:</span>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="standard">Tiêu chuẩn (75mm x 50mm)</option>
              <option value="compact">Gọn dán khay (50mm x 35mm)</option>
              <option value="a4_sheet">Dàn trang Decal A4</option>
            </select>
          </div>
        </div>

        {/* Labels Preview & Printable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400">Đang tạo mã QR phân giải cao cho tem nhãn...</p>
            </div>
          ) : labels.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Info className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-sm">Không có tem nào để hiển thị trong phạm vi này.</p>
            </div>
          ) : (
            <div
              className={`grid gap-4 print:gap-3 ${
                labelSize === 'compact'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3'
                  : labelSize === 'a4_sheet'
                  ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
              }`}
            >
              {labels.map((item) => (
                <div
                  key={item.id}
                  className="bg-white text-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-md flex flex-col justify-between break-inside-avoid print:shadow-none print:border-black print:rounded-lg"
                  style={{ minHeight: labelSize === 'compact' ? '140px' : '175px' }}
                >
                  {/* Top Branding Bar */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-700 print:bg-black" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                        CẢNG HKQT ĐÀ NẴNG • NHÀ GA T2 • ĐNCT
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                      5S STANDARD
                    </span>
                  </div>

                  {/* Main Content: QR & Position Details */}
                  <div className="flex items-start space-x-3">
                    {/* QR Code */}
                    <div className="shrink-0 flex flex-col items-center bg-white p-1 border border-slate-300 rounded-lg">
                      <img
                        src={item.qrDataUrl}
                        alt={item.qrValue}
                        className={labelSize === 'compact' ? 'w-20 h-20' : 'w-24 h-24'}
                      />
                      <span className="text-[8px] font-mono font-bold text-slate-600 mt-1 max-w-[95px] truncate text-center">
                        {item.qrValue}
                      </span>
                    </div>

                    {/* Meta Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 text-[11px] font-bold text-blue-800 print:text-black">
                        <span>{item.shelfName}</span>
                        {item.tierNumber && <span>• TẦNG {item.tierNumber}</span>}
                      </div>

                      <div className="text-sm font-black text-slate-950 leading-tight mt-0.5">
                        {item.name}
                      </div>

                      {item.note && (
                        <div className="text-[10px] text-slate-600 mt-1 line-clamp-2 italic">
                          {item.note}
                        </div>
                      )}

                      {/* Sample / Assigned Materials preview */}
                      {item.assignedMaterials && item.assignedMaterials.length > 0 && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">
                            Vật tư định danh ({item.assignedMaterials.length}):
                          </span>
                          <div className="text-[10px] font-medium text-slate-800 line-clamp-2">
                            {item.assignedMaterials.map((m) => m.code).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer Bar */}
                  <div className="mt-2 pt-1.5 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] font-mono text-slate-500">
                    <span>MÃ VỊ TRÍ: <strong>{item.code}</strong></span>
                    <span>KHO VẬT TƯ THÔNG MINH</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info banner - Screen only */}
        <div className="print:hidden px-6 py-3 bg-slate-850 border-t border-slate-750 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>
              Tem nhãn được tối ưu cho máy in Decal nhiệt (Xprinter, HPRT, Brother) hoặc máy in laser A4 Decal bóc dán.
            </span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Tem Nhãn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
