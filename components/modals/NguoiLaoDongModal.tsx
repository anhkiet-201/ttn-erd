'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { NguoiLaoDong, GioiTinh } from '@/types';

const nguoiLaoDongSchema = z.object({
  tenNguoiLaoDong: z.string().min(1, 'Vui lòng nhập tên người lao động'),
  soDienThoai: z.string().nullable().optional().refine(val => !val || val.length >= 10, {
    message: "SĐT phải có ít nhất 10 số"
  }),
  namSinh: z.number().min(1900, 'Năm sinh không hợp lệ').max(new Date().getFullYear()),
  gioiTinh: z.nativeEnum(GioiTinh),
  cccd: z.string().nullable(),
});

type NguoiLaoDongFormValues = z.infer<typeof nguoiLaoDongSchema>;

interface NguoiLaoDongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<NguoiLaoDong, 'id'>) => Promise<void>;
  initialData?: NguoiLaoDong | null;
}

import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

const NguoiLaoDongModal: React.FC<NguoiLaoDongModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isValid } } = useForm<NguoiLaoDongFormValues>({
    resolver: zodResolver(nguoiLaoDongSchema),
    mode: 'onChange',
    defaultValues: {
      tenNguoiLaoDong: '',
      soDienThoai: '',
      namSinh: new Date().getFullYear() - 20,
      gioiTinh: GioiTinh.NAM,
      cccd: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          tenNguoiLaoDong: initialData.tenNguoiLaoDong,
          soDienThoai: initialData.soDienThoai,
          namSinh: initialData.namSinh,
          gioiTinh: initialData.gioiTinh,
          cccd: initialData.cccd || '',
        });
      } else {
        reset({
          tenNguoiLaoDong: '',
          soDienThoai: '',
          namSinh: new Date().getFullYear() - 20,
          gioiTinh: GioiTinh.NAM,
          cccd: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: NguoiLaoDongFormValues) => {
    await onSave({
      ...values,
      soDienThoai: values.soDienThoai || null,
      cccd: values.cccd || null,
    });
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
        {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm mới'}
      </GlassButton>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Sửa Người Lao Động' : 'Thêm Nhân Sự Mới'}
      subtitle={initialData ? `Mã nhân sự: ${initialData.id.slice(0, 8)}` : 'Đăng ký thông viên viên lao động mới'}
      footer={footer}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và Tên</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              {...register('tenNguoiLaoDong')}
              className={`w-full pl-11 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.tenNguoiLaoDong ? 'border-red-300' : 'border-gray-100'}`}
              placeholder="Nhập tên người lao động..."
            />
          </div>
          {errors.tenNguoiLaoDong && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.tenNguoiLaoDong.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số Điện Thoại</label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                {...register('soDienThoai')}
                className={`w-full pl-11 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.soDienThoai ? 'border-red-300' : 'border-gray-100'}`}
                placeholder="09xx xxx xxx"
              />
            </div>
            {errors.soDienThoai && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.soDienThoai.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số CCCD</label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 1 4 4m0 0H6" />
                </svg>
              </div>
              <input
                {...register('cccd')}
                className={`w-full pl-11 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.cccd ? 'border-red-300' : 'border-gray-100'}`}
                placeholder="Nhập số CCCD..."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Năm sinh</label>
            <input
              type="number"
              {...register('namSinh', { valueAsNumber: true })}
              className={`w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.namSinh ? 'border-red-300' : 'border-gray-100'}`}
            />
            {errors.namSinh && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.namSinh.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giới tính</label>
            <select
              {...register('gioiTinh')}
              className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border border-gray-100 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              <option value={GioiTinh.NAM}>Nam</option>
              <option value={GioiTinh.NU}>Nữ</option>
            </select>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};

export default NguoiLaoDongModal;
