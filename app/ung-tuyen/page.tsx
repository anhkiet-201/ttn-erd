'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { UngTuyenRepository } from '@/repositories/ungTuyen.repository';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';
import { UngTuyen, UngTuyenWithDetails, NguoiLaoDong, TinTuyenDung, TrangThaiTuyen, GioiTinh, CongTy, KhuVuc } from '@/types';
import UngTuyenModal from '@/components/modals/UngTuyenModal';
import RescheduleModal from '@/components/modals/RescheduleModal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
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
  const [khuVucs, setKhuVucs] = useState<KhuVuc[]>([]); // Added KhuVucs for joining
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UngTuyen | null>(null);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());
  
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<UngTuyen | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // 1. Data Subscription
  useEffect(() => {
    const unsubUngTuyen = ungTuyenRepo.subscribeAll(setUngTuyens);
    const unsubWorker = workerRepo.subscribeAll(setWorkers);
    const unsubCongTy = congTyRepo.subscribeAll((data) => {
      setCompanies(data);
      setLoading(false);
    });
    const unsubKhuVuc = khuVucRepo.subscribeAll(setKhuVucs);

    return () => {
      unsubUngTuyen();
      unsubWorker();
      unsubCongTy();
      unsubKhuVuc();
    };
  }, []);

  // 2. Optimization: Loopups with Map O(1)
  const workerMap = useMemo(() => new Map(workers.map(w => [w.id, w])), [workers]);
  const khuVucMap = useMemo(() => new Map(khuVucs.map(kv => [kv.id, kv])), [khuVucs]);
  const companyMap = useMemo(() => {
    return new Map(companies.map(c => {
      // Deep join KhuVuc info into company
      if (c.khuVuc?.id) {
        const fullKhuVuc = khuVucMap.get(c.khuVuc.id);
        if (fullKhuVuc) {
          return [c.id, { ...c, khuVuc: fullKhuVuc }];
        }
      }
      return [c.id, c];
    }));
  }, [companies, khuVucMap]);

  // 3. Derived State: Joined Data
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

  // 4. Filtering
  const filteredData = useMemo(() => {
    const lowerSearch = searchQuery.toLowerCase().trim();
    if (!lowerSearch) return joinedData;

    return joinedData.filter(item => 
      item.nguoiLaoDong.tenNguoiLaoDong.toLowerCase().includes(lowerSearch) ||
      (item.nguoiLaoDong.soDienThoai && item.nguoiLaoDong.soDienThoai.includes(lowerSearch)) ||
      (item.nguoiLaoDong.cccd && item.nguoiLaoDong.cccd.includes(lowerSearch)) ||
      (item.congTy?.tenCongTy && item.congTy.tenCongTy.toLowerCase().includes(lowerSearch)) ||
      (item.congTy?.diaChi && item.congTy.diaChi.toLowerCase().includes(lowerSearch)) ||
      (item.congTy?.khuVuc?.diaChi && item.congTy.khuVuc.diaChi.toLowerCase().includes(lowerSearch))
    );
  }, [joinedData, searchQuery]);

  // 5. Handlers
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
      }
      // Force refresh safely
      const latestWorkers = await workerRepo.getAll();
      setWorkers(latestWorkers);
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

      const company = companyMap.get(item.congTyId); // Use Map for speed
      const companyName = company?.tenCongTy || 'N/A';
      const managers = company?.quanLy || [];

      // Logic: If current status is CHO_PHONG_VAN -> Archive as TU_CHOI
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
        trangThaiTuyen: TrangThaiTuyen.CHO_PHONG_VAN, // Default new status to Waiting
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
    if (window.confirm('Xóa bản ghi ứng tuyển này? Hành động không thể hoàn tác.')) {
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

  // 6. UI Helpers
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 h-16 flex items-center px-4 gap-4 transition-all duration-200">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100/80 rounded-full text-gray-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
              <span className="font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">ERD</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Tìm ứng viên, SĐT, CCCD..."
              className="block w-full h-10 bg-gray-100/50 border border-transparent rounded-full pl-11 pr-4 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-gray-700 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">
                {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                   <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Quản lý Ứng tuyển</h2>
                   <p className="text-sm text-gray-500 font-medium mt-1">Tổng số: {filteredData.length} hồ sơ</p>
                </div>
                <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-gray-200 transition-all active:scale-95"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span>Thêm Hồ Sơ</span>
                </button>
            </div>

            {/* Content Listing */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm font-medium text-gray-400">Đang tải dữ liệu...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="h-80 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Không tìm thấy dữ liệu</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">Chưa có ứng tuyển nào hoặc không khớp với từ khóa tìm kiếm của bạn.</p>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                                Xóa bộ lọc tìm kiếm
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden xl:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[240px]">Ứng viên</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-[100px]">Thông tin</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">Công ty</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-[160px]">Lịch PV</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[180px]">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-[100px]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredData.sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).map((item) => (
                                        <React.Fragment key={item.id}>
                                        <tr className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-[15px]">{item.nguoiLaoDong.tenNguoiLaoDong}</span>
                                                    <span className="text-sm font-medium text-blue-600 font-mono mt-0.5">{item.nguoiLaoDong.soDienThoai}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{item.nguoiLaoDong.namSinh}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.nguoiLaoDong.gioiTinh}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 text-sm truncate" title={item.congTy.tenCongTy}>
                                                    {item.congTy.tenCongTy}
                                                </div>
                                                <div className="flex flex-col mt-0.5">
                                                    {item.congTy.khuVuc && (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                            {item.congTy.khuVuc.tenKhuVuc}
                                                        </span>
                                                    )}
                                                    {(item.congTy.diaChi || item.congTy.khuVuc?.diaChi) && (
                                                        <span className="text-[11px] text-gray-500 truncate max-w-[150px]" title={item.congTy.diaChi || item.congTy.khuVuc?.diaChi}>
                                                            {item.congTy.diaChi || item.congTy.khuVuc?.diaChi}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    {item.ngayPhongVan ? (
                                                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-100 shadow-sm cursor-default">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            <span className="text-xs font-bold font-mono">{format(new Date(item.ngayPhongVan), 'dd/MM/yyyy')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic py-1">- Chưa xếp lịch -</span>
                                                    )}

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                        onClick={(e) => { e.stopPropagation(); setRescheduleItem(item as any); setIsRescheduleOpen(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Hẹn lại lịch"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                        </button>
                                                        {item.lichSuPhongVan && item.lichSuPhongVan.length > 0 && (
                                                            <button
                                                            onClick={(e) => { e.stopPropagation(); toggleHistory(item.id); }}
                                                            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold ${expandedHistories.has(item.id) ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                                            title="Lịch sử"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                <span>{item.lichSuPhongVan.length}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative group/status inline-block min-w-[140px]">
                                                    <select
                                                        value={item.trangThaiTuyen}
                                                        onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                                                        className={`appearance-none w-full pl-3 pr-8 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-lg cursor-pointer outline-none focus:ring-2 ring-offset-1 transition-all border-0 ring-1 ${getStatusConfig(item.trangThaiTuyen).color}`}
                                                    >
                                                        {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                                                            <option key={key} value={value} className="bg-white text-gray-800 normal-case font-medium">
                                                                {getStatusConfig(value).label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 line-clamp-2 max-w-[200px]" title={item.ghiChu || ''}>
                                                    {item.ghiChu || <span className="text-gray-300 italic">Không có ghi chú</span>}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingItem(item as any); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded History */}
                                        {expandedHistories.has(item.id) && item.lichSuPhongVan && (
                                            <tr className="bg-gray-50 animate-in fade-in duration-200">
                                                <td colSpan={7} className="px-6 py-4 border-b border-gray-100">
                                                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-inner">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lịch sử thay đổi</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {item.lichSuPhongVan.map((his, idx) => {
                                                                const isCompanyChange = his.tenCongTy !== item.congTy.tenCongTy;
                                                                return (
                                                                <div key={idx} className={`rounded-lg p-3 border text-sm transition-all hover:shadow-sm ${isCompanyChange ? 'bg-orange-50/50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className={`p-1 rounded-md ${isCompanyChange ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                               {isCompanyChange ? (
                                                                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                                               ) : (
                                                                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                               )}
                                                                            </div>
                                                                            <span className="text-xs font-bold text-gray-500">{format(new Date(his.ngayCapNhat), 'HH:mm dd/MM/yyyy')}</span>
                                                                        </div>
                                                                        {his.tenCongTy && <span className="text-[10px] font-bold text-gray-400 truncate max-w-[80px]">{his.tenCongTy}</span>}
                                                                    </div>

                                                                    <div className="space-y-1.5 pl-1">
                                                                        {isCompanyChange ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-orange-700">Chuyển công ty / Ứng tuyển lại</span>
                                                                            </div>
                                                                        ) : (
                                                                             <div className="flex items-center gap-2">
                                                                                <span className="text-gray-400 line-through text-xs">{his.ngayPhongVanCu ? format(new Date(his.ngayPhongVanCu), 'dd/MM') : '---'}</span>
                                                                                <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                                                <span className="text-xs font-bold text-blue-700">Dời lịch</span>
                                                                            </div>
                                                                        )}

                                                                        {his.trangThaiTuyen && (
                                                                            <div className="mt-1">
                                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusConfig(his.trangThaiTuyen).color}`}>
                                                                                    {getStatusConfig(his.trangThaiTuyen).label}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {his.lyDo && <p className="text-[11px] italic text-gray-500 bg-white p-1.5 rounded border border-gray-100 mt-1">"{his.lyDo}"</p>}
                                                                    </div>
                                                                </div>
                                                            )})}
                                                        </div>
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
                        <div className="xl:hidden space-y-4">
                            {filteredData.sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
                                     <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusConfig(item.trangThaiTuyen).color.split(' ')[0]}`} />

                                     <div className="flex justify-between items-start mb-3 pl-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{item.nguoiLaoDong.tenNguoiLaoDong}</h3>
                                            <p className="text-blue-600 font-mono font-medium">{item.nguoiLaoDong.soDienThoai}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold block text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                                {item.nguoiLaoDong.namSinh} • {item.nguoiLaoDong.gioiTinh}
                                            </span>
                                            {item.nguoiLaoDong.cccd && <span className="text-[10px] text-gray-400 font-mono mt-1 block">{item.nguoiLaoDong.cccd}</span>}
                                        </div>
                                     </div>

                                     <div className="pl-3 mb-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            <span className="text-sm font-bold text-gray-700 truncate">{item.congTy.tenCongTy}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase tracking-wide">
                                              {item.congTy.khuVuc?.tenKhuVuc || 'N/A'}
                                            </span>
                                            {Array.isArray(item.congTy.quanLy) && item.congTy.quanLy.length > 0 && (
                                              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wide">
                                                {item.congTy.quanLy.length} quản lý
                                              </span>
                                            )}
                                        </div>

                                        {(item.congTy.diaChi || item.congTy.khuVuc?.diaChi) && (
                                           <div className="text-[11px] text-gray-500 flex items-start gap-1.5">
                                             <svg className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                             </svg>
                                             <span className="break-words line-clamp-1">{item.congTy.diaChi || item.congTy.khuVuc?.diaChi}</span>
                                           </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                             <select
                                                value={item.trangThaiTuyen}
                                                onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                                                className={`text-[10px] font-bold uppercase px-2 py-1 rounded border-0 ring-1 ring-inset outline-none ${getStatusConfig(item.trangThaiTuyen).color}`}
                                            >
                                                {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                                                    <option key={key} value={value} className="text-gray-900 bg-white">
                                                        {getStatusConfig(value).label}
                                                    </option>
                                                ))}
                                            </select>

                                            {item.ngayPhongVan && (
                                                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {format(new Date(item.ngayPhongVan), 'dd/MM')}
                                                </span>
                                            )}
                                        </div>

                                        {item.ghiChu && (
                                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-2">
                                                <p className="text-xs text-gray-600 line-clamp-2">{item.ghiChu}</p>
                                            </div>
                                        )}
                                     </div>

                                     <div className="flex justify-end gap-2 pl-3 border-t border-gray-50 pt-3">
                                        <button onClick={() => { setEditingItem(item as any); setIsModalOpen(true); }} className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg active:scale-95 transition-transform">
                                            Sửa / Xem chi tiết
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95 transition-transform">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                     </div>
                                </div>
                            ))}
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
