import { ref, get, set, push, remove, update, onValue, off, query, orderByChild, limitToLast, startAt, endAt } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { NguoiLaoDong } from '@/types';

export class NguoiLaoDongRepository {
  private dbPath = 'nguoiLaoDong';

  async getAll(): Promise<NguoiLaoDong[]> {
    const dbRef = ref(database, this.dbPath);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        ...data[key],
        id: key,
      })).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    }
    return [];
  }

  async getPaginated(limit: number, lastUpdatedAt?: string): Promise<{ items: NguoiLaoDong[], hasMore: boolean }> {
    let q;
    const dbRef = ref(database, this.dbPath);
    
    // We order by updatedAt. To get the "latest" first, we might want limitToLast
    // but RTDB pagination with "next page" is easier with limitToFirst and a starting point.
    // If we want newest first, we should ideally have a negative timestamp or use limitToLast.
    // However, limitToLast(20) always returns the SAME 20 (the very last ones).
    // To get the NEXT 20 (older), we need to use endAt(lastValue).
    
    if (lastUpdatedAt) {
      q = query(dbRef, orderByChild('updatedAt'), endAt(lastUpdatedAt), limitToLast(limit + 1));
    } else {
      q = query(dbRef, orderByChild('updatedAt'), limitToLast(limit));
    }

    const snapshot = await get(q);
    if (snapshot.exists()) {
      const data = snapshot.val();
      let list = Object.keys(data).map(key => ({
        ...data[key],
        id: key,
      })).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

      // If we used endAt, it includes the pivot element
      if (lastUpdatedAt && list.length > 0) {
        list = list.filter(item => item.updatedAt !== lastUpdatedAt);
      }

      return {
        items: list,
        hasMore: list.length >= limit
      };
    }
    return { items: [], hasMore: false };
  }

  subscribeAll(callback: (data: NguoiLaoDong[]) => void) {
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

  async create(data: Omit<NguoiLaoDong, 'id'>): Promise<string> {
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

  async update(id: string, data: Partial<NguoiLaoDong>): Promise<void> {
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
