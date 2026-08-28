import { Material, Transaction, PurchaseProposal, ProposalReconciliation, ReconciledProposalItem } from '../types';

/**
 * Chuẩn hóa số hiệu tờ trình để so khớp thông minh, chống sai lệch dấu tiếng Việt, ký tự đặc biệt
 */
export function normalizeProposalNumber(num?: string | null): string {
  if (!num) return '';
  return num
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, ''); // Giữ lại chữ và số
}

/**
 * Kiểm tra 2 số tờ trình có khớp nhau không (Hỗ trợ đối soát đa đợt)
 */
export function isProposalMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const strA = a.trim().toLowerCase();
  const strB = b.trim().toLowerCase();
  if (strA === strB) return true;

  const normA = normalizeProposalNumber(a);
  const normB = normalizeProposalNumber(b);
  if (normA && normB) {
    if (normA === normB) return true;
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  const digitsA = strA.match(/\d+/g)?.join('') || '';
  const digitsB = strB.match(/\d+/g)?.join('') || '';
  if (digitsA && digitsB && digitsA === digitsB) {
    return true;
  }

  return false;
}

/**
 * Định dạng tiền tệ VNĐ
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Định dạng số lượng (ngăn cách phần nghìn)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num || 0);
}

/**
 * Định dạng ngày hiển thị dd/mm/yyyy
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Tính toán tồn kho thời gian thực từ các giao dịch đã duyệt
 */
export function calculateCurrentStocks(
  materials: Material[],
  transactions: Transaction[]
): Map<string, { currentStock: number; totalImported: number; totalExported: number }> {
  const stockMap = new Map<string, { currentStock: number; totalImported: number; totalExported: number }>();

  materials.forEach((m) => {
    stockMap.set(m.code, {
      currentStock: m.initialStock || 0,
      totalImported: 0,
      totalExported: 0,
    });
  });

  const approvedTransactions = transactions.filter((t) => t.status === 'APPROVED');
  approvedTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  approvedTransactions.forEach((tx) => {
    tx.items.forEach((item) => {
      const entry = stockMap.get(item.materialCode) || {
        currentStock: 0,
        totalImported: 0,
        totalExported: 0,
      };

      if (tx.type === 'IMPORT') {
        entry.currentStock += item.quantity;
        entry.totalImported += item.quantity;
      } else if (tx.type === 'EXPORT') {
        entry.currentStock -= item.quantity;
        entry.totalExported += item.quantity;
      }

      stockMap.set(item.materialCode, entry);
    });
  });

  return stockMap;
}