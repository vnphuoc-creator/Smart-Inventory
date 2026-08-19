import React, { useState } from 'react';
import {
  Package,
  Layers,
  FileSpreadsheet,
  Users,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Bell,
  ArrowRightLeft,
  ChevronDown,
  LogOut,
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
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: Layers },
    { id: 'materials', label: 'Danh Mục Vật Tư', icon: Package },
    {
      id: 'transactions',
      label: 'Xuất - Nhập - Tồn',
      icon: ArrowRightLeft,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'ledger', label: 'Thẻ Kho & Báo Cáo NXT', icon: FileSpreadsheet },
    ...(currentUser.role === 'ADMIN'
      ? [{ id: 'users', label: 'Phân Quyền', icon: Users }]
      : []),
    { id: 'ai', label: 'Trợ Lý AI Kho', icon: Sparkles, highlight: true },
  ];

  return (
    <header className="bg-gradient-to-r from-[#0d215b] via-[#102a72] to-[#0f1d4a] border-b border-blue-900/50 text-white sticky top-0 z-40 shadow-lg">
      {/* Top bar with branding, user switcher, and AI trigger */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Company Logo & App title */}
          <div className="flex items-center gap-3">
            <AHTLogo className="h-9 w-auto" showPlane={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white drop-shadow-sm">
                  Quản Lý Kho Thông Minh
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">
                Hệ thống Quản lý Xuất - Nhập - Tồn Vật tư Đội Điện Nước
              </p>
            </div>
          </div>

          {/* Center search button trigger */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              id="btn-ai-search-quick"
              onClick={onOpenAiSearch}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-inner w-64 lg:w-72 group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="flex-1 text-left truncate">Tìm kiếm ngôn ngữ tự nhiên...</span>
              <kbd className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                AI
              </kbd>
            </button>
          </div>

          {/* Right section: Pending badge & Active User switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Pending alert */}
            {currentUser.role === 'ADMIN' && pendingApprovalsCount > 0 && (
              <button
                type="button"
                id="btn-nav-pending-badge"
                onClick={() => onTabChange('transactions')}
                className="relative p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                title={`${pendingApprovalsCount} phiếu chờ duyệt`}
              >
                <Bell className="w-4 h-4 animate-bounce" />
                <span className="hidden sm:inline">{pendingApprovalsCount} phiếu chờ duyệt</span>
                <span className="sm:hidden">{pendingApprovalsCount}</span>
              </button>
            )}

            {/* Current user switch dropdown */}
            <div className="relative">
              <button
                type="button"
                id="btn-user-dropdown-toggle"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 p-1.5 pr-2.5 rounded-xl transition-colors text-left"
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${
                    currentUser.avatarColor || 'bg-blue-600'
                  } flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm`}
                >
                  {currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {currentUser.fullName}
                    </span>
                    {currentUser.role === 'ADMIN' ? (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> Quản lý
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                        <UserCheck className="w-2.5 h-2.5" /> Nhân viên
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                    {currentUser.email}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown list */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-slate-800/80 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Chuyển đổi tài khoản (24 NV)
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        Phân quyền chuẩn
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Quyền hiện tại: <span className="text-amber-400">{currentUser.note}</span>
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                    {/* Admin section */}
                    <div className="px-3 py-1.5 bg-slate-950 text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                      Nhóm Quản Lý / Admin (Toàn quyền)
                    </div>
                    {allUsers
                      .filter((u) => u.role === 'ADMIN')
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          id={`btn-select-user-${user.id}`}
                          onClick={() => {
                            onSelectUser(user);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-800 transition-colors ${
                            currentUser.id === user.id
                              ? 'bg-blue-600/15 text-blue-200'
                              : 'text-slate-300'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-md ${
                              user.avatarColor || 'bg-rose-600'
                            } text-white flex items-center justify-center text-xs font-bold shrink-0`}
                          >
                            {user.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(-2)
                              .join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white truncate">
                                {user.fullName}
                              </span>
                              <span className="text-[10px] text-rose-400">Admin</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate font-mono">
                              {user.email}
                            </span>
                          </div>
                        </button>
                      ))}

                    {/* Staff section */}
                    <div className="px-3 py-1.5 bg-slate-950 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Nhóm Nhân Viên (Tạo đề nghị, xem tồn)
                    </div>
                    {allUsers
                      .filter((u) => u.role === 'STAFF')
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          id={`btn-select-user-${user.id}`}
                          onClick={() => {
                            onSelectUser(user);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-slate-800 transition-colors ${
                            currentUser.id === user.id
                              ? 'bg-blue-600/15 text-blue-200'
                              : 'text-slate-300'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-md ${
                              user.avatarColor || 'bg-emerald-600'
                            } text-white flex items-center justify-center text-[10px] font-bold shrink-0`}
                          >
                            {user.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(-2)
                              .join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white truncate">
                                {user.fullName}
                              </span>
                              <span className="text-[10px] text-emerald-400">Nhân viên</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                              {user.email}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>

                  <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                    {currentUser.role === 'ADMIN' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onTabChange('users');
                          setShowUserDropdown(false);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Bảng phân quyền &rarr;
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Quyền nhân viên</span>
                    )}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" /> Đăng xuất
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Direct logout icon button on desktop */}
            {onLogout && (
              <button
                type="button"
                id="btn-nav-logout"
                onClick={onLogout}
                title="Đăng xuất khỏi hệ thống"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex overflow-x-auto no-scrollbar border-t border-slate-800 -mb-px">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                } ${item.highlight ? 'text-amber-400 hover:text-amber-300' : ''}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
