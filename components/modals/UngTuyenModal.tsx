'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UngTuyen, NguoiLaoDong, TinTuyenDung, TrangThaiTuyen } from '@/types';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';

const ungTuyenSchema = z.object({
  nguoiLaoDongId: z.string().min(1, 'Vui lòng chọn người lao động'),
  ngayPhongVan: z.string().nullable().optional(),
  trangThaiTuyen: z.nativeEnum(TrangThaiTuyen),
  ghiChu: z.string().nullable().optional(),
});

type UngTuyenFormValues = z.infer<typeof ungTuyenSchema>;

interface UngTuyenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<UngTuyen, 'id'>) => Promise<void>;
  initialData?: UngTuyen | null;
  fixedTinTuyenDung?: TinTuyenDung | null;
}

const workerRepo = new NguoiLaoDongRepository();

const UngTuyenModal: React.FC<UngTuyenModalProps> = ({ isOpen, onClose, onSave, initialData, fixedTinTuyenDung }) => {
  const [workers, setWorkers] = useState<NguoiLaoDong[]>([]);
  
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<UngTuyenFormValues>({
    resolver: zodResolver(ungTuyenSchema),
    defaultValues: {
      nguoiLaoDongId: '',
      ngayPhongVan: null,
      trangThaiTuyen: TrangThaiTuyen.CHO_PHONG_VAN,
      ghiChu: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = workerRepo.subscribeAll(setWorkers);
      
      if (initialData) {
        reset({
          nguoiLaoDongId: initialData.nguoiLaoDongId,
          ngayPhongVan: initialData.ngayPhongVan,
          trangThaiTuyen: initialData.trangThaiTuyen,
          ghiChu: initialData.ghiChu,
        });
      } else {
        reset({
          nguoiLaoDongId: '',
          ngayPhongVan: null,
          trangThaiTuyen: TrangThaiTuyen.CHO_PHONG_VAN,
          ghiChu: '',
        });
      }
      return () => unsubscribe();
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: UngTuyenFormValues) => {
    if (!fixedTinTuyenDung && !initialData) {
      alert('Dữ liệu tin tuyển dụng không hợp lệ');
      return;
    }

    const ungTuyenData: Omit<UngTuyen, 'id'> = {
      ...values,
      nguoiLaoDongId: values.nguoiLaoDongId,
      tinTuyenDungId: initialData?.tinTuyenDungId || fixedTinTuyenDung?.id || '',
      ngayPhongVan: values.ngayPhongVan || null,
      ghiChu: values.ghiChu || null,
    };

    await onSave(ungTuyenData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Cập nhật ứng tuyển' : 'Gán ứng viên cho tin'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {fixedTinTuyenDung && (
          <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Tin tuyển dụng</p>
            <p className="text-sm font-bold text-blue-700 truncate">{fixedTinTuyenDung.moTa}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Chọn người lao động
            </label>
            <select
              {...register('nguoiLaoDongId')}
              disabled={!!initialData}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.nguoiLaoDongId ? 'border-red-300' : 'border-slate-100'} ${initialData ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Chọn ứng viên --</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.tenNguoiLaoDong} - {w.soDienThoai}</option>
              ))}
            </select>
            {errors.nguoiLaoDongId && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.nguoiLaoDongId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Ngày phỏng vấn (Nếu có)
            </label>
            <input
              type="date"
              {...register('ngayPhongVan')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Trạng thái tuyển dụng
            </label>
            <select
              {...register('trangThaiTuyen')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Ghi chú / Phản hồi
            </label>
            <textarea
              {...register('ghiChu')}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              placeholder="Nhập ghi chú quan trọng hoặc lý do từ chối..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-50 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Ứng tuyển'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UngTuyenModal;
