# Hướng dẫn Deploy dự án lên Cloudflare Pages

Tài liệu này hướng dẫn chi tiết cách triển khai (deploy) dự án **ttn-erd** lên Cloudflare Pages, bao gồm cấu hình Firebase Admin để hoạt động trong môi trường Edge Runtime.

## 1. Chuẩn bị trước khi Deploy

### Cấu hình Firebase
Đảm bảo bạn đã có đầy đủ thông tin từ Firebase Console:
- Firebase Client SDK (API Key, Auth Domain, etc.)
- Firebase Admin SDK Service Account (Private Key, Client Email)

### Cấu hình Mã nguồn
Dự án đã được thiết lập:
- `wrangler.toml`: Đã cấu hình `compatibility_flags = [ "nodejs_compat" ]` để hỗ trợ thư viện `firebase-admin`.
- `lib/firebase/admin.ts`: Đã có hàm xử lý `PRIVATE_KEY` để tránh lỗi định dạng dấu xuống dòng (`
`).

## 2. Các bước Deploy trên Cloudflare Dashboard

### Bước 1: Kết nối Git
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Chọn Repository chứa dự án này.

### Bước 2: Cấu hình Build
- **Project Name:** `ttn-erd`
- **Framework preset:** `Next.js`
- **Build command:** `npm run build && npx @cloudflare/next-on-pages`
- **Build output directory:** `.vercel/output`
- **Deploy command:** (Để trống - Không điền gì vào đây)

### Bước 3: Thiết lập Biến môi trường (Environment Variables)
Đây là bước **QUAN TRỌNG NHẤT**. Bạn cần copy toàn bộ biến từ file `.env.local` vào mục **Settings** > **Environment Variables** trên Cloudflare Pages.

#### Firebase Client (Public):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Firebase Admin (Secret):
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`: Dán toàn bộ chuỗi bao gồm cả `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`.

> **Lưu ý:** Đối với `FIREBASE_ADMIN_PRIVATE_KEY`, hãy đảm bảo nó trông giống như sau: `"-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
"`.

### Bước 4: Kích hoạt Compatibility Flag
Nếu trong quá trình build hoặc chạy gặp lỗi liên quan đến module Node.js (như `fs`, `path`, `crypto`):
1. Vào project trên Cloudflare Pages dashboard.
2. Chọn **Settings** > **Functions** > **Compatibility flags**.
3. Thêm flag `nodejs_compat` cho cả **Production** và **Preview**.

## 3. Kiểm tra bảo mật sau khi Deploy

1. **Kiểm tra API Routes:** Truy cập thử vào `/api/auth/verify` (nếu không có token sẽ trả về 400). Nếu trả về 500 kèm lỗi `firebase-admin`, hãy kiểm tra lại `FIREBASE_ADMIN_PRIVATE_KEY`.
2. **CORS:** Đảm bảo Cloudflare domain đã được thêm vào danh sách **Authorized domains** trong Firebase Console > **Authentication** > **Settings**.

## 4. Troubleshooting (Xử lý sự cố)

- **Lỗi "Module not found: Can't resolve 'fs'":** Đảm bảo đã bật `nodejs_compat`.
- **Lỗi xác thực Firebase Admin:** Kiểm tra lại định dạng `PRIVATE_KEY`. Code trong `lib/firebase/admin.ts` đã xử lý `replace(/
/g, '
')`, nên bạn cần dán key có dạng chuỗi một dòng chứa `
`.
- **Build thất bại:** Thử sử dụng lệnh build `npx @cloudflare/next-on-pages`.

---
*Tài liệu này được tạo tự động bởi Gemini CLI Agent.*
