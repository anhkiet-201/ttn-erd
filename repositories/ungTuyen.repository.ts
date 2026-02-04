import { ref, get, set, push, remove, update, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { UngTuyen } from '@/types';

export class UngTuyenRepository {
  private dbPath = 'ungTuyen';

  async getAll(): Promise<UngTuyen[]> {
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

  subscribeAll(callback: (data: UngTuyen[]) => void) {
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

  async create(data: Omit<UngTuyen, 'id'>): Promise<string> {
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

  async update(id: string, data: Partial<UngTuyen>): Promise<void> {
    const dbRef = ref(database, `${this.dbPath}/${id}`);
    await update(dbRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    const dbRef = ref(database, `${this.dbPath}/${id}`);
    await remove(dbRef);
  }
}
