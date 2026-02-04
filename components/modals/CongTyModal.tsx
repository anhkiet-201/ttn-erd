'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CongTy, KhuVuc } from '@/types';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { QuanLy } from '@/types';

const congTySchema = z.object({
  tenCongTy: z.string().min(2, 'Tên công ty phải có ít nhất 2 ký tự'),
  khuVucId: z.string().min(1, 'Vui lòng chọn khu vực'),
  quanLy: z.array(z.object({
    id: z.string(),
    tenQuanLy: z.string().min(1, 'Tên quản lý không được để trống'),
    soDienThoai: z.string().min(1, 'SĐT không được để trống'),
  })).default([]),
});

type CongTyFormValues = z.infer<typeof congTySchema>;

interface CongTyModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: CongTy | null;
}

const congTyRepo = new CongTyRepository();
const khuVucRepo = new KhuVucRepository();
const quanLyRepo = new QuanLyRepository();

export default function CongTyModal({ isOpen, onClose, data }: CongTyModalProps) {
  const [khuVucs, setKhuVucs] = useState<KhuVuc[]>([]);
  const [allQuanLys, setAllQuanLys] = useState<QuanLy[]>([]); // Danh sách tất cả quản lý có sẵn
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<CongTyFormValues>({
    resolver: zodResolver(congTySchema),
    defaultValues: {
      quanLy: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "quanLy"
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        khuVucRepo.getAll(),
        quanLyRepo.getAll()
      ]).then(([kvData, qlData]) => {
        setKhuVucs(kvData);
        setAllQuanLys(qlData);
      });

      if (data) {
        reset({
          tenCongTy: data.tenCongTy,
          khuVucId: data.khuVuc?.id || '',
          quanLy: data.quanLy || [],
        });
      } else {
        reset({
          tenCongTy: '',
          khuVucId: '',
          quanLy: [],
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
          quanLy: values.quanLy,
        });
      } else {
        await congTyRepo.create({
          tenCongTy: values.tenCongTy,
          khuVuc: { 
            id: selectedKhuVuc.id, 
            tenKhuVuc: selectedKhuVuc.tenKhuVuc 
          } as any,
          tinTuyenDung: [],
          quanLy: values.quanLy,
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

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">Danh sách Quản lý</label>
              <button
                type="button"
                onClick={() => append({ id: crypto.randomUUID(), tenQuanLy: '', soDienThoai: '' })}
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm Quản lý
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Chọn từ danh sách có sẵn */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Chọn quản lý có sẵn</p>
                <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
                  {allQuanLys.length > 0 ? allQuanLys.map(ql => {
                    const isSelected = fields.some(f => f.id === ql.id || (f.tenQuanLy === ql.tenQuanLy && f.soDienThoai === ql.soDienThoai));
                    return (
                      <label key={ql.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Thêm vào danh sách nếu chưa có
                              if (!isSelected) {
                                append({ id: ql.id, tenQuanLy: ql.tenQuanLy, soDienThoai: ql.soDienThoai });
                              }
                            } else {
                              // Xóa khỏi danh sách
                              const index = fields.findIndex(f => f.id === ql.id || (f.tenQuanLy === ql.tenQuanLy && f.soDienThoai === ql.soDienThoai));
                              if (index > -1) remove(index);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-700">{ql.tenQuanLy}</div>
                          <div className="text-[10px] text-slate-500">{ql.soDienThoai}</div>
                        </div>
                      </label>
                    );
                  }) : <p className="text-xs text-slate-400 italic text-center py-2">Chưa có quản lý nào trong hệ thống</p>}
                </div>
              </div>

              {/* Danh sách đã chọn (Editable) */}
              <div className="space-y-3 pt-2">
                 <p className="text-xs font-bold text-slate-500 uppercase">Danh sách đã chọn ({fields.length})</p>
                 {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start bg-white p-2 rounded-lg border border-slate-200 shadow-sm group">
                      <div className="flex-1 space-y-1">
                        <input
                          {...register(`quanLy.${index}.tenQuanLy` as const)}
                          placeholder="Tên Quản lý"
                          className="w-full px-2 py-1 text-xs font-bold border-none focus:ring-0 p-0 text-slate-700 placeholder:font-normal"
                        />
                         <input
                           {...register(`quanLy.${index}.soDienThoai` as const)}
                           placeholder="SĐT"
                           className="w-full px-2 py-0 text-[10px] text-slate-500 border-none focus:ring-0 p-0"
                         />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                 ))}
              </div>
            </div>
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
