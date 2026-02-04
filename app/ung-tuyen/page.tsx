'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { UngTuyenRepository } from '@/repositories/ungTuyen.repository';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { UngTuyen, UngTuyenWithDetails, NguoiLaoDong, TinTuyenDung, TrangThaiTuyen, GioiTinh, CongTy } from '@/types';
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

export default function UngTuyenPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [ungTuyens, setUngTuyens] = useState<UngTuyen[]>([]);
  const [workers, setWorkers] = useState<NguoiLaoDong[]>([]);
  const [companies, setCompanies] = useState<CongTy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UngTuyen | null>(null);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());
  
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<UngTuyen | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubUngTuyen = ungTuyenRepo.subscribeAll(setUngTuyens);
    const unsubWorker = workerRepo.subscribeAll(setWorkers);
    const unsubCongTy = congTyRepo.subscribeAll((data) => {
      setCompanies(data);
      setLoading(false);
    });

    return () => {
      unsubUngTuyen();
      unsubWorker();
      unsubCongTy();
    };
  }, []);

  const joinedData: UngTuyenWithDetails[] = ungTuyens.map(ut => {
    // Nếu chưa load xong workers thì có thể worker chưa về kịp, tạm thời hiển thị placeholder loading hoặc ID
    const worker = workers.find(w => w.id === ut.nguoiLaoDongId);
    
    // Fallback object nếu không tìm thấy worker
    const fallbackWorker = { 
      tenNguoiLaoDong: workers.length > 0 ? 'Đang cập nhật...' : '-', 
      soDienThoai: '', 
      namSinh: 0, 
      gioiTinh: GioiTinh.NAM, 
      cccd: '' 
    } as any;

    const company = companies.find(c => c.id === ut.congTyId) || { tenCongTy: 'N/A' } as any;
    return {
      ...ut,
      nguoiLaoDong: worker || fallbackWorker,
      congTy: company,
    };
  });

  const filteredData = joinedData.filter(item => {
    const search = searchQuery.toLowerCase();
    return (
      item.nguoiLaoDong.tenNguoiLaoDong.toLowerCase().includes(search) ||
      (item.nguoiLaoDong.soDienThoai && item.nguoiLaoDong.soDienThoai.includes(search)) ||
      (item.nguoiLaoDong.cccd && item.nguoiLaoDong.cccd.includes(search)) ||
      (item.congTy?.tenCongTy && item.congTy.tenCongTy.toLowerCase().includes(search))
    );
  });

  const handleCreate = async (values: Omit<UngTuyen, 'id'>) => {
    try {
      await ungTuyenRepo.create(values);
      setIsModalOpen(false);
      
      // Force refresh worker data to ensure latest updates are shown
      // This handles the latency in realtime subscription updates for newly created workers
      const latestWorkers = await workerRepo.getAll();
      setWorkers(latestWorkers);
      
      toast.success('Gán ứng tuyển thành công');
    } catch (error) {
      console.error('Lỗi khi tạo:', error);
      toast.error('Gán ứng tuyển thất bại');
    }
  };

  const handleUpdate = async (values: Omit<UngTuyen, 'id'>) => {
    if (!editingItem) return;
    try {
      await ungTuyenRepo.update(editingItem.id, values);
      setIsModalOpen(false);
      setEditingItem(null);
      
      // Force refresh worker data
      const latestWorkers = await workerRepo.getAll();
      setWorkers(latestWorkers);

      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      toast.error('Cập nhật thất bại');
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

      const company = companies.find(c => c.id === item.congTyId);
      const companyName = company?.tenCongTy || 'N/A';
      const managers = company?.quanLy || [];

      const historyEntry = {
        ngayPhongVanCu: item.ngayPhongVan,
        ngayPhongVanMoi: ngayMoi,
        lyDo,
        tenCongTy: companyName,
        quanLy: managers,
        ngayCapNhat: new Date().toISOString()
      };

      const updatedHistory = [...(item.lichSuPhongVan || []), historyEntry];

      await ungTuyenRepo.update(id, {
        ngayPhongVan: ngayMoi,
        lichSuPhongVan: updatedHistory,
        trangThaiTuyen: TrangThaiTuyen.TOI_LICH_PHONG_VAN, // Tự động chuyển trạng thái
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

  const getStatusColor = (status: TrangThaiTuyen) => {
    switch (status) {
      case TrangThaiTuyen.DANG_NHAN_VIEC: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case TrangThaiTuyen.TU_CHOI: return 'bg-rose-50 text-rose-700 border-rose-100';
      case TrangThaiTuyen.CHO_PHONG_VAN: return 'bg-blue-50 text-blue-700 border-blue-100';
      case TrangThaiTuyen.TOI_LICH_PHONG_VAN: return 'bg-amber-50 text-amber-700 border-amber-100';
      case TrangThaiTuyen.DA_NGHI_VIEC: return 'bg-slate-100 text-slate-600 border-slate-200';
      case TrangThaiTuyen.CONG_TY_NGUNG_TUYEN: return 'bg-red-50 text-red-700 border-red-100';
      case TrangThaiTuyen.KHONG_DEN_PHONG_VAN: return 'bg-orange-50 text-orange-700 border-orange-100';
      case TrangThaiTuyen.CHO_XAC_NHAN: return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const toggleHistory = (id: string) => {
    const newSet = new Set(expandedHistories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedHistories(newSet);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case TrangThaiTuyen.CHO_PHONG_VAN: return 'Chờ phỏng vấn';
      case TrangThaiTuyen.TOI_LICH_PHONG_VAN: return 'Tới lịch PV';
      case TrangThaiTuyen.DANG_NHAN_VIEC: return 'Đang nhận việc';
      case TrangThaiTuyen.TU_CHOI: return 'Từ chối';
      case TrangThaiTuyen.CONG_TY_NGUNG_TUYEN: return 'Công ty ngừng tuyển';
      case TrangThaiTuyen.KHONG_DEN_PHONG_VAN: return 'Không đến phỏng vấn';
      case TrangThaiTuyen.CHO_XAC_NHAN: return 'Chờ xác nhận';
      case TrangThaiTuyen.DA_NGHI_VIEC: return 'Đã nghỉ việc';
      default: return status.replace(/_/g, ' ');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header phong cách Google Keep */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
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
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên, SĐT, CCCD hoặc Công ty..."
              className="block w-full h-10 md:h-11 bg-gray-100 border-none rounded-lg pl-10 md:pl-11 pr-4 focus:bg-white focus:ring-0 focus:shadow-md transition-all text-sm text-gray-700 truncate"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Main Content */}
        <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-4 md:p-8">
          <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Ứng tuyển</h2>
            <button 
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-semibold">Thêm Mới</span>
            </button>
          </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Desktop Table View */}
              <div className="hidden xl:block bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ứng viên / SĐT</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Năm sinh / GT</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">CCCD</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Lịch Phỏng Vấn</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Công ty</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).map((item) => (
                      <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-800 text-sm mb-0.5">{item.nguoiLaoDong.tenNguoiLaoDong}</div>
                          <div className="text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded-md">{item.nguoiLaoDong.soDienThoai}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-xs font-bold text-slate-700">{item.nguoiLaoDong.namSinh}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.nguoiLaoDong.gioiTinh}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-xs font-medium text-slate-600 font-mono">{item.nguoiLaoDong.cccd || '-'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center justify-center gap-1.5 min-w-[140px]">
                            {item.ngayPhongVan ? (
                              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm hover:shadow-md transition-all group/date cursor-default">
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-bold text-amber-700">{format(new Date(item.ngayPhongVan), 'dd/MM/yyyy')}</span>
                              </div>
                            ) : (
                                <span className="text-xs text-slate-400 font-medium italic py-1.5">- Chưa xếp lịch -</span>
                            )}
                             
                             <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      setRescheduleItem(item as any);
                                      setIsRescheduleOpen(true);
                                  }}
                                  title="Hẹn lại lịch"
                                  className="p-1.5 hover:bg-white hover:text-blue-600 text-slate-400 rounded-md transition-all shadow-sm hover:shadow active:scale-95"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                                
                                {item.lichSuPhongVan && item.lichSuPhongVan.length > 0 && (
                                   <>
                                     <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         toggleHistory(item.id);
                                       }}
                                       className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-all ${
                                         expandedHistories.has(item.id) 
                                           ? 'bg-blue-100 text-blue-700 font-bold shadow-sm' 
                                           : 'hover:bg-white text-slate-500 hover:text-slate-700 hover:shadow-sm'
                                       }`}
                                     >
                                       <span>Waitlist ({item.lichSuPhongVan.length})</span>
                                       <svg className={`w-3 h-3 transition-transform duration-300 ${expandedHistories.has(item.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                       </svg>
                                     </button>
                                   </>
                                )}
                             </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-bold text-slate-700 truncate max-w-[180px]" title={item.congTy?.tenCongTy}>{item.congTy?.tenCongTy || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="relative inline-block">
                             <select
                            value={item.trangThaiTuyen}
                            onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                            className={`appearance-none text-[10px] font-bold pl-3 pr-8 py-1.5 rounded-full border shadow-sm outline-none cursor-pointer transition-all hover:opacity-90 ${getStatusColor(item.trangThaiTuyen)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                              <option key={key} value={value} className="bg-white text-slate-800 py-1">
                                {getStatusLabel(value)}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                          </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-slate-600 line-clamp-2 italic max-w-[200px]" title={item.ghiChu || ''}>
                            {item.ghiChu || <span className="text-slate-300">Không có ghi chú</span>}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingItem(item as any);
                                setIsModalOpen(true);
                              }}
                              className="p-2 hover:bg-white border border-transparent hover:border-blue-200 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Xóa bản ghi ứng tuyển này?')) {
                                  await ungTuyenRepo.delete(item.id);
                                  toast.success('Đã xóa');
                                }
                              }}
                              className="p-2 hover:bg-white border border-transparent hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Accordion Row for History */}
                      {expandedHistories.has(item.id) && item.lichSuPhongVan && (
                        <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <td colSpan={8} className="px-4 py-4 border-b border-slate-100 bg-slate-50">
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm w-full">
                               <p className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                 Lịch sử thay đổi phỏng vấn ({item.lichSuPhongVan.length})
                               </p>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                 {item.lichSuPhongVan.map((his, idx) => (
                                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-1.5 hover:border-blue-100 transition-colors">
                                      <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-600">Ngày cập nhật</span>
                                          <span className="text-[10px] text-slate-500">{his.ngayCapNhat ? format(new Date(his.ngayCapNhat), 'HH:mm dd/MM/yyyy') : '-'}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                          {his.tenCongTy && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{his.tenCongTy}</span>}
                                          {his.quanLy && his.quanLy.length > 0 && (
                                            <div className="flex flex-col items-end">
                                              {his.quanLy.map(ql => (
                                                <span key={ql.id} className="text-[8px] font-medium text-slate-400">
                                                  QL: {ql.tenQuanLy} 
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-xs bg-white p-1.5 rounded border border-slate-100">
                                        <span className="text-slate-400 line-through">{his.ngayPhongVanCu ? format(new Date(his.ngayPhongVanCu), 'dd/MM/yyyy') : '---'}</span>
                                        <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        <span className="font-bold text-amber-600">{his.ngayPhongVanMoi ? format(new Date(his.ngayPhongVanMoi), 'dd/MM/yyyy') : 'N/A'}</span>
                                      </div>
                                      
                                      {his.lyDo && (
                                        <div className="mt-0.5">
                                          <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Lý do/Ghi chú:</span>
                                          <p className="text-[10px] italic text-slate-600 bg-amber-50/50 p-1.5 rounded border border-amber-100/50">"{his.lyDo}"</p>
                                        </div>
                                      )}
                                    </div>
                                 ))}
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

              {/* Mobile/Tablet Card View */}
              <div className="xl:hidden space-y-4">
                {filteredData.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative group overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(item.trangThaiTuyen).split(' ')[1].replace('text', 'bg')}`} />
                    
                    {/* Left: Worker Info */}
                    <div className="flex-shrink-0 w-full md:w-48 pl-2">
                      <h3 className="text-base font-bold text-slate-800 mb-1">{item.nguoiLaoDong.tenNguoiLaoDong}</h3>
                      <p className="text-sm font-bold text-blue-600 mb-2">{item.nguoiLaoDong.soDienThoai}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-full uppercase tracking-tighter">
                          {item.nguoiLaoDong.namSinh} • {item.nguoiLaoDong.gioiTinh}
                        </span>
                        {item.nguoiLaoDong.cccd && (
                          <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-full uppercase tracking-tighter">
                            CCCD: {item.nguoiLaoDong.cccd}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Job & Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái:</span>
                    <select
                      value={item.trangThaiTuyen}
                      onChange={(e) => handleQuickStatusUpdate(item.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase outline-none bg-transparent ${getStatusColor(item.trangThaiTuyen)}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                       {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                          <option key={key} value={value} className="bg-white text-slate-800">
                            {getStatusLabel(value)}
                          </option>
                        ))}
                    </select>
                  </div>
      {item.ngayPhongVan && (
                          <span className="text-[10px] font-bold text-amber-600 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg uppercase tracking-wider">
                            PV: {format(new Date(item.ngayPhongVan), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 font-bold mb-1 truncate">{item.congTy?.tenCongTy || 'N/A'}</p>
                      
                      {item.ghiChu && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ghi chú</p>
                          <p className="text-sm text-slate-700 font-medium">{item.ghiChu}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row md:flex-col justify-end gap-2 pr-2">
                      <button 
                        onClick={() => {
                          setEditingItem(item as any);
                          setIsModalOpen(true);
                        }}
                        className="p-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Xóa bản ghi ứng tuyển này?')) {
                            await ungTuyenRepo.delete(item.id);
                            toast.success('Đã xóa');
                          }
                        }}
                        className="p-3 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-600 mb-1">Không tìm thấy ứng tuyển nào</h3>
              <p className="text-sm text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc lọc theo tiêu chí khác.</p>
            </div>
          )}
        </div>
        </main>
      </div>

      <UngTuyenModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={editingItem ? handleUpdate : handleCreate}
        initialData={editingItem}
      />

      {rescheduleItem && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => {
            setIsRescheduleOpen(false);
            setRescheduleItem(null);
          }}
          item={rescheduleItem}
          onSave={handleReschedule}
        />
      )}
    </div>
  );
}
