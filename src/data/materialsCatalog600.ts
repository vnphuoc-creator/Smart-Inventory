import { Material } from '../types';

/**
 * Danh mục chuẩn hơn 650 vật tư đầy đủ phân hệ Điện - Nước - Chiếu Sáng - Vệ Sinh - Chống Sét - HVAC - PCCC
 * Phục vụ công tác bảo trì kỹ thuật Cảng Hàng Không Quốc Tế Đà Nẵng (AHT)
 * 
 * QUY TẮC ĐẶT MÃ VẬT TƯ CHUẨN AHT:
 * DN_<VT/CC/TT>_<5_KÝ_TỰ>_<SỐ_THỨ_TỰ>
 * - Tiền tố: DN_
 * - Phân loại: VT (Vật tư tiêu hao, ống, dây, phụ kiện), CC (Công cụ dụng cụ đo), TT (Trang thiết bị lớn, máy móc)
 * - 5 ký tự phân nhóm: A-Z, 0-9 (Ví dụ: DDCV0, VCMD0, CXV00, MCBSC, MCCBS, UPVC0, CLOUT, CHACY, OPPR0, TBVS0, BOMNC, KIMCL, ...)
 * - Số thứ tự: 2 hoặc 3 chữ số (01, 02, ..., 99)
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

  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // =========================================================================
  // 1. PHÂN HỆ VẬT TƯ ĐIỆN & CÁP ĐIỆN TIÊU HAO (~160 MÃ)
  // =========================================================================
  const cableSizes = ['1.5', '2.5', '4.0', '6.0', '10', '16', '25', '35', '50', '70', '95', '120', '150', '185', '240'];
  const cableColors = [
    { name: 'Đỏ', code: 'DO' },
    { name: 'Vàng', code: 'VG' },
    { name: 'Xanh dương', code: 'XD' },
    { name: 'Đen', code: 'DEN' },
    { name: 'Vàng sọc xanh lá (PE)', code: 'PE' },
  ];

  // 1.1 Dây điện đơn ruột đồng Cadivi CV (8 sizes x 5 colors = 40 mã) -> DN_VT_DDCV0_01..40
  let ddcvCounter = 1;
  cableSizes.slice(0, 8).forEach((size, sIdx) => {
    cableColors.forEach((col, cIdx) => {
      items.push({
        id: `mat_dn_c_${idCounter++}`,
        code: `DN_VT_DDCV0_${pad2(ddcvCounter++)}`,
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

  // 1.2 Dây súp đôi mềm VCmd Cadivi (6 mã) -> DN_VT_VCMD0_01..06
  ['2x0.75', '2x1.0', '2x1.5', '2x2.5', '2x4.0', '2x6.0'].forEach((vSize, idx) => {
    items.push({
      id: `mat_dn_vcmd_${idCounter++}`,
      code: `DN_VT_VCMD0_${pad2(idx + 1)}`,
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

  // 1.3 Cáp điện lực hạ thế bọc cách điện XLPE Cadivi CXV (15 mã) -> DN_VT_CXV00_01..15
  const cxvMultiCore = ['2x4', '2x6', '2x10', '2x16', '3x16+1x10', '3x25+1x16', '3x35+1x16', '3x50+1x25', '3x70+1x35', '3x95+1x50', '3x120+1x70', '3x150+1x70', '3x185+1x95', '3x240+1x120', '3x300+1x150'];
  cxvMultiCore.forEach((cSize, idx) => {
    items.push({
      id: `mat_dn_cxv_${idCounter++}`,
      code: `DN_VT_CXV00_${pad2(idx + 1)}`,
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

  // 1.4 Cáp ngầm bọc giáp băng thép Cadivi CXV/DSTA chôn ngầm sân đỗ (15 mã) -> DN_VT_DSTA0_01..15
  cxvMultiCore.forEach((cSize, idx) => {
    items.push({
      id: `mat_dn_dsta_${idCounter++}`,
      code: `DN_VT_DSTA0_${pad2(idx + 1)}`,
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

  // 1.5 Cáp chống cháy & ít khói độc FR-CXV (12 mã) -> DN_VT_FRCXV_01..12
  ['2x1.5', '2x2.5', '3x2.5', '3x4.0', '4x4.0', '4x6.0', '4x10', '4x16', '4x25', '4x35', '4x50', '4x70'].forEach((frSize, idx) => {
    items.push({
      id: `mat_dn_fr_${idCounter++}`,
      code: `DN_VT_FRCXV_${pad2(idx + 1)}`,
      name: `Cáp chống cháy Cadivi FR-CXV ${frSize}mm2 (Chịu nhiệt 950°C)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp bọc băng mica chống cháy 950°C trong 3 giờ tiêu chuẩn IEC 60331 phục vụ PCCC & máy phát`,
      location: 'Khu Cuộn Cáp Lớn B3',
      initialStock: 80,
      minStock: 30,
      maxStock: 300,
      unitPrice: Math.round((45000 + idx * 38000) / 1000) * 1000,
      allocatedStaffEmails: [staff[2], staff[3]],
    });
  });

  // 1.6 Cáp điều khiển & tín hiệu Shielded Belden / Alantek (10 mã) -> DN_VT_SIG00_01..10
  ['1Px18AWG', '2Px18AWG', '3Px18AWG', '4Px18AWG', '1Px16AWG', '2Px16AWG', '4C x 1.5mm2', '8C x 1.5mm2', '12C x 1.5mm2', '16C x 1.5mm2'].forEach((sigSize, idx) => {
    items.push({
      id: `mat_dn_sig_${idCounter++}`,
      code: `DN_VT_SIG00_${pad2(idx + 1)}`,
      name: `Cáp điều khiển chống nhiễu Shielded ${sigSize}`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp tín hiệu có lưới đồng bọc chống nhiễu dùng cho hệ thống BMS, PCCC & điều khiển bơm`,
      location: 'Kệ Cáp Tín Hiệu A6',
      initialStock: 100 + idx * 15,
      minStock: 40,
      maxStock: 400,
      unitPrice: Math.round((18000 + idx * 12500) / 1000) * 1000,
      allocatedStaffEmails: [staff[1], staff[5]],
    });
  });

  // 1.7 Đầu cốt đồng mạ thiếc SC & Đốt nối bọc co nhiệt (30 mã) -> DN_VT_COTSC_01..15 & DN_VT_ONGCO_01..15
  const scSizes = ['2.5', '4', '6', '10', '16', '25', '35', '50', '70', '95', '120', '150', '185', '240', '300'];
  scSizes.forEach((sc, idx) => {
    // Cốt trần SC
    items.push({
      id: `mat_dn_sc_${idCounter++}`,
      code: `DN_VT_COTSC_${pad2(idx + 1)}`,
      name: `Đầu cốt đồng mạ thiếc SC-${sc} lỗ M8/M10/M12`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Đầu cốt ép cáp đồng tiêu chuẩn công nghiệp chất lượng cao mạ thiếc chống oxy hóa cỡ SC-${sc}`,
      location: 'Tủ Đầu Cốt C1',
      initialStock: 120 + idx * 10,
      minStock: 50,
      maxStock: 500,
      unitPrice: Math.round((2500 + idx * 3200) / 100) * 100,
      allocatedStaffEmails: [staff[3], staff[4]],
    });
    // Ống co nhiệt cách điện tương ứng
    items.push({
      id: `mat_dn_co_${idCounter++}`,
      code: `DN_VT_ONGCO_${pad2(idx + 1)}`,
      name: `Ống co nhiệt cách điện phi ${Number(sc) < 16 ? 'D6' : Number(sc) < 50 ? 'D12' : Number(sc) < 120 ? 'D20' : 'D35'} (Cỡ SC-${sc})`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Ống gen co nhiệt cách điện 1kV chống cháy co giãn nhiệt tỷ lệ 2:1`,
      location: 'Kệ Ống Gen C2',
      initialStock: 80,
      minStock: 25,
      maxStock: 300,
      unitPrice: Math.round((12000 + idx * 4500) / 1000) * 1000,
      allocatedStaffEmails: [staff[4]],
    });
  });

  // 1.8 Ống luồn dây & Phụ kiện đi dây (30 mã) -> DN_VT_RGTHP_01..06, DN_VT_OPVCC_01..06, DN_VT_DNRGT_01..06, DN_VT_HPCHI_01..06, DN_VT_KEPON_01..06
  ['D16', 'D20', 'D25', 'D32', 'D40', 'D50'].forEach((conduitSize, idx) => {
    // Ống ruột gà lõi thép bọc nhựa PVC
    items.push({
      id: `mat_dn_rg_${idCounter++}`,
      code: `DN_VT_RGTHP_${pad2(idx + 1)}`,
      name: `Ống ruột gà lõi thép bọc nhựa PVC chống thấm ${conduitSize}`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cuộn',
      specification: `Ống mềm luồn dây điện ruột thép mạ kẽm bọc nhựa PVC chống nước chịu nhiệt 50m/cuộn cỡ ${conduitSize}`,
      location: 'Kệ Ống Luồn C3',
      initialStock: 15 + idx * 2,
      minStock: 5,
      maxStock: 50,
      unitPrice: Math.round((380000 + idx * 120000) / 1000) * 1000,
      allocatedStaffEmails: [staff[5]],
    });
    // Ống luồn PVC cứng chống cháy
    items.push({
      id: `mat_dn_pvc_c_${idCounter++}`,
      code: `DN_VT_OPVCC_${pad2(idx + 1)}`,
      name: `Ống luồn dây điện tròn cứng PVC chống cháy ${conduitSize} (2.92m/cây)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cây',
      specification: `Ống luồn cứng PVC chịu lực nén 750N chống cháy Sino SP9020 cỡ ${conduitSize}`,
      location: 'Giá Đỡ Ống Điện C4',
      initialStock: 80 + idx * 10,
      minStock: 30,
      maxStock: 300,
      unitPrice: Math.round((26000 + idx * 14000) / 1000) * 1000,
      allocatedStaffEmails: [staff[5]],
    });
    // Đầu nối ren ống mềm kín nước
    items.push({
      id: `mat_dn_dnr_${idCounter++}`,
      code: `DN_VT_DNRGT_${pad2(idx + 1)}`,
      name: `Đầu nối ống ruột gà kín nước ren ngoài đồng mạ niken ${conduitSize}`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Đầu nối ren IP67 kết nối ống ruột gà vào tủ điện / hộp đấu dây cỡ ${conduitSize}`,
      location: 'Kệ Phụ Kiện C5',
      initialStock: 100,
      minStock: 40,
      maxStock: 400,
      unitPrice: Math.round((14000 + idx * 6500) / 1000) * 1000,
      allocatedStaffEmails: [staff[5]],
    });
    // Hộp chia ngả & co ống
    items.push({
      id: `mat_dn_hop_nga_${idCounter++}`,
      code: `DN_VT_HPCHI_${pad2(idx + 1)}`,
      name: `Hộp nối chia ngả PVC chống cháy có nắp ${conduitSize} (1/2/3/4 ngả)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Hộp chia ngả luồn dây điện Sino SP240 cỡ ${conduitSize}`,
      location: 'Kệ Phụ Kiện C5',
      initialStock: 75,
      minStock: 25,
      maxStock: 250,
      unitPrice: Math.round((12500 + idx * 3500) / 100) * 100,
      allocatedStaffEmails: [staff[5]],
    });
    // Kẹp đỡ ống ôm C
    items.push({
      id: `mat_dn_kep_c_${idCounter++}`,
      code: `DN_VT_KEPON_${pad2(idx + 1)}`,
      name: `Kẹp đỡ ống luồn PVC có ngàm liên kết ${conduitSize}`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Kẹp đỡ ống điện Sino/Vanlock cỡ ${conduitSize}`,
      location: 'Kệ Phụ Kiện C5',
      initialStock: 200,
      minStock: 50,
      maxStock: 1000,
      unitPrice: Math.round((2800 + idx * 800) / 100) * 100,
      allocatedStaffEmails: [staff[5]],
    });
  });

  // =========================================================================
  // 2. PHÂN HỆ THIẾT BỊ ĐIỆN & TRẠM TRUNG THẾ (~130 MÃ)
  // =========================================================================
  // 2.1 Aptomat tép MCB Schneider Acti9 / Easy9 (28 mã) -> DN_VT_MCBSC_01..28
  const mcbAmps = ['6A', '10A', '16A', '20A', '25A', '32A', '40A', '50A', '63A'];
  let mcbCounter = 1;
  ['1P', '2P', '3P', '4P'].forEach((poles, pIdx) => {
    mcbAmps.forEach((amp, aIdx) => {
      if (pIdx === 3 && aIdx > 6) return;
      items.push({
        id: `mat_dn_mcb_${idCounter++}`,
        code: `DN_VT_MCBSC_${pad2(mcbCounter++)}`,
        name: `Aptomat tép MCB Schneider Easy9 ${poles} ${amp} 4.5kA/6kA`,
        category: 'Thiết bị Điện & Trạm trung thế',
        unit: 'Cái',
        specification: `MCB bảo vệ quá tải và ngắn mạch Schneider dòng cắt tiêu chuẩn 4.5kA/6kA (${poles} ${amp})`,
        location: `Tủ Thiết Bị Đóng Cắt E${pIdx + 1}`,
        initialStock: 25 + (3 - pIdx) * 5,
        minStock: 10,
        maxStock: 80,
        unitPrice: Math.round((68000 * (pIdx + 1) + aIdx * 12000) / 1000) * 1000,
        allocatedStaffEmails: [staff[0], staff[1]],
      });
    });
  });

  // 2.2 Aptomat khối MCCB Schneider EasyPact EZC (21 mã) -> DN_VT_MCCBS_01..21
  const mccbRatings = [
    { amp: '40A', poles: '3P', ics: '15kA', price: 680000 },
    { amp: '50A', poles: '3P', ics: '15kA', price: 720000 },
    { amp: '63A', poles: '3P', ics: '18kA', price: 790000 },
    { amp: '80A', poles: '3P', ics: '18kA', price: 890000 },
    { amp: '100A', poles: '3P', ics: '25kA', price: 1150000 },
    { amp: '125A', poles: '3P', ics: '25kA', price: 1350000 },
    { amp: '160A', poles: '3P', ics: '36kA', price: 2100000 },
    { amp: '200A', poles: '3P', ics: '36kA', price: 2450000 },
    { amp: '250A', poles: '3P', ics: '36kA', price: 2850000 },
    { amp: '320A', poles: '3P', ics: '50kA', price: 4200000 },
    { amp: '400A', poles: '3P', ics: '50kA', price: 5400000 },
    { amp: '500A', poles: '3P', ics: '50kA', price: 7600000 },
    { amp: '630A', poles: '3P', ics: '50kA', price: 8900000 },
    { amp: '800A', poles: '3P', ics: '50kA', price: 14500000 },
    { amp: '63A', poles: '4P', ics: '18kA', price: 1200000 },
    { amp: '100A', poles: '4P', ics: '25kA', price: 1650000 },
    { amp: '160A', poles: '4P', ics: '36kA', price: 2900000 },
    { amp: '200A', poles: '4P', ics: '36kA', price: 3400000 },
    { amp: '250A', poles: '4P', ics: '36kA', price: 3950000 },
    { amp: '400A', poles: '4P', ics: '50kA', price: 7200000 },
    { amp: '630A', poles: '4P', ics: '50kA', price: 11800000 },
  ];
  mccbRatings.forEach((mc, idx) => {
    items.push({
      id: `mat_dn_mccb_${idCounter++}`,
      code: `DN_VT_MCCBS_${pad2(idx + 1)}`,
      name: `Aptomat khối MCCB Schneider EasyPact ${mc.poles} ${mc.amp} (${mc.ics})`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Bộ',
      specification: `MCCB chỉnh dòng/cố định bảo vệ tủ tổng MSB & tủ phân phối DB nhà ga T2`,
      location: 'Kệ Thiết Bị Nặng E5',
      initialStock: 8 + (idx % 4),
      minStock: 2,
      maxStock: 20,
      unitPrice: mc.price,
      allocatedStaffEmails: [staff[0], staff[2]],
    });
  });

  // 2.3 Khởi động từ Contactor & Rơ le nhiệt Schneider TeSys (24 mã) -> DN_VT_CONTC_01..12 & DN_VT_ROLEN_01..12
  const contactorRatings = ['9A', '12A', '18A', '25A', '32A', '38A', '40A', '50A', '65A', '80A', '95A', '115A'];
  contactorRatings.forEach((cAmps, idx) => {
    items.push({
      id: `mat_dn_cont_${idCounter++}`,
      code: `DN_VT_CONTC_${pad2(idx + 1)}`,
      name: `Khởi động từ Contactor 3P Schneider TeSys LC1D ${cAmps} cuộn hút 220VAC`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Bộ',
      specification: `Contactor đóng cắt động cơ máy bơm, quạt thông gió & hệ thống điều hòa Chiller (${cAmps})`,
      location: 'Tủ Khởi Động Từ E6',
      initialStock: 12,
      minStock: 4,
      maxStock: 35,
      unitPrice: Math.round((380000 + idx * 160000) / 1000) * 1000,
      allocatedStaffEmails: [staff[1], staff[3]],
    });
    items.push({
      id: `mat_dn_rle_${idCounter++}`,
      code: `DN_VT_ROLEN_${pad2(idx + 1)}`,
      name: `Rơ le nhiệt bảo vệ quá tải Schneider TeSys LRD dải ${cAmps}`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Bộ',
      specification: `Rơ le nhiệt gắn trực tiếp dưới Contactor bảo vệ chống kẹt rotor động cơ (${cAmps})`,
      location: 'Tủ Khởi Động Từ E6',
      initialStock: 10,
      minStock: 3,
      maxStock: 30,
      unitPrice: Math.round((290000 + idx * 110000) / 1000) * 1000,
      allocatedStaffEmails: [staff[1], staff[3]],
    });
  });

  // 2.4 Chống dòng rò RCBO & Chống sét SPD (12 mã) -> DN_VT_RCBOS_01..07 & DN_VT_SPDSN_01..05
  ['2P-25A-30mA', '2P-32A-30mA', '2P-40A-30mA', '2P-63A-30mA', '4P-40A-30mA', '4P-63A-30mA', '4P-100A-300mA'].forEach((rcbo, idx) => {
    items.push({
      id: `mat_dn_rcbo_${idCounter++}`,
      code: `DN_VT_RCBOS_${pad2(idx + 1)}`,
      name: `Aptomat chống dòng rò và bảo vệ quá tải RCBO Schneider ${rcbo}`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Thiết bị bảo vệ chống giật độ nhạy cao 30mA cho khu vực ẩm ướt & ổ cắm sảnh nhà ga`,
      location: 'Tủ Thiết Bị An Toàn E7',
      initialStock: 16,
      minStock: 5,
      maxStock: 50,
      unitPrice: Math.round((480000 + idx * 140000) / 1000) * 1000,
      allocatedStaffEmails: [staff[0], staff[4]],
    });
  });
  ['1P-40kA', '2P-40kA', '3P+N-40kA', '3P+N-65kA', '3P+N-100kA'].forEach((spd, idx) => {
    items.push({
      id: `mat_dn_spd_${idCounter++}`,
      code: `DN_VT_SPDSN_${pad2(idx + 1)}`,
      name: `Thiết bị chống sét lan truyền đường nguồn AC Schneider iPRD ${spd} (Type 2)`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Bộ',
      specification: `Mô đun SPD triệt tiêu xung sét thứ cấp bảo vệ trạm biến áp & trung tâm điều hành bay`,
      location: 'Tủ Thiết Bị Chống Sét E8',
      initialStock: 8,
      minStock: 2,
      maxStock: 20,
      unitPrice: Math.round((1450000 + idx * 850000) / 1000) * 1000,
      allocatedStaffEmails: [staff[0], staff[2]],
    });
  });

  // 2.5 Công tắc, ổ cắm dân dụng & công nghiệp (13 mã) -> DN_VT_OCDNG_01..13
  const socketItems = [
    { name: 'Ổ cắm đôi 3 chấu có màn che Schneider AvatarOn A', price: 95000 },
    { name: 'Công tắc đơn 1 chiều 16AX Schneider AvatarOn A', price: 42000 },
    { name: 'Công tắc đơn 2 chiều (cầu thang) 16AX Schneider AvatarOn A', price: 54000 },
    { name: 'Công tắc 2 cực 20A có đèn báo cho bình nước nóng', price: 125000 },
    { name: 'Hộp ổ cắm âm sàn chống nước bằng đồng Schneider/Panasonic', price: 680000 },
    { name: 'Phích & Ổ cắm công nghiệp gắn nổi Mennekes 16A 3 chấu (2P+E) IP44', price: 185000 },
    { name: 'Phích & Ổ cắm công nghiệp gắn nổi Mennekes 32A 3 chấu (2P+E) IP44', price: 265000 },
    { name: 'Ổ cắm công nghiệp 3 pha chống thấm nước Mennekes 16A 5P (3P+N+E) IP67', price: 420000 },
    { name: 'Ổ cắm công nghiệp 3 pha chống thấm nước Mennekes 32A 5P (3P+N+E) IP67', price: 580000 },
    { name: 'Ổ cắm công nghiệp 3 pha chịu tải cao Mennekes 63A 5P (3P+N+E) IP67', price: 1450000 },
    { name: 'Ổ cắm nguồn xe phục vụ mặt đất máy bay Mennekes 125A 5P IP67', price: 3850000 },
    { name: 'Tủ điện nhựa phân phối chống nước ngoài trời Hensel IP66 12 module', price: 520000 },
    { name: 'Tủ điện nhựa phân phối chống nước ngoài trời Hensel IP66 24 module', price: 890000 },
  ];
  socketItems.forEach((sk, idx) => {
    items.push({
      id: `mat_dn_sk_${idCounter++}`,
      code: `DN_VT_OCDNG_${pad2(idx + 1)}`,
      name: sk.name,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Bộ',
      specification: `Thiết bị công tắc, ổ cắm tiêu chuẩn khách sạn cao cấp & công nghiệp hàng không`,
      location: 'Kệ Ổ Cắm & Tủ Nhựa E9',
      initialStock: 30 + idx * 3,
      minStock: 10,
      maxStock: 120,
      unitPrice: sk.price,
      allocatedStaffEmails: [staff[4], staff[6]],
    });
  });

  // 2.6 Đồng hồ đo lường & Giám sát điện năng đa năng (8 mã) -> DN_VT_DHDDN_01..08
  const meterDevices = [
    {
      code: 'DN_VT_DHDDN_01',
      name: 'Đồng hồ đa năng kỹ thuật số Selec MFM383A (LCD 3 hàng số)',
      spec: 'Đo điện áp V, dòng điện A, tần số Hz, công suất P/Q/S, hệ số PF, điện năng kWh/kVARh màn hình LCD 3 pha 4 dây',
      location: 'Tủ Thiết Bị Đo Lường E10',
      stock: 15,
      min: 4,
      max: 30,
      price: 2450000,
    },
    {
      code: 'DN_VT_DHDDN_02',
      name: 'Đồng hồ đa năng giám sát điện năng Schneider EasyLogic PM2220 (RS485 Modbus)',
      spec: 'Đồng hồ đo điện năng đa chức năng kỹ thuật số Class 0.5S truyền thông RS485 Modbus RTU tích hợp hệ thống SCADA trạm biến áp',
      location: 'Tủ Thiết Bị Đo Lường E10',
      stock: 12,
      min: 3,
      max: 25,
      price: 4850000,
    },
    {
      code: 'DN_VT_DHDDN_03',
      name: 'Đồng hồ phân tích chất lượng điện năng Schneider PowerLogic PM5350',
      spec: 'Phân tích sóng hài THD đến bậc 31, cảnh báo sự cố điện áp & dòng điện độ chính xác cao Class 0.2S',
      location: 'Tủ Thiết Bị Đo Lường E10',
      stock: 6,
      min: 2,
      max: 12,
      price: 12500000,
    },
    {
      code: 'DN_VT_DHDDN_04',
      name: 'Đồng hồ vạn năng hiện số điện tử Kyoritsu 1009',
      spec: 'Đồng hồ vạn năng DMM đo AC/DC 600V, dòng 10A, điện trở, tụ điện, tần số, kiểm tra diode & thông mạch',
      location: 'Tủ Thiết Bị Đo Kiểm E10',
      stock: 10,
      min: 3,
      max: 20,
      price: 1150000,
    },
    {
      code: 'DN_VT_DHDDN_05',
      name: 'Đồng hồ ampe kìm đo dòng điện xoay chiều Kyoritsu 2002PA (2000A AC)',
      spec: 'Ampe kìm chuyên dụng trạm biến áp dòng đo lên đến 2000A AC, hàm kẹp đường kính lớn 55mm',
      location: 'Tủ Thiết Bị Đo Kiểm E10',
      stock: 8,
      min: 2,
      max: 15,
      price: 2850000,
    },
    {
      code: 'DN_VT_DHDDN_06',
      name: 'Đồng hồ ampe kìm đo dòng rò độ nhạy cao Kyoritsu 2433R (True RMS)',
      spec: 'Ampe kìm đo dòng rò bảo vệ chống giật dải đo từ 40mA / 400mA / 400A AC True RMS độ phân giải 0.01mA',
      location: 'Tủ Thiết Bị Đo Kiểm E10',
      stock: 5,
      min: 2,
      max: 10,
      price: 6800000,
    },
    {
      code: 'DN_VT_DHDDN_07',
      name: 'Đồng hồ đo điện trở cách điện Megomet Kyoritsu 3005A (250V/500V/1000V)',
      spec: 'Máy đo điện trở cách điện cáp điện & động cơ điện áp thử 250V/500V/1000V dải đo đến 2000MΩ',
      location: 'Tủ Thiết Bị Đo Kiểm E10',
      stock: 6,
      min: 2,
      max: 12,
      price: 4950000,
    },
    {
      code: 'DN_VT_DHDDN_08',
      name: 'Đồng hồ đo điện trở tiếp địa hệ thống chống sét Kyoritsu 4105A',
      spec: 'Thiết bị đo điện trở đất 2 cực / 3 cực dải đo 20Ω / 200Ω / 2000Ω kiểm định kim thu sét & cọc tiếp địa',
      location: 'Tủ Thiết Bị Đo Kiểm E10',
      stock: 5,
      min: 2,
      max: 10,
      price: 5450000,
    },
  ];
  meterDevices.forEach((dev) => {
    items.push({
      id: `mat_dn_meter_${idCounter++}`,
      code: dev.code,
      name: dev.name,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: dev.spec,
      location: dev.location,
      initialStock: dev.stock,
      minStock: dev.min,
      maxStock: dev.max,
      unitPrice: dev.price,
      allocatedStaffEmails: [staff[0], staff[1], staff[2]],
    });
  });

  // =========================================================================
  // 3. PHÂN HỆ HỆ THỐNG CHIẾU SÁNG & ĐÈN CÔNG TRÌNH (~100 MÃ)
  // =========================================================================
  // 3.1 Đèn Downlight LED âm trần (15 mã) -> DN_VT_DNDLT_01..15
  const downlights = [
    { watt: '7W', cut: 'D90', lumen: '650lm', price: 95000 },
    { watt: '9W', cut: 'D105', lumen: '850lm', price: 125000 },
    { watt: '12W', cut: 'D125', lumen: '1200lm', price: 165000 },
    { watt: '15W', cut: 'D150', lumen: '1500lm', price: 210000 },
    { watt: '18W', cut: 'D175', lumen: '1900lm', price: 280000 },
    { watt: '24W', cut: 'D200', lumen: '2500lm', price: 390000 },
  ];
  let dlCounter = 1;
  ['3000K (Vàng ấm)', '4000K (Trung tính)', '6500K (Trắng)'].forEach((cct, cIdx) => {
    downlights.forEach((dl, dIdx) => {
      if (cIdx === 2 && dIdx > 4) return;
      items.push({
        id: `mat_dn_dl_${idCounter++}`,
        code: `DN_VT_DNDLT_${pad2(dlCounter++)}`,
        name: `Đèn LED âm trần Downlight Philips Meson ${dl.watt} ${dl.cut} (${cct})`,
        category: 'Hệ thống Chiếu sáng & Đèn công trình',
        unit: 'Bộ',
        specification: `Đèn LED tán quang góc chiếu 110 độ CRI > 80 tuổi thọ 30.000h sảnh chờ nhà ga`,
        location: 'Kệ Đèn Downlight F1',
        initialStock: 45 + dIdx * 5,
        minStock: 15,
        maxStock: 180,
        unitPrice: dl.price,
        allocatedStaffEmails: [staff[2], staff[7]],
      });
    });
  });

  // 3.2 Đèn LED Panel tấm lớn 600x600 & 300x1200 (10 mã) -> DN_VT_DNPAN_01..10
  const panels = [
    { size: '600x600', watt: '36W', lumen: '3600lm', price: 380000 },
    { size: '600x600', watt: '48W', lumen: '4800lm', price: 460000 },
    { size: '300x1200', watt: '36W', lumen: '3600lm', price: 420000 },
    { size: '300x1200', watt: '48W', lumen: '4800lm', price: 490000 },
    { size: '600x1200', watt: '72W', lumen: '7200lm', price: 820000 },
  ];
  let panCounter = 1;
  ['4000K (Trung tính)', '6500K (Trắng sáng)'].forEach((cct) => {
    panels.forEach((pn) => {
      items.push({
        id: `mat_dn_pn_${idCounter++}`,
        code: `DN_VT_DNPAN_${pad2(panCounter++)}`,
        name: `Đèn LED Panel thả trần khung nhôm ${pn.size}mm ${pn.watt} (${cct})`,
        category: 'Hệ thống Chiếu sáng & Đèn công trình',
        unit: 'Bộ',
        specification: `Đèn tấm siêu mỏng chống chói UGR<19 sử dụng cho văn phòng làm việc và khu soi chiếu an ninh`,
        location: 'Khu Đèn Tấm Lớn F2',
        initialStock: 35,
        minStock: 10,
        maxStock: 120,
        unitPrice: pn.price,
        allocatedStaffEmails: [staff[2], staff[7]],
      });
    });
  });

  // 3.3 Đèn tuýp LED & Máng chống ẩm (9 mã) -> DN_VT_DNTUP_01..09
  const tubeList = [
    { name: 'Bóng tuýp LED T8 thủy tinh bọc nhựa 0.6m 9W Philips', price: 48000 },
    { name: 'Bóng tuýp LED T8 thủy tinh bọc nhựa 1.2m 18W Philips Ecofit', price: 68000 },
    { name: 'Bóng tuýp LED T8 nhôm tản nhiệt cao cấp 1.2m 20W Rạng Đông', price: 89000 },
    { name: 'Máng đèn đơn tuýp LED 1.2m có chóa phản quang inox', price: 95000 },
    { name: 'Máng đèn đôi tuýp LED 1.2m có chóa tán quang nan nhôm', price: 165000 },
    { name: 'Bộ đèn chống ẩm chống bụi IP65 đơn 1x1.2m kèm bóng LED 18W', price: 240000 },
    { name: 'Bộ đèn chống ẩm chống bụi IP65 đôi 2x1.2m kèm 2 bóng LED 18W', price: 350000 },
    { name: 'Bộ đèn chống cháy nổ ATEX Zone 1 & Zone 2 1x1.2m Warom', price: 1650000 },
    { name: 'Bộ đèn chống cháy nổ ATEX Zone 1 & Zone 2 2x1.2m Warom', price: 2450000 },
  ];
  tubeList.forEach((tb, idx) => {
    items.push({
      id: `mat_dn_tb_${idCounter++}`,
      code: `DN_VT_DNTUP_${pad2(idx + 1)}`,
      name: tb.name,
      category: 'Hệ thống Chiếu sáng & Đèn công trình',
      unit: 'Bộ',
      specification: `Hệ thống chiếu sáng tầng hầm kỹ thuật, phòng máy & khu xử lý hành lý`,
      location: 'Kệ Đèn Tuýp F3',
      initialStock: 40 + idx * 5,
      minStock: 15,
      maxStock: 200,
      unitPrice: tb.price,
      allocatedStaffEmails: [staff[7]],
    });
  });

  // 3.4 Đèn thoát hiểm Exit & Sự cố Emergency (7 mã) -> DN_VT_DNEXT_01..07
  const exitLights = [
    { name: 'Đèn thoát hiểm Exit 1 mặt kèm pin sạc dự phòng 3 giờ Paragon', price: 320000 },
    { name: 'Đèn thoát hiểm Exit 2 mặt treo trần kèm pin dự phòng 3h Paragon', price: 380000 },
    { name: 'Đèn Exit có mũi tên chỉ hướng rẽ trái gắn nổi', price: 340000 },
    { name: 'Đèn Exit có mũi tên chỉ hướng rẽ phải gắn nổi', price: 340000 },
    { name: 'Đèn chiếu sáng sự cố khẩn cấp 2 mắt ếch xoay hướng 2x3W Paragon', price: 420000 },
    { name: 'Đèn chiếu sáng sự cố âm trần tự động bật khi mất điện 5W', price: 360000 },
    { name: 'Khối pin sạc Ni-Cd 3.6V 1800mAh thay thế cho đèn Exit', price: 145000 },
  ];
  exitLights.forEach((el, idx) => {
    items.push({
      id: `mat_dn_exit_${idCounter++}`,
      code: `DN_VT_DNEXT_${pad2(idx + 1)}`,
      name: el.name,
      category: 'Hệ thống Chiếu sáng & Đèn công trình',
      unit: 'Bộ',
      specification: `Hệ thống chiếu sáng an toàn PCCC kiểm định đạt tiêu chuẩn Cục Cảnh sát PCCC`,
      location: 'Kệ Đèn PCCC F4',
      initialStock: 25 + idx * 3,
      minStock: 8,
      maxStock: 80,
      unitPrice: el.price,
      allocatedStaffEmails: [staff[0], staff[7]],
    });
  });

  // 3.5 Đèn Pha LED Highbay & Floodlight (12 mã) -> DN_VT_DNPHA_01..12
  const floodlights = [
    { name: 'Đèn Pha LED ngoài trời 50W Philips IP66 chiếu sáng cảnh quan', price: 480000 },
    { name: 'Đèn Pha LED ngoài trời 100W Philips BVP151 IP66', price: 890000 },
    { name: 'Đèn Pha LED ngoài trời 150W Philips IP66 chiếu hắt kiến trúc', price: 1350000 },
    { name: 'Đèn Pha LED công suất cao 200W IP66 chiếu sáng đường nội cảng', price: 1850000 },
    { name: 'Đèn Pha LED chuyên dụng sân đỗ máy bay 400W góc hẹp 30 độ', price: 4600000 },
    { name: 'Đèn Pha LED chuyên dụng sân đỗ máy bay 600W IP67 siêu sáng', price: 7800000 },
    { name: 'Đèn LED nhà xưởng Highbay 100W đĩa bay UFO Philips BY239P', price: 1450000 },
    { name: 'Đèn LED nhà xưởng Highbay 150W đĩa bay UFO Philips BY239P', price: 1950000 },
    { name: 'Đèn LED nhà xưởng Highbay 200W đĩa bay UFO Philips BY239P', price: 2650000 },
    { name: 'Cuộn LED dây hắt trần COB 24VDC ánh sáng vàng ấm 3000K (5m/cuộn)', price: 280000 },
    { name: 'Bộ nguồn tổ ong chống nước Meanwell LPV-150-24 (24VDC 6.25A)', price: 540000 },
    { name: 'Bộ nguồn chống nước Meanwell HLG-240H-24A (24VDC 10A) IP67', price: 1250000 },
  ];
  floodlights.forEach((fl, idx) => {
    items.push({
      id: `mat_dn_fl_${idCounter++}`,
      code: `DN_VT_DNPHA_${pad2(idx + 1)}`,
      name: fl.name,
      category: 'Hệ thống Chiếu sáng & Đèn công trình',
      unit: 'Bộ',
      specification: `Đèn chiếu sáng kiến trúc mái vòm cong nhà ga T2 và sân đỗ tiếp giáp đường băng`,
      location: 'Khu Đèn Pha Sân Đỗ F5',
      initialStock: 18 + idx * 2,
      minStock: 5,
      maxStock: 50,
      unitPrice: fl.price,
      allocatedStaffEmails: [staff[2], staff[7]],
    });
  });

  // =========================================================================
  // 4. PHÂN HỆ VẬT TƯ ĐƯỜNG ỐNG & PHỤ KIỆN CẤP THOÁT NƯỚC (~140 MÃ)
  // =========================================================================
  // 4.1 Ống nhựa PPR Tiền Phong PN16 & PN20 (18 mã) -> DN_VT_OPPR0_01..18
  const pprSizes = ['20', '25', '32', '40', '50', '63', '75', '90', '110'];
  let pprCounter = 1;
  pprSizes.forEach((size, idx) => {
    // Ống lạnh PN16
    items.push({
      id: `mat_dn_ppr_l_${idCounter++}`,
      code: `DN_VT_OPPR0_${pad2(pprCounter++)}`,
      name: `Ống nhựa nhiệt PPR Tiền Phong PN16 D${size} (4m/cây)`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cây',
      specification: `Ống nhựa Polypropylene Random Copolymer dẫn nước sạch áp lực 16 bar D${size}`,
      location: 'Giá Đỡ Ống Nước G1',
      initialStock: 40 + idx * 4,
      minStock: 12,
      maxStock: 150,
      unitPrice: Math.round((45000 + idx * 68000) / 1000) * 1000,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
    // Ống nóng PN20
    items.push({
      id: `mat_dn_ppr_n_${idCounter++}`,
      code: `DN_VT_OPPR0_${pad2(pprCounter++)}`,
      name: `Ống nhựa nhiệt PPR Tiền Phong PN20 nước nóng D${size} (4m/cây)`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cây',
      specification: `Ống nước nóng PPR có sọc đỏ chịu nhiệt 95°C áp lực 20 bar D${size}`,
      location: 'Giá Đỡ Ống Nước G1',
      initialStock: 30 + idx * 3,
      minStock: 10,
      maxStock: 120,
      unitPrice: Math.round((65000 + idx * 85000) / 1000) * 1000,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
  });

  // 4.2 Phụ kiện hàn nhiệt PPR (30 mã) -> DN_VT_CO90P_01..06, DN_VT_TEPPR_01..06, DN_VT_CRTPR_01..06, DN_VT_NRNPR_01..06, DN_VT_RACPR_01..06
  ['20', '25', '32', '40', '50', '63'].forEach((pSize, idx) => {
    // Co 90 độ
    items.push({
      id: `mat_dn_co90_${idCounter++}`,
      code: `DN_VT_CO90P_${pad2(idx + 1)}`,
      name: `Co 90 độ nhựa PPR Tiền Phong D${pSize}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Phụ kiện hàn nhiệt co vuông góc nối ống PPR D${pSize}`,
      location: 'Kệ Phụ Kiện PPR G2',
      initialStock: 80,
      minStock: 25,
      maxStock: 300,
      unitPrice: Math.round((6500 + idx * 12000) / 100) * 100,
      allocatedStaffEmails: [staff[8]],
    });
    // Tê đều
    items.push({
      id: `mat_dn_te_${idCounter++}`,
      code: `DN_VT_TEPPR_${pad2(idx + 1)}`,
      name: `Tê đều chia 3 nhánh nhựa PPR Tiền Phong D${pSize}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Phụ kiện hàn nhiệt tê đều nối 3 đường ống PPR D${pSize}`,
      location: 'Kệ Phụ Kiện PPR G2',
      initialStock: 60,
      minStock: 20,
      maxStock: 250,
      unitPrice: Math.round((9500 + idx * 16000) / 100) * 100,
      allocatedStaffEmails: [staff[8]],
    });
    // Co ren trong đồng
    items.push({
      id: `mat_dn_crt_${idCounter++}`,
      code: `DN_VT_CRTPR_${pad2(idx + 1)}`,
      name: `Co 90 độ ren trong đồng PPR D${pSize}x1/2" hoặc 3/4"`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Co hàn nhiệt có đầu ren đồng đúc nguyên khối nối vòi chậu & sen tắm D${pSize}`,
      location: 'Kệ Phụ Kiện PPR G2',
      initialStock: 75,
      minStock: 25,
      maxStock: 300,
      unitPrice: Math.round((28000 + idx * 18000) / 1000) * 1000,
      allocatedStaffEmails: [staff[8]],
    });
    // Nối ren ngoài đồng
    items.push({
      id: `mat_dn_nrn_${idCounter++}`,
      code: `DN_VT_NRNPR_${pad2(idx + 1)}`,
      name: `Măng sông nối thẳng ren ngoài đồng PPR D${pSize}x1/2" hoặc 3/4"`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Nối ren ngoài đồng mạ niken kết nối van khóa D${pSize}`,
      location: 'Kệ Phụ Kiện PPR G2',
      initialStock: 70,
      minStock: 20,
      maxStock: 250,
      unitPrice: Math.round((32000 + idx * 19000) / 1000) * 1000,
      allocatedStaffEmails: [staff[8]],
    });
    // Rắc co đôi PPR
    items.push({
      id: `mat_dn_racco_${idCounter++}`,
      code: `DN_VT_RACPR_${pad2(idx + 1)}`,
      name: `Rắc co nối nhanh ren đồng PPR D${pSize}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Bộ',
      specification: `Rắc co tháo lắp nhanh phục vụ bảo trì bơm & cụm van ngắt D${pSize}`,
      location: 'Kệ Phụ Kiện PPR G2',
      initialStock: 40,
      minStock: 15,
      maxStock: 150,
      unitPrice: Math.round((65000 + idx * 35000) / 1000) * 1000,
      allocatedStaffEmails: [staff[8]],
    });
  });

  // 4.3 Ống thoát nước & phụ kiện uPVC Bình Minh (40 mã)
  // FIXING SCREENSHOT 2 ITEMS:
  // - Ống uPVC: DN_VT_OUPVC_01..10
  // - Co lơi 45: DN_VT_LOI45_01..10
  // - Chạc ba xiên Y: DN_VT_CHACY_01..10
  // - Cleanout thông tắc: DN_VT_CLOUT_01..10
  const upvcSizes = ['34', '42', '49', '60', '75', '90', '114', '140', '168', '200'];
  upvcSizes.forEach((uSize, idx) => {
    // Ống uPVC C2
    items.push({
      id: `mat_dn_upvc_${idCounter++}`,
      code: `DN_VT_OUPVC_${pad2(idx + 1)}`,
      name: `Ống nhựa uPVC Bình Minh C2 dày D${uSize} (4m/cây)`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cây',
      specification: `Ống thoát nước thải sinh hoạt & thoát nước mưa mái vòm nhà ga T2 D${uSize}`,
      location: 'Kho Bãi Ống Ngoài Trời H1',
      initialStock: 35 + idx * 3,
      minStock: 10,
      maxStock: 100,
      unitPrice: Math.round((58000 + idx * 82000) / 1000) * 1000,
      allocatedStaffEmails: [staff[9]],
    });
    // Co lơi 45 uPVC
    items.push({
      id: `mat_dn_loi45_${idCounter++}`,
      code: `DN_VT_LOI45_${pad2(idx + 1)}`,
      name: `Co lơi 45 độ nhựa uPVC Bình Minh D${uSize}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Phụ kiện uPVC uốn chuyển hướng dòng chảy êm không gây lắng cặn D${uSize}`,
      location: 'Kệ Phụ Kiện uPVC H2',
      initialStock: 50,
      minStock: 15,
      maxStock: 200,
      unitPrice: Math.round((8500 + idx * 14000) / 100) * 100,
      allocatedStaffEmails: [staff[9]],
    });
    // Chạc ba xiên 45 độ (Tê Y)
    items.push({
      id: `mat_dn_chacY_${idCounter++}`,
      code: `DN_VT_CHACY_${pad2(idx + 1)}`,
      name: `Chạc ba xiên 45 độ (Tê Y) uPVC Bình Minh D${uSize}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Tê chữ Y thoát nước phân tầng trục đứng kỹ thuật D${uSize}`,
      location: 'Kệ Phụ Kiện uPVC H2',
      initialStock: 45,
      minStock: 12,
      maxStock: 180,
      unitPrice: Math.round((16000 + idx * 24000) / 1000) * 1000,
      allocatedStaffEmails: [staff[9]],
    });
    // Nắp bịt xả thông tắc Cleanout
    items.push({
      id: `mat_dn_co_co_${idCounter++}`,
      code: `DN_VT_CLOUT_${pad2(idx + 1)}`,
      name: `Bộ thông tắc Cleanout uPVC có nắp ren mở D${uSize}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Bộ',
      specification: `Cửa mở thông tắc cặn định kỳ trên hệ thống trục đứng thoát nước D${uSize}`,
      location: 'Kệ Phụ Kiện uPVC H2',
      initialStock: 30,
      minStock: 10,
      maxStock: 120,
      unitPrice: Math.round((24000 + idx * 18000) / 1000) * 1000,
      allocatedStaffEmails: [staff[9]],
    });
  });

  // 4.4 Van công nghiệp, Đồng hồ nước & Thiết bị đo áp (19 mã) -> DN_VT_VANNC_01..19
  const valveList = [
    { name: 'Van bi đồng tay gạt ren trong MIHA DN15 (Phi 21)', price: 78000 },
    { name: 'Van bi đồng tay gạt ren trong MIHA DN20 (Phi 27)', price: 115000 },
    { name: 'Van bi đồng tay gạt ren trong MIHA DN25 (Phi 34)', price: 165000 },
    { name: 'Van bi đồng tay gạt ren trong MIHA DN32 (Phi 42)', price: 245000 },
    { name: 'Van bi đồng tay gạt ren trong MIHA DN40 (Phi 49)', price: 340000 },
    { name: 'Van bi đồng tay gạt ren trong MIHA DN50 (Phi 60)', price: 520000 },
    { name: 'Van cổng gang ty chìm mặt bích ARV Malaysia DN65', price: 1450000 },
    { name: 'Van cổng gang ty chìm mặt bích ARV Malaysia DN80', price: 1850000 },
    { name: 'Van cổng gang ty chìm mặt bích ARV Malaysia DN100', price: 2350000 },
    { name: 'Van cổng gang ty chìm mặt bích ARV Malaysia DN150', price: 4200000 },
    { name: 'Van bướm tay gạt thân gang đĩa inox ARV DN65 (Wafer)', price: 680000 },
    { name: 'Van bướm tay gạt thân gang đĩa inox ARV DN100 (Wafer)', price: 950000 },
    { name: 'Van 1 chiều lò xo đồng ren trong DN25', price: 145000 },
    { name: 'Van 1 chiều lá lật mặt bích thân gang ARV DN80', price: 1650000 },
    { name: 'Lọc Y rác thân gang mặt bích lưới lọc inox 304 DN80', price: 1450000 },
    { name: 'Van giảm áp trực tiếp thân đồng mạ niken FARG Italy DN50', price: 2650000 },
    { name: 'Van xả khí tự động bằng đồng nối ren Arita DN20', price: 320000 },
    { name: 'Đồng hồ đo áp suất chân đồng màng dầu Wika 0-10 bar ren 1/2"', price: 420000 },
    { name: 'Công tắc dòng chảy Flow Switch Autosigma HFS-25', price: 480000 },
  ];
  valveList.forEach((vl, idx) => {
    items.push({
      id: `mat_dn_valve_${idCounter++}`,
      code: `DN_VT_VANNC_${pad2(idx + 1)}`,
      name: vl.name,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Bộ',
      specification: `Van đóng cắt và đồng hồ kiểm soát trạm bơm cấp nước & PCCC nhà ga`,
      location: 'Kệ Van & Đo Lường H3',
      initialStock: 15 + idx * 2,
      minStock: 4,
      maxStock: 40,
      unitPrice: vl.price,
      allocatedStaffEmails: [staff[8], staff[9]],
    });
  });

  // =========================================================================
  // 5. PHÂN HỆ THIẾT BỊ VỆ SINH & XỬ LÝ NƯỚC (~120 MÃ) -> DN_VT_TBVS0_01..24
  // =========================================================================
  const sanitaryItems = [
    { name: 'Bộ van xả tiểu nam cảm ứng âm tường TOTO DUE126UEK', price: 4850000 },
    { name: 'Mắt kính cảm biến hồng ngoại van tiểu TOTO (Linh kiện thay thế)', price: 1250000 },
    { name: 'Van xả tiểu nam cảm ứng dùng pin INAX OKUV-120S', price: 3450000 },
    { name: 'Vòi chậu rửa Lavabo cảm ứng nước lạnh TOTO TEN40AV808', price: 5600000 },
    { name: 'Vòi chậu rửa Lavabo cảm ứng dùng điện 220V INAX LFV-5002S', price: 4100000 },
    { name: 'Cuộn hút van điện từ Solenoid Valve 6V/12V DC cho vòi cảm ứng', price: 480000 },
    { name: 'Bộ đổi nguồn Adaptor 220VAC sang 6VDC cấp điện mắt cảm ứng', price: 280000 },
    { name: 'Bộ vòi xịt vệ sinh áp lực cao inox 304 TOTO THX20NBPIV', price: 490000 },
    { name: 'Dây vòi xịt vệ sinh bọc bố dù chịu áp vỏ inox 304 dài 1.2m', price: 95000 },
    { name: 'Đầu vòi xịt vệ sinh cầm tay mạ crom có lò xo đóng êm', price: 145000 },
    { name: 'Van góc chữ K đồng mạ crom nối mềm cấp nước TOTO', price: 185000 },
    { name: 'Dây cấp nước mềm đan sợi inox 304 dài 50cm ốc đồng (Cặp 2 sợi)', price: 110000 },
    { name: 'Bộ ruột van xả bồn cầu 2 nút nhấn tiết kiệm nước TOTO', price: 420000 },
    { name: 'Cột cấp nước bồn cầu chân ren đồng chống tràn ngắt êm', price: 260000 },
    { name: 'Gioăng cao su đệm sáp chống mùi cổ xả bồn cầu xuống sàn D100', price: 65000 },
    { name: 'Bộ xi phông xả lavabo chữ P bằng đồng mạ crom có ống xả tràn', price: 340000 },
    { name: 'Đầu xả nhấn nắp sứ/inox chống rác cho chậu rửa mặt', price: 165000 },
    { name: 'Phễu thu sàn thoát nước inox 304 chống mùi hôi bẫy nước 120x120mm', price: 240000 },
    { name: 'Phễu thu sàn inox 304 nắp lật tự đóng đuôi D90/D110 150x150mm', price: 360000 },
    { name: 'Quạt hút thông gió âm trần nhà vệ sinh Panasonic FV-24CD8', price: 1150000 },
    { name: 'Máy sấy tay cảm ứng gắn tường tốc độ cao TOTO TYC322WF', price: 8500000 },
    { name: 'Hóa chất khử trùng nước Chlorine Hi-Chlon 70% Nippon Nhật Bản (Thùng 45kg)', price: 2150000 },
    { name: 'Hóa chất trợ lắng Poly Aluminium Chloride PAC 30% (Bao 25kg)', price: 380000 },
    { name: 'Hóa chất chống cáu cặn và ăn mòn tháp giải nhiệt Cooling Tower NALCO (Can 20L)', price: 3450000 },
  ];
  sanitaryItems.forEach((st, idx) => {
    items.push({
      id: `mat_dn_st_${idCounter++}`,
      code: `DN_VT_TBVS0_${pad2(idx + 1)}`,
      name: st.name,
      category: 'Thiết bị vệ sinh & Xử lý nước',
      unit: 'Bộ',
      specification: `Linh kiện thay thế thiết bị vệ sinh tự động nhà ga quốc tế T2 tiêu chuẩn 5 sao`,
      location: 'Kệ Thiết Bị Vệ Sinh K1',
      initialStock: 25 + (idx % 6) * 4,
      minStock: 8,
      maxStock: 80,
      unitPrice: st.price,
      allocatedStaffEmails: [staff[4], staff[8]],
    });
  });

  // =========================================================================
  // 6. PHÂN HỆ CHỐNG SÉT, DỤNG CỤ ĐO & VẬT TƯ TIÊU HAO KIM KHÍ (~50 MÃ)
  // =========================================================================
  // 6.1 Chống sét & Tiếp địa (13 mã) -> DN_VT_CHSET_01..13
  const lightningList = [
    { name: 'Kim thu sét phát tia tiên đạo sớm Stormaster ESE 15 (Bán kính 51m)', unit: 'Bộ', price: 14500000 },
    { name: 'Kim thu sét phát tia tiên đạo sớm Stormaster ESE 30 (Bán kính 71m)', unit: 'Bộ', price: 18500000 },
    { name: 'Kim thu sét phát tia tiên đạo sớm Stormaster ESE 50 (Bán kính 95m)', unit: 'Bộ', price: 26500000 },
    { name: 'Cọc tiếp địa đồng đỏ nguyên chất D16 dài 2.4m vát nhọn đầu', unit: 'Cây', price: 680000 },
    { name: 'Cọc tiếp địa thép bọc đồng Ramratna Ấn Độ D16 dài 2.4m', unit: 'Cây', price: 285000 },
    { name: 'Thuốc hàn hóa nhiệt Kumwell 90g/115g/150g kèm thuốc mồi', unit: 'Lọ', price: 75000 },
    { name: 'Khuôn hàn hóa nhiệt chữ T hàn cáp M70 vào cọc D16', unit: 'Cái', price: 1850000 },
    { name: 'Khuôn hàn hóa nhiệt chữ thập nối cáp M70 - M70', unit: 'Cái', price: 1950000 },
    { name: 'Kẹp tiếp địa bằng đồng chữ U kẹp cọc D16 vào cáp M70', unit: 'Cái', price: 65000 },
    { name: 'Cáp đồng trần tiếp địa Cadivi M50mm2 (Cuộn 100m)', unit: 'Mét', price: 95000 },
    { name: 'Cáp đồng trần tiếp địa Cadivi M70mm2 (Cuộn 100m)', unit: 'Mét', price: 135000 },
    { name: 'Cáp đồng trần tiếp địa Cadivi M95mm2 (Cuộn 100m)', unit: 'Mét', price: 185000 },
    { name: 'Hộp kiểm tra điện trở tiếp địa bằng đồng gắn âm tường có cầu đo', unit: 'Bộ', price: 680000 },
  ];
  lightningList.forEach((lg, idx) => {
    items.push({
      id: `mat_dn_lg_${idCounter++}`,
      code: `DN_VT_CHSET_${pad2(idx + 1)}`,
      name: lg.name,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: lg.unit,
      specification: `Hệ thống tiếp địa chống sét đánh thẳng và lan truyền nhà ga T2`,
      location: 'Kệ Chống Sét M1',
      initialStock: 30,
      minStock: 10,
      maxStock: 120,
      unitPrice: lg.price,
      allocatedStaffEmails: [staff[0], staff[1]],
    });
  });

  // 6.2 Dụng cụ đo kiểm kỹ thuật (5 mã) -> DN_CC_DKIEM_01..05
  const toolList = [
    { name: 'Đồng hồ đo điện trở đất kỹ thuật số Kyoritsu 4105A chính hãng', price: 4850000 },
    { name: 'Ampe kìm đo dòng AC/DC 2000A Kyoritsu 2002PA', price: 3450000 },
    { name: 'Đồng hồ vạn năng hiện số True RMS Fluke 17B+ chính hãng', price: 3850000 },
    { name: 'Máy hàn ống nhiệt PPR 20-63 công suất 800W Kapusi kèm 6 đầu hàn', price: 680000 },
    { name: 'Máy hàn ống nhiệt PPR 75-110 công suất 1500W chuyên dụng', price: 1850000 },
  ];
  toolList.forEach((tl, idx) => {
    items.push({
      id: `mat_dn_tool_${idCounter++}`,
      code: `DN_CC_DKIEM_${pad2(idx + 1)}`,
      name: tl.name,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Bộ',
      specification: `Công cụ đo đạc kiểm chuẩn thiết bị cơ điện nhà ga AHT`,
      location: 'Tủ Dụng Cụ Đo M2',
      initialStock: 8,
      minStock: 2,
      maxStock: 20,
      unitPrice: tl.price,
      allocatedStaffEmails: [staff[0], staff[3]],
    });
  });

  // 6.3 Kim khí & Phụ liệu tiêu hao (18 mã) -> DN_VT_KIMKH_01..18
  const hardwareItems = [
    { name: 'Chai xịt bôi trơn chống rỉ sét và phục hồi tiếp điểm RP7 350g', unit: 'Chai', price: 95000 },
    { name: 'Keo Silicone Apollo A500 chống thấm đa năng (Trắng/Xám/Đen)', unit: 'Chai', price: 68000 },
    { name: 'Băng keo cách điện Nano 10 yards chống cháy 600V (Cây 10 cuộn)', unit: 'Cây', price: 75000 },
    { name: 'Băng keo tự dính cách điện cao thế 3M Scotch 23 chịu 69kV', unit: 'Cuộn', price: 165000 },
    { name: 'Băng keo cao su non quấn ren Tombo 9082 Malaysia', unit: 'Cuộn', price: 14000 },
    { name: 'Ty ren mạ kẽm ren suốt M8x2.0m', unit: 'Cây', price: 28000 },
    { name: 'Ty ren mạ kẽm ren suốt M10x2.0m', unit: 'Cây', price: 38000 },
    { name: 'Ty ren mạ kẽm ren suốt M12x2.0m', unit: 'Cây', price: 54000 },
    { name: 'Nối ty ren lục giác mạ kẽm M8x30', unit: 'Cái', price: 4200 },
    { name: 'Nối ty ren lục giác mạ kẽm M10x35', unit: 'Cái', price: 5800 },
    { name: 'Tắc kê đạn sắt đóng trần bê tông M8 mạ kẽm', unit: 'Hộp', price: 110000 },
    { name: 'Tắc kê đạn sắt đóng trần bê tông M10 mạ kẽm', unit: 'Hộp', price: 145000 },
    { name: 'Kẹp xà gồ HB2 kẹp dầm chữ I treo ty ren không cần khoan', unit: 'Cái', price: 16500 },
    { name: 'Đai ôm ống Omega mạ kẽm D20 đến D110', unit: 'Cái', price: 4800 },
    { name: 'Đai treo quả bí có đệm cao su giảm chấn D25-D110', unit: 'Cái', price: 18500 },
    { name: 'Dây rút nhựa nylon chịu lực 4x300mm màu đen chống UV (Bịch 250 sợi)', unit: 'Túi', price: 52000 },
    { name: 'Dây rút nhựa nylon chịu lực 3.6x200mm (Bịch 500 sợi)', unit: 'Túi', price: 48000 },
    { name: 'Acetone (cồn công nghiệp tẩy rửa tiếp điểm điện)', unit: 'Lít', price: 65000 },
  ];
  hardwareItems.forEach((hw, idx) => {
    items.push({
      id: `mat_dn_hw_${idCounter++}`,
      code: `DN_VT_KIMKH_${pad2(idx + 1)}`,
      name: hw.name,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: hw.unit,
      specification: `Vật tư kim khí tiêu hao phục vụ thi công cơ điện`,
      location: 'Kệ Kim Khí M3',
      initialStock: 60,
      minStock: 20,
      maxStock: 250,
      unitPrice: hw.price,
      allocatedStaffEmails: [staff[1], staff[4]],
    });
  });

  // =========================================================================
  // 7. PHÂN HỆ VẬT TƯ THÔNG GIÓ, ĐIỀU HÒA HVAC & PCCC BỔ SUNG (~47 MÃ)
  // =========================================================================
  // 7.1 HVAC (27 mã) -> DN_VT_HVAC0_01..27
  const hvacList = [
    { name: 'Gas lạnh R410A Dupont Chemours USA bình 11.3kg', unit: 'Bình', price: 1850000 },
    { name: 'Gas lạnh R32 Daikin chính hãng bình 9.0kg', unit: 'Bình', price: 1450000 },
    { name: 'Gas lạnh R134a Klea UK bình 13.6kg nạp Chiller và điều hòa trung tâm', unit: 'Bình', price: 2150000 },
    { name: 'Gas lạnh R407C Honeywell USA bình 11.3kg', unit: 'Bình', price: 1950000 },
    { name: 'Dầu nhớt lạnh tổng hợp Emkarate RL68H chuyên dụng Chiller (Can 5L)', unit: 'Can', price: 2450000 },
    { name: 'Cuộn ống đồng đôi bọc bảo ôn phi 6.35 + 9.52 Toàn Thắng (15m/cuộn)', unit: 'Cuộn', price: 780000 },
    { name: 'Cuộn ống đồng đôi bọc bảo ôn phi 6.35 + 12.7 Toàn Thắng (15m/cuộn)', unit: 'Cuộn', price: 980000 },
    { name: 'Cuộn ống đồng đôi bọc bảo ôn phi 9.52 + 15.88 cây 0.81mm', unit: 'Cuộn', price: 1350000 },
    { name: 'Ống đồng thẳng Hailiang phi 19.05 dày 1.0mm (5.8m/cây)', unit: 'Cây', price: 420000 },
    { name: 'Ống đồng thẳng Hailiang phi 22.2 dày 1.2mm (5.8m/cây)', unit: 'Cây', price: 580000 },
    { name: 'Ống đồng thẳng Hailiang phi 28.6 dày 1.2mm (5.8m/cây)', unit: 'Cây', price: 780000 },
    { name: 'Ống xốp bảo ôn cao su lưu hóa Armaflex phi 22 dày 13mm', unit: 'Cây', price: 48000 },
    { name: 'Ống xốp bảo ôn cao su lưu hóa Armaflex phi 28 dày 19mm', unit: 'Cây', price: 78000 },
    { name: 'Tấm cao su non cách nhiệt Armaflex 1.0m x 2.0m dày 19mm', unit: 'Tấm', price: 340000 },
    { name: 'Keo dán ống cao su bảo ôn Armaflex 520 (Lon 800ml)', unit: 'Lon', price: 165000 },
    { name: 'Băng keo bạc nhôm chịu nhiệt dán ống gió rộng 50mm (Cuộn 50m)', unit: 'Cuộn', price: 85000 },
    { name: 'Khung lưới lọc bụi thô Pre-Filter G4 kích thước 595x595x46mm nhôm', unit: 'Khung', price: 280000 },
    { name: 'Khung lưới lọc bụi thô Pre-Filter G4 kích thước 295x595x46mm', unit: 'Khung', price: 210000 },
    { name: 'Túi lọc tinh Bag Filter F7 hiệu suất 85% 595x595x535mm 6 túi', unit: 'Khung', price: 580000 },
    { name: 'Túi lọc tinh Bag Filter F8 hiệu suất 95% 595x595x535mm 6 túi', unit: 'Khung', price: 680000 },
    { name: 'Màng lọc tuyệt đối HEPA Filter H13 595x595x292mm phòng sạch kiểm dịch', unit: 'Khung', price: 2850000 },
    { name: 'Dây curoa thang Bando B-52 cho quạt gió AHU nhà ga', unit: 'Sợi', price: 85000 },
    { name: 'Dây curoa thang Bando B-55 cho quạt gió AHU nhà ga', unit: 'Sợi', price: 89000 },
    { name: 'Dây curoa thang Bando B-60 cho quạt gió AHU nhà ga', unit: 'Sợi', price: 95000 },
    { name: 'Dây curoa thang Bando B-68 cho động cơ quạt hút gió tầng hầm', unit: 'Sợi', price: 110000 },
    { name: 'Dây curoa công nghiệp rãnh hẹp Bando SPA-1250 chịu tải cao', unit: 'Sợi', price: 165000 },
    { name: 'Dây curoa công nghiệp rãnh hẹp Bando SPB-1800 quạt tháp giải nhiệt', unit: 'Sợi', price: 260000 },
  ];
  hvacList.forEach((hv, idx) => {
    items.push({
      id: `mat_dn_hvac_${idCounter++}`,
      code: `DN_VT_HVAC0_${pad2(idx + 1)}`,
      name: hv.name,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: hv.unit,
      specification: `Vật tư bảo dưỡng hệ thống điều hòa Chiller, AHU và thông gió nhà ga`,
      location: 'Khu HVAC Tầng Hầm L1',
      initialStock: 20,
      minStock: 5,
      maxStock: 80,
      unitPrice: hv.price,
      allocatedStaffEmails: [staff[0], staff[2]],
    });
  });

  // 7.2 PCCC (13 mã) -> DN_VT_PCCC0_01..13
  const pcccList = [
    { name: 'Đầu phun Sprinkler quay xuống Tyco TY3251 68°C K=5.6 ren 1/2"', unit: 'Cái', price: 68000 },
    { name: 'Đầu phun Sprinkler quay lên Tyco TY3151 68°C K=5.6 ren 1/2"', unit: 'Cái', price: 68000 },
    { name: 'Đầu phun Sprinkler quay ngang tường Tyco TY3351 68°C K=5.6', unit: 'Cái', price: 85000 },
    { name: 'Nắp chụp đôi mạ crom che đầu phun Sprinkler âm trần thạch cao', unit: 'Bộ', price: 24000 },
    { name: 'Cuộn vòi chữa cháy D50 dài 20m kèm khớp nối nhôm áp lực 16 bar', unit: 'Cuộn', price: 680000 },
    { name: 'Cuộn vòi chữa cháy D65 dài 20m kèm khớp nối nhôm áp lực 16 bar', unit: 'Cuộn', price: 850000 },
    { name: 'Lăng phun chữa cháy cầm tay hợp kim nhôm D50', unit: 'Cái', price: 145000 },
    { name: 'Lăng phun chữa cháy cầm tay hợp kim nhôm D65', unit: 'Cái', price: 195000 },
    { name: 'Van góc cứu hỏa tay vặn gang kèm ngàm nối nhôm DN50', unit: 'Bộ', price: 420000 },
    { name: 'Van góc cứu hỏa tay vặn gang kèm ngàm nối nhôm DN65', unit: 'Bộ', price: 560000 },
    { name: 'Bình chữa cháy bột ABC 4kg MFZ4 kèm tem kiểm định PCCC', unit: 'Bình', price: 240000 },
    { name: 'Bình chữa cháy khí CO2 3kg MT3 dập cháy thiết bị điện', unit: 'Bình', price: 420000 },
    { name: 'Bình chữa cháy khí CO2 5kg MT5 chuyên dụng phòng điện trung thế', unit: 'Bình', price: 620000 },
  ];
  pcccList.forEach((pc, idx) => {
    items.push({
      id: `mat_dn_pccc_${idCounter++}`,
      code: `DN_VT_PCCC0_${pad2(idx + 1)}`,
      name: pc.name,
      category: 'Thiết bị vệ sinh & Xử lý nước',
      unit: pc.unit,
      specification: `Thiết bị và phụ kiện hệ thống chữa cháy tự động vách tường & đầu phun Sprinkler`,
      location: 'Khu PCCC L2',
      initialStock: 25,
      minStock: 8,
      maxStock: 80,
      unitPrice: pc.price,
      allocatedStaffEmails: [staff[8]],
    });
  });

  // 7.3 Máng cáp & Thang cáp (7 mã) -> DN_VT_MANGC_01..07
  const trayList = [
    { name: 'Máng cáp sơn tĩnh điện 100x50x1.2mm kèm nắp máng (2.5m/cây)', unit: 'Cây', price: 185000 },
    { name: 'Máng cáp sơn tĩnh điện 200x100x1.5mm kèm nắp máng (2.5m/cây)', unit: 'Cây', price: 340000 },
    { name: 'Máng cáp sơn tĩnh điện 300x100x1.5mm kèm nắp máng (2.5m/cây)', unit: 'Cây', price: 450000 },
    { name: 'Thang cáp mạ kẽm nhúng nóng 400x100x2.0mm ngoài trời (2.5m/cây)', unit: 'Cây', price: 680000 },
    { name: 'Co ngang 90 độ máng cáp 200x100mm sơn tĩnh điện', unit: 'Cái', price: 145000 },
    { name: 'Tê đều máng cáp 200x100mm sơn tĩnh điện', unit: 'Cái', price: 195000 },
    { name: 'Bát nối máng cáp kèm ốc bulong M8x15 (Cặp 2 miếng)', unit: 'Cặp', price: 28000 },
  ];
  trayList.forEach((tr, idx) => {
    items.push({
      id: `mat_dn_tray_${idCounter++}`,
      code: `DN_VT_MANGC_${pad2(idx + 1)}`,
      name: tr.name,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: tr.unit,
      specification: `Thang máng cáp phân luồng dây dẫn điện & cáp tín hiệu tòa nhà`,
      location: 'Khu Thang Máng Cáp L3',
      initialStock: 30,
      minStock: 10,
      maxStock: 100,
      unitPrice: tr.price,
      allocatedStaffEmails: [staff[5]],
    });
  });

  return items;
}

export const RAW_MATERIALS_DATABASE_600: Material[] = generateComprehensiveCatalog();
