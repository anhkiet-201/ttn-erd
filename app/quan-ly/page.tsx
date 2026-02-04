'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { QuanLy } from '@/types';
import QuanLyModal from '@/components/modals/QuanLyModal';
import { useUI } from '@/components/providers/UIProvider';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';

const repository = new QuanLyRepository();

export default function QuanLyPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [data, setData] = useState<QuanLy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QuanLy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = repository.subscribeAll((items) => {
      setData(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (item: QuanLy) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên quản lý này?')) return;
    try {
      await repository.delete(id);
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('Đã có lỗi xảy ra khi xóa');
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.tenQuanLy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.soDienThoai.includes(searchQuery)
    );
  }, [data, searchQuery]);

  return (
    <GlassLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Tìm kiếm tên hoặc số điện thoại quản lý..."
    >
      <GlassPageHeader 
        title="Đội Ngũ Quản Lý"
        subtitle={`Đang quản lý ${filteredData.length} nhân sự`}
        action={{
          label: "Thêm Quản Lý",
          onClick: handleAdd
        }}
      />

      {/* Desktop Table View */}
      <GlassCard noPadding className="mb-10 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hồ sơ / Tên quản lý</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số điện thoại</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-sm font-semibold text-gray-400 animate-pulse">Đang nạp danh sách...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 text-gray-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Khoe không tìm thấy ai</h3>
                      <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto font-bold uppercase italic tracking-widest">Hãy thử tìm kiếm với các từ khóa khác.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-300">
                          {item.tenQuanLy.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.tenQuanLy}</div>
                          <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Mã QL: {item.id.slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                             </div>
                             <span className="text-sm font-black text-gray-700 font-mono tracking-wider">{item.soDienThoai}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                        <GlassButton 
                          variant="ghost" 
                          className="!p-2.5 !rounded-xl"
                          onClick={() => handleEdit(item)}
                          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        />
                        <GlassButton 
                          variant="danger" 
                          className="!p-2.5 !rounded-xl"
                          onClick={() => handleDelete(item.id)}
                          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01" /></svg>}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-6 pb-20">
        {loading ? (
          <GlassCard className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Đang nạp dữ liệu...</span>
          </GlassCard>
        ) : filteredData.length === 0 ? (
          <GlassCard className="text-center py-20">
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Không có nhân sự nào</span>
          </GlassCard>
        ) : (
          filteredData.map((item) => (
            <GlassCard key={item.id} noPadding>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">
                      {item.tenQuanLy.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg tracking-tight mb-1 uppercase leading-tight">{item.tenQuanLy}</h3>
                      <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Mã: {item.id.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                  <GlassButton 
                    variant="ghost" 
                    className="!p-2.5 !rounded-xl !bg-gray-50/50"
                    onClick={() => handleEdit(item)}
                    icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                  />
                </div>

                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div className="text-base font-black text-gray-700 font-mono tracking-widest">{item.soDienThoai}</div>
                    </div>
                    <a 
                        href={`tel:${item.soDienThoai}`}
                        className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 active:scale-90 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </a>
                </div>

                <GlassButton 
                  variant="danger" 
                  className="w-full !h-14 !rounded-2xl !bg-rose-50 !text-rose-600 !border-rose-100 !text-xs font-black uppercase tracking-widest" 
                  onClick={() => handleDelete(item.id)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01" /></svg>}
                >
                  XÓA QUẢN LÝ
                </GlassButton>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <QuanLyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedItem}
      />
    </GlassLayout>
  );
}
