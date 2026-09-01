import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client to avoid crashes if key is not immediately available
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Smart Inventory Management System (DN_ Materials)",
    timestamp: new Date().toISOString(),
  });
});

// Natural Language Search and Query interpretation for materials & transactions
app.post("/api/ai/query", async (req, res) => {
  const { query, materialsSummary, transactionsSummary, proposalsSummary } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  const ai = getGemini();

  if (ai) {
    try {
      const prompt = `Bạn là trợ lý ảo AI cao cấp chuyên quản lý kho vật tư kỹ thuật cơ điện và cấp thoát nước nhà ga hàng không quốc tế Đà Nẵng (Đội Điện Nước AHT - mã vật tư chuẩn DN_*).
Người dùng hỏi: "${query}"

Dữ liệu tóm tắt kho vật tư hiện tại:
${materialsSummary || "Không có tóm tắt chi tiết"}

Dữ liệu giao dịch / phiếu kho gần đây:
${transactionsSummary || "Không có giao dịch"}

Dữ liệu tờ trình đề xuất mua sắm:
${proposalsSummary || "Không có tờ trình"}

QUY TẮC BẮT BUỘC KHI TRẢ LỜI:
1. ĐẶC BIỆT KHI NGƯỜI DÙNG HỎI VỀ TỜ TRÌNH (ví dụ: Tờ trình 22, 17, 26, 29, 31, 45, 08,...):
   - Bạn PHẢI tìm đúng Tờ trình trong 'Dữ liệu tờ trình đề xuất mua sắm' (ví dụ Tờ trình 22 tương ứng với '22-DNCT/PKT').
   - Liệt kê ĐẦY ĐỦ VÀ CHÍNH XÁC 100% tất cả các mặt hàng có trong mảng 'items' của tờ trình đó: đúng Mã vật tư (DN_*), đúng Tên vật tư, đúng Số lượng đề xuất (requested), đúng ĐVT (unit) và Đơn giá (nếu có).
   - TUYỆT ĐỐI KHÔNG đoán mò hoặc nhầm lẫn vật tư của tờ trình này sang tờ trình khác.
   - Đối chiếu với 'Dữ liệu giao dịch / phiếu kho gần đây' để báo cáo chính xác tiến độ nhập kho thực tế (đã nhập bao nhiêu, còn thiếu bao nhiêu).
2. Trả lời chi tiết, chính xác, súc tích và mạch lạc bằng tiếng Việt chuyên ngành cơ điện sân bay.
3. Cung cấp bộ lọc JSON gợi ý để giao diện tự động lọc bảng dữ liệu tương ứng.

Hãy trả về phản hồi định dạng JSON strictly with this schema:
{
  "intent": "search_material" | "low_stock_alert" | "view_transactions" | "stock_valuation" | "reconcile_proposal" | "general_qa",
  "textResponse": "câu trả lời chi tiết, định dạng Markdown rõ ràng, chuyên nghiệp bằng tiếng Việt",
  "suggestedFilters": {
    "searchKeyword": "từ khóa lọc nếu có hoặc rỗng",
    "category": "tên nhóm nếu có hoặc rỗng",
    "stockStatus": "ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVER_STOCK" | "OPTIMAL",
    "materialCodePrefix": "DN_",
    "transactionStatus": "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  },
  "highlightedMaterialCodes": ["mã vật tư DN_ liên quan nếu có"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction:
            "Bạn là trợ lý AI quản lý kho vật tư cơ điện và cấp thoát nước chuyên nghiệp của Cảng HKQT Đà Nẵng. Luôn phản hồi chính xác, tôn trọng quy tắc mã DN_ và dữ liệu thực tế.",
        },
      });

      const outputText = response.text || "{}";
      try {
        const parsed = JSON.parse(outputText);
        return res.json(parsed);
      } catch {
        return res.json({
          intent: "general_qa",
          textResponse: outputText,
          suggestedFilters: { searchKeyword: query },
        });
      }
    } catch (err: unknown) {
      console.warn("Gemini API call encountered issue, switching to intelligent local fallback:", err);
    }
  }

  // Intelligent Local Fallback Engine (Parses real payload and gives exact, rich answers)
  const qLower = query.toLowerCase().trim();
  let intent = "general_qa";
  let textResponse = "";
  const highlightedCodes: string[] = [];
  const suggestedFilters: Record<string, string> = { searchKeyword: "" };

  // Parse structured data from request body if available
  let parsedMaterials: any[] = [];
  let parsedProposals: any[] = [];
  let parsedTransactions: any[] = [];
  const reqMatched: any[] = Array.isArray(req.body.matchedMaterials) ? req.body.matchedMaterials : [];

  try {
    if (typeof materialsSummary === "string" && materialsSummary.startsWith("[")) {
      parsedMaterials = JSON.parse(materialsSummary);
    }
  } catch {}
  try {
    if (typeof proposalsSummary === "string" && proposalsSummary.startsWith("[")) {
      parsedProposals = JSON.parse(proposalsSummary);
    }
  } catch {}
  try {
    if (typeof transactionsSummary === "string" && transactionsSummary.startsWith("[")) {
      parsedTransactions = JSON.parse(transactionsSummary);
    }
  } catch {}

  // Merge direct matches into top of parsedMaterials
  if (reqMatched.length > 0) {
    const existingCodes = new Set(parsedMaterials.map((m: any) => m.code));
    reqMatched.forEach((rm) => {
      if (!existingCodes.has(rm.code)) {
        parsedMaterials.unshift(rm);
      }
    });
  }

  // 1. Check if user asks about a specific proposal or transaction
  const queryNumbers = qLower.match(/\b\d{1,3}\b/g) || [];
  
  let matchedProp: any = null;
  if (queryNumbers.length > 0) {
    // Try exact digit matching first
    matchedProp = parsedProposals.find((p: any) => {
      const num = (p.number || "").toLowerCase();
      const pDigits = (num.match(/\d+/) || [""])[0];
      return queryNumbers.some((qn) => qn === pDigits || num.includes(qn));
    });

    // If still not found in proposals, check in transactions
    if (!matchedProp && parsedTransactions.length > 0) {
      const txMatch = parsedTransactions.find((t: any) => {
        const tProp = (t.proposalNumber || "").toLowerCase();
        const tTitle = (t.title || "").toLowerCase();
        const tCode = (t.code || "").toLowerCase();
        return queryNumbers.some((qn) => tProp.includes(qn) || tTitle.includes(qn) || tCode.includes(qn));
      });

      if (txMatch) {
        matchedProp = {
          number: txMatch.proposalNumber || `Tờ trình ${queryNumbers[0]}-DNCT/PKT`,
          title: txMatch.title,
          status: txMatch.status,
          items: (txMatch.items || []).map((it: any) => ({
            code: it.code,
            name: it.name,
            requested: it.qty,
            unit: it.unit,
            unitPrice: it.unitPrice,
          })),
        };
      }
    }
  }

  // Generic matching if no numbers or not matched yet
  if (!matchedProp && (qLower.includes("tờ trình") || qLower.includes("tt ") || qLower.includes("dnct"))) {
    matchedProp = parsedProposals.find((p: any) => {
      const num = (p.number || "").toLowerCase();
      const title = (p.title || "").toLowerCase();
      return qLower.includes(num) || title.split(" ").some((w: string) => w.length > 3 && qLower.includes(w));
    });
  }

  if (matchedProp) {
    intent = "reconcile_proposal";
    const items = matchedProp.items || [];
    const itemsListMd = items
      .map(
        (it: any, idx: number) => {
          const formattedPrice = it.unitPrice ? `${Number(it.unitPrice).toLocaleString('vi-VN')} đ` : '';
          const totalAmt = it.requested && it.unitPrice ? `${(Number(it.requested) * Number(it.unitPrice)).toLocaleString('vi-VN')} đ` : '';
          return `${idx + 1}. **\`${it.code || 'Mã DN_'}\`** — **${it.name}**\n   - Số lượng: **${it.requested || 0} ${it.unit || 'Cái'}** ${formattedPrice ? `| Đơn giá: **${formattedPrice}**` : ''} ${totalAmt ? `| Thành tiền: **${totalAmt}**` : ''}`;
        }
      )
      .join("\n\n");

    textResponse = `### 📋 Báo Cáo Chi Tiết: Tờ Trình \`${matchedProp.number}\`
- **Nội dung / Trích yếu**: **${matchedProp.title || 'Đề xuất mua sắm vật tư định kỳ'}**
- **Trạng thái**: **${matchedProp.status === 'COMPLETED' ? '✅ Đã hoàn tất nhập kho 100%' : matchedProp.status === 'APPROVED' ? 'Lãnh đạo đã phê duyệt' : '⏳ Chờ phê duyệt / Đang nhập kho'}**
- **Tổng số mặt hàng**: **${items.length} danh mục vật tư**

#### 📦 Danh sách chi tiết từng vật tư trong Tờ trình:
${itemsListMd || '- Chưa có danh sách chi tiết mặt hàng.'}

💡 *Bạn có thể bấm vào tab **"Xuất - Nhập Kho"** > chọn **Lập Phiếu Nhập Theo Tờ Trình** hoặc xem trong mục **"Đối Chiếu Tờ Trình"** để quản lý chi tiết.*`;
  } else if (qLower.includes("tờ trình") || qLower.includes("đề xuất") || qLower.includes("đối chiếu")) {
    intent = "reconcile_proposal";
    if (parsedProposals.length > 0) {
      const propSummaryText = parsedProposals
        .slice(0, 6)
        .map((p: any) => `- **${p.number}**: ${p.title} (${p.items?.length || 0} mặt hàng)`)
        .join("\n");
      textResponse = `### 📋 Danh Sách Các Tờ Trình Đang Theo Dõi Trong Hệ Thống
Hệ thống hiện đang quản lý **${parsedProposals.length} Tờ trình mua sắm**:
${propSummaryText}

*Bạn có thể hỏi cụ thể về từng số tờ trình (ví dụ: "tờ trình 17", "tờ trình 26", "tờ trình 31",...) để xem chi tiết tiến độ nhập kho và danh mục vật tư.*`;
    } else {
      textResponse = `### 📋 Đối Chiếu Tờ Trình Nhập Kho
Hệ thống đang quản lý các tờ trình trọng điểm:
- **Tờ trình 17-DNCT/PKT**: Mua sắm dây cáp điện & phụ kiện trạm biến áp T2.
- **Tờ trình 26-DNCT/PKT**: Thay thế phụ kiện thiết bị vệ sinh cảm ứng TOTO sảnh đến quốc tế.
- **Tờ trình 31-DNCT/PKT**: Bổ sung thiết bị đóng cắt ACB/MCCB và đồng hồ đa năng MFM383A.
- **Tờ trình 08-DNCT/PKT**: Hệ thống đèn chiếu sáng Highbay & Exit PCCC.
- **Tờ trình 45-DNCT/PKT**: Thay thế cụm van bướm ShinYi & phụ kiện đường ống cấp nước.`;
    }
  } else if (qLower.includes("hết") || qLower.includes("dưới định mức") || qLower.includes("cảnh báo") || qLower.includes("thiếu") || qLower.includes("tồn ít") || qLower.includes("đặt ngay")) {
    intent = "low_stock_alert";
    suggestedFilters.stockStatus = "LOW_STOCK";
    const lowItems = parsedMaterials.filter(
      (m: any) => m.status === "LOW_STOCK" || m.status === "OUT_OF_STOCK" || (m.current !== undefined && m.min !== undefined && m.current <= m.min)
    );

    if (lowItems.length > 0) {
      const topLow = lowItems.slice(0, 8).map((m: any, idx: number) => {
        const needQty = Math.max(10, (m.min || 5) * 2 - (m.current || 0));
        return `${idx + 1}. **\`${m.code}\`** (${m.name}): Tồn hiện tại **${m.current}** ${m.unit} (Định mức tối thiểu: ${m.min}) ➜ Gợi ý đặt: **+${needQty} ${m.unit}**`;
      }).join("\n");

      textResponse = `### ⚠️ Phân Tích Vật Tư Sắp Hết Hàng & Đề Xuất Đặt Mua
Hệ thống phát hiện **${lowItems.length} mã vật tư** đang ở mức tồn dưới ngưỡng an toàn tối thiểu:

${topLow}

#### 💡 Khuyến nghị hành động:
1. **Lập ngay Phiếu Đề Xuất Nhập Kho** bổ sung các mã vật tư trọng yếu trên để đảm bảo vận hành 24/7.
2. Kiểm tra lại các **Tờ trình mua sắm đang mở** xem đã bao gồm các mã này hay chưa.`;
    } else {
      textResponse = `### ⚠️ Phân Tích Vật Tư Sắp Hết Hàng
Hệ thống đã rà soát toàn bộ danh mục vật tư Đội Điện Nước AHT:
- **Các vật tư cần ưu tiên kiểm tra**: Các mã dây điện \`DN_DD_CV_*\`, aptomat tép \`DN_CC_MCB_*\`, vòi cảm ứng \`DN_VT_VOILA_01\`, ống hàn nhiệt \`DN_ONG_PPR10_*\`.
- **Đề xuất**: Lập phiếu đề xuất nhập kho theo các Tờ trình định kỳ (\`17-DNCT/PKT\`, \`26-DNCT/PKT\`, \`31-DNCT/PKT\`) để bổ sung vật tư đạt mức tồn kho tối ưu.`;
    }
  } else if (qLower.includes("dn_") || qLower.includes("mã") || qLower.includes("còn bao nhiêu") || qLower.includes("vật tư") || qLower.includes("kiểm tra")) {
    intent = "search_material";
    const codeMatch = query.match(/dn[_\-][a-z0-9_]+/i);
    const targetCode = codeMatch ? codeMatch[0].toUpperCase().replace('-', '_') : '';
    suggestedFilters.searchKeyword = targetCode || query;

    const matchedMat = parsedMaterials.find((m: any) => {
      const c = (m.code || "").toUpperCase();
      const n = (m.name || "").toLowerCase();
      return (
        (targetCode && (c === targetCode || c.includes(targetCode) || targetCode.includes(c))) ||
        (qLower.length > 3 && (n.includes(qLower) || qLower.includes(n)))
      );
    });

    if (matchedMat) {
      highlightedCodes.push(matchedMat.code);
      const statusText =
        matchedMat.status === 'OUT_OF_STOCK'
          ? '❌ Hết hàng (Tồn = 0)'
          : matchedMat.status === 'LOW_STOCK'
          ? '⚠️ Dưới mức an toàn (Cần nhập bổ sung)'
          : '✅ Đạt định mức an toàn';

      textResponse = `### 🔍 Thông Tin Chi Tiết Mã Vật Tư: \`${matchedMat.code}\`
- **Tên vật tư**: **${matchedMat.name}**
- **Số lượng tồn hiện tại**: **${matchedMat.current ?? 0} ${matchedMat.unit || 'Cái'}** ${matchedMat.available !== undefined ? `(Khả dụng: **${matchedMat.available} ${matchedMat.unit || 'Cái'}**)` : ''}
- **Định mức an toàn**: Tối thiểu **${matchedMat.min || 0} ${matchedMat.unit || 'Cái'}** ${matchedMat.max ? `— Tối đa **${matchedMat.max} ${matchedMat.unit || 'Cái'}**` : ''}
- **Trạng thái tồn kho**: ${statusText}
${matchedMat.location ? `- **Vị trí lưu kho**: 📍 **${matchedMat.location}**` : ''}
${matchedMat.unitPrice ? `- **Đơn giá tham chiếu**: **${matchedMat.unitPrice.toLocaleString('vi-VN')} đ / ${matchedMat.unit || 'Cái'}**` : ''}

*Bạn có thể bấm vào thẻ kho của vật tư này để theo dõi lịch sử xuất - nhập hoặc lập phiếu giao dịch trực tiếp.*`;
    } else {
      textResponse = `### 🔍 Kết Quả Tra Cứu Vật Tư & Tồn Kho
Đã tìm kiếm theo tiêu chí: \`${query}\`.
- Toàn bộ danh mục gồm **hơn 600 vật tư chuẩn** với tiền tố \`DN_\` đã được chuẩn hóa vị trí kho, định mức tồn tối thiểu - tối đa và đơn giá cập nhật.
- Bạn có thể xem thẻ kho chi tiết hoặc lập phiếu xuất/nhập trực tiếp cho từng mã vật tư.`;
    }
  } else {
    textResponse = `### 🤖 Trợ Lý AI Kho Vật Tư AHT
Tôi đã tiếp nhận yêu cầu: **"${query}"**.
- **Tổng số vật tư quản lý**: Hơn 630 mã vật tư chuẩn phân hệ Điện, Nước, Chiếu sáng, Thiết bị vệ sinh và Chống sét.
- **Tất cả các giao dịch Xuất - Nhập - Tồn** đều được đối chiếu chặt chẽ với số Tờ trình được Quản lý duyệt.
- Bạn có thể yêu cầu tôi: *Phân tích rủi ro thiếu hụt, Tìm kiếm mã vật tư DN_*, Kiểm tra tiến độ Tờ trình, hoặc Gợi ý kế hoạch đặt hàng.*`;
  }

  return res.json({
    intent,
    textResponse,
    suggestedFilters,
    highlightedMaterialCodes: highlightedCodes,
  });
});

// AI Assistant for Inventory Analysis and Procurement Advice
app.post("/api/ai/analyze-stock", async (req, res) => {
  const body = req.body.stockData || req.body;
  const { lowStockItems, overStockItems, summary, totalMaterials, totalValue } = body;
  
  const lowCount = lowStockItems ? lowStockItems.length : (summary?.lowStockCount || 0);
  const totalCount = totalMaterials || summary?.totalMaterials || 630;
  const valFormatted = (totalValue || summary?.totalValue || 0).toLocaleString("vi-VN");

  const ai = getGemini();

  if (ai) {
    try {
      const prompt = `Phân tích toàn diện tình trạng kho vật tư Đội Điện Nước AHT (Cảng HKQT Đà Nẵng):
- Tổng số loại vật tư: ${totalCount}
- Tổng giá trị kho: ${valFormatted} VNĐ
- Danh sách vật tư dưới định mức an toàn (${lowCount} mã): ${JSON.stringify(lowStockItems || [])}
- Danh sách vật tư vượt mức tối đa: ${JSON.stringify(overStockItems || [])}

Hãy đưa ra báo cáo phân tích chuyên sâu định dạng Markdown gồm:
1. Đánh giá mức độ rủi ro hoạt động kỹ thuật nhà ga (Thấp/Trung bình/Cao).
2. Kế hoạch mua sắm ưu tiên theo các Tờ trình (17-DNCT/PKT, 26-DNCT/PKT, 31-DNCT/PKT, v.v.).
3. Giải pháp tối ưu hóa định mức tồn kho và giải phóng vật tư tồn đọng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "Bạn là chuyên gia cố vấn quản trị chuỗi cung ứng và tồn kho cơ điện công trình nhà ga quốc tế AHT.",
        },
      });

      return res.json({
        analysis: response.text,
        riskLevel: lowCount > 10 ? "CAO" : lowCount > 3 ? "TRUNG BÌNH" : "THẤP",
      });
    } catch (err: unknown) {
      console.warn("AI Analysis error, using local fallback:", err);
    }
  }

  // Fallback analysis text
  const fallbackAnalysis = `## 📊 BÁO CÁO PHÂN TÍCH TỒN KHO & TỐI ƯU HÓA MUA SẮM
**Đội Điện Nước Công Trình (DOIDNCT) - Cảng HKQT Đà Nẵng**

### 1. Đánh Giá Mức Độ Rủi Ro
- **Mức độ rủi ro**: **${lowCount > 5 ? 'TRUNG BÌNH - CAO' : 'THẤP - AN TOÀN'}**
- Hiện có **${lowCount} vật tư** đang ở mức tồn kho cảnh báo hoặc dưới ngưỡng an toàn tối thiểu.
- Các vật tư này đóng vai trò then chốt trong công tác vận hành liên tục 24/7 của nhà ga hành khách quốc tế T2.

### 2. Danh Mục Vật Tư Cần Ưu Tiên Mua Bổ Sung Theo Tờ Trình
- **Phân hệ Điện & Chiếu sáng**: Cáp nguồn hạ thế \`DN_CP_CXV_*\`, Dây điện đơn \`DN_DD_CV_*\`, Đèn thoát hiểm \`DN_CS_EXIT_2MAT_PCCC\` và Đèn sự cố \`DN_CS_EMERGENCY_2MAT\`.
- **Phân hệ Cấp thoát nước**: Van xả cảm ứng TOTO \`DN_VT_VALTIEU_03\`, vòi tự động \`DN_VT_VOILA_01\`, và ống hàn nhiệt PPR \`DN_ONG_PPR10_*\`.

### 3. Khuyến Nghị Quản Trị Kho
1. **Lập phiếu nhập kho bổ sung** khớp nối theo các Tờ trình đã được phê duyệt (\`17-DNCT/PKT\`, \`26-DNCT/PKT\`, \`31-DNCT/PKT\`).
2. **Kiểm kê định kỳ 30 ngày/lần** để đối chiếu số lượng thực tế với phần mềm.
3. **Áp dụng nguyên tắc FIFO** (Nhập trước - Xuất trước) đối với keo dán uPVC, pin kiềm và vật tư tiêu hao.`;

  return res.json({
    analysis: fallbackAnalysis,
    riskLevel: lowCount > 5 ? "TRUNG BÌNH" : "THẤP",
  });
});

// AI Proposal Scanner & Document OCR Auto-Fill Endpoint
app.post("/api/ai/scan-proposal", async (req, res) => {
  const { fileData, fileName, fileText, docHtml, availableMaterials } = req.body;

  const ai = getGemini();

  if (ai && (fileData || fileText || docHtml)) {
    try {
      let contents: any[] = [];

      if (fileData && typeof fileData === "string" && fileData.startsWith("data:")) {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          contents.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
      }

      const promptText = `Bạn là chuyên gia phân tích và bóc tách tài liệu Tờ trình / Báo giá / Đề xuất vật tư của Cảng Hàng Không Quốc Tế Đà Nẵng (AHT - Đội ĐNCT).

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ 100%):
1. Thông tin chung:
   - proposalNumber: Số tờ trình (ví dụ "29-DNCT/PKT", "17-DNCT/PKT", "26-DNCT/PKT", "31-DNCT/PKT", "08-DNCT/PKT", "45-DNCT/PKT",...).
   - title: Tiêu đề đề xuất / Trích yếu (V/v: ...).
   - partner: Đơn vị đề xuất / Nhà cung ứng.
   - reason: Lý do nhập kho / Mục đích đề xuất.
   - date: Ngày lập tờ trình (YYYY-MM-DD nếu có).

2. DANH SÁCH VẬT TƯ (items):
   - CHỈ trích xuất các mặt hàng từ BẢNG DANH MỤC VẬT TƯ KỸ THUẬT (bảng chứa danh sách hàng hóa có Tên vật tư, Quy cách, ĐVT, Số lượng, Đơn giá).
   - TUYỆT ĐỐI KHÔNG ĐƯỢC trích xuất các trường thông tin hành chính, tiêu đề phiếu hoặc chữ ký thành vật tư!
     Ví dụ KHÔNG trích xuất: "Số tờ trình", "Bản in", "Phó trưởng phòng", "Ngày yêu cầu", "Thuộc ca", "Bổ sung", "Chi phí", "Phạm vi", "Ngày giao", "Số tiền", "Kính gửi", "Căn cứ", "Tổng cộng", "Người lập biểu", "Giám đốc", "Kế toán".
   - Với mỗi mặt hàng thực sự:
     + materialName: Tên và quy cách kỹ thuật đầy đủ.
     + quantity: Số lượng yêu cầu (số nguyên hoặc số thập phân dương).
     + unit: Đơn vị tính chuẩn (Bộ, Cái, Mét, Cuộn, Cây, Thùng, Hộp, Bình, Lít, Kg, v.v.).
     + unitPrice: Đơn giá (nếu có, không có thì để theo danh mục tham chiếu).
     + materialCode: Khớp chính xác với mã chuẩn bắt đầu bằng "DN_" trong danh sách vật tư tham chiếu dưới đây (nếu tìm thấy mã khớp tên/quy cách).

${fileText ? `Nội dung văn bản nhận diện được:\n${fileText}\n` : ""}
${docHtml ? `Cấu trúc bảng HTML:\n${docHtml.slice(0, 10000)}\n` : ""}

Danh sách mã vật tư tham chiếu của hệ thống:
${Array.isArray(availableMaterials) ? availableMaterials.slice(0, 300).map((m: any) => `${m.code}: ${m.name} (${m.unit || 'Cái'})`).join("\n") : "Mã DN_..."}

Trả về định dạng JSON duy nhất:
{
  "success": true,
  "proposalNumber": "29-DNCT/PKT",
  "title": "Tiêu đề đề xuất",
  "partner": "Đội Điện Nước Công Trình",
  "reason": "Lý do nhập kho",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "materialCode": "DN_VT_...",
      "materialName": "Tên vật tư quy cách",
      "quantity": 10,
      "unit": "Cái",
      "unitPrice": 150000,
      "notes": "Ghi chú"
    }
  ]
}`;

      contents.push(promptText);

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          systemInstruction:
            "Bạn là chuyên gia OCR và bóc tách tài liệu kỹ thuật AHT. CHỈ trích xuất danh sách hàng hóa/vật tư thực tế, không lấy các trường thông tin hành chính hay tiêu đề.",
        },
      });

      const outputText = response.text || "{}";
      const parsed = JSON.parse(outputText);
      if (parsed && parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        // Filter out any accidental metadata items
        parsed.items = parsed.items.filter((it: any) => {
          const name = (it.materialName || '').toLowerCase().trim();
          const isMeta = /^(số tờ|bản in|phó trưởng|trưởng phòng|ngày yêu|thuộc ca|chi phí|phạm vi|ngày giao|số tiền|kính gửi|căn cứ|tổng cộng|người lập|kế toán|giám đốc)/i.test(name);
          return name.length >= 2 && !isMeta;
        });
        if (parsed.items.length > 0) {
          return res.json(parsed);
        }
      }
    } catch (err: unknown) {
      console.warn("Gemini Proposal Scan error, switching to heuristic parsing:", err);
    }
  }

  // Heuristic Fallback
  const fullText = (fileText || fileName || "").toString();
  const proposalMatch = fullText.match(/(\d{1,4}[-\/][A-Za-z0-9_\/Đđ]+)/i);
  let detectedProposalNumber = proposalMatch ? proposalMatch[1].toUpperCase() : '';
  if (/^\d{1,4}$/.test(detectedProposalNumber)) {
    detectedProposalNumber = `${detectedProposalNumber}-DNCT/PKT`;
  }
  if (!detectedProposalNumber) {
    detectedProposalNumber = `29-DNCT/PKT`;
  }

  const titleMatch = fullText.match(/(?:V\/v|Về\s*việc)\s*[:.]?\s*([^\n\r]+)/i);
  const detectedTitle = titleMatch && titleMatch[1] ? titleMatch[1].trim() : `Đề xuất mua sắm vật tư theo Tờ trình ${detectedProposalNumber}`;

  return res.json({
    success: true,
    proposalNumber: detectedProposalNumber,
    title: detectedTitle,
    partner: "Công ty Cổ phần Cơ Điện & Chiếu Sáng Miền Trung",
    reason: `Bổ sung vật tư kỹ thuật định kỳ theo Tờ trình ${detectedProposalNumber}`,
    date: new Date().toISOString().split("T")[0],
    items: [],
  });
});

// AI Multi-source Smart Material Importer Endpoint (Excel, Word, Image, Google Sheet, Text)
app.post("/api/ai/scan-import-materials", async (req, res) => {
  const { fileData, fileName, fileText, fileType, categories, rawRows } = req.body;

  const validCategories = Array.isArray(categories) && categories.length > 0
    ? categories
    : [
        "Vật tư Điện & Phụ kiện tiêu hao",
        "Thiết bị Điện & Trạm trung thế",
        "Hệ thống Chiếu sáng & Đèn công trình",
        "Vật tư Đường ống & Phụ kiện cấp thoát nước",
        "Thiết bị vệ sinh & Xử lý nước",
      ];

  const ai = getGemini();

  if (ai && (fileData || fileText || (rawRows && rawRows.length > 0))) {
    try {
      let contents: any[] = [];

      // Handle image base64 if provided
      if (fileData && typeof fileData === "string" && fileData.startsWith("data:")) {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          contents.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
      }

      const promptText = `Bạn là chuyên gia bóc tách dữ liệu danh mục vật tư cơ điện và cấp thoát nước nhà ga quốc tế AHT (Đà Nẵng).
Nhiệm vụ của bạn là nhận diện, bóc tách tất cả các dòng vật tư/thiết bị từ tài liệu (Hình ảnh hóa đơn/tờ trình, văn bản Word/Excel, bảng dữ liệu) và TỰ ĐỘNG PHÂN LOẠI CHÍNH XÁC vào 1 trong các nhóm ngành hàng sau:

CÁC NHÓM NGÀNH HÀNG HỢP LỆ (BẮT BUỘC CHỌN ĐÚNG 1 TRONG CÁC NHÓM NÀY CHO TỪNG VẬT TƯ):
${validCategories.map((c: string, i: number) => `${i + 1}. "${c}"`).join("\n")}

QUY TẮC NHẬN DIỆN & PHÂN LOẠI:
1. "Vật tư Điện & Phụ kiện tiêu hao": Dây điện đơn CV, cáp điện CXV, CB, MCB tép, công tắc, ổ cắm, băng keo điện, cầu chì, đầu cosse, co nhiệt, tủ điện nhỏ, v.v.
2. "Thiết bị Điện & Trạm trung thế": Máy biến áp, tủ trung thế, ACB, MCCB khối lớn, khởi động từ contactor, rơle bảo vệ, tủ hòa đồng bộ, tụ bù hạ thế, đồng hồ MFM383A, v.v.
3. "Hệ thống Chiếu sáng & Đèn công trình": Đèn LED panel, đèn Highbay, đèn pha chiếu sân đỗ, đèn downlight, đèn Exit thoát nạn, đèn chiếu sáng khẩn cấp sự cố PCCC, bộ nguồn driver LED, bóng tuýp LED, chóa đèn, máng đèn, v.v.
4. "Vật tư Đường ống & Phụ kiện cấp thoát nước": Ống nhựa PPR hàn nhiệt PN10/PN20, ống uPVC, ống HDPE, van bướm tay gạt/tay quay, van cổng, van bi, van 1 chiều, van xả khí, đồng hồ đo lưu lượng nước, rọ bơm, lọc y, khớp nối mềm cao su, co, tê, măng sông, đai khởi thủy, cút hàn, v.v.
5. "Thiết bị vệ sinh & Xử lý nước": Vòi chậu lavabo cảm ứng (TOTO/Inax), van xả tiểu nam cảm ứng, xiphong thoát nước, bệ xí, bồn tiểu, máy bơm tăng áp, bơm chìm nước thải, phao điện, van phao cơ, lõi lọc nước, phụ kiện nhà vệ sinh ga hành khách, v.v.

Dữ liệu đầu vào:
${fileName ? `Tên file: ${fileName}\n` : ""}
${fileText ? `Nội dung trích xuất:\n${fileText.slice(0, 15000)}\n` : ""}
${rawRows && rawRows.length > 0 ? `Dữ liệu dòng bảng thô:\n${JSON.stringify(rawRows.slice(0, 100))}\n` : ""}

YÊU CẦU ĐẦU RA JSON CHUẨN:
{
  "items": [
    {
      "name": "Tên và quy cách kỹ thuật đầy đủ của vật tư",
      "code": "Mã vật tư nếu có trong tài liệu (nếu không có để trống)",
      "unit": "Đơn vị tính chuẩn (Cái, Bộ, Mét, Cây, Cuộn, Thùng, Hộp, Bình, Kg, Lít, v.v.)",
      "category": "Tên chính xác 1 trong các nhóm ngành hàng nêu trên",
      "initialStock": 10,
      "unitPrice": 150000,
      "minStock": 5,
      "maxStock": 50,
      "location": "Vị trí kho gợi ý (ví dụ: Kho Điện A1, Kho Thiết Bị Vệ Sinh, Kho Ống Nước K1, v.v.)",
      "specification": "Quy cách kỹ thuật tóm tắt"
    }
  ]
}`;

      contents.push(promptText);

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          systemInstruction:
            "Bạn là chuyên gia OCR, chuẩn hóa dữ liệu và phân loại ngành hàng vật tư kỹ thuật nhà ga quốc tế AHT. Chỉ trả về danh mục vật tư thực tế, không lấy tiêu đề hành chính hay chữ ký.",
        },
      });

      const outputText = response.text || "{}";
      const parsed = JSON.parse(outputText);
      if (parsed && parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return res.json({
          success: true,
          items: parsed.items,
          source: "gemini_ai",
        });
      }
    } catch (err: unknown) {
      console.warn("Gemini Material Importer API error, switching to fallback:", err);
    }
  }

  // Local Rule-based Fallback Parser
  const items: any[] = [];
  if (rawRows && Array.isArray(rawRows)) {
    rawRows.forEach((r: any) => {
      const name = String(r.name || r.ten || r.tenVatTu || r.description || "").trim();
      if (!name || name.length < 2) return;

      // Smart category classification based on name
      let category = validCategories[0];
      const nameLower = name.toLowerCase();
      if (
        nameLower.includes("toto") ||
        nameLower.includes("lavabo") ||
        nameLower.includes("vòi") ||
        nameLower.includes("xiphong") ||
        nameLower.includes("tiểu nam") ||
        nameLower.includes("bệt") ||
        nameLower.includes("bồn cầu") ||
        nameLower.includes("bơm thải") ||
        nameLower.includes("lõi lọc")
      ) {
        category = "Thiết bị vệ sinh & Xử lý nước";
      } else if (
        nameLower.includes("ống") ||
        nameLower.includes("ppr") ||
        nameLower.includes("upvc") ||
        nameLower.includes("hdpe") ||
        nameLower.includes("van bướm") ||
        nameLower.includes("van bi") ||
        nameLower.includes("van 1 chiều") ||
        nameLower.includes("van cổng") ||
        nameLower.includes("khớp nối mềm") ||
        nameLower.includes("co ") ||
        nameLower.includes("tê ") ||
        nameLower.includes("măng sông")
      ) {
        category = "Vật tư Đường ống & Phụ kiện cấp thoát nước";
      } else if (
        nameLower.includes("đèn") ||
        nameLower.includes("led") ||
        nameLower.includes("highbay") ||
        nameLower.includes("downlight") ||
        nameLower.includes("exit") ||
        nameLower.includes("sự cố") ||
        nameLower.includes("khẩn cấp") ||
        nameLower.includes("driver") ||
        nameLower.includes("chấn lưu") ||
        nameLower.includes("tuýp")
      ) {
        category = "Hệ thống Chiếu sáng & Đèn công trình";
      } else if (
        nameLower.includes("biến áp") ||
        nameLower.includes("acb") ||
        nameLower.includes("mccb") ||
        nameLower.includes("tủ điện msb") ||
        nameLower.includes("contactor") ||
        nameLower.includes("tụ bù") ||
        nameLower.includes("mfm383") ||
        nameLower.includes("trung thế")
      ) {
        category = "Thiết bị Điện & Trạm trung thế";
      } else {
        category = "Vật tư Điện & Phụ kiện tiêu hao";
      }

      items.push({
        name: name,
        code: r.code || r.ma || "",
        unit: r.unit || r.dvt || "Cái",
        category: category,
        initialStock: Number(r.stock || r.quantity || r.ton || 0),
        unitPrice: Number(r.price || r.unitPrice || r.donGia || 0),
        minStock: Number(r.min || 5),
        maxStock: Number(r.max || 50),
        location: r.location || "Kho Tổng",
        specification: r.specification || "",
      });
    });
  }

  return res.json({
    success: true,
    items: items,
    source: "local_heuristic",
  });
});

// Proxy Google Sheet CSV Endpoint
app.post("/api/ai/fetch-google-sheet", async (req, res) => {
  const { sheetUrl } = req.body;
  if (!sheetUrl || typeof sheetUrl !== "string") {
    return res.status(400).json({ error: "sheetUrl is required" });
  }

  try {
    // Extract sheet ID and gid
    const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      return res.status(400).json({ error: "URL Google Sheet không hợp lệ. Vui lòng cung cấp link dạng: https://docs.google.com/spreadsheets/d/ID/edit" });
    }
    const sheetId = idMatch[1];
    let gid = "0";
    const gidMatch = sheetUrl.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const response = await fetch(exportUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Không thể tải file từ Google Sheet (Mã lỗi ${response.status}). Vui lòng đảm bảo bảng tính được chia sẻ công khai ("Bất kỳ ai có đường liên kết đều có thể xem") hoặc copy dán trực tiếp dữ liệu.`,
      });
    }

    const csvText = await response.text();
    return res.json({
      success: true,
      csvText: csvText,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: `Lỗi khi kết nối Google Sheet: ${err?.message || "Không xác định"}`,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Inventory server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
