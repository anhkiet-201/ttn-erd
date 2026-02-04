'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebase/auth';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

/**
 * Component xử lý logic điều hướng dựa trên trạng thái auth
 * Tách biệt khỏi Provider để giữ render tree ổn định
 */
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Redirect logic: Chạy sau khi quá trình check hoàn tất
    if (!user && pathname !== '/login') {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/tin-tuyen-dung');
    }
  }, [user, loading, pathname, router]);

  // Hiển thị trạng thái loading đồng nhất
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang kiểm tra đăng nhập...</p>
          <p className="text-sm text-gray-400 mt-2">Nếu màn hình này hiển thị quá lâu, vui lòng refresh trang</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout an toàn
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 8000); // Tăng lên 8s cho chắc chắn

    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      clearTimeout(timeoutId);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <AuthGuard>{children}</AuthGuard>
    </AuthContext.Provider>
  );
}

