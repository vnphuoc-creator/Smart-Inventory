/**
 * Hỗ trợ điều hướng vị trí xếp kho thông minh (Intelligent Warehouse Slotting & Location Resolver)
 * Giúp nhân viên kho biết chính xác khi nhập kho theo tờ trình:
 * - Vật tư nằm ở Kệ nào? Tầng nào? Khay/Hộp nào?
 * - Tự động nhận diện và gợi ý vị trí chuẩn 5S nếu là vật tư mới
 */

import { WarehouseShelfEntity, Material, WarehouseCompartment, ShelfTierInfo } from '../types';
import { DEFAULT_WAREHOUSE_ENTITIES } from '../data/warehouseLayoutData';

export interface MaterialLocationResult {
  shelfId: string;
  shelfCode: string;
  shelfName: string;
  tierNumber: number;
  tierLabel: string;
  compartmentId?: string;
  compartmentCode?: string;
  compartmentName?: string;
  visualType?: string;
  qrCodeValue?: string;
  isSuggested: boolean;
  matchReason?: string;
}

/**
 * Tìm kiếm vị trí lưu trữ thực tế hoặc vị trí gợi ý cho một vật tư trong kho
 */
export function resolveMaterialWarehouseLocation(
  item: { code?: string; name: string; specification?: string; location?: string },
  entities: WarehouseShelfEntity[] = DEFAULT_WAREHOUSE_ENTITIES
): MaterialLocationResult {
  const searchText = `${item.code || ''} ${item.name || ''} ${item.specification || ''} ${item.location || ''}`.toLowerCase();

  // 1. Kiểm tra nếu vật tư đã được gán trực tiếp vào một Compartment/Khay trong entities
  for (const shelf of entities) {
    if (!shelf.tiers) continue;
    for (const tier of shelf.tiers) {
      if (!tier.compartments) continue;
      for (const comp of tier.compartments) {
        // Kiểm tra mã vật tư trong danh sách assignedMaterialCodes (nếu có)
        if (item.code && comp.assignedMaterialCodes?.includes(item.code)) {
          return {
            shelfId: shelf.id,
            shelfCode: shelf.code,
            shelfName: shelf.name,
            tierNumber: tier.tierNumber,
            tierLabel: tier.label,
            compartmentId: comp.id,
            compartmentCode: comp.code,
            compartmentName: comp.name,
            visualType: comp.visualType,
            qrCodeValue: comp.qrCodeValue || shelf.qrCodeValue,
            isSuggested: false,
            matchReason: 'Đã gán cố định theo layout kho',
          };
        }

        // Kiểm tra từ khóa trong tên khay hoặc itemKeywords của khay
        if (comp.itemKeywords && comp.itemKeywords.length > 0) {
          const matchKw = comp.itemKeywords.find((kw) => searchText.includes(kw.toLowerCase()));
          if (matchKw) {
            return {
              shelfId: shelf.id,
              shelfCode: shelf.code,
              shelfName: shelf.name,
              tierNumber: tier.tierNumber,
              tierLabel: tier.label,
              compartmentId: comp.id,
              compartmentCode: comp.code,
              compartmentName: comp.name,
              visualType: comp.visualType,
              qrCodeValue: comp.qrCodeValue || shelf.qrCodeValue,
              isSuggested: false,
              matchReason: `Khớp từ khóa khay: "${matchKw}"`,
            };
          }
        }
      }

      // Kiểm tra từ khóa của Tầng
      if (tier.itemKeywords && tier.itemKeywords.length > 0) {
        const matchTierKw = tier.itemKeywords.find((kw) => searchText.includes(kw.toLowerCase()));
        if (matchTierKw) {
          const firstComp = tier.compartments?.[0];
          return {
            shelfId: shelf.id,
            shelfCode: shelf.code,
            shelfName: shelf.name,
            tierNumber: tier.tierNumber,
            tierLabel: tier.label,
            compartmentId: firstComp?.id,
            compartmentCode: firstComp?.code || 'K01',
            compartmentName: firstComp?.name || `Khay thuộc ${tier.label}`,
            visualType: firstComp?.visualType || tier.visualType,
            qrCodeValue: firstComp?.qrCodeValue || shelf.qrCodeValue,
            isSuggested: true,
            matchReason: `Gợi ý theo phân nhóm tầng: "${matchTierKw}"`,
          };
        }
      }
    }
  }

  // 2. Thuật toán phân luồng gợi ý 5S chuyên sâu cho Đội Điện Nước AHT
  // Dụng cụ an toàn / đo kiểm -> Tủ Đồ Nghề TĐN-01 hoặc TĐN-02
  if (/fluke|ampe|kìm|megger|vom|vạn năng|khoan|búa|tuốc nơ vít|mỏ lết|thước|đồ nghề/i.test(searchText)) {
    const tdn = entities.find((e) => e.id === 'TDN-01') || entities.find((e) => e.type === 'TOOL_CABINET') || entities[0];
    return {
      shelfId: tdn.id,
      shelfCode: tdn.code,
      shelfName: tdn.name,
      tierNumber: 3,
      tierLabel: 'Tầng 3',
      compartmentCode: 'K01',
      compartmentName: 'Khay Dụng Cụ Đo Kiểm & An Toàn',
      visualType: 'tool-case',
      qrCodeValue: tdn.qrCodeValue,
      isSuggested: true,
      matchReason: 'Phân loại Dụng cụ đo kiểm & thi công (Tủ đồ nghề)',
    };
  }

  // Đèn chiếu sáng / LED / máng đèn -> KỆ 03 (Chiếu sáng)
  if (/đèn|led|bóng|chấn lưu|driver|panasonic|kentom|chiếu sáng|downlight|panel/i.test(searchText)) {
    const ke3 = entities.find((e) => e.id === 'KE-03') || entities[2];
    return {
      shelfId: ke3.id,
      shelfCode: ke3.code,
      shelfName: ke3.name,
      tierNumber: 3,
      tierLabel: 'Tầng 3',
      compartmentCode: 'K01',
      compartmentName: 'Khay Đèn Chiếu Sáng & Phụ Kiện',
      visualType: 'clear-boxes',
      qrCodeValue: ke3.qrCodeValue,
      isSuggested: true,
      matchReason: 'Phân loại Thiết bị chiếu sáng (Kệ KE-03)',
    };
  }

  // Thiết bị vệ sinh / van / vòi / đường ống nước -> KỆ 04 hoặc KỆ 01
  if (/van|co|tê|ống|nước|toto|inax|lavabo|vòi|bồn tiểu|xiphong|phao|băng keo non/i.test(searchText)) {
    const ke4 = entities.find((e) => e.id === 'KE-04') || entities[0];
    return {
      shelfId: ke4.id,
      shelfCode: ke4.code,
      shelfName: ke4.name,
      tierNumber: 2,
      tierLabel: 'Tầng 2',
      compartmentCode: 'K01',
      compartmentName: 'Khay Phụ Kiện Cấp Thoát Nước & Vệ Sinh',
      visualType: 'blue-bins',
      qrCodeValue: ke4.qrCodeValue,
      isSuggested: true,
      matchReason: 'Phân loại Vật tư nước & Phụ kiện vệ sinh (Kệ KE-04)',
    };
  }

  // Dây cáp điện CADIVI / Cáp điện / Tiếp địa -> KỆ 05 (Tầng 1 hoặc 2)
  if (/cadivi|cáp|dây điện|dây đôi|vcmd|tiếp địa|thanh cái|busbar/i.test(searchText)) {
    const ke5 = entities.find((e) => e.id === 'KE-05') || entities[4];
    return {
      shelfId: ke5.id,
      shelfCode: ke5.code,
      shelfName: ke5.name,
      tierNumber: 1,
      tierLabel: 'Tầng 1',
      compartmentCode: 'K01',
      compartmentName: 'Ngăn Cuộn Dây Cáp CADIVI & Thanh Cái Tiếp Địa',
      visualType: 'cadivi-coils',
      qrCodeValue: ke5.qrCodeValue,
      isSuggested: true,
      matchReason: 'Phân loại Cáp điện & Tiếp địa (Kệ KE-05 Tầng 1)',
    };
  }

  // MCB / Aptomat / Khởi động từ / Rơ le -> KỆ 01 hoặc KE-02
  if (/mcb|mccb|aptomat|cb|contactor|khởi động từ|relay|rơ le|schneider|mitsubishi|ls/i.test(searchText)) {
    const ke1 = entities.find((e) => e.id === 'KE-01') || entities[0];
    return {
      shelfId: ke1.id,
      shelfCode: ke1.code,
      shelfName: ke1.name,
      tierNumber: 3,
      tierLabel: 'Tầng 3',
      compartmentCode: 'K01',
      compartmentName: 'Khay Nhựa Xanh Đựng MCB & Khởi Động Từ',
      visualType: 'blue-bins',
      qrCodeValue: ke1.qrCodeValue,
      isSuggested: true,
      matchReason: 'Phân loại Khí cụ đóng cắt & Điều khiển (Kệ KE-01 Tầng 3)',
    };
  }

  // Mặc định: Gợi ý KỆ 01 Tầng 2
  const defaultShelf = entities.find((e) => e.id === 'KE-01') || entities[0];
  return {
    shelfId: defaultShelf.id,
    shelfCode: defaultShelf.code,
    shelfName: defaultShelf.name,
    tierNumber: 2,
    tierLabel: 'Tầng 2',
    compartmentCode: 'K01',
    compartmentName: 'Khay Nhựa Tiêu Chuẩn 5S',
    visualType: 'blue-bins',
    qrCodeValue: defaultShelf.qrCodeValue,
    isSuggested: true,
    matchReason: 'Vị trí tiêu chuẩn kho vật tư chung',
  };
}
