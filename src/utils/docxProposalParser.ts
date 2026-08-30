import { Material } from '../types';

export interface ExtractedProposalItem {
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  notes: string;
}

export interface ExtractedProposalData {
  proposalNumber: string;
  title: string;
  partner: string;
  reason: string;
  date: string;
  items: ExtractedProposalItem[];
}

/**
 * Clean and normalize Vietnamese string for robust matching
 */
function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a text is an administrative header / metadata field rather than an actual technical material
 */
export function isAdministrativeText(text: string): boolean {
  if (!text) return true;
  const clean = text.trim();
  if (clean.length < 2) return true;

  const norm = normalizeText(clean);
  const adminKeywords = [
    'so to trinh',
    'to trinh so',
    'to trinh',
    'ban in',
    'pho truong phong',
    'truong phong',
    'pho truong',
    'ngay yeu cau',
    'ngay de xuat',
    'thuoc ca',
    'bo sung',
    'chi phi',
    'pham vi',
    'ngay giao',
    'ngay lap',
    'ngay trinh',
    'so tien',
    'tong tien',
    'tong chi phi',
    'kinh phi',
    'kinh gui',
    'can cu',
    'muc dich',
    'noi dung',
    'du toan',
    'tong cong',
    'nguoi lap bieu',
    'nguoi lap',
    'nguoi de xuat',
    'ke toan',
    'thu kho',
    'giam doc',
    'ban giam doc',
    'phe duyet',
    'don vi de xuat',
    'don vi thuc hien',
    'thoi gian thuc hien',
    'stt',
    'tt',
    'mau so',
    'cong',
    'bang chu',
    'ghi chu',
    'chu ky',
    'dia diem',
    'thoi gian',
  ];

  return adminKeywords.some((kw) => norm === kw || norm.startsWith(kw + ' ') || norm.startsWith(kw + ':'));
}

/**
 * Intelligent fuzzy matcher to map extracted document item name/code to standard catalog
 */
export function findBestMaterialMatch(
  itemName: string,
  itemCode: string,
  materials: Material[]
): Material | null {
  if (!materials || materials.length === 0 || !itemName) return null;

  const cleanName = itemName.toLowerCase().trim();
  const normName = normalizeText(itemName);
  const cleanCode = (itemCode || '').toLowerCase().trim();

  // 1. Direct code match
  if (cleanCode) {
    const directCode = materials.find((m) => m.code.toLowerCase() === cleanCode);
    if (directCode) return directCode;
  }

  // 2. Code inside item name
  const codeInName = materials.find((m) => {
    const mCode = m.code.toLowerCase();
    return cleanName.includes(mCode) || (mCode.length > 6 && cleanName.includes(mCode.slice(3)));
  });
  if (codeInName) return codeInName;

  // 3. Exact name match
  const exactName = materials.find((m) => m.name.toLowerCase() === cleanName);
  if (exactName) return exactName;

  // 4. Exact normalized name match
  const exactNorm = materials.find((m) => normalizeText(m.name) === normName);
  if (exactNorm) return exactNorm;

  // 5. Significant substring match
  const subMatch = materials.find((m) => {
    const mNorm = normalizeText(m.name);
    return (mNorm.length >= 10 && normName.includes(mNorm)) || (normName.length >= 10 && mNorm.includes(normName));
  });
  if (subMatch) return subMatch;

  // 6. Token overlap scoring with high threshold
  const itemTokens = normName.split(' ').filter((w) => w.length >= 2);
  if (itemTokens.length === 0) return null;

  let bestMatch: Material | null = null;
  let bestScore = 0;

  for (const mat of materials) {
    const matTokens = normalizeText(mat.name + ' ' + (mat.specification || ''))
      .split(' ')
      .filter((w) => w.length >= 2);
    if (matTokens.length === 0) continue;

    let matchCount = 0;
    for (const token of itemTokens) {
      if (matTokens.includes(token)) {
        matchCount++;
      }
    }

    const score = matchCount / Math.max(itemTokens.length, 3);
    // Strict threshold: score must be at least 0.60
    if (score > bestScore && score >= 0.60) {
      bestScore = score;
      bestMatch = mat;
    }
  }

  return bestMatch;
}

/**
 * Generate a clean standard code from material name
 */
export function generateSuggestedCode(name: string, index: number): string {
  const norm = normalizeText(name);
  const words = norm.split(' ').filter((w) => w.length >= 2);
  let prefix = 'VT';
  let tag = 'MAT';

  if (words.some((w) => ['dong', 'ho', 'ampe', 'kim', 'may', 'han', 'kiem', 'tra'].includes(w))) {
    prefix = 'CC';
  } else if (words.some((w) => ['den', 'chieu', 'sang', 'pha', 'led', 'tup'].includes(w))) {
    prefix = 'VT';
  }

  if (words.length > 0) {
    tag = words
      .slice(0, 2)
      .map((w) => w.slice(0, 4).toUpperCase())
      .join('');
  }

  const num = (index + 1).toString().padStart(2, '0');
  return `DN_${prefix}_${tag.slice(0, 5)}_${num}`;
}

/**
 * Parse HTML tables or raw text extracted from .docx by Mammoth
 */
export function parseDocxHtml(
  docHtml: string,
  rawText: string,
  materials: Material[]
): ExtractedProposalData {
  let detectedPropNum = '';
  let detectedTitle = '';
  let detectedPartner = 'Đội Điện Nước Công Trình';
  let detectedReason = '';
  let detectedDate = '';
  const detectedItems: ExtractedProposalItem[] = [];

  const allText = (rawText || docHtml || '').replace(/<[^>]+>/g, ' ');

  // 1. Extract proposal number (e.g. 29-DNCT/PKT, 29/TTr-DNCT, 17-DNCT/PKT, 26-DNCT/PKT, 31-DNCT/PKT, 08-DNCT/PKT, 45-DNCT/PKT, etc.)
  const propNumMatch =
    allText.match(
      /(?:tờ\s*trình\s*(?:số)?|số\s*hiệu|số)\s*[:.]?\s*([0-9]{1,4}(?:[/-][a-zA-Z0-9_/-Đđ]+)?)/i
    ) || allText.match(/([0-9]{1,4}[/-][A-Za-z0-9_/-Đđ]+)/i);

  if (propNumMatch && propNumMatch[1]) {
    let num = propNumMatch[1].trim().toUpperCase();
    if (/^\d{1,4}$/.test(num)) {
      num = `${num}-DNCT/PKT`;
    }
    detectedPropNum = num;
  }

  // 2. Extract title / subject (V/v: ...)
  const titleMatch = allText.match(/(?:V\/v|Về\s*việc)\s*[:.]?\s*([^\n\r.]+)/i);
  if (titleMatch && titleMatch[1]) {
    detectedTitle = titleMatch[1].trim();
  }

  // 3. Extract date (Ngày ... tháng ... năm ...)
  const dateMatch = allText.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
  if (dateMatch) {
    const d = dateMatch[1].padStart(2, '0');
    const m = dateMatch[2].padStart(2, '0');
    const y = dateMatch[3];
    detectedDate = `${y}-${m}-${d}`;
  }

  // 4. Parse HTML table rows from Mammoth HTML
  if (docHtml) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(docHtml, 'text/html');
      const tables = Array.from(doc.querySelectorAll('table'));

      // Filter and score each table to find the ACTUAL materials table
      const scoredTables = tables.map((table) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        let score = 0;
        let hasHeaderKeywords = false;
        let adminRowCount = 0;

        for (let rIdx = 0; rIdx < Math.min(3, rows.length); rIdx++) {
          const cellsText = Array.from(rows[rIdx].querySelectorAll('th, td'))
            .map((c) => (c.textContent || '').toLowerCase().trim())
            .join(' ');

          if (
            cellsText.includes('tên vật tư') ||
            cellsText.includes('mô tả') ||
            cellsText.includes('quy cách') ||
            cellsText.includes('mặt hàng') ||
            cellsText.includes('danh mục') ||
            cellsText.includes('đvt') ||
            cellsText.includes('số lượng') ||
            cellsText.includes('khối lượng') ||
            cellsText.includes('đơn giá') ||
            cellsText.includes('mã vt') ||
            cellsText.includes('mã số')
          ) {
            hasHeaderKeywords = true;
            score += 10;
          }
        }

        // Check if rows look like administrative key-value pairs
        for (const row of rows) {
          const firstCell = (row.querySelector('td, th')?.textContent || '').toLowerCase().trim();
          if (isAdministrativeText(firstCell)) {
            adminRowCount++;
          }
        }

        if (rows.length >= 2) score += rows.length * 2;
        if (adminRowCount > rows.length * 0.4) score -= 20;

        return { table, score, hasHeaderKeywords, rowsCount: rows.length };
      });

      // Sort tables by highest score
      scoredTables.sort((a, b) => b.score - a.score);

      for (const { table, score } of scoredTables) {
        if (score < 5) continue; // Skip tables that are obviously administrative or empty

        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 2) continue;

        // Detect column indices from header row
        let sttCol = -1;
        let codeCol = -1;
        let nameCol = -1;
        let unitCol = -1;
        let qtyCol = -1;
        let priceCol = -1;
        let totalCol = -1;
        let noteCol = -1;
        let headerRowIndex = -1;

        for (let rIdx = 0; rIdx < Math.min(5, rows.length); rIdx++) {
          const headerCells = Array.from(rows[rIdx].querySelectorAll('th, td')).map((c) =>
            (c.textContent || '').toLowerCase().trim()
          );

          headerCells.forEach((text, cIdx) => {
            if (text.includes('stt') || text === 'tt' || text === 'no' || text === 'số tt') {
              sttCol = cIdx;
            } else if (text.includes('mã chi phí') || text.includes('mã cp')) {
              // Ignore expense code column
            } else if (
              text.includes('mã vật tư') ||
              text.includes('mã vt') ||
              text.includes('mã hàng') ||
              text.includes('mã số') ||
              text.includes('ký hiệu')
            ) {
              codeCol = cIdx;
            } else if (
              text.includes('mô tả') ||
              text.includes('mặt hàng') ||
              text.includes('tên vật tư') ||
              text.includes('tên hàng') ||
              text.includes('quy cách') ||
              text.includes('danh mục') ||
              text.includes('nội dung') ||
              text.includes('chủng loại') ||
              text.includes('tên')
            ) {
              if (nameCol === -1) nameCol = cIdx;
            } else if (text.includes('đvt') || text.includes('đơn vị') || text === 'đv') {
              unitCol = cIdx;
            } else if (
              text.includes('số lượng dự kiến') ||
              text.includes('số lượng đề xuất') ||
              text.includes('số lượng yêu cầu') ||
              text.includes('sl dự kiến') ||
              text.includes('khối lượng')
            ) {
              qtyCol = cIdx;
            } else if (
              (text.includes('số lượng') || text.includes('sl')) &&
              !text.includes('tồn') &&
              qtyCol === -1
            ) {
              qtyCol = cIdx;
            } else if (
              text.includes('đơn giá') ||
              text.includes('don gia') ||
              text.includes('đơn giá (vnđ)') ||
              text.includes('đơn giá dự toán') ||
              text.includes('đơn giá chào') ||
              text.includes('đơn giá mua') ||
              text.includes('đơn giá vat') ||
              text.includes('đơn giá (đ)') ||
              text.includes('đơn giá (đồng)') ||
              text.includes('unit price') ||
              text === 'giá' ||
              text === 'gia' ||
              text === 'giá tiền' ||
              text === 'price'
            ) {
              priceCol = cIdx;
            } else if (
              text.includes('thành tiền') ||
              text.includes('thanh tien') ||
              text.includes('tổng tiền') ||
              text.includes('tong tien') ||
              text.includes('thành tiền (vnđ)') ||
              text.includes('total amount') ||
              text.includes('tổng cộng (vnđ)')
            ) {
              totalCol = cIdx;
            } else if (text.includes('ghi chú') || text.includes('note') || text.includes('phạm vi')) {
              noteCol = cIdx;
            }
          });

          if (nameCol !== -1 && (qtyCol !== -1 || unitCol !== -1 || headerCells.length >= 3)) {
            headerRowIndex = rIdx;
            break;
          }
        }

        // Process data rows
        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;
        for (let rIdx = startRow; rIdx < rows.length; rIdx++) {
          const cells = Array.from(rows[rIdx].querySelectorAll('td, th')).map((c) =>
            (c.textContent || '').trim()
          );
          if (cells.length < 2) continue;

          // Extract row values
          let rawName = nameCol !== -1 && cells[nameCol] ? cells[nameCol] : '';
          let rawCode = codeCol !== -1 && cells[codeCol] ? cells[codeCol] : '';
          let rawUnit = unitCol !== -1 && cells[unitCol] ? cells[unitCol] : '';
          let rawQtyStr = qtyCol !== -1 && cells[qtyCol] ? cells[qtyCol] : '';
          let rawPriceStr = priceCol !== -1 && cells[priceCol] ? cells[priceCol] : '';
          let rawTotalStr = totalCol !== -1 && cells[totalCol] ? cells[totalCol] : '';
          let rawNote = noteCol !== -1 && cells[noteCol] ? cells[noteCol] : '';

          // Deduce name if header index was missed
          if (!rawName) {
            let maxLen = 0;
            cells.forEach((c, idx) => {
              if (idx !== sttCol && idx !== codeCol && c.length > maxLen && !/^\d+([.,]\d+)?$/.test(c)) {
                maxLen = c.length;
                rawName = c;
              }
            });
          }

          // Skip if row is administrative or section title
          if (isAdministrativeText(rawName)) {
            continue;
          }

          // Skip section / category divider rows like "I. Vận hành hệ thống...", "II. Vận hành..."
          const isSectionHeader =
            /^(I|II|III|IV|V|VI|VII|VIII|IX|X)[\.\s\:\-]/i.test(rawName) ||
            /^(hệ thống|hạng mục|phân hệ|giai đoạn|khu vực)/i.test(rawName);
          if (isSectionHeader && !rawCode && !rawQtyStr) {
            continue;
          }

          // If code is in another cell (e.g. if code column had DN_*)
          if (!rawCode) {
            const foundCodeCell = cells.find((c) => /^(DN|CD)_[A-Z0-9_]+/i.test(c.trim()));
            if (foundCodeCell) {
              const m = foundCodeCell.match(/(?:DN|CD)_[A-Za-z0-9_]+/i);
              if (m) rawCode = m[0].toUpperCase();
            }
          }

          // Deduce unit
          if (!rawUnit) {
            const unitCell = cells.find((c) =>
              /^(cái|bộ|mét|m|cuộn|cây|thùng|hộp|kg|lít|lit|bình|quả|viên|chiếc|ống|thanh|khung|sợi|tấm|đôi|cặp|túi|can|bao|bịch|met)$/i.test(
                c.trim()
              )
            );
            if (unitCell) rawUnit = unitCell.trim();
          }

          // Deduce quantity
          if (!rawQtyStr) {
            for (let idx = 0; idx < cells.length; idx++) {
              if (idx === sttCol || idx === codeCol || idx === priceCol || idx === totalCol) continue;
              const val = cells[idx].replace(/,/g, '.').replace(/\s/g, '');
              const num = parseFloat(val);
              if (!isNaN(num) && num > 0 && num <= 100000 && num !== rIdx) {
                rawQtyStr = cells[idx];
                break;
              }
            }
          }

          // Parse actual quantity
          let qty = 1;
          if (rawQtyStr) {
            const cleanedQty = rawQtyStr
              .replace(/[,.](?=\d{3})/g, '') // remove thousand separators
              .replace(/,/g, '.');
            const parsedQ = parseFloat(cleanedQty);
            if (!isNaN(parsedQ) && parsedQ > 0) {
              qty = parsedQ;
            }
          }

          // Helper to parse currency amount in Vietnamese formats (e.g. 4.850.000, 180,000 đ, 6.500)
          const parseCurrency = (str: string): number => {
            if (!str) return 0;
            let clean = str.trim().replace(/(?:vnđ|vnd|đồng|đ|d)/gi, '').trim();
            clean = clean.replace(/[,.]00$/, ''); // strip decimal cents
            clean = clean.replace(/[\s\.]/g, '').replace(/,/g, '');
            const parsed = parseFloat(clean);
            return !isNaN(parsed) && parsed > 0 ? parsed : 0;
          };

          // Parse unit price
          let price = parseCurrency(rawPriceStr);

          // If unit price not in unit price column, check total amount / qty
          if (price === 0 && rawTotalStr) {
            const totalAmt = parseCurrency(rawTotalStr);
            if (totalAmt > 0 && qty > 0) {
              price = Math.round(totalAmt / qty);
            }
          }

          if (rawName && rawName.length >= 2) {
            // Match with standard catalog
            const matchedMat = findBestMaterialMatch(rawName, rawCode, materials);
            const assignedCode = rawCode
              ? rawCode.toUpperCase().trim()
              : matchedMat
              ? matchedMat.code
              : generateSuggestedCode(rawName, detectedItems.length);
            const assignedName = matchedMat ? matchedMat.name : rawName;
            const assignedUnit = rawUnit || (matchedMat ? matchedMat.unit : 'Cái');
            // Prioritize the actual extracted price from the proposal; fallback to catalog standard price
            const assignedPrice = price > 0 ? price : (matchedMat ? matchedMat.unitPrice : 0);

            detectedItems.push({
              materialCode: assignedCode,
              materialName: assignedName,
              quantity: qty,
              unit: assignedUnit,
              unitPrice: assignedPrice,
              notes: rawNote || `Trích xuất từ Tờ trình ${detectedPropNum || ''}`,
            });
          }
        }

        // If this table yielded real materials, stop searching other tables
        if (detectedItems.length > 0) {
          break;
        }
      }
    } catch (e) {
      console.warn('parseDocxHtml DOM parsing error:', e);
    }
  }

  // 5. Fallback line parser for plain text
  if (detectedItems.length === 0 && allText) {
    const lines = allText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (isAdministrativeText(line)) continue;

      const itemMatch = line.match(
        /^(\d{1,2})[.\s\-]+([^\d\n\r]+?)(?:[-:|,\t]+|\s{2,})(?:(?:sl|số\s*lượng|khối\s*lượng)[:\s]*)?(\d+(?:[.,]\d+)?)\s*([a-zA-Zà-ỹÀ-Ỹ]+)?/i
      );
      if (itemMatch) {
        const rawName = itemMatch[2].trim();
        const rawQtyStr = itemMatch[3];
        const rawUnit = (itemMatch[4] || '').trim();

        if (rawName.length >= 3 && !isAdministrativeText(rawName)) {
          const qty = parseFloat(rawQtyStr.replace(/,/g, '.')) || 1;
          const matchedMat = findBestMaterialMatch(rawName, '', materials);

          detectedItems.push({
            materialCode: matchedMat
              ? matchedMat.code
              : generateSuggestedCode(rawName, detectedItems.length),
            materialName: matchedMat ? matchedMat.name : rawName,
            quantity: qty,
            unit: rawUnit || (matchedMat ? matchedMat.unit : 'Cái'),
            unitPrice: matchedMat ? matchedMat.unitPrice : 0,
            notes: `Trích xuất từ văn bản Tờ trình ${detectedPropNum || ''}`,
          });
        }
      }
    }
  }

  return {
    proposalNumber: detectedPropNum,
    title:
      detectedTitle ||
      (detectedPropNum ? `Đề xuất mua sắm theo Tờ trình ${detectedPropNum}` : ''),
    partner: detectedPartner,
    reason:
      detectedReason ||
      (detectedPropNum ? `Bổ sung vật tư theo Tờ trình ${detectedPropNum}` : ''),
    date: detectedDate,
    items: detectedItems,
  };
}
