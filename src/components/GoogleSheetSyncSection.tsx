import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  ShieldCheck,
  ImageIcon,
  QrCode,
  Barcode,
  Save,
  Clock,
  ChevronRight,
  Database,
  ArrowRight,
  Check,
  Filter,
} from 'lucide-react';
import { Material, User } from '../types';
import {
  fetchGoogleSheetCsv,
  parseCsvText,
  parseGoogleSheetToMaterials,
  parseGoogleSheetUrl,
  GoogleSheetSyncResult,
} from '../utils/googleSheetParser';
import {
  seedMaterials,
  saveSystemSettingsToCloud,
  subscribeToSystemSettings,
  logActivityToCloud,
} from '../services/firebaseSync';
import { safeStorage } from '../utils/safeStorage';

interface GoogleSheetSyncSectionProps {
  currentUser: User;
  currentMaterials: Material[];
  onApplyMaterialsUpdate: (updatedMaterials: Material[]) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const GoogleSheetSyncSection: React.FC<GoogleSheetSyncSectionProps> = ({
  currentUser,
  currentMaterials,
  onApplyMaterialsUpdate,
  onShowToast,
}) => {
  const isMasterAdmin =
    currentUser.email.toLowerCase().trim() === 'vn.phuoc235@gmail.com' ||
    currentUser.email.toLowerCase().trim() === 'vn.phuoc235';

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return safeStorage.getItem('cfg_google_sheet_url') || '';
  });
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return safeStorage.getItem('cfg_google_sheet_autosync') === 'true';
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return safeStorage.getItem('cfg_google_sheet_last_synced') || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<GoogleSheetSyncResult | null>(null);

  // Filter in preview table
  const [filterType, setFilterType] = useState<'ALL' | 'NEW' | 'UPDATED' | 'WITH_IMAGE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [saveConfigSuccess, setSaveConfigSuccess] = useState(false);

  // Subscribe to Cloud System Settings for persistent Google Sheet configuration across devices
  useEffect(() => {
    const unsub = subscribeToSystemSettings((cfg: any) => {
      if (cfg.googleSheetUrl !== undefined && cfg.googleSheetUrl !== null) {
        setSheetUrl(cfg.googleSheetUrl);
        safeStorage.setItem('cfg_google_sheet_url', cfg.googleSheetUrl);
      }
      if (cfg.googleSheetAutoSync !== undefined) {
        setAutoSync(Boolean(cfg.googleSheetAutoSync));
        safeStorage.setItem('cfg_google_sheet_autosync', String(cfg.googleSheetAutoSync));
      }
      if (cfg.googleSheetLastSyncedAt) {
        setLastSyncedAt(cfg.googleSheetLastSyncedAt);
        safeStorage.setItem('cfg_google_sheet_last_synced', cfg.googleSheetLastSyncedAt);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveConfig = async () => {
    const trimmed = sheetUrl.trim();
    safeStorage.setItem('cfg_google_sheet_url', trimmed);
    safeStorage.setItem('cfg_google_sheet_autosync', String(autoSync));

    try {
      await saveSystemSettingsToCloud({
        googleSheetUrl: trimmed,
        googleSheetAutoSync: autoSync,
        updatedBy: currentUser.fullName,
      });
      setSaveConfigSuccess(true);
      setTimeout(() => setSaveConfigSuccess(false), 3000);
      if (onShowToast) {
        onShowToast('Đã lưu cấu hình Google Sheet lên Cloud thành công!', 'success');
      }
    } catch {
      if (onShowToast) {
        onShowToast('Đã lưu cục bộ trên thiết bị này.', 'info');
      }
    }
  };

  const handleFetchAndPreview = async () => {
    const targetUrl = sheetUrl.trim();
    if (!targetUrl) {
      setErrorMsg('Vui lòng nhập đường link Google Sheet trước khi quét.');
      return;
    }

    const { sheetId, gid } = parseGoogleSheetUrl(targetUrl);
    if (!sheetId) {
      setErrorMsg('Đường dẫn không hợp lệ. Hãy sao chép link từ thanh địa chỉ trình duyệt khi đang mở Google Sheet.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSyncResult(null);

    try {
      // 1. Fetch raw CSV
      const csvText = await fetchGoogleSheetCsv(targetUrl);
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Tập dữ liệu nhận về từ Google Sheet bị rỗng.');
      }

      // 2. Parse CSV
      const rows = parseCsvText(csvText);
      if (rows.length < 2) {
        throw new Error('Google Sheet không có dữ liệu hàng hoặc chỉ có 1 dòng tiêu đề.');
      }

      // 3. Map to materials and calculate diff
      const { parsedMaterials, diffs } = parseGoogleSheetToMaterials(rows, currentMaterials);

      if (parsedMaterials.length === 0) {
        throw new Error('Không nhận diện được cột "Tên sản phẩm" hoặc "Mã vật tư". Vui lòng kiểm tra lại dòng tiêu đề trong Sheet.');
      }

      const newItems = diffs.filter((d) => d.status === 'NEW').length;
      const updatedItems = diffs.filter((d) => d.status === 'UPDATED').length;
      const unchanged = diffs.filter((d) => d.status === 'UNCHANGED').length;
      const withImage = parsedMaterials.filter((m) => Boolean(m.image)).length;
      const withBarcode = parsedMaterials.filter((m) => Boolean((m as any).barcode || (m as any).qrCode)).length;

      const result: GoogleSheetSyncResult = {
        sheetId,
        gid,
        sourceUrl: targetUrl,
        totalRowsParsed: parsedMaterials.length,
        newItemsCount: newItems,
        updatedItemsCount: updatedItems,
        unchangedCount: unchanged,
        itemsWithImageCount: withImage,
        itemsWithBarcodeCount: withBarcode,
        parsedMaterials,
        diffs,
      };

      setSyncResult(result);

      // Also save config
      safeStorage.setItem('cfg_google_sheet_url', targetUrl);
      saveSystemSettingsToCloud({
        googleSheetUrl: targetUrl,
        googleSheetTotalItems: parsedMaterials.length,
      }).catch(() => {});

      if (onShowToast) {
        onShowToast(`Đọc thành công ${parsedMaterials.length} vật tư (${newItems} mới, ${updatedItems} cập nhật)`, 'success');
      }
    } catch (err: any) {
      console.error('Error fetching Google Sheet:', err);
      setErrorMsg(err.message || 'Lỗi khi đọc Google Sheet. Vui lòng kiểm tra lại quyền truy cập hoặc đường link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToCloud = async () => {
    if (!syncResult || syncResult.parsedMaterials.length === 0) return;

    setIsSyncingCloud(true);
    try {
      // 1. Merge parsed materials with current materials
      const existingMap = new Map<string, Material>();
      currentMaterials.forEach((m) => {
        if (m.code) existingMap.set(m.code.trim().toUpperCase(), m);
      });

      const mergedMaterials: Material[] = [...currentMaterials];

      syncResult.parsedMaterials.forEach((incoming) => {
        const key = incoming.code.trim().toUpperCase();
        const existingIdx = mergedMaterials.findIndex((m) => m.code.trim().toUpperCase() === key);
        if (existingIdx !== -1) {
          // Update in-place while keeping initialStock & ID
          mergedMaterials[existingIdx] = {
            ...mergedMaterials[existingIdx],
            ...incoming,
            id: mergedMaterials[existingIdx].id,
            initialStock:
              incoming.initialStock > 0 ? incoming.initialStock : mergedMaterials[existingIdx].initialStock,
            image: incoming.image || mergedMaterials[existingIdx].image,
            unit: incoming.unit || mergedMaterials[existingIdx].unit,
            name: incoming.name || mergedMaterials[existingIdx].name,
            qrCode: incoming.qrCode || (mergedMaterials[existingIdx] as any).qrCode || `${incoming.name} | ${incoming.code}`,
            barcode: incoming.barcode || (mergedMaterials[existingIdx] as any).barcode || incoming.code.replace(/[^A-Z0-9]/gi, ''),
            specification: incoming.specification || mergedMaterials[existingIdx].specification || incoming.name,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Add new
          mergedMaterials.push(incoming);
        }
      });

      // 2. Commit in batches to Cloud Firestore
      await seedMaterials(mergedMaterials);

      // 3. Update local state
      onApplyMaterialsUpdate(mergedMaterials);

      // 4. Update sync timestamp in Cloud System Settings
      const nowIso = new Date().toISOString();
      setLastSyncedAt(nowIso);
      safeStorage.setItem('cfg_google_sheet_last_synced', nowIso);
      await saveSystemSettingsToCloud({
        googleSheetLastSyncedAt: nowIso,
        googleSheetTotalItems: mergedMaterials.length,
        updatedBy: currentUser.fullName,
      });

      // 5. Write to Activity Logs
      logActivityToCloud({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: 'SHEET_SYNC',
        actionTitle: 'Đồng bộ Google Sheet 2 chiều',
        details: `Đồng bộ 2 chiều từ Google Sheet: Tổng ${mergedMaterials.length} vật tư (${syncResult.newItemsCount} mới, ${syncResult.updatedItemsCount} cập nhật)`,
        timestamp: nowIso,
      }).catch(() => {});

      if (onShowToast) {
        onShowToast(
          `Đã đồng bộ thành công ${syncResult.parsedMaterials.length} vật tư lên Cloud Firestore! Toàn bộ thiết bị đã nhận dữ liệu mới.`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Error applying to Cloud Firestore:', err);
      if (onShowToast) {
        onShowToast(`Lỗi khi lưu lên Cloud: ${err?.message || 'Vui lòng thử lại'}`, 'error');
      }
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Filtered preview items
  const filteredDiffs = useMemo(() => {
    if (!syncResult) return [];
    return syncResult.diffs.filter((item) => {
      // Type filter
      if (filterType === 'NEW' && item.status !== 'NEW') return false;
      if (filterType === 'UPDATED' && item.status !== 'UPDATED') return false;
      if (filterType === 'WITH_IMAGE' && !item.material.image) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const code = item.material.code.toLowerCase();
        const name = item.material.name.toLowerCase();
        const unit = item.material.unit.toLowerCase();
        const barcode = ((item.material as any).barcode || '').toLowerCase();
        return code.includes(term) || name.includes(term) || unit.includes(term) || barcode.includes(term);
      }
      return true;
    });
  }, [syncResult, filterType, searchTerm]);

  // Master Permission guard
  if (!isMasterAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Chức Năng Dành Riêng Cho Master Admin</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Tính năng Đồng Bộ Trực Tiếp 2 Chiều Google Sheet chỉ được cấp quyền cho tài khoản Quản trị viên Tối cao (
          <span className="text-amber-400 font-mono font-medium">vn.phuoc235@gmail.com</span>). Vui lòng đăng nhập đúng tài khoản để thao tác.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">Đồng Bộ Trực Tiếp Google Sheet</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Master Only
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  2 Chiều Real-time
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Tự động kết nối và kéo toàn bộ danh mục vật tư, hình ảnh, mã QR và Barcode từ bảng Google Sheet của bạn vào Cloud Firestore. Không cần xuất nhập Excel thủ công!
              </p>
            </div>
          </div>

          {lastSyncedAt && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Đồng bộ lần cuối:{' '}
                <strong className="text-slate-200 font-mono">
                  {new Date(lastSyncedAt).toLocaleString('vi-VN')}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* URL Input & Setup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Đường Link Bảng Google Sheet Của Bạn</h3>
          </div>
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              Mở trên Google Sheet <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dán đường link Google Sheet (URL) vào đây:
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="url"
                  id="input-google-sheet-url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-save-sheet-url"
                  onClick={handleSaveConfig}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  title="Lưu link vào hệ thống Cloud"
                >
                  {saveConfigSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{saveConfigSuccess ? 'Đã lưu' : 'Lưu link'}</span>
                </button>

                <button
                  type="button"
                  id="btn-fetch-google-sheet"
                  onClick={handleFetchAndPreview}
                  disabled={isLoading || !sheetUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/40 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Đang đọc Sheet...' : 'Quét & Xem Trước'}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Đảm bảo bảng Google Sheet được cài đặt chế độ chia sẻ: <strong>"Bất kỳ ai có đường liên kết đều có thể xem" (Viewer)</strong>.
            </p>
          </div>

          {/* Instructions Accordion / Quick Tips */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                i
              </span>
              <span>Cấu trúc các cột hệ thống tự động nhận diện từ Google Sheet của bạn:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-slate-400 font-medium">MÃ VẬT TƯ</div>
                <div className="text-white font-mono font-semibold">DN_*, CD_*, DT_*</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-slate-400 font-medium">TÊN SẢN PHẨM</div>
                <div className="text-white font-semibold">Tên chi tiết món</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-slate-400 font-medium">ĐƠN VỊ</div>
                <div className="text-white font-semibold">Bộ, Cái, Cuộn, Mét...</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-slate-400 font-medium">MÃ QR & BARCODE</div>
                <div className="text-white font-mono font-semibold">Chuỗi mã vạch 1D/2D</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-slate-400 font-medium">HÌNH ẢNH / LINK ẢNH</div>
                <div className="text-white font-semibold">Google Drive, URL ảnh</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-slate-400 font-medium">VỊ TRÍ / TỒN KHO</div>
                <div className="text-white font-semibold">Kệ, Tầng, Số tồn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">Không thể đọc Google Sheet:</strong>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sync Preview & Diff Section (Displayed when data is scanned) */}
      {syncResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 font-semibold mb-1">Tổng Vật Tư Nhận Diện</div>
              <div className="text-xl font-bold text-white font-mono flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                {syncResult.totalRowsParsed}
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5">
              <div className="text-[11px] text-emerald-400 font-semibold mb-1">Mã Mới (Thêm Vào Kho)</div>
              <div className="text-xl font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                +{syncResult.newItemsCount}
              </div>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5">
              <div className="text-[11px] text-amber-400 font-semibold mb-1">Mã Cập Nhật (Thông Tin/Ảnh)</div>
              <div className="text-xl font-bold text-amber-300 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                {syncResult.updatedItemsCount}
              </div>
            </div>

            <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3.5">
              <div className="text-[11px] text-blue-400 font-semibold mb-1">Có Link Ảnh Trực Quan</div>
              <div className="text-xl font-bold text-blue-300 font-mono flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                {syncResult.itemsWithImageCount}
              </div>
            </div>

            <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3.5 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-purple-400 font-semibold mb-1">Có Mã Vạch / Barcode / QR</div>
              <div className="text-xl font-bold text-purple-300 font-mono flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-purple-400" />
                {syncResult.itemsWithBarcodeCount}
              </div>
            </div>
          </div>

          {/* Action Bar (Cloud Sync Button) */}
          <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/50 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Sẵn Sàng Đẩy Dữ Liệu Lên Cloud Firestore</h4>
                <p className="text-xs text-slate-300">
                  Đồng bộ tức thì {syncResult.totalRowsParsed} danh mục. Toàn bộ nhân viên sẽ thấy danh mục mới ngay lập tức.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-apply-google-sheet-cloud"
              onClick={handleApplyToCloud}
              disabled={isSyncingCloud}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>
                {isSyncingCloud
                  ? 'Đang đồng bộ lên Cloud...'
                  : `Đồng Bộ Lên Cloud Firestore (${syncResult.totalRowsParsed} Vật Tư)`}
              </span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterType === 'ALL'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({syncResult.totalRowsParsed})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('NEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterType === 'NEW'
                    ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mã mới (+{syncResult.newItemsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UPDATED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterType === 'UPDATED'
                    ? 'bg-amber-950 border border-amber-500 text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cập nhật ({syncResult.updatedItemsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('WITH_IMAGE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterType === 'WITH_IMAGE'
                    ? 'bg-blue-950 border border-blue-500 text-blue-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Có ảnh ({syncResult.itemsWithImageCount})
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã, tên, barcode..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">STT</th>
                    <th className="py-2.5 px-3 w-16 text-center">Hình Ảnh</th>
                    <th className="py-2.5 px-3 w-40">Mã Vật Tư</th>
                    <th className="py-2.5 px-3">Tên Sản Phẩm / Vật Tư</th>
                    <th className="py-2.5 px-3 w-20">ĐVT</th>
                    <th className="py-2.5 px-3 w-36">Mã Barcode / QR</th>
                    <th className="py-2.5 px-3 w-32 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredDiffs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        Không có vật tư nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredDiffs.map((diffItem, idx) => {
                      const m = diffItem.material;
                      return (
                        <tr key={m.code + '_' + idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {m.image ? (
                              <img
                                src={m.image}
                                alt={m.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 object-cover rounded-lg border border-slate-700 mx-auto shadow-xs bg-slate-950"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-mono font-bold text-cyan-300 text-xs block">
                              {m.code}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                              {m.category}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-white font-medium line-clamp-2">{m.name}</span>
                            {diffItem.changes && diffItem.changes.length > 0 && (
                              <div className="text-[10px] text-amber-400/90 mt-0.5 space-y-0.5">
                                {diffItem.changes.map((c, cIdx) => (
                                  <div key={cIdx} className="flex items-center gap-1">
                                    <ChevronRight className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                    <span>{c}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-medium">{m.unit}</td>
                          <td className="py-2 px-3">
                            <div className="space-y-1">
                              {(m as any).barcode && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                                  <Barcode className="w-3 h-3 text-cyan-400" />
                                  {(m as any).barcode}
                                </span>
                              )}
                              {(m as any).qrCode && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-purple-300">
                                  <QrCode className="w-3 h-3 text-purple-400" />
                                  QR
                                </span>
                              )}
                              {!(m as any).barcode && !(m as any).qrCode && (
                                <span className="text-slate-600 text-[10px] italic">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {diffItem.status === 'NEW' ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Mới (+1)
                              </span>
                            ) : diffItem.status === 'UPDATED' ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Cập nhật
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Đã khớp
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Hiển thị <strong>{filteredDiffs.length}</strong> / {syncResult.totalRowsParsed} vật tư
              </span>
              <span className="text-[11px] text-slate-500">
                Nhấn nút "Đồng Bộ Lên Cloud Firestore" ở trên để áp dụng vào toàn bộ hệ thống
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
