# Prompt New — 13/04/2026
# Xây Dựng Ứng Dụng Quản Lý Nghiệp Vụ Cung Ứng Lao Động

---

## Bối Cảnh Công Ty

Công ty hoạt động trong lĩnh vực **cung ứng công nhân cho các nhà máy tại Bắc Giang**, thông qua mạng lưới **Vendor** (trung gian). Mỗi Vendor có hợp đồng với nhiều nhà máy. Khi nhà máy có nhu cầu tuyển, Vendor thông báo đến công ty để nhân viên Sale tìm và cung cấp công nhân.

---

## Phân Quyền 4 Cấp + CTV

| Role | Mô tả | Đăng nhập |
|------|--------|-----------|
| **Admin** | Quản trị hệ thống: config, quản lý user, phân quyền | Có |
| **Giám đốc** | Xem toàn bộ báo cáo, duyệt | Có |
| **Trưởng nhóm** | Quản lý đơn tuyển, giao việc cho Sale trong nhóm | Có |
| **Nhân viên Sale** | Nhận đơn, cập nhật công nhân đã cung cấp, xem lương dự kiến | Có |
| **CTV (Cộng tác viên)** | Giới thiệu công nhân, do Sale quản lý | **Không** |

---

## Loại Hình Lao Động

- **Thời vụ (SEASONAL)**: Hợp đồng ngắn hạn
- **Chính thức (PERMANENT)**: Hợp đồng dài hạn

Áp dụng tại 3 cấp: Vendor ↔ Nhà máy, Đơn tuyển dụng, Công nhân.

---

## Các Đối Tượng Cần Quản Lý

### 1. Vendor
- Tên Vendor, người liên hệ, số điện thoại
- Danh sách nhà máy đang hợp tác (kèm loại hình: Thời vụ / Chính thức)

### 2. Cộng Tác Viên (CTV)
- Họ tên, SĐT, CCCD, địa chỉ, thông tin ngân hàng
- Sale quản lý, danh sách CN đã giới thiệu
- Không có tài khoản đăng nhập hệ thống

### 3. Đơn Tuyển Dụng (từ Vendor)
- Tên nhà máy, Vendor phụ trách
- Loại hình: Thời vụ / Chính thức
- Thông tin người cần tuyển (giới tính, độ tuổi, yêu cầu)
- Số lượng công nhân cần
- Hoa hồng từ Vendor: X.000đ / 1 công nhân / 1 giờ làm
- Thưởng đặc biệt cho công ty: ví dụ 1.000.000đ/CN sau khi làm đủ 7 ngày
- Trạng thái đơn: `Mới` / `Đang tuyển` / `Đã đủ` / `Đóng`

### 4. Công Nhân (Ứng Viên)
- Họ tên, CCCD, số điện thoại, địa chỉ
- Loại hình: Thời vụ / Chính thức
- Nhân viên Sale phụ trách
- CTV giới thiệu (nếu có)
- Trạng thái: `Đang chờ việc` / `Đang làm tại nhà máy X` / `Đã nghỉ`
- Nhà máy đang làm, ngày vào làm, tổng giờ đã làm

### 5. Nhân Viên Sale
- Hồ sơ cá nhân, tài khoản đăng nhập
- Danh sách công nhân đang phụ trách
- Danh sách CTV đang quản lý
- Tổng giờ nhận được trong tháng (do Vendor gửi về)
- Bảng lương hàng tháng

---

## Quy Trình Nghiệp Vụ Chính

1. Vendor gửi thông tin đơn tuyển → Trưởng nhóm tạo đơn trên hệ thống → Giao cho Sale phụ trách
2. Sale tìm công nhân (trực tiếp hoặc qua CTV) → Cập nhật CN đã cung cấp vào đơn tuyển
3. Cuối tháng: Vendor gửi số giờ làm của từng CN → Sale hoặc Trưởng nhóm nhập vào hệ thống
4. Hệ thống tự tính lương Sale và xuất bảng lương

---

## Tính Lương Nhân Viên Sale (Tự Động)

```
Lương = Lương Cơ Bản + Hoa Hồng + Thưởng Khác
```

| Thành phần | Chi tiết |
|---|---|
| Lương cơ bản | 5.000.000đ / tháng |
| Thưởng khác | Nhập tay (thưởng đặc biệt từ Vendor, thưởng doanh số...) |

### Bảng Hoa Hồng (theo tổng giờ CN làm trong tháng do Sale phụ trách)

| Tổng số giờ nhận trong tháng | Hoa hồng |
|---|---|
| 0 – 800h | Không có hoa hồng |
| 801h – 1.500h | **2.500đ / giờ** |
| 1.501h – 5.000h | **3.500đ / giờ** |
| Trên 5.000h | **4.000đ / giờ** |

### Xuất bảng lương
- Xuất ra file **Excel + PDF**, có thể in và ký
- Sale xem được **lương dự kiến theo thời gian thực** khi đăng nhập

---

## Yêu Cầu Kỹ Thuật

- **Nền tảng**: Web browser + Android + iOS
- **Frontend**: React (web) + React Native (mobile) — dùng chung codebase tối đa
- **Backend**: Node.js + API RESTful
- **Database**: PostgreSQL + Prisma ORM
- **Đăng nhập**: Tài khoản nội bộ (email + mật khẩu), JWT authentication
- **Giao diện**: Tiếng Việt, tối giản, dễ dùng trên điện thoại
- **Thông báo**: Push notification khi có đơn tuyển mới, sắp đến deadline
- **Lịch sử**: Lưu toàn bộ — ai nhập giờ, khi nào, thay đổi gì (Audit Log)

---

## Database Schema

Schema chi tiết: `database/schema.prisma` (13 bảng)
Tài liệu thiết kế: `database/DATABASE_DESIGN.md`

| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `users` | Admin / Giám đốc / Trưởng nhóm / Sale |
| 2 | `teams` | Nhóm Sale |
| 3 | `collaborators` | CTV — không đăng nhập |
| 4 | `vendors` | Vendor trung gian |
| 5 | `factories` | Nhà máy |
| 6 | `vendor_factories` | Vendor ↔ Nhà máy (N-N) + Thời vụ/Chính thức |
| 7 | `recruitment_orders` | Đơn tuyển + Thời vụ/Chính thức |
| 8 | `workers` | Công nhân + Thời vụ/Chính thức |
| 9 | `worker_assignments` | CN ↔ Đơn tuyển (N-N) |
| 10 | `working_hours` | Giờ làm/tháng/CN |
| 11 | `salaries` | Lương tháng Sale |
| 12 | `salary_bonuses` | Thưởng khác |
| 13 | `audit_logs` | Lịch sử thao tác |

---

## Thứ Tự Xây Dựng

1. ~~Thiết kế database schema cho toàn bộ đối tượng~~ ✅
2. ~~Tạo cấu trúc thư mục dự án~~ ✅
3. Xây dựng theo thứ tự:
   - ~~Đăng nhập & Phân quyền~~ ✅
   - ~~Quản lý Vendor~~ ✅
   - ~~Đơn tuyển dụng~~ ✅
   - ~~Quản lý Công nhân~~ ✅
   - ~~Quản lý CTV~~ ✅
   - ~~Tính lương Sale~~ ✅
