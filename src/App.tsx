import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MaterialCatalogueView } from './components/MaterialCatalogueView';
import { TransactionManagementView } from './components/TransactionManagementView';
import { StockLedgerView } from './components/StockLedgerView';
import { UserManagementView } from './components/UserManagementView';
import { DocumentManagementView } from './components/DocumentManagementView';
import { SettingsView } from './components/SettingsView';
import { AiAssistantView } from './components/AiAssistantView';
import { SmartSearchBar } from './components/SmartSearchBar';
import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UserGuideModal } from './components/UserGuideModal';
import {
  INITIAL_USERS,
  INITIAL_MATERIALS,
  INITIAL_TRANSACTIONS,
  INITIAL_PROPOSALS,
  INITIAL_ACTIVITY_LOGS,
} from './data/seedData';
import {
  User,
  Material,
  InventoryTransaction,
  PurchaseProposal,
  NaturalSearchFilters,
  ActivityLog,
  ActivityActionType,
} from './types';
import { calculateAllMaterialStocks, formatVND } from './utils/inventoryEngine';
import {
  subscribeToUsers,
  subscribeToMaterials,
  subscribeToProposals,
  subscribeToTransactions,
  subscribeToLogs,
  saveUserToCloud,
  deleteUserFromCloud,
  saveMaterialToCloud,
  deleteMaterialFromCloud,
  saveProposalToCloud,
  deleteProposalFromCloud,
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  saveLogToCloud,
  deleteLogFromCloud,
  clearTransactionsFromCloud,
  clearProposalsFromCloud,
  clearLogsFromCloud,
  seedMaterials,
  seedProposals,
  seedTransactions,
  seedUsers,
} from './services/firebaseSync';
import {
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ShieldAlert,
  Cloud,
  CloudCheck,
} from 'lucide-react';

export function App() {
  // Global User State with Firebase Cloud Real-time synchronization
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('smart_users_v6');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUserId = localStorage.getItem('smart_auth_user_id');
    if (savedUserId) {
      const found = users.find((u) => u.id === savedUserId);
      if (found) return found;
    }
    // Default to the master admin
    return users.find((u) => u.email === 'vn.phuoc235@gmail.com') || users.find((u) => u.role === 'ADMIN') || users[0];
  });

  // Keep currentUser synced if user record is updated in users list (e.g. password changed on another device)
  useEffect(() => {
    if (currentUser) {
      const updatedRecord = users.find((u) => u.id === currentUser.id);
      if (updatedRecord && (updatedRecord.password !== currentUser.password || updatedRecord.fullName !== currentUser.fullName || updatedRecord.role !== currentUser.role)) {
        setCurrentUser(updatedRecord);
      }
    }
  }, [users, currentUser]);

  // Sync users to localStorage as offline cache
  useEffect(() => {
    localStorage.setItem('smart_users_v6', JSON.stringify(users));
  }, [users]);

  // Connect Firebase Realtime Subscription for Users
  useEffect(() => {
    const unsubscribe = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
      }
    }, INITIAL_USERS);
    return () => unsubscribe();
  }, []);

  const isMasterAdmin =
    currentUser?.email?.toLowerCase().trim() === 'vn.phuoc235@gmail.com' ||
    currentUser?.email?.toLowerCase().trim() === 'vn.phuoc235';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Materials State
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('smart_materials_v12');
    if (saved) {
      try {
        const parsed: Material[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        return INITIAL_MATERIALS;
      }
    }
    return INITIAL_MATERIALS;
  });

  useEffect(() => {
    localStorage.setItem('smart_materials_v12', JSON.stringify(materials));
  }, [materials]);

  // Firebase Realtime Subscription for Materials
  useEffect(() => {
    const unsubscribe = subscribeToMaterials((cloudMaterials) => {
      if (cloudMaterials && cloudMaterials.length > 0) {
        setMaterials(cloudMaterials);
      }
    }, INITIAL_MATERIALS);
    return () => unsubscribe();
  }, []);

  // Proposals State
  const [proposals, setProposals] = useState<PurchaseProposal[]>(() => {
    const saved = localStorage.getItem('smart_proposals_v5');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('smart_proposals_v5', JSON.stringify(proposals));
  }, [proposals]);

  // Firebase Realtime Subscription for Proposals
  useEffect(() => {
    const unsubscribe = subscribeToProposals((cloudProposals) => {
      if (cloudProposals) {
        setProposals(cloudProposals);
      }
    });
    return () => unsubscribe();
  }, []);

  // Transactions State
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem('smart_transactions_v9');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('smart_transactions_v9', JSON.stringify(transactions));
  }, [transactions]);

  // Firebase Realtime Subscription for Transactions
  useEffect(() => {
    const unsubscribe = subscribeToTransactions((cloudTx) => {
      if (cloudTx) {
        setTransactions(cloudTx);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Activity Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('smart_activity_logs_v3');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_ACTIVITY_LOGS;
      }
    }
    return INITIAL_ACTIVITY_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('smart_activity_logs_v3', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Firebase Realtime Subscription for Activity Logs
  useEffect(() => {
    const unsubscribe = subscribeToLogs((cloudLogs) => {
      if (cloudLogs && cloudLogs.length > 0) {
        setActivityLogs(cloudLogs);
      }
    }, INITIAL_ACTIVITY_LOGS);
    return () => unsubscribe();
  }, []);

  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<NaturalSearchFilters | null>(null);
  const [filterExplanation, setFilterExplanation] = useState<string | null>(null);
  const [preselectedMaterialCode, setPreselectedMaterialCode] = useState<string | undefined>(undefined);
  const [transactionTypePreset, setTransactionTypePreset] = useState<'IMPORT' | 'EXPORT'>('EXPORT');
  const [transactionStatusFilterPreset, setTransactionStatusFilterPreset] = useState<string | undefined>(undefined);

  // Theme State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('smart_theme_mode');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('smart_theme_mode', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showToast(
        next === 'light'
          ? 'Đã chuyển sang Giao diện Sáng (Light Theme).'
          : 'Đã chuyển sang Giao diện Tối (Dark Theme).',
        'info'
      );
      return next;
    });
  };

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Activity Logger Helper
  const logActivity = (
    action: ActivityActionType,
    actionTitle: string,
    details: string,
    meta?: {
      documentCode?: string;
      proposalNumber?: string;
      targetType?: 'TRANSACTION' | 'PROPOSAL' | 'MATERIAL' | 'SYSTEM' | 'AUTH';
      amount?: number;
    }
  ) => {
    const actor = currentUser || {
      id: 'system',
      fullName: 'Hệ thống AHT',
      email: 'system@aht.vn',
      role: 'ADMIN',
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: actor.id,
      userName: actor.fullName,
      userEmail: actor.email,
      userRole: actor.role,
      action,
      actionTitle,
      details,
      documentCode: meta?.documentCode,
      proposalNumber: meta?.proposalNumber,
      targetType: meta?.targetType || 'SYSTEM',
      amount: meta?.amount,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    saveLogToCloud(newLog);
  };

  // Real-time calculated stocks calculation
  const calculatedStocks = useMemo(() => {
    return calculateAllMaterialStocks(materials, transactions);
  }, [materials, transactions]);

  // Handler: Update or Add Proposal
  const handleUpdateProposal = (updatedProposal: PurchaseProposal) => {
    setProposals((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedProposal.id || p.proposalNumber === updatedProposal.proposalNumber);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProposal;
        return next;
      }
      return [updatedProposal, ...prev];
    });

    saveProposalToCloud(updatedProposal);

    logActivity(
      'UPDATE_PROPOSAL',
      'Cập nhật Tờ trình',
      `Đã cập nhật sửa đổi Tờ trình ${updatedProposal.proposalNumber} - "${updatedProposal.title}" (${updatedProposal.items?.length || 0} mục vật tư)`,
      { proposalNumber: updatedProposal.proposalNumber, targetType: 'PROPOSAL' }
    );

    showToast(`Đã cập nhật Tờ trình "${updatedProposal.proposalNumber}".`);
  };

  const handleCreateProposal = (newProposal: PurchaseProposal) => {
    setProposals((prev) => [newProposal, ...prev]);
    saveProposalToCloud(newProposal);

    logActivity(
      'CREATE_PROPOSAL',
      'Tạo Tờ trình mua sắm',
      `Đã tạo mới Tờ trình ${newProposal.proposalNumber} - "${newProposal.title}" (${newProposal.items?.length || 0} mục vật tư)`,
      { proposalNumber: newProposal.proposalNumber, targetType: 'PROPOSAL' }
    );

    showToast(`Đã thêm mới Tờ trình "${newProposal.proposalNumber}".`);
  };

  // Login handler
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('smart_auth_user_id', user.id);

    logActivity(
      'LOGIN',
      'Đăng nhập hệ thống',
      `Người dùng ${user.fullName} (${user.email}) đăng nhập thành công vào ca làm việc`,
      { targetType: 'AUTH' }
    );

    showToast(`Chào mừng ${user.fullName} (${user.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'}) đăng nhập thành công!`);
  };

  // Logout handler
  const handleLogout = () => {
    if (currentUser) {
      logActivity(
        'LOGOUT',
        'Đăng xuất hệ thống',
        `Người dùng ${currentUser.fullName} (${currentUser.email}) đã đăng xuất an toàn`,
        { targetType: 'AUTH' }
      );
    }
    setCurrentUser(null);
    localStorage.removeItem('smart_auth_user_id');
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  };

  // Handler: Add or Update Material
  const handleSaveMaterial = (materialToSave: Material) => {
    setMaterials((prev) => {
      const idx = prev.findIndex((m) => m.id === materialToSave.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = materialToSave;
        return next;
      } else {
        return [materialToSave, ...prev];
      }
    });

    saveMaterialToCloud(materialToSave);

    logActivity(
      'UPDATE_MATERIAL',
      'Cập nhật danh mục vật tư',
      `Đã lưu thông tin vật tư ${materialToSave.code} - ${materialToSave.name} (Tồn đầu: ${materialToSave.initialStock} ${materialToSave.unit})`,
      { documentCode: materialToSave.code, targetType: 'MATERIAL' }
    );

    showToast(`Đã lưu thành công vật tư "${materialToSave.code}" vào danh mục.`);
  };

  // Handler: Update / Edit Transaction (Admin)
  const handleUpdateTransaction = (updatedTx: InventoryTransaction) => {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === updatedTx.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedTx;
        return next;
      }
      return [updatedTx, ...prev];
    });

    saveTransactionToCloud(updatedTx);

    logActivity(
      'UPDATE_TX',
      'Chỉnh sửa chứng từ kho',
      `Đã cập nhật chỉnh sửa phiếu ${updatedTx.code} (${updatedTx.type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}) - ${updatedTx.items?.length || 0} mục vật tư, tổng tiền ${formatVND(updatedTx.totalAmount || 0)}`,
      {
        documentCode: updatedTx.code,
        proposalNumber: updatedTx.proposalNumber,
        targetType: 'TRANSACTION',
        amount: updatedTx.totalAmount,
      }
    );

    showToast(`Đã cập nhật chỉnh sửa phiếu "${updatedTx.code}". Tồn kho đã được tính toán lại!`);
  };

  // Handler: Delete Material
  const handleDeleteMaterial = (materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    deleteMaterialFromCloud(materialId);

    logActivity(
      'DELETE_MATERIAL',
      'Xóa mã vật tư',
      `Đã xóa mã vật tư ${mat?.code || materialId} khỏi danh mục`,
      { documentCode: mat?.code || materialId, targetType: 'MATERIAL' }
    );

    showToast(`Đã xóa vật tư "${mat?.code || materialId}" khỏi danh mục.`, 'info');
  };

  // Handler: Create Transaction
  const handleCreateTransaction = (tx: InventoryTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
    saveTransactionToCloud(tx);

    logActivity(
      tx.type === 'IMPORT' ? 'IMPORT_TX' : 'EXPORT_TX',
      tx.type === 'IMPORT' ? 'Lập phiếu nhập kho' : 'Lập phiếu xuất kho',
      `Nhân viên ${tx.creatorName} lập phiếu ${tx.code} (${tx.title || 'Chứng từ kho'}) - ${tx.items?.length || 0} mục vật tư, tổng số lượng ${tx.totalQuantity}, tổng tiền ${formatVND(tx.totalAmount || 0)}`,
      {
        documentCode: tx.code,
        proposalNumber: tx.proposalNumber,
        targetType: 'TRANSACTION',
        amount: tx.totalAmount,
      }
    );

    if (tx.status === 'APPROVED') {
      showToast(`Đã lập & phê duyệt thành công phiếu "${tx.code}". Số lượng tồn kho đã được cập nhật!`);
    } else {
      showToast(`Đã gửi đề xuất "${tx.code}" lên Quản lý chờ phê duyệt.`, 'info');
    }
  };

  // Handler: Approve Transaction
  const handleApproveTransaction = (txId: string, note?: string) => {
    if (!currentUser) return;
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    const approvedTx: InventoryTransaction = {
      ...targetTx,
      status: 'APPROVED',
      approverEmail: currentUser.email,
      approverName: currentUser.fullName,
      approvalDate: new Date().toISOString().split('T')[0],
      approvalNote: note || 'Quản lý đã phê duyệt',
    };

    setTransactions((prev) => prev.map((t) => (t.id === txId ? approvedTx : t)));
    saveTransactionToCloud(approvedTx);

    logActivity(
      'APPROVE_TX',
      'Phê duyệt chứng từ kho',
      `Quản lý ${currentUser.fullName} đã phê duyệt phiếu ${approvedTx.code} (${approvedTx.type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}). Ghi chú: ${note || 'Quản lý đã phê duyệt'}`,
      {
        documentCode: approvedTx.code,
        proposalNumber: approvedTx.proposalNumber,
        targetType: 'TRANSACTION',
        amount: approvedTx.totalAmount,
      }
    );

    showToast(`Quản lý ${currentUser.fullName} đã phê duyệt phiếu "${approvedTx.code}". Tồn kho được cập nhật tức thì!`);
  };

  // Handler: Reject Transaction
  const handleRejectTransaction = (txId: string, note?: string) => {
    if (!currentUser) return;
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    const rejectedTx: InventoryTransaction = {
      ...targetTx,
      status: 'REJECTED',
      approverEmail: currentUser.email,
      approverName: currentUser.fullName,
      approvalDate: new Date().toISOString().split('T')[0],
      approvalNote: note || 'Từ chối phê duyệt',
    };

    setTransactions((prev) => prev.map((t) => (t.id === txId ? rejectedTx : t)));
    saveTransactionToCloud(rejectedTx);

    logActivity(
      'REJECT_TX',
      'Từ chối phê duyệt phiếu',
      `Quản lý ${currentUser.fullName} đã từ chối duyệt phiếu ${rejectedTx.code}. Lý do: ${note || 'Từ chối phê duyệt'}`,
      {
        documentCode: rejectedTx.code,
        proposalNumber: rejectedTx.proposalNumber,
        targetType: 'TRANSACTION',
      }
    );

    showToast(`Đã từ chối phiếu giao dịch "${rejectedTx.code}".`, 'error');
  };

  // Handler: Delete Transaction (Master Admin / Admin)
  const handleDeleteTransaction = async (txId: string) => {
    let code = txId;
    let targetId = txId;
    let txType: string | undefined;
    let propNum: string | undefined;

    setTransactions((prev) => {
      const tx = prev.find((t) => t.id === txId || t.code === txId);
      if (tx) {
        code = tx.code;
        targetId = tx.id;
        txType = tx.type;
        propNum = tx.proposalNumber;
      }
      const nextList = prev.filter(
        (t) =>
          t.id !== targetId &&
          t.code !== code &&
          t.id !== txId &&
          t.code !== txId &&
          t.id?.toLowerCase() !== targetId.toLowerCase() &&
          t.code?.toLowerCase() !== code.toLowerCase()
      );
      localStorage.setItem('smart_transactions_v9', JSON.stringify(nextList));
      return nextList;
    });

    // Delete from Firestore Cloud permanently
    try {
      await deleteTransactionFromCloud(targetId);
      if (code && code !== targetId) {
        await deleteTransactionFromCloud(code);
      }
    } catch (err) {
      console.error('Error deleting transaction from cloud:', err);
    }

    logActivity(
      'DELETE_TX',
      'Xóa chứng từ kho',
      `Đã xóa vĩnh viễn phiếu ${code} (${txType === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}). Số dư tồn kho và thẻ kho đã hoàn tác tự động.`,
      {
        documentCode: code,
        proposalNumber: propNum,
        targetType: 'TRANSACTION',
      }
    );

    showToast(
      `Đã xóa chứng từ "${code}". Số lượng tồn kho và thẻ kho đã được tự động tính toán lại!`,
      'info'
    );
  };

  // Handler: Delete Proposal (Master Admin / Admin)
  const handleDeleteProposal = async (propId: string) => {
    let propNum = propId;
    let targetId = propId;
    let propTitle = '';
    let itemsCount = 0;

    setProposals((prev) => {
      const prop = prev.find((p) => p.id === propId || p.proposalNumber === propId);
      if (prop) {
        propNum = prop.proposalNumber;
        targetId = prop.id;
        propTitle = prop.title || '';
        itemsCount = prop.items?.length || 0;
      }
      const nextList = prev.filter(
        (p) =>
          p.id !== targetId &&
          p.proposalNumber !== propNum &&
          p.id !== propId &&
          p.proposalNumber !== propId &&
          p.id?.toLowerCase() !== targetId.toLowerCase() &&
          p.proposalNumber?.toLowerCase() !== propNum.toLowerCase()
      );
      localStorage.setItem('smart_proposals_v5', JSON.stringify(nextList));
      return nextList;
    });

    // Delete from Firestore Cloud permanently
    try {
      await deleteProposalFromCloud(targetId);
      if (propNum && propNum !== targetId) {
        await deleteProposalFromCloud(propNum);
      }
    } catch (err) {
      console.error('Error deleting proposal from cloud:', err);
    }

    logActivity(
      'DELETE_PROPOSAL',
      'Xóa Tờ trình mua sắm',
      `Đã xóa vĩnh viễn Tờ trình ${propNum} - "${propTitle}" (${itemsCount} mục vật tư đề xuất)`,
      { proposalNumber: propNum, targetType: 'PROPOSAL' }
    );

    showToast(
      `Đã xóa vĩnh viễn Tờ trình "${propNum}" thành công.`,
      'info'
    );
  };

  // Handler: Reset Default Demo Data
  const handleResetDemoData = () => {
    setMaterials(INITIAL_MATERIALS);
    setTransactions(INITIAL_TRANSACTIONS);
    setProposals(INITIAL_PROPOSALS);
    localStorage.setItem('smart_materials_v12', JSON.stringify(INITIAL_MATERIALS));
    localStorage.setItem('smart_transactions_v9', JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem('smart_proposals_v5', JSON.stringify(INITIAL_PROPOSALS));
    seedMaterials(INITIAL_MATERIALS);
    seedTransactions(INITIAL_TRANSACTIONS);
    seedProposals(INITIAL_PROPOSALS);

    logActivity(
      'RESET_DEMO',
      'Khôi phục dữ liệu mẫu AHT',
      'Đã khôi phục toàn bộ danh mục vật tư gốc chuẩn AHT và các tờ trình mẫu ban đầu',
      { targetType: 'SYSTEM' }
    );

    showToast('Đã khôi phục dữ liệu mẫu gốc chuẩn AHT thành công!', 'success');
  };

  // Handler: Clear All Demo Data for Real Data Import
  const handleClearAllTransactionsAndProposals = async () => {
    setTransactions([]);
    setProposals([]);
    localStorage.setItem('smart_transactions_v9', JSON.stringify([]));
    localStorage.setItem('smart_proposals_v5', JSON.stringify([]));
    await clearTransactionsFromCloud();
    await clearProposalsFromCloud();

    logActivity(
      'CLEAR_DATA',
      'Dọn sạch toàn bộ chứng từ & tờ trình',
      'Đã dọn dẹp sạch toàn bộ phiếu xuất nhập kho và tờ trình thử nghiệm để sẵn sàng cho dữ liệu thực tế',
      { targetType: 'SYSTEM' }
    );

    showToast('Đã dọn dẹp sạch toàn bộ chứng từ & tờ trình thử nghiệm. Sẵn sàng nhập số liệu thực tế!', 'success');
  };

  // Handler: Clear Activity Logs
  const handleClearActivityLogs = async () => {
    setActivityLogs([]);
    localStorage.setItem('smart_activity_logs_v3', JSON.stringify([]));
    await clearLogsFromCloud();
    showToast('Đã xóa sạch toàn bộ lịch sử thao tác real-time!', 'info');
  };

  // Handler: Open Stock Card
  const handleOpenStockCard = (materialCode: string) => {
    setPreselectedMaterialCode(materialCode);
    setActiveTab('ledger');
  };

  // Handler: Open Create Transaction
  const handleOpenCreateTransaction = (type: 'IMPORT' | 'EXPORT', materialCode?: string) => {
    setTransactionTypePreset(type);
    setPreselectedMaterialCode(materialCode);
    setActiveTab('transactions');
  };

  // Handler: Update User Info (Password change, role change, etc. - Synced to Firebase Cloud)
  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    saveUserToCloud(updatedUser);
    logActivity(
      'PASSWORD_CHANGE',
      'Cập nhật thông tin / mật khẩu tài khoản',
      `Tài khoản ${updatedUser.fullName} (${updatedUser.email}) đã được cập nhật thành công và đồng bộ lên Cloud`,
      { targetType: 'AUTH' }
    );
  };

  // Handler: Add New User
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    saveUserToCloud(newUser);
    logActivity(
      'PASSWORD_CHANGE',
      'Tạo tài khoản mới',
      `Đã tạo tài khoản mới cho ${newUser.fullName} (${newUser.email}, vai trò ${newUser.roleName})`,
      { targetType: 'AUTH' }
    );
    showToast(`Đã thêm thành công người dùng mới: ${newUser.fullName}`);
  };

  // Handler: Apply AI Natural Search Filters
  const handleApplyNaturalFilters = (filters: NaturalSearchFilters, explanation: string) => {
    setAppliedFilters(filters);
    setFilterExplanation(explanation);
    setActiveTab('materials');
  };

  const handleClearFilters = () => {
    setAppliedFilters(null);
    setFilterExplanation(null);
  };

  // Unauthenticated view
  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        pendingApprovalsCount={transactions.filter((t) => t.status === 'PENDING').length}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingApprovalsCount={transactions.filter((t) => t.status === 'PENDING').length}
          onOpenAiSearch={() => setIsSmartSearchOpen(true)}
          onLogout={handleLogout}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onOpenUserGuide={() => setIsUserGuideOpen(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/50">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              calculatedStocks={calculatedStocks}
              transactions={transactions}
              onNavigateTab={(tab, filter) => {
                if (tab === 'transactions') {
                  if (filter === 'IMPORT' || filter === 'EXPORT') {
                    setTransactionTypePreset(filter);
                    setTransactionStatusFilterPreset(undefined);
                  } else if (filter === 'PENDING') {
                    setTransactionStatusFilterPreset('PENDING');
                  } else {
                    setTransactionStatusFilterPreset(undefined);
                  }
                }
                setActiveTab(tab);
              }}
              onOpenStockCard={handleOpenStockCard}
              onOpenCreateTransaction={handleOpenCreateTransaction}
              onApproveTransaction={handleApproveTransaction}
              onRejectTransaction={handleRejectTransaction}
            />
          )}

          {(activeTab === 'materials' || activeTab === 'catalogue') && (
            <MaterialCatalogueView
              currentUser={currentUser}
              allUsers={users}
              materials={materials}
              calculatedStocks={calculatedStocks}
              onSaveMaterial={handleSaveMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onOpenStockCard={handleOpenStockCard}
              onOpenCreateTransaction={handleOpenCreateTransaction}
              appliedFilters={appliedFilters}
              filterExplanation={filterExplanation}
              onClearFilters={handleClearFilters}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionManagementView
              currentUser={currentUser}
              allUsers={users}
              materials={materials}
              calculatedStocks={calculatedStocks}
              transactions={transactions}
              proposals={proposals}
              onUpdateProposal={handleUpdateProposal}
              onCreateProposal={handleCreateProposal}
              onDeleteProposal={handleDeleteProposal}
              onCreateTransaction={handleCreateTransaction}
              onApproveTransaction={handleApproveTransaction}
              onRejectTransaction={handleRejectTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              initialType={transactionTypePreset}
              initialStatusFilter={transactionStatusFilterPreset}
              preselectedMaterialCode={preselectedMaterialCode}
            />
          )}

          {activeTab === 'ledger' && (
            <StockLedgerView
              materials={materials}
              calculatedStocks={calculatedStocks}
              transactions={transactions}
              initialMaterialCode={preselectedMaterialCode}
            />
          )}

          {activeTab === 'error_transactions' && (
            isAdmin ? (
              <DocumentManagementView
                currentUser={currentUser}
                allUsers={users}
                materials={materials}
                transactions={transactions}
                proposals={proposals}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onUpdateProposal={handleUpdateProposal}
                onDeleteProposal={handleDeleteProposal}
                onResetDemoData={handleResetDemoData}
                onClearAllTransactions={handleClearAllTransactionsAndProposals}
              />
            ) : (
              <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Mục Sửa &amp; Xóa Chứng Từ Sai chỉ dành riêng cho tài khoản Quản trị viên (Admin).
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/30"
                >
                  Quay lại Bảng Điều Khiển
                </button>
              </div>
            )
          )}

          {activeTab === 'users' && (
            isMasterAdmin ? (
              <UserManagementView
                currentUser={currentUser}
                allUsers={users}
                onSelectUser={(u) => {
                  setCurrentUser(u);
                  localStorage.setItem('smart_auth_user_id', u.id);
                  showToast(`Đã chuyển phiên làm việc sang: ${u.fullName}`);
                }}
                onUpdateUser={handleUpdateUser}
                onAddUser={handleAddUser}
              />
            ) : (
              <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Mục Phân Quyền Người Dùng chỉ dành riêng cho tài khoản Quản trị viên cấp cao <strong className="text-amber-300">vn.phuoc235@gmail.com</strong>.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/30"
                >
                  Quay lại Bảng Điều Khiển
                </button>
              </div>
            )
          )}

          {activeTab === 'settings' && (
            isMasterAdmin ? (
              <SettingsView
                currentUser={currentUser}
                allUsers={users}
                materials={materials}
                transactions={transactions}
                proposals={proposals}
                activityLogs={activityLogs}
                onClearActivityLogs={handleClearActivityLogs}
                onUpdateProposal={handleUpdateProposal}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteProposal={handleDeleteProposal}
                onDeleteTransaction={handleDeleteTransaction}
                onResetDemoData={handleResetDemoData}
                onClearAllTransactionsAndProposals={handleClearAllTransactionsAndProposals}
                onUpdateMaterials={(newMats) => {
                  setMaterials(newMats);
                  newMats.forEach((m) => saveMaterialToCloud(m));
                  showToast(`Đã cập nhật danh mục gồm ${newMats.length} vật tư.`);
                }}
                onUpdateUsers={(newUsers) => {
                  setUsers(newUsers);
                  newUsers.forEach((u) => saveUserToCloud(u));
                  showToast(`Đã cập nhật danh sách người dùng và đồng bộ lên Cloud.`);
                }}
              />
            ) : (
              <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Mục Cài Đặt Hệ Thống chỉ dành riêng cho tài khoản Quản trị viên cấp cao <strong className="text-amber-300">vn.phuoc235@gmail.com</strong>.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/30"
                >
                  Quay lại Bảng Điều Khiển
                </button>
              </div>
            )
          )}

          {activeTab === 'ai' && (
            <AiAssistantView
              currentUser={currentUser}
              materials={materials}
              calculatedStocks={calculatedStocks}
              transactions={transactions}
              proposals={proposals}
              onOpenCreateTransaction={handleOpenCreateTransaction}
              onOpenStockCard={handleOpenStockCard}
            />
          )}
        </main>
      </div>

      {/* Natural Language AI Search Modal */}
      <SmartSearchBar
        isOpen={isSmartSearchOpen}
        onClose={() => setIsSmartSearchOpen(false)}
        onApplyFilters={handleApplyNaturalFilters}
        materials={materials}
        transactions={transactions}
      />

      {/* Change Password Modal for Current User */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onSuccessToast={(msg) => showToast(msg, 'success')}
      />

      {/* Comprehensive In-App User Guide Modal */}
      {currentUser && (
        <UserGuideModal
          isOpen={isUserGuideOpen}
          onClose={() => setIsUserGuideOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Global Toast Alerts */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-slate-900 border-rose-500/50 text-rose-300'
              : 'bg-slate-900 border-blue-500/50 text-blue-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
          )}
          <span className="text-xs font-medium flex-1 text-slate-100">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
