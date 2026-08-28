# HƯỚNG DẪN SỬ DỤNG CHI TIẾT
# HỆ THỐNG QUẢN LÝ VẬT TƯ THÔNG MINH (SMART INVENTORY MANAGEMENT)
**Đơn vị:** Cảng Hàng Không Quốc Tế Đà Nẵng • Nhà Ga Quốc Tế T2 (AHT)  
**Phiên bản:** 2.5 • **Phát hành:** 2026

---

## 📌 MỤC LỤC
1. [GIỚI THIỆU CHUNG & ĐĂNG NHẬP](#1-giới-thiệu-chung--đăng-nhập)
2. [HƯỚNG DẪN DÀNH CHO NHÂN VIÊN (THỦ KHO / KỸ THUẬT VIÊN)](#2-hướng-dẫn-dành-cho-nhân-viên-thủ-kho--kỹ-thuật-viên)
   - 2.1. [Tra cứu & Quản lý Danh mục Vật tư (>600 mã DN)](#21-tra-cứu--quản-lý-danh-mục-vật-tư-600-mã-dn)
   - 2.2. [Lập Phiếu Nhập Kho (Theo Tờ trình & Nhập trực tiếp)](#22-lập-phiếu-nhập-kho-theo-tờ-trình--nhập-trực-tiếp)
   - 2.3. [Nghiệp vụ Nhập Hàng Nhiều Đợt (Giao thiếu / Giao từng phần)](#23-nghiệp-vụ-nhập-hàng-nhiều-đợt-giao-thiếu--giao-từng-phần)
   - 2.4. [Lập Phiếu Xuất Kho Thi Công (Xuất ngay vật tư sẵn có)](#24-lập-phiếu-xuất-kho-thi-công-xuất-ngay-vật-tư-sẵn-có)
   - 2.5. [Theo Dõi Đối Chiếu Tờ Trình & Nhập Bổ Sung](#25-theo-dõi-đối-chiếu-tờ-trình--nhập-bổ-sung)
   - 2.6. [Tra Cứu Thẻ Kho & Báo Cáo Nhập - Xuất - Tồn](#26-tra-cứu-thẻ-kho--báo-cáo-nhập---xuất---tồn)
   - 2.7. [Sử Dụng Trợ Lý AI Kho Thông Minh](#27-sử-dụng-trợ-lý-ai-kho-thông-minh)
3. [HƯỚNG DẪN DÀNH CHO QUẢN LÝ (TRƯỞNG PHÒNG / ADMIN)](#3-hướng-dẫn-dành-cho-quản-lý-trưởng-phòng--admin)
   - 3.1. [Bảng Điều Khiển Tổng Quan (Dashboard) & Cảnh Báo An Toàn](#31-bảng-điều-khiển-tổng-quan-dashboard--cảnh-báo-an-toàn)
   - 3.2. [Kiểm Tra & Phê Duyệt Phiếu Kho Điện Tử](#32-kiểm-tra--phê-duyệt-phiếu-kho-điện-tử)
   - 3.3. [Quản Lý & Tạo Mới Tờ Trình Mua Sắm](#33-quản-lý--tạo-mới-tờ-trình-mua-sắm)
   - 3.4. [Tính Năng "Chốt Đóng Tờ Trình Sớm" (Nghiệm Thu Thực Nhận)](#34-tính-năng-chốt-đóng-tờ-trình-sớm-nghiệm-thu-thực-nhận)
   - 3.5. [Quản Lý & Sửa / Xóa Chứng Từ Sai](#35-quản-lý--sửa--xóa-chứng-từ-sai)
   - 3.6. [Phân Quyền Người Dùng & Quản Trị Hệ Thống](#36-phân-quyền-người-dùng--quản-trị-hệ-thống)
4. [QUY TRÌNH NGHIỆP VỤ MẪU & CÁC TÌNH HUỐNG THỰC TẾ (SCENARIOS & FAQ)](#4-quy-trình-nghiệp-vụ-mẫu--các-tình-huống-thực-tế-scenarios--faq)
5. [MẸO NHANH & PHÍM TẮT THAO TÁC](#5-mẹo-nhanh--phím-tắt-thao-tác)

---

# 1. GIỚI THIỆU CHUNG & ĐĂNG NHẬP

### 1.1. Mục tiêu của hệ thống
Hệ thống Quản lý Vật tư Thông minh được thiết kế chuyên biệt cho công tác quản lý vật tư kỹ thuật cơ điện, chiếu sáng, phụ tùng, hóa chất và bảo hộ lao động tại **Nhà ga Quốc tế T2 - Cảng HKQT Đà Nẵng**.  
Hệ thống giải quyết triệt để các bài toán:
* Quản lý tập trung hơn **600 mã danh mục vật tư** chuẩn quy cách.
* **Đối chiếu số liệu tự động** giữa Tờ trình mua sắm của Phòng Kỹ thuật với số lượng thực tế nhập/xuất kho qua từng đợt.
* Khắc phục hoàn toàn tình trạng **tắc nghẽn xuất kho thi công** khi nhà cung cấp giao hàng nhiều đợt.
* Tra cứu thẻ kho, báo cáo tổng hợp Nhập - Xuất - Tồn và kiểm soát tồn kho tức thời bằng AI.

### 1.2. Đăng nhập hệ thống
1. Truy cập vào địa chỉ website của phần mềm trên trình duyệt (Google Chrome, Microsoft Edge, Cốc Cốc hoặc Safari).
2. Nhập **Email / Tên đăng nhập** và **Mật khẩu** đã được cấp.
3. Nhấn nút **"Đăng Nhập"** để vào hệ thống.
> 💡 **Lưu ý bảo mật:**  
> Sau khi đăng nhập lần đầu, hãy nhấn vào **Tên tài khoản ở góc trên bên phải** $\rightarrow$ chọn **"Đổi Mật Khẩu"** để đổi sang mật khẩu cá nhân mới của bạn.

---

# 2. HƯỚNG DẪN DÀNH CHO NHÂN VIÊN (THỦ KHO / KỸ THUẬT VIÊN)

---

## 2.1. Tra cứu & Quản lý Danh mục Vật tư (>600 mã DN)
*(Vào menu bên trái: **Danh Mục Vật Tư**)*

* **Tra cứu nhanh:** Gõ từ khóa vào ô tìm kiếm (tìm theo **Mã vật tư**, **Tên vật tư**, **Quy cách kỹ thuật** hoặc **Vị trí kệ/ngăn**). Ví dụ: gõ `DN_01`, `bóng đèn led`, `cầu chì`, `kệ A1`.
* **Lọc theo nhóm:** Chọn nhanh danh mục như *Vật tư Điện*, *Vật tư Nước & Đường ống*, *Phụ tùng thay thế*, *Dụng cụ & Đồ bảo hộ*, *Hóa chất vệ sinh*.
* **Xem thông tin chi tiết:** Bấm vào biểu tượng con mắt (👁️) hoặc nhấp trực tiếp vào dòng vật tư để xem:
  * Số lượng tồn kho hiện tại.
  * Định mức an toàn: **Tồn tối thiểu (Min)** và **Tồn tối đa (Max)**.
  * Đơn giá mua gần nhất & Đơn vị tính chuẩn.
  * Lịch sử giao dịch gần đây của vật tư.
* **Thêm mới vật tư (nếu được phân quyền):** Nhấn nút **"+ Thêm Vật Tư Mới"** $\rightarrow$ Điền thông tin: Mã vật tư (định dạng `DN_xxx`), Tên vật tư, Quy cách, ĐVT, Đơn giá, Vị trí kho $\rightarrow$ Nhấn **"Lưu Vật Tư"**.

---

## 2.2. Lập Phiếu Nhập Kho (Theo Tờ trình & Nhập trực tiếp)
*(Vào menu bên trái: **Xuất - Nhập - Tồn** $\rightarrow$ Tab **Phiếu Kho**)*

1. Nhấn nút **"+ Tạo Phiếu Mới"** (hoặc bấm phím tắt nếu có).
2. **Chọn Loại Phiếu:** Chọn **"Phiếu Nhập Kho"** (Màu xanh dương).
3. **Căn cứ Tờ trình Mua sắm (Quan trọng):**
   * Tại ô *Căn Cứ Tờ Trình Mua Sắm*, gõ số tờ trình (ví dụ: `17` hoặc `17-DNCT/PKT`).
   * Hệ thống sẽ **tự động hoàn thiện hậu tố `-DNCT/PKT`** và hiển thị thông tin Tờ trình tương ứng.
   * Ngay khi nhận diện Tờ trình, hệ thống sẽ hiện nút: **"⚡ Nạp Tự Động Toàn Bộ Vật Tư Theo Tờ Trình"** hoặc **"Nạp các món còn thiếu"**. Nhấn vào đây để danh sách vật tư tự động điền vào bảng.
4. **Nhập kho trực tiếp / Không theo Tờ trình:**  
   * Nếu nhập hàng tồn thừa, nhập hoàn kho sau thi công, bạn để trống ô Tờ trình và chọn trực tiếp mã vật tư tại bảng chi tiết.
5. **Điền số lượng và đơn giá:**
   * Kiểm tra và chỉnh sửa số lượng thực tế nhận được theo biên bản giao nhận.
6. **Đính kèm chứng từ / Hóa đơn:**
   * Bạn có thể tải lên ảnh biên bản giao hàng, phiếu giao nhận của nhà cung cấp hoặc hóa đơn để Quản lý dễ dàng kiểm tra đối chiếu.
7. **Lưu & Gửi Duyệt:**
   * Nhấn nút **"Tạo Phiếu Kho"**. Phiếu sẽ ở trạng thái **CHỜ DUYỆT (PENDING)** và thông báo đến Quản lý.

---

## 2.3. Nghiệp vụ Nhập Hàng Nhiều Đợt (Giao thiếu / Giao từng phần)

> 🌟 **ĐẶC ĐIỂM QUAN TRỌNG:**  
> Khi Nhà cung cấp chỉ giao một phần hàng theo Tờ trình (ví dụ Tờ trình có 10 món nhưng đợt 1 NCC chỉ giao được 6 món, hoặc món A cần 100 cái nhưng mới giao 40 cái):

* **Cách thực hiện:**
  1. Khi tạo Phiếu Nhập đợt 1, bạn chỉ nhập **đúng số lượng thực nhận tại kho** (các món chưa giao có thể xóa khỏi phiếu hoặc để số lượng = 0).
  2. Gửi phiếu cho Quản lý phê duyệt đợt 1.
  3. Khi Quản lý duyệt phiếu đợt 1, **tồn kho thực tế của các món đã nhận được cộng ngay vào kho** để có thể xuất dùng ngay lập tức.
  4. Tờ trình sẽ tự động cập nhật tiến độ (ví dụ: *Đã nhập 60% - Còn thiếu 4 món*), hoàn toàn không bị đóng lại.

---

## 2.4. Lập Phiếu Xuất Kho Thi Công (Xuất ngay vật tư sẵn có)

> 🚀 **GIẢI PHÁP THÔNG SUỐT:** Không cần chờ Tờ trình giao đủ 100%, bạn có thể xuất ngay các vật tư đã về kho đợt 1 để đưa ra công trường thi công!

### Cách 1: Xuất nhanh trực tiếp từ Tờ trình (Khuyên dùng)
1. Vào mục **Xuất - Nhập - Tồn** $\rightarrow$ chọn tab **"Đối Chiếu Tờ Trình"**.
2. Tìm đến Tờ trình cần xuất vật tư.
3. Trên thẻ Tờ trình, hệ thống sẽ hiện nút màu cam:  
   **"↗️ Xuất Kho Sẵn Có (N món)"** (N là số lượng vật tư trong Tờ trình đã có tồn kho).
4. Bấm vào nút này, hệ thống sẽ tự động mở form Tạo Phiếu Xuất, điền sẵn thông tin Tờ trình và nạp chính xác các mặt hàng có tồn kho khả dụng kèm số lượng tối đa có thể xuất.
5. Kiểm tra lại số lượng thực tế cần xuất ra công trường $\rightarrow$ Nhấn **"Tạo Phiếu Kho"**.

### Cách 2: Tạo phiếu xuất kho thủ công
1. Tại tab **Phiếu Kho**, nhấn **"+ Tạo Phiếu Mới"** $\rightarrow$ Chọn **"Phiếu Xuất Kho"** (Màu cam).
2. Điền số Tờ trình (nếu xuất theo dự án/công trình) hoặc điền lý do xuất kho (ví dụ: *Xuất thay bóng đèn khu vực Check-in ga đi T2*).
3. Nếu điền số Tờ trình, hệ thống sẽ hiện nút **"Nạp các vật tư sẵn có trong kho"**.
4. Chọn người nhận, bộ phận sử dụng $\rightarrow$ Nhấn **"Tạo Phiếu Kho"**.

---

## 2.5. Theo Dõi Đối Chiếu Tờ Trình & Nhập Bổ Sung
*(Tab **Đối Chiếu Tờ Trình**)*

* **Cột màu sắc trực quan:**
  * 🟢 **ĐÃ ĐỦ SỐ LƯỢNG (100%):** Tờ trình đã nhập đủ toàn bộ các mặt hàng.
  * 🟡 **CÒN THIẾU X MẶT HÀNG (Y%):** Tờ trình đang trong quá trình nhập từng đợt, hiển thị rõ số lượng đề xuất, số đã nhập lũy kế và số còn nợ.
  * 🟣 **ĐÃ CHỐT ĐÓNG SỚM:** Tờ trình đã được Quản lý chốt kết thúc theo số thực nhận.
  * ⚪ **CHƯA NHẬP KHO (0%):** Tờ trình vừa duyệt, chưa có đợt hàng nào về kho.
* **Nút "Nhập Bổ Sung Số Còn Thiếu":**  
  Khi nhà cung cấp giao tiếp đợt 2/đợt 3, bạn chỉ cần bấm nút này $\rightarrow$ Hệ thống tự động lọc ra đúng các mặt hàng còn thiếu và điền số lượng còn nợ vào phiếu nhập mới.

---

## 2.6. Tra Cứu Thẻ Kho & Báo Cáo Nhập - Xuất - Tồn
*(Vào menu bên trái: **Thẻ Kho & Báo Cáo NXT**)*

* **Tra cứu Thẻ Kho từng mã:**
  1. Chọn mã vật tư cần xem.
  2. Chọn khoảng thời gian (Từ ngày - Đến ngày).
  3. Hệ thống hiển thị chi tiết từng dòng phát sinh: *Tồn đầu kỳ, Ngày chứng từ, Số phiếu, Diễn giải nhập/xuất, Số lượng Nhập, Số lượng Xuất, Tồn cuối kỳ*.
* **Báo Cáo Tổng Hợp Nhập - Xuất - Tồn:**
  1. Xem bảng tổng hợp toàn bộ >600 mã vật tư trong kho.
  2. Theo dõi tổng giá trị tồn kho theo đơn giá bình quân/đơn giá mua.
  3. Bấm **"Xuất File Excel"** hoặc **"In Báo Cáo A4"** để phục vụ công tác kiểm kê, thanh quyết toán định kỳ.

---

## 2.7. Sử Dụng Trợ Lý AI Kho Thông Minh
*(Vào menu bên trái: **Trợ Lý AI Kho** hoặc nhấn nút AI nhanh trên thanh Header)*

Trợ lý AI được tích hợp công nghệ Gemini giúp bạn tra cứu bằng ngôn ngữ tự nhiên:
* *Ví dụ câu hỏi mẫu:*
  * "Kiểm tra trong kho còn bao nhiêu cuộn băng keo điện và bóng đèn LED 18W?"
  * "Những vật tư nào hiện tại đang có tồn kho dưới mức tối thiểu cần mua gấp?"
  * "Tờ trình 17-DNCT/PKT đã nhập được bao nhiêu % rồi, còn thiếu những món gì?"
  * "Tổng giá trị vật tư xuất kho trong tháng này là bao nhiêu?"

---

# 3. HƯỚNG DẪN DÀNH CHO QUẢN LÝ (TRƯỞNG PHÒNG / ADMIN)

---

## 3.1. Bảng Điều Khiển Tổng Quan (Dashboard) & Cảnh Báo An Toàn
*(Menu **Tổng Quan**)*

Bảng điều khiển cung cấp cái nhìn toàn cảnh về tình hình kho vật tư phục vụ điều hành:
1. **Chỉ số trọng yếu (KPIs):**
   * Tổng số mã vật tư đang quản lý.
   * Tổng giá trị tài sản vật tư trong kho (VNĐ).
   * Số lượng phiếu kho đang chờ phê duyệt.
   * Số lượng Tờ trình đang thực hiện nhập hàng.
2. **Cảnh Báo Ngưỡng Tồn Kho An Toàn (Alerts):**
   * ⚠️ **Cảnh báo Tồn Dưới Mức Tối Thiểu (Low Stock):** Danh sách các vật tư sắp hết hàng trong kho cần lập Tờ trình mua sắm bổ sung khẩn cấp để đảm bảo vận hành nhà ga.
   * 📦 **Cảnh báo Tồn Vượt Mức Tối Đa (Over Stock):** Danh sách các vật tư tồn đọng cao, vượt định mức dự trữ.
3. **Biểu đồ Biến Động Nhập - Xuất:** Theo dõi lưu lượng luân chuyển vật tư theo tuần, tháng.

---

## 3.2. Kiểm Tra & Phê Duyệt Phiếu Kho Điện Tử
*(Menu **Xuất - Nhập - Tồn** $\rightarrow$ Thông báo màu vàng ở đầu trang hoặc lọc phiếu **"Chờ Duyệt"**)*

1. **Thông báo nổi bật:** Khi có phiếu mới cần duyệt, trên thanh Navbar trên cùng và cạnh tab *Xuất - Nhập - Tồn* sẽ hiện số lượng phiếu chờ.
2. **Kiểm tra thông tin phiếu:**
   * Bấm vào phiếu để xem chi tiết danh sách vật tư, số lượng, đơn giá, thành tiền, lý do nhập/xuất và file ảnh/chứng từ đính kèm.
   * Đối với phiếu nhập theo Tờ trình: hệ thống sẽ hiển thị thanh đối soát tiến độ để Quản lý nắm rõ đợt nhập này chiếm bao nhiêu % Tờ trình.
3. **Thao tác Phê Duyệt:**
   * Nhấn nút **"✅ Phê Duyệt Phiếu"** (Màu xanh lá): Phiếu chính thức có hiệu lực, số liệu tồn kho được cập nhật tức thì.
   * Nhấn nút **"❌ Từ Chối Phiếu"** (Màu đỏ): Nhập lý do từ chối (ví dụ: *Sai quy cách vật tư, đề nghị kiểm tra lại số lượng thực nhận*) để nhân viên chỉnh sửa lại.

---

## 3.3. Quản Lý & Tạo Mới Tờ Trình Mua Sắm
*(Menu **Xuất - Nhập - Tồn** $\rightarrow$ Tab **Đối Chiếu Tờ Trình**)*

1. **Tạo Tờ Trình Mới:**
   * Nhấn nút **"+ Tạo Tờ Trình Mới"**.
   * Nhập **Số Tờ trình** (ví dụ: `29-DNCT/PKT`), **Tiêu đề**, **Phòng ban lập**, **Ngày ký duyệt**.
   * Chọn danh sách các vật tư cần mua sắm và **Số lượng đề xuất phê duyệt**.
   * Đính kèm bản scan Tờ trình / Văn bản phê duyệt (ảnh hoặc tài liệu) $\rightarrow$ Nhấn **"Lưu Tờ Trình"**.
2. **Theo dõi tiến độ nhà cung cấp:**  
   * Quản lý có thể xem nhanh Tờ trình nào đã được NCC giao đủ 100%, Tờ trình nào giao chậm, còn thiếu bao nhiêu % để đôn đốc nhà thầu.

---

## 3.4. Tính Năng "Chốt Đóng Tờ Trình Sớm" (Nghiệm Thu Thực Nhận)

> 🎯 **ỨNG DỤNG NGHIỆP VỤ:**  
> Xử lý tình huống Tờ trình đã nhập được 80% hoặc 90%, nhưng nhà cung cấp thông báo hết hàng, ngưng sản xuất hoặc phòng kỹ thuật điều chỉnh thiết kế không nhập phần còn lại.

* **Cách thực hiện:**
  1. Tại thẻ Tờ trình (trong tab *Đối Chiếu Tờ Trình*), Quản lý bấm nút **"🔒 Chốt Đóng Tờ Trình"**.
  2. Nhập lý do chốt đóng (ví dụ: *Nghiệm thu thanh toán theo số lượng thực nhận đợt 1, hủy 2 món còn thiếu do NCC hết hàng*).
  3. Bấm **"Xác Nhận Chốt Đóng"**.
  4. Tờ trình sẽ chuyển sang màu tím với trạng thái **"ĐÃ CHỐT ĐÓNG SỚM"**, giải phóng bảng đối soát, không còn báo nợ hàng nhưng vẫn lưu lại đầy đủ lịch sử các đợt nhập/xuất trước đó.

---

## 3.5. Quản Lý & Sửa / Xóa Chứng Từ Sai
*(Menu **Sửa & Xóa Chứng Từ Sai** - Chỉ dành riêng cho Admin/Quản lý)*

Nhằm đảm bảo tính toàn vẹn dữ liệu nhưng vẫn linh hoạt xử lý sai sót nhập liệu:
* **Sửa phiếu đã duyệt:** Cho phép điều chỉnh lại số lượng, đơn giá, ghi chú trong trường hợp nhập sai số liệu. Hệ thống tự động tính toán lại tồn kho hiện tại tương ứng.
* **Hoàn tác / Xóa phiếu sai:** Nếu nhân viên tạo trùng phiếu hoặc lập nhầm, Quản lý có thể hủy/xóa phiếu. Tồn kho của vật tư sẽ được tự động hoàn lại đúng trạng thái ban đầu.
* **Nhật ký chỉnh sửa:** Mọi thao tác sửa/xóa đều được lưu vết minh bạch phục vụ kiểm toán nội bộ.

---

## 3.6. Phân Quyền Người Dùng & Quản Trị Hệ Thống
*(Dành riêng cho Quản trị viên cao cấp `vn.phuoc235@gmail.com`)*

1. **Quản lý Tài Khoản (Menu *Phân Quyền Người Dùng*):**
   * Tạo tài khoản mới cho nhân viên mới vào làm việc.
   * Phân quyền vai trò:
     * **USER (Nhân viên / Thủ kho):** Được tạo phiếu, tra cứu danh mục, xem thẻ kho, báo cáo, hỏi AI.
     * **ADMIN (Quản lý / Trưởng phòng):** Toàn quyền phê duyệt phiếu, tạo tờ trình, sửa/xóa chứng từ sai, chốt đóng tờ trình.
   * Đặt lại mật khẩu (Reset Password) khi nhân viên quên mật khẩu.
   * Khóa / Kích hoạt tài khoản nhân viên.
2. **Cài Đặt Hệ Thống (Menu *Cài Đặt Hệ Thống*):**
   * Tùy chỉnh Logo Cảng Hàng Không / Doanh nghiệp trên phiếu in.
   * Quản lý danh mục Đơn vị tính (Cái, Bộ, Mét, Cuộn, Kg, Hộp...).
   * **Import Tồn Kho Đầu Kỳ từ File Excel:** Hỗ trợ nạp nhanh hàng trăm mã vật tư từ file Excel vào hệ thống khi bắt đầu kỳ kiểm kê mới.
   * Sao lưu (Backup) & Khôi phục dữ liệu hệ thống.

---

# 4. QUY TRÌNH NGHIỆP VỤ MẪU & CÁC TÌNH HUỐNG THỰC TẾ (SCENARIOS & FAQ)

### ❓ Tình huống 1: Nhà cung cấp giao hàng làm 3 đợt, mỗi đợt cách nhau 1 tuần. Nhân viên phải làm thế nào?
* **Bước 1 (Đợt 1):** Nhân viên tạo Phiếu Nhập, điền số Tờ trình, chỉ nhập các món và số lượng thực nhận đợt 1 $\rightarrow$ Gửi Quản lý duyệt $\rightarrow$ Hàng đợt 1 vào kho.
* **Bước 2 (Xuất thi công đợt 1):** Vào tab *Đối Chiếu Tờ Trình* bấm **"Xuất Kho Sẵn Có"** để xuất dùng ngay cho công trình.
* **Bước 3 (Đợt 2 & 3):** Khi hàng về tiếp, vào tab *Đối Chiếu Tờ Trình* bấm **"Nhập Bổ Sung Số Còn Thiếu"** $\rightarrow$ Hệ thống tự điền số còn nợ $\rightarrow$ Gửi Quản lý duyệt. Khi đủ 100%, Tờ trình tự động chuyển sang màu xanh lá.

### ❓ Tình huống 2: Cần in phiếu xuất kho hoặc phiếu nhập kho ra giấy A4 có chữ ký thì làm ở đâu?
* Vào menu **Xuất - Nhập - Tồn** $\rightarrow$ Bấm vào phiếu cần in $\rightarrow$ Nhấn nút **"🖨️ In Phiếu A4"**.
* Hệ thống sẽ tạo mẫu in chuẩn kế toán có đầy đủ Quốc hiệu, Tiêu ngữ, Tên đơn vị AHT, Số phiếu, Ngày lập, Bảng vật tư chi tiết và các ô chữ ký: *Thủ kho, Người nhận/giao hàng, Kế toán, Trưởng bộ phận duyệt*.

### ❓ Tình huống 3: Làm sao để kiểm tra nhanh một mã vật tư đang để ở ngăn kệ nào trong kho?
* Bạn có thể gõ mã hoặc tên vào thanh **Tìm kiếm nhanh** ở đầu trang hoặc vào mục **Trợ Lý AI** hỏi: *"Mã DN_12 đang để ở vị trí nào?"*. AI sẽ phản hồi ngay vị trí Kệ - Tầng - Ngăn tương ứng.

### ❓ Tình huống 4: Khi nhà cung cấp thông báo món cuối cùng bị đứt hàng không sản xuất nữa?
* Quản lý vào tab **Đối Chiếu Tờ Trình** $\rightarrow$ Bấm nút **"Chốt Đóng Tờ Trình"** $\rightarrow$ Nhập lý do $\rightarrow$ Xác nhận. Quy trình được khép lại an toàn mà không bị treo tiến độ.

---

# 5. MẸO NHANH & PHÍM TẮT THAO TÁC

| Mục Tiêu | Thao Tác Nhanh |
| :--- | :--- |
| **Tìm kiếm vật tư siêu tốc** | Bấm vào ô tìm kiếm AI ở giữa thanh Header hoặc gõ mã không dấu. |
| **Điền nhanh số Tờ trình** | Chỉ cần gõ số (VD: `17` hoặc `29`), rời chuột ra ngoài hệ thống tự điền `-DNCT/PKT`. |
| **Nạp danh sách vật tư theo Tờ trình** | Bấm nút màu tím *"⚡ Nạp Tự Động"* để tiết kiệm 90% thời gian nhập tay. |
| **Xuất vật tư thi công ngay** | Bấm *"↗️ Xuất Kho Sẵn Có"* trong tab Đối Chiếu Tờ Trình. |
| **Đổi giao diện Sáng / Tối** | Bấm biểu tượng ☀️ / 🌙 trên góc phải thanh Header để làm việc dịu mắt. |
| **Xem trên điện thoại / Tablet** | Giao diện tự động co giãn tối ưu, bấm menu 3 gạch (☰) góc trái để mở điều hướng. |

---

*Tài liệu được ban hành và cập nhật định kỳ bởi Bộ Phận Kỹ Thuật & Quản Trị Hệ Thống AHT.*  
*Mọi thắc mắc và hỗ trợ kỹ thuật, xin vui lòng liên hệ Ban Quản Trị Hệ Thống qua email: vn.phuoc235@gmail.com.*
