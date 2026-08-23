import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  Boxes,
  FileCheck,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  CalculatedMaterialStock,
  InventoryTransaction,
  PurchaseProposal,
  User,
  Material,
} from '../types';
import { formatVND, formatNumber } from '../utils/inventoryEngine';
import { INITIAL_MATERIALS } from '../data/seedData';

interface AiAssistantViewProps {
  currentUser: User;
  materials: Material[];
  calculatedStocks: CalculatedMaterialStock[];
  transactions: InventoryTransaction[];
  proposals?: PurchaseProposal[];
  onOpenCreateTransaction: (type: 'IMPORT' | 'EXPORT', preselectedCode?: string) => void;
  onOpenStockCard: (code: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  relatedMaterials?: CalculatedMaterialStock[];
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  currentUser,
  materials,
  calculatedStocks,
  transactions,
  proposals = [],
  onOpenCreateTransaction,
  onOpenStockCard,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'AI',
      text: `Xin chào **${currentUser.fullName}**! Tôi là Trợ Lý AI Quản Lý Vật Tư Kho (Đội Điện Nước AHT).
Bạn có thể hỏi tôi bất kỳ thông tin nào về:
- **Tồn kho tức thời** của hơn 600 mã vật tư chuẩn \`DN_*\` (ví dụ: \`DN_VT_DHDDN_02\`, \`DN_VT_MCBSC_01\`, \`DN_VT_D25MM_01\`,...)
- **Cảnh báo thiếu hụt**, vật tư sắp hết hoặc vượt định mức an toàn
- **Đối chiếu tiến độ nhập hàng** theo các **Tờ trình mua sắm** (Tờ trình 17, 26, 31, 45,...)
- **Gợi ý lập phiếu xuất/nhập kho** với thao tác 1 chạm trực tiếp.`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Run full automatic AI analysis
  const runStockAnalysis = async () => {
    setAnalyzing(true);
    try {
      const payload = {
        summary: {
          totalMaterials: calculatedStocks.length,
          lowStockCount: calculatedStocks.filter((s) => s.stockStatus === 'LOW_STOCK' || s.stockStatus === 'OUT_OF_STOCK').length,
          overStockCount: calculatedStocks.filter((s) => s.stockStatus === 'OVER_STOCK').length,
          totalValue: calculatedStocks.reduce((sum, s) => sum + s.totalValue, 0),
        },
        lowStockItems: calculatedStocks
          .filter((s) => s.stockStatus === 'LOW_STOCK' || s.stockStatus === 'OUT_OF_STOCK')
          .map((s) => ({
            code: s.code,
            name: s.name,
            current: s.currentStock,
            min: s.minStock,
            unit: s.unit,
            location: s.location,
          })),
        overStockItems: calculatedStocks
          .filter((s) => s.stockStatus === 'OVER_STOCK')
          .map((s) => ({
            code: s.code,
            name: s.name,
            current: s.currentStock,
            max: s.maxStock,
            unit: s.unit,
            unitPrice: s.unitPrice,
            totalValue: s.totalValue,
          })),
        recentTransactions: transactions.slice(0, 8).map((t) => ({
          code: t.code,
          type: t.type,
          title: t.title,
          status: t.status,
          totalQty: t.totalQuantity,
        })),
        proposalsSummary: proposals.map((p) => ({
          number: p.proposalNumber,
          title: p.title,
          status: p.status,
          itemsCount: p.items.length,
        })),
      };

      const res = await fetch('/api/ai/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: payload }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisResult(
          'Đã xảy ra lỗi khi kết nối với mô hình Gemini AI. Vui lòng kiểm tra lại kết nối mạng.'
        );
      }
    } catch {
      setAnalysisResult(
        'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại kết nối mạng.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to find exact and fuzzy materials from calculatedStocks, materials, and INITIAL_MATERIALS
  const findRelevantMaterials = (searchQuery: string): CalculatedMaterialStock[] => {
    const q = searchQuery.toLowerCase().trim();
    
    // Combine all available material sources to guarantee 100% detection
    const allStockItems: CalculatedMaterialStock[] = [...calculatedStocks];
    const existingCodes = new Set(allStockItems.map((s) => s.code));

    // Fill from materials prop if not yet in calculatedStocks
    materials.forEach((m) => {
      if (!existingCodes.has(m.code)) {
        existingCodes.add(m.code);
        allStockItems.push({
          ...m,
          currentStock: m.initialStock,
          availableStock: m.initialStock,
          totalImported: 0,
          totalExported: 0,
          pendingImport: 0,
          pendingExport: 0,
          totalValue: m.initialStock * m.unitPrice,
          stockStatus:
            m.initialStock <= 0
              ? 'OUT_OF_STOCK'
              : m.initialStock <= m.minStock
              ? 'LOW_STOCK'
              : m.initialStock >= m.maxStock
              ? 'OVER_STOCK'
              : 'OPTIMAL',
        });
      }
    });

    // Fill from INITIAL_MATERIALS if still missing
    INITIAL_MATERIALS.forEach((m) => {
      if (!existingCodes.has(m.code)) {
        existingCodes.add(m.code);
        allStockItems.push({
          ...m,
          currentStock: m.initialStock,
          availableStock: m.initialStock,
          totalImported: 0,
          totalExported: 0,
          pendingImport: 0,
          pendingExport: 0,
          totalValue: m.initialStock * m.unitPrice,
          stockStatus:
            m.initialStock <= 0
              ? 'OUT_OF_STOCK'
              : m.initialStock <= m.minStock
              ? 'LOW_STOCK'
              : m.initialStock >= m.maxStock
              ? 'OVER_STOCK'
              : 'OPTIMAL',
        });
      }
    });

    // Extract potential code patterns (e.g., DN_VT_DHDDN_02, DHDDN, MCBSC_01)
    const codeMatch = q.match(/dn[_\-][a-z0-9_]+/i);
    const targetCode = codeMatch ? codeMatch[0].toUpperCase().replace(/-/g, '_') : '';

    if (targetCode) {
      const exact = allStockItems.filter((s) => s.code === targetCode);
      if (exact.length > 0) return exact;
      const partial = allStockItems.filter((s) => s.code.includes(targetCode) || targetCode.includes(s.code));
      if (partial.length > 0) return partial.slice(0, 5);
    }

    // Keyword tokens
    const tokens = q.split(/[\s,]+/i).filter((t) => t.length >= 2);
    const scored = allStockItems.map((s) => {
      let score = 0;
      const sCode = s.code.toLowerCase();
      const sName = s.name.toLowerCase();
      const sSpec = (s.specification || '').toLowerCase();
      const sCat = s.category.toLowerCase();

      tokens.forEach((tok) => {
        if (sCode === tok) score += 50;
        else if (sCode.includes(tok)) score += 20;
        if (sName.includes(tok)) score += 8;
        if (sSpec.includes(tok)) score += 3;
        if (sCat.includes(tok)) score += 1;
      });
      return { item: s, score };
    });

    const matches = scored.filter((m) => m.score > 0).sort((a, b) => b.score - a.score);
    return matches.slice(0, 5).map((m) => m.item);
  };

  // Local fallback response generator if backend is unavailable or needs precise formatting
  const generateLocalAnswer = (searchQuery: string, matched: CalculatedMaterialStock[]): string => {
    const qLower = searchQuery.toLowerCase().trim();

    // 1. Check if user is asking about Purchase Proposals (Tờ trình)
    const hasProposalKeyword = qLower.includes('tờ trình') || qLower.includes('tt ') || qLower.includes('dnct') || qLower.includes('mua sắm') || /\b(17|26|31|45|08|21|29|50)\b/.test(qLower);
    
    if (hasProposalKeyword && proposals && proposals.length > 0) {
      // Find matching proposals by number in query
      const matchedProposals = proposals.filter((p) => {
        const pNum = p.proposalNumber.toLowerCase();
        const pTitle = p.title.toLowerCase();
        // Extract numbers from proposalNumber (e.g., "31" from "31-DNCT/PKT")
        const numMatch = p.proposalNumber.match(/\d+/);
        const digits = numMatch ? numMatch[0] : '';
        return (
          qLower.includes(pNum) ||
          (digits && new RegExp(`\\b${digits}\\b`).test(qLower)) ||
          pTitle.split(' ').some((w) => w.length > 3 && qLower.includes(w))
        );
      });

      if (matchedProposals.length > 0) {
        const proposalReports = matchedProposals.map((prop) => {
          // Calculate import progress for this proposal from transactions
          const relatedImportTxs = transactions.filter(
            (t) =>
              t.type === 'IMPORT' &&
              t.status === 'APPROVED' &&
              (t.proposalNumber === prop.proposalNumber ||
                t.notes?.includes(prop.proposalNumber) ||
                t.title.includes(prop.proposalNumber))
          );

          const itemReports = prop.items.map((item) => {
            const importedQty = relatedImportTxs.reduce((sum, tx) => {
              const txItem = tx.items.find((i) => i.materialCode === item.materialCode);
              return sum + (txItem ? txItem.quantity : 0);
            }, 0);

            const remaining = Math.max(0, item.requestedQuantity - importedQty);
            const statusIcon = remaining === 0 ? '✅ Đã nhập đủ' : importedQty > 0 ? `⚠️ Đã nhập ${importedQty}/${item.requestedQuantity}` : '⏳ Chưa nhập';

            return `- **\`${item.materialCode}\`** — **${item.materialName}**\n  - Đề xuất: **${item.requestedQuantity} ${item.unit}** | Đã nhập: **${importedQty} ${item.unit}** | Còn thiếu: **${remaining} ${item.unit}** [${statusIcon}]`;
          });

          const totalRequested = prop.items.reduce((s, i) => s + i.requestedQuantity, 0);
          const totalImported = prop.items.reduce((sum, item) => {
            const imported = relatedImportTxs.reduce((s, tx) => {
              const txItem = tx.items.find((i) => i.materialCode === item.materialCode);
              return sum + (txItem ? txItem.quantity : 0);
            }, 0);
            return sum + Math.min(item.requestedQuantity, imported);
          }, 0);

          const isFullyDone = totalImported >= totalRequested && totalRequested > 0;
          const statusBadge = isFullyDone
            ? '✅ **ĐÃ HOÀN TẤT NHẬP KHO (100%)**'
            : totalImported > 0
            ? `⚠️ **ĐANG NHẬP DANG DỞ (${Math.round((totalImported / (totalRequested || 1)) * 100)}%)**`
            : '⏳ **CHƯA NHẬP KHO (0%)**';

          return `### 📑 Tiến Độ Đối Chiếu: Tờ Trình \`${prop.proposalNumber}\`
- **Nội dung**: **${prop.title}**
- **Ngày lập**: ${prop.date} | Người tạo: **${prop.creatorName}** (${prop.department})
- **Trạng thái phê duyệt**: **${prop.status === 'COMPLETED' ? 'Đã hoàn thành' : prop.status === 'APPROVED' ? 'Lãnh đạo đã phê duyệt' : 'Chờ phê duyệt'}**
- **Tiến độ nhập hàng thực tế**: ${statusBadge}

#### 📦 Chi tiết từng danh mục vật tư trong Tờ trình:
${itemReports.join('\n\n')}

💡 *Gợi ý*: Bấm vào tab **Xuất - Nhập Kho** > chọn **Lập Phiếu Nhập Theo Tờ Trình** để tạo phiếu nhập kho tự động với số lượng còn thiếu.`;
        });

        return proposalReports.join('\n\n---\n\n');
      }
    }

    if (matched.length === 1) {
      const m = matched[0];
      const statusText =
        m.stockStatus === 'OUT_OF_STOCK'
          ? '❌ **HẾT HÀNG (Tồn = 0)**'
          : m.stockStatus === 'LOW_STOCK'
          ? '⚠️ **DƯỚI ĐỊNH MỨC AN TOÀN (Cần bổ sung)**'
          : m.stockStatus === 'OVER_STOCK'
          ? '📈 **TỒN KHO CAO (Vượt định mức tối đa)**'
          : '✅ **ĐẠT ĐỊNH MỨC AN TOÀN**';

      return `### 🔍 Thông Tin Chi Tiết Tồn Kho: \`${m.code}\`
- **Tên thiết bị / vật tư**: **${m.name}**
- **Phân hệ**: ${m.category}
- **Số lượng tồn kho thực tế**: **${formatNumber(m.currentStock)} ${m.unit}**
- **Số lượng khả dụng (trừ phiếu xuất chờ duyệt)**: **${formatNumber(m.availableStock)} ${m.unit}**
- **Định mức an toàn**: Tối thiểu **${formatNumber(m.minStock)} ${m.unit}** — Tối đa **${formatNumber(m.maxStock)} ${m.unit}**
- **Trạng thái tồn kho**: ${statusText}
- **Vị trí lưu kho**: 📍 **${m.location || 'Kho kỹ thuật AHT'}**
- **Đơn giá tham chiếu**: **${formatVND(m.unitPrice)} / ${m.unit}** (Tổng giá trị tồn: **${formatVND(m.totalValue)}**)
- **Quy cách kỹ thuật**: *${m.specification || 'Theo tiêu chuẩn nhà sản xuất và quy chuẩn Đội Điện Nước AHT'}*

---
💡 **Thao tác nhanh**: Bạn có thể bấm các nút bên dưới để **Lập phiếu xuất**, **Lập phiếu nhập** hoặc **Xem thẻ kho chi tiết** cho mã \`${m.code}\`.`;
    }

    if (matched.length > 1) {
      const itemsList = matched
        .map(
          (m, idx) =>
            `${idx + 1}. **\`${m.code}\`** — **${m.name}**\n   - Tồn kho: **${formatNumber(m.currentStock)} ${m.unit}** (Min: ${m.minStock} | Vị trí: ${m.location})\n   - Giá trị: ${formatVND(m.unitPrice)}/${m.unit} • Trạng thái: ${m.stockStatus === 'LOW_STOCK' ? '⚠️ Thiếu' : m.stockStatus === 'OUT_OF_STOCK' ? '❌ Hết' : '✅ Đủ'}`
        )
        .join('\n\n');

      return `### 🔍 Tìm Thấy ${matched.length} Mã Vật Tư Phù Hợp:
${itemsList}

*Bạn có thể bấm vào các nút bên dưới để thao tác nhanh với từng mã vật tư.*`;
    }

    // Check low stock query
    if (qLower.includes('hết') || qLower.includes('thiếu') || qLower.includes('dưới định mức') || qLower.includes('cảnh báo') || qLower.includes('đặt ngay')) {
      const lowItems = calculatedStocks.filter(
        (s) => s.stockStatus === 'LOW_STOCK' || s.stockStatus === 'OUT_OF_STOCK'
      );
      if (lowItems.length > 0) {
        const topLow = lowItems
          .slice(0, 6)
          .map(
            (m, idx) =>
              `${idx + 1}. **\`${m.code}\`** (${m.name}): Tồn **${m.currentStock} ${m.unit}** (Min: ${m.minStock}) ➜ Cần đặt: **+${Math.max(10, m.minStock * 2 - m.currentStock)} ${m.unit}**`
          )
          .join('\n');
        return `### ⚠️ Danh Sách Vật Tư Sắp Hết Hàng (Cần Nhập Ngay)
Hệ thống phát hiện **${lowItems.length} mã vật tư** đang ở mức tồn dưới ngưỡng an toàn:

${topLow}

💡 **Khuyến nghị**: Lập ngay Phiếu Đề Xuất Nhập Kho bổ sung các mã vật tư trọng yếu trên để bảo đảm công tác vận hành 24/7.`;
      }
      return `### ✅ Tồn Kho Ổn Định
Toàn bộ ${calculatedStocks.length} mã vật tư trong kho hiện đang đạt định mức tồn an toàn.`;
    }

    // General answer
    return `### 🤖 Trợ Lý AI Kho Vật Tư AHT
Tôi đã tiếp nhận truy vấn của bạn: **"${searchQuery}"**.
- **Tổng số vật tư trong kho**: **${calculatedStocks.length} mã vật tư** chuẩn tiền tố \`DN_*\`.
- **Tổng giá trị tồn kho**: **${formatVND(calculatedStocks.reduce((sum, s) => sum + s.totalValue, 0))}**.
- Bạn có thể hỏi cụ thể từng mã vật tư (ví dụ: \`DN_VT_DHDDN_02\`, \`DN_VT_MCBSC_01\`, \`DN_VT_DENEX_03\`), hoặc hỏi về các Tờ trình mua sắm (\`17-DNCT/PKT\`, \`26-DNCT/PKT\`, \`31-DNCT/PKT\`).`;
  };

  // Send message in chat
  const handleSendMessage = async (customPrompt?: string) => {
    const q = customPrompt || inputQuestion;
    if (!q.trim() || sendingChat) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setSendingChat(true);

    const relevant = findRelevantMaterials(q);

    try {
      // Prepare rich prioritized context
      const prioritizedMaterials = [
        ...relevant,
        ...calculatedStocks.filter((s) => !relevant.some((r) => r.code === s.code)).slice(0, 100),
      ].map((s) => ({
        code: s.code,
        name: s.name,
        current: s.currentStock,
        available: s.availableStock,
        min: s.minStock,
        max: s.maxStock,
        unit: s.unit,
        unitPrice: s.unitPrice,
        totalValue: s.totalValue,
        status: s.stockStatus,
        location: s.location,
        specification: s.specification,
      }));

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          matchedMaterials: relevant.map((s) => ({
            code: s.code,
            name: s.name,
            current: s.currentStock,
            available: s.availableStock,
            min: s.minStock,
            max: s.maxStock,
            unit: s.unit,
            unitPrice: s.unitPrice,
            location: s.location,
            status: s.stockStatus,
          })),
          materialsSummary: JSON.stringify(prioritizedMaterials),
          transactionsSummary: `Tổng số phiếu: ${transactions.length}. Phiếu chờ duyệt: ${
            transactions.filter((t) => t.status === 'PENDING').length
          }`,
          proposalsSummary: JSON.stringify(
            proposals.map((p) => ({
              number: p.proposalNumber,
              title: p.title,
              status: p.status,
              items: p.items.map((i) => ({
                code: i.materialCode,
                name: i.materialName,
                requested: i.requestedQuantity,
              })),
            }))
          ),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        let replyText = data.textResponse || '';
        
        // If the reply is empty or is an old generic placeholder, replace with rich answer
        if (
          !replyText ||
          replyText.includes('bộ lọc tìm kiếm') ||
          replyText.includes('Kết quả tìm kiếm cho truy vấn') ||
          replyText.includes('Đang sử dụng bộ lọc') ||
          replyText.includes('Hệ thống đang sử dụng')
        ) {
          replyText = generateLocalAnswer(q, relevant);
        } else if (relevant.length > 0) {
          const firstCode = relevant[0].code.toUpperCase();
          if (!replyText.toUpperCase().includes(firstCode)) {
            replyText = generateLocalAnswer(q, relevant);
          }
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'AI',
          text: replyText || generateLocalAnswer(q, relevant),
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          relatedMaterials: relevant.length > 0 ? relevant : undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'AI',
          text: generateLocalAnswer(q, relevant),
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          relatedMaterials: relevant.length > 0 ? relevant : undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: generateLocalAnswer(q, relevant),
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        relatedMaterials: relevant.length > 0 ? relevant : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  const samplePrompts = [
    'Kiểm tra mã vật tư DN_VT_DHDDN_02 còn bao nhiêu?',
    'Tờ trình 17-DNCT/PKT và 26-DNCT/PKT đã nhập đủ số lượng chưa?',
    'Phân tích các mã vật tư sắp hết hàng và gợi ý số lượng cần đặt ngay',
    'Tờ trình 31-DNCT/PKT còn thiếu những thiết bị nào cần nhập bổ sung?',
    'Kiểm tra mã vật tư DN_VT_MCBSC_01 và DN_VT_D25MM_01 còn bao nhiêu',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Trợ Lý AI Tối Ưu Tồn Kho & Tìm Kiếm Tự Nhiên
            </h1>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Gemini 3.7 Flash
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phân tích chuyên sâu dữ liệu Xuất-Nhập-Tồn, phát hiện rủi ro thiếu hụt và tư vấn kế hoạch mua sắm thông minh
          </p>
        </div>

        <button
          id="btn-run-stock-ai-analysis"
          onClick={runStockAnalysis}
          disabled={analyzing}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang phân tích dữ liệu kho...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Chạy Phân Tích Kho Toàn Diện</span>
            </>
          )}
        </button>
      </div>

      {/* AI Deep Analysis Report Box if run */}
      {analysisResult && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-lg space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Báo Cáo Đánh Giá & Khuyến Nghị Tồn Kho Tự Động</h3>
            </div>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng báo cáo
            </button>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed bg-slate-850 p-4 rounded-xl border border-slate-800 font-sans">
            <div className="prose prose-invert max-w-none text-xs space-y-2">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Interactive AI Chat & Quick Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sample prompts & Urgent highlights */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Câu Hỏi Mẫu Nhanh
            </h3>
            <div className="space-y-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{p}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Dữ Liệu Kho Hiện Tại
            </h3>
            <div className="flex items-center justify-between text-slate-400">
              <span>Mã vật tư chuẩn DN_*:</span>
              <strong className="text-white font-mono">{calculatedStocks.length}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Cảnh báo thiếu hụt:</span>
              <strong className="text-amber-400 font-mono">
                {
                  calculatedStocks.filter(
                    (s) => s.stockStatus === 'LOW_STOCK' || s.stockStatus === 'OUT_OF_STOCK'
                  ).length
                }{' '}
                mã
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Tổng giá trị tồn kho:</span>
              <strong className="text-emerald-400 font-mono">
                {formatVND(calculatedStocks.reduce((s, m) => s + m.totalValue, 0))}
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Box */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col h-[520px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Hỏi Đáp & Tra Cứu Kho Thông Minh</h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sẵn sàng phân tích theo thời gian thực
                </p>
              </div>
            </div>
          </div>

          {/* Chat message stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'AI' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                    msg.sender === 'USER'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60 leading-relaxed'
                  }`}
                >
                  {msg.sender === 'AI' ? (
                    <div className="space-y-3">
                      <div className="prose prose-invert max-w-none text-xs space-y-1.5 leading-relaxed">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      {msg.relatedMaterials && msg.relatedMaterials.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                          <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Thao tác trực tiếp với vật tư:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.relatedMaterials.map((mat) => (
                              <div
                                key={mat.code}
                                className="bg-slate-900/90 border border-slate-700/90 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2 w-full"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-amber-300 text-[11px]">
                                      {mat.code}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                      ({mat.name})
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Tồn kho: <strong className="text-white">{mat.currentStock} {mat.unit}</strong> | Vị trí: <span className="text-slate-300">{mat.location || 'Kho'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => onOpenCreateTransaction?.('EXPORT', mat.code)}
                                    className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition-colors"
                                  >
                                    - Xuất kho
                                  </button>
                                  <button
                                    onClick={() => onOpenCreateTransaction?.('IMPORT', mat.code)}
                                    className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition-colors"
                                  >
                                    + Nhập kho
                                  </button>
                                  <button
                                    onClick={() => onOpenStockCard?.(mat.code)}
                                    className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-semibold transition-colors"
                                  >
                                    📋 Thẻ kho
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-line">{msg.text}</div>
                  )}
                  <div
                    className={`text-[10px] mt-1.5 ${
                      msg.sender === 'USER' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {sendingChat && (
              <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Gemini đang đọc dữ liệu tồn kho & suy luận...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input box */}
          <div className="p-3 border-t border-slate-800 bg-slate-850">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="input-ai-chat"
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Nhập câu hỏi tự nhiên về vật tư (ví dụ: 'Các mã DN_CC có đủ cho dự án mới không?')..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                id="btn-send-ai-chat"
                disabled={sendingChat || !inputQuestion.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
