import React, { useState, useMemo, useRef } from 'react';
import {
  FileCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  X,
  Upload,
  Calendar,
  Building2,
  Trash2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoveHorizontal,
  Info,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Lock,
  Edit3,
} from 'lucide-react';
import {
  PurchaseProposal,
  InventoryTransaction,
  Material,
  CalculatedMaterialStock,
  User,
  ProposalItem,
} from '../types';
import { formatVND, formatNumber, formatDisplayDate, isProposalMatch, normalizeProposalNumber } from '../utils/inventoryEngine';
import { SearchableMaterialSelect } from './SearchableMaterialSelect';

interface ProposalReconciliationViewProps {
  currentUser: User;
  proposals: PurchaseProposal[];
  transactions: InventoryTransaction[];
  materials: Material[];
  calculatedStocks: CalculatedMaterialStock[];
  onStartImportForProposal: (proposal: PurchaseProposal, missingItems: Array<{ materialCode: string; missingQty: number; unitPrice: number }>) => void;
  onStartExportForProposal?: (proposal: PurchaseProposal, availableItems: Array<{ materialCode: string; maxExportQty: number; unitPrice: number; name: string }>) => void;
  onUpdateProposal?: (proposal: PurchaseProposal) => void;
  onCreateProposal?: (proposal: PurchaseProposal) => void;
  onDeleteProposal?: (proposalId: string) => void;
}

export const ProposalReconciliationView: React.FC<ProposalReconciliationViewProps> = ({
  currentUser,
  proposals,
  transactions,
  materials,
  calculatedStocks,
  onStartImportForProposal,
  onStartExportForProposal,
  onUpdateProposal,
  onCreateProposal,
  onDeleteProposal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE' | 'UNTOUCHED' | 'CLOSED_EARLY'>('ALL');
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(proposals[0]?.id || null);
  const [viewingAttachment, setViewingAttachment] = useState<{ url: string; name: string; type?: string } | null>(null);
  const [attachmentZoom, setAttachmentZoom] = useState<number>(100);
  const [proposalToDelete, setProposalToDelete] = useState<PurchaseProposal | null>(null);
  const [proposalToCloseEarly, setProposalToCloseEarly] = useState<PurchaseProposal | null>(null);
  const [closeEarlyReason, setCloseEarlyReason] = useState<string>('Nghiệm thu theo số lượng thực nhận, nhà cung cấp không giao tiếp phần còn thiếu.');
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(true);

  // New Proposal Modal
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [newPropNumber, setNewPropNumber] = useState('');
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropDept, setNewPropDept] = useState('Đội Điện Nước Công Trình');
  const [newPropNotes, setNewPropNotes] = useState('');
  const [newPropAttachmentName, setNewPropAttachmentName] = useState('');
  const [newPropAttachmentUrl, setNewPropAttachmentUrl] = useState('');
  const [newPropItems, setNewPropItems] = useState<ProposalItem[]>([
    {
      materialCode: materials[0]?.code || 'DN_CC_00ACB_01',
      materialName: materials[0]?.name || 'Vật tư',
      unit: materials[0]?.unit || 'Cái',
      requestedQuantity: 10,
      unitPrice: materials[0]?.unitPrice || 0,
    },
  ]);

  // Edit Proposal Modal
  const [editingProposal, setEditingProposal] = useState<PurchaseProposal | null>(null);
  const [editPropNumber, setEditPropNumber] = useState('');
  const [editPropTitle, setEditPropTitle] = useState('');
  const [editPropDept, setEditPropDept] = useState('');
  const [editPropDate, setEditPropDate] = useState('');
  const [editPropNotes, setEditPropNotes] = useState('');
  const [editPropItems, setEditPropItems] = useState<ProposalItem[]>([]);

  // Modal Table Horizontal Scroll Synchronization
  const newPropTableRef = useRef<HTMLDivElement>(null);
  const newPropTopScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingNewPropScroll = useRef(false);
  const [newPropScrollProgress, setNewPropScrollProgress] = useState(0);

  const handleNewPropTableScroll = () => {
    if (!newPropTableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = newPropTableRef.current;
    const max = scrollWidth - clientWidth;
    if (max > 0) {
      setNewPropScrollProgress((scrollLeft / max) * 100);
    }
    if (newPropTopScrollRef.current && !isSyncingNewPropScroll.current) {
      isSyncingNewPropScroll.current = true;
      newPropTopScrollRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingNewPropScroll.current = false;
      });
    }
  };

  const handleNewPropTopScroll = () => {
    if (!newPropTopScrollRef.current || !newPropTableRef.current) return;
    const { scrollLeft } = newPropTopScrollRef.current;
    if (!isSyncingNewPropScroll.current) {
      isSyncingNewPropScroll.current = true;
      newPropTableRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingNewPropScroll.current = false;
      });
    }
  };

  const handleNewPropScrollBy = (amount: number) => {
    if (newPropTableRef.current) {
      newPropTableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleNewPropScrollToPercent = (pct: number) => {
    if (newPropTableRef.current) {
      const max = newPropTableRef.current.scrollWidth - newPropTableRef.current.clientWidth;
      newPropTableRef.current.scrollTo({ left: (max * pct) / 100, behavior: 'smooth' });
    }
  };

  // Effective proposals ensuring any proposal referenced in transactions is available
  const effectiveProposals = useMemo(() => {
    const list = proposals.map((p) => {
      const enrichedItems = (p.items || []).map((it) => {
        const mat = materials.find((m) => m.code === it.materialCode);
        let txMatName = '';
        let txUnit = '';
        for (const tx of transactions) {
          const found = tx.items?.find(
            (i) => i.materialCode === it.materialCode && i.materialName && i.materialName.trim() !== 'Vật tư'
          );
          if (found) {
            txMatName = found.materialName;
            txUnit = found.unit;
            break;
          }
        }
        const resolvedName =
          mat?.name && mat.name.trim() !== 'Vật tư'
            ? mat.name
            : it.materialName && it.materialName.trim() !== 'Vật tư'
            ? it.materialName
            : txMatName || mat?.name || it.materialName || 'Vật tư';
        const resolvedUnit = mat?.unit || txUnit || it.unit || 'Cái';
        const resolvedSpec = mat?.specification || (it as any).specification || it.notes || '';

        return {
          ...it,
          materialName: resolvedName,
          specification: resolvedSpec,
          unit: resolvedUnit,
          unitPrice: it.unitPrice || mat?.unitPrice || 0,
        };
      });

      return {
        ...p,
        items: enrichedItems,
      };
    });
    
    // Discover any proposals referenced in transactions that are not in list
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
            attachmentName: tx.attachmentName,
            attachmentUrl: tx.attachmentUrl,
            attachmentHtml: tx.attachmentHtml,
            notes: `Tự động liên kết theo phiếu giao dịch ${tx.code}`,
            createdAt: tx.createdAt || new Date().toISOString(),
            items: tx.items.map((it) => {
              const mat = materials.find((m) => m.code === it.materialCode);
              return {
                materialCode: it.materialCode,
                materialName: (mat?.name && mat.name.trim() !== 'Vật tư') ? mat.name : it.materialName,
                specification: mat?.specification || '',
                unit: mat?.unit || it.unit || 'Cái',
                requestedQuantity: it.quantity,
                unitPrice: it.unitPrice,
              };
            }),
          });
        }
      }
    });

    return list;
  }, [proposals, transactions, materials]);

  // Calculate reconciliation for all proposals
  const reconciliationData = useMemo(() => {
    return effectiveProposals.map((proposal) => {
      // Find all approved or pending IMPORT transactions matching this proposal number
      const relatedImportTxs = transactions.filter(
        (tx) =>
          tx.type === 'IMPORT' &&
          tx.status !== 'REJECTED' &&
          tx.proposalNumber &&
          isProposalMatch(tx.proposalNumber, proposal.proposalNumber)
      );

      // Aggregate imported quantities by material code
      const importedMap = new Map<string, number>();
      relatedImportTxs.forEach((tx) => {
        tx.items.forEach((item) => {
          const current = importedMap.get(item.materialCode) || 0;
          importedMap.set(item.materialCode, current + (Number(item.quantity) || 0));
        });
      });

      // Item level reconciliation
      let totalRequestedQty = 0;
      let totalImportedQty = 0;
      let completedItemsCount = 0;
      const missingItemsList: Array<{ materialCode: string; missingQty: number; unitPrice: number; name: string }> = [];
      const exportableItems: Array<{ materialCode: string; maxExportQty: number; unitPrice: number; name: string; currentStock: number }> = [];

      const reconciledItems = proposal.items.map((pItem) => {
        const masterMat = materials.find((m) => m.code === pItem.materialCode);
        let txItemFound: any = null;
        for (const tx of transactions) {
          const it = tx.items.find(
            (i) => i.materialCode === pItem.materialCode && i.materialName && i.materialName.trim() !== 'Vật tư'
          );
          if (it) {
            txItemFound = it;
            break;
          }
        }

        const resolvedName =
          masterMat?.name && masterMat.name.trim() !== 'Vật tư'
            ? masterMat.name
            : pItem.materialName && pItem.materialName.trim() !== 'Vật tư'
            ? pItem.materialName
            : txItemFound?.materialName || masterMat?.name || pItem.materialName || 'Vật tư';

        const resolvedSpec = masterMat?.specification || (pItem as any).specification || pItem.notes || '';
        const resolvedUnit = masterMat?.unit || txItemFound?.unit || pItem.unit || 'Cái';

        const imported = importedMap.get(pItem.materialCode) || 0;
        const requested = Number(pItem.requestedQuantity) || 0;
        const missing = Math.max(0, requested - imported);
        const isFulfilled = imported >= requested;

        // Current warehouse stock
        const matStock = calculatedStocks.find((m) => m.code === pItem.materialCode);
        const currentStock = matStock ? matStock.currentStock : 0;
        const canExport = currentStock > 0;
        const maxExportQty = Math.min(requested, currentStock);

        totalRequestedQty += requested;
        totalImportedQty += Math.min(requested, imported);

        if (isFulfilled) {
          completedItemsCount++;
        } else {
          missingItemsList.push({
            materialCode: pItem.materialCode,
            missingQty: missing,
            unitPrice: pItem.unitPrice || 0,
            name: resolvedName,
          });
        }

        if (canExport && imported > 0) {
          exportableItems.push({
            materialCode: pItem.materialCode,
            maxExportQty,
            unitPrice: pItem.unitPrice || 0,
            name: resolvedName,
            currentStock,
          });
        }

        return {
          ...pItem,
          materialName: resolvedName,
          specification: resolvedSpec,
          unit: resolvedUnit,
          actualImported: imported,
          missingQuantity: missing,
          isFulfilled,
          percentFulfilled: requested > 0 ? Math.min(100, Math.round((imported / requested) * 100)) : 100,
          currentStock,
          canExport,
          maxExportQty,
        };
      });

      const isClosedEarly = Boolean(proposal.isClosedEarly || proposal.status === 'CLOSED_EARLY');
      const overallPercent =
        totalRequestedQty > 0 ? Math.min(100, Math.round((totalImportedQty / totalRequestedQty) * 100)) : 100;
      const isFullyFulfilled = (overallPercent >= 100 && missingItemsList.length === 0) || isClosedEarly;
      const isUntouched = totalImportedQty === 0;

      return {
        proposal,
        relatedImportTxs,
        reconciledItems,
        totalRequestedQty,
        totalImportedQty,
        overallPercent,
        isFullyFulfilled,
        isUntouched,
        isClosedEarly,
        completedItemsCount,
        totalItemsCount: proposal.items.length,
        missingItemsList,
        exportableItems,
      };
    });
  }, [effectiveProposals, transactions, materials, calculatedStocks]);

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return reconciliationData.filter((item) => {
      if (statusFilter === 'CLOSED_EARLY' && !item.isClosedEarly) return false;
      if (statusFilter === 'COMPLETED' && (!item.isFullyFulfilled || item.isClosedEarly)) return false;
      if (statusFilter === 'INCOMPLETE' && (item.isFullyFulfilled || item.isUntouched || item.isClosedEarly)) return false;
      if (statusFilter === 'UNTOUCHED' && !item.isUntouched) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = item.proposal.proposalNumber.toLowerCase().includes(q);
        const matchTitle = item.proposal.title.toLowerCase().includes(q);
        const matchCreator = item.proposal.creatorName.toLowerCase().includes(q);
        const matchItems = item.reconciledItems.some(
          (i) =>
            i.materialCode.toLowerCase().includes(q) ||
            i.materialName.toLowerCase().includes(q) ||
            (i.specification && i.specification.toLowerCase().includes(q))
        );
        if (!matchNum && !matchTitle && !matchCreator && !matchItems) return false;
      }

      return true;
    });
  }, [reconciliationData, statusFilter, searchQuery]);

  // Handle file upload for new proposal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPropAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPropAttachmentUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Item to new proposal
  const handleAddNewItemRow = () => {
    const defaultMat = materials[0];
    setNewPropItems([
      ...newPropItems,
      {
        materialCode: defaultMat?.code || 'DN_CC_00ACB_01',
        materialName: defaultMat?.name || 'Vật tư mới',
        unit: defaultMat?.unit || 'Cái',
        requestedQuantity: 5,
        unitPrice: defaultMat?.unitPrice || 0,
      },
    ]);
  };

  const handleRemoveNewItemRow = (index: number) => {
    setNewPropItems(newPropItems.filter((_, i) => i !== index));
  };

  const handleNewItemChange = (index: number, field: keyof ProposalItem, value: any) => {
    const updated = [...newPropItems];
    if (field === 'materialCode') {
      const mat = materials.find((m) => m.code === value);
      updated[index] = {
        ...updated[index],
        materialCode: value,
        materialName: mat?.name || updated[index].materialName,
        unit: mat?.unit || updated[index].unit,
        unitPrice: mat?.unitPrice || updated[index].unitPrice,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setNewPropItems(updated);
  };

  // Save new proposal
  const handleSaveNewProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropNumber.trim() || !newPropTitle.trim()) {
      alert('Vui lòng điền đầy đủ Số tờ trình và Tiêu đề đề xuất.');
      return;
    }
    if (newPropItems.length === 0) {
      alert('Vui lòng thêm ít nhất một vật tư đề xuất.');
      return;
    }

    const created: PurchaseProposal = {
      id: `prop-${Date.now()}`,
      proposalNumber: newPropNumber.trim(),
      title: newPropTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      creatorName: currentUser.fullName,
      creatorEmail: currentUser.email,
      department: newPropDept.trim() || 'Đội Điện Nước Công Trình',
      status: 'APPROVED',
      attachmentName: newPropAttachmentName || undefined,
      attachmentUrl: newPropAttachmentUrl || undefined,
      attachmentType: newPropAttachmentName.endsWith('.pdf') ? 'pdf' : 'image',
      notes: newPropNotes.trim() || undefined,
      items: newPropItems,
      createdAt: new Date().toISOString(),
    };

    if (onCreateProposal) {
      onCreateProposal(created);
    }
    setIsNewProposalModalOpen(false);
    setNewPropNumber('');
    setNewPropTitle('');
    setNewPropNotes('');
    setNewPropAttachmentName('');
    setNewPropAttachmentUrl('');
  };

  // Delete a single item row from Proposal
  const handleDeleteItemFromProposal = (proposal: PurchaseProposal, materialCode: string) => {
    if (!onUpdateProposal) return;
    const itemToRemove = proposal.items.find((i) => i.materialCode === materialCode);
    const itemName = itemToRemove ? itemToRemove.materialName : materialCode;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa vật tư "${itemName}" (${materialCode}) khỏi Tờ trình "${proposal.proposalNumber}"?\n\nMục này sẽ không còn xuất hiện trong bảng đối chiếu.`
      )
    ) {
      return;
    }
    const updatedItems = proposal.items.filter((it) => it.materialCode !== materialCode);
    const updatedProp: PurchaseProposal = {
      ...proposal,
      items: updatedItems,
    };
    onUpdateProposal(updatedProp);
  };

  // Clean all unimported items (e.g. items deleted during import voucher creation)
  const handleCleanUnimportedItems = (proposal: PurchaseProposal, reconciledItems: any[]) => {
    if (!onUpdateProposal) return;
    const unimported = reconciledItems.filter((i) => i.actualImported === 0);
    if (unimported.length === 0) {
      alert(`Tất cả ${reconciledItems.length} vật tư trong Tờ trình "${proposal.proposalNumber}" đều đã có phiếu nhập kho.`);
      return;
    }
    if (
      !window.confirm(
        `Tìm thấy ${unimported.length} mục vật tư chưa từng được nhập kho trong Tờ trình "${proposal.proposalNumber}" (bao gồm các mục đã xóa khi lập phiếu nhập kho).\n\nBạn có muốn XÓA BỎ ${unimported.length} mục này để bảng đối chiếu Tờ trình chỉ hiển thị các vật tư thực tế nhập kho?`
      )
    ) {
      return;
    }
    const importedCodes = new Set(reconciledItems.filter((i) => i.actualImported > 0).map((i) => i.materialCode));
    const remainingItems = proposal.items.filter((it) => importedCodes.has(it.materialCode));
    const updatedProp: PurchaseProposal = {
      ...proposal,
      items: remainingItems,
    };
    onUpdateProposal(updatedProp);
  };

  // Open Edit Proposal Modal
  const handleOpenEditProposal = (prop: PurchaseProposal) => {
    setEditingProposal(prop);
    setEditPropNumber(prop.proposalNumber);
    setEditPropTitle(prop.title);
    setEditPropDept(prop.department || 'Đội Điện Nước Công Trình');
    setEditPropDate(prop.date);
    setEditPropNotes(prop.notes || '');
    setEditPropItems(
      (prop.items || []).map((it) => {
        const mat = materials.find((m) => m.code === it.materialCode);
        return {
          materialCode: it.materialCode,
          materialName: (mat?.name && mat.name.trim() !== 'Vật tư') ? mat.name : it.materialName,
          unit: mat?.unit || it.unit || 'Cái',
          requestedQuantity: it.requestedQuantity,
          unitPrice: it.unitPrice || mat?.unitPrice || 0,
        };
      })
    );
  };

  // Add Item in Edit Proposal
  const handleAddEditPropItem = () => {
    const firstMat = materials[0];
    setEditPropItems((prev) => [
      ...prev,
      {
        materialCode: firstMat?.code || 'DN_CC_00ACB_01',
        materialName: firstMat?.name || 'Vật tư mới',
        unit: firstMat?.unit || 'Cái',
        requestedQuantity: 1,
        unitPrice: firstMat?.unitPrice || 0,
      },
    ]);
  };

  // Remove Item in Edit Proposal
  const handleRemoveEditPropItem = (idx: number) => {
    if (editPropItems.length <= 1) {
      alert('Tờ trình cần có ít nhất 1 vật tư.');
      return;
    }
    setEditPropItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Change Item in Edit Proposal
  const handleEditPropItemChange = (idx: number, field: keyof ProposalItem, value: any) => {
    setEditPropItems((prev) => {
      const updated = [...prev];
      if (field === 'materialCode') {
        const mat = materials.find((m) => m.code === value);
        updated[idx] = {
          ...updated[idx],
          materialCode: value,
          materialName: mat?.name || updated[idx].materialName,
          unit: mat?.unit || updated[idx].unit,
          unitPrice: mat?.unitPrice || updated[idx].unitPrice,
        };
      } else {
        updated[idx] = {
          ...updated[idx],
          [field]: value,
        };
      }
      return updated;
    });
  };

  // Save Edit Proposal
  const handleSaveEditProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal || !onUpdateProposal) return;
    if (!editPropNumber.trim() || !editPropTitle.trim()) {
      alert('Vui lòng điền đầy đủ Số tờ trình và Tiêu đề.');
      return;
    }
    if (editPropItems.length === 0) {
      alert('Vui lòng thêm ít nhất một vật tư đề xuất.');
      return;
    }

    const updated: PurchaseProposal = {
      ...editingProposal,
      proposalNumber: editPropNumber.trim(),
      title: editPropTitle.trim(),
      department: editPropDept.trim() || 'Đội Điện Nước Công Trình',
      date: editPropDate || editingProposal.date,
      notes: editPropNotes.trim() || undefined,
      items: editPropItems,
    };

    onUpdateProposal(updated);
    setEditingProposal(null);
  };

  const handleConfirmCloseEarly = () => {
    if (!proposalToCloseEarly || !onUpdateProposal) return;
    const updated: PurchaseProposal = {
      ...proposalToCloseEarly,
      status: 'CLOSED_EARLY',
      isClosedEarly: true,
      closedEarlyReason: closeEarlyReason.trim() || 'Nghiệm thu theo số lượng thực nhận',
      closedEarlyDate: new Date().toISOString().split('T')[0],
      closedEarlyBy: currentUser.fullName,
      notes: `${proposalToCloseEarly.notes ? proposalToCloseEarly.notes + ' | ' : ''}Đã chốt kết thúc ngày ${formatDisplayDate(new Date().toISOString().split('T')[0])} bởi ${currentUser.fullName}. Lý do: ${closeEarlyReason}`,
    };
    onUpdateProposal(updated);
    setProposalToCloseEarly(null);
  };

  const completedCount = reconciliationData.filter((r) => r.isFullyFulfilled && !r.isClosedEarly).length;
  const closedEarlyCount = reconciliationData.filter((r) => r.isClosedEarly).length;
  const incompleteCount = reconciliationData.filter((r) => !r.isFullyFulfilled && !r.isUntouched && !r.isClosedEarly).length;
  const untouchedCount = reconciliationData.filter((r) => r.isUntouched && !r.isClosedEarly).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Đối Chiếu Tờ Trình Nhập Kho & Tiến Độ Cung Ứng
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Quản lý đối chiếu giữa Tờ trình mua sắm và các đợt Nhập - Xuất kho thực tế. Hệ thống hỗ trợ nhập hàng nhiều đợt, cho phép xuất kho thi công ngay các vật tư đã về kho mà không bị tắc nghẽn quy trình.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>{showWorkflowGuide ? 'Ẩn Hướng Dẫn' : 'Xem Hướng Dẫn Nghiệp Vụ'}</span>
            </button>
            <button
              id="btn-create-new-proposal"
              onClick={() => setIsNewProposalModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Tờ Trình Mới</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px]">Tổng số Tờ trình:</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{proposals.length}</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-emerald-500/20">
            <div className="text-emerald-400 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhập đủ (100%):
            </div>
            <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">{completedCount}</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-amber-500/20">
            <div className="text-amber-400 text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Đang nhập thiếu:
            </div>
            <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">{incompleteCount}</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-purple-500/20">
            <div className="text-purple-400 text-[11px] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Đã chốt đóng sớm:
            </div>
            <div className="text-lg font-bold text-purple-300 font-mono mt-0.5">{closedEarlyCount}</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-slate-400 text-[11px]">Chưa nhập kho (0%):</div>
            <div className="text-lg font-bold text-slate-300 font-mono mt-0.5">{untouchedCount}</div>
          </div>
        </div>
      </div>

      {/* Workflow Guide Card */}
      {showWorkflowGuide && (
        <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Quy Trình Nghiệp Vụ: Nhập & Xuất Kho Theo Đợt Khi Hàng Chưa Về Đủ
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    Giải Pháp Thông Suốt
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Xử lý trường hợp nhà cung cấp giao thiếu hoặc giao làm nhiều đợt nhưng công trình cần xuất ngay vật tư đợt 1 để thi công.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWorkflowGuide(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              title="Ẩn hướng dẫn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-indigo-900/40 text-xs">
            <div className="bg-slate-850/80 p-3.5 rounded-xl border border-blue-500/20 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-[11px]">1</span>
                  Lập Nhập Kho Đợt 1
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Nhân viên chọn Tờ trình và lập phiếu nhập kho theo <strong>số lượng thực tế nhận được</strong> (mặt hàng chưa về để 0 hoặc xoá khỏi phiếu).
                </p>
              </div>
              <div className="text-[10px] text-blue-300/80 mt-2 italic font-mono">➡ Không cần chờ đủ 100%</div>
            </div>

            <div className="bg-slate-850/80 p-3.5 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[11px]">2</span>
                  Duyệt Phiếu Đợt 1
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Quản lý <strong>Duyệt phiếu nhập đợt 1</strong>. Tồn kho các vật tư thực nhận <strong>được cộng ngay lập tức</strong>. Tờ trình vẫn bảo lưu các món còn thiếu.
                </p>
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-2 italic font-mono">➡ Tồn kho tăng tức thì</div>
            </div>

            <div className="bg-slate-850/80 p-3.5 rounded-xl border border-amber-500/20 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[11px]">3</span>
                  Xuất Kho Thi Công Ngay
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Nhân viên bấm <strong>"Xuất kho vật tư sẵn có"</strong> để xuất ngay các món đã có trong kho đi phục vụ công trường mà không hề bị chặn.
                </p>
              </div>
              <div className="text-[10px] text-amber-300/80 mt-2 italic font-mono">➡ Không trễ hạn thi công</div>
            </div>

            <div className="bg-slate-850/80 p-3.5 rounded-xl border border-purple-500/20 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-[11px]">4</span>
                  Nhập Đợt Sau / Chốt Sớm
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Khi NCC giao đợt tiếp: bấm <strong>"Nhập bổ sung số còn thiếu"</strong>. Nếu NCC hết hàng không giao tiếp: Quản lý chọn <strong>"Chốt đóng Tờ trình"</strong>.
                </p>
              </div>
              <div className="text-[10px] text-purple-300/80 mt-2 italic font-mono">➡ Hoàn tất linh hoạt</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất Cả ({reconciliationData.length})
          </button>
          <button
            onClick={() => setStatusFilter('INCOMPLETE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'INCOMPLETE' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Còn Thiếu ({incompleteCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã Đủ 100% ({completedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED_EARLY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'CLOSED_EARLY' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Đã Chốt Sớm ({closedEarlyCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('UNTOUCHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'UNTOUCHED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chưa Nhập ({untouchedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo số tờ trình (17-DNCT/PKT), tiêu đề..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Proposal Cards List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
            <p>Không tìm thấy Tờ trình nào theo điều kiện tìm kiếm.</p>
          </div>
        ) : (
          filteredProposals.map((item) => {
            const {
              proposal,
              reconciledItems,
              overallPercent,
              isFullyFulfilled,
              isUntouched,
              isClosedEarly,
              missingItemsList,
              exportableItems,
              relatedImportTxs,
            } = item;

            const isExpanded = expandedProposalId === proposal.id;

            return (
              <div
                key={proposal.id}
                className={`bg-slate-900 border rounded-2xl transition-all shadow-sm ${
                  isClosedEarly
                    ? 'border-purple-500/40 hover:border-purple-500/60'
                    : isFullyFulfilled
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : isUntouched
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-amber-500/40 hover:border-amber-500/60'
                }`}
              >
                {/* Proposal Header Accordion Bar */}
                <div
                  onClick={() => setExpandedProposalId(isExpanded ? null : proposal.id)}
                  className="p-4 sm:p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="bg-blue-950 text-blue-300 border border-blue-700/70 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                        Số: {proposal.proposalNumber}
                      </span>

                      {isClosedEarly ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold">
                          <Lock className="w-3.5 h-3.5" /> ĐÃ CHỐT ĐÓNG SỚM ({overallPercent}%)
                        </span>
                      ) : isFullyFulfilled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ ĐỦ SỐ LƯỢNG (100%)
                        </span>
                      ) : isUntouched ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> CHƯA NHẬP KHO (0%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" /> CÒN THIẾU {missingItemsList.length} MÓN ({overallPercent}%)
                        </span>
                      )}

                      {exportableItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 px-2.5 py-0.5 rounded-full font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Có {exportableItems.length} vật tư sẵn sàng xuất kho
                        </span>
                      )}

                      {proposal.attachmentName && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingAttachment({
                              url: proposal.attachmentUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
                              name: proposal.attachmentName || 'Tờ trình phê duyệt',
                              type: proposal.attachmentType,
                            });
                          }}
                          className="inline-flex items-center gap-1 text-[11px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Đính kèm: {proposal.attachmentName}</span>
                          <Eye className="w-3 h-3 ml-0.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {proposal.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <div>
                        Ngày lập: <strong className="text-slate-300 font-mono">{formatDisplayDate(proposal.date)}</strong>
                      </div>
                      <div>
                        Người đề xuất: <strong className="text-slate-300">{proposal.creatorName}</strong>
                      </div>
                      <div>
                        Đơn vị: <strong className="text-slate-300">{proposal.department}</strong>
                      </div>
                      <div>
                        Phiếu nhập liên quan: <strong className="text-blue-400 font-mono">{relatedImportTxs.length} phiếu</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Progress & Quick Action Button */}
                  <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                    <div className="w-36 text-right space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Tiến độ nhập:</span>
                        <span className={`font-mono font-bold ${isClosedEarly ? 'text-purple-400' : isFullyFulfilled ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {overallPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isClosedEarly ? 'bg-purple-500' : isFullyFulfilled ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${overallPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Button: Xuất kho vật tư sẵn có (nếu có hàng trong kho) */}
                      {exportableItems.length > 0 && onStartExportForProposal && (
                        <button
                          type="button"
                          id={`btn-export-proposal-${proposal.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartExportForProposal(proposal, exportableItems);
                          }}
                          className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-600/30"
                          title="Xuất ngay các vật tư trong tờ trình đã có sẵn trong kho phục vụ công trường"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Xuất Kho Sẵn Có ({exportableItems.length})</span>
                        </button>
                      )}

                      {/* Button: Nhập kho / Nhập bổ sung */}
                      {!isFullyFulfilled && !isClosedEarly && (
                        <button
                          type="button"
                          id={`btn-import-proposal-${proposal.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartImportForProposal(proposal, missingItemsList);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-600/30"
                        >
                          <ArrowDownRight className="w-4 h-4" />
                          <span>{isUntouched ? 'Lập Phiếu Nhập Kho' : 'Nhập Bổ Sung Số Còn Thiếu'}</span>
                        </button>
                      )}

                      {isFullyFulfilled && !isClosedEarly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartImportForProposal(proposal, []);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nhập thêm</span>
                        </button>
                      )}

                      {/* Button: Chốt đóng tờ trình sớm */}
                      {!isFullyFulfilled && !isClosedEarly && (currentUser.email === 'vn.phuoc235@gmail.com' || currentUser.role === 'ADMIN') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProposalToCloseEarly(proposal);
                          }}
                          className="bg-slate-800 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-slate-700 hover:border-purple-500/40 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                          title="Chốt đóng tờ trình theo số lượng thực nhận nếu NCC không giao tiếp"
                        >
                          <Lock className="w-3.5 h-3.5 text-purple-400" />
                          <span>Chốt Đóng Tờ Trình</span>
                        </button>
                      )}

                      {/* Button: Bỏ các mục chưa nhập (Xóa các mục đã xóa khi nhập hàng) */}
                      {reconciledItems.some((ri) => ri.actualImported === 0) && onUpdateProposal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCleanUnimportedItems(proposal, reconciledItems);
                          }}
                          className="bg-slate-800 hover:bg-amber-900/40 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                          title="Xóa bỏ các vật tư chưa từng nhập kho (ví dụ các mục đã xóa khi lập phiếu nhập kho)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Bỏ Mục Chưa Nhập</span>
                        </button>
                      )}

                      {/* Button: Sửa Tờ Trình */}
                      {onUpdateProposal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditProposal(proposal);
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-blue-900/50 text-slate-400 hover:text-blue-300 border border-slate-700 hover:border-blue-500/40 transition-colors"
                          title="Chỉnh sửa thông tin và danh sách vật tư Tờ trình này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {(currentUser.email === 'vn.phuoc235@gmail.com' || currentUser.role === 'ADMIN') && onDeleteProposal && (
                        <button
                          type="button"
                          id={`btn-delete-proposal-${proposal.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProposalToDelete(proposal);
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors"
                          title="Xóa Tờ trình này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Table */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-850/70 space-y-4 animate-in fade-in duration-200">
                    {proposal.notes && (
                      <div className="text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-slate-300">
                        <strong className="text-blue-300">Ghi chú phê duyệt:</strong> {proposal.notes}
                      </div>
                    )}

                    {isClosedEarly && (
                      <div className="text-xs bg-purple-950/40 p-3.5 rounded-xl border border-purple-600/40 text-purple-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-purple-300">
                          <Lock className="w-4 h-4" /> Tờ trình này đã được chốt kết thúc sớm:
                        </div>
                        <p className="text-[11px] text-purple-200/90">
                          Lý do: {proposal.closedEarlyReason || 'Nghiệm thu theo số thực nhận.'} (Chốt ngày {formatDisplayDate(proposal.closedEarlyDate || '')} bởi {proposal.closedEarlyBy || 'Quản lý'})
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Chi Tiết Bảng Đối Chiếu Vật Tư & Tồn Kho Sẵn Có
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Đã hoàn thành: <strong className="text-white">{item.completedItemsCount}/{item.totalItemsCount}</strong> vật tư | Sẵn sàng xuất: <strong className="text-emerald-400">{exportableItems.length}</strong> món
                        </span>
                      </div>

                      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-850 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                            <tr>
                              <th className="py-2.5 px-3">STT</th>
                              <th className="py-2.5 px-3">Mã Vật Tư (DN_*)</th>
                              <th className="py-2.5 px-4">Tên & Quy Cách Vật Tư</th>
                              <th className="py-2.5 px-2 text-center">ĐVT</th>
                              <th className="py-2.5 px-3 text-right">Đề Xuất (Tờ Trình)</th>
                              <th className="py-2.5 px-3 text-right">Đã Nhập Lũy Kế</th>
                              <th className="py-2.5 px-3 text-right">Số Lượng Còn Thiếu</th>
                              <th className="py-2.5 px-3 text-right text-emerald-400">Tồn Kho Hiện Tại</th>
                              <th className="py-2.5 px-3 text-center">Khả Năng Xuất Kho</th>
                              <th className="py-2.5 px-3 text-center">Tiến Độ Nhập</th>
                              <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                              <th className="py-2.5 px-3 text-center w-20">Thao Tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {reconciledItems.map((pItem, idx) => (
                              <tr
                                key={idx}
                                className={`hover:bg-slate-800/50 ${
                                  pItem.isFulfilled ? 'bg-emerald-950/10' : 'bg-amber-950/10'
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-300">
                                  {pItem.materialCode}
                                </td>
                                <td className="py-2.5 px-4 min-w-[220px]">
                                  <div className="font-medium text-white text-xs leading-snug">
                                    {pItem.materialName}
                                  </div>
                                  {pItem.specification ? (
                                    <div className="text-[11px] text-slate-400 mt-0.5 leading-tight font-normal">
                                      {pItem.specification}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="py-2.5 px-2 text-center">{pItem.unit}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                                  {formatNumber(pItem.requestedQuantity)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">
                                  {formatNumber(pItem.actualImported)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold">
                                  {pItem.missingQuantity > 0 ? (
                                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                      -{formatNumber(pItem.missingQuantity)}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 font-semibold">0 (Đã đủ)</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold">
                                  {pItem.currentStock > 0 ? (
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                                      {formatNumber(pItem.currentStock)} {pItem.unit}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">0</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {pItem.currentStock > 0 && pItem.actualImported > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                      <Check className="w-3 h-3" /> Sẵn sàng xuất ({pItem.maxExportQty})
                                    </span>
                                  ) : pItem.actualImported === 0 ? (
                                    <span className="text-[10px] text-slate-500 font-medium">Chưa nhập kho</span>
                                  ) : (
                                    <span className="text-[10px] text-rose-400 font-medium">Đã xuất hết</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="w-16 mx-auto">
                                    <div className="text-[10px] font-mono text-slate-400 mb-0.5">
                                      {pItem.percentFulfilled}%
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          pItem.isFulfilled ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${pItem.percentFulfilled}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {pItem.isFulfilled ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                      <Check className="w-3 h-3" /> Đủ
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                                      <AlertTriangle className="w-3 h-3" /> Thiếu
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {onUpdateProposal && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItemFromProposal(proposal, pItem.materialCode)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors"
                                      title={`Xóa mục ${pItem.materialCode} (${pItem.materialName}) khỏi Tờ trình này`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Related Import Vouchers History */}
                    {relatedImportTxs.length > 0 && (
                      <div className="pt-2">
                        <div className="text-xs font-semibold text-slate-300 mb-2">
                          Các Phiếu Nhập Kho Đã Nhập Cho Tờ Trình Này:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {relatedImportTxs.map((tx) => (
                            <div
                              key={tx.id}
                              className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-mono font-bold text-blue-400">{tx.code}</div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{tx.title}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ngày: {tx.date}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-semibold text-emerald-400">
                                  {formatVND(tx.totalAmount)}
                                </div>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                                  {tx.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox / View Attachment Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Xem File / Ảnh Tờ Trình Đính Kèm</h3>
                <span className="text-xs text-slate-400 font-mono">({viewingAttachment.name})</span>
              </div>
              <button
                onClick={() => setViewingAttachment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-950/60 min-h-[400px]">
              {viewingAttachment.type === 'pdf' || viewingAttachment.name.endsWith('.pdf') ? (
                <div className="text-center space-y-4 max-w-md p-8 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-white text-base">{viewingAttachment.name}</h4>
                  <p className="text-xs text-slate-400">
                    Tài liệu Tờ trình định dạng PDF đã được ký duyệt chính thức bởi Ban Giám đốc và Phòng Kỹ thuật.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => alert(`Đang mở tài liệu: ${viewingAttachment.name}`)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Tải / Xem Trực Tiếp PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-full max-h-[70vh] flex flex-col items-center">
                  <img
                    src={viewingAttachment.url}
                    alt={viewingAttachment.name}
                    className="max-h-[65vh] max-w-full rounded-xl object-contain border border-slate-700 shadow-xl"
                  />
                  <p className="text-xs text-slate-400 mt-3 italic">{viewingAttachment.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Purchase Proposal */}
      {isNewProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Tạo Tờ Trình Đề Xuất Mua Sắm Vật Tư Mới</h3>
              </div>
              <button
                onClick={() => setIsNewProposalModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProposal} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium">
                      Số Tờ Trình Phê Duyệt <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-blue-400 font-normal">
                      (Gõ số tự động format -DNCT/PKT)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={newPropNumber}
                    onChange={(e) => setNewPropNumber(e.target.value)}
                    onBlur={() => {
                      const trimmed = newPropNumber.trim();
                      if (/^\d{1,4}$/.test(trimmed)) {
                        setNewPropNumber(`${trimmed}-DNCT/PKT`);
                      }
                    }}
                    placeholder="Ví dụ: 17, 29, 26 hoặc 48-DNCT/PKT..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                  {/* Quick select proposal numbers */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                    {['29', '17', '26', '31', '08', '45'].map((num) => {
                      const propCode = `${num}-DNCT/PKT`;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNewPropNumber(propCode)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                            newPropNumber === propCode
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-blue-500 hover:text-white'
                          }`}
                        >
                          {propCode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Đơn Vị Đề Xuất</label>
                  <input
                    type="text"
                    value={newPropDept}
                    onChange={(e) => setNewPropDept(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tiêu Đề / Nội Dung Tờ Trình <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newPropTitle}
                  onChange={(e) => setNewPropTitle(e.target.value)}
                  placeholder="Ví dụ: Tờ trình đề xuất mua sắm bổ sung máy cắt không khí ACB & phụ kiện bảo trì..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Upload File / Image Proposal Attachment */}
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-medium">
                  Đính Kèm File / Ảnh Tờ Trình Đã Ký Duyệt <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Chọn File hoặc Ảnh Tờ Trình (.png, .jpg, .pdf)</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {newPropAttachmentName && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                      <FileCheck className="w-4 h-4" />
                      <span>{newPropAttachmentName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPropAttachmentName('');
                          setNewPropAttachmentUrl('');
                        }}
                        className="text-slate-400 hover:text-rose-400 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Items in Proposal with Top Scrollbar & Sticky Header */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 uppercase tracking-wider text-xs">
                    Danh Sách Vật Tư Đề Xuất (Mã Chuẩn DN_*)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNewItemRow}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-lg font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Thêm vật tư
                  </button>
                </div>

                {/* Top Horizontal Scrollbar & Fast Navigation */}
                <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px]">Trượt ngang:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleNewPropScrollToPercent(0)}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                        title="Về đầu"
                      >
                        <ChevronsLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNewPropScrollBy(-200)}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                        title="Sang trái"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNewPropScrollBy(200)}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                        title="Sang phải"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNewPropScrollToPercent(100)}
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
                      value={Math.round(newPropScrollProgress)}
                      onChange={(e) => handleNewPropScrollToPercent(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                      title="Kéo trượt nhanh bảng"
                    />
                    <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                      {Math.round(newPropScrollProgress)}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    <strong className="text-white">{newPropItems.length}</strong> vật tư
                  </div>
                </div>

                {/* Direct Top Scroll Track */}
                <div
                  ref={newPropTopScrollRef}
                  onScroll={handleNewPropTopScroll}
                  className="overflow-x-auto overflow-y-hidden bg-slate-900 border border-slate-800 rounded-md h-2 custom-top-scrollbar"
                >
                  <div className="w-[700px] h-1"></div>
                </div>

                {/* Table with Sticky Header */}
                <div
                  ref={newPropTableRef}
                  onScroll={handleNewPropTableScroll}
                  className="bg-slate-850 border border-slate-800 rounded-xl overflow-x-auto overflow-y-auto max-h-[360px] relative"
                >
                  <table className="w-full text-left text-xs text-slate-300 min-w-[620px] border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                      <tr>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-3 border-b border-slate-800">
                          Vật Tư (Mã DN_*)
                        </th>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-3 text-right border-b border-slate-800">
                          Số Lượng Đề Xuất
                        </th>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-3 text-right border-b border-slate-800">
                          Đơn Giá Dự Kiến
                        </th>
                        <th className="sticky top-0 z-10 bg-slate-900 py-2.5 px-2 text-center border-b border-slate-800">
                          Xóa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {newPropItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 min-w-[280px]">
                            <SearchableMaterialSelect
                              value={item.materialCode}
                              materials={materials}
                              calculatedStocks={calculatedStocks}
                              onChange={(newCode, selectedMat) => {
                                const updated = [...newPropItems];
                                updated[idx] = {
                                  ...updated[idx],
                                  materialCode: newCode,
                                  materialName: selectedMat ? selectedMat.name : updated[idx].materialName,
                                  unit: selectedMat ? selectedMat.unit : updated[idx].unit,
                                  unitPrice: selectedMat ? selectedMat.unitPrice : updated[idx].unitPrice,
                                };
                                setNewPropItems(updated);
                              }}
                              placeholder="Gõ tên hoặc mã vật tư..."
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.requestedQuantity}
                              onChange={(e) =>
                                handleNewItemChange(idx, 'requestedQuantity', Math.max(1, parseInt(e.target.value) || 1))
                              }
                              className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice || 0}
                              onChange={(e) =>
                                handleNewItemChange(idx, 'unitPrice', Math.max(0, parseInt(e.target.value) || 0))
                              }
                              className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {newPropItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveNewItemRow(idx)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Ghi Chú Phê Duyệt</label>
                <textarea
                  value={newPropNotes}
                  onChange={(e) => setNewPropNotes(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú về phê duyệt, căn cứ biên bản hoặc kế hoạch mua sắm..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewProposalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
                >
                  Lưu Tờ Trình Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Close Proposal Early */}
      {proposalToCloseEarly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Chốt Kết Thúc Tờ Trình (Nghiệm Thu Thực Nhận)</h3>
                <p className="text-xs text-purple-300 font-mono">Tờ trình: {proposalToCloseEarly.proposalNumber}</p>
              </div>
            </div>

            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Tiêu đề: <strong className="text-white">{proposalToCloseEarly.title}</strong>
              </p>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                💡 Khi chốt đóng, Tờ trình này sẽ được chuyển sang trạng thái <strong>"ĐÃ CHỐT ĐÓNG SỚM"</strong>, giải phóng đối soát và không còn hiện cảnh báo còn thiếu hàng. Các đợt nhập/xuất trước đó vẫn được lưu trữ đầy đủ.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lý Do Chốt Đóng Sớm <span className="text-rose-400">*</span>:
              </label>
              <textarea
                value={closeEarlyReason}
                onChange={(e) => setCloseEarlyReason(e.target.value)}
                rows={3}
                placeholder="Nhập lý do chốt đóng (VD: NCC hết hàng không thể giao tiếp, chuyển sang phương án mua vật tư tương đương...)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setProposalToCloseEarly(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseEarly}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Xác Nhận Chốt Đóng Tờ Trình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Proposal */}
      {proposalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác Nhận Xóa Tờ Trình</h3>
                <p className="text-xs text-slate-400 font-mono">{proposalToDelete.proposalNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa tờ trình <strong className="text-amber-300">"{proposalToDelete.title}"</strong> ({proposalToDelete.proposalNumber}) không? Dữ liệu này sẽ được xóa khỏi bảng đối soát.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProposalToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProposal) {
                    onDeleteProposal(proposalToDelete.id);
                  }
                  setProposalToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Proposal */}
      {editingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Chỉnh Sửa Tờ Trình Mua Sắm</h3>
                  <p className="text-xs text-blue-300 font-mono">Mã: {editingProposal.proposalNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProposal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProposal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Số Tờ Trình <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPropNumber}
                    onChange={(e) => setEditPropNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tiêu Đề Tờ Trình <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPropTitle}
                    onChange={(e) => setEditPropTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bộ Phận Đề Xuất</label>
                  <input
                    type="text"
                    value={editPropDept}
                    onChange={(e) => setEditPropDept(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ghi Chú Phê Duyệt</label>
                <input
                  type="text"
                  value={editPropNotes}
                  onChange={(e) => setEditPropNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Danh Sách Vật Tư Đề Xuất ({editPropItems.length} mục)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditPropItem}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Dòng Vật Tư
                  </button>
                </div>

                <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-semibold sticky top-0 z-10 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center">STT</th>
                        <th className="py-2 px-3 min-w-[280px]">Vật Tư (Mã Chuẩn DN_*)</th>
                        <th className="py-2 px-3 text-right w-28">SL Đề Xuất</th>
                        <th className="py-2 px-3 text-right w-32">Đơn Giá (VNĐ)</th>
                        <th className="py-2 px-3 text-center w-14">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {editPropItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3 min-w-[280px]">
                            <SearchableMaterialSelect
                              value={item.materialCode}
                              materials={materials}
                              calculatedStocks={calculatedStocks}
                              onChange={(newCode, selectedMat) => {
                                const mat = selectedMat || materials.find((m) => m.code === newCode);
                                setEditPropItems((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = {
                                    ...updated[idx],
                                    materialCode: newCode,
                                    materialName: mat?.name || updated[idx].materialName,
                                    unit: mat?.unit || updated[idx].unit,
                                    unitPrice: mat?.unitPrice || updated[idx].unitPrice,
                                  };
                                  return updated;
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.requestedQuantity}
                              onChange={(e) =>
                                handleEditPropItemChange(
                                  idx,
                                  'requestedQuantity',
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice || 0}
                              onChange={(e) =>
                                handleEditPropItemChange(
                                  idx,
                                  'unitPrice',
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                              className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEditPropItem(idx)}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProposal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Lưu Thay Đổi Tờ Trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
