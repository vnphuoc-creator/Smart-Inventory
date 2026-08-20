import { Material } from '../types';

/**
 * Danh mục chuẩn 630+ vật tư phân hệ Điện - Nước - Chiếu Sáng - Vệ Sinh - Chống Sét
 * Đội Điện Nước Công Trình (DOIDNCT) - Cảng HKQT Đà Nẵng
 */
function generateComprehensiveCatalog(): Material[] {
  const staff = [
    'duc.nguyen@ahtcorp.vn',
    'rin.nguyen@ahtcorp.vn',
    'hanh.nguyen@ahtcorp.vn',
    'trinh.le@ahtcorp.vn',
    'hapham281@gmail.com',
    'manhdung051184@gmail.com',
    'gialacdao@gmail.com',
    'vanquang15994@gmail.com',
    'duykich1985@gmail.com',
    'xuanhungdn1988@gmail.com',
  ];

  const items: Material[] = [];
  let idCounter = 1;

  // =========================================================================
  // PHÂN HỆ 1: VẬT TƯ ĐIỆN & PHỤ KIỆN TIÊU HAO (~180 MÃ)
  // =========================================================================
  const cableSizes = ['1.5', '2.5', '4.0', '6.0', '10', '16', '25', '35', '50', '70', '95', '120', '150', '185', '240'];
  const cableColors = [
    { name: 'Đỏ', code: 'DO' },
    { name: 'Vàng', code: 'VG' },
    { name: 'Xanh dương', code: 'XD' },
    { name: 'Đen', code: 'DEN' },
    { name: 'Vàng sọc xanh lá (Tiếp địa)', code: 'PE' },
  ];

  // 1.1 Dây điện đơn ruột đồng Cadivi CV (8 sizes x 5 colors = 40 mã)
  cableSizes.slice(0, 8).forEach((size, sIdx) => {
    cableColors.forEach((col, cIdx) => {
      const code = `DN_DD_CV_${size.replace('.', '_')}_${col.code}`;
      items.push({
        id: `mat_dn_c_${idCounter++}`,
        code,
        name: `Dây điện đơn Cadivi CV-${size}mm2 (${col.name})`,
        category: 'Vật tư Điện & Phụ kiện tiêu hao',
        unit: 'Mét',
        specification: `Dây điện đơn ruột đồng mềm cách điện PVC 0.6/1kV Cadivi màu ${col.name}`,
        location: `Kệ Cáp Điện A${(sIdx % 4) + 1}`,
        initialStock: 120 + sIdx * 25 + cIdx * 15,
        minStock: 40,
        maxStock: 600,
        unitPrice: Math.round((8500 + sIdx * 8200 + cIdx * 400) / 100) * 100,
        allocatedStaffEmails: [staff[sIdx % staff.length], staff[(sIdx + 2) % staff.length]],
      });
    });
  });

  // 1.2 Dây súp đôi mềm VCmd Cadivi (6 mã)
  ['2x0.75', '2x1.0', '2x1.5', '2x2.5', '2x4.0', '2x6.0'].forEach((vSize, idx) => {
    items.push({
      id: `mat_dn_vcmd_${idCounter++}`,
      code: `DN_DD_VCMD_${idx + 1}`,
      name: `Dây điện đôi mềm dẹt Cadivi VCmd ${vSize}mm2`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Dây đồng mềm 2 ruột bọc PVC đôi dẹt chiếu sáng & ổ cắm di động 300/500V`,
      location: 'Kệ Dây Mềm A5',
      initialStock: 150 + idx * 30,
      minStock: 50,
      maxStock: 500,
      unitPrice: Math.round((6500 + idx * 4500) / 100) * 100,
      allocatedStaffEmails: [staff[1], staff[4]],
    });
  });

  // 1.3 Cáp điện lực hạ thế bọc cách điện XLPE Cadivi CXV (13 mã)
  const cxvMultiCore = ['2x4', '2x6', '2x10', '3x16+1x10', '3x25+1x16', '3x35+1x16', '3x50+1x25', '3x70+1x35', '3x95+1x50', '3x120+1x70', '3x150+1x70', '3x185+1x95', '3x240+1x120'];
  cxvMultiCore.forEach((cSize, idx) => {
    items.push({
      id: `mat_dn_cxv_${idCounter++}`,
      code: `DN_CP_CXV_${idx + 1}`,
      name: `Cáp điện lực hạ thế Cadivi CXV ${cSize}mm2 0.6/1kV`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp lực đồng cách điện XLPE vỏ bọc PVC 0.6/1kV tiêu chuẩn TCVN 5935`,
      location: 'Khu Cuộn Cáp Lớn B1',
      initialStock: 75 + idx * 10,
      minStock: 25,
      maxStock: 350,
      unitPrice: Math.round((38000 + idx * 45000) / 1000) * 1000,
      allocatedStaffEmails: [staff[0], staff[2]],
    });
  });

  // 1.4 Cáp ngầm bọc giáp băng thép Cadivi CXV/DSTA chôn ngầm sân đỗ (13 mã)
  cxvMultiCore.forEach((cSize, idx) => {
    items.push({
      id: `mat_dn_dsta_${idCounter++}`,
      code: `DN_CP_DSTA_${idx + 1}`,
      name: `Cáp ngầm giáp thép Cadivi CXV/DSTA ${cSize}mm2`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp lực ngầm bọc giáp băng kim loại chịu va đập cơ học chôn trực tiếp ngoài sân đỗ`,
      location: 'Khu Cuộn Cáp Lớn B2',
      initialStock: 60 + idx * 8,
      minStock: 20,
      maxStock: 250,
      unitPrice: Math.round((52000 + idx * 56000) / 1000) * 1000,
      allocatedStaffEmails: [staff[0], staff[3]],
    });
  });

  // 1.5 Cáp chống cháy & ít khói độc FR-CXV / Fire Resistant (10 mã)
  ['2x1.5', '2x2.5', '3x2.5', '3x4.0', '4x4.0', '4x6.0', '4x10', '4x16', '4x25', '4x35'].forEach((frSize, idx) => {
    items.push({
      id: `mat_dn_fr_${idCounter++}`,
      code: `DN_CP_FR_${idx + 1}`,
      name: `Cáp chống cháy Cadivi FR-CXV ${frSize}mm2 (Chịu nhiệt 950°C)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp bọc băng mica chống cháy 950°C trong 3 giờ tiêu chuẩn IEC 60331 phục vụ PCCC & máy phát`,
      location: 'Kệ Cáp Chống Cháy B3',
      initialStock: 80 + idx * 12,
      minStock: 30,
      maxStock: 300,
      unitPrice: Math.round((45000 + idx * 38000) / 1000) * 1000,
      allocatedStaffEmails: [staff[0], staff[1]],
    });
  });

  // 1.6 Cáp điều khiển có lưới chống nhiễu Sangjin / Altek Kabel (10 mã)
  ['2x0.75', '3x0.75', '4x0.75', '5x0.75', '7x0.75', '2x1.5', '3x1.5', '4x1.5', '5x1.5', '8x1.5'].forEach((ctrlSize, idx) => {
    items.push({
      id: `mat_dn_ctrl_${idCounter++}`,
      code: `DN_CP_CTRL_${idx + 1}`,
      name: `Cáp điều khiển bọc lưới chống nhiễu Altek Kabel ${ctrlSize}mm2`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp tín hiệu & điều khiển BMS bọc lưới đồng chống nhiễu cuộn 500m`,
      location: 'Kệ Cáp Tín Hiệu B4',
      initialStock: 120 + idx * 20,
      minStock: 50,
      maxStock: 500,
      unitPrice: Math.round((18000 + idx * 9500) / 100) * 100,
      allocatedStaffEmails: [staff[2], staff[4]],
    });
  });

  // 1.7 Đầu cosse đồng SC mạ thiếc dập nguội (15 mã)
  cableSizes.forEach((size, idx) => {
    items.push({
      id: `mat_dn_cos_${idCounter++}`,
      code: `DN_VT_COSSE_${size.replace('.', '_')}`,
      name: `Đầu cosse đồng SC ${size}mm2 (Lỗ bắt bulong M8/M10/M12)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Đầu cosse đồng đỏ mạ thiếc dập nguội tiêu chuẩn IEC chịu tải cao`,
      location: 'Hộp Ngăn Kéo Cosse C1',
      initialStock: 150 + idx * 30,
      minStock: 50,
      maxStock: 500,
      unitPrice: Math.round((3500 + idx * 4200) / 100) * 100,
      allocatedStaffEmails: [staff[4], staff[5]],
    });
  });

  // 1.8 Mũ chụp đầu cosse cách điện cao su (15 mã)
  cableSizes.forEach((size, idx) => {
    items.push({
      id: `mat_dn_muchup_${idCounter++}`,
      code: `DN_VT_MUCP_${size.replace('.', '_')}`,
      name: `Mũ chụp đầu cosse cao su V-${size} (Đỏ/Vàng/Xanh/Đen)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Mũ bảo vệ cách điện đầu cosse hạ thế mềm dẻo chịu nhiệt`,
      location: 'Hộp Ngăn Kéo Cosse C2',
      initialStock: 200 + idx * 25,
      minStock: 60,
      maxStock: 600,
      unitPrice: Math.round((1200 + idx * 800) / 100) * 100,
      allocatedStaffEmails: [staff[5], staff[6]],
    });
  });

  // 1.9 Đầu cosse kim dẹp, cosse chĩa Y, cosse tròn (12 mã)
  ['0.5-1.5mm2', '1.5-2.5mm2', '4.0-6.0mm2', '10mm2'].forEach((rSize, rIdx) => {
    ['Kim dẹp trần PTV', 'Chĩa Y bọc nhựa SV', 'Tròn bọc nhựa RV'].forEach((cosType, tIdx) => {
      items.push({
        id: `mat_dn_subcos_${idCounter++}`,
        code: `DN_VT_COS_${tIdx + 1}_${rIdx + 1}`,
        name: `Đầu cosse ${cosType} cỡ dây ${rSize} (Hộp 100 cái)`,
        category: 'Vật tư Điện & Phụ kiện tiêu hao',
        unit: 'Hộp',
        specification: `Đầu nối dây điều khiển tín hiệu tủ điện công nghiệp`,
        location: 'Kệ Cosse Nhỏ C3',
        initialStock: 25 + rIdx * 5,
        minStock: 8,
        maxStock: 80,
        unitPrice: 65000 + rIdx * 25000 + tIdx * 12000,
        allocatedStaffEmails: [staff[4], staff[6]],
      });
    });
  });

  // 1.10 Ống luồn dây điện PVC, Ống ruột gà & Phụ kiện (25 mã)
  const conduitList = [
    { code: 'DN_VT_ONGRG_D16', name: 'Ống ruột gà PVC chống cháy Sino SP D16 (Cuộn 50m)', unit: 'Cuộn', price: 165000 },
    { code: 'DN_VT_ONGRG_D20', name: 'Ống ruột gà PVC chống cháy Sino SP D20 (Cuộn 50m)', unit: 'Cuộn', price: 210000 },
    { code: 'DN_VT_ONGRG_D25', name: 'Ống ruột gà PVC chống cháy Sino SP D25 (Cuộn 40m)', unit: 'Cuộn', price: 245000 },
    { code: 'DN_VT_ONGRG_D32', name: 'Ống ruột gà PVC chống cháy Sino SP D32 (Cuộn 25m)', unit: 'Cuộn', price: 280000 },
    { code: 'DN_VT_ONGRG_LOITHEP_20', name: 'Ống ruột gà lõi thép bọc nhựa PVC Nippon Seam D20 (Cuộn 50m)', unit: 'Cuộn', price: 650000 },
    { code: 'DN_VT_ONGRG_LOITHEP_25', name: 'Ống ruột gà lõi thép bọc nhựa PVC Nippon Seam D25 (Cuộn 50m)', unit: 'Cuộn', price: 820000 },
    { code: 'DN_VT_ONGPVC_D16', name: 'Ống luồn dây cứng PVC Sino SP9016 D16 (Cây 2.92m)', unit: 'Cây', price: 24000 },
    { code: 'DN_VT_ONGPVC_D20', name: 'Ống luồn dây cứng PVC Sino SP9020 D20 (Cây 2.92m)', unit: 'Cây', price: 32000 },
    { code: 'DN_VT_ONGPVC_D25', name: 'Ống luồn dây cứng PVC Sino SP9025 D25 (Cây 2.92m)', unit: 'Cây', price: 46000 },
    { code: 'DN_VT_ONGPVC_D32', name: 'Ống luồn dây cứng PVC Sino SP9032 D32 (Cây 2.92m)', unit: 'Cây', price: 72000 },
    { code: 'DN_VT_DAUNOIRG_D16', name: 'Đầu nối ống ruột gà kín nước vào hộp điện D16', unit: 'Cái', price: 4500 },
    { code: 'DN_VT_DAUNOIRG_D20', name: 'Đầu nối ống ruột gà kín nước vào hộp điện D20', unit: 'Cái', price: 5800 },
    { code: 'DN_VT_DAUNOIRG_D25', name: 'Đầu nối ống ruột gà kín nước vào hộp điện D25', unit: 'Cái', price: 8200 },
    { code: 'DN_VT_KHOPNOI_D20', name: 'Khớp nối trơn ống luồn cứng PVC D20', unit: 'Cái', price: 2800 },
    { code: 'DN_VT_KHOPNOI_D25', name: 'Khớp nối trơn ống luồn cứng PVC D25', unit: 'Cái', price: 3900 },
    { code: 'DN_VT_KOPGOC_D20', name: 'Khớp nối góc 90 độ ống luồn cứng PVC D20', unit: 'Cái', price: 4200 },
    { code: 'DN_VT_KOPGOC_D25', name: 'Khớp nối góc 90 độ ống luồn cứng PVC D25', unit: 'Cái', price: 5600 },
    { code: 'DN_VT_HOPCHIA_1NGA', name: 'Hộp chia 1 ngả liền đế tròn Sino D20', unit: 'Cái', price: 12500 },
    { code: 'DN_VT_HOPCHIA_2NGA', name: 'Hộp chia 2 ngả thẳng liền đế tròn Sino D20', unit: 'Cái', price: 14500 },
    { code: 'DN_VT_HOPCHIA_3NGA', name: 'Hộp chia 3 ngả chữ T liền đế tròn Sino D20', unit: 'Cái', price: 16500 },
    { code: 'DN_VT_HOPCHIA_4NGA', name: 'Hộp chia 4 ngả chữ thập liền đế tròn Sino D20', unit: 'Cái', price: 18500 },
    { code: 'DN_VT_KEPONG_D20', name: 'Kẹp giữ ống luồn cứng có nắp gài D20', unit: 'Cái', price: 2200 },
    { code: 'DN_VT_KEPONG_D25', name: 'Kẹp giữ ống luồn cứng có nắp gài D25', unit: 'Cái', price: 2900 },
    { code: 'DN_VT_LOTHET_EMT_20', name: 'Ống thép luồn dây ren mạ kẽm Smartube EMT D20 (Cây 3.05m)', unit: 'Cây', price: 145000 },
    { code: 'DN_VT_LOTHET_EMT_25', name: 'Ống thép luồn dây ren mạ kẽm Smartube EMT D25 (Cây 3.05m)', unit: 'Cây', price: 195000 },
  ];
  conduitList.forEach((c) => {
    items.push({
      id: `mat_dn_cnd_${idCounter++}`,
      code: c.code,
      name: c.name,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: c.unit,
      specification: `Phụ kiện ống luồn và kết nối hệ thống dây điện âm sàn / trần kỹ thuật`,
      location: 'Khu Vực Ống Luồn D1',
      initialStock: 80,
      minStock: 25,
      maxStock: 300,
      unitPrice: c.price,
      allocatedStaffEmails: [staff[3], staff[5]],
    });
  });

  // =========================================================================
  // PHÂN HỆ 2: THIẾT BỊ ĐIỆN & TRẠM TRUNG THẾ (~130 MÃ)
  // =========================================================================
  // 2.1 ACB Máy cắt không khí hạ thế (8 mã)
  const acbList = [
    { code: 'DN_CC_00ACB_01', name: 'Máy cắt không khí hạ thế ACB 3P 1600A 65kA Schneider Masterpact NW16 H1', price: 85000000 },
    { code: 'DN_CC_00ACB_02', name: 'Máy cắt không khí hạ thế ACB 3P 2000A 65kA Schneider Masterpact NW20 H1', price: 110000000 },
    { code: 'DN_CC_00ACB_03', name: 'Máy cắt không khí hạ thế ACB 3P 2500A 65kA Schneider Masterpact NW25 H1', price: 135000000 },
    { code: 'DN_CC_00ACB_04', name: 'Máy cắt không khí hạ thế ACB 3P 3200A 65kA Schneider Masterpact NW32 H1', price: 175000000 },
    { code: 'DN_CC_00ACB_05', name: 'Máy cắt không khí hạ thế ACB 4P 1600A 65kA Schneider Masterpact NW16 4P', price: 105000000 },
    { code: 'DN_CC_00ACB_06', name: 'Máy cắt không khí hạ thế ACB 4P 2000A 65kA Schneider Masterpact NW20 4P', price: 138000000 },
    { code: 'DN_CC_00ACB_07', name: 'Cuộn đóng / cuộn cắt Shunt Trip MX/XF 220VAC dùng cho ACB Schneider NW', price: 4800000 },
    { code: 'DN_CC_00ACB_08', name: 'Mô tơ nạp lò xo tự động Gear Motor MCH 220VAC dùng cho ACB Schneider NW', price: 12500000 },
  ];
  acbList.forEach((a) => {
    items.push({
      id: `mat_dn_acb_${idCounter++}`,
      code: a.code,
      name: a.name,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Bộ',
      specification: `Thiết bị đóng cắt tổng tủ MSB trạm biến áp nhà ga hàng không tiêu chuẩn IEC 60947-2`,
      location: 'Kho Thiết Bị Nặng E1',
      initialStock: 4,
      minStock: 1,
      maxStock: 10,
      unitPrice: a.price,
      allocatedStaffEmails: [staff[0], staff[1], staff[2]],
    });
  });

  // 2.2 MCCB Aptomat khối 3P Schneider Compact NSX/EZC (18 mã)
  const mccbRatings = [16, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000];
  mccbRatings.forEach((amp, idx) => {
    items.push({
      id: `mat_dn_mccb_${idCounter++}`,
      code: `DN_CC_MCCB3_${idx + 1}`,
      name: `Aptomat khối MCCB 3P ${amp}A 36kA Schneider Compact NSX/EZC`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Aptomat khối 3 pha định mức ${amp}A bảo vệ quá tải & ngắn mạch tủ phân phối tầng`,
      location: 'Kệ Aptomat Khối E2',
      initialStock: 10 + (idx % 5),
      minStock: 3,
      maxStock: 30,
      unitPrice: Math.round((1850000 + idx * 850000) / 1000) * 1000,
      allocatedStaffEmails: [staff[0], staff[3]],
    });
  });

  // 2.3 MCB Aptomat tép cài thanh Din 1P, 2P, 3P, 4P Acti9 Schneider (24 mã)
  const mcbPoles = [
    { pole: '1P', code: '1P', basePrice: 95000 },
    { pole: '2P', code: '2P', basePrice: 220000 },
    { pole: '3P', code: '3P', basePrice: 380000 },
    { pole: '4P', code: '4P', basePrice: 520000 },
  ];
  const mcbAmps = [6, 10, 16, 20, 25, 32];
  mcbPoles.forEach((p) => {
    mcbAmps.forEach((amp, aIdx) => {
      items.push({
        id: `mat_dn_mcb_${idCounter++}`,
        code: `DN_CC_MCB_${p.code}_${amp}A`,
        name: `Aptomat tép MCB ${p.pole} ${amp}A 6kA Schneider Acti9 iK60N`,
        category: 'Thiết bị Điện & Trạm trung thế',
        unit: 'Cái',
        specification: `Aptomat tép bảo vệ nhánh chiếu sáng, ổ cắm tiêu chuẩn IEC 60898-1`,
        location: 'Kệ Aptomat Tép E3',
        initialStock: 30 + aIdx * 5,
        minStock: 10,
        maxStock: 100,
        unitPrice: Math.round((p.basePrice + aIdx * 18000) / 1000) * 1000,
        allocatedStaffEmails: [staff[2], staff[4]],
      });
    });
  });

  // 2.4 RCBO Aptomat chống giật & chống dòng rò 30mA (8 mã)
  [16, 20, 25, 32, 40, 50, 63, 100].forEach((rcAmp, idx) => {
    items.push({
      id: `mat_dn_rcbo_${idCounter++}`,
      code: `DN_CC_RCBO_${rcAmp}A`,
      name: `Aptomat chống rò RCBO 2P ${rcAmp}A 30mA Schneider Acti9 iC60H2`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Thiết bị bảo vệ chống dòng rò bảo vệ an toàn tính mạng con người 30mA 10kA`,
      location: 'Kệ Aptomat Tép E4',
      initialStock: 18 + idx * 2,
      minStock: 6,
      maxStock: 60,
      unitPrice: Math.round((580000 + idx * 85000) / 1000) * 1000,
      allocatedStaffEmails: [staff[1], staff[5]],
    });
  });

  // 2.5 Khởi động từ Contactor & Rơ le nhiệt Schneider TeSys D (20 mã)
  const contactorAmps = [9, 12, 18, 25, 32, 38, 40, 50, 65, 80];
  contactorAmps.forEach((cAmp, idx) => {
    items.push({
      id: `mat_dn_ct_${idCounter++}`,
      code: `DN_CC_CONTACTOR_${cAmp}A`,
      name: `Khởi động từ Contactor 3P ${cAmp}A 220VAC Schneider TeSys D LC1D${cAmp}`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Contactor đóng cắt động cơ quạt hút, máy bơm điều hòa trung tâm AHU/Chiller`,
      location: 'Kệ Khởi Động Từ E5',
      initialStock: 12 + (idx % 4),
      minStock: 4,
      maxStock: 40,
      unitPrice: Math.round((420000 + idx * 240000) / 1000) * 1000,
      allocatedStaffEmails: [staff[2], staff[3]],
    });
    items.push({
      id: `mat_dn_ovr_${idCounter++}`,
      code: `DN_CC_RELAY_${cAmp}A`,
      name: `Rơ le nhiệt bảo vệ quá tải Schneider TeSys LRD tương thích Contactor ${cAmp}A`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Rơ le bảo vệ quá tải động cơ 3 pha chỉnh dòng trip nhiệt`,
      location: 'Kệ Khởi Động Từ E5',
      initialStock: 10 + (idx % 3),
      minStock: 3,
      maxStock: 35,
      unitPrice: Math.round((350000 + idx * 190000) / 1000) * 1000,
      allocatedStaffEmails: [staff[2], staff[3]],
    });
  });

  // 2.6 Thiết bị đo lường, rơ le bảo vệ & phụ kiện tủ điện (25 mã)
  const panelAccessories = [
    { code: 'DN_DH_MFM38_01', name: 'Đồng hồ đa năng kỹ thuật số Selec MFM383A đo V/A/Hz/kW/Cosφ', unit: 'Bộ', price: 1650000 },
    { code: 'DN_DH_PM5350_02', name: 'Đồng hồ giám sát điện năng đa năng Schneider PM5350 Modbus RS485', unit: 'Bộ', price: 6800000 },
    { code: 'DN_TB_BIENDONG_100', name: 'Biến dòng hạ thế CT 100/5A Emic đúc Epoxy tròn class 0.5', unit: 'Cái', price: 185000 },
    { code: 'DN_TB_BIENDONG_200', name: 'Biến dòng hạ thế CT 200/5A Emic đúc Epoxy tròn class 0.5', unit: 'Cái', price: 215000 },
    { code: 'DN_TB_BIENDONG_400', name: 'Biến dòng hạ thế CT 400/5A Emic đúc Epoxy tròn class 0.5', unit: 'Cái', price: 265000 },
    { code: 'DN_TB_BIENDONG_800', name: 'Biến dòng hạ thế CT 800/5A Emic đúc Epoxy tròn class 0.5', unit: 'Cái', price: 345000 },
    { code: 'DN_TB_BIENDONG_1600', name: 'Biến dòng hạ thế CT 1600/5A Emic đúc Epoxy vuông class 0.5', unit: 'Cái', price: 580000 },
    { code: 'DN_TB_DENBAO_DO', name: 'Đèn báo pha LED phi 22mm 220VAC Schneider màu Đỏ', unit: 'Cái', price: 38000 },
    { code: 'DN_TB_DENBAO_VG', name: 'Đèn báo pha LED phi 22mm 220VAC Schneider màu Vàng', unit: 'Cái', price: 38000 },
    { code: 'DN_TB_DENBAO_XG', name: 'Đèn báo pha LED phi 22mm 220VAC Schneider màu Xanh lá', unit: 'Cái', price: 38000 },
    { code: 'DN_TB_NUTNHAN_START', name: 'Nút nhấn nhả có tiếp điểm 1NO phi 22mm Schneider màu Xanh lá (Start)', unit: 'Cái', price: 55000 },
    { code: 'DN_TB_NUTNHAN_STOP', name: 'Nút nhấn nhả có tiếp điểm 1NC phi 22mm Schneider màu Đỏ (Stop)', unit: 'Cái', price: 55000 },
    { code: 'DN_TB_NUTCAP_EMERGENCY', name: 'Nút nhấn dừng khẩn Emergency Stop tự giữ xoay mở phi 22mm', unit: 'Cái', price: 125000 },
    { code: 'DN_TB_CHUYENMACH_VOLT', name: 'Chuyển mạch Vôn kế 7 vị trí (OFF, RS, ST, TR, RN, SN, TN) Selec', unit: 'Cái', price: 145000 },
    { code: 'DN_TB_CHUYENMACH_AMPE', name: 'Chuyển mạch Ampe kế 4 vị trí (OFF, R, S, T) Selec', unit: 'Cái', price: 145000 },
    { code: 'DN_TB_ROLE_MY2N_220V', name: 'Rơ le kiếng trung gian 8 chân tròn Omron MY2N 220VAC + Đế cắm PYF08A', unit: 'Bộ', price: 95000 },
    { code: 'DN_TB_ROLE_MY4N_24V', name: 'Rơ le kiếng trung gian 14 chân dẹt Omron MY4N 24VDC + Đế cắm PYF14A', unit: 'Bộ', price: 115000 },
    { code: 'DN_TB_CAUCHISU_10X38', name: 'Ống cầu chì sứ công nghiệp 10x38mm gG 10A/16A/20A/32A Mersen', unit: 'Hộp', price: 140000 },
    { code: 'DN_TB_DECAUCHI_3P', name: 'Đế cài thanh ray cầu chì 3P 10x38mm có đèn báo đứt chì RT18-32', unit: 'Cái', price: 85000 },
    { code: 'DN_TB_TIMER_DH48S', name: 'Bộ rơ le thời gian kỹ thuật số Timer Omron DH48S-S 220VAC', unit: 'Bộ', price: 195000 },
    { code: 'DN_TB_PHAOBAOMUC_61F', name: 'Bộ điều khiển mực nước tự động Omron 61F-G-AP 220VAC (Bơm giếng/bể)', unit: 'Bộ', price: 780000 },
    { code: 'DN_TB_QUEBAOMUC_INOX', name: 'Bộ 3 que điện cực inox 304 đo mức nước bể ngầm L=1m Omron F03-01', unit: 'Bộ', price: 290000 },
    { code: 'DN_TB_CAUDAODAOCHIEU', name: 'Cầu dao đảo chiều tay gạt ATS tự động 3P 100A Socomec', unit: 'Cái', price: 3450000 },
    { code: 'DN_TB_CHONGSETVAN_LA', name: 'Chống sét van trung thế Cooper Ohio Brass 24kV 10kA Polymer', unit: 'Cái', price: 2850000 },
    { code: 'DN_TB_CAUCHITURHOI_FCO', name: 'Cầu chì tự rơi FCO trung thế 24kV 100A Polymer Tuấn Ân', unit: 'Bộ', price: 2150000 },
  ];
  panelAccessories.forEach((p) => {
    items.push({
      id: `mat_dn_pnl_${idCounter++}`,
      code: p.code,
      name: p.name,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: p.unit,
      specification: `Phụ kiện giám sát, đo lường & điều khiển tủ bảng điện nhà ga`,
      location: 'Kệ Thiết Bị Đo E6',
      initialStock: 20,
      minStock: 5,
      maxStock: 50,
      unitPrice: p.price,
      allocatedStaffEmails: [staff[0], staff[2], staff[3]],
    });
  });

  // =========================================================================
  // PHÂN HỆ 3: HỆ THỐNG CHIẾU SÁNG & ĐÈN CÔNG TRÌNH (~80 MÃ)
  // =========================================================================
  const lightingList = [
    // Downlight
    { code: 'DN_CS_DOWNL_09W_TRG', name: 'Đèn LED Downlight âm trần tròn Philips Marcasite 9W (Ánh sáng Trắng 6500K)', price: 145000 },
    { code: 'DN_CS_DOWNL_09W_VG', name: 'Đèn LED Downlight âm trần tròn Philips Marcasite 9W (Ánh sáng Vàng 3000K)', price: 145000 },
    { code: 'DN_CS_DOWNL_12W_TRG', name: 'Đèn LED Downlight âm trần tròn Philips Marcasite 12W (Ánh sáng Trắng 6500K)', price: 185000 },
    { code: 'DN_CS_DOWNL_12W_VG', name: 'Đèn LED Downlight âm trần tròn Philips Marcasite 12W (Ánh sáng Vàng 3000K)', price: 185000 },
    { code: 'DN_CS_DOWNL_16W_TRG', name: 'Đèn LED Downlight âm trần tròn Philips Marcasite 16W (Ánh sáng Trắng 6500K)', price: 245000 },
    { code: 'DN_CS_DOWNL_20W_TRG', name: 'Đèn LED Downlight âm trần cao cấp Philips GreenPerform 20W D200', price: 420000 },
    // Panel
    { code: 'DN_CS_PANEL_6060_36W', name: 'Đèn LED Panel tấm âm trần thạch cao 600x600mm 36W Philips RC048B', price: 480000 },
    { code: 'DN_CS_PANEL_6060_48W', name: 'Đèn LED Panel tấm âm trần thạch cao 600x600mm 48W Rạng Đông P06', price: 540000 },
    { code: 'DN_CS_PANEL_3012_40W', name: 'Đèn LED Panel tấm chữ nhật 300x1200mm 40W Philips RC048B', price: 620000 },
    // Highbay
    { code: 'DN_CS_HIGHBAY_100W', name: 'Đèn LED Highbay nhà vòm sảnh ga 100W Philips BY239P Lumileds IP65', price: 1650000 },
    { code: 'DN_CS_HIGHBAY_150W', name: 'Đèn LED Highbay nhà vòm sảnh ga 150W Philips BY239P Lumileds IP65', price: 2150000 },
    { code: 'DN_CS_HIGHBAY_200W', name: 'Đèn LED Highbay nhà vòm sảnh ga 200W Philips BY239P Lumileds IP65', price: 2850000 },
    // Pha sân đỗ
    { code: 'DN_CS_PHASANDO_200W', name: 'Đèn pha LED chiếu sáng sân đỗ máy bay 200W Philips Tango G3 BVP382 IP66', price: 3450000 },
    { code: 'DN_CS_PHASANDO_400W', name: 'Đèn pha LED chiếu sáng sân đỗ máy bay 400W Philips Tango G3 BVP383 IP66', price: 5800000 },
    { code: 'DN_CS_PHASANDO_1000W', name: 'Đèn pha LED cao áp chuyên dụng sân đỗ 1000W Philips ArenaVision IP66', price: 24500000 },
    // Exit & Emergency
    { code: 'DN_CS_EXIT_2MAT_PCCC', name: 'Đèn chỉ dẫn thoát nạn Exit LED 2 mặt Paragon PEXA13SW tự sạc 2h', price: 385000 },
    { code: 'DN_CS_EXIT_1MAT_PCCC', name: 'Đèn chỉ dẫn thoát nạn Exit LED 1 mặt Paragon PEXA13SW gắn tường', price: 345000 },
    { code: 'DN_CS_EMERGENCY_2MAT', name: 'Đèn chiếu sáng khẩn cấp sự cố mắt ếch Paragon PEMF3WA pin tự sạc 2 giờ', price: 425000 },
    { code: 'DN_CS_EXIT_AMTRAN', name: 'Đèn thoát hiểm Exit LED âm trần thạch cao cao cấp Kennging KT610', price: 560000 },
    // Tuýp & Máng
    { code: 'DN_CS_TUYP_T8_1M2_18W', name: 'Bóng đèn tuýp LED T8 1.2m 18W nhôm nhựa Philips Essential', price: 78000 },
    { code: 'DN_CS_TUYP_T8_0M6_09W', name: 'Bóng đèn tuýp LED T8 0.6m 9W nhôm nhựa Philips Essential', price: 58000 },
    { code: 'DN_CS_MANG_T8_DOKIEM', name: 'Máng đèn xương cá âm trần 3 bóng 1.2m chóa inox phản quang Paragon', price: 380000 },
    { code: 'DN_CS_MANG_T8_CHONGTHAM', name: 'Máng đèn chống thấm bụi nước IP65 2 bóng 1.2m Paragon PIFH236', price: 285000 },
    // Driver & Phụ kiện
    { code: 'DN_CS_DRIVER_PHILIPS_30W', name: 'Bộ nguồn chấn lưu Driver LED Philips CertaDrive 30W 700mA', price: 165000 },
    { code: 'DN_CS_DRIVER_PHILIPS_45W', name: 'Bộ nguồn chấn lưu Driver LED Philips CertaDrive 45W 1050mA', price: 215000 },
    { code: 'DN_CS_DRIVER_PHILIPS_60W', name: 'Bộ nguồn chấn lưu Driver LED Philips Xitanium 60W Dimmer 1-10V', price: 420000 },
    { code: 'DN_CS_CAMBIEN_PIR_360', name: 'Cảm biến hồng ngoại chuyển động PIR gắn trần 360 độ điều khiển đèn WC', price: 220000 },
    { code: 'DN_CS_TIMER_PANASONIC', name: 'Bộ công tắc hẹn giờ 24h cơ học Panasonic TB38809NE7 tự động bật tắt đèn sân vườn', price: 540000 },
  ];
  lightingList.forEach((l) => {
    items.push({
      id: `mat_dn_lt_${idCounter++}`,
      code: l.code,
      name: l.name,
      category: 'Hệ thống Chiếu sáng & Đèn công trình',
      unit: 'Bộ',
      specification: `Thiết bị chiếu sáng công cộng nhà ga quốc tế chuẩn năng lượng cao & tuổi thọ 50.000 giờ`,
      location: 'Kệ Đèn Chiếu Sáng F1',
      initialStock: 35,
      minStock: 10,
      maxStock: 120,
      unitPrice: l.price,
      allocatedStaffEmails: [staff[4], staff[6], staff[7]],
    });
  });

  // =========================================================================
  // PHÂN HỆ 4: VẬT TƯ ĐƯỜNG ỐNG & PHỤ KIỆN CẤP THOÁT NƯỚC (~140 MÃ)
  // =========================================================================
  // 4.1 Ống PPR hàn nhiệt Tiền Phong PN10 / PN16 / PN20 (18 mã)
  const pprDiameters = [20, 25, 32, 40, 50, 63, 75, 90, 110];
  pprDiameters.forEach((dia, idx) => {
    // PN10 nước lạnh
    items.push({
      id: `mat_dn_ppr10_${idCounter++}`,
      code: `DN_ONG_PPR10_D${dia}`,
      name: `Ống nhựa hàn nhiệt PPR Tiền Phong PN10 D${dia}mm (Cây 4m)`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cây',
      specification: `Ống cấp nước sạch sinh hoạt lạnh PPR Tiền Phong PN10 chịu áp 10 bar`,
      location: 'Khu Giá Đỡ Ống G1',
      initialStock: 40 + idx * 5,
      minStock: 15,
      maxStock: 150,
      unitPrice: Math.round((42000 + idx * 35000) / 1000) * 1000,
      allocatedStaffEmails: [staff[1], staff[8]],
    });
    // PN20 nước nóng
    items.push({
      id: `mat_dn_ppr20_${idCounter++}`,
      code: `DN_ONG_PPR20_D${dia}`,
      name: `Ống nhựa hàn nhiệt PPR Tiền Phong PN20 D${dia}mm chịu nhiệt (Cây 4m)`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cây',
      specification: `Ống cấp nước nóng năng lượng mặt trời / boiler PPR Tiền Phong PN20 chịu áp 20 bar 95°C`,
      location: 'Khu Giá Đỡ Ống G2',
      initialStock: 30 + idx * 4,
      minStock: 10,
      maxStock: 120,
      unitPrice: Math.round((68000 + idx * 48000) / 1000) * 1000,
      allocatedStaffEmails: [staff[1], staff[8]],
    });
  });

  // 4.2 Phụ kiện hàn nhiệt PPR Tiền Phong (40 mã)
  pprDiameters.forEach((dia, idx) => {
    // Cút 90
    items.push({
      id: `mat_dn_pprcut_${idCounter++}`,
      code: `DN_PK_PPR_CUT90_D${dia}`,
      name: `Cút 90 độ nhựa hàn nhiệt PPR Tiền Phong D${dia}mm`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Cút góc 90 độ hàn nhiệt đồng chất PPR Tiền Phong`,
      location: 'Kệ Phụ Kiện PPR H1',
      initialStock: 60 + idx * 10,
      minStock: 20,
      maxStock: 200,
      unitPrice: Math.round((6500 + idx * 12000) / 100) * 100,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
    // Tê đều
    items.push({
      id: `mat_dn_pprte_${idCounter++}`,
      code: `DN_PK_PPR_TE_D${dia}`,
      name: `Tê đều 3 ngả nhựa hàn nhiệt PPR Tiền Phong D${dia}mm`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Tê chia 3 nhánh đồng chất hàn nhiệt PPR Tiền Phong`,
      location: 'Kệ Phụ Kiện PPR H2',
      initialStock: 50 + idx * 8,
      minStock: 15,
      maxStock: 180,
      unitPrice: Math.round((8500 + idx * 16000) / 100) * 100,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
    // Măng sông
    items.push({
      id: `mat_dn_pprms_${idCounter++}`,
      code: `DN_PK_PPR_MS_D${dia}`,
      name: `Măng sông nối thẳng nhựa hàn nhiệt PPR Tiền Phong D${dia}mm`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Đầu nối thẳng 2 đầu hàn nhiệt PPR Tiền Phong`,
      location: 'Kệ Phụ Kiện PPR H3',
      initialStock: 70 + idx * 10,
      minStock: 25,
      maxStock: 250,
      unitPrice: Math.round((4500 + idx * 9500) / 100) * 100,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
  });

  // 4.3 Phụ kiện PPR ren đồng (Cút ren trong/ngoài, Tê ren, Rắc co đôi) (15 mã)
  const pprBrass = [
    { code: 'DN_PK_PPR_CUTRTI_20X12', name: 'Cút 90 ren trong bằng đồng thau PPR Tiền Phong D20 x 1/2"', price: 28000 },
    { code: 'DN_PK_PPR_CUTRTI_25X12', name: 'Cút 90 ren trong bằng đồng thau PPR Tiền Phong D25 x 1/2"', price: 34000 },
    { code: 'DN_PK_PPR_CUTRTI_25X34', name: 'Cút 90 ren trong bằng đồng thau PPR Tiền Phong D25 x 3/4"', price: 42000 },
    { code: 'DN_PK_PPR_CUTRTI_32X1', name: 'Cút 90 ren trong bằng đồng thau PPR Tiền Phong D32 x 1"', price: 68000 },
    { code: 'DN_PK_PPR_CUTRTN_20X12', name: 'Cút 90 ren ngoài bằng đồng thau PPR Tiền Phong D20 x 1/2"', price: 32000 },
    { code: 'DN_PK_PPR_CUTRTN_25X12', name: 'Cút 90 ren ngoài bằng đồng thau PPR Tiền Phong D25 x 1/2"', price: 38000 },
    { code: 'DN_PK_PPR_CUTRTN_25X34', name: 'Cút 90 ren ngoài bằng đồng thau PPR Tiền Phong D25 x 3/4"', price: 48000 },
    { code: 'DN_PK_PPR_TERTI_20X12', name: 'Tê đều ren trong bằng đồng thau PPR Tiền Phong D20 x 1/2"', price: 34000 },
    { code: 'DN_PK_PPR_TERTI_25X12', name: 'Tê đều ren trong bằng đồng thau PPR Tiền Phong D25 x 1/2"', price: 42000 },
    { code: 'DN_PK_PPR_RACCO_20', name: 'Rắc co đôi ren trong bằng đồng thau PPR Tiền Phong D20', price: 65000 },
    { code: 'DN_PK_PPR_RACCO_25', name: 'Rắc co đôi ren trong bằng đồng thau PPR Tiền Phong D25', price: 88000 },
    { code: 'DN_PK_PPR_RACCO_32', name: 'Rắc co đôi ren trong bằng đồng thau PPR Tiền Phong D32', price: 125000 },
    { code: 'DN_PK_PPR_RACCO_50', name: 'Rắc co đôi ren trong bằng đồng thau PPR Tiền Phong D50', price: 245000 },
    { code: 'DN_PK_PPR_VANBI_D20', name: 'Van bi rắc co nhựa hàn nhiệt PPR Tiền Phong D20', price: 78000 },
    { code: 'DN_PK_PPR_VANBI_D25', name: 'Van bi rắc co nhựa hàn nhiệt PPR Tiền Phong D25', price: 98000 },
  ];
  pprBrass.forEach((b) => {
    items.push({
      id: `mat_dn_pprb_${idCounter++}`,
      code: b.code,
      name: b.name,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Phụ kiện chuyển tiếp ren đồng thau đúc chất lượng cao chịu áp lực`,
      location: 'Kệ Phụ Kiện Đồng H4',
      initialStock: 45,
      minStock: 15,
      maxStock: 150,
      unitPrice: b.price,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
  });

  // 4.4 Ống uPVC thoát nước thải & Phụ kiện Tiền Phong (35 mã)
  const upvcList = [
    { code: 'DN_ONG_UPVC_D60_C2', name: 'Ống nhựa uPVC Tiền Phong thoát nước D60 C2 dày 2.0mm (Cây 4m)', price: 92000 },
    { code: 'DN_ONG_UPVC_D90_C2', name: 'Ống nhựa uPVC Tiền Phong thoát nước D90 C2 dày 2.9mm (Cây 4m)', price: 175000 },
    { code: 'DN_ONG_UPVC_D114_C2', name: 'Ống nhựa uPVC Tiền Phong thoát nước D114 C2 dày 3.2mm (Cây 4m)', price: 235000 },
    { code: 'DN_ONG_UPVC_D168_C2', name: 'Ống nhựa uPVC Tiền Phong thoát nước D168 C2 dày 4.5mm (Cây 4m)', price: 540000 },
    { code: 'DN_ONG_UPVC_D200_C2', name: 'Ống nhựa uPVC Tiền Phong thoát nước D200 C2 dày 4.9mm (Cây 4m)', price: 780000 },
    { code: 'DN_PK_UPVC_CO90_D60', name: 'Co vuông 90 độ uPVC Tiền Phong D60', price: 12000 },
    { code: 'DN_PK_UPVC_CO90_D90', name: 'Co vuông 90 độ uPVC Tiền Phong D90', price: 24000 },
    { code: 'DN_PK_UPVC_CO90_D114', name: 'Co vuông 90 độ uPVC Tiền Phong D114', price: 42000 },
    { code: 'DN_PK_UPVC_CO45_D60', name: 'Co lơi 45 độ uPVC Tiền Phong D60', price: 11000 },
    { code: 'DN_PK_UPVC_CO45_D90', name: 'Co lơi 45 độ uPVC Tiền Phong D90', price: 22000 },
    { code: 'DN_PK_UPVC_CO45_D114', name: 'Co lơi 45 độ uPVC Tiền Phong D114', price: 38000 },
    { code: 'DN_PK_UPVC_TE90_D90', name: 'Tê 90 độ uPVC Tiền Phong D90', price: 34000 },
    { code: 'DN_PK_UPVC_TE90_D114', name: 'Tê 90 độ uPVC Tiền Phong D114', price: 58000 },
    { code: 'DN_PK_UPVC_Y45_D90', name: 'Chữ Y 45 độ uPVC Tiền Phong D90', price: 42000 },
    { code: 'DN_PK_UPVC_Y45_D114', name: 'Chữ Y 45 độ uPVC Tiền Phong D114', price: 68000 },
    { code: 'DN_PK_UPVC_SIPHON_D90', name: 'Con thỏ Siphon chống mùi uPVC Tiền Phong D90', price: 65000 },
    { code: 'DN_PK_UPVC_SIPHON_D114', name: 'Con thỏ Siphon chống mùi uPVC Tiền Phong D114', price: 95000 },
    { code: 'DN_PK_KEO_DANGUPVC_1KG', name: 'Keo dán ống nhựa uPVC Tiền Phong lon 1kg chính hãng', price: 145000 },
    { code: 'DN_PK_KEO_DANGUPVC_500G', name: 'Keo dán ống nhựa uPVC Tiền Phong tuýp 500g', price: 85000 },
  ];
  upvcList.forEach((u) => {
    items.push({
      id: `mat_dn_upvc_${idCounter++}`,
      code: u.code,
      name: u.name,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: u.name.includes('Keo') ? 'Lon' : u.name.includes('Ống') ? 'Cây' : 'Cái',
      specification: `Hệ thống đường ống & phụ kiện thoát nước thải sinh hoạt và nước mưa`,
      location: 'Khu Ống uPVC Ngoài Trời G3',
      initialStock: 40,
      minStock: 15,
      maxStock: 150,
      unitPrice: u.price,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
  });

  // =========================================================================
  // PHÂN HỆ 5: THIẾT BỊ VỆ SINH & XỬ LÝ NƯỚC (~70 MÃ)
  // =========================================================================
  const sanitaryList = [
    { code: 'DN_VT_VOILA_01', name: 'Vòi chậu rửa cảm ứng TOTO TTLA102 + Hộp điều khiển & phụ kiện', unit: 'Bộ', price: 6800000 },
    { code: 'DN_VT_XIPHO_02', name: 'Xiphong thoát nước chậu Lavabo TOTO TVLF403', unit: 'Cái', price: 650000 },
    { code: 'DN_VT_VALTIEU_03', name: 'Bộ van xả tiểu nam cảm ứng âm tường TOTO USWN900', unit: 'Bộ', price: 5400000 },
    { code: 'DN_VT_VALGAT_04', name: 'Van xả gạt tiểu nam đồng mạ Crom TOTO TS402S', unit: 'Cái', price: 920000 },
    { code: 'DN_VT_VOIXIT_05', name: 'Vòi xịt vệ sinh inox 304 nguyên khối chống xoắn áp lực cao', unit: 'Bộ', price: 380000 },
    { code: 'DN_VT_PHAOC_06', name: 'Phao cơ ngắt nước thông minh Inox 304 phi 21/27 chống tràn', unit: 'Cái', price: 285000 },
    { code: 'DN_VT_PHAOC_34', name: 'Phao cơ ngắt nước thông minh Inox 304 phi 34 chống tràn', unit: 'Cái', price: 345000 },
    { code: 'DN_VT_PHAOC_49', name: 'Phao cơ ngắt nước thông minh Inox 304 phi 49 chống tràn', unit: 'Cái', price: 425000 },
    { code: 'DN_TB_BOMCHIM_07', name: 'Bơm chìm nước thải Tsurumi 50PU2.75 0.75kW 380V', unit: 'Cái', price: 12500000 },
    { code: 'DN_TB_BOMCHIM_15', name: 'Bơm chìm nước thải cánh cắt rác Tsurumi 80C21.5 1.5kW 380V', unit: 'Cái', price: 18500000 },
    { code: 'DN_TB_BOMTANG_08', name: 'Máy bơm tăng áp biến tần Wilo Helix V 1604-1 4kW', unit: 'Cái', price: 42000000 },
    { code: 'DN_TB_BOMEBARA_09', name: 'Máy bơm ly tâm trục ngang inox Ebara 3M 50-200/9.2 9.2kW', unit: 'Cái', price: 35000000 },
    { code: 'DN_TB_DONGHON_50', name: 'Đồng hồ đo lưu lượng nước sạch Woltman D50 cấp B mặt bích', unit: 'Cái', price: 5800000 },
    { code: 'DN_TB_DONGHON_80', name: 'Đồng hồ đo lưu lượng nước sạch Woltman D80 cấp B mặt bích', unit: 'Cái', price: 7800000 },
    { code: 'DN_TB_DONGHON_100', name: 'Đồng hồ đo lưu lượng nước sạch Woltman D100 cấp B mặt bích', unit: 'Cái', price: 10500000 },
    { code: 'DN_VT_LOCY_DN25', name: 'Lọc Y rác đồng nối ren Miha DN25 (Phi 34)', unit: 'Cái', price: 280000 },
    { code: 'DN_VT_LOCY_DN50', name: 'Lọc Y rác bằng gang mặt bích ShinYi DN50', unit: 'Cái', price: 950000 },
    { code: 'DN_VT_LOCY_DN80', name: 'Lọc Y rác bằng gang mặt bích ShinYi DN80', unit: 'Cái', price: 1450000 },
    { code: 'DN_VT_LOCY_DN100', name: 'Lọc Y rác bằng gang mặt bích ShinYi DN100', unit: 'Cái', price: 2150000 },
    { code: 'DN_VT_VANCONG_DN50', name: 'Van cổng ty chìm nắp chụp nêm cao su ShinYi DN50 PN16', unit: 'Cái', price: 1250000 },
    { code: 'DN_VT_VANCONG_DN80', name: 'Van cổng ty chìm nắp chụp nêm cao su ShinYi DN80 PN16', unit: 'Cái', price: 1850000 },
    { code: 'DN_VT_VANCONG_DN100', name: 'Van cổng ty chìm nắp chụp nêm cao su ShinYi DN100 PN16', unit: 'Cái', price: 2450000 },
    { code: 'DN_VT_VANBUOM_DN50', name: 'Van bướm tay gạt thân gang đĩa inox ShinYi DN50 PN16', unit: 'Cái', price: 780000 },
    { code: 'DN_VT_VANBUOM_DN80', name: 'Van bướm tay gạt thân gang đĩa inox ShinYi DN80 PN16', unit: 'Cái', price: 1150000 },
    { code: 'DN_VT_VANBUOM_DN100', name: 'Van bướm tay gạt thân gang đĩa inox ShinYi DN100 PN16', unit: 'Cái', price: 1450000 },
    { code: 'DN_VT_VAN1C_DN50', name: 'Van một chiều lá lật cánh đồng ShinYi DN50 mặt bích', unit: 'Cái', price: 1100000 },
    { code: 'DN_VT_VAN1C_DN80', name: 'Van một chiều lá lật cánh đồng ShinYi DN80 mặt bích', unit: 'Cái', price: 1650000 },
    { code: 'DN_VT_VANGIAMAP_DN50', name: 'Van giảm áp trực tiếp bằng đồng Farg Ý DN50 (Phi 60)', unit: 'Cái', price: 3850000 },
    { code: 'DN_VT_VANGIAMAP_DN80', name: 'Van giảm áp gián tiếp thủy lực ShinYi DN80 mặt bích', unit: 'Cái', price: 8500000 },
    { code: 'DN_VT_DAYCAP_40CM', name: 'Dây cấp nước inox mềm bọc lưới chịu áp dài 40cm', unit: 'Sợi', price: 75000 },
    { code: 'DN_VT_DAYCAP_60CM', name: 'Dây cấp nước inox mềm bọc lưới chịu áp dài 60cm', unit: 'Sợi', price: 85000 },
    { code: 'DN_VT_PHEUIN_120', name: 'Phễu thu sàn inox 304 đúc chống mùi 120x120 thoát D60/D90', unit: 'Cái', price: 210000 },
    { code: 'DN_VT_PHEUIN_150', name: 'Phễu thu sàn inox 304 đúc chống mùi 150x150 thoát D90/D114', unit: 'Cái', price: 290000 },
  ];
  sanitaryList.forEach((s) => {
    items.push({
      id: `mat_dn_san_${idCounter++}`,
      code: s.code,
      name: s.name,
      category: 'Thiết bị vệ sinh & Xử lý nước',
      unit: s.unit,
      specification: `Thiết bị vệ sinh nhà ga TOTO và cụm van bơm cấp thoát nước chuyên dụng`,
      location: 'Kho Thiết Bị Vệ Sinh L1',
      initialStock: 16,
      minStock: 5,
      maxStock: 50,
      unitPrice: s.price,
      allocatedStaffEmails: [staff[8], staff[9], staff[0]],
    });
  });

  // =========================================================================
  // PHÂN HỆ 6: DỤNG CỤ, CHỐNG SÉT & VẬT TƯ PHỤ THI CÔNG (~60 MÃ)
  // =========================================================================
  const hardwareList = [
    // Chống sét
    { code: 'DN_CS_KIMTHU_ESE15', name: 'Kim thu sét phát tia tiên đạo sớm Stormaster ESE 15 (Bán kính 51m)', unit: 'Bộ', price: 14500000 },
    { code: 'DN_CS_KIMTHU_ESE30', name: 'Kim thu sét phát tia tiên đạo sớm Stormaster ESE 30 (Bán kính 71m)', unit: 'Bộ', price: 18500000 },
    { code: 'DN_CS_KIMTHU_ESE50', name: 'Kim thu sét phát tia tiên đạo sớm Stormaster ESE 50 (Bán kính 95m)', unit: 'Bộ', price: 26500000 },
    { code: 'DN_CS_COCTIEPDIA_D16', name: 'Cọc tiếp địa đồng đỏ nguyên chất D16 dài 2.4m vát nhọn đầu', unit: 'Cây', price: 680000 },
    { code: 'DN_CS_COCTHEPBOCDONG', name: 'Cọc tiếp địa thép bọc đồng Ramratna Ấn Độ D16 dài 2.4m', unit: 'Cây', price: 285000 },
    { code: 'DN_CS_THUOCHANKUMWELL', name: 'Thuốc hàn hóa nhiệt Kumwell 90g/115g/150g kèm thuốc mồi', unit: 'Lọ', price: 75000 },
    { code: 'DN_CS_KHUONHAN_CHU_T', name: 'Khuôn hàn hóa nhiệt chữ T hàn cáp M70 vào cọc D16', unit: 'Cái', price: 1850000 },
    { code: 'DN_CS_KHUONHAN_CHUTHAP', name: 'Khuôn hàn hóa nhiệt chữ thập nối cáp M70 - M70', unit: 'Cái', price: 1950000 },
    { code: 'DN_CS_KEPTIEPDIA_CHUU', name: 'Kẹp tiếp địa bằng đồng chữ U kẹp cọc D16 vào cáp M70', unit: 'Cái', price: 65000 },
    { code: 'DN_CS_CAPDONGTRAN_M50', name: 'Cáp đồng trần tiếp địa Cadivi M50mm2 (Cuộn 100m)', unit: 'Mét', price: 95000 },
    { code: 'DN_CS_CAPDONGTRAN_M70', name: 'Cáp đồng trần tiếp địa Cadivi M70mm2 (Cuộn 100m)', unit: 'Mét', price: 135000 },
    { code: 'DN_CS_CAPDONGTRAN_M95', name: 'Cáp đồng trần tiếp địa Cadivi M95mm2 (Cuộn 100m)', unit: 'Mét', price: 185000 },
    { code: 'DN_CS_HOPKIEMTRA_TD', name: 'Hộp kiểm tra điện trở tiếp địa bằng đồng gắn âm tường có cầu đo', unit: 'Bộ', price: 680000 },
    // Dụng cụ đo
    { code: 'DN_TB_KYORITSU_4105A', name: 'Đồng hồ đo điện trở đất kỹ thuật số Kyoritsu 4105A chính hãng', unit: 'Bộ', price: 4850000 },
    { code: 'DN_TB_AMPEKIM_2002PA', name: 'Ampe kìm đo dòng AC/DC 2000A Kyoritsu 2002PA', unit: 'Bộ', price: 3450000 },
    { code: 'DN_TB_DONGHO_FLUKE17B', name: 'Đồng hồ vạn năng hiện số True RMS Fluke 17B+ chính hãng', unit: 'Bộ', price: 3850000 },
    { code: 'DN_TB_MAYHAN_PPR63', name: 'Máy hàn ống nhiệt PPR 20-63 công suất 800W Kapusi kèm 6 đầu hàn', unit: 'Bộ', price: 680000 },
    { code: 'DN_TB_MAYHAN_PPR110', name: 'Máy hàn ống nhiệt PPR 75-110 công suất 1500W chuyên dụng', unit: 'Bộ', price: 1850000 },
    // Kim khí & phụ liệu
    { code: 'DN_VT_ACETO_01', name: 'Acetone (cồn công nghiệp tẩy rửa tiếp điểm điện)', unit: 'Lít', price: 65000 },
    { code: 'DN_VT_RP7_02', name: 'Chai xịt bôi trơn chống rỉ sét và phục hồi tiếp điểm RP7 350g', unit: 'Chai', price: 95000 },
    { code: 'DN_VT_KEO_SIL_03', name: 'Keo Silicone Apollo A500 chống thấm đa năng (Trắng/Xám/Đen)', unit: 'Chai', price: 68000 },
    { code: 'DN_VT_BANGKEO_04', name: 'Băng keo cách điện Nano 10 yards chống cháy 600V (Cây 10 cuộn)', unit: 'Cây', price: 75000 },
    { code: 'DN_VT_BANGKEO_3M23', name: 'Băng keo tự dính cách điện cao thế 3M Scotch 23 chịu 69kV', unit: 'Cuộn', price: 165000 },
    { code: 'DN_VT_CAOSUNON_05', name: 'Băng keo cao su non quấn ren Tombo 9082 Malaysia', unit: 'Cuộn', price: 14000 },
    { code: 'DN_VT_TYREN_M8', name: 'Ty ren mạ kẽm ren suốt M8x2.0m', unit: 'Cây', price: 28000 },
    { code: 'DN_VT_TYREN_M10', name: 'Ty ren mạ kẽm ren suốt M10x2.0m', unit: 'Cây', price: 38000 },
    { code: 'DN_VT_TYREN_M12', name: 'Ty ren mạ kẽm ren suốt M12x2.0m', unit: 'Cây', price: 54000 },
    { code: 'DN_VT_NOREN_M8', name: 'Nối ty ren lục giác mạ kẽm M8x30', unit: 'Cái', price: 4200 },
    { code: 'DN_VT_NOREN_M10', name: 'Nối ty ren lục giác mạ kẽm M10x35', unit: 'Cái', price: 5800 },
    { code: 'DN_VT_TACKEDAN_M8', name: 'Tắc kê đạn sắt đóng trần bê tông M8 mạ kẽm', unit: 'Hộp', price: 110000 },
    { code: 'DN_VT_TACKEDAN_M10', name: 'Tắc kê đạn sắt đóng trần bê tông M10 mạ kẽm', unit: 'Hộp', price: 145000 },
    { code: 'DN_VT_KEPXAGO_01', name: 'Kẹp xà gồ HB2 kẹp dầm chữ I treo ty ren không cần khoan', unit: 'Cái', price: 16500 },
    { code: 'DN_VT_DAIK_OMEGA', name: 'Đai ôm ống Omega mạ kẽm D20 đến D110', unit: 'Cái', price: 4800 },
    { code: 'DN_VT_DAITREO_PPR', name: 'Đai treo quả bí có đệm cao su giảm chấn D25-D110', unit: 'Cái', price: 18500 },
    { code: 'DN_VT_DAYRUT_300', name: 'Dây rút nhựa nylon chịu lực 4x300mm màu đen chống UV (Bịch 250 sợi)', unit: 'Túi', price: 52000 },
    { code: 'DN_VT_DAYRUT_200', name: 'Dây rút nhựa nylon chịu lực 3.6x200mm (Bịch 500 sợi)', unit: 'Túi', price: 48000 },
  ];
  hardwareList.forEach((h) => {
    items.push({
      id: `mat_dn_hw_${idCounter++}`,
      code: h.code,
      name: h.name,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: h.unit,
      specification: `Dụng cụ kiểm định, hệ thống chống sét & kim khí thi công cơ điện`,
      location: 'Kệ Kim Khí M1',
      initialStock: 60,
      minStock: 20,
      maxStock: 250,
      unitPrice: h.price,
      allocatedStaffEmails: [staff[0], staff[1], staff[4]],
    });
  });

  return items;
}

export const RAW_MATERIALS_DATABASE_600: Material[] = generateComprehensiveCatalog();
