# Hệ Thống Quản Lý Tin Tuyển Dụng ERD

Ứng dụng web quản lý tin tuyển dụng với giao diện Google Keep clone, sử dụng Firebase Realtime Database và Next.js.

## 📋 Tổng Quan

Hệ thống ERD (Employee Recruitment Database) cho phép quản lý thông tin tuyển dụng, công ty, khu vực, người lao động và trạng thái ứng tuyển một cách trực quan và real-time.

### ✨ Tính Năng Chính

- 🎨 **Giao diện Masonry Grid** giống Google Keep
- ⚡ **Real-time updates** - thay đổi từ máy A hiển thị ngay trên máy B
- 🔒 **Edit Locking** - chỉ 1 người chỉnh sửa tại một thời điểm
- 🔐 **Firebase Google Login** - whitelist only, không cho đăng ký công khai
- 🚫 **Blacklist Warning** - cảnh báo khi tuyển dụng nhân sự bị cấm
- 📱 **Responsive Design** - hỗ trợ mobile, tablet, desktop

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router)
- **Backend:** Firebase Realtime Database + Next.js API Routes
- **Authentication:** Firebase Auth (Google Provider)
- **UI:** TailwindCSS + Framer Motion + Radix UI
- **Language:** TypeScript

## 📦 Prerequisites

- Node.js 18.x trở lên
- npm hoặc yarn
- Tài khoản Firebase với project đã setup

## 🚀 Installation

### 1. Clone và cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Firebase

Tạo file `.env.local` trong thư mục gốc:

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Setup Firebase Console

#### a. Enable Google Authentication

1. Vào **Firebase Console → Authentication → Sign-in method**
2. Enable **Google** provider

#### b. Thêm Whitelist Users

1. Vào **Authentication → Users**
2. Click **Add User**
3. Nhập email của người dùng được phép truy cập

#### c. Enable Realtime Database

1. Vào **Realtime Database**
2. Click **Create Database**
3. Chọn region gần nhất (ví dụ: Singapore)

#### d. Update Security Rules & Indexes

Sử dụng file `database.rules.json` trong source code để cập nhật Rules và Index cho database.

```bash
firebase deploy --only database
```

### 4. Chạy Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 📖 Hướng Dẫn Sử Dụng

### Đăng Nhập

1. Truy cập `/login`
2. Click "Đăng nhập với Google"
3. Chọn tài khoản đã được thêm vào whitelist

### Quản Lý Tin Tuyển Dụng

1. **Tạo mới:** Click FAB button (+) góc dưới bên phải
2. **Chỉnh sửa:** Click vào card → Modal mở ra
3. **Xóa:** Mở modal → Click nút xóa

### Edit Locking

- Khi bạn mở modal chỉnh sửa, record sẽ bị **lock**
- Người khác cố mở cùng record sẽ thấy thông báo _"Đang được chỉnh sửa bởi [Tên bạn]"_
- Lock tự động release khi đóng modal hoặc sau 5 phút

## 📁 Cấu Trúc Dự Án

```
ttn_erd/
├── app/                    # Next.js App Router
│   ├── login/             # Login page
│   ├── tin-tuyen-dung/    # Tin tuyển dụng view
│   ├── khu-vuc/           # Khu vực view
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── cards/            # Card components
│   ├── modals/           # Modal components
│   └── layout/           # Layout components
├── lib/                   # Utilities & configs
│   └── firebase/         # Firebase config
├── hooks/                 # Custom React hooks
├── repositories/          # Data repositories
└── types/                 # TypeScript types
```

## 🏗️ Architecture

Xem chi tiết trong [ARCHITECTURE.md](./ARCHITECTURE.md)

## 📝 License

MIT

## 👥 Contributors

- Anh Kiệt
