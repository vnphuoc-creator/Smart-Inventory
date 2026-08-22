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
 * Intelligent fuzzy matcher to map extracted document item name/code to standard DN_* catalog
 */
export function findBestMaterialMatch(
  itemName: string,
  itemCode: string,
  materials: Material[]
): Material | null {
  if (!materials || materials.length === 0) return null;

  const cleanName = (itemName || '').toLowerCase().trim();
  const cleanCode = (itemCode || '').toLowerCase().trim();

  // 1. Direct code match
  if (cleanCode) {
    const directCode = materials.find((m) => m.code.toLowerCase() === cleanCode);
    if (directCode) return directCode;
  }

  // 2. Code substring inside item name
  const codeInName = materials.find(
    (m) => cleanName.includes(m.code.toLowerCase()) || (m.code.length > 6 && cleanName.includes(m.code.slice(3).toLowerCase()))
  );
  if (codeInName) return codeInName;

  // 3. Exact name match
  const exactName = materials.find((m) => m.name.toLowerCase() === cleanName);
  if (exactName) return exactName;

  // 4. Token overlap scoring
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);

  const itemTokens = normalize(itemName);
  if (itemTokens.length === 0) return null;

  let bestMatch: Material | null = null;
  let bestScore = 0;

  for (const mat of materials) {
    const matTokens = normalize(mat.name + ' ' + (mat.specification || ''));
    if (matTokens.length === 0) continue;

    let matchCount = 0;
    for (const token of itemTokens) {
      if (matTokens.includes(token)) {
        matchCount++;
      }
    }

    const score = matchCount / Math.max(itemTokens.length, 3);
    if (score > bestScore && score >= 0.25) {
      bestScore = score;
      bestMatch = mat;
    }
  }

  return bestMatch;
}

/**
 * Parse HTML tables extracted from .docx by Mammoth
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

  // 1. Extract proposal number (e.g. 45-DNCT/PKT, 17/TTr-DNCT, 26-DNCT/PKT, 31-DNCT/PKT, 08-DNCT/PKT, etc.)
  const propNumMatch = allText.match(
    /(?:tờ\s*trình\s*(?:số)?|số\s*hiệu|số)\s*[:.]?\s*([0-9]{1,3}(?:[/-][a-zA-Z0-9_/-]+)?)/i
  ) || allText.match(/([0-9]{1,3}[/-][A-Za-z0-9_/-]+)/i);

  if (propNumMatch && propNumMatch[1]) {
    detectedPropNum = propNumMatch[1].trim().toUpperCase();
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

  // 4. Parse HTML table rows
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
        let noteCol = -1;
        let headerRowIndex = -1;

        for (let rIdx = 0; rIdx < Math.min(3, rows.length); rIdx++) {
          const headerCells = Array.from(rows[rIdx].querySelectorAll('th, td')).map((c) =>
            (c.textContent || '').toLowerCase().trim()
          );

          headerCells.forEach((text, cIdx) => {
            if (text.includes('stt') || text === 'tt' || text === 'no') sttCol = cIdx;
            else if (text.includes('mã') || text.includes('ký hiệu')) codeCol = cIdx;
            else if (
              text.includes('tên') ||
              text.includes('vật tư') ||
              text.includes('quy cách') ||
              text.includes('danh mục') ||
              text.includes('hàng hóa') ||
              text.includes('nội dung')
            ) {
              nameCol = cIdx;
            } else if (text.includes('đvt') || text.includes('đơn vị')) unitCol = cIdx;
            else if (
              text.includes('số lượng') ||
              text.includes('sl') ||
              text.includes('khối lượng') ||
              text.includes('yêu cầu')
            ) {
              qtyCol = cIdx;
            } else if (text.includes('đơn giá') || text.includes('giá')) priceCol = cIdx;
            else if (text.includes('ghi chú') || text.includes('note')) noteCol = cIdx;
          });

          if (nameCol !== -1 && (qtyCol !== -1 || unitCol !== -1)) {
            headerRowIndex = rIdx;
            break;
          }
        }

        // Process data rows
        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
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

          // If header wasn't clearly identified, deduce values from cell characteristics
          if (!rawName) {
            // Find longest text cell
            let maxLen = 0;
            cells.forEach((c, idx) => {
              if (idx !== sttCol && c.length > maxLen && !/^\d+([.,]\d+)?$/.test(c)) {
                maxLen = c.length;
                rawName = c;
              }
            });
          }

          if (!rawQtyStr) {
            // Find numeric cell that is not STT and not large price
            for (let idx = 0; idx < cells.length; idx++) {
              if (idx === sttCol || idx === codeCol) continue;
              const val = cells[idx].replace(/,/g, '.').replace(/\s/g, '');
              const num = parseFloat(val);
              if (!isNaN(num) && num > 0 && num <= 10000 && num !== rIdx) {
                rawQtyStr = cells[idx];
                break;
              }
            }
          }

          if (!rawUnit) {
            const unitCell = cells.find((c) =>
              /^(cái|bộ|mét|m|cuộn|cây|thùng|hộp|kg|lít|bình|quả|viên|chiếc|ống)$/i.test(c.trim())
            );
            if (unitCell) rawUnit = unitCell.trim();
          }

          if (rawName && rawName.length >= 2 && !/^(stt|tổng|cộng|bằng chữ)/i.test(rawName)) {
            // Parse cleaned numeric quantity
            let qty = 1;
            if (rawQtyStr) {
              const cleanedQty = rawQtyStr
                .replace(/[,.](?=\d{3})/g, '') // remove thousand dots/commas
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

            // Find matching material from catalog
            const matchedMat = findBestMaterialMatch(rawName, rawCode, materials);

            detectedItems.push({
              materialCode: matchedMat ? matchedMat.code : rawCode || `DN_VT_${detectedItems.length + 1}`,
              materialName: matchedMat ? matchedMat.name : rawName,
              quantity: qty,
              unit: rawUnit || (matchedMat ? matchedMat.unit : 'Cái'),
              unitPrice: price || (matchedMat ? matchedMat.unitPrice : 0),
              notes: rawNote || `Quét từ Tờ trình ${detectedPropNum || ''}`,
            });
          }
        }
      }
    } catch (e) {
      console.warn('parseDocxHtml DOM parsing error:', e);
    }
  }

  // 5. Fallback: Parse plain text lines if no table rows were extracted
  if (detectedItems.length === 0 && allText) {
    const lines = allText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Look for lines like "1. Dây cáp điện CV-4.0 - SL: 50 Cái - Đơn giá: 25.000"
      // or "DN_DD_CV_40 | Dây CV 4.0 | 50 | Mét"
      const itemMatch = line.match(/^(\d{1,2})[.\s\-]+([^\d\n\r]+?)(?:[-:|,\t]+|\s{2,})(?:(?:sl|số\s*lượng|khối\s*lượng)[:\s]*)?(\d+(?:[.,]\d+)?)\s*([a-zA-Zà-ỹÀ-Ỹ]+)?/i);
      if (itemMatch) {
        const rawName = itemMatch[2].trim();
        const rawQtyStr = itemMatch[3];
        const rawUnit = (itemMatch[4] || '').trim();

        if (rawName.length >= 3 && !/^(stt|tổng|cộng|ngày|kính|thay|căn)/i.test(rawName)) {
          const qty = parseFloat(rawQtyStr.replace(/,/g, '.')) || 1;
          const matchedMat = findBestMaterialMatch(rawName, '', materials);

          detectedItems.push({
            materialCode: matchedMat ? matchedMat.code : `DN_VT_${detectedItems.length + 1}`,
            materialName: matchedMat ? matchedMat.name : rawName,
            quantity: qty,
            unit: rawUnit || (matchedMat ? matchedMat.unit : 'Cái'),
            unitPrice: matchedMat ? matchedMat.unitPrice : 0,
            notes: `Trích xuất từ dòng văn bản`,
          });
        }
      }
    }
  }

  return {
    proposalNumber: detectedPropNum,
    title: detectedTitle || (detectedPropNum ? `Đề xuất mua sắm theo Tờ trình ${detectedPropNum}` : ''),
    partner: detectedPartner,
    reason: detectedReason || (detectedPropNum ? `Bổ sung vật tư theo Tờ trình ${detectedPropNum}` : ''),
    date: detectedDate,
    items: detectedItems,
  };
}
