'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { UngTuyenRepository } from '@/repositories/ungTuyen.repository';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';
import { UngTuyen, NguoiLaoDong, TrangThaiTuyen, GioiTinh, CongTy, KhuVuc } from '@/types';
import UngTuyenModal from '@/components/modals/UngTuyenModal';
import RescheduleModal from '@/components/modals/RescheduleModal';
import { toast } from 'react-hot-toast';
import { format, isToday, isTomorrow } from 'date-fns';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUI } from '@/components/providers/UIProvider';

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
  const [rescheduleItem, setRescheduleItem] = useState<UngTuyen | null>(null);

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
    const result = await ungTuyenRepo.getPaginated(pageSize, lastItem?.updatedAt as unknown as string);
    
    setUngTuyens(prev => [...prev, ...result.items]);
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
        const updated = prev.map(item => {
          const match = list.find(l => l.id === item.id);
          return match ? match : item;
        });
        return updated.filter(item => list.find(l => l.id === item.id));
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
  }, [ungTuyens, workerMap, companyMap, workers.length]);

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

  const toggleHistory = (id: string) => {
    const newSet = new Set(expandedHistories);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedHistories(newSet);
  };

  const getStatusConfig = (status: TrangThaiTuyen) => {
    switch (status) {
      case TrangThaiTuyen.CHO_PHONG_VAN: return { label: 'Chờ phỏng vấn', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' };
      case TrangThaiTuyen.TOI_LICH_PHONG_VAN: return { label: 'Tới lịch PV', color: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
      case TrangThaiTuyen.DANG_NHAN_VIEC: return { label: 'Đang nhận việc', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
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
    <div className="min-h-screen bg-slate-50/30">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-20 flex items-center px-6 gap-6 shadow-sm">
        <div className="flex items-center gap-4 flex-shrink-0">
          <button onClick={toggleSidebar} className="p-2.5 hover:bg-blue-50 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm border border-transparent hover:border-blue-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 rotation-12"><span className="font-black text-xl">E</span></div>
            <div className="hidden sm:flex flex-col -gap-1">
                <span className="text-xl font-black text-gray-800 tracking-tighter">ERD</span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Management</span>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Tìm tên ứng viên, SĐT, hoặc CCCD..."
              className="block w-full h-12 bg-gray-100/50 border-2 border-transparent rounded-2xl pl-12 pr-4 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-gray-700 placeholder:text-gray-400 shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto">
             <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-black text-gray-900 leading-none">{user?.displayName || 'User'}</span>
                <span className="text-[10px] font-bold text-gray-400">{user?.email || 'Admin'}</span>
             </div>
             <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black shadow-sm ring-2 ring-white">
                {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
        </div>
      </header>

      <div className="flex pt-20">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-6 md:p-10">
          <div className="max-w-[1500px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-blue-600 rounded-full" />
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý Ứng tuyển</h2>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-gray-500 font-bold bg-white/50 w-fit px-3 py-1 rounded-full border border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Truy xuất {filteredData.length} bản ghi
                   </div>
                </div>
                <button 
                  onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                  className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-blue-600 hover:shadow-blue-200 transition-all active:scale-95 group"
                >
                    <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span>GÁN HỒ SƠ MỚI</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white/60 backdrop-blur-xl p-5 rounded-[32px] shadow-sm border border-white/50 mb-10 flex flex-wrap items-center gap-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18" /></svg>
                  </div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Bộ lọc</span>
               </div>

               <div className="h-10 w-[2px] bg-gray-100 hidden md:block" />

               <div className="flex flex-wrap items-center gap-4 flex-1">
                  <select 
                    value={filterGioiTinh} 
                    onChange={(e) => setFilterGioiTinh(e.target.value)}
                    className="bg-gray-100/50 border-0 text-gray-700 text-xs font-black rounded-2xl focus:ring-4 focus:ring-blue-500/10 block p-3 pr-10 transition-all hover:bg-gray-100 appearance-none cursor-pointer"
                  >
                    <option value="ALL">GIỚI TÍNH: TẤT CẢ</option>
                    <option value={GioiTinh.NAM}>NAM</option>
                    <option value={GioiTinh.NU}>NỮ</option>
                  </select>

                  <select 
                    value={filterCongTyId} 
                    onChange={(e) => setFilterCongTyId(e.target.value)}
                    className="bg-gray-100/50 border-0 text-gray-700 text-xs font-black rounded-2xl focus:ring-4 focus:ring-blue-500/10 block p-3 pr-10 transition-all hover:bg-gray-100 appearance-none cursor-pointer max-w-[240px]"
                  >
                    <option value="ALL">CÔNG TY: TẤT CẢ</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.tenCongTy.toUpperCase()}</option>
                    ))}
                  </select>

                  <select 
                    value={filterTrangThai} 
                    onChange={(e) => setFilterTrangThai(e.target.value)}
                    className="bg-gray-100/50 border-0 text-gray-700 text-xs font-black rounded-2xl focus:ring-4 focus:ring-blue-500/10 block p-3 pr-10 transition-all hover:bg-gray-100 appearance-none cursor-pointer"
                  >
                    <option value="ALL">TRẠNG THÁI: TẤT CẢ</option>
                    {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                      <option key={key} value={value}>{getStatusConfig(value).label.toUpperCase()}</option>
                    ))}
                  </select>

                  {(searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL') && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setFilterGioiTinh('ALL');
                        setFilterCongTyId('ALL');
                        setFilterTrangThai('ALL');
                      }}
                      className="ml-auto flex items-center gap-2 text-xs font-black text-rose-600 hover:bg-rose-50 px-4 py-2.5 rounded-2xl transition-all uppercase tracking-widest active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      Xóa lọc
                    </button>
                  )}
               </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-900/5 border border-white/50 overflow-hidden">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm font-semibold text-gray-400 animate-pulse">Đang đồng bộ dữ liệu...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="h-80 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Không tìm thấy kết quả</h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để có kết quả tốt hơn.</p>
                        {(searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL') && (
                            <button 
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterGioiTinh('ALL');
                                    setFilterCongTyId('ALL');
                                    setFilterTrangThai('ALL');
                                }}
                                className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
                            >
                                Xóa tất cả bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden xl:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="pl-8 pr-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Ứng viên</th>
                                        <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Thông tin tuyển dụng</th>
                                        <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[2px] text-center">Lịch Phỏng vấn</th>
                                        <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Ghi chú</th>
                                        <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Trạng thái</th>
                                        <th className="pl-4 pr-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[2px] text-right">Tùy chọn</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {filteredData.map((item) => (
                                        <React.Fragment key={item.id}>
                                        <tr className={`${getRowHighlightClass(item.ngayPhongVan || null, item.trangThaiTuyen)} transition-all duration-300 group`}>
                                            <td className="pl-8 pr-4 py-5">
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
                                            <td className="px-4 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-extrabold text-gray-800 text-sm tracking-tight">{item.congTy.tenCongTy}</div>
                                                    <div className="flex items-start gap-1.5 text-gray-500">
                                                        <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        <span className="text-[11px] leading-relaxed font-medium line-clamp-2">{item.congTy.diaChi || item.congTy.khuVuc?.diaChi}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-center">
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
                                            <td className="px-4 py-5 font-medium text-gray-600">
                                                <div className="max-w-[300px]">
                                                    {item.ghiChu ? (
                                                        <p className="text-[11px] leading-relaxed italic whitespace-pre-wrap">"{item.ghiChu}"</p>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 uppercase font-black tracking-widest">- Trống -</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
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
                                            <td className="pl-4 pr-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => { setEditingItem(item as any); setIsModalOpen(true); }}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 group-hover:shadow-md active:scale-95"
                                                        title="Chỉnh sửa Chi tiết"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300 group-hover:shadow-md active:scale-95"
                                                        title="Xóa hồ sơ"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="xl:hidden space-y-4 p-4 lg:p-6 bg-gray-50/50">
                            {filteredData.map((item) => (
                                <div key={item.id} className={`bg-white rounded-[32px] p-6 border transition-all duration-300 shadow-sm relative overflow-hidden group ${getRowHighlightClass(item.ngayPhongVan || null, item.trangThaiTuyen).includes('bg-amber-50') ? 'border-amber-200 shadow-amber-900/5' : getRowHighlightClass(item.ngayPhongVan || null, item.trangThaiTuyen).includes('bg-blue-50') ? 'border-blue-200 shadow-blue-900/5' : 'border-gray-100'}`}>
                                    {/* Accent Bar */}
                                     <div className={`absolute top-0 left-0 w-2 h-full ${
                                        getRowHighlightClass(item.ngayPhongVan || null, item.trangThaiTuyen).includes('bg-amber-50') ? 'bg-amber-500' : 
                                        getRowHighlightClass(item.ngayPhongVan || null, item.trangThaiTuyen).includes('bg-blue-50') ? 'bg-blue-500' : 
                                        'bg-gray-100'
                                     }`} />

                                     <div className="flex justify-between items-start mb-4 pl-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'bg-gradient-to-tr from-blue-600 to-blue-400' : 'bg-gradient-to-tr from-pink-600 to-pink-400'}`}>
                                                {item.nguoiLaoDong.tenNguoiLaoDong.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 leading-tight uppercase tracking-tight text-lg">{item.nguoiLaoDong.tenNguoiLaoDong}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                                        {item.nguoiLaoDong.gioiTinh === GioiTinh.NAM ? 'NAM' : 'NỮ'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">{item.nguoiLaoDong.namSinh}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Hẹn PV</span>
                                            {item.ngayPhongVan ? (
                                                <span className={`text-xs font-black font-mono px-3 py-1 rounded-full ${isToday(new Date(item.ngayPhongVan)) ? 'bg-amber-100 text-amber-700' : isTomorrow(new Date(item.ngayPhongVan)) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {format(new Date(item.ngayPhongVan), 'dd/MM/yyyy')}
                                                </span>
                                            ) : <span className="text-xs font-bold text-gray-300">N/A</span>}
                                        </div>
                                     </div>

                                     <div className="pl-2 space-y-4">
                                        <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Thông tin công ty</div>
                                            <div className="font-extrabold text-gray-800 uppercase tracking-tight mb-1">{item.congTy.tenCongTy}</div>
                                            <div className="flex items-start gap-2 text-gray-500">
                                                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                <span className="text-[11px] font-semibold leading-relaxed">{item.congTy.diaChi || item.congTy.khuVuc?.diaChi}</span>
                                            </div>
                                        </div>

                                        {item.ghiChu && (
                                            <div className="bg-amber-50/20 p-4 rounded-3xl border border-amber-100/30">
                                                <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Ghi chú nhanh</div>
                                                <p className="text-xs font-bold text-gray-600 leading-relaxed italic whitespace-pre-wrap">"{item.ghiChu}"</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex-1">
                                                <div className="relative group/status w-full max-w-[180px]">
                                                    <select
                                                        value={item.trangThaiTuyen}
                                                        onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                                                        className={`w-full text-[10px] font-black uppercase pl-3 pr-8 py-2.5 rounded-2xl border-0 ring-1 ring-inset transition-all appearance-none cursor-pointer ${getStatusConfig(item.trangThaiTuyen).color}`}
                                                    >
                                                        {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                                                            <option key={key} value={value}>{getStatusConfig(value).label}</option>
                                                        ))}
                                                    </select>
                                                    <svg className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => { setEditingItem(item as any); setIsModalOpen(true); }}
                                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg active:scale-95 transition-all"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <a 
                                                    href={`tel:${item.nguoiLaoDong.soDienThoai}`}
                                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg active:scale-95 transition-all"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                </a>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            ))}
                        </div>

                        <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center bg-gray-50/10 border-t border-gray-100">
                            {(loadingMore || hasMore) ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                                        {(searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL') ? 'Đang tìm kiếm sâu hơn...' : 'Đang tải thêm bản ghi...'}
                                    </span>
                                </div>
                            ) : (
                                joinedData.length > 0 && (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-1 bg-gray-200 rounded-full" />
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] text-center">
                                            {(searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL') ? `Hoàn tất tìm kiếm trong ${ungTuyens.length} hồ sơ` : 'Đã tải toàn bộ danh sách'}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
          </div>
        </main>
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
    </div>
  );
}
