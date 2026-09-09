import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Download,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Sparkles,
  ShieldCheck,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  FileCheck2,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Layers,
  FileText,
  Building2,
  Eye,
  Info,
} from 'lucide-react';
import { exportTrainingDeckToPPTX } from '../utils/pptxExport';
import { printCleanDocument } from '../utils/printHelper';

interface TrainingSlidesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrainingSlidesModal: React.FC<TrainingSlidesModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = 12;

  // Keyboard navigation (Arrow keys, Space)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalSlides, onClose]);

  // Auto-play feature
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
    }, 7000);
    return () => clearInterval(timer);
  }, [isPlaying, totalSlides]);

  if (!isOpen) return null;

  const handleDownloadPPTX = async () => {
    try {
      setIsDownloading(true);
      await exportTrainingDeckToPPTX();
    } catch (err) {
      console.error('Lỗi khi xuất PowerPoint:', err);
      alert('Không thể tạo file PowerPoint. Hãy thử lại trên trình duyệt Chrome/Edge mới nhất.');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handlePrint = () => {
    printCleanDocument('landscape');
  };

  const slidesData = [
    {
      id: 1,
      tag: 'CHƯƠNG TRÌNH ĐÀO TẠO 2026',
      title: 'HƯỚNG DẪN VẬN HÀNH HỆ THỐNG QUẢN LÝ KHO THÔNG MINH',
      subtitle: 'Quy trình số hóa Xuất - Nhập - Tồn Vật tư Kỹ thuật • Công nghệ AI Vision OCR Tờ trình',
      badge: 'ĐỘI ĐIỆN NƯỚC CÔNG TRÌNH - AHT CẢNG HKQT ĐÀ NẴNG',
    },
    {
      id: 2,
      tag: 'PHẦN 1: TỔNG QUAN',
      title: 'Mục Tiêu Đào Tạo & 3 Nguyên Tắc Cốt Lõi',
      subtitle: 'Chuẩn hóa quy trình vận hành ca trực - Triệt tiêu thất thoát - Số hóa 100%',
    },
    {
      id: 3,
      tag: 'BƯỚC 1: TRUY CẬP HỆ THỐNG',
      title: 'Đăng Nhập & Phân Quyền 4 Vai Trò Tài Khoản',
      subtitle: 'Bảo mật tài khoản ca trực - Phân định rõ quyền hạn Thủ kho, Kỹ thuật viên và Quản lý',
    },
    {
      id: 4,
      tag: 'BƯỚC 2: TRA CỨU VẬT TƯ',
      title: 'Danh Mục Vật Tư Chuẩn (>600 Mã DN_*) & Định Mức Tồn Kho',
      subtitle: 'Quy chuẩn định danh DN_[Nhóm]_[Mã] • Cảnh báo hàng chạm đáy an toàn (Min Stock)',
    },
    {
      id: 5,
      tag: 'BƯỚC 3: ĐỘT PHÁ CÔNG NGHỆ AI',
      title: 'Lập Phiếu Nhập Kho & Quét Ảnh Tờ Trình Bằng AI OCR',
      subtitle: 'Chụp ảnh hoặc Dán Ctrl+V ảnh tờ trình: AI tự bóc tách số tờ trình & nạp toàn bộ danh mục vật tư trong 2 giây',
    },
    {
      id: 6,
      tag: 'BƯỚC 4: QUY TRÌNH XUẤT KHO',
      title: 'Lập Phiếu Xuất Kho Bảo Trì / Sửa Chữa (Mẫu 02-VT)',
      subtitle: 'Kiểm tra tồn kho tức thì • Chặn xuất âm • Ghi rõ hệ thống và hạng mục sửa chữa',
    },
    {
      id: 7,
      tag: 'BƯỚC 5: HỒ SƠ & IN ẤN',
      title: 'In Phiếu Kho Chuẩn Mẫu 01-VT & 02-VT Bộ Tài Chính',
      subtitle: 'Tự động định dạng khổ giấy A4 dọc • Tự quy đổi số tiền bằng chữ • Nút xem nhanh ảnh tờ trình gốc',
    },
    {
      id: 8,
      tag: 'BƯỚC 6: BÁO CÁO KẾ TOÁN',
      title: 'Thẻ Kho Điện Tử & Báo Cáo Xuất - Nhập - Tồn (XNT)',
      subtitle: 'Theo dõi biến động chi tiết từng mặt hàng • Lọc theo tháng/quý • Xuất báo cáo Excel một chạm',
    },
    {
      id: 9,
      tag: 'BƯỚC 7: QUẢN TRỊ TIẾN ĐỘ',
      title: 'Đối Soát Tờ Trình Mua Sắm & Tỷ Lệ Thực Nhập',
      subtitle: 'Theo dõi ma trận: Đã duyệt mua bao nhiêu? Đã nhập kho bao nhiêu? Còn thiếu bao nhiêu cái?',
    },
    {
      id: 10,
      tag: 'BƯỚC 8: TRỢ LÝ THÔNG MINH',
      title: 'Khai Thác Trợ Lý AI Kho & Tìm Kiếm Tự Nhiên',
      subtitle: 'Hỏi đáp bằng tiếng Việt hàng ngày để tra cứu tồn kho, tìm vật tư thay thế và kiểm tra tờ trình',
    },
    {
      id: 11,
      tag: 'BƯỚC 9: KỶ LUẬT CA TRỰC',
      title: 'Kỷ Luật Vận Hành Ca Trực & Checklist 5 Bước Hằng Ngày',
      subtitle: 'Quy chuẩn bàn giao ca trực • Đồng bộ Cloud an toàn • Tuyệt đối không xuất hàng trước khi lập phiếu',
    },
    {
      id: 12,
      tag: 'TỔNG KẾT & CHUYỂN GIAO',
      title: 'Tổng Kết Khóa Đào Tạo & Kênh Hỗ Trợ Kỹ Thuật AHT',
      subtitle: 'Địa chỉ web app chính thức • Phân quyền tài khoản • Cam kết chất lượng vận hành ĐNCT',
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-[#050B1B] text-slate-100 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      } animate-in fade-in select-none print:static print:bg-white print:text-black print:p-0`}
    >
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#081028] border-b border-slate-800 rounded-t-2xl shrink-0 shadow-lg no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Slide Đào Tạo Vận Hành Kho Thông Minh
              </h2>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                16:9 HD
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Đội Điện Nước Công Trình (ĐNCT/PKT) • Nhà Ga Quốc Tế T2 Đà Nẵng
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download Real PPTX button */}
          <button
            id="btn-download-pptx-slide"
            onClick={handleDownloadPPTX}
            disabled={isDownloading}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all border border-blue-400/30 disabled:opacity-50"
            title="Tải tệp trình chiếu Microsoft PowerPoint (.pptx)"
          >
            <Download className="w-4 h-4 text-cyan-300 animate-bounce" />
            <span>{isDownloading ? 'Đang xuất PPTX...' : 'Tải Slide PowerPoint (.pptx)'}</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            title="In hoặc xuất PDF toàn bộ slide"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>In / Xuất PDF</span>
          </button>

          {/* Auto-play button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl border text-xs font-semibold transition ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isPlaying ? 'Tạm dừng tự động chuyển' : 'Tự động trình chiếu (7s)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700/50 transition"
            title="Đóng slide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Canvas (Strict 16:9 Aspect Ratio Container) */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <div className="w-full max-w-6xl aspect-[16/9] max-h-[82vh] bg-[#0A1229] border-2 border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
          {/* Top Slide Header Bar */}
          <div className="px-6 py-3 bg-[#070D1E] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-cyan-400 bg-cyan-950/70 border border-cyan-700/50 px-2.5 py-0.5 rounded-full uppercase">
                {slidesData[currentSlide].tag}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                AHT • ĐỘI ĐIỆN NƯỚC CÔNG TRÌNH
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-400">
                Slide <span className="text-cyan-400 font-bold text-sm">{currentSlide + 1}</span> / {totalSlides}
              </span>
            </div>
          </div>

          {/* Slide Content Body */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            {/* SLIDE 1: COVER / TITLE SLIDE */}
            {currentSlide === 0 && (
              <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-cyan-300 w-fit mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  CHƯƠNG TRÌNH ĐÀO TẠO NỘI BỘ NĂM 2026
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
                  HỆ THỐNG QUẢN LÝ KHO THÔNG MINH
                  <span className="block text-cyan-400 text-xl sm:text-3xl mt-1 font-bold">
                    ĐỘI ĐIỆN NƯỚC CÔNG TRÌNH (ĐNCT / PKT)
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed mb-6">
                  Quy trình số hóa toàn diện Xuất - Nhập - Tồn vật tư kỹ thuật Nhà ga Quốc tế T2. 
                  Tích hợp công nghệ <strong className="text-amber-300">Trợ Lý AI Vision OCR</strong> tự động đọc ảnh Tờ trình & đối soát tiến độ mua sắm thời gian thực.
                </p>

                {/* 3 Core Highlight Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">Quản Lý &gt;600 Mã DN_*</div>
                    <div className="text-xs text-slate-400">
                      Chuẩn hóa định danh, phân nhóm ngành và định mức tồn kho tối thiểu.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">Quét Tờ Trình Bằng AI</div>
                    <div className="text-xs text-slate-400">
                      Chụp ảnh hoặc ấn Ctrl+V: AI tự bóc tách số tờ trình và nạp danh mục vật tư.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">Đối Soát & Thẻ Kho 24/7</div>
                    <div className="text-xs text-slate-400">
                      Kiểm soát chặt chẽ tỷ lệ thực nhập, in phiếu kho chuẩn Bộ Tài chính.
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Áp dụng: Cảng Hàng Không Quốc Tế Đà Nẵng (AHT)</span>
                  <span className="font-semibold text-cyan-400">Phiên bản đào tạo: 2026.1</span>
                </div>
              </div>
            )}

            {/* SLIDE 2: MỤC TIÊU & 3 NGUYÊN TẮC */}
            {currentSlide === 1 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-6">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
                  {/* Goals */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      MỤC TIÊU CẦN ĐẠT CỦA HỌC VIÊN
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">1.</span>
                        Thành thạo lập phiếu Nhập 01-VT và Xuất 02-VT theo mẫu chuẩn kế toán.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">2.</span>
                        Biết dùng điện thoại chụp ảnh hoặc dán ảnh (Ctrl+V) Tờ trình để AI bóc tách tự động.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">3.</span>
                        Kiểm soát chính xác vị trí lưu kho (Kệ/Ngăn) và định mức tồn kho tối thiểu.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">4.</span>
                        Chủ động khai thác Trợ lý AI để truy vấn nhanh số liệu kho mọi lúc mọi nơi.
                      </li>
                    </ul>
                    <div className="mt-4 p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-300 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                      Hoàn thành đào tạo giúp nhân viên tiết kiệm đến 95% thời gian nhập liệu thủ công!
                    </div>
                  </div>

                  {/* 3 Core Rules */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-rose-400 mb-3">
                      <ShieldCheck className="w-4 h-4 text-rose-400" />
                      3 NGUYÊN TẮC "BẤT KHẢ XÂM PHẠM"
                    </div>
                    <div className="space-y-3.5">
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40">
                        <div className="text-xs font-bold text-rose-300">
                          1. KHÔNG XUẤT KHO KHI CHƯA CÓ PHIẾU
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Tuyệt đối không lấy vật tư đi sửa chữa trước rồi ghi sổ sau. Mọi ca trực phải tạo phiếu 02-VT ngay lập tức.
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
                        <div className="text-xs font-bold text-amber-300">
                          2. 100% VẬT TƯ NHẬP PHẢI THEO TỜ TRÌNH
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Mọi chuyến hàng về kho bắt buộc đối chiếu với Số tờ trình (vd: 17-DNCT/PKT) để chống nhập khống hoặc nhầm dự toán.
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                        <div className="text-xs font-bold text-emerald-300">
                          3. ĐỒNG BỘ THỜI GIAN THỰC (REAL-TIME CLOUD)
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Dữ liệu được lưu vĩnh viễn trên đám mây Google Firestore, truy cập tức thời trên cả điện thoại lẫn máy tính.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: ĐĂNG NHẬP & PHÂN QUYỀN */}
            {currentSlide === 2 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
                  {/* Visual mockup of login screen */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950/70 border border-slate-700 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-cyan-400 flex items-center justify-center text-cyan-300 mb-3 shadow-lg shadow-blue-500/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
                      Cổng Đăng Nhập An Toàn
                    </div>
                    <div className="text-base font-bold text-white mb-3">
                      Quản Lý Kho Đội ĐNCT - AHT
                    </div>

                    <div className="w-full max-w-xs space-y-2 text-left text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Tài khoản (Email ca trực):</div>
                      <div className="font-mono bg-slate-900 px-2 py-1 rounded text-cyan-300 border border-slate-700">
                        thukho@aht.vn / nvkt@aht.vn
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1">Mật khẩu bảo mật:</div>
                      <div className="font-mono bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">
                        ••••••••••••
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Yêu cầu đổi mật khẩu ở góc trên bên phải khi mới nhận tài khoản!
                    </div>
                  </div>

                  {/* 4 Roles breakdown */}
                  <div className="space-y-2.5 flex flex-col justify-center">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-blue-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300">1. THỦ KHO (Staff)</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">Quyền tác nghiệp</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Lập phiếu Nhập/Xuất kho, quét ảnh tờ trình AI, theo dõi thẻ kho và in phiếu theo mẫu chuẩn 01-VT/02-VT.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300">2. KỸ THUẬT VIÊN (Technician)</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">Tra cứu & Đề xuất</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Tra cứu nhanh số tồn thực tế, vị trí kệ vật tư, hỏi đáp Trợ lý AI và đề xuất nhu cầu xuất vật tư sửa chữa.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-300">3. TRƯỞNG PHÒNG / QUẢN LÝ (Admin)</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">Phê duyệt & Giám sát</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Phê duyệt phiếu xuất nhập, sửa phiếu lập sai sót, xem báo cáo tổng hợp và theo dõi tiến độ các Tờ trình.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300">4. MASTER ADMIN (vn.phuoc235)</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">Toàn quyền hệ thống</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Phân quyền người dùng, reset mật khẩu, thiết lập danh mục hệ thống và quản trị đồng bộ Cloud.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 4: TRA CỨU DANH MỤC VẬT TƯ */}
            {currentSlide === 3 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-stretch">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Package className="w-4 h-4" />
                        1. QUY CHUẨN MÃ VẬT TƯ
                      </div>
                      <p className="text-xs text-slate-300 mb-3">
                        Tất cả vật tư Đội ĐNCT đều bắt đầu bằng <strong className="text-amber-300">DN_</strong> kèm nhóm ngành:
                      </p>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                          DN_CS_*: Chiếu sáng (Đèn LED, chấn lưu...)
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-blue-300">
                          DN_DL_*: Động lực & Điện áp (Aptomat, cáp...)
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-300">
                          DN_NUOC_*: Cấp thoát nước (Van, ống PPR...)
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Giúp tra cứu nhanh và không bị nhầm lẫn giữa các phòng ban.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        2. CẢNH BÁO TỒN KHO THÔNG MINH
                      </div>
                      <p className="text-xs text-slate-300 mb-3">
                        Hệ thống tự động so sánh Số tồn hiện tại với Định mức tồn tối thiểu (Min Stock):
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center justify-between">
                          <span>Màu Đỏ: Hết hàng (0 Cái)</span>
                          <span className="font-bold">Cần mua ngay</span>
                        </div>
                        <div className="p-2 rounded bg-amber-950/60 border border-amber-800 text-amber-300 flex items-center justify-between">
                          <span>Màu Vàng: Sắp hết (&lt; Min Stock)</span>
                          <span className="font-bold">Cảnh báo</span>
                        </div>
                        <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-between">
                          <span>Màu Xanh: Tồn dồi dào</span>
                          <span className="font-bold">An toàn</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Trực quan hóa tức thời trên màn hình Tổng Quan.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        3. LỊCH SỬ & VỊ TRÍ LƯU TRỮ
                      </div>
                      <p className="text-xs text-slate-300 mb-2">
                        Bấm vào bất kỳ dòng vật tư nào để:
                      </p>
                      <ul className="space-y-2 text-xs text-slate-200">
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Xem vị trí chính xác: Kệ, Ngăn, Hộc trong kho vật tư.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Xem toàn bộ dòng lịch sử Nhập - Xuất của mặt hàng.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Xem đơn giá bình quân và tổng giá trị tồn kho hiện tại.</span>
                        </li>
                      </ul>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Rút ngắn thời gian tìm kiếm vật tư trong kho vật lý chỉ còn 30 giây!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 5: QUÉT ẢNH TỜ TRÌNH AI OCR (THE BIG REVOLUTION) */}
            {currentSlide === 4 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      {slidesData[currentSlide].title}
                    </h2>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      ĐỘT PHÁ CÔNG NGHỆ 2026
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-3">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 items-stretch">
                  {/* Left: Step flow (7 cols) */}
                  <div className="md:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-blue-500/50 flex flex-col justify-between">
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      QUY TRÌNH 4 BƯỚC NHẬP KHO BẰNG ẢNH CHỤP
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          1
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Chụp ảnh Tờ trình giấy hoặc chụp màn hình</div>
                          <div className="text-[11px] text-slate-400">
                            Chụp rõ nét phần Tiêu đề và Bảng danh mục vật tư bằng điện thoại hoặc công cụ Snipping Tool trên máy tính.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          2
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-300">Dán trực tiếp (Ctrl + V) hoặc bấm Tải ảnh</div>
                          <div className="text-[11px] text-slate-400">
                            Tại màn hình Lập Phiếu Nhập Kho, nhấp vào ô "Đính kèm ảnh" và ấn Ctrl + V. Không cần lưu file về máy!
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          3
                        </div>
                        <div>
                          <div className="text-xs font-bold text-cyan-300">AI Vision đọc chữ OCR trong 2 giây</div>
                          <div className="text-[11px] text-slate-400">
                            AI tự nhận diện Số tờ trình (vd: 17-DNCT/PKT), Nhà cung cấp, Ngày tháng và lọc toàn bộ dòng trong bảng.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          4
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-300">Tự động điền bảng vật tư & Lưu phiếu</div>
                          <div className="text-[11px] text-slate-300">
                            Tất cả mặt hàng, số lượng, đơn vị tính được nạp chính xác vào bảng. Thủ kho kiểm tra lướt qua rồi bấm "Lưu Phiếu"!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Simulated Screen Preview (5 cols) */}
                  <div className="md:col-span-5 p-4 rounded-2xl bg-[#060D1E] border border-cyan-500/40 flex flex-col justify-between">
                    <div className="text-xs font-bold text-cyan-400 flex items-center justify-between pb-2 border-b border-slate-800">
                      <span>KẾT QUẢ QUÉT THỰC TẾ</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Tự động 100%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 my-2 space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Số Tờ trình:</span>
                        <span className="text-cyan-300 font-bold">17-DNCT/PKT</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Nhà cung cấp:</span>
                        <span className="text-white">Công ty Thiết Bị Điện AHT</span>
                      </div>
                      <div className="text-slate-400 pt-1 border-t border-slate-800">
                        <span>Vật tư bóc tách từ ảnh:</span>
                        <div className="text-emerald-300 mt-1 pl-2">
                          • Đèn LED âm trần 18W: 40 Cái<br />
                          • Aptomat 2P 32A Schneider: 15 Cái<br />
                          • Ống luồn dây PVC D20: 200 Mét
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center gap-2">
                      <Eye className="w-4 h-4 shrink-0" />
                      Ảnh gốc được lưu trữ vĩnh viễn cùng phiếu kho để tra cứu đối chứng mọi lúc!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 6: QUY TRÌNH XUẤT KHO */}
            {currentSlide === 5 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-stretch">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-2">
                        BƯỚC 1: CHỌN NGUỒN XUẤT KHO
                      </div>
                      <p className="text-xs text-slate-300 mb-3">
                        Hệ thống hỗ trợ 2 hình thức xuất kho chính:
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-800 text-blue-300">
                          <strong className="block text-white">Xuất kho tổng thông thường:</strong>
                          Dành cho việc bảo trì, sửa chữa phát sinh hàng ngày tại nhà ga.
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-800 text-purple-300">
                          <strong className="block text-white">Xuất theo Tờ trình dự án:</strong>
                          Trừ trực tiếp vào hạn mức vật tư của gói tờ trình mua sắm cụ thể.
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Đảm bảo chi phí được hạch toán đúng nguồn kinh phí.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">
                        BƯỚC 2: CHỌN VẬT TƯ & KIỂM TRA TỒN
                      </div>
                      <p className="text-xs text-slate-300 mb-2">
                        Gõ tên hoặc mã DN_* để chọn mặt hàng:
                      </p>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 mb-2">
                        <div className="text-slate-400">Tồn khả dụng: <span className="text-emerald-400 font-bold">45 Cái</span></div>
                        <div className="text-slate-400">Số lượng xuất: <span className="text-amber-400 font-bold">10 Cái</span></div>
                        <div className="text-slate-400">Tồn sau xuất: <span className="text-cyan-400 font-bold">35 Cái</span></div>
                      </div>
                      <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]">
                        <strong>Cơ chế khóa an toàn:</strong> Không bao giờ cho phép xuất vượt quá số lượng tồn thực tế trong kho!
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Triệt tiêu hoàn toàn tình trạng âm kho.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">
                        BƯỚC 3: GHI RÕ MỤC ĐÍCH & NGƯỜI NHẬN
                      </div>
                      <p className="text-xs text-slate-300 mb-2">
                        Bắt buộc nhập các trường thông tin kiểm soát:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        <li className="p-1.5 rounded bg-slate-950 border border-slate-800">
                          <strong>Người nhận:</strong> Tên Kỹ thuật viên ca trực
                        </li>
                        <li className="p-1.5 rounded bg-slate-950 border border-slate-800">
                          <strong>Hệ thống sửa chữa:</strong> Chiếu sáng / Động lực / Cấp thoát nước
                        </li>
                        <li className="p-1.5 rounded bg-slate-950 border border-slate-800">
                          <strong>Vị trí cụ thể:</strong> VD: "Thay bóng sảnh đến Quốc tế Tầng 1"
                        </li>
                      </ul>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Phục vụ công tác thanh quyết toán và đối chiếu bảo hành.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 7: IN PHIẾU KHO CHUẨN BỘ TÀI CHÍNH */}
            {currentSlide === 6 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
                  {/* Print specifications */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        TIÊU CHUẨN MẪU PHIẾU PHÁP LÝ
                      </div>
                      <div className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <strong className="text-cyan-300 block mb-1">Mẫu số 01 - VT: Phiếu Nhập Kho</strong>
                          Theo Thông tư số 200/2014/TT-BTC. Ghi rõ số hóa đơn, số tờ trình, đơn vị giao hàng và diễn giải lý do.
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <strong className="text-cyan-300 block mb-1">Mẫu số 02 - VT: Phiếu Xuất Kho</strong>
                          Quy chuẩn xuất kho vật tư phục vụ sản xuất bảo trì. Có chữ ký 4 bên: Người lập, Thủ kho, Người nhận, Trưởng bộ phận.
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-300">
                      Tự động tính Tổng số tiền bằng chữ tiếng Việt chính xác 100%!
                    </div>
                  </div>

                  {/* Print instructions & Quick preview */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        THAO TÁC IN CHỈ VỚI 1 CLICK
                      </div>
                      <ol className="space-y-2.5 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-400">1.</span>
                          Vào mục <strong>"Xuất - Nhập Kho"</strong>, tìm phiếu trong danh sách.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-400">2.</span>
                          Bấm nút <strong>"Xem Phiếu"</strong>: Bản in A4 chuẩn sẽ hiện ra đầy đủ dấu hiệu Bộ Tài chính.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-400">3.</span>
                          Bấm nút <strong>"In Phiếu"</strong> (hoặc bấm <code>Ctrl + P</code>) để in trực tiếp ra máy in hoặc lưu PDF.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-400">4.</span>
                          Xem ảnh tờ trình gốc ngay phía dưới để đối chiếu chữ ký gốc nếu cần.
                        </li>
                      </ol>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-300">
                      💡 Mẹo: Có thể in hàng loạt phiếu nhập xuất trong tháng để đóng tập chứng từ kế toán lưu trữ cuối năm.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 8: THẺ KHO & BÁO CÁO XNT */}
            {currentSlide === 7 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-stretch">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4" />
                        1. NGUYÊN TẮC THẺ KHO ĐIỆN TỬ
                      </div>
                      <p className="text-xs text-slate-300 mb-3">
                        Thực hiện đúng công thức kế toán cân đối:
                      </p>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-center text-xs text-cyan-300 mb-3 font-bold">
                        TỒN CUỐI = TỒN ĐẦU + TỔNG NHẬP - TỔNG XUẤT
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Mỗi dòng giao dịch đều ghi rõ Ngày, Số chứng từ, Diễn giải nội dung, Người thực hiện. Tuyệt đối không thể tự ý sửa số tồn mà không qua chứng từ.
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Đảm bảo tính pháp lý và minh bạch kiểm toán.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        2. LỌC THEO KỲ BÁO CÁO LINH HOẠT
                      </div>
                      <p className="text-xs text-slate-300 mb-2">
                        Tùy chọn thời gian xem dữ liệu nhanh chóng:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-200 mb-3">
                        <li className="p-2 rounded bg-slate-950 border border-slate-800">
                          📅 <strong>Theo tháng:</strong> Báo cáo XNT Tháng 1, Tháng 2,...
                        </li>
                        <li className="p-2 rounded bg-slate-950 border border-slate-800">
                          📊 <strong>Theo quý:</strong> Báo cáo tổng hợp Quý I, Quý II,...
                        </li>
                        <li className="p-2 rounded bg-slate-950 border border-slate-800">
                          🔍 <strong>Khoảng tùy chọn:</strong> Từ ngày... Đến ngày...
                        </li>
                      </ul>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Đáp ứng mọi yêu cầu đột xuất từ Ban Giám đốc AHT.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Download className="w-4 h-4" />
                        3. XUẤT EXCEL CHUYÊN NGHIỆP
                      </div>
                      <p className="text-xs text-slate-300 mb-2">
                        Bấm nút "Xuất Excel" để tải ngay tệp bảng tính:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Tự động căn lề, tiêu đề và kẻ bảng chuẩn mực.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Có đầy đủ công thức SUM tính tổng giá trị tồn kho.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Phục vụ công tác kiểm kê vật tư định kỳ cuối năm.</span>
                        </li>
                      </ul>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Tương thích 100% với Microsoft Excel, Google Sheets.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 9: ĐỐI SOÁT TỜ TRÌNH MUA SẮM */}
            {currentSlide === 8 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
                  {/* Left: Why reconcile */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4" />
                        BÀI TOÁN GIAO HÀNG NHIỀU ĐỢT
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                        <p>
                          Một tờ trình mua sắm thường có 20 - 50 hạng mục và nhà cung cấp giao thành 2 - 3 đợt khác nhau.
                        </p>
                        <p>
                          Nếu chỉ ghi sổ giấy thông thường, thủ kho rất dễ bị <strong className="text-rose-400">bỏ quên các món nhà cung cấp chưa giao đủ</strong> hoặc bị giao thiếu quy cách kỹ thuật.
                        </p>
                        <p>
                          Hệ thống Quản lý Kho ĐNCT tự động cộng dồn số lượng từng đợt nhập theo Số tờ trình, tính ra chính xác:
                        </p>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1 text-cyan-300">
                          <div>• Số lượng duyệt mua: 100 Cái</div>
                          <div>• Đã nhập kho đợt 1 + 2: 70 Cái</div>
                          <div className="text-amber-400 font-bold">• Còn nợ kho: 30 Cái (Cần đôn đốc giao)</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Chống thất thoát tài sản ngay từ khâu nhận hàng.
                    </div>
                  </div>

                  {/* Right: Status Badges & Action */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">
                        4 TRẠNG THÁI TIẾN ĐỘ TRỰC QUAN
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60">
                          <span className="font-bold text-emerald-300">HOÀN THÀNH 100%:</span>
                          <span className="text-slate-300 block mt-0.5">Tất cả vật tư theo tờ trình đã nhập đủ vào kho. Có thể làm thủ tục thanh toán.</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-700/60">
                          <span className="font-bold text-amber-300">ĐANG NHẬP MỘT PHẦN (1% - 99%):</span>
                          <span className="text-slate-300 block mt-0.5">Nhà cung cấp mới giao một phần. Hệ thống liệt kê chi tiết các món còn thiếu.</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="font-bold text-slate-400">CHƯA NHẬP (0%):</span>
                          <span className="text-slate-400 block mt-0.5">Tờ trình đã duyệt nhưng chưa có chuyến hàng nào về kho.</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-700/60">
                          <span className="font-bold text-purple-300">CẢNH BÁO VƯỢT HẠN MỨC:</span>
                          <span className="text-slate-300 block mt-0.5">Cảnh báo đỏ nếu số lượng thực nhập vượt quá dự toán tờ trình.</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-cyan-300 mt-2">
                      Giúp Trưởng phòng kiểm soát ngân sách mua sắm minh bạch 100%.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 10: TRỢ LÝ AI & TÌM KIẾM TỰ NHIÊN */}
            {currentSlide === 9 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-stretch">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/40 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        CÂU HỎI TỒN KHO NHANH
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-semibold mb-2">
                        "Trong kho còn bao nhiêu bóng đèn LED 18W?"
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        AI sẽ tìm đúng mã <strong>DN_CS_01</strong>, phản hồi số lượng còn tồn, vị trí Kệ A1-02 và cảnh báo nếu sắp hết hàng.
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Không cần mở bảng tính Excel để tra cứu!
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/40 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        CÂU HỎI CẢNH BÁO MUA SẮM
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-semibold mb-2">
                        "Lọc những vật tư sắp hết cần mua khẩn cấp?"
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        AI tự động rà soát toàn bộ &gt;600 mã vật tư, tổng hợp danh sách các món tồn = 0 hoặc dưới Min Stock để lập đề xuất mua sắm.
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Tránh gián đoạn công tác sửa chữa Nhà ga T2.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/40 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4" />
                        CÂU HỎI TIẾN ĐỘ TỜ TRÌNH
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-semibold mb-2">
                        "Tờ trình 17-DNCT/PKT đã nhập được bao nhiêu?"
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        AI tính toán tiến độ hoàn thành (ví dụ: 85%), nêu rõ các món đã nhập đủ và các món nhà thầu còn đang nợ kho.
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Trả lời tức thì khi Lãnh đạo yêu cầu báo cáo.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 11: KỶ LUẬT CA TRỰC & CHECKLIST HẰNG NGÀY */}
            {currentSlide === 10 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {slidesData[currentSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300 mb-4">
                    {slidesData[currentSlide].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
                  {/* Daily Routine */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      CHECKLIST 5 THỜI ĐIỂM TRONG CA TRỰC
                    </div>
                    <div className="space-y-2 text-xs text-slate-200">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-300">1. Đầu ca (07:30):</strong> Đăng nhập hệ thống, kiểm tra cảnh báo tồn kho và duyệt các phiếu tồn đêm qua.
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-300">2. Khi nhận hàng:</strong> Chụp ảnh / Dán Tờ trình vào phiếu Nhập 01-VT ngay lập tức, không để dồn đến cuối ngày.
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-300">3. Khi sửa chữa:</strong> Lập phiếu Xuất 02-VT ghi đúng vị trí và tên Kỹ thuật viên nhận vật tư.
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-300">4. Cuối ca (16:30):</strong> Đối chiếu số lượng vật tư thực tế tại kho với Thẻ kho trên phần mềm.
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-300">5. Bàn giao ca:</strong> Bàn giao tình trạng kho và các lưu ý vật tư gấp cho ca trực kế tiếp.
                      </div>
                    </div>
                  </div>

                  {/* Safety & Rules */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      QUY ĐỊNH AN TOÀN DỮ LIỆU & BẢO MẬT
                    </div>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
                        <strong className="text-amber-300 block mb-1">Bảo mật tài khoản cá nhân:</strong>
                        Không dùng chung tài khoản, không tiết lộ mật khẩu. Mọi thao tác lập phiếu, duyệt phiếu đều được hệ thống ghi vết nhật ký kiểm toán (Audit Log).
                      </div>
                      <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40">
                        <strong className="text-blue-300 block mb-1">Xử lý khi lập sai phiếu:</strong>
                        Nhân viên không tự ý xóa phiếu. Liên hệ Trưởng phòng / Quản trị viên sử dụng chức năng <em>"Sửa & Xóa Chứng Từ Sai"</em> để hoàn lại số tồn minh bạch.
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                        <strong className="text-emerald-300 block mb-1">Đăng xuất an toàn:</strong>
                        Luôn bấm nút Đăng xuất khi rời khỏi bàn trực hoặc dùng chung máy tính phòng kỹ thuật.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 12: TỔNG KẾT & CHUYỂN GIAO */}
            {currentSlide === 11 && (
              <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
                <div className="text-center my-auto">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-900/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                    CHÚC TOÀN THỂ ĐỘI ĐNCT VẬN HÀNH XUẤT SẮC!
                  </h2>
                  <p className="text-sm sm:text-base text-cyan-300 font-semibold mb-6">
                    SỐ HÓA - CHÍNH XÁC - MINH BẠCH - AN TOÀN TUYỆT ĐỐI
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left mb-6">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-cyan-400 mb-1">🌐 Địa Chỉ Truy Cập Online</div>
                      <div className="text-xs font-mono text-white break-all">
                        https://smart-inventory-dnct.vercel.app
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Sử dụng trên mọi thiết bị 24/7</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-amber-400 mb-1">📞 Hỗ Trợ Kỹ Thuật & Cấp Quyền</div>
                      <div className="text-xs text-white">
                        vn.phuoc235@gmail.com
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Quản lý Đội ĐNCT / PKT AHT</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs font-bold text-emerald-400 mb-1">📄 Tải Slide & Tài Liệu</div>
                      <div className="text-xs text-white">
                        Nút "Tải Slide PowerPoint (.pptx)"
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Mở trên Microsoft PowerPoint</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    CẢNG HÀNG KHÔNG QUỐC TẾ ĐÀ NẴNG (AHT) • ĐỘI ĐIỆN NƯỚC CÔNG TRÌNH (ĐNCT / PKT)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Slide Navigation Bottom Bar */}
          <div className="px-6 py-3 bg-[#070D1E] border-t border-slate-800 flex items-center justify-between shrink-0 no-print">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1))}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trang trước</span>
            </button>

            {/* Thumbnail dots / numbers */}
            <div className="flex items-center gap-1.5 max-w-md overflow-x-auto no-scrollbar px-2">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center ${
                    currentSlide === idx
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-110'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Chuyển tới Slide ${idx + 1}: ${slidesData[idx].title}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0))}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition"
            >
              <span>Trang sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating keyboard hint */}
      <div className="text-center text-[11px] text-slate-500 pb-1 no-print">
        Mẹo: Sử dụng phím mũi tên <strong>Trái / Phải</strong> hoặc <strong>Phím Cách (Space)</strong> trên bàn phím để chuyển slide • Nhấn <strong>Esc</strong> để thoát
      </div>
    </div>
  );
};
