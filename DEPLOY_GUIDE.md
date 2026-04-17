# HƯỚNG DẪN DEPLOY & ĐÓNG GÓI PHẦN MỀM
# Quản Lý Cung Ứng Lao Động

---

## MỤC LỤC

1. [Cấu trúc dự án](#1-cấu-trúc-dự-án)
2. [Deploy Web (VPS + Tên miền)](#2-deploy-web-vps--tên-miền)
3. [Deploy bằng Docker (Đơn giản nhất)](#3-deploy-bằng-docker)
4. [Đóng gói Android (APK/AAB)](#4-đóng-gói-android)
5. [Đóng gói iOS (IPA)](#5-đóng-gói-ios)
6. [Cấu trúc code & Cách chỉnh sửa](#6-cấu-trúc-code--cách-chỉnh-sửa)
7. [Hướng dẫn nâng cấp](#7-hướng-dẫn-nâng-cấp)

---

## 1. CẤU TRÚC DỰ ÁN

```
SOFT1/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── config/             # Cấu hình (DB, env)
│   │   ├── controllers/        # Xử lý logic
│   │   ├── routes/             # Định tuyến API
│   │   ├── middlewares/        # Auth, validate
│   │   └── utils/              # Tiện ích (salary calc, audit)
│   ├── prisma/
│   │   ├── schema.prisma       # Schema SQLite (dev)
│   │   ├── schema.production.prisma  # Schema PostgreSQL (prod)
│   │   ├── seed.js             # Dữ liệu mẫu
│   │   └── migrations/         # Lịch sử migration
│   ├── Dockerfile              # Docker build
│   ├── ecosystem.config.js     # PM2 config
│   ├── .env.example            # Mẫu env
│   └── package.json
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── main.jsx            # Entry point
│   │   ├── App.jsx             # Router
│   │   ├── api/                # Axios API calls
│   │   ├── pages/              # Trang (Dashboard, Vendor, Worker...)
│   │   ├── components/         # Components dùng chung
│   │   ├── contexts/           # React Context (Auth)
│   │   ├── styles/             # CSS global
│   │   └── utils/              # Tiện ích (roles, format)
│   ├── capacitor.config.ts     # Cấu hình mobile
│   ├── vite.config.js          # Vite bundler config
│   ├── .env.development        # API URL dev
│   ├── .env.production         # API URL production
│   └── package.json
│
├── nginx/                      # Cấu hình Nginx
│   ├── nginx.conf              # Cho Docker
│   └── nginx-standalone.conf   # Cho VPS trực tiếp
│
├── scripts/
│   ├── deploy.sh               # Script deploy Linux
│   ├── setup-mobile.sh         # Setup mobile (Linux/Mac)
│   └── setup-mobile.bat        # Setup mobile (Windows)
│
├── docker-compose.yml          # Chạy toàn bộ bằng Docker
└── .gitignore
```

---

## 2. DEPLOY WEB (VPS + TÊN MIỀN)

### Yêu cầu VPS tối thiểu
- Ubuntu 22.04 / Debian 12
- RAM: 1GB (tối thiểu), 2GB (khuyến nghị)
- Disk: 20GB
- Đã trỏ tên miền về IP VPS (A record)

### Bước 1: Cài đặt phần mềm trên VPS

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cài PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Cài Nginx
sudo apt install -y nginx

# Cài PM2 (quản lý process Node.js)
sudo npm install -g pm2

# Cài Git
sudo apt install -y git

# Kiểm tra
node -v    # v20.x
npm -v     # 10.x
psql --version
nginx -v
pm2 -v
```

### Bước 2: Tạo database PostgreSQL

```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Trong PostgreSQL shell:
CREATE DATABASE labor_supply_db;
CREATE USER appuser WITH PASSWORD 'mat-khau-manh-cua-ban';
GRANT ALL PRIVILEGES ON DATABASE labor_supply_db TO appuser;
ALTER USER appuser CREATEDB;
\q
```

### Bước 3: Clone và cấu hình project

```bash
# Tạo thư mục
sudo mkdir -p /var/www/labor-supply
sudo chown $USER:$USER /var/www/labor-supply

# Clone code
cd /var/www/labor-supply
git clone https://github.com/your-repo/SOFT1.git .

# --- CẤU HÌNH BACKEND ---
cd backend

# Tạo file .env
cp .env.example .env
nano .env
```

**Nội dung file `backend/.env`:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://appuser:mat-khau-manh-cua-ban@localhost:5432/labor_supply_db"
JWT_SECRET=chuoi-bi-mat-rat-dai-nen-dung-random-string-64-ky-tu
JWT_EXPIRES_IN=7d
```

> Tạo JWT_SECRET ngẫu nhiên: `openssl rand -hex 32`

```bash
# Cài dependencies
npm ci --production

# Chuyển schema sang PostgreSQL
cp prisma/schema.production.prisma prisma/schema.prisma

# Tạo Prisma client
npx prisma generate

# Chạy migration (tạo tables)
npx prisma migrate deploy

# Seed dữ liệu ban đầu (lần đầu tiên)
node prisma/seed.js
```

### Bước 4: Build Frontend

```bash
cd /var/www/labor-supply/frontend

# Cấu hình API URL
nano .env.production
```

**Nội dung `frontend/.env.production`:**
```env
VITE_API_URL=https://your-domain.com/api
```

```bash
# Cài và build
npm ci
npm run build
# Kết quả ở thư mục: frontend/dist/
```

### Bước 5: Khởi chạy Backend bằng PM2

```bash
cd /var/www/labor-supply/backend

# Tạo thư mục log
mkdir -p logs

# Khởi chạy
pm2 start ecosystem.config.js --env production

# Kiểm tra
pm2 status
pm2 logs labor-supply-api

# Tự khởi động khi VPS reboot
pm2 startup
pm2 save
```

### Bước 6: Cấu hình Nginx

```bash
# Copy config
sudo cp /var/www/labor-supply/nginx/nginx-standalone.conf \
        /etc/nginx/sites-available/labor-supply

# Sửa tên miền
sudo nano /etc/nginx/sites-available/labor-supply
# Thay "your-domain.com" → tên miền thật của bạn
# Thay đường dẫn root nếu cần

# Kích hoạt site
sudo ln -s /etc/nginx/sites-available/labor-supply \
           /etc/nginx/sites-enabled/

# Xóa site mặc định
sudo rm /etc/nginx/sites-enabled/default

# Kiểm tra config
sudo nginx -t

# Khởi động lại
sudo systemctl restart nginx
```

### Bước 7: Cài SSL (HTTPS miễn phí)

```bash
# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Tạo SSL certificate
sudo certbot --nginx -d your-domain.com

# Tự động gia hạn
sudo certbot renew --dry-run
```

### Bước 8: Kiểm tra

```
Mở trình duyệt → https://your-domain.com
Đăng nhập: admin@company.vn / admin123
```

### Cập nhật sau này

```bash
cd /var/www/labor-supply
bash scripts/deploy.sh
```

---

## 3. DEPLOY BẰNG DOCKER (ĐƠN GIẢN NHẤT)

Docker đóng gói tất cả vào container, không cần cài từng thứ.

### Yêu cầu
- VPS có Docker + Docker Compose
- Tên miền đã trỏ về IP VPS

### Bước 1: Cài Docker

```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo apt install -y docker-compose-plugin

# Kiểm tra
docker --version
docker compose version
```

### Bước 2: Clone project

```bash
cd /opt
git clone https://github.com/your-repo/SOFT1.git labor-supply
cd labor-supply
```

### Bước 3: Cấu hình

```bash
# Sửa docker-compose.yml
nano docker-compose.yml
```

**Thay đổi trong `docker-compose.yml`:**
```yaml
# Đổi mật khẩu PostgreSQL
POSTGRES_PASSWORD: mat-khau-manh-cua-ban

# Đổi DATABASE_URL cho backend
DATABASE_URL: "postgresql://postgres:mat-khau-manh-cua-ban@postgres:5432/labor_supply_db"

# Đổi JWT_SECRET
JWT_SECRET: chuoi-bi-mat-64-ky-tu-cua-ban
```

```bash
# Sửa tên miền trong nginx config
nano nginx/nginx.conf
# Thay "your-domain.com" → tên miền thật

# Sửa API URL cho frontend
nano frontend/.env.production
# VITE_API_URL=https://your-domain.com/api
```

### Bước 4: Chạy

```bash
# Build và chạy tất cả
docker compose up -d --build

# Kiểm tra
docker compose ps
docker compose logs -f backend

# Chạy migration + seed (lần đầu)
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

### Bước 5: SSL (nếu cần)

```bash
# Cài certbot trên host
sudo apt install -y certbot
sudo certbot certonly --standalone -d your-domain.com

# Sau đó mount certificate vào nginx container
# Thêm vào docker-compose.yml > nginx > volumes:
#   - /etc/letsencrypt:/etc/letsencrypt:ro
# Và update nginx.conf cho SSL
```

### Cập nhật

```bash
cd /opt/labor-supply
git pull origin main
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

---

## 4. ĐÓNG GÓI ANDROID (APK / AAB)

App mobile dùng Capacitor để wrap web app thành native app.

### Yêu cầu trên máy tính
- Node.js 20+
- Android Studio (tải tại https://developer.android.com/studio)
- Java JDK 17+

### Bước 1: Setup Capacitor

**Windows:**
```cmd
cd SOFT1
scripts\setup-mobile.bat
```

**Linux/Mac:**
```bash
cd SOFT1
bash scripts/setup-mobile.sh
```

### Hoặc làm thủ công:

```bash
cd frontend

# Cài Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar

# Sửa .env.production trước khi build
# VITE_API_URL=https://your-domain.com/api

# Build web app
npm run build

# Thêm Android platform
npx cap add android

# Sync code web vào Android project
npx cap sync
```

### Bước 2: Mở Android Studio

```bash
npx cap open android
```

Android Studio sẽ mở project tại `frontend/android/`

### Bước 3: Build APK (file cài trực tiếp)

**Cách 1: Từ Android Studio**
1. Menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. File APK ở: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

**Cách 2: Từ command line**
```bash
cd frontend/android

# APK debug (test)
./gradlew assembleDebug
# File: app/build/outputs/apk/debug/app-debug.apk

# APK release (production)
./gradlew assembleRelease
# File: app/build/outputs/apk/release/app-release-unsigned.apk
```

### Bước 4: Ký APK release (bắt buộc để cài)

```bash
# Tạo keystore (chỉ làm 1 lần, GIỮ FILE NÀY CẨN THẬN)
keytool -genkey -v -keystore labor-supply.keystore \
  -alias labor-supply -keyalg RSA -keysize 2048 -validity 10000

# Ký APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore labor-supply.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  labor-supply

# Hoặc cấu hình trong android/app/build.gradle:
```

**Thêm vào `frontend/android/app/build.gradle`:**
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../labor-supply.keystore')
            storePassword 'mat-khau-keystore'
            keyAlias 'labor-supply'
            keyPassword 'mat-khau-key'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Bước 5: Build AAB (cho Google Play Store)

```bash
cd frontend/android
./gradlew bundleRelease
# File: app/build/outputs/bundle/release/app-release.aab
```

### Cài APK lên điện thoại
1. Copy file `.apk` sang điện thoại
2. Mở file → Cho phép cài từ nguồn không xác định → Cài đặt
3. Hoặc dùng `adb install app-debug.apk` qua USB

### Cập nhật app sau này

```bash
cd frontend

# Sửa code xong → build lại
npm run build

# Sync vào Android
npx cap sync

# Build APK mới
cd android
./gradlew assembleRelease
```

---

## 5. ĐÓNG GÓI iOS (IPA)

> **Yêu cầu:** Máy Mac + Xcode + Apple Developer Account ($99/năm)

### Bước 1: Setup

```bash
cd frontend

# Nếu chưa add iOS
npx cap add ios

# Build web và sync
npm run build
npx cap sync

# Mở Xcode
npx cap open ios
```

### Bước 2: Trong Xcode

1. Chọn Team (Apple Developer Account)
2. Đổi Bundle Identifier: `com.laborsupply.app`
3. Chọn device hoặc simulator
4. Product → Build
5. Product → Archive (cho production)

### Bước 3: Phát hành

- **TestFlight:** Archive → Distribute App → App Store Connect → Upload
- **App Store:** Sau khi test → Submit for Review trên App Store Connect

### Bước 4: Ad Hoc (cài trực tiếp, không qua Store)

1. Archive → Distribute App → Ad Hoc
2. Xuất file .ipa
3. Dùng Apple Configurator hoặc Diawi.com để cài

---

## 6. CẤU TRÚC CODE & CÁCH CHỈNH SỬA

### 6.1 Luồng hoạt động

```
Người dùng → Nginx (port 80/443)
                ├── /         → Frontend (React SPA)
                └── /api/*    → Backend (Node.js port 5000)
                                  └── PostgreSQL (port 5432)
```

### 6.2 Backend - Thêm tính năng mới

**Ví dụ: Thêm module "Báo cáo" (Reports)**

**Bước 1:** Thêm model vào schema (nếu cần)
```
File: backend/prisma/schema.prisma
→ Thêm model Report { ... }
→ Chạy: npx prisma migrate dev --name add_reports
```

**Bước 2:** Tạo Controller
```
File: backend/src/controllers/reportController.js

Mẫu:
const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

async function getReports(req, res) {
  try {
    const data = await prisma.report.findMany({ ... });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getReports };
```

**Bước 3:** Tạo Route
```
File: backend/src/routes/report.js

const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', getReports);

module.exports = router;
```

**Bước 4:** Đăng ký route
```
File: backend/src/server.js
→ Thêm: app.use('/api/reports', require('./routes/report'));
```

### 6.3 Frontend - Thêm trang mới

**Bước 1:** Tạo API module
```
File: frontend/src/api/reportApi.js

import axiosClient from './axiosClient';

const reportApi = {
  getAll: (params) => axiosClient.get('/reports', { params }),
};

export default reportApi;
```

**Bước 2:** Tạo Page component
```
File: frontend/src/pages/report/ReportPage.jsx
File: frontend/src/pages/report/Report.css
```

**Bước 3:** Thêm Route
```
File: frontend/src/App.jsx
→ Import: import ReportPage from './pages/report/ReportPage';
→ Thêm: <Route path="/reports" element={<ReportPage />} />
```

**Bước 4:** Thêm vào Sidebar
```
File: frontend/src/utils/roles.js
→ Thêm vào MENU_ITEMS của role cần thiết:
  { key: 'reports', label: 'Báo cáo', path: '/reports', icon: 'MdBarChart' }

File: frontend/src/components/layout/Sidebar.jsx
→ Import icon: import { MdBarChart } from 'react-icons/md';
→ Thêm vào ICON_MAP: MdBarChart

File: frontend/src/components/layout/MainLayout.jsx
→ Thêm vào PAGE_TITLES: '/reports': 'Báo cáo'
```

### 6.4 Cấu trúc file quan trọng

| File | Mô tả | Khi nào sửa |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | Database schema | Thêm/sửa bảng |
| `backend/src/server.js` | Đăng ký routes | Thêm module mới |
| `backend/src/config/index.js` | Cấu hình app | Thêm config mới |
| `frontend/src/App.jsx` | Router | Thêm trang mới |
| `frontend/src/utils/roles.js` | Menu + phân quyền | Thêm menu, role |
| `frontend/src/api/axiosClient.js` | HTTP client | Sửa base URL |
| `frontend/.env.production` | API URL production | Đổi domain |

### 6.5 Quy ước code

```
Controller:  camelCase    → getWorkers, createWorker
Route:       kebab-case   → /api/working-hours
DB Table:    snake_case   → working_hours
DB Column:   snake_case   → full_name (mapped từ camelCase)
Component:   PascalCase   → WorkerList.jsx
CSS:         kebab-case   → .worker-list, .btn-primary
API module:  camelCase    → workerApi.js
```

---

## 7. HƯỚNG DẪN NÂNG CẤP

### 7.1 Thêm cột mới vào database

```bash
# 1. Sửa schema.prisma, thêm field
# 2. Tạo migration
cd backend
npx prisma migrate dev --name ten_migration

# 3. Update controller để xử lý field mới
# 4. Update frontend form/table
```

### 7.2 Đổi từ SQLite sang PostgreSQL

```bash
# 1. Cài PostgreSQL
# 2. Sửa .env
DATABASE_URL="postgresql://user:pass@localhost:5432/labor_supply_db"

# 3. Copy schema production
cp prisma/schema.production.prisma prisma/schema.prisma

# 4. Tạo lại DB
npx prisma migrate deploy
node prisma/seed.js
```

### 7.3 Môi trường phát triển (dev)

```bash
# Terminal 1 - Backend
cd backend
cp .env.example .env   # (lần đầu)
npm install
npx prisma generate
npx prisma migrate dev
node prisma/seed.js    # (lần đầu)
npm run dev            # chạy ở port 5000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev            # chạy ở port 3000

# Mở trình duyệt: http://localhost:3000
# Đăng nhập: admin@company.vn / admin123
```

### 7.4 Tài khoản mặc định (sau seed)

| Email | Mật khẩu | Vai trò |
|-------|-----------|---------|
| admin@company.vn | admin123 | Admin |
| director@company.vn | 123456 | Giám đốc |
| lead1@company.vn | 123456 | Trưởng nhóm |
| sale1@company.vn | 123456 | Sale |
| sale2@company.vn | 123456 | Sale |

> **QUAN TRỌNG:** Sau khi deploy production, đổi tất cả mật khẩu!

### 7.5 Backup database

```bash
# PostgreSQL - Backup
pg_dump -U appuser labor_supply_db > backup_$(date +%Y%m%d).sql

# PostgreSQL - Restore
psql -U appuser labor_supply_db < backup_20260416.sql

# SQLite - Backup (dev)
cp backend/prisma/dev.db backup_dev.db

# Tự động backup hàng ngày (crontab)
crontab -e
# Thêm: 0 2 * * * pg_dump -U appuser labor_supply_db > /backups/db_$(date +\%Y\%m\%d).sql
```

### 7.6 Monitoring

```bash
# Xem logs backend
pm2 logs labor-supply-api

# Xem trạng thái
pm2 monit

# Xem nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## TÓM TẮT NHANH

| Mục tiêu | Lệnh |
|-----------|-------|
| Chạy dev | `backend: npm run dev` + `frontend: npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Deploy Docker | `docker compose up -d --build` |
| Deploy VPS | `bash scripts/deploy.sh` |
| Build APK | `cd frontend && npx cap sync && cd android && ./gradlew assembleRelease` |
| Build iOS | `cd frontend && npx cap sync && npx cap open ios` → Xcode Archive |
| Backup DB | `pg_dump -U appuser labor_supply_db > backup.sql` |
| Xem logs | `pm2 logs` hoặc `docker compose logs -f` |
