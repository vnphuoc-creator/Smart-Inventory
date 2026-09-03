/**
 * Material and Catalog Data Quality & Validation Filters
 * Dedicated to screening out section headers, cost centers (CP*),
 * and non-material administrative categories during import/scan.
 */

function removeVietnameseTones(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Returns true if a row/code/name represents a section header,
 * administrative line, cost center (CP*), or expense category rather than a valid technical material.
 */
export function isNonMaterialOrCategoryRow(data: {
  name?: string;
  code?: string;
  unit?: string;
  quantity?: number;
  specification?: string;
}): boolean {
  const rawName = (data.name || '').trim();
  const rawCode = (data.code || '').trim();
  const rawUnit = (data.unit || '').trim();

  // If both name and code are virtually empty
  if (rawName.length < 2 && rawCode.length < 2) return true;

  const normName = removeVietnameseTones(rawName);
  const normCode = removeVietnameseTones(rawCode);

  // 1. Explicit matches for system operation headers & cost centers
  // e.g. "Vận hành hệ thống Chiếu sáng", "Vận hành hệ thống Hạ thế", "Vận hành hệ thống Trung thế",
  // "Vận hành hệ thống Thiết bị vệ sinh", "Chi phí công cụ dụng cụ", etc.
  const invalidCategoryPrefixes = [
    'van hanh he thong',
    'van hanh',
    'chi phi cong cu dung cu',
    'chi phi cong cu',
    'chi phi dung cu',
    'chi phi mua sam',
    'chi phi sua chua',
    'chi phi nhan cong',
    'chi phi quan ly',
    'chi phi thiet bi',
    'chi phi phat sinh',
    'chi phi khac',
    'chi phi',
    'hang muc cong viec',
    'hang muc thuc hien',
    'hang muc',
    'phan he he thong',
    'phan he',
    'giai doan',
    'cong tac sua chua',
    'cong tac bao duong',
    'noi dung thuc hien',
    'du toan kinh phi',
    'du toan',
    'kinh phi',
    'tong cong',
    'tong so',
    'bang chu',
    'ghi chu',
    'chu ky',
    'can cu',
    'kinh gui',
    'to trinh so',
    'so to trinh',
    'nguoi lap bieu',
    'truong phong',
    'pho truong phong',
    'giam doc',
    'thu kho',
  ];

  for (const prefix of invalidCategoryPrefixes) {
    if (normName === prefix || normName.startsWith(prefix + ' ') || normName.startsWith(prefix + ':') || normName.startsWith(prefix + '-')) {
      return true;
    }
    if (normCode === prefix || normCode.startsWith(prefix + ' ') || normCode.startsWith(prefix + '_')) {
      return true;
    }
  }

  // Check if name is exactly or begins with Roman numeral section headers like "I. ...", "II. ...", "III. ..."
  if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)[\.\s\:\-]/i.test(rawName)) {
    // If it mentions "vận hành", "hệ thống", "chi phí", "thiết bị", "công cụ", it's 100% a header
    if (/van hanh|he thong|chi phi|dung cu|thiet bi|hang muc|cong cu/i.test(normName)) {
      return true;
    }
    // If it doesn't have a valid technical code or unit
    if (!rawCode.startsWith('DN_') && (!rawUnit || rawUnit === '-' || normName.length < 15)) {
      return true;
    }
  }

  // 2. Standalone system category titles that lack concrete technical specs
  const standaloneSystemTitles = [
    'he thong chieu sang',
    'he thong ha the',
    'he thong trung the',
    'he thong thiet bi ve sinh',
    'he thong cap thoat nuoc',
    'he thong pccc',
    'he thong dien lanh',
    'he thong thong gio',
  ];
  if (standaloneSystemTitles.some((t) => normName === t || normName === `${t} toa nha` || normName === `${t} san do`)) {
    return true;
  }

  // 3. Cost Center codes: "CP101-*", "CP102-*" (AHT budget codes, NOT materials)
  if (/^CP\d{2,4}[-_]/i.test(rawCode)) {
    // Unless this row specifically has an actual DN_* material code elsewhere and technical specs
    if (!/DN_[A-Z0-9_]+/i.test(rawCode) && (rawName.includes('Vận hành') || rawName.includes('Chi phí') || !rawUnit)) {
      return true;
    }
  }

  // 4. Check if code itself contains non-standard keywords
  if (
    normCode.includes('van_hanh') ||
    normCode.includes('chi_phi') ||
    normCode.includes('he_thong') ||
    normCode.includes('hang_muc') ||
    normCode.includes('cong_cu')
  ) {
    return true;
  }

  // 5. Code is literally identical to Roman header
  if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(rawCode)) {
    return true;
  }

  return false;
}

/**
 * Filter an array of items to remove any non-material headers or expense lines
 */
export function filterValidMaterialItems<T extends { materialName?: string; materialCode?: string; name?: string; code?: string; unit?: string }>(
  items: T[]
): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    const name = item.materialName || item.name || '';
    const code = item.materialCode || item.code || '';
    const unit = item.unit || '';
    return !isNonMaterialOrCategoryRow({ name, code, unit });
  });
}
