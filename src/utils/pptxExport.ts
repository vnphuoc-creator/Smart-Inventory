import pptxgen from 'pptxgenjs';

export async function exportTrainingDeckToPPTX(): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Đội Điện Nước Công Trình - AHT Cảng HKQT Đà Nẵng';
  pptx.company = 'Cảng Hàng Không Quốc Tế Đà Nẵng (AHT)';
  pptx.subject = 'Chương Trình Đào Tạo Vận Hành Hệ Thống Quản Lý Kho Thông Minh ĐNCT';
  pptx.title = 'Slide Đào Tạo Nhân Viên - Quản Lý Kho Vật Tư ĐNCT';

  // Theme Colors
  const NAVY = '081028';
  const BLUE = '1E40AF';
  const ACCENT_CYAN = '06B6D4';
  const SLATE_DARK = '0F172A';
  const CARD_BG = '1E293B';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';
  const ACCENT_EMERALD = '10B981';
  const ACCENT_AMBER = 'F59E0B';

  // Helper for common slide header
  const addSlideHeader = (slide: any, title: string, category: string) => {
    // Header Background bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 1.1,
      fill: { color: NAVY },
    });

    // Category Eyebrow
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.2,
      w: 10,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
      charSpacing: 2,
    });

    // Main Slide Title
    slide.addText(title, {
      x: 0.8,
      y: 0.45,
      w: 10,
      h: 0.5,
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: TEXT_WHITE,
    });

    // Sub watermark
    slide.addText('AHT • ĐỘI ĐNCT', {
      x: 10.5,
      y: 0.35,
      w: 2.2,
      h: 0.4,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: '475569',
      align: 'right',
    });

    // Divider Line
    slide.addShape(pptx.ShapeType.line, {
      x: 0,
      y: 1.1,
      w: 13.33,
      h: 0,
      line: { color: '334155', width: 1 },
    });
  };

  // Helper for footer
  const addSlideFooter = (slide: any, currentSlide: number, totalSlides: number = 12) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 7.1,
      w: 13.33,
      h: 0.4,
      fill: { color: '030712' },
    });

    slide.addText('Hệ Thống Quản Lý Kho Vật Tư Thông Minh • Nhà Ga Quốc Tế T2 Đà Nẵng', {
      x: 0.8,
      y: 7.15,
      w: 8.0,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Arial',
      color: '64748B',
    });

    slide.addText(`Trang ${currentSlide}/${totalSlides}`, {
      x: 11.0,
      y: 7.15,
      w: 1.5,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
      align: 'right',
    });
  };

  // ==========================================
  // SLIDE 1: TRANG BÌA (TITLE SLIDE)
  // ==========================================
  const s1 = pptx.addSlide();
  s1.background = { color: NAVY };

  // Decorative Shapes
  s1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 4.5,
    h: 0.35,
    fill: { color: '1E3A8A' },
  });
  s1.addText('CHƯƠNG TRÌNH ĐÀO TẠO NỘI BỘ NĂM 2026', {
    x: 0.9,
    y: 1.23,
    w: 4.3,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
    align: 'left',
  });

  s1.addText('HƯỚNG DẪN VẬN HÀNH\nHỆ THỐNG QUẢN LÝ KHO THÔNG MINH', {
    x: 0.8,
    y: 1.8,
    w: 11.5,
    h: 1.6,
    fontSize: 32,
    fontFace: 'Arial',
    bold: true,
    color: TEXT_WHITE,
    lineSpacingMultiple: 1.15,
  });

  s1.addText('Quy trình số hóa Xuất - Nhập - Tồn Vật tư Kỹ thuật • Công nghệ Trợ lý AI OCR Tờ trình', {
    x: 0.8,
    y: 3.6,
    w: 11.5,
    h: 0.5,
    fontSize: 14,
    fontFace: 'Arial',
    color: '38BDF8',
  });

  // Feature highlight boxes
  const highlights = [
    { title: 'Quản Lý >600 Mã Vật Tư', desc: 'Chuẩn hóa định danh DN_* & vị trí lưu kho' },
    { title: 'Quét Ảnh Tờ Trình Bằng AI', desc: 'Bóc tách tự động bảng vật tư từ ảnh chụp / dán Ctrl+V' },
    { title: 'Thẻ Kho & Đối Soát 24/7', desc: 'Minh bạch xuất nhập tồn, chống thất thoát tài sản' },
  ];

  highlights.forEach((h, i) => {
    const xPos = 0.8 + i * 3.9;
    s1.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 4.4,
      w: 3.7,
      h: 1.5,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 },
    });
    s1.addText(h.title, {
      x: xPos + 0.2,
      y: 4.6,
      w: 3.3,
      h: 0.4,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });
    s1.addText(h.desc, {
      x: xPos + 0.2,
      y: 5.0,
      w: 3.3,
      h: 0.7,
      fontSize: 10,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  s1.addText('Đơn vị áp dụng: Đội Điện Nước Công Trình (ĐNCT/PKT) • Cảng Hàng Không Quốc Tế Đà Nẵng (AHT)', {
    x: 0.8,
    y: 6.4,
    w: 11.5,
    h: 0.4,
    fontSize: 11,
    fontFace: 'Arial',
    italic: true,
    color: '94A3B8',
  });
  addSlideFooter(s1, 1);

  // ==========================================
  // SLIDE 2: MỤC TIÊU KHÓA ĐÀO TẠO & 3 NGUYÊN TẮC CỐT LÕI
  // ==========================================
  const s2 = pptx.addSlide();
  s2.background = { color: SLATE_DARK };
  addSlideHeader(s2, 'Mục Tiêu Đào Tạo & 3 Nguyên Tắc Cốt Lõi', 'Phần 1: Định Hướng & Chuẩn Mực');

  // Left Column: Goals
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 5.6,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });
  s2.addText('🎯 MỤC TIÊU HỌC TẬP CHO NHÂN VIÊN', {
    x: 1.1,
    y: 1.8,
    w: 5.0,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
  });

  const goals = [
    'Nắm vững quy trình lập phiếu Xuất / Nhập kho theo đúng quy chuẩn Bộ Tài chính.',
    'Thành thạo kỹ năng chụp ảnh hoặc dán ảnh (Ctrl+V) Tờ trình để AI tự động trích xuất bảng vật tư.',
    'Chủ động tra cứu định mức tồn kho, mã DN_* và vị trí kệ chứa vật tư trước khi sửa chữa.',
    'Tuân thủ chế độ ghi sổ thẻ kho, không để xảy ra tình trạng xuất khống hoặc lệch tồn thực tế.',
    'Biết cách khai thác Trợ lý AI để tra cứu nhanh số lượng và giá trị tồn kho.',
  ];

  goals.forEach((g, idx) => {
    s2.addText(`${idx + 1}.`, {
      x: 1.1,
      y: 2.3 + idx * 0.8,
      w: 0.3,
      h: 0.4,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_AMBER,
    });
    s2.addText(g, {
      x: 1.45,
      y: 2.3 + idx * 0.8,
      w: 4.6,
      h: 0.75,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  // Right Column: 3 Core Principles
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.5,
    w: 5.7,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });
  s2.addText('⚖️ 3 NGUYÊN TẮC "BẤT KHẢ XÂM PHẠM"', {
    x: 7.1,
    y: 1.8,
    w: 5.1,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_EMERALD,
  });

  const principles = [
    {
      title: '1. KHÔNG XUẤT HÀNG KHI CHƯA CÓ PHIẾU',
      desc: 'Mọi hoạt động xuất dùng sửa chữa đều phải tạo phiếu 02-VT trên hệ thống, nêu rõ hệ thống bảo trì và người nhận.',
    },
    {
      title: '2. 100% VẬT TƯ NHẬP PHẢI THEO TỜ TRÌNH',
      desc: 'Bắt buộc gắn Số tờ trình (ví dụ: 17-DNCT/PKT). Dùng công cụ quét ảnh OCR để đối chiếu chính xác chủng loại và số lượng.',
    },
    {
      title: '3. THỜI GIAN THỰC (REAL-TIME DATA)',
      desc: 'Phát sinh giao dịch nào phải ghi nhận ngay trong ca trực. Dữ liệu tự động đồng bộ Cloud tới tất cả các thiết bị.',
    },
  ];

  principles.forEach((p, idx) => {
    s2.addText(p.title, {
      x: 7.1,
      y: 2.3 + idx * 1.35,
      w: 5.1,
      h: 0.35,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });
    s2.addText(p.desc, {
      x: 7.1,
      y: 2.65 + idx * 1.35,
      w: 5.1,
      h: 0.9,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  addSlideFooter(s2, 2);

  // ==========================================
  // SLIDE 3: BƯỚC 1 - ĐĂNG NHẬP & PHÂN QUYỀN
  // ==========================================
  const s3 = pptx.addSlide();
  s3.background = { color: SLATE_DARK };
  addSlideHeader(s3, 'Bước 1: Đăng Nhập & Phân Quyền Tài Khoản', 'Quy Trình Thao Tác Chuẩn');

  // Left card: Step instruction
  s3.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 5.6,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s3.addText('HƯỚNG DẪN TRUY CẬP HỆ THỐNG', {
    x: 1.1,
    y: 1.8,
    w: 5.0,
    h: 0.3,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
  });

  const step1Points = [
    'Truy cập qua trình duyệt web trên máy tính hoặc điện thoại thông minh.',
    'Nhập Tên tài khoản (Email) và Mật khẩu được cấp theo ca trực.',
    'Bắt buộc đổi mật khẩu cá nhân ở lần đăng nhập đầu tiên.',
    'Hệ thống tự động nhận diện thẩm quyền và cấp quyền thao tác tương ứng.',
    'Nếu quên mật khẩu, liên hệ Quản lý Đội (vn.phuoc235@gmail.com) để reset cấp tốc.',
  ];

  step1Points.forEach((pt, i) => {
    s3.addText(`• ${pt}`, {
      x: 1.1,
      y: 2.3 + i * 0.8,
      w: 5.0,
      h: 0.7,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  // Right card: Roles Table
  s3.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.5,
    w: 5.7,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s3.addText('BẢNG PHÂN QUYỀN 4 VAI TRÒ TRONG HỆ THỐNG', {
    x: 7.1,
    y: 1.8,
    w: 5.1,
    h: 0.3,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_EMERALD,
  });

  const roles = [
    {
      name: 'Thủ Kho (Staff)',
      perm: 'Lập phiếu Nhập/Xuất kho, quét ảnh tờ trình AI, theo dõi thẻ kho, in phiếu kho mẫu chuẩn.',
    },
    {
      name: 'Kỹ Thuật Viên (Technician)',
      perm: 'Tra cứu danh mục vật tư, kiểm tra tồn kho dự phòng, tạo yêu cầu đề xuất xuất vật tư sửa chữa.',
    },
    {
      name: 'Quản Lý Đội / TP (Admin)',
      perm: 'Phê duyệt phiếu xuất nhập, sửa phiếu lập sai, xem báo cáo tổng hợp, theo dõi tiến độ tờ trình.',
    },
    {
      name: 'Master Admin (vn.phuoc235)',
      perm: 'Toàn quyền cấu hình hệ thống, quản lý danh sách người dùng, phân quyền và giám sát Cloud.',
    },
  ];

  roles.forEach((r, i) => {
    s3.addText(r.name, {
      x: 7.1,
      y: 2.3 + i * 1.05,
      w: 5.1,
      h: 0.3,
      fontSize: 11.5,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });
    s3.addText(r.perm, {
      x: 7.1,
      y: 2.6 + i * 1.05,
      w: 5.1,
      h: 0.65,
      fontSize: 10,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  addSlideFooter(s3, 3);

  // ==========================================
  // SLIDE 4: BƯỚC 2 - TRA CỨU DANH MỤC VẬT TƯ CHUẨN ĐNCT
  // ==========================================
  const s4 = pptx.addSlide();
  s4.background = { color: SLATE_DARK };
  addSlideHeader(s4, 'Bước 2: Danh Mục Vật Tư Chuẩn (>600 Mã DN_*)', 'Quản Lý Danh Mục');

  // Rule of Coding
  s4.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 11.7,
    h: 1.8,
    fill: { color: '1E3A8A' },
    line: { color: '3B82F6', width: 1 },
  });

  s4.addText('QUY CHUẨN ĐỊNH DANH MÃ VẬT TƯ: DN_[LOẠI]_[MÃ_SỐ]', {
    x: 1.1,
    y: 1.7,
    w: 11.0,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
  });

  s4.addText(
    'Mọi vật tư thuộc Đội ĐNCT đều được quy chuẩn tiền tố "DN_" nhằm tránh nhầm lẫn giữa các phòng ban. Hệ thống quản lý hơn 600 danh mục vật tư kỹ thuật chuyên dụng cho Nhà ga T2 (Đèn LED, Cáp hạ thế, Ống PPR, Aptomat, Van cổng, Bơm nước, Cút nối, Keo silicon,...).',
    {
      x: 1.1,
      y: 2.1,
      w: 11.0,
      h: 1.0,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    }
  );

  // 3 Key features of Materials view
  const matCols = [
    {
      title: '🔍 TÌM KIẾM ĐA NĂNG',
      items: [
        'Gõ theo mã (DN_CS_01, DN_NUOC_05...)',
        'Gõ theo tên quy cách (Đèn âm trần, Van ren...)',
        'Bộ lọc theo Nhóm ngành: Chiếu sáng, Động lực, Cấp thoát nước, Thiết bị vệ sinh...',
      ],
    },
    {
      title: '⚠️ CẢNH BÁO ĐỊNH MỨC TỒN',
      items: [
        'Định mức tồn kho an toàn tối thiểu (Min Stock)',
        'Màu Đỏ: Hết hàng (0 tồn) - Ưu tiên đề xuất mua ngay',
        'Màu Vàng: Sắp chạm đáy định mức an toàn',
        'Màu Xanh: Tồn kho dồi dào, sẵn sàng sửa chữa',
      ],
    },
    {
      title: '📍 VỊ TRÍ KHO & LỊCH SỬ',
      items: [
        'Hiển thị rõ Kệ / Ngăn chứa trong kho vật tư',
        'Bấm vào mặt hàng để xem toàn bộ lịch sử Nhập - Xuất',
        'Xem đơn giá bình quân gia quyền và tổng giá trị',
      ],
    },
  ];

  matCols.forEach((col, i) => {
    const xPos = 0.8 + i * 4.0;
    s4.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 3.5,
      w: 3.7,
      h: 3.2,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 },
    });
    s4.addText(col.title, {
      x: xPos + 0.2,
      y: 3.7,
      w: 3.3,
      h: 0.35,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_AMBER,
    });
    col.items.forEach((item, itIdx) => {
      s4.addText(`• ${item}`, {
        x: xPos + 0.2,
        y: 4.15 + itIdx * 0.7,
        w: 3.3,
        h: 0.65,
        fontSize: 10,
        fontFace: 'Arial',
        color: TEXT_WHITE,
      });
    });
  });

  addSlideFooter(s4, 4);

  // ==========================================
  // SLIDE 5: BƯỚC 3 - QUÉT ẢNH TỜ TRÌNH AI OCR (ĐỘT PHÁ CÔNG NGHỆ)
  // ==========================================
  const s5 = pptx.addSlide();
  s5.background = { color: SLATE_DARK };
  addSlideHeader(s5, 'Bước 3: Lập Phiếu Nhập Kho & Quét Ảnh Tờ Trình Bằng AI', 'Tính Năng Đột Phá AI');

  // Left card: AI Vision flow
  s5.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 6.2,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '3B82F6', width: 1.5 },
  });

  s5.addText('🤖 CƠ CHẾ QUÉT AI OCR CHỈ TRONG 2 GIÂY', {
    x: 1.1,
    y: 1.8,
    w: 5.6,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
  });

  const aiSteps = [
    {
      num: '1',
      title: 'Chụp ảnh hoặc Cắt ảnh Tờ trình',
      desc: 'Nhân viên chỉ cần dùng điện thoại chụp tờ trình giấy đã ký, hoặc chụp màn hình văn bản (Snipping Tool).',
    },
    {
      num: '2',
      title: 'Dán trực tiếp (Ctrl + V) hoặc Tải tệp lên',
      desc: 'Tại ô "Ảnh / Tài liệu đính kèm", chỉ cần ấn phím Ctrl + V hoặc chọn ảnh (PNG, JPG, Word DOCX, PDF).',
    },
    {
      num: '3',
      title: 'AI tự động trích xuất thông tin',
      desc: 'Google Gemini Vision tự đọc chữ trên ảnh: Trích xuất Số tờ trình (17-DNCT/PKT), Tên nhà cung cấp, Đơn vị đề xuất.',
    },
    {
      num: '4',
      title: 'Tự nạp Bảng danh mục vật tư',
      desc: 'Tự động điền đầy đủ Tên vật tư, Số lượng, Đơn vị tính, Đơn giá và khớp với mã vật tư DN_* có sẵn.',
    },
  ];

  aiSteps.forEach((st, i) => {
    s5.addShape(pptx.ShapeType.roundRect, {
      x: 1.1,
      y: 2.3 + i * 1.05,
      w: 0.35,
      h: 0.35,
      rectRadius: 0.17,
      fill: { color: '2563EB' },
    });
    s5.addText(st.num, {
      x: 1.1,
      y: 2.32 + i * 1.05,
      w: 0.35,
      h: 0.35,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: TEXT_WHITE,
      align: 'center',
    });
    s5.addText(st.title, {
      x: 1.55,
      y: 2.25 + i * 1.05,
      w: 5.2,
      h: 0.3,
      fontSize: 11.5,
      fontFace: 'Arial',
      bold: true,
      color: TEXT_WHITE,
    });
    s5.addText(st.desc, {
      x: 1.55,
      y: 2.55 + i * 1.05,
      w: 5.2,
      h: 0.65,
      fontSize: 10,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  // Right card: Benefits
  s5.addShape(pptx.ShapeType.roundRect, {
    x: 7.3,
    y: 1.5,
    w: 5.2,
    h: 5.2,
    fill: { color: '064E3B' },
    line: { color: '10B981', width: 1.5 },
  });

  s5.addText('✨ LỢI ÍCH VƯỢT TRỘI CHO THỦ KHO', {
    x: 7.6,
    y: 1.8,
    w: 4.6,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: '#6EE7B7',
  });

  const benefits = [
    'Tiết kiệm 95% thời gian: Không còn phải ngồi gõ lại bằng tay 20 - 50 dòng vật tư từ bản giấy.',
    'Chính xác tuyệt đối: Loại bỏ hoàn toàn lỗi gõ nhầm số lượng, sai đơn vị tính hay nhầm giá trị.',
    'Lưu trữ hồ sơ gốc: Ảnh tờ trình được lưu vĩnh viễn cùng phiếu kho. Bất kỳ lúc nào cũng có thể bấm nút "Xem Ảnh Gốc" để đối chiếu chứng từ.',
    'Đồng bộ tức thì: Khi bấm "Lưu Phiếu Nhập Kho", hệ thống tự động cộng tồn kho tức thì trên toàn bộ mạng lưới.',
  ];

  benefits.forEach((b, i) => {
    s5.addText(`✅ ${b}`, {
      x: 7.6,
      y: 2.4 + i * 1.05,
      w: 4.6,
      h: 0.9,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  addSlideFooter(s5, 5);

  // ==========================================
  // SLIDE 6: BƯỚC 4 - QUY TRÌNH LẬP PHIẾU XUẤT KHO (02-VT)
  // ==========================================
  const s6 = pptx.addSlide();
  s6.background = { color: SLATE_DARK };
  addSlideHeader(s6, 'Bước 4: Lập Phiếu Xuất Kho Bảo Trì / Sửa Chữa (02-VT)', 'Quy Trình Xuất Kho');

  // 3-step Horizontal Process Flow
  const exportSteps = [
    {
      step: 'Bước 4.1',
      title: 'CHỌN HÌNH THỨC XUẤT',
      desc: '• Xuất phục vụ sửa chữa bảo trì hệ thống.\n• Xuất theo nguồn Tờ trình cụ thể (để trừ đúng quỹ duyệt).\n• Hoặc Xuất từ kho chung tổng hợp.',
    },
    {
      step: 'Bước 4.2',
      title: 'CHỌN VẬT TƯ & KIỂM TRA TỒN',
      desc: '• Tìm mã vật tư DN_*.\n• Hệ thống hiển thị ngay Tồn kho khả dụng.\n• Tự động chặn nếu Số lượng xuất vượt quá Số tồn thực tế trong kho!',
    },
    {
      step: 'Bước 4.3',
      title: 'GHI RÕ HỆ THỐNG SỬA CHỮA',
      desc: '• Bắt buộc ghi rõ: Người nhận, Bộ phận, Hạng mục (VD: Thay bóng đèn Chiếu sáng Tầng 2, Sửa van cấp nước Khu cách ly).\n• Bấm Lưu phiếu.',
    },
  ];

  exportSteps.forEach((es, i) => {
    const xPos = 0.8 + i * 4.0;
    s6.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 1.5,
      w: 3.7,
      h: 2.5,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 },
    });

    s6.addText(es.step, {
      x: xPos + 0.2,
      y: 1.7,
      w: 3.3,
      h: 0.3,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });

    s6.addText(es.title, {
      x: xPos + 0.2,
      y: 2.0,
      w: 3.3,
      h: 0.35,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: TEXT_WHITE,
    });

    s6.addText(es.desc, {
      x: xPos + 0.2,
      y: 2.4,
      w: 3.3,
      h: 1.4,
      fontSize: 10,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  // Bottom Box: Important Rules for Exporting
  s6.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 4.3,
    w: 11.7,
    h: 2.5,
    fill: { color: '450A0A' },
    line: { color: 'EF4444', width: 1 },
  });

  s6.addText('⚠️ QUY ĐỊNH NGHIÊM NGẶT KHI XUẤT KHO VẬT TƯ', {
    x: 1.1,
    y: 4.5,
    w: 11.0,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: '#FCA5A5',
  });

  const exportRules = [
    'TUYỆT ĐỐI KHÔNG xuất hàng trước - làm phiếu sau. Mọi ca trực sửa chữa đều phải có lệnh/phiếu xuất.',
    'Vật tư thu hồi hỏng/thay ra: Phải tập kết về kho phế liệu theo quy định, không vứt bỏ tùy tiện.',
    'Kiểm soát hạn mức: Trưởng phòng và Quản trị viên sẽ nhận cảnh báo tức thời nếu phát hiện vật tư xuất dùng bất thường so với định mức trung bình.',
  ];

  exportRules.forEach((r, i) => {
    s6.addText(`• ${r}`, {
      x: 1.1,
      y: 4.95 + i * 0.55,
      w: 11.0,
      h: 0.5,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  addSlideFooter(s6, 6);

  // ==========================================
  // SLIDE 7: BƯỚC 5 - IN PHIẾU KHO MẪU CHUẨN 01-VT & 02-VT
  // ==========================================
  const s7 = pptx.addSlide();
  s7.background = { color: SLATE_DARK };
  addSlideHeader(s7, 'Bước 5: In Phiếu Kho Chuẩn Mẫu 01-VT & 02-VT Bộ Tài Chính', 'In Ấn & Lưu Hồ Sơ');

  // Left card: Specifications
  s7.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 5.6,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s7.addText('QUY CÁCH PHIẾU KHO IN ẤN', {
    x: 1.1,
    y: 1.8,
    w: 5.0,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
  });

  const printSpecs = [
    'Phiếu Nhập Kho: Ban hành theo Mẫu số 01 - VT (Thông tư số 200/2014/TT-BTC hoặc QĐ 48).',
    'Phiếu Xuất Kho: Ban hành theo Mẫu số 02 - VT chuẩn chế độ kế toán.',
    'Tự động định dạng khổ giấy A4 dọc chuyên nghiệp, tự căn lề đẹp mắt, không bị tràn trang.',
    'Tự động tính tiền: Đơn giá, Thành tiền, Tổng số tiền bằng chữ tiếng Việt chuẩn xác.',
    'Đầy đủ các vị trí ký duyệt: Người lập phiếu, Người giao hàng/nhận hàng, Thủ kho, Kế toán/Trưởng bộ phận.',
  ];

  printSpecs.forEach((sp, i) => {
    s7.addText(`✔ ${sp}`, {
      x: 1.1,
      y: 2.3 + i * 0.85,
      w: 5.0,
      h: 0.75,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  // Right card: How to print
  s7.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.5,
    w: 5.7,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s7.addText('HƯỚNG DẪN THAO TÁC IN NHANH', {
    x: 7.1,
    y: 1.8,
    w: 5.1,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_AMBER,
  });

  const printGuides = [
    {
      action: '1. Mở danh sách phiếu',
      detail: 'Vào mục "Xuất - Nhập Kho", tìm phiếu cần in trong bảng lịch sử.',
    },
    {
      action: '2. Bấm nút "Xem Phiếu"',
      detail: 'Hệ thống mở cửa sổ xem trước phiếu kho nguyên vẹn chuẩn in ấn.',
    },
    {
      action: '3. Bấm "In Phiếu" (Ctrl + P)',
      detail: 'Máy tính sẽ mở hộp thoại máy in. Bạn có thể in ra giấy hoặc chọn "Save as PDF" để lưu vào máy.',
    },
    {
      action: '4. Xem lại Tờ trình gốc',
      detail: 'Ngay phía dưới phiếu có nút "Xem Ảnh / Chứng Từ Gốc" giúp người ký duyệt đối chiếu ngay lập tức mà không cần tìm hồ sơ giấy.',
    },
  ];

  printGuides.forEach((g, i) => {
    s7.addText(g.action, {
      x: 7.1,
      y: 2.3 + i * 1.1,
      w: 5.1,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });
    s7.addText(g.detail, {
      x: 7.1,
      y: 2.6 + i * 1.1,
      w: 5.1,
      h: 0.7,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  addSlideFooter(s7, 7);

  // ==========================================
  // SLIDE 8: BƯỚC 6 - THẺ KHO & BÁO CÁO XUẤT NHẬP TỒN (XNT)
  // ==========================================
  const s8 = pptx.addSlide();
  s8.background = { color: SLATE_DARK };
  addSlideHeader(s8, 'Bước 6: Thẻ Kho & Báo Cáo Xuất - Nhập - Tồn (XNT)', 'Báo Cáo Kế Toán');

  // Top Box: What is Stock Ledger
  s8.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 11.7,
    h: 1.6,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 },
  });

  s8.addText('📖 THẺ KHO ĐIỆN TỬ THEO DÕI BIẾN ĐỘNG TỪNG MẶT HÀNG', {
    x: 1.1,
    y: 1.7,
    w: 11.0,
    h: 0.3,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
  });

  s8.addText(
    'Mỗi một mã vật tư đều có một trang Thẻ Kho độc lập ghi chép liên tục: Ngày tháng giao dịch, Số hiệu chứng từ, Diễn giải nội dung, Số lượng Nhập, Số lượng Xuất và Tồn kho cuối kỳ. Hệ thống tự động tính toán theo công thức: Tồn Cuối = Tồn Đầu + Tổng Nhập - Tổng Xuất.',
    {
      x: 1.1,
      y: 2.05,
      w: 11.0,
      h: 0.9,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    }
  );

  // 3 Columns: Period Filter, Export Excel, Physical Inventory
  const reportFeatures = [
    {
      title: 'LỌC THEO KỲ BÁO CÁO',
      items: [
        'Chọn khoảng thời gian (Từ ngày... Đến ngày...)',
        'Xem báo cáo theo Tháng, Quý hoặc Năm tài chính',
        'Lọc riêng theo nhóm vật tư (Chiếu sáng, Cơ điện, Nước...)',
      ],
    },
    {
      title: 'XUẤT BÁO CÁO EXCEL CHUẨN',
      items: [
        'Nút "Xuất Excel" một chạm',
        'Tệp Excel tự động định dạng kẻ bảng, công thức tính tổng',
        'Sẵn sàng gửi Ban Giám đốc và Phòng Kế toán AHT',
      ],
    },
    {
      title: 'ĐỐI CHIẾU KIỂM KÊ THỰC TẾ',
      items: [
        'Hỗ trợ kiểm kê định kỳ cuối tháng',
        'Đối chiếu số lượng thực tế đếm được trong kho với số sách',
        'Phát hiện tức thời các chênh lệch để lập biên bản xử lý',
      ],
    },
  ];

  reportFeatures.forEach((rf, i) => {
    const xPos = 0.8 + i * 4.0;
    s8.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 3.4,
      w: 3.7,
      h: 3.3,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 },
    });

    s8.addText(rf.title, {
      x: xPos + 0.2,
      y: 3.6,
      w: 3.3,
      h: 0.35,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_EMERALD,
    });

    rf.items.forEach((it, itIdx) => {
      s8.addText(`• ${it}`, {
        x: xPos + 0.2,
        y: 4.1 + itIdx * 0.75,
        w: 3.3,
        h: 0.7,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: TEXT_WHITE,
      });
    });
  });

  addSlideFooter(s8, 8);

  // ==========================================
  // SLIDE 9: BƯỚC 7 - ĐỐI SOÁT TỜ TRÌNH MUA SẮM VS THỰC NHẬP
  // ==========================================
  const s9 = pptx.addSlide();
  s9.background = { color: SLATE_DARK };
  addSlideHeader(s9, 'Bước 7: Đối Soát Tờ Trình Mua Sắm & Tỷ Lệ Thực Nhập', 'Quản Trị Mua Sắm');

  // Left card: Why reconciliation
  s9.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 5.6,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s9.addText('TẠI SAO PHẢI ĐỐI SOÁT TỜ TRÌNH?', {
    x: 1.1,
    y: 1.8,
    w: 5.0,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_CYAN,
  });

  const reconWhys = [
    'Một tờ trình mua sắm thường được nhà cung cấp giao làm nhiều đợt khác nhau.',
    'Nếu không theo dõi chặt chẽ, rất dễ bị giao thiếu vật tư hoặc nhập thừa so với dự toán được duyệt.',
    'Hệ thống tự động liên kết Số tờ trình (vd: 17-DNCT/PKT) với tất cả các phiếu nhập kho phát sinh.',
    'Cung cấp bức tranh toàn cảnh: Đã duyệt mua bao nhiêu? Đã nhập kho bao nhiêu? Còn thiếu bao nhiêu cái?',
  ];

  reconWhys.forEach((rw, i) => {
    s9.addText(`• ${rw}`, {
      x: 1.1,
      y: 2.3 + i * 1.05,
      w: 5.0,
      h: 0.95,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  // Right card: Indicators
  s9.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.5,
    w: 5.7,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s9.addText('CÁC TRẠNG THÁI TIẾN ĐỘ TỜ TRÌNH', {
    x: 7.1,
    y: 1.8,
    w: 5.1,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_AMBER,
  });

  const statuses = [
    {
      badge: 'ĐÃ HOÀN THÀNH 100%',
      color: ACCENT_EMERALD,
      desc: 'Toàn bộ danh mục vật tư trong tờ trình đã được nhà cung cấp bàn giao đủ vào kho.',
    },
    {
      badge: 'ĐANG NHẬP MỘT PHẦN (1% - 99%)',
      color: ACCENT_AMBER,
      desc: 'Nhà cung cấp mới giao một số mặt hàng. Hệ thống chỉ rõ từng món còn thiếu để thủ kho đôn đốc giao tiếp.',
    },
    {
      badge: 'CHƯA NHẬP (0%)',
      color: 'EF4444',
      desc: 'Tờ trình đã phê duyệt nhưng chưa có bất kỳ lô hàng nào được nhập kho.',
    },
    {
      badge: 'GIAO THỪA / VƯỢT HẠN MỨC',
      color: 'A855F7',
      desc: 'Cảnh báo đỏ nếu số lượng thực nhập vượt quá số lượng tờ trình cho phép.',
    },
  ];

  statuses.forEach((st, i) => {
    s9.addText(st.badge, {
      x: 7.1,
      y: 2.3 + i * 1.1,
      w: 5.1,
      h: 0.3,
      fontSize: 11.5,
      fontFace: 'Arial',
      bold: true,
      color: st.color,
    });
    s9.addText(st.desc, {
      x: 7.1,
      y: 2.6 + i * 1.1,
      w: 5.1,
      h: 0.7,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  addSlideFooter(s9, 9);

  // ==========================================
  // SLIDE 10: BƯỚC 8 - TRỢ LÝ AI & TÌM KIẾM THÔNG MINH
  // ==========================================
  const s10 = pptx.addSlide();
  s10.background = { color: SLATE_DARK };
  addSlideHeader(s10, 'Bước 8: Khai Thác Trợ Lý AI & Tìm Kiếm Tự Nhiên', 'Trợ Lý Ảo Thông Minh');

  // Top instruction
  s10.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 11.7,
    h: 1.6,
    fill: { color: '3B0764' },
    line: { color: 'A855F7', width: 1 },
  });

  s10.addText('💬 HỎI ĐÁP BẰNG TIẾNG VIỆT TỰ NHIÊN VỚI TRỢ LÝ AI KHO', {
    x: 1.1,
    y: 1.7,
    w: 11.0,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: '#D8B4FE',
  });

  s10.addText(
    'Không cần nhớ mã vật tư phức tạp! Bất kỳ nhân viên nào cũng có thể bấm vào nút "Trợ Lý AI Kho" trên thanh công cụ hoặc ấn phím tắt và hỏi trực tiếp bằng ngôn ngữ hàng ngày. AI sẽ tự động truy vấn cơ sở dữ liệu và trả về câu trả lời chính xác cùng số lượng thực tế.',
    {
      x: 1.1,
      y: 2.05,
      w: 11.0,
      h: 0.9,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    }
  );

  // Example Prompt Cards
  const prompts = [
    {
      q: '"Trong kho còn bao nhiêu bóng đèn LED 18W?"',
      a: 'AI phản hồi: "Hiện tại mã DN_CS_01 (Đèn LED âm trần 18W Rạng Đông) còn 45 Cái tại Kệ A1-02. Tồn an toàn tối thiểu là 10 Cái."',
    },
    {
      q: '"Những vật tư nào sắp hết hàng cần mua gấp?"',
      a: 'AI lọc ra ngay danh sách 5 vật tư có số tồn bằng 0 hoặc dưới định mức Min Stock, kèm nút tạo phiếu đề xuất mua ngay.',
    },
    {
      q: '"Tờ trình 17-DNCT/PKT đã nhập được bao nhiêu rồi?"',
      a: 'AI tính toán: "Tờ trình 17 đã nhập 85% tiến độ (12/14 hạng mục). Hiện còn thiếu 100m Ống luồn dây và 2 Cuộn băng keo cách điện."',
    },
  ];

  prompts.forEach((pr, i) => {
    const xPos = 0.8 + i * 4.0;
    s10.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 3.4,
      w: 3.7,
      h: 3.3,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 },
    });

    s10.addText('CÂU HỎI MẪU:', {
      x: xPos + 0.2,
      y: 3.6,
      w: 3.3,
      h: 0.25,
      fontSize: 10,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_AMBER,
    });

    s10.addText(pr.q, {
      x: xPos + 0.2,
      y: 3.9,
      w: 3.3,
      h: 0.7,
      fontSize: 11.5,
      fontFace: 'Arial',
      italic: true,
      bold: true,
      color: ACCENT_CYAN,
    });

    s10.addText('AI PHẢN HỒI:', {
      x: xPos + 0.2,
      y: 4.7,
      w: 3.3,
      h: 0.25,
      fontSize: 10,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_EMERALD,
    });

    s10.addText(pr.a, {
      x: xPos + 0.2,
      y: 5.0,
      w: 3.3,
      h: 1.5,
      fontSize: 10,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  addSlideFooter(s10, 10);

  // ==========================================
  // SLIDE 11: BƯỚC 9 - KỶ LUẬT VẬN HÀNH CA TRỰC & CHECKLIST HẰNG NGÀY
  // ==========================================
  const s11 = pptx.addSlide();
  s11.background = { color: SLATE_DARK };
  addSlideHeader(s11, 'Kỷ Luật Vận Hành Ca Trực & Checklist Hằng Ngày', 'Kỷ Luật & An Toàn');

  // Left column: Daily Checklist
  s11.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 5.6,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s11.addText('📋 CHECKLIST 5 BƯỚC MỖI CA TRỰC', {
    x: 1.1,
    y: 1.8,
    w: 5.0,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_EMERALD,
  });

  const dailyTasks = [
    {
      time: 'Đầu ca (07:30)',
      task: 'Đăng nhập hệ thống, kiểm tra các Cảnh báo hết hàng và danh sách phiếu chờ phê duyệt.',
    },
    {
      time: 'Trong ca',
      task: 'Khi có hàng về: Chụp ảnh/Dán tờ trình lên để tạo phiếu Nhập 01-VT ngay, không để dồn.',
    },
    {
      time: 'Khi sửa chữa',
      task: 'Trước khi lấy vật tư ra khỏi kho: Phải tạo phiếu Xuất 02-VT ghi đúng vị trí sửa chữa.',
    },
    {
      time: 'Cuối ca (16:30)',
      task: 'Đối chiếu số lượng thực tế trong kho với số liệu trên phần mềm (sổ thẻ kho).',
    },
    {
      time: 'Bàn giao ca',
      task: 'Bàn giao các phiếu chưa duyệt hoặc các mặt hàng gấp cần nhập cho ca trực kế tiếp.',
    },
  ];

  dailyTasks.forEach((dt, i) => {
    s11.addText(dt.time, {
      x: 1.1,
      y: 2.3 + i * 0.95,
      w: 5.0,
      h: 0.25,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });
    s11.addText(dt.task, {
      x: 1.1,
      y: 2.55 + i * 0.95,
      w: 5.0,
      h: 0.65,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  // Right column: Data Safety & Rules
  s11.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.5,
    w: 5.7,
    h: 5.2,
    fill: { color: CARD_BG },
    line: { color: '334155', width: 1 },
  });

  s11.addText('🔒 BẢO MẬT & SAO LƯU DỮ LIỆU ĐÁM MÂY', {
    x: 7.1,
    y: 1.8,
    w: 5.1,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: ACCENT_AMBER,
  });

  const safetyRules = [
    {
      title: 'Bảo mật tài khoản cá nhân:',
      desc: 'Tuyệt đối không chia sẻ mật khẩu ca trực cho người ngoài đội hoặc bộ phận khác.',
    },
    {
      title: 'Dữ liệu lưu trữ đám mây Google Cloud:',
      desc: 'Mọi thay đổi phiếu kho được lưu tự động trên Firestore. Không lo mất điện hay hỏng ổ cứng máy tính.',
    },
    {
      title: 'Sửa / Xóa phiếu sai sót:',
      desc: 'Nhân viên không được tùy tiện xóa phiếu. Nếu phát hiện sai số, báo Quản lý (Admin) vào mục "Sửa & Xóa Chứng Từ Sai" để hoàn tác minh bạch.',
    },
    {
      title: 'Đăng xuất khi rời khỏi máy:',
      desc: 'Luôn bấm nút Đăng xuất khi kết thúc ca trực hoặc khi rời khỏi phòng trực kho.',
    },
  ];

  safetyRules.forEach((sr, i) => {
    s11.addText(sr.title, {
      x: 7.1,
      y: 2.3 + i * 1.1,
      w: 5.1,
      h: 0.3,
      fontSize: 11.5,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });
    s11.addText(sr.desc, {
      x: 7.1,
      y: 2.6 + i * 1.1,
      w: 5.1,
      h: 0.7,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  });

  addSlideFooter(s11, 11);

  // ==========================================
  // SLIDE 12: TỔNG KẾT & HỖ TRỢ KỸ THUẬT
  // ==========================================
  const s12 = pptx.addSlide();
  s12.background = { color: NAVY };

  s12.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 3.5,
    h: 0.35,
    fill: { color: '065F46' },
  });
  s12.addText('HOÀN THÀNH CHƯƠNG TRÌNH ĐÀO TẠO', {
    x: 0.9,
    y: 1.25,
    w: 3.3,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: '#6EE7B7',
  });

  s12.addText('CHÚC TOÀN THỂ ĐỘI ĐNCT VẬN HÀNH XUẤT SẮC!\nSỐ HÓA - CHÍNH XÁC - MINH BẠCH - HIỆU QUẢ', {
    x: 0.8,
    y: 1.8,
    w: 11.5,
    h: 1.3,
    fontSize: 26,
    fontFace: 'Arial',
    bold: true,
    color: TEXT_WHITE,
    lineSpacingMultiple: 1.15,
  });

  // 3 Summary Highlights
  const summaries = [
    { title: 'Địa chỉ truy cập Web App', desc: 'https://smart-inventory-dnct.vercel.app' },
    { title: 'Hỗ trợ kỹ thuật & Phân quyền', desc: 'vn.phuoc235@gmail.com • Đội ĐNCT/PKT' },
    { title: 'Tài liệu hướng dẫn & Slide', desc: 'Tích hợp sẵn trong mục "Slide Đào Tạo" trên thanh Menu' },
  ];

  summaries.forEach((sm, i) => {
    const xPos = 0.8 + i * 3.9;
    s12.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 3.5,
      w: 3.7,
      h: 2.0,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 },
    });
    s12.addText(sm.title, {
      x: xPos + 0.2,
      y: 3.8,
      w: 3.3,
      h: 0.4,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: ACCENT_CYAN,
    });
    s12.addText(sm.desc, {
      x: xPos + 0.2,
      y: 4.3,
      w: 3.3,
      h: 1.0,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
    });
  });

  s12.addText(
    'CẢNG HÀNG KHÔNG QUỐC TẾ ĐÀ NẴNG (AHT) • ĐỘI ĐIỆN NƯỚC CÔNG TRÌNH\nNhà Ga Quốc Tế T2 • Sân Bay Quốc Tế Đà Nẵng',
    {
      x: 0.8,
      y: 6.0,
      w: 11.5,
      h: 0.8,
      fontSize: 12,
      fontFace: 'Arial',
      color: '94A3B8',
      align: 'center',
    }
  );

  addSlideFooter(s12, 12);

  // Trigger download
  await pptx.writeFile({ fileName: 'Slide_Dao_Tao_Quan_Ly_Kho_DNCT_AHT.pptx' });
}
