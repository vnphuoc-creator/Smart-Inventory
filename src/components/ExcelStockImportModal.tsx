import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Material } from '../types';
import { formatNumber, formatVND } from '../utils/inventoryEngine';
import { isNonMaterialOrCategoryRow } from '../utils/materialValidation';

interface ExcelStockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMaterials: Material[];
  onApplyStockUpdate: (updatedMaterials: Material[]) => void;
}

interface ParsedRow {
  code: string;
  name: string;
  unit: string;
  category: string;
  stock: number;
  unitPrice: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
  isExisting: boolean;
  originalStock: number;
  diffStock: number;
}

export const ExcelStockImportModal: React.FC<ExcelStockImportModalProps> = ({
  isOpen,
  onClose,
  currentMaterials,
  onApplyStockUpdate,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'STT': 1,
        'Mã Vật Tư (DN_*)': 'DN_VT_VOILA_01',
        'Tên & Quy Cách Vật Tư': 'Vòi chậu rửa cảm ứng TOTO TTLA102 + Hộp điều khiển & phụ kiện',
        'Đơn Vị Tính': 'Bộ',
        'Nhóm Phân Loại': 'Thiết bị vệ sinh & Xử lý nước',
        'Số Lượng Tồn Cuối Kỳ': 15,
        'Đơn Giá (VNĐ)': 6800000,
        'Tồn Tối Thiểu (Min)': 4,
        'Tồn Tối Đa (Max)': 40,
        'Vị Trí Kho': 'Kho Thiết Bị Vệ Sinh L1',
      },
      {
        'STT': 2,
        'Mã Vật Tư (DN_*)': 'DN_VT_XIPHO_02',
        'Tên & Quy Cách Vật Tư': 'Xiphong thoát nước chậu Lavabo TOTO TVLF403',
        'Đơn Vị Tính': 'Cái',
        'Nhóm Phân Loại': 'Thiết bị vệ sinh & Xử lý nước',
        'Số Lượng Tồn Cuối Kỳ': 22,
        'Đơn Giá (VNĐ)': 650000,
        'Tồn Tối Thiểu (Min)': 5,
        'Tồn Tối Đa (Max)': 50,
        'Vị Trí Kho': 'Kho Thiết Bị Vệ Sinh L1',
      },
      {
        'STT': 3,
        'Mã Vật Tư (DN_*)': 'DN_DD_CV_1_5_1',
        'Tên & Quy Cách Vật Tư': 'Dây điện đơn Cadivi CV-1.5mm2 (Màu Đỏ)',
        'Đơn Vị Tính': 'Mét',
        'Nhóm Phân Loại': 'Vật tư Điện & Phụ kiện tiêu hao',
        'Số Lượng Tồn Cuối Kỳ': 450,
        'Đơn Giá (VNĐ)': 8500,
        'Tồn Tối Thiểu (Min)': 50,
        'Tồn Tối Đa (Max)': 500,
        'Vị Trí Kho': 'Kệ Cáp Điện A1',
      },
      {
        'STT': 4,
        'Mã Vật Tư (DN_*)': 'DN_ON_PPR_PN20_D25',
        'Tên & Quy Cách Vật Tư': 'Ống nước nóng lạnh PPR Tiền Phong D25 PN20 (Cây 4m)',
        'Đơn Vị Tính': 'Cây',
        'Nhóm Phân Loại': 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
        'Số Lượng Tồn Cuối Kỳ': 38,
        'Đơn Giá (VNĐ)': 92000,
        'Tồn Tối Thiểu (Min)': 15,
        'Tồn Tối Đa (Max)': 120,
        'Vị Trí Kho': 'Kho Ống Nhựa K1',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BaoCao_XuatNhapTon');
    XLSX.writeFile(workbook, 'Mau_Import_VatTu_XuatNhapTon_AHT.xlsx');
  };

  const processFile = async (selectedFile: File) => {
    setLoading(true);
    setErrorMsg(null);
    setFile(selectedFile);
    setFileName(selectedFile.name);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Read raw 2D matrix to handle any title / metadata rows at the top
      const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!matrix || matrix.length === 0) {
        setErrorMsg('File Excel không có dữ liệu hoặc định dạng không hợp lệ.');
        setLoading(false);
        return;
      }

      // Step 1: Search for the true header row index in the first 20 rows
      let headerRowIdx = -1;
      let colCode = -1;
      let colName = -1;
      let colUnit = -1;
      let colCategory = -1;
      let colStock = -1;
      let colPrice = -1;
      let colMin = -1;
      let colMax = -1;
      let colLocation = -1;

      for (let r = 0; r < Math.min(20, matrix.length); r++) {
        const row = matrix[r];
        if (!Array.isArray(row)) continue;

        let detectedCode = -1;
        let detectedName = -1;
        let detectedUnit = -1;
        let detectedStock = -1;
        let detectedPrice = -1;
        let detectedCategory = -1;
        let detectedLocation = -1;
        let detectedMin = -1;
        let detectedMax = -1;

        row.forEach((cellVal, c) => {
          const str = String(cellVal || '').toLowerCase().trim();
          if (!str) return;

          // Code
          if (
            str === 'mã số' ||
            str === 'mã' ||
            str.includes('mã vật tư') ||
            str.includes('mã vt') ||
            str.includes('mã hàng') ||
            str.includes('mã hiệu') ||
            str.includes('ký hiệu') ||
            str === 'code' ||
            str === 'item code'
          ) {
            if (detectedCode === -1) detectedCode = c;
          }
          // Name
          else if (
            str === 'mặt hàng' ||
            str.includes('tên vật tư') ||
            str.includes('tên hàng') ||
            str.includes('tên & quy cách') ||
            str.includes('mô tả chung') ||
            str.includes('quy cách') ||
            str.includes('danh mục') ||
            str.includes('chủng loại') ||
            str === 'tên' ||
            str === 'name' ||
            str === 'description'
          ) {
            if (detectedName === -1) detectedName = c;
          }
          // Unit
          else if (
            str === 'đvt' ||
            str === 'dvt' ||
            str.includes('đơn vị tính') ||
            str === 'đơn vị' ||
            str === 'đv' ||
            str === 'unit'
          ) {
            if (detectedUnit === -1) detectedUnit = c;
          }
          // Stock (Cuối kỳ, tồn cuối, số lượng tồn...)
          else if (
            str.includes('cuối kỳ') ||
            str.includes('tồn cuối') ||
            str.includes('tồn kho') ||
            str.includes('tồn thực tế') ||
            str.includes('số lượng tồn') ||
            str === 'tồn' ||
            str === 'stock' ||
            (str.includes('số lượng') && !str.includes('nhập') && !str.includes('xuất') && !str.includes('đầu'))
          ) {
            if (detectedStock === -1) detectedStock = c;
          }
          // Unit Price
          else if (
            str.includes('đơn giá') ||
            str === 'giá' ||
            str === 'price' ||
            str === 'unit price'
          ) {
            if (detectedPrice === -1) detectedPrice = c;
          }
          // Category
          else if (
            str.includes('nhóm') ||
            str.includes('phân loại') ||
            str.includes('hạng mục') ||
            str === 'category'
          ) {
            if (detectedCategory === -1) detectedCategory = c;
          }
          // Location
          else if (
            str.includes('vị trí') ||
            str.includes('kho') ||
            str === 'location'
          ) {
            if (detectedLocation === -1) detectedLocation = c;
          }
          // Min / Max
          else if (str.includes('tối thiểu') || str === 'min') {
            detectedMin = c;
          } else if (str.includes('tối đa') || str === 'max') {
            detectedMax = c;
          }
        });

        // If we found at least (Name or Code) and (Stock or Unit or multiple columns)
        if ((detectedName !== -1 || detectedCode !== -1) && (detectedStock !== -1 || detectedUnit !== -1 || row.length >= 4)) {
          headerRowIdx = r;
          colCode = detectedCode;
          colName = detectedName;
          colUnit = detectedUnit;
          colStock = detectedStock;
          colPrice = detectedPrice;
          colCategory = detectedCategory;
          colLocation = detectedLocation;
          colMin = detectedMin;
          colMax = detectedMax;
          break;
        }
      }

      // If stock column wasn't explicitly found in header row (e.g. multi-tier header with "Cuối kỳ -> Số lượng")
      if (headerRowIdx !== -1 && colStock === -1 && headerRowIdx + 1 < matrix.length) {
        const subRow = matrix[headerRowIdx + 1];
        if (Array.isArray(subRow)) {
          subRow.forEach((subVal, scIdx) => {
            const subStr = String(subVal || '').toLowerCase().trim();
            if (subStr === 'sl' || subStr === 'số lượng') {
              colStock = scIdx;
            }
          });
        }
      }

      const rows: ParsedRow[] = [];
      const matMap = new Map<string, Material>();
      currentMaterials.forEach((m) => {
        matMap.set(m.code.toUpperCase().trim(), m);
        matMap.set(m.name.toLowerCase().trim(), m);
      });

      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

      for (let r = startRow; r < matrix.length; r++) {
        const row = matrix[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let rawCode = colCode !== -1 && row[colCode] !== undefined ? String(row[colCode]).trim() : '';
        let rawName = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : '';
        let rawUnit = colUnit !== -1 && row[colUnit] !== undefined ? String(row[colUnit]).trim() : '';
        let rawStockVal = colStock !== -1 && row[colStock] !== undefined ? row[colStock] : '';
        let rawPriceVal = colPrice !== -1 && row[colPrice] !== undefined ? row[colPrice] : '';
        let rawCategoryVal = colCategory !== -1 && row[colCategory] !== undefined ? row[colCategory] : '';
        let rawLocationVal = colLocation !== -1 && row[colLocation] !== undefined ? row[colLocation] : '';
        let rawMinVal = colMin !== -1 && row[colMin] !== undefined ? row[colMin] : '';
        let rawMaxVal = colMax !== -1 && row[colMax] !== undefined ? row[colMax] : '';

        // If no explicit columns were matched, auto-detect cell types in this row
        if (!rawCode && !rawName) {
          // Look for cell containing DN_
          const dnCell = row.find((c) => typeof c === 'string' && /^DN_[A-Za-z0-9_]+/i.test(c.trim()));
          if (dnCell) {
            rawCode = String(dnCell).trim();
          }

          // Look for longest non-numeric string as name
          let maxLen = 0;
          row.forEach((cell) => {
            const str = String(cell || '').trim();
            if (str.length > maxLen && !/^\d+([.,]\d+)?$/.test(str) && !str.startsWith('DN_')) {
              maxLen = str.length;
              rawName = str;
            }
          });
        }

        // Skip total / footer rows
        const isTotalRow =
          /^(tổng|tổng\s*cộng|cộng|bằng\s*chữ|stt|người\s*lập|phê\s*duyệt|ngày\s*\d+|kế\s*toán|thủ\s*kho|chữ\s*ký|đà\s*nẵng)/i.test(
            (rawName || '').trim()
          ) || /^(tổng|tổng\s*cộng|cộng)/i.test((rawCode || '').trim());
        if (isTotalRow) continue;

        // Check if this row is a section / category subtotal header (e.g. "Công cụ dụng cụ", "Vật tư tiêu hao", "Hóa chất", etc.)
        const isCategoryHeader =
          (!rawCode || rawCode.trim() === '') &&
          (!rawUnit || rawUnit.trim() === '') &&
          (/^(công cụ|dụng cụ|vật tư|hệ thống|nhóm|thiết bị|hóa chất|chiếu sáng|phụ tùng|bảo hộ|tiểu mục|hạng mục|phần|loại)/i.test(
            rawName.trim()
          ) ||
            rawName.trim().length <= 3);

        const isKnownCategoryName =
          /^(công cụ dụng cụ|vật tư điện|vật tư nước|vật tư phụ|vật tư cơ điện|hóa chất|thiết bị|công cụ|dụng cụ)/i.test(
            rawName.trim()
          ) &&
          (!rawCode || (!rawCode.startsWith('DN_') && !rawCode.startsWith('CD_')));

        if (isCategoryHeader || isKnownCategoryName || isNonMaterialOrCategoryRow({ name: rawName, code: rawCode, unit: rawUnit })) continue;

        // Must have either a valid Code OR a valid Name with a valid Unit
        const hasValidCode = rawCode && rawCode.trim().length >= 3 && !/^\d+$/.test(rawCode.trim());
        const hasValidUnit = rawUnit && rawUnit.trim().length >= 1;

        if (!hasValidCode && !hasValidUnit) {
          // Not a genuine material item row (e.g. empty line or summary separator)
          continue;
        }

        // Clean code & name
        if (rawCode || rawName) {
          let cleanCode = String(rawCode || '').trim().toUpperCase();

          // Try finding matched material
          let existing = matMap.get(cleanCode);
          if (!existing && rawName) {
            existing = matMap.get(rawName.toLowerCase().trim());
          }
          if (!existing) {
            // Check partial code match
            for (const [k, m] of matMap.entries()) {
              if (cleanCode && k === cleanCode) {
                existing = m;
                break;
              }
            }
          }

          if (!cleanCode) {
            cleanCode = existing ? existing.code : `DN_VT_IMP_${idxPad(rows.length + 1)}`;
          } else if (!cleanCode.startsWith('DN_') && !cleanCode.startsWith('CD_')) {
            cleanCode = `DN_${cleanCode}`;
          }

          // Parse numeric stock
          let stockNum = 0;
          if (rawStockVal !== '') {
            const cleanedStock = String(rawStockVal)
              .replace(/[,.](?=\d{3})/g, '')
              .replace(/,/g, '.')
              .replace(/[^0-9.-]/g, '');
            const parsedStock = parseFloat(cleanedStock);
            if (!isNaN(parsedStock)) stockNum = parsedStock;
          } else if (existing) {
            stockNum = existing.initialStock;
          }

          // Parse numeric price
          let priceNum = 0;
          if (rawPriceVal !== '') {
            const cleanedPrice = String(rawPriceVal).replace(/[^0-9]/g, '');
            const parsedPrice = parseFloat(cleanedPrice);
            if (!isNaN(parsedPrice)) priceNum = parsedPrice;
          }
          if (!priceNum && existing) priceNum = existing.unitPrice;

          const origStock = existing ? existing.initialStock : 0;

          rows.push({
            code: cleanCode,
            name: String(rawName || existing?.name || `Vật tư ${cleanCode}`),
            unit: String(rawUnit || existing?.unit || 'Cái'),
            category: String(rawCategoryVal || existing?.category || 'Vật tư Điện & Phụ kiện tiêu hao'),
            stock: stockNum,
            unitPrice: priceNum || (existing ? existing.unitPrice : 0),
            minStock: Number(rawMinVal) || existing?.minStock || 5,
            maxStock: Number(rawMaxVal) || existing?.maxStock || 100,
            location: String(rawLocationVal || existing?.location || 'Kho Tổng AHT'),
            isExisting: !!existing,
            originalStock: origStock,
            diffStock: stockNum - origStock,
          });
        }
      }

      if (rows.length === 0) {
        setErrorMsg('Không tìm thấy dòng vật tư hợp lệ trong file. Vui lòng kiểm tra lại sheet đầu tiên.');
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Lỗi khi đọc file Excel: ${err?.message || 'Định dạng file không hỗ trợ'}`);
    } finally {
      setLoading(false);
    }
  };

  function idxPad(n: number): string {
    return n < 10 ? `00${n}` : n < 100 ? `0${n}` : `${n}`;
  }

  const handleApply = () => {
    if (parsedRows.length === 0) return;

    const newMap = new Map<string, Material>();
    currentMaterials.forEach((m) => newMap.set(m.code.toUpperCase(), { ...m }));

    parsedRows.forEach((r, idx) => {
      const codeKey = r.code.toUpperCase();
      if (newMap.has(codeKey)) {
        const exist = newMap.get(codeKey)!;
        exist.initialStock = r.stock;
        if (r.unitPrice > 0) exist.unitPrice = r.unitPrice;
        if (r.unit) exist.unit = r.unit;
        if (r.name) exist.name = r.name;
        if (r.category) exist.category = r.category;
      } else {
        newMap.set(codeKey, {
          id: `mat_dn_imp_${Date.now()}_${idx}`,
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          specification: `Vật tư nhập tự động từ file ${fileName}`,
          location: r.location || 'Kho Tổng AHT',
          initialStock: r.stock,
          minStock: r.minStock || 5,
          maxStock: r.maxStock || 100,
          unitPrice: r.unitPrice,
          allocatedStaffEmails: ['hapham281@gmail.com', 'duykich1985@gmail.com'],
        });
      }
    });

    const updatedList = Array.from(newMap.values());
    onApplyStockUpdate(updatedList);
    setSuccessCount(parsedRows.length);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const matchedCount = parsedRows.filter((r) => r.isExisting).length;
  const newCount = parsedRows.filter((r) => !r.isExisting).length;
  const totalStockSum = parsedRows.reduce((sum, r) => sum + r.stock, 0);
  const totalValueSum = parsedRows.reduce((sum, r) => sum + r.stock * r.unitPrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import File Vật Tư & Cập Nhật Tồn Kho</h2>
              <p className="text-xs text-slate-400">
                Tự động đọc số lượng Xuất - Nhập - Tồn từ file Excel/CSV và đồng bộ dữ liệu vào hệ thống web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Action Row: Upload box & Download template */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Area */}
            <div className="md:col-span-2 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-5 bg-slate-850 flex flex-col items-center justify-center text-center transition-colors">
              <Upload className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-xs font-bold text-white mb-1">
                Kéo thả file Excel (.xlsx, .xls) hoặc .csv vào đây
              </span>
              <p className="text-[11px] text-slate-400 mb-3">
                Hệ thống tự động nhận dạng các cột Mã VT, Tên VT, Tồn cuối, Đơn giá...
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn File Từ Máy Tính</span>
              </button>
            </div>

            {/* Template Box */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block mb-1">Mẫu File Chuẩn</span>
                <p className="text-[11px] text-slate-400">
                  Tải file Excel mẫu có sẵn cấu trúc bảng cột chuẩn để điền số lượng tồn kho nhanh chóng.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tải Mẫu Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successCount !== null && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Đã cập nhật thành công {successCount} dòng vật tư vào hệ thống!</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tổng số dòng đọc được:</span>
                  <span className="text-sm font-bold text-white font-mono">{parsedRows.length} vật tư</span>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Mã khớp sẵn có:</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">{matchedCount} mã (Cập nhật)</span>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Mã mới bổ sung:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{newCount} mã mới</span>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tổng giá trị tồn mới:</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{formatVND(totalValueSum)}</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2 text-center w-10">STT</th>
                      <th className="p-2">Mã VT (DN_*)</th>
                      <th className="p-2">Tên & Quy Cách Vật Tư</th>
                      <th className="p-2 text-center w-16">ĐVT</th>
                      <th className="p-2 text-right">Tồn Cũ</th>
                      <th className="p-2 text-right">Tồn Mới (File)</th>
                      <th className="p-2 text-right">Đơn Giá</th>
                      <th className="p-2 text-center w-28">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/60 transition-colors">
                        <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-blue-400">{r.code}</td>
                        <td className="p-2 text-slate-200 truncate max-w-xs">{r.name}</td>
                        <td className="p-2 text-center text-slate-400">{r.unit}</td>
                        <td className="p-2 text-right font-mono text-slate-400">
                          {r.isExisting ? formatNumber(r.originalStock) : '-'}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-400">
                          {formatNumber(r.stock)}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          {formatNumber(r.unitPrice)}
                        </td>
                        <td className="p-2 text-center">
                          {r.isExisting ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Cập nhật tồn
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              + Mã mới
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || loading}
            onClick={handleApply}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span>Xác Nhận & Cập Nhật Lên Hệ Thống Web ({parsedRows.length} vật tư)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
