import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Search,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Info,
  Package,
  QrCode,
  Zap,
  BatteryCharging,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Compass,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Tag,
  Wrench,
  Boxes,
  Eye,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Material, CalculatedMaterialStock } from '../types';
import { formatNumber } from '../utils/inventoryEngine';

interface WarehouseMapViewProps {
  materials: Material[];
  calculatedStocks: { [materialCode: string]: CalculatedMaterialStock } | CalculatedMaterialStock[];
  onSelectMaterial: (material: Material) => void;
  onUpdateMaterialLocation?: (materialCode: string, newLocation: string) => Promise<void> | void;
}

// Visual definition of warehouse zones and shelves
interface ShelfTierInfo {
  tierNumber: number;
  label: string;
  categoryDesc: string;
  itemKeywords: string[];
  visualType: 'blue-bins' | 'clear-boxes' | 'cadivi-coils' | 'cardboard-boxes' | 'tool-case';
  sampleItems: string[];
}

interface WarehouseShelfEntity {
  id: string;
  code: string;
  name: string;
  type: 'SHELF_4_TIER' | 'TOOL_CABINET' | 'UPS_CABINET' | 'BATTERY_RACK' | 'DISTRIBUTION_BOARD';
  categoryLabel: string;
  dimensions: {
    lengthMm: number; // dài 1500mm
    widthMm: number;  // rộng 500mm
    heightMm: number; // cao 1500mm
    levels: number;   // 4 tầng
  };
  svgRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  colorTheme: {
    base: string;
    border: string;
    glow: string;
    badgeBg: string;
    badgeText: string;
  };
  tiers?: ShelfTierInfo[];
  description: string;
  qrCodeValue: string;
  notes?: string;
}

// Master data of room equipment according to Image 1 and warehouse photos
const WAREHOUSE_ENTITIES: WarehouseShelfEntity[] = [
  // 1. TỦ ĐỒ NGHỀ 1 (Bắt đầu từ cửa vào, tủ kim loại xanh dương 2 cánh bảo hộ)
  {
    id: 'TDN-01',
    code: 'TDN-01',
    name: 'Tủ Đồ Nghề Kỹ Thuật 1',
    type: 'TOOL_CABINET',
    categoryLabel: 'Dụng Cụ An Toàn & Thi Công',
    dimensions: { lengthMm: 900, widthMm: 500, heightMm: 1800, levels: 4 },
    svgRect: { x: 740, y: 70, width: 65, height: 75 },
    colorTheme: {
      base: 'from-blue-600/30 to-blue-900/40',
      border: 'border-blue-500',
      glow: 'shadow-blue-500/30',
      badgeBg: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ thép xanh 2 cánh bảo hộ chuyên biệt: Dụng cụ an toàn điện, kìm ép cosse thủy lực, đồng hồ vạn năng VOM, máy đo điện trở cách điện Megger, găng tay cách điện hạ thế.',
    qrCodeValue: 'DNCT-WH-CABINET-TOOL-01',
    notes: 'Có dán mã QR trên góc cánh tủ để quét nhanh bàn giao ca.',
    tiers: [
      { tierNumber: 4, label: 'Tầng 4', categoryDesc: 'Thiết bị đo kiểm Fluke/Kyoritsu & Đồng hồ đo điện áp', itemKeywords: ['fluke', 'đo', 'vom', 'ampe', 'megger'], visualType: 'tool-case', sampleItems: ['Đồng hồ VOM Fluke 179', 'Ampe kìm Kyoritsu 2002PA', 'Máy đo điện trở đất'] },
      { tierNumber: 3, label: 'Tầng 3', categoryDesc: 'Kìm ép cosse cơ & thủy lực, kìm tuốt dây', itemKeywords: ['kìm', 'cosse', 'tuốt', 'bấm'], visualType: 'tool-case', sampleItems: ['Kìm ép cosse thủy lực YQK-300', 'Kìm tuốt dây tự động', 'Bộ tuốc nơ vít cách điện 1000V'] },
      { tierNumber: 2, label: 'Tầng 2', categoryDesc: 'Đồ bảo hộ an toàn điện, mũ nón, găng tay cách điện', itemKeywords: ['găng', 'bảo hộ', 'cách điện', 'kính'], visualType: 'tool-case', sampleItems: ['Găng tay cách điện hạ thế 1000V', 'Kính bảo hộ chống hồ quang', 'Ủng cách điện'] },
      { tierNumber: 1, label: 'Tầng 1', categoryDesc: 'Máy hàn thiếc, cuộn chì, đồng hồ kiểm tra pha', itemKeywords: ['hàn', 'chì', 'pha', 'thử điện'], visualType: 'tool-case', sampleItems: ['Máy hàn thiếc Weller 80W', 'Bút thử điện cảm ứng', 'Đồng hồ chỉ thị thứ tự pha'] },
    ],
  },

  // 2. TỦ ĐỒ NGHỀ 2 (Tủ dụng cụ cơ khí kỹ thuật xám/kính)
  {
    id: 'TDN-02',
    code: 'TDN-02',
    name: 'Tủ Đồ Nghề Kỹ Thuật 2',
    type: 'TOOL_CABINET',
    categoryLabel: 'Dụng Cụ Cơ Khí & Máy Pin',
    dimensions: { lengthMm: 900, widthMm: 500, heightMm: 1800, levels: 4 },
    svgRect: { x: 665, y: 70, width: 65, height: 75 },
    colorTheme: {
      base: 'from-cyan-600/30 to-slate-850',
      border: 'border-cyan-500',
      glow: 'shadow-cyan-500/30',
      badgeBg: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40',
      badgeText: 'text-cyan-300',
    },
    description: 'Tủ kim loại xám/kính kỹ thuật: Máy khoan pin Makita/Bosch, bộ mũi khoan đa năng, máy cắt sắt, cưa cầm tay, bộ cờ lê mỏ lết, búa cao su, súng bắn keo nến.',
    qrCodeValue: 'DNCT-WH-CABINET-TOOL-02',
    tiers: [
      { tierNumber: 4, label: 'Tầng 4', categoryDesc: 'Máy khoan pin, sạc dự phòng & pin 18V', itemKeywords: ['khoan', 'pin', 'makita', 'bosch', 'sạc'], visualType: 'tool-case', sampleItems: ['Máy khoan búa pin Makita 18V', 'Máy vặn vít pin Bosch', 'Đốc sạc nhanh 18V kép'] },
      { tierNumber: 3, label: 'Tầng 3', categoryDesc: 'Bộ mũi khoan bê tông, sắt, mũi khoét lỗ tủ điện', itemKeywords: ['mũi', 'khoan', 'khoét', 'taro'], visualType: 'clear-boxes', sampleItems: ['Bộ mũi khoét lỗ tủ điện Unika 16-35mm', 'Bộ mũi khoan bê tông rút lõi', 'Bộ taro ren M3-M12'] },
      { tierNumber: 2, label: 'Tầng 2', categoryDesc: 'Bộ cờ lê tự động, cần xiết lực, mỏ lết răng', itemKeywords: ['cờ lê', 'mỏ lết', 'lục giác', 'khẩu'], visualType: 'tool-case', sampleItems: ['Bộ cờ lê vòng miệng Kingtony 8-32mm', 'Cần xiết lực 20-100Nm', 'Bộ lục giác bông hoa thị'] },
      { tierNumber: 1, label: 'Tầng 1', categoryDesc: 'Máy cắt cầm tay, cưa tay, búa sắt, búa cao su', itemKeywords: ['cắt', 'cưa', 'búa', 'đục'], visualType: 'tool-case', sampleItems: ['Máy mài góc cầm tay 100mm', 'Cưa sắt cầm tay Eclipse', 'Búa cao su chống xước mặt tủ'] },
    ],
  },

  // 3. KỆ 1 (1.5m x 0.5m x 1.5m, 4 Tầng)
  {
    id: 'KE-01',
    code: 'KE-01',
    name: 'KỆ VẬT TƯ SỐ 1',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Vật Tư Nước & Thiết Bị Vệ Sinh',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1500, levels: 4 },
    svgRect: { x: 550, y: 70, width: 105, height: 75 },
    colorTheme: {
      base: 'from-emerald-600/30 to-slate-900',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/30',
      badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Kệ sắt v lỗ 4 tầng kích thước 1,5m x 1,5m x 0,5m chuyên chứa vật tư cơ điện nhẹ và thiết bị vệ sinh cao cấp khu vực nhà ga T2.',
    qrCodeValue: 'DNCT-WH-SHELF-KE-01',
    notes: 'Kích thước chuẩn: Dài 1.5m x Ngang 1.5m x Rộng 50cm (4 tầng)',
    tiers: [
      { tierNumber: 4, label: 'Tầng 4 (Trên cùng)', categoryDesc: 'Xi phông lavabo, đèn quang hợp, LED đường chiếu sáng', itemKeywords: ['xi phông', 'xiphong', 'lavabo', 'đèn', 'quang hợp', 'led'], visualType: 'clear-boxes', sampleItems: ['Xi phông lavabo ruột gà Inox', 'Đèn LED chiếu sáng công nghiệp', 'Đèn quang hợp cây cảnh T2'] },
      { tierNumber: 3, label: 'Tầng 3', categoryDesc: 'Linh kiện thiết bị vệ sinh TOTO, chốt nắp bồn cầu, đầu vòi', itemKeywords: ['toto', 'bồn cầu', 'chốt', 'vòi', 'lavabo'], visualType: 'cardboard-boxes', sampleItems: ['Chốt cố định nắp bồn cầu TOTO', 'Đầu vòi nối dài bồn rửa', 'Van cấp nước bồn cầu Inax/Toto'] },
      { tierNumber: 2, label: 'Tầng 2', categoryDesc: 'Keo Silicon, Titebond, phao bồn tiểu, dây cấp nước, thoát sàn', itemKeywords: ['silicon', 'titebond', 'phao', 'bồn tiểu', 'dây cấp', 'thoát sàn'], visualType: 'clear-boxes', sampleItems: ['Chai keo Silicon Apollo A500', 'Keo đa năng Titebond Heavy Duty', 'Dây cấp nước Inox 304 mềm 40cm', 'Phễu thoát sàn khử mùi 10x10'] },
      { tierNumber: 1, label: 'Tầng 1 (Dưới cùng)', categoryDesc: 'Nắp bồn tiểu, đầu vòi dài, bình xà phòng, vật tư nặng', itemKeywords: ['nắp', 'tiểu', 'vòi', 'xà phòng', 'thùng'], visualType: 'cardboard-boxes', sampleItems: ['Thùng nắp bồn tiểu cảm ứng', 'Bộ xả bồn tiểu nam Viglacera', 'Hộp đựng xà phòng treo tường cảm ứng'] },
    ],
  },

  // 4. KỆ 2 (1.5m x 0.5m x 1.5m, 4 Tầng) - HÌNH ẢNH THỰC TẾ PHOTO 3
  {
    id: 'KE-02',
    code: 'KE-02',
    name: 'KỆ VẬT TƯ SỐ 2',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Linh Kiện TOTO & Phụ Kiện Cơ Điện',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1500, levels: 4 },
    svgRect: { x: 435, y: 70, width: 105, height: 75 },
    colorTheme: {
      base: 'from-teal-600/30 to-slate-900',
      border: 'border-teal-500',
      glow: 'shadow-teal-500/30',
      badgeBg: 'bg-teal-600/20 text-teal-300 border-teal-500/40',
      badgeText: 'text-teal-300',
    },
    description: 'Kệ sắt v lỗ 4 tầng kích thước 1,5m x 1,5m x 0,5m khớp hình ảnh thực tế: Chứa phụ kiện TOTO bồn cầu, phao cấp nước, keo silicon và hộp linh kiện có quai xách.',
    qrCodeValue: 'DNCT-WH-SHELF-KE-02',
    notes: 'Kích thước chuẩn: Dài 1.5m x Ngang 1.5m x Rộng 50cm (4 tầng)',
    tiers: [
      { tierNumber: 4, label: 'Tầng 4 (Trên cùng)', categoryDesc: 'Đèn quang hợp, đèn đường LED, xiphong chậu rửa', itemKeywords: ['đèn quang hợp', 'led đường', 'xiphong lavobo', 'xiphong'], visualType: 'clear-boxes', sampleItems: ['Đèn quang hợp trồng cây sảnh T2', 'Đèn LED đường 50W IP66', 'Xiphong Lavabo Inox'] },
      { tierNumber: 3, label: 'Tầng 3', categoryDesc: 'Nhãn in Brother TZe, hộp phụ kiện TOTO, chốt bồn cầu', itemKeywords: ['nhãn in', 'toto', 'chốt bồn cầu', 'vòi dài'], visualType: 'clear-boxes', sampleItems: ['Cuộn nhãn in TZe-251 24mm', 'Chốt cố định bồn cầu cao su nở', 'Đầu vòi dài Lavabo Inox 304', 'Bộ ron sứ chống rò rỉ bồn cầu'] },
      { tierNumber: 2, label: 'Tầng 2', categoryDesc: 'Silicon A500, Titebond, phao cấp bồn tiểu, bộ xả nước bồn cầu, thoát sàn', itemKeywords: ['silicon', 'titebon', 'phao bồn tiểu', 'bộ xả bồn cầu', 'dây cấp nước', 'thoát sàn', 'hộp giấy'], visualType: 'clear-boxes', sampleItems: ['Hộp tuýp Silicon Apollo A500 / A300', 'Keo dán gỗ sắt Titebond', 'Phao cấp bồn tiểu cảm ứng', 'Bộ xả nước bồn cầu 2 nút nhấn', 'Dây cấp nước lưới Inox'] },
      { tierNumber: 1, label: 'Tầng 1 (Dưới cùng)', categoryDesc: 'Thùng đồ nghề tận dụng, nắp bồn tiểu sứ, vòi xả phòng', itemKeywords: ['thùng đồ nghề', 'nắp bồn tiểu', 'vòi xả phòng', 'chân tiểu'], visualType: 'cardboard-boxes', sampleItems: ['Thùng đồ nghề tận dụng đa năng', 'Nắp bồn tiểu Model 5A1 Wonderful', 'Chân đỡ tiểu nam treo tường', 'Bình và vòi xả xà phòng âm bàn'] },
    ],
  },

  // 5. KỆ 3 (1.5m x 0.5m x 1.5m, 4 Tầng) - HÌNH ẢNH THỰC TẾ PHOTO 2 (ĐIỆN & CADIVI)
  {
    id: 'KE-03',
    code: 'KE-03',
    name: 'KỆ VẬT TƯ SỐ 3',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Khí Cụ Đóng Cắt CB/MCB & Dây Cáp CADIVI',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1500, levels: 4 },
    svgRect: { x: 320, y: 70, width: 105, height: 75 },
    colorTheme: {
      base: 'from-amber-600/30 to-slate-900',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/30',
      badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Kệ trọng điểm về khí cụ điện: Khay nhựa xanh chia ngăn MCB/CB, hộp rơ le đế rơ le, contactor khởi động từ và các cuộn dây điện CADIVI tròn tầng đáy.',
    qrCodeValue: 'DNCT-WH-SHELF-KE-03',
    notes: 'Kích thước chuẩn: Dài 1.5m x Ngang 1.5m x Rộng 50cm (4 tầng)',
    tiers: [
      { tierNumber: 4, label: 'Tầng 4 (Trên cùng)', categoryDesc: 'Vật tư chờ phân loại, Rơ-le các loại, Đế rơ-le, Timer, Chống sét van, Khởi động từ', itemKeywords: ['chờ phân loại', 'role', 'đế role', 'timer', 'chống sét', 'khởi động từ'], visualType: 'clear-boxes', sampleItems: ['Hộp nhựa quai đỏ: Rơ le Omron 24VDC/220VAC', 'Đế rơ le 8 chân & 14 chân tròn/dẹp', 'Timer thời gian hẹn giờ Autonics', 'Chống sét lan truyền Schneider iPRD', 'Khởi động từ Contactor LS / Fuji'] },
      { tierNumber: 3, label: 'Tầng 3', categoryDesc: 'Ổ sạc USB đôi 2.1A, Đèn báo pha, Công tắc xoay 2-3 vị trí, Khay xanh MCB 1P (10A, 20A, 32A, 50A, 63A)', itemKeywords: ['sạc usb', 'đèn báo pha', 'công tắc', 'mcb 10a', 'mcb 20a', 'mcb 32a', 'mcb 50a', 'mcb 63a', 'cb 10a', 'cb 20a', 'cb 32a'], visualType: 'blue-bins', sampleItems: ['Mặt ổ sạc USB đôi âm tường 2.1A', 'Đèn báo pha LED 220V Xanh/Đỏ/Vàng phi 22', 'Công tắc xoay 3 vị trí I-O-II Schneider', 'Khay nhựa xanh đựng MCB 1P 10A, 20A, 32A, 50A, 63A'] },
      { tierNumber: 2, label: 'Tầng 2', categoryDesc: 'Contactor 1P-25A, Contactor 3P-32A, Khay xanh MCB 3P, RCCB 4P (30mA-300mA), RCBO chống rò', itemKeywords: ['contactor 1p-25a', 'contactor 3p-32a', 'mcb 3p', 'rccb 4p', 'rcbo'], visualType: 'blue-bins', sampleItems: ['Contactor Schneider 1P 25A coil 220V', 'Contactor 3P 32A khởi động động cơ', 'MCB 3P 10A, 50A, 63A Schneider Acti9', 'RCCB 4P 63A-300mA, 40A-30mA chống dòng rò', 'RCBO 1P+N 20A-30mA'] },
      { tierNumber: 1, label: 'Tầng 1 (Dưới cùng)', categoryDesc: 'Các cuộn dây điện đơn & cáp CADIVI, dây TE tiếp địa, dây chống cháy 4mm, nắp sứ bồn tiểu', itemKeywords: ['cadivi', 'dây điện', 'dây te', 'dây l', 'dây n', 'dây chống cháy', '4mm', '2.5mm'], visualType: 'cadivi-coils', sampleItems: ['Cuộn CADIVI 2.5mm² Vàng-Xanh (Dây TE tiếp địa)', 'Cuộn CADIVI 2.5mm² Đỏ (Dây Pha L)', 'Cuộn CADIVI 2.5mm² Đen/Xanh Dương (Dây Trung Tính N)', 'Cuộn CADIVI Chống Cháy 4.0mm² Vỏ Cam Cam', 'Cuộn dây đôi mềm Oval dẹp VCmd 2x1.5'] },
    ],
  },

  // 6. KỆ 4 (1.5m x 0.5m x 1.5m, 4 Tầng)
  {
    id: 'KE-04',
    code: 'KE-04',
    name: 'KỆ VẬT TƯ SỐ 4',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Nguồn Meanwell, Biến Áp & Phụ Kiện Điện Nhẹ',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1500, levels: 4 },
    svgRect: { x: 205, y: 70, width: 105, height: 75 },
    colorTheme: {
      base: 'from-indigo-600/30 to-slate-900',
      border: 'border-indigo-500',
      glow: 'shadow-indigo-500/30',
      badgeBg: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40',
      badgeText: 'text-indigo-300',
    },
    description: 'Kệ sắt v lỗ 4 tầng kích thước 1,5m x 1,5m x 0,5m chuyên chứa bộ nguồn tổ ong Meanwell, biến dòng đo lường CT, quạt tản nhiệt UPS và đầu cosse.',
    qrCodeValue: 'DNCT-WH-SHELF-KE-04',
    notes: 'Kích thước chuẩn: Dài 1.5m x Ngang 1.5m x Rộng 50cm (4 tầng)',
    tiers: [
      { tierNumber: 4, label: 'Tầng 4 (Trên cùng)', categoryDesc: 'Bộ nguồn tổ ong Meanwell 12V-350W, 24V-150W, Adapter Camera', itemKeywords: ['meanwell', 'nguồn', '12v', '24v', 'adapter'], visualType: 'cardboard-boxes', sampleItems: ['Nguồn Meanwell LRS-350-12 (12V 29A)', 'Nguồn Meanwell NDR-120-24 gắn thanh ray', 'Bộ nguồn dự phòng 24VDC 5A Schneider'] },
      { tierNumber: 3, label: 'Tầng 3', categoryDesc: 'Biến áp đo lường CT 50/5A - 400/5A, đồng hồ đo đa năng Selec', itemKeywords: ['ct', 'biến dòng', 'selec', 'đồng hồ tủ'], visualType: 'clear-boxes', sampleItems: ['Biến dòng hở CT 100/5A Omega', 'Đồng hồ đa năng kỹ thuật số Selec MFM384', 'Bộ chuyển đổi tín hiệu 4-20mA'] },
      { tierNumber: 2, label: 'Tầng 2', categoryDesc: 'Đầu cosse đồng SC, cosse tròn, cosse pin kim, ống co nhiệt, dây rút', itemKeywords: ['cosse', 'cos', 'sc', 'co nhiệt', 'dây rút'], visualType: 'blue-bins', sampleItems: ['Hộp cosse đồng đúc mạ thiếc SC 16-6, SC 25-8, SC 50-10', 'Đầu cosse pin kim bấm dây điều khiển', 'Cuộn ống co nhiệt phi 4, 6, 8, 12 chống cháy'] },
      { tierNumber: 1, label: 'Tầng 1 (Dưới cùng)', categoryDesc: 'Quạt tản nhiệt tủ UPS 220VAC, lưới lọc bụi công nghiệp, biến áp cách ly', itemKeywords: ['quạt', 'tản nhiệt', 'ups', 'lọc bụi', 'biến áp'], visualType: 'cardboard-boxes', sampleItems: ['Quạt hút tản nhiệt Sunon 120x120 220VAC', 'Tấm lọc bụi than hoạt tính cho tủ điện', 'Biến áp cách ly 1 pha 220V/110V 500VA'] },
    ],
  },

  // 7. KỆ 5 (1.5m x 0.5m x 1.5m, 4 Tầng - Góc trong cùng gần cụm ắc quy)
  {
    id: 'KE-05',
    code: 'KE-05',
    name: 'KỆ VẬT TƯ SỐ 5',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Vật Tư Dự Phòng Sự Cố & Đóng Cắt Lớn',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1500, levels: 4 },
    svgRect: { x: 90, y: 70, width: 105, height: 75 },
    colorTheme: {
      base: 'from-purple-600/30 to-slate-900',
      border: 'border-purple-500',
      glow: 'shadow-purple-500/30',
      badgeBg: 'bg-purple-600/20 text-purple-300 border-purple-500/40',
      badgeText: 'text-purple-300',
    },
    description: 'Kệ sắt v lỗ 4 tầng kích thước 1,5m x 1,5m x 0,5m nằm trong cùng giáp cụm ắc quy tường trái: Chứa khí cụ đóng cắt công suất lớn, cầu dao ACB/MCCB dự phòng và thanh đồng tiếp địa.',
    qrCodeValue: 'DNCT-WH-SHELF-KE-05',
    notes: 'Kích thước chuẩn: Dài 1.5m x Ngang 1.5m x Rộng 50cm (4 tầng)',
    tiers: [
      { tierNumber: 4, label: 'Tầng 4 (Trên cùng)', categoryDesc: 'Cầu chì bán dẫn công suất cao, phụ kiện đóng cắt UPS Socomec', itemKeywords: ['cầu chì', 'bán dẫn', 'socomec', 'ups'], visualType: 'clear-boxes', sampleItems: ['Cầu chì bán dẫn Bussmann 160A 690V cho UPS', 'Bo mạch điều khiển bypass Socomec', 'Màn hình LCD thay thế UPS Delphys'] },
      { tierNumber: 3, label: 'Tầng 3', categoryDesc: 'MCCB 3P khối đúc từ 100A đến 250A Schneider Compact NSX', itemKeywords: ['mccb', 'nsx', '100a', '160a', '250a'], visualType: 'cardboard-boxes', sampleItems: ['Aptomat khối MCCB 3P 100A 36kA Schneider', 'MCCB 3P 160A chỉnh định nhiệt từ', 'Cuộn cắt Shunt Trip 220VAC cho MCCB'] },
      { tierNumber: 2, label: 'Tầng 2', categoryDesc: 'Khối Contactor 3P 65A - 150A, Rơ le nhiệt bảo vệ quá tải', itemKeywords: ['contactor 65a', 'contactor 150a', 'rơ le nhiệt', 'overload'], visualType: 'blue-bins', sampleItems: ['Contactor 3P 65A Schneider LC1D65', 'Rơ le nhiệt bảo vệ động cơ LRD3353', 'Khối tiếp điểm phụ NO+NC gá mặt trước'] },
      { tierNumber: 1, label: 'Tầng 1 (Dưới cùng)', categoryDesc: 'Thanh đồng thanh cái Busbar, cọc tiếp địa đồng D16, cáp bện đồng trần', itemKeywords: ['đồng', 'thanh cái', 'tiếp địa', 'cọc đồng', 'busbar'], visualType: 'cadivi-coils', sampleItems: ['Cọc tiếp địa đồng nguyên chất phi 16 dài 2.4m', 'Thanh đồng cái Busbar 30x5mm mạ thiếc', 'Cuộn cáp đồng trần M50 thoát sét tiếp đất'] },
    ],
  },

  // 8. CỤM TỦ UPS & ẮC QUY HÀNG 1 (Ở GIỮA PHÒNG - UPPER ROW)
  {
    id: 'UPS-1-EQPT',
    code: 'UPS-1 EQPT',
    name: 'Tủ Nguồn Lưu Điện UPS-1',
    type: 'UPS_CABINET',
    categoryLabel: 'Hệ Thống Nguồn UPS Công Nghiệp',
    dimensions: { lengthMm: 800, widthMm: 850, heightMm: 1900, levels: 1 },
    svgRect: { x: 535, y: 190, width: 75, height: 85 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-yellow-500',
      glow: 'shadow-yellow-500/20',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      badgeText: 'text-yellow-300',
    },
    description: 'Tủ UPS công nghiệp Socomec Delphys BC (160kVA - 200kVA) cấp nguồn liên tục cho thiết bị điều hành nhà ga sân bay T2. Đặt trong vùng cảnh báo an toàn sọc vàng đen.',
    qrCodeValue: 'DNCT-SYS-UPS-01-EQPT',
    notes: 'Khu vực điện cao thế - Bắt buộc mang đồ bảo hộ khi kiểm tra.',
  },
  {
    id: 'BATT-2-UPS-1',
    code: 'BATT.2 UPS-1',
    name: 'Tủ Ắc Quy Dự Phòng 2 (UPS 1)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 615, y: 190, width: 95, height: 85 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy khô viễn thông chuyên dụng 12V-150Ah/200Ah kết nối chuỗi DC dự phòng thời lượng 30-60 phút cho UPS-1.',
    qrCodeValue: 'DNCT-SYS-BATT-02-UPS-01',
  },
  {
    id: 'BATT-1-UPS-1',
    code: 'BATT.1 UPS-1',
    name: 'Tủ Ắc Quy Dự Phòng 1 (UPS 1)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 715, y: 190, width: 95, height: 85 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy khô chuyên dụng UPS-1 chuỗi 1 cấp nguồn cho tải thiết bị trọng yếu sân bay.',
    qrCodeValue: 'DNCT-SYS-BATT-01-UPS-01',
  },

  // 9. CỤM TỦ UPS & ẮC QUY HÀNG 2 (LOWER ROW)
  {
    id: 'UPS-2-EQPT',
    code: 'UPS-2 EQPT',
    name: 'Tủ Nguồn Lưu Điện UPS-2',
    type: 'UPS_CABINET',
    categoryLabel: 'Hệ Thống Nguồn UPS Công Nghiệp',
    dimensions: { lengthMm: 800, widthMm: 850, heightMm: 1900, levels: 1 },
    svgRect: { x: 435, y: 340, width: 75, height: 85 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-yellow-500',
      glow: 'shadow-yellow-500/20',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      badgeText: 'text-yellow-300',
    },
    description: 'Tủ nguồn UPS Socomec Hệ thống 2 chạy song song dự phòng N+1 bảo đảm tính sẵn sàng 99.999% cho Cảng HKQT Đà Nẵng.',
    qrCodeValue: 'DNCT-SYS-UPS-02-EQPT',
  },
  {
    id: 'BATT-3-UPS-2',
    code: 'BATT.3 UPS-2',
    name: 'Tủ Ắc Quy 3 (UPS 2)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 515, y: 340, width: 95, height: 85 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy lưu điện dự phòng chuỗi 3 cho hệ thống UPS-2.',
    qrCodeValue: 'DNCT-SYS-BATT-03-UPS-02',
  },
  {
    id: 'BATT-2-UPS-2',
    code: 'BATT.2 UPS-2',
    name: 'Tủ Ắc Quy 2 (UPS 2)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 615, y: 340, width: 95, height: 85 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy lưu điện dự phòng chuỗi 2 cho hệ thống UPS-2.',
    qrCodeValue: 'DNCT-SYS-BATT-02-UPS-02',
  },
  {
    id: 'BATT-1-UPS-2',
    code: 'BATT.1 UPS-2',
    name: 'Tủ Ắc Quy 1 (UPS 2)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 715, y: 340, width: 95, height: 85 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy lưu điện dự phòng chuỗi 1 cho hệ thống UPS-2.',
    qrCodeValue: 'DNCT-SYS-BATT-01-UPS-02',
  },

  // 10. DÃY TỦ PHÂN PHỐI ĐIỆN (DISTRIBUTION PANELS - DỌC TƯỜNG DƯỚI)
  {
    id: 'ESB-UPS-LTG',
    code: 'ESB-UPS LTG',
    name: 'Tủ ESB-UPS LTG (Chiếu Sáng Khẩn Cấp)',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Phân Phối Schneider Prisma',
    dimensions: { lengthMm: 1400, widthMm: 600, heightMm: 2200, levels: 1 },
    svgRect: { x: 35, y: 520, width: 140, height: 70 },
    colorTheme: {
      base: 'from-slate-100 to-slate-300 text-slate-900',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/20',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Tủ phân phối điện chiếu sáng khẩn cấp Emergency Switchboard (ESB) màu trắng kem Schneider có cánh kính bảo vệ. Cung cấp điện cho đèn sự cố, đèn thoát hiểm Exit.',
    qrCodeValue: 'DNCT-SYS-ESB-UPS-LTG',
  },
  {
    id: 'ESB-UPS-EQPT',
    code: 'ESB-UPS EQPT',
    name: 'Tủ ESB-UPS EQPT (Thiết Bị Khẩn Cấp)',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Phân Phối Schneider Prisma',
    dimensions: { lengthMm: 1400, widthMm: 600, heightMm: 2200, levels: 1 },
    svgRect: { x: 210, y: 520, width: 140, height: 70 },
    colorTheme: {
      base: 'from-slate-100 to-slate-300 text-slate-900',
      border: 'border-blue-500',
      glow: 'shadow-blue-500/20',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ phân phối điện cho thiết bị phụ trợ khẩn cấp phục vụ an ninh và thông tin liên lạc sân bay.',
    qrCodeValue: 'DNCT-SYS-ESB-UPS-EQPT',
  },
  {
    id: 'DP-UPS-LTG',
    code: 'DP-UPS LTG',
    name: 'Tủ DP-UPS LTG (Phân Phối Chiếu Sáng)',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Phân Phối Schneider Prisma',
    dimensions: { lengthMm: 1500, widthMm: 600, heightMm: 2200, levels: 1 },
    svgRect: { x: 355, y: 520, width: 150, height: 70 },
    colorTheme: {
      base: 'from-slate-100 to-slate-300 text-slate-900',
      border: 'border-cyan-500',
      glow: 'shadow-cyan-500/20',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      badgeText: 'text-cyan-300',
    },
    description: 'Tủ điện phân phối chính cho mạng lưới đèn chiếu sáng thường trực qua bộ lưu điện UPS.',
    qrCodeValue: 'DNCT-SYS-DP-UPS-LTG',
  },
  {
    id: 'DP-UPS-EQPT',
    code: 'DP-UPS EQPT',
    name: 'Tủ DP-UPS EQPT (Phân Phối Thiết Bị Chính)',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Phân Phối Schneider Prisma',
    dimensions: { lengthMm: 1700, widthMm: 600, heightMm: 2200, levels: 1 },
    svgRect: { x: 510, y: 520, width: 170, height: 70 },
    colorTheme: {
      base: 'from-slate-100 to-slate-300 text-slate-900',
      border: 'border-purple-500',
      glow: 'shadow-purple-500/20',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      badgeText: 'text-purple-300',
    },
    description: 'Tủ phân phối điện chính cho toàn bộ hệ thống máy chủ, băng chuyền hành lý BHS, radar và hạ tầng kỹ thuật T2.',
    qrCodeValue: 'DNCT-SYS-DP-UPS-EQPT',
  },

  // 11. CỤM ẮC QUY TƯỜNG TRÁI (LEFT WALL)
  {
    id: 'BATT-3',
    code: 'BATT.3',
    name: 'Dàn Ắc Quy Dự Phòng 3 (Tường Trái)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Mở',
    dimensions: { lengthMm: 650, widthMm: 600, heightMm: 1800, levels: 3 },
    svgRect: { x: 135, y: 145, width: 70, height: 65 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-slate-500',
      glow: 'shadow-slate-500/20',
      badgeBg: 'bg-slate-700 text-slate-300',
      badgeText: 'text-slate-300',
    },
    description: 'Khung giá đỡ ắc quy mở tầng dọc tường trái.',
    qrCodeValue: 'DNCT-SYS-BATT-03-WALL',
  },
  {
    id: 'BATT-2',
    code: 'BATT.2',
    name: 'Dàn Ắc Quy Dự Phòng 2 (Tường Trái)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Mở',
    dimensions: { lengthMm: 650, widthMm: 600, heightMm: 1800, levels: 3 },
    svgRect: { x: 135, y: 215, width: 70, height: 65 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-slate-500',
      glow: 'shadow-slate-500/20',
      badgeBg: 'bg-slate-700 text-slate-300',
      badgeText: 'text-slate-300',
    },
    description: 'Khung giá đỡ ắc quy mở tầng 2 dọc tường trái.',
    qrCodeValue: 'DNCT-SYS-BATT-02-WALL',
  },
  {
    id: 'BATT-1',
    code: 'BATT.1',
    name: 'Dàn Ắc Quy Dự Phòng 1 (Tường Trái)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Mở',
    dimensions: { lengthMm: 650, widthMm: 600, heightMm: 1800, levels: 3 },
    svgRect: { x: 135, y: 285, width: 70, height: 65 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-slate-500',
      glow: 'shadow-slate-500/20',
      badgeBg: 'bg-slate-700 text-slate-300',
      badgeText: 'text-slate-300',
    },
    description: 'Khung giá đỡ ắc quy mở tầng 1 dọc tường trái.',
    qrCodeValue: 'DNCT-SYS-BATT-01-WALL',
  },
  {
    id: 'NEW-UPS-LTG',
    code: 'NEW UPS-LTG',
    name: 'Tủ NEW UPS-LTG (Chiếu Sáng Thế Hệ Mới)',
    type: 'UPS_CABINET',
    categoryLabel: 'Tủ Nguồn UPS Module Mới',
    dimensions: { lengthMm: 1150, widthMm: 500, heightMm: 1900, levels: 1 },
    svgRect: { x: 115, y: 355, width: 90, height: 65 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/20',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Tủ nguồn UPS chiếu sáng mới kích thước 1150mm x 500mm theo đúng bản vẽ thiết kế.',
    qrCodeValue: 'DNCT-SYS-NEW-UPS-LTG',
  },
];

export const WarehouseMapView: React.FC<WarehouseMapViewProps> = ({
  materials,
  calculatedStocks,
  onSelectMaterial,
  onUpdateMaterialLocation,
}) => {
  // State management
  const [selectedEntityId, setSelectedEntityId] = useState<string>('KE-03'); // Default to Shelf 3 (from user photos)
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'2D_MAP' | 'FRONT_ELEVATION' | 'ISOMETRIC_3D'>('2D_MAP');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SHELVES' | 'TOOL_CABINETS' | 'ELECTRICAL_UPS' | 'LOW_STOCK'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLocationAssignModal, setShowLocationAssignModal] = useState(false);
  const [materialToAssign, setMaterialToAssign] = useState<Material | null>(null);
  const [targetLocationString, setTargetLocationString] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Normalized stock map (handling array or record)
  const stockMap = useMemo(() => {
    if (Array.isArray(calculatedStocks)) {
      const map: { [code: string]: CalculatedMaterialStock } = {};
      calculatedStocks.forEach((cs) => {
        if (cs && cs.code) {
          map[cs.code] = cs;
        }
      });
      return map;
    }
    return (calculatedStocks as { [code: string]: CalculatedMaterialStock }) || {};
  }, [calculatedStocks]);

  // Active selected entity
  const activeEntity = useMemo(() => {
    return WAREHOUSE_ENTITIES.find((e) => e.id === selectedEntityId) || WAREHOUSE_ENTITIES[4]; // Default to KE-03
  }, [selectedEntityId]);

  // Intelligent Material Mapping Algorithm
  // Maps materials from database to specific shelves based on `material.location`, name, and specs
  const entityMaterialsMap = useMemo(() => {
    const map: { [entityId: string]: Material[] } = {};
    WAREHOUSE_ENTITIES.forEach((e) => {
      map[e.id] = [];
    });

    materials.forEach((mat) => {
      const loc = (mat.location || '').toLowerCase().trim();
      const name = (mat.name || '').toLowerCase();
      const spec = (mat.specification || '').toLowerCase();
      const text = `${loc} ${name} ${spec}`;

      // Direct shelf code matches in `location`
      if (loc.includes('kệ 1') || loc.includes('ke 1') || loc.includes('ke-01') || loc.includes('k1')) {
        map['KE-01'].push(mat);
      } else if (loc.includes('kệ 2') || loc.includes('ke 2') || loc.includes('ke-02') || loc.includes('k2')) {
        map['KE-02'].push(mat);
      } else if (loc.includes('kệ 3') || loc.includes('ke 3') || loc.includes('ke-03') || loc.includes('k3')) {
        map['KE-03'].push(mat);
      } else if (loc.includes('kệ 4') || loc.includes('ke 4') || loc.includes('ke-04') || loc.includes('k4')) {
        map['KE-04'].push(mat);
      } else if (loc.includes('kệ 5') || loc.includes('ke 5') || loc.includes('ke-05') || loc.includes('k5')) {
        map['KE-05'].push(mat);
      } else if (loc.includes('tủ đồ nghề 1') || loc.includes('tdn-01') || loc.includes('tủ 1')) {
        map['TDN-01'].push(mat);
      } else if (loc.includes('tủ đồ nghề 2') || loc.includes('tdn-02') || loc.includes('tủ 2')) {
        map['TDN-02'].push(mat);
      }
      // Smart content-based classification for materials currently marked with generic "Kho Tổng"
      else if (
        text.includes('cadivi') ||
        text.includes('dây điện') ||
        text.includes('mcb') ||
        text.includes('rccb') ||
        text.includes('rcbo') ||
        text.includes('contactor') ||
        text.includes('rơ le') ||
        text.includes('role') ||
        text.includes('khởi động từ')
      ) {
        map['KE-03'].push(mat);
      } else if (
        text.includes('toto') ||
        text.includes('bồn cầu') ||
        text.includes('bồn tiểu') ||
        text.includes('silicon') ||
        text.includes('titebond') ||
        text.includes('lavabo') ||
        text.includes('xiphong') ||
        text.includes('vòi')
      ) {
        map['KE-02'].push(mat);
      } else if (text.includes('meanwell') || text.includes('nguồn') || text.includes('cosse') || text.includes('co nhiệt') || text.includes('biến áp')) {
        map['KE-04'].push(mat);
      } else if (text.includes('kìm') || text.includes('búa') || text.includes('mỏ lết') || text.includes('fluke') || text.includes('khoan')) {
        map['TDN-01'].push(mat);
      } else if (text.includes('mccb') || text.includes('acb') || text.includes('busbar') || text.includes('đồng trần') || text.includes('tiếp địa')) {
        map['KE-05'].push(mat);
      } else {
        // Distribute evenly among material shelves as general spare
        map['KE-01'].push(mat);
      }
    });

    return map;
  }, [materials]);

  // Filter materials for active entity
  const activeMaterials = useMemo(() => {
    let list = entityMaterialsMap[activeEntity.id] || [];
    if (selectedTier !== null && activeEntity.tiers) {
      const tierInfo = activeEntity.tiers.find((t) => t.tierNumber === selectedTier);
      if (tierInfo) {
        list = list.filter((m) => {
          const mText = `${m.name} ${m.specification} ${m.location || ''}`.toLowerCase();
          return tierInfo.itemKeywords.some((kw) => mText.includes(kw));
        });
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.specification.toLowerCase().includes(q) ||
          (m.brand && m.brand.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entityMaterialsMap, activeEntity, selectedTier, searchQuery]);

  // Entities highlighted by search query
  const matchedEntityIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    const matched = new Set<string>();

    WAREHOUSE_ENTITIES.forEach((ent) => {
      // Check entity name or notes
      if (
        ent.name.toLowerCase().includes(q) ||
        ent.categoryLabel.toLowerCase().includes(q) ||
        ent.description.toLowerCase().includes(q)
      ) {
        matched.add(ent.id);
      }

      // Check materials inside this entity
      const mats = entityMaterialsMap[ent.id] || [];
      const hasMat = mats.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.specification.toLowerCase().includes(q) ||
          (m.brand && m.brand.toLowerCase().includes(q))
      );
      if (hasMat) matched.add(ent.id);
    });

    return matched;
  }, [searchQuery, entityMaterialsMap]);

  // Quick statistics
  const totalShelvesCount = 5; // Kệ 1 -> Kệ 5
  const totalToolCabinetsCount = 2; // Tủ đồ nghề 1 & 2
  const totalAssignedMaterials = Object.values(entityMaterialsMap).reduce((acc, curr) => acc + curr.length, 0);

  // Handle location update assignment
  const handleAssignLocation = async () => {
    if (!materialToAssign || !targetLocationString.trim() || !onUpdateMaterialLocation) return;
    setIsAssigning(true);
    try {
      await onUpdateMaterialLocation(materialToAssign.code, targetLocationString.trim());
      setShowLocationAssignModal(false);
      setMaterialToAssign(null);
      setTargetLocationString('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Print shelf label
  const handlePrintShelfLabel = (entity: WarehouseShelfEntity) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      typeof window !== 'undefined'
        ? `${window.location.origin}/?scan=${encodeURIComponent(entity.code)}`
        : entity.code
    )}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tem Nhãn Kệ Kho - ${entity.name}</title>
          <style>
            @page { size: 100mm 75mm landscape; margin: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 10mm; background: #fff; color: #000; }
            .label-card { border: 2.5px solid #0f172a; border-radius: 8px; padding: 12px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
            .title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
            .sub { font-size: 10px; color: #475569; font-weight: 600; }
            .content { display: flex; gap: 14px; align-items: center; margin: 10px 0; }
            .qr-box { flex-shrink: 0; text-align: center; }
            .qr-box img { width: 90px; height: 90px; }
            .info { flex-grow: 1; }
            .entity-code { font-size: 24px; font-weight: 900; font-family: monospace; color: #1d4ed8; letter-spacing: 1px; }
            .dim { font-size: 11px; color: #334155; margin-top: 4px; font-weight: 600; }
            .footer { border-top: 1px dashed #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <div>
                <div class="title">CẢNG HKQT ĐÀ NẴNG - ĐỘI ĐNCT</div>
                <div class="sub">PHÒNG KỸ THUẬT ĐIỆN & KHO VẬT TƯ NHÀ GA T2</div>
              </div>
              <div style="font-size: 10px; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">QUẢN LÝ 5S</div>
            </div>
            <div class="content">
              <div class="qr-box">
                <img src="${qrUrl}" alt="QR" />
                <div style="font-size: 8px; font-weight: bold; margin-top: 2px;">QUÉT ĐỊNH DANH KỆ</div>
              </div>
              <div class="info">
                <div class="entity-code">${entity.code}</div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${entity.name}</div>
                <div class="dim">Kích thước: 1,5m (Dài) x 1,5m (Cao) x 0,5m (Rộng) - 4 Tầng</div>
                <div style="font-size: 10px; color: #475569; margin-top: 4px;">Phân loại: <strong>${entity.categoryLabel}</strong></div>
              </div>
            </div>
            <div class="footer">
              <span>Định danh hệ thống Smart Warehouse ĐNCT</span>
              <span>Tem dán giá kệ tiêu chuẩn</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Header & Interactive Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                  Sơ Đồ Phòng Kỹ Thuật &amp; Kệ Vật Tư Kho ĐNCT
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Bản Vẽ Kỹ Thuật 1:1 Chuẩn Thực Tế
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhà Ga Quốc Tế T2 • 2 Tủ Đồ Nghề + 5 Kệ Vật Tư 4 Tầng (1.5m x 1.5m x 0.5m) • Cụm Nguồn UPS Socomec &amp; Tủ Điện Schneider
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & View Mode Switcher */}
          <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('2D_MAP')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === '2D_MAP'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mặt Bằng 2D Kỹ Thuật</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('FRONT_ELEVATION')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'FRONT_ELEVATION'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Mặt Đứng Kệ (4 Tầng Thực Tế)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('ISOMETRIC_3D')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'ISOMETRIC_3D'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phối Cảnh 3D Không Gian</span>
              </button>
            </div>

            {/* Print Shelf Label Action */}
            <button
              type="button"
              onClick={() => handlePrintShelfLabel(activeEntity)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-blue-500/40 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="In tem nhãn dán khay kệ theo tiêu chuẩn 5S"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>In Tem Kệ {activeEntity.code}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Smart Material Locator Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm vật tư: MCB, CADIVI, TOTO, Lavabo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-[11px]">
            <span className="text-slate-500 font-semibold shrink-0">Lọc nhanh:</span>
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === 'ALL'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tất Cả Thiết Bị ({WAREHOUSE_ENTITIES.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SHELVES')}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === 'SHELVES'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              5 Kệ Vật Tư (4 Tầng)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('TOOL_CABINETS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === 'TOOL_CABINETS'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              2 Tủ Đồ Nghề
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ELECTRICAL_UPS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === 'ELECTRICAL_UPS'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Hệ Thống Nguồn UPS &amp; Tủ Điện
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left/Top Main Map & Visualizer Canvas (8 cols) */}
        <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
          {/* Canvas Toolbar overlay */}
          <div className="p-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Vị Trí Đang Chọn:
              </span>
              <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {activeEntity.name} ({activeEntity.code})
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {activeEntity.type === 'SHELF_4_TIER' ? '• Kích thước: 1,5m x 1,5m x 0,5m (4 Tầng)' : ''}
              </span>
            </div>

            {/* Zoom Controls for SVG */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition ml-1"
                title="Đặt lại góc nhìn chuẩn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Render Area */}
          <div className="relative min-h-[520px] lg:min-h-[580px] bg-slate-950 overflow-auto flex items-center justify-center p-3 select-none">
            {/* VIEW MODE 1: 2D ARCHITECTURAL CAD FLOOR PLAN */}
            {viewMode === '2D_MAP' && (
              <div
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
                className="w-full max-w-[950px] aspect-[950/620]"
              >
                <svg
                  viewBox="0 0 950 620"
                  className="w-full h-full drop-shadow-2xl"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Architectural hatch pattern for structural pillars & ventilation shafts */}
                    <pattern id="pillarHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
                    </pattern>

                    {/* Industrial Electrical Safety Warning Stripes (Vàng - Đen an toàn điện) */}
                    <pattern id="hazardStripe" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <rect width="10" height="20" fill="#eab308" />
                      <rect x="10" width="10" height="20" fill="#0f172a" />
                    </pattern>

                    {/* Floor tile grid pattern */}
                    <pattern id="floorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                  </defs>

                  {/* ROOM BACKGROUND (Sàn bê tông công nghiệp phủ Epoxy chống tĩnh điện) */}
                  <rect x="20" y="20" width="910" height="580" fill="#0b1120" stroke="#334155" strokeWidth="3" rx="4" />
                  <rect x="20" y="20" width="910" height="580" fill="url(#floorGrid)" />

                  {/* 5S WALKWAY LINE (Vạch sơn trắng phân định lối đi bộ an toàn từ cửa vào) */}
                  <path
                    d="M 830 50 L 830 160 L 70 160 L 70 490 L 830 490"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                    strokeDasharray="8 6"
                    opacity="0.4"
                  />
                  <text x="740" y="152" fill="#94a3b8" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                    🚶 LỐI ĐI BỘ AN TOÀN 5S
                  </text>

                  {/* SAFETY HAZARD STRIPES (Vạch sơn cảnh báo cách ly vàng - đen quanh cụm UPS và tủ điện) */}
                  {/* Quanh Cụm UPS 1 */}
                  <rect x="525" y="180" width="295" height="105" fill="none" stroke="url(#hazardStripe)" strokeWidth="6" rx="6" opacity="0.75" />
                  {/* Quanh Cụm UPS 2 */}
                  <rect x="425" y="330" width="395" height="105" fill="none" stroke="url(#hazardStripe)" strokeWidth="6" rx="6" opacity="0.75" />
                  {/* Quanh Dãy Tủ Phân Phối Tường Dưới */}
                  <rect x="25" y="510" width="665" height="88" fill="none" stroke="url(#hazardStripe)" strokeWidth="6" rx="6" opacity="0.75" />

                  {/* CỬA RA VÀO (Top-Right Door - Rộng 1350mm) */}
                  <g id="entrance-door">
                    <rect x="800" y="14" width="100" height="12" fill="#ef4444" rx="2" />
                    {/* Door swing arc */}
                    <path d="M 800 24 A 85 85 0 0 0 885 105" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
                    <line x1="800" y1="24" x2="800" y2="105" stroke="#ef4444" strokeWidth="3" />
                    <rect x="805" y="35" width="105" height="26" fill="#ef4444" rx="6" className="drop-shadow-lg" />
                    <text x="857" y="52" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                      CỬA RA VÀO
                    </text>
                    <text x="857" y="125" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">
                      Kích thước: 1350mm
                    </text>
                  </g>

                  {/* KHU VỰC TỦ VẬT TƯ (Top Wall Label as in Image 1) */}
                  <g id="material-area-badge">
                    <rect x="280" y="24" width="360" height="34" fill="#dc2626" rx="8" className="drop-shadow-md" />
                    <text x="460" y="47" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="1">
                      Khu vực tủ &amp; kệ vật tư (ĐNCT)
                    </text>
                  </g>

                  {/* CỘT KỸ THUẬT & HỘP THÔNG GIÓ (Hatched Shafts from Image 1) */}
                  {/* Left Column 500x600 */}
                  <rect x="20" y="380" width="65" height="85" fill="url(#pillarHatch)" stroke="#475569" strokeWidth="2" />
                  <text x="52" y="425" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                    500x600
                  </text>
                  {/* Right Wall Shaft */}
                  <rect x="865" y="380" width="65" height="85" fill="url(#pillarHatch)" stroke="#475569" strokeWidth="2" />
                  <text x="897" y="425" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                    HỘP GIÓ
                  </text>

                  {/* MÁNG CÁP THẲNG ĐỨNG (Galvanized Vertical Trunking/Riser Column) - Seen in all photos */}
                  <g id="cable-riser">
                    <rect x="420" y="235" width="30" height="60" fill="#64748b" stroke="#cbd5e1" strokeWidth="2" rx="2" />
                    <line x1="420" y1="250" x2="450" y2="250" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="420" y1="265" x2="450" y2="265" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="420" y1="280" x2="450" y2="280" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="435" y="310" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Máng Cáp
                    </text>
                  </g>

                  {/* DIMENSION LINES & LABELS FROM IMAGE 1 */}
                  {/* Distance from top door wall: 1670mm */}
                  <line x1="785" y1="20" x2="785" y2="185" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <text x="775" y="110" fill="#38bdf8" fontSize="10" fontWeight="bold" transform="rotate(-90 775 110)">
                    1670 mm
                  </text>

                  {/* Distance between row 1 & row 2: 1000mm */}
                  <line x1="820" y1="275" x2="820" y2="335" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <text x="832" y="310" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    1000 mm
                  </text>

                  {/* Distance from row 2 to bottom: 1950mm */}
                  <line x1="820" y1="430" x2="820" y2="515" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <text x="825" y="475" fill="#38bdf8" fontSize="10" fontWeight="bold" transform="rotate(-90 825 475)">
                    1950 mm
                  </text>

                  {/* Distance from bottom panels to right wall: 2750mm */}
                  <line x1="685" y1="560" x2="930" y2="560" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <text x="790" y="552" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                    2750 mm
                  </text>

                  {/* RENDER ALL INTERACTIVE WAREHOUSE ENTITIES */}
                  {WAREHOUSE_ENTITIES.map((entity) => {
                    const isSelected = selectedEntityId === entity.id;
                    const isMatched = matchedEntityIds.has(entity.id);
                    const matCount = (entityMaterialsMap[entity.id] || []).length;
                    const isShelf = entity.type === 'SHELF_4_TIER';
                    const isTool = entity.type === 'TOOL_CABINET';

                    // Determine stroke color and glow
                    let strokeColor = isSelected ? '#38bdf8' : isMatched ? '#f59e0b' : '#475569';
                    let strokeW = isSelected ? 3.5 : isMatched ? 3 : 1.5;

                    return (
                      <g
                        key={entity.id}
                        id={`entity-svg-${entity.id}`}
                        className="cursor-pointer transition-all duration-200 group"
                        onClick={() => {
                          setSelectedEntityId(entity.id);
                          setSelectedTier(null);
                        }}
                      >
                        {/* Radar Pulse Effect for Searched / Selected Shelf */}
                        {(isSelected || isMatched) && (
                          <rect
                            x={entity.svgRect.x - 4}
                            y={entity.svgRect.y - 4}
                            width={entity.svgRect.width + 8}
                            height={entity.svgRect.height + 8}
                            fill="none"
                            stroke={isSelected ? '#38bdf8' : '#f59e0b'}
                            strokeWidth="2"
                            rx="6"
                            className="animate-pulse"
                            opacity="0.8"
                          />
                        )}

                        {/* Shelf/Cabinet Base Rect */}
                        <rect
                          x={entity.svgRect.x}
                          y={entity.svgRect.y}
                          width={entity.svgRect.width}
                          height={entity.svgRect.height}
                          fill={
                            isShelf
                              ? isSelected
                                ? '#1e293b'
                                : '#0f172a'
                              : isTool
                              ? '#1e3a8a'
                              : entity.type === 'UPS_CABINET'
                              ? '#334155'
                              : entity.type === 'DISTRIBUTION_BOARD'
                              ? '#f1f5f9'
                              : '#1e293b'
                          }
                          stroke={strokeColor}
                          strokeWidth={strokeW}
                          rx="4"
                          className="drop-shadow-lg transition-colors group-hover:fill-slate-800"
                        />

                        {/* Visual Shelf Tier Dividers for 4-Tier Shelves */}
                        {isShelf && (
                          <>
                            {/* Inner rack lines representing 4 levels */}
                            <line
                              x1={entity.svgRect.x}
                              y1={entity.svgRect.y + entity.svgRect.height * 0.25}
                              x2={entity.svgRect.x + entity.svgRect.width}
                              y2={entity.svgRect.y + entity.svgRect.height * 0.25}
                              stroke="#334155"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                            <line
                              x1={entity.svgRect.x}
                              y1={entity.svgRect.y + entity.svgRect.height * 0.5}
                              x2={entity.svgRect.x + entity.svgRect.width}
                              y2={entity.svgRect.y + entity.svgRect.height * 0.5}
                              stroke="#334155"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                            <line
                              x1={entity.svgRect.x}
                              y1={entity.svgRect.y + entity.svgRect.height * 0.75}
                              x2={entity.svgRect.x + entity.svgRect.width}
                              y2={entity.svgRect.y + entity.svgRect.height * 0.75}
                              stroke="#334155"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                          </>
                        )}

                        {/* Label Badge on Shelf */}
                        <text
                          x={entity.svgRect.x + entity.svgRect.width / 2}
                          y={entity.svgRect.y + entity.svgRect.height / 2 - (isShelf ? 6 : 2)}
                          fill={entity.type === 'DISTRIBUTION_BOARD' ? '#0f172a' : '#ffffff'}
                          fontSize={isShelf || isTool ? 11 : 9.5}
                          fontWeight="900"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {entity.code}
                        </text>

                        {/* Shelf specs or subtitle */}
                        <text
                          x={entity.svgRect.x + entity.svgRect.width / 2}
                          y={entity.svgRect.y + entity.svgRect.height / 2 + 10}
                          fill={entity.type === 'DISTRIBUTION_BOARD' ? '#334155' : '#94a3b8'}
                          fontSize={isShelf ? 8 : 7.5}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {isShelf ? '4 TẦNG • 1.5M' : isTool ? 'TỦ ĐỒ NGHỀ' : entity.type === 'UPS_CABINET' ? 'SOCOMEC' : 'PRISMA'}
                        </text>

                        {/* Material Count Pill on Shelves */}
                        {(isShelf || isTool) && matCount > 0 && (
                          <g transform={`translate(${entity.svgRect.x + entity.svgRect.width - 24}, ${entity.svgRect.y + 4})`}>
                            <rect width="20" height="13" rx="4" fill="#3b82f6" />
                            <text x="10" y="9.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                              {matCount}
                            </text>
                          </g>
                        )}

                        {/* QR Code tiny badge on shelf corner */}
                        <circle
                          cx={entity.svgRect.x + 8}
                          cy={entity.svgRect.y + 8}
                          r="4"
                          fill={isSelected ? '#38bdf8' : '#64748b'}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* VIEW MODE 2: REALISTIC FRONT ELEVATION OF 4-TIER SHELVES (Khớp ảnh thực tế 100%) */}
            {viewMode === 'FRONT_ELEVATION' && (
              <div className="w-full max-w-4xl py-2 space-y-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-mono font-black text-xs">
                        {activeEntity.code}
                      </span>
                      <h3 className="text-base font-black text-white">{activeEntity.name}</h3>
                      <span className="text-xs text-amber-400 font-semibold">
                        (Dài 1.5m x Cao 1.5m x Rộng 0.5m • 4 Tầng Sắt V Lỗ)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{activeEntity.description}</p>
                  </div>

                  {/* Direct Shelf Switcher Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                    {WAREHOUSE_ENTITIES.filter((e) => e.type === 'SHELF_4_TIER' || e.type === 'TOOL_CABINET').map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setSelectedEntityId(e.id);
                          setSelectedTier(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                          selectedEntityId === e.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {e.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* THE 4-TIER METALLIC INDUSTRIAL SHELF RACK (Sắt V lỗ xám công nghiệp) */}
                <div className="border-4 border-slate-700 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-xl p-4 shadow-2xl relative space-y-3">
                  {/* Top Rack Header Beam */}
                  <div className="h-6 bg-slate-800 border-b-2 border-slate-700 rounded-t flex items-center justify-between px-3 text-[10px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      <Tag className="w-3 h-3 text-blue-400" />
                      KỆ KHO ĐNCT • TIÊU CHUẨN 5S • DÀI 1500MM x NGANG 1500MM x SÂU 500MM
                    </span>
                    <span>KHAY KỆ 4 TẦNG CHỊU TẢI 250KG/TẦNG</span>
                  </div>

                  {/* Render 4 Tiers from Top (Tầng 4) to Bottom (Tầng 1) */}
                  {(activeEntity.tiers || []).slice().reverse().map((tier) => {
                    const isTierSelected = selectedTier === tier.tierNumber;
                    const tierMats = (entityMaterialsMap[activeEntity.id] || []).filter((m) => {
                      const mText = `${m.name} ${m.specification} ${m.location || ''}`.toLowerCase();
                      return tier.itemKeywords.some((kw) => mText.includes(kw));
                    });

                    return (
                      <div
                        key={tier.tierNumber}
                        onClick={() => setSelectedTier(isTierSelected ? null : tier.tierNumber)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isTierSelected
                            ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Tier Beam Header & Label Tag */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-black text-xs border border-slate-700">
                              {tier.label}
                            </span>
                            <span className="text-xs font-bold text-slate-200">
                              {tier.categoryDesc}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {tierMats.length} vật tư đang lưu trữ
                          </span>
                        </div>

                        {/* Physical Item Visualizer on Shelf (Bins, Boxes, CADIVI Coils as in photos) */}
                        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {/* Visual representation based on photo archetype */}
                          {tier.visualType === 'blue-bins' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-blue-600/20 border-2 border-blue-500/60 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md hover:bg-blue-600/30 transition"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-blue-300 font-bold">
                                    <span>KHAY XANH #{idx + 1}</span>
                                    <Boxes className="w-3 h-3" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-blue-200/80 font-mono">
                                    Phân loại khí cụ đóng cắt
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'cadivi-coils' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-amber-500/10 border-2 border-amber-500/50 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                                    <span>CUỘN CADIVI</span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-amber-300/80 font-mono">
                                    Dây cáp điện Tầng 1
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'clear-boxes' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-800/80 border-2 border-slate-600 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md relative overflow-hidden"
                                >
                                  {/* Red/Orange handle on top of clear plastic box */}
                                  <div className="h-1.5 w-10 bg-red-500 rounded-full mx-auto mb-1" />
                                  <div className="text-[10px] text-slate-400 font-bold">
                                    HỘP QUAI ĐỎ #{idx + 1}
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-100 line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-emerald-400 font-mono">
                                    Linh kiện TOTO / Rơ-le
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'cardboard-boxes' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-yellow-900/20 border-2 border-yellow-700/60 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-yellow-500 font-bold">
                                    <span>THÙNG CARTON</span>
                                    <Package className="w-3 h-3" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-yellow-400/80 font-mono">
                                    Phụ kiện nguyên hộp
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          {tier.visualType === 'tool-case' && (
                            <>
                              {tier.sampleItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-cyan-950/30 border-2 border-cyan-500/50 rounded-lg p-2 flex flex-col justify-between min-h-[75px] shadow-md"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold">
                                    <span>DỤNG CỤ THI CÔNG</span>
                                    <Wrench className="w-3 h-3" />
                                  </div>
                                  <div className="text-[11px] font-bold text-white line-clamp-2">
                                    {item}
                                  </div>
                                  <div className="text-[9px] text-cyan-300 font-mono">
                                    Thiết bị kiểm chuẩn
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW MODE 3: 3D ISOMETRIC INDUSTRIAL WAREHOUSE PROJECTION */}
            {viewMode === 'ISOMETRIC_3D' && (
              <div className="w-full max-w-3xl py-4 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl max-w-xl">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/30">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-base font-black text-white">
                    Phối Cảnh 3D Phòng Kỹ Thuật ĐNCT &amp; Kệ Kho T2
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Mô hình không gian 3D thể hiện toàn bộ layout: 2 Tủ đồ nghề + 5 Kệ vật tư 4 tầng (1.5m x 1.5m x 0.5m) xếp dọc tường, đối diện là 2 dãy tủ UPS Socomec công nghiệp và dãy tủ phân phối Schneider Prisma.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5 text-left text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Tường trên:</div>
                      <div className="font-bold text-white mt-0.5">2 Tủ + 5 Kệ Vật Tư</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">Kệ sắt 4 tầng 1.5m</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Trung tâm phòng:</div>
                      <div className="font-bold text-white mt-0.5">2 Cụm UPS Socomec</div>
                      <div className="text-[10px] text-yellow-400 mt-0.5">Dàn ắc quy DC dự phòng</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Tường dưới:</div>
                      <div className="font-bold text-white mt-0.5">4 Tủ Schneider</div>
                      <div className="text-[10px] text-blue-400 mt-0.5">ESB &amp; DP Switchboards</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('2D_MAP')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/30"
                    >
                      Xem Bản Vẽ 2D CAD Chi Tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('FRONT_ELEVATION')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700"
                    >
                      Soi Từng Tầng Kệ Thực Tế
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right/Sidebar Detail Drawer: Material Dossier at Selected Location (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Active Shelf/Equipment Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
            {/* Header info */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white font-mono font-black text-xs">
                    {activeEntity.code}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {activeEntity.type === 'SHELF_4_TIER'
                      ? 'Kệ Vật Tư 4 Tầng'
                      : activeEntity.type === 'TOOL_CABINET'
                      ? 'Tủ Đồ Nghề Kỹ Thuật'
                      : 'Hệ Thống Nguồn Điện'}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">{activeEntity.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{activeEntity.description}</p>
              </div>

              {/* Shelf QR Code preview */}
              <div className="shrink-0 bg-white p-1.5 rounded-lg shadow-md flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/?scan=${encodeURIComponent(activeEntity.code)}`
                      : activeEntity.code
                  )}`}
                  alt="QR"
                  className="w-14 h-14 object-contain"
                />
                <span className="text-[8px] font-mono text-slate-800 mt-0.5 font-black">QR KỆ</span>
              </div>
            </div>

            {/* Technical Dimensions Box */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">CHIỀU DÀI</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {(activeEntity.dimensions.lengthMm / 1000).toFixed(1)} m
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">CHIỀU NGANG/CAO</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {(activeEntity.dimensions.heightMm / 1000).toFixed(1)} m
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">ĐỘ RỘNG/SÂU</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {(activeEntity.dimensions.widthMm / 10).toFixed(0)} cm
                </div>
              </div>
            </div>

            {/* Print Shelf Label Action */}
            <button
              type="button"
              onClick={() => handlePrintShelfLabel(activeEntity)}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-blue-500/40 transition text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>In Tem Nhãn Định Danh Kệ (Dán Lên Khay/Kệ)</span>
            </button>
          </div>

          {/* List of Materials stored at this location */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  Danh Sách Vật Tư Tại Vị Trí Này
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {activeMaterials.length} mã vật tư
              </span>
            </div>

            {/* Scrollable Material Items List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activeMaterials.length > 0 ? (
                activeMaterials.map((mat) => {
                  const stock = stockMap[mat.code]?.currentStock ?? mat.initialStock;
                  const isLow = stock <= mat.minStock;
                  const isOut = stock <= 0;

                  return (
                    <div
                      key={mat.id}
                      onClick={() => onSelectMaterial(mat)}
                      className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 hover:border-blue-500/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-300">
                            {mat.code}
                          </span>
                          {mat.brand && (
                            <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                              {mat.brand}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold text-white truncate mt-0.5 group-hover:text-blue-300 transition">
                          {mat.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {mat.specification || 'Quy cách chuẩn ĐNCT'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono text-xs font-black ${
                            isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatNumber(stock)} {mat.unit}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          Định mức: {mat.minStock}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center space-y-2 bg-slate-950 rounded-xl border border-slate-800/60">
                  <Package className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Chưa có vật tư nào được gán cụ thể cho vị trí này.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bạn có thể cập nhật vị trí trong danh mục vật tư hoặc dán cột Vị Trí trên Google Sheet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
