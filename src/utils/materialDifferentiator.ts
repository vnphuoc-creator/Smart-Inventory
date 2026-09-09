/**
 * Material Brand & Visual Differentiator Extractor
 * Phân tích hãng sản xuất và điểm nhận diện đặc trưng chống nhầm lẫn vật tư trong kho
 */

import { Material } from '../types';

export const POPULAR_BRANDS = [
  { name: 'Schneider', aliases: ['schneider', 'schneider electric'], color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { name: 'Omron', aliases: ['omron'], color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { name: 'ABB', aliases: ['abb'], color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { name: 'Siemens', aliases: ['siemens'], color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  { name: 'Bosch', aliases: ['bosch'], color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { name: 'Cadivi', aliases: ['cadivi'], color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { name: 'Panasonic', aliases: ['panasonic'], color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { name: 'Mitsubishi', aliases: ['mitsubishi', 'mitsu'], color: 'bg-red-600/20 text-red-400 border-red-600/40' },
  { name: 'Philips', aliases: ['philips'], color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { name: 'Rạng Đông', aliases: ['rang dong', 'rạng đông', 'rangdong'], color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { name: 'Sino', aliases: ['sino', 'vanlock'], color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { name: 'LS', aliases: ['ls electric', 'ls'], color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { name: 'Fuji', aliases: ['fuji', 'fuji electric'], color: 'bg-blue-600/20 text-blue-400 border-blue-600/40' },
  { name: 'Danfoss', aliases: ['danfoss'], color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { name: 'Honeywell', aliases: ['honeywell'], color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { name: 'Daphaco', aliases: ['daphaco', 'lion'], color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { name: 'Paragon', aliases: ['paragon'], color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { name: 'Makita', aliases: ['makita'], color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  { name: 'Fluke', aliases: ['fluke'], color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { name: '3M', aliases: ['3m'], color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { name: 'Mikro', aliases: ['mikro'], color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { name: 'Chint', aliases: ['chint'], color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
];

/**
 * Extracts or resolves the brand of a material
 */
export function extractBrand(material: Partial<Material>): { name: string; color: string } {
  if (material.brand && material.brand.trim()) {
    const trimmed = material.brand.trim();
    const matched = POPULAR_BRANDS.find((b) =>
      b.aliases.some((a) => trimmed.toLowerCase().includes(a))
    );
    if (matched) return matched;
    return {
      name: trimmed,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    };
  }

  // Scan through name, specification, and notes
  const combined = `${material.name || ''} ${material.specification || ''} ${material.notes || ''}`.toLowerCase();

  for (const b of POPULAR_BRANDS) {
    if (b.aliases.some((a) => combined.includes(a))) {
      return b;
    }
  }

  return {
    name: 'Chính Hãng / Tiêu Chuẩn',
    color: 'bg-slate-800 text-slate-300 border-slate-700',
  };
}

/**
 * Extracts critical differentiators to avoid mix-up during night shifts
 */
export function extractDifferentiators(material: Partial<Material>): string[] {
  const result: string[] = [];
  if (material.differentiator && material.differentiator.trim()) {
    result.push(material.differentiator.trim());
  }

  const combined = `${material.name || ''} ${material.specification || ''} ${material.notes || ''}`.toLowerCase();

  // Voltage
  if (combined.includes('24vdc') || combined.includes('24 vdc') || combined.includes('24v dc')) {
    result.push('⚡ Điện áp: 24VDC (Không dùng cho 220V)');
  } else if (combined.includes('220vac') || combined.includes('220 vac') || combined.includes('220v ac')) {
    result.push('⚡ Điện áp: 220VAC');
  } else if (combined.includes('12vdc') || combined.includes('12 vdc')) {
    result.push('⚡ Điện áp: 12VDC');
  } else if (combined.includes('380vac') || combined.includes('380v')) {
    result.push('⚡ Điện áp: 380VAC (3 Pha)');
  }

  // Head type for screws / bolts
  if (combined.includes('đầu bằng') || combined.includes('dau bang')) {
    result.push('🔩 Đầu BẰNG (Phẳng)');
  } else if (combined.includes('đầu dù') || combined.includes('dau du')) {
    result.push('🔩 Đầu DÙ (Nấm bo cong)');
  } else if (combined.includes('đầu chìm') || combined.includes('dau chim') || combined.includes('lục giác chìm')) {
    result.push('🔩 Đầu Lục Giác CHÌM');
  } else if (combined.includes('đầu tròn') || combined.includes('dau tron')) {
    result.push('🔩 Đầu TRÒN');
  }

  // Pin count for relays
  if (combined.includes('8 chân') || combined.includes('8 chan') || combined.includes('my2n')) {
    result.push('📌 Loại 8 CHÂN cắm (2 Cặp tiếp điểm)');
  } else if (combined.includes('14 chân') || combined.includes('14 chan') || combined.includes('my4n')) {
    result.push('📌 Loại 14 CHÂN cắm (4 Cặp tiếp điểm)');
  } else if (combined.includes('11 chân') || combined.includes('11 chan')) {
    result.push('📌 Loại 11 CHÂN cắm (Tròn 3 cặp)');
  }

  // Cable cosse types
  const cosMatch = combined.match(/sc\s*([0-9]+)\s*[-/]\s*([0-9]+)/);
  if (cosMatch) {
    result.push(`🏷️ Đầu Cos SC${cosMatch[1]}-${cosMatch[2]} (Dây ${cosMatch[1]}mm², lỗ ốc M${cosMatch[2]})`);
  }

  // Poles & Amperage
  const poleMatch = combined.match(/\b([1-4])p\b/);
  const ampMatch = combined.match(/\b([0-9]{1,4})\s*a\b/);
  if (poleMatch || ampMatch) {
    const pStr = poleMatch ? `${poleMatch[1]} Pha (${poleMatch[1]}P)` : '';
    const aStr = ampMatch ? `${ampMatch[1]} Ampe (${ampMatch[1]}A)` : '';
    const joined = [pStr, aStr].filter(Boolean).join(' - ');
    if (joined) result.push(`⚡ ${joined}`);
  }

  return Array.from(new Set(result));
}
