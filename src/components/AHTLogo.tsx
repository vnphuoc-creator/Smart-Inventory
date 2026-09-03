import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2, X, RefreshCw, Check } from 'lucide-react';
import { safeStorage } from '../utils/safeStorage';
import { subscribeToSystemSettings, saveSystemSettingsToCloud } from '../services/firebaseSync';

interface AHTLogoProps {
  className?: string;
  showPlane?: boolean;
  allowUpload?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AHTLogo: React.FC<AHTLogoProps> = ({
  className = 'h-8',
  showPlane = true,
  allowUpload = false,
  size = 'md',
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return safeStorage.getItem('smart_custom_logo');
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync custom logo across tabs and cloud
  useEffect(() => {
    const handleStorage = () => {
      setCustomLogo(safeStorage.getItem('smart_custom_logo'));
    };
    window.addEventListener('storage', handleStorage);

    // Listen to real-time cloud settings
    const unsubscribeCloud = subscribeToSystemSettings((settings) => {
      if (settings.customLogo !== undefined) {
        setCustomLogo(settings.customLogo || null);
        if (settings.customLogo) {
          safeStorage.setItem('smart_custom_logo', settings.customLogo);
        } else {
          safeStorage.removeItem('smart_custom_logo');
        }
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorage);
      unsubscribeCloud();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        safeStorage.setItem('smart_custom_logo', base64);
        setCustomLogo(base64);
        saveSystemSettingsToCloud({ customLogo: base64 });
        window.dispatchEvent(new Event('storage'));
        setIsModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    safeStorage.setItem('smart_custom_logo', url);
    setCustomLogo(url);
    saveSystemSettingsToCloud({ customLogo: url });
    window.dispatchEvent(new Event('storage'));
    setUrlInput('');
    setIsModalOpen(false);
  };

  const handleResetToDefault = () => {
    safeStorage.removeItem('smart_custom_logo');
    setCustomLogo(null);
    saveSystemSettingsToCloud({ customLogo: null });
    window.dispatchEvent(new Event('storage'));
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={`relative group flex items-center select-none shrink-0 aht-logo-wrapper ${className}`} style={{ maxWidth: '140px', maxHeight: '42px' }}>
        {/* Render Custom Uploaded Logo or Default AHT Brand Logo */}
        {customLogo ? (
          <div className="flex items-center justify-center max-w-[130px] max-h-[38px] overflow-hidden shrink-0">
            <img
              src={customLogo}
              alt="Logo đơn vị"
              className="max-h-8 max-w-[120px] object-contain shrink-0"
              style={{ maxHeight: '36px', maxWidth: '120px' }}
              onError={() => setPreviewError(true)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center shrink-0" style={{ width: '110px', height: '36px' }}>
            <svg
              viewBox="0 0 130 46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-auto drop-shadow-xs shrink-0"
              style={{ width: '105px', height: '34px', maxWidth: '110px', maxHeight: '36px' }}
            >
              {/* Letter 'A' (Stylized Lambda shape) */}
              <path
                d="M5 38 L17 8 L24 8 L36 38 L28.5 38 L20.5 17.5 L12.5 38 Z"
                fill="#1E2260"
              />

              {/* Letter 'H' */}
              <path
                d="M42 8 L49.5 8 L49.5 20.5 L60.5 20.5 L60.5 8 L68 8 L68 38 L60.5 38 L60.5 26.5 L49.5 26.5 L49.5 38 L42 38 Z"
                fill="#1E2260"
              />

              {/* Letter 'T' */}
              <path
                d="M74 8 L98 8 L98 14.5 L89.5 14.5 L89.5 38 L82.5 38 L82.5 14.5 L74 14.5 Z"
                fill="#1E2260"
              />

              {/* Top Teal/Cyan Wing Swoosh */}
              <path
                d="M98 13.5 C104 11.5, 114 10.5, 122 5.5 C116 8.5, 108 10.5, 101 12 Z"
                fill="#00A3A6"
              />
              <path
                d="M102 12 C108 10, 117 9, 124 5 C118 8, 109 10.5, 103 13.5 Z"
                fill="#00B4B7"
              />

              {/* Bottom Purple/Violet Wing Swoosh */}
              <path
                d="M99 17 C106 17, 115 15, 122 10.5 C115 13.5, 107 14.5, 100 15 Z"
                fill="#5D2A88"
              />
              <path
                d="M101 19 C107 18, 116 16, 121 12 C114 15, 106 16.5, 101 18.5 Z"
                fill="#7B3294"
              />
            </svg>
          </div>
        )}

        {/* Change Logo Hover Button */}
        {allowUpload && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg p-1 text-[10px] flex items-center gap-1 shadow"
            title="Nhấp để tự tải logo của bạn lên"
          >
            <Camera className="w-3 h-3 text-blue-400" />
            <span className="hidden group-hover:inline text-[10px] pr-0.5">Đổi logo</span>
          </button>
        )}
      </div>

      {/* Modal: Upload Custom Logo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Tự Thêm / Đổi Logo Nhận Diện</h3>
                  <p className="text-xs text-slate-400">Tải file ảnh từ máy tính hoặc dán liên kết ảnh</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Preview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-[11px] text-slate-400 font-medium">Xem trước logo hiện tại:</span>
              <div className="h-16 flex items-center justify-center bg-slate-900/80 rounded-lg p-2 border border-slate-800">
                {customLogo ? (
                  <img src={customLogo} alt="Custom Logo" className="max-h-12 max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 italic">Đang dùng logo AHT chuẩn</span>
                )}
              </div>
            </div>

            {/* Option 1: File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Cách 1: Tải file ảnh từ thiết bị (PNG, JPG, SVG):
              </label>
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn File Ảnh Từ Máy Tính</span>
              </button>
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Cách 2: Nhập đường link ảnh (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveUrl}
                  disabled={!urlInput.trim()}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-xs font-semibold"
                >
                  Lưu
                </button>
              </div>
            </div>

            {/* Reset Action */}
            {customLogo && (
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Khôi phục logo mặc định AHT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AHTLogo;
