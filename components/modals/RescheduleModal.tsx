'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UngTuyenWithDetails, TrangThaiTuyen } from '@/types';
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
  item: UngTuyenWithDetails;
  onSave: (id: string, ngayMoi: string, lyDo: string) => Promise<void>;
}

import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    mode: 'onChange',
    defaultValues: {
        ngayPhongVanMoi: '',
        lyDo: '',
    }
  });

  const onSubmit = async (values: RescheduleFormValues) => {
    await onSave(item.id, values.ngayPhongVanMoi, values.lyDo || '');
  };

  const footer = (
    <div className="flex gap-3 w-full">
      <GlassButton
        variant="secondary"
        onClick={onClose}
        className="flex-1"
      >
        Hủy
      </GlassButton>
      <GlassButton
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting || !isValid}
        className="flex-1"
      >
        {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
      </GlassButton>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Hẹn Lịch Phỏng Vấn"
      subtitle={`Ứng viên: ${item.nguoiLaoDong?.tenNguoiLaoDong || 'N/A'}`}
      footer={footer}
      maxWidth="max-w-sm"
    >
      <div className="space-y-6">
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 space-y-1">
          <p className="text-[9px] uppercase font-black text-amber-500 tracking-widest leading-none mb-1">Lịch hiện tại</p>
          <p className="text-sm font-bold text-amber-900 italic">
            {item.ngayPhongVan ? format(new Date(item.ngayPhongVan), 'eeee, dd/MM/yyyy', { locale: vi }) : 'Chưa có lịch cụ thể'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chọn ngày mới</label>
          <input
            type="date"
            {...register('ngayPhongVanMoi')}
            className={`w-full px-4 py-3 bg-gray-50/50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.ngayPhongVanMoi ? 'border-red-300' : 'border-gray-100'}`}
          />
          {errors.ngayPhongVanMoi && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.ngayPhongVanMoi.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lý do dời lịch</label>
          <textarea
            {...register('lyDo')}
            rows={3}
            placeholder="VD: Ứng viên bận việc đột xuất hoặc thay đổi kế hoạch..."
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none placeholder:font-normal placeholder:capitalize leading-relaxed"
          />
        </div>
      </div>
    </GlassModal>
  );
};

export default RescheduleModal;
