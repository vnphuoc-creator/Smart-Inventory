import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Link2,
  ClipboardList,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Download,
  Filter,
  Search,
  Layers,
  Database,
  Check,
  X,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Material, User } from '../types';
import { ALL_MATERIAL_CATEGORIES } from '../data/materialsData';
import {
  classifyMaterialCategory,
  findExistingMaterialMatch,
  generateNextMaterialCode,
  standardizeUnit,
} from '../utils/materialClassifier';
import { formatNumber, formatVND } from '../utils/inventoryEngine';

interface SmartMaterialImportSectionProps {
  currentUser: User;
  currentMaterials: Material[];
  onApplyMaterialsUpdate: (updatedMaterials: Material[]) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export type ImportSourceType = 'EXCEL' | 'WORD' | 'IMAGE' | 'GOOGLE_SHEET' | 'PASTE_TEXT';

export interface ParsedImportItem {
  id: string;
  code: string;
  name: string;
  specification: string;
  unit: string;
  category: string;
  initialStock: number;
  unitPrice: number;
  minStock: number;
  maxStock: number;
  location: string;
  isExisting: boolean;
  matchedCode?: string;
  matchedName?: string;
  matchReason?: 'EXACT_CODE' | 'EXACT_NAME' | 'SIMILAR_NAME';
  selected: boolean;
  isCustomCategory?: boolean;
}

export const SmartMaterialImportSection: React.FC<SmartMaterialImportSectionProps> = ({
  currentUser,
  currentMaterials,
  onApplyMaterialsUpdate,
  onShowToast,
}) => {
  const [sourceType, setSourceType] = useState<ImportSourceType>('EXCEL');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File upload state
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');

  // Parsed Items State
  const [parsedItems, setParsedItems] = useState<ParsedImportItem[]>([]);
  const [isProcessed, setIsProcessed] = useState(false);

  // Filter & Search in Preview
  const [viewFilter, setViewFilter] = useState<'ALL' | 'NEW_ONLY' | 'EXISTING_ONLY'>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');

  // Import options
  const [skipExisting, setSkipExisting] = useState(true); // Default true per user request: if exists, do not add
  const [updateStockForExisting, setUpdateStockForExisting] = useState(false);

  // File input refs
  const excelFileRef = useRef<HTMLInputElement>(null);
  const wordFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  // Summary counts
  const totalCount = parsedItems.length;
  const newCount = useMemo(() => parsedItems.filter((i) => !i.isExisting).length, [parsedItems]);
  const existingCount = useMemo(() => parsedItems.filter((i) => i.isExisting).length, [parsedItems]);
  const selectedCount = useMemo(() => parsedItems.filter((i) => i.selected).length, [parsedItems]);

  // Filtered list for display
  const displayedItems = useMemo(() => {
    return parsedItems.filter((item) => {
      if (viewFilter === 'NEW_ONLY' && item.isExisting) return false;
      if (viewFilter === 'EXISTING_ONLY' && !item.isExisting) return false;
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase().trim();
        const inCode = item.code.toLowerCase().includes(q);
        const inName = item.name.toLowerCase().includes(q);
        const inCat = item.category.toLowerCase().includes(q);
        const inUnit = item.unit.toLowerCase().includes(q);
        if (!inCode && !inName && !inCat && !inUnit) return false;
      }
      return true;
    });
  }, [parsedItems, viewFilter, previewSearch]);

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        'STT': 1,
        'Mã Vật Tư (Tùy chọn)': 'DN_VT_VOILA_01',
        'Tên & Quy Cách Vật Tư': 'Vòi chậu rửa cảm ứng TOTO TTLA102 + Hộp điều khiển',
        'Đơn Vị Tính': 'Bộ',
        'Nhóm Ngành Hàng (Tùy chọn)': 'Thiết bị vệ sinh & Xử lý nước',
        'Số Lượng Tồn Ban Đầu': 12,
        'Đơn Giá (VNĐ)': 6800000,
        'Vị Trí Kho': 'Kho Thiết Bị Vệ Sinh',
      },
      {
        'STT': 2,
        'Mã Vật Tư (Tùy chọn)': 'DN_DD_CV_2_5',
        'Tên & Quy Cách Vật Tư': 'Dây điện đơn Cadivi CV-2.5mm2 (Màu Vàng)',
        'Đơn Vị Tính': 'Mét',
        'Nhóm Ngành Hàng (Tùy chọn)': 'Vật tư Điện & Phụ kiện tiêu hao',
        'Số Lượng Tồn Ban Đầu': 350,
        'Đơn Giá (VNĐ)': 12500,
        'Vị Trí Kho': 'Kệ Dây Cáp A2',
      },
      {
        'STT': 3,
        'Mã Vật Tư (Tùy chọn)': 'DN_ONG_PPR_D32',
        'Tên & Quy Cách Vật Tư': 'Ống cấp nước nóng lạnh PPR Tiền Phong D32 PN20 (Cây 4m)',
        'Đơn Vị Tính': 'Cây',
        'Nhóm Ngành Hàng (Tùy chọn)': 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
        'Số Lượng Tồn Ban Đầu': 45,
        'Đơn Giá (VNĐ)': 115000,
        'Vị Trí Kho': 'Kho Ống Nước K1',
      },
      {
        'STT': 4,
        'Mã Vật Tư (Tùy chọn)': 'DN_DEN_PANEL_6060',
        'Tên & Quy Cách Vật Tư': 'Đèn LED Panel 600x600 48W Rạng Đông Ánh sáng trắng 6500K',
        'Đơn Vị Tính': 'Bộ',
        'Nhóm Ngành Hàng (Tùy chọn)': 'Hệ thống Chiếu sáng & Đèn công trình',
        'Số Lượng Tồn Ban Đầu': 28,
        'Đơn Giá (VNĐ)': 420000,
        'Vị Trí Kho': 'Kệ Đèn Chiếu Sáng',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Muc_Vat_Tu');
    XLSX.writeFile(workbook, 'Mau_Import_VatTu_AHT.xlsx');
    onShowToast?.('Đã tải xuống file Excel mẫu chuẩn AHT.', 'success');
  };

  // Process raw extracted items into formatted deduplicated parsed items
  const processExtractedItems = (
    rawList: Array<{
      name: string;
      code?: string;
      unit?: string;
      category?: string;
      initialStock?: number;
      unitPrice?: number;
      minStock?: number;
      maxStock?: number;
      location?: string;
      specification?: string;
    }>
  ) => {
    if (!rawList || rawList.length === 0) {
      setErrorMessage('Không tìm thấy dòng vật tư nào hợp lệ trong dữ liệu được cung cấp.');
      setLoading(false);
      return;
    }

    const workingExisting = [...currentMaterials];
    const results: ParsedImportItem[] = [];

    rawList.forEach((raw, idx) => {
      const name = (raw.name || '').trim();
      if (!name || name.length < 2) return;

      const spec = (raw.specification || '').trim();
      const unit = standardizeUnit(raw.unit || '');

      // 1. Auto Category Classification if not explicitly provided or invalid
      let category = raw.category?.trim() || '';
      if (!category || !ALL_MATERIAL_CATEGORIES.includes(category)) {
        category = classifyMaterialCategory(name, spec);
      }

      // 2. Check Deduplication against current warehouse materials
      const matchResult = findExistingMaterialMatch(
        { code: raw.code, name, unit },
        workingExisting
      );

      let finalCode = (raw.code || '').trim().toUpperCase();
      let isExisting = false;
      let matchedCode = undefined;
      let matchedName = undefined;
      let matchReason = undefined;

      if (matchResult.isMatch && matchResult.matchedMaterial) {
        isExisting = true;
        matchedCode = matchResult.matchedMaterial.code;
        matchedName = matchResult.matchedMaterial.name;
        matchReason = matchResult.matchReason;
        finalCode = matchResult.matchedMaterial.code;
        // Keep category from matched existing material if exists
        category = matchResult.matchedMaterial.category || category;
      } else {
        // If code was not provided in the import data, generate a new sequential AHT code
        if (!finalCode) {
          finalCode = generateNextMaterialCode(
            category,
            [...workingExisting, ...results.map((r) => ({ code: r.code } as Material))],
            name
          );
        }
      }

      const initialStock = Number(raw.initialStock) >= 0 ? Number(raw.initialStock) : 0;
      const unitPrice = Number(raw.unitPrice) >= 0 ? Number(raw.unitPrice) : 0;
      const minStock = Number(raw.minStock) > 0 ? Number(raw.minStock) : 5;
      const maxStock = Number(raw.maxStock) > 0 ? Number(raw.maxStock) : Math.max(50, initialStock * 2);
      const location =
        (raw.location || '').trim() ||
        (category.includes('Điện')
          ? 'Kho Điện'
          : category.includes('vệ sinh')
          ? 'Kho Thiết Bị Vệ Sinh'
          : category.includes('Đường ống')
          ? 'Kho Ống Nước'
          : 'Kho Tổng');

      results.push({
        id: `import-${Date.now()}-${idx}`,
        code: finalCode,
        name,
        specification: spec,
        unit,
        category,
        initialStock,
        unitPrice,
        minStock,
        maxStock,
        location,
        isExisting,
        matchedCode,
        matchedName,
        matchReason,
        selected: true,
      });
    });

    if (results.length === 0) {
      setErrorMessage('Không nhận diện được vật tư nào. Vui lòng kiểm tra lại cấu trúc file hoặc nội dung.');
    } else {
      setParsedItems(results);
      setIsProcessed(true);
      setErrorMessage(null);
      onShowToast?.(
        `Đã bóc tách thành công ${results.length} vật tư (${results.filter((r) => !r.isExisting).length} vật tư mới).`,
        'success'
      );
    }

    setLoading(false);
  };

  // Helper unit and code detection routines
  const KNOWN_UNITS_SET = new Set([
    'cái', 'cai', 'bộ', 'bo', 'mét', 'met', 'm', 'm.', 'cây', 'cay', 'cuộn', 'cuon',
    'hộp', 'hop', 'thùng', 'thung', 'bình', 'binh', 'chai', 'can', 'bao', 'kg', 'kilo',
    'lít', 'lit', 'l', 'tấm', 'tam', 'sợi', 'soi', 'đôi', 'doi', 'cặp', 'cap',
    'gói', 'goi', 'bịch', 'bich', 'ống', 'ong', 'viên', 'vien', 'quả', 'qua',
    'lon', 'thanh', 'hạt', 'hat', 'chiếc', 'chiec', 'dây', 'day', 'set', 'roll',
    'box', 'ctn', 'pcs', 'pc', 'ea'
  ]);

  const isKnownUnitValue = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    const str = String(val).trim().toLowerCase();
    if (!str || str.length > 15) return false;
    return (
      KNOWN_UNITS_SET.has(str) ||
      str.startsWith('mét') ||
      str.startsWith('cây') ||
      str.startsWith('cuộn') ||
      str.startsWith('thùng') ||
      str.startsWith('hộp') ||
      str.startsWith('cái') ||
      str.startsWith('bộ') ||
      str.startsWith('ống')
    );
  };

  const isProbableMaterialCodeValue = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    const str = String(val).trim().toUpperCase();
    if (str.length < 3 || str.length > 40) return false;
    if (/^\d+$/.test(str)) return false; // Pure number is index/count
    if (isKnownUnitValue(str)) return false;
    if (/^(DN_|VT_|TB_|DEN_|ONG_|VS_|DD_|CV_|CXV_|MCB_|MCCB_|LED_|PPR_|HDPE_|PVC_)/i.test(str)) return true;
    if (
      /^[A-Z0-9_\-\.]{3,30}$/.test(str) &&
      (str.includes('_') || str.includes('-') || (/\d/.test(str) && /[A-Z]/.test(str)))
    ) {
      return true;
    }
    return false;
  };

  const isProbableSTTValue = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    const str = String(val).trim();
    return /^\d{1,5}$/.test(str);
  };

  // Unified Intelligent Tabular Matrix Parser for Excel, Google Sheets, TSV, and Pasted text
  const parseTabularMatrix = (matrix: any[][]) => {
    if (!matrix || matrix.length === 0) return [];

    let colCode = -1;
    let colName = -1;
    let colUnit = -1;
    let colCategory = -1;
    let colStock = -1;
    let colPrice = -1;
    let colLocation = -1;
    let colSpec = -1;
    let headerRowIdx = -1;

    // Phase 1: Header detection in top 25 rows
    for (let r = 0; r < Math.min(25, matrix.length); r++) {
      const row = matrix[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      let dCode = -1;
      let dName = -1;
      let dUnit = -1;
      let dCat = -1;
      let dStock = -1;
      let dPrice = -1;
      let dLoc = -1;
      let dSpec = -1;

      row.forEach((cell, c) => {
        const str = String(cell || '').toLowerCase().trim();
        if (!str) return;

        // Code header detection
        if (
          str.includes('mã vt') ||
          str.includes('mã vật tư') ||
          str.includes('mã sản phẩm') ||
          str.includes('mã sp') ||
          str.includes('mã hàng') ||
          str === 'mã số' ||
          str === 'mã' ||
          str === 'code' ||
          str === 'sku' ||
          str === 'item code'
        ) {
          if (dCode === -1) dCode = c;
        }
        // Name header detection (e.g. TÊN SẢN PHẨM, Tên vật tư, Tên hàng, Mặt hàng)
        else if (
          str.includes('tên sản phẩm') ||
          str.includes('tên vật tư') ||
          str.includes('tên hàng') ||
          str.includes('mặt hàng') ||
          str.includes('tên & quy cách') ||
          str.includes('tên hàng hóa') ||
          str.includes('quy cách vật tư') ||
          str.includes('sản phẩm') ||
          str === 'tên' ||
          str === 'name' ||
          str === 'item name' ||
          str.includes('danh mục')
        ) {
          if (dName === -1) dName = c;
        }
        // Unit header detection (ĐƠN VỊ, ĐVT, DVT, Đơn vị tính, Unit)
        else if (
          str === 'đvt' ||
          str === 'dvt' ||
          str === 'đv' ||
          str.includes('đơn vị tính') ||
          str.includes('đơn vị') ||
          str === 'unit' ||
          str === 'uom'
        ) {
          if (dUnit === -1) dUnit = c;
        }
        // Category header
        else if (
          str.includes('nhóm') ||
          str.includes('ngành hàng') ||
          str.includes('phân loại') ||
          str.includes('loại vật tư') ||
          str.includes('loại hàng') ||
          str === 'category'
        ) {
          if (dCat === -1) dCat = c;
        }
        // Stock header
        else if (
          str.includes('số lượng') ||
          str.includes('tồn') ||
          str.includes('cuối kỳ') ||
          str.includes('tồn đầu') ||
          str === 'sl' ||
          str === 'qty' ||
          str === 'stock'
        ) {
          if (dStock === -1) dStock = c;
        }
        // Price header
        else if (
          str.includes('đơn giá') ||
          str.includes('giá tiền') ||
          str.includes('thành tiền') ||
          str === 'giá' ||
          str === 'price' ||
          str === 'cost'
        ) {
          if (dPrice === -1) dPrice = c;
        }
        // Location header
        else if (str.includes('vị trí') || str.includes('kho') || str === 'location') {
          if (dLoc === -1) dLoc = c;
        }
        // Specification header
        else if (
          str.includes('quy cách') ||
          str.includes('thông số') ||
          str.includes('kỹ thuật') ||
          str === 'spec' ||
          str === 'specification'
        ) {
          if (dSpec === -1) dSpec = c;
        }
      });

      // Valid header match found
      if (dName !== -1 || (dCode !== -1 && dUnit !== -1) || (dCode !== -1 && dName !== -1)) {
        headerRowIdx = r;
        colCode = dCode;
        colName = dName;
        colUnit = dUnit;
        colCategory = dCat;
        colStock = dStock;
        colPrice = dPrice;
        colLocation = dLoc;
        colSpec = dSpec;
        break;
      }
    }

    // Phase 2: Heuristic column profiling if headers are missing or ambiguous
    const startScan = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    const sampleRows = matrix.slice(startScan, startScan + 40).filter((r) => Array.isArray(r) && r.length > 0);

    if (sampleRows.length > 0) {
      const maxCols = Math.max(...sampleRows.map((r) => r.length));
      const colStats = Array.from({ length: maxCols }, () => ({
        codeMatches: 0,
        unitMatches: 0,
        sttMatches: 0,
        textMatches: 0,
      }));

      sampleRows.forEach((row) => {
        row.forEach((cell, c) => {
          const val = String(cell || '').trim();
          if (!val) return;
          if (isProbableMaterialCodeValue(val)) colStats[c].codeMatches++;
          if (isKnownUnitValue(val)) colStats[c].unitMatches++;
          if (isProbableSTTValue(val)) colStats[c].sttMatches++;
          if (
            val.length > 3 &&
            isNaN(Number(val)) &&
            !isProbableMaterialCodeValue(val) &&
            !isKnownUnitValue(val)
          ) {
            colStats[c].textMatches++;
          }
        });
      });

      if (colCode === -1) {
        let bestCodeIdx = -1;
        let maxCode = 0;
        colStats.forEach((st, c) => {
          if (c !== colName && c !== colUnit && st.codeMatches > maxCode) {
            maxCode = st.codeMatches;
            bestCodeIdx = c;
          }
        });
        if (bestCodeIdx !== -1 && maxCode >= 1) {
          colCode = bestCodeIdx;
        }
      }

      if (colUnit === -1) {
        let bestUnitIdx = -1;
        let maxUnit = 0;
        colStats.forEach((st, c) => {
          if (c !== colName && c !== colCode && st.unitMatches > maxUnit) {
            maxUnit = st.unitMatches;
            bestUnitIdx = c;
          }
        });
        if (bestUnitIdx !== -1 && maxUnit >= 1) {
          colUnit = bestUnitIdx;
        }
      }

      if (colName === -1) {
        let bestNameIdx = -1;
        let maxName = 0;
        colStats.forEach((st, c) => {
          if (c !== colCode && c !== colUnit && st.textMatches > maxName) {
            maxName = st.textMatches;
            bestNameIdx = c;
          }
        });
        if (bestNameIdx !== -1) {
          colName = bestNameIdx;
        }
      }
    }

    // Phase 3: Row extraction
    const rawExtracted: Array<{
      name: string;
      code?: string;
      unit?: string;
      category?: string;
      initialStock?: number;
      unitPrice?: number;
      location?: string;
      specification?: string;
    }> = [];

    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

    for (let r = startRow; r < matrix.length; r++) {
      const row = matrix[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const nonBlank = row.filter((c) => String(c || '').trim() !== '');
      if (nonBlank.length === 0) continue;

      let rawName = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : '';
      let rawCode = colCode !== -1 && row[colCode] !== undefined ? String(row[colCode]).trim() : '';
      let rawUnit = colUnit !== -1 && row[colUnit] !== undefined ? String(row[colUnit]).trim() : '';
      let rawCat = colCategory !== -1 && row[colCategory] !== undefined ? String(row[colCategory]).trim() : '';
      let rawStock = colStock !== -1 && row[colStock] !== undefined ? parseFloat(String(row[colStock]).replace(/[^0-9.-]/g, '')) || 0 : 0;
      let rawPrice = colPrice !== -1 && row[colPrice] !== undefined ? parseFloat(String(row[colPrice]).replace(/[^0-9.-]/g, '')) || 0 : 0;
      let rawLocation = colLocation !== -1 && row[colLocation] !== undefined ? String(row[colLocation]).trim() : '';
      let rawSpec = colSpec !== -1 && row[colSpec] !== undefined ? String(row[colSpec]).trim() : '';

      // Positional pattern fallback when unaligned
      if (!rawName || !rawCode || !rawUnit) {
        const cells = row.map((c) => String(c || '').trim()).filter(Boolean);
        if (cells.length >= 4 && isProbableSTTValue(cells[0])) {
          // [STT, Tên sản phẩm, Mã vật tư, Đơn vị] -> Exactly user's format!
          if (!rawName) rawName = cells[1];
          if (!rawCode) rawCode = cells[2];
          if (!rawUnit) rawUnit = cells[3];
        } else if (cells.length === 3) {
          if (isProbableMaterialCodeValue(cells[1]) && isKnownUnitValue(cells[2])) {
            // [Tên, Mã, Đơn vị]
            if (!rawName) rawName = cells[0];
            if (!rawCode) rawCode = cells[1];
            if (!rawUnit) rawUnit = cells[2];
          } else if (isProbableMaterialCodeValue(cells[0]) && isKnownUnitValue(cells[2])) {
            // [Mã, Tên, Đơn vị]
            if (!rawCode) rawCode = cells[0];
            if (!rawName) rawName = cells[1];
            if (!rawUnit) rawUnit = cells[2];
          }
        }
      }

      // Per-row safety cross-check:
      // If rawUnit holds a material code and rawCode is empty or invalid
      if (isProbableMaterialCodeValue(rawUnit) && !isProbableMaterialCodeValue(rawCode)) {
        rawCode = rawUnit;
        rawUnit = 'Cái';
      }

      // If rawName holds a code and rawCode holds the name
      if (isProbableMaterialCodeValue(rawName) && rawCode && !isProbableMaterialCodeValue(rawCode)) {
        const tmp = rawName;
        rawName = rawCode;
        rawCode = tmp;
      }

      // Fallback: Find name from row if still empty
      if (!rawName || rawName.length < 2) {
        let longestText = '';
        row.forEach((cell) => {
          const s = String(cell || '').trim();
          if (
            s.length > longestText.length &&
            !isProbableMaterialCodeValue(s) &&
            !isKnownUnitValue(s) &&
            isNaN(Number(s))
          ) {
            longestText = s;
          }
        });
        if (longestText.length >= 2) {
          rawName = longestText;
        }
      }

      // Skip header repetitions or empty lines
      if (!rawName || rawName.length < 2 || isProbableSTTValue(rawName)) continue;
      const lowerName = rawName.toLowerCase();
      if (
        lowerName === 'tên sản phẩm' ||
        lowerName === 'tên vật tư' ||
        lowerName === 'mã vật tư' ||
        lowerName === 'đơn vị tính'
      ) {
        continue;
      }

      rawExtracted.push({
        name: rawName,
        code: rawCode,
        unit: rawUnit || 'Cái',
        category: rawCat,
        initialStock: rawStock,
        unitPrice: rawPrice,
        location: rawLocation,
        specification: rawSpec || rawName,
      });
    }

    return rawExtracted;
  };

  // --- HANDLER 1: EXCEL / CSV IMPORT ---
  const handleProcessExcel = async (file: File) => {
    setLoading(true);
    setLoadingStep('Đang đọc cấu trúc bảng tính Excel...');
    setErrorMessage(null);
    setSelectedFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!matrix || matrix.length === 0) {
        setErrorMessage('File Excel không chứa dữ liệu.');
        setLoading(false);
        return;
      }

      setLoadingStep('Đang nhận diện các cột dữ liệu & phân loại ngành hàng...');
      const rawExtracted = parseTabularMatrix(matrix);
      processExtractedItems(rawExtracted);
    } catch (err: any) {
      setErrorMessage(`Lỗi đọc file Excel: ${err?.message || 'Không thể xử lý'}`);
      setLoading(false);
    }
  };

  // --- HANDLER 2: WORD (.DOCX) IMPORT ---
  const handleProcessWord = async (file: File) => {
    setLoading(true);
    setLoadingStep('Đang trích xuất văn bản & bảng biểu từ file Word (.docx)...');
    setErrorMessage(null);
    setSelectedFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer: buffer });
      const fullText = rawTextResult.value || '';

      if (!fullText.trim()) {
        setErrorMessage('File Word không chứa văn bản.');
        setLoading(false);
        return;
      }

      setLoadingStep('Đang dùng AI bóc tách danh mục vật tư & phân loại nhóm ngành hàng...');

      // Call AI endpoint to extract & classify
      const response = await fetch('/api/ai/scan-import-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileText: fullText,
          fileType: 'word',
          categories: ALL_MATERIAL_CATEGORIES,
        }),
      });

      if (!response.ok) {
        throw new Error(`Máy chủ AI phản hồi mã lỗi ${response.status}`);
      }

      const data = await response.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        processExtractedItems(data.items);
      } else {
        // Fallback: Parse lines
        const lines = fullText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 3);
        const matrix = lines.map((l) => l.split(/\t|\|/).map((p) => p.trim()));
        const rawExtracted = parseTabularMatrix(matrix);
        processExtractedItems(rawExtracted);
      }
    } catch (err: any) {
      setErrorMessage(`Lỗi phân tích file Word: ${err?.message || 'Không thể xử lý'}`);
      setLoading(false);
    }
  };

  // --- HANDLER 3: IMAGE / INVOICE / OCR IMPORT ---
  const handleProcessImage = async (file: File) => {
    setLoading(true);
    setLoadingStep('Đang đọc ảnh & chuẩn bị gửi AI Vision OCR...');
    setErrorMessage(null);
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      setImagePreviewUrl(base64Data);

      try {
        setLoadingStep('AI Vision đang quét hình ảnh, bóc tách bảng vật tư & phân loại ngành hàng...');
        const response = await fetch('/api/ai/scan-import-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            fileType: 'image',
            categories: ALL_MATERIAL_CATEGORIES,
          }),
        });

        if (!response.ok) {
          throw new Error(`Lỗi máy chủ AI Vision: ${response.status}`);
        }

        const data = await response.json();
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          processExtractedItems(data.items);
        } else {
          setErrorMessage('AI không nhận diện được vật tư nào trong ảnh. Vui lòng đảm bảo ảnh chụp rõ nét bảng kê hoặc hóa đơn.');
          setLoading(false);
        }
      } catch (err: any) {
        setErrorMessage(`Lỗi quét ảnh: ${err?.message || 'Không thể kết nối AI Vision'}`);
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- HANDLER 4: GOOGLE SHEETS IMPORT ---
  const handleProcessGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      setErrorMessage('Vui lòng nhập đường link Google Sheet (ví dụ: https://docs.google.com/spreadsheets/d/.../edit)');
      return;
    }

    setLoading(true);
    setLoadingStep('Đang kết nối và tải dữ liệu từ Google Sheets...');
    setErrorMessage(null);
    setSelectedFileName('Google Sheet Online');

    try {
      const response = await fetch('/api/ai/fetch-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: googleSheetUrl }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải Google Sheet');
      }

      setLoadingStep('Đang phân tích bảng tính và phân loại ngành hàng...');
      const workbook = XLSX.read(data.csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      const rawExtracted = parseTabularMatrix(matrix);
      processExtractedItems(rawExtracted);
    } catch (err: any) {
      setErrorMessage(`Lỗi tải Google Sheet: ${err?.message || 'Vui lòng kiểm tra quyền chia sẻ công khai của bảng tính'}`);
      setLoading(false);
    }
  };

  // --- HANDLER 5: DIRECT PASTE TEXT / TSV ---
  const handleProcessPastedText = async () => {
    if (!pastedText.trim()) {
      setErrorMessage('Vui lòng dán nội dung bảng danh mục vật tư vào ô bên dưới.');
      return;
    }

    setLoading(true);
    setLoadingStep('Đang phân tích định dạng văn bản & dán bảng...');
    setErrorMessage(null);
    setSelectedFileName('Dữ liệu bảng dán trực tiếp');

    try {
      const lines = pastedText.trim().split('\n');
      const matrix: string[][] = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        let parts: string[] = [];
        if (trimmed.includes('\t')) {
          parts = trimmed.split('\t');
        } else if (trimmed.includes('|')) {
          parts = trimmed.split('|').filter((p) => p.trim());
        } else if (trimmed.includes(';')) {
          parts = trimmed.split(';');
        } else if (trimmed.includes(',')) {
          parts = trimmed.split(',');
        } else {
          parts = [trimmed];
        }
        matrix.push(parts.map((p) => p.trim()));
      });

      const rawExtracted = parseTabularMatrix(matrix);

      if (rawExtracted.length > 0) {
        processExtractedItems(rawExtracted);
      } else {
        // Fallback to AI parser
        const response = await fetch('/api/ai/scan-import-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileText: pastedText,
            fileType: 'text',
            categories: ALL_MATERIAL_CATEGORIES,
          }),
        });
        const data = await response.json();
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          processExtractedItems(data.items);
        } else {
          setErrorMessage('Không nhận diện được cấu trúc vật tư từ nội dung đã dán.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(`Lỗi xử lý văn bản: ${err?.message || 'Không thể bóc tách'}`);
      setLoading(false);
    }
  };

  // Toggle selection for item
  const handleToggleSelectItem = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    const areAllSelected = displayedItems.every((i) => i.selected);
    const displayedIds = new Set(displayedItems.map((i) => i.id));
    setParsedItems((prev) =>
      prev.map((item) => {
        if (displayedIds.has(item.id)) {
          return { ...item, selected: !areAllSelected };
        }
        return item;
      })
    );
  };

  // Change category of item in preview
  const handleChangeCategory = (id: string, newCat: string) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            category: newCat,
            isCustomCategory: true,
          };
        }
        return item;
      })
    );
  };

  // Update item field in preview
  const handleUpdateItemField = (id: string, field: keyof ParsedImportItem, value: any) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // --- FINAL CONFIRMATION & APPLY TO WAREHOUSE ---
  const handleApplyImport = () => {
    const selectedItems = parsedItems.filter((i) => i.selected);

    if (selectedItems.length === 0) {
      onShowToast?.('Vui lòng chọn ít nhất một dòng vật tư để nạp vào kho.', 'error');
      return;
    }

    let addedNewCount = 0;
    let updatedExistingCount = 0;
    let skippedCount = 0;

    const workingMaterials = [...currentMaterials];

    selectedItems.forEach((item) => {
      if (item.isExisting) {
        if (skipExisting && !updateStockForExisting) {
          skippedCount++;
          return; // Skip existing per user instruction
        }

        // If user enabled stock update for existing
        if (updateStockForExisting) {
          const idx = workingMaterials.findIndex(
            (m) => m.code.toUpperCase() === item.code.toUpperCase()
          );
          if (idx >= 0) {
            workingMaterials[idx] = {
              ...workingMaterials[idx],
              initialStock: item.initialStock > 0 ? item.initialStock : workingMaterials[idx].initialStock,
              unitPrice: item.unitPrice > 0 ? item.unitPrice : workingMaterials[idx].unitPrice,
              location: item.location || workingMaterials[idx].location,
              updatedAt: new Date().toISOString(),
            };
            updatedExistingCount++;
          }
        }
      } else {
        // Create new Material
        const newMaterial: Material = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          code: item.code,
          name: item.name,
          category: item.category,
          unit: item.unit,
          specification: item.specification || item.name,
          location: item.location || 'Kho Tổng',
          initialStock: item.initialStock,
          minStock: item.minStock,
          maxStock: item.maxStock,
          unitPrice: item.unitPrice,
          allocatedStaffEmails: [],
          updatedAt: new Date().toISOString(),
        };

        workingMaterials.unshift(newMaterial);
        addedNewCount++;
      }
    });

    onApplyMaterialsUpdate(workingMaterials);

    let summaryMsg = '';
    if (addedNewCount > 0) {
      summaryMsg += `Đã thêm ${addedNewCount} vật tư mới và tự động phân loại đúng ngành hàng. `;
    }
    if (updatedExistingCount > 0) {
      summaryMsg += `Đã cập nhật ${updatedExistingCount} vật tư hiện có. `;
    }
    if (skippedCount > 0) {
      summaryMsg += `Đã giữ nguyên/bỏ qua ${skippedCount} vật tư đã có trong kho.`;
    }

    onShowToast?.(summaryMsg || 'Đã đồng bộ dữ liệu vật tư thành công.', 'success');

    // Reset view
    setIsProcessed(false);
    setParsedItems([]);
    setSelectedFileName('');
    setImagePreviewUrl(null);
    setPastedText('');
    setGoogleSheetUrl('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Import Vật Tư Đa Năng Thông Minh (AI &amp; Auto-Categorize)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập danh mục từ Excel, Word (.docx), Ảnh hóa đơn/bảng kê, Google Sheet hoặc văn bản dán. Tự động kiểm tra trùng lặp và phân loại chính xác vào 5 nhóm ngành hàng AHT.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadExcelTemplate}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Tải File Excel Mẫu AHT</span>
        </button>
      </div>

      {/* Step 1: Select Import Source Tab if not processed */}
      {!isProcessed && (
        <div className="space-y-5">
          {/* Source Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              onClick={() => {
                setSourceType('EXCEL');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                sourceType === 'EXCEL'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Excel / CSV</span>
            </button>

            <button
              onClick={() => {
                setSourceType('WORD');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                sourceType === 'WORD'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Word (.docx)</span>
            </button>

            <button
              onClick={() => {
                setSourceType('IMAGE');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                sourceType === 'IMAGE'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Hình Ảnh / Hóa Đơn</span>
            </button>

            <button
              onClick={() => {
                setSourceType('GOOGLE_SHEET');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                sourceType === 'GOOGLE_SHEET'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Link2 className="w-5 h-5" />
              <span>Google Sheet</span>
            </button>

            <button
              onClick={() => {
                setSourceType('PASTE_TEXT');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                sourceType === 'PASTE_TEXT'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span>Dán Bảng / Chữ</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Không thể xử lý dữ liệu:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* SOURCE 1: EXCEL */}
          {sourceType === 'EXCEL' && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-center">
              <input
                type="file"
                ref={excelFileRef}
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessExcel(file);
                }}
                className="hidden"
              />
              <div
                onClick={() => excelFileRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Nhấp để chọn file Excel (.xlsx, .xls) hoặc CSV
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Hỗ trợ tự động nhận diện cột: Mã VT, Tên & Quy cách, ĐVT, Số lượng tồn, Đơn giá, Vị trí kho.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Chọn File Từ Máy Tính
                </button>
              </div>
            </div>
          )}

          {/* SOURCE 2: WORD (.DOCX) */}
          {sourceType === 'WORD' && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-center">
              <input
                type="file"
                ref={wordFileRef}
                accept=".docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessWord(file);
                }}
                className="hidden"
              />
              <div
                onClick={() => wordFileRef.current?.click()}
                className="border-2 border-dashed border-blue-500/40 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/10 rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Nhấp để chọn file Word (.docx) Tờ trình / Đề xuất
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Hệ thống sẽ tự động bóc tách các bảng vật tư bên trong tài liệu Word và phân loại ngành hàng thông minh.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  Chọn File Word (.docx)
                </button>
              </div>
            </div>
          )}

          {/* SOURCE 3: IMAGE / OCR */}
          {sourceType === 'IMAGE' && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <input
                type="file"
                ref={imageFileRef}
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessImage(file);
                }}
                className="hidden"
              />
              <div
                onClick={() => imageFileRef.current?.click()}
                className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center gap-3 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Tải lên Ảnh Hóa Đơn, Bảng Kê hoặc Tờ Trình (AI Vision OCR)
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Gemini AI Vision sẽ nhận diện chữ in, quét bảng biểu, chuẩn hóa tên gọi và gán đúng nhóm ngành hàng.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Chụp Hoặc Chọn Ảnh
                </button>
              </div>
            </div>
          )}

          {/* SOURCE 4: GOOGLE SHEETS */}
          {sourceType === 'GOOGLE_SHEET' && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Nhập Đường Link Chia Sẻ Google Sheet:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none placeholder-slate-500 font-mono"
                  />
                  <button
                    onClick={handleProcessGoogleSheet}
                    disabled={loading || !googleSheetUrl.trim()}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/30 flex items-center gap-2 shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Nạp Dữ Liệu</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  * Bảng tính cần được bật quyền "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with the link can view).
                </p>
              </div>
            </div>
          )}

          {/* SOURCE 5: PASTE TEXT */}
          {sourceType === 'PASTE_TEXT' && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Dán Dữ Liệu Bảng (Excel Copy) hoặc Danh Sách Vật Tư:
                </label>
                <textarea
                  rows={6}
                  placeholder={`Ví dụ sao chép từ Excel hoặc văn bản:
DN_VT_VOILA_01\tVòi chậu rửa cảm ứng TOTO TTLA102\tBộ\t12\t6800000
Dây điện đơn Cadivi CV-2.5mm2 Màu Vàng\tMét\t350\t12500
Ống nước nóng PPR D32 Tiền Phong\tCây\t45\t115000`}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-4 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl text-xs text-white focus:outline-none placeholder-slate-500 font-mono"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleProcessPastedText}
                    disabled={loading || !pastedText.trim()}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Phân Tích &amp; Nhận Diện</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-center animate-in fade-in">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Đang Xử Lý Dữ Liệu Thông Minh</h4>
                <p className="text-xs text-slate-400">{loadingStep || 'Vui lòng chờ trong giây lát...'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: PREVIEW & VERIFICATION TABLE */}
      {isProcessed && (
        <div className="space-y-5 animate-in fade-in">
          {/* Status Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Tổng Vật Tư Nhận Diện</span>
                <span className="text-xl font-extrabold text-white font-mono">{totalCount}</span>
              </div>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-bold block">Vật Tư MỚI (Chưa có trong kho)</span>
                <span className="text-xl font-extrabold text-emerald-300 font-mono">{newCount}</span>
              </div>
              <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold block">Vật Tư ĐÃ CÓ (Trùng mã/tên)</span>
                <span className="text-xl font-extrabold text-amber-300 font-mono">{existingCount}</span>
              </div>
              <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Smart Rule Controls (User requirements) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Quy tắc xử lý trùng lặp &amp; cập nhật kho:
              </h4>
              <p className="text-[11px] text-slate-400">
                Hệ thống tự động phân loại đúng nhóm ngành hàng. Bạn có thể chọn quy tắc áp dụng bên dưới.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
                />
                <span className="text-xs text-slate-300 font-semibold">
                  Chỉ thêm vật tư MỚI vào kho (Bỏ qua vật tư đã có)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateStockForExisting}
                  onChange={(e) => setUpdateStockForExisting(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900"
                />
                <span className="text-xs text-slate-400">
                  Cập nhật số lượng tồn cho vật tư đã có
                </span>
              </label>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => setViewFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất cả ({totalCount})
              </button>
              <button
                onClick={() => setViewFilter('NEW_ONLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewFilter === 'NEW_ONLY'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                Chỉ Vật Tư MỚI ({newCount})
              </button>
              <button
                onClick={() => setViewFilter('EXISTING_ONLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewFilter === 'EXISTING_ONLY'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                Chỉ Vật Tư ĐÃ CÓ ({existingCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo mã, tên, ngành hàng..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none w-56"
                />
              </div>

              <button
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                {displayedItems.every((i) => i.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
          </div>

          {/* Table of Parsed Items */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={displayedItems.length > 0 && displayedItems.every((i) => i.selected)}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-700 bg-slate-900"
                      />
                    </th>
                    <th className="p-3 w-28">Trạng Thái</th>
                    <th className="p-3 w-36">Mã Vật Tư</th>
                    <th className="p-3 min-w-[220px]">Tên &amp; Quy Cách Vật Tư</th>
                    <th className="p-3 min-w-[220px]">Nhóm Ngành Hàng (AI Phân Loại)</th>
                    <th className="p-3 w-20 text-center">ĐVT</th>
                    <th className="p-3 w-24 text-right">Tồn Đầu</th>
                    <th className="p-3 w-28 text-right">Đơn Giá</th>
                    <th className="p-3 w-28">Vị Trí Kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                        Không có vật tư nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    displayedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-900/60 transition ${
                          !item.selected ? 'opacity-40 bg-slate-950' : item.isExisting ? 'bg-amber-950/10' : 'bg-emerald-950/10'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleSelectItem(item.id)}
                            className="w-4 h-4 rounded text-emerald-600 border-slate-700 bg-slate-900"
                          />
                        </td>

                        <td className="p-3">
                          {item.isExisting ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                              <Database className="w-3 h-3" />
                              Đã Có Trong Kho
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                              <Sparkles className="w-3 h-3" />
                              Vật Tư MỚI
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleUpdateItemField(item.id, 'code', e.target.value.toUpperCase())}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItemField(item.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                          />
                          {item.matchedName && item.matchedName !== item.name && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Khớp với: {item.matchedName}
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <select
                            value={item.category}
                            onChange={(e) => handleChangeCategory(item.id, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-blue-300 focus:outline-none focus:border-blue-500 font-medium"
                          >
                            {ALL_MATERIAL_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItemField(item.id, 'unit', e.target.value)}
                            className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-center text-slate-300 focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={item.initialStock}
                            onChange={(e) => handleUpdateItemField(item.id, 'initialStock', parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-right font-mono text-white focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItemField(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-right font-mono text-amber-300 focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleUpdateItemField(item.id, 'location', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                setIsProcessed(false);
                setParsedItems([]);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Hủy &amp; Chọn Lại File Khác
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Đã chọn <strong className="text-white">{selectedCount}</strong> vật tư
              </span>
              <button
                onClick={handleApplyImport}
                disabled={selectedCount === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Nạp Vào Kho &amp; Cập Nhật Danh Mục</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
