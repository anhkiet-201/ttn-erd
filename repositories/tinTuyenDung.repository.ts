import { ref, get, set, push, remove, update, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { TinTuyenDung } from '@/types';

export class TinTuyenDungRepository {
  private dbPath = 'tinTuyenDung';

  /**
   * Lấy danh sách tin tuyển dụng (một lần)
   */
  async getAll(): Promise<TinTuyenDung[]> {
    const dbRef = ref(database, this.dbPath);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        ...data[key],
        id: key,
        // Convert dates if needed (RTDB stores as string/timestamp)
        createdAt: data[key].createdAt ? new Date(data[key].createdAt) : undefined,
        updatedAt: data[key].updatedAt ? new Date(data[key].updatedAt) : undefined,
      }));
    }
    return [];
  }

  /**
   * Theo dõi thay đổi real-time của danh sách tin
   */
  subscribeAll(callback: (data: TinTuyenDung[]) => void) {
    const dbRef = ref(database, this.dbPath);
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
          createdAt: data[key].createdAt ? new Date(data[key].createdAt) : undefined,
          updatedAt: data[key].updatedAt ? new Date(data[key].updatedAt) : undefined,
        }));
        callback(list);
      } else {
        callback([]);
      }
    });

    // Trả về hàm để unsubscribe
    return () => off(dbRef);
  }

  /**
   * Tạo tin mới
   */
  async create(data: Omit<TinTuyenDung, 'id'>): Promise<string> {
    const dbRef = ref(database, this.dbPath);
    const newRef = push(dbRef);
    const now = new Date().toISOString();
    
    await set(newRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    
    return newRef.key!;
  }

  /**
   * Cập nhật tin
   */
  async update(id: string, data: Partial<TinTuyenDung>): Promise<void> {
    const dbRef = ref(database, `${this.dbPath}/${id}`);
    await update(dbRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Xóa tin
   */
  async delete(id: string): Promise<void> {
    const dbRef = ref(database, `${this.dbPath}/${id}`);
    await remove(dbRef);
  }
}
