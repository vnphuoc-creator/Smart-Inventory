import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Search,
  Clock,
  PlusCircle,
  Package,
  Sparkles,
} from 'lucide-react';
import {
  PurchaseProposal,
  Transaction,
  Material,
  User,
  ProposalReconciliation,
  ReconciledProposalItem,
} from '../types';
import {
  formatVND,
  formatNumber,
  formatDisplayDate,
  isProposalMatch,
} from '../utils/inventoryEngine';

interface ProposalReconciliationViewProps {
  proposals: PurchaseProposal[];
  transactions: Transaction[];
  materials: Material[];
  currentUser: User;
  calculatedStocks: Map<string, { currentStock: number; totalImported: number; totalExported: number }>;
  onOpenCreateImportModalWithData: (data: {
    proposalNumber: string;
    title: string;
    items: Array<{
      materialCode: string;
      materialName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      currentStock?: number;
    }>;
  }) => void;
  onOpenCreateExportModalWithData: (data: {
    proposalNumber: string;
    title: string;
    items: Array<{
      materialCode: string;
      materialName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      currentStock?: number;
    }>;
  }) => void;
  onForceCloseProposal: (proposalId: string, reason: string) => void;
  onCreateProposal: (proposal: PurchaseProposal) => void;
  onUpdateProposal: (proposal: PurchaseProposal) => void;
}

export const ProposalReconciliationView: React.FC<ProposalReconciliationViewProps> = ({
  proposals,
  transactions,
  materials,
  currentUser,
  calculatedStocks,
  onOpenCreateImportModalWithData,
  onOpenCreateExportModalWithData,
  onForceCloseProposal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PARTIAL' | 'COMPLETED' | 'CLOSED' | 'UNIMPORTED'>('ALL');

  // Đảm bảo mọi tờ trình được tham chiếu trong giao dịch đều có mặt trong danh sách
  const effectiveProposals = useMemo(() => {
    const list = [...proposals];
    transactions.forEach((tx) => {
      if (tx.proposalNumber && tx.proposalNumber.trim()) {
        const exists = list.some((p) => isProposalMatch(p.proposalNumber, tx.proposalNumber));
        if (!exists) {
          list.push({
            id: `prop-auto-${tx.id}`,
            proposalNumber: tx.proposalNumber.trim(),
            title: tx.title || `Tờ trình ${tx.proposalNumber.trim()}`,
            date: tx.date || new Date().toISOString().split('T')[0],
            creatorName: tx.creatorName || 'Hệ thống',
            creatorEmail: tx.creatorEmail || '',
            department: 'Đội Điện Nước Công Trình',
            status: 'PARTIALLY_IMPORTED',
            createdAt: tx.createdAt || new Date().toISOString(),
            items: tx.items.map((it) => ({
              materialCode: it.materialCode,
              materialName: it.materialName,
              unit: it.unit,
              requestedQuantity: it.quantity,
              unitPrice: it.unitPrice,
            })),
          });
        }
      }
    });
    return list;
  }, [proposals, transactions]);

  // THUẬT TOÁN ĐỐI CHIẾU LŨY KẾ CÁC ĐỢT NHẬP CỦA TẤT CẢ NHÂN VIÊN
  const reconciliationData = useMemo(() => {
    return effectiveProposals.map((proposal) => {
      // 1. Lọc tất cả phiếu nhập liên quan đến Tờ trình này
      const relatedImportTxs = transactions.filter(
        (tx) =>
          tx.type === 'IMPORT' &&
          tx.status !== 'REJECTED' &&
          tx.proposalNumber &&
          isProposalMatch(tx.proposalNumber, proposal.proposalNumber)
      );

      // 2. Tính tổng số lượng lũy kế đã nhập của từng mã vật tư
      const importedMap = new Map<string, number>();
      relatedImportTxs.forEach((tx) => {
        tx.items.forEach((item) => {
          const current = importedMap.get(item.materialCode) || 0;
          importedMap.set(item.materialCode, current + item.quantity);
        });
      });

      // 3. So sánh định mức tờ trình với thực tế lũy kế
      let missingCount = 0;
      let totalRequestedQty = 0;
      let totalImportedQty = 0;

      const reconciledItems: ReconciledProposalItem[] = proposal.items.map((item) => {
        const totalImported = importedMap.get(item.materialCode) || 0;
        const remainingNeeded = Math.max(0, item.requestedQuantity - totalImported);
        const isComplete = totalImported >= item.requestedQuantity;
        if (!isComplete) missingCount++;

        totalRequestedQty += item.requestedQuantity;
        totalImportedQty += totalImported;

        const stockEntry = calculatedStocks.get(item.materialCode);
        const currentAvailableStock = stockEntry ? stockEntry.currentStock : 0;

        return {
          ...item,
          totalImported,
          remainingNeeded,
          isComplete,
          currentAvailableStock,
        };
      });

      const missingItems = reconciledItems.filter((it) => it.remainingNeeded > 0);
      const isFullyImported = missingCount === 0;

      return {
        proposal,
        reconciledItems,
        missingItems,
        isFullyImported,
        totalRequestedQty,
        totalImportedQty,
        relatedImportTxs,
      };
    });
  }, [effectiveProposals, transactions, calculatedStocks]);

  // HÀM CHO PHÉP NHÂN VIÊN 2 BẤM NHẬP BỔ SUNG CÁC MÓN CÒN THIẾU
  const handleQuickCreateImportSupplemental = (rec: any) => {
    const itemsToImport = rec.missingItems.map((m: any) => ({
      materialCode: m.materialCode,
      materialName: m.materialName,
      unit: m.unit,
      quantity: m.remainingNeeded, // Tự động điền số lượng còn thiếu của các đợt trước
      unitPrice: m.unitPrice || 0,
      currentStock: m.currentAvailableStock,
    }));

    onOpenCreateImportModalWithData({
      proposalNumber: rec.proposal.proposalNumber,
      title: `Nhập bổ sung theo Tờ trình ${rec.proposal.proposalNumber}`,
      items: itemsToImport,
    });
  };

  return (
    <div className="space-y-6">
      {/* Danh sách Tờ trình và các nút thao tác đối soát */}
      <div className="grid grid-cols-1 gap-4">
        {reconciliationData.map((rec) => (
          <div
            key={rec.proposal.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800/40">
                  {rec.proposal.proposalNumber}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{rec.proposal.title}</h3>
              </div>

              {/* Nhãn trạng thái */}
              <div>
                {rec.isFullyImported ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã Nhập Đủ (100%)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Còn thiếu {rec.missingItems.length} mặt hàng
                  </span>
                )}
              </div>
            </div>

            {/* Nút Nhập bổ sung dành cho Nhân viên 2 hoặc ca tiếp theo */}
            {!rec.isFullyImported && (
              <div className="flex items-center justify-end pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => handleQuickCreateImportSupplemental(rec)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>📥 Nhập Bổ Sung ({rec.missingItems.length} món còn thiếu)</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};