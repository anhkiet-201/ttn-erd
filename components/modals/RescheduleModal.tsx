'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UngTuyen, TrangThaiTuyen } from '@/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const rescheduleSchema = z.object({
  ngayPhongVanMoi: z.string().min(1, 'Vui lòng chọn ngày mới'),
  lyDo: z.string().optional(),
});

type RescheduleFormValues = z.infer<typeof rescheduleSchema>;

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UngTuyen;
  onSave: (id: string, ngayMoi: string, lyDo: string) => Promise<void>;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
        ngayPhongVanMoi: '',
        lyDo: '',
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (values: RescheduleFormValues) => {
    await onSave(item.id, values.ngayPhongVanMoi, values.lyDo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800">
            Hẹn lại lịch phỏng vấn
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
            <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Lịch hiện tại</p>
            <p className="font-bold text-amber-800">
              {item.ngayPhongVan ? format(new Date(item.ngayPhongVan), 'eeee, dd/MM/yyyy', { locale: vi }) : 'Chưa xếp lịch'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Chọn ngày mới
            </label>
            <input
              type="date"
              {...register('ngayPhongVanMoi')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            />
            {errors.ngayPhongVanMoi && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.ngayPhongVanMoi.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Lý do thay đổi
            </label>
            <textarea
              {...register('lyDo')}
              rows={3}
              placeholder="VD: Ứng viên bận việc đột xuất..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
            {errors.lyDo && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.lyDo.message}</p>}
          </div>

                  <div className="flex gap-3 pt-2">
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
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Lưu thay đổi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;
