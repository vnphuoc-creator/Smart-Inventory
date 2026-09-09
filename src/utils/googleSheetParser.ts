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
 * Normalizes Google Drive links so they can be rendered directly in <img src="..." />
 */
export function normalizeImageSourceUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Match Google Drive file ID
  // e.g. drive.google.com/file/d/FILE_ID/view, drive.google.com/open?id=FILE_ID, drive.google.com/uc?id=FILE_ID
  const driveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  // If inside formula like =IMAGE("https://...")
  const formulaMatch = trimmed.match(/=IMAGE\s*\(\s*["']([^"']+)["']\s*\)/i);
  if (formulaMatch && formulaMatch[1]) {
    return normalizeImageSourceUrl(formulaMatch[1]);
  }

  return trimmed;
}

/**
 * Extracts sheet ID and GID from any Google Sheets URL
 */
export function parseGoogleSheetUrl(url: string): { sheetId: string | null; gid: string } {
  if (!url || typeof url !== 'string') return { sheetId: null, gid: '0' };
  const trimmed = url.trim();

  // Match sheetId
  // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
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
 * Robust CSV parser supporting quotes, commas, newlines within cells
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
 * Finds index of column header by list of possible aliases
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

  // Find header row (usually row 0 or row 1)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, csvRows.length); i++) {
    const row = csvRows[i];
    const joined = row.join(' ').toLowerCase();
    if (joined.includes('tên') || joined.includes('mã') || joined.includes('vật tư') || joined.includes('san pham')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = csvRows[headerRowIndex];

  // Column matching
  const codeIdx = findColIndex(headers, ['mã vật tư', 'mã vt', 'mã sản phẩm', 'mã sp', 'mã hàng', 'code', 'ma vat tu', 'ma vt']);
  const nameIdx = findColIndex(headers, ['tên sản phẩm', 'tên vật tư', 'tên vt', 'tên hàng hóa', 'name', 'ten san pham', 'ten vat tu']);
  const unitIdx = findColIndex(headers, ['đơn vị', 'đvt', 'đơn vị tính', 'unit', 'dvt', 'don vi']);
  const qrIdx = findColIndex(headers, ['mã qr', 'qr code', 'qr', 'qrcode', 'ma qr']);
  const barcodeIdx = findColIndex(headers, ['mã barcode', 'barcode', 'mã vạch', 'ma barcode', 'ma vach']);
  const imageIdx = findColIndex(headers, ['hình ảnh', 'link ảnh', 'ảnh', 'hình', 'image', 'photo', 'hinh anh', 'link anh']);
  const locationIdx = findColIndex(headers, ['vị trí', 'vị trí kho', 'kệ', 'ngăn', 'khay', 'location', 'vi tri']);
  const stockIdx = findColIndex(headers, ['tồn kho', 'tồn đầu kỳ', 'số lượng', 'sl tồn', 'tồn', 'initial stock', 'stock', 'ton kho']);
  const priceIdx = findColIndex(headers, ['đơn giá', 'giá', 'giá tiêu chuẩn', 'price', 'unit price', 'don gia']);
  const specIdx = findColIndex(headers, ['quy cách', 'thông số', 'mô tả', 'specification', 'quy cach', 'thong so']);
  const brandIdx = findColIndex(headers, ['hãng', 'hãng sản xuất', 'nhà sản xuất', 'brand', 'nsx', 'manufacturer', 'hang']);
  const diffIdx = findColIndex(headers, ['điểm nhận diện', 'đặc điểm', 'phân biệt', 'chú ý', 'loại đầu', 'điện áp', 'differentiator', 'loai']);
  const noteIdx = findColIndex(headers, ['ghi chú', 'từ khóa', 'từ khóa tìm kiếm', 'notes', 'keywords', 'ghi chu']);

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
    const rawQr = qrIdx !== -1 && row[qrIdx] ? row[qrIdx].trim() : '';
    const rawBarcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx].trim() : '';
    const rawImage = imageIdx !== -1 && row[imageIdx] ? row[imageIdx].trim() : '';
    const imageUrl = normalizeImageSourceUrl(rawImage);
    const location = locationIdx !== -1 && row[locationIdx] ? row[locationIdx].trim() : 'Kho Tổng';
    const spec = specIdx !== -1 && row[specIdx] ? row[specIdx].trim() : '';
    const rawBrand = brandIdx !== -1 && row[brandIdx] ? row[brandIdx].trim() : '';
    const rawDiff = diffIdx !== -1 && row[diffIdx] ? row[diffIdx].trim() : '';
    const notes = noteIdx !== -1 && row[noteIdx] ? row[noteIdx].trim() : '';

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
    const existing = existingMap.get(code);

    const materialObj: Material = {
      id: existing ? existing.id : `mat_${code.toLowerCase()}`,
      code: code,
      name: name,
      category: existing?.category || category,
      unit: unit || existing?.unit || 'Cái',
      specification: spec || existing?.specification || '',
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
      barcode: rawBarcode || (existing as any)?.barcode || '',
      qrCode: rawQr || (existing as any)?.qrCode || '',
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
      if (imageUrl && imageUrl !== existing.image) changes.push(`Cập nhật link ảnh mới`);
      if (rawBarcode && (existing as any).barcode !== rawBarcode) changes.push(`Cập nhật Barcode: ${rawBarcode}`);
      if (rawQr && (existing as any).qrCode !== rawQr) changes.push(`Cập nhật QR code`);

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
 * Fetches Google Sheet data using backend proxy or direct fetch
 */
export async function fetchGoogleSheetCsv(sheetUrl: string): Promise<string> {
  const { sheetId, gid } = parseGoogleSheetUrl(sheetUrl);
  if (!sheetId) {
    throw new Error('Đường link Google Sheet không hợp lệ. Vui lòng kiểm tra lại định dạng link docs.google.com/spreadsheets/d/...');
  }

  // 1. First try backend proxy (which bypasses any browser CORS restriction)
  try {
    const res = await fetch('/api/sync/google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.csvText) {
        return data.csvText;
      }
    }
  } catch (proxyErr) {
    console.warn('Backend proxy note, attempting direct CSV fetch:', proxyErr);
  }

  // 2. Direct fetch to Google Sheet export endpoint
  const directCsvUrl = buildGoogleSheetCsvUrl(sheetId, gid);
  try {
    const directRes = await fetch(directCsvUrl);
    if (directRes.ok) {
      return await directRes.text();
    }
  } catch (directErr) {
    console.warn('Direct CSV export note, attempting GViz endpoint:', directErr);
  }

  // 3. Fallback to Google Visualization API endpoint
  const gvizUrl = buildGoogleSheetGvizCsvUrl(sheetId, gid);
  const gvizRes = await fetch(gvizUrl);
  if (!gvizRes.ok) {
    throw new Error(
      `Không thể truy cập Google Sheet (Mã lỗi ${gvizRes.status}). Vui lòng đảm bảo bạn đã cấp quyền "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with link can view) trên Google Sheet.`
    );
  }

  return await gvizRes.text();
}
