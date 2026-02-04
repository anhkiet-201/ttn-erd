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
import { format } from 'date-fns';
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

  return (
    <div className="min-h-screen bg-transparent">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white"><span className="font-bold text-lg">E</span></div>
            <span className="text-xl font-bold text-gray-800 hidden sm:block">ERD</span>
          </div>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Tìm ứng viên, SĐT, CCCD..."
              className="block w-full h-10 bg-gray-100 border-none rounded-full pl-11 pr-4 focus:bg-white transition-all text-sm font-medium text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
             <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                   <h2 className="text-2xl font-bold text-gray-800">Quản lý Ứng tuyển</h2>
                   <p className="text-sm text-gray-500 mt-1">Tổng số: {filteredData.length} hồ sơ</p>
                </div>
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span>Thêm Hồ Sơ</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lọc:</span>
                  <select 
                    value={filterGioiTinh} 
                    onChange={(e) => setFilterGioiTinh(e.target.value)}
                    className="bg-gray-50 border-0 text-gray-700 text-xs font-bold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
                  >
                    <option value="ALL">Giới tính (Tất cả)</option>
                    <option value={GioiTinh.NAM}>Nam</option>
                    <option value={GioiTinh.NU}>Nữ</option>
                  </select>
               </div>

               <select 
                  value={filterCongTyId} 
                  onChange={(e) => setFilterCongTyId(e.target.value)}
                  className="bg-gray-50 border-0 text-gray-700 text-xs font-bold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all max-w-[200px]"
                >
                  <option value="ALL">Công ty (Tất cả)</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.tenCongTy}</option>
                  ))}
                </select>

                <select 
                  value={filterTrangThai} 
                  onChange={(e) => setFilterTrangThai(e.target.value)}
                  className="bg-gray-50 border-0 text-gray-700 text-xs font-bold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
                >
                  <option value="ALL">Trạng thái (Tất cả)</option>
                  {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                    <option key={key} value={value}>{getStatusConfig(value).label}</option>
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
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                  >
                    Xóa tất cả lọc
                  </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm font-medium text-gray-400">Đang tải...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="h-80 flex flex-col items-center justify-center text-center p-8">
                        <h3 className="text-lg font-bold text-gray-800">Không tìm thấy dữ liệu</h3>
                        <p className="text-gray-500 text-sm mt-1">Chưa có ứng tuyển nào hoặc không khớp với từ khóa.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden xl:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Ứng viên</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Thông tin</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Công ty</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Lịch PV</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredData.map((item) => (
                                        <React.Fragment key={item.id}>
                                        <tr className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{item.nguoiLaoDong.tenNguoiLaoDong}</span>
                                                    <span className="text-sm text-blue-600 font-mono">{item.nguoiLaoDong.soDienThoai}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold text-gray-700">{item.nguoiLaoDong.namSinh}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">{item.nguoiLaoDong.gioiTinh}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-800 text-sm">{item.congTy.tenCongTy}</span>
                                                <div className="text-[11px] text-gray-500">{item.congTy.diaChi || item.congTy.khuVuc?.diaChi}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.ngayPhongVan ? (
                                                    <span className="text-xs font-bold font-mono text-amber-700">{format(new Date(item.ngayPhongVan), 'dd/MM/yyyy')}</span>
                                                ) : <span className="text-xs text-gray-300">-</span>}
                                                <div className="flex justify-center gap-1 mt-1">
                                                    <button onClick={() => { setRescheduleItem(item as any); setIsRescheduleOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
                                                    {item.lichSuPhongVan && item.lichSuPhongVan.length > 0 && (
                                                        <button onClick={() => toggleHistory(item.id)} className={`p-1 text-[10px] font-bold ${expandedHistories.has(item.id) ? 'text-blue-600' : 'text-gray-400'}`}>H{item.lichSuPhongVan.length}</button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.trangThaiTuyen}
                                                    onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                                                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded outline-none border-0 ring-1 ${getStatusConfig(item.trangThaiTuyen).color}`}
                                                >
                                                    {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                                                        <option key={key} value={value} className="bg-white text-gray-800">{getStatusConfig(value).label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => { setEditingItem(item as any); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </td>
                                        </tr>
                                        {expandedHistories.has(item.id) && item.lichSuPhongVan && (
                                            <tr className="bg-gray-50"><td colSpan={6} className="px-6 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    {item.lichSuPhongVan.map((his, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded border text-[11px]">
                                                            <div className="font-bold text-gray-400">{format(new Date(his.ngayCapNhat), 'dd/MM HH:mm')}</div>
                                                            <div className="text-blue-700 font-bold">{his.tenCongTy}</div>
                                                            {his.lyDo && <div className="italic">"{his.lyDo}"</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td></tr>
                                        )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="xl:hidden space-y-4 p-4">
                            {filteredData.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative">
                                     <div className={`absolute top-0 left-0 w-1 h-full ${getStatusConfig(item.trangThaiTuyen).color.split(' ')[0]}`} />
                                     <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900">{item.nguoiLaoDong.tenNguoiLaoDong}</h3>
                                        <span className="text-xs font-bold text-blue-600">{item.nguoiLaoDong.soDienThoai}</span>
                                     </div>
                                     <div className="text-sm font-bold text-gray-700">{item.congTy.tenCongTy}</div>
                                     <div className="flex items-center gap-2 mt-3">
                                        <select
                                            value={item.trangThaiTuyen}
                                            onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                                            className={`text-[10px] font-bold uppercase px-2 py-1 rounded outline-none border-0 ring-1 ${getStatusConfig(item.trangThaiTuyen).color}`}
                                        >
                                            {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                                                <option key={key} value={value}>{getStatusConfig(value).label}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => { setEditingItem(item as any); setIsModalOpen(true); }} className="ml-auto text-blue-600 text-xs font-bold">Chi tiết</button>
                                     </div>
                                </div>
                            ))}
                        </div>

                        <div ref={loaderRef} className="py-10 flex justify-center bg-gray-50/30 border-t border-gray-100">
                            {(loadingMore || hasMore) && (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                                    <span className="text-sm font-bold">
                                        {(searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL') ? 'Đang tìm kiếm thêm hồ sơ...' : 'Đang tải thêm hồ sơ...'}
                                    </span>
                                </div>
                            )}
                            {!hasMore && joinedData.length > 0 && (
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-6 w-full text-center">
                                    {(searchQuery || filterGioiTinh !== 'ALL' || filterCongTyId !== 'ALL' || filterTrangThai !== 'ALL') ? `Đã tìm xong trong ${ungTuyens.length} hồ sơ` : 'Đã tải tất cả hồ sơ'}
                                </span>
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
