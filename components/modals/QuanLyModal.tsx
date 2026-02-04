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

import GlassButton from '../glass/GlassButton';

export default function QuanLyModal({ isOpen, onClose, data }: QuanLyModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<QuanLyFormValues>({
    resolver: zodResolver(quanLySchema),
    mode: 'onChange'
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
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-1">
              {data ? 'Chỉnh Sửa Nhân Sự' : 'Thêm Nhân Viên'}
            </h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">
              {data ? `Mã nhân viên: ${data.id.slice(0, 8)}` : 'Đăng ký tài khoản quản lý mới'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-600 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và Tên</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                {...register('tenQuanLy')}
                placeholder="VD: Nguyễn Văn A"
                className={`w-full pl-11 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.tenQuanLy ? 'border-red-300' : 'border-gray-100'}`}
              />
            </div>
            {errors.tenQuanLy && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.tenQuanLy.message}</p>}
          </div>

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
                placeholder="VD: 0987654321"
                className={`w-full pl-11 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.soDienThoai ? 'border-red-300' : 'border-gray-100'}`}
              />
            </div>
            {errors.soDienThoai && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.soDienThoai.message}</p>}
          </div>

          {/* Footer inside form if using EditModal wrapper directly */}
          <div className="flex gap-3 pt-6 border-t border-gray-100 mt-8">
            <GlassButton
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              type="button"
            >
              Hủy
            </GlassButton>
            <GlassButton
              disabled={isSaving || !isValid}
              className="flex-2"
              type="submit"
            >
              {isSaving ? 'Đang lưu...' : (data ? 'Cập Nhật' : 'Thêm Mới')}
            </GlassButton>
          </div>
        </form>
      </div>
    </EditModal>
  );
}
