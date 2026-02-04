'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KhuVuc } from '@/types';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';

const khuVucSchema = z.object({
  tenKhuVuc: z.string().min(2, 'Tên khu vực phải có ít nhất 2 ký tự'),
  diaChi: z.string().optional().nullable(),
  mapUrl: z.string().optional().nullable(),
});

type KhuVucFormValues = z.infer<typeof khuVucSchema>;

interface KhuVucModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: KhuVuc | null;
}

const repository = new KhuVucRepository();

export default function KhuVucModal({ isOpen, onClose, data }: KhuVucModalProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<KhuVucFormValues>({
    resolver: zodResolver(khuVucSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (data) {
        reset({ 
          tenKhuVuc: data.tenKhuVuc,
          diaChi: data.diaChi || '',
          mapUrl: data.mapUrl || '',
        });
      } else {
        reset({ 
          tenKhuVuc: '',
          diaChi: '',
          mapUrl: '',
        });
      }
    }
  }, [isOpen, data, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: KhuVucFormValues) => {
    setLoading(true);
    try {
      if (data?.id) {
        await repository.update(data.id, values);
      } else {
        await repository.create({
          ...values,
          congTy: [],
        } as any);
      }
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu khu vực:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center md:p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-xl shadow-2xl flex flex-col border border-gray-200">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{data ? 'Chỉnh Sửa Khu Vực' : 'Thêm Khu Vực Mới'}</h2>
          <button onClick={onClose} className="p-2.5 md:p-2 hover:bg-gray-100 rounded-full text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên khu vực *</label>
            <input
              {...register('tenKhuVuc')}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none ${errors.tenKhuVuc ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Ví dụ: Hồ Chí Minh, Bình Dương..."
            />
            {errors.tenKhuVuc && <p className="mt-1 text-xs text-red-500">{errors.tenKhuVuc.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ</label>
            <input
              {...register('diaChi')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Nhập địa chỉ của khu vực..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link Google Maps</label>
            <input
              {...register('mapUrl')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="https://goo.gl/maps/..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 md:gap-3 pt-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 md:px-4 py-3 md:py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 md:py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Đang lưu...' : 'Lưu Lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
