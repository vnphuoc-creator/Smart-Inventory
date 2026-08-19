import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { AHTLogo } from './AHTLogo';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanInput) {
      setErrorMsg('Vui lòng nhập Email hoặc Tên đăng nhập của bạn.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    // Match user by email or username or partial email name
    const foundUser = users.find((u) => {
      const emailLower = u.email.toLowerCase();
      const usernameLower = u.username.toLowerCase();
      const emailPrefix = emailLower.split('@')[0];

      return (
        emailLower === cleanInput ||
        usernameLower === cleanInput ||
        emailPrefix === cleanInput ||
        u.fullName.toLowerCase() === cleanInput
      );
    });

    if (!foundUser) {
      setErrorMsg(
        'Không tìm thấy tài khoản với thông tin này. Vui lòng kiểm tra lại email hoặc bấm "Xem danh sách tài khoản & Mật khẩu".',
      );
      return;
    }

    // Verify password: check user.password or user.defaultPassword or custom aliases
    const validPasswords = [
      foundUser.password,
      foundUser.defaultPassword,
      `${foundUser.username}12345`,
      `${foundUser.email.split('@')[0]}12345`,
    ].filter(Boolean);

    const isMatch = validPasswords.some((p) => p?.toLowerCase() === cleanPass.toLowerCase());

    if (!isMatch) {
      setErrorMsg(
        `Mật khẩu không chính xác! Gợi ý: Mật khẩu mặc định của bạn là "${
          foundUser.defaultPassword || foundUser.password
        }".`,
      );
      return;
    }

    // Success!
    if (rememberMe) {
      localStorage.setItem('smart_auth_email_saved', foundUser.email);
    } else {
      localStorage.removeItem('smart_auth_email_saved');
    }

    onLogin(foundUser);
  };

  const handleQuickSelect = (u: User) => {
    setEmailOrUsername(u.email);
    setPassword(u.defaultPassword || u.password || `${u.username}12345`);
    setErrorMsg(null);
  };

  const filteredUsersForModal = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background grid and ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl mb-4">
            <AHTLogo className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Quản Lý Kho Thông Minh
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Hệ thống Quản lý Vật tư Xuất - Nhập - Tồn AHT
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 py-8 px-6 sm:px-8 shadow-2xl rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <span className="text-sm font-semibold text-slate-200">Đăng Nhập Hệ Thống</span>
            <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Bảo Mật Nội Bộ
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email hoặc Tên tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="ví dụ: vn.phuoc235@gmail.com hoặc duc.nguyen"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Mật khẩu đăng nhập
                </label>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                >
                  <HelpCircle className="w-3 h-3" /> Tra cứu mật khẩu 24 NV
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Nhập mật khẩu (ví dụ: phuoc.vy12345)"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Vào Kho</span>
            </button>
          </form>

          {/* Quick login selector for convenience */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Chọn nhanh tài khoản mẫu:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    users.find((u) => u.email === 'vn.phuoc235@gmail.com') || users[0],
                  )
                }
                className="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 transition-colors"
              >
                <div className="text-xs font-medium text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-rose-400" /> Vy Ngọc Phước
                </div>
                <div className="text-[10px] text-slate-400 truncate">Admin / Quản lý</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    users.find((u) => u.email === 'duc.nguyen@ahtcorp.vn') || users[0],
                  )
                }
                className="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 transition-colors"
              >
                <div className="text-xs font-medium text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-rose-400" /> Nguyễn Văn Đức
                </div>
                <div className="text-[10px] text-slate-400 truncate">Admin / Quản lý</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    users.find((u) => u.email === 'hapham281@gmail.com') || users[4],
                  )
                }
                className="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 transition-colors"
              >
                <div className="text-xs font-medium text-white flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-400" /> Phạm Hà
                </div>
                <div className="text-[10px] text-slate-400 truncate">Nhân viên thi công</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickSelect(
                    users.find((u) => u.email === 'duykich1985@gmail.com') || users[10],
                  )
                }
                className="text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 transition-colors"
              >
                <div className="text-xs font-medium text-white flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-400" /> Nguyễn Duy Kích
                </div>
                <div className="text-[10px] text-slate-400 truncate">Nhân viên lắp đặt</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-xs text-slate-400 mt-5 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Bảo mật phân quyền vai trò (Admin & Nhân viên)
        </p>
      </div>

      {/* Tra cứu mật khẩu 24 thành viên Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Danh Sách Tài Khoản & Mật Khẩu 24 Thành Viên
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bấm vào tài khoản bất kỳ để tự động điền và đăng nhập
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 border-b border-slate-800">
              <input
                type="text"
                placeholder="Tìm theo tên, email, phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredUsersForModal.map((u) => {
                const pass = u.defaultPassword || u.password || `${u.username}12345`;
                return (
                  <div
                    key={u.id}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg ${
                          u.avatarColor || 'bg-blue-600'
                        } text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {u.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(-2)
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs truncate">
                            {u.fullName}
                          </span>
                          {u.role === 'ADMIN' ? (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-medium">
                              Quản lý
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                              Nhân viên
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                        <p className="text-[10px] text-slate-400">{u.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 block">Mật khẩu:</span>
                        <code className="text-xs bg-slate-900 border border-slate-700 text-amber-400 px-2 py-0.5 rounded font-mono font-semibold">
                          {pass}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickSelect(u);
                          setShowGuideModal(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Chọn & Điền
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
