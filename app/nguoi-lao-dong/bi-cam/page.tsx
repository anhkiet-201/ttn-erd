'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NguoiLaoDongBiCamRepository } from '@/repositories/nguoiLaoDongBiCam.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { NguoiLaoDongBiCam, GioiTinh, CongTy } from '@/types';
import NguoiLaoDongBiCamModal from '@/components/modals/NguoiLaoDongBiCamModal';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUI } from '@/components/providers/UIProvider';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';

const repo = new NguoiLaoDongBiCamRepository();
const congTyRepo = new CongTyRepository();

// Reusable component for displaying violations with expansion logic
const ViolationHistory = ({ reasons, congTyMap }: { reasons: NguoiLaoDongBiCam['nguyenNhanCam'], congTyMap: Map<string, CongTy> }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasHistory = reasons && reasons.length > 1;
  
  if (!reasons || reasons.length === 0) {
     return <span className="text-xs font-medium text-red-400 italic">Chưa ghi nhận lý do</span>;
  }

  // If expanded, show all. If not, show only the latest (last item)
  const displayReasons = isExpanded ? [...reasons].reverse() : [reasons[reasons.length - 1]];

  return (
    <div className="flex flex-col gap-2">
         <div className={`bg-red-50 p-3 rounded-xl border border-red-100 max-w-xs transition-all duration-300 ${isExpanded ? 'max-h-96 overflow-y-auto custom-scrollbar' : ''}`}>
             <div className="space-y-3 divide-y divide-red-200/50">
                {displayReasons.map((reason, idx) => {
                    // Start index from 0 if expanded, otherwise it's just the latest one
                    const originalIndex = isExpanded ? (reasons.length - 1 - idx) : (reasons.length - 1);
                    return (
                        <div key={originalIndex} className={idx > 0 ? 'pt-2 animate-fadeIn' : ''}>
                            <div className="flex justify-between items-start mb-1">
                                <div className="text-[10px] font-black text-red-800 uppercase line-clamp-1 flex-1 mr-2">
                                    {congTyMap.get(reason.congty.id)?.tenCongTy || reason.congty.tenCongTy || 'Công Ty Ẩn'}
                                </div>
                                {reason.ngayNghiViec && (
                                    <div className="text-[9px] font-bold text-red-500 whitespace-nowrap">
                                        {new Date(reason.ngayNghiViec).toLocaleDateString('vi-VN')}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs font-medium text-red-600 leading-snug">
                                {reason.nguyenNhan}
                            </div>
                        </div>
                    );
                })}
             </div>
             
             {hasHistory && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="w-full mt-3 pt-2 text-[10px] font-bold text-red-400 hover:text-red-600 border-t border-red-200 uppercase flex items-center justify-center gap-1 transition-colors"
                 >
                     {isExpanded ? (
                         <>Thu gọn <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                     ) : (
                         <>Xem thêm {reasons.length - 1} vi phạm cũ <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                     )}
                 </button>
             )}
         </div>
    </div>
  );
};

export default function NguoiLaoDongBiCamPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [data, setData] = useState<NguoiLaoDongBiCam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NguoiLaoDongBiCam | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;
  const loaderRef = useRef<HTMLDivElement>(null);
  const [congTyMap, setCongTyMap] = useState<Map<string, CongTy>>(new Map());

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
    
    const unsubscribe = repo.subscribeAll((list) => {
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
    
    // Subscribe to company data for join
    const unsubCongTy = congTyRepo.subscribeAll((list) => {
        const map = new Map<string, CongTy>();
        list.forEach((c) => map.set(c.id, c));
        setCongTyMap(map);
    });
    
    return () => {
        unsubscribe();
        unsubCongTy();
    };
  }, []);

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

  useEffect(() => {
    if (searchTerm && filteredData.length < 5 && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [searchTerm, filteredData.length, hasMore, loadingMore, loading, loadMore]);

  const handleSave = async (values: Omit<NguoiLaoDongBiCam, 'id'>) => {
    try {
      if (editingItem) {
        await repo.update(editingItem.id, values);
      } else {
        // Check duplication
        if (values.cccd) {
            const existing = await repo.findByCCCD(values.cccd);
            if (existing) {
                // Automatically merge reasons with deduplication
                const existingReasons = existing.nguyenNhanCam || [];
                const incomingReasons = values.nguyenNhanCam || [];

                // Use Map to deduplicate based on content
                const uniqueReasonsMap = new Map();

                // 1. Add existing reasons first
                existingReasons.forEach(r => {
                    // Create composite key: CompanyID + Reason + Date
                    const key = `${r.congty.id}-${r.nguyenNhan.trim()}-${r.ngayNghiViec || ''}`;
                    uniqueReasonsMap.set(key, r);
                });

                // 2. Add/Overwrite with incoming reasons (prioritizing new form data)
                incomingReasons.forEach(r => {
                    const key = `${r.congty.id}-${r.nguyenNhan.trim()}-${r.ngayNghiViec || ''}`;
                    uniqueReasonsMap.set(key, r);
                });

                const mergedReasons = Array.from(uniqueReasonsMap.values());
                
                await repo.update(existing.id, {
                    ...existing,
                    ...values, // Update personal info if changed
                    nguyenNhanCam: mergedReasons,
                    updatedAt: new Date().getTime()
                });
                loadInitialData();
                setIsModalOpen(false);
                setEditingItem(null);
                return;
            }
        }
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
    if (!confirm('Bạn có chắc chắn muốn xóa người lao động này khỏi danh sách cấm?')) return;
    try {
      await repo.delete(id);
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('Đã có lỗi xảy ra');
    }
  };

  const handleEdit = (item: NguoiLaoDongBiCam) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <GlassLayout
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm người bị cấm..."
    >
      <GlassPageHeader 
        title="Danh Sách Vi Phạm"
        subtitle={`Đang hiển thị ${filteredData.length} hồ sơ bị cấm`}
        action={{
          label: "Thêm Mới",
          onClick: () => { setEditingItem(null); setIsModalOpen(true); },
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        }}
      />

      <GlassCard noPadding className="mb-10 overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50/50 border-b border-red-100">
                <th className="px-6 py-5 text-[10px] font-black text-red-400 uppercase tracking-widest">Hồ sơ / Thông tin</th>
                <th className="px-6 py-5 text-[10px] font-black text-red-400 uppercase tracking-widest text-center">Giới tính / Năm sinh</th>
                <th className="px-6 py-5 text-[10px] font-black text-red-400 uppercase tracking-widest">Liên lạc & CCCD</th>
                <th className="px-6 py-5 text-[10px] font-black text-red-400 uppercase tracking-widest">Thông tin vi phạm</th>
                <th className="px-6 py-5 text-[10px] font-black text-red-400 uppercase tracking-widest text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                      <span className="text-sm font-semibold text-red-400 animate-pulse">Đang tải danh sách cấm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center text-center p-8">
                       <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Không có hồ sơ vi phạm</h3>
                      <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Hệ thống chưa ghi nhận người lao động nào bị cấm.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/30 transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-tr from-red-600 to-red-400 shadow-red-100 group-hover:scale-110 transition-transform duration-300`}>
                          {item.tenNguoiLaoDong.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 leading-tight mb-0.5 group-hover:text-red-600 transition-colors uppercase tracking-tight">{item.tenNguoiLaoDong}</div>
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
                         <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></span>
                                <span className="text-xs font-bold text-gray-600 font-mono">{item.soDienThoai || 'N/A'}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0h4" /></svg></span>
                                <span className="text-xs font-bold text-gray-500 font-mono">{item.cccd || 'N/A'}</span>
                             </div>
                         </div>
                    </td>
                    <td className="px-6 py-5">
                        <ViolationHistory reasons={item.nguyenNhanCam} congTyMap={congTyMap} />
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
      
      {/* Mobile list view */}
       <div className="lg:hidden space-y-4 pb-20">
        {loading ? (
             <GlassCard className="text-center py-20">
                <div className="w-8 h-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Đang tải danh sách...</span>
            </GlassCard>
        ) : filteredData.length === 0 ? (
             <GlassCard className="text-center py-20">
                 <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Không có hồ sơ vi phạm</span>
             </GlassCard>
        ) : (
            filteredData.map(item => (
                <GlassCard key={item.id} noPadding>
                    <div className="p-5 border-l-4 border-red-500">
                        <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md bg-gradient-to-tr from-red-600 to-red-400`}>
                                    {item.tenNguoiLaoDong.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-sm uppercase leading-tight">{item.tenNguoiLaoDong}</h3>
                                     <div className="text-[10px] text-gray-400 font-bold font-mono">CCCD: {item.cccd || 'Trống'}</div>
                                </div>
                             </div>
                             <button
                                onClick={() => handleEdit(item)} 
                                className="p-2 bg-gray-50 text-gray-400 rounded-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </button>
                        </div>
                        
                        <div className="mb-4">
                            <ViolationHistory reasons={item.nguyenNhanCam} congTyMap={congTyMap} />
                        </div>
                        
                        <GlassButton 
                            variant="danger" 
                            className="w-full !rounded-xl !py-2.5" 
                            onClick={() => handleDelete(item.id)}
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01" /></svg>}
                        >
                            Xóa khỏi danh sách cấm
                        </GlassButton>
                    </div>
                </GlassCard>
            ))
        )}
       </div>

      <div ref={loaderRef} className="py-10 flex justify-center bg-transparent mt-4">
        {(loadingMore || (hasMore && !searchTerm)) && (
          <div className="flex items-center gap-3 text-red-300">
            <div className="w-5 h-5 border-2 border-red-100 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <NguoiLaoDongBiCamModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        initialData={editingItem}
      />
    </GlassLayout>
  );
}
