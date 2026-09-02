import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  FileSpreadsheet,
  Sparkles,
  FileX2,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  KeyRound,
  BookOpen,
  Clock,
  Calendar,
} from 'lucide-react';
import { User } from '../types';
import { AHTLogo } from './AHTLogo';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount: number;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  onOpenUserGuide?: () => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  onLogout,
  onOpenChangePassword,
  onOpenUserGuide,
  isOpenMobile,
  onToggleMobile,
}) => {
  // Real-time Clock & Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time clock: HH:mm:ss
  const timeString = currentDate.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Format real-time date: e.g. "Thứ Hai, 31/08/2026" or "31 Tháng 8, 2026"
  const dateString = currentDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const isMasterAdmin =
    currentUser.email?.toLowerCase().trim() === 'vn.phuoc235@gmail.com' ||
    currentUser.username?.toLowerCase().trim() === 'vn.phuoc235';

  const operationalNav = [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      sublabel: 'Báo cáo & thao tác nhanh',
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      label: 'Xuất - Nhập Kho',
      sublabel: 'Lập phiếu, duyệt & Tờ trình',
      icon: ArrowLeftRight,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
    },
    {
      id: 'materials',
      label: 'Tra Cứu Vật Tư',
      sublabel: 'Định mức & quy cách (>600 mã DN)',
      icon: Package,
    },
    {
      id: 'ledger',
      label: 'Thẻ Kho & Báo Cáo',
      sublabel: 'Nhật ký xuất nhập tồn',
      icon: FileSpreadsheet,
    },
  ];

  const systemNav = [
    {
      id: 'ai',
      label: 'Trợ Lý AI Kho',
      sublabel: 'Hỏi đáp tồn kho & phân tích',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-purple-600 text-white font-bold',
    },
    // ADMIN ONLY: Sửa & Xóa Chứng Từ Sai
    ...(currentUser.role === 'ADMIN'
      ? [
          {
            id: 'error_transactions',
            label: 'Sửa & Xóa Chứng Từ Sai',
            sublabel: 'Sửa, xóa & hoàn tác phiếu sai',
            icon: FileX2,
            badge: 'Admin',
            badgeColor: 'bg-rose-600/90 text-white font-bold border border-rose-400/30',
          },
        ]
      : []),
    // MASTER ADMIN ONLY (vn.phuoc235@gmail.com): Phân Quyền Người Dùng
    ...(isMasterAdmin
      ? [
          {
            id: 'users',
            label: 'Phân Quyền Người Dùng',
            sublabel: 'Quản lý tài khoản',
            icon: ShieldCheck,
            badge: 'Master',
            badgeColor: 'bg-blue-600 text-white font-bold border border-blue-400/30',
          },
        ]
      : []),
    // MASTER ADMIN ONLY (vn.phuoc235@gmail.com): Cài Đặt Hệ Thống
    ...(isMasterAdmin
      ? [
          {
            id: 'settings',
            label: 'Cài Đặt Hệ Thống',
            sublabel: 'Logo, ĐVT & Import',
            icon: Settings,
            badge: 'Master',
            badgeColor: 'bg-emerald-600 text-white font-bold border border-emerald-400/30',
          },
        ]
      : []),
  ];

  const userInitials = currentUser.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Vertical Sidebar matching Original AHT Layout */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-30 w-72 shrink-0 h-screen lg:h-full bg-[#081028] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 no-print select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section with AHT Logo */}
        <div className="p-4 pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between">
            {/* White rounded pill with AHT Logo - Clickable to return to Dashboard or open in new tab */}
            <a
              href="/"
              onClick={(e) => {
                // If normal left-click without modifier keys, stay in SPA
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                  e.preventDefault();
                  onTabChange('dashboard');
                }
              }}
              className="bg-white rounded-2xl px-3.5 py-1.5 shadow-md flex items-center justify-center hover:shadow-lg hover:ring-2 hover:ring-cyan-400/50 transition-all cursor-pointer group"
              title="Về Trang Chủ (Click) • Mở trong tab mới (Ctrl + Click)"
            >
              <AHTLogo className="h-6" showPlane={false} allowUpload={false} />
            </a>

            <button
              onClick={onToggleMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Đóng sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3">
            <h1 className="text-white font-black text-sm uppercase tracking-wide leading-tight">
              HỆ THỐNG QUẢN LÝ KHO
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Đội Điện Nước Công Trình • AHT</span>
            </div>
          </div>

          {/* Real-time Clock & Date Widget (Real-time khung giờ và ngày tháng năm) */}
          <div
            id="sidebar-realtime-clock-widget"
            className="mt-3 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-xl px-3 py-2 flex items-center justify-between shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
              <span className="text-white font-mono font-bold text-sm tracking-wider">
                {timeString}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-medium">
              <Calendar className="w-3 h-3 text-cyan-400/80" />
              <span>{dateString}</span>
            </div>
          </div>
        </div>

        {/* Main Vertical Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {/* Group 1: VẬN HÀNH & KHO HÀNG */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              VẬN HÀNH &amp; KHO HÀNG
            </div>
            <div className="space-y-1">
              {operationalNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      onTabChange(item.id);
                      if (isOpenMobile) onToggleMobile();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all group text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800/80 text-blue-400 group-hover:bg-slate-700 group-hover:text-blue-300 border border-slate-700/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div
                          className={`text-xs font-bold leading-snug truncate ${
                            isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] truncate leading-tight mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-sans ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: CÔNG CỤ & HỆ THỐNG */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              CÔNG CỤ &amp; HỆ THỐNG
            </div>
            <div className="space-y-1">
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      onTabChange(item.id);
                      if (isOpenMobile) onToggleMobile();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all group text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800/80 text-blue-400 group-hover:bg-slate-700 group-hover:text-blue-300 border border-slate-700/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div
                          className={`text-xs font-bold leading-snug truncate ${
                            isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] truncate leading-tight mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-sans ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick User Guide Button */}
          {onOpenUserGuide && (
            <div className="pt-1">
              <button
                type="button"
                id="btn-sidebar-user-guide"
                onClick={() => {
                  onOpenUserGuide();
                  if (isOpenMobile) onToggleMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-semibold truncate">
                    Hướng dẫn sử dụng
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                  v2.5
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* Bottom User Box matching Original Screenshot */}
        <div className="p-3 border-t border-slate-800/80 bg-[#060c1e] shrink-0">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                {userInitials}
              </div>
              <div className="truncate min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-[10px] bg-blue-950/80 text-cyan-400 font-semibold px-2 py-0.5 rounded-md border border-cyan-500/20">
                {isMasterAdmin ? 'Master Admin' : currentUser.role}
              </span>

              <button
                type="button"
                onClick={onLogout}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-2 py-1 rounded-lg flex items-center gap-1.5 font-medium transition"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
