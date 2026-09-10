import { Material } from '../types';

export interface GoogleSheetSyncResult {
  sheetId: string;
  gid: string;
  sourceUrl: string;
  totalRowsParsed: number;
  newItemsCount: number;
  updatedItemsCount: number;
  unchangedCount: number;
  itemsWithImageCount: number;
  itemsWithBarcodeCount: number;
  parsedMaterials: Material[];
  diffs: {
    material: Material;
    status: 'NEW' | 'UPDATED' | 'UNCHANGED';
    changes?: string[];
  }[];
}

/**
 * Extracts Google Drive file ID from various Drive URL formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. drive.google.com/file/d/FILE_ID
  const m1 = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]{15,})/i);
  if (m1 && m1[1]) return m1[1];

  // 2. lh3.googleusercontent.com/d/FILE_ID
  const m2 = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{15,})/i);
  if (m2 && m2[1]) return m2[1];

  // 3. docs.google.com/uc?id=FILE_ID or thumbnail?id=FILE_ID
  const m3 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/i);
  if (m3 && m3[1]) return m3[1];

  return null;
}

/**
 * Checks if a string or URL is likely an image link
 */
export function isLikelyImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.includes('drive.google.com') ||
    lower.includes('googleusercontent.com') ||
    lower.includes('images.unsplash.com') ||
    lower.includes('cloudinary.com') ||
    lower.includes('imgur.com') ||
    lower.startsWith('data:image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(lower)
  );
}

/**
 * Normalizes image source URLs (especially Google Drive links) so they render reliably in <img> tags
 */
export function normalizeImageSourceUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();

  // Strip wrapping quotes if any
  trimmed = trimmed.replace(/^["']+|["']+$/g, '');

  // If inside formula like =HYPERLINK("https://...", "...")
  const hyperlinkMatch = trimmed.match(/=HYPERLINK\s*\(\s*["']([^"']+)["']/i);
  if (hyperlinkMatch && hyperlinkMatch[1]) {
    return normalizeImageSourceUrl(hyperlinkMatch[1]);
  }

  // If inside formula like =IMAGE("https://...")
  const formulaMatch = trimmed.match(/=IMAGE\s*\(\s*["']([^"']+)["']\s*\)/i);
  if (formulaMatch && formulaMatch[1]) {
    return normalizeImageSourceUrl(formulaMatch[1]);
  }

  // If Google Chart QR image generator wrapping a target URL: e.g. ...cht=qr&chl=URL
  const qrParamMatch = trimmed.match(/[?&](?:chl|data)=([^&]+)/i);
  if (qrParamMatch && qrParamMatch[1]) {
    try {
      const decoded = decodeURIComponent(qrParamMatch[1]);
      if (isLikelyImageUrl(decoded)) {
        return normalizeImageSourceUrl(decoded);
      }
    } catch {}
  }

  // Match Google Drive file ID
  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return trimmed;
}

/**
 * Extracts sheet ID and GID from any Google Sheets URL
 */
export function parseGoogleSheetUrl(url: string): { sheetId: string | null; gid: string } {
  if (!url || typeof url !== 'string') return { sheetId: null, gid: '0' };
  const trimmed = url.trim();

  // Check published sheet (spreadsheets/d/e/2PACX-.../pubhtml or /pub)
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/(2PACX-[a-zA-Z0-9-_]+)/i);
  if (pubMatch && pubMatch[1]) {
    return { sheetId: pubMatch[1], gid: '0' };
  }

  // Match sheetId: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
  const idMatch = trimmed.match(/\/spreadsheets\/(?:d|u\/\d+\/d)\/([a-zA-Z0-9-_]+)/i);
  const sheetId = idMatch ? idMatch[1] : null;

  // Match gid
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/i);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { sheetId, gid };
}

/**
 * Constructs standard CSV export endpoint for Google Sheets
 */
export function buildGoogleSheetCsvUrl(sheetId: string, gid = '0'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Constructs GViz CSV endpoint as secondary fallback
 */
export function buildGoogleSheetGvizCsvUrl(sheetId: string, gid = '0'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

/**
 * Robust CSV parser supporting quotes, commas, and multi-line cells
 */
export function parseCsvText(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, ''); // Strip BOM
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Finds index of column header by list of possible aliases with Vietnamese normalization
 */
function findColIndex(headers: string[], aliases: string[]): number {
  const normHeaders = headers.map((h) =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  );

  for (const alias of aliases) {
    const normAlias = alias
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const idx = normHeaders.findIndex((h) => h === normAlias || h.includes(normAlias));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Intelligently scores candidate rows to find the true column headers row,
 * bypassing any merged banner title lines (e.g. "BẢNG VẬT TƯ ĐỘI ĐIỆN NƯỚC AHT")
 */
export function detectHeaderRowIndex(csvRows: string[][]): number {
  let bestIdx = 0;
  let maxScore = -1;

  const headerKeywords = [
    'tên', 'mã', 'vật tư', 'sản phẩm', 'quy cách', 'thông số',
    'đvt', 'đơn vị', 'hình ảnh', 'ảnh', 'hình', 'qr', 'barcode',
    'vị trí', 'tồn kho', 'số lượng', 'đơn giá', 'hãng', 'brand',
    'code', 'name', 'unit', 'image', 'spec', 'stock', 'stt'
  ];

  const searchLimit = Math.min(8, csvRows.length);
  for (let i = 0; i < searchLimit; i++) {
    const row = csvRows[i];
    if (!row || row.length === 0) continue;

    const nonEmptyCells = row.filter((c) => c && c.trim().length > 0);
    // Banner rows usually have only 1 cell. Real header rows have 3+ cells.
    if (nonEmptyCells.length < 2) continue;

    let score = 0;
    const joined = row.join(' ').toLowerCase();

    for (const kw of headerKeywords) {
      if (joined.includes(kw)) score += 3;
    }
    score += Math.min(nonEmptyCells.length, 8);

    if (score > maxScore) {
      maxScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * Infers appropriate category based on material code or name
 */
export function inferMaterialCategory(code: string, name: string): string {
  const c = code.toUpperCase();
  const n = name.toLowerCase();

  if (c.startsWith('DN_') || n.includes('điện') || n.includes('chiếu sáng') || n.includes('dây')) {
    return 'Cơ Điện - Điện Nước (DN)';
  }
  if (c.startsWith('CD_') || n.includes('bhs') || n.includes('băng tải') || n.includes('motor') || n.includes('hành lý')) {
    return 'Bảo Trì Cơ Điện & BHS (CD)';
  }
  if (c.startsWith('DT_') || n.includes('máy tính') || n.includes('cáp mạng') || n.includes('wifi') || n.includes('camera')) {
    return 'Điện Tử - IT Viễn Thông (DT)';
  }
  if (c.startsWith('BT_') || n.includes('bulong') || n.includes('ốc') || n.includes('vít')) {
    return 'Bulong - Vật Tư Phụ (BT)';
  }
  return 'Vật Tư Kỹ Thuật Tổng Hợp';
}

/**
 * Parses Google Sheet rows into Material objects and computes live diff
 */
export function parseGoogleSheetToMaterials(
  csvRows: string[][],
  existingMaterials: Material[]
): {
  parsedMaterials: Material[];
  diffs: GoogleSheetSyncResult['diffs'];
} {
  if (!csvRows || csvRows.length < 2) {
    return { parsedMaterials: [], diffs: [] };
  }

  // Intelligently detect header row index
  const headerRowIndex = detectHeaderRowIndex(csvRows);
  const headers = csvRows[headerRowIndex];

  // Expanded column matching with all Vietnamese variations
  const codeIdx = findColIndex(headers, [
    'mã vật tư', 'mã vt', 'mã sản phẩm', 'mã sp', 'mã hàng', 'mã', 'code',
    'ma vat tu', 'ma vt', 'mã thiết bị', 'item code', 'part number', 'ma'
  ]);
  const nameIdx = findColIndex(headers, [
    'tên sản phẩm', 'tên vật tư', 'tên vt', 'tên hàng hóa', 'tên hàng', 'tên thiết bị',
    'tên', 'name', 'ten san pham', 'ten vat tu', 'mô tả', 'diễn giải', 'tên gọi', 'item name'
  ]);
  const unitIdx = findColIndex(headers, [
    'đơn vị tính', 'đơn vị tính (đvt)', 'đơn vị', 'đvt', 'dvt', 'unit', 'don vi tinh', 'don vi'
  ]);
  const nameAndCodeIdx = findColIndex(headers, [
    'tên sản phẩm & mã vật tư', 'tên & mã vật tư', 'tên & mã', 'tên sp & mã vt', 'mô tả & mã',
    'ten san pham & ma vat tu', 'ten & ma', 'tên và mã'
  ]);
  const qrIdx = findColIndex(headers, [
    'mã qr', 'qr code', 'qr', 'qrcode', 'link qr', 'mã vạch & qr', 'ma qr', 'ma qrcode', 'mã qr code'
  ]);
  const barcodeIdx = findColIndex(headers, [
    'mã barcode', 'barcode', 'mã vạch', 'ma barcode', 'ma vach', 'mã vạch barcode'
  ]);
  const imageIdx = findColIndex(headers, [
    'hình ảnh', 'link ảnh', 'link hình ảnh', 'link hình', 'ảnh thật', 'ảnh thực tế',
    'ảnh chụp', 'ảnh', 'hình', 'image', 'photo', 'picture', 'link anh', 'hinh anh', 'hinh', 'anh'
  ]);
  const locationIdx = findColIndex(headers, [
    'vị trí', 'vị trí kho', 'vị trí lưu kho', 'kệ', 'ngăn', 'khay', 'location', 'vi tri'
  ]);
  const stockIdx = findColIndex(headers, [
    'tồn kho', 'tồn đầu kỳ', 'số lượng', 'sl tồn', 'tồn', 'sl', 'initial stock', 'stock', 'ton kho', 'so luong'
  ]);
  const priceIdx = findColIndex(headers, [
    'đơn giá', 'giá', 'giá tiêu chuẩn', 'giá nhập', 'price', 'unit price', 'don gia'
  ]);
  const specIdx = findColIndex(headers, [
    'quy cách', 'thông số', 'thông số kỹ thuật', 'quy cách kỹ thuật', 'mô tả kỹ thuật', 'mô tả vật tư',
    'mô tả', 'kích thước', 'model', 'specification', 'specs', 'quy cach', 'thong so'
  ]);
  const brandIdx = findColIndex(headers, [
    'hãng', 'hãng sản xuất', 'hãng sx', 'thương hiệu', 'nhà sản xuất', 'brand', 'nsx', 'manufacturer', 'hang'
  ]);
  const diffIdx = findColIndex(headers, [
    'điểm nhận diện', 'đặc điểm', 'phân biệt', 'chú ý', 'lưu ý', 'cảnh báo', 'loại đầu', 'điện áp', 'differentiator', 'loai'
  ]);
  const noteIdx = findColIndex(headers, [
    'ghi chú', 'từ khóa', 'từ khóa tìm kiếm', 'notes', 'keywords', 'ghi chu'
  ]);

  // Map of existing materials by code
  const existingMap = new Map<string, Material>();
  existingMaterials.forEach((m) => {
    if (m.code) {
      existingMap.set(m.code.trim().toUpperCase(), m);
    }
  });

  const parsedMaterials: Material[] = [];
  const diffs: GoogleSheetSyncResult['diffs'] = [];

  for (let r = headerRowIndex + 1; r < csvRows.length; r++) {
    const row = csvRows[r];
    if (!row || row.length === 0) continue;

    // Must have at least a valid code or name
    const rawCode = (codeIdx !== -1 && row[codeIdx] ? row[codeIdx] : '').trim();
    const rawName = (nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : '').trim();

    if (!rawCode && !rawName) continue;

    const code = (rawCode || `VT_${r}`).toUpperCase().replace(/\s+/g, '_');
    const name = rawName || rawCode;
    const unit = (unitIdx !== -1 && row[unitIdx] ? row[unitIdx] : 'Cái').trim();
    const rawNameAndCode = nameAndCodeIdx !== -1 && row[nameAndCodeIdx] ? row[nameAndCodeIdx].trim() : '';
    const rawQr = qrIdx !== -1 && row[qrIdx] ? row[qrIdx].trim() : '';
    const rawBarcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx].trim() : '';
    const rawImage = imageIdx !== -1 && row[imageIdx] ? row[imageIdx].trim() : '';

    // Smart image fallback: if Image column is empty, check if QR or Barcode has an image URL
    let finalImage = rawImage;
    if (!finalImage && isLikelyImageUrl(rawQr)) {
      finalImage = rawQr;
    } else if (!finalImage && isLikelyImageUrl(rawBarcode)) {
      finalImage = rawBarcode;
    }

    const imageUrl = normalizeImageSourceUrl(finalImage);
    const location = locationIdx !== -1 && row[locationIdx] ? row[locationIdx].trim() : 'Kho Tổng';
    
    // Quy cách kỹ thuật & tiêu chuẩn: người dùng yêu cầu phải giống với mô tả vật tư
    const existing = existingMap.get(code);
    const explicitSpec = specIdx !== -1 && row[specIdx] ? row[specIdx].trim() : '';
    const finalSpec = explicitSpec || existing?.specification || name;

    const rawBrand = brandIdx !== -1 && row[brandIdx] ? row[brandIdx].trim() : '';
    const rawDiff = diffIdx !== -1 && row[diffIdx] ? row[diffIdx].trim() : '';
    const notes = noteIdx !== -1 && row[noteIdx] ? row[noteIdx].trim() : '';

    // Smart QR & Barcode handling:
    // Trên Google Sheet người dùng thường dùng công thức =IMAGE(qr_url & E2) với E2 là "Tên | Mã"
    // Nếu cột QR trống, tự động gán theo format chuẩn "${name} | ${code}" để quét trên kệ luôn nhận diện được
    const finalQrCode = rawQr || rawNameAndCode || (existing as any)?.qrCode || `${name} | ${code}`;
    const finalBarcode = rawBarcode || (existing as any)?.barcode || code.replace(/[^A-Z0-9]/gi, '');

    let initialStock = 0;
    if (stockIdx !== -1 && row[stockIdx]) {
      const parsedNum = parseFloat(row[stockIdx].replace(/,/g, '').replace(/\./g, ''));
      if (!isNaN(parsedNum) && parsedNum >= 0) initialStock = parsedNum;
    }

    let unitPrice = 0;
    if (priceIdx !== -1 && row[priceIdx]) {
      const parsedPrice = parseFloat(row[priceIdx].replace(/[^0-9]/g, ''));
      if (!isNaN(parsedPrice)) unitPrice = parsedPrice;
    }

    const category = inferMaterialCategory(code, name);

    const materialObj: Material = {
      id: existing ? existing.id : `mat_${code.toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
      code: code,
      name: name,
      category: existing?.category || category,
      unit: unit || existing?.unit || 'Cái',
      specification: finalSpec,
      location: location || existing?.location || 'Kho Tổng',
      initialStock: stockIdx !== -1 && initialStock > 0 ? initialStock : existing ? existing.initialStock : 0,
      minStock: existing?.minStock ?? 5,
      maxStock: existing?.maxStock ?? 100,
      unitPrice: priceIdx !== -1 && unitPrice > 0 ? unitPrice : existing ? existing.unitPrice : 0,
      allocatedStaffEmails: existing?.allocatedStaffEmails || [],
      notes: notes || existing?.notes || '',
      image: imageUrl || existing?.image || '',
      brand: rawBrand || existing?.brand || '',
      differentiator: rawDiff || existing?.differentiator || '',
      barcode: finalBarcode,
      qrCode: finalQrCode,
      updatedAt: new Date().toISOString(),
    };

    parsedMaterials.push(materialObj);

    if (!existing) {
      diffs.push({
        material: materialObj,
        status: 'NEW',
        changes: ['Vật tư mới thêm từ Google Sheet'],
      });
    } else {
      const changes: string[] = [];
      if (materialObj.name !== existing.name) changes.push(`Tên: "${existing.name}" → "${materialObj.name}"`);
      if (materialObj.unit !== existing.unit) changes.push(`ĐVT: "${existing.unit}" → "${materialObj.unit}"`);
      if (imageUrl && imageUrl !== existing.image) changes.push(`Cập nhật link ảnh thật mới`);
      if (finalBarcode && (existing as any).barcode !== finalBarcode) changes.push(`Mã Barcode: ${finalBarcode}`);
      if (finalQrCode && (existing as any).qrCode !== finalQrCode) changes.push(`Mã QR: ${finalQrCode}`);
      if (finalSpec && finalSpec !== existing.specification) changes.push(`Quy cách: ${finalSpec}`);

      if (changes.length > 0) {
        diffs.push({
          material: materialObj,
          status: 'UPDATED',
          changes,
        });
      } else {
        diffs.push({
          material: materialObj,
          status: 'UNCHANGED',
        });
      }
    }
  }

  return { parsedMaterials, diffs };
}

/**
 * Fetches Google Sheet data using backend proxy or direct fetch with detailed error feedback
 */
export async function fetchGoogleSheetCsv(sheetUrl: string): Promise<string> {
  const { sheetId, gid } = parseGoogleSheetUrl(sheetUrl);
  if (!sheetId) {
    throw new Error('Đường link Google Sheet không hợp lệ. Vui lòng kiểm tra lại định dạng link docs.google.com/spreadsheets/d/...');
  }

  // 1. Primary: Backend proxy to avoid browser CORS restrictions
  try {
    const res = await fetch('/api/sync/google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.csvText) {
      return data.csvText;
    }

    if (data?.error) {
      throw new Error(data.error);
    }
  } catch (proxyErr: any) {
    // If the server provided an explicit permission or sheet error message, throw it
    if (proxyErr?.message && !proxyErr.message.includes('fetch')) {
      throw proxyErr;
    }
    console.warn('Backend proxy note, attempting direct CSV export:', proxyErr);
  }

  // 2. Direct fetch to Google Sheet export endpoint
  const directCsvUrl = buildGoogleSheetCsvUrl(sheetId, gid);
  try {
    const directRes = await fetch(directCsvUrl);
    if (directRes.ok) {
      const text = await directRes.text();
      if (!text.includes('<!DOCTYPE html') && !text.includes('<html')) {
        return text;
      }
    }
  } catch (directErr) {
    console.warn('Direct CSV export note, attempting GViz endpoint:', directErr);
  }

  // 3. Fallback to Google Visualization API endpoint
  const gvizUrl = buildGoogleSheetGvizCsvUrl(sheetId, gid);
  const gvizRes = await fetch(gvizUrl);
  if (!gvizRes.ok) {
    throw new Error(
      `Không thể truy cập Google Sheet. Vui lòng kiểm tra lại quyền chia sẻ: Chọn "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with the link can view) trên Google Sheet.`
    );
  }

  const gvizText = await gvizRes.text();
  if (gvizText.includes('<!DOCTYPE html') || gvizText.includes('<html')) {
    throw new Error(
      'Google Sheet hiện đang bị khóa quyền riêng tư. Bạn vui lòng mở Google Sheet > bấm nút "Chia sẻ" (Share) > đổi sang "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with the link can view).'
    );
  }

  return gvizText;
}
