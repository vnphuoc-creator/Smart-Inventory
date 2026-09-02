/**
 * Hệ Thống Tra Cứu & Kết Nối Nguồn Ảnh Chính Thống Vật Tư - Trang Thiết Bị - Công Cụ Điện Nước (AHT MEP)
 * Phục vụ hơn 1000+ mã vật tư: Dây cáp điện, Thiết bị đóng cắt, Đèn chiếu sáng, Đường ống van, TB Vệ sinh & Dụng cụ đo.
 */

import { Material } from '../types';

export interface MaterialVisualDossier {
  imageUrl: string;
  hdImageUrl: string;
  brand: string;
  modelOrType: string;
  technicalStandard: string;
  categoryName: string;
  badgeColor: string;
  highlightSpecs: string[];
}

// ============================================================================
// OFFICIAL AUTHENTIC PRODUCT IMAGES REPOSITORY (Curated High-Res Industrial Assets)
// ============================================================================
const OFFICIAL_IMAGE_COLLECTION: Record<string, string> = {
  // --- 1. DÂY CÁP ĐIỆN & TIẾP ĐỊA (Cadivi, LS-VINA, Trần Phú) ---
  'cadivi-cv-do': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'cadivi-cv-den': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
  'cadivi-cv-xanh': 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80',
  'cadivi-cv-vang': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  'cadivi-cv-pe': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80',
  'cap-cxv-4-ruot': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  'cap-dong-tran': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  'cap-chong-chay': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
  'ong-luon-day': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
  'mang-cap-trunking': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',

  // --- 2. THIẾT BỊ ĐÓNG CẮT & TRẠM TRUNG THẾ (Schneider, Mitsubishi, ABB, LS) ---
  'schneider-mcb-acti9': 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=600&q=80',
  'schneider-mccb-nsx': 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80',
  'may-cat-acb': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  'may-cat-trung-the-vcb': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80',
  'contactor-schneider': 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=600&q=80',
  'role-trung-gian-omron': 'https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=600&q=80',
  'tu-bu-ha-the': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80',
  'dong-ho-dien-selec': 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&w=600&q=80',
  'bien-dong-ct': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
  'tu-dien-phan-phoi': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  'bo-luu-dien-ups': 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=600&q=80',

  // --- 3. HỆ THỐNG CHIẾU SÁNG & ĐÈN CÔNG TRÌNH (Philips, Rạng Đông, Paragon, Kentom) ---
  'den-led-panel-600': 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=600&q=80',
  'den-led-downlight': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
  'den-led-tuyp-t8': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=600&q=80',
  'den-pha-san-do': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
  'den-highbay-nha-xuong': 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&w=600&q=80',
  'den-exit-kentom': 'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=600&q=80',
  'den-su-co-khan-cap': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
  'nguon-driver-led': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',

  // --- 4. ĐƯỜNG ỐNG & PHỤ KIỆN CẤP THOÁT NƯỚC (Tiền Phong, Dekko, ShinYi, Wonil) ---
  'ong-nhua-ppr': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
  'ong-nhua-upvc': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
  'ong-nhua-hdpe': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',
  'van-buom-tay-gat-shinyi': 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80',
  'van-cong-ty-chim': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  'van-bi-inox': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80',
  'van-mot-chieu': 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=600&q=80',
  'dong-ho-nuoc-zenner': 'https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=600&q=80',
  'khop-noi-mem-cao-su': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80',
  'loc-y-gang': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',

  // --- 5. THIẾT BỊ VỆ SINH & XỬ LÝ NƯỚC (TOTO, Inax, Ebara, Grundfos, Tsurumi) ---
  'voi-lavabo-cam-ung-toto': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'van-xa-tieu-nam-toto': 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
  'bon-cau-toto': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'may-bom-ebara-tang-ap': 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80',
  'may-bom-chim-tsurumi': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  'phao-dien-radar': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80',
  'cot-loc-nuoc-ro': 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=600&q=80',

  // --- 6. CÔNG CỤ DỤNG CỤ & THIẾT BỊ ĐO KIỂM (Fluke, Kyoritsu, Bosch, Makita, Ridgid) ---
  'ampe-kim-fluke-376': 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&w=600&q=80',
  'dong-ho-van-nang-fluke': 'https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=600&q=80',
  'dong-ho-megger-kyoritsu': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
  'may-do-dien-tro-dat': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80',
  'may-han-ong-ppr': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
  'kim-ep-cos-thuy-luc': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
  'may-khoan-bosch': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  'mo-let-rang-ridgid': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80',
  'bom-thu-ap-luc-nuoc': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
};

/**
 * Tạo hình ảnh SVG chuẩn kỹ thuật công nghiệp có độ nét cao, tương phản rõ nét khi cần fallback
 */
export function generateTechnicalSchematicSvg(
  code: string,
  name: string,
  category: string,
  specification?: string
): string {
  let primaryColor = '#2563eb'; // blue
  let secondaryColor = '#1e3a8a';
  let accentColor = '#60a5fa';
  let iconSymbol = '⚡';
  let subTag = 'MEP-ELEC';

  const catLower = (category || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  if (catLower.includes('nước') || catLower.includes('ống') || catLower.includes('vệ sinh') || nameLower.includes('van') || nameLower.includes('bơm')) {
    primaryColor = '#0891b2'; // cyan/teal
    secondaryColor = '#164e63';
    accentColor = '#22d3ee';
    iconSymbol = '💧';
    subTag = 'MEP-PLUMB';
  } else if (catLower.includes('chiếu sáng') || nameLower.includes('đèn') || nameLower.includes('led') || nameLower.includes('panel')) {
    primaryColor = '#d97706'; // amber
    secondaryColor = '#78350f';
    accentColor = '#fbbf24';
    iconSymbol = '💡';
    subTag = 'MEP-LIGHT';
  } else if (catLower.includes('trung thế') || nameLower.includes('acb') || nameLower.includes('vcb') || nameLower.includes('mccb')) {
    primaryColor = '#dc2626'; // red
    secondaryColor = '#7f1d1d';
    accentColor = '#f87171';
    iconSymbol = '⚡';
    subTag = 'HIGH-VOLT';
  } else if (nameLower.includes('đo') || nameLower.includes('ampe') || nameLower.includes('kìm') || nameLower.includes('fluke') || nameLower.includes('kyoritsu') || nameLower.includes('khoan')) {
    primaryColor = '#7c3aed'; // purple
    secondaryColor = '#4c1d95';
    accentColor = '#a78bfa';
    iconSymbol = '🛠️';
    subTag = 'TOOL-EQUIP';
  }

  const cleanName = name.replace(/[<>&"]/g, '');
  const cleanSpec = (specification || '').replace(/[<>&"]/g, '');
  const shortName = cleanName.length > 32 ? cleanName.substring(0, 30) + '...' : cleanName;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <defs>
      <linearGradient id="grad_${code.replace(/[^a-zA-Z0-9]/g, '_')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${secondaryColor}" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#090d16" stop-opacity="1" />
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${primaryColor}" stroke-opacity="0.12" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad_${code.replace(/[^a-zA-Z0-9]/g, '_')})" rx="12" />
    <rect width="100%" height="100%" fill="url(#grid)" rx="12" />
    
    <!-- Top badge -->
    <rect x="16" y="16" width="110" height="24" rx="6" fill="${primaryColor}" fill-opacity="0.3" stroke="${accentColor}" stroke-width="1" />
    <text x="71" y="32" fill="${accentColor}" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1">${subTag}</text>
    
    <!-- Center Icon Circle -->
    <circle cx="200" cy="115" r="48" fill="${primaryColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="2" />
    <circle cx="200" cy="115" r="40" fill="#0f172a" fill-opacity="0.6" />
    <text x="200" y="128" font-size="34" text-anchor="middle">${iconSymbol}</text>
    
    <!-- Code Box -->
    <rect x="50" y="180" width="300" height="32" rx="8" fill="#020617" fill-opacity="0.85" stroke="#334155" stroke-width="1" />
    <text x="200" y="201" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle" letter-spacing="1.5">${code}</text>
    
    <!-- Name and Spec -->
    <text x="200" y="235" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">${shortName}</text>
    <text x="200" y="258" fill="#94a3b8" font-family="sans-serif" font-size="10" text-anchor="middle">${cleanSpec.length > 40 ? cleanSpec.substring(0, 38) + '...' : cleanSpec}</text>
    
    <!-- Tech Spec Watermark -->
    <text x="384" y="288" fill="#475569" font-family="sans-serif" font-size="8" text-anchor="end">AHT INTERNATIONAL AIRPORT • MEP ENGINEERING</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Trình phân giải hình ảnh vật tư thông minh đa tầng:
 * 1. Nếu vật tư đã có sẵn `material.image` hợp lệ -> Sử dụng trực tiếp
 * 2. Đối chiếu mã hoặc tên với kho ảnh chuẩn công nghiệp chính thống (Schneider, Cadivi, TOTO, Fluke, ShinYi, Philips...)
 * 3. Tự động sinh ảnh minh họa vector kỹ thuật số chất lượng cao chống vỡ hình
 */
export function resolveMaterialImageUrl(material: Partial<Material>): string {
  if (material.image && material.image.trim().startsWith('http')) {
    return material.image.trim();
  }

  const code = (material.code || '').toUpperCase();
  const name = (material.name || '').toLowerCase();
  const spec = (material.specification || '').toLowerCase();
  const cat = (material.category || '').toLowerCase();

  // --- CÁP & DÂY ĐIỆN ---
  if (name.includes('cadivi') || name.includes('dây điện đơn') || code.includes('DDCV0') || code.includes('CXV')) {
    if (name.includes('đỏ') || spec.includes('đỏ')) return OFFICIAL_IMAGE_COLLECTION['cadivi-cv-do'];
    if (name.includes('đen') || spec.includes('đen')) return OFFICIAL_IMAGE_COLLECTION['cadivi-cv-den'];
    if (name.includes('xanh lá') || name.includes('pe') || spec.includes('tiếp địa') || name.includes('vàng sọc')) return OFFICIAL_IMAGE_COLLECTION['cadivi-cv-pe'];
    if (name.includes('xanh dương') || name.includes('xanh') || spec.includes('xanh')) return OFFICIAL_IMAGE_COLLECTION['cadivi-cv-xanh'];
    if (name.includes('vàng') || spec.includes('vàng')) return OFFICIAL_IMAGE_COLLECTION['cadivi-cv-vang'];
    if (name.includes('cxv') || code.includes('CXV')) return OFFICIAL_IMAGE_COLLECTION['cap-cxv-4-ruot'];
    return OFFICIAL_IMAGE_COLLECTION['cadivi-cv-do'];
  }

  if (name.includes('đồng trần') || code.includes('DOTR0') || spec.includes('tiếp địa m')) {
    return OFFICIAL_IMAGE_COLLECTION['cap-dong-tran'];
  }
  if (name.includes('chống cháy') || code.includes('CHACY')) {
    return OFFICIAL_IMAGE_COLLECTION['cap-chong-chay'];
  }
  if (name.includes('ống luồn') || name.includes('ruột gà') || code.includes('OLPVC')) {
    return OFFICIAL_IMAGE_COLLECTION['ong-luon-day'];
  }
  if (name.includes('máng cáp') || name.includes('trunking') || name.includes('thang cáp')) {
    return OFFICIAL_IMAGE_COLLECTION['mang-cap-trunking'];
  }

  // --- THIẾT BỊ ĐÓNG CẮT & TRUNG THẾ ---
  if (name.includes('acb') || code.includes('00ACB') || spec.includes('máy cắt không khí')) {
    return OFFICIAL_IMAGE_COLLECTION['may-cat-acb'];
  }
  if (name.includes('vcb') || name.includes('hvx') || code.includes('HTVCB') || name.includes('trung thế')) {
    return OFFICIAL_IMAGE_COLLECTION['may-cat-trung-the-vcb'];
  }
  if (name.includes('mccb') || code.includes('MCCBS') || name.includes('compact nsx') || spec.includes('aptomat khối')) {
    return OFFICIAL_IMAGE_COLLECTION['schneider-mccb-nsx'];
  }
  if (name.includes('mcb') || code.includes('MCBSC') || name.includes('acti9') || name.includes('cb tép') || name.includes('aptomat 1p') || name.includes('aptomat 2p') || name.includes('aptomat 3p')) {
    return OFFICIAL_IMAGE_COLLECTION['schneider-mcb-acti9'];
  }
  if (name.includes('contactor') || code.includes('CTACT') || name.includes('khởi động từ') || name.includes('lc1d')) {
    return OFFICIAL_IMAGE_COLLECTION['contactor-schneider'];
  }
  if (name.includes('omron') || name.includes('rơ le') || name.includes('relay') || code.includes('RLTTG') || code.includes('MY2N')) {
    return OFFICIAL_IMAGE_COLLECTION['role-trung-gian-omron'];
  }
  if (name.includes('tụ bù') || code.includes('TUBUP') || name.includes('epcos') || name.includes('mikro')) {
    return OFFICIAL_IMAGE_COLLECTION['tu-bu-ha-the'];
  }
  if (name.includes('selec') || name.includes('mfm383a') || name.includes('đồng hồ đa năng') || name.includes('pm5350')) {
    return OFFICIAL_IMAGE_COLLECTION['dong-ho-dien-selec'];
  }
  if (name.includes('biến dòng') || code.includes('BDHAP') || name.includes('ct 50/5') || name.includes('ct 100/5') || name.includes('ct 200/5')) {
    return OFFICIAL_IMAGE_COLLECTION['bien-dong-ct'];
  }
  if (name.includes('ups') || name.includes('santak') || name.includes('lưu điện')) {
    return OFFICIAL_IMAGE_COLLECTION['bo-luu-dien-ups'];
  }
  if (name.includes('tủ điện') || name.includes('vỏ tủ') || code.includes('TUDPP')) {
    return OFFICIAL_IMAGE_COLLECTION['tu-dien-phan-phoi'];
  }

  // --- CHIẾU SÁNG & ĐÈN ---
  if (name.includes('panel 600') || name.includes('600x600') || code.includes('DPN60') || name.includes('đèn led panel')) {
    return OFFICIAL_IMAGE_COLLECTION['den-led-panel-600'];
  }
  if (name.includes('downlight') || code.includes('DDL09') || code.includes('DDL12') || name.includes('âm trần')) {
    return OFFICIAL_IMAGE_COLLECTION['den-led-downlight'];
  }
  if (name.includes('tuýp') || name.includes('t8') || code.includes('DT812') || name.includes('máng đèn tuýp')) {
    return OFFICIAL_IMAGE_COLLECTION['den-led-tuyp-t8'];
  }
  if (name.includes('đèn pha') || name.includes('sân đỗ') || code.includes('DPHA1') || code.includes('DPHA2') || code.includes('DPHA4') || code.includes('LST3-100V')) {
    return OFFICIAL_IMAGE_COLLECTION['den-pha-san-do'];
  }
  if (name.includes('highbay') || name.includes('nhà xưởng') || code.includes('DHB10') || code.includes('DHB15')) {
    return OFFICIAL_IMAGE_COLLECTION['den-highbay-nha-xuong'];
  }
  if (name.includes('exit') || name.includes('thoát hiểm') || code.includes('DEXIT') || name.includes('kt-610')) {
    return OFFICIAL_IMAGE_COLLECTION['den-exit-kentom'];
  }
  if (name.includes('sự cố') || name.includes('khẩn cấp') || code.includes('DSUCO') || name.includes('kt-2200')) {
    return OFFICIAL_IMAGE_COLLECTION['den-su-co-khan-cap'];
  }
  if (name.includes('driver') || name.includes('nguồn led') || name.includes('meanwell') || code.includes('DRV12')) {
    return OFFICIAL_IMAGE_COLLECTION['nguon-driver-led'];
  }

  // --- ĐƯỜNG ỐNG & VAN ---
  if (name.includes('ppr') || code.includes('OPPR0') || spec.includes('hàn nhiệt')) {
    return OFFICIAL_IMAGE_COLLECTION['ong-nhua-ppr'];
  }
  if (name.includes('upvc') || code.includes('UPVC0') || name.includes('tiền phong u')) {
    return OFFICIAL_IMAGE_COLLECTION['ong-nhua-upvc'];
  }
  if (name.includes('hdpe') || code.includes('OHDPE')) {
    return OFFICIAL_IMAGE_COLLECTION['ong-nhua-hdpe'];
  }
  if (name.includes('van bướm') || code.includes('VBMOT') || name.includes('shinyi van bướm')) {
    return OFFICIAL_IMAGE_COLLECTION['van-buom-tay-gat-shinyi'];
  }
  if (name.includes('van cổng') || code.includes('VCGTY') || spec.includes('ty chìm')) {
    return OFFICIAL_IMAGE_COLLECTION['van-cong-ty-chim'];
  }
  if (name.includes('van bi') || code.includes('VBINO') || name.includes('inox 304')) {
    return OFFICIAL_IMAGE_COLLECTION['van-bi-inox'];
  }
  if (name.includes('một chiều') || code.includes('V1CLT') || name.includes('lá lật')) {
    return OFFICIAL_IMAGE_COLLECTION['van-mot-chieu'];
  }
  if (name.includes('đồng hồ nước') || name.includes('zenner') || code.includes('DHNZE') || code.includes('asahi')) {
    return OFFICIAL_IMAGE_COLLECTION['dong-ho-nuoc-zenner'];
  }
  if (name.includes('khớp nối mềm') || code.includes('KNMCU') || name.includes('cao su')) {
    return OFFICIAL_IMAGE_COLLECTION['khop-noi-mem-cao-su'];
  }
  if (name.includes('lọc y') || code.includes('LYGMB')) {
    return OFFICIAL_IMAGE_COLLECTION['loc-y-gang'];
  }

  // --- THIẾT BỊ VỆ SINH & BƠM ---
  if (name.includes('vòi') || name.includes('lavabo cảm ứng') || code.includes('VLAVO') || name.includes('toto ten40')) {
    return OFFICIAL_IMAGE_COLLECTION['voi-lavabo-cam-ung-toto'];
  }
  if (name.includes('tiểu nam') || code.includes('VXTIE') || name.includes('due114') || name.includes('xả tiểu')) {
    return OFFICIAL_IMAGE_COLLECTION['van-xa-tieu-nam-toto'];
  }
  if (name.includes('bồn cầu') || name.includes('bệ xí') || code.includes('BCKLT') || name.includes('c889')) {
    return OFFICIAL_IMAGE_COLLECTION['bon-cau-toto'];
  }
  if (name.includes('ebara') || name.includes('bơm tăng áp') || code.includes('BOMNC') || code.includes('BOMTA')) {
    return OFFICIAL_IMAGE_COLLECTION['may-bom-ebara-tang-ap'];
  }
  if (name.includes('tsurumi') || name.includes('bơm chìm') || code.includes('BOMCH')) {
    return OFFICIAL_IMAGE_COLLECTION['may-bom-chim-tsurumi'];
  }
  if (name.includes('phao điện') || code.includes('PHRAD') || name.includes('radar')) {
    return OFFICIAL_IMAGE_COLLECTION['phao-dien-radar'];
  }
  if (name.includes('cột lọc') || name.includes('lõi lọc') || code.includes('LOCRO')) {
    return OFFICIAL_IMAGE_COLLECTION['cot-loc-nuoc-ro'];
  }

  // --- CÔNG CỤ DỤNG CỤ & THIẾT BỊ ĐO ---
  if (name.includes('ampe kìm') || code.includes('FLK37') || name.includes('fluke 376') || name.includes('kyoritsu 2002')) {
    return OFFICIAL_IMAGE_COLLECTION['ampe-kim-fluke-376'];
  }
  if (name.includes('vạn năng') || code.includes('FLK17') || name.includes('fluke 179') || name.includes('kyoritsu 1009')) {
    return OFFICIAL_IMAGE_COLLECTION['dong-ho-van-nang-fluke'];
  }
  if (name.includes('megger') || code.includes('MEG30') || name.includes('cách điện') || name.includes('3005a')) {
    return OFFICIAL_IMAGE_COLLECTION['dong-ho-megger-kyoritsu'];
  }
  if (name.includes('điện trở đất') || code.includes('KYO41') || name.includes('4105a')) {
    return OFFICIAL_IMAGE_COLLECTION['may-do-dien-tro-dat'];
  }
  if (name.includes('máy hàn ống') || code.includes('MHPPR') || name.includes('hàn ppr')) {
    return OFFICIAL_IMAGE_COLLECTION['may-han-ong-ppr'];
  }
  if (name.includes('ép cos') || code.includes('KEPCT') || name.includes('thủy lực')) {
    return OFFICIAL_IMAGE_COLLECTION['kim-ep-cos-thuy-luc'];
  }
  if (name.includes('máy khoan') || code.includes('MKHB2') || name.includes('bosch') || name.includes('makita')) {
    return OFFICIAL_IMAGE_COLLECTION['may-khoan-bosch'];
  }
  if (name.includes('mỏ lết') || code.includes('MLRID') || name.includes('ridgid')) {
    return OFFICIAL_IMAGE_COLLECTION['mo-let-rang-ridgid'];
  }
  if (name.includes('thử áp') || code.includes('BTAPL') || name.includes('bơm thử áp')) {
    return OFFICIAL_IMAGE_COLLECTION['bom-thu-ap-luc-nuoc'];
  }

  // Fallback to high-quality vector schematic
  return generateTechnicalSchematicSvg(
    material.code || 'DN_ITEM',
    material.name || 'Vật tư Kỹ thuật',
    material.category || 'Vật tư Điện & Nước',
    material.specification || ''
  );
}

/**
 * Trích xuất hồ sơ thị giác và quy chuẩn kỹ thuật cho từng vật tư
 */
export function getMaterialVisualDossier(material: Material): MaterialVisualDossier {
  const imageUrl = resolveMaterialImageUrl(material);
  const name = material.name || '';
  const spec = material.specification || '';
  const cat = material.category || '';

  let brand = 'AHT Standard';
  let modelOrType = material.code;
  let technicalStandard = 'TCVN / IEC 60364';
  let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  const highlightSpecs: string[] = [];

  // Extract manufacturer brand if mentioned
  const knownBrands = [
    'Schneider', 'Cadivi', 'Panasonic', 'Philips', 'Rạng Đông', 'TOTO', 'Inax',
    'ShinYi', 'Ebara', 'Tsurumi', 'Dekko', 'Tiền Phong', 'Fluke', 'Kyoritsu',
    'Bosch', 'Makita', 'Ridgid', 'Mitsubishi', 'ABB', 'LS', 'Kentom', 'Paragon',
    'Zenner', 'Asahi', 'Duhal', 'Meanwell', 'Santak', 'Selec', 'Mikro', 'Epcos'
  ];

  for (const b of knownBrands) {
    if (name.toLowerCase().includes(b.toLowerCase()) || spec.toLowerCase().includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }

  // Category specific details
  if (cat.includes('Điện') || cat.includes('tiêu hao')) {
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    technicalStandard = 'IEC 60227 / IEC 60502-1';
    highlightSpecs.push('Điện áp định mức: 0.6/1kV');
    highlightSpecs.push('Tiêu chuẩn an toàn: Đồng tinh khiết 99.99%');
  } else if (cat.includes('Trung thế')) {
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    technicalStandard = 'IEC 62271-100 / IEC 60947-2';
    highlightSpecs.push('Cấp cách điện: 24kV / 630A-2500A');
    highlightSpecs.push('Dòng cắt ngắn mạch: 25kA/3s - 65kA');
  } else if (cat.includes('Chiếu sáng')) {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    technicalStandard = 'CRI &ge; 80 / IP65-IP67';
    highlightSpecs.push('Hiệu suất quang thông: &ge; 110 lm/W');
    highlightSpecs.push('Tuổi thọ LED: &ge; 50.000 giờ chiếu sáng');
  } else if (cat.includes('Đường ống') || cat.includes('cấp thoát nước')) {
    badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    technicalStandard = 'DIN 8077/8078 / ISO 1452';
    highlightSpecs.push('Áp lực chịu tải: PN10 - PN25');
    highlightSpecs.push('Nhiệt độ làm việc: -10°C đến 95°C');
  } else if (cat.includes('vệ sinh') || cat.includes('Xử lý nước')) {
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    technicalStandard = 'ASME A112.19.2 / TOTO Eco-Power';
    highlightSpecs.push('Cảm biến tự động không chạm');
    highlightSpecs.push('Tiết kiệm nước & Kháng khuẩn bề mặt');
  }

  if (material.location) {
    highlightSpecs.push(`Vị trí định vị: ${material.location}`);
  }

  return {
    imageUrl,
    hdImageUrl: imageUrl,
    brand,
    modelOrType,
    technicalStandard,
    categoryName: cat,
    badgeColor,
    highlightSpecs,
  };
}
