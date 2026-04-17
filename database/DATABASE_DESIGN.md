# Database Design - Quản Lý Cung Ứng Lao Động

## Sơ đồ quan hệ (ERD)

```
┌──────────────┐       ┌──────────┐
│   User       │───┐   │   Team   │
│ 4 role:      │   └──>│          │
│ ADMIN        │       └──────────┘
│ DIRECTOR     │
│ TEAM_LEAD    │
│ SALE         │
└──┬───────┬───┘
   │       │
   │       │ sale quản lý
   │       ▼
   │  ┌──────────────┐     giới thiệu CN    ┌──────────┐
   │  │ Collaborator │─────────────────────>│  Worker  │
   │  │ (CTV)        │                      │  (CN)    │
   │  │ Không login   │                      └────┬─────┘
   │  └──────────────┘                           │
   │                                              │
   │  sale phụ trách CN                           │
   └──────────────────────────────────────────────┘
                                                  │
                          worker_assignments      │
                               (N-N)              │
                                                  │
┌──────────┐    vendor_factories     ┌────────────┴───┐
│  Vendor  │◄──────────────────────>│ Recruitment     │
│          │    Thời vụ/Chính thức  │ Order           │
└──────────┘                        │ Thời vụ/C.thức │
                                    └────────┬───────┘
┌──────────┐                                 │
│ Factory  │◄────────────────────────────────┘
│(nhà máy) │
└──────────┘

┌──────────────┐                     ┌──────────────┐
│WorkingHours  │──── tính lương ───>│   Salary     │
│(giờ/tháng)   │                     │ (lương/tháng)│
└──────────────┘                     └──────┬───────┘
                                            │
                                     ┌──────┴───────┐
                                     │ SalaryBonus  │
                                     │ (thưởng khác)│
                                     └──────────────┘

┌──────────────┐
│  AuditLog    │  ← Ghi lại mọi thay đổi
└──────────────┘
```

## Danh sách bảng (13 bảng)

| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `users` | Người dùng hệ thống (Admin / Giám đốc / Trưởng nhóm / Sale) |
| 2 | `teams` | Nhóm Sale, mỗi nhóm 1 trưởng nhóm |
| 3 | `collaborators` | Cộng tác viên (CTV) — không đăng nhập, do Sale quản lý |
| 4 | `vendors` | Vendor trung gian |
| 5 | `factories` | Nhà máy |
| 6 | `vendor_factories` | Vendor ↔ Nhà máy (N-N) + loại hình Thời vụ/Chính thức |
| 7 | `recruitment_orders` | Đơn tuyển dụng từ Vendor + loại hình Thời vụ/Chính thức |
| 8 | `workers` | Công nhân / ứng viên + loại hình Thời vụ/Chính thức |
| 9 | `worker_assignments` | Phân công CN vào đơn tuyển (N-N) |
| 10 | `working_hours` | Giờ làm hàng tháng của CN (Vendor gửi) |
| 11 | `salaries` | Bảng lương tháng của Sale |
| 12 | `salary_bonuses` | Chi tiết thưởng khác |
| 13 | `audit_logs` | Lịch sử thao tác |

## Phân quyền (4 role + CTV)

| Role | Mô tả | Đăng nhập |
|------|--------|-----------|
| **ADMIN** | Quản trị hệ thống: config, quản lý user, phân quyền | Có |
| **DIRECTOR** | Giám đốc: xem báo cáo tổng, duyệt | Có |
| **TEAM_LEAD** | Trưởng nhóm: tạo đơn tuyển, giao việc cho Sale | Có |
| **SALE** | Nhân viên Sale: nhận đơn, cập nhật CN, xem lương | Có |
| **CTV** | Cộng tác viên: giới thiệu CN, do Sale quản lý | **Không** |

## Loại hình Thời vụ / Chính thức

Áp dụng tại 3 nơi:
1. **`vendor_factories`** — quan hệ Vendor ↔ Nhà máy có loại hình
2. **`recruitment_orders`** — mỗi đơn tuyển ghi rõ tuyển thời vụ hay chính thức
3. **`workers`** — mỗi CN có loại hình làm việc

## Quy tắc tính lương

```
Lương = Lương cơ bản (5tr) + Hoa hồng + Thưởng khác

Hoa hồng = Tổng giờ × Mức hoa hồng

Bảng mức hoa hồng:
┌─────────────────────┬──────────────┐
│ Tổng giờ trong tháng│ Hoa hồng/giờ │
├─────────────────────┼──────────────┤
│ 0 – 800h            │ 0đ           │
│ 801 – 1.500h        │ 2.500đ       │
│ 1.501 – 5.000h      │ 3.500đ       │
│ Trên 5.000h         │ 4.000đ       │
└─────────────────────┴──────────────┘
```

## Luồng dữ liệu chính

1. **Tạo đơn tuyển**: Trưởng nhóm tạo `recruitment_orders` → giao `assigned_sale_id`
2. **Cung cấp CN**: Sale tìm CN (trực tiếp hoặc qua CTV) → tạo `worker_assignments`
3. **Nhập giờ**: Cuối tháng nhập `working_hours` cho từng CN
4. **Tính lương**: Hệ thống tổng hợp giờ theo Sale → tính `salaries`
5. **Audit**: Mọi thao tác ghi vào `audit_logs`
