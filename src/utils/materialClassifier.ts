import { Material } from '../types';
import { ALL_MATERIAL_CATEGORIES } from '../data/materialsData';

/**
 * Remove Vietnamese accents and special symbols for robust string comparison
 */
export function normalizeVietnameseString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Standardize material units to clean Vietnamese standard units
 */
export function standardizeUnit(rawUnit: string): string {
  if (!rawUnit) return 'Cái';
  const u = rawUnit.trim().toLowerCase();
  if (u.includes('mét') || u.includes('met') || u === 'm' || u === 'm.') return 'Mét';
  if (u.includes('cái') || u.includes('cai') || u === 'ea' || u === 'pc' || u === 'pcs') return 'Cái';
  if (u.includes('bộ') || u.includes('bo') || u === 'set') return 'Bộ';
  if (u.includes('cây') || u.includes('cay')) return 'Cây';
  if (u.includes('cuộn') || u.includes('cuon') || u === 'roll') return 'Cuộn';
  if (u.includes('hộp') || u.includes('hop') || u === 'box') return 'Hộp';
  if (u.includes('thùng') || u.includes('thung') || u === 'ctn') return 'Thùng';
  if (u.includes('bình') || u.includes('binh')) return 'Bình';
  if (u.includes('chai')) return 'Chai';
  if (u.includes('can')) return 'Can';
  if (u.includes('bao') || u.includes('bag')) return 'Bao';
  if (u.includes('kg') || u.includes('kilo')) return 'Kg';
  if (u.includes('lít') || u.includes('lit') || u === 'l') return 'Lít';
  if (u.includes('tấm') || u.includes('tam')) return 'Tấm';
  if (u.includes('sợi') || u.includes('soi')) return 'Sợi';
  if (u.includes('đôi') || u.includes('cặp')) return 'Đôi';
  if (u.includes('gói') || u.includes('bịch')) return 'Gói';
  
  // Return title case of rawUnit
  return rawUnit.charAt(0).toUpperCase() + rawUnit.slice(1);
}

/**
 * Intelligent Category Classification Engine
 * Analyzes name, specifications, and keywords to automatically pick the right AHT Category
 */
export function classifyMaterialCategory(name: string, spec: string = ''): string {
  const combined = (name + ' ' + spec).toLowerCase();

  // 1. Thiết bị vệ sinh & Xử lý nước
  if (
    combined.includes('toto') ||
    combined.includes('inax') ||
    combined.includes('lavabo') ||
    combined.includes('vòi chậu') ||
    combined.includes('vòi rửa') ||
    combined.includes('vòi cảm ứng') ||
    combined.includes('vòi xịt') ||
    combined.includes('xiphong') ||
    combined.includes('xi phông') ||
    combined.includes('tiểu nam') ||
    combined.includes('bồn tiểu') ||
    combined.includes('bệ xí') ||
    combined.includes('bồn cầu') ||
    combined.includes('bệt vệ sinh') ||
    combined.includes('nắp bệt') ||
    combined.includes('van xả tiểu') ||
    combined.includes('thoát sàn') ||
    combined.includes('bơm chìm') ||
    combined.includes('bơm thải') ||
    combined.includes('bơm bù áp') ||
    combined.includes('bơm tăng áp') ||
    combined.includes('lõi lọc') ||
    combined.includes('cột lọc') ||
    combined.includes('phao điện') ||
    combined.includes('van phao') ||
    combined.includes('màng lọc ro')
  ) {
    return 'Thiết bị vệ sinh & Xử lý nước';
  }

  // 2. Vật tư Đường ống & Phụ kiện cấp thoát nước
  if (
    combined.includes('ống ppr') ||
    combined.includes('ống upvc') ||
    combined.includes('ống pvc') ||
    combined.includes('ống hdpe') ||
    combined.includes('ống thép mạ kẽm') ||
    combined.includes('ống mềm') ||
    combined.includes('ống nước') ||
    combined.includes('tiền phong') ||
    combined.includes('bình minh') ||
    combined.includes('van bướm') ||
    combined.includes('van bi') ||
    combined.includes('van cổng') ||
    combined.includes('van một chiều') ||
    combined.includes('van 1 chiều') ||
    combined.includes('van giảm áp') ||
    combined.includes('van an toàn') ||
    combined.includes('van xả khí') ||
    combined.includes('khớp nối mềm') ||
    combined.includes('rọ bơm') ||
    combined.includes('lọc y') ||
    combined.includes('đồng hồ nước') ||
    combined.includes('đồng hồ đo lưu lượng') ||
    combined.includes('co lơ') ||
    combined.includes('co 90') ||
    combined.includes('co 45') ||
    combined.includes('tê thu') ||
    combined.includes('tê đều') ||
    combined.includes('măng sông') ||
    combined.includes('cút hàn') ||
    combined.includes('rắc co') ||
    combined.includes('đai khởi thủy') ||
    combined.includes('bịt xả') ||
    combined.includes('băng tan') ||
    combined.includes('cao su non') ||
    combined.includes('keo dán ống') ||
    combined.includes('mặt bích')
  ) {
    return 'Vật tư Đường ống & Phụ kiện cấp thoát nước';
  }

  // 3. Hệ thống Chiếu sáng & Đèn công trình
  if (
    combined.includes('đèn') ||
    combined.includes('led') ||
    combined.includes('highbay') ||
    combined.includes('downlight') ||
    combined.includes('panel') ||
    combined.includes('pha chiếu') ||
    combined.includes('chiếu sáng') ||
    combined.includes('tuýp') ||
    combined.includes('tube') ||
    combined.includes('exit') ||
    combined.includes('thoát hiểm') ||
    combined.includes('thoát nạn') ||
    combined.includes('khẩn cấp') ||
    combined.includes('sự cố') ||
    combined.includes('chấn lưu') ||
    combined.includes('ballast') ||
    combined.includes('driver led') ||
    combined.includes('nguồn led') ||
    combined.includes('máng đèn') ||
    combined.includes('chóa đèn') ||
    combined.includes('bóng đèn') ||
    combined.includes('rạng đông') ||
    combined.includes('philips') ||
    combined.includes('paragon') ||
    combined.includes('duhal')
  ) {
    return 'Hệ thống Chiếu sáng & Đèn công trình';
  }

  // 4. Thiết bị Điện & Trạm trung thế
  if (
    combined.includes('máy biến áp') ||
    combined.includes('biến áp') ||
    combined.includes('trạm biến áp') ||
    combined.includes('trung thế') ||
    combined.includes('tủ điện msb') ||
    combined.includes('tủ phân phối') ||
    combined.includes('tủ hòa đồng bộ') ||
    combined.includes('tụ bù') ||
    combined.includes('cuộn kháng') ||
    combined.includes('máy cắt acb') ||
    combined.includes('acb') ||
    combined.includes('mccb') ||
    combined.includes('contactor') ||
    combined.includes('khởi động từ') ||
    combined.includes('rơ le bảo vệ') ||
    combined.includes('role bảo vệ') ||
    combined.includes('rơle nhiệt') ||
    combined.includes('đồng hồ mfm') ||
    combined.includes('selec') ||
    combined.includes('schneider') ||
    combined.includes('mitsubishi') ||
    combined.includes('abb') ||
    combined.includes('siemens') ||
    combined.includes('bộ lưu điện') ||
    combined.includes('ups') ||
    combined.includes('ats') ||
    combined.includes('tủ ats')
  ) {
    return 'Thiết bị Điện & Trạm trung thế';
  }

  // 5. Mặc định: Vật tư Điện & Phụ kiện tiêu hao
  return 'Vật tư Điện & Phụ kiện tiêu hao';
}

/**
 * Deduplication Engine:
 * Compares an imported item against the existing inventory database.
 * Returns the matched material if found, or null if it's new.
 */
export function findExistingMaterialMatch(
  item: { code?: string; name: string; unit?: string },
  existingMaterials: Material[]
): { isMatch: boolean; matchedMaterial?: Material; matchReason?: 'EXACT_CODE' | 'EXACT_NAME' | 'SIMILAR_NAME' } {
  const code = (item.code || '').trim().toUpperCase();
  const nameNorm = normalizeVietnameseString(item.name);

  // 1. Check exact Material Code match
  if (code) {
    const byCode = existingMaterials.find((m) => m.code.toUpperCase() === code);
    if (byCode) {
      return { isMatch: true, matchedMaterial: byCode, matchReason: 'EXACT_CODE' };
    }
  }

  if (!nameNorm) {
    return { isMatch: false };
  }

  // 2. Check exact normalized name match
  const byExactName = existingMaterials.find((m) => {
    const mNameNorm = normalizeVietnameseString(m.name);
    return mNameNorm === nameNorm;
  });

  if (byExactName) {
    return { isMatch: true, matchedMaterial: byExactName, matchReason: 'EXACT_NAME' };
  }

  // 3. High similarity match (> 85% overlap words)
  const itemWords = new Set(nameNorm.split(' ').filter((w) => w.length > 1));
  if (itemWords.size >= 3) {
    for (const m of existingMaterials) {
      const mWords = new Set(normalizeVietnameseString(m.name).split(' ').filter((w) => w.length > 1));
      let intersection = 0;
      itemWords.forEach((w) => {
        if (mWords.has(w)) intersection++;
      });
      const similarity = (2 * intersection) / (itemWords.size + mWords.size);
      if (similarity >= 0.88) {
        return { isMatch: true, matchedMaterial: m, matchReason: 'SIMILAR_NAME' };
      }
    }
  }

  return { isMatch: false };
}

/**
 * Generate a clean, standardized AHT material code starting with DN_
 */
export function generateNextMaterialCode(
  category: string,
  existingMaterials: Material[],
  itemName: string = ''
): string {
  // Category-based code prefix
  let prefix = 'DN_VT';
  if (category.includes('Chiếu sáng')) {
    prefix = 'DN_DEN';
  } else if (category.includes('Trạm trung thế') || category.includes('Thiết bị Điện')) {
    prefix = 'DN_TB';
  } else if (category.includes('Đường ống')) {
    prefix = 'DN_ONG';
  } else if (category.includes('vệ sinh')) {
    prefix = 'DN_VS';
  } else if (category.includes('tiêu hao') || category.includes('Điện')) {
    prefix = 'DN_DD';
  }

  // Create a short acronym from item name if available
  let nameTag = '';
  if (itemName) {
    const clean = normalizeVietnameseString(itemName).toUpperCase();
    const words = clean.split(' ').filter(Boolean);
    if (words.length > 0) {
      nameTag = '_' + words.slice(0, 2).map((w) => w.slice(0, 3)).join('');
    }
  }

  // Find maximum numeric index for this prefix
  const existingCodes = new Set(existingMaterials.map((m) => m.code.toUpperCase()));
  let counter = existingMaterials.length + 1;

  while (true) {
    const candidate = `${prefix}${nameTag}_${String(counter).padStart(3, '0')}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
    counter++;
  }
}
