import { WarehouseShelfEntity } from '../types';

/**
 * DEFAULT_WAREHOUSE_ENTITIES
 * Bản vẽ kỹ thuật số 2D/3D phòng kho & thiết bị ĐNCT (Nhà Ga T2 - Cảng HKQT Đà Nẵng)
 * Tương thích 100% với sơ đồ bố trí kho mới:
 * 
 * - Dãy tường trên: KE-05, KE-04, KE-03, KE-02, KE-01, TĐN-02, TĐN-01, Bình PCCC, Cửa ra vào
 * - Dọc tường trái (Khu vực có vạch sơn an toàn điện vàng/đen): BATT.3, BATT.2, BATT.1, NEW UPS LTG (Schneider)
 * - Cụm giữa trên (Vạch an toàn điện): UPS-1 EQPT (Socomec), BATT.2 UPS-1, BATT.1 UPS-1
 * - Cụm giữa dưới (Vạch an toàn điện): UPS-2 EQPT (Socomec), BATT.3 UPS-2, BATT.2 UPS-2, BATT.1 UPS-2
 * - Dãy tường dưới: ESB-UPS LTG, ESB-UPS EQPT, DP-UPS LTG, DP-UPS EQPT
 * 
 * QUY TẮC ĐẶT MÃ QR:
 * - Kệ: DNCT-WH-KE-01 (Mã QR Định Danh Kệ)
 * - Khay: DNCT-WH-KE-01-T4-KH01 (Mã QR In Tem Dán Khay)
 * - Tầng: Sắp xếp số tầng theo thứ tự trên cùng là Tầng 1 (Tận dụng tầng trống nóc kệ để vật tư cồng kềnh)
 */

export const DEFAULT_WAREHOUSE_ENTITIES: WarehouseShelfEntity[] = [
  // 1. KỆ 5 (Kệ sắt 5 tầng lưu trữ - Tầng 1 trên cùng là nóc kệ tận dụng)
  {
    id: 'KE-05',
    code: 'KE-05',
    name: 'KỆ VẬT TƯ SỐ 5',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Thiết Bị Đóng Cắt Lớn & Đồng Busbar',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1800, levels: 5 },
    svgRect: { x: 28, y: 30, width: 122, height: 75 },
    colorTheme: {
      base: 'from-emerald-600/30 to-slate-900',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/30',
      badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Kệ sắt v lỗ chuyên dụng chứa aptomat công suất lớn MCCB, máy cắt ACB, cọc tiếp địa đồng D16 và thanh đồng Busbar.',
    qrCodeValue: 'DNCT-WH-KE-05',
    notes: 'Kệ đầu tiên bên trái dãy tường trên. Tầng 1 trên cùng tận dụng chứa vật tư cồng kềnh.',
    tiers: [
      {
        tierNumber: 1,
        label: 'Tầng 1 (Nóc Kệ Trên Cùng - Tận Dụng Để Vật Tư)',
        categoryDesc: 'Nóc kệ: Thùng phụ kiện ACB, hộp phụ tùng dự phòng cồng kềnh, cuộn dây tiếp địa lớn',
        itemKeywords: ['acb', 'phụ kiện', 'hộp', 'cuộn', 'tiếp địa', 'nóc'],
        visualType: 'cardboard-boxes',
        sampleItems: ['Thùng phụ kiện máy cắt không khí ACB Masterpact', 'Hộp tiếp điểm phụ Schneider ACB', 'Cuộn cáp đồng tiếp địa lớn'],
        compartments: [
          {
            id: 'KE-05-T1-KH01',
            code: 'KH01',
            name: 'Khay 1: Thùng cơ cấu đóng cắt máy cắt không khí ACB & Cuộn đóng Shunt Trip',
            visualType: 'cardboard-boxes',
            itemKeywords: ['acb', 'shunt trip', 'masterpact'],
            sampleItems: ['Cuộn đóng MX/XF 220VAC Schneider Masterpact NW'],
            assignedMaterialCodes: [
              'DN_VT_CXV00_07', 'DN_VT_CXV00_08', 'DN_VT_TDIEN_01', 'DN_VT_TDIEN_07', 'DN_VT_MCBSC_10'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T1-KH01',
          },
          {
            id: 'KE-05-T1-KH02',
            code: 'KH02',
            name: 'Khay 2: Hộp tiếp điểm phụ máy cắt ACB OF/SDE/AL & Motor lên cót MCH',
            visualType: 'cardboard-boxes',
            itemKeywords: ['tiếp điểm', 'mch', 'lên cót'],
            sampleItems: ['Motor nạp lò xo MCH 220VAC cho ACB'],
            assignedMaterialCodes: [
              'DN_VT_CXV00_09', 'DN_VT_MCBSC_11', 'DN_VT_MCBSC_12', 'DN_VT_MCBSC_13', 'DN_VT_MCBSC_16', 'DN_VT_MCBSC_17', 'DN_VT_MCBSC_18'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T1-KH02',
          },
        ],
      },
      {
        tierNumber: 2,
        label: 'Tầng 2 (Mâm Lửng Trên)',
        categoryDesc: 'Aptomat khối MCCB 3 Pha Schneider NSX 100A, 160A, 250A',
        itemKeywords: ['mccb', 'nsx', '100a', '160a', '250a', 'schneider'],
        visualType: 'clear-boxes',
        sampleItems: ['MCCB Schneider NSX100F 3P 100A 36kA', 'MCCB Schneider NSX160F 3P 160A 36kA', 'MCCB Schneider NSX250F 3P 250A 36kA'],
        compartments: [
          {
            id: 'KE-05-T2-KH01',
            code: 'KH01',
            name: 'Khay 1: Aptomat khối MCCB Schneider NSX100F 3P 100A 36kA',
            visualType: 'clear-boxes',
            itemKeywords: ['mccb 100a', 'nsx100'],
            sampleItems: ['MCCB NSX100F TMD 100A'],
            assignedMaterialCodes: [
              'DN_VT_MCCBS_01', 'DN_VT_MCCBS_02', 'DN_VT_HTRLM_01', 'DN_VT_HTRLM_02', 'DN_VT_00MCT_07', 'DN_VT_HTCTB_01', 'DN_VT_MCBSC_21', 'DN_VT_MCBSC_22', 'DN_VT_MCBSC_23', 'DN_VT_MCBSC_24', 'DN_VT_MCBSC_25', 'DN_VT_MCBSC_26', 'DN_VT_MCBSC_27', 'DN_VT_MCBSC_28', 'DN_VT_MCBSC_29', 'DN_VT_MCBSC_30'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T2-KH01',
          },
          {
            id: 'KE-05-T2-KH02',
            code: 'KH02',
            name: 'Khay 2: Aptomat khối MCCB Schneider NSX160F 3P 160A 36kA',
            visualType: 'clear-boxes',
            itemKeywords: ['mccb 160a', 'nsx160'],
            sampleItems: ['MCCB NSX160F TMD 160A'],
            assignedMaterialCodes: [
              'DN_VT_MCCBS_03', 'DN_VT_MCCBS_04', 'DN_VT_MCBSC_31', 'DN_VT_MCBSC_32', 'DN_VT_MCBSC_33', 'DN_VT_MCBSC_34', 'DN_VT_MCCBS_05', 'DN_VT_MCCBS_06', 'DN_VT_MCCBS_13', 'DN_VT_MCCBS_14', 'DN_VT_MCCBS_18', 'DN_VT_MCCBS_19', 'DN_VT_MCCBS_20', 'DN_VT_MCCBS_21'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T2-KH02',
          },
          {
            id: 'KE-05-T2-KH03',
            code: 'KH03',
            name: 'Khay 3: Aptomat khối MCCB Schneider NSX250F 3P 250A 36kA',
            visualType: 'clear-boxes',
            itemKeywords: ['mccb 250a', 'nsx250'],
            sampleItems: ['MCCB NSX250F TMD 250A'],
            assignedMaterialCodes: ['DN_VT_MCCBS_07', 'DN_VT_MCCBS_08'],
            qrCodeValue: 'DNCT-WH-KE-05-T2-KH03',
          },
        ],
      },
      {
        tierNumber: 3,
        label: 'Tầng 3 (Mâm Lửng Giữa)',
        categoryDesc: 'MCCB cỡ trung 400A, 630A & Micrologic điều khiển điện tử',
        itemKeywords: ['mccb 400a', '630a', 'nsx400', 'micrologic'],
        visualType: 'clear-boxes',
        sampleItems: ['MCCB Schneider NSX400F 3P 400A', 'MCCB Schneider NSX630F 3P 630A', 'Trip Unit Micrologic 2.3'],
        compartments: [
          {
            id: 'KE-05-T3-KH01',
            code: 'KH01',
            name: 'Khay 1: Aptomat khối MCCB Schneider NSX400F 3P 400A Micrologic 2.3',
            visualType: 'clear-boxes',
            itemKeywords: ['nsx400', 'mccb 400a'],
            sampleItems: ['MCCB 3P 400A Schneider NSX400F'],
            assignedMaterialCodes: [
              'DN_VT_MCCBS_09', 'DN_VT_MCCBS_10', 'DN_CC_HTVCB_01', 'DN_CC_HTVCB_02', 'DN_VT_HTDCN_01', 'DN_VT_CONTC_05', 'DN_VT_CONTC_06', 'DN_VT_CONTC_07', 'DN_VT_CONTC_08', 'DN_VT_CONTC_09', 'DN_VT_CONTC_10', 'DN_VT_CONTC_11', 'DN_VT_CONTC_12'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T3-KH01',
          },
          {
            id: 'KE-05-T3-KH02',
            code: 'KH02',
            name: 'Khay 2: Aptomat khối MCCB Schneider NSX630F 3P 630A Micrologic 2.3',
            visualType: 'clear-boxes',
            itemKeywords: ['nsx630', 'mccb 630a'],
            sampleItems: ['MCCB 3P 630A Schneider NSX630F'],
            assignedMaterialCodes: ['DN_VT_MCCBS_11', 'DN_VT_MCCBS_12'],
            qrCodeValue: 'DNCT-WH-KE-05-T3-KH02',
          },
        ],
      },
      {
        tierNumber: 4,
        label: 'Tầng 4 (Mâm Lửng Dưới)',
        categoryDesc: 'Cuộn Shunt Trip MX, cuộn bảo vệ thấp áp MN, tay vặn xoay ngoài',
        itemKeywords: ['shunt trip', 'mx', 'mn', 'tay vặn', 'phụ kiện mccb'],
        visualType: 'clear-boxes',
        sampleItems: ['Cuộn cắt Shunt trip MX 220VAC Schneider', 'Cuộn điện áp thấp MN 220VAC', 'Cơ cấu tay quay xoay ngoài cửa tủ'],
        compartments: [
          {
            id: 'KE-05-T4-KH01',
            code: 'KH01',
            name: 'Khay 1: Cuộn cắt Shunt Trip MX 220-240VAC Schneider NSX',
            visualType: 'clear-boxes',
            itemKeywords: ['shunt trip mx', 'cắt từ xa'],
            sampleItems: ['Cuộn Shunt Trip MX LV429387'],
            assignedMaterialCodes: [
              'DN_VT_MCCBS_15', 'DN_VT_HTCDM_01', 'DN_VT_HTCHM_01', 'DN_VT_RCBOS_01', 'DN_VT_RCBOS_02', 'DN_VT_RCBOS_03', 'DN_VT_RCBOS_04', 'DN_VT_RCBOS_05', 'DN_VT_RCBOS_06', 'DN_VT_RCBOS_07'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T4-KH01',
          },
          {
            id: 'KE-05-T4-KH02',
            code: 'KH02',
            name: 'Khay 2: Cuộn bảo vệ điện áp thấp MN 220-240VAC Schneider NSX',
            visualType: 'clear-boxes',
            itemKeywords: ['cuộn mn', 'thấp áp'],
            sampleItems: ['Cuộn Under-voltage release MN LV429407'],
            assignedMaterialCodes: [
              'DN_VT_MCCBS_16', 'DN_VT_SPDSN_04', 'DN_VT_SPDSN_05'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T4-KH02',
          },
          {
            id: 'KE-05-T4-KH03',
            code: 'KH03',
            name: 'Khay 3: Tay quay xoay nối dài ngoài cánh tủ (Rotary Handle) NSX100-250',
            visualType: 'clear-boxes',
            itemKeywords: ['tay xoay', 'rotary handle'],
            sampleItems: ['Tay vặn xoay mặt tủ Schneider LV429338'],
            assignedMaterialCodes: ['DN_VT_MCCBS_17'],
            qrCodeValue: 'DNCT-WH-KE-05-T4-KH03',
          },
        ],
      },
      {
        tierNumber: 5,
        label: 'Tầng 5 (Mâm Đáy Sát Sàn)',
        categoryDesc: 'Thanh đồng thanh cái Busbar, cọc tiếp địa đồng D16, cáp bện đồng trần',
        itemKeywords: ['đồng', 'thanh cái', 'tiếp địa', 'cọc đồng', 'busbar'],
        visualType: 'cadivi-coils',
        sampleItems: ['Cọc tiếp địa đồng nguyên chất phi 16 dài 2.4m', 'Thanh đồng cái Busbar 30x5mm mạ thiếc', 'Cuộn cáp đồng trần M50 thoát sét tiếp đất'],
        compartments: [
          {
            id: 'KE-05-T5-KH01',
            code: 'KH01',
            name: 'Khay 1: Cọc tiếp địa đồng nguyên chất phi 16 (D16) dài 2.4m',
            visualType: 'cadivi-coils',
            itemKeywords: ['cọc tiếp địa', 'd16', 'cọc đồng'],
            sampleItems: ['Cọc tiếp địa D16x2400mm kèm kẹp tiếp địa'],
            assignedMaterialCodes: [
              'DN_VT_COTSC_13', 'DN_VT_OCDNG_01', 'DN_VT_OCDNG_02', 'DN_VT_OCDNG_03', 'DN_VT_OCDNG_04', 'DN_VT_OCDNG_05', 'DN_VT_OCDNG_06', 'DN_VT_OCDNG_07', 'DN_VT_OCDNG_08', 'DN_VT_OCDNG_09', 'DN_VT_OCDNG_10', 'DN_VT_OCDNG_11', 'DN_VT_OCDNG_12', 'DN_VT_OCDNG_13'
            ],
            qrCodeValue: 'DNCT-WH-KE-05-T5-KH01',
          },
          {
            id: 'KE-05-T5-KH02',
            code: 'KH02',
            name: 'Khay 2: Thanh cái đồng Busbar 30x5mm & 40x5mm mạ thiếc tủ điện',
            visualType: 'cadivi-coils',
            itemKeywords: ['thanh đồng', 'busbar', 'mạ thiếc'],
            sampleItems: ['Thanh đồng tiếp địa tủ điện 30x5mm khoan lỗ sẵn M8'],
            assignedMaterialCodes: ['DN_VT_COTSC_14'],
            qrCodeValue: 'DNCT-WH-KE-05-T5-KH02',
          },
          {
            id: 'KE-05-T5-KH03',
            code: 'KH03',
            name: 'Khay 3: Cuộn dây cáp đồng trần M50, M70 thoát sét bọc ống ghen PVC',
            visualType: 'cadivi-coils',
            itemKeywords: ['đồng trần', 'm50', 'm70', 'thoát sét'],
            sampleItems: ['Cáp đồng trần bện M50 7 sợi'],
            assignedMaterialCodes: ['DN_VT_COTSC_15'],
            qrCodeValue: 'DNCT-WH-KE-05-T5-KH03',
          },
        ],
      },
    ],
  },

  // 2. KỆ 4 (Kệ sắt 5 tầng lưu trữ - Tầng 1 trên cùng là nóc kệ tận dụng)
  {
    id: 'KE-04',
    code: 'KE-04',
    name: 'KỆ VẬT TƯ SỐ 4',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Nguồn Meanwell, Biến Áp & Đầu Cosse',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1800, levels: 5 },
    svgRect: { x: 158, y: 30, width: 122, height: 75 },
    colorTheme: {
      base: 'from-emerald-600/30 to-slate-900',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/30',
      badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Kệ sắt v lỗ chứa bộ nguồn công nghiệp Meanwell, biến áp điều khiển, co nhiệt và các loại đầu cosse SC/ghim/chĩa.',
    qrCodeValue: 'DNCT-WH-KE-04',
    notes: 'Kệ số 4 trên dãy tường trên. Tầng 1 trên cùng tận dụng chứa vật tư cồng kềnh.',
    tiers: [
      {
        tierNumber: 1,
        label: 'Tầng 1 (Nóc Kệ Trên Cùng - Tận Dụng Để Vật Tư)',
        categoryDesc: 'Nóc kệ: Thùng biến áp cách ly 220V/24V, cuộn ống gen co nhiệt lớn, hộp dây rút cuộn',
        itemKeywords: ['biến áp', 'ống gen', 'co nhiệt', 'dây rút', 'nóc'],
        visualType: 'cardboard-boxes',
        sampleItems: ['Biến áp cách ly điều khiển 220V/24V 500VA', 'Cuộn ống gen nhiệt phi 25/30/50', 'Thùng dây rút nhựa 300mm/400mm'],
        compartments: [
          {
            id: 'KE-04-T1-KH01',
            code: 'KH01',
            name: 'Khay 1: Biến áp cách ly điều khiển 220VAC / 24VAC 500VA',
            visualType: 'cardboard-boxes',
            itemKeywords: ['biến áp', 'cách ly', '500va'],
            sampleItems: ['Biến áp cách ly Standa/Lion 500VA'],
            assignedMaterialCodes: [
              'DN_VT_DSTA0_01', 'DN_VT_ADTER_01', 'DN_VT_ADTER_03', 'DN_VT_DC12V_07', 'DN_VT_DNPAN_02', 'DN_VT_DNPAN_03', 'DN_VT_DNPAN_04', 'DN_VT_DNPAN_05', 'DN_VT_DNPAN_06', 'DN_VT_DNPAN_07', 'DN_VT_DNPAN_08', 'DN_VT_DNPAN_09', 'DN_VT_DNPAN_10'
            ],
            qrCodeValue: 'DNCT-WH-KE-04-T1-KH01',
          },
          {
            id: 'KE-04-T1-KH02',
            code: 'KH02',
            name: 'Khay 2: Cuộn ống gen nhiệt cỡ lớn phi 20/25/35mm & Thùng dây rút nhựa',
            visualType: 'cardboard-boxes',
            itemKeywords: ['ống gen nhiệt', 'dây rút'],
            sampleItems: ['Cuộn co nhiệt phi 25 đen 100m', 'Dây rút nhựa 400x4.8mm'],
            assignedMaterialCodes: ['DN_VT_DSTA0_02'],
            qrCodeValue: 'DNCT-WH-KE-04-T1-KH02',
          },
        ],
      },
      {
        tierNumber: 2,
        label: 'Tầng 2 (Mâm Lửng Trên)',
        categoryDesc: 'Nguồn tổ ong công nghiệp Meanwell NDR 24VDC (75W, 120W, 240W, 480W)',
        itemKeywords: ['meanwell', 'ndr', 'nguồn 24v', 'din rail'],
        visualType: 'clear-boxes',
        sampleItems: ['Bộ nguồn Din-rail Meanwell NDR-75-24', 'Bộ nguồn Din-rail Meanwell NDR-120-24', 'Bộ nguồn Din-rail Meanwell NDR-240-24'],
        compartments: [
          {
            id: 'KE-04-T2-KH01',
            code: 'KH01',
            name: 'Khay 1: Bộ nguồn Din-rail Meanwell NDR-75-24 (24VDC - 3.2A)',
            visualType: 'clear-boxes',
            itemKeywords: ['ndr-75', 'meanwell 75w'],
            sampleItems: ['Nguồn Meanwell NDR-75-24'],
            assignedMaterialCodes: [
              'DN_VT_ROLEN_01', 'DN_VT_DC12V_03', 'DN_VT_DC12V_04', 'DN_VT_DC24V_04', 'DN_VT_DC24V_01', 'DN_VT_DC12V_06', 'DN_VT_ADTER_06', 'DN_VT_ADTER_07', 'DN_VT_DNDLT_04', 'DN_VT_DNDLT_05', 'DN_VT_DNDLT_06', 'DN_VT_DNDLT_07', 'DN_VT_DNDLT_08', 'DN_VT_DNDLT_09', 'DN_VT_DNDLT_10', 'DN_VT_DNDLT_11', 'DN_VT_DNDLT_12', 'DN_VT_DNDLT_13', 'DN_VT_DNDLT_14', 'DN_VT_DNDLT_15', 'DN_VT_DNDLT_16', 'DN_VT_DNDLT_17'
            ],
            qrCodeValue: 'DNCT-WH-KE-04-T2-KH01',
          },
          {
            id: 'KE-04-T2-KH02',
            code: 'KH02',
            name: 'Khay 2: Bộ nguồn Din-rail Meanwell NDR-120-24 (24VDC - 5A)',
            visualType: 'clear-boxes',
            itemKeywords: ['ndr-120', 'meanwell 120w'],
            sampleItems: ['Nguồn Meanwell NDR-120-24'],
            assignedMaterialCodes: ['DN_VT_ROLEN_02'],
            qrCodeValue: 'DNCT-WH-KE-04-T2-KH02',
          },
          {
            id: 'KE-04-T2-KH03',
            code: 'KH03',
            name: 'Khay 3: Bộ nguồn Din-rail Meanwell NDR-240-24 (24VDC - 10A)',
            visualType: 'clear-boxes',
            itemKeywords: ['ndr-240', 'meanwell 240w'],
            sampleItems: ['Nguồn Meanwell NDR-240-24'],
            assignedMaterialCodes: ['DN_VT_ROLEN_03'],
            qrCodeValue: 'DNCT-WH-KE-04-T2-KH03',
          },
        ],
      },
      {
        tierNumber: 3,
        label: 'Tầng 3 (Mâm Lửng Giữa)',
        categoryDesc: 'Bộ lọc nguồn nhiễu EMI/EMC, chống sét lan truyền SPD Din-rail',
        itemKeywords: ['lọc nguồn', 'emi', 'chống sét', 'spd', 'schneider'],
        visualType: 'clear-boxes',
        sampleItems: ['Bộ lọc nhiễu 1 pha EMI Filter 20A', 'Thiết bị chống sét lan truyền SPD iPRD40r Schneider', 'Bộ chống sét tín hiệu mạng LAN RJ45'],
        compartments: [
          {
            id: 'KE-04-T3-KH01',
            code: 'KH01',
            name: 'Khay 1: Bộ lọc nhiễu sóng hài 1 pha EMI/EMC 220V 20A / 30A',
            visualType: 'clear-boxes',
            itemKeywords: ['lọc nhiễu', 'emi', 'filter'],
            sampleItems: ['Bộ lọc nguồn Delta 20A EMI Filter'],
            assignedMaterialCodes: [
              'DN_VT_SPDSN_01', 'DN_VT_INVER_01', 'DN_VT_INVER_05', 'DN_VT_DNTUP_03', 'DN_VT_DNTUP_04', 'DN_VT_DNTUP_05', 'DN_VT_DNTUP_06', 'DN_VT_DNTUP_07', 'DN_VT_DNTUP_08', 'DN_VT_DNTUP_09'
            ],
            qrCodeValue: 'DNCT-WH-KE-04-T3-KH01',
          },
          {
            id: 'KE-04-T3-KH02',
            code: 'KH02',
            name: 'Khay 2: Thiết bị chống sét lan truyền Type 2 SPD Schneider Acti9 iPRD40r',
            visualType: 'clear-boxes',
            itemKeywords: ['chống sét', 'spd', 'iprd40r'],
            sampleItems: ['Chống sét 3P+N Schneider iPRD40r 40kA'],
            assignedMaterialCodes: ['DN_VT_SPDSN_02', 'DN_VT_SPDSN_03'],
            qrCodeValue: 'DNCT-WH-KE-04-T3-KH02',
          },
        ],
      },
      {
        tierNumber: 4,
        label: 'Tầng 4 (Mâm Lửng Dưới)',
        categoryDesc: 'Hộp phân loại đầu cosse SC đồng đỏ mạ thiếc (SC16, SC25, SC35, SC50, SC70, SC95)',
        itemKeywords: ['cosse sc', 'đầu cos', 'sc35', 'sc50', 'sc70'],
        visualType: 'blue-bins',
        sampleItems: ['Đầu cosse SC35-8', 'Đầu cosse SC50-10', 'Đầu cosse SC70-12', 'Đầu cosse SC95-12'],
        compartments: [
          {
            id: 'KE-04-T4-KH01',
            code: 'KH01',
            name: 'Khay 1: Hộp đầu cosse SC16, SC25, SC35 lỗ M6 / M8 / M10',
            visualType: 'blue-bins',
            itemKeywords: ['sc16', 'sc25', 'sc35'],
            sampleItems: ['Cosse SC25-8 đồng mạ thiếc (100 cái/hộp)'],
            assignedMaterialCodes: [
              'DN_VT_COTSC_01', 'DN_VT_COTSC_02', 'DN_VT_CDCOS_10', 'DN_VT_COSSC_02', 'DN_VT_CDCOS_12', 'DN_VT_0SC50_01', 'DN_VT_0SC70_01', 'DN_VT_DNEXT_01', 'DN_VT_DNEXT_02', 'DN_VT_DNEXT_03', 'DN_VT_DNEXT_04', 'DN_VT_DNEXT_05', 'DN_VT_DNEXT_06', 'DN_VT_DNEXT_07'
            ],
            qrCodeValue: 'DNCT-WH-KE-04-T4-KH01',
          },
          {
            id: 'KE-04-T4-KH02',
            code: 'KH02',
            name: 'Khay 2: Hộp đầu cosse SC50, SC70, SC95 lỗ M10 / M12 cho cáp lực',
            visualType: 'blue-bins',
            itemKeywords: ['sc50', 'sc70', 'sc95'],
            sampleItems: ['Cosse SC50-10 đồng đúc dày'],
            assignedMaterialCodes: ['DN_VT_COTSC_03', 'DN_VT_COTSC_04'],
            qrCodeValue: 'DNCT-WH-KE-04-T4-KH02',
          },
          {
            id: 'KE-04-T4-KH03',
            code: 'KH03',
            name: 'Khay 3: Đầu cosse bấm pin dẹt, cosse ghim bọc nhựa E1508, E2508, E4009',
            visualType: 'blue-bins',
            itemKeywords: ['cosse pin', 'cosse ghim'],
            sampleItems: ['Đầu cos pin rỗng E2508 xanh dương'],
            assignedMaterialCodes: [ 'DN_VT_COTSC_05', 'DN_VT_COTSC_06', 'DN_VT_CDCOS_01', 'DN_VT_CDCOS_02', 'DN_VT_CDCOS_03', 'DN_VT_CDCOS_04', 'DN_VT_CDCOS_05' ],
            qrCodeValue: 'DNCT-WH-KE-04-T4-KH03',
          },
        ],
      },
      {
        tierNumber: 5,
        label: 'Tầng 5 (Mâm Đáy Sát Sàn)',
        categoryDesc: 'Cuộn ống co nhiệt các màu & Băng keo điện 3M Scotch 23, Scotch 33+',
        itemKeywords: ['ống co nhiệt', 'co nhiệt', '3m', 'băng keo', 'scotch'],
        visualType: 'clear-boxes',
        sampleItems: ['Ống gen co nhiệt phi 4, 6, 8, 10, 12, 16', 'Băng keo cao su non tự dính 3M Scotch 23', 'Băng keo điện chống cháy 3M Scotch Super 33+'],
        compartments: [
          {
            id: 'KE-04-T5-KH01',
            code: 'KH01',
            name: 'Khay 1: Bộ cuộn ống gen co nhiệt đen phi 4, 6, 8, 10, 12, 16mm',
            visualType: 'clear-boxes',
            itemKeywords: ['ống gen nhiệt', 'co nhiệt'],
            sampleItems: ['Cuộn co nhiệt phi 6 dài 100m'],
            assignedMaterialCodes: [
              'DN_VT_ONGCO_01', 'DN_VT_ONGCO_02', 'DN_VT_DNPHA_01', 'DN_VT_DNPHA_02', 'DN_VT_DNPHA_03', 'DN_VT_DNPHA_04', 'DN_VT_DNPHA_05', 'DN_VT_DNPHA_06', 'DN_VT_DNPHA_07', 'DN_VT_DNPHA_08', 'DN_VT_DNPHA_09', 'DN_VT_DNPHA_10', 'DN_VT_DNPHA_11', 'DN_VT_DNPHA_12'
            ],
            qrCodeValue: 'DNCT-WH-KE-04-T5-KH01',
          },
          {
            id: 'KE-04-T5-KH02',
            code: 'KH02',
            name: 'Khay 2: Băng keo cao su tự dính chống nước 3M Scotch 23 & Scotch 33+',
            visualType: 'clear-boxes',
            itemKeywords: ['3m 23', 'scotch 33', 'cao su non'],
            sampleItems: ['Cuộn băng keo 3M Scotch 23 tự chảy chống ẩm cáp ngầm'],
            assignedMaterialCodes: ['DN_VT_ONGCO_03', 'DN_VT_ONGCO_04'],
            qrCodeValue: 'DNCT-WH-KE-04-T5-KH02',
          },
        ],
      },
    ],
  },

  // 3. KỆ 3 (Kệ sắt 5 tầng lưu trữ - Tầng 1 trên cùng là nóc kệ tận dụng)
  {
    id: 'KE-03',
    code: 'KE-03',
    name: 'KỆ VẬT TƯ SỐ 3',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Dây Điện CADIVI & Khí Cụ Đóng Cắt',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1800, levels: 5 },
    svgRect: { x: 288, y: 30, width: 122, height: 75 },
    colorTheme: {
      base: 'from-emerald-600/30 to-slate-900',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/30',
      badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Kệ sắt v lỗ trung tâm chứa khí cụ đóng cắt MCB/RCCB, khởi động từ contactor và cuộn dây điện CADIVI các màu.',
    qrCodeValue: 'DNCT-WH-KE-03',
    notes: 'Kệ trung tâm dãy tường trên. Tầng 1 trên cùng tận dụng chứa vật tư cồng kềnh.',
    tiers: [
      {
        tierNumber: 1,
        label: 'Tầng 1 (Nóc Kệ Trên Cùng - Tận Dụng Để Vật Tư)',
        categoryDesc: 'Nóc kệ: Thùng cuộn dây cáp điều khiển chống nhiễu 4x1.5, 7x1.5, ống ruột gà lõi thép',
        itemKeywords: ['cáp điều khiển', 'ruột gà', 'lõi thép', 'nóc'],
        visualType: 'cardboard-boxes',
        sampleItems: ['Cuộn cáp điều khiển chống nhiễu Altek Kabel 4x1.5mm2', 'Ống ruột gà lõi thép bọc nhựa phi 25 50m', 'Thùng phụ kiện đầu nối ruột gà kín nước'],
        compartments: [
          {
            id: 'KE-03-T1-KH01',
            code: 'KH01',
            name: 'Khay 1: Cuộn cáp điều khiển tín hiệu chống nhiễu 4Cx1.5 & 7Cx1.5 Altek Kabel',
            visualType: 'cardboard-boxes',
            itemKeywords: ['cáp điều khiển', 'altek kabel'],
            sampleItems: ['Cuộn cáp Altek Kabel 4x1.5mm2 có lưới chống nhiễu'],
            assignedMaterialCodes: [
              'DN_VT_CXV00_01', 'DN_VT_CXV00_02', 'DN_VT_ONGCO_05', 'DN_VT_ONGCO_06', 'DN_VT_ONGCO_07', 'DN_VT_ONGCO_08', 'DN_VT_ONGCO_09', 'DN_VT_ONGCO_10', 'DN_VT_ONGCO_11', 'DN_VT_ONGCO_12', 'DN_VT_ONGCO_13', 'DN_VT_ONGCO_14', 'DN_VT_ONGCO_15', 'DN_VT_DNRGT_01', 'DN_VT_DNRGT_02', 'DN_VT_RGTHP_03', 'DN_VT_DNRGT_03', 'DN_VT_RGTHP_04', 'DN_VT_DNRGT_04', 'DN_VT_RGTHP_05', 'DN_VT_DNRGT_05', 'DN_VT_RGTHP_06', 'DN_VT_DNRGT_06', 'DN_VT_MANGC_01', 'DN_VT_MANGC_02', 'DN_VT_MANGC_03', 'DN_VT_MANGC_04', 'DN_VT_MANGC_05', 'DN_VT_MANGC_06', 'DN_VT_MANGC_07'
            ],
            qrCodeValue: 'DNCT-WH-KE-03-T1-KH01',
          },
          {
            id: 'KE-03-T1-KH02',
            code: 'KH02',
            name: 'Khay 2: Cuộn ống ruột gà lõi thép bọc nhựa PVC chống thấm nước phi 20/25',
            visualType: 'cardboard-boxes',
            itemKeywords: ['ruột gà', 'lõi thép'],
            sampleItems: ['Ống ruột gà lõi thép phi 25 Nippon Seam'],
            assignedMaterialCodes: [
              'DN_VT_RGTHP_01', 'DN_VT_RGTHP_02', 'DN_VT_RUOTG_08', 'DN_VT_RUOTG_04', 'DN_VT_OPVCC_01', 'DN_VT_HPCHI_01', 'DN_VT_KEPON_01', 'DN_VT_OPVCC_02', 'DN_VT_HPCHI_02', 'DN_VT_KEPON_02', 'DN_VT_OPVCC_03', 'DN_VT_HPCHI_03', 'DN_VT_KEPON_03', 'DN_VT_OPVCC_04', 'DN_VT_HPCHI_04', 'DN_VT_KEPON_04', 'DN_VT_OPVCC_05', 'DN_VT_HPCHI_05', 'DN_VT_KEPON_05', 'DN_VT_OPVCC_06', 'DN_VT_HPCHI_06', 'DN_VT_KEPON_06'
            ],
            qrCodeValue: 'DNCT-WH-KE-03-T1-KH02',
          },
        ],
      },
      {
        tierNumber: 2,
        label: 'Tầng 2 (Mâm Lửng Trên)',
        categoryDesc: 'Aptomat tép MCB 1 Pha & 3 Pha Schneider Acti9 iC60N (6A, 10A, 16A, 20A, 32A, 63A)',
        itemKeywords: ['mcb', 'ic60n', 'acti9', 'schneider', 'aptomat tép'],
        visualType: 'blue-bins',
        sampleItems: ['MCB Schneider 1P 16A iC60N', 'MCB Schneider 1P 20A iC60N', 'MCB Schneider 3P 32A iC60N', 'MCB Schneider 3P 63A iC60N'],
        compartments: [
          {
            id: 'KE-03-T2-KH01',
            code: 'KH01',
            name: 'Khay 1: Aptomat tép MCB 1P 10A, 16A, 20A Schneider Acti9 iC60N',
            visualType: 'blue-bins',
            itemKeywords: ['mcb 1p', 'ic60n 16a', 'ic60n 20a'],
            sampleItems: ['MCB 1P 16A iC60N 6kA', 'MCB 1P 20A iC60N 6kA'],
            assignedMaterialCodes: [
              'DN_VT_MCBSC_01', 'DN_VT_MCBSC_02', 'DN_VT_MCBSC_03', 'DN_VT_00MCB_09', 'DN_VT_0RCBO_01', 'DN_VT_0MCCB_05', 'DN_VT_COTSC_07', 'DN_VT_COTSC_08', 'DN_VT_COTSC_09', 'DN_VT_COTSC_10', 'DN_VT_COTSC_11', 'DN_VT_COTSC_12'
            ],
            qrCodeValue: 'DNCT-WH-KE-03-T2-KH01',
          },
          {
            id: 'KE-03-T2-KH02',
            code: 'KH02',
            name: 'Khay 2: Aptomat tép MCB 3P 16A, 25A, 32A, 40A, 63A Schneider Acti9 iC60N',
            visualType: 'blue-bins',
            itemKeywords: ['mcb 3p', 'ic60n 32a', 'ic60n 63a'],
            sampleItems: ['MCB 3P 32A iC60N 6kA', 'MCB 3P 63A iC60N 6kA'],
            assignedMaterialCodes: ['DN_VT_MCBSC_14', 'DN_VT_MCBSC_15'],
            qrCodeValue: 'DNCT-WH-KE-03-T2-KH02',
          },
          {
            id: 'KE-03-T2-KH03',
            code: 'KH03',
            name: 'Khay 3: Cầu dao chống giật RCCB / RCBO Acti9 iID 30mA bảo vệ an toàn',
            visualType: 'blue-bins',
            itemKeywords: ['rccb', 'rcbo', 'chống giật', '30ma'],
            sampleItems: ['RCCB 2P 25A 30mA Schneider', 'RCBO 1P+N 16A 30mA'],
            assignedMaterialCodes: ['DN_VT_MCBSC_19', 'DN_VT_MCBSC_20'],
            qrCodeValue: 'DNCT-WH-KE-03-T2-KH03',
          },
        ],
      },
      {
        tierNumber: 3,
        label: 'Tầng 3 (Mâm Lửng Giữa)',
        categoryDesc: 'Khởi động từ Contactor TeSys D (LC1D09, LC1D18, LC1D25, LC1D32) & Rơ le nhiệt LRD',
        itemKeywords: ['contactor', 'khởi động từ', 'tesys', 'lc1d', 'rơ le nhiệt', 'lrd'],
        visualType: 'blue-bins',
        sampleItems: ['Khởi động từ Schneider LC1D09M7 220V', 'Khởi động từ Schneider LC1D18M7 220V', 'Rơ le nhiệt LRD08 (2.5-4A)', 'Rơ le nhiệt LRD14 (7-10A)'],
        compartments: [
          {
            id: 'KE-03-T3-KH01',
            code: 'KH01',
            name: 'Khay 1: Khởi động từ Contactor 3P Schneider TeSys D (LC1D09, LC1D12, LC1D18)',
            visualType: 'blue-bins',
            itemKeywords: ['lc1d09', 'lc1d18', 'contactor 9a'],
            sampleItems: ['Contactor LC1D09M7 cuộn hút 220VAC', 'Contactor LC1D18M7 220VAC'],
            assignedMaterialCodes: ['DN_VT_CONTC_01', 'DN_VT_CONTC_02'],
            qrCodeValue: 'DNCT-WH-KE-03-T3-KH01',
          },
          {
            id: 'KE-03-T3-KH02',
            code: 'KH02',
            name: 'Khay 2: Khởi động từ Contactor 3P Schneider TeSys D cỡ lớn (LC1D25, LC1D32, LC1D40)',
            visualType: 'blue-bins',
            itemKeywords: ['lc1d25', 'lc1d32', 'contactor 32a'],
            sampleItems: ['Contactor LC1D25M7 220VAC', 'Contactor LC1D32M7 220VAC'],
            assignedMaterialCodes: ['DN_VT_CONTC_03', 'DN_VT_CONTC_04'],
            qrCodeValue: 'DNCT-WH-KE-03-T3-KH02',
          },
          {
            id: 'KE-03-T3-KH03',
            code: 'KH03',
            name: 'Khay 3: Rơ le nhiệt bảo vệ quá tải động cơ Schneider TeSys LRD (LRD08, LRD14, LRD21)',
            visualType: 'blue-bins',
            itemKeywords: ['rơ le nhiệt', 'lrd', 'quá tải'],
            sampleItems: ['Rơ le nhiệt LRD08 (2.5-4A)', 'Rơ le nhiệt LRD16 (9-13A)'],
            assignedMaterialCodes: [
              'DN_VT_ROLEN_04', 'DN_VT_ROLEN_05', 'DN_VT_ROLEN_06', 'DN_VT_ROLEN_07', 'DN_VT_ROLEN_08', 'DN_VT_ROLEN_09', 'DN_VT_ROLEN_10', 'DN_VT_ROLEN_11', 'DN_VT_ROLEN_12'
            ],
            qrCodeValue: 'DNCT-WH-KE-03-T3-KH03',
          },
        ],
      },
      {
        tierNumber: 4,
        label: 'Tầng 4 (Mâm Lửng Dưới)',
        categoryDesc: 'Rơ le trung gian kiếng 8 chân / 14 chân IDEC / Omron & Đế cắm rơ le Din-rail',
        itemKeywords: ['rơ le trung gian', 'omron', 'idec', 'my2n', 'my4n', 'đế rơ le'],
        visualType: 'blue-bins',
        sampleItems: ['Rơ le Omron MY2N-GS 24VDC', 'Rơ le Omron MY2N-GS 220VAC', 'Rơ le Omron MY4N-GS 220VAC', 'Đế cắm rơ le PYF08A-E'],
        compartments: [
          {
            id: 'KE-03-T4-KH01',
            code: 'KH01',
            name: 'Khay 1: Rơ le trung gian 8 chân tròn/dẹt Omron MY2N 24VDC & 220VAC kèm đèn LED',
            visualType: 'blue-bins',
            itemKeywords: ['omron 8 chân', 'my2n'],
            sampleItems: ['Rơ le Omron MY2N 24VDC có đèn chỉ thị'],
            assignedMaterialCodes: [ 'DN_VT_MCBSC_04', 'DN_VT_MCBSC_05', 'DN_VT_0FUSE_02', 'DN_VT_0CCHI_01', 'DN_VT_0FUSE_03', 'DN_VT_DROLE_02' ],
            qrCodeValue: 'DNCT-WH-KE-03-T4-KH01',
          },
          {
            id: 'KE-03-T4-KH02',
            code: 'KH02',
            name: 'Khay 2: Rơ le trung gian 14 chân Omron MY4N 24VDC & 220VAC',
            visualType: 'blue-bins',
            itemKeywords: ['omron 14 chân', 'my4n'],
            sampleItems: ['Rơ le Omron MY4N 220VAC 4 cặp tiếp điểm'],
            assignedMaterialCodes: [ 'DN_VT_MCBSC_06', 'DN_VT_MCBSC_07', 'DN_VT_DMINO_04', 'DN_VT_DMINO_02', 'DN_VT_DMINO_05', 'DN_VT_DMINO_06' ],
            qrCodeValue: 'DNCT-WH-KE-03-T4-KH02',
          },
          {
            id: 'KE-03-T4-KH03',
            code: 'KH03',
            name: 'Khay 3: Đế cắm rơ le Din-rail PYF08A & PYF14A kèm thanh kẹp giữ kim loại',
            visualType: 'blue-bins',
            itemKeywords: ['đế rơ le', 'pyf08a', 'pyf14a'],
            sampleItems: ['Đế gá Din-rail Omron PYF08A-E', 'Đế gá PYF14A-E'],
            assignedMaterialCodes: ['DN_VT_MCBSC_08', 'DN_VT_MCBSC_09'],
            qrCodeValue: 'DNCT-WH-KE-03-T4-KH03',
          },
        ],
      },
      {
        tierNumber: 5,
        label: 'Tầng 5 (Mâm Đáy Sát Sàn)',
        categoryDesc: 'Các cuộn dây điện đơn ruột đồng CADIVI CV 1.5, CV 2.5, CV 4.0, CV 6.0',
        itemKeywords: ['cadivi', 'dây điện', 'cv 1.5', 'cv 2.5', 'cv 4.0', 'cv 6.0', 'cuộn dây'],
        visualType: 'cadivi-coils',
        sampleItems: ['Cuộn CADIVI CV 1.5mm² Đỏ (100m)', 'Cuộn CADIVI CV 1.5mm² Vàng (100m)', 'Cuộn CADIVI CV 2.5mm² Xanh (100m)', 'Cuộn CADIVI CV 4.0mm² Đen (100m)'],
        compartments: [
          {
            id: 'KE-03-T5-KH01',
            code: 'KH01',
            name: 'Khay 1: Dây điện đơn CADIVI CV 1.5mm² Đỏ, Vàng, Xanh, Đen (Cuộn 100m)',
            visualType: 'cadivi-coils',
            itemKeywords: ['cadivi 1.5', 'dây 1.5'],
            sampleItems: ['Cuộn CADIVI CV 1.5mm² Đỏ 100m', 'Cuộn CADIVI CV 1.5mm² Xanh Dương 100m'],
            assignedMaterialCodes: [
              'DN_VT_DDCV0_01', 'DN_VT_DDCV0_02', 'DN_VT_DDCV0_03', 'DN_VT_OPBVC_02', 'DN_VT_OPBVC_03', 'DN_VT_DDCV0_04', 'DN_VT_DDCV0_05', 'DN_VT_VCMD0_01', 'DN_VT_VCMD0_02', 'DN_VT_VCMD0_03', 'DN_VT_VCMD0_04', 'DN_VT_VCMD0_05', 'DN_VT_VCMD0_06'
            ],
            qrCodeValue: 'DNCT-WH-KE-03-T5-KH01',
          },
          {
            id: 'KE-03-T5-KH02',
            code: 'KH02',
            name: 'Khay 2: Dây điện đơn CADIVI CV 2.5mm² Đỏ, Vàng, Xanh, Trắng, Đen',
            visualType: 'cadivi-coils',
            itemKeywords: ['cadivi 2.5', 'dây 2.5'],
            sampleItems: ['Cuộn CADIVI CV 2.5mm² Vàng 100m', 'Cuộn CADIVI CV 2.5mm² Đỏ 100m'],
            assignedMaterialCodes: [
              'DN_VT_DDCV0_06', 'DN_VT_DDCV0_07', 'DN_VT_DDCV0_08', 'DN_VT_D25MM_01', 'DN_VT_D25MM_02', 'DN_VT_D25MM_03', 'DN_VT_D6MM2_01', 'DN_VT_D4MM2_15', 'DN_VT_DDCV0_09', 'DN_VT_DDCV0_10', 'DN_VT_SIG00_01', 'DN_VT_SIG00_02', 'DN_VT_SIG00_03', 'DN_VT_SIG00_04', 'DN_VT_SIG00_05', 'DN_VT_SIG00_06', 'DN_VT_SIG00_07', 'DN_VT_SIG00_08', 'DN_VT_SIG00_09', 'DN_VT_SIG00_10'
            ],
            qrCodeValue: 'DNCT-WH-KE-03-T5-KH02',
          },
          {
            id: 'KE-03-T5-KH03',
            code: 'KH03',
            name: 'Khay 3: Dây điện lực tải lớn CADIVI CV 4.0mm² & CV 6.0mm²',
            visualType: 'cadivi-coils',
            itemKeywords: ['cadivi 4.0', 'cadivi 6.0'],
            sampleItems: ['Cuộn CADIVI CV 4.0mm² Đen 100m', 'Cuộn CADIVI CV 6.0mm² Đỏ 100m'],
            assignedMaterialCodes: [
              'DN_VT_DDCV0_11', 'DN_VT_DDCV0_12', 'DN_VT_DDCV0_16', 'DN_VT_50MM2_01', 'DN_VT_70MM2_01', 'DO', 'VG', 'XD', 'DEN', 'PE', 'DN_VT_DDCV0_13', 'DN_VT_DDCV0_14', 'DN_VT_DDCV0_15', 'DN_VT_DDCV0_17', 'DN_VT_DDCV0_18', 'DN_VT_DDCV0_19', 'DN_VT_DDCV0_20', 'DN_VT_DDCV0_21', 'DN_VT_DDCV0_22', 'DN_VT_DDCV0_23', 'DN_VT_DDCV0_24', 'DN_VT_DDCV0_25', 'DN_VT_DDCV0_26', 'DN_VT_DDCV0_27', 'DN_VT_DDCV0_28', 'DN_VT_DDCV0_29', 'DN_VT_DDCV0_30', 'DN_VT_DDCV0_31', 'DN_VT_DDCV0_32', 'DN_VT_DDCV0_33', 'DN_VT_DDCV0_34', 'DN_VT_DDCV0_35', 'DN_VT_DDCV0_36', 'DN_VT_DDCV0_37', 'DN_VT_DDCV0_38', 'DN_VT_DDCV0_39', 'DN_VT_DDCV0_40', 'DN_VT_CXV00_03', 'DN_VT_CXV00_04', 'DN_VT_CXV00_05', 'DN_VT_CXV00_06', 'DN_VT_CXV00_10', 'DN_VT_CXV00_11', 'DN_VT_CXV00_12', 'DN_VT_CXV00_13', 'DN_VT_CXV00_14', 'DN_VT_CXV00_15', 'DN_VT_DSTA0_03', 'DN_VT_DSTA0_04', 'DN_VT_DSTA0_05', 'DN_VT_DSTA0_06', 'DN_VT_DSTA0_07', 'DN_VT_DSTA0_08', 'DN_VT_DSTA0_09', 'DN_VT_DSTA0_10', 'DN_VT_DSTA0_11', 'DN_VT_DSTA0_12', 'DN_VT_DSTA0_13', 'DN_VT_DSTA0_14', 'DN_VT_DSTA0_15', 'DN_VT_FRCXV_01', 'DN_VT_FRCXV_02', 'DN_VT_FRCXV_03', 'DN_VT_FRCXV_04', 'DN_VT_FRCXV_05', 'DN_VT_FRCXV_06', 'DN_VT_FRCXV_07', 'DN_VT_FRCXV_08', 'DN_VT_FRCXV_09', 'DN_VT_FRCXV_10', 'DN_VT_FRCXV_11', 'DN_VT_FRCXV_12', 'DN_VT_CHSET_01', 'DN_VT_CHSET_02', 'DN_VT_CHSET_03', 'DN_VT_CHSET_04', 'DN_VT_CHSET_05', 'DN_VT_CHSET_06', 'DN_VT_CHSET_07', 'DN_VT_CHSET_08', 'DN_VT_CHSET_09', 'DN_VT_CHSET_10', 'DN_VT_CHSET_11', 'DN_VT_CHSET_12', 'DN_VT_CHSET_13'
            ],
            qrCodeValue: 'DNCT-WH-KE-03-T5-KH03',
          },
        ],
      },
    ],
  },

  // 4. KỆ 2 (Kệ sắt 5 tầng lưu trữ - Tầng 1 trên cùng là nóc kệ tận dụng)
  {
    id: 'KE-02',
    code: 'KE-02',
    name: 'KỆ VẬT TƯ SỐ 2',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Phụ Kiện Bồn Cầu, Lavabo & Van Vòi',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1800, levels: 5 },
    svgRect: { x: 418, y: 30, width: 122, height: 75 },
    colorTheme: {
      base: 'from-emerald-600/30 to-slate-900',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/30',
      badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Kệ sắt v lỗ chứa thiết bị vệ sinh, phụ kiện bồn cầu TOTO, vòi cảm ứng lavabo và gioăng cao su.',
    qrCodeValue: 'DNCT-WH-KE-02',
    notes: 'Kệ số 2 trên dãy tường trên. Tầng 1 trên cùng tận dụng chứa vật tư cồng kềnh.',
    tiers: [
      {
        tierNumber: 1,
        label: 'Tầng 1 (Nóc Kệ Trên Cùng - Tận Dụng Để Vật Tư)',
        categoryDesc: 'Nóc kệ: Thùng vòi cảm ứng Lavabo TOTO nguyên hộp, nắp bàn cầu đóng êm nguyên kiện',
        itemKeywords: ['vòi cảm ứng', 'toto', 'nắp bàn cầu', 'nguyên hộp', 'nóc'],
        visualType: 'cardboard-boxes',
        sampleItems: ['Thùng vòi chậu rửa cảm ứng TOTO DLE110AN', 'Thùng nắp bàn cầu đóng êm TOTO TC393VS', 'Bộ xả bồn cầu cảm ứng TOTO'],
        compartments: [
          {
            id: 'KE-02-T1-KH01',
            code: 'KH01',
            name: 'Khay 1: Thùng vòi chậu rửa tay cảm ứng thông minh TOTO DLE110AN nguyên kiện',
            visualType: 'cardboard-boxes',
            itemKeywords: ['vòi cảm ứng', 'dle110an'],
            sampleItems: ['Vòi cảm ứng TOTO tự động ngắt nước kèm mắt đọc quang học'],
            assignedMaterialCodes: [ 'DN_VT_TBVS0_01', 'DN_VT_VOILA_01', 'DN_VT_BANCA_01', 'DN_VT_VTIEU_01', 'DN_VT_XIPHO_01' ],
            qrCodeValue: 'DNCT-WH-KE-02-T1-KH01',
          },
          {
            id: 'KE-02-T1-KH02',
            code: 'KH02',
            name: 'Khay 2: Thùng nắp đậy bàn cầu đóng êm TOTO TC393VS chịu lực',
            visualType: 'cardboard-boxes',
            itemKeywords: ['nắp bàn cầu', 'tc393vs'],
            sampleItems: ['Nắp bồn cầu đóng êm rơi từ từ chống ồn'],
            assignedMaterialCodes: ['DN_VT_TBVS0_02'],
            qrCodeValue: 'DNCT-WH-KE-02-T1-KH02',
          },
        ],
      },
      {
        tierNumber: 2,
        label: 'Tầng 2 (Mâm Lửng Trên)',
        categoryDesc: 'Cụm van điện từ Solenoid Valve 6VDC dùng pin & bộ mắt đọc hồng ngoại',
        itemKeywords: ['van điện từ', 'mắt đọc', 'hồng ngoại', 'cảm ứng'],
        visualType: 'clear-boxes',
        sampleItems: ['Cụm van điện từ Solenoid Valve 6VDC', 'Mắt thần cảm biến tiểu nam TOTO', 'Khay pin nuôi nguồn 4 pin AA 6V'],
        compartments: [
          {
            id: 'KE-02-T2-KH01',
            code: 'KH01',
            name: 'Khay 1: Cụm van điện từ Solenoid Valve 6VDC xả tiểu tự động',
            visualType: 'clear-boxes',
            itemKeywords: ['van điện từ', 'solenoid', '6vdc'],
            sampleItems: ['Van điện từ Solenoid Valve 6VDC TOTO/Viglacera'],
            assignedMaterialCodes: [ 'DN_VT_CO90P_01', 'DN_VT_CO90P_02', 'DN_VT_LOIRO_02', 'DN_VT_PHAOD_01', 'DN_VT_00BXO_03', 'DN_VT_00BXO_04' ],
            qrCodeValue: 'DNCT-WH-KE-02-T2-KH01',
          },
          {
            id: 'KE-02-T2-KH02',
            code: 'KH02',
            name: 'Khay 2: Bo mạch mắt đọc cảm biến hồng ngoại & hộp đựng pin 4xAA chống nước',
            visualType: 'clear-boxes',
            itemKeywords: ['mắt đọc', 'bo mạch', 'hộp pin'],
            sampleItems: ['Mắt hồng ngoại nhận diện người đến gần', 'Hộp pin 6VDC gioăng cao su'],
            assignedMaterialCodes: ['DN_VT_TEPPR_01', 'DN_VT_TEPPR_02'],
            qrCodeValue: 'DNCT-WH-KE-02-T2-KH02',
          },
        ],
      },
      {
        tierNumber: 3,
        label: 'Tầng 3 (Mâm Lửng Giữa)',
        categoryDesc: 'Linh kiện phao cấp xả bồn cầu, chốt bản lề nắp bồn cầu Inox',
        itemKeywords: ['phao cấp', 'xả bồn cầu', 'chốt bản lề', 'nắp'],
        visualType: 'clear-boxes',
        sampleItems: ['Cột cấp nước bồn cầu TOTO', 'Cụm cột xả 2 nhấn bồn cầu', 'Bộ chốt cao su nở Inox 304 gắn nắp'],
        compartments: [
          {
            id: 'KE-02-T3-KH01',
            code: 'KH01',
            name: 'Khay 1: Cụm cột cấp nước bồn cầu TOTO ren 21 kèm phao ngắt nước tự động',
            visualType: 'clear-boxes',
            itemKeywords: ['cột cấp', 'phao ngắt nước'],
            sampleItems: ['Cột cấp nước bồn cầu TOTO chính hãng'],
            assignedMaterialCodes: [
              'DN_VT_TBVS0_03', 'DN_VT_0MUOI_01', 'DN_VT_000CL_01', 'DN_VT_00ANA_01', 'DN_VT_JAVEL_01', 'DN_VT_OXALI_01', 'DN_VT_TBVS0_11', 'DN_VT_TBVS0_12', 'DN_VT_TBVS0_13', 'DN_VT_TBVS0_14', 'DN_VT_TBVS0_15'
            ],
            qrCodeValue: 'DNCT-WH-KE-02-T3-KH01',
          },
          {
            id: 'KE-02-T3-KH02',
            code: 'KH02',
            name: 'Khay 2: Cột xả 2 chế độ (tiểu/đại) bồn cầu liền khối & nút nhấn mạ crom',
            visualType: 'clear-boxes',
            itemKeywords: ['cột xả', 'nút nhấn'],
            sampleItems: ['Bộ cột xả 2 nhấn tiết kiệm nước'],
            assignedMaterialCodes: ['DN_VT_TBVS0_04'],
            qrCodeValue: 'DNCT-WH-KE-02-T3-KH02',
          },
          {
            id: 'KE-02-T3-KH03',
            code: 'KH03',
            name: 'Khay 3: Bộ chốt bản lề Inox 304 bắt nắp bàn cầu chốt nở cao su',
            visualType: 'clear-boxes',
            itemKeywords: ['chốt bản lề', 'inox 304'],
            sampleItems: ['Bộ ốc chốt bản lề nắp bàn cầu Inox 304'],
            assignedMaterialCodes: ['DN_VT_OPPR0_01'],
            qrCodeValue: 'DNCT-WH-KE-02-T3-KH03',
          },
        ],
      },
      {
        tierNumber: 4,
        label: 'Tầng 4 (Mâm Lửng Dưới)',
        categoryDesc: 'Gioăng cao su đệm bồn cầu, phớt silicon ngăn mùi, ron bích thoát sàn',
        itemKeywords: ['gioăng', 'ron', 'phớt', 'ngăn mùi', 'cao su'],
        visualType: 'blue-bins',
        sampleItems: ['Gioăng cao su đệm sứ bồn cầu TOTO', 'Ron sáp chống hôi cổ ngỗng bồn cầu', 'Gioăng silicone chống rò rỉ xiphong'],
        compartments: [
          {
            id: 'KE-02-T4-KH01',
            code: 'KH01',
            name: 'Khay 1: Gioăng cao su xốp đệm giữa két nước và thân cầu TOTO',
            visualType: 'blue-bins',
            itemKeywords: ['gioăng cao su', 'đệm két nước'],
            sampleItems: ['Gioăng xốp đen đệm chống rò rỉ nước két cầu'],
            assignedMaterialCodes: [
              'DN_VT_VANNC_01', 'DN_VT_0VANB_04', 'DN_VT_KHOAD_06', 'DN_VT_RACCO_08', 'DN_VT_TBVS0_16', 'DN_VT_TBVS0_17', 'DN_VT_TBVS0_18', 'DN_VT_TBVS0_19', 'DN_VT_TBVS0_20'
            ],
            qrCodeValue: 'DNCT-WH-KE-02-T4-KH01',
          },
          {
            id: 'KE-02-T4-KH02',
            code: 'KH02',
            name: 'Khay 2: Vòng đệm cao su sáp (Wax Ring) bịt kín cổ ngỗng thoát bồn cầu',
            visualType: 'blue-bins',
            itemKeywords: ['vòng sáp', 'wax ring', 'chống hôi'],
            sampleItems: ['Gioăng sáp dẻo lắp chân bồn cầu ngăn khí hôi'],
            assignedMaterialCodes: ['DN_VT_VANNC_02'],
            qrCodeValue: 'DNCT-WH-KE-02-T4-KH02',
          },
        ],
      },
      {
        tierNumber: 5,
        label: 'Tầng 5 (Mâm Đáy Sát Sàn)',
        categoryDesc: 'Dây cấp nước bồn cầu Inox 304, vòi xịt vệ sinh tăng áp, van khóa T Inox',
        itemKeywords: ['dây cấp', 'vòi xịt', 'van t', 'inox 304'],
        visualType: 'clear-boxes',
        sampleItems: ['Dây cấp nước mềm bọc Inox 304 40cm/50cm/60cm', 'Đầu vòi xịt vệ sinh Inox 304 tăng áp', 'Van tê chia nước bồn cầu Inox 304 có khóa'],
        compartments: [
          {
            id: 'KE-02-T5-KH01',
            code: 'KH01',
            name: 'Khay 1: Dây cấp nước Inox 304 lõi EPDM chịu áp lực cao 40cm & 60cm',
            visualType: 'clear-boxes',
            itemKeywords: ['dây cấp nước', 'epdm', 'inox 304'],
            sampleItems: ['Dây cấp nước mềm Inox 304 40cm ren 21'],
            assignedMaterialCodes: [
              'DN_VT_OPPR0_02', 'DN_VT_OPPR0_03', 'DN_VT_0O100_01', 'DN_VT_00O50_01', 'DN_VT_00O32_01', 'DN_VT_00O25_01', 'DN_VT_00O20_01', 'DN_VT_OHDPE_01', 'DN_VT_TBVS0_21', 'DN_VT_TBVS0_22', 'DN_VT_TBVS0_23', 'DN_VT_TBVS0_24'
            ],
            qrCodeValue: 'DNCT-WH-KE-02-T5-KH01',
          },
          {
            id: 'KE-02-T5-KH02',
            code: 'KH02',
            name: 'Khay 2: Đầu vòi xịt vệ sinh Inox 304 mạ bóng tăng áp chống gãy',
            visualType: 'clear-boxes',
            itemKeywords: ['vòi xịt', 'tăng áp'],
            sampleItems: ['Tay vòi xịt vệ sinh Inox 304 TOTO'],
            assignedMaterialCodes: ['DN_VT_OPPR0_04'],
            qrCodeValue: 'DNCT-WH-KE-02-T5-KH02',
          },
          {
            id: 'KE-02-T5-KH03',
            code: 'KH03',
            name: 'Khay 3: Van chia chữ T giảm áp Inox 304 có van khóa độc lập',
            visualType: 'clear-boxes',
            itemKeywords: ['van tê', 'chữ t', 'van khóa'],
            sampleItems: ['Van chữ T Inox 304 chia nước bồn cầu và vòi xịt'],
            assignedMaterialCodes: ['DN_VT_OPPR0_05'],
            qrCodeValue: 'DNCT-WH-KE-02-T5-KH03',
          },
        ],
      },
    ],
  },

  // 5. KỆ 1 (Kệ sắt 5 tầng lưu trữ - Tầng 1 trên cùng là nóc kệ tận dụng)
  {
    id: 'KE-01',
    code: 'KE-01',
    name: 'KỆ VẬT TƯ SỐ 1',
    type: 'SHELF_4_TIER',
    categoryLabel: 'Vật Tư Nước & Thiết Bị Vệ Sinh',
    dimensions: { lengthMm: 1500, widthMm: 500, heightMm: 1800, levels: 5 },
    svgRect: { x: 548, y: 30, width: 122, height: 75 },
    colorTheme: {
      base: 'from-emerald-600/30 to-slate-900',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/30',
      badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Kệ sắt v lỗ chứa xiphong lavabo, keo dán silicon Apollo, nắp bồn tiểu và phụ kiện thoát nước.',
    qrCodeValue: 'DNCT-WH-KE-01',
    notes: 'Kệ số 1 trên dãy tường trên (kế bên Tủ Đồ Nghề 2). Tầng 1 trên cùng tận dụng chứa vật tư cồng kềnh.',
    tiers: [
      {
        tierNumber: 1,
        label: 'Tầng 1 (Nóc Kệ Trên Cùng - Tận Dụng Để Vật Tư)',
        categoryDesc: 'Nóc kệ: Thùng găng tay cách điện, máy cấp khí Ozone và thiết bị bảo hộ',
        itemKeywords: ['găng tay', 'cách điện', 'ozone', 'máy ozone'],
        visualType: 'cardboard-boxes',
        sampleItems: ['Thùng găng tay cách điện', 'Máy cấp khí Ozone 3g/h'],
        compartments: [
          {
            id: 'KE-01-T1-KH01',
            code: 'KH01',
            name: 'Thùng 1: Găng tay cách điện',
            visualType: 'cardboard-boxes',
            itemKeywords: ['găng tay cách điện', 'bảo hộ'],
            sampleItems: ['Găng tay cách điện hạ thế'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T1-KH01',
          },
          {
            id: 'KE-01-T1-KH02',
            code: 'KH02',
            name: 'Thùng 2: Máy Ozone',
            visualType: 'cardboard-boxes',
            itemKeywords: ['ozone', 'máy ozone'],
            sampleItems: ['Máy cấp khí Ozone 3g/h'],
            assignedMaterialCodes: ['DN_VT_MOZON_01'],
            qrCodeValue: 'DNCT-WH-KE-01-T1-KH02',
          },
        ],
      },
      {
        tierNumber: 2,
        label: 'Tầng 2 (Mâm Lửng Trên)',
        categoryDesc: 'Phụ kiện lavabo, roan su bồn cầu, lõi lọc màng RO và găng tay y tế',
        itemKeywords: ['lavabo', 'roan su', 'màng ro', 'găng tay y tế'],
        visualType: 'blue-bins',
        sampleItems: ['Phụ kiện xả lavabo', 'Roan su bồn cầu', 'Lõi lọc màng RO 10 inch', 'Găng tay y tế'],
        compartments: [
          {
            id: 'KE-01-T2-KH01',
            code: 'KH01',
            name: 'Khay 1: Phụ kiện lavabo',
            visualType: 'blue-bins',
            itemKeywords: ['phụ kiện lavabo', 'lavabo', 'xiphong'],
            sampleItems: ['Xi phông lavabo ruột gà Inox', 'Đầu xả lavabo'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T2-KH01',
          },
          {
            id: 'KE-01-T2-KH02',
            code: 'KH02',
            name: 'Khay 2: Roan su bồn cầu',
            visualType: 'blue-bins',
            itemKeywords: ['roan su', 'bồn cầu', 'gioăng'],
            sampleItems: ['Roan su chống rỉ nước két bồn cầu'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T2-KH02',
          },
          {
            id: 'KE-01-T2-KH03',
            code: 'KH03',
            name: 'Khay 3: Lõi lọc màng RO',
            visualType: 'blue-bins',
            itemKeywords: ['lõi lọc', 'màng ro', 'ro'],
            sampleItems: ['Lõi lọc màng RO 50 GPD'],
            assignedMaterialCodes: ['DN_VT_LOIRO_02'],
            qrCodeValue: 'DNCT-WH-KE-01-T2-KH03',
          },
          {
            id: 'KE-01-T2-KH04',
            code: 'KH04',
            name: 'Khay 4: Găng tay y tế',
            visualType: 'blue-bins',
            itemKeywords: ['găng tay', 'y tế'],
            sampleItems: ['Hộp găng tay y tế cao su'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T2-KH04',
          },
        ],
      },
      {
        tierNumber: 3,
        label: 'Tầng 3 (Mâm Lửng Giữa)',
        categoryDesc: 'Hộp giấy Inox, vòi xà phòng cảm ứng, vòi xà phòng cơ và máy sấy tay',
        itemKeywords: ['hộp giấy', 'vòi xà phòng', 'máy sấy tay'],
        visualType: 'blue-bins',
        sampleItems: ['Hộp giấy Inox lau tay', 'Vòi xà phòng cảm ứng Viglacera', 'Vòi xà phòng cơ nhấn âm bàn', 'Máy sấy tay siêu tốc'],
        compartments: [
          {
            id: 'KE-01-T3-KH01',
            code: 'KH01',
            name: 'Khay 1: Hộp giấy inox',
            visualType: 'blue-bins',
            itemKeywords: ['hộp giấy', 'inox'],
            sampleItems: ['Hộp đựng giấy lau tay Inox 304'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T3-KH01',
          },
          {
            id: 'KE-01-T3-KH02',
            code: 'KH02',
            name: 'Khay 2: Vòi xà phòng cảm ứng',
            visualType: 'blue-bins',
            itemKeywords: ['vòi xà phòng', 'cảm ứng'],
            sampleItems: ['Vòi xà phòng cảm ứng tự động'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T3-KH02',
          },
          {
            id: 'KE-01-T3-KH03',
            code: 'KH03',
            name: 'Khay 3: Vòi xà phòng',
            visualType: 'blue-bins',
            itemKeywords: ['vòi xà phòng', 'nhấn'],
            sampleItems: ['Đầu vòi nhấn xà phòng âm bàn Inox'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T3-KH03',
          },
          {
            id: 'KE-01-T3-KH04',
            code: 'KH04',
            name: 'Khay 4: Máy sấy tay',
            visualType: 'blue-bins',
            itemKeywords: ['máy sấy tay', 'sấy tay'],
            sampleItems: ['Máy sấy tay cảm ứng gắn tường'],
            assignedMaterialCodes: [],
            qrCodeValue: 'DNCT-WH-KE-01-T3-KH04',
          },
        ],
      },
      {
        tierNumber: 4,
        label: 'Tầng 4 (Mâm Lửng Dưới)',
        categoryDesc: 'Phao cấp nước bồn tiểu cảm ứng, dây cấp nước mềm & phễu thoát sàn ngăn mùi',
        itemKeywords: ['phao bồn tiểu', 'thoát sàn', 'dây cấp', 'ngăn mùi'],
        visualType: 'clear-boxes',
        sampleItems: ['Phao cấp nước bồn tiểu cảm ứng', 'Phễu thoát sàn khử mùi Inox 100x100', 'Dây cấp mềm Inox 304'],
        compartments: [
          {
            id: 'KE-01-T4-KH01',
            code: 'KH01',
            name: 'Khay 1: Phao cấp nước bồn tiểu cảm ứng & Van xả tiểu',
            visualType: 'clear-boxes',
            itemKeywords: ['phao bồn tiểu', 'van xả'],
            sampleItems: ['Cụm van điện từ xả tiểu nam Viglacera/Toto'],
            assignedMaterialCodes: ['DN_VT_TBVS0_07'],
            qrCodeValue: 'DNCT-WH-KE-01-T4-KH01',
          },
          {
            id: 'KE-01-T4-KH02',
            code: 'KH02',
            name: 'Khay 2: Phễu thoát sàn ngăn mùi Inox 304',
            visualType: 'clear-boxes',
            itemKeywords: ['thoát sàn', 'ngăn mùi'],
            sampleItems: ['Phễu thoát sàn chống hôi bẫy nước Inox 304'],
            assignedMaterialCodes: ['DN_VT_TBVS0_08'],
            qrCodeValue: 'DNCT-WH-KE-01-T4-KH02',
          },
        ],
      },
      {
        tierNumber: 5,
        label: 'Tầng 5 (Mâm Đáy Sát Sàn)',
        categoryDesc: 'Nắp bồn tiểu, bộ xả bồn tiểu, bình chứa xà phòng âm bàn & phụ kiện nặng',
        itemKeywords: ['nắp bồn tiểu', 'xà phòng', 'bình xà phòng'],
        visualType: 'cardboard-boxes',
        sampleItems: ['Nắp đậy sứ bồn tiểu nam Viglacera', 'Bình chứa xà phòng âm bàn Inox 304', 'Bộ xả bồn tiểu nam'],
        compartments: [
          {
            id: 'KE-01-T5-KH01',
            code: 'KH01',
            name: 'Khay 1: Nắp bồn tiểu sứ Model 5A1 & Bộ xả nhấn cơ',
            visualType: 'cardboard-boxes',
            itemKeywords: ['nắp bồn tiểu', '5a1'],
            sampleItems: ['Nắp đậy sứ bồn tiểu nam'],
            assignedMaterialCodes: ['DN_VT_TBVS0_09'],
            qrCodeValue: 'DNCT-WH-KE-01-T5-KH01',
          },
          {
            id: 'KE-01-T5-KH02',
            code: 'KH02',
            name: 'Khay 2: Bình chứa xà phòng âm bàn Inox 304 & Hộp xà phòng cảm ứng',
            visualType: 'cardboard-boxes',
            itemKeywords: ['xà phòng', 'bình xà phòng'],
            sampleItems: ['Bình xà phòng gắn lavabo inox 304'],
            assignedMaterialCodes: ['DN_VT_TBVS0_10'],
            qrCodeValue: 'DNCT-WH-KE-01-T5-KH02',
          },
        ],
      },
    ],
  },

  // 6. TỦ ĐỒ NGHỀ 2 (TĐN-02)
  {
    id: 'TDN-02',
    code: 'TĐN-02',
    name: 'Tủ Đồ Nghề Kỹ Thuật 2',
    type: 'TOOL_CABINET',
    categoryLabel: 'Dụng Cụ Cơ Khí & Khoan Cắt',
    dimensions: { lengthMm: 900, widthMm: 500, heightMm: 1800, levels: 4 },
    svgRect: { x: 678, y: 30, width: 85, height: 75 },
    colorTheme: {
      base: 'from-blue-600/30 to-blue-900/40',
      border: 'border-blue-500',
      glow: 'shadow-blue-500/30',
      badgeBg: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ sắt dụng cụ cơ khí chuyên dụng: Máy khoan bêtông Bosch, máy mài góc, bộ cờ lê mỏ lết, búa cao su, thước kẹp cơ khí.',
    qrCodeValue: 'DNCT-WH-TDN-02',
    notes: 'Kế bên Kệ 1 và Tủ Đồ Nghề 1 trên dãy tường trên.',
    tiers: [
      {
        tierNumber: 1,
        label: 'Tầng 1 (Trên cùng)',
        categoryDesc: 'Máy khoan pin Bosch, máy mài góc cầm tay, máy thổi bụi',
        itemKeywords: ['khoan', 'máy mài', 'bosch', 'máy thổi'],
        visualType: 'tool-case',
        sampleItems: ['Máy khoan bêtông Bosch GBH 2-26 DRE', 'Máy mài góc Bosch GWS 750-100', 'Máy thổi bụi Maktec'],
        compartments: [
          {
            id: 'TDN-02-T1-KH01',
            code: 'KH01',
            name: 'Khay 1: Máy khoan bêtông búa Bosch GBH 2-26 DRE & Hộp mũi khoan',
            visualType: 'tool-case',
            itemKeywords: ['khoan bosch', 'gbh 2-26'],
            sampleItems: ['Máy khoan Bosch 3 chức năng GBH 2-26 DRE kèm đầu kẹp'],
            assignedMaterialCodes: [ 'DN_VT_KIMKH_11', 'DN_VT_KIMKH_12', 'DN_VT_KHOAN_19' ],
            qrCodeValue: 'DNCT-WH-TDN-02-T1-KH01',
          },
          {
            id: 'TDN-02-T1-KH02',
            code: 'KH02',
            name: 'Khay 2: Máy mài góc cắt cầm tay Bosch GWS 750-100 & Đá cắt Inox',
            visualType: 'tool-case',
            itemKeywords: ['máy mài', 'gws 750'],
            sampleItems: ['Máy mài góc Bosch GWS 750-100 kèm vành chắn an toàn'],
            assignedMaterialCodes: ['DN_VT_KIMKH_01', 'DN_VT_KIMKH_15'],
            qrCodeValue: 'DNCT-WH-TDN-02-T1-KH02',
          },
        ],
      },
      {
        tierNumber: 2,
        label: 'Tầng 2',
        categoryDesc: 'Bộ cờ lê tròng tự động Yeti 8-32mm, mỏ lết răng Bahco',
        itemKeywords: ['cờ lê', 'mỏ lết', 'bahco', 'yeti'],
        visualType: 'tool-case',
        sampleItems: ['Bộ cờ lê vòng miệng tự động 8-32mm', 'Mỏ lết răng Bahco 12 inch', 'Mỏ lết vặn ống nước 18 inch'],
        compartments: [
          {
            id: 'TDN-02-T2-KH01',
            code: 'KH01',
            name: 'Khay 1: Bộ cờ lê vòng miệng tự động 14 chi tiết từ 8mm đến 32mm',
            visualType: 'tool-case',
            itemKeywords: ['cờ lê vòng', 'cờ lê 8-32'],
            sampleItems: ['Bộ cờ lê tự động lắc léo Cr-V'],
            assignedMaterialCodes: ['DN_VT_KIMKH_09', 'DN_VT_KIMKH_10'],
            qrCodeValue: 'DNCT-WH-TDN-02-T2-KH01',
          },
          {
            id: 'TDN-02-T2-KH02',
            code: 'KH02',
            name: 'Khay 2: Mỏ lết đa năng cán bọc cao su Bahco 8 inch, 10 inch, 12 inch',
            visualType: 'tool-case',
            itemKeywords: ['mỏ lết', 'bahco'],
            sampleItems: ['Mỏ lết Bahco Thụy Điển 10 inch'],
            assignedMaterialCodes: ['DN_VT_KIMKH_06', 'DN_VT_KIMKH_07'],
            qrCodeValue: 'DNCT-WH-TDN-02-T2-KH02',
          },
        ],
      },
      {
        tierNumber: 3,
        label: 'Tầng 3',
        categoryDesc: 'Búa cơ khí, búa cao su, đục lấy dấu, cưa sắt cầm tay',
        itemKeywords: ['búa', 'đục', 'cưa sắt', 'lấy dấu'],
        visualType: 'tool-case',
        sampleItems: ['Búa gõ gỉ sắt đầu nhọn 500g', 'Búa cao su chống nảy', 'Khung cưa sắt Eclipse kèm lưỡi cưa HSS'],
        compartments: [
          {
            id: 'TDN-02-T3-KH01',
            code: 'KH01',
            name: 'Khay 1: Búa đập cơ khí 500g, búa cao su trắng chống trầy xước bề mặt',
            visualType: 'tool-case',
            itemKeywords: ['búa cơ khí', 'búa cao su'],
            sampleItems: ['Búa cán sợi thủy tinh Stanley 500g', 'Búa cao su đường kính 60mm'],
            assignedMaterialCodes: ['DN_VT_KIMKH_13', 'DN_VT_KIMKH_14'],
            qrCodeValue: 'DNCT-WH-TDN-02-T3-KH01',
          },
          {
            id: 'TDN-02-T3-KH02',
            code: 'KH02',
            name: 'Khay 2: Khung cưa sắt Eclipse 300mm & Hộp 100 lưỡi cưa sắt HSS',
            visualType: 'tool-case',
            itemKeywords: ['cưa sắt', 'lưỡi cưa'],
            sampleItems: ['Khung cưa sắt Eclipse 300mm'],
            assignedMaterialCodes: ['DN_VT_KIMKH_08'],
            qrCodeValue: 'DNCT-WH-TDN-02-T3-KH02',
          },
        ],
      },
      {
        tierNumber: 4,
        label: 'Tầng 4 (Dưới cùng)',
        categoryDesc: 'Thước cuộn thép 5m/10m, thước kẹp cơ khí Mitutoyo, nivo cân bằng laser',
        itemKeywords: ['thước', 'thước kẹp', 'mitutoyo', 'nivo', 'laser'],
        visualType: 'tool-case',
        sampleItems: ['Thước kẹp điện tử Mitutoyo 0-150mm', 'Nivo cân bằng từ tính Stanley', 'Thước cuộn thép Tajima 5m'],
        compartments: [
          {
            id: 'TDN-02-T4-KH01',
            code: 'KH01',
            name: 'Khay 1: Thước kẹp điện tử chính xác Mitutoyo 150mm (độ chính xác 0.01mm)',
            visualType: 'tool-case',
            itemKeywords: ['thước kẹp', 'mitutoyo'],
            sampleItems: ['Thước kẹp điện tử Mitutoyo 500-196-30'],
            assignedMaterialCodes: ['DN_CC_DKIEM_04'],
            qrCodeValue: 'DNCT-WH-TDN-02-T4-KH01',
          },
          {
            id: 'TDN-02-T4-KH02',
            code: 'KH02',
            name: 'Khay 2: Nivo cân thủy từ tính 3 mắt Stanley & Thước cuộn thép 5m/10m Tajima',
            visualType: 'tool-case',
            itemKeywords: ['nivo', 'thước cuộn', 'tajima'],
            sampleItems: ['Thước nivo từ tính Stanley 400mm', 'Thước cuộn Tajima 5m chống va đập'],
            assignedMaterialCodes: ['DN_CC_DKIEM_05'],
            qrCodeValue: 'DNCT-WH-TDN-02-T4-KH02',
          },
        ],
      },
    ],
  },

  // 7. TỦ ĐỒ NGHỀ 1 (TĐN-01)
  {
    id: 'TDN-01',
    code: 'TĐN-01',
    name: 'Tủ Đồ Nghề Kỹ Thuật 1',
    type: 'TOOL_CABINET',
    categoryLabel: 'Dụng Cụ An Toàn & Thi Công',
    dimensions: { lengthMm: 900, widthMm: 500, heightMm: 1800, levels: 4 },
    svgRect: { x: 770, y: 30, width: 85, height: 75 },
    colorTheme: {
      base: 'from-blue-600/30 to-blue-900/40',
      border: 'border-blue-500',
      glow: 'shadow-blue-500/30',
      badgeBg: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ thép xanh bảo hộ chuyên biệt: Dụng cụ an toàn điện, kìm ép cosse thủy lực, đồng hồ vạn năng VOM, máy đo Megger, găng tay cách điện.',
    qrCodeValue: 'DNCT-WH-TDN-01',
    notes: 'Kế bên Tủ Đồ Nghề 2 và khu vực bình cứu hỏa PCCC.',
    tiers: [
      {
        tierNumber: 1,
        label: 'Tầng 1 (Trên cùng)',
        categoryDesc: 'Thiết bị đo kiểm Fluke/Kyoritsu & Đồng hồ đo điện áp',
        itemKeywords: ['fluke', 'đo', 'vom', 'ampe', 'megger'],
        visualType: 'tool-case',
        sampleItems: ['Đồng hồ VOM Fluke 179', 'Ampe kìm Kyoritsu 2002PA', 'Máy đo điện trở đất'],
        compartments: [
          {
            id: 'TDN-01-T1-KH01',
            code: 'KH01',
            name: 'Khay 1: Đồng hồ vạn năng VOM Fluke & Ampe kìm Kyoritsu',
            visualType: 'tool-case',
            itemKeywords: ['fluke', 'vom', 'ampe', 'kyoritsu'],
            sampleItems: ['Đồng hồ VOM Fluke 179 True-RMS', 'Ampe kìm Kyoritsu 2002PA'],
            assignedMaterialCodes: ['DN_CC_DKIEM_02', 'DN_CC_DKIEM_03'],
            qrCodeValue: 'DNCT-WH-TDN-01-T1-KH01',
          },
          {
            id: 'TDN-01-T1-KH02',
            code: 'KH02',
            name: 'Khay 2: Máy đo điện trở cách điện Megger & Đo thứ tự pha',
            visualType: 'tool-case',
            itemKeywords: ['megger', 'cách điện', 'thứ tự pha', 'đo pha'],
            sampleItems: ['Máy đo Megger 1000V Kyoritsu', 'Đồng hồ chỉ thị pha SEW'],
            assignedMaterialCodes: ['DN_CC_DKIEM_01'],
            qrCodeValue: 'DNCT-WH-TDN-01-T1-KH02',
          },
        ],
      },
      {
        tierNumber: 2,
        label: 'Tầng 2',
        categoryDesc: 'Kìm ép cosse cơ & thủy lực, kìm tuốt dây',
        itemKeywords: ['kìm', 'cosse', 'tuốt', 'bấm'],
        visualType: 'tool-case',
        sampleItems: ['Kìm ép cosse thủy lực YQK-300', 'Kìm tuốt dây tự động', 'Bộ tuốc nơ vít 1000V'],
        compartments: [
          {
            id: 'TDN-01-T2-KH01',
            code: 'KH01',
            name: 'Khay 1: Kìm ép cosse thủy lực YQK-300 & hàm ép 16-300mm²',
            visualType: 'tool-case',
            itemKeywords: ['ép cosse', 'thủy lực', 'yqk'],
            sampleItems: ['Kìm ép cosse thủy lực YQK-300', 'Bộ hàm ép lục giác'],
            assignedMaterialCodes: ['DN_VT_KIMKH_16', 'DN_VT_KIMKH_17'],
            qrCodeValue: 'DNCT-WH-TDN-01-T2-KH01',
          },
          {
            id: 'TDN-01-T2-KH02',
            code: 'KH02',
            name: 'Khay 2: Kìm bấm cosse pin kim, kìm tuốt dây & tua vít cách điện 1000V',
            visualType: 'tool-case',
            itemKeywords: ['kìm bấm', 'tuốt dây', 'tua vít', 'cách điện'],
            sampleItems: ['Kìm tuốt dây tự động Tsunoda', 'Bộ tua vít cách điện PB Swiss Tools 1000V'],
            assignedMaterialCodes: ['DN_VT_KIMKH_03', 'DN_VT_KIMKH_04'],
            qrCodeValue: 'DNCT-WH-TDN-01-T2-KH02',
          },
        ],
      },
      {
        tierNumber: 3,
        label: 'Tầng 3',
        categoryDesc: 'Đồ bảo hộ an toàn điện, mũ nón, găng tay cách điện',
        itemKeywords: ['găng', 'bảo hộ', 'cách điện', 'kính'],
        visualType: 'tool-case',
        sampleItems: ['Găng tay cách điện hạ thế 1000V', 'Kính bảo hộ chống hồ quang', 'Ủng cách điện'],
        compartments: [
          {
            id: 'TDN-01-T3-KH01',
            code: 'KH01',
            name: 'Khay 1: Găng tay cách điện hạ thế 1000V & găng tay da bảo vệ ngoài',
            visualType: 'tool-case',
            itemKeywords: ['găng tay', 'hạ thế', '1000v'],
            sampleItems: ['Găng tay cao su cách điện Regeltex 1000V', 'Găng da cừu lót ngoài'],
            assignedMaterialCodes: ['DN_VT_KIMKH_05'],
            qrCodeValue: 'DNCT-WH-TDN-01-T3-KH01',
          },
          {
            id: 'TDN-01-T3-KH02',
            code: 'KH02',
            name: 'Khay 2: Kính chống hồ quang điện & thảm cách điện cao su di động',
            visualType: 'tool-case',
            itemKeywords: ['kính', 'hồ quang', 'thảm cách điện'],
            sampleItems: ['Kính bảo hộ mặt chống hồ quang 3M', 'Tấm thảm cao su cách điện 1x1m'],
            assignedMaterialCodes: ['DN_VT_KIMKH_18'],
            qrCodeValue: 'DNCT-WH-TDN-01-T3-KH02',
          },
        ],
      },
      {
        tierNumber: 4,
        label: 'Tầng 4 (Dưới cùng)',
        categoryDesc: 'Mỏ hàn thiếc, cuộn thiếc hàn Nhật Asahi, bơm hút thiếc & đồng hồ đo nhiệt độ',
        itemKeywords: ['mỏ hàn', 'thiếc hàn', 'asahi', 'hút thiếc'],
        visualType: 'tool-case',
        sampleItems: ['Trạm hàn Hakko FX-888D 70W', 'Cuộn thiếc hàn Asahi 60/40 1kg', 'Ống hút thiếc Hakko'],
        compartments: [
          {
            id: 'TDN-01-T4-KH01',
            code: 'KH01',
            name: 'Khay 1: Trạm hàn thiếc điều chỉnh nhiệt độ Hakko FX-888D chính hãng',
            visualType: 'tool-case',
            itemKeywords: ['trạm hàn', 'hakko'],
            sampleItems: ['Trạm hàn điện tử điều nhiệt Hakko FX-888D kèm gác mỏ hàn'],
            assignedMaterialCodes: ['DN_VT_KIMKH_02'],
            qrCodeValue: 'DNCT-WH-TDN-01-T4-KH01',
          },
          {
            id: 'TDN-01-T4-KH02',
            code: 'KH02',
            name: 'Khay 2: Cuộn thiếc hàn Asahi 63/37 có nhựa thông & Bơm hút thiếc',
            visualType: 'tool-case',
            itemKeywords: ['thiếc hàn', 'asahi'],
            sampleItems: ['Cuộn thiếc Asahi Nhật Bản 0.8mm', 'Bơm hút thiếc nhôm'],
            assignedMaterialCodes: ['DN_VT_KIMKH_01'],
            qrCodeValue: 'DNCT-WH-TDN-01-T4-KH02',
          },
        ],
      },
    ],
  },

  // 8. CỤM GIÀN ẮC QUY VÀ NEW UPS LTG (Dọc tường trái trong ô cảnh báo sọc vàng-đen)
  {
    id: 'BATT-3',
    code: 'BATT.3',
    name: 'Dàn Ắc Quy Dự Phòng 3 (Tường Trái)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 600, heightMm: 1800, levels: 3 },
    svgRect: { x: 28, y: 130, width: 122, height: 68 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-slate-500',
      glow: 'shadow-slate-500/20',
      badgeBg: 'bg-slate-750 text-slate-300',
      badgeText: 'text-slate-300',
    },
    description: 'Khung giá đỡ dàn ắc quy khô viễn thông tầng 3 dọc tường trái.',
    qrCodeValue: 'DNCT-WH-BATT-03',
  },
  {
    id: 'BATT-2',
    code: 'BATT.2',
    name: 'Dàn Ắc Quy Dự Phòng 2 (Tường Trái)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 600, heightMm: 1800, levels: 3 },
    svgRect: { x: 28, y: 208, width: 122, height: 68 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-slate-500',
      glow: 'shadow-slate-500/20',
      badgeBg: 'bg-slate-750 text-slate-300',
      badgeText: 'text-slate-300',
    },
    description: 'Khung giá đỡ dàn ắc quy khô viễn thông tầng 2 dọc tường trái.',
    qrCodeValue: 'DNCT-WH-BATT-02',
  },
  {
    id: 'BATT-1',
    code: 'BATT.1',
    name: 'Dàn Ắc Quy Dự Phòng 1 (Tường Trái)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 600, heightMm: 1800, levels: 3 },
    svgRect: { x: 28, y: 286, width: 122, height: 68 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-slate-500',
      glow: 'shadow-slate-500/20',
      badgeBg: 'bg-slate-750 text-slate-300',
      badgeText: 'text-slate-300',
    },
    description: 'Khung giá đỡ dàn ắc quy khô viễn thông tầng 1 dọc tường trái.',
    qrCodeValue: 'DNCT-WH-BATT-01',
  },
  {
    id: 'NEW-UPS-LTG',
    code: 'NEW UPS LTG',
    name: 'Tủ NEW UPS LTG (Schneider)',
    type: 'UPS_CABINET',
    categoryLabel: 'Hệ Thống Nguồn UPS Schneider',
    dimensions: { lengthMm: 1150, widthMm: 600, heightMm: 1900, levels: 1 },
    svgRect: { x: 28, y: 364, width: 122, height: 72 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/20',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeText: 'text-emerald-300',
    },
    description: 'Tủ nguồn lưu điện NEW UPS LTG Schneider Electric phục vụ chiếu sáng khẩn cấp nhà ga T2.',
    qrCodeValue: 'DNCT-WH-NEW-UPS-LTG',
  },

  // 9. CỤM TỦ UPS-1 & ẮC QUY DỰ PHÒNG (Đảo Giữa Trên trong ô cảnh báo vàng-đen)
  {
    id: 'UPS-1-EQPT',
    code: 'UPS-1 EQPT',
    name: 'Tủ Nguồn Lưu Điện UPS-1 (SOCOMEC)',
    type: 'UPS_CABINET',
    categoryLabel: 'Hệ Thống Nguồn UPS Socomec',
    dimensions: { lengthMm: 1000, widthMm: 850, heightMm: 1900, levels: 1 },
    svgRect: { x: 472, y: 148, width: 136, height: 104 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-yellow-500',
      glow: 'shadow-yellow-500/20',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      badgeText: 'text-yellow-300',
    },
    description: 'Tủ UPS công nghiệp Socomec Delphys BC cấp nguồn liên tục cho thiết bị điều hành nhà ga T2.',
    qrCodeValue: 'DNCT-WH-UPS-01-EQPT',
    notes: 'Khu vực điện cao thế - Bắt buộc mang đồ bảo hộ khi kiểm tra.',
  },
  {
    id: 'BATT-2-UPS-1',
    code: 'BATT.2 UPS-1',
    name: 'Tủ Ắc Quy Dự Phòng 2 (UPS 1)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 620, y: 148, width: 136, height: 104 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy khô viễn thông chuyên dụng 12V-150Ah/200Ah kết nối chuỗi DC dự phòng cho UPS-1.',
    qrCodeValue: 'DNCT-WH-BATT-02-UPS-1',
  },
  {
    id: 'BATT-1-UPS-1',
    code: 'BATT.1 UPS-1',
    name: 'Tủ Ắc Quy Dự Phòng 1 (UPS 1)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 764, y: 148, width: 136, height: 104 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy khô chuyên dụng UPS-1 chuỗi 1 cấp nguồn cho tải thiết bị trọng yếu sân bay.',
    qrCodeValue: 'DNCT-WH-BATT-01-UPS-1',
  },

  // 10. CỤM TỦ UPS-2 & ẮC QUY DỰ PHÒNG (Đảo Giữa Dưới trong ô cảnh báo vàng-đen)
  {
    id: 'UPS-2-EQPT',
    code: 'UPS-2 EQPT',
    name: 'Tủ Nguồn Lưu Điện UPS-2 (SOCOMEC)',
    type: 'UPS_CABINET',
    categoryLabel: 'Hệ Thống Nguồn UPS Socomec',
    dimensions: { lengthMm: 1000, widthMm: 850, heightMm: 1900, levels: 1 },
    svgRect: { x: 392, y: 308, width: 118, height: 104 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-yellow-500',
      glow: 'shadow-yellow-500/20',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      badgeText: 'text-yellow-300',
    },
    description: 'Tủ nguồn UPS Socomec Hệ thống 2 chạy song song dự phòng N+1 bảo đảm tính sẵn sàng cho Cảng HKQT Đà Nẵng.',
    qrCodeValue: 'DNCT-WH-UPS-02-EQPT',
  },
  {
    id: 'BATT-3-UPS-2',
    code: 'BATT.3 UPS-2',
    name: 'Tủ Ắc Quy Dự Phòng 3 (UPS 2)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 522, y: 308, width: 118, height: 104 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy khô UPS-2 chuỗi 3.',
    qrCodeValue: 'DNCT-WH-BATT-03-UPS-2',
  },
  {
    id: 'BATT-2-UPS-2',
    code: 'BATT.2 UPS-2',
    name: 'Tủ Ắc Quy Dự Phòng 2 (UPS 2)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 652, y: 308, width: 118, height: 104 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy khô UPS-2 chuỗi 2.',
    qrCodeValue: 'DNCT-WH-BATT-02-UPS-2',
  },
  {
    id: 'BATT-1-UPS-2',
    code: 'BATT.1 UPS-2',
    name: 'Tủ Ắc Quy Dự Phòng 1 (UPS 2)',
    type: 'BATTERY_RACK',
    categoryLabel: 'Dàn Ắc Quy Chì-Axit Kín Khí',
    dimensions: { lengthMm: 1000, widthMm: 800, heightMm: 1900, levels: 4 },
    svgRect: { x: 782, y: 308, width: 118, height: 104 },
    colorTheme: {
      base: 'from-slate-800 to-slate-950',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeText: 'text-amber-300',
    },
    description: 'Dàn ắc quy khô UPS-2 chuỗi 1.',
    qrCodeValue: 'DNCT-WH-BATT-01-UPS-2',
  },

  // 11. DÃY TỦ ĐIỆN PHÂN PHỐI (Dọc tường dưới theo sơ đồ kho mới)
  {
    id: 'ESB-UPS-LTG',
    code: 'ESB-UPS LTG',
    name: 'Tủ Điện ESB-UPS LTG',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Điện Phân Phối Chiếu Sáng',
    dimensions: { lengthMm: 1200, widthMm: 500, heightMm: 2100, levels: 1 },
    svgRect: { x: 28, y: 458, width: 205, height: 62 },
    colorTheme: {
      base: 'from-blue-900/40 to-slate-900',
      border: 'border-blue-400',
      glow: 'shadow-blue-400/20',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ điện Emergency Switchboard ESB-UPS LTG cấp nguồn khẩn cấp cho chiếu sáng nhà ga T2.',
    qrCodeValue: 'DNCT-WH-ESB-UPS-LTG',
  },
  {
    id: 'ESB-UPS-EQPT',
    code: 'ESB-UPS EQPT',
    name: 'Tủ Điện ESB-UPS EQPT',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Điện Phân Phối Thiết Bị',
    dimensions: { lengthMm: 1200, widthMm: 500, heightMm: 2100, levels: 1 },
    svgRect: { x: 245, y: 458, width: 205, height: 62 },
    colorTheme: {
      base: 'from-blue-900/40 to-slate-900',
      border: 'border-blue-400',
      glow: 'shadow-blue-400/20',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ điện Emergency Switchboard ESB-UPS EQPT cấp nguồn khẩn cấp cho thiết bị đặc chủng sân bay.',
    qrCodeValue: 'DNCT-WH-ESB-UPS-EQPT',
  },
  {
    id: 'DP-UPS-LTG',
    code: 'DP-UPS LTG',
    name: 'Tủ Phân Phối DP-UPS LTG',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Phân Phối Phụ Tải Chiếu Sáng',
    dimensions: { lengthMm: 1200, widthMm: 500, heightMm: 2100, levels: 1 },
    svgRect: { x: 462, y: 458, width: 205, height: 62 },
    colorTheme: {
      base: 'from-blue-900/40 to-slate-900',
      border: 'border-blue-400',
      glow: 'shadow-blue-400/20',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ phân phối Distribution Panel DP-UPS LTG cấp các lộ chiếu sáng phòng điều hành và nhà ga.',
    qrCodeValue: 'DNCT-WH-DP-UPS-LTG',
  },
  {
    id: 'DP-UPS-EQPT',
    code: 'DP-UPS EQPT',
    name: 'Tủ Phân Phối DP-UPS EQPT',
    type: 'DISTRIBUTION_BOARD',
    categoryLabel: 'Tủ Phân Phối Phụ Tải Thiết Bị',
    dimensions: { lengthMm: 1200, widthMm: 500, heightMm: 2100, levels: 1 },
    svgRect: { x: 679, y: 458, width: 205, height: 62 },
    colorTheme: {
      base: 'from-blue-900/40 to-slate-900',
      border: 'border-blue-400',
      glow: 'shadow-blue-400/20',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      badgeText: 'text-blue-300',
    },
    description: 'Tủ phân phối Distribution Panel DP-UPS EQPT cấp tải thiết bị CNTT, server, camera an ninh T2.',
    qrCodeValue: 'DNCT-WH-DP-UPS-EQPT',
  },
];

/**
 * Chuẩn hóa danh sách thực thể kho (Shelves, Cabinets, Equipment):
 * 1. Đảm bảo mã QR định danh kệ: DNCT-WH-[Mã Kệ] (ví dụ: DNCT-WH-KE-01)
 * 2. Đảm bảo mã QR in tem dán khay: DNCT-WH-[Mã Kệ]-T[Số Tầng]-KH[Số Khay] (ví dụ: DNCT-WH-KE-01-T4-KH01)
 * 3. Đảm bảo thứ tự tầng: Tầng 1 ở trên cùng (Nóc kệ tận dụng), Tầng 2, 3, 4, 5 phân bổ dần xuống phía dưới mâm đáy.
 * 4. Đảm bảo mã khay luôn theo định dạng chuẩn: KH01, KH02, KH03...
 */
export function normalizeWarehouseEntities(entities: WarehouseShelfEntity[]): WarehouseShelfEntity[] {
  if (!entities || !Array.isArray(entities) || entities.length === 0) {
    return DEFAULT_WAREHOUSE_ENTITIES;
  }

  return entities.map((ent) => {
    const cleanCode = (ent.code || ent.id || '').trim();
    const isShelf = ent.type === 'SHELF_4_TIER' || cleanCode.startsWith('KE-');
    const isTool = ent.type === 'TOOL_CABINET' || cleanCode.startsWith('TDN-');

    const normalizedQr = isShelf || isTool
      ? `DNCT-WH-${cleanCode}`
      : (ent.qrCodeValue || `DNCT-WH-${cleanCode.replace(/\s+/g, '-')}`);

    if (!ent.tiers || ent.tiers.length === 0) {
      return {
        ...ent,
        qrCodeValue: normalizedQr,
      };
    }

    // Sort tiers strictly: Tier 1 at top -> Tier 5 at bottom
    const sortedTiers = ent.tiers.slice().sort((a, b) => a.tierNumber - b.tierNumber);
    const totalTiers = sortedTiers.length;

    const normalizedTiers = sortedTiers.map((tier, tIdx) => {
      const tierNum = tier.tierNumber || (tIdx + 1);
      const isTop = tierNum === 1;
      const isBottom = tierNum === totalTiers;

      let tierLabel = tier.label;
      if (isTop && !tierLabel.includes('Nóc')) {
        tierLabel = `Tầng 1 (Nóc Kệ Trên Cùng - Tận Dụng Để Vật Tư)`;
      } else if (isBottom && !tierLabel.includes('Đáy') && totalTiers >= 4) {
        tierLabel = `Tầng ${tierNum} (Mâm Đáy Sát Sàn)`;
      } else if (!tierLabel || tierLabel.startsWith('Tầng')) {
        tierLabel = `Tầng ${tierNum}`;
      }

      const normalizedComps = (tier.compartments || []).map((comp, cIdx) => {
        const rawCode = comp.code || '';
        let cleanCompCode = rawCode.toUpperCase().replace(/\s+/g, '');
        if (/^K\d+$/.test(cleanCompCode) && !cleanCompCode.startsWith('KH')) {
          cleanCompCode = cleanCompCode.replace(/^K/, 'KH');
        }
        if (!cleanCompCode.startsWith('KH')) {
          const compNum = cIdx + 1;
          cleanCompCode = compNum < 10 ? `KH0${compNum}` : `KH${compNum}`;
        }

        const standardQr = `DNCT-WH-${cleanCode}-T${tierNum}-${cleanCompCode}`;
        const standardId = `${cleanCode}-T${tierNum}-${cleanCompCode}`;

        // Find canonical default assignments for this compartment ONLY if comp has no defined codes
        let defaultCodes: string[] = [];
        if (comp.assignedMaterialCodes === undefined || comp.assignedMaterialCodes === null) {
          for (const defEnt of DEFAULT_WAREHOUSE_ENTITIES) {
            if (defEnt.code === cleanCode || defEnt.id === cleanCode) {
              const defTier = (defEnt.tiers || []).find((t) => t.tierNumber === tierNum);
              if (defTier) {
                const defComp = (defTier.compartments || []).find(
                  (c) => c.code === cleanCompCode || c.id === standardId
                );
                if (defComp && defComp.assignedMaterialCodes) {
                  defaultCodes = defComp.assignedMaterialCodes;
                }
              }
            }
          }
        }

        // CRITICAL FIX: If assignedMaterialCodes was explicitly set by user (even if empty []),
        // DO NOT merge defaultCodes into it! Respect user assignment 100%.
        const assignedCodes = Array.isArray(comp.assignedMaterialCodes)
          ? comp.assignedMaterialCodes
          : defaultCodes;

        return {
          ...comp,
          id: standardId,
          code: cleanCompCode,
          qrCodeValue: standardQr,
          assignedMaterialCodes: assignedCodes,
        };
      });

      return {
        ...tier,
        tierNumber: tierNum,
        label: tierLabel,
        compartments: normalizedComps,
      };
    });

    return {
      ...ent,
      qrCodeValue: normalizedQr,
      tiers: normalizedTiers,
    };
  });
}
