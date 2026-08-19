import React, { useState } from 'react';
import {
  Sparkles,
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Search,
} from 'lucide-react';
import { User } from '../types';
import { AHTLogo } from './AHTLogo';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount: number;
  onOpenAiSearch: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  onOpenAiSearch,
  onLogout,
  onToggleSidebar,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Tab Title mapping
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Tổng Quan & Thống Kê Kho';
      case 'materials':
        return 'Danh Mục Vật Tư Điện Nước';
      case 'transactions':
        return 'Quản Lý Phiếu Xuất - Nhập - Tồn';
      case 'ledger':
        return 'Thẻ Kho & Báo Cáo Tổng Hợp NXT';
      case 'users':
        return 'Phân Quyền & Quản Lý Nhân Sự';
      case 'ai':
        return 'Trợ Lý AI Kho Thông Minh';
      default:
        return 'Hệ Thống Quản Lý Kho';
    }
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-30 shadow-sm no-print">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Mở thanh điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Logo display */}
            <div className="lg:hidden flex items-center">
              <AHTLogo className="h-7" showPlane={false} allowUpload={false} />
            </div>

            <div className="hidden sm:block truncate">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                {getTabTitle()}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Đội Điện Nước Công Trình &bull; Cảng HKQT Đà Nẵng
              </p>
            </div>
          </div>

          {/* Center: Smart Search Trigger */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <button
              type="button"
              id="btn-ai-search-quick"
              onClick={onOpenAiSearch}
              className="w-full flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs transition-all shadow-inner group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="flex-1 text-left truncate">Tìm kiếm nhanh bằng giọng nói hoặc AI...</span>
              <kbd className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                AI
              </kbd>
            </button>
          </div>

          {/* Right section: Pending alert, AI Quick trigger, User profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile AI button */}
            <button
              type="button"
              onClick={onOpenAiSearch}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-amber-400 border border-slate-700"
              title="Tìm kiếm AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Pending approvals alert badge */}
            {currentUser.role === 'ADMIN' && pendingApprovalsCount > 0 && (
              <button
                type="button"
                id="btn-nav-pending-badge"
                onClick={() => onTabChange('transactions')}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                title={`${pendingApprovalsCount} phiếu đang chờ duyệt`}
              >
                <Bell className="w-3.5 h-3.5 animate-bounce text-amber-400 shrink-0" />
                <span className="hidden sm:inline">{pendingApprovalsCount} phiếu chờ duyệt</span>
                <span className="sm:hidden font-bold">{pendingApprovalsCount}</span>
              </button>
            )}

            {/* User Profile Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center text-xs">
                  {currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')}
                </div>
                <div className="text-left hidden sm:block max-w-[120px] truncate">
                  <div className="font-semibold text-white truncate text-xs">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser.role === 'ADMIN' ? 'Quản lý kho' : 'Kỹ thuật viên'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 font-semibold ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {currentUser.role === 'ADMIN' ? '🛡️ Quản Trị Viên (Admin)' : '👷 Nhân Viên / Kỹ Thuật'}
                    </span>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chuyển Tài Khoản Thao Tác
                    </p>
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <div>{u.fullName}</div>
                          <div className="text-[10px] text-slate-400">{u.role}</div>
                        </div>
                        {u.id === currentUser.id && <span className="text-blue-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>

                  {onLogout && (
                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
