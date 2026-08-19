import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Key,
  Search,
  Building,
  UserCheck,
  Info,
} from 'lucide-react';
import { User } from '../types';

interface UserManagementViewProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STAFF'>('ALL');

  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q) || false;
      const matchNote = u.note?.toLowerCase().includes(q) || false;
      if (!matchName && !matchEmail && !matchDept && !matchNote) return false;
    }
    return true;
  });

  const adminCount = allUsers.filter((u) => u.role === 'ADMIN').length;
  const staffCount = allUsers.filter((u) => u.role === 'STAFF').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Phân Quyền Người Dùng & Vai Trò (RBAC)
            </h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {allUsers.length} tài khoản
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Danh sách nhân sự và bảng phân định quyền hạn chi tiết giữa Quản lý (Admin) và Nhân viên
          </p>
        </div>
      </div>

      {/* Role Comparison Table Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Role Scope */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Vai Trò: Quản Lý (Admin)</h3>
                <span className="text-[11px] text-rose-300 font-medium font-mono">
                  {adminCount} người dùng sở hữu vai trò này
                </span>
              </div>
            </div>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full font-bold">
              Toàn quyền hệ thống
            </span>
          </div>

          <p className="text-xs text-slate-300">
            <strong>Ghi chú quyền hạn theo thiết kế:</strong> Quản lý toàn bộ danh mục vật tư, thiết lập định mức an toàn (Min/Max), đơn giá, xét duyệt hoặc từ chối phiếu xuất/nhập, xem toàn bộ báo cáo tổng hợp.
          </p>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Thêm mới, sửa, xóa mã vật tư trong danh mục</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Phê duyệt hoặc từ chối các đề xuất nhập/xuất kho của nhân viên</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Tạo phiếu nhập/xuất trực tiếp (tự động duyệt & cập nhật kho)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Cấu hình ngưỡng định mức cảnh báo tồn kho và xuất báo cáo</span>
            </div>
          </div>
        </div>

        {/* Staff Role Scope */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Vai Trò: Nhân Viên (Staff)</h3>
                <span className="text-[11px] text-emerald-300 font-medium font-mono">
                  {staffCount} người dùng sở hữu vai trò này
                </span>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
              Quyền tác nghiệp
            </span>
          </div>

          <p className="text-xs text-slate-300">
            <strong>Ghi chú quyền hạn theo thiết kế:</strong> Xem tồn kho thực tế, tra cứu thẻ kho, tạo đề xuất nhập/xuất vật tư. Phiếu tạo ra sẽ ở trạng thái Chờ Duyệt (Pending) gửi đến Quản lý.
          </p>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Xem danh mục và số lượng tồn kho khả dụng thời gian thực</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Lập phiếu đề xuất nhập kho và đề xuất xuất kho</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Tra cứu sổ thẻ kho và in phiếu chứng từ giao nhận</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Không được tự ý duyệt phiếu hoặc chỉnh sửa danh mục vật tư</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Directory Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              roleFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({allUsers.length})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              roleFilter === 'ADMIN'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Quản lý (Admin - {adminCount})
          </button>
          <button
            onClick={() => setRoleFilter('STAFF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              roleFilter === 'STAFF'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Nhân viên (Staff - {staffCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email, phòng ban..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isCurrent = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              className={`bg-slate-900 border ${
                isCurrent
                  ? 'border-blue-500 ring-1 ring-blue-500/40 bg-blue-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              } rounded-2xl p-4 transition-all flex flex-col justify-between shadow-sm`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${
                        user.avatarColor || 'bg-blue-600'
                      } text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0`}
                    >
                      {user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(-2)
                        .join('')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{user.fullName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[170px]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      user.role === 'ADMIN'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {user.role === 'ADMIN' ? 'Quản lý (Admin)' : 'Nhân viên'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Phòng ban:</span>
                    <strong className="text-slate-200">{user.department}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Mật khẩu đăng nhập: </span>
                    <code className="text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono text-[10px]">
                      {user.defaultPassword || user.password || `${user.username}12345`}
                    </code>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Ghi chú quyền: </span>
                    <span className="text-slate-300 italic">{user.note}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                {isCurrent ? (
                  <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Đang đăng nhập
                  </span>
                ) : (
                  <button
                    id={`btn-switch-user-${user.id}`}
                    onClick={() => onSelectUser(user)}
                    className="w-full bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white py-1.5 rounded-xl text-xs font-semibold transition-colors text-center"
                  >
                    Chuyển sang tài khoản này &rarr;
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
