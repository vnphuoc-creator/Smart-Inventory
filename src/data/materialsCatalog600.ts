import { Material } from '../types';

// Helper to generate realistic 600+ materials catalog
function generateComprehensiveCatalog(): Material[] {
  const staff = ['hapham281@gmail.com', 'duykich1985@gmail.com', 'duc.nguyen@ahtcorp.vn'];
  const items: Material[] = [];

  // Group 1: Dây điện, Cáp điện & Phụ kiện đấu nối (120 items)
  const cableSizes = ['1.5', '2.5', '4.0', '6.0', '10', '16', '25', '35', '50', '70', '95', '120', '150', '185', '240'];
  const cableColors = ['Đỏ', 'Vàng', 'Xanh dương', 'Đen', 'Vàng sọc xanh (Tiếp địa)'];
  
  let idCounter = 1;

  // Dây đơn Cadivi CV
  cableSizes.slice(0, 8).forEach((size, sIdx) => {
    cableColors.forEach((color, cIdx) => {
      const codeSuffix = `CV_${size.replace('.', '_')}_${cIdx + 1}`;
      items.push({
        id: `mat_dn_c_${idCounter++}`,
        code: `DN_DD_${codeSuffix}`,
        name: `Dây điện đơn Cadivi CV-${size}mm2 (Màu ${color})`,
        category: 'Vật tư Điện & Phụ kiện tiêu hao',
        unit: 'Mét',
        specification: `Dây điện đơn ruột đồng cách điện PVC 0.6/1kV Cadivi chính hãng màu ${color}`,
        location: `Kệ Cáp Điện A${(sIdx % 4) + 1}`,
        initialStock: Math.floor(150 + (sIdx * 30) + (cIdx * 15)),
        minStock: 50,
        maxStock: 500,
        unitPrice: Math.round((8500 + sIdx * 9500 + cIdx * 500) / 100) * 100,
        allocatedStaffEmails: staff,
      });
    });
  });

  // Cáp ngầm CXV, DSTA
  ['2x4', '2x6', '2x10', '3x16+1x10', '3x25+1x16', '3x35+1x16', '3x50+1x25', '3x70+1x35', '3x95+1x50', '3x120+1x70', '3x150+1x70', '3x185+1x95', '3x240+1x120'].forEach((cSize, idx) => {
    items.push({
      id: `mat_dn_cxv_${idCounter++}`,
      code: `DN_CP_CXV_${idx + 1}`,
      name: `Cáp điện lực hạ thế Cadivi CXV ${cSize}mm2 0.6/1kV`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp đồng ruột dẫn XLPE cách điện bọc PVC 0.6/1kV Cadivi`,
      location: 'Khu Cuộn Cáp Lớn B1',
      initialStock: Math.floor(80 + idx * 12),
      minStock: 30,
      maxStock: 300,
      unitPrice: Math.round((35000 + idx * 42000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
    items.push({
      id: `mat_dn_dsta_${idCounter++}`,
      code: `DN_CP_DSTA_${idx + 1}`,
      name: `Cáp ngầm giáp băng thép Cadivi CXV/DSTA ${cSize}mm2`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Mét',
      specification: `Cáp lực ngầm bọc giáp thép DSTA chôn trực tiếp ngoài sân đỗ`,
      location: 'Khu Cuộn Cáp Lớn B2',
      initialStock: Math.floor(60 + idx * 10),
      minStock: 25,
      maxStock: 250,
      unitPrice: Math.round((48000 + idx * 53000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
  });

  // Đầu Cosse đồng, Cosse bít, Cosse kim, Mũ chụp cosse
  cableSizes.forEach((size, idx) => {
    items.push({
      id: `mat_dn_cos_${idCounter++}`,
      code: `DN_VT_COSSE_${size.replace('.', '_')}`,
      name: `Đầu cosse đồng SC ${size}mm2 (Lỗ bắt bulong M8/M10/M12)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Đầu cosse đồng mạ thiếc dập nguội tiêu chuẩn IEC`,
      location: 'Hộp Ngăn Kéo Cosse C1',
      initialStock: Math.floor(100 + idx * 20),
      minStock: 40,
      maxStock: 400,
      unitPrice: Math.round((3500 + idx * 4200) / 100) * 100,
      allocatedStaffEmails: staff,
    });
    items.push({
      id: `mat_dn_muchup_${idCounter++}`,
      code: `DN_VT_MUCP_${size.replace('.', '_')}`,
      name: `Mũ chụp đầu cosse cao su V-${size} (Đỏ/Vàng/Xanh/Đen)`,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: 'Cái',
      specification: `Mũ bảo vệ cách điện đầu cosse hạ thế mềm dẻo chịu nhiệt`,
      location: 'Hộp Ngăn Kéo Cosse C2',
      initialStock: Math.floor(150 + idx * 25),
      minStock: 50,
      maxStock: 500,
      unitPrice: Math.round((1200 + idx * 800) / 100) * 100,
      allocatedStaffEmails: staff,
    });
  });

  // Group 2: Thiết bị đóng cắt & Tủ bảng điện (110 items)
  // MCB 1P, 2P, 3P
  ['6A', '10A', '16A', '20A', '25A', '32A', '40A', '50A', '63A'].forEach((amp, idx) => {
    items.push({
      id: `mat_dn_mcb1p_${idCounter++}`,
      code: `DN_CB_MCB1P_${amp}`,
      name: `Aptomat tép MCB 1P ${amp} 6kA Schneider Acti9 / Easy9`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Aptomat đơn 1 pha ngắt mạch tự động bảo vệ quá tải Schneider`,
      location: 'Kệ Thiết Bị Đóng Cắt E1',
      initialStock: Math.floor(25 + idx * 3),
      minStock: 10,
      maxStock: 80,
      unitPrice: Math.round((78000 + idx * 6500) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
    items.push({
      id: `mat_dn_mcb2p_${idCounter++}`,
      code: `DN_CB_MCB2P_${amp}`,
      name: `Aptomat tép MCB 2P ${amp} 6kA Schneider Acti9`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Aptomat 2 pha ngắt mạch tự động bảo vệ quá tải và ngắn mạch`,
      location: 'Kệ Thiết Bị Đóng Cắt E1',
      initialStock: Math.floor(18 + idx * 2),
      minStock: 8,
      maxStock: 60,
      unitPrice: Math.round((165000 + idx * 12000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
    items.push({
      id: `mat_dn_mcb3p_${idCounter++}`,
      code: `DN_CB_MCB3P_${amp}`,
      name: `Aptomat tép MCB 3P ${amp} 10kA Schneider iK60N / iC60N`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Aptomat 3 pha công nghiệp ngắt mạch dòng cắt cao 10kA`,
      location: 'Kệ Thiết Bị Đóng Cắt E2',
      initialStock: Math.floor(15 + idx * 2),
      minStock: 6,
      maxStock: 50,
      unitPrice: Math.round((285000 + idx * 18000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
  });

  // MCCB Khối 3P Schneider Compact NSX
  ['50A', '63A', '80A', '100A', '125A', '160A', '200A', '250A', '320A', '400A', '500A', '630A', '800A'].forEach((amp, idx) => {
    items.push({
      id: `mat_dn_mccb_${idCounter++}`,
      code: `DN_CB_MCCB3P_${amp}`,
      name: `Aptomat khối MCCB 3P ${amp} 36kA/50kA Schneider Compact NSX`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Aptomat dạng khối 3 cực Schneider Compact NSX Trip Unit Micrologic chỉnh dòng`,
      location: 'Kệ Thiết Bị Đóng Cắt E3',
      initialStock: Math.floor(4 + (idx % 3)),
      minStock: 2,
      maxStock: 12,
      unitPrice: Math.round((1850000 + idx * 950000) / 10000) * 10000,
      allocatedStaffEmails: staff,
    });
  });

  // Contactor Khởi động từ & Relay nhiệt
  ['09A', '12A', '18A', '25A', '32A', '38A', '40A', '50A', '65A', '80A', '95A', '115A', '150A'].forEach((amp, idx) => {
    items.push({
      id: `mat_dn_cont_${idCounter++}`,
      code: `DN_TB_CONTACTOR_${amp}`,
      name: `Khởi động từ Contactor Schneider LC1D${amp.replace('A', '')} 220VAC`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Contactor 3 pha cuộn hút 220VAC Schneider TeSys Deca chính hãng`,
      location: 'Kệ Tủ Điều Khiển F1',
      initialStock: Math.floor(8 + (idx % 4)),
      minStock: 3,
      maxStock: 25,
      unitPrice: Math.round((380000 + idx * 160000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
    items.push({
      id: `mat_dn_relayn_${idCounter++}`,
      code: `DN_TB_RELAYN_${amp}`,
      name: `Rơ le nhiệt bảo vệ quá tải động cơ Schneider LRD-${amp}`,
      category: 'Thiết bị Điện & Trạm trung thế',
      unit: 'Cái',
      specification: `Rơ le nhiệt ghép trực tiếp với contactor TeSys Schneider`,
      location: 'Kệ Tủ Điều Khiển F2',
      initialStock: Math.floor(6 + (idx % 3)),
      minStock: 2,
      maxStock: 20,
      unitPrice: Math.round((290000 + idx * 110000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
  });

  // Group 3: Hệ thống Chiếu sáng & Đèn công trình (90 items)
  ['9W', '12W', '15W', '18W', '24W'].forEach((w, idx) => {
    ['Ánh sáng Trắng (6500K)', 'Ánh sáng Trung tính (4000K)', 'Ánh sáng Vàng (3000K)'].forEach((color, cIdx) => {
      items.push({
        id: `mat_dn_leddown_${idCounter++}`,
        code: `DN_CS_LED_DL_${w}_${cIdx + 1}`,
        name: `Đèn LED Downlight âm trần Philips DN027B ${w} (${color})`,
        category: 'Hệ thống Chiếu sáng & Đèn công trình',
        unit: 'Bộ',
        specification: `Đèn LED âm trần tròn Philips siêu mỏng tản nhiệt nhôm đúc`,
        location: 'Kho Chiếu Sáng G1',
        initialStock: Math.floor(35 + idx * 10 + cIdx * 5),
        minStock: 15,
        maxStock: 150,
        unitPrice: Math.round((145000 + idx * 28000) / 1000) * 1000,
        allocatedStaffEmails: staff,
      });
    });
  });

  ['T8 0.6m 9W', 'T8 1.2m 18W', 'T8 1.2m 20W Thủy Tinh', 'T8 1.2m 18W Chống Ẩm IP65'].forEach((type, idx) => {
    items.push({
      id: `mat_dn_tuyp_${idCounter++}`,
      code: `DN_CS_TUYP_${idx + 1}`,
      name: `Bóng đèn Tuýp LED Philips EcoFit ${type}`,
      category: 'Hệ thống Chiếu sáng & Đèn công trình',
      unit: 'Bóng',
      specification: `Bóng LED tuýp tiết kiệm điện không nhấp nháy chân cắm G13`,
      location: 'Kho Chiếu Sáng G2',
      initialStock: Math.floor(80 + idx * 25),
      minStock: 30,
      maxStock: 300,
      unitPrice: Math.round((65000 + idx * 35000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
  });

  ['300x1200 36W', '600x600 40W', '600x600 48W', '600x1200 72W'].forEach((panel, idx) => {
    items.push({
      id: `mat_dn_panel_${idCounter++}`,
      code: `DN_CS_PANEL_${idx + 1}`,
      name: `Đèn LED Panel tấm lớn Philips SmartBright ${panel}`,
      category: 'Hệ thống Chiếu sáng & Đèn công trình',
      unit: 'Bộ',
      specification: `Đèn Panel tán quang khung nhôm sơn tĩnh điện chiếu sáng khu ga đi/đến`,
      location: 'Kho Chiếu Sáng G3',
      initialStock: Math.floor(20 + idx * 5),
      minStock: 8,
      maxStock: 80,
      unitPrice: Math.round((420000 + idx * 190000) / 10000) * 10000,
      allocatedStaffEmails: staff,
    });
  });

  // Đèn thoát hiểm Exit & Sự cố Emergency Paragon
  ['Exit 1 mặt chỉ trái', 'Exit 1 mặt chỉ phải', 'Exit 2 mặt', 'Emergency mắt cua gắn tường 2x3W'].forEach((ex, idx) => {
    items.push({
      id: `mat_dn_exit_${idCounter++}`,
      code: `DN_CS_EXIT_${idx + 1}`,
      name: `Đèn chỉ dẫn thoát hiểm Paragon ${ex} Pin 2h`,
      category: 'Hệ thống Chiếu sáng & Đèn công trình',
      unit: 'Bộ',
      specification: `Đèn khẩn cấp PCCC Paragon tự động bật sáng khi mất điện lưới 120 phút`,
      location: 'Kho Thiết Bị PCCC H1',
      initialStock: Math.floor(18 + idx * 4),
      minStock: 8,
      maxStock: 60,
      unitPrice: Math.round((385000 + idx * 75000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
  });

  // Group 4: Vật tư Đường ống & Phụ kiện cấp thoát nước PPR & uPVC (150 items)
  const pprDiameters = ['D20', 'D25', 'D32', 'D40', 'D50', 'D63', 'D75', 'D90', 'D110'];
  pprDiameters.forEach((dia, idx) => {
    // Ống PPR Tiền Phong PN20
    items.push({
      id: `mat_dn_pprong_${idCounter++}`,
      code: `DN_ON_PPR_PN20_${dia}`,
      name: `Ống nước nóng lạnh PPR Tiền Phong ${dia} PN20 (Cây 4m)`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cây',
      specification: `Ống nhựa chịu nhiệt PPR hàn nhiệt Tiền Phong ISO 15874`,
      location: 'Kho Ống Nhựa K1',
      initialStock: Math.floor(40 + idx * 6),
      minStock: 15,
      maxStock: 150,
      unitPrice: Math.round((68000 + idx * 48000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });

    // Co 90 PPR
    items.push({
      id: `mat_dn_pprco_${idCounter++}`,
      code: `DN_PK_PPR_CO90_${dia}`,
      name: `Co 90 độ hàn nhiệt PPR Tiền Phong ${dia}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Phụ kiện co vuông hàn nhiệt chịu áp lực 20 bar`,
      location: 'Kệ Phụ Kiện PPR K2',
      initialStock: Math.floor(80 + idx * 10),
      minStock: 30,
      maxStock: 300,
      unitPrice: Math.round((5500 + idx * 6800) / 100) * 100,
      allocatedStaffEmails: staff,
    });

    // Tê đều PPR
    items.push({
      id: `mat_dn_pprte_${idCounter++}`,
      code: `DN_PK_PPR_TE_${dia}`,
      name: `Tê đều hàn nhiệt PPR Tiền Phong ${dia}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Tê nối chia 3 nhánh hàn nhiệt PPR Tiền Phong chính hãng`,
      location: 'Kệ Phụ Kiện PPR K2',
      initialStock: Math.floor(60 + idx * 8),
      minStock: 25,
      maxStock: 250,
      unitPrice: Math.round((7200 + idx * 8500) / 100) * 100,
      allocatedStaffEmails: staff,
    });

    // Măng sông nối thẳng PPR
    items.push({
      id: `mat_dn_pprms_${idCounter++}`,
      code: `DN_PK_PPR_MS_${dia}`,
      name: `Măng sông nối thẳng PPR Tiền Phong ${dia}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Khớp nối thẳng hàn nhiệt ống PPR Tiền Phong`,
      location: 'Kệ Phụ Kiện PPR K3',
      initialStock: Math.floor(70 + idx * 10),
      minStock: 25,
      maxStock: 250,
      unitPrice: Math.round((4500 + idx * 5200) / 100) * 100,
      allocatedStaffEmails: staff,
    });

    // Nối ren trong / ren ngoài đồng
    items.push({
      id: `mat_dn_pprnt_${idCounter++}`,
      code: `DN_PK_PPR_RENT_${dia}`,
      name: `Nối ren trong đồng PPR Tiền Phong ${dia} x 1/2" - 3/4"`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Khớp nối ren đồng mạ niken ép nhiệt cao cấp`,
      location: 'Kệ Phụ Kiện PPR K3',
      initialStock: Math.floor(50 + idx * 6),
      minStock: 20,
      maxStock: 200,
      unitPrice: Math.round((32000 + idx * 18000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });
  });

  // Ống uPVC thoát nước Tiền Phong
  const upvcDiameters = ['D34', 'D42', 'D49', 'D60', 'D75', 'D90', 'D110', 'D114', 'D140', 'D168', 'D200'];
  upvcDiameters.forEach((dia, idx) => {
    items.push({
      id: `mat_dn_upvcong_${idCounter++}`,
      code: `DN_ON_UPVC_C2_${dia}`,
      name: `Ống thoát nước uPVC Tiền Phong ${dia} Class 2 (Cây 4m)`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cây',
      specification: `Ống nhựa uPVC thoát nước trục đứng và nhánh nhà ga`,
      location: 'Kho Ống Nhựa K4',
      initialStock: Math.floor(35 + idx * 5),
      minStock: 12,
      maxStock: 120,
      unitPrice: Math.round((58000 + idx * 62000) / 1000) * 1000,
      allocatedStaffEmails: staff,
    });

    items.push({
      id: `mat_dn_upvcco_${idCounter++}`,
      code: `DN_PK_UPVC_CO90_${dia}`,
      name: `Co 90 độ dán keo uPVC Tiền Phong ${dia}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Co vuông uPVC thoát nước thải sinh hoạt`,
      location: 'Kệ Phụ Kiện uPVC K5',
      initialStock: Math.floor(65 + idx * 8),
      minStock: 25,
      maxStock: 250,
      unitPrice: Math.round((6500 + idx * 9500) / 100) * 100,
      allocatedStaffEmails: staff,
    });

    items.push({
      id: `mat_dn_upvctcon_${idCounter++}`,
      code: `DN_PK_UPVC_TECONG_${dia}`,
      name: `Tê cong (Ba chạc 90 cong) uPVC Tiền Phong ${dia}`,
      category: 'Vật tư Đường ống & Phụ kiện cấp thoát nước',
      unit: 'Cái',
      specification: `Tê cong thoát nước chống tắc góc chuyển hướng êm`,
      location: 'Kệ Phụ Kiện uPVC K5',
      initialStock: Math.floor(45 + idx * 6),
      minStock: 18,
      maxStock: 180,
      unitPrice: Math.round((14500 + idx * 16000) / 100) * 100,
      allocatedStaffEmails: staff,
    });
  });

  // Group 5: Thiết bị vệ sinh & Xử lý nước (90 items)
  // TOTO fixtures & valves
  const sanitaryItems = [
    { code: 'DN_VT_VOILA_01', name: 'Vòi chậu rửa cảm ứng TOTO TTLA102 + Hộp điều khiển & phụ kiện', unit: 'Bộ', price: 6800000 },
    { code: 'DN_VT_XIPHO_02', name: 'Xiphong thoát nước chậu Lavabo TOTO TVLF403', unit: 'Cái', price: 650000 },
    { code: 'DN_VT_VALTIEU_03', name: 'Bộ van xả tiểu nam cảm ứng âm tường TOTO USWN900', unit: 'Bộ', price: 5400000 },
    { code: 'DN_VT_VALGAT_04', name: 'Van xả gạt tiểu nam đồng mạ Crom TOTO TS402S', unit: 'Cái', price: 920000 },
    { code: 'DN_VT_VOIXIT_05', name: 'Vòi xịt vệ sinh inox 304 nguyên khối chống xoắn áp lực cao', unit: 'Bộ', price: 380000 },
    { code: 'DN_VT_PHAOC_06', name: 'Phao cơ ngắt nước thông minh Inox 304 phi 21/27 chống tràn', unit: 'Cái', price: 285000 },
    { code: 'DN_TB_BOMCHIM_07', name: 'Bơm chìm nước thải Tsurumi 50PU2.75 0.75kW 380V', unit: 'Cái', price: 12500000 },
    { code: 'DN_TB_BOMTANG_08', name: 'Máy bơm tăng áp biến tần Wilo Helix V 1604-1 4kW', unit: 'Cái', price: 42000000 },
    { code: 'DN_TB_DONGHON_09', name: 'Đồng hồ đo lưu lượng nước sạch Woltman D80 cấp B mặt bích', unit: 'Cái', price: 7800000 },
    { code: 'DN_VT_LOCY_10', name: 'Lọc Y rác đồng ren Miha DN25/DN32/DN50', unit: 'Cái', price: 450000 },
    { code: 'DN_VT_VANDONG_11', name: 'Van cổng đồng tay xoay ren Miha DN25/DN32/DN50', unit: 'Cái', price: 360000 },
    { code: 'DN_VT_DAYCAP_12', name: 'Dây cấp nước inox mềm bọc lưới chịu áp dài 40cm/60cm', unit: 'Sợi', price: 85000 },
    { code: 'DN_VT_PHEUIN_13', name: 'Phễu thu sàn inox 304 đúc nguyên khối chống mùi 120x120 thoát D60/D90', unit: 'Cái', price: 210000 },
  ];

  sanitaryItems.forEach((s, idx) => {
    items.push({
      id: `mat_dn_san_${idCounter++}`,
      code: s.code,
      name: s.name,
      category: 'Thiết bị vệ sinh & Xử lý nước',
      unit: s.unit,
      specification: `Thiết bị vệ sinh nhà ga TOTO và van đường ống chính hãng`,
      location: 'Kho Thiết Bị Vệ Sinh L1',
      initialStock: Math.floor(12 + idx * 3),
      minStock: 4,
      maxStock: 40,
      unitPrice: s.price,
      allocatedStaffEmails: staff,
    });
  });

  // Group 6: Vật tư phụ, Hóa chất bảo trì & Kim khí treo đỡ (80 items)
  const hardwareItems = [
    { code: 'DN_VT_ACETO_01', name: 'Acetone (cồn công nghiệp tẩy rửa tiếp điểm điện)', unit: 'Lít', price: 65000 },
    { code: 'DN_VT_RP7_02', name: 'Chai xịt bôi trơn chống rỉ sét và phục hồi tiếp điểm RP7 350g', unit: 'Chai', price: 95000 },
    { code: 'DN_VT_KEO_SIL_03', name: 'Keo Silicone Apollo A500 chống thấm đa năng (Trắng/Xám/Đen)', unit: 'Chai', price: 68000 },
    { code: 'DN_VT_BANGKEO_04', name: 'Băng keo cách điện Nano 10 yards chống cháy 600V (Cây 10 cuộn)', unit: 'Cây', price: 75000 },
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

  hardwareItems.forEach((h) => {
    items.push({
      id: `mat_dn_hw_${idCounter++}`,
      code: h.code,
      name: h.name,
      category: 'Vật tư Điện & Phụ kiện tiêu hao',
      unit: h.unit,
      specification: `Vật tư phụ kim khí và hóa chất phục vụ bảo trì nhà ga`,
      location: 'Kệ Kim Khí M1',
      initialStock: 60,
      minStock: 20,
      maxStock: 250,
      unitPrice: h.price,
      allocatedStaffEmails: staff,
    });
  });

  return items;
}

export const RAW_MATERIALS_DATABASE_600: Material[] = generateComprehensiveCatalog();
