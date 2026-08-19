import { Material } from '../types';
import { materialsGroup1 } from './materialsGroup1';
import { materialsGroup2 } from './materialsGroup2';

export const ALL_MATERIAL_CATEGORIES: string[] = [
  'Vật tư Điện & Phụ kiện tiêu hao',
  'Thiết bị Điện & Trạm trung thế',
  'Hệ thống Chiếu sáng & Đèn công trình',
  'Vật tư Đường ống & Phụ kiện cấp thoát nước',
  'Thiết bị vệ sinh & Xử lý nước',
];

/**
 * Danh mục vật tư chính thức của Đội Điện Nước (ĐN) - AHT
 * Toàn bộ các mã vật tư đều có tiền tố chuẩn DN_
 */
export const RAW_MATERIALS_DATABASE: Material[] = [
  ...materialsGroup1,
  ...materialsGroup2,
];
