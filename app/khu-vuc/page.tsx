'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';
import { KhuVuc } from '@/types';
import KhuVucModal from '@/components/modals/KhuVucModal';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';

const repository = new KhuVucRepository();

export default function KhuVucPage() {
  const [data, setData] = useState<KhuVuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<KhuVuc | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = repository.subscribeAll((items) => {
      setData(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (item: KhuVuc) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khu vực này?')) {
      await repository.delete(id);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.tenKhuVuc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  return (
    <GlassLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Tìm kiếm khu vực..."
    >
      <GlassPageHeader 
        title="Quản Lý Khu Vực"
        subtitle={`Hiện có ${filteredData.length} khu vực trong hệ thống`}
        action={{
          label: "Thêm Khu Vực",
          onClick: handleAdd
        }}
      />

      {/* Desktop Table View */}
      <div className="hidden md:block max-w-5xl mx-auto">
        <GlassCard noPadding className="overflow-hidden border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100/50">
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Thông tin khu vực</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-black text-gray-300 uppercase tracking-[0.2em]">Không tìm thấy khu vực nào</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                          {item.tenKhuVuc.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-700 uppercase tracking-tight group-hover:text-blue-700 transition-colors">{item.tenKhuVuc}</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 opacity-50">ID: {item.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <GlassButton 
                          variant="ghost" 
                          className="!p-2.5 !rounded-xl hover:!bg-blue-100 hover:!text-blue-600"
                          onClick={() => handleEdit(item)}
                          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        />
                        <GlassButton 
                          variant="ghost" 
                          className="!p-2.5 !rounded-xl hover:!bg-red-50 hover:!text-red-500"
                          onClick={() => handleDelete(item.id)}
                          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2" /></svg>}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GlassCard>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[32px] p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Đang tải...</span>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[32px] p-12 text-center uppercase tracking-widest text-xs font-black text-gray-300">
            Không có dữ liệu
          </div>
        ) : (
          filteredData.map((item) => (
            <GlassCard key={item.id} className="group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {item.tenKhuVuc.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 uppercase tracking-tight">{item.tenKhuVuc}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">Khu vực hệ thống</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-50/50">
                <GlassButton 
                  variant="secondary" 
                  className="flex-1 !rounded-[20px] !py-3"
                  onClick={() => handleEdit(item)}
                >
                  SỬA
                </GlassButton>
                <GlassButton 
                  variant="danger" 
                  className="flex-1 !rounded-[20px] !py-3"
                  onClick={() => handleDelete(item.id)}
                >
                  XÓA
                </GlassButton>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <KhuVucModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedItem}
      />
    </GlassLayout>
  );
}
