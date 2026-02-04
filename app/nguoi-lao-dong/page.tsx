'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { NguoiLaoDong, GioiTinh } from '@/types';
import NguoiLaoDongModal from '@/components/modals/NguoiLaoDongModal';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUI } from '@/components/providers/UIProvider';

const repo = new NguoiLaoDongRepository();

export default function NguoiLaoDongPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [data, setData] = useState<NguoiLaoDong[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NguoiLaoDong | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 12;
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
    
    // Subscribe to all for real-time updates on visible items
    const unsubscribe = repo.subscribeAll((list) => {
      setData(prev => {
        const updated = prev.map(item => {
          const match = list.find(l => l.id === item.id);
          return match ? match : item;
        });
        return updated.filter(item => list.find(l => l.id === item.id));
      });
    });
    return () => unsubscribe();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const result = await repo.getPaginated(pageSize);
    setData(result.items);
    setHasMore(result.hasMore);
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const lastItem = data[data.length - 1];
    const result = await repo.getPaginated(pageSize, lastItem?.updatedAt as unknown as string);
    
    setData(prev => [...prev, ...result.items]);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }, [loadingMore, hasMore, data]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  const filteredData = data.filter(item => 
    item.tenNguoiLaoDong.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.soDienThoai && item.soDienThoai.includes(searchTerm)) ||
    (item.cccd && item.cccd.includes(searchTerm))
  );

  // Auto-fetch if filtered results are too few
  useEffect(() => {
    if (searchTerm && filteredData.length < 5 && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [searchTerm, filteredData.length, hasMore, loadingMore, loading, loadMore]);

  const handleCreate = async (values: Omit<NguoiLaoDong, 'id'>) => {
    try {
      await repo.create(values);
      setIsModalOpen(false);
      // Refresh to show new item at top
      loadInitialData();
    } catch (error) {
      console.error('Lỗi khi tạo:', error);
      alert('Đã có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleUpdate = async (values: Omit<NguoiLaoDong, 'id'>) => {
    if (!editingItem) return;
    try {
      await repo.update(editingItem.id, values);
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      alert('Đã có lỗi xảy ra khi cập nhật dữ liệu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người lao động này?')) return;
    try {
      await repo.delete(id);
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('Đã có lỗi xảy ra khi xóa dữ liệu');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <span className="text-lg md:text-xl font-bold">E</span>
            </div>
            <span className="text-xl md:text-[22px] font-medium text-gray-700 tracking-tight hidden min-[400px]:block">ERD</span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-2 md:mx-4 min-w-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm người lao động..."
              className="block w-full h-10 md:h-11 bg-gray-100 border-none rounded-lg pl-10 md:pl-11 pr-4 focus:bg-white focus:ring-0 focus:shadow-md transition-all text-sm text-gray-700 truncate"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 ml-auto flex-shrink-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 font-bold">
            {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-4 md:p-8">
          <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800">Người lao động</h2>
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span className="font-semibold">Thêm Mới</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {filteredData.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-blue-500">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-colors" title="Chỉnh sửa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Xóa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{item.tenNguoiLaoDong}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.gioiTinh === GioiTinh.NAM ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{item.gioiTinh === GioiTinh.NAM ? 'Nam' : 'Nữ'}</span>
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full uppercase tracking-wider">SN: {item.namSinh}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {item.soDienThoai || 'Chưa có SĐT'}
                    </div>
                    {item.cccd && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0h4" /></svg>
                        CCCD: {item.cccd}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div ref={loaderRef} className="py-8 flex justify-center">
                {(loadingMore || (hasMore)) && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-300"></div>
                    <span className="text-sm font-medium">
                      {searchTerm ? 'Đang tìm kiếm thêm...' : 'Đang tải thêm...'}
                    </span>
                  </div>
                )}
                {!hasMore && data.length > 0 && (
                  <span className="text-sm text-slate-300 font-medium tracking-wide border-t border-slate-50 pt-4 w-full text-center">
                    {searchTerm ? `Đã tìm xong trong ${data.length} bản ghi` : 'Đã tải hết danh sách'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8 text-center mx-auto max-w-7xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-600 mb-1">Không tìm thấy người lao động</h3>
              <p className="text-sm text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm người mới.</p>
            </div>
          )}
        </main>
      </div>

      <NguoiLaoDongModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={editingItem ? handleUpdate : handleCreate}
        initialData={editingItem}
      />
    </div>
  );
}
