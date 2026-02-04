# Architecture Documentation

## Tổng Quan Kiến Trúc

Hệ thống ERD được xây dựng theo **Clean Architecture** kết hợp **Repository Pattern**, tách biệt rõ ràng giữa Business Logic, Data Layer và Presentation Layer.

## Tech Stack

### Frontend

- **Framework:** Next.js 15 (App Router + Server Components)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animation:** Framer Motion
- **State Management:** React Hooks + Zustand (optional)

### Backend

- **Database:** Firebase Realtime Database
- **Authentication:** Firebase Authentication (Google Provider)
- **API:** Next.js API Routes với Firebase Admin SDK

### Real-time Features

- **Synchronization:** Firebase Realtime Database onValue listeners
- **Edit Locking:** Custom locking mechanism trên Firebase
- **Presence:** User online/offline tracking

## Layers Architecture

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│   (React Components, Pages, UI Logic)               │
│                                                      │
│   app/                 components/                   │
│   ├── login/          ├── cards/                    │
│   ├── tin-tuyen-dung/ ├── modals/                   │
│   └── api/            └── layout/                   │
└──────────────────────────┬──────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Application Layer                       │
│   (Business Logic, Custom Hooks)                    │
│                                                      │
│   hooks/                                             │
│   ├── useAuth.ts                                    │
│   ├── useEditLock.ts                                │
│   └── useFirebaseRealtime.ts                        │
└──────────────────────────┬──────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Data Layer                              │
│   (Repositories, Firebase Services)                  │
│                                                      │
│   repositories/                                      │
│   ├── base.repository.ts                            │
│   ├── tin-tuyen-dung.repository.ts                  │
│   ├── lock.repository.ts                            │
│   └── ...                                           │
└──────────────────────────┬──────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│         Infrastructure Layer                         │
│   (Firebase Config, External Services)               │
│                                                      │
│   lib/firebase/                                      │
│   ├── config.ts        (Client SDK)                 │
│   └── admin.ts         (Server SDK)                 │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### Read Operations (Real-time)

```
User Action (Page Load)
    ↓
Component useEffect
    ↓
Repository.onValueChange()
    ↓
Firebase onValue listener
    ↓
Real-time updates → Component re-render
```

### Write Operations (với Edit Lock)

```
User clicks Edit
    ↓
Modal opens → acquireLock()
    ↓
Check lock status in Firebase
    ↓
If locked by others: Show warning
If available: Acquire lock → Edit form
    ↓
User saves changes
    ↓
Repository.update()
    ↓
Firebase set() → Real-time propagation
    ↓
releaseLock()
```

## Firebase Schema

### Database Structure

```
firebase-realtime-db/
├── users/
│   └── {userId}/
│       ├── uid
│       ├── email
│       ├── displayName
│       └── lastSeen
├── locks/
│   └── {recordType}_{recordId}/
│       ├── userId
│       ├── userName
│       ├── lockedAt
│       └── expiresAt
├── khuVuc/
│   └── {khuVucId}/
│       ├── id
│       ├── tenKhuVuc
│       └── timestamps
├── congTy/
│   └── {congTyId}/
│       ├── id
│       ├── tenCongTy
│       ├── khuVucId (foreign key)
│       └── timestamps
├── tinTuyenDung/
│   └── {tinTuyenDungId}/
│       ├── id
│       ├── moTa
│       ├── yeuCau[]
│       ├── phucLoi[]
│       ├── congTyId (foreign key)
│       └── timestamps
├── nguoiLaoDong/
│   └── {nguoiLaoDongId}/
│       └── ...
└── ungTuyen/
    └── {ungTuyenId}/
        ├── nguoiLaoDongId (foreign key)
        ├── tinTuyenDungId (foreign key)
        └── ...
```

### Security Rules

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "locks": {
      "$lockId": {
        ".write": "auth != null && (
          !data.exists() ||
          data.child('userId').val() === auth.uid ||
          now > data.child('expiresAt').val()
        )"
      }
    }
  }
}
```

## Authentication Flow

```
User visits site
    ↓
Redirect to /login
    ↓
Click "Google Login"
    ↓
Firebase signInWithPopup()
    ↓
POST /api/auth/verify
    ↓
Check if user exists in Firebase Auth users
    ↓
If NOT in whitelist: signOut() + error
If in whitelist: Set session → Redirect /tin-tuyen-dung
```

## Edit Locking Mechanism

### Lock Lifecycle

1. **Acquire Lock (onModalOpen):**
   - Check if lock exists in `/locks/{recordId}`
   - If exists and not expired, show warning
   - If available, create lock with 5-minute expiry

2. **Maintain Lock:**
   - Poll lock status every 10s
   - Auto-refresh expiry time on user activity

3. **Release Lock (onModalClose):**
   - Delete lock from Firebase
   - Allow other users to edit

4. **Auto-Unlock:**
   - If no activity for 5 minutes, lock expires
   - Next user can claim lock

## Component Patterns

### Container/Presenter Pattern

```typescript
// Container (Logic)
function TinTuyenDungContainer() {
  const { data, loading } = useFirebaseRealtime('tinTuyenDung');
  const { acquireLock } = useEditLock();

  return <TinTuyenDungPresenter data={data} onEdit={acquireLock} />;
}

// Presenter (UI)
function TinTuyenDungPresenter({ data, onEdit }) {
  return (
    <MasonryGrid>
      {data.map(item => (
        <KeepCard key={item.id} data={item} onClick={() => onEdit(item.id)} />
      ))}
    </MasonryGrid>
  );
}
```

### Custom Hooks Pattern

```typescript
// useEditLock.ts
export function useEditLock(recordType: string, recordId: string) {
  const { user } = useAuth();
  const [lock, setLock] = useState<Lock | null>(null);

  const acquireLock = async () => {
    /* ... */
  };
  const releaseLock = async () => {
    /* ... */
  };

  return { lock, acquireLock, releaseLock };
}
```

## Performance Optimization

### 1. Real-time Listeners

- Sử dụng `onValue` với `limitToLast()` để giảm data transfer
- Unsubscribe listeners khi component unmount

### 2. Masonry Grid

- Virtual scrolling cho danh sách dài (react-window)
- Lazy load images

### 3. Code Splitting

- Next.js automatic code splitting
- Dynamic imports cho các components lớn

## Security Considerations

### Client-Side

- Tất cả requests cần authenticated user
- Firebase SDK tự động gửi ID token

### Server-Side (API Routes)

- Verify ID token với Firebase Admin SDK
- Check user permissions trước khi thực hiện operations

### Database

- Firebase Security Rules kiểm tra `auth != null`
- Lock mechanism ngăn concurrent edits

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Environment Variables

- Set tất cả Firebase credentials trong Vercel dashboard
- Ensure `.env.local` không được commit

## Testing Strategy

### Unit Tests

- Repositories với mock Firebase
- Custom hooks với React Testing Library

### Integration Tests

- API routes với Firebase Emulator
- Component integration tests

### E2E Tests

- Cypress/Playwright cho user flows
- Test real-time updates với multiple browsers

## Monitoring

- Firebase Console: Database usage, Auth metrics
- Vercel Analytics: Performance monitoring
- Sentry (optional): Error tracking

## Future Enhancements

1. **Offline Support:** Firebase offline persistence
2. **Search:** Algolia integration
3. **Export:** Generate Excel/PDF reports
4. **Notifications:** Email alerts on status changes
5. **Analytics:** Dashboard với charts

---

**Lưu ý:** Kiến trúc này có thể thay đổi theo yêu cầu dự án. Luôn cập nhật document khi có thay đổi lớn.
