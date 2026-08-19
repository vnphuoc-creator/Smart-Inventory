import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MaterialCatalogueView } from './components/MaterialCatalogueView';
import { TransactionManagementView } from './components/TransactionManagementView';
import { StockLedgerView } from './components/StockLedgerView';
import { UserManagementView } from './components/UserManagementView';
import { AiAssistantView } from './components/AiAssistantView';
import { SmartSearchBar } from './components/SmartSearchBar';
import { LoginView } from './components/LoginView';
import {
  INITIAL_USERS,
  INITIAL_MATERIALS,
  INITIAL_TRANSACTIONS,
} from './data/seedData';
import {
  User,
  Material,
  InventoryTransaction,
  NaturalSearchFilters,
} from './types';
import { calculateAllMaterialStocks } from './utils/inventoryEngine';
import {
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

export function App() {
  // Global State
  const [users] = useState<User[]>(INITIAL_USERS);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUserId = localStorage.getItem('smart_auth_user_id');
    if (savedUserId) {
      const found = INITIAL_USERS.find((u) => u.id === savedUserId);
      if (found) return found;
    }
    // Default to the first admin if not set
    return INITIAL_USERS.find((u) => u.role === 'ADMIN') || INITIAL_USERS[0];
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('smart_materials_v3');
    if (saved) {
      try {
        const parsed: Material[] = JSON.parse(saved);
        // Ensure no legacy codes
        const hasLegacy = parsed.some(
          (m) =>
            m.code.startsWith('DN_PL') ||
            m.code.startsWith('DN_TD') ||
            m.code.startsWith('DN_DL') ||
            m.code.startsWith('DN_VT') ||
            m.code.startsWith('DN_BH') ||
            m.code.startsWith('DN_CB')
        );
        if (!hasLegacy && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_MATERIALS;
      }
    }
    return INITIAL_MATERIALS;
  });

  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem('smart_transactions_v3');
    if (saved) {
      try {
        const parsed: InventoryTransaction[] = JSON.parse(saved);
        const hasLegacy = parsed.some((t) =>
          t.items.some(
            (i) =>
              i.materialCode.startsWith('DN_PL') ||
              i.materialCode.startsWith('DN_TD') ||
              i.materialCode.startsWith('DN_DL') ||
              i.materialCode.startsWith('DN_VT') ||
              i.materialCode.startsWith('DN_BH') ||
              i.materialCode.startsWith('DN_CB')
          )
        );
        if (!hasLegacy && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_TRANSACTIONS;
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<NaturalSearchFilters | null>(null);
  const [filterExplanation, setFilterExplanation] = useState<string | null>(null);
  const [preselectedMaterialCode, setPreselectedMaterialCode] = useState<string | undefined>(undefined);
  const [transactionTypePreset, setTransactionTypePreset] = useState<'IMPORT' | 'EXPORT'>('EXPORT');
  const [transactionStatusFilterPreset, setTransactionStatusFilterPreset] = useState<string | undefined>(undefined);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync to local storage
  React.useEffect(() => {
    localStorage.setItem('smart_materials_v3', JSON.stringify(materials));
  }, [materials]);

  React.useEffect(() => {
    localStorage.setItem('smart_transactions_v3', JSON.stringify(transactions));
  }, [transactions]);

  // Real-time calculated stocks calculation
  const calculatedStocks = useMemo(() => {
    return calculateAllMaterialStocks(materials, transactions);
  }, [materials, transactions]);

  // Login handler
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('smart_auth_user_id', user.id);
    showToast(`Chào mừng ${user.fullName} (${user.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'}) đăng nhập thành công!`);
  };

  // Logout handler
  const handleLogout = () => {
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
    showToast(`Đã lưu thành công vật tư "${materialToSave.code}" vào danh mục.`);
  };

  // Handler: Delete Material
  const handleDeleteMaterial = (materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    showToast(`Đã xóa vật tư "${mat?.code || materialId}" khỏi danh mục.`, 'info');
  };

  // Handler: Create Transaction
  const handleCreateTransaction = (tx: InventoryTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
    if (tx.status === 'APPROVED') {
      showToast(`Đã lập & phê duyệt thành công phiếu "${tx.code}". Số lượng tồn kho đã được cập nhật!`);
    } else {
      showToast(`Đã gửi đề xuất "${tx.code}" lên Quản lý chờ phê duyệt.`, 'info');
    }
  };

  // Handler: Approve Transaction
  const handleApproveTransaction = (txId: string, note?: string) => {
    if (!currentUser) return;
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          return {
            ...t,
            status: 'APPROVED',
            approverEmail: currentUser.email,
            approverName: currentUser.fullName,
            approvalDate: new Date().toISOString().split('T')[0],
            approvalNote: note || 'Quản lý đã phê duyệt',
          };
        }
        return t;
      })
    );
    showToast(`Quản lý ${currentUser.fullName} đã phê duyệt phiếu "${txId}". Tồn kho được cập nhật tức thì!`);
  };

  // Handler: Reject Transaction
  const handleRejectTransaction = (txId: string, note?: string) => {
    if (!currentUser) return;
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          return {
            ...t,
            status: 'REJECTED',
            approverEmail: currentUser.email,
            approverName: currentUser.fullName,
            approvalDate: new Date().toISOString().split('T')[0],
            approvalNote: note || 'Từ chối phê duyệt',
          };
        }
        return t;
      })
    );
    showToast(`Đã từ chối phiếu giao dịch "${txId}".`, 'error');
  };

  // Handler: Open Stock Card
  const handleOpenStockCard = (materialCode: string) => {
    setPreselectedMaterialCode(materialCode);
    setActiveTab('ledger');
  };

  // Handler: Open Transaction creation
  const handleOpenCreateTransaction = (type: 'IMPORT' | 'EXPORT', preselectedCode?: string) => {
    setTransactionTypePreset(type);
    setPreselectedMaterialCode(preselectedCode);
    setActiveTab('transactions');
  };

  // Handler: Navigation with filter from Dashboard
  const handleDashboardNavigate = (tab: string, filter?: string) => {
    if (tab === 'materials' && filter) {
      setAppliedFilters({ stockStatus: filter as any });
      setFilterExplanation(
        filter === 'LOW_STOCK'
          ? 'Danh sách các vật tư dưới mức tồn an toàn (≤ Min)'
          : `Lọc theo trạng thái ${filter}`
      );
    } else if (tab === 'transactions' && filter) {
      setTransactionStatusFilterPreset(filter);
    }
    setActiveTab(tab);
  };

  // Handler: Natural language search result application
  const handleApplyNaturalFilters = (
    filters: NaturalSearchFilters,
    explanation: string,
    targetTab: string = 'materials'
  ) => {
    setAppliedFilters(filters);
    setFilterExplanation(explanation);
    setActiveTab(targetTab);
    showToast(`Đã áp dụng kết quả tìm kiếm AI: ${explanation}`, 'info');
  };

  const handleClearFilters = () => {
    setAppliedFilters(null);
    setFilterExplanation(null);
  };

  // If not logged in, display LoginView
  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  const pendingApprovalsCount = transactions.filter((t) => t.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Navbar with Logo, Search, User dropdown, and Tab switching */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={(u) => {
          setCurrentUser(u);
          localStorage.setItem('smart_auth_user_id', u.id);
          showToast(`Đã chuyển sang tài khoản: ${u.fullName} (${u.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'})`);
        }}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPreselectedMaterialCode(undefined);
          setTransactionStatusFilterPreset(undefined);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenAiSearch={() => setIsSmartSearchOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            calculatedStocks={calculatedStocks}
            transactions={transactions}
            onNavigateTab={handleDashboardNavigate}
            onOpenCreateTransaction={handleOpenCreateTransaction}
            onApproveTransaction={handleApproveTransaction}
            onRejectTransaction={handleRejectTransaction}
            onOpenStockCard={handleOpenStockCard}
          />
        )}

        {activeTab === 'materials' && (
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
            onCreateTransaction={handleCreateTransaction}
            onApproveTransaction={handleApproveTransaction}
            onRejectTransaction={handleRejectTransaction}
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

        {activeTab === 'users' && (
          <UserManagementView
            currentUser={currentUser}
            allUsers={users}
            onSelectUser={(u) => {
              setCurrentUser(u);
              localStorage.setItem('smart_auth_user_id', u.id);
              showToast(`Đã chuyển phiên làm việc sang: ${u.fullName}`);
            }}
          />
        )}

        {activeTab === 'ai' && (
          <AiAssistantView
            currentUser={currentUser}
            materials={materials}
            calculatedStocks={calculatedStocks}
            transactions={transactions}
            onOpenCreateTransaction={handleOpenCreateTransaction}
            onOpenStockCard={handleOpenStockCard}
          />
        )}
      </main>

      {/* Natural Language AI Search Modal */}
      <SmartSearchBar
        isOpen={isSmartSearchOpen}
        onClose={() => setIsSmartSearchOpen(false)}
        onApplyFilters={handleApplyNaturalFilters}
        materials={materials}
        transactions={transactions}
      />

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
