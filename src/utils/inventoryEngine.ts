import {
  Material,
  Transaction,
  CalculatedMaterialStock,
  StockCardEntry,
  StockSummaryReportItem,
  NaturalSearchFilters,
  PurchaseProposal,
  ProposalReconciliation,
  ReconciledProposalItem,
} from '../types';

/**
 * Validates material code
 */
export function validateMaterialCode(code: string): { isValid: boolean; error?: string; normalized: string } {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Mã vật tư không được để trống', normalized: '' };
  }
  const trimmed = code.trim().toUpperCase().replace(/\s+/g, '_');
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Mã vật tư quá ngắn, vui lòng nhập mã chuẩn hóa (tối thiểu 3 ký tự)',
      normalized: trimmed,
    };
  }
  return { isValid: true, normalized: trimmed };
}

/**
 * Normalizes proposal numbers for robust matching across Vietnamese diacritics,
 * OCR variations, uppercase/lowercase, and separator characters.
 * E.g., "22-ĐNCT/PKT", "22-DNCT/PKT", "22-BNCT/PKT", "Tờ trình 22", "22/DNCT"
 */
export function normalizeProposalNumber(num?: string | null): string {
  if (!num) return '';
  return num
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, ''); // keep only alphanumerics
}

/**
 * Checks if two proposal numbers match, using flexible rules:
 * 1. Exact case-insensitive match
 * 2. Normalized match (removing accents, dashes, slashes, 'Đ' vs 'D')
 * 3. Primary numeric code matching (e.g. "27" in "27-DNCT/PKT", "27-ĐN/CT/PKT", "627/TTr-AHT")
 */
export function isProposalMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const strA = a.trim().toLowerCase();
  const strB = b.trim().toLowerCase();
  if (strA === strB) return true;

  const normA = normalizeProposalNumber(a);
  const normB = normalizeProposalNumber(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Extract primary digits (e.g., '27' from '27-DNCT/PKT' or '22' from '22-ĐNCT')
  const numA = (strA.match(/\b\d+\b/) || strA.match(/\d+/))?.[0]?.replace(/^0+/, '') || '';
  const numB = (strB.match(/\b\d+\b/) || strB.match(/\d+/))?.[0]?.replace(/^0+/, '') || '';

  if (numA && numB && numA === numB) {
    return true;
  }

  if (normA.includes(normB) || normB.includes(normA)) {
    // Avoid false positives if numbers are different (e.g. 2 vs 22)
    if (numA && numB && numA !== numB) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Checks if a transaction's warehouse matches the selected warehouse filter
 */
export function isWarehouseMatch(txWarehouse?: string | null, selectedWarehouse?: string | null): boolean {
  if (!selectedWarehouse || selectedWarehouse === 'ALL' || selectedWarehouse === 'Tất cả kho' || selectedWarehouse.startsWith('ALL')) {
    return true;
  }
  if (!txWarehouse) {
    return true;
  }
  const sel = selectedWarehouse.toLowerCase().trim();
  const txW = txWarehouse.toLowerCase().trim();
  if (txW === sel || txW.includes(sel) || sel.includes(txW)) return true;
  if (sel.includes('doidnct') && (txW.includes('điện nước') || txW.includes('doidnct'))) return true;
  if (sel.includes('tổng') && txW.includes('tổng')) return true;
  if (sel.includes('dự phòng') && txW.includes('dự phòng')) return true;
  return false;
}

/**
 * Format currency VNĐ with non-breaking spaces to avoid wrapping in tables/print
 */
export function formatVND(amount: number): string {
  const str = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
  return str.replace(/\s+/g, '\u00A0');
}

/**
 * Format number with comma and non-breaking spaces
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num || 0).replace(/\s+/g, '\u00A0');
}

/**
 * Formats YYYY-MM-DD or ISO string to DD/MM/YYYY
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('vi-VN');
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].slice(0, 2).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Real-time automatic inventory calculation
 * Tồn kho hiện tại = Tồn đầu kỳ + Tổng Nhập (đã duyệt) - Tổng Xuất (đã duyệt)
 */
export function calculateAllMaterialStocks(
  materials: Material[],
  transactions: Transaction[]
): CalculatedMaterialStock[] {
  // Extract all approved items
  const approvedTx = transactions.filter((t) => t.status === 'APPROVED');
  const pendingTx = transactions.filter((t) => t.status === 'PENDING');

  return materials.map((mat) => {
    const matCodeClean = mat.code?.trim().toUpperCase();
    let totalImported = 0;
    let totalExported = 0;
    let pendingImport = 0;
    let pendingExport = 0;

    // Calculate approved movements
    for (const tx of approvedTx) {
      for (const item of tx.items) {
        if (item.materialCode?.trim().toUpperCase() === matCodeClean) {
          if (tx.type === 'IMPORT') {
            totalImported += item.quantity;
          } else if (tx.type === 'EXPORT') {
            totalExported += item.quantity;
          }
        }
      }
    }

    // Calculate pending movements
    for (const tx of pendingTx) {
      for (const item of tx.items) {
        if (item.materialCode?.trim().toUpperCase() === matCodeClean) {
          if (tx.type === 'IMPORT') {
            pendingImport += item.quantity;
          } else if (tx.type === 'EXPORT') {
            pendingExport += item.quantity;
          }
        }
      }
    }

    const currentStock = (mat.initialStock || 0) + totalImported - totalExported;
    const availableStock = currentStock - pendingExport;
    const currentPrice = mat.unitPrice || 0;
    const totalValue = Math.max(0, currentStock) * currentPrice;

    let stockStatus: CalculatedMaterialStock['stockStatus'] = 'OPTIMAL';
    if (currentStock <= 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (currentStock <= (mat.minStock || 0)) {
      stockStatus = 'LOW_STOCK';
    } else if (currentStock >= (mat.maxStock || 1000)) {
      stockStatus = 'OVER_STOCK';
    }

    return {
      ...mat,
      totalImported,
      totalExported,
      currentStock,
      pendingImport,
      pendingExport,
      availableStock,
      totalValue,
      stockStatus,
    };
  });
}

/**
 * Generate Stock Card (Sổ Thẻ Kho) for a specific material with period & filter support
 */
export function generateStockCard(
  materialCode: string,
  materials: Material[],
  transactions: Transaction[],
  startDate?: string,
  endDate?: string,
  proposalNumber?: string,
  warehouse?: string
): StockCardEntry[] {
  if (!materialCode) return [];
  const cleanTargetCode = materialCode.trim().toUpperCase();
  const material = materials.find((m) => m.code?.trim().toUpperCase() === cleanTargetCode);
  if (!material) return [];

  const entries: StockCardEntry[] = [];
  const isSpecificProposal = Boolean(proposalNumber && proposalNumber !== 'ALL');

  // 1. Filter approved transactions containing this material with warehouse & proposal checks
  let relevantApprovedTx = transactions.filter((tx) => {
    if (tx.status !== 'APPROVED') return false;

    // Check if contains this material
    const hasMaterial = tx.items.some(
      (i) => i.materialCode?.trim().toUpperCase() === cleanTargetCode
    );
    if (!hasMaterial) return false;

    // Filter proposal
    if (isSpecificProposal) {
      const matchProposal =
        isProposalMatch(tx.proposalNumber, proposalNumber) ||
        tx.items.some(
          (i) =>
            i.materialCode?.trim().toUpperCase() === cleanTargetCode &&
            isProposalMatch(i.proposalNumber, proposalNumber)
        );
      if (!matchProposal) return false;
    }

    // Filter warehouse
    if (!isWarehouseMatch(tx.warehouse, warehouse)) {
      return false;
    }

    return true;
  });

  // Sort chronologically
  relevantApprovedTx = relevantApprovedTx.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 2. Calculate Opening Stock (Tồn đầu kỳ trước startDate)
  let openingQty = isSpecificProposal ? 0 : (material.initialStock || 0);

  if (startDate) {
    relevantApprovedTx.forEach((tx) => {
      if (tx.date < startDate) {
        tx.items.forEach((item) => {
          if (item.materialCode?.trim().toUpperCase() === cleanTargetCode) {
            if (isSpecificProposal && !isProposalMatch(item.proposalNumber || tx.proposalNumber, proposalNumber)) {
              return;
            }
            if (tx.type === 'IMPORT') {
              openingQty += item.quantity;
            } else if (tx.type === 'EXPORT') {
              openingQty -= item.quantity;
            }
          }
        });
      }
    });
  }

  let currentBalance = openingQty;
  const unitPrice = material.unitPrice || 0;

  // 3. Add Opening Balance entry (quantityIn = 0, quantityOut = 0 so it doesn't inflate import totals)
  entries.push({
    id: `card-init-${cleanTargetCode}`,
    date: startDate || '2026-08-01',
    documentCode: 'TON-DAU-KY',
    documentType: 'IMPORT',
    documentTitle: `Số dư tồn kho đầu kỳ ${startDate ? `(đến ${formatDisplayDate(startDate)})` : ''}`,
    partner: 'Kho vận nội bộ AHT',
    quantityIn: 0,
    quantityOut: 0,
    balance: currentBalance,
    unitPrice: unitPrice,
    amount: currentBalance * unitPrice,
    operator: 'Hệ thống tự động kết chuyển',
    notes: `Tồn lũy kế ban đầu: ${formatNumber(currentBalance)} ${material.unit}`,
  });

  // 4. Add transactions within period [startDate, endDate]
  for (const tx of relevantApprovedTx) {
    if (startDate && tx.date < startDate) continue;
    if (endDate && tx.date > endDate) continue;

    const matchingItems = tx.items.filter(
      (i) => i.materialCode?.trim().toUpperCase() === cleanTargetCode
    );
    if (matchingItems.length === 0) continue;

    for (const item of matchingItems) {
      if (isSpecificProposal && !isProposalMatch(item.proposalNumber || tx.proposalNumber, proposalNumber)) {
        continue;
      }

      const qtyIn = tx.type === 'IMPORT' ? item.quantity : 0;
      const qtyOut = tx.type === 'EXPORT' ? item.quantity : 0;
      currentBalance = currentBalance + qtyIn - qtyOut;

      const itemPrice = item.unitPrice > 0 ? item.unitPrice : unitPrice;
      const txAmount = (qtyIn || qtyOut) * itemPrice;

      entries.push({
        id: `card-${tx.id}-${cleanTargetCode}-${entries.length}`,
        date: tx.date,
        documentCode: tx.code,
        documentType: tx.type,
        documentTitle: tx.title || (tx.type === 'IMPORT' ? 'Phiếu Nhập Kho' : 'Phiếu Xuất Kho'),
        partner: tx.partner || (tx.type === 'IMPORT' ? 'Nhà cung cấp' : 'Đội thi công'),
        quantityIn: qtyIn,
        quantityOut: qtyOut,
        balance: currentBalance,
        unitPrice: itemPrice,
        amount: txAmount,
        operator: tx.approverName || tx.creatorName || 'Cán bộ quản lý kho',
        notes: tx.proposalNumber ? `Tờ trình: ${tx.proposalNumber} - ${tx.reason || ''}` : tx.reason,
      });
    }
  }

  return entries;
}

/**
 * Generate Summary Report Nhập - Xuất - Tồn
 */
export function generateStockSummaryReport(
  materials: Material[],
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): StockSummaryReportItem[] {
  const calculated = calculateAllMaterialStocks(materials, transactions);

  return calculated.map((item) => {
    // Filter transactions in range if specified
    const inRangeApprovedTx = transactions.filter((tx) => {
      if (tx.status !== 'APPROVED') return false;
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      return true;
    });

    let periodImportQty = 0;
    let periodExportQty = 0;

    for (const tx of inRangeApprovedTx) {
      for (const tItem of tx.items) {
        if (tItem.materialCode === item.code) {
          if (tx.type === 'IMPORT') periodImportQty += tItem.quantity;
          if (tx.type === 'EXPORT') periodExportQty += tItem.quantity;
        }
      }
    }

    const openingStock = item.initialStock;
    const openingValue = openingStock * item.unitPrice;
    const periodImportValue = periodImportQty * item.unitPrice;
    const periodExportValue = periodExportQty * item.unitPrice;
    const closingStock = item.currentStock;
    const closingValue = closingStock * item.unitPrice;

    return {
      materialCode: item.code,
      materialName: item.name,
      unit: item.unit,
      category: item.category,
      openingStock,
      openingValue,
      periodImportQty,
      periodImportValue,
      periodExportQty,
      periodExportValue,
      closingStock,
      closingValue,
      unitPrice: item.unitPrice,
    };
  });
}

/**
 * Natural Language Query Parser (Client-side fast matching)
 */
export function parseNaturalLanguageQuery(
  rawQuery: string,
  categories: string[]
): {
  filters: NaturalSearchFilters;
  explanation: string;
  matchedCountHint?: string;
} {
  const q = rawQuery.toLowerCase().trim();
  const filters: NaturalSearchFilters = {};
  const reasons: string[] = [];

  if (!q) {
    return { filters, explanation: 'Hiển thị tất cả vật tư' };
  }

  // Check code prefix / exact code
  if (q.includes('dn_') || q.includes('dn-')) {
    const codeMatch = q.match(/dn[_\-][a-z0-9_]+/i);
    if (codeMatch) {
      filters.searchKeyword = codeMatch[0].toUpperCase().replace('-', '_');
      reasons.push(`Lọc theo mã vật tư "${filters.searchKeyword}"`);
    }
  }

  // Stock status checks
  if (
    q.includes('hết hàng') ||
    q.includes('hết tồn') ||
    q.includes('bằng 0') ||
    q.includes('tồn 0')
  ) {
    filters.stockStatus = 'OUT_OF_STOCK';
    reasons.push('Lọc vật tư đã hết hàng (Tồn = 0)');
  } else if (
    q.includes('sắp hết') ||
    q.includes('dưới định mức') ||
    q.includes('cảnh báo') ||
    q.includes('thiếu hụt') ||
    q.includes('an toàn') ||
    q.includes('cần nhập') ||
    q.includes('bổ sung')
  ) {
    filters.stockStatus = 'LOW_STOCK';
    reasons.push('Lọc vật tư sắp hết (Dưới hoặc bằng định mức an toàn tối thiểu)');
  } else if (q.includes('dư thừa') || q.includes('tồn cao') || q.includes('vượt mức')) {
    filters.stockStatus = 'OVER_STOCK';
    reasons.push('Lọc vật tư tồn kho cao vượt định mức');
  }

  // Check category matches
  for (const cat of categories) {
    const catLower = cat.toLowerCase();
    const keywords = catLower.split(/[\s,&]+/);
    const hasMatch = keywords.some((k) => k.length > 2 && q.includes(k));
    if (hasMatch) {
      filters.category = cat;
      reasons.push(`Nhóm: "${cat}"`);
      break;
    }
  }

  // Check common material keywords if no category matched yet
  if (!filters.category) {
    if (q.includes('cáp') || q.includes('dây điện') || q.includes('cadivi') || q.includes('cxv')) {
      filters.category = 'Dây & Cáp điện lực hạ thế';
      reasons.push('Nhóm Dây & Cáp điện');
    } else if (q.includes('máy cắt') || q.includes('acb') || q.includes('mccb') || q.includes('contactor') || q.includes('tủ điện')) {
      filters.category = 'Thiết bị đóng cắt & Tủ điện';
      reasons.push('Nhóm Thiết bị đóng cắt');
    } else if (q.includes('van') || q.includes('khí nén') || q.includes('thủy lực') || q.includes('lọc')) {
      filters.category = 'Thiết bị khí nén & Thủy lực';
      reasons.push('Nhóm Khí nén & Thủy lực');
    } else if (q.includes('bulong') || q.includes('ty ren') || q.includes('ốc') || q.includes('kim khí')) {
      filters.category = 'Vật tư phụ & Kim khí';
      reasons.push('Nhóm Kim khí & Vật tư phụ');
    } else if (q.includes('bảo hộ') || q.includes('mũ') || q.includes('găng tay') || q.includes('an toàn')) {
      filters.category = 'Bảo hộ & An toàn lao động';
      reasons.push('Nhóm Bảo hộ lao động');
    } else if (q.includes('cảm biến') || q.includes('đồng hồ') || q.includes('đo lường')) {
      filters.category = 'Thiết bị đo lường & Cảm biến';
      reasons.push('Nhóm Thiết bị đo lường');
    } else if (q.includes('bạc đạn') || q.includes('vòng bi') || q.includes('curoa') || q.includes('dây đai')) {
      filters.category = 'Truyền động & Bạc đạn';
      reasons.push('Nhóm Truyền động & Bạc đạn');
    }
  }

  // General keyword fallback
  if (!filters.searchKeyword && !filters.stockStatus && !filters.category) {
    filters.searchKeyword = rawQuery.trim();
    reasons.push(`Tìm kiếm theo từ khóa "${rawQuery}"`);
  }

  return {
    filters,
    explanation: reasons.length > 0 ? reasons.join(' • ') : `Tìm kiếm "${rawQuery}"`,
  };
}
