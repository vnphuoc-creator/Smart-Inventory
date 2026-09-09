import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  X,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Package,
  Eye,
  Camera,
  ShieldAlert,
} from 'lucide-react';
import { NaturalSearchFilters, Material, InventoryTransaction } from '../types';
import { parseNaturalLanguageQuery } from '../utils/inventoryEngine';
import { MATERIAL_CATEGORIES } from '../data/seedData';
import { extractBrand, extractDifferentiators } from '../utils/materialDifferentiator';

interface SmartSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: NaturalSearchFilters, explanation: string, targetTab?: string) => void;
  onOpenVisualCard?: (material: Material) => void;
  materials: Material[];
  transactions: InventoryTransaction[];
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onOpenVisualCard,
  materials,
  transactions,
}) => {
  const [query, setQuery] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live matching materials when user types
  const liveMatches = query.trim().length >= 2
    ? materials.filter((m) => {
        const q = query.toLowerCase().trim();
        return (
          m.code.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          (m.brand && m.brand.toLowerCase().includes(q)) ||
          (m.specification && m.specification.toLowerCase().includes(q))
        );
      }).slice(0, 4)
    : [];

  const quickPrompts = [
    { label: '⚠️ Vật tư sắp hết (dưới định mức an toàn)', q: 'vật tư dưới mức an toàn cần nhập bổ sung' },
    { label: '🔌 Dây & Cáp điện hạ thế (Cadivi, CXV)', q: 'tìm vật tư nhóm cáp điện lực và tín hiệu' },
    { label: '⚡ Thiết bị đóng cắt mã DN_CC_*', q: 'mã vật tư bắt đầu bằng DN_CC' },
    { label: '⏳ Phiếu đề nghị đang chờ phê duyệt', q: 'phiếu đang chờ duyệt', tab: 'transactions' },
    { label: '🤖 Tự động hóa & Đo lường (PLC, Biến tần)', q: 'tìm thiết bị plc biến tần đo lường' },
    { label: '📦 Vật tư hết hàng (Tồn = 0)', q: 'vật tư hết hàng tồn bằng 0' },
  ];

  const handleSearchSubmit = async (searchQuery: string, targetTab?: string) => {
    const rawQ = searchQuery || query;
    if (!rawQ.trim()) return;

    // Fast local NLP first
    const { filters, explanation } = parseNaturalLanguageQuery(rawQ, MATERIAL_CATEGORIES);

    // Check direct matching materials in current materials catalog
    const qLower = rawQ.toLowerCase().trim();
    const codeMatch = rawQ.match(/dn[_\-][a-z0-9_]+/i);
    const targetCode = codeMatch ? codeMatch[0].toUpperCase().replace('-', '_') : '';
    
    const matchedMaterials = materials.filter((m) => {
      const c = m.code.toUpperCase();
      const n = m.name.toLowerCase();
      return (targetCode && (c === targetCode || c.includes(targetCode))) || (qLower.length > 3 && n.includes(qLower));
    });

    let directExplanation = explanation;
    if (matchedMaterials.length > 0) {
      const first = matchedMaterials[0];
      directExplanation = `🔍 Tìm thấy mã **${first.code}**: **${first.name}** (Tồn định mức: ${first.initialStock} ${first.unit} | Vị trí: ${first.location || 'Kho'})`;
    }

    // Call server Gemini API for smart query interpretation
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: rawQ,
          matchedMaterials: matchedMaterials.slice(0, 5).map((m) => ({
            code: m.code,
            name: m.name,
            current: m.initialStock,
            min: m.minStock,
            max: m.maxStock,
            unit: m.unit,
            unitPrice: m.unitPrice,
            location: m.location,
          })),
          materialsSummary: JSON.stringify(
            [...matchedMaterials, ...materials.slice(0, 50)].map((m) => ({
              code: m.code,
              name: m.name,
              current: m.initialStock,
              min: m.minStock,
              unit: m.unit,
            }))
          ),
          transactionsSummary: `Tổng số giao dịch: ${transactions.length}. Chờ duyệt: ${
            transactions.filter((t) => t.status === 'PENDING').length
          }`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponseText(data.textResponse || null);
        if (data.suggestedFilters) {
          const mergedFilters: NaturalSearchFilters = {
            ...filters,
            ...(data.suggestedFilters.searchKeyword && {
              searchKeyword: data.suggestedFilters.searchKeyword,
            }),
            ...(data.suggestedFilters.stockStatus &&
              data.suggestedFilters.stockStatus !== 'ALL' && {
                stockStatus: data.suggestedFilters.stockStatus,
              }),
            ...(data.suggestedFilters.category && { category: data.suggestedFilters.category }),
          };

          const destinationTab =
            targetTab ||
            (rawQ.includes('phiếu') || rawQ.includes('chờ duyệt') ? 'transactions' : 'materials');

          onApplyFilters(mergedFilters, data.textResponse || directExplanation, destinationTab);
        } else {
          onApplyFilters(filters, directExplanation, targetTab || 'materials');
        }
      } else {
        onApplyFilters(filters, directExplanation, targetTab || 'materials');
      }
    } catch {
      onApplyFilters(filters, directExplanation, targetTab || 'materials');
    } finally {
      setLoadingAi(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-850">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="relative flex-1">
            <input
              id="input-ai-nl-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(query)}
              placeholder="Nhập câu hỏi tự nhiên (ví dụ: 'tìm cáp cadivi còn dưới 200m', 'mã DN_CC...', 'phiếu chờ duyệt')..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none pr-8 font-medium"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            id="btn-submit-ai-search"
            onClick={() => handleSearchSubmit(query)}
            disabled={loadingAi || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
          >
            {loadingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Tìm Kiếm</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Insight banner if available */}
        {aiResponseText && (
          <div className="p-3 bg-blue-950/40 border-b border-blue-800/40 text-blue-200 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="flex-1">{aiResponseText}</p>
          </div>
        )}

        {/* Live Matching Material Cards with Photo & Brand */}
        {liveMatches.length > 0 && (
          <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 space-y-2 animate-in fade-in">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Vật Tư Khớp Trực Tiếp ({liveMatches.length})
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Bấm vào xem Thẻ Nhận Diện Ảnh Thật
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {liveMatches.map((m) => {
                const brand = extractBrand(m);
                const diffs = extractDifferentiators(m);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (onOpenVisualCard) {
                        onClose();
                        onOpenVisualCard(m);
                      } else {
                        handleSearchSubmit(m.code);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center gap-2.5 group"
                  >
                    <div className="w-11 h-11 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {m.image ? (
                        <img
                          src={m.image}
                          alt={m.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-cyan-300 bg-blue-950 px-1.5 py-0.2 rounded border border-blue-700/60">
                          {m.code}
                        </span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-bold border ${brand.color}`}>
                          {brand.name}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate mt-0.5 group-hover:text-cyan-300 transition-colors">
                        {m.name}
                      </p>
                      {diffs.length > 0 ? (
                        <p className="text-[10px] text-amber-300 truncate flex items-center gap-1">
                          <ShieldAlert className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                          {diffs[0]}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 truncate">
                          {m.specification || m.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick prompt suggestions */}
        <div className="p-4 bg-slate-900/90 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Gợi ý câu hỏi tự nhiên phổ biến</span>
            <span className="text-[11px] text-blue-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Hỗ trợ AI Gemini 3.7
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                id={`btn-quick-prompt-${idx}`}
                onClick={() => {
                  setQuery(item.q);
                  handleSearchSubmit(item.q, item.tab);
                }}
                className="text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 transition-all text-xs text-slate-200 hover:text-white flex items-center justify-between group"
              >
                <span className="truncate mr-2">{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>

          {/* Quick tips about DN_ material rules */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Quy tắc mã: <strong className="text-slate-300">Chỉ lấy mã bắt đầu bằng DN_</strong> (ví dụ: DN_CC_00ACB_01)
              </span>
            </div>
            <span className="text-slate-500">Ấn ESC hoặc click ra ngoài để đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
};
