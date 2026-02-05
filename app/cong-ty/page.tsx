'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { CongTy, QuanLy } from '@/types';
import CongTyModal from '@/components/modals/CongTyModal';
import { useUI } from '@/components/providers/UIProvider';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';

const repository = new CongTyRepository();
const quanLyRepository = new QuanLyRepository();

export default function CongTyPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [data, setData] = useState<CongTy[]>([]);
  const [quanLys, setQuanLys] = useState<QuanLy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CongTy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubCongTy = repository.subscribeAll((items) => {
      setData(items);
      setLoading(false);
    });

    const unsubQuanLy = quanLyRepository.subscribeAll((items) => {
      setQuanLys(items);
    });

    return () => {
      unsubCongTy();
      unsubQuanLy();
    };
  }, []);

  const handleEdit = (item: CongTy) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa công ty này?')) {
      await repository.delete(id);
    }
  };

  const filteredData = useMemo(() => {
    return data.map(congTy => {
      let updatedCongTy = { ...congTy };
      if (Array.isArray(updatedCongTy.quanLy)) {
        updatedCongTy.quanLy = updatedCongTy.quanLy.map(q => {
          const liveManager = quanLys.find(m => m.id === q.id);
          return liveManager || q;
        });
      }
      return updatedCongTy;
    }).filter(item => 
      item.tenCongTy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.khuVuc?.tenKhuVuc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(item.quanLy) && item.quanLy.some(q => 
        q.tenQuanLy.toLowerCase().includes(searchQuery.toLowerCase()) || 
        q.soDienThoai.includes(searchQuery)
      ))
    );
  }, [data, quanLys, searchQuery]);

  return (
    <GlassLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Tìm kiếm công ty, địa chỉ hoặc quản lý..."
    >
      <GlassPageHeader 
        title="Quản Lý Công Ty"
        subtitle={`Đang hiển thị ${filteredData.length} đơn vị`}
        action={{
          label: "Thêm Công Ty",
          onClick: handleAdd
        }}
      />

      <GlassCard noPadding className="mb-10 overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên Công Ty / Đơn vị</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Khu Vực / Địa Chỉ</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Đội ngũ Quản lý</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-sm font-semibold text-gray-400 animate-pulse">Đang đồng bộ dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Không tìm thấy công ty</h3>
                      <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Thử tìm kiếm với từ khóa khác hoặc thêm công ty mới.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-300">
                          {item.tenCongTy.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.tenCongTy}</div>
                          <div className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">Mã: {item.id.slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex w-fit px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider ring-1 ring-blue-100">
                          {item.khuVuc?.tenKhuVuc || 'N/A'}
                        </span>
                        {(item.diaChi || item.khuVuc?.diaChi) && (
                          <div className="flex items-start gap-1.5 text-gray-500">
                            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="text-[11px] leading-relaxed font-semibold max-w-[240px] line-clamp-2 italic">{item.diaChi || item.khuVuc?.diaChi}</span>
                          </div>
                        )}
                        {(item.mapUrl || item.khuVuc?.mapUrl) && (
                          <a 
                            href={item.mapUrl || item.khuVuc?.mapUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 font-black hover:underline flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            BẢN ĐỒ CHI TIẾT
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {Array.isArray(item.quanLy) && item.quanLy.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.quanLy.map((ql, idx) => (
                            <div key={idx} className="bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100 flex flex-col min-w-[120px]">
                              <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{ql.tenQuanLy}</span>
                              <span className="text-[10px] text-blue-600 font-bold font-mono">{ql.soDienThoai}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-black tracking-widest uppercase italic">- Chưa gán -</span>
                      )}
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

      {/* Mobile/Tablet Card View - Visible up to lg */}
      <div className="lg:hidden space-y-4 pb-20">
        {loading ? (
          <GlassCard className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
          </GlassCard>
        ) : filteredData.length === 0 ? (
          <GlassCard className="text-center py-20">
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Không tìm thấy công ty nào</span>
          </GlassCard>
        ) : (
          filteredData.map((item) => (
            <GlassCard key={item.id} noPadding>
              <div className="p-5">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-800/10">
                      {item.tenCongTy.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base tracking-tight mb-0.5 uppercase leading-tight line-clamp-1">{item.tenCongTy}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black uppercase tracking-wider ring-1 ring-blue-100">
                          {item.khuVuc?.tenKhuVuc || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <GlassButton 
                    variant="ghost" 
                    className="!p-2 !rounded-xl !bg-gray-50"
                    onClick={() => handleEdit(item)}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                  />
                </div>

                <div className="space-y-4 mb-5">
                  {(item.diaChi || item.khuVuc?.diaChi) && (
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Địa chỉ trụ sở</div>
                      <div className="text-xs font-bold text-gray-700 leading-relaxed italic line-clamp-2">{item.diaChi || item.khuVuc?.diaChi}</div>
                      {(item.mapUrl || item.khuVuc?.mapUrl) && (
                        <a 
                          href={item.mapUrl || item.khuVuc?.mapUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] text-blue-600 font-black hover:underline flex items-center gap-1 mt-2.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.485V5.515a2 2 0 011.553-1.944L9 2l6 3 5.447-2.724A2 2 0 0123 4.118v11.882a2 2 0 01-1.553 1.944L15 22l-6-3z" /></svg>
                          MỞ BẢN ĐỒ
                        </a>
                      )}
                    </div>
                  )}

                  {Array.isArray(item.quanLy) && item.quanLy.length > 0 && (
                    <div className="space-y-2">
                       <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Đội ngũ Quản lý {item.quanLy.length > 0 && `(${item.quanLy.length})`}</div>
                       <div className="grid grid-cols-1 gap-2">
                          {item.quanLy.map((ql, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[9px]">
                                  {ql.tenQuanLy.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{ql.tenQuanLy}</span>
                                  <span className="text-[9px] text-blue-600 font-bold font-mono">{ql.soDienThoai}</span>
                                </div>
                              </div>
                              <a href={`tel:${ql.soDienThoai}`} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              </a>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <GlassButton 
                    variant="danger" 
                    className="flex-1 !h-11 !rounded-xl !bg-rose-50 !text-rose-600 !border-rose-100 !text-[10px]" 
                    onClick={() => handleDelete(item.id)}
                  >
                    XÓA ĐƠN VỊ
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <CongTyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedItem}
      />
    </GlassLayout>
  );
}
