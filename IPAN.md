import os

# Define the content for the Markdown file
markdown_content = """# TÀI LIỆU USER STORY - DỰ ÁN IPANMOVIE

## I. CÁC BÊN LIÊN QUAN (STAKEHOLDERS)
* **End User:** Người xem phim, tìm kiếm trải nghiệm giải trí cá nhân hóa.
* **Administrator (Admin):** Quản trị viên quản lý nội dung và người dùng.
* **Development Team:** Đội ngũ phát triển (Frontend, Backend, AI/ML Engineer).

---

## II. PRODUCT BACKLOG: QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG

| ID | User Story | SP | Acceptance Criteria (AC) |
|:---|:---|:---:|:---|
| **1** | Là người dùng mới, tôi muốn đăng ký tài khoản bằng Email hoặc Social (Google) để truy cập nội dung cá nhân hóa. | | 1. Hệ thống gửi mail xác thực (OTP/Link) sau khi đăng ký.<br>2. Kiểm tra định dạng email và độ mạnh mật khẩu.<br>3. Chống trùng lặp tài khoản. |
| **2** | Là thành viên, tôi muốn thiết lập Profile (Avatar, Tên) để phân biệt các người dùng trong cùng một tài khoản. | | 1. Cho phép tạo tối đa 5 profile (giống Netflix).<br>2. Mỗi profile có danh sách phim yêu thích riêng.<br>3. Có tùy chọn đặt mã PIN cho từng profile. |
| **3** | Là người dùng, tôi muốn có thể đăng nhập tài khoản sau khi đã đăng ký. | | 1. Hỗ trợ đăng nhập qua Email/Mật khẩu hoặc Google.<br>2. Có tính năng "Quên mật khẩu" qua Email. |

---

## III. PRODUCT BACKLOG: HỆ THỐNG SEARCH

| ID | User Story | SP | Acceptance Criteria (AC) |
|:---|:---|:---:|:---|
| **1** | Là người dùng, tôi muốn tìm kiếm phim theo tên, diễn viên hoặc đạo diễn để tìm nội dung nhanh chóng. | | 1. Hiển thị gợi ý (Auto-suggest) khi người dùng nhập từ khóa.<br>2. Hỗ trợ tìm kiếm không dấu và sửa lỗi chính tả nhẹ.<br>3. Kết quả trả về dưới 1 giây. |
| **2** | Là người dùng, tôi muốn lọc phim theo thể loại, năm phát hành, quốc gia và điểm đánh giá. | | 1. Bộ lọc có thể kết hợp nhiều tiêu chí cùng lúc.<br>2. Hiển thị số lượng phim tương ứng với mỗi bộ lọc.<br>3. Có nút "Reset" để xóa nhanh các tiêu chí lọc. |
| **3** | Là người dùng, tôi muốn xem trang chi tiết phim với đầy đủ thông tin (Trailer, mô tả, diễn viên, điểm số). | | 1. Trailer tự động phát (mặc định tắt tiếng).<br>2. Hiển thị danh sách tập (nếu là phim bộ).<br>3. Đề xuất các phim tương tự bên dưới. |

---

## IV. PRODUCT BACKLOG: TƯƠNG TÁC & TRẢI NGHIỆM XEM

| ID | User Story | SP | Acceptance Criteria (AC) |
|:---|:---|:---:|:---|
| **1** | Là người dùng, tôi muốn thêm phim vào "Danh sách của tôi" để xem sau. | | 1. Icon "Thêm vào danh sách" dễ thấy ở poster phim.<br>2. Đồng bộ danh sách trên mọi thiết bị.<br>3. Thông báo nếu phim trong danh sách sắp bị gỡ bỏ. |
| **2** | Là người dùng, tôi muốn đánh giá (Like/Dislike hoặc Sao) và để lại bình luận về phim. | | 1. Chống spam bình luận (giới hạn tần suất).<br>2. Cho phép phản hồi (Reply) bình luận của người khác.<br>3. Hệ thống tính điểm trung bình dựa trên đánh giá người dùng. |

---

## V. PRODUCT BACKLOG: ADMIN QUẢN LÝ HỆ THỐNG

| ID | User Story | SP | Acceptance Criteria (AC) |
|:---|:---|:---:|:---|
| **1** | Là Admin, tôi muốn quản lý kho phim (Thêm, sửa, xóa phim và tập phim). | | 1. Giao diện upload file phim hoặc nhúng link từ server lưu trữ.<br>2. Quản lý metadata phim (Poster, diễn viên, năm...). |
| **2** | Là Admin, tôi muốn quản lý người dùng. | | 1. Có giao diện quản lý danh sách người dùng và các account.<br>2. Có khả năng khóa/mở khóa tài khoản vi phạm. |

---

## VI. CHI TIẾT CÁC EPIC & LUỒNG NGHIỆP VỤ

### Epic 1: Quản lý Tài khoản & Cá nhân hóa (Account & Profiles)

#### US 1.1: Đăng ký tài khoản bằng Email hoặc Google OAuth 2.0
* **Luồng chính (Happy Path):**
    1. Người dùng nhập Email hợp lệ và Mật khẩu (tối thiểu 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt).
    2. Hệ thống mã hóa mật khẩu (ví dụ: bcrypt/Argon2) trước khi lưu vào database.
    3. Hệ thống tạo mã OTP (6 số, hiệu lực 5 phút) hoặc Link kích hoạt gửi qua Email.
    4. Người dùng nhập đúng OTP -> Đổi trạng thái tài khoản thành Active.
* **Luồng ngoại lệ (Edge Cases):**
    * Nếu Email đã tồn tại: Hiển thị lỗi "Email đã được đăng ký. Vui lòng đăng nhập."
    * Nếu OTP hết hạn: Cung cấp nút "Gửi lại OTP" (giới hạn 3 lần gửi/ngày).
* **Tech & Security Notes:**
    * Chống SQL Injection và XSS trên form đăng ký.
    * Giao thức mạng: Bắt buộc HTTPS.

#### US 1.2: Thiết lập Profile người dùng
* **Luồng chính:**
    1. Tài khoản mới mặc định có 1 Profile.
    2. Người dùng click "Thêm Profile" (tối đa 5). Giao diện hiển thị kho Avatar có sẵn.
    3. Cho phép bật/tắt chế độ "Kids" (Chỉ hiển thị phim phân loại G, PG).
* **Tech Notes:**
    * Cấu trúc dữ liệu: Bảng `Profiles` quan hệ 1-N với `Users`.
    * Mỗi Profile có `profile_id` riêng để theo dõi lịch sử xem độc lập.

### Epic 2: Hệ thống Tìm kiếm & Khám phá (Search & Discovery)

#### US 2.1: Tìm kiếm phim đa năng
* **Luồng chính:**
    1. Người dùng gõ từ khóa (sau 3 ký tự/debounce 300ms), hiển thị Auto-suggest tối đa 5 kết quả (Thumbnail, Tên phim, Năm).
    2. Ấn Enter để vào trang kết quả dạng Grid.
* **Tech Notes:**
    * Sử dụng **Fuzzy Search** (cho phép sai sót chính tả nhẹ).
    * Tối ưu hóa bằng Full-Text Search hoặc Elasticsearch. Latency < 500ms.

#### US 2.2: Trang chi tiết và Gợi ý thông minh
* **Luồng chính:**
    1. Hiển thị Backdrop, Poster, Metadata, Điểm số, Dàn diễn viên.
    2. Trailer tự động phát ở background (tắt tiếng).
    3. **Phần "Phim tương tự":** Sử dụng mô hình **Hybrid Recommendation System** (kết hợp Content-based Filtering và Collaborative Filtering).
* **UI/UX:** Sử dụng Skeleton Loading khi tải dữ liệu.

### Epic 3: Tương tác người dùng (Interaction)

#### US 3.1: Đánh giá và Bình luận
* **Luồng chính:**
    1. Người dùng chọn Rating (1-5 sao). Dữ liệu cập nhật ngay vào Rating Matrix cho mô hình AI.
    2. Viết bình luận (max 500 ký tự).
* **Tech Notes:**
    * **Spam filter:** Giới hạn 1 bình luận/phút/profile.
    * **Pagination:** Áp dụng Infinite Scroll (mỗi lần fetch 10 comments).

#### US 3.2: Danh sách của tôi (Watchlist)
* **Tech Notes:** Sử dụng **Optimistic UI update** để thay đổi trạng thái icon lập tức trước khi gọi API thành công.

### Epic 4: Quản trị Hệ thống (Admin Console)

#### US 4.1: Quản lý kho phim & Video Encoding
* **Luồng chính:**
    1. Thêm mới: Hỗ trợ "Fetch từ TMDB" để tự động điền thông tin.
    2. Upload Video: Encode ra nhiều độ phân giải (1080p, 720p, 480p).
* **Tech Notes:**
    * Lưu trữ trên AWS S3 hoặc CDN.
    * **Soft Delete:** Sử dụng flag `is_deleted` để bảo toàn dữ liệu lịch sử.
"""

# Save to a file
file_path = "IPANMovie_UserStories.md"
with open(file_path, "w", encoding="utf-8") as f:
    f.write(markdown_content)

print(file_path)