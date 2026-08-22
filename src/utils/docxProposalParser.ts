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
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent fuzzy matcher to map extracted document item name/code to standard DN_* catalog
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

  // 2. Code substring inside item name
  const codeInName = materials.find(
    (m) =>
      cleanName.includes(m.code.toLowerCase()) ||
      (m.code.length > 6 && cleanName.includes(m.code.slice(3).toLowerCase()))
  );
  if (codeInName) return codeInName;

  // 3. Exact name match
  const exactName = materials.find((m) => m.name.toLowerCase() === cleanName);
  if (exactName) return exactName;

  // 4. Exact normalized name match
  const exactNorm = materials.find((m) => normalizeText(m.name) === normName);
  if (exactNorm) return exactNorm;

  // 5. Token overlap scoring with high threshold (>= 0.65 to avoid wrong mapping)
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
    // Strict threshold: score must be at least 0.65 to avoid incorrect mapping
    if (score > bestScore && score >= 0.65) {
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
  let detectedPartner = '';
  let detectedReason = '';
  let detectedDate = '';
  const detectedItems: ExtractedProposalItem[] = [];

  const allText = (rawText || docHtml || '').replace(/<[^>]+>/g, ' ');

  // 1. Extract proposal number (e.g. 29-DNCT/PKT, 29-ĐNCT/PKT, 17-DNCT/PKT, 26-DNCT/PKT, 31-DNCT/PKT, 08-DNCT/PKT, 45-DNCT/PKT, etc.)
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

      for (const table of tables) {
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
              text.includes('mã hiệu') ||
              text.includes('ký hiệu')
            ) {
              codeCol = cIdx;
            } else if (text.includes('mã') && codeCol === -1) {
              codeCol = cIdx;
            } else if (
              text.includes('mô tả chung') ||
              text.includes('mặt hàng') ||
              text.includes('tên vật tư') ||
              text.includes('tên hàng') ||
              text.includes('quy cách') ||
              text.includes('danh mục') ||
              text.includes('hàng hóa') ||
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
            } else if (text.includes('đơn giá') || text === 'giá' || text.includes('đơn giá (vnđ)')) {
              priceCol = cIdx;
            } else if (text.includes('thành tiền') || text.includes('tổng tiền')) {
              totalCol = cIdx;
            } else if (text.includes('ghi chú') || text.includes('note') || text.includes('phạm vi')) {
              noteCol = cIdx;
            }
          });

          if (nameCol !== -1 && (qtyCol !== -1 || unitCol !== -1 || headerCells.length >= 4)) {
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
          let rawNote = noteCol !== -1 && cells[noteCol] ? cells[noteCol] : '';

          // Skip section / category divider rows like "I. Vận hành hệ thống...", "II. Vận hành..."
          const isSectionHeader =
            /^(I|II|III|IV|V|VI|VII|VIII|IX|X)[\.\s\:\-]/i.test(rawName) ||
            /^(hệ thống|hạng mục|phân hệ|giai đoạn|khu vực)/i.test(rawName);
          if (isSectionHeader && !rawCode && !rawQtyStr) {
            continue;
          }

          // If code is in another column (e.g. if code column had DN_*)
          if (!rawCode) {
            const foundCodeCell = cells.find((c) => /^DN_[A-Z0-9_]+/i.test(c.trim()));
            if (foundCodeCell) {
              const m = foundCodeCell.match(/DN_[A-Za-z0-9_]+/);
              if (m) rawCode = m[0].toUpperCase();
            }
          }

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

          if (!rawUnit) {
            const unitCell = cells.find((c) =>
              /^(cái|bộ|mét|m|cuộn|cây|thùng|hộp|kg|lít|lit|bình|quả|viên|chiếc|ống|thanh|khung|sợi|tấm|đôi|cặp|túi|can|bao)$/i.test(
                c.trim()
              )
            );
            if (unitCell) rawUnit = unitCell.trim();
          }

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

          // Parse price
          let price = 0;
          if (rawPriceStr) {
            const cleanedPrice = rawPriceStr.replace(/[^0-9]/g, '');
            const parsedP = parseFloat(cleanedPrice);
            if (!isNaN(parsedP)) price = parsedP;
          }

          // Ignore summary / total rows
          const isTotalRow = /^(tổng|tổng\s*cộng|cộng|bằng\s*chữ|stt|thuế)/i.test(rawName);

          if (rawName && rawName.length >= 2 && !isTotalRow) {
            // Match with catalog
            const matchedMat = findBestMaterialMatch(rawName, rawCode, materials);
            const assignedCode = rawCode
              ? rawCode.toUpperCase().trim()
              : matchedMat
              ? matchedMat.code
              : generateSuggestedCode(rawName, detectedItems.length);
            const assignedName = rawName || (matchedMat ? matchedMat.name : rawName);
            const assignedUnit = rawUnit || (matchedMat ? matchedMat.unit : 'Cái');
            const assignedPrice = price || (matchedMat ? matchedMat.unitPrice : 0);

            detectedItems.push({
              materialCode: assignedCode,
              materialName: assignedName,
              quantity: qty,
              unit: assignedUnit,
              unitPrice: assignedPrice,
              notes: rawNote || `Quét từ Tờ trình ${detectedPropNum || ''}`,
            });
          }
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
      const itemMatch = line.match(
        /^(\d{1,2})[.\s\-]+([^\d\n\r]+?)(?:[-:|,\t]+|\s{2,})(?:(?:sl|số\s*lượng|khối\s*lượng)[:\s]*)?(\d+(?:[.,]\d+)?)\s*([a-zA-Zà-ỹÀ-Ỹ]+)?/i
      );
      if (itemMatch) {
        const rawName = itemMatch[2].trim();
        const rawQtyStr = itemMatch[3];
        const rawUnit = (itemMatch[4] || '').trim();

        if (rawName.length >= 3 && !/^(stt|tổng|cộng|ngày|kính|thay|căn)/i.test(rawName)) {
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
