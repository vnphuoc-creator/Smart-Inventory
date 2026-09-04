import React, { useState, useMemo, useRef, useEffect } from 'react';
import mammoth from 'mammoth';
import {
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Plus,
  Check,
  XCircle,
  Clock,
  Printer,
  Eye,
  FileText,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  PlusCircle,
  FileSpreadsheet,
  FileCheck,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoveHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  InventoryTransaction,
  TransactionType,
  TransactionStatus,
  TransactionItem,
  Material,
  CalculatedMaterialStock,
  User,
  PurchaseProposal,
} from '../types';
import { formatVND, formatNumber, formatDisplayDate, isProposalMatch, normalizeProposalNumber } from '../utils/inventoryEngine';
import { parseDocxHtml } from '../utils/docxProposalParser';
import { isNonMaterialOrCategoryRow, filterValidMaterialItems } from '../utils/materialValidation';
import { AHTLogo } from './AHTLogo';
import { ProposalReconciliationView } from './ProposalReconciliationView';
import { SearchableMaterialSelect } from './SearchableMaterialSelect';
import { ProposalItem } from '../types';
import { printCleanDocument } from '../utils/printHelper';

interface TransactionManagementViewProps {
  currentUser: User;
  allUsers: User[];
  materials: Material[];
  calculatedStocks: CalculatedMaterialStock[];
  transactions: InventoryTransaction[];
  proposals?: PurchaseProposal[];
  onCreateTransaction: (transaction: InventoryTransaction) => void;
  onApproveTransaction: (txId: string, note?: string) => void;
  onRejectTransaction: (txId: string, note?: string) => void;
  onUpdateProposal?: (proposal: PurchaseProposal) => void;
  onCreateProposal?: (proposal: PurchaseProposal) => void;
  onDeleteTransaction?: (txId: string) => void;
  onDeleteProposal?: (proposalId: string) => void;
  initialType?: 'IMPORT' | 'EXPORT';
  initialStatusFilter?: string;
  preselectedMaterialCode?: string;
}

export const TransactionManagementView: React.FC<TransactionManagementViewProps> = ({
  currentUser,
  allUsers,
  materials,
  calculatedStocks,
  transactions,
  proposals = [],
  onCreateTransaction,
  onApproveTransaction,
  onRejectTransaction,
  onUpdateProposal,
  onCreateProposal,
  onDeleteTransaction,
  onDeleteProposal,
  initialType,
  initialStatusFilter,
  preselectedMaterialCode,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IMPORT' | 'EXPORT' | 'PROPOSALS'>(
    initialStatusFilter === 'PENDING' ? 'PENDING' : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxForView, setSelectedTxForView] = useState<InventoryTransaction | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; html?: string; name?: string } | null>(null);
  const [docZoom, setDocZoom] = useState<number>(100);
  const [txToDelete, setTxToDelete] = useState<InventoryTransaction | null>(null);

  // Top & Bottom Horizontal Scroll Synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [tableContentWidth, setTableContentWidth] = useState<number>(1200);
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  // Approval Modal state
  const [approvingTx, setApprovingTx] = useState<InventoryTransaction | null>(null);
  const [approvalNote, setApprovalNote] = useState('Đã kiểm tra chứng từ & phê duyệt nhập/xuất kho.');
  const [rejectingTx, setRejectingTx] = useState<InventoryTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState('Số lượng chưa hợp lệ hoặc thiếu chứng từ đính kèm.');

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>(initialType || 'EXPORT');
  const [formProposalNumber, setFormProposalNumber] = useState('17-DNCT/PKT');
  const [formTitle, setFormTitle] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('Kho Tổng');
  const [formReason, setFormReason] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formAttachmentHtml, setFormAttachmentHtml] = useState('');
  const [isScanningProposal, setIsScanningProposal] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [scannedOriginalProposalItems, setScannedOriginalProposalItems] = useState<ProposalItem[]>([]);
  const [formItems, setFormItems] = useState<
    Array<{
      materialCode: string;
      quantity: number;
      unitPrice: number;
      notes: string;
    }>
  >([]);

  // Modal Items Table Scroll Synchronization
  const modalItemsTableRef = useRef<HTMLDivElement>(null);
  const modalItemsTopScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingModalScroll = useRef(false);
  const [modalItemsScrollProgress, setModalItemsScrollProgress] = useState(0);
  const [modalItemsTableScrollWidth, setModalItemsTableScrollWidth] = useState(1100);

  // Sync scroll width dynamically when formItems or modal opens
  useEffect(() => {
    const updateModalScrollWidth = () => {
      if (modalItemsTableRef.current) {
        setModalItemsTableScrollWidth(modalItemsTableRef.current.scrollWidth);
      }
    };
    updateModalScrollWidth();
    const timer = setTimeout(updateModalScrollWidth, 150);
    return () => clearTimeout(timer);
  }, [formItems, isCreateModalOpen]);

  const handleModalItemsScroll = () => {
    if (!modalItemsTableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = modalItemsTableRef.current;
    const max = scrollWidth - clientWidth;
    if (max > 0) {
      setModalItemsScrollProgress((scrollLeft / max) * 100);
    }
    if (modalItemsTopScrollRef.current && !isSyncingModalScroll.current) {
      isSyncingModalScroll.current = true;
      modalItemsTopScrollRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingModalScroll.current = false;
      });
    }
  };

  const handleModalItemsTopScroll = () => {
    if (!modalItemsTopScrollRef.current || !modalItemsTableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = modalItemsTopScrollRef.current;
    const max = scrollWidth - clientWidth;
    if (max > 0) {
      setModalItemsScrollProgress((scrollLeft / max) * 100);
    }
    if (!isSyncingModalScroll.current) {
      isSyncingModalScroll.current = true;
      modalItemsTableRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingModalScroll.current = false;
      });
    }
  };

  const handleModalItemsScrollBy = (amount: number) => {
    if (modalItemsTableRef.current) {
      modalItemsTableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleModalItemsScrollToPercent = (pct: number) => {
    if (modalItemsTableRef.current) {
      const max = modalItemsTableRef.current.scrollWidth - modalItemsTableRef.current.clientWidth;
      modalItemsTableRef.current.scrollTo({ left: (max * pct) / 100, behavior: 'smooth' });
    }
  };

  // Open create modal with prefilled data if requested
  React.useEffect(() => {
    if (preselectedMaterialCode) {
      const mat = materials.find((m) => m.code === preselectedMaterialCode);
      if (mat) {
        setFormType(initialType || 'EXPORT');
        setFormProposalNumber('17-DNCT/PKT');
        setFormTitle(
          initialType === 'IMPORT'
            ? `Đề xuất nhập bổ sung ${mat.name}`
            : `Đề xuất xuất vật tư ${mat.name}`
        );
        setFormItems([
          {
            materialCode: mat.code,
            quantity: 1,
            unitPrice: mat.unitPrice,
            notes: '',
          },
        ]);
        setIsCreateModalOpen(true);
      }
    }
  }, [preselectedMaterialCode, initialType, materials]);

  const openNewTransactionModal = (type: TransactionType = 'EXPORT') => {
    setFormType(type);
    setFormProposalNumber(type === 'IMPORT' ? '17-DNCT/PKT' : '');
    setFormTitle(
      type === 'IMPORT'
        ? 'Phiếu đề nghị nhập kho vật tư'
        : 'Phiếu đề nghị xuất vật tư thi công'
    );
    setFormWarehouse('Kho Tổng');
    setFormReason(
      type === 'IMPORT'
        ? 'Nhập kho phục vụ công tác bảo trì theo Tờ trình'
        : 'Cấp phát vật tư phục vụ công trình'
    );
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAttachmentName('');
    setFormAttachmentUrl('');
    setFormAttachmentHtml('');
    setScanFeedback(null);
    setIsScanningProposal(false);

    const defaultMat = materials[0];
    setFormItems([
      {
        materialCode: defaultMat ? defaultMat.code : '',
        quantity: 5,
        unitPrice: defaultMat ? defaultMat.unitPrice : 0,
        notes: '',
      },
    ]);
    setIsCreateModalOpen(true);
  };

  // Helper: Start import directly from a Proposal
  const handleStartImportForProposal = (
    proposal: PurchaseProposal,
    missingItems: Array<{ materialCode: string; missingQty: number; unitPrice: number }>
  ) => {
    setFormType('IMPORT');
    setFormProposalNumber(proposal.proposalNumber);
    setFormTitle(`Phiếu nhập kho theo Tờ trình ${proposal.proposalNumber}`);
    setFormWarehouse('Kho Tổng');
    setFormReason(`Nhập vật tư theo Tờ trình ${proposal.proposalNumber} đã được Quản lý phê duyệt`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAttachmentName(proposal.attachmentName || '');
    setFormAttachmentUrl(proposal.attachmentUrl || '');
    setFormAttachmentHtml(proposal.attachmentHtml || '');

    if (missingItems.length > 0) {
      setFormItems(
        missingItems.map((item) => ({
          materialCode: item.materialCode,
          quantity: item.missingQty,
          unitPrice: item.unitPrice,
          notes: `Nhập vật tư theo Tờ trình ${proposal.proposalNumber}`,
        }))
      );
    } else {
      setFormItems(
        proposal.items.map((item) => ({
          materialCode: item.materialCode,
          quantity: item.requestedQuantity,
          unitPrice: item.unitPrice,
          notes: `Nhập theo Tờ trình ${proposal.proposalNumber}`,
        }))
      );
    }
    setIsCreateModalOpen(true);
  };

  // Helper: Live proposal match check in Create Modal
  const matchedProposal = useMemo(() => {
    if (!formProposalNumber.trim()) return null;
    return proposals.find(
      (p) => isProposalMatch(p.proposalNumber, formProposalNumber)
    );
  }, [proposals, formProposalNumber]);

  // Check how much is already imported for this matched proposal
  const matchedProposalProgress = useMemo(() => {
    if (!matchedProposal) return null;
    const relatedTxs = transactions.filter(
      (tx) =>
        tx.type === 'IMPORT' &&
        tx.status !== 'REJECTED' &&
        tx.proposalNumber &&
        isProposalMatch(tx.proposalNumber, matchedProposal.proposalNumber)
    );

    const importedMap = new Map<string, number>();
    relatedTxs.forEach((tx) => {
      tx.items.forEach((item) => {
        const current = importedMap.get(item.materialCode) || 0;
        importedMap.set(item.materialCode, current + (Number(item.quantity) || 0));
      });
    });

    let totalReq = 0;
    let totalImp = 0;
    const missing: Array<{ materialCode: string; missingQty: number; unitPrice: number; name: string }> = [];

    matchedProposal.items.forEach((item) => {
      const imp = importedMap.get(item.materialCode) || 0;
      const req = Number(item.requestedQuantity) || 0;
      totalReq += req;
      totalImp += Math.min(req, imp);
      if (imp < req) {
        missing.push({
          materialCode: item.materialCode,
          missingQty: req - imp,
          unitPrice: item.unitPrice || 0,
          name: item.materialName,
        });
      }
    });

    const percent = totalReq > 0 ? Math.min(100, Math.round((totalImp / totalReq) * 100)) : 100;
    const isComplete = percent >= 100 && missing.length === 0;

    return {
      totalReq,
      totalImp,
      percent,
      isComplete,
      missing,
      txCount: relatedTxs.length,
    };
  }, [matchedProposal, transactions]);

  // Check how much is available in warehouse to export for this matched proposal
  const matchedProposalExportStock = useMemo(() => {
    if (!matchedProposal || formType !== 'EXPORT') return null;

    const relatedImportTxs = transactions.filter(
      (tx) =>
        tx.type === 'IMPORT' &&
        tx.status === 'APPROVED' &&
        tx.proposalNumber &&
        isProposalMatch(tx.proposalNumber, matchedProposal.proposalNumber)
    );

    const importedMap = new Map<string, number>();
    relatedImportTxs.forEach((tx) => {
      tx.items.forEach((item) => {
        const current = importedMap.get(item.materialCode) || 0;
        importedMap.set(item.materialCode, current + (Number(item.quantity) || 0));
      });
    });

    const itemStatusList = matchedProposal.items.map((pItem) => {
      const matStock = calculatedStocks.find((m) => m.code === pItem.materialCode);
      const actualImported = importedMap.get(pItem.materialCode) || 0;
      const currentStock = matStock ? matStock.currentStock : 0;
      const canExport = currentStock > 0;
      const maxExport = Math.min(pItem.requestedQuantity, currentStock);

      return {
        materialCode: pItem.materialCode,
        materialName: pItem.materialName,
        unit: pItem.unit,
        unitPrice: pItem.unitPrice || 0,
        requestedQuantity: pItem.requestedQuantity,
        actualImported,
        currentStock,
        canExport,
        maxExport,
      };
    });

    const readyItems = itemStatusList.filter((i) => i.canExport);
    const notReadyItems = itemStatusList.filter((i) => !i.canExport);

    return {
      itemStatusList,
      readyItems,
      notReadyItems,
      totalRequested: matchedProposal.items.length,
      readyCount: readyItems.length,
    };
  }, [matchedProposal, formType, transactions, calculatedStocks]);

  // Auto-fill available items for EXPORT from matched proposal
  const handleAutoFillReadyExportItems = () => {
    if (!matchedProposalExportStock || matchedProposalExportStock.readyItems.length === 0) return;
    setFormItems(
      matchedProposalExportStock.readyItems.map((r) => ({
        materialCode: r.materialCode,
        quantity: Math.max(1, r.maxExport),
        unitPrice: r.unitPrice,
        notes: `Xuất thi công vật tư đã nhập kho theo Tờ trình ${formProposalNumber}`,
      }))
    );
  };

  // Helper: Start export directly from a Proposal
  const handleStartExportForProposal = (
    proposal: PurchaseProposal,
    availableItems: Array<{ materialCode: string; maxExportQty: number; unitPrice: number; name: string }>
  ) => {
    setFormType('EXPORT');
    setFormProposalNumber(proposal.proposalNumber);
    setFormTitle(`Phiếu xuất kho theo Tờ trình ${proposal.proposalNumber}`);
    setFormWarehouse('Kho Tổng');
    setFormReason(`Xuất kho vật tư phục vụ thi công công trình theo Tờ trình ${proposal.proposalNumber}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAttachmentName(proposal.attachmentName || '');
    setFormAttachmentUrl(proposal.attachmentUrl || '');
    setFormAttachmentHtml(proposal.attachmentHtml || '');

    if (availableItems && availableItems.length > 0) {
      setFormItems(
        availableItems.map((item) => ({
          materialCode: item.materialCode,
          quantity: Math.max(1, item.maxExportQty),
          unitPrice: item.unitPrice,
          notes: `Xuất thi công vật tư đã có trong kho theo Tờ trình ${proposal.proposalNumber}`,
        }))
      );
    } else {
      // Find items in proposal with stock > 0
      const itemsWithStock: typeof formItems = [];
      proposal.items.forEach((pItem) => {
        const matStock = calculatedStocks.find((m) => m.code === pItem.materialCode);
        const currentStock = matStock ? matStock.currentStock : 0;
        if (currentStock > 0) {
          itemsWithStock.push({
            materialCode: pItem.materialCode,
            quantity: Math.min(pItem.requestedQuantity, currentStock),
            unitPrice: pItem.unitPrice || 0,
            notes: `Xuất thi công theo Tờ trình ${proposal.proposalNumber}`,
          });
        }
      });

      if (itemsWithStock.length > 0) {
        setFormItems(itemsWithStock);
      } else {
        const defaultMat = materials[0];
        setFormItems([
          {
            materialCode: defaultMat ? defaultMat.code : '',
            quantity: 1,
            unitPrice: defaultMat ? defaultMat.unitPrice : 0,
            notes: `Xuất thi công theo Tờ trình ${proposal.proposalNumber}`,
          },
        ]);
      }
    }
    setIsCreateModalOpen(true);
  };

  // Auto-fill missing items from matched proposal
  const handleAutoFillMissingItems = () => {
    if (!matchedProposalProgress || matchedProposalProgress.missing.length === 0) return;
    setFormItems(
      matchedProposalProgress.missing.map((m) => ({
        materialCode: m.materialCode,
        quantity: m.missingQty,
        unitPrice: m.unitPrice,
        notes: `Nhập bổ sung phần còn thiếu theo Tờ trình ${formProposalNumber}`,
      }))
    );
  };

  // Handle scanning and parsing proposal file to auto-fill import voucher
  const handleScanProposalFile = async (file: File) => {
    setIsScanningProposal(true);
    setScanFeedback('Đang phân tích và quét thông tin từ tệp tờ trình...');
    setFormAttachmentName(file.name);

    let docHtml = '';
    let rawText = '';

    try {
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const resMammothHtml = await mammoth.convertToHtml({ arrayBuffer });
          docHtml = resMammothHtml.value;
          const resMammothText = await mammoth.extractRawText({ arrayBuffer });
          rawText = resMammothText.value;
          setFormAttachmentHtml(docHtml);
        } catch (e) {
          console.warn('Mammoth docx parse error:', e);
        }
      } else if (file.name.endsWith('.txt')) {
        rawText = await file.text();
        docHtml = `<pre style="white-space: pre-wrap; font-family: inherit;">${rawText}</pre>`;
        setFormAttachmentHtml(docHtml);
      }
    } catch (e) {
      console.warn('File reading error:', e);
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setFormAttachmentUrl(dataUrl);

      let detectedItems: any[] = [];
      let detectedPropNum = '';
      let detectedTitle = '';
      let detectedReason = '';

      // 1. High-precision client-side extraction from HTML & rawText (Mammoth / DOM Parser)
      if (docHtml || rawText) {
        const clientParsed = parseDocxHtml(docHtml, rawText, materials);
        if (clientParsed.proposalNumber) detectedPropNum = clientParsed.proposalNumber;
        if (clientParsed.title) detectedTitle = clientParsed.title;
        if (clientParsed.reason) detectedReason = clientParsed.reason;
        if (clientParsed.items && clientParsed.items.length > 0) {
          detectedItems = clientParsed.items.map((it) => ({
            materialCode: it.materialCode,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            notes: it.notes,
          }));
        }
      }

      // 2. Also try Server Gemini API for OCR / advanced layout recognition
      try {
        const res = await fetch('/api/ai/scan-proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: dataUrl,
            fileName: file.name,
            fileText: rawText,
            docHtml: docHtml,
            availableMaterials: materials.map((m) => ({
              code: m.code,
              name: m.name,
              unit: m.unit,
              unitPrice: m.unitPrice,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.proposalNumber) detectedPropNum = data.proposalNumber;
          if (data.title) detectedTitle = data.title;
          if (data.reason) detectedReason = data.reason;
          if (Array.isArray(data.items) && data.items.length > 0) {
            // Only override if server found valid items
            detectedItems = data.items
              .filter((it: any) => !isNonMaterialOrCategoryRow({ name: it.materialName, code: it.materialCode, unit: it.unit }))
              .map((it: any) => {
                const matchedMat =
                  materials.find((m) => m.code === it.materialCode) ||
                  materials.find((m) => m.name.toLowerCase() === (it.materialName || '').toLowerCase().trim()) ||
                  materials.find((m) => m.name.toLowerCase().includes((it.materialName || '').toLowerCase().trim()));

                return {
                  materialCode: matchedMat ? matchedMat.code : it.materialCode || `DN_VT_${detectedItems.length + 1}`,
                  quantity: Math.max(1, Number(it.quantity) || 1),
                  unitPrice: Number(it.unitPrice) || (matchedMat ? matchedMat.unitPrice : 0),
                  notes: it.notes || `Tự động quét từ Tờ trình ${data.proposalNumber || ''}`,
                };
              })
              .filter((it: any) => !isNonMaterialOrCategoryRow({ code: it.materialCode }));
          }
        }
      } catch {
        // Continue with client-side detected items
      }

      // If server or client didn't extract items, or matched a known system proposal:
      const matchedSystemProposal = proposals.find((p) => {
        if (!detectedPropNum && !file.name) return false;
        if (detectedPropNum && isProposalMatch(p.proposalNumber, detectedPropNum)) return true;
        if (file.name && isProposalMatch(p.proposalNumber, file.name)) return true;
        return false;
      });

      if (matchedSystemProposal) {
        if (!detectedPropNum) detectedPropNum = matchedSystemProposal.proposalNumber;
        if (!detectedTitle) detectedTitle = `Nhập kho theo Tờ trình ${matchedSystemProposal.proposalNumber} - ${matchedSystemProposal.title}`;
        if (!detectedReason) detectedReason = matchedSystemProposal.notes || matchedSystemProposal.title || `Căn cứ Tờ trình ${matchedSystemProposal.proposalNumber}`;
        if (detectedItems.length === 0) {
          detectedItems = matchedSystemProposal.items.map((it) => ({
            materialCode: it.materialCode,
            quantity: it.requestedQuantity,
            unitPrice: it.unitPrice,
            notes: `Nhập theo Tờ trình ${matchedSystemProposal.proposalNumber}`,
          }));
        }
        setScannedOriginalProposalItems(matchedSystemProposal.items);
      } else if (detectedItems.length > 0) {
        // Store the original scanned proposal items (requested quota)
        setScannedOriginalProposalItems(
          detectedItems.map((it) => {
            const matchedMat = materials.find((m) => m.code === it.materialCode);
            return {
              materialCode: it.materialCode,
              materialName: matchedMat ? matchedMat.name : it.materialName || 'Vật tư',
              unit: matchedMat ? matchedMat.unit : it.unit || 'Cái',
              requestedQuantity: Number(it.quantity) || 1,
              unitPrice: Number(it.unitPrice) || (matchedMat ? matchedMat.unitPrice : 0),
            };
          })
        );
      }

      // Apply detected fields to form
      if (detectedPropNum) setFormProposalNumber(detectedPropNum);
      if (detectedTitle) setFormTitle(detectedTitle);
      if (detectedReason) setFormReason(detectedReason);
      if (detectedItems.length > 0) {
        setFormItems(detectedItems);
        setScanFeedback(`✨ Quét thành công! Đã tự động nhận diện Tờ trình "${detectedPropNum || file.name}" và nạp chính xác ${detectedItems.length} mặt hàng.`);
      } else {
        setScanFeedback(`✨ Đã gắn tệp "${file.name}". Bạn có thể chọn tiếp các mặt hàng cần nhập hoặc nạp từ danh mục.`);
      }

      setIsScanningProposal(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle file upload for attachment
  const handleTransactionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (formType === 'IMPORT') {
        handleScanProposalFile(file);
      } else {
        setFormAttachmentName(file.name);
        if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const resMammothHtml = await mammoth.convertToHtml({ arrayBuffer });
            setFormAttachmentHtml(resMammothHtml.value);
          } catch (err) {
            console.warn(err);
          }
        } else if (file.name.endsWith('.txt')) {
          const text = await file.text();
          setFormAttachmentHtml(`<pre style="white-space: pre-wrap;">${text}</pre>`);
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormAttachmentUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddItemRow = () => {
    // If there is a matched proposal, find an item from the proposal that is not yet added
    let defaultCode = '';
    let defaultPrice = 0;

    if (matchedProposal && matchedProposal.items.length > 0) {
      const alreadyAddedCodes = new Set(formItems.map((i) => i.materialCode));
      const nextPropItem = matchedProposal.items.find((pi) => !alreadyAddedCodes.has(pi.materialCode));
      if (nextPropItem) {
        defaultCode = nextPropItem.materialCode;
        defaultPrice = nextPropItem.unitPrice || 0;
      }
    }

    if (!defaultCode) {
      const defaultMat = materials[0];
      defaultCode = defaultMat ? defaultMat.code : '';
      defaultPrice = defaultMat ? defaultMat.unitPrice : 0;
    }

    setFormItems([
      ...formItems,
      {
        materialCode: defaultCode,
        quantity: 1,
        unitPrice: defaultPrice,
        notes: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'materialCode' | 'quantity' | 'unitPrice' | 'notes',
    value: any
  ) => {
    const updated = [...formItems];
    if (field === 'materialCode') {
      const mat = materials.find((m) => m.code === value);
      // Check if this material is in the matched proposal first
      const propItem = matchedProposal?.items.find((pi) => pi.materialCode === value);
      const resolvedPrice =
        propItem && propItem.unitPrice > 0
          ? propItem.unitPrice
          : mat
          ? mat.unitPrice
          : updated[index].unitPrice;

      updated[index] = {
        ...updated[index],
        materialCode: value,
        unitPrice: resolvedPrice,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setFormItems(updated);
  };

  // Submit Transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      alert('Vui lòng thêm ít nhất một vật tư vào phiếu.');
      return;
    }

    // Prepare items with full metadata
    const preparedItems: TransactionItem[] = formItems.map((item) => {
      const matStock = calculatedStocks.find((m) => m.code === item.materialCode);
      const mat = materials.find((m) => m.code === item.materialCode);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.unitPrice) || mat?.unitPrice || 0;

      return {
        materialCode: item.materialCode,
        materialName: mat?.name || 'Vật tư',
        unit: mat?.unit || 'Cái',
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        currentStockAtCreation: matStock?.currentStock || 0,
        notes: item.notes,
        proposalNumber: formProposalNumber.trim() || undefined,
      };
    });

    // STRICT VALIDATION FOR EXPORT: Prevent export if out of stock or insufficient quantity
    if (formType === 'EXPORT') {
      for (const item of preparedItems) {
        const matStock = calculatedStocks.find((m) => m.code === item.materialCode);
        const currentStock = matStock !== undefined ? matStock.currentStock : 0;
        
        if (currentStock <= 0) {
          alert(`🚫 KHÔNG THỂ XUẤT KHO:\nVật tư "${item.materialName}" (Mã: ${item.materialCode}) hiện tại ĐÃ HẾT HÀNG TRONG KHO (Tồn kho: 0).\nVui lòng loại bỏ hoặc điều chỉnh danh sách trước khi xuất!`);
          return;
        }

        if (item.quantity > currentStock) {
          alert(`🚫 KHÔNG THỂ XUẤT KHO:\nVật tư "${item.materialName}" (Mã: ${item.materialCode}) yêu cầu xuất ${item.quantity} ${item.unit}, nhưng tồn kho hiện tại chỉ còn ${currentStock} ${item.unit}.\nSố lượng xuất vượt quá tồn kho khả dụng!`);
          return;
        }
      }
    }

    const totalQty = preparedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmt = preparedItems.reduce((sum, i) => sum + i.totalAmount, 0);

    // If currentUser is Admin, they can auto-approve or create as approved
    const isAutoApprove = currentUser.role === 'ADMIN';
    const dateNum = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const prefix = formType === 'IMPORT' ? 'PN' : 'PX';
    const code = `${prefix}-${dateNum}-${Math.floor(100 + Math.random() * 900)}`;

    const newTx: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      code,
      proposalNumber: formProposalNumber.trim() || undefined,
      type: formType,
      title: formTitle.trim() || `${formType === 'IMPORT' ? 'Phiếu Nhập' : 'Phiếu Xuất'} ${code}`,
      date: formDate,
      creatorEmail: currentUser.email,
      creatorName: currentUser.fullName,
      creatorRole: currentUser.role,
      partner: '',
      warehouse: formWarehouse,
      status: isAutoApprove ? 'APPROVED' : 'PENDING',
      items: preparedItems,
      totalQuantity: totalQty,
      totalAmount: totalAmt,
      reason: formReason,
      attachmentName: formAttachmentName || undefined,
      attachmentUrl: formAttachmentUrl || undefined,
      attachmentHtml: formAttachmentHtml || undefined,
      attachmentType: formAttachmentName.endsWith('.pdf')
        ? 'pdf'
        : formAttachmentName.endsWith('.docx') || formAttachmentName.endsWith('.doc')
        ? 'document'
        : 'image',
      ...(isAutoApprove && {
        approverEmail: currentUser.email,
        approverName: currentUser.fullName,
        approvalDate: formDate,
        approvalNote: 'Quản lý duyệt tự động khi tạo phiếu',
      }),
      createdAt: new Date().toISOString(),
    };

    onCreateTransaction(newTx);

    // Auto-create or ensure Proposal exists in proposals list for tracking and reconciliation
    if (formType === 'IMPORT' && formProposalNumber.trim() && onCreateProposal) {
      const existingProp = proposals.find((p) => isProposalMatch(p.proposalNumber, formProposalNumber));
      if (!existingProp) {
        const propItems: ProposalItem[] =
          scannedOriginalProposalItems.length > 0
            ? scannedOriginalProposalItems
            : preparedItems.map((pi) => ({
                materialCode: pi.materialCode,
                materialName: pi.materialName,
                unit: pi.unit,
                requestedQuantity: Math.max(pi.quantity, 1),
                unitPrice: pi.unitPrice,
              }));

        const newProposalRecord: PurchaseProposal = {
          id: `prop-${Date.now()}`,
          proposalNumber: formProposalNumber.trim(),
          title: formTitle.trim() || `Tờ trình ${formProposalNumber.trim()}`,
          date: formDate,
          creatorName: currentUser.fullName,
          creatorEmail: currentUser.email,
          department: 'Đội Điện Nước Công Trình',
          status: 'PARTIALLY_IMPORTED',
          attachmentName: formAttachmentName || undefined,
          attachmentUrl: formAttachmentUrl || undefined,
          attachmentHtml: formAttachmentHtml || undefined,
          attachmentType: formAttachmentName.endsWith('.pdf')
            ? 'pdf'
            : formAttachmentName.endsWith('.docx') || formAttachmentName.endsWith('.doc')
            ? 'document'
            : 'image',
          notes: formReason || `Tự động khởi tạo và theo dõi đối chiếu theo phiếu ${code}`,
          items: propItems,
          createdAt: new Date().toISOString(),
        };
        onCreateProposal(newProposalRecord);
      }
    }

    setIsCreateModalOpen(false);

    if (isAutoApprove) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {
        // ignore
      }
    }
  };

  const handleConfirmApproval = () => {
    if (!approvingTx) return;
    onApproveTransaction(approvingTx.id, approvalNote);
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    setApprovingTx(null);
  };

  const handleConfirmRejection = () => {
    if (!rejectingTx) return;
    onRejectTransaction(rejectingTx.id, rejectReason);
    setRejectingTx(null);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeTab === 'PENDING' && tx.status !== 'PENDING') return false;
      if (activeTab === 'IMPORT' && tx.type !== 'IMPORT') return false;
      if (activeTab === 'EXPORT' && tx.type !== 'EXPORT') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = tx.code.toLowerCase().includes(q);
        const matchProposal = tx.proposalNumber ? tx.proposalNumber.toLowerCase().includes(q) : false;
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchPartner = tx.partner.toLowerCase().includes(q);
        const matchCreator = tx.creatorName.toLowerCase().includes(q);
        const matchItems = tx.items.some(
          (i) => i.materialCode.toLowerCase().includes(q) || i.materialName.toLowerCase().includes(q)
        );
        if (!matchCode && !matchProposal && !matchTitle && !matchPartner && !matchCreator && !matchItems) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  // Synchronize scroll width between top and bottom horizontal scrollbars
  useEffect(() => {
    const updateWidth = () => {
      if (bottomScrollRef.current) {
        setTableContentWidth(bottomScrollRef.current.scrollWidth);
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, [filteredTransactions, activeTab]);

  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      const { scrollLeft, scrollWidth, clientWidth } = bottomScrollRef.current;
      const max = scrollWidth - clientWidth;
      if (max > 0) {
        setScrollPercent(Math.round((scrollLeft / max) * 100));
      }
    }
  };

  const handleBottomScroll = () => {
    if (bottomScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = bottomScrollRef.current;
      const max = scrollWidth - clientWidth;
      if (max > 0) {
        setScrollPercent(Math.round((scrollLeft / max) * 100));
      }
      if (topScrollRef.current) {
        topScrollRef.current.scrollLeft = scrollLeft;
      }
    }
  };

  const handleSliderScroll = (percent: number) => {
    setScrollPercent(percent);
    if (bottomScrollRef.current) {
      const max = bottomScrollRef.current.scrollWidth - bottomScrollRef.current.clientWidth;
      const targetLeft = (percent / 100) * max;
      bottomScrollRef.current.scrollLeft = targetLeft;
      if (topScrollRef.current) {
        topScrollRef.current.scrollLeft = targetLeft;
      }
    }
  };

  const handleScrollLeft = () => {
    if (bottomScrollRef.current) {
      bottomScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (bottomScrollRef.current) {
      bottomScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleScrollStart = () => {
    if (bottomScrollRef.current) {
      bottomScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleScrollEnd = () => {
    if (bottomScrollRef.current) {
      bottomScrollRef.current.scrollTo({ left: bottomScrollRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Background Main Page (Hidden during print) */}
      <div className="no-print space-y-6">
        {/* Header and top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Quản Lý Nghiệp Vụ Xuất - Nhập - Tồn
            </h1>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {transactions.length} chứng từ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình chuẩn: Tạo phiếu &rarr; Phê duyệt (Chỉ Quản lý) &rarr; Tự động cộng/trừ hàng tồn kho
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-create-export-tx"
            onClick={() => openNewTransactionModal('EXPORT')}
            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{currentUser.role === 'ADMIN' ? '+ Phiếu Xuất Kho' : '+ Đề Xuất Xuất'}</span>
          </button>
          <button
            id="btn-create-import-tx"
            onClick={() => openNewTransactionModal('IMPORT')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/30"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>{currentUser.role === 'ADMIN' ? '+ Phiếu Nhập Kho' : '+ Đề Xuất Nhập'}</span>
          </button>
        </div>
      </div>

      {/* Tabs and search bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status/Type Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất Cả ({transactions.length})
            </button>
            <button
              id="tab-pending-transactions"
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ Phê Duyệt</span>
              {pendingCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('IMPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'IMPORT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Phiếu Nhập (PN)</span>
            </button>
            <button
              onClick={() => setActiveTab('EXPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'EXPORT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Phiếu Xuất (PX)</span>
            </button>
            <button
              id="tab-proposals-reconciliation"
              onClick={() => setActiveTab('PROPOSALS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'PROPOSALS'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-700/50'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Đối Chiếu Tờ Trình ({proposals.length})</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'PROPOSALS' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã phiếu, vật tư, đối tác..."
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
          )}
        </div>
      </div>

      {/* Content: Proposal Reconciliation View or Transactions Table */}
      {activeTab === 'PROPOSALS' ? (
        <ProposalReconciliationView
          currentUser={currentUser}
          materials={materials}
          transactions={transactions}
          proposals={proposals}
          calculatedStocks={calculatedStocks}
          onStartImportForProposal={handleStartImportForProposal}
          onStartExportForProposal={handleStartExportForProposal}
          onUpdateProposal={onUpdateProposal}
          onCreateProposal={onCreateProposal}
          onDeleteProposal={onDeleteProposal}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Always-Visible Top Horizontal Scrollbar Helper */}
          <div className="bg-slate-850 border-b border-slate-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <ArrowRightLeft className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Thanh trượt xem đầy đủ các cột:</span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xl mx-auto sm:mx-2 min-w-[280px]">
              <button
                type="button"
                onClick={handleScrollStart}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition shrink-0"
                title="Về cột đầu tiên bên trái"
              >
                |&lt; Đầu
              </button>
              <button
                type="button"
                onClick={handleScrollLeft}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition shrink-0"
                title="Kéo sang trái"
              >
                &larr; Trái
              </button>

              <div className="flex-1 flex items-center gap-2 px-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scrollPercent}
                  onChange={(e) => handleSliderScroll(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                  title="Kéo con trượt này để cuộn nhanh bảng qua lại"
                />
              </div>

              <button
                type="button"
                onClick={handleScrollRight}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition shrink-0"
                title="Kéo sang phải"
              >
                Phải &rarr;
              </button>
              <button
                type="button"
                onClick={handleScrollEnd}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition shrink-0"
                title="Đến cột cuối cùng bên phải"
              >
                Cuối &gt;|
              </button>
            </div>
          </div>

          {/* Synchronized Top Horizontal Scrollbar Track */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto bg-slate-900/95 border-b border-slate-800 px-1 py-1"
            style={{ height: '14px' }}
          >
            <div style={{ width: `${Math.max(tableContentWidth, 1150)}px`, height: '2px' }} />
          </div>

          {/* Table Container with bottom scroll sync */}
          <div ref={bottomScrollRef} onScroll={handleBottomScroll} className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 min-w-[1100px]">
              <thead className="bg-slate-850 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-3.5 px-3 text-center w-12 font-semibold text-slate-400 uppercase tracking-wider">STT</th>
                  <th className="py-3.5 px-4">Mã Chứng Từ</th>
                  <th className="py-3.5 px-3">Số Tờ Trình</th>
                  <th className="py-3.5 px-3">Loại Phiếu</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Diễn Giải / Tên Phiếu</th>
                  <th className="py-3.5 px-3">Ngày Lập</th>
                  <th className="py-3.5 px-3">Người Lập</th>
                  <th className="py-3.5 px-3 text-right">Tổng SL</th>
                  <th className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                    Tổng Tiền
                  </th>
                  <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    Không tìm thấy chứng từ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/60 transition-colors">
                    {/* STT */}
                    <td className="py-3 px-3 text-center text-slate-500 font-mono font-bold">
                      {idx + 1}
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                        {tx.code}
                      </span>
                    </td>

                    {/* Proposal Number */}
                    <td className="py-3 px-3">
                      {tx.proposalNumber ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-950/70 text-blue-300 border border-blue-700/60 shadow-sm">
                          {tx.proposalNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      {tx.type === 'IMPORT' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                          <ArrowDownRight className="w-3 h-3" /> Nhập kho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                          <ArrowUpRight className="w-3 h-3" /> Xuất kho
                        </span>
                      )}
                    </td>

                    {/* Title & Items Summary */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white text-xs">{tx.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                        {tx.items.map((i) => `${i.materialCode} (${i.quantity} ${i.unit})`).join(', ')}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {tx.date}
                    </td>

                    {/* Creator (No email) */}
                    <td className="py-3 px-3">
                      <div className="text-white text-[11px] font-medium">{tx.creatorName}</div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                      {formatNumber(tx.totalQuantity)}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      {formatVND(tx.totalAmount)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {tx.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                        </span>
                      )}
                      {tx.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium animate-pulse">
                          <Clock className="w-3 h-3" /> Chờ duyệt
                        </span>
                      )}
                      {tx.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium">
                          <XCircle className="w-3 h-3" /> Từ chối
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-view-voucher-${tx.id}`}
                          onClick={() => setSelectedTxForView(tx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Xem & In Phiếu Kế Toán"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {/* Approval buttons for Admin if Pending */}
                        {currentUser.role === 'ADMIN' && tx.status === 'PENDING' && (
                          <>
                            <button
                              id={`btn-approve-tx-${tx.id}`}
                              onClick={() => setApprovingTx(tx)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
                            >
                              <Check className="w-3 h-3" /> Duyệt
                            </button>
                            <button
                              id={`btn-reject-tx-${tx.id}`}
                              onClick={() => setRejectingTx(tx)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Từ chối
                            </button>
                          </>
                        )}

                        {/* Admin Delete button for wrong transactions */}
                        {(currentUser.email === 'vn.phuoc235@gmail.com' || currentUser.role === 'ADMIN') && onDeleteTransaction && (
                          <button
                            id={`btn-delete-tx-${tx.id}`}
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 transition-colors"
                            title="Xóa phiếu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal: Create Transaction / Voucher */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${
                    formType === 'IMPORT' ? 'bg-blue-600/20 text-blue-400' : 'bg-amber-600/20 text-amber-400'
                  } flex items-center justify-center`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {currentUser.role === 'ADMIN'
                      ? formType === 'IMPORT'
                        ? 'Lập Phiếu Nhập Kho Vật Tư'
                        : 'Lập Phiếu Xuất Kho Vật Tư'
                      : formType === 'IMPORT'
                      ? 'Lập Đề Xuất Nhập Kho (Chờ Duyệt)'
                      : 'Lập Đề Xuất Xuất Kho (Chờ Duyệt)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Người lập: <strong className="text-slate-200">{currentUser.fullName}</strong> ({currentUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTransaction} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Type Switcher & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Loại Nghiệp Vụ</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFormType('IMPORT')}
                      className={`py-1.5 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                        formType === 'IMPORT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" /> Nhập Kho
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('EXPORT')}
                      className={`py-1.5 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                        formType === 'EXPORT' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Xuất Kho
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Ngày Chứng Từ</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Kho Thực Hiện</label>
                  <input
                    type="text"
                    value={formWarehouse}
                    onChange={(e) => setFormWarehouse(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tiêu Đề / Diễn Giải <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    formType === 'IMPORT'
                      ? 'Ví dụ: Đề xuất nhập kho cáp điện và phụ kiện...'
                      : 'Ví dụ: Xuất cáp điện thi công tuyến 2...'
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Import vs Export Specific Inputs */}
              {formType === 'IMPORT' ? (
                <div className="space-y-4">
                  {/* AI Proposal Scanner & Auto-Fill Dropzone */}
                  <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/30 border border-blue-800/40 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-blue-200">
                          Quét File / Ảnh Tờ Trình Để Tự Động Điền
                        </span>
                      </div>
                      {isScanningProposal && (
                        <span className="text-[11px] text-amber-300 animate-pulse flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Đang phân tích tờ trình...
                        </span>
                      )}
                    </div>
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800/80 border border-dashed border-blue-500/50 rounded-xl cursor-pointer text-blue-300 hover:text-white text-xs transition-colors">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>Nhấp để tải lên File/Ảnh Tờ Trình (DOCX, PDF, PNG, JPG, TXT)</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleScanProposalFile(f);
                        }}
                        className="hidden"
                      />
                    </label>
                    {scanFeedback && (
                      <div className="text-xs text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{scanFeedback}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-medium">
                          Số Tờ Trình Đề Xuất
                        </label>
                        <span className="text-[11px] text-blue-400 font-normal">
                          (Chỉ cần gõ số, tự động thêm -DNCT/PKT)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formProposalNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormProposalNumber(val);
                        }}
                        onBlur={() => {
                          const trimmed = formProposalNumber.trim();
                          if (/^\d{1,4}$/.test(trimmed)) {
                            setFormProposalNumber(`${trimmed}-DNCT/PKT`);
                          }
                        }}
                        placeholder="Ví dụ: 17, 29, 26 hoặc 17-DNCT/PKT..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500 text-xs"
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
                              onClick={() => setFormProposalNumber(propCode)}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                                formProposalNumber === propCode
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
                      <label className="block text-slate-300 font-medium mb-1">Lý Do Nhập Kho</label>
                      <input
                        type="text"
                        value={formReason}
                        onChange={(e) => setFormReason(e.target.value)}
                        placeholder="Mục đích sử dụng, căn cứ hợp đồng hoặc tờ trình..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Căn Cứ Tờ Trình Xuất Vật Tư (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={formProposalNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormProposalNumber(val);
                        }}
                        onBlur={() => {
                          const trimmed = formProposalNumber.trim();
                          if (/^\d{1,4}$/.test(trimmed)) {
                            setFormProposalNumber(`${trimmed}-DNCT/PKT`);
                          }
                        }}
                        placeholder="Ví dụ: 17, 29, 26 hoặc 17-DNCT/PKT..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
                      />
                      {/* Quick select proposal numbers */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                        {proposals.slice(0, 5).map((p) => {
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setFormProposalNumber(p.proposalNumber)}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                                formProposalNumber === p.proposalNumber
                                  ? 'bg-amber-600 text-white border-amber-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500 hover:text-white'
                              }`}
                            >
                              {p.proposalNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Lý Do Xuất Kho</label>
                      <input
                        type="text"
                        value={formReason}
                        onChange={(e) => setFormReason(e.target.value)}
                        placeholder="Mục đích xuất vật tư, công trình thi công hoặc kế hoạch bảo dưỡng..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Proposal Document / Image Attachment (Optional - "phần import này không bắt buộc") */}
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    File hoặc Ảnh Tờ Trình Đính Kèm{' '}
                    <span className="text-slate-500 font-normal text-[11px]">(Không bắt buộc)</span>
                  </label>
                  {formAttachmentUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormAttachmentName('');
                        setFormAttachmentUrl('');
                        setFormAttachmentHtml('');
                      }}
                      className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Xóa tệp đính kèm
                    </button>
                  )}
                </div>

                {formAttachmentUrl ? (
                  <div className="flex items-center justify-between p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {formAttachmentUrl.startsWith('data:image') || formAttachmentUrl.includes('images.unsplash') ? (
                        <img
                          src={formAttachmentUrl}
                          alt="Đính kèm"
                          className="w-9 h-9 object-cover rounded border border-slate-600 cursor-pointer"
                          onClick={() => setViewingDoc({ url: formAttachmentUrl, html: formAttachmentHtml, name: formAttachmentName })}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-blue-900/40 border border-blue-600 flex items-center justify-center text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-200 truncate max-w-xs">
                          {formAttachmentName || 'Tờ trình đính kèm'}
                        </div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã sẵn sàng lưu cùng phiếu
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingDoc({ url: formAttachmentUrl, html: formAttachmentHtml, name: formAttachmentName })}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium rounded transition-colors shrink-0"
                    >
                      Xem trên hệ thống
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-700 rounded-xl cursor-pointer text-slate-400 hover:text-slate-200 text-xs transition-colors">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>Chọn ảnh hoặc file DOCX / PDF tờ trình (Tùy chọn)</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleTransactionFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Real-time Proposal Reconciliation Banner (IMPORT Mode) */}
              {formType === 'IMPORT' && matchedProposal && matchedProposalProgress && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    matchedProposalProgress.isComplete
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                      : 'bg-indigo-950/40 border-indigo-700/60 text-indigo-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {matchedProposalProgress.isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-white text-sm">
                          Căn cứ Tờ trình: {matchedProposal.proposalNumber} - {matchedProposal.title}
                        </div>
                        <div className="text-xs opacity-90 mt-1 space-y-0.5">
                          {matchedProposalProgress.isComplete ? (
                            <div className="text-emerald-300 font-medium flex items-center gap-1.5">
                              <span>✔ Tờ trình này đã nhập đủ 100% số lượng ({matchedProposalProgress.totalImp}/{matchedProposalProgress.totalReq} vật tư qua {matchedProposalProgress.txCount} lần nhập).</span>
                            </div>
                          ) : (
                            <div>
                              <span>
                                Tiến độ lũy kế: <strong className="text-amber-300">{matchedProposalProgress.percent}%</strong> ({matchedProposalProgress.totalImp}/{matchedProposalProgress.totalReq} vật tư). Còn thiếu <strong className="text-rose-300">{matchedProposalProgress.missing.length} mặt hàng</strong> chưa về kho.
                              </span>
                              <p className="text-[11px] text-slate-300/80 mt-1 italic">
                                💡 Nhập theo đợt: Phiếu nhập này sau khi được Quản lý duyệt sẽ cộng tồn kho ngay cho các vật tư thực nhận. Tờ trình gốc vẫn được bảo lưu tiến độ để tiếp tục theo dõi các đợt giao sau.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (!matchedProposal) return;
                          setFormItems(
                            matchedProposal.items.map((it) => ({
                              materialCode: it.materialCode,
                              quantity: it.requestedQuantity,
                              unitPrice: it.unitPrice,
                              notes: `Nhập theo Tờ trình ${matchedProposal.proposalNumber}`,
                            }))
                          );
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Nạp toàn bộ {matchedProposal.items.length} vật tư
                      </button>
                      {!matchedProposalProgress.isComplete && matchedProposalProgress.missing.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAutoFillMissingItems}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <Clock className="w-3 h-3 text-amber-300" />
                          Nạp {matchedProposalProgress.missing.length} vật tư còn thiếu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Proposal Stock Readiness Banner (EXPORT Mode) */}
              {formType === 'EXPORT' && matchedProposal && matchedProposalExportStock && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    matchedProposalExportStock.readyCount > 0
                      ? 'bg-amber-950/30 border-amber-600/50 text-amber-200'
                      : 'bg-rose-950/30 border-rose-600/50 text-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white text-sm">
                          Đối chiếu xuất kho theo Tờ trình: {matchedProposal.proposalNumber}
                        </div>
                        <div className="text-xs mt-1 space-y-1">
                          <div>
                            Trạng thái hàng trong kho:{' '}
                            <strong className="text-emerald-300">
                              {matchedProposalExportStock.readyCount}/{matchedProposalExportStock.totalRequested} mặt hàng đã có tồn kho
                            </strong>
                            {matchedProposalExportStock.notReadyItems.length > 0 && (
                              <span className="text-slate-300">
                                {' '}(còn {matchedProposalExportStock.notReadyItems.length} mặt hàng tồn kho = 0 do chưa nhập kho hoặc đã xuất hết).
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300/80 italic">
                            💡 Bạn có thể xuất ngay các vật tư đã về kho đợt 1 để thi công trước mà không cần chờ cả tờ trình giao đủ 100%.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {matchedProposalExportStock.readyCount > 0 ? (
                        <button
                          type="button"
                          onClick={handleAutoFillReadyExportItems}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-sm shadow-amber-600/30"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          Nạp {matchedProposalExportStock.readyCount} vật tư sẵn có trong kho
                        </button>
                      ) : (
                        <div className="text-[11px] text-rose-300 bg-rose-900/40 border border-rose-700/50 px-2.5 py-1 rounded-lg">
                          Chưa có vật tư nào trong Tờ trình này nhập vào kho!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table Section with Top Horizontal Scrollbar & Sticky Header */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                    Danh Sách Vật Tư Thuộc Phiếu (Mã DN_*)
                  </span>
                  <button
                    type="button"
                    id="btn-add-item-row"
                    onClick={handleAddItemRow}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> + Thêm dòng vật tư
                  </button>
                </div>

                {/* Top Horizontal Scrollbar & Fast Nav for Modal Items */}
                <div className="bg-slate-800/95 px-3 py-2 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-sm">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-[11px]">
                      <MoveHorizontal className="w-3.5 h-3.5" />
                      <span>Thanh trượt ngang đầu mục:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleModalItemsScrollToPercent(0)}
                        className="px-1.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-[10px] font-medium transition-colors flex items-center gap-0.5"
                        title="Về đầu dòng (Cột Mã/Tên VT)"
                      >
                        <ChevronsLeft className="w-3 h-3" /> Đầu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModalItemsScrollBy(-220)}
                        className="p-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                        title="Cuộn sang trái"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModalItemsScrollBy(220)}
                        className="p-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                        title="Cuộn sang phải"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModalItemsScrollToPercent(100)}
                        className="px-1.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-[10px] font-medium transition-colors flex items-center gap-0.5"
                        title="Đến cuối dòng (Cột Thành Tiền/Xóa)"
                      >
                        Cuối <ChevronsRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(modalItemsScrollProgress)}
                      onChange={(e) => handleModalItemsScrollToPercent(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                      title="Kéo trượt nhanh ngang bảng vật tư"
                    />
                    <span className="text-[11px] text-blue-400 font-mono font-bold w-10 text-right">
                      {Math.round(modalItemsScrollProgress)}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/60">
                    Tổng: <strong className="text-white">{formItems.length}</strong> dòng vật tư
                  </div>
                </div>

                {/* Direct Top Drag Scrollbar Track for Modal Items */}
                <div
                  ref={modalItemsTopScrollRef}
                  onScroll={handleModalItemsTopScroll}
                  className="overflow-x-auto overflow-y-hidden bg-slate-900 border border-slate-700 rounded-lg h-3.5 custom-top-scrollbar cursor-pointer shadow-inner"
                  title="Kéo thanh trượt ngang này qua lại để xem tất cả các cột"
                >
                  <div style={{ width: `${Math.max(modalItemsTableScrollWidth, 1050)}px` }} className="h-1"></div>
                </div>

                {/* Table Container with Sticky Header */}
                <div
                  ref={modalItemsTableRef}
                  onScroll={handleModalItemsScroll}
                  className="bg-slate-850 border border-slate-800 rounded-xl overflow-x-auto overflow-y-auto max-h-[380px] relative shadow-inner"
                >
                  <table className="w-full text-left text-xs text-slate-300 min-w-[760px] border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
                      <tr>
                        <th className="sticky top-0 z-20 bg-slate-900 py-2.5 px-2 text-center w-12 font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800">
                          STT
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-900 py-2.5 px-3 min-w-[340px] sm:min-w-[420px] font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800">
                          Vật Tư & Quy Cách (Mã Chuẩn DN_*)
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-900 py-2.5 px-2 text-center w-24 font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800">
                          Tồn Hiện Tại
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-900 py-2.5 px-3 text-right w-28 font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800">
                          Số Lượng
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-900 py-2.5 px-3 text-right w-32 font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800">
                          Đơn Giá (VNĐ)
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-900 py-2.5 px-3 text-right w-36 font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800">
                          Thành Tiền
                        </th>
                        <th className="sticky top-0 z-20 bg-slate-900 py-2.5 px-2 text-center w-12 font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800">
                          Xóa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {formItems.map((item, idx) => {
                        const matStock = calculatedStocks.find((m) => m.code === item.materialCode);
                        const rowTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                        const isExceedStock =
                          formType === 'EXPORT' && matStock && item.quantity > matStock.currentStock;

                        return (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            {/* STT */}
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400 bg-slate-800/30 border-b border-slate-800/50">
                              {idx + 1}
                            </td>

                            {/* Material Select */}
                            <td className="py-2.5 px-3 min-w-[340px] sm:min-w-[420px]">
                              <SearchableMaterialSelect
                                value={item.materialCode}
                                materials={materials}
                                calculatedStocks={calculatedStocks}
                                onChange={(newCode, selectedMat) => {
                                  const updated = [...formItems];
                                  const propItem = matchedProposal?.items.find((pi) => pi.materialCode === newCode);
                                  const resolvedPrice =
                                    propItem && propItem.unitPrice > 0
                                      ? propItem.unitPrice
                                      : selectedMat
                                      ? selectedMat.unitPrice
                                      : updated[idx].unitPrice;

                                  updated[idx] = {
                                    ...updated[idx],
                                    materialCode: newCode,
                                    unitPrice: resolvedPrice,
                                  };
                                  setFormItems(updated);
                                }}
                                placeholder="Gõ tên hoặc mã vật tư..."
                              />
                            </td>

                            {/* Current Stock info */}
                            <td className="py-2.5 px-2 text-center font-mono text-[11px]">
                              {matStock ? (
                                <span
                                  className={
                                    matStock.currentStock <= 0 ? 'text-rose-400' : 'text-emerald-400'
                                  }
                                >
                                  {matStock.currentStock} {matStock.unit}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>

                            {/* Quantity input */}
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    'quantity',
                                    Math.max(1, parseInt(e.target.value) || 1)
                                  )
                                }
                                className={`w-20 bg-slate-800 border ${
                                  isExceedStock ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'
                                } rounded-lg px-2 py-1 text-right font-mono focus:outline-none`}
                              />
                              {isExceedStock && (
                                <div className="text-[10px] text-rose-400 font-sans mt-0.5">
                                  Vượt quá tồn kho ({matStock?.currentStock})
                                </div>
                              )}
                            </td>

                            {/* Unit Price */}
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    'unitPrice',
                                    Math.max(0, parseInt(e.target.value) || 0)
                                  )
                                }
                                className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white focus:outline-none"
                              />
                            </td>

                            {/* Row Total */}
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                              {formatVND(rowTotal)}
                            </td>

                            {/* Delete row */}
                            <td className="py-2.5 px-2 text-center">
                              {formItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900 font-semibold text-xs border-t border-slate-800">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-slate-300">
                          Tổng Cộng:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-white">
                          {formatNumber(formItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0))}
                        </td>
                        <td></td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 text-sm">
                          {formatVND(
                            formItems.reduce(
                              (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
                              0
                            )
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Export Stock Warning Banner if any item exceeds stock */}
              {formType === 'EXPORT' &&
                formItems.some((item) => {
                  const matStock = calculatedStocks.find((m) => m.code === item.materialCode);
                  const cur = matStock !== undefined ? matStock.currentStock : 0;
                  return cur <= 0 || (Number(item.quantity) || 0) > cur;
                }) && (
                  <div className="p-3 bg-rose-950/70 border border-rose-600/80 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-100 uppercase tracking-wide">
                        Cảnh Báo Không Đủ Tồn Kho
                      </div>
                      <div className="text-[11px] text-rose-300 mt-0.5">
                        Có vật tư trong danh sách đã hết hàng (Tồn: 0) hoặc số lượng xuất vượt quá tồn kho hiện tại. Hệ thống không cho phép xuất kho khi không đủ hàng tồn.
                      </div>
                    </div>
                  </div>
                )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  {currentUser.role === 'ADMIN' ? (
                    <span className="text-emerald-400">
                      ✔ Bạn có quyền Quản lý: Phiếu sẽ được phê duyệt & cập nhật kho ngay lập tức.
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      ⏳ Quyền Nhân viên: Phiếu sẽ được gửi lên Ban Quản lý chờ xét duyệt.
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-tx-form"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentUser.role === 'ADMIN' ? 'Lập Phiếu & Duyệt Kho' : 'Gửi Đề Xuất Phê Duyệt'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Modal: View / Print Voucher (Phiếu Kho Chuẩn Kế Toán) */}
      {selectedTxForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 print:static print:p-0 print:m-0 print:bg-white print:z-auto">
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-w-none print:w-full print:bg-white print:border-none print:shadow-none print:max-h-none print:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="no-print p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Chứng Từ Kho Hàng Số: {selectedTxForView.code}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printCleanDocument()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> In Chứng Từ (PDF)
                </button>
                <button
                  onClick={() => setSelectedTxForView(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Voucher Document Print Body */}
            <div className="printable-area transaction-voucher-print print-portrait p-6 overflow-y-auto bg-white text-slate-900 print:p-0 font-sans space-y-4 print:overflow-visible">
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div className="flex items-center gap-3">
                  <AHTLogo className="h-10" showPlane={false} allowUpload={false} />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-blue-950 uppercase tracking-tight leading-tight">
                      CÔNG TY CỔ PHẦN ĐẦU TƯ KHAI THÁC<br />NHÀ GA QUỐC TẾ ĐÀ NẴNG
                    </h4>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-700 font-mono">Mẫu số: 01-VT</div>
                  <div className="text-xs font-bold text-blue-800 mt-1 font-mono">Số: {selectedTxForView.code}</div>
                  {selectedTxForView.type === 'IMPORT' && selectedTxForView.proposalNumber && (
                    <div className="text-[11px] font-semibold text-slate-700 font-mono mt-0.5">
                      Tờ trình: {selectedTxForView.proposalNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center py-2">
                <h2 className="text-xl font-bold uppercase text-slate-900">
                  {selectedTxForView.type === 'IMPORT' ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO'}
                </h2>
                <p className="text-xs text-slate-600 italic">Ngày {formatDisplayDate(selectedTxForView.date)}</p>
              </div>

              {selectedTxForView.type === 'IMPORT' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <strong>Người lập phiếu:</strong> {selectedTxForView.creatorName}
                  </div>
                  <div>
                    <strong>Số tờ trình:</strong>{' '}
                    <span className="font-mono font-semibold text-blue-900">
                      {selectedTxForView.proposalNumber || 'Theo kế hoạch'}
                    </span>
                  </div>
                  <div>
                    <strong>Kho thực hiện:</strong> {selectedTxForView.warehouse}
                  </div>
                  <div className="sm:col-span-3">
                    <strong>Lý do:</strong> {selectedTxForView.reason || 'Theo nhu cầu bảo trì và vận hành'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 text-xs text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <strong>Người lập phiếu:</strong> {selectedTxForView.creatorName}
                  </div>
                  <div>
                    <strong>Kho thực hiện:</strong> {selectedTxForView.warehouse}
                  </div>
                  <div className="sm:col-span-2">
                    <strong>Lý do xuất:</strong> {selectedTxForView.reason || 'Theo nhu cầu bảo trì, sửa chữa công trình'}
                  </div>
                </div>
              )}

              {/* Items Table */}
              <table className="w-full border-collapse border border-slate-300 text-xs mt-3">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800 text-center">
                    <th className="border border-slate-300 p-2 w-10">STT</th>
                    <th className="border border-slate-300 p-2 text-left">Mã Vật Tư (DN_*)</th>
                    <th className="border border-slate-300 p-2 text-left">Tên & Quy Cách Vật Tư</th>
                    <th className="border border-slate-300 p-2 w-16">ĐVT</th>
                    <th className="border border-slate-300 p-2 text-right w-20">Số Lượng</th>
                    <th className="border border-slate-300 p-2 text-right w-28">Đơn Giá (VNĐ)</th>
                    <th className="border border-slate-300 p-2 text-right w-32">Thành Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTxForView.items.map((item, idx) => (
                    <tr key={idx} className="border border-slate-300">
                      <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-mono font-bold text-blue-900">
                        {item.materialCode}
                      </td>
                      <td className="border border-slate-300 p-2 font-medium">{item.materialName}</td>
                      <td className="border border-slate-300 p-2 text-center">{item.unit}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono">
                        {formatNumber(item.unitPrice)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-950">
                        {formatNumber(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={4} className="border border-slate-300 p-2 text-center uppercase">
                      Tổng Cộng
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatNumber(selectedTxForView.totalQuantity)}
                    </td>
                    <td className="border border-slate-300 p-2"></td>
                    <td className="border border-slate-300 p-2 text-right font-mono text-blue-900 text-sm">
                      {formatVND(selectedTxForView.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures: ONLY 2 Columns as requested */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-8 mt-6 border-t border-slate-200">
                <div className="flex flex-col items-center">
                  <div className="font-bold uppercase tracking-wider text-slate-900">NGƯỜI LẬP PHIẾU</div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký, họ tên)</div>
                  <div className="h-20 w-48 border-b border-dashed border-slate-300 mt-2"></div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="font-bold uppercase tracking-wider text-slate-900">QUẢN LÝ / PHÊ DUYỆT</div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký, đóng dấu)</div>
                  <div className="h-20 w-48 border-b border-dashed border-slate-300 mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Approval */}
      {approvingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác Nhận Phê Duyệt Phiếu</h3>
                <p className="text-xs text-slate-400 font-mono">Mã: {approvingTx.code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Sau khi Quản lý ({currentUser.fullName}) phê duyệt, hệ thống sẽ tự động{' '}
              {approvingTx.type === 'IMPORT' ? 'CỘNG' : 'TRỪ'} số lượng tồn kho cho các mã vật tư trong phiếu.
            </p>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Ý Kiến Phê Duyệt / Ghi Chú:</label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApprovingTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                id="btn-confirm-approve-final"
                onClick={handleConfirmApproval}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30"
              >
                Xác Nhận Duyệt Phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Rejection */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Từ Chối Phê Duyệt Phiếu</h3>
                <p className="text-xs text-slate-400 font-mono">Mã: {rejectingTx.code}</p>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Lý Do Từ Chối:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Từ Chối Phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: In-App Document & Image Viewer (No Forced Download) */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => {
            setViewingDoc(null);
            setDocZoom(100);
          }}
        >
          <div
            className="relative w-full max-w-6xl max-h-[94vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200 truncate max-w-sm">
                  {viewingDoc.name || 'Tài Liệu / Tờ Trình Đính Kèm'}
                </span>
                {viewingDoc.html && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0 hidden sm:inline-block">
                    Xem trực tiếp trên hệ thống (DOCX)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls for Images and Documents */}
                <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDocZoom((prev) => Math.max(50, prev - 25))}
                    className="px-2 py-1 text-xs text-slate-300 hover:text-white rounded hover:bg-slate-700 font-bold"
                    title="Thu nhỏ"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-mono text-slate-200 px-1 font-semibold min-w-[40px] text-center">
                    {docZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocZoom((prev) => Math.min(250, prev + 25))}
                    className="px-2 py-1 text-xs text-slate-300 hover:text-white rounded hover:bg-slate-700 font-bold"
                    title="Phóng to"
                  >
                    +
                  </button>
                  {docZoom !== 100 && (
                    <button
                      type="button"
                      onClick={() => setDocZoom(100)}
                      className="px-1.5 py-0.5 text-[10px] text-blue-400 hover:text-blue-300 rounded hover:bg-slate-700"
                      title="Đặt lại 100%"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setViewingDoc(null);
                    setDocZoom(100);
                  }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-6 overflow-y-auto max-h-[84vh] overflow-x-auto bg-slate-950/60">
              {viewingDoc.html ? (
                <div className="overflow-x-auto pb-4 flex justify-center">
                  <div
                    style={{ transform: `scale(${docZoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
                    className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-md min-w-[780px] text-xs sm:text-sm leading-relaxed"
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: viewingDoc.html }}
                      className="prose prose-sm max-w-none [&_table]:w-full [&_table]:min-w-[720px] [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2.5 [&_th]:bg-slate-100 [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_p]:mb-2"
                    />
                  </div>
                </div>
              ) : viewingDoc.url.startsWith('data:image') || viewingDoc.url.includes('images.unsplash') ? (
                <div className="overflow-auto flex items-center justify-center p-4 min-h-[500px]">
                  <div
                    style={{ transform: `scale(${docZoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
                    className="flex justify-center"
                  >
                    <img
                      src={viewingDoc.url}
                      alt={viewingDoc.name || 'Ảnh tờ trình'}
                      className="max-w-full rounded-lg shadow-2xl border border-slate-700 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <iframe
                  src={viewingDoc.url}
                  title="Tài liệu tờ trình"
                  className="w-full h-[78vh] rounded-lg bg-white shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Transaction */}
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
              Bạn có chắc chắn muốn xóa phiếu <strong className="text-amber-300">{txToDelete.code}</strong> ({txToDelete.type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'})? Số lượng tồn kho và thẻ kho của các mặt hàng liên quan sẽ được tự động hoàn tác và cập nhật lại ngay lập tức.
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
                onClick={() => {
                  if (onDeleteTransaction) {
                    onDeleteTransaction(txToDelete.id);
                  }
                  setTxToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
