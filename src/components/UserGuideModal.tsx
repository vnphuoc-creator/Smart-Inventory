import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  UserCheck,
  ShieldCheck,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Lock,
  Download,
  Lightbulb,
} from 'lucide-react';
import { User } from '../types';
import { printCleanDocument } from '../utils/printHelper';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeRoleTab, setActiveRoleTab] = useState<'EMPLOYEE' | 'MANAGER' | 'SCENARIOS' | 'TIPS'>(
    currentUser.role === 'ADMIN' ? 'MANAGER' : 'EMPLOYEE'
  );
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handlePrint = () => {
    printCleanDocument();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in print:static print:p-0 print:m-0 print:bg-white print:z-auto">
      <div className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white print:max-w-none print:w-full print:h-auto print:bg-white print:text-black print:border-none print:shadow-none print:rounded-none">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Cẩm Nang Hướng Dẫn Sử Dụng Hệ Thống Vật Tư Thông Minh
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  v2.5 AHT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dành cho Nhân viên (Thủ kho / Kỹ thuật viên) & Quản lý (Trưởng phòng / Admin)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="In tài liệu hướng dẫn"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">In / Xuất PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Tabs & Search Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveRoleTab('EMPLOYEE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeRoleTab === 'EMPLOYEE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>1. Dành Cho Nhân Viên Kho</span>
            </button>

            <button
              onClick={() => setActiveRoleTab('MANAGER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeRoleTab === 'MANAGER'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2. Dành Cho Quản Lý (Admin)</span>
            </button>

            <button
              onClick={() => setActiveRoleTab('SCENARIOS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeRoleTab === 'SCENARIOS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>3. Tình Huống Thực Tế & FAQ</span>
            </button>

            <button
              onClick={() => setActiveRoleTab('TIPS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeRoleTab === 'TIPS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>4. Phím Tắt & Mẹo Nhanh</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc nội dung hướng dẫn..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-200 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: NHÂN VIÊN */}
          {activeRoleTab === 'EMPLOYEE' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30">
                <h3 className="font-bold text-blue-300 text-base mb-1 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  Quy Trình Chuẩn Dành Cho Nhân Viên Kho & Kỹ Thuật Viên
                </h3>
                <p className="text-xs text-slate-300">
                  Nhân viên có nhiệm vụ kiểm tra danh mục, lập các phiếu Nhập / Xuất kho, theo dõi tiến độ Tờ trình và tra cứu thẻ kho.
                </p>
              </div>

              {/* 2.1 Danh mục */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-mono">1</span>
                  Tra Cứu Danh Mục Vật Tư (&gt;600 Mã Chuẩn DN)
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <p>
                    • Vào menu <strong className="text-white">Danh Mục Vật Tư</strong>: Bạn có thể tìm kiếm theo <strong className="text-blue-300">Mã vật tư (DN_xxx)</strong>, <strong className="text-blue-300">Tên vật tư</strong>, <strong className="text-blue-300">Quy cách kỹ thuật</strong> hoặc <strong className="text-blue-300">Vị trí kệ/ngăn</strong>.
                  </p>
                  <p>
                    • Bấm vào biểu tượng mắt (👁️) để xem định mức tồn an toàn (Min/Max), đơn vị tính, đơn giá mới nhất và lịch sử giao dịch.
                  </p>
                  <p>
                    • Nếu cần bổ sung mã vật tư mới vào hệ thống, bấm nút <strong className="text-emerald-400">+ Thêm Vật Tư Mới</strong>.
                  </p>
                </div>
              </div>

              {/* 2.2 Nhập Kho & Nhập Nhiều Đợt */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-mono">2</span>
                  Lập Phiếu Nhập Kho & Xử Lý Giao Hàng Nhiều Đợt
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Tính Năng Tự Động Điền Tờ Trình Thông Minh
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Khi lập Phiếu Nhập, tại ô <em>Căn Cứ Tờ Trình Mua Sắm</em>, bạn chỉ cần gõ số tờ trình (VD: <code className="text-amber-300 font-mono">17</code> hoặc <code className="text-amber-300 font-mono">29</code>), hệ thống sẽ tự động hoàn thiện hậu tố <code className="text-emerald-300 font-mono">-DNCT/PKT</code> và hiển thị nút <strong>"⚡ Nạp Tự Động Toàn Bộ Vật Tư"</strong>.
                    </p>
                  </div>
                  <p>
                    • <strong className="text-amber-300">Nếu Nhà cung cấp giao thiếu hoặc giao nhiều đợt:</strong> Bạn chỉ nhập đúng số lượng thực nhận tại kho ở đợt này. Các món chưa giao có thể để số lượng = 0 hoặc xóa khỏi phiếu.
                  </p>
                  <p>
                    • <strong className="text-emerald-300">Sau khi Quản lý duyệt:</strong> Tồn kho các món thực nhận được cộng ngay vào kho. Tờ trình vẫn bảo lưu tiến độ (VD: 60%) để tiếp tục đợt sau.
                  </p>
                  <p>
                    • Đính kèm ảnh biên bản giao nhận / hóa đơn nhà cung cấp để Quản lý dễ duyệt.
                  </p>
                </div>
              </div>

              {/* 2.3 Xuất Kho Sẵn Có */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-mono">3</span>
                  Xuất Kho Thi Công Ngay (Không Cần Chờ Đủ 100% Tờ Trình)
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-amber-400" /> Nút "Xuất Kho Sẵn Có" Tiện Lợi
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Tại tab <strong>Đối Chiếu Tờ Trình</strong>, bấm nút màu cam <strong className="text-amber-300">"↗️ Xuất Kho Sẵn Có"</strong>. Hệ thống sẽ tự động lọc ra các vật tư trong Tờ trình đã có tồn kho khả dụng để bạn xuất ra công trường ngay lập tức, giải phóng tiến độ thi công.
                    </p>
                  </div>
                  <p>
                    • Bạn cũng có thể tạo Phiếu Xuất Kho độc lập cho công tác bảo trì, sửa chữa định kỳ tại tab <strong>Phiếu Kho</strong>.
                  </p>
                </div>
              </div>

              {/* 2.4 Thẻ Kho & AI */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-mono">4</span>
                  Tra Cứu Thẻ Kho & Sử Dụng Trợ Lý AI
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <p>
                    • Vào <strong className="text-white">Thẻ Kho & Báo Cáo NXT</strong> để xem biến động chi tiết từng ngày của bất kỳ mã vật tư nào.
                  </p>
                  <p>
                    • Vào <strong className="text-white">Trợ Lý AI Kho</strong> để tra cứu nhanh bằng tiếng Việt: hỏi số lượng tồn, vị trí ngăn kệ, cảnh báo vật tư sắp hết...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ (ADMIN) */}
          {activeRoleTab === 'MANAGER' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                <h3 className="font-bold text-amber-300 text-base mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Quy Trình Điều Hành & Kiểm Soát Dành Cho Quản Lý / Admin
                </h3>
                <p className="text-xs text-slate-300">
                  Quản lý có trách nhiệm phê duyệt chứng từ kho, ban hành Tờ trình mua sắm, kiểm soát cảnh báo an toàn tồn kho và phân quyền hệ thống.
                </p>
              </div>

              {/* 3.1 Duyệt phiếu */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-mono">1</span>
                  Kiểm Tra & Phê Duyệt Phiếu Kho Điện Tử
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <p>
                    • Khi có phiếu mới, thanh thông báo màu vàng trên cùng sẽ hiển thị số lượng phiếu chờ duyệt.
                  </p>
                  <p>
                    • Bấm vào phiếu để kiểm tra danh mục vật tư, số lượng, đơn giá, ảnh biên bản đính kèm.
                  </p>
                  <p>
                    • Bấm <strong className="text-emerald-400">"✅ Phê Duyệt"</strong> để cộng/trừ tồn kho tức thì, hoặc bấm <strong className="text-rose-400">"❌ Từ Chối"</strong> kèm ghi chú lý do để nhân viên lập lại.
                  </p>
                </div>
              </div>

              {/* 3.2 Tờ trình & Chốt đóng sớm */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-mono">2</span>
                  Quản Lý Tờ Trình & Tính Năng "Chốt Đóng Tờ Trình Sớm"
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <p>
                    • Nhấn <strong className="text-blue-400">+ Tạo Tờ Trình Mới</strong> để đưa các Tờ trình đã được Lãnh đạo ký duyệt vào hệ thống theo dõi.
                  </p>
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-1">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-400" /> Nghiệp Vụ Chốt Đóng Sớm (Nghiệm Thu Thực Nhận)
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Nếu Nhà cung cấp hết hàng hoặc không thể giao tiếp phần còn thiếu, Quản lý bấm nút <strong className="text-purple-300">"Chốt Đóng Tờ Trình"</strong> và nhập lý do. Tờ trình sẽ chuyển sang màu tím hoàn tất, không còn hiện cảnh báo thiếu hàng mà vẫn bảo lưu mọi số liệu đã nhập/xuất trước đó.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3.3 Sửa / Xóa chứng từ sai */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-mono">3</span>
                  Sửa & Xóa Chứng Từ Sai (Chỉ Admin)
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <p>
                    • Vào menu <strong className="text-rose-400">Sửa & Xóa Chứng Từ Sai</strong>: Quản lý có thể sửa lại số lượng, đơn giá hoặc hủy/xóa các phiếu bị lập sai. Hệ thống sẽ tự động hoàn tác số dư tồn kho về đúng trạng thái ban đầu một cách an toàn.
                  </p>
                </div>
              </div>

              {/* 3.4 Phân quyền */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-mono">4</span>
                  Phân Quyền & Cài Đặt (Master Admin)
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-300">
                  <p>
                    • Tài khoản Master Admin (<code className="text-blue-300">vn.phuoc235@gmail.com</code>) quản lý danh sách người dùng, cấp tài khoản cho nhân viên mới, đặt lại mật khẩu và import dữ liệu tồn kho đầu kỳ từ file Excel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCENARIOS & FAQ */}
          {activeRoleTab === 'SCENARIOS' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30">
                <h3 className="font-bold text-purple-300 text-base mb-1 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  Các Tình Huống Thực Tế & Câu Hỏi Thường Gặp (FAQ)
                </h3>
                <p className="text-xs text-slate-300">
                  Giải đáp các vướng mắc phổ biến trong quá trình vận hành kho thực tế.
                </p>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-amber-300">
                  <span>❓</span> NCC giao thiếu 3 món trong tờ trình, công trình đang cần gấp 5 món đã về kho để thi công?
                </div>
                <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                  👉 <strong>Giải quyết:</strong> Nhân viên lập Phiếu Nhập đợt 1 với 5 món thực nhận $\rightarrow$ Quản lý duyệt $\rightarrow$ Nhân viên vào tab <em>Đối Chiếu Tờ Trình</em> bấm <strong>"Xuất Kho Sẵn Có"</strong> để lập ngay phiếu xuất 5 món này ra công trường. Khi 3 món còn lại về, bấm <strong>"Nhập Bổ Sung Số Còn Thiếu"</strong>.
                </p>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-amber-300">
                  <span>❓</span> Tôi muốn in phiếu kho ra giấy A4 có đầy đủ chữ ký các bên?
                </div>
                <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                  👉 <strong>Giải quyết:</strong> Bấm vào phiếu kho cần in $\rightarrow$ Nhấn nút <strong>"🖨️ In Phiếu A4"</strong>. Hệ thống sẽ kết xuất biểu mẫu in chuẩn AHT với bảng biểu rõ ràng và 4 ô ký tên xác nhận.
                </p>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-amber-300">
                  <span>❓</span> Nhà cung cấp báo mặt hàng cuối cùng bị đứt hàng không sản xuất nữa?
                </div>
                <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                  👉 <strong>Giải quyết:</strong> Quản lý vào tab <em>Đối Chiếu Tờ Trình</em> $\rightarrow$ Bấm <strong>"Chốt Đóng Tờ Trình"</strong> $\rightarrow$ Ghi lý do nghiệm thu theo thực nhận $\rightarrow$ Xác nhận.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TIPS & TRICKS */}
          {activeRoleTab === 'TIPS' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <h3 className="font-bold text-emerald-300 text-base mb-1 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                  Mẹo Nhanh & Thao Tác Tiện Lợi
                </h3>
                <p className="text-xs text-slate-300">
                  Các mẹo giúp tăng tốc độ làm việc và thao tác chuẩn xác nhất trên hệ thống.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Gõ nhanh số Tờ trình
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Chỉ cần gõ số như <code className="text-amber-300">17</code> hoặc <code className="text-amber-300">29</code>, hệ thống tự động hoàn thiện <code className="text-emerald-300">-DNCT/PKT</code>.
                  </p>
                </div>

                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Nạp danh sách tự động
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Sử dụng nút màu tím <strong className="text-purple-300">"⚡ Nạp Tự Động"</strong> để không phải gõ tay từng mã vật tư.
                  </p>
                </div>

                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-amber-400" /> Tìm kiếm AI thông minh
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Nhấp vào ô tìm kiếm AI giữa Header hoặc hỏi Trợ lý AI bằng tiếng Việt tự nhiên mọi lúc.
                  </p>
                </div>

                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-purple-400" /> Xuất Excel báo cáo nhanh
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Mọi bảng biểu Danh mục, Tồn kho, Báo cáo NXT đều có nút xuất file Excel tiện lợi để nộp báo cáo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Tài liệu kỹ thuật nội bộ AHT • Hotline hỗ trợ:</span>
            <strong className="text-blue-400 font-mono">vn.phuoc235@gmail.com</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Đóng Hướng Dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
