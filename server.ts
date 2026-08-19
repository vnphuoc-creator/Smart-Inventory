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
  const { query, materialsSummary, transactionsSummary } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  const ai = getGemini();

  if (!ai) {
    // Return structured fallback response if Gemini key is not configured
    return res.json({
      intent: "general_search",
      textResponse: `Kết quả tìm kiếm cho truy vấn: "${query}". Hệ thống đang sử dụng bộ lọc tìm kiếm thông minh cục bộ.`,
      suggestedFilters: {
        searchKeyword: query,
      },
    });
  }

  try {
    const prompt = `Bạn là trợ lý ảo AI chuyên gia quản lý kho vật tư công nghiệp và xây dựng (hệ thống quản lý vật tư mã bắt đầu bằng DN_).
Người dùng hỏi: "${query}"

Dữ liệu tóm tắt kho hiện tại:
${materialsSummary || "Không có tóm tắt chi tiết"}

Dữ liệu tóm tắt giao dịch gần đây:
${transactionsSummary || "Không có giao dịch"}

Nhiệm vụ:
1. Phân tích ý định của người dùng (tìm vật tư, kiểm tra tồn kho, cảnh báo sắp hết hàng, lọc theo mã DN_, lọc phiếu, hoặc hỏi đáp thống kê).
2. Trả về phản hồi hữu ích, chuyên nghiệp bằng tiếng Việt.
3. Cung cấp bộ lọc JSON gợi ý để giao diện tự động lọc bảng dữ liệu.

Hãy trả về phản hồi định dạng JSON strictly with this schema:
{
  "intent": "search_material" | "low_stock_alert" | "view_transactions" | "stock_valuation" | "general_qa",
  "textResponse": "câu trả lời chi tiết, ngắn gọn, súc tích và có ích bằng tiếng Việt",
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
          "Bạn là trợ lý AI quản lý kho vật tư thông minh. Luôn phản hồi bằng tiếng Việt chuẩn xác, tôn trọng quy tắc mã vật tư DN_.",
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
    console.error("Gemini API error:", err);
    return res.status(500).json({
      error: "Lỗi xử lý AI, sử dụng tìm kiếm tiêu chuẩn",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// AI Assistant for Inventory Analysis and Procurement Advice
app.post("/api/ai/analyze-stock", async (req, res) => {
  const { lowStockItems, totalMaterials, totalValue } = req.body;
  const ai = getGemini();

  if (!ai) {
    return res.json({
      summary: `Hiện tại có ${lowStockItems?.length || 0} vật tư dưới ngưỡng an toàn cần bổ sung.`,
      recommendations: [
        "Lập phiếu đề xuất nhập kho cho các vật tư có mức tồn dưới tối thiểu",
        "Kiểm tra lại định mức an toàn định kỳ mỗi tháng",
      ],
    });
  }

  try {
    const prompt = `Phân tích tình trạng kho vật tư:
- Tổng số loại vật tư: ${totalMaterials}
- Tổng giá trị tồn: ${totalValue} VNĐ
- Danh sách vật tư dưới định mức tối thiểu: ${JSON.stringify(lowStockItems)}

Hãy đưa ra:
1. Đánh giá rủi ro thiếu hụt vật tư.
2. Đề xuất kế hoạch nhập kho ưu tiên (số lượng gợi ý đặt hàng).
3. Lời khuyên tối ưu hóa dòng tiền và an toàn kho.

Trả về JSON dạng:
{
  "riskLevel": "THẤP" | "TRUNG BÌNH" | "CAO",
  "summary": "đánh giá tổng quan ngắn",
  "priorityOrders": [
    {
      "code": "mã DN_",
      "name": "tên vật tư",
      "suggestedQuantity": 0,
      "reason": "lý do"
    }
  ],
  "recommendations": ["khuyến nghị 1", "khuyến nghị 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (err: unknown) {
    console.error("AI Analysis error:", err);
    return res.status(500).json({
      error: "Không thể phân tích dữ liệu kho",
      details: err instanceof Error ? err.message : String(err),
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
