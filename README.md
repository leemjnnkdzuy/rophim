<div align="center">
  <h1>NỀN TẢNG RẠP PHIM (MOVIE STREAMING PLATFORM)</h1>
  <p>Hệ thống xem phim và quản lý nội dung phim trực tuyến hiện đại</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.2.3-blue?style=for-the-badge" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-7.1-green?style=for-the-badge" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-cyan?style=for-the-badge" alt="Tailwind" />
  </p>
</div>

<br />

> Dự án Rạp Phim là một ứng dụng Web Fullstack cung cấp giải pháp phát trực tuyến phim chất lượng cao. Hệ thống bao gồm giao diện người dùng tối ưu trải nghiệm (UI/UX) và một hệ thống phân hệ quản trị (Admin Dashboard) mạnh mẽ nhằm kiểm soát toàn bộ nội dung, thành viên, và bình luận.

---

## MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Tính Năng Nổi Bật](#2-tính-năng-nổi-bật)
3. [Công Nghệ Đi Kèm](#3-công-nghệ-đi-kèm)
4. [Cấu Trúc Thư Mục](#4-cấu-trúc-thư-mục)
5. [Hướng Dẫn Cài Đặt](#5-hướng-dẫn-cài-đặt)
6. [Tập Lệnh Kịch Bản (Scripts)](#6-tập-lệnh-kịch-bản--scripts)

---

## 1. TỔNG QUAN DỰ ÁN

Dự án này được xây dựng trên kiến trúc **App Router** mới nhất của Next.js 16, mang lại khả năng kết xuất phía máy chủ (SSR) mạnh mẽ và tối ưu hoá chuẩn SEO. Nó không chỉ là nền tảng xem phim với trình phát video `HLS.js` mượt mà, mà còn tích hợp các hệ thống tự động hoá như Crawler (tự động cào dữ liệu phim) bằng TypeScript. 

Phương châm thiết kế của dự án nhấn mạnh vào tính tối giản, loại bỏ các chi tiết thừa thãi, tối ưu hoá hiệu năng bằng việc kết hợp React 19 cùng Tailwind CSS v4.

---

## 2. TÍNH NĂNG NỔI BẬT

### Dành Cho Người Dùng Tham Gia
* **Hệ Thống Phân Phối Video Mượt Mà:** Sử dụng thư viện HLS (HTTP Live Streaming) nhằm hỗ trợ phát trực tuyến phân giải cao ngay cả ở điều kiện mạng không ổn định.
* **Xác Thực Đa Bộ Xác Chỉnh:** Cung cấp cơ chế đăng nhập, đăng ký, quên/đặt lại mật khẩu mạnh mẽ mã hoá bằng `bcryptjs` và truyền tải thông qua `JWT`.
* **Cá Nhân Hoá:** Tuỳ chỉnh giao diện hồ sơ, khả năng thay đổi Email / Username.
* **Tương Tác Phim Chuyên Sâu:** Bộ lọc chi tiết theo Thể loại (Genres), Quốc gia (Countries), Năm phát hành; lưu danh sách phim yêu thích (Saved Movies); lịch sử xem tự động lưu (Watch History).

### Dành Cho Quản Trị Viên (Admin)
* **Tổng Quan (Main Dashboard):** Thống kê số lượng truy cập, phim, phản hồi theo dải thời gian thực.
* **Quản Lý Nội Dung (Films / Home Content):** Tuỳ chỉnh nội dung hiển thị ở trang chủ, thêm xoá sửa thông tin phim, hỗ trợ kéo thả giao diện (kết hợp `@dnd-kit`).
* **Quản Lý Báo Cáo & Thành Viên:** Kiểm duyệt bình luận (Comments Dashboard), phong toả và mở khoá tài khoản (Members Dashboard).

### Tiện Ích Tự Động
* **Crawl Tool:** Cung cấp `crawlFilms.ts` được chạy bởi trình thực thi TSX, tự động quét và cập nhật hàng nghìn dữ liệu (metadata) của phim từ các nguồn ngoại vi.

---

## 3. CÔNG NGHỆ ĐI KÈM

<table>
  <thead>
    <tr>
      <th>Phân Hệ</th>
      <th>Công Nghệ/Thư Viện Phụ Thuộc</th>
      <th>Công Dụng Chi Tiết</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="6"><b>FRONTEND</b></td>
      <td><b>Next.js 16.1</b></td>
      <td>Khung ứng dụng React với App Router, tạo bộ khung tối ưu Fullstack.</td>
    </tr>
    <tr>
      <td><b>React 19.2</b></td>
      <td>Thư viện cốt lõi nâng cấp tính năng Compiler và API mới.</td>
    </tr>
    <tr>
      <td><b>Tailwind CSS v4</b></td>
      <td>Framework CSS sử dụng các class tiện ích, tăng tốc độ thiết kế UI.</td>
    </tr>
    <tr>
      <td><b>Shadcn/UI & Radix UI</b></td>
      <td>Cung cấp các mẫu thành phần giao diện không định kiểu cấu trúc, tối đa hoá khả năng can thiệp trực tiếp.</td>
    </tr>
    <tr>
      <td><b>Framer Motion</b></td>
      <td>Các hiệu ứng chuyển động uyển chuyển, đáp ứng yêu cầu UI cao cấp.</td>
    </tr>
    <tr>
      <td><b>HLS.js</b></td>
      <td>Đảm nhiệm trọng trách làm cầu nối giả lập giao thức phát sóng liên tục HTTP.</td>
    </tr>
    <tr>
      <td rowspan="4"><b>BACKEND</b></td>
      <td><b>MongoDB (7.1)</b></td>
      <td>Lưu trữ dữ liệu phi cấu trúc khối lượng cực lớn, tốc độ truy cập cao.</td>
    </tr>
    <tr>
      <td><b>Mongoose (9.2)</b></td>
      <td>Trình tạo lược đồ dữ liệu Object Data Modeling kết nối tới Node.js.</td>
    </tr>
    <tr>
      <td><b>Bcryptjs & JWT</b></td>
      <td>Mã hoá mật khẩu một chiều, bảo vệ và cấp token xác thực phân quyền API.</td>
    </tr>
    <tr>
      <td><b>Nodemailer</b></td>
      <td>Tích hợp gửi chuỗi thông báo, mã OTP xác thực email trực tuyến vòng lặp.</td>
    </tr>
  </tbody>
</table>

---

## 4. CẤU TRÚC THƯ MỤC

Dự án áp dụng chặt chẽ hướng tiếp cận kiến trúc module của Next.js:

<details>
<summary><b>[ Bấm để mở rộng Cấu trúc Cây thư mục chính ]</b></summary>

```text
/rapphim
├── app
│   ├── api/            # Hệ thống API Routes xử lý BE (Auth, Films, Users)
│   ├── assets/         # Nguồn tĩnh cục bộ (Hình ảnh mặc định, minh hoạ)
│   ├── components/     # Các yếu tố UI tái sử dụng (Header, Footer, Inputs, Buttons)
│   ├── contexts/       # Trạng thái toàn cục React Context (AuthContext...)
│   ├── Dashboards/     # Phân hệ màn hình riêng dành cho Quản Trị Viên (Admin)
│   ├── hooks/          # Tùy biến vòng đời xử lý (useAuth, useFetch...)
│   ├── models/         # Mongoose Schemas (User, Film, Category...)
│   ├── pages/          # Thành phần của toàn bộ trang người dùng tĩnh và động
│   ├── scripts/        # Chứa lệnh thực thi CLI độc lập (Crawl, Migrate Database)
│   ├── services/       # File logic tách rời kết nối qua HTTP/Axios
│   ├── utils/          # Hàm dùng chung chuẩn hóa định dạng Text, Thời gian
│   └── layout.tsx      # Khung xương bao bọc nền trang Web (Hệ thống điều hướng chung)
├── public/             # Phân nhóm tài nguyên công khai, Robots.txt
├── .env                # Biến môi trường hệ thống
├── eslint.config.mjs   # Cấu hình chuẩn hóa code Linting
├── next.config.ts      # Khai báo tuỳ biến Next.js (Image domains, headers)
├── package.json        # Bản kê khai và chỉ định phiển bản thư viện
└── tsconfig.json       # Thiết lập chế độ thông dịch TypeScript của dự án
```
</details>

---

## 5. HƯỚNG DẪN CÀI ĐẶT

Quá trình triển khai dự án diễn ra qua các bước thiết lập môi trường cực kỳ tiêu chuẩn của Node.js:

### Bước 1: Chuẩn bị Môi trường
Hệ thống này yêu cầu tải ứng dụng thực thi tối thiểu (Runtime):
- **Node.js**: Phiên bản >= 20.0
- **NPM** hoặc **Yarn**

### Bước 2: Klon Dữ Liệu và Cài Thư Viện
Tiến hành tải mã nguồn tại đường dẫn cục bộ hoặc từ kho lưu trữ, sau đó mở Terminal tại gốc thư mục dự án `c:\Users\duyle\Desktop\rapphim`.
Cài đặt thư viện bằng lệnh:
```bash
npm install
```

### Bước 3: Tuỳ Chỉnh Biến Môi Trường (Environment Variables)
Sao chép cấu trúc tệp môi trường từ mẫu (nếu có) hoặc tạo tệp `.env` rỗng. Bạn cần liên hệ với người phụ trách khoá mã dự án để hoàn thiện các biến chính sau:

```env
MONGODB_URI=mongodb+srv://...     # URL chuỗi kết nối đến Cluster MongoDB
JWT_SECRET=your_jwt_secret        # Ký xâu JWT mã hoá
# Và các biến cấu hình Cloudinary (Nếu có) hoặc Server SMTP (Nodemailer)
```
*(Tuyệt đối không đẩy file `.env` chứa mật khẩu thực lên kho Git công cộng).*

### Bước 4: Khởi Chạy Dự Án

*   **Chế độ phát triển:**
    ```bash
    npm run dev
    ```
    Hệ thống sẽ hoạt động tại trình duyệt với địa chỉ cục bộ: `http://localhost:3000`

---

## 6. TẬP LỆNH KỊCH BẢN (SCRIPTS)

Tệp `package.json` đã được thiết lập sẵn các câu lệnh cực kỳ hữu dụng phục vụ tiến trình tự động hoá:

| Câu Lệnh Kích Hoạt | Thực Thi Nền Tảng | Mô Tả Ý Nghĩa |
| :--- | :--- | :--- |
| <kbd>npm run dev</kbd> | `next dev` | Khởi động Local Server với tính năng Hot-Reload trực tiếp. Điểm bắt đầu chính. |
| <kbd>npm run build</kbd> | `next build` | Biên dịch toàn bộ định dạng SCSS/TS về bộ Native JS/HTML nén siêu nhẹ cho Production. |
| <kbd>npm run start</kbd> | `next start` | Đưa dự án đã build từ bước trên chạy chính thức để kiểm thử luồng thực tế. |
| <kbd>npm run lint</kbd> | `eslint` | Tiến hành dò quét cấu trúc code toàn bộ dự án, định vị và cảnh báo lỗi lập trình. |
| <kbd>npm run crawl</kbd> | `npx tsx app/scripts/crawlFilms.ts` | **CÔNG CỤ NĂNG SUẤT:** Tự động hoá tải về và cập nhật toàn bộ thư viện phim cho Database. |

---

<div align="center">
  <br />
  <p><b>RẠP PHIM PLATFORM - CREATED WITH PASSION</b></p>
  <i>Hệ thống được thiết kế hướng tới tốc độ, sự tối giản và tối ưu hóa ở cả cấp độ người dùng và trình biên dịch mã gốc. Kiến trúc sẵn sàng nâng cấp và nhân bản.</i>
</div>
