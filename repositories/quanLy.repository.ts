import { ref, get, set, push, remove, update, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { QuanLy } from '@/types';

export class QuanLyRepository {
  private dbPath = 'quanLy';

  async getAll(): Promise<QuanLy[]> {
    const dbRef = ref(database, this.dbPath);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        ...data[key],
        id: key,
      }));
    }
    return [];
  }

  subscribeAll(callback: (data: QuanLy[]) => void) {
    const dbRef = ref(database, this.dbPath);
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        }));
        callback(list);
      } else {
        callback([]);
      }
    });
    return () => off(dbRef);
  }

  async create(data: Omit<QuanLy, 'id'>): Promise<string> {
    const dbRef = ref(database, this.dbPath);
    const newRef = push(dbRef);
    const now = Date.now();
    await set(newRef, { 
      ...data, 
      createdAt: now,
      updatedAt: now,
    });
    return newRef.key!;
  }

  async update(id: string, data: Partial<QuanLy>): Promise<void> {
    const dbRef = ref(database, `${this.dbPath}/${id}`);
    await update(dbRef, {
      ...data,
      updatedAt: Date.now(),
    });
  }

  async delete(id: string): Promise<void> {
    const dbRef = ref(database, `${this.dbPath}/${id}`);
    await remove(dbRef);
  }
}
