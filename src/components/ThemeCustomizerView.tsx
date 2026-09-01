import React, { useState, useEffect } from 'react';
import {
  Palette,
  Layout,
  Sliders,
  Sparkles,
  Eye,
  RotateCcw,
  Check,
  CheckCircle2,
  Moon,
  Sun,
  Laptop,
  Maximize2,
  Minimize2,
  Zap,
  Image as ImageIcon,
  Layers,
  Upload,
  Download,
  FileJson,
  CheckSquare,
  Type,
  Grid,
  Shield,
  Box,
  ArrowRight,
  TrendingUp,
  Package,
} from 'lucide-react';
import {
  UIThemeConfig,
  DEFAULT_THEME_CONFIG,
  ThemeColorPreset,
  CanvasMode,
  TableDensity,
  FontSizeScale,
  BorderRadiusOption,
} from '../types';

interface ThemeCustomizerViewProps {
  currentConfig: UIThemeConfig;
  onApplyConfig: (config: UIThemeConfig) => void;
  onResetDefault: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

interface PresetOption {
  id: ThemeColorPreset;
  name: string;
  description: string;
  canvasMode: CanvasMode;
  primaryColor: string;
  accentColor: string;
  previewBg: string;
  previewBorder: string;
  previewText: string;
  badge: string;
}

const PRESET_LIST: PresetOption[] = [
  {
    id: 'aht-default',
    name: 'AHT Slate Navy (Mặc Định)',
    description: 'Xanh dương công vụ & Slate trầm lịch lãm của Nhà ga Quốc tế Đà Nẵng',
    canvasMode: 'dark-slate',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    previewBg: 'bg-slate-900',
    previewBorder: 'border-blue-500/40',
    previewText: 'text-blue-400',
    badge: 'Chuẩn Doanh Nghiệp',
  },
  {
    id: 'emerald-airport',
    name: 'Emerald Eco Airport',
    description: 'Xanh ngọc lục bảo tươi sáng, biểu trưng cảng hàng không sinh thái',
    canvasMode: 'dark-slate',
    primaryColor: '#059669',
    accentColor: '#10b981',
    previewBg: 'bg-slate-900',
    previewBorder: 'border-emerald-500/40',
    previewText: 'text-emerald-400',
    badge: 'Eco Green',
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo Tech',
    description: 'Xanh tím hoàng gia kết hợp nền Midnight Navy công nghệ cao',
    canvasMode: 'dark-navy',
    primaryColor: '#4f46e5',
    accentColor: '#6366f1',
    previewBg: 'bg-indigo-950/70',
    previewBorder: 'border-indigo-500/40',
    previewText: 'text-indigo-400',
    badge: 'High-Tech',
  },
  {
    id: 'cyber-amber',
    name: 'Cyber Amber & Gold',
    description: 'Vàng hổ phách ánh kim sang trọng, tạo cảm giác tài chính & quản trị kho cao cấp',
    canvasMode: 'dark-slate',
    primaryColor: '#d97706',
    accentColor: '#f59e0b',
    previewBg: 'bg-slate-900',
    previewBorder: 'border-amber-500/40',
    previewText: 'text-amber-400',
    badge: 'Gold Elite',
  },
  {
    id: 'crimson-tech',
    name: 'Crimson Ruby Tech',
    description: 'Đỏ Ruby sắc nét, tập trung thị giác và nổi bật các chỉ số quan trọng',
    canvasMode: 'dark-slate',
    primaryColor: '#dc2626',
    accentColor: '#ef4444',
    previewBg: 'bg-slate-900',
    previewBorder: 'border-rose-500/40',
    previewText: 'text-rose-400',
    badge: 'Ruby Accent',
  },
  {
    id: 'monochrome-titan',
    name: 'Monochrome Titanium',
    description: 'Xám titan tối giản, phong cách kỹ thuật cơ điện chính xác',
    canvasMode: 'dark-slate',
    primaryColor: '#475569',
    accentColor: '#64748b',
    previewBg: 'bg-slate-900',
    previewBorder: 'border-slate-500/40',
    previewText: 'text-slate-300',
    badge: 'Minimalist',
  },
  {
    id: 'midnight-oled',
    name: 'Midnight Obsidian (OLED)',
    description: 'Đen tuyệt đối 100% tiết kiệm pin màn hình OLED, tương phản siêu cao',
    canvasMode: 'dark-oled',
    primaryColor: '#3b82f6',
    accentColor: '#60a5fa',
    previewBg: 'bg-black',
    previewBorder: 'border-slate-800',
    previewText: 'text-blue-400',
    badge: '100% Black OLED',
  },
  {
    id: 'light-corporate',
    name: 'Light Modern Corporate',
    description: 'Giao diện nền sáng trang nhã, dịu mắt và chuẩn văn bản báo cáo',
    canvasMode: 'light-modern',
    primaryColor: '#1d4ed8',
    accentColor: '#2563eb',
    previewBg: 'bg-slate-100',
    previewBorder: 'border-blue-500/50',
    previewText: 'text-blue-700',
    badge: 'Light Theme',
  },
];

const COLOR_SWATCHES = [
  { name: 'Xanh AHT', hex: '#2563eb', accent: '#3b82f6' },
  { name: 'Xanh Ngọc', hex: '#059669', accent: '#10b981' },
  { name: 'Xanh Hoàng Gia', hex: '#4f46e5', accent: '#6366f1' },
  { name: 'Vàng Kim', hex: '#d97706', accent: '#f59e0b' },
  { name: 'Đỏ Ruby', hex: '#dc2626', accent: '#ef4444' },
  { name: 'Tím Neon', hex: '#7c3aed', accent: '#8b5cf6' },
  { name: 'Xanh Biển Cyan', hex: '#0891b2', accent: '#06b6d4' },
  { name: 'Cam Năng Lượng', hex: '#ea580c', accent: '#f97316' },
  { name: 'Xám Titan', hex: '#475569', accent: '#64748b' },
];

export const ThemeCustomizerView: React.FC<ThemeCustomizerViewProps> = ({
  currentConfig,
  onApplyConfig,
  onResetDefault,
  onShowToast,
}) => {
  const [config, setConfig] = useState<UIThemeConfig>(currentConfig);
  const [isSaved, setIsSaved] = useState(false);

  // Sync internal state if prop updates
  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const updateConfig = (partial: Partial<UIThemeConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    onApplyConfig(next);
    setIsSaved(false);
  };

  const handleSelectPreset = (preset: PresetOption) => {
    updateConfig({
      preset: preset.id,
      canvasMode: preset.canvasMode,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
    });
    onShowToast(`Đã áp dụng bộ giao diện: ${preset.name}`, 'info');
  };

  const handleSavePermanently = () => {
    localStorage.setItem('smart_ui_theme_config_v2', JSON.stringify(config));
    setIsSaved(true);
    onShowToast('Đã lưu cấu hình thiết kế giao diện thành công!', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetToDefault = () => {
    onResetDefault();
    setConfig(DEFAULT_THEME_CONFIG);
    onShowToast('Đã khôi phục giao diện chuẩn ban đầu của AHT!', 'info');
  };

  const handleExportThemeJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aht_theme_preset_${config.preset}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Đã xuất file cấu hình giao diện JSON!', 'success');
  };

  const handleImportThemeJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && typeof imported === 'object') {
          const merged: UIThemeConfig = { ...DEFAULT_THEME_CONFIG, ...imported };
          updateConfig(merged);
          localStorage.setItem('smart_ui_theme_config_v2', JSON.stringify(merged));
          onShowToast('Đã nạp thành công cấu hình giao diện từ file JSON!', 'success');
        }
      } catch {
        onShowToast('File JSON không hợp lệ hoặc bị lỗi cú pháp!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-xl border flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: config.primaryColor, borderColor: config.accentColor }}
          >
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Tùy Biến Thiết Kế Giao Diện &amp; Trải Nghiệm (UI Customizer)
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                <Sparkles className="w-3.5 h-3.5" />
                Live Customizer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự do cá nhân hóa màu sắc thương hiệu, độ sáng canvas, mật độ bảng dữ liệu, cỡ chữ và hiệu ứng trực quan theo sở thích của bạn.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            title="Khôi phục về cài đặt gốc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi Phục Gốc
          </button>

          <button
            onClick={handleExportThemeJSON}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            title="Tải cấu hình JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Xuất JSON
          </button>

          <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Nạp JSON</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImportThemeJSON} />
          </label>

          <button
            onClick={handleSavePermanently}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Đã Lưu!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Cấu Hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Left Column Controls, Right Column Live Interactive Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ===================== LEFT CONTROLS COLUMN (7 COLS) ===================== */}
        <div className="xl:col-span-7 space-y-6">
          {/* SECTION 1: THEME COLOR PRESETS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Palette className="w-4 h-4 text-blue-400" />
                <span>1. Bộ Giao Diện Sẵn Có (Theme Presets)</span>
              </div>
              <span className="text-xs text-slate-400">Chọn 1 chạm áp dụng ngay</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_LIST.map((p) => {
                const isSelected = config.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/20 shadow-md shadow-blue-950'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border shadow-inner shrink-0"
                          style={{ backgroundColor: p.primaryColor, borderColor: p.accentColor }}
                        />
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                      </div>
                      {isSelected && (
                        <span className="p-0.5 bg-blue-500 text-white rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">{p.badge}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.primaryColor }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.accentColor }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: CANVAS MODE & BRIGHTNESS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>2. Độ Sáng Canvas &amp; Chế Độ Nền (Background Tone)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => updateConfig({ canvasMode: 'dark-slate' })}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  config.canvasMode === 'dark-slate'
                    ? 'border-blue-500 bg-blue-950/30 text-white font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 shadow">
                  <Moon className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xs">Dark Slate</div>
                <div className="text-[10px] text-slate-400">Tối Tiêu Chuẩn</div>
              </button>

              <button
                onClick={() => updateConfig({ canvasMode: 'dark-oled' })}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  config.canvasMode === 'dark-oled'
                    ? 'border-blue-500 bg-blue-950/30 text-white font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-black border border-slate-800 flex items-center justify-center text-slate-300 shadow">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xs">True Black OLED</div>
                <div className="text-[10px] text-slate-400">Đen Tuyệt Đối</div>
              </button>

              <button
                onClick={() => updateConfig({ canvasMode: 'dark-navy' })}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  config.canvasMode === 'dark-navy'
                    ? 'border-blue-500 bg-blue-950/30 text-white font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#0c162c] border border-blue-900/60 flex items-center justify-center text-slate-300 shadow">
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xs">Midnight Navy</div>
                <div className="text-[10px] text-slate-400">Xanh Biển Đêm</div>
              </button>

              <button
                onClick={() => updateConfig({ canvasMode: 'light-modern' })}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  config.canvasMode === 'light-modern'
                    ? 'border-blue-500 bg-blue-950/30 text-white font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 shadow">
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xs">Light Corporate</div>
                <div className="text-[10px] text-slate-400">Sáng Văn Phòng</div>
              </button>
            </div>
          </div>

          {/* SECTION 3: ACCENT COLOR & BRAND COLOR PICKER */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>3. Màu Sắc Điểm Nhấn (Brand Primary &amp; Accent)</span>
              </div>
              <span className="text-xs text-slate-400">Chọn bảng màu hoặc nhập HEX</span>
            </div>

            {/* Quick Swatches */}
            <div className="flex flex-wrap gap-2.5">
              {COLOR_SWATCHES.map((sw) => {
                const isCurrent = config.primaryColor.toLowerCase() === sw.hex.toLowerCase();
                return (
                  <button
                    key={sw.hex}
                    onClick={() => updateConfig({ primaryColor: sw.hex, accentColor: sw.accent })}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                      isCurrent
                        ? 'border-white text-white ring-2 ring-white/20 bg-slate-800'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                      style={{ backgroundColor: sw.hex }}
                    />
                    <span>{sw.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Màu Chủ Đạo (Primary Color)</span>
                  <span className="font-mono text-slate-400">{config.primaryColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Màu Nhấn Sáng (Accent Color)</span>
                  <span className="font-mono text-slate-400">{config.accentColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={config.accentColor}
                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: TABLE DENSITY & FONT SCALE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Grid className="w-4 h-4 text-purple-400" />
              <span>4. Bố Cục &amp; Mật Độ Dữ Liệu Bảng (Density &amp; Scale)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Density */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Mật Độ Dòng Bảng (Table Padding Density)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'standard', 'comfortable'] as TableDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => updateConfig({ tableDensity: d })}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition text-center ${
                        config.tableDensity === d
                          ? 'border-blue-500 bg-blue-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d === 'compact' && 'Thu Gọn'}
                      {d === 'standard' && 'Tiêu Chuẩn'}
                      {d === 'comfortable' && 'Thoải Mái'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Chế độ <strong>Thu gọn</strong> giúp hiển thị tối đa nhiều dòng vật tư trên màn hình cùng lúc.
                </p>
              </div>

              {/* Font Size Scale */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Cỡ Chữ Toàn Bộ Hệ Thống (Font Scale)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'standard', 'large'] as FontSizeScale[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateConfig({ fontSizeScale: s })}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition text-center ${
                        config.fontSizeScale === s
                          ? 'border-blue-500 bg-blue-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s === 'small' && 'Nhỏ (13px)'}
                      {s === 'standard' && 'Chuẩn (14px)'}
                      {s === 'large' && 'Lớn (15.5px)'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Cỡ chữ <strong>Lớn</strong> tối ưu khi sử dụng trên màn hình điện thoại hoặc máy tính bảng.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5: BORDER RADIUS & VISUAL EFFECTS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Box className="w-4 h-4 text-cyan-400" />
              <span>5. Độ Bo Góc &amp; Hiệu Ứng Thị Giác (Radius &amp; Effects)</span>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Độ Bo Góc Khung &amp; Nút Bấm (Border Radius)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'sharp', label: 'Vuông Vắn (0px)' },
                  { id: 'standard', label: 'Tiêu Chuẩn (8-12px)' },
                  { id: 'rounded', label: 'Bo Tròn (16px)' },
                  { id: 'full', label: 'Siêu Mềm (Pill)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => updateConfig({ borderRadius: r.id as BorderRadiusOption })}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition text-center ${
                      config.borderRadius === r.id
                        ? 'border-blue-500 bg-blue-950/40 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Kính Mờ (Glass)</div>
                  <div className="text-[10px] text-slate-400">Backdrop Blur</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableGlassmorphism}
                  onChange={(e) => updateConfig({ enableGlassmorphism: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Phát Sáng Viền</div>
                  <div className="text-[10px] text-slate-400">Card Subtle Glow</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableCardGlow}
                  onChange={(e) => updateConfig({ enableCardGlow: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Chuyển Động</div>
                  <div className="text-[10px] text-slate-400">Animations</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableAnimations}
                  onChange={(e) => updateConfig({ enableAnimations: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT COLUMN: LIVE INTERACTIVE PREVIEW WIDGET (5 COLS) ===================== */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Khung Xem Trước Trực Tiếp (Live Preview)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 animate-pulse">
                Real-time Feedback
              </span>
            </div>

            {/* Interactive Preview Canvas */}
            <div
              className={`p-4 rounded-xl border transition-all space-y-4 ${
                config.canvasMode === 'light-modern'
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : config.canvasMode === 'dark-oled'
                  ? 'bg-black border-slate-800 text-white'
                  : config.canvasMode === 'dark-navy'
                  ? 'bg-[#0a1122] border-blue-900/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              {/* Sample Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    DN
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-none">Kho Cơ Điện &amp; Cấp Thoát Nước</div>
                    <div className="text-[10px] opacity-70 mt-0.5">Mã chuẩn DN_* | Cảng HKQT Đà Nẵng</div>
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${config.primaryColor}20`,
                    borderColor: `${config.primaryColor}50`,
                    color: config.accentColor,
                  }}
                >
                  Online
                </span>
              </div>

              {/* Sample Stat Card */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  config.enableCardGlow
                    ? 'shadow-lg'
                    : ''
                }`}
                style={{
                  borderColor: `${config.primaryColor}40`,
                  backgroundColor:
                    config.canvasMode === 'light-modern'
                      ? '#ffffff'
                      : config.canvasMode === 'dark-oled'
                      ? '#0d0d0d'
                      : '#0f172a',
                }}
              >
                <div className="flex items-center justify-between text-xs opacity-75">
                  <span>Tổng Giá Trị Tồn Kho</span>
                  <Package className="w-3.5 h-3.5" style={{ color: config.accentColor }} />
                </div>
                <div
                  className="text-lg font-black font-mono mt-1"
                  style={{ color: config.canvasMode === 'light-modern' ? config.primaryColor : '#ffffff' }}
                >
                  8,452,300,000 đ
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>Định mức an toàn đạt 96.8%</span>
                </div>
              </div>

              {/* Sample Action Buttons */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold opacity-75">Nút Thao Tác &amp; Tương Tác</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-1.5 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5"
                    style={{
                      backgroundColor: config.primaryColor,
                      borderRadius:
                        config.borderRadius === 'sharp'
                          ? '0px'
                          : config.borderRadius === 'full'
                          ? '9999px'
                          : '10px',
                    }}
                  >
                    <span>Lập Phiếu Nhập</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    className="px-3 py-1.5 text-xs font-semibold border transition"
                    style={{
                      borderColor: `${config.primaryColor}60`,
                      color: config.accentColor,
                      backgroundColor: `${config.primaryColor}15`,
                      borderRadius:
                        config.borderRadius === 'sharp'
                          ? '0px'
                          : config.borderRadius === 'full'
                          ? '9999px'
                          : '10px',
                    }}
                  >
                    Xuất File Excel
                  </button>

                  <button
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 transition"
                    style={{
                      borderRadius:
                        config.borderRadius === 'sharp'
                          ? '0px'
                          : config.borderRadius === 'full'
                          ? '9999px'
                          : '10px',
                    }}
                  >
                    Từ Chối
                  </button>
                </div>
              </div>

              {/* Sample Table Row */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold opacity-75">Hiển Thị Bảng Vật Tư Mẫu</div>
                <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/60 font-bold border-b border-slate-700/50">
                        <th className="p-2 text-[10px]">Mã VT</th>
                        <th className="p-2 text-[10px]">Tên Vật Tư</th>
                        <th className="p-2 text-[10px] text-right">Tồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        className={`border-b border-slate-800/40 ${
                          config.tableDensity === 'compact'
                            ? 'py-1'
                            : config.tableDensity === 'comfortable'
                            ? 'py-3'
                            : 'py-2'
                        }`}
                      >
                        <td className="p-2 font-mono font-bold text-[11px]" style={{ color: config.accentColor }}>
                          DN_CC_00ACB_01
                        </td>
                        <td className="p-2 text-[11px]">Aptomat ACB Masterpact NW40</td>
                        <td className="p-2 font-mono font-bold text-right text-[11px] text-emerald-400">
                          12 Cái
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Theme Summary Pill */}
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">Chế độ đang kích hoạt:</span>
                <span className="font-bold text-white">
                  {PRESET_LIST.find((p) => p.id === config.preset)?.name || 'Tùy biến tự do'}
                </span>
              </div>
            </div>

            {/* Quick Helper Tips */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Ghi chú lưu trữ:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mọi tùy biến giao diện được tự động lưu vào bộ nhớ trình duyệt của bạn và áp dụng ngay lập tức mà không cần tải lại trang.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
