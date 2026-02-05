'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { UngTuyenRepository } from '@/repositories/ungTuyen.repository';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';
import { UngTuyen, NguoiLaoDong, TrangThaiTuyen, GioiTinh, CongTy, KhuVuc, UngTuyenWithDetails } from '@/types';
import UngTuyenModal from '@/components/modals/UngTuyenModal';
import RescheduleModal from '@/components/modals/RescheduleModal';
import { toast } from 'react-hot-toast';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUI } from '@/components/providers/UIProvider';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import { GlassFilterBar, GlassSelect } from '@/components/glass/GlassForm';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';

const ungTuyenRepo = new UngTuyenRepository();
const workerRepo = new NguoiLaoDongRepository();
const congTyRepo = new CongTyRepository();
const khuVucRepo = new KhuVucRepository();

export default function UngTuyenPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [ungTuyens, setUngTuyens] = useState<UngTuyen[]>([]);
  const [workers, setWorkers] = useState<NguoiLaoDong[]>([]);
  const [companies, setCompanies] = useState<CongTy[]>([]);
  const [khuVucs, setKhuVucs] = useState<KhuVuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;
  const loaderRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UngTuyen | null>(null);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());
  
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<UngTuyenWithDetails | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGioiTinh, setFilterGioiTinh] = useState<string>('ALL');
  const [filterCongTyId, setFilterCongTyId] = useState<string>('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState<string>('ALL');

  const loadInitialData = async () => {
    setLoading(true);
    const result = await ungTuyenRepo.getPaginated(pageSize);
    setUngTuyens(result.items);
    setHasMore(result.hasMore);
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const lastItem = ungTuyens[ungTuyens.length - 1];
    const result = await ungTuyenRepo.getPaginated(pageSize, lastItem?.updatedAt, lastItem?.id);
    
    setUngTuyens(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const newItems = result.items.filter(i => !existingIds.has(i.id));
      return [...prev, ...newItems];
    });
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }, [loadingMore, hasMore, ungTuyens]);

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

  useEffect(() => {
    loadInitialData();
    
    const unsubUngTuyen = ungTuyenRepo.subscribeAll((list) => {
      setUngTuyens(prev => {
        // Optimize: Use a Map for fast lookup
        const listMap = new Map(list.map(item => [item.id, item]));
        
        // Update existing items and remove deleted ones
        const updated = prev.map(item => {
          const match = listMap.get(item.id);
          return match ? match : item;
        }).filter(item => listMap.has(item.id));

        // If you want to automatically add NEW items that should be at the top:
        // (Only if they are newer than our newest item)
        const newestCurrent = prev[0]?.updatedAt || '';
        const newItems = list.filter(item => {
          const isInState = prev.some(p => p.id === item.id);
          const isNewer = (item.updatedAt || '') > newestCurrent;
          return !isInState && isNewer;
        });

        const result = [...newItems, ...updated].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        
        // Final uniqueness check just in case
        const seen = new Set();
        return result.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
    });
    const unsubWorker = workerRepo.subscribeAll(setWorkers);
    const unsubCongTy = congTyRepo.subscribeAll(setCompanies);
    const unsubKhuVuc = khuVucRepo.subscribeAll(setKhuVucs);

    return () => {
      unsubUngTuyen();
      unsubWorker();
      unsubCongTy();
      unsubKhuVuc();
    };
  }, []);

  const workerMap = useMemo(() => new Map(workers.map(w => [w.id, w])), [workers]);
  const khuVucMap = useMemo(() => new Map(khuVucs.map(kv => [kv.id, kv])), [khuVucs]);
  const companyMap = useMemo(() => {
    return new Map(companies.map(c => {
      if (c.khuVuc?.id) {
        const fullKhuVuc = khuVucMap.get(c.khuVuc.id);
        if (fullKhuVuc) {
          return [c.id, { ...c, khuVuc: fullKhuVuc }];
        }
      }
      return [c.id, c];
    }));
  }, [companies, khuVucMap]);

  const joinedData = useMemo(() => {
    return ungTuyens.map(ut => {
      const worker = workerMap.get(ut.nguoiLaoDongId);
      const company = companyMap.get(ut.congTyId);
      
      const fallbackWorker = { 
        tenNguoiLaoDong: workers.length > 0 ? 'Đang cập nhật...' : '-', 
        soDienThoai: '', 
        namSinh: 0, 
        gioiTinh: GioiTinh.NAM, 
        cccd: '' 
      } as any;

      return {
        ...ut,
        nguoiLaoDong: worker || fallbackWorker,
        congTy: company || { tenCongTy: 'N/A' } as any,
      };
    });
  }, [ungTuyens, workerMap, companyMap]);

  const filteredData = useMemo(() => {
    let data = joinedData;
    
    // 1. Search filter
    const lowerSearch = searchQuery.toLowerCase().trim();
    if (lowerSearch) {
      data = data.filter(item => 
        item.nguoiLaoDong.tenNguoiLaoDong.toLowerCase().includes(lowerSearch) ||
        (item.nguoiLaoDong.soDienThoai && item.nguoiLaoDong.soDienThoai.includes(lowerSearch)) ||
        (item.nguoiLaoDong.cccd && item.nguoiLaoDong.cccd.includes(lowerSearch)) ||
        (item.congTy?.tenCongTy && item.congTy.tenCongTy.toLowerCase().includes(lowerSearch)) ||
        (item.congTy?.diaChi && item.congTy.diaChi.toLowerCase().includes(lowerSearch)) ||
        (item.congTy?.khuVuc?.diaChi && item.congTy.khuVuc.diaChi.toLowerCase().includes(lowerSearch))
      );
    }

    // 2. Gender filter
    if (filterGioiTinh !== 'ALL') {
      data = data.filter(item => item.nguoiLaoDong.gioiTinh === filterGioiTinh);
    }

    // 3. Company filter
    if (filterCongTyId !== 'ALL') {
      data = data.filter(item => item.congTyId === filterCongTyId);
    }

    // 4. Status filter
    if (filterTrangThai !== 'ALL') {
      data = data.filter(item => item.trangThaiTuyen === filterTrangThai);
    }

    return data;
  }, [joinedData, searchQuery, filterGioiTinh, filterCongTyId, filterTrangThai]);

  // Auto-fetch if filtered results are too few
  useEffect(() => {
    const isFiltered = searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL';
    if (isFiltered && filteredData.length < 5 && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [searchQuery, filterGioiTinh, filterCongTyId, filterTrangThai, filteredData.length, hasMore, loadingMore, loading, loadMore]);

  const handleSave = async (values: Omit<UngTuyen, 'id'>, id?: string) => {
    const targetId = id || editingItem?.id;
    try {
      if (targetId) {
        await ungTuyenRepo.update(targetId, values);
        setIsModalOpen(false);
        setEditingItem(null);
        toast.success(id ? 'Đã thay thế ứng tuyển cũ' : 'Cập nhật thành công');
      } else {
        await ungTuyenRepo.create(values);
        setIsModalOpen(false);
        toast.success('Gán ứng tuyển thành công');
        loadInitialData();
      }
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleQuickStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await ungTuyenRepo.update(id, { trangThaiTuyen: newStatus } as any);
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      console.error('Lỗi update status:', error);
      toast.error('Cập nhật thất bại');
    }
  };

  const handleReschedule = async (id: string, ngayMoi: string, lyDo: string) => {
    try {
      const item = ungTuyens.find(ut => ut.id === id);
      if (!item) return;

      const company = companyMap.get(item.congTyId);
      const companyName = company?.tenCongTy || 'N/A';
      const managers = company?.quanLy || [];

      const archivedStatus = item.trangThaiTuyen === TrangThaiTuyen.CHO_PHONG_VAN 
        ? TrangThaiTuyen.TU_CHOI 
        : item.trangThaiTuyen;

      const historyEntry = {
        ngayPhongVanCu: item.ngayPhongVan,
        lyDo,
        tenCongTy: companyName,
        quanLy: managers,
        ngayCapNhat: new Date().toISOString(),
        trangThaiTuyen: archivedStatus
      };

      const updatedHistory = [...(item.lichSuPhongVan || []), historyEntry];

      await ungTuyenRepo.update(id, {
        ngayPhongVan: ngayMoi,
        lichSuPhongVan: updatedHistory,
        trangThaiTuyen: TrangThaiTuyen.CHO_PHONG_VAN,
        updatedAt: new Date().toISOString()
      } as any);

      toast.success('Đã hẹn lại lịch phỏng vấn');
      setIsRescheduleOpen(false);
      setRescheduleItem(null);
    } catch (error) {
      console.error('Lỗi hẹn lại lịch:', error);
      toast.error('Không thể cập nhật lịch');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa bản ghi ứng tuyển này?')) {
        try {
            await ungTuyenRepo.delete(id);
            toast.success('Đã xóa');
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi xóa');
        }
    }
  };

  const handleEdit = (item: UngTuyen) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const toggleHistory = (id: string) => {
    const newSet = new Set(expandedHistories);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedHistories(newSet);
  };

  const getStatusConfig = (status: TrangThaiTuyen) => {
    switch (status) {
      case TrangThaiTuyen.CHO_PHONG_VAN: return { label: 'Chờ phỏng vấn', color: 'bg-blue-50 text-blue-700 ring-blue-600/20 shadow-[0_2px_10px_-3px_rgba(37,99,235,0.1)]' };
      case TrangThaiTuyen.TOI_LICH_PHONG_VAN: return { label: 'Tới lịch PV', color: 'bg-amber-50 text-amber-700 ring-amber-600/20 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)]' };
      case TrangThaiTuyen.DANG_NHAN_VIEC: return { label: 'Đang nhận việc', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)]' };
      case TrangThaiTuyen.TU_CHOI: return { label: 'Từ chối', color: 'bg-rose-50 text-rose-700 ring-rose-600/20' };
      case TrangThaiTuyen.CONG_TY_NGUNG_TUYEN: return { label: 'Công ty ngừng tuyển', color: 'bg-slate-100 text-slate-600 ring-slate-500/20' };
      case TrangThaiTuyen.KHONG_DEN_PHONG_VAN: return { label: 'Không đến PV', color: 'bg-orange-50 text-orange-700 ring-orange-600/20' };
      case TrangThaiTuyen.CHO_XAC_NHAN: return { label: 'Chờ xác nhận', color: 'bg-purple-50 text-purple-700 ring-purple-600/20' };
      case TrangThaiTuyen.DA_NGHI_VIEC: return { label: 'Đã nghỉ việc', color: 'bg-gray-100 text-gray-600 ring-gray-500/20' };
      default: return { label: status, color: 'bg-gray-50 text-gray-600 ring-gray-500/10' };
    }
  };

  const getRowHighlightClass = (dateStr?: string | null, status?: TrangThaiTuyen) => {
    if (!dateStr || status !== TrangThaiTuyen.CHO_PHONG_VAN) return 'hover:bg-gray-50/50';
    
    const date = new Date(dateStr);
    if (isToday(date)) return 'bg-amber-50/60 hover:bg-amber-100/70 shadow-[inset_4px_0_0_0_#f59e0b]';
    if (isTomorrow(date)) return 'bg-blue-50/60 hover:bg-blue-100/70 shadow-[inset_4px_0_0_0_#3b82f6]';
    
    return 'hover:bg-gray-50/50';
  };

  return (
    <GlassLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Tìm tên ứng viên, SĐT, hoặc CCCD..."
    >
      <GlassPageHeader 
        title="Quản lý Ứng tuyển"
        subtitle={`Truy xuất ${filteredData.length} bản ghi`}
        action={{
          label: "Gán hồ sơ mới",
          onClick: () => { setEditingItem(null); setIsModalOpen(true); }
        }}
      />

      <GlassFilterBar>
        <GlassSelect 
          value={filterGioiTinh} 
          onChange={(e) => setFilterGioiTinh(e.target.value)}
        >
          <option value="ALL">GIỚI TÍNH: TẤT CẢ</option>
          <option value={GioiTinh.NAM}>NAM</option>
          <option value={GioiTinh.NU}>NỮ</option>
        </GlassSelect>

        <GlassSelect 
          value={filterCongTyId} 
          onChange={(e) => setFilterCongTyId(e.target.value)}
          className="max-w-[240px]"
        >
          <option value="ALL">CÔNG TY: TẤT CẢ</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.tenCongTy.toUpperCase()}</option>
          ))}
        </GlassSelect>

        <GlassSelect 
          value={filterTrangThai} 
          onChange={(e) => setFilterTrangThai(e.target.value)}
        >
          <option value="ALL">TRẠNG THÁI: TẤT CẢ</option>
          {Object.entries(TrangThaiTuyen).map(([key, value]) => (
            <option key={key} value={value}>{getStatusConfig(value).label.toUpperCase()}</option>
          ))}
        </GlassSelect>

        {(searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL') && (
          <GlassButton 
            variant="ghost" 
            className="ml-auto !text-rose-600 hover:!bg-rose-50 hover:!border-rose-100"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>}
            onClick={() => {
              setSearchQuery('');
              setFilterGioiTinh('ALL');
              setFilterCongTyId('ALL');
              setFilterTrangThai('ALL');
            }}
          >
            XÓA LỌC
          </GlassButton>
        )}
      </GlassFilterBar>

      <GlassCard noPadding className="mb-10 hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ứng viên / Liên hệ</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Công ty / Khu vực</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Phỏng vấn</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghi chú</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-sm font-semibold text-gray-400 animate-pulse">Đang đồng bộ dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Không tìm thấy kết quả</h3>
                      <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để có kết quả tốt hơn.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className={`${getRowHighlightClass(item.ngayPhongVan || null, item.trangThaiTuyen)} transition-all duration-300 group`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'bg-gradient-to-tr from-blue-600 to-blue-400' : 'bg-gradient-to-tr from-pink-600 to-pink-400'}`}>
                              {item.nguoiLaoDong.tenNguoiLaoDong.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white flex items-center justify-center text-[10px] shadow-sm ${item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                              {item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? '♂' : '♀'}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.nguoiLaoDong.tenNguoiLaoDong}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-blue-600 font-bold font-mono">{item.nguoiLaoDong.soDienThoai}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="text-xs font-bold text-gray-500 uppercase">{item.nguoiLaoDong.namSinh}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="font-extrabold text-gray-800 text-sm tracking-tight">{item.congTy.tenCongTy}</div>
                          <div className="flex items-start gap-1.5 text-gray-500">
                            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="text-[11px] leading-relaxed font-medium line-clamp-2">{item.congTy.diaChi || item.congTy.khuVuc?.diaChi}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative inline-block group/status">
                          <select
                            value={item.trangThaiTuyen}
                            onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                            className={`text-[10px] font-black uppercase pl-3 pr-8 py-2 rounded-xl border-0 ring-1 ring-inset transition-all cursor-pointer appearance-none ${getStatusConfig(item.trangThaiTuyen).color}`}
                          >
                            {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                                <option key={key} value={value} className="bg-white text-gray-800 font-bold">{getStatusConfig(value).label}</option>
                            ))}
                          </select>
                          <svg className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {item.ngayPhongVan ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-xs font-black font-mono px-3 py-1 rounded-full ${isToday(new Date(item.ngayPhongVan)) ? 'bg-amber-100 text-amber-700' : isTomorrow(new Date(item.ngayPhongVan)) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {format(new Date(item.ngayPhongVan), 'dd/MM/yyyy')}
                            </span>
                            <div className="flex justify-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setRescheduleItem(item as any); setIsRescheduleOpen(true); }}
                                className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                                title="Hẹn lại lịch"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </button>
                              {item.lichSuPhongVan && item.lichSuPhongVan.length > 0 && (
                                <button 
                                  onClick={() => toggleHistory(item.id)}
                                  className={`p-1.5 px-2 bg-white shadow-sm border rounded-lg text-xs font-black transition-all ${expandedHistories.has(item.id) ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-gray-400 border-gray-100 hover:text-blue-600'}`}
                                >
                                  H{item.lichSuPhongVan.length}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-300 italic">Chưa hẹn lịch</span>
                        )}
                      </td>
                      <td className="px-6 py-5 font-medium text-gray-600">
                        <div className="max-w-[300px]">
                          {item.ghiChu ? (
                            <p className="text-[11px] leading-relaxed italic whitespace-pre-wrap">"{item.ghiChu}"</p>
                          ) : (
                            <span className="text-[10px] text-gray-300 uppercase font-black tracking-widest">- Trống -</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 px-6">
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
                    {expandedHistories.has(item.id) && item.lichSuPhongVan && (
                        <tr className="bg-blue-50/20 backdrop-blur-sm">
                            <td colSpan={6} className="px-8 py-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-4 w-1 bg-blue-600 rounded-full" />
                                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">Lịch sử phỏng vấn bổ sung ({item.lichSuPhongVan.length})</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {item.lichSuPhongVan.map((his, idx) => (
                                        <div key={idx} className="bg-white/80 p-4 rounded-2xl border border-blue-100 shadow-sm relative group/his hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{format(new Date(his.ngayCapNhat), 'dd/MM/yyyy HH:mm')}</div>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg border leading-tight ${getStatusConfig(his.trangThaiTuyen).color}`}>
                                                    {getStatusConfig(his.trangThaiTuyen).label}
                                                </span>
                                            </div>
                                            <div className="text-sm font-black text-gray-800 mb-1">{his.tenCongTy}</div>
                                            {his.lyDo && (
                                                <div className="text-xs font-semibold text-gray-500 line-clamp-3 bg-gray-50 p-2 rounded-xl mt-2 italic">
                                                    Lý do: {his.lyDo}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div ref={loaderRef} className="py-10 flex justify-center bg-gray-50/10 border-t border-gray-100/50">
          {(loadingMore || (hasMore && !searchQuery)) && (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm font-black uppercase tracking-widest">Đang tải thêm...</span>
            </div>
          )}
          {!hasMore && filteredData.length > 0 && !searchQuery && (
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Đã tải tất cả hồ sơ quản lý</span>
          )}
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
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Không tìm thấy hồ sơ nào</span>
          </GlassCard>
        ) : (
          filteredData.map((item) => (
            <GlassCard key={item.id} className={getRowHighlightClass(item.ngayPhongVan || null, item.trangThaiTuyen)} noPadding>
              <div className="p-5">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'bg-gradient-to-tr from-blue-600 to-blue-400' : 'bg-gradient-to-tr from-pink-600 to-pink-400'}`}>
                      {item.nguoiLaoDong.tenNguoiLaoDong[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base tracking-tight mb-0.5 uppercase line-clamp-1">{item.nguoiLaoDong.tenNguoiLaoDong}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                          {item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'NAM' : 'NỮ'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 font-mono">{item.nguoiLaoDong.soDienThoai}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-black tracking-widest ${getStatusConfig(item.trangThaiTuyen).label.toUpperCase()} shadow-sm whitespace-nowrap`}>
                    {getStatusConfig(item.trangThaiTuyen).label.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4 mb-5">
                  <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Đơn vị tuyển dụng</div>
                    <div className="font-black text-gray-800 text-sm uppercase line-clamp-1">{item.congTy.tenCongTy}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 italic line-clamp-1">{item.congTy.khuVuc?.tenKhuVuc} - {item.congTy.diaChi}</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Lịch phỏng vấn</div>
                        {item.ngayPhongVan ? (
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isToday(new Date(item.ngayPhongVan)) ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`} />
                            <span className="text-xs font-black text-gray-900 font-mono">{format(new Date(item.ngayPhongVan), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        ) : (
                        <span className="text-[10px] font-bold text-gray-400 italic">Chưa có lịch hẹn</span>
                        )}
                    </div>
                    {item.ngayPhongVan && (
                        <button 
                            onClick={() => { setRescheduleItem(item as any); setIsRescheduleOpen(true); }}
                            className="p-1.5 bg-gray-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                    )}
                  </div>

                  {item.ghiChu && (
                    <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/30">
                      <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Ghi chú</div>
                      <p className="text-[10px] font-bold text-gray-600 leading-relaxed italic whitespace-pre-wrap line-clamp-2">"{item.ghiChu}"</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <a 
                    href={`tel:${item.nguoiLaoDong.soDienThoai}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white h-11 rounded-xl font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all text-[10px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    GỌI
                  </a>
                  <GlassButton 
                    variant="secondary" 
                    className="h-11 !rounded-xl flex-1 !text-[10px]" 
                    onClick={() => handleEdit(item)}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                  >
                    SỬA
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <UngTuyenModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }} 
        onSave={handleSave}
        initialData={editingItem}
        existingUngTuyens={ungTuyens}
      />

      {rescheduleItem && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => { setIsRescheduleOpen(false); setRescheduleItem(null); }}
          item={rescheduleItem}
          onSave={handleReschedule}
        />
      )}
    </GlassLayout>
  );
}
