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

import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

export default function KhuVucModal({ isOpen, onClose, data }: KhuVucModalProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<KhuVucFormValues>({
    resolver: zodResolver(khuVucSchema),
    mode: 'onChange'
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
        disabled={loading || !isValid}
        className="flex-1"
      >
        {loading ? 'Đang lưu...' : 'Lưu Khu Vực'}
      </GlassButton>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? 'Chỉnh Sửa Khu Vực' : 'Thêm Khu Vực Mới'}
      subtitle={data ? `Mã KV: ${data.id.slice(0, 8)}` : 'Định nghĩa đơn vị hành chính hoặc khu vực mới'}
      footer={footer}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên khu vực</label>
          <input
            {...register('tenKhuVuc')}
            className={`w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.tenKhuVuc ? 'border-red-300' : 'border-gray-100'}`}
            placeholder="Ví dụ: Hồ Chí Minh, Bình Dương..."
          />
          {errors.tenKhuVuc && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.tenKhuVuc.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả Địa chỉ</label>
          <input
            {...register('diaChi')}
            className="w-full px-4 py-3 bg-gray-100/30 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
            placeholder="Số nhà, tên đường hoặc mô tả ngắn..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Toạ độ Bản đồ</label>
          <input
            {...register('mapUrl')}
            className="w-full px-4 py-3 bg-gray-100/30 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
            placeholder="https://goo.gl/maps/..."
          />
        </div>
      </div>
    </GlassModal>
  );
}
