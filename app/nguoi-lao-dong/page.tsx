'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import GlassTooltip from '@/components/glass/GlassTooltip';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { NguoiLaoDongBiCamRepository } from '@/repositories/nguoiLaoDongBiCam.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { NguoiLaoDong, GioiTinh, NguoiLaoDongBiCam, CongTy } from '@/types';
import NguoiLaoDongModal from '@/components/modals/NguoiLaoDongModal';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUI } from '@/components/providers/UIProvider';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';

const repo = new NguoiLaoDongRepository();
const bannedRepo = new NguoiLaoDongBiCamRepository();
const congTyRepo = new CongTyRepository();

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
  const pageSize = 15; // Increased slightly for table view
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Store Map of banned CCCDs for quick lookup and details
  const [bannedMap, setBannedMap] = useState<Map<string, NguoiLaoDongBiCam>>(new Map());
  const [congTyMap, setCongTyMap] = useState<Map<string, CongTy>>(new Map());

  const loadInitialData = async () => {
    setLoading(true);
    const result = await repo.getPaginated(pageSize);
    setData(result.items);
    setHasMore(result.hasMore);
    setLoading(false);
  };
  
  // Fetch banned list and company list on mount
  useEffect(() => {
    const fetchBannedList = () => {
        const unsubscribe = bannedRepo.subscribeAll((list: NguoiLaoDongBiCam[]) => {
             const map = new Map<string, NguoiLaoDongBiCam>();
             list.forEach((i: NguoiLaoDongBiCam) => {
                 if (i.cccd) map.set(i.cccd, i);
             });
             setBannedMap(map);
        });
        return unsubscribe;
    };
    
    const fetchCompanyList = () => {
        const unsubscribe = congTyRepo.subscribeAll((list: CongTy[]) => {
            const map = new Map<string, CongTy>();
            list.forEach((c) => map.set(c.id, c));
            setCongTyMap(map);
        });
        return unsubscribe;
    };

    const unsubBanned = fetchBannedList();
    const unsubCongTy = fetchCompanyList();
    
    return () => {
        if (unsubBanned) unsubBanned();
        if (unsubCongTy) unsubCongTy();
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const lastItem = data[data.length - 1];
    const result = await repo.getPaginated(pageSize, lastItem?.updatedAt as unknown as string);
    
    setData(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = result.items.filter(i => !existingIds.has(i.id));
        return [...prev, ...newItems];
    });
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }, [loadingMore, hasMore, data]);

  useEffect(() => {
    loadInitialData();
    
    const unsubscribe = repo.subscribeAll((list: NguoiLaoDong[]) => {
      setData(prev => {
        const listMap = new Map(list.map(item => [item.id, item]));
        
        const updated = prev.map(item => {
          const match = listMap.get(item.id);
          return match ? match : item;
        }).filter(item => listMap.has(item.id));

        const newestCurrent = prev[0]?.updatedAt || '';
        const newItems = list.filter(item => {
          const isInState = prev.some(p => p.id === item.id);
          const isNewer = (item.updatedAt || 0) > (newestCurrent as unknown as number);
          return !isInState && isNewer;
        });

        const result = [...newItems, ...updated].sort((a, b) => {
            const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
            const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
            return timeB - timeA;
        });
        
        const seen = new Set();
        return result.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
    });
    return () => unsubscribe();
  }, []);

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

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.tenNguoiLaoDong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.soDienThoai && item.soDienThoai.includes(searchTerm)) ||
      (item.cccd && item.cccd.includes(searchTerm))
    );
  }, [data, searchTerm]);

  // Auto-fetch if filtered results are too few
  useEffect(() => {
    if (searchTerm && filteredData.length < 5 && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [searchTerm, filteredData.length, hasMore, loadingMore, loading, loadMore]);

  const handleSave = async (values: Omit<NguoiLaoDong, 'id'>) => {
    try {
      if (editingItem) {
        await repo.update(editingItem.id, values);
      } else {
        await repo.create(values);
        loadInitialData();
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      alert('Đã có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người lao động này?')) return;
    try {
      await repo.delete(id);
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('Đã có lỗi xảy ra');
    }
  };

  const handleEdit = (item: NguoiLaoDong) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const renderBannedTooltip = (bannedInfo: NguoiLaoDongBiCam) => (
    <div className="space-y-2">
        <div className="font-bold text-red-400 border-b border-white/10 pb-1 mb-1">
            HỒ SƠ VI PHẠM ({bannedInfo.nguyenNhanCam?.length || 0})
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {bannedInfo.nguyenNhanCam?.map((reason, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span className="uppercase font-bold">
                            {congTyMap.get(reason.congty.id)?.tenCongTy || reason.congty.tenCongTy}
                        </span>
                        {reason.ngayNghiViec && <span>{new Date(reason.ngayNghiViec).toLocaleDateString('vi-VN')}</span>}
                    </div>
                    <div className="text-white text-[11px] leading-tight font-medium">
                        {reason.nguyenNhan}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <GlassLayout
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm tên, SĐT hoặc CCCD người lao động..."
    >
      <GlassPageHeader 
        title="Quản Lý Người Lao Động"
        subtitle={`Đang hiển thị ${filteredData.length} hồ sơ`}
        action={{
          label: "Thêm Mới",
          onClick: () => { setEditingItem(null); setIsModalOpen(true); }
        }}
      />

      <GlassCard noPadding className="mb-10 overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hồ sơ / Thông tin</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Giới tính / Năm sinh</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Liên lạc</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">CCCD</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-sm font-semibold text-gray-400 animate-pulse">Đang đồng bộ hồ sơ...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Không tìm thấy người lao động</h3>
                      <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Thử tìm kiếm với tên hoặc số điện thoại khác.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const bannedInfo = item.cccd ? bannedMap.get(item.cccd) : undefined;
                  const isBanned = !!bannedInfo;
                  
                  const RowComponent = isBanned ? GlassTooltip : 'tr';
                  const rowProps = isBanned 
                    ? { 
                        as: 'tr',
                        content: renderBannedTooltip(bannedInfo!), 
                        className: 'bg-red-50 hover:bg-red-100 transition-colors duration-300 group cursor-help'
                      }
                    : { 
                        className: 'hover:bg-gray-50/50 transition-colors duration-300 group'
                      };

                  return (
                    // @ts-ignore - Polymorphic component typing complexity
                    <RowComponent key={item.id} {...rowProps}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${item.gioiTinh === GioiTinh.NAM ? 'bg-gradient-to-tr from-blue-600 to-blue-400 shadow-blue-100' : 'bg-gradient-to-tr from-pink-600 to-pink-400 shadow-pink-100'} group-hover:scale-110 transition-transform duration-300`}>
                            {item.tenNguoiLaoDong.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-black leading-tight mb-0.5 uppercase tracking-tight ${isBanned ? 'text-red-700' : 'text-gray-900 group-hover:text-blue-600'} transition-colors`}>
                                {item.tenNguoiLaoDong}
                                {isBanned && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-200 text-red-700 text-[9px] rounded uppercase tracking-wider font-black">Cấm</span>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">ID: {item.id.slice(-6).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.gioiTinh === GioiTinh.NAM ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' : 'bg-pink-50 text-pink-600 ring-1 ring-pink-100'}`}>
                                  {item.gioiTinh === GioiTinh.NAM ? 'NAM' : 'NỮ'}
                              </span>
                              <span className="text-xs font-bold text-gray-500 font-mono italic">NS: {item.namSinh}</span>
                          </div>
                      </td>
                      <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              </div>
                              <span className="text-sm font-black text-gray-700 font-mono">{item.soDienThoai || 'N/A'}</span>
                          </div>
                      </td>
                      <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                              <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0h4" /></svg>
                              </div>
                              <div className="flex flex-col">
                                  <span className={`text-xs font-black tracking-wider font-mono uppercase ${isBanned ? 'text-red-600' : 'text-gray-500'}`}>{item.cccd || 'TRỐNG'}</span>
                                  {isBanned && <span className="text-[8px] font-bold text-red-500 uppercase tracking-tight">Trùng hồ sơ cấm</span>}
                              </div>
                          </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                          <GlassButton 
                            variant="ghost" 
                            className="!p-2.5 !rounded-xl"
                            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                            icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                          />
                          <GlassButton 
                            variant="danger" 
                            className="!p-2.5 !rounded-xl"
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01" /></svg>}
                          />
                        </div>
                      </td>
                    </RowComponent>
                  )
                })
              )}
            </tbody>
          </table>
          
        </div>
      </GlassCard>

      {/* Mobile/Tablet Card View - Visible up to lg (large screens) where table takes over */}
      <div className="lg:hidden space-y-4 pb-20">
        {loading ? (
          <GlassCard className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Đang chuẩn bị dữ liệu...</span>
          </GlassCard>
        ) : filteredData.length === 0 ? (
          <GlassCard className="text-center py-20">
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Không có hồ sơ nào phù hợp</span>
          </GlassCard>
        ) : (
          filteredData.map((item) => {
            const bannedInfo = item.cccd ? bannedMap.get(item.cccd) : undefined;
            const isBanned = !!bannedInfo;
            
            return (
              <GlassCard key={item.id} noPadding className={isBanned ? '!border-red-200 !bg-red-50/30' : ''}>
                <div className={`p-5 ${isBanned ? 'border-l-4 border-red-500' : ''}`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${item.gioiTinh === GioiTinh.NAM ? 'bg-gradient-to-tr from-blue-600 to-blue-400 shadow-blue-100' : 'bg-gradient-to-tr from-pink-600 to-pink-400 shadow-pink-100'}`}>
                        {item.tenNguoiLaoDong.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                             <h3 className={`font-black text-base tracking-tight mb-0.5 uppercase leading-tight line-clamp-1 ${isBanned ? 'text-red-700' : 'text-gray-900'}`}>{item.tenNguoiLaoDong}</h3>
                             {isBanned && (
                                <GlassTooltip content={renderBannedTooltip(bannedInfo!)}>
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] rounded uppercase font-black cursor-help">Cấm</span>
                                </GlassTooltip>
                             )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${item.gioiTinh === GioiTinh.NAM ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' : 'bg-pink-50 text-pink-600 ring-1 ring-pink-100'}`}>
                               {item.gioiTinh === GioiTinh.NAM ? 'NAM' : 'NỮ'}
                           </span>
                           <span className="text-[10px] font-bold text-gray-400 font-mono">NS: {item.namSinh}</span>
                        </div>
                      </div>
                    </div>
                    <GlassButton 
                      variant="ghost" 
                      className="!p-2 !rounded-xl !bg-gray-50/50"
                      onClick={() => handleEdit(item)}
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                    />
                  </div>
  
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Số điện thoại</div>
                      <div className="text-xs font-black text-gray-700 font-mono">{item.soDienThoai || 'TRỐNG'}</div>
                    </div>
                    <div className={`bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 ${isBanned ? '!bg-red-50 !border-red-100' : ''}`}>
                      <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isBanned ? 'text-red-400' : 'text-gray-400'}`}>CCCD / ID</div>
                      <div className={`text-xs font-black font-mono truncate ${isBanned ? 'text-red-600' : 'text-gray-500'}`}>{item.cccd || 'CHƯA CÓ'}</div>
                    </div>
                  </div>
  
                  <div className="flex gap-2.5">
                    <a 
                      href={`tel:${item.soDienThoai}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white h-11 rounded-xl font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all text-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      GỌI
                    </a>
                    <GlassButton 
                      variant="danger" 
                      className="flex-1 !h-11 !rounded-xl !bg-rose-50 !text-rose-600 !border-rose-100 !text-[10px]" 
                      onClick={() => handleDelete(item.id)}
                    >
                      XÓA
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      <div ref={loaderRef} className="py-10 flex justify-center bg-transparent mt-4">
        {(loadingMore || (hasMore && !searchTerm)) && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm font-black uppercase tracking-widest">Đang tải hồ sơ tiếp theo...</span>
          </div>
        )}
        {!hasMore && filteredData.length > 0 && !searchTerm && (
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Đã hiển thị toàn bộ người lao động</span>
        )}
      </div>

      <NguoiLaoDongModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        initialData={editingItem}
      />
    </GlassLayout>
  );
}
