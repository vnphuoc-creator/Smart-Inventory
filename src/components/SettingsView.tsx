import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Image,
  Building2,
  Sliders,
  Bell,
  Database,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Plus,
  Save,
  CheckCircle2,
  Sparkles,
  FileText,
  Layers,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import { STANDARD_UNITS } from '../data/seedData';
import { User, Material, InventoryTransaction } from '../types';

interface SettingsViewProps {
  currentUser: User;
  materials: Material[];
  transactions: InventoryTransaction[];
  onAddStandardUnit?: (unit: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  materials,
  transactions,
  onAddStandardUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'LOGO' | 'COMPANY' | 'UNITS' | 'THEME' | 'DATA'>('LOGO');

  // Custom Logo State (localStorage synced)
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem('smart_custom_logo');
  });
  const [urlInput, setUrlInput] = useState('');
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company Information State
  const [companyName, setCompanyName] = useState(() => {
    return localStorage.getItem('cfg_company_name') || 'CÔNG TY CỔ PHẦN ĐẦU TƯ KHAI THÁC NHÀ GA QUỐC TẾ ĐÀ NẴNG (AHT)';
  });
  const [departmentName, setDepartmentName] = useState(() => {
    return localStorage.getItem('cfg_department_name') || 'Đội Điện nước công trình (DOIDNCT)';
  });
  const [address, setAddress] = useState(() => {
    return localStorage.getItem('cfg_address') || 'Cảng hàng không quốc tế Đà Nẵng, Phường Hòa Cường, Thành phố Đà Nẵng';
  });
  const [circularStandard, setCircularStandard] = useState(() => {
    return localStorage.getItem('cfg_circular') || 'Thông tư 99/2025/TT-BTC';
  });
  const [companySaveSuccess, setCompanySaveSuccess] = useState(false);

  // Units Management State
  const [unitsList, setUnitsList] = useState<string[]>(() => {
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
  const [newUnitInput, setNewUnitInput] = useState('');

  // UI Theme Preset
  const [colorTheme, setColorTheme] = useState(() => {
    return localStorage.getItem('cfg_ui_theme') || 'aht-navy';
  });
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('cfg_compact_mode') === 'true';
  });

  // Notification Settings
  const [enableSound, setEnableSound] = useState(true);
  const [enablePendingAlert, setEnablePendingAlert] = useState(true);

  // Handle Logo Upload via File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        localStorage.setItem('smart_custom_logo', base64);
        setCustomLogo(base64);
        window.dispatchEvent(new Event('storage'));
        setLogoSaveSuccess(true);
        setTimeout(() => setLogoSaveSuccess(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo via URL
  const handleSaveUrl = () => {
    if (!urlInput.trim()) return;
    localStorage.setItem('smart_custom_logo', urlInput.trim());
    setCustomLogo(urlInput.trim());
    setUrlInput('');
    window.dispatchEvent(new Event('storage'));
    setLogoSaveSuccess(true);
    setTimeout(() => setLogoSaveSuccess(false), 3000);
  };

  // Reset to default AHT Logo
  const handleResetToDefaultLogo = () => {
    localStorage.removeItem('smart_custom_logo');
    setCustomLogo(null);
    window.dispatchEvent(new Event('storage'));
    setLogoSaveSuccess(true);
    setTimeout(() => setLogoSaveSuccess(false), 3000);
  };

  // Save Company Information
  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cfg_company_name', companyName.trim());
    localStorage.setItem('cfg_department_name', departmentName.trim());
    localStorage.setItem('cfg_address', address.trim());
    localStorage.setItem('cfg_circular', circularStandard.trim());
    setCompanySaveSuccess(true);
    setTimeout(() => setCompanySaveSuccess(false), 3000);
  };

  // Add new Unit
  const handleAddNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUnit = newUnitInput.trim();
    if (!cleanUnit) return;
    if (unitsList.includes(cleanUnit)) {
      alert('Đơn vị tính này đã có trong danh mục.');
      return;
    }
    const updated = [...unitsList, cleanUnit];
    setUnitsList(updated);
    localStorage.setItem('cfg_custom_units', JSON.stringify(updated));
    if (onAddStandardUnit) {
      onAddStandardUnit(cleanUnit);
    }
    setNewUnitInput('');
  };

  // Remove Unit
  const handleRemoveUnit = (unitToRemove: string) => {
    if (unitsList.length <= 1) {
      alert('Hệ thống phải có ít nhất 1 đơn vị tính.');
      return;
    }
    const updated = unitsList.filter((u) => u !== unitToRemove);
    setUnitsList(updated);
    localStorage.setItem('cfg_custom_units', JSON.stringify(updated));
  };

  // Backup Data to JSON File
  const handleExportDataJSON = () => {
    const backupData = {
      backupDate: new Date().toISOString(),
      materialsCount: materials.length,
      transactionsCount: transactions.length,
      materials,
      transactions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-kho-aht-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Cài Đặt & Cấu Hình Hệ Thống
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý logo nhận diện, mẫu biểu báo cáo Thông tư 99/2025/TT-BTC, danh mục đơn vị tính và giao diện
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('LOGO')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'LOGO'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Logo & Nhận Diện</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPANY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'COMPANY'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Thông Tin Doanh Nghiệp & Mẫu Biểu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNITS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'UNITS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh Mục Đơn Vị Tính ({unitsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('THEME')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'THEME'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Giao Diện & Thông Báo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DATA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'DATA'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sao Lưu & Dữ Liệu</span>
        </button>
      </div>

      {/* TAB 1: LOGO MANAGEMENT */}
      {activeTab === 'LOGO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Left / Main Configuration */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-400" />
                Tải Lên Hoặc Thay Đổi Logo Đơn Vị
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Logo sẽ hiển thị đồng bộ trên thanh điều hướng, góc trên các mẫu in chứng từ xuất - nhập kho và báo cáo tổng hợp.
              </p>
            </div>

            {logoSaveSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Đã cập nhật logo thành công! Logo mới đang được áp dụng toàn hệ thống.</span>
              </div>
            )}

            {/* Option 1: Upload from Computer */}
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                Cách 1: Tải file ảnh từ máy tính (PNG, JPG, SVG, WebP)
              </label>
              <p className="text-[11px] text-slate-400">
                Khuyến nghị: Sử dụng file ảnh nền trong suốt (PNG/SVG), tỷ lệ ngang, dung lượng dưới 3MB.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn File Ảnh Từ Máy Tính</span>
              </button>
            </div>

            {/* Option 2: Image URL */}
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                Cách 2: Nhập đường link ảnh trực tuyến (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo-cong-ty.png"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveUrl}
                  disabled={!urlInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Lưu URL
                </button>
              </div>
            </div>

            {/* Reset to Default */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {customLogo ? (
                  <span className="text-blue-400 font-medium">● Đang sử dụng logo tùy chỉnh</span>
                ) : (
                  <span className="text-emerald-400 font-medium">● Đang sử dụng logo chuẩn AHT (Mặc định)</span>
                )}
              </div>

              {customLogo && (
                <button
                  type="button"
                  onClick={handleResetToDefaultLogo}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-rose-950/30 border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Khôi phục logo mặc định AHT</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Live Preview Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Xem Trước Logo Hiện Tại
            </span>

            <div className="w-full h-32 bg-white rounded-2xl p-4 flex items-center justify-center border border-slate-300 shadow-inner">
              {customLogo ? (
                <img
                  src={customLogo}
                  alt="Custom Logo Preview"
                  className="max-h-24 max-w-full object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="bg-white rounded-lg px-2.5 py-1 flex items-center justify-center">
                    <svg viewBox="0 0 130 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
                      <path d="M5 38 L17 8 L24 8 L36 38 L28.5 38 L20.5 17.5 L12.5 38 Z" fill="#1E2260" />
                      <path d="M42 8 L49.5 8 L49.5 20.5 L60.5 20.5 L60.5 8 L68 8 L68 38 L60.5 38 L60.5 26.5 L49.5 26.5 L49.5 38 L42 38 Z" fill="#1E2260" />
                      <path d="M74 8 L98 8 L98 14.5 L89.5 14.5 L89.5 38 L82.5 38 L82.5 14.5 L74 14.5 Z" fill="#1E2260" />
                      <path d="M98 13.5 C104 11.5, 114 10.5, 122 5.5 C116 8.5, 108 10.5, 101 12 Z" fill="#00A3A6" />
                      <path d="M102 12 C108 10, 117 9, 124 5 C118 8, 109 10.5, 103 13.5 Z" fill="#00B4B7" />
                      <path d="M99 17 C106 17, 115 15, 122 10.5 C115 13.5, 107 14.5, 100 15 Z" fill="#5D2A88" />
                      <path d="M101 19 C107 18, 116 16, 121 12 C114 15, 106 16.5, 101 18.5 Z" fill="#7B3294" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Logo này sẽ tự động xuất hiện ở góc trên bên trái của báo cáo in/PDF và thanh Sidebar.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY & FORM SETTINGS */}
      {activeTab === 'COMPANY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-3xl animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Thông Tin Doanh Nghiệp & Mẫu Biểu Phiếu
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Các thông tin này được tự động điền vào tiêu đề phiếu xuất/nhập kho và báo cáo tổng hợp Nhập - Xuất - Tồn.
            </p>
          </div>

          {companySaveSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã lưu thông tin cấu hình doanh nghiệp thành công!</span>
            </div>
          )}

          <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tên Công Ty / Đơn Vị Chủ Quản:
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Đơn Vị Quản Lý / Bộ Phận Trực Thuộc:
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Địa Chỉ Hoạt Động / Kho Bãi:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Thông Tư Áp Dụng Cho Mẫu Biểu Chứng Từ:
              </label>
              <input
                type="text"
                value={circularStandard}
                onChange={(e) => setCircularStandard(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Chuẩn mới theo yêu cầu: <span className="text-amber-400 font-bold">Thông tư 99/2025/TT-BTC</span>
              </p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi Thông Tin</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: UNITS MANAGEMENT */}
      {activeTab === 'UNITS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-4xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Quản Lý Danh Mục Đơn Vị Tính (ĐVT)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Danh sách các đơn vị tính sẽ hiển thị trong hộp thả xuống (dropdown) khi thêm vật tư mới hoặc lập phiếu kho.
              </p>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddNewUnit} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="Thêm ĐVT mới (vd: Mét, Kg...)"
                className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
              />
              <button
                type="submit"
                disabled={!newUnitInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </form>
          </div>

          {/* Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
            {unitsList.map((unit, idx) => (
              <div
                key={idx}
                className="bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs flex items-center justify-between group transition-colors"
              >
                <span className="font-semibold text-slate-200">{unit}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveUnit(unit)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-0.5 rounded transition-opacity"
                  title={`Xóa đơn vị ${unit}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: THEME & NOTIFICATIONS */}
      {activeTab === 'THEME' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-3xl animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-400" />
              Tùy Chỉnh Giao Diện & Trải Nghiệm Người Dùng
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Điều chỉnh tông màu hiển thị và chế độ thông báo duyệt phiếu tự động.
            </p>
          </div>

          <div className="space-y-4">
            {/* Color Palette */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Tông Màu Chủ Đạo:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => {
                    setColorTheme('aht-navy');
                    localStorage.setItem('cfg_ui_theme', 'aht-navy');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    colorTheme === 'aht-navy'
                      ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-600/20'
                      : 'bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border border-white/20"></div>
                    <span className="text-xs font-bold text-white">Xanh Navy AHT (Chuẩn)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Giao diện màu tối chuyên nghiệp, tương phản cao.</p>
                </div>

                <div
                  onClick={() => {
                    setColorTheme('tech-emerald');
                    localStorage.setItem('cfg_ui_theme', 'tech-emerald');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    colorTheme === 'tech-emerald'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-600 border border-white/20"></div>
                    <span className="text-xs font-bold text-white">Xanh Kỹ Thuật (Emerald)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Tone xanh lá cây kỹ thuật mát mẻ, êm mắt.</p>
                </div>

                <div
                  onClick={() => {
                    setColorTheme('titanium-slate');
                    localStorage.setItem('cfg_ui_theme', 'titanium-slate');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    colorTheme === 'titanium-slate'
                      ? 'bg-slate-800 border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-slate-500 border border-white/20"></div>
                    <span className="text-xs font-bold text-white">Xám Titan Tối Giản</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Phong cách tối giản hiện đại cho doanh nghiệp.</p>
                </div>
              </div>
            </div>

            {/* Notification toggles */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Cài Đặt Thông Báo & Cảnh Báo Phê Duyệt:
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-850 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePendingAlert}
                  onChange={(e) => setEnablePendingAlert(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Hiển thị thanh banner cảnh báo khi có phiếu chờ Quản lý duyệt
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Xuất hiện trên thanh đầu trang giúp Admin bấm duyệt ngay chỉ với 1 click.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-850 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(e) => {
                    setCompactMode(e.target.checked);
                    localStorage.setItem('cfg_compact_mode', e.target.checked ? 'true' : 'false');
                  }}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Chế độ bảng biểu cô đọng (Compact Data Mode)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Tối ưu không gian hiển thị cho màn hình máy tính bàn, hiển thị được nhiều dòng vật tư hơn.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATA BACKUP & STATS */}
      {activeTab === 'DATA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-3xl animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Sao Lưu Dữ Liệu & Thông Số Hệ Thống
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Xuất dữ liệu an toàn để lưu trữ định kỳ hoặc kiểm tra số lượng bản ghi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Tổng mã danh mục chuẩn DN:</span>
              <div className="text-xl font-mono font-bold text-white">{materials.length} vật tư</div>
            </div>
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Tổng phiếu chứng từ xuất nhập:</span>
              <div className="text-xl font-mono font-bold text-blue-400">{transactions.length} chứng từ</div>
            </div>
          </div>

          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">Xuất Bản Sao Lưu Dữ Liệu (JSON)</h4>
            <p className="text-[11px] text-slate-400">
              Tải toàn bộ cơ sở dữ liệu hiện tại của hệ thống (bao gồm 95 mã vật tư chuẩn DN và toàn bộ lịch sử phiếu xuất nhập) về máy tính để lưu trữ an toàn.
            </p>
            <button
              type="button"
              onClick={handleExportDataJSON}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
            >
              <Database className="w-4 h-4" />
              <span>Tải Bản Sao Lưu JSON Về Máy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
