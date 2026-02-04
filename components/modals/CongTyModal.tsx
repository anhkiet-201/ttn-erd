'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CongTy, KhuVuc } from '@/types';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';

const congTySchema = z.object({
  tenCongTy: z.string().min(2, 'Tên công ty phải có ít nhất 2 ký tự'),
  khuVucId: z.string().min(1, 'Vui lòng chọn khu vực'),
});

type CongTyFormValues = z.infer<typeof congTySchema>;

interface CongTyModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: CongTy | null;
}

const congTyRepo = new CongTyRepository();
const khuVucRepo = new KhuVucRepository();

export default function CongTyModal({ isOpen, onClose, data }: CongTyModalProps) {
  const [khuVucs, setKhuVucs] = useState<KhuVuc[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CongTyFormValues>({
    resolver: zodResolver(congTySchema),
  });

  useEffect(() => {
    if (isOpen) {
      khuVucRepo.getAll().then(setKhuVucs);
      if (data) {
        reset({
          tenCongTy: data.tenCongTy,
          khuVucId: data.khuVuc?.id || '',
        });
      } else {
        reset({
          tenCongTy: '',
          khuVucId: '',
        });
      }
    }
  }, [isOpen, data, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: CongTyFormValues) => {
    setLoading(true);
    try {
      const selectedKhuVuc = khuVucs.find(kv => kv.id === values.khuVucId);
      if (!selectedKhuVuc) throw new Error('Khu vực không hợp lệ');

      if (data?.id) {
        await congTyRepo.update(data.id, {
          tenCongTy: values.tenCongTy,
          khuVuc: { 
            id: selectedKhuVuc.id, 
            tenKhuVuc: selectedKhuVuc.tenKhuVuc 
          } as any,
        });
      } else {
        await congTyRepo.create({
          tenCongTy: values.tenCongTy,
          khuVuc: { 
            id: selectedKhuVuc.id, 
            tenKhuVuc: selectedKhuVuc.tenKhuVuc 
          } as any,
          tinTuyenDung: [],
        });
      }
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu công ty:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center md:p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-xl shadow-2xl flex flex-col border border-gray-200">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{data ? 'Chỉnh Sửa Công Ty' : 'Thêm Công Ty Mới'}</h2>
          <button onClick={onClose} className="p-2.5 md:p-2 hover:bg-gray-100 rounded-full text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên công ty *</label>
            <input
              {...register('tenCongTy')}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none ${errors.tenCongTy ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Ví dụ: Công ty TNHH Giải pháp Phần mềm"
            />
            {errors.tenCongTy && <p className="mt-1 text-xs text-red-500">{errors.tenCongTy.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Khu vực *</label>
            <select
              {...register('khuVucId')}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white ${errors.khuVucId ? 'border-red-500' : 'border-gray-200'}`}
            >
              <option value="">-- Chọn khu vực --</option>
              {khuVucs.map(kv => (
                <option key={kv.id} value={kv.id}>{kv.tenKhuVuc}</option>
              ))}
            </select>
            {errors.khuVucId && <p className="mt-1 text-xs text-red-500">{errors.khuVucId.message}</p>}
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
