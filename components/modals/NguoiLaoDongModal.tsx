'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { NguoiLaoDong, GioiTinh } from '@/types';

const nguoiLaoDongSchema = z.object({
  tenNguoiLaoDong: z.string().min(1, 'Vui lòng nhập tên người lao động'),
  soDienThoai: z.string().min(10, 'Số điện thoại không hợp lệ').nullable(),
  namSinh: z.number().min(1900, 'Năm sinh không hợp lệ').max(new Date().getFullYear()),
  gioiTinh: z.nativeEnum(GioiTinh),
});

type NguoiLaoDongFormValues = z.infer<typeof nguoiLaoDongSchema>;

interface NguoiLaoDongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<NguoiLaoDong, 'id'>) => Promise<void>;
  initialData?: NguoiLaoDong | null;
}

const NguoiLaoDongModal: React.FC<NguoiLaoDongModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NguoiLaoDongFormValues>({
    resolver: zodResolver(nguoiLaoDongSchema),
    defaultValues: {
      tenNguoiLaoDong: '',
      soDienThoai: '',
      namSinh: new Date().getFullYear() - 20,
      gioiTinh: GioiTinh.NAM,
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
        });
      } else {
        reset({
          tenNguoiLaoDong: '',
          soDienThoai: '',
          namSinh: new Date().getFullYear() - 20,
          gioiTinh: GioiTinh.NAM,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Chỉnh sửa người lao động' : 'Thêm người lao động mới'}
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

        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Họ và tên
            </label>
            <input
              {...register('tenNguoiLaoDong')}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.tenNguoiLaoDong ? 'border-red-300' : 'border-slate-100'}`}
              placeholder="Nhập tên người lao động..."
            />
            {errors.tenNguoiLaoDong && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.tenNguoiLaoDong.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Số điện thoại
            </label>
            <input
              {...register('soDienThoai')}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.soDienThoai ? 'border-red-300' : 'border-slate-100'}`}
              placeholder="Nhập số điện thoại..."
            />
            {errors.soDienThoai && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.soDienThoai.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Năm sinh
              </label>
              <input
                type="number"
                {...register('namSinh', { valueAsNumber: true })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.namSinh ? 'border-red-300' : 'border-slate-100'}`}
              />
              {errors.namSinh && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.namSinh.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Giới tính
              </label>
              <select
                {...register('gioiTinh')}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.gioiTinh ? 'border-red-300' : 'border-slate-100'}`}
              >
                <option value={GioiTinh.NAM}>Nam</option>
                <option value={GioiTinh.NU}>Nữ</option>
              </select>
              {errors.gioiTinh && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.gioiTinh.message}</p>}
            </div>
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
              {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NguoiLaoDongModal;
