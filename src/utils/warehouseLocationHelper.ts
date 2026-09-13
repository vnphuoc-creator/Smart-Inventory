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
  isAssigned: boolean;
  isSuggested: boolean;
  matchReason?: string;
}

/**
 * Tìm kiếm vị trí lưu trữ thực tế cho một vật tư trong kho theo sơ đồ khay kệ kỹ thuật.
 * TUÂN THỦ NGUYÊN TẮC ĐỒNG BỘ TUYỆT ĐỐI (Strict Location Resolution):
 * - Chỉ trả về vị trí Kệ / Tầng / Khay khi mã vật tư (code) đã được gán chính thức vào khay kệ đó (assignedMaterialCodes).
 * - Tuyệt đối không tự suy diễn hoặc gán sai vị trí dựa trên từ khóa.
 */
export function resolveMaterialWarehouseLocation(
  item: { code?: string; name?: string; specification?: string; location?: string },
  entities: WarehouseShelfEntity[] = DEFAULT_WAREHOUSE_ENTITIES
): MaterialLocationResult {
  const targetCode = item.code?.trim();

  if (targetCode) {
    // Duyệt qua toàn bộ kệ, tầng và khay để tìm vị trí đã gán
    for (const shelf of entities) {
      if (!shelf.tiers) continue;
      for (const tier of shelf.tiers) {
        if (!tier.compartments) continue;
        for (const comp of tier.compartments) {
          if (comp.assignedMaterialCodes?.includes(targetCode)) {
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
              isAssigned: true,
              isSuggested: false,
              matchReason: `Vị trí chính thức trên sơ đồ kho (${shelf.code} - ${comp.code})`,
            };
          }
        }
      }
    }
  }

  // Nếu vật tư chưa được gán vào bất kỳ khay kệ nào
  return {
    shelfId: '',
    shelfCode: 'CHƯA_GÁN',
    shelfName: 'Kho Chờ Xếp Kệ',
    tierNumber: 0,
    tierLabel: 'Chưa phân tầng',
    compartmentCode: '',
    compartmentName: 'Chưa gán khay',
    isAssigned: false,
    isSuggested: false,
    matchReason: 'Vật tư chưa được gán vị trí khay kệ trên sơ đồ kho',
  };
}

/**
 * Định dạng chuỗi hiển thị vị trí chuẩn hóa cho giao diện
 */
export function formatWarehouseLocationText(loc: MaterialLocationResult): string {
  if (!loc.isAssigned || loc.shelfCode === 'CHƯA_GÁN') {
    return 'Chưa gán khay kệ';
  }
  const compPart = loc.compartmentCode ? `${loc.compartmentCode}` : '';
  return `${loc.shelfCode} • ${loc.tierLabel}${compPart ? ` • ${compPart}` : ''}`;
}
