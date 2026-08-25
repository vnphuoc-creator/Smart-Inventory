import React, { useState, useMemo, useRef } from 'react';
import {
  FileX2,
  Trash2,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Plus,
  X,
  Building2,
  Calendar,
  ShieldCheck,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  User,
  Material,
  InventoryTransaction,
  PurchaseProposal,
  TransactionItem,
  TransactionType,
  TransactionStatus,
} from '../types';
import { formatVND, formatNumber, formatDisplayDate } from '../utils/inventoryEngine';
import { SearchableMaterialSelect } from './SearchableMaterialSelect';

interface DocumentManagementViewProps {
  currentUser: User;
  allUsers: User[];
  materials: Material[];
  transactions: InventoryTransaction[];
  proposals?: PurchaseProposal[];
  onUpdateTransaction: (transaction: InventoryTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onResetDemoData?: () => void;
  onClearAllTransactions?: () => void;
}

export const DocumentManagementView: React.FC<DocumentManagementViewProps> = ({
  currentUser,
  allUsers,
  materials,
  transactions,
  proposals = [],
  onUpdateTransaction,
  onDeleteTransaction,
  onResetDemoData,
  onClearAllTransactions,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'IMPORT' | 'EXPORT'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<string>('ALL');

  // Deletion Modal State
  const [txToDelete, setTxToDelete] = useState<InventoryTransaction | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showResetDemoModal, setShowResetDemoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<InventoryTransaction | null>(null);
  const [editTxCode, setEditTxCode] = useState('');
  const [editTxTitle, setEditTxTitle] = useState('');
  const [editTxType, setEditTxType] = useState<TransactionType>('IMPORT');
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxProposal, setEditTxProposal] = useState('');
  const [editTxPartner, setEditTxPartner] = useState('');
  const [editTxWarehouse, setEditTxWarehouse] = useState('');
  const [editTxStatus, setEditTxStatus] = useState<TransactionStatus>('APPROVED');
  const [editTxReason, setEditTxReason] = useState('');
  const [editTxNotes, setEditTxNotes] = useState('');
  const [editTxItems, setEditTxItems] = useState<TransactionItem[]>([]);

  // Top Horizontal Scroll Synchronization for Main Table
  const mainTableRef = useRef<HTMLDivElement>(null);
  const mainTopScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingMainScroll = useRef(false);
  const [mainScrollProgress, setMainScrollProgress] = useState(0);

  const handleMainTableScroll = () => {
    if (!mainTableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = mainTableRef.current;
    const max = scrollWidth - clientWidth;
    if (max > 0) setMainScrollProgress((scrollLeft / max) * 100);
    if (mainTopScrollRef.current && !isSyncingMainScroll.current) {
      isSyncingMainScroll.current = true;
      mainTopScrollRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingMainScroll.current = false;
      });
    }
  };

  const handleMainTopScroll = () => {
    if (!mainTopScrollRef.current || !mainTableRef.current) return;
    const { scrollLeft } = mainTopScrollRef.current;
    if (!isSyncingMainScroll.current) {
      isSyncingMainScroll.current = true;
      mainTableRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingMainScroll.current = false;
      });
    }
  };

  const handleMainScrollBy = (amount: number) => {
    if (mainTableRef.current) {
      mainTableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleMainScrollToPercent = (pct: number) => {
    if (mainTableRef.current) {
      const max = mainTableRef.current.scrollWidth - mainTableRef.current.clientWidth;
      mainTableRef.current.scrollTo({ left: (max * pct) / 100, behavior: 'smooth' });
    }
  };

  // Top Horizontal Scroll Synchronization for Edit Modal Table
  const editModalTableRef = useRef<HTMLDivElement>(null);
  const editModalTopScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingEditModalScroll = useRef(false);
  const [editModalScrollProgress, setEditModalScrollProgress] = useState(0);

  const handleEditModalTableScroll = () => {
    if (!editModalTableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = editModalTableRef.current;
    const max = scrollWidth - clientWidth;
    if (max > 0) setEditModalScrollProgress((scrollLeft / max) * 100);
    if (editModalTopScrollRef.current && !isSyncingEditModalScroll.current) {
      isSyncingEditModalScroll.current = true;
      editModalTopScrollRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingEditModalScroll.current = false;
      });
    }
  };

  const handleEditModalTopScroll = () => {
    if (!editModalTopScrollRef.current || !editModalTableRef.current) return;
    const { scrollLeft } = editModalTopScrollRef.current;
    if (!isSyncingEditModalScroll.current) {
      isSyncingEditModalScroll.current = true;
      editModalTableRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingEditModalScroll.current = false;
      });
    }
  };

  const handleEditModalScrollBy = (amount: number) => {
    if (editModalTableRef.current) {
      editModalTableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleEditModalScrollToPercent = (pct: number) => {
    if (editModalTableRef.current) {
      const max = editModalTableRef.current.scrollWidth - editModalTableRef.current.clientWidth;
      editModalTableRef.current.scrollTo({ left: (max * pct) / 100, behavior: 'smooth' });
    }
  };

  // Notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct proposal list for filter dropdown
  const proposalNumbers = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.proposalNumber) set.add(t.proposalNumber.trim());
    });
    proposals.forEach((p) => {
      if (p.proposalNumber) set.add(p.proposalNumber.trim());
    });
    return Array.from(set).sort();
  }, [transactions, proposals]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && tx.status !== selectedStatus) return false;

      // Proposal filter
      if (selectedProposal !== 'ALL') {
        if (!tx.proposalNumber || tx.proposalNumber.trim() !== selectedProposal) return false;
      }

      // Search keyword filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchCode = tx.code.toLowerCase().includes(query);
        const matchTitle = (tx.title || '').toLowerCase().includes(query);
        const matchReason = (tx.reason || '').toLowerCase().includes(query);
        const matchPartner = (tx.partner || '').toLowerCase().includes(query);
        const matchProp = (tx.proposalNumber || '').toLowerCase().includes(query);
        const matchCreator = (tx.creatorName || '').toLowerCase().includes(query);
        const matchItem = tx.items.some(
          (i) =>
            i.materialCode.toLowerCase().includes(query) ||
            i.materialName.toLowerCase().includes(query)
        );

        if (!matchCode && !matchTitle && !matchReason && !matchPartner && !matchProp && !matchCreator && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedType, selectedStatus, selectedProposal, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    let importCount = 0;
    let exportCount = 0;
    let totalImportAmount = 0;
    let totalExportAmount = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'IMPORT') {
        importCount++;
        totalImportAmount += tx.totalAmount || 0;
      } else {
        exportCount++;
        totalExportAmount += tx.totalAmount || 0;
      }
    });

    return {
      total: transactions.length,
      importCount,
      exportCount,
      totalImportAmount,
      totalExportAmount,
      totalValue: totalImportAmount + totalExportAmount,
    };
  }, [transactions]);

  // Open Edit Modal handler
  const handleOpenEdit = (tx: InventoryTransaction) => {
    setEditingTx(tx);
    setEditTxCode(tx.code);
    setEditTxTitle(tx.title || tx.reason || '');
    setEditTxType(tx.type);
    setEditTxDate(tx.date);
    setEditTxProposal(tx.proposalNumber || '');
    setEditTxPartner(tx.partner || '');
    setEditTxWarehouse(tx.warehouse || 'Kho Tổng Điện Nước AHT');
    setEditTxStatus(tx.status);
    setEditTxReason(tx.reason || '');
    setEditTxNotes(tx.notes || '');
    setEditTxItems(
      tx.items.map((it) => ({
        materialCode: it.materialCode,
        materialName: it.materialName,
        unit: it.unit,
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        totalAmount: Number(it.totalAmount) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        currentStockAtCreation: it.currentStockAtCreation || 0,
        notes: it.notes || '',
      }))
    );
  };

  // Add Item in Edit Modal
  const handleAddItemToEdit = () => {
    const sampleMat = materials[0];
    setEditTxItems((prev) => [
      ...prev,
      {
        materialCode: sampleMat ? sampleMat.code : 'DN_NEW',
        materialName: sampleMat ? sampleMat.name : 'Vật tư mới',
        unit: sampleMat ? sampleMat.unit : 'Cái',
        quantity: 1,
        unitPrice: sampleMat ? sampleMat.unitPrice : 0,
        totalAmount: sampleMat ? sampleMat.unitPrice : 0,
        currentStockAtCreation: sampleMat ? sampleMat.initialStock : 0,
      },
    ]);
  };

  // Update Item field in Edit Modal
  const handleUpdateEditItem = (index: number, field: keyof TransactionItem, value: any) => {
    setEditTxItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'materialCode') {
        const mat = materials.find((m) => m.code === value);
        target.materialCode = value;
        if (mat) {
          target.materialName = mat.name;
          target.unit = mat.unit;
          target.unitPrice = mat.unitPrice;
          target.totalAmount = (Number(target.quantity) || 0) * mat.unitPrice;
        }
      } else if (field === 'quantity') {
        const q = Number(value) || 0;
        target.quantity = q;
        target.totalAmount = q * (Number(target.unitPrice) || 0);
      } else if (field === 'unitPrice') {
        const p = Number(value) || 0;
        target.unitPrice = p;
        target.totalAmount = (Number(target.quantity) || 0) * p;
      } else {
        (target as any)[field] = value;
      }

      updated[index] = target;
      return updated;
    });
  };

  // Remove Item in Edit Modal
  const handleRemoveEditItem = (index: number) => {
    if (editTxItems.length <= 1) {
      alert('Chứng từ phải có ít nhất 1 dòng vật tư!');
      return;
    }
    setEditTxItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Edit Form
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    if (editTxItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 vật tư vào chứng từ!');
      return;
    }

    const calculatedTotalQty = editTxItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const calculatedTotalAmount = editTxItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );

    const updatedTx: InventoryTransaction = {
      ...editingTx,
      code: editTxCode.trim() || editingTx.code,
      title: editTxTitle.trim() || editingTx.title,
      type: editTxType,
      date: editTxDate,
      proposalNumber: editTxProposal.trim() || undefined,
      partner: editTxPartner.trim() || 'Nhà cung cấp AHT',
      warehouse: editTxWarehouse.trim() || 'Kho Tổng Điện Nước AHT',
      status: editTxStatus,
      reason: editTxReason.trim() || editTxTitle.trim(),
      notes: editTxNotes.trim(),
      items: editTxItems.map((it) => ({
        ...it,
        totalAmount: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      })),
      totalQuantity: calculatedTotalQty,
      totalAmount: calculatedTotalAmount,
    };

    onUpdateTransaction(updatedTx);
    setEditingTx(null);
    showToast(`Đã lưu thay đổi cho chứng từ "${updatedTx.code}". Tồn kho đã tự động cập nhật lại!`);
  };

  // Single Delete Confirmation Action
  const handleConfirmDelete = () => {
    if (!txToDelete) return;
    const deletedCode = txToDelete.code;
    onDeleteTransaction(txToDelete.id);
    setTxToDelete(null);
    showToast(`Đã xóa thành công chứng từ "${deletedCode}". Số lượng tồn kho đã tự động hoàn tác!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileX2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <span>Quản Lý &amp; Sửa / Xóa Chứng Từ Sai</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 normal-case tracking-normal">
                    Quyền Admin
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Rà soát, chỉnh sửa chi tiết hoặc xóa các phiếu nhập/xuất kho bị sai sót. Tồn kho và thẻ kho tự động hoàn tác ngay lập tức.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Management Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {onResetDemoData && (
              <button
                type="button"
                onClick={() => setShowResetDemoModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                title="Khôi phục danh sách phiếu kho mẫu ban đầu"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Khôi Phục Phiếu Mẫu</span>
              </button>
            )}

            {onClearAllTransactions && (
              <button
                type="button"
                onClick={() => setShowClearAllModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition"
                title="Xóa sạch tất cả phiếu kho để nhập dữ liệu mới"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Dọn Sạch Toàn Bộ Phiếu</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400">Tổng Số Chứng Từ</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {stats.total} <span className="text-xs font-normal text-slate-400">phiếu</span>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Phiếu Nhập Kho</span>
            </div>
            <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
              {stats.importCount} <span className="text-xs font-normal text-emerald-400/80">phiếu</span>
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Phiếu Xuất Kho</span>
            </div>
            <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
              {stats.exportCount} <span className="text-xs font-normal text-amber-400/80">phiếu</span>
            </div>
          </div>

          <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-blue-400">Tổng Giá Trị Giao Dịch</div>
            <div className="text-sm sm:text-base font-black text-blue-300 font-mono mt-1 truncate">
              {formatVND(stats.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã phiếu (PN-*, PX-*), tên vật tư, số tờ trình, đối tác..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedType === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả Loại
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('IMPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedType === 'IMPORT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nhập Kho
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('EXPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedType === 'EXPORT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Xuất Kho
            </button>
          </div>

          {/* Proposal Filter Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedProposal}
              onChange={(e) => setSelectedProposal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất Cả Tờ Trình</option>
              {proposalNumbers.map((p) => (
                <option key={p} value={p}>
                  Tờ trình {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất Cả Trạng Thái</option>
              <option value="APPROVED">Đã duyệt (Vào kho)</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Filter */}
        {(searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL' || selectedProposal !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-800 text-slate-400">
            <div>
              Hiển thị <strong className="text-white">{filteredTransactions.length}</strong> / {transactions.length} chứng từ phù hợp
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedStatus('ALL');
                setSelectedProposal('ALL');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Section */}
      <div className="space-y-2">
        {/* Top Horizontal Scrollbar & Fast Navigation Controls */}
        <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px]">Trượt ngang:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleMainScrollToPercent(0)}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                title="Về đầu danh sách (Trái)"
              >
                <ChevronsLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleMainScrollBy(-250)}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                title="Cuộn sang trái"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleMainScrollBy(250)}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                title="Cuộn sang phải"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleMainScrollToPercent(100)}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                title="Đến cuối danh sách (Phải)"
              >
                <ChevronsRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(mainScrollProgress)}
              onChange={(e) => handleMainScrollToPercent(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              title="Kéo trượt nhanh bảng chứng từ"
            />
            <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
              {Math.round(mainScrollProgress)}%
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            <strong className="text-white">{filteredTransactions.length}</strong> chứng từ
          </div>
        </div>

        {/* Direct Top Scroll Track */}
        <div
          ref={mainTopScrollRef}
          onScroll={handleMainTopScroll}
          className="overflow-x-auto overflow-y-hidden bg-slate-900 border border-slate-800 rounded-md h-2 custom-top-scrollbar"
        >
          <div className="w-[1050px] h-1"></div>
        </div>

        {/* Table Container with Sticky Header */}
        <div
          ref={mainTableRef}
          onScroll={handleMainTableScroll}
          className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto overflow-y-auto max-h-[600px] shadow-sm relative"
        >
          <table className="w-full text-left text-xs min-w-[950px] border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-slate-950/95 shadow-sm border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              <tr>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 w-12 border-b border-slate-800">STT</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 w-36 border-b border-slate-800">Mã Phiếu</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 w-28 border-b border-slate-800">Loại Phiếu</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 min-w-[200px] border-b border-slate-800">Tờ Trình / Diễn Giải</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 w-32 border-b border-slate-800">Ngày Lập</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 text-right w-24 border-b border-slate-800">Tổng SL</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 text-right w-36 border-b border-slate-800">Tổng Tiền (VNĐ)</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 text-center w-28 border-b border-slate-800">Trạng Thái</th>
                <th className="sticky top-0 z-10 bg-slate-950 py-3 px-3 text-center w-32 border-b border-slate-800">Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-sans">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileX2 className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-300 text-xs">Không tìm thấy chứng từ phù hợp</p>
                      <p className="text-[11px] text-slate-500">
                        Thử điều chỉnh từ khóa tìm kiếm hoặc bấm "Xóa bộ lọc" để xem toàn bộ danh sách.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'IMPORT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {tx.type === 'IMPORT' ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>NHẬP KHO</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>XUẤT KHO</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 line-clamp-1" title={tx.title || tx.reason}>
                        {tx.title || tx.reason}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5">
                        {tx.proposalNumber && (
                          <span className="font-mono text-amber-400 font-semibold">
                            Tờ trình: {tx.proposalNumber}
                          </span>
                        )}
                        {tx.partner && (
                          <span className="text-slate-400 truncate max-w-[180px]">
                            &bull; {tx.partner}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDisplayDate(tx.date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                      <div>{formatNumber(tx.totalQuantity)}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        ({tx.items.length} mặt hàng)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatVND(tx.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          tx.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                        }`}
                      >
                        {tx.status === 'APPROVED'
                          ? 'Đã duyệt (Hiệu lực)'
                          : tx.status === 'PENDING'
                          ? 'Chờ duyệt'
                          : 'Từ chối'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          className="px-2.5 py-1 rounded-lg bg-blue-900/30 hover:bg-blue-800/60 text-blue-300 border border-blue-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition"
                          title="Chỉnh sửa nội dung, ngày tháng hoặc danh mục vật tư của phiếu"
                        >
                          <Edit3 className="w-3 h-3 text-blue-400" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxToDelete(tx)}
                          className="px-2.5 py-1 rounded-lg bg-rose-900/30 hover:bg-rose-800/60 text-rose-300 border border-rose-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition"
                          title="Xóa phiếu và tự động hoàn tác tồn kho thực tế"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: EDIT TRANSACTION --- */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Chỉnh Sửa Chứng Từ Kho (Mã: {editingTx.code})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sửa đổi thông tin, ngày tháng hoặc vật tư. Hệ thống sẽ tự động tính lại tồn kho khi lưu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitEdit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Phiếu *</label>
                  <input
                    type="text"
                    required
                    value={editTxCode}
                    onChange={(e) => setEditTxCode(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Loại Phiếu *</label>
                  <select
                    value={editTxType}
                    onChange={(e) => setEditTxType(e.target.value as TransactionType)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="IMPORT">NHẬP KHO (Tăng tồn kho)</option>
                    <option value="EXPORT">XUẤT KHO (Giảm tồn kho)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày Giao Dịch *</label>
                  <input
                    type="date"
                    required
                    value={editTxDate}
                    onChange={(e) => setEditTxDate(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tiêu Đề / Diễn Giải *</label>
                  <input
                    type="text"
                    required
                    value={editTxTitle}
                    onChange={(e) => setEditTxTitle(e.target.value)}
                    placeholder="Ví dụ: Nhập vật tư điện bảo dưỡng định kỳ..."
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Số Tờ Trình Đính Kèm</label>
                  <input
                    type="text"
                    value={editTxProposal}
                    onChange={(e) => setEditTxProposal(e.target.value)}
                    placeholder="Ví dụ: 17-DNCT/PKT"
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {editTxType === 'IMPORT' ? 'Nhà Cung Cấp / Đối Tác' : 'Công Trình / Đơn Vị Nhận'}
                  </label>
                  <input
                    type="text"
                    value={editTxPartner}
                    onChange={(e) => setEditTxPartner(e.target.value)}
                    placeholder="Ví dụ: Công ty Thiết Bị Điện ABC..."
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kho Thực Hiện</label>
                  <input
                    type="text"
                    value={editTxWarehouse}
                    onChange={(e) => setEditTxWarehouse(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng Thái Phiếu *</label>
                  <select
                    value={editTxStatus}
                    onChange={(e) => setEditTxStatus(e.target.value as TransactionStatus)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="APPROVED">Đã Duyệt (Có hiệu lực tồn kho)</option>
                    <option value="PENDING">Chờ Duyệt</option>
                    <option value="REJECTED">Từ Chối</option>
                  </select>
                </div>
              </div>

              {/* Items Section with Top Scrollbar & Sticky Header */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Danh Sách Vật Tư Trong Phiếu ({editTxItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemToEdit}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-lg font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Thêm vật tư
                  </button>
                </div>

                {/* Top Horizontal Scrollbar & Fast Nav for Edit Modal */}
                <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px]">Trượt ngang:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditModalScrollToPercent(0)}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                        title="Về đầu"
                      >
                        <ChevronsLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditModalScrollBy(-200)}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                        title="Sang trái"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditModalScrollBy(200)}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                        title="Sang phải"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditModalScrollToPercent(100)}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                        title="Đến cuối"
                      >
                        <ChevronsRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(editModalScrollProgress)}
                      onChange={(e) => handleEditModalScrollToPercent(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                      title="Kéo trượt nhanh bảng"
                    />
                    <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                      {Math.round(editModalScrollProgress)}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    <strong className="text-white">{editTxItems.length}</strong> vật tư
                  </div>
                </div>

                {/* Direct Top Scroll Track */}
                <div
                  ref={editModalTopScrollRef}
                  onScroll={handleEditModalTopScroll}
                  className="overflow-x-auto overflow-y-hidden bg-slate-900 border border-slate-800 rounded-md h-2 custom-top-scrollbar"
                >
                  <div className="w-[700px] h-1"></div>
                </div>

                {/* Items Table with Sticky Header */}
                <div
                  ref={editModalTableRef}
                  onScroll={handleEditModalTableScroll}
                  className="bg-slate-850 border border-slate-800 rounded-xl overflow-x-auto overflow-y-auto max-h-[350px] relative"
                >
                  <table className="w-full text-left text-xs text-slate-300 min-w-[640px] border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                      <tr>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-3 border-b border-slate-800">
                          Vật Tư (Mã Chuẩn DN_*)
                        </th>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-3 text-right w-28 border-b border-slate-800">
                          Số Lượng
                        </th>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-3 text-right w-32 border-b border-slate-800">
                          Đơn Giá (VNĐ)
                        </th>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-3 text-right w-32 border-b border-slate-800">
                          Thành Tiền
                        </th>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-2 text-center w-12 border-b border-slate-800">
                          Xóa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {editTxItems.map((item, idx) => {
                        const rowTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3">
                              <SearchableMaterialSelect
                                materials={materials}
                                value={item.materialCode}
                                onChange={(newCode) => handleUpdateEditItem(idx, 'materialCode', newCode)}
                                placeholder="Chọn mã vật tư..."
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.quantity}
                                onChange={(e) => handleUpdateEditItem(idx, 'quantity', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-right font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                required
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateEditItem(idx, 'unitPrice', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-right font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                              {formatVND(rowTotal)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveEditItem(idx)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                                title="Xóa dòng vật tư này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary in Edit Modal */}
                <div className="flex items-center justify-between px-2 pt-1 text-xs">
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>
                      Tổng số lượng:{' '}
                      <strong className="text-white font-mono">
                        {formatNumber(editTxItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0))}
                      </strong>
                    </span>
                    <span>
                      Số mặt hàng:{' '}
                      <strong className="text-white font-mono">{editTxItems.length}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Tổng giá trị: </span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {formatVND(
                        editTxItems.reduce(
                          (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
                          0
                        )
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Thay Đổi Chứng Từ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRM DELETE SINGLE TRANSACTION --- */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác Nhận Xóa Phiếu Kho</h3>
                <p className="text-xs text-slate-400 font-mono">{txToDelete.code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa phiếu <strong className="text-amber-300">{txToDelete.code}</strong> (
              {txToDelete.type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'})? Số lượng tồn kho và thẻ kho của các mặt hàng liên quan sẽ được tự động hoàn tác và tính toán lại ngay lập tức.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRM CLEAR ALL TRANSACTIONS --- */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xóa Toàn Bộ Chứng Từ</h3>
                <p className="text-xs text-rose-400">Hành động nguy hiểm &bull; Xóa vĩnh viễn</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Thao tác này sẽ xóa sạch toàn bộ lịch sử xuất - nhập kho ({transactions.length} phiếu). Toàn bộ số lượng tồn kho sẽ trở về mức Tồn đầu kỳ ban đầu. Bạn có chắc chắn muốn thực hiện không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllTransactions) {
                    onClearAllTransactions();
                  }
                  setShowClearAllModal(false);
                  showToast('Đã dọn sạch toàn bộ chứng từ trong hệ thống!');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition"
              >
                Xác Nhận Xóa Hết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRM RESET DEMO DATA --- */}
      {showResetDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Khôi Phục Chứng Từ Mẫu AHT</h3>
                <p className="text-xs text-slate-400">Dữ liệu thực tế Đội Điện Nước AHT</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có muốn khôi phục lại các phiếu nhập/xuất kho mẫu tiêu chuẩn của Đội Điện Nước AHT theo các tờ trình 17, 26, 31, 08...?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetDemoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetDemoData) {
                    onResetDemoData();
                  }
                  setShowResetDemoModal(false);
                  showToast('Đã khôi phục lại danh sách phiếu kho mẫu AHT!');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition"
              >
                Xác Nhận Khôi Phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-view Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 rounded-2xl shadow-2xl border bg-slate-900 border-emerald-500/50 text-emerald-300 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium flex-1 text-slate-100">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
