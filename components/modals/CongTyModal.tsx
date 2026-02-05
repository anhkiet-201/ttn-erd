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
  diaChi: z.string().optional().nullable(),
  mapUrl: z.string().optional().nullable(),
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

import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

export default function CongTyModal({ isOpen, onClose, data }: CongTyModalProps) {
  const [khuVucs, setKhuVucs] = useState<KhuVuc[]>([]);
  const [allQuanLys, setAllQuanLys] = useState<QuanLy[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, formState: { errors, isValid }, reset } = useForm<CongTyFormValues>({
    resolver: zodResolver(congTySchema),
    mode: 'onChange',
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

        if (data) {
          reset({
            tenCongTy: data.tenCongTy,
            khuVucId: data.khuVuc?.id || '',
            diaChi: data.diaChi || '',
            mapUrl: data.mapUrl || '',
            quanLy: data.quanLy || [],
          });
        } else {
          reset({
            tenCongTy: '',
            khuVucId: '',
            diaChi: '',
            mapUrl: '',
            quanLy: [],
          });
        }
      });
    }
  }, [isOpen, data, reset]);

  const onSubmit = async (values: CongTyFormValues) => {
    setLoading(true);
    try {
      const selectedKhuVuc = khuVucs.find(kv => kv.id === values.khuVucId);
      if (!selectedKhuVuc) throw new Error('Khu vực không hợp lệ');

      const payload = {
        tenCongTy: values.tenCongTy,
        khuVuc: { 
          id: selectedKhuVuc.id, 
          tenKhuVuc: selectedKhuVuc.tenKhuVuc 
        } as any,
        diaChi: values.diaChi || null,
        mapUrl: values.mapUrl || null,
        quanLy: values.quanLy,
      };

      if (data?.id) {
        await congTyRepo.update(data.id, payload);
      } else {
        await congTyRepo.create({ ...payload, tinTuyenDung: [] });
      }
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu công ty:', error);
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
        {loading ? 'Đang lưu...' : 'Lưu Lại'}
      </GlassButton>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? 'Chỉnh Sửa Công Ty' : 'Thêm Công Ty Mới'}
      subtitle={data ? `Mã đơn vị: ${data.id.slice(0, 8)}` : 'Đăng ký pháp nhân hoặc đơn vị mới vào hệ thống'}
      footer={footer}
    >
      <div className="space-y-6">
        <div className="space-y-4 p-5 bg-gray-50/50 rounded-[28px] border border-gray-100/50">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Thông tin pháp nhân</div>
          <div className="space-y-3">
            <div>
              <input
                {...register('tenCongTy')}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.tenCongTy ? 'border-red-300' : 'border-gray-100'}`}
                placeholder="Tên đầy đủ công ty..."
              />
              {errors.tenCongTy && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.tenCongTy.message}</p>}
            </div>

            <select
              {...register('khuVucId')}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none ${errors.khuVucId ? 'border-red-300' : 'border-gray-100'}`}
            >
              <option value="">-- Chọn khu vực --</option>
              {khuVucs.map(kv => (
                <option key={kv.id} value={kv.id}>{kv.tenKhuVuc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ cụ thể</label>
            <input
              {...register('diaChi')}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="Số nhà, tên đường..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tọa độ Bản đồ</label>
            <input
              {...register('mapUrl')}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="Dán link Google Maps..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đội ngũ quản lý</label>
            <button
              type="button"
              onClick={() => append({ id: crypto.randomUUID(), tenQuanLy: '', soDienThoai: '' })}
              className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-1 active:scale-95"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              THÊM MỚI
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Chọn từ danh sách có sẵn */}
            <div className="bg-slate-50/50 p-4 rounded-[28px] border border-slate-100/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Thư viện Quản lý</p>
              <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {allQuanLys.length > 0 ? allQuanLys.map(ql => {
                  const isSelected = fields.some(f => f.id === ql.id || (f.tenQuanLy === ql.tenQuanLy && f.soDienThoai === ql.soDienThoai));
                  return (
                    <label key={ql.id} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100 hover:border-blue-100'}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (!isSelected) append({ id: ql.id, tenQuanLy: ql.tenQuanLy, soDienThoai: ql.soDienThoai });
                          } else {
                            const index = fields.findIndex(f => f.id === ql.id || (f.tenQuanLy === ql.tenQuanLy && f.soDienThoai === ql.soDienThoai));
                            if (index > -1) remove(index);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-black text-gray-700 uppercase tracking-tight">{ql.tenQuanLy}</div>
                        <div className="text-[10px] font-bold text-gray-400 font-mono">{ql.soDienThoai}</div>
                      </div>
                    </label>
                  );
                }) : <p className="text-[10px] text-slate-400 italic text-center py-2">Hệ thống chưa có nhân sự quản lý</p>}
              </div>
            </div>

            {/* Danh sách đã chọn (Editable) */}
            {fields.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">Đã chọn ({fields.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {fields.map((field, index) => (
                      <div key={field.id} className="group relative flex gap-3 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100">
                        <div className="flex-1 min-w-0">
                          <input
                            {...register(`quanLy.${index}.tenQuanLy` as const)}
                            placeholder="Tên Quản lý"
                            className="w-full bg-transparent text-xs font-black text-gray-700 uppercase tracking-tight outline-none placeholder:font-normal placeholder:capitalize mb-0.5"
                          />
                           <input
                             {...register(`quanLy.${index}.soDienThoai` as const)}
                             placeholder="SĐT liên hệ"
                             className="w-full bg-transparent text-[10px] font-bold text-gray-400 font-mono outline-none"
                           />
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
