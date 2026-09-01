import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  KeyRound,
  Sun,
  Moon,
  BookOpen,
  Clock,
  Calendar,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount: number;
  onOpenAiSearch: () => void;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
  onOpenUserGuide?: () => void;
  onToggleSidebar?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  onOpenAiSearch,
  onLogout,
  onOpenChangePassword,
  onOpenUserGuide,
  onToggleSidebar,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time Clock & Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentDate.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitials = currentUser.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md no-print select-none">
      {/* Prominent Pending Approval Notification Bar for Admin */}
      {currentUser.role === 'ADMIN' && pendingApprovalsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-lg bg-amber-400 text-slate-950 animate-bounce shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-amber-200 truncate">
              <span className="font-bold text-amber-300">Thông báo kho:</span> Có{' '}
              <span className="font-black text-white underline underline-offset-2">
                {pendingApprovalsCount} phiếu
              </span>{' '}
              đang chờ duyệt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange('transactions')}
            className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition-all shadow-md shadow-amber-500/30"
          >
            <span>Xem Ngay</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Organization / System Branding (Exact match with screenshot) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Mở thanh điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2 truncate header-brand-title">
                <span>Cảng HKQT Đà Nẵng</span>
                <span className="text-slate-400 font-bold">&bull;</span>
                <span className="text-slate-200 font-semibold text-xs sm:text-sm header-brand-sub">Nhà Ga Quốc Tế T2</span>
              </h2>
              <p className="text-cyan-400 text-xs font-semibold flex items-center gap-1.5 mt-0.5 truncate header-brand-desc">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Quản Lý Xuất - Nhập - Tồn Vật Tư Kỹ Thuật</span>
              </p>
            </div>
          </div>

          {/* Center: AI Search Trigger Bar (Exact match with screenshot) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              type="button"
              id="btn-ai-search-quick"
              onClick={onOpenAiSearch}
              className="w-full flex items-center justify-between bg-slate-950/80 hover:bg-slate-950 border border-slate-700/80 hover:border-blue-500/80 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-all shadow-inner group"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="truncate">Tìm kiếm nhanh mã DN_* bằng AI...</span>
              </div>
              <span className="text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                AI
              </span>
            </button>
          </div>

          {/* Right Section: Theme toggle & User Menu (Clock removed as it's already in the sidebar) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Light / Dark Mode Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                id="btn-header-theme-toggle"
                onClick={onToggleTheme}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 hover:text-slate-950 font-semibold'
                }`}
                title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-xs">Giao diện Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline text-xs">Giao diện Tối</span>
                  </>
                )}
              </button>
            )}

            {/* User Greeting Pill & Dropdown (Exact match with screenshot) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="btn-user-profile-menu"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-600/40 px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm group"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shadow">
                  {userInitials}
                </div>
                <div className="text-left hidden sm:block max-w-[160px] truncate">
                  <span className="font-semibold text-slate-100 text-xs truncate">
                    Xin chào, {currentUser.fullName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-300 group-hover:translate-y-0.5 transition-transform" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {userInitials}
                      </div>
                      <div className="truncate min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {currentUser.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate font-mono">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Vai trò:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          currentUser.role === 'ADMIN'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {currentUser.roleName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {onOpenUserGuide && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenUserGuide();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                      >
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span>Hướng dẫn sử dụng hệ thống</span>
                      </button>
                    )}

                    {onOpenChangePassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenChangePassword();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                      >
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Đổi mật khẩu tài khoản</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    )}
                  </div>
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
