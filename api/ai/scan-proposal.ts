import { GoogleGenAI } from "@google/genai";

function normalizeVietnamese(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function isInvalidOrCategoryHeader(item: any): boolean {
  if (!item) return true;
  const name = (item.materialName || '').trim();
  const code = (item.materialCode || '').trim();
  const unit = (item.unit || '').trim();

  if (!name && !code) return true;

  const norm = normalizeVietnamese(name);
  const normCode = normalizeVietnamese(code);

  const invalidKeywords = [
    'tong cong',
    'cong',
    'bang chu',
    'stt',
    'ten vat tu',
    'quy cach',
    'don vi tinh',
    'so luong',
    'don gia',
    'thanh tien',
    'ghi chu',
    'dia diem',
    'thoi gian',
    'muc dich',
    'de nghi',
    'to trinh so',
    'nguoi lap',
    'truong phong',
    'pho truong phong',
    'giam doc',
    'thu kho',
    'can cu',
    'kinh gui',
    'he thong chieu sang',
    'he thong ha the',
    'he thong trung the',
    'he thong thiet bi ve sinh',
    'he thong cap thoat nuoc',
  ];

  for (const kw of invalidKeywords) {
    if (norm === kw || norm.startsWith(kw + ' ') || norm.startsWith(kw + ':') || norm.startsWith(kw + '-')) {
      return true;
    }
    if (normCode === kw || normCode.startsWith(kw + ' ') || normCode.startsWith(kw + '_')) {
      return true;
    }
  }

  if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)[\.\s\:\-]/i.test(name)) {
    if (/van hanh|he thong|chi phi|dung cu|thiet bi|hang muc|cong cu/i.test(norm)) {
      return true;
    }
    if (!code.toUpperCase().startsWith('DN_') && (!unit || unit === '-' || norm.length < 15)) {
      return true;
    }
  }

  if (normCode.includes('van_hanh') || normCode.includes('chi_phi') || normCode.includes('he_thong')) {
    return true;
  }

  return false;
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fileData, fileName, fileText, docHtml, availableMaterials } = req.body || {};

  const isImg =
    (fileData && typeof fileData === "string" && (fileData.startsWith("data:image/") || fileData.includes("image/"))) ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName || "");

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey && isImg) {
    return res.status(200).json({
      success: false,
      error: "MISSING_GEMINI_API_KEY",
      message:
        "Vercel chưa cấu hình GEMINI_API_KEY trong Environment Variables! Vui lòng vào Vercel Settings > Environment Variables, thêm GEMINI_API_KEY để AI thực hiện nhận diện ảnh OCR.",
      proposalNumber: "",
      items: [],
    });
  }

  if (apiKey && (fileData || fileText || docHtml)) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [];

      if (fileData && typeof fileData === "string") {
        if (fileData.includes(";base64,")) {
          const splitParts = fileData.split(";base64,");
          const mime = splitParts[0].replace(/^data:/, "").trim() || "image/jpeg";
          const b64 = splitParts[1].trim();
          parts.push({
            inlineData: {
              data: b64,
              mimeType: mime,
            },
          });
        } else if (fileData.startsWith("data:")) {
          const match = fileData.match(/^data:([^;]+);base64,(.+)$/s);
          if (match) {
            parts.push({
              inlineData: {
                data: match[2].trim(),
                mimeType: match[1].trim() || "image/jpeg",
              },
            });
          }
        }
      }

      const promptText = `Bạn là chuyên gia OCR hình ảnh và phân tích tài liệu Tờ trình / Báo giá / Đề xuất vật tư của Cảng Hàng Không Quốc Tế Đà Nẵng (AHT - Đội Điện Nước Công Trình ĐNCT/PKT).

TỆP ĐÍNH KÈM CÓ THỂ LÀ ẢNH CHỤP (PHOTO/CAMERA), ẢNH CHỤP MÀN HÌNH (SCREENSHOT/PASTE), HOẶC VĂN BẢN SCAN CỦA TỜ TRÌNH.
Hãy đọc kỹ toàn bộ chữ và bảng biểu trong ảnh (OCR):

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ):
1. THÔNG TIN CHUNG:
   - proposalNumber: Số tờ trình xuất hiện trên văn bản (ví dụ "17-DNCT/PKT", "31-DNCT/PKT", "29-DNCT/PKT", "26-DNCT/PKT", "08-DNCT/PKT", "45-DNCT/PKT", hoặc dạng tương tự Số: .../ĐNCT-PKT). Chuẩn hóa về dạng "[Số]-DNCT/PKT".
   - title: Tiêu đề tờ trình / Trích yếu (V/v: ... hoặc Tiêu đề văn bản).
   - partner: Đơn vị đề xuất / Nhà cung cấp.
   - reason: Lý do nhập kho / Mục đích đề xuất.
   - date: Ngày lập tờ trình (định dạng YYYY-MM-DD nếu thấy trên ảnh).

2. DANH SÁCH VẬT TƯ (items):
   - Quét kỹ BẢNG DANH MỤC VẬT TƯ KỸ THUẬT trong ảnh hoặc văn bản.
   - Với mỗi dòng mặt hàng:
     + materialName: Tên và quy cách kỹ thuật đầy đủ của vật tư.
     + quantity: Số lượng yêu cầu (số nguyên hoặc số thực dương).
     + unit: Đơn vị tính (Cái, Bộ, Mét, Cuộn, Cây, Thùng, Hộp, Bình, Lít, Kg, v.v.).
     + unitPrice: Đơn giá nếu có trong bảng (nếu không có thì để theo danh mục tham chiếu hoặc 0).
     + notes: Ghi chú hoặc mục đích sử dụng cụ thể của dòng đó.
     + materialCode: Nếu khớp với vật tư nào trong danh sách tham chiếu dưới đây (bắt đầu bằng "DN_"), hãy gán đúng mã đó. Nếu không có trong danh sách, sinh mã dạng "DN_VT_1", "DN_VT_2",...
   - TUYỆT ĐỐI KHÔNG lấy các dòng tiêu đề cột, dòng "Tổng cộng", "Bằng chữ", "Ký tên", "Giám đốc", "Người lập" làm vật tư!

${fileText ? `Văn bản đính kèm:\n${fileText}\n` : ""}
${docHtml ? `Cấu trúc bảng Word/HTML:\n${docHtml.slice(0, 10000)}\n` : ""}

Danh sách mã vật tư tham chiếu của hệ thống:
${Array.isArray(availableMaterials) ? availableMaterials.slice(0, 300).map((m: any) => `${m.code}: ${m.name} (${m.unit || 'Cái'})`).join("\n") : "Mã DN_..."}

Trả về DUY NHẤT định dạng JSON (không thêm markdown ngoài json):
{
  "success": true,
  "proposalNumber": "17-DNCT/PKT",
  "title": "Tiêu đề đề xuất",
  "partner": "Đội Điện Nước Công Trình",
  "reason": "Lý do nhập kho",
  "date": "2026-09-07",
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

      parts.push({ text: promptText });

      let response: any = null;
      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];
      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: parts,
            config: {
              responseMimeType: "application/json",
              systemInstruction:
                "Bạn là chuyên gia OCR và phân tích tài liệu kỹ thuật AHT. Đọc kỹ văn bản và ảnh chụp tờ trình đề xuất vật tư. CHỈ trích xuất danh sách hàng hóa/vật tư thực tế từ bảng, không lấy tiêu đề hành chính hay chữ ký.",
            },
          });
          if (response && response.text) {
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Model ${modelName} scan-proposal attempt failed, trying fallback:`, modelErr?.message || modelErr);
        }
      }

      if (response && response.text) {
        const outputText = response.text || "{}";
        const parsed = JSON.parse(outputText);
        if (parsed && parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          parsed.items = parsed.items.filter((it: any) => !isInvalidOrCategoryHeader(it));
          if (parsed.items.length > 0) {
            return res.status(200).json(parsed);
          }
        } else if (parsed && parsed.proposalNumber) {
          return res.status(200).json(parsed);
        }
      }
    } catch (err: any) {
      console.warn("Gemini Proposal Scan error:", err);
      if (isImg) {
        return res.status(200).json({
          success: false,
          error: "AI_PROCESSING_ERROR",
          message: `Lỗi AI khi đọc ảnh: ${err?.message || "Không thể phân tích ảnh"}. Vui lòng kiểm tra lại GEMINI_API_KEY.`,
          proposalNumber: "",
          items: [],
        });
      }
    }
  }

  if (isImg) {
    return res.status(200).json({
      success: false,
      error: "NO_ITEMS_FOUND",
      message: "AI đã quét ảnh nhưng không tìm thấy bảng danh mục vật tư trong ảnh này. Bạn hãy kiểm tra lại ảnh có rõ nét bảng vật tư không nhé!",
      proposalNumber: "",
      items: [],
    });
  }

  // Heuristic Fallback
  const fullText = (fileText || fileName || "").toString();
  const proposalMatch = fullText.match(/(\d{1,4}[-\/][A-Za-z0-9_\/Đđ]+)/i);
  let detectedProposalNumber = proposalMatch ? proposalMatch[1].toUpperCase() : '';
  if (/^\d{1,4}$/.test(detectedProposalNumber)) {
    detectedProposalNumber = `${detectedProposalNumber}-DNCT/PKT`;
  }

  return res.status(200).json({
    success: true,
    proposalNumber: detectedProposalNumber,
    items: [],
  });
}
