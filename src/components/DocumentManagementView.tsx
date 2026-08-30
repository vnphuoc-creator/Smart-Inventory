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
  FileText,
  FileCheck2,
  Clock,
  User as UserIcon,
  Tag,
  Paperclip,
} from 'lucide-react';
import {
  User,
  Material,
  InventoryTransaction,
  PurchaseProposal,
  ProposalItem,
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
  onUpdateProposal?: (proposal: PurchaseProposal) => void;
  onDeleteProposal?: (proposalId: string) => void;
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
  onUpdateProposal,
  onDeleteProposal,
  onResetDemoData,
  onClearAllTransactions,
}) => {
  // Active Section: 'TRANSACTIONS' (Phiếu Nhập/Xuất) | 'PROPOSALS' (Tờ Trình Mua Sắm)
  const [activeSection, setActiveSection] = useState<'TRANSACTIONS' | 'PROPOSALS'>('TRANSACTIONS');

  // Search & Filter State - Transactions
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'IMPORT' | 'EXPORT'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<string>('ALL');

  // Search & Filter State - Proposals
  const [proposalSearchTerm, setProposalSearchTerm] = useState('');
  const [proposalSelectedStatus, setProposalSelectedStatus] = useState<string>('ALL');

  // Deletion Modal State
  const [txToDelete, setTxToDelete] = useState<InventoryTransaction | null>(null);
  const [propToDelete, setPropToDelete] = useState<PurchaseProposal | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showResetDemoModal, setShowResetDemoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Transaction Modal State
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

  // Edit Proposal Modal State
  const [editingProp, setEditingProp] = useState<PurchaseProposal | null>(null);
  const [editPropNumber, setEditPropNumber] = useState('');
  const [editPropTitle, setEditPropTitle] = useState('');
  const [editPropDate, setEditPropDate] = useState('');
  const [editPropCreatorName, setEditPropCreatorName] = useState('');
  const [editPropDepartment, setEditPropDepartment] = useState('');
  const [editPropStatus, setEditPropStatus] = useState<PurchaseProposal['status']>('APPROVED');
  const [editPropNotes, setEditPropNotes] = useState('');
  const [editPropItems, setEditPropItems] = useState<ProposalItem[]>([]);

  // Top Horizontal Scroll Synchronization for Main Transactions Table
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

  // Top Horizontal Scroll Synchronization for Proposals Table
  const propTableRef = useRef<HTMLDivElement>(null);
  const propTopScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingPropScroll = useRef(false);
  const [propScrollProgress, setPropScrollProgress] = useState(0);

  const handlePropTableScroll = () => {
    if (!propTableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = propTableRef.current;
    const max = scrollWidth - clientWidth;
    if (max > 0) setPropScrollProgress((scrollLeft / max) * 100);
    if (propTopScrollRef.current && !isSyncingPropScroll.current) {
      isSyncingPropScroll.current = true;
      propTopScrollRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingPropScroll.current = false;
      });
    }
  };

  const handlePropTopScroll = () => {
    if (!propTopScrollRef.current || !propTableRef.current) return;
    const { scrollLeft } = propTopScrollRef.current;
    if (!isSyncingPropScroll.current) {
      isSyncingPropScroll.current = true;
      propTableRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingPropScroll.current = false;
      });
    }
  };

  const handlePropScrollBy = (amount: number) => {
    if (propTableRef.current) {
      propTableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handlePropScrollToPercent = (pct: number) => {
    if (propTableRef.current) {
      const max = propTableRef.current.scrollWidth - propTableRef.current.clientWidth;
      propTableRef.current.scrollTo({ left: (max * pct) / 100, behavior: 'smooth' });
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
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;
      if (selectedStatus !== 'ALL' && tx.status !== selectedStatus) return false;
      if (selectedProposal !== 'ALL') {
        if (!tx.proposalNumber || tx.proposalNumber.trim() !== selectedProposal) return false;
      }
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

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((prop) => {
      if (proposalSelectedStatus !== 'ALL' && prop.status !== proposalSelectedStatus) return false;
      if (proposalSearchTerm.trim()) {
        const q = proposalSearchTerm.toLowerCase().trim();
        const matchNum = prop.proposalNumber.toLowerCase().includes(q);
        const matchTitle = (prop.title || '').toLowerCase().includes(q);
        const matchCreator = (prop.creatorName || '').toLowerCase().includes(q);
        const matchDept = (prop.department || '').toLowerCase().includes(q);
        const matchItem = prop.items.some(
          (i) =>
            i.materialCode.toLowerCase().includes(q) ||
            i.materialName.toLowerCase().includes(q)
        );
        if (!matchNum && !matchTitle && !matchCreator && !matchDept && !matchItem) {
          return false;
        }
      }
      return true;
    });
  }, [proposals, proposalSelectedStatus, proposalSearchTerm]);

  // Transactions Statistics
  const txStats = useMemo(() => {
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
    };
  }, [transactions]);

  // Proposal Statistics
  const propStats = useMemo(() => {
    let totalItems = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    proposals.forEach((p) => {
      totalItems += p.items?.length || 0;
      if (p.status === 'APPROVED' || p.status === 'COMPLETED') approvedCount++;
      if (p.status === 'PENDING_APPROVAL' || p.status === 'SUBMITTED' || p.status === 'DRAFT') pendingCount++;
    });

    return {
      total: proposals.length,
      totalItems,
      approvedCount,
      pendingCount,
    };
  }, [proposals]);

  // Open Edit Transaction Modal
  const handleOpenEdit = (tx: InventoryTransaction) => {
    setEditingTx(tx);
    setEditTxCode(tx.code);
    setEditTxTitle(tx.title || '');
    setEditTxType(tx.type);
    setEditTxDate(tx.date);
    setEditTxProposal(tx.proposalNumber || '');
    setEditTxPartner(tx.partner || '');
    setEditTxWarehouse(tx.warehouse || 'Kho Tổng');
    setEditTxStatus(tx.status);
    setEditTxReason(tx.reason || '');
    setEditTxNotes(tx.notes || '');
    setEditTxItems(
      tx.items.map((i) => ({
        ...i,
        quantity: i.quantity || 0,
        unitPrice: i.unitPrice || 0,
        totalAmount: (i.quantity || 0) * (i.unitPrice || 0),
      }))
    );
  };

  // Open Edit Proposal Modal
  const handleOpenEditProposal = (prop: PurchaseProposal) => {
    setEditingProp(prop);
    setEditPropNumber(prop.proposalNumber);
    setEditPropTitle(prop.title || '');
    setEditPropDate(prop.date || '');
    setEditPropCreatorName(prop.creatorName || '');
    setEditPropDepartment(prop.department || 'Đội Điện Nước Công Trình');
    setEditPropStatus(prop.status);
    setEditPropNotes(prop.notes || '');
    setEditPropItems(
      prop.items.map((i) => {
        const mat = materials.find((m) => m.code === i.materialCode);
        return {
          ...i,
          materialName: (mat?.name && mat.name.trim() !== 'Vật tư') ? mat.name : i.materialName,
          unit: mat?.unit || i.unit || 'Cái',
          requestedQuantity: i.requestedQuantity || 0,
          unitPrice: i.unitPrice || mat?.unitPrice || 0,
        };
      })
    );
  };

  // Add Item to Edit Transaction
  const handleAddEditItem = () => {
    const defaultMat = materials[0];
    const newItem: TransactionItem = {
      materialCode: defaultMat ? defaultMat.code : '',
      materialName: defaultMat ? defaultMat.name : '',
      unit: defaultMat ? defaultMat.unit : 'Cái',
      quantity: 1,
      unitPrice: defaultMat ? defaultMat.unitPrice : 0,
      totalAmount: defaultMat ? defaultMat.unitPrice : 0,
      currentStockAtCreation: defaultMat ? defaultMat.initialStock : 0,
      proposalNumber: editTxProposal || undefined,
    };
    setEditTxItems([...editTxItems, newItem]);
  };

  // Remove Item from Edit Transaction
  const handleRemoveEditItem = (idx: number) => {
    setEditTxItems(editTxItems.filter((_, i) => i !== idx));
  };

  // Change Material of an item in Edit Transaction
  const handleItemMaterialChange = (idx: number, matCode: string) => {
    const foundMat = materials.find((m) => m.code === matCode);
    if (!foundMat) return;
    const updated = [...editTxItems];
    updated[idx] = {
      ...updated[idx],
      materialCode: foundMat.code,
      materialName: foundMat.name,
      unit: foundMat.unit,
      unitPrice: foundMat.unitPrice,
      totalAmount: (updated[idx].quantity || 1) * foundMat.unitPrice,
      currentStockAtCreation: foundMat.initialStock,
    };
    setEditTxItems(updated);
  };

  // Change Quantity/Price in Edit Transaction
  const handleItemFieldChange = (
    idx: number,
    field: 'quantity' | 'unitPrice' | 'notes',
    value: any
  ) => {
    const updated = [...editTxItems];
    const current = { ...updated[idx] };
    if (field === 'quantity') {
      const q = Math.max(0, parseFloat(value) || 0);
      current.quantity = q;
      current.totalAmount = q * (current.unitPrice || 0);
    } else if (field === 'unitPrice') {
      const p = Math.max(0, parseFloat(value) || 0);
      current.unitPrice = p;
      current.totalAmount = (current.quantity || 0) * p;
    } else if (field === 'notes') {
      current.notes = value;
    }
    updated[idx] = current;
    setEditTxItems(updated);
  };

  // Save Transaction Edits
  const handleSaveTransactionEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    if (!editTxCode.trim()) {
      alert('Vui lòng nhập Mã Chứng Từ.');
      return;
    }
    if (editTxItems.length === 0) {
      alert('Chứng từ phải có ít nhất 1 dòng vật tư.');
      return;
    }

    const totalQty = editTxItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalAmt = editTxItems.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const updatedTx: InventoryTransaction = {
      ...editingTx,
      code: editTxCode.trim(),
      title: editTxTitle.trim() || `Phiếu ${editTxType === 'IMPORT' ? 'nhập' : 'xuất'} kho ${editTxCode.trim()}`,
      type: editTxType,
      date: editTxDate,
      proposalNumber: editTxProposal.trim() || undefined,
      partner: editTxPartner.trim(),
      warehouse: editTxWarehouse.trim() || 'Kho Tổng',
      status: editTxStatus,
      reason: editTxReason.trim(),
      notes: editTxNotes.trim(),
      items: editTxItems,
      totalQuantity: totalQty,
      totalAmount: totalAmt,
    };

    onUpdateTransaction(updatedTx);
    setEditingTx(null);
    showToast(`Đã lưu thay đổi cho phiếu "${updatedTx.code}". Tồn kho đã được cập nhật lại!`);
  };

  // Add Item to Edit Proposal
  const handleAddEditProposalItem = () => {
    const defaultMat = materials[0];
    const newItem: ProposalItem = {
      materialCode: defaultMat ? defaultMat.code : '',
      materialName: defaultMat ? defaultMat.name : '',
      unit: defaultMat ? defaultMat.unit : 'Cái',
      requestedQuantity: 1,
      unitPrice: defaultMat ? defaultMat.unitPrice : 0,
    };
    setEditPropItems([...editPropItems, newItem]);
  };

  // Remove Item from Edit Proposal
  const handleRemoveEditProposalItem = (idx: number) => {
    setEditPropItems(editPropItems.filter((_, i) => i !== idx));
  };

  // Change Material of an item in Edit Proposal
  const handlePropItemMaterialChange = (idx: number, matCode: string, selectedMat?: Material) => {
    const foundMat = selectedMat || materials.find((m) => m.code === matCode);
    if (!foundMat) return;
    const updated = [...editPropItems];
    updated[idx] = {
      ...updated[idx],
      materialCode: foundMat.code,
      materialName: foundMat.name,
      unit: foundMat.unit,
      unitPrice: foundMat.unitPrice,
    };
    setEditPropItems(updated);
  };

  // Change Quantity/Price in Edit Proposal
  const handlePropItemFieldChange = (
    idx: number,
    field: 'requestedQuantity' | 'unitPrice' | 'notes',
    value: any
  ) => {
    const updated = [...editPropItems];
    const current = { ...updated[idx] };
    if (field === 'requestedQuantity') {
      current.requestedQuantity = Math.max(0, parseFloat(value) || 0);
    } else if (field === 'unitPrice') {
      current.unitPrice = Math.max(0, parseFloat(value) || 0);
    } else if (field === 'notes') {
      current.notes = value;
    }
    updated[idx] = current;
    setEditPropItems(updated);
  };

  // Save Proposal Edits
  const handleSaveProposalEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;

    if (!editPropNumber.trim()) {
      alert('Vui lòng nhập Số Tờ Trình (VD: 26-DNCT/PKT).');
      return;
    }
    if (editPropItems.length === 0) {
      alert('Tờ trình phải có ít nhất 1 dòng vật tư đề xuất.');
      return;
    }

    const updatedProp: PurchaseProposal = {
      ...editingProp,
      proposalNumber: editPropNumber.trim(),
      title: editPropTitle.trim() || `Tờ trình đề xuất mua sắm ${editPropNumber.trim()}`,
      date: editPropDate,
      creatorName: editPropCreatorName.trim(),
      department: editPropDepartment.trim() || 'Đội Điện Nước Công Trình',
      status: editPropStatus,
      notes: editPropNotes.trim(),
      items: editPropItems,
    };

    if (onUpdateProposal) {
      onUpdateProposal(updatedProp);
    }
    setEditingProp(null);
    showToast(`Đã lưu thay đổi cho Tờ trình "${updatedProp.proposalNumber}".`);
  };

  // Confirm Delete Single Transaction
  const handleConfirmDelete = () => {
    if (!txToDelete) return;
    onDeleteTransaction(txToDelete.id);
    showToast(`Đã xóa vĩnh viễn chứng từ "${txToDelete.code}". Số dư tồn kho đã được hoàn tác hoàn toàn!`);
    setTxToDelete(null);
  };

  // Confirm Delete Single Proposal
  const handleConfirmDeleteProposal = () => {
    if (!propToDelete) return;
    if (onDeleteProposal) {
      onDeleteProposal(propToDelete.id);
      showToast(`Đã xóa vĩnh viễn Tờ trình "${propToDelete.proposalNumber}" khỏi hệ thống.`);
    }
    setPropToDelete(null);
  };

  // Confirm Clear All Data
  const handleConfirmClearAll = () => {
    if (onClearAllTransactions) {
      onClearAllTransactions();
      showToast('Đã dọn dẹp sạch toàn bộ chứng từ & tờ trình thử nghiệm.');
    }
    setShowClearAllModal(false);
  };

  // Confirm Reset Default Demo Data
  const handleConfirmResetDemo = () => {
    if (onResetDemoData) {
      onResetDemoData();
      showToast('Đã khôi phục toàn bộ chứng từ & tờ trình mẫu của AHT.');
    }
    setShowResetDemoModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl">
                <FileX2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Sửa &amp; Xóa Chứng Từ Sai / Thừa
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40">
                    Quyền Admin
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Chỉnh sửa trực tiếp hoặc xóa vĩnh viễn Phiếu nhập/xuất và Tờ trình bị sai sót. Tồn kho tự động hoàn tác tức thì.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowResetDemoModal(true)}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-2 shadow-sm"
              title="Khôi phục lại dữ liệu chứng từ mẫu ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              Nạp Lại Dữ Liệu Mẫu
            </button>
            <button
              onClick={() => setShowClearAllModal(true)}
              className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-800/60 transition flex items-center gap-2 shadow-sm shadow-rose-950/50"
              title="Xóa toàn bộ chứng từ & tờ trình thử nghiệm"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Xóa Sạch Chứng Từ &amp; Tờ Trình
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSection('TRANSACTIONS')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2.5 ${
            activeSection === 'TRANSACTIONS'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Phiếu Xuất - Nhập Kho ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('PROPOSALS')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2.5 ${
            activeSection === 'PROPOSALS'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tờ Trình Mua Sắm &amp; Đề Xuất ({proposals.length})</span>
        </button>
      </div>

      {/* ===================== SECTION 1: TRANSACTIONS ===================== */}
      {activeSection === 'TRANSACTIONS' && (
        <div className="space-y-6">
          {/* Quick Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Tổng Chứng Từ</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{formatNumber(txStats.total)}</span>
                <span className="text-xs text-slate-400">phiếu</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
                <span>Phiếu Nhập Kho</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">{formatNumber(txStats.importCount)}</span>
                <span className="text-xs text-slate-400">phiếu</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-1">
                {formatVND(txStats.totalImportAmount)}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
                <span>Phiếu Xuất Kho</span>
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400">{formatNumber(txStats.exportCount)}</span>
                <span className="text-xs text-slate-400">phiếu</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-1">
                {formatVND(txStats.totalExportAmount)}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
                <span>Hiển Thị Lọc</span>
                <Filter className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-400">{formatNumber(filteredTransactions.length)}</span>
                <span className="text-xs text-slate-400">phiếu khớp</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã phiếu (PN-..., PX-...), số tờ trình, tên vật tư, đối tác..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <div className="md:col-span-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="ALL">Tất cả loại phiếu</option>
                  <option value="IMPORT">📥 Phiếu Nhập Kho</option>
                  <option value="EXPORT">📤 Phiếu Xuất Kho</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã duyệt (APPROVED)</option>
                  <option value="PENDING">Chờ duyệt (PENDING)</option>
                  <option value="REJECTED">Từ chối (REJECTED)</option>
                </select>
              </div>

              {/* Proposal Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedProposal}
                  onChange={(e) => setSelectedProposal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="ALL">Mọi Tờ trình ({proposalNumbers.length})</option>
                  {proposalNumbers.map((prop) => (
                    <option key={prop} value={prop}>
                      Tờ trình {prop}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table with Top & Bottom Scrollbars */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Top Horizontal Scroll Bar */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MoveHorizontal className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-slate-300">Thanh trượt xem đầy đủ các cột:</span>
              </div>

              <div
                ref={mainTopScrollRef}
                onScroll={handleMainTopScroll}
                className="flex-1 overflow-x-auto h-5 scrollbar-thin cursor-ew-resize mx-2"
              >
                <div style={{ width: mainTableRef.current ? `${mainTableRef.current.scrollWidth}px` : '1600px', height: '1px' }} />
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMainScrollToPercent(0)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Về đầu bảng"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMainScrollBy(-200)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Cuộn sang trái"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMainScrollBy(200)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Cuộn sang phải"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMainScrollToPercent(100)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Đến cuối bảng"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Table Area */}
            <div
              ref={mainTableRef}
              onScroll={handleMainTableScroll}
              className="overflow-x-auto scrollbar-thin max-h-[600px] overflow-y-auto"
            >
              <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
                <thead className="bg-slate-950 text-slate-300 sticky top-0 z-10 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4 w-36">Mã Chứng Từ</th>
                    <th className="py-3.5 px-4 w-28">Loại Phiếu</th>
                    <th className="py-3.5 px-4 w-36">Số Tờ Trình</th>
                    <th className="py-3.5 px-4">Diễn Giải / Tiêu Đề</th>
                    <th className="py-3.5 px-4 w-28">Ngày Lập</th>
                    <th className="py-3.5 px-4 w-32">Người Lập</th>
                    <th className="py-3.5 px-4 w-36">Đối Tác / Kho</th>
                    <th className="py-3.5 px-4 w-24 text-right">Tổng SL</th>
                    <th className="py-3.5 px-4 w-32 text-right">Tổng Tiền</th>
                    <th className="py-3.5 px-4 w-28 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-4 w-32 text-center sticky right-0 bg-slate-950 shadow-l">
                      Thao Tác Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileX2 className="w-10 h-10 text-slate-600" />
                          <p className="text-sm font-medium">Không tìm thấy chứng từ nào khớp với bộ lọc.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                            {tx.code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {tx.type === 'IMPORT' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ArrowDownLeft className="w-3 h-3" /> Nhập kho
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <ArrowUpRight className="w-3 h-3" /> Xuất kho
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {tx.proposalNumber ? (
                            <span className="font-mono text-xs text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/50">
                              {tx.proposalNumber}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">Không có</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-white line-clamp-1">{tx.title}</div>
                          {tx.reason && (
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{tx.reason}</div>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {tx.items?.length || 0} mục vật tư ({tx.items?.map((i) => i.materialCode).slice(0, 3).join(', ')}
                            {(tx.items?.length || 0) > 3 ? '...' : ''})
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{formatDisplayDate(tx.date)}</td>
                        <td className="py-3 px-4 text-slate-300">{tx.creatorName}</td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">
                          {tx.partner || tx.warehouse || 'Kho Tổng'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                          {formatNumber(tx.totalQuantity)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatVND(tx.totalAmount || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tx.status === 'APPROVED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ĐÃ DUYỆT
                            </span>
                          ) : tx.status === 'PENDING' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              CHỜ DUYỆT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              TỪ CHỐI
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center sticky right-0 bg-slate-900/95 backdrop-blur-sm shadow-l">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold border border-blue-500/30 transition flex items-center gap-1"
                              title="Chỉnh sửa chi tiết phiếu này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => setTxToDelete(tx)}
                              className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-semibold border border-rose-500/30 transition flex items-center gap-1"
                              title="Xóa vĩnh viễn chứng từ và hoàn tác tồn kho"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ===================== SECTION 2: PROPOSALS ===================== */}
      {activeSection === 'PROPOSALS' && (
        <div className="space-y-6">
          {/* Quick Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Tổng Tờ Trình</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{formatNumber(propStats.total)}</span>
                <span className="text-xs text-slate-400">bản</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-400 text-xs font-medium">
                <span>Tổng Mục Vật Tư Đề Xuất</span>
                <Tag className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-400">{formatNumber(propStats.totalItems)}</span>
                <span className="text-xs text-slate-400">mục VT</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
                <span>Tờ Trình Đã Duyệt</span>
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">{formatNumber(propStats.approvedCount)}</span>
                <span className="text-xs text-slate-400">bản</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
                <span>Chờ Duyệt / Dự Thảo</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400">{formatNumber(propStats.pendingCount)}</span>
                <span className="text-xs text-slate-400">bản</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm số tờ trình (VD: 26, 21, 31, 17, 22...), nội dung tiêu đề, người lập..."
                  value={proposalSearchTerm}
                  onChange={(e) => setProposalSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {proposalSearchTerm && (
                  <button
                    onClick={() => setProposalSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="md:col-span-4">
                <select
                  value={proposalSelectedStatus}
                  onChange={(e) => setProposalSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Tất cả trạng thái tờ trình</option>
                  <option value="APPROVED">Đã duyệt (APPROVED)</option>
                  <option value="PENDING_APPROVAL">Chờ duyệt (PENDING_APPROVAL)</option>
                  <option value="COMPLETED">Đã hoàn thành nhập (COMPLETED)</option>
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Proposals Table with Top & Bottom Scrollbars */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Top Horizontal Scroll Bar */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MoveHorizontal className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-300">Thanh trượt xem đầy đủ các cột:</span>
              </div>

              <div
                ref={propTopScrollRef}
                onScroll={handlePropTopScroll}
                className="flex-1 overflow-x-auto h-5 scrollbar-thin cursor-ew-resize mx-2"
              >
                <div style={{ width: propTableRef.current ? `${propTableRef.current.scrollWidth}px` : '1400px', height: '1px' }} />
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePropScrollToPercent(0)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Về đầu bảng"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePropScrollBy(-200)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Cuộn sang trái"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePropScrollBy(200)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Cuộn sang phải"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePropScrollToPercent(100)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Đến cuối bảng"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Table Area */}
            <div
              ref={propTableRef}
              onScroll={handlePropTableScroll}
              className="overflow-x-auto scrollbar-thin max-h-[600px] overflow-y-auto"
            >
              <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                <thead className="bg-slate-950 text-slate-300 sticky top-0 z-10 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4 w-40">Số Tờ Trình</th>
                    <th className="py-3.5 px-4">Tiêu Đề / Nội Dung Đề Xuất</th>
                    <th className="py-3.5 px-4 w-28">Ngày Lập</th>
                    <th className="py-3.5 px-4 w-36">Người Đề Xuất</th>
                    <th className="py-3.5 px-4 w-44">Đơn Vị / Bộ Phận</th>
                    <th className="py-3.5 px-4 w-28 text-center">Số Mục VT</th>
                    <th className="py-3.5 px-4 w-28 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-4 w-36 text-center sticky right-0 bg-slate-950 shadow-l">
                      Thao Tác Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-10 h-10 text-slate-600" />
                          <p className="text-sm font-medium">Không tìm thấy Tờ trình nào khớp với bộ lọc.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProposals.map((prop, idx) => (
                      <tr key={prop.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          <span className="px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/50">
                            {prop.proposalNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-white line-clamp-1">{prop.title}</div>
                          {prop.notes && (
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{prop.notes}</div>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {prop.items?.map((i) => `${i.materialCode} (${i.requestedQuantity} ${i.unit})`).slice(0, 3).join(', ')}
                            {(prop.items?.length || 0) > 3 ? '...' : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{formatDisplayDate(prop.date)}</td>
                        <td className="py-3 px-4 text-slate-300">{prop.creatorName}</td>
                        <td className="py-3 px-4 text-slate-400 truncate">{prop.department}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-white">
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                            {prop.items?.length || 0} mục
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {prop.status === 'APPROVED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ĐÃ DUYỆT
                            </span>
                          ) : prop.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              HOÀN TẤT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              CHỜ DUYỆT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center sticky right-0 bg-slate-900/95 backdrop-blur-sm shadow-l">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditProposal(prop)}
                              className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold border border-blue-500/30 transition flex items-center gap-1"
                              title="Chỉnh sửa Tờ trình này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => setPropToDelete(prop)}
                              className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-semibold border border-rose-500/30 transition flex items-center gap-1"
                              title="Xóa vĩnh viễn Tờ trình này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ===================== MODAL: EDIT TRANSACTION ===================== */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Chỉnh Sửa Chứng Từ: <span className="text-blue-400 font-mono">{editingTx.code}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sửa đổi mã phiếu, loại giao dịch, tờ trình và danh sách chi tiết từng dòng vật tư.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTransactionEdits} className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mã Chứng Từ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTxCode}
                    onChange={(e) => setEditTxCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Loại Giao Dịch <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editTxType}
                    onChange={(e) => setEditTxType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="IMPORT">📥 Nhập Kho (IMPORT)</option>
                    <option value="EXPORT">📤 Xuất Kho (EXPORT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ngày Giao Dịch <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editTxDate}
                    onChange={(e) => setEditTxDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Số Tờ Trình Liên Quan
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 22-DNCT/PKT"
                    value={editTxProposal}
                    onChange={(e) => setEditTxProposal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Title & Partner Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tiêu Đề / Nội Dung Phiếu
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tiêu đề hoặc diễn giải tóm tắt..."
                    value={editTxTitle}
                    onChange={(e) => setEditTxTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trạng Thái Duyệt
                  </label>
                  <select
                    value={editTxStatus}
                    onChange={(e) => setEditTxStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="APPROVED">Đã duyệt (APPROVED)</option>
                    <option value="PENDING">Chờ duyệt (PENDING)</option>
                    <option value="REJECTED">Từ chối (REJECTED)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-bold text-white">
                      Danh Sách Vật Tư ({editTxItems.length} mục)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Dòng Vật Tư
                  </button>
                </div>

                {/* Edit Modal Horizontal Scroll Top Bar */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold text-slate-300">Thanh trượt bảng vật tư:</span>
                    </div>

                    <div
                      ref={editModalTopScrollRef}
                      onScroll={handleEditModalTopScroll}
                      className="flex-1 overflow-x-auto h-4 scrollbar-thin cursor-ew-resize mx-2"
                    >
                      <div style={{ width: editModalTableRef.current ? `${editModalTableRef.current.scrollWidth}px` : '900px', height: '1px' }} />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditModalScrollBy(-150)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditModalScrollBy(150)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Edit Modal Table */}
                  <div
                    ref={editModalTableRef}
                    onScroll={handleEditModalTableScroll}
                    className="overflow-x-auto scrollbar-thin max-h-[300px]"
                  >
                    <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 min-w-[280px]">Vật Tư (Chọn hoặc tìm mã DN_)</th>
                          <th className="py-2.5 px-3 w-20 text-center">ĐVT</th>
                          <th className="py-2.5 px-3 w-28 text-right">Số Lượng</th>
                          <th className="py-2.5 px-3 w-36 text-right">Đơn Giá (VNĐ)</th>
                          <th className="py-2.5 px-3 w-36 text-right">Thành Tiền</th>
                          <th className="py-2.5 px-3 w-14 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {editTxItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-500">
                              Chưa có dòng vật tư nào. Bấm "Thêm Dòng Vật Tư" ở trên.
                            </td>
                          </tr>
                        ) : (
                          editTxItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <SearchableMaterialSelect
                                  materials={materials}
                                  value={item.materialCode}
                                  onChange={(matCode) => handleItemMaterialChange(idx, matCode)}
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center font-medium text-slate-400">
                                {item.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                                  className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemFieldChange(idx, 'unitPrice', e.target.value)}
                                  className="w-32 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                {formatVND(item.totalAmount || 0)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditItem(idx)}
                                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Summary Bottom Bar in Modal */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-400">
                  <span>
                    Tổng Số Lượng:{' '}
                    <strong className="text-white font-mono text-sm">
                      {formatNumber(editTxItems.reduce((s, i) => s + (i.quantity || 0), 0))}
                    </strong>
                  </span>
                  <span>
                    Tổng Giá Trị:{' '}
                    <strong className="text-emerald-400 font-mono text-sm">
                      {formatVND(editTxItems.reduce((s, i) => s + (i.totalAmount || 0), 0))}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/30"
                  >
                    Lưu Thay Đổi Chứng Từ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT PROPOSAL ===================== */}
      {editingProp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Chỉnh Sửa Tờ Trình: <span className="text-amber-400 font-mono">{editingProp.proposalNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sửa đổi số tờ trình, tiêu đề đề xuất, đơn vị và danh sách các vật tư cần mua sắm.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProposalEdits} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Số Tờ Trình <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPropNumber}
                    onChange={(e) => setEditPropNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ngày Lập Tờ Trình <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editPropDate}
                    onChange={(e) => setEditPropDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trạng Thái Duyệt
                  </label>
                  <select
                    value={editPropStatus}
                    onChange={(e) => setEditPropStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="APPROVED">Đã duyệt (APPROVED)</option>
                    <option value="PENDING_APPROVAL">Chờ duyệt (PENDING_APPROVAL)</option>
                    <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tiêu Đề / Nội Dung Tờ Trình <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPropTitle}
                    onChange={(e) => setEditPropTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Người Đề Xuất
                  </label>
                  <input
                    type="text"
                    value={editPropCreatorName}
                    onChange={(e) => setEditPropCreatorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      Danh Sách Vật Tư Đề Xuất ({editPropItems.length} mục)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditProposalItem}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-amber-600/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Vật Tư Đề Xuất
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[280px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[240px]">Vật Tư (Chọn mã DN_)</th>
                        <th className="py-2.5 px-3 w-20 text-center">ĐVT</th>
                        <th className="py-2.5 px-3 w-28 text-right">SL Đề Xuất</th>
                        <th className="py-2.5 px-3 w-32 text-right">Đơn Giá Dự Kiến</th>
                        <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {editPropItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">
                            Chưa có dòng vật tư nào trong tờ trình.
                          </td>
                        </tr>
                      ) : (
                        editPropItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <SearchableMaterialSelect
                                materials={materials}
                                value={item.materialCode}
                                onChange={(matCode, selectedMat) => handlePropItemMaterialChange(idx, matCode, selectedMat)}
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-400">
                              {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.requestedQuantity}
                                onChange={(e) => handlePropItemFieldChange(idx, 'requestedQuantity', e.target.value)}
                                className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={item.unitPrice || 0}
                                onChange={(e) => handlePropItemFieldChange(idx, 'unitPrice', e.target.value)}
                                className="w-28 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveEditProposalItem(idx)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Bottom Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProp(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-amber-600/30"
                >
                  Lưu Thay Đổi Tờ Trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: DELETE TRANSACTION ===================== */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Xác Nhận Xóa Chứng Từ?</h3>
              <p className="text-xs text-slate-400">
                Bạn đang thực hiện xóa phiếu{' '}
                <strong className="text-rose-400 font-mono">{txToDelete.code}</strong> (
                {txToDelete.type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}).
              </p>
            </div>

            <div className="p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Cơ chế hoàn tác tự động:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Khi xóa chứng từ này, số lượng tồn kho và thẻ kho sẽ được hoàn tác ngay lập tức về trạng thái trước khi phiếu được lập.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Xác Nhận Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: DELETE PROPOSAL ===================== */}
      {propToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Xóa Vĩnh Viễn Tờ Trình?</h3>
              <p className="text-xs text-slate-400">
                Bạn có chắc chắn muốn xóa Tờ trình{' '}
                <strong className="text-amber-400 font-mono">{propToDelete.proposalNumber}</strong> không?
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
              <div className="text-white font-medium line-clamp-1">{propToDelete.title}</div>
              <div className="text-slate-400 text-[11px]">
                Gồm {propToDelete.items?.length || 0} mục vật tư đề xuất. Tờ trình sẽ bị xóa vĩnh viễn và không tự động xuất hiện lại.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPropToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDeleteProposal}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CLEAR ALL DATA ===================== */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Xóa Sạch Tất Cả Chứng Từ &amp; Tờ Trình?</h3>
              <p className="text-xs text-slate-400">
                Thao tác này sẽ dọn dẹp sạch toàn bộ phiếu nhập/xuất và tờ trình thử nghiệm để chuẩn bị nhập số liệu thực tế.
              </p>
            </div>

            <div className="p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300">
              ⚠️ <strong>Lưu ý:</strong> Danh mục vật tư gốc vẫn được giữ nguyên. Tồn kho thực tế sẽ quay về mức tồn đầu kỳ của từng mã.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-rose-600/30"
              >
                Xác Nhận Dọn Sạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: RESET DEMO DATA ===================== */}
      {showResetDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Nạp Lại Dữ Liệu Mẫu Chuẩn AHT?</h3>
              <p className="text-xs text-slate-400">
                Khôi phục lại toàn bộ phiếu nhập/xuất và tờ trình mẫu của AHT (Tờ trình 22, 27, 29, v.v.).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowResetDemoModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmResetDemo}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/30"
              >
                Nạp Dữ Liệu Mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
