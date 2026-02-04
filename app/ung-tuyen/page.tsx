'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { UngTuyenRepository } from '@/repositories/ungTuyen.repository';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { TinTuyenDungRepository } from '@/repositories/tinTuyenDung.repository';
import { UngTuyen, UngTuyenWithDetails, NguoiLaoDong, TinTuyenDung, TrangThaiTuyen } from '@/types';
import UngTuyenModal from '@/components/modals/UngTuyenModal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ungTuyenRepo = new UngTuyenRepository();
const workerRepo = new NguoiLaoDongRepository();
const jobRepo = new TinTuyenDungRepository();

export default function UngTuyenPage() {
  const [ungTuyens, setUngTuyens] = useState<UngTuyen[]>([]);
  const [workers, setWorkers] = useState<NguoiLaoDong[]>([]);
  const [jobs, setJobs] = useState<TinTuyenDung[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UngTuyen | null>(null);

  useEffect(() => {
    const unsubUngTuyen = ungTuyenRepo.subscribeAll(setUngTuyens);
    const unsubWorkers = workerRepo.subscribeAll(setWorkers);
    const unsubJobs = jobRepo.subscribeAll(setJobs);
    setLoading(false);

    return () => {
      unsubUngTuyen();
      unsubWorkers();
      unsubJobs();
    };
  }, []);

  const joinedData: UngTuyenWithDetails[] = ungTuyens.map(ut => {
    const worker = workers.find(w => w.id === ut.nguoiLaoDongId) || { tenNguoiLaoDong: 'Ẩn danh', soDienThoai: '', namSinh: 0, gioiTinh: 'NAM' } as any;
    const job = jobs.find(j => j.id === ut.tinTuyenDungId) || { moTa: 'Tin đã xóa' } as any;
    return {
      ...ut,
      nguoiLaoDong: worker,
      tinTuyenDung: job,
    };
  });

  const handleUpdate = async (values: Omit<UngTuyen, 'id'>) => {
    if (!editingItem) return;
    try {
      await ungTuyenRepo.update(editingItem.id, values);
      setIsModalOpen(false);
      setEditingItem(null);
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      toast.error('Cập nhật thất bại');
    }
  };

  const getStatusColor = (status: TrangThaiTuyen) => {
    switch (status) {
      case TrangThaiTuyen.DANG_NHAN_VIEC: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case TrangThaiTuyen.TU_CHOI: return 'bg-rose-50 text-rose-700 border-rose-100';
      case TrangThaiTuyen.CHO_PHONG_VAN: return 'bg-blue-50 text-blue-700 border-blue-100';
      case TrangThaiTuyen.TOI_LICH_PHONG_VAN: return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Quản lý Ứng tuyển</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Theo dõi tiến độ phỏng vấn</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : joinedData.length > 0 ? (
            <div className="space-y-4 max-w-5xl mx-auto">
              {joinedData.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative group overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(item.trangThaiTuyen).split(' ')[1].replace('text', 'bg')}`} />
                  
                  {/* Left: Worker Info */}
                  <div className="flex-shrink-0 w-full md:w-48 pl-2">
                    <h3 className="text-base font-bold text-slate-800 mb-1">{item.nguoiLaoDong.tenNguoiLaoDong}</h3>
                    <p className="text-sm font-bold text-indigo-600 mb-2">{item.nguoiLaoDong.soDienThoai}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-full uppercase tracking-tighter">
                        {item.nguoiLaoDong.namSinh} • {item.nguoiLaoDong.gioiTinh}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Job & Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStatusColor(item.trangThaiTuyen)}`}>
                        {item.trangThaiTuyen.replace(/_/g, ' ')}
                      </span>
                      {item.ngayPhongVan && (
                        <span className="text-[10px] font-bold text-amber-600 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg uppercase tracking-wider">
                          PV: {format(new Date(item.ngayPhongVan), 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 italic mb-3">"{item.tinTuyenDung.moTa}"</p>
                    
                    {item.ghiChu && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ghi chú gần nhất</p>
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
                      className="p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                      title="Cập nhật trạng thái"
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
                      title="Xóa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-slate-300">
                      Cập nhật: {item.updatedAt ? format(new Date(item.updatedAt), 'HH:mm dd/MM', { locale: vi }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-600 mb-1">Chưa có ai ứng tuyển</h3>
              <p className="text-sm text-slate-400">Sử dụng nút "Ứng tuyển" tại trang Tin Tuyển Dụng để bắt đầu.</p>
            </div>
          )}
        </div>
      </main>

      <UngTuyenModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleUpdate}
        initialData={editingItem}
      />
    </div>
  );
}
