'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QuanLy } from '@/types';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { EditModal } from './EditModal';

const quanLySchema = z.object({
  tenQuanLy: z.string().min(1, 'Vui lòng nhập tên nhân viên'),
  soDienThoai: z.string().min(10, 'Số điện thoại không hợp lệ'),
});

type QuanLyFormValues = z.infer<typeof quanLySchema>;

const repository = new QuanLyRepository();

interface QuanLyModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: QuanLy | null;
}

export function QuanLyModal({ isOpen, onClose, data }: QuanLyModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<QuanLyFormValues>({
    resolver: zodResolver(quanLySchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (data) {
        reset({
          tenQuanLy: data.tenQuanLy,
          soDienThoai: data.soDienThoai,
        });
      } else {
        reset({
          tenQuanLy: '',
          soDienThoai: '',
        });
      }
    }
  }, [isOpen, data, reset]);

  const onSubmit = async (values: QuanLyFormValues) => {
    setIsSaving(true);
    try {
      if (data?.id) {
        await repository.update(data.id, values);
      } else {
        await repository.create(values);
      }
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      alert('Đã có lỗi xảy ra.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditModal 
      recordType="quan-ly" 
      recordId={data?.id || 'new'} 
      isOpen={isOpen} 
      onClose={onClose}
    >
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {data ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Tên Nhân Viên</label>
            <input
              {...register('tenQuanLy')}
              placeholder="VD: Nguyễn Văn A"
              className={`w-full px-4 py-3 bg-gray-50 border ${errors.tenQuanLy ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'} rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-700`}
            />
            {errors.tenQuanLy && (
              <p className="text-xs text-red-500 mt-1 ml-1">{errors.tenQuanLy.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Số Điện Thoại</label>
            <input
              {...register('soDienThoai')}
              placeholder="VD: 0987654321"
              className={`w-full px-4 py-3 bg-gray-50 border ${errors.soDienThoai ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'} rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-700`}
            />
            {errors.soDienThoai && (
              <p className="text-xs text-red-500 mt-1 ml-1">{errors.soDienThoai.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] bg-blue-600 text-white px-6 py-3 font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isSaving ? 'Đang lưu...' : (data ? 'Cập Nhật' : 'Thêm Mới')}
            </button>
          </div>
        </form>
      </div>
    </EditModal>
  );
}
