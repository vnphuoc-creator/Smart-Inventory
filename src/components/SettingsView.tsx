import React, { useState, useRef, useMemo } from 'react';
import {
  Settings,
  Building2,
  Lock,
  Plus,
  Edit2,
  Edit3,
  X,
  Trash2,
  Check,
  Save,
  CheckCircle2,
  Upload,
  RefreshCw,
  Layers,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Database,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoveHorizontal,
  Activity,
  User as UserIcon,
  Clock,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Radio,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';
import { STANDARD_UNITS } from '../data/seedData';
import {
  User,
  Material,
  InventoryTransaction,
  PurchaseProposal,
  ProposalItem,
  TransactionItem,
  TransactionType,
  TransactionStatus,
  ActivityLog,
  ActivityActionType,
} from '../types';
import { formatVND, formatNumber, formatDisplayDate } from '../utils/inventoryEngine';
import { AHTLogo } from './AHTLogo';
import { ExcelStockImportModal } from './ExcelStockImportModal';
import { SearchableMaterialSelect } from './SearchableMaterialSelect';

interface SettingsViewProps {
  currentUser: User;
  allUsers: User[];
  materials: Material[];
  transactions: InventoryTransaction[];
  proposals?: PurchaseProposal[];
  activityLogs?: ActivityLog[];
  onClearActivityLogs?: () => void;
  onUpdateMaterials?: (materials: Material[]) => void;
  onUpdateUsers?: (users: User[]) => void;
  onUpdateProposal?: (proposal: PurchaseProposal) => void;
  onUpdateTransaction?: (transaction: InventoryTransaction) => void;
  onDeleteProposal?: (proposalId: string) => void;
  onDeleteTransaction?: (txId: string) => void;
  onResetDemoData?: () => void;
  onClearAllTransactionsAndProposals?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  allUsers,
  materials,
  transactions,
  proposals = [],
  activityLogs = [],
  onClearActivityLogs,
  onUpdateMaterials,
  onUpdateUsers,
  onUpdateProposal,
  onUpdateTransaction,
  onDeleteProposal,
  onDeleteTransaction,
  onResetDemoData,
  onClearAllTransactionsAndProposals,
}) => {
  // Master Admin permission check
  const isMasterAdmin =
    currentUser.email.toLowerCase().trim() === 'vn.phuoc235@gmail.com' ||
    currentUser.email.toLowerCase().trim() === 'vn.phuoc235';

  const [activeTab, setActiveTab] = useState<
    'ACTIVITY_LOGS' | 'UNITS_PASSWORD' | 'LOGO_COMPANY' | 'IMPORT_STOCK' | 'BACKUP'
  >(isMasterAdmin ? 'ACTIVITY_LOGS' : 'UNITS_PASSWORD');

  // --- UNIT MANAGEMENT STATE ---
  const [units, setUnits] = useState<string[]>(() => {
    const saved = localStorage.getItem('cfg_custom_units');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return STANDARD_UNITS;
      }
    }
    return STANDARD_UNITS;
  });

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [unitInputValue, setUnitInputValue] = useState('');
  const [unitToast, setUnitToast] = useState<string | null>(null);

  // --- PASSWORD CHANGE STATE ---
  const [selectedUserToChangePass, setSelectedUserToChangePass] = useState<string>(currentUser.id);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // --- LOGO & COMPANY INFO STATE ---
  const [companyName, setCompanyName] = useState(() => {
    return localStorage.getItem('cfg_company_name') || 'CÔNG TY CỔ PHẦN ĐẦU TƯ KHAI THÁC NHÀ GA QUỐC TẾ ĐÀ NẴNG (AHT)';
  });
  const [departmentName, setDepartmentName] = useState(() => {
    return localStorage.getItem('cfg_department_name') || 'Đội Điện Nước Công Trình (DOIDNCT)';
  });
  const [circularStandard, setCircularStandard] = useState(() => {
    return localStorage.getItem('cfg_circular') || 'Thông tư 99/2025/TT-BTC';
  });
  const [companySaveSuccess, setCompanySaveSuccess] = useState(false);

  // Logo file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem('smart_custom_logo');
  });

  // --- EXCEL IMPORT MODAL STATE ---
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [showResetDemoModal, setShowResetDemoModal] = useState(false);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);

  // --- REAL-TIME AUDIT LOG FILTER STATE ---
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logActionFilter, setLogActionFilter] = useState<string>('ALL');
  const [logUserFilter, setLogUserFilter] = useState<string>('ALL');
  const [logDateFilter, setLogDateFilter] = useState<string>('ALL');

  // Top scroll synchronization for activity log table
  const logTableRef = useRef<HTMLDivElement>(null);
  const logTopScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingLogScroll = useRef(false);
  const [logScrollProgress, setLogScrollProgress] = useState(0);

  const handleLogTableScroll = () => {
    if (!logTableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = logTableRef.current;
    const max = scrollWidth - clientWidth;
    if (max > 0) setLogScrollProgress((scrollLeft / max) * 100);
    if (logTopScrollRef.current && !isSyncingLogScroll.current) {
      isSyncingLogScroll.current = true;
      logTopScrollRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingLogScroll.current = false;
      });
    }
  };

  const handleLogTopScroll = () => {
    if (!logTopScrollRef.current || !logTableRef.current) return;
    const { scrollLeft } = logTopScrollRef.current;
    if (!isSyncingLogScroll.current) {
      isSyncingLogScroll.current = true;
      logTableRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingLogScroll.current = false;
      });
    }
  };

  const handleLogScrollBy = (amount: number) => {
    if (logTableRef.current) {
      logTableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleLogScrollToPercent = (pct: number) => {
    if (logTableRef.current) {
      const max = logTableRef.current.scrollWidth - logTableRef.current.clientWidth;
      logTableRef.current.scrollTo({ left: (max * pct) / 100, behavior: 'smooth' });
    }
  };

  // Helper to format relative time
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 15) return 'Vừa xong';
      if (diffSec < 60) return `${diffSec} giây trước`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr} giờ trước`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays} ngày trước`;
    } catch {
      return '';
    }
  };

  // Filtered activity logs
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // Action filter
      if (logActionFilter !== 'ALL') {
        if (logActionFilter === 'TX_IMPORT' && log.action !== 'IMPORT_TX') return false;
        if (logActionFilter === 'TX_EXPORT' && log.action !== 'EXPORT_TX') return false;
        if (logActionFilter === 'TX_APPROVE' && log.action !== 'APPROVE_TX') return false;
        if (logActionFilter === 'TX_REJECT' && log.action !== 'REJECT_TX') return false;
        if (logActionFilter === 'TX_EDIT_DELETE' && log.action !== 'UPDATE_TX' && log.action !== 'DELETE_TX') return false;
        if (logActionFilter === 'PROPOSALS' && !log.action.includes('PROPOSAL')) return false;
        if (logActionFilter === 'AUTH' && log.action !== 'LOGIN' && log.action !== 'LOGOUT') return false;
      }

      // User filter
      if (logUserFilter !== 'ALL' && log.userEmail !== logUserFilter && log.userId !== logUserFilter) {
        return false;
      }

      // Date filter
      if (logDateFilter !== 'ALL') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (logDateFilter === 'TODAY') {
          if (
            logDate.getDate() !== now.getDate() ||
            logDate.getMonth() !== now.getMonth() ||
            logDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (logDateFilter === '7DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (logDate < sevenDaysAgo) return false;
        }
      }

      // Search keyword
      if (logSearchTerm.trim()) {
        const q = logSearchTerm.toLowerCase().trim();
        const matchUser = log.userName.toLowerCase().includes(q) || log.userEmail.toLowerCase().includes(q);
        const matchTitle = log.actionTitle.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchDoc = (log.documentCode || '').toLowerCase().includes(q);
        const matchProp = (log.proposalNumber || '').toLowerCase().includes(q);
        if (!matchUser && !matchTitle && !matchDetails && !matchDoc && !matchProp) {
          return false;
        }
      }

      return true;
    });
  }, [activityLogs, logActionFilter, logUserFilter, logDateFilter, logSearchTerm]);

  // Log statistics
  const logStats = useMemo(() => {
    let importCount = 0;
    let exportCount = 0;
    let approveCount = 0;
    let proposalCount = 0;
    const activeUsersSet = new Set<string>();

    activityLogs.forEach((l) => {
      activeUsersSet.add(l.userEmail);
      if (l.action === 'IMPORT_TX') importCount++;
      if (l.action === 'EXPORT_TX') exportCount++;
      if (l.action === 'APPROVE_TX') approveCount++;
      if (l.action.includes('PROPOSAL')) proposalCount++;
    });

    return {
      total: activityLogs.length,
      importCount,
      exportCount,
      approveCount,
      proposalCount,
      activeUsers: activeUsersSet.size,
    };
  }, [activityLogs]);

  // Export logs to CSV
  const handleExportLogsCSV = () => {
    const headers = ['Thời gian', 'Nhân viên', 'Email', 'Vai trò', 'Hành động', 'Mã chứng từ', 'Số tờ trình', 'Chi tiết thao tác'];
    const rows = filteredActivityLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString('vi-VN')}"`,
      `"${l.userName}"`,
      `"${l.userEmail}"`,
      `"${l.userRole}"`,
      `"${l.actionTitle}"`,
      `"${l.documentCode || ''}"`,
      `"${l.proposalNumber || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nhat_ky_thao_tac_realtime_AHT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setUnitToast('Đã xuất file lịch sử thao tác CSV thành công!');
    setTimeout(() => setUnitToast(null), 3000);
  };

  // Unit handlers
  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = unitInputValue.trim();
    if (!val) return;
    let newUnits = [...units];
    if (editingUnitIndex !== null) {
      newUnits[editingUnitIndex] = val;
    } else {
      if (newUnits.includes(val)) {
        alert('Đơn vị tính này đã tồn tại trong danh mục!');
        return;
      }
      newUnits.push(val);
    }
    setUnits(newUnits);
    localStorage.setItem('cfg_custom_units', JSON.stringify(newUnits));
    setShowAddUnitModal(false);
    setEditingUnitIndex(null);
    setUnitInputValue('');
    setUnitToast('Đã lưu danh mục đơn vị tính thành công!');
    setTimeout(() => setUnitToast(null), 3000);
  };

  const handleDeleteUnit = (idx: number) => {
    const toDel = units[idx];
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn vị tính "${toDel}"?`)) {
      const newUnits = units.filter((_, i) => i !== idx);
      setUnits(newUnits);
      localStorage.setItem('cfg_custom_units', JSON.stringify(newUnits));
      setUnitToast(`Đã xóa đơn vị tính "${toDel}".`);
      setTimeout(() => setUnitToast(null), 3000);
    }
  };

  // Password handler
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 4) {
      setPasswordError('Mật khẩu mới phải có ít nhất 4 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    if (onUpdateUsers) {
      const updatedUsers = allUsers.map((u) => {
        if (u.id === selectedUserToChangePass) {
          return { ...u, password: newPassword };
        }
        return u;
      });
      onUpdateUsers(updatedUsers);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    }
  };

  // Company info handler
  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cfg_company_name', companyName);
    localStorage.setItem('cfg_department_name', departmentName);
    localStorage.setItem('cfg_circular', circularStandard);
    setCompanySaveSuccess(true);
    setTimeout(() => setCompanySaveSuccess(false), 3000);
  };

  // Logo handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setCustomLogoUrl(dataUrl);
      localStorage.setItem('smart_custom_logo', dataUrl);
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setCustomLogoUrl(null);
    localStorage.removeItem('smart_custom_logo');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Cài Đặt Hệ Thống
            </h1>
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {isMasterAdmin ? 'Master Admin' : 'Quản Trị Viên'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi nhật ký nhân viên nhập/xuất kho real-time, cấu hình đơn vị tính, bảo mật và mẫu biểu AHT
          </p>
        </div>

        {/* Quick button to open Excel stock importer */}
        <button
          onClick={() => setIsExcelModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Import File Tồn Kho &amp; Cập Nhật Số Lượng</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar">
        {/* Tab 1: Real-time Activity Logs (Restricted to vn.phuoc235) */}
        {isMasterAdmin && (
          <button
            onClick={() => setActiveTab('ACTIVITY_LOGS')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ACTIVITY_LOGS'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Lịch Sử Thao Tác Real-Time</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              {activityLogs.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('UNITS_PASSWORD')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'UNITS_PASSWORD'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Đơn Vị Tính &amp; Đổi Mật Khẩu</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGO_COMPANY')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'LOGO_COMPANY'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Logo &amp; Doanh Nghiệp (AHT)</span>
        </button>

        <button
          onClick={() => setActiveTab('IMPORT_STOCK')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'IMPORT_STOCK'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Import File Tồn Kho (Excel / CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'BACKUP'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sao Lưu &amp; Dữ Liệu</span>
        </button>
      </div>

      {/* Toast Notification */}
      {unitToast && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-2 text-xs text-blue-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
          <span>{unitToast}</span>
        </div>
      )}

      {/* ===================== TAB: REAL-TIME AUDIT LOGS ===================== */}
      {activeTab === 'ACTIVITY_LOGS' && isMasterAdmin && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card with Real-time pulse indicator */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Nhật Ký Thao Tác Nhân Viên Thời Gian Thực (Real-Time)
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Live Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chỉ phân quyền cho tài khoản <strong className="text-amber-300">vn.phuoc235@gmail.com</strong>. Ghi nhận tức thời mọi thao tác nhập/xuất kho, duyệt phiếu, sửa xóa và tạo tờ trình.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportLogsCSV}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-2 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Xuất File CSV
              </button>

              {onClearActivityLogs && (
                <button
                  onClick={() => setShowClearLogsModal(true)}
                  className="px-3.5 py-2 bg-rose-950/50 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-semibold border border-rose-800/50 transition flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Xóa Lịch Sử Cũ
                </button>
              )}
            </div>
          </div>

          {/* Quick Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Tổng Lượt Ghi</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-1 text-xl font-bold text-white font-mono">{formatNumber(logStats.total)}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-emerald-400 text-xs font-medium flex items-center justify-between">
                <span>Nhập Kho</span>
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 text-xl font-bold text-emerald-400 font-mono">{formatNumber(logStats.importCount)}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-amber-400 text-xs font-medium flex items-center justify-between">
                <span>Xuất Kho</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-1 text-xl font-bold text-amber-400 font-mono">{formatNumber(logStats.exportCount)}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-blue-400 text-xs font-medium flex items-center justify-between">
                <span>Phê Duyệt</span>
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="mt-1 text-xl font-bold text-blue-400 font-mono">{formatNumber(logStats.approveCount)}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-purple-400 text-xs font-medium flex items-center justify-between">
                <span>Tờ Trình</span>
                <FileText className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="mt-1 text-xl font-bold text-purple-400 font-mono">{formatNumber(logStats.proposalCount)}</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo nhân viên, mã phiếu, số tờ trình, nội dung..."
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {logSearchTerm && (
                  <button
                    onClick={() => setLogSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Filter */}
              <div className="md:col-span-3">
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Tất cả hành động</option>
                  <option value="TX_IMPORT">📥 Nhập kho (IMPORT)</option>
                  <option value="TX_EXPORT">📤 Xuất kho (EXPORT)</option>
                  <option value="TX_APPROVE">✅ Phê duyệt phiếu</option>
                  <option value="TX_REJECT">❌ Từ chối duyệt phiếu</option>
                  <option value="TX_EDIT_DELETE">✏️ Sửa / Xóa chứng từ</option>
                  <option value="PROPOSALS">📄 Thao tác Tờ trình</option>
                  <option value="AUTH">🔐 Đăng nhập hệ thống</option>
                </select>
              </div>

              {/* User Filter */}
              <div className="md:col-span-3">
                <select
                  value={logUserFilter}
                  onChange={(e) => setLogUserFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Tất cả nhân viên ({allUsers.length})</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="md:col-span-2">
                <select
                  value={logDateFilter}
                  onChange={(e) => setLogDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Toàn bộ thời gian</option>
                  <option value="TODAY">Hôm nay</option>
                  <option value="7DAYS">7 ngày gần nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table with Top & Bottom Scrollbars */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Top Horizontal Scroll Bar */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MoveHorizontal className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-300">Thanh trượt xem chi tiết nhật ký:</span>
              </div>

              <div
                ref={logTopScrollRef}
                onScroll={handleLogTopScroll}
                className="flex-1 overflow-x-auto h-5 scrollbar-thin cursor-ew-resize mx-2"
              >
                <div style={{ width: logTableRef.current ? `${logTableRef.current.scrollWidth}px` : '1400px', height: '1px' }} />
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleLogScrollToPercent(0)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Về đầu bảng"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleLogScrollBy(-200)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Cuộn sang trái"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleLogScrollBy(200)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Cuộn sang phải"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleLogScrollToPercent(100)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Đến cuối bảng"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Table */}
            <div
              ref={logTableRef}
              onScroll={handleLogTableScroll}
              className="overflow-x-auto scrollbar-thin max-h-[600px] overflow-y-auto"
            >
              <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
                <thead className="bg-slate-950 text-slate-300 sticky top-0 z-10 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4 w-44">Thời Gian Thao Tác</th>
                    <th className="py-3.5 px-4 w-52">Nhân Viên Thực Hiện</th>
                    <th className="py-3.5 px-4 w-44">Hành Động</th>
                    <th className="py-3.5 px-4 w-36">Mã Chứng Từ / Tờ Trình</th>
                    <th className="py-3.5 px-4">Chi Tiết Thao Tác</th>
                    <th className="py-3.5 px-4 w-32 text-right">Tổng Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredActivityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Activity className="w-10 h-10 text-slate-600" />
                          <p className="text-sm font-medium">Không tìm thấy bản ghi nhật ký nào phù hợp.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredActivityLogs.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-white font-semibold">
                            {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(log.timestamp).toLocaleDateString('vi-VN')}</span>
                            <span className="text-amber-400/80">({formatTimeAgo(log.timestamp)})</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                              {log.userName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{log.userName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{log.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {log.action === 'IMPORT_TX' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ArrowDownLeft className="w-3 h-3" /> Nhập kho
                            </span>
                          ) : log.action === 'EXPORT_TX' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <ArrowUpRight className="w-3 h-3" /> Xuất kho
                            </span>
                          ) : log.action === 'APPROVE_TX' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Phê duyệt
                            </span>
                          ) : log.action === 'REJECT_TX' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="w-3 h-3" /> Từ chối
                            </span>
                          ) : log.action === 'DELETE_TX' || log.action === 'DELETE_PROPOSAL' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <Trash2 className="w-3 h-3" /> Xóa dữ liệu
                            </span>
                          ) : log.action === 'UPDATE_TX' || log.action === 'UPDATE_PROPOSAL' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              <Edit3 className="w-3 h-3" /> Sửa chứng từ
                            </span>
                          ) : log.action.includes('PROPOSAL') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <FileText className="w-3 h-3" /> Tờ trình
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              <ShieldCheck className="w-3 h-3" /> {log.actionTitle}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.documentCode && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs mr-1.5">
                              {log.documentCode}
                            </span>
                          )}
                          {log.proposalNumber && (
                            <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 font-mono text-xs">
                              {log.proposalNumber}
                            </span>
                          )}
                          {!log.documentCode && !log.proposalNumber && (
                            <span className="text-slate-600 italic">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300 leading-relaxed font-normal">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          {log.amount !== undefined && log.amount > 0 ? formatVND(log.amount) : '-'}
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

      {/* ===================== TAB: UNITS & PASSWORD ===================== */}
      {activeTab === 'UNITS_PASSWORD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Unit Management Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Danh Mục Đơn Vị Tính ({units.length})
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Đơn vị tính chuẩn áp dụng đồng bộ khi lập phiếu nhập/xuất và thêm vật tư
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingUnitIndex(null);
                  setUnitInputValue('');
                  setShowAddUnitModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm ĐVT
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[350px] overflow-y-auto pr-1">
              {units.map((unit, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 group hover:border-blue-500/50 transition"
                >
                  <span>{unit}</span>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditingUnitIndex(idx);
                        setUnitInputValue(unit);
                        setShowAddUnitModal(true);
                      }}
                      className="p-0.5 hover:text-blue-400 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(idx)}
                      className="p-0.5 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Password Security Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Đổi Mật Khẩu Đăng Nhập
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cập nhật mật khẩu cho tài khoản cá nhân hoặc các tài khoản nhân viên trong hệ thống
              </p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chọn Tài Khoản Cần Đổi:
                </label>
                <select
                  value={selectedUserToChangePass}
                  onChange={(e) => setSelectedUserToChangePass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật Khẩu Mới:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập ít nhất 4 ký tự..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Xác Nhận Mật Khẩu Mới:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {passwordError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Đã đổi mật khẩu thành công!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== TAB: LOGO & COMPANY ===================== */}
      {activeTab === 'LOGO_COMPANY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Company Details Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Thông Tin Tiêu Đề Doanh Nghiệp (AHT)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hiển thị trên mẫu in phiếu nhập kho, phiếu xuất kho và thẻ kho
              </p>
            </div>

            <form onSubmit={handleSaveCompanyInfo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Doanh Nghiệp / Công Ty:
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Đơn Vị / Bộ Phận Quản Lý:
                </label>
                <input
                  type="text"
                  required
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Căn Cứ Chế Độ Kế Toán (Thông Tư):
                </label>
                <input
                  type="text"
                  value={circularStandard}
                  onChange={(e) => setCircularStandard(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {companySaveSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Đã lưu thông tin doanh nghiệp thành công!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu Thông Tin Doanh Nghiệp
                </button>
              </div>
            </form>
          </div>

          {/* Logo Customization */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Logo Nhận Diện Doanh Nghiệp
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tùy chỉnh logo hiển thị trên thanh điều hướng và mẫu in chứng từ
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/60 space-y-4">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner flex items-center justify-center">
                <AHTLogo className="h-14 w-auto" />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Tải Lên Logo Mới
                </button>

                {customLogoUrl && (
                  <button
                    onClick={handleResetLogo}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Dùng Logo Mặc Định
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: IMPORT STOCK ===================== */}
      {activeTab === 'IMPORT_STOCK' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Cập Nhật Tồn Kho Hàng Loạt Bằng Excel
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tải lên file Excel tổng kết kho thực tế để hệ thống tự động cập nhật số lượng tồn đầu kỳ cho hơn 626 mã vật tư.
              </p>
            </div>

            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Mở Công Cụ Import Excel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white">Bước 1: Chuẩn bị file</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                File Excel chứa các cột: Mã vật tư (bắt đầu bằng DN_), Tên vật tư, ĐVT, Số lượng tồn, Đơn giá.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white">Bước 2: Tải lên &amp; Xem trước</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Công cụ tự động so khớp mã và hiển thị chi tiết các mã mới hoặc mã thay đổi số lượng tồn.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white">Bước 3: Xác nhận đồng bộ</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Bấm "Áp dụng cập nhật" để đồng bộ ngay lập tức vào cơ sở dữ liệu tồn kho web.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: BACKUP & DATA ===================== */}
      {activeTab === 'BACKUP' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Quản Trị Dữ Liệu &amp; Khôi Phục Hệ Thống
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Khôi phục dữ liệu danh mục mẫu chuẩn AHT hoặc sao lưu toàn bộ dữ liệu vật tư và giao dịch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                Khôi Phục Dữ Liệu Gốc AHT
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Khôi phục lại toàn bộ danh mục vật tư chuẩn &gt;626 mã và các tờ trình mẫu ban đầu của AHT.
              </p>
              <button
                onClick={() => setShowResetDemoModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30"
              >
                Khôi Phục Dữ Liệu Mẫu
              </button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Xuất Dữ Liệu Vật Tư (JSON)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tải về bản sao lưu toàn bộ danh mục vật tư hiện tại kèm số lượng tồn và đơn vị tính.
              </p>
              <button
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(materials, null, 2));
                  const dlAnchor = document.createElement('a');
                  dlAnchor.setAttribute('href', dataStr);
                  dlAnchor.setAttribute('download', `AHT_Materials_Backup_${new Date().toISOString().slice(0, 10)}.json`);
                  dlAnchor.click();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/30"
              >
                Tải Về File Sao Lưu JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD / EDIT UNIT ===================== */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {editingUnitIndex !== null ? 'Chỉnh Sửa Đơn Vị Tính' : 'Thêm Đơn Vị Tính Mới'}
            </h3>

            <form onSubmit={handleSaveUnit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tên đơn vị tính:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={unitInputValue}
                  onChange={(e) => setUnitInputValue(e.target.value)}
                  placeholder="Ví dụ: Mét, Cuộn, Cây, Thùng..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: RESET DEMO DATA ===================== */}
      {showResetDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Khôi Phục Dữ Liệu Chuẩn AHT</h3>
                <p className="text-xs text-slate-400">Đặt lại mẫu ban đầu</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có muốn khôi phục toàn bộ danh mục vật tư &gt;626 mã chuẩn AHT và các tờ trình mẫu ban đầu không?
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
                  setUnitToast('Đã khôi phục dữ liệu mẫu gốc thành công!');
                  setTimeout(() => setUnitToast(null), 3000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition"
              >
                Khôi Phục Mẫu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CLEAR ACTIVITY LOGS ===================== */}
      {showClearLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xóa Lịch Sử Thao Tác Real-Time?</h3>
                <p className="text-xs text-slate-400">Dọn dẹp nhật ký kiểm toán</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử thao tác cũ không? Thao tác này chỉ dành riêng cho tài khoản Master Admin vn.phuoc235@gmail.com.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearLogsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearActivityLogs) {
                    onClearActivityLogs();
                  }
                  setShowClearLogsModal(false);
                  setUnitToast('Đã xóa sạch lịch sử thao tác!');
                  setTimeout(() => setUnitToast(null), 3000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Excel Stock Import Modal */}
      <ExcelStockImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        currentMaterials={materials}
        onApplyStockUpdate={(updated) => {
          if (onUpdateMaterials) {
            onUpdateMaterials(updated);
          }
          localStorage.setItem('smart_materials_v12', JSON.stringify(updated));
          setUnitToast(`Đã cập nhật thành công ${updated.length} vật tư lên hệ thống web!`);
          setTimeout(() => setUnitToast(null), 4000);
        }}
      />
    </div>
  );
};
