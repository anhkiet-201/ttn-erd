'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UngTuyen, NguoiLaoDong, TinTuyenDung, TrangThaiTuyen, GioiTinh, CongTy } from '@/types';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';

// Helper function to parse CCCD and extract birth year and gender
// Calculated based on standard formulated logic provided by user
const parseCCCD = (cccd: string): { namSinh: number; gioiTinh: GioiTinh } | null => {
  if (cccd.length !== 12 || !/^\d{12}$/.test(cccd)) return null;
  
  const digit4 = parseInt(cccd[3]); // 4th digit (0-indexed: position 3)
  const yearLastTwo = parseInt(cccd.substring(4, 6)); // Digits 5-6
  
  // Gender logic: Even -> Male (NAM), Odd -> Female (NU)
  const gioiTinh = (digit4 % 2 === 0) ? GioiTinh.NAM : GioiTinh.NU;
  
  // Birth year logic: 
  // 0, 1 -> 19xx
  // 2, 3 -> 20xx
  // 4, 5 -> 21xx, etc.
  const century = 1900 + Math.floor(digit4 / 2) * 100;
  const namSinh = century + yearLastTwo;
  
  return { namSinh, gioiTinh };
};

const ungTuyenSchema = z.object({
  cccd: z.string().length(12, 'CCCD phải đủ 12 số').regex(/^\d{12}$/, 'CCCD chỉ chứa số'),
  congTyId: z.string().min(1, 'Vui lòng chọn công ty'),
  // Worker fields
  tenNguoiLaoDong: z.string().min(1, 'Họ tên không được để trống'),
  soDienThoai: z.string().min(10, 'SĐT không hợp lệ').nullable(),
  namSinh: z.number().min(1900).max(new Date().getFullYear()),
  gioiTinh: z.nativeEnum(GioiTinh),
  // Recruitment fields
  ngayPhongVan: z.string().nullable().optional(),
  trangThaiTuyen: z.nativeEnum(TrangThaiTuyen),
  ghiChu: z.string().nullable().optional(),
});

type UngTuyenFormValues = z.infer<typeof ungTuyenSchema>;

interface UngTuyenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<UngTuyen, 'id'>) => Promise<void>;
  initialData?: UngTuyen | null;
  fixedTinTuyenDung?: TinTuyenDung | null;
}

const workerRepo = new NguoiLaoDongRepository();
const congTyRepo = new CongTyRepository();

const UngTuyenModal: React.FC<UngTuyenModalProps> = ({ isOpen, onClose, onSave, initialData, fixedTinTuyenDung }) => {
  const [workers, setWorkers] = useState<NguoiLaoDong[]>([]);
  const [companies, setCompanies] = useState<CongTy[]>([]);
  const [existingWorker, setExistingWorker] = useState<NguoiLaoDong | null>(null);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<UngTuyenFormValues>({
    resolver: zodResolver(ungTuyenSchema),
    defaultValues: {
      cccd: '',
      tenNguoiLaoDong: '',
      soDienThoai: '',
      namSinh: new Date().getFullYear() - 20,
      gioiTinh: GioiTinh.NAM,
      congTyId: fixedTinTuyenDung?.congTy?.id || '',
      ngayPhongVan: null,
      trangThaiTuyen: TrangThaiTuyen.CHO_PHONG_VAN,
      ghiChu: '',
    },
  });

  // Subscribe to workers and companies
  useEffect(() => {
    if (isOpen) {
      const unsubWorkers = workerRepo.subscribeAll(setWorkers);
      const unsubCompanies = congTyRepo.subscribeAll(setCompanies);
      
      // Load initial data if editing
      if (initialData) {
        const worker = workers.find(w => w.id === initialData.nguoiLaoDongId);
        if (worker) {
          reset({
            cccd: worker.cccd || '',
            congTyId: initialData.congTyId,
            tenNguoiLaoDong: worker.tenNguoiLaoDong,
            soDienThoai: worker.soDienThoai,
            namSinh: worker.namSinh,
            gioiTinh: worker.gioiTinh,
            ngayPhongVan: initialData.ngayPhongVan,
            trangThaiTuyen: initialData.trangThaiTuyen,
            ghiChu: initialData.ghiChu,
          });
        }
      }
      
      return () => {
        unsubWorkers();
        unsubCompanies();
      };
    }
  }, [isOpen, initialData, reset, workers.length]);

  const handleCCCDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('cccd', value);

    if (value.length === 12) {
      // Check if worker exists
      const foundWorker = workers.find(w => w.cccd === value);
      
      if (foundWorker) {
        // Auto-fill from existing worker
        setExistingWorker(foundWorker);
        setValue('tenNguoiLaoDong', foundWorker.tenNguoiLaoDong, { shouldValidate: true });
        setValue('soDienThoai', foundWorker.soDienThoai || '', { shouldValidate: true });
        setValue('namSinh', foundWorker.namSinh, { shouldValidate: true });
        setValue('gioiTinh', foundWorker.gioiTinh, { shouldValidate: true });
      } else {
        // Parse CCCD to extract info
        setExistingWorker(null);
        const parsed = parseCCCD(value);
        if (parsed) {
          setValue('namSinh', parsed.namSinh, { shouldValidate: true });
          setValue('gioiTinh', parsed.gioiTinh, { shouldValidate: true });
        }
      }
    }
  };

  if (!isOpen) return null;

  const onSubmit = async (values: UngTuyenFormValues) => {
    try {
      let workerId: string;
      
      // 1. Create or update worker
      if (existingWorker) {
        // Update existing worker
        await workerRepo.update(existingWorker.id, {
          tenNguoiLaoDong: values.tenNguoiLaoDong,
          soDienThoai: values.soDienThoai,
          namSinh: values.namSinh,
          gioiTinh: values.gioiTinh,
          cccd: values.cccd,
        } as any);
        workerId = existingWorker.id;
      } else {
        // Create new worker
        workerId = await workerRepo.create({
          tenNguoiLaoDong: values.tenNguoiLaoDong,
          soDienThoai: values.soDienThoai,
          namSinh: values.namSinh,
          gioiTinh: values.gioiTinh,
          cccd: values.cccd,
        } as any);
      }

      // 2. Save recruitment data
      const ungTuyenData: Omit<UngTuyen, 'id'> = {
        nguoiLaoDongId: workerId,
        congTyId: values.congTyId,
        ngayPhongVan: values.ngayPhongVan || null,
        trangThaiTuyen: values.trangThaiTuyen,
        ghiChu: values.ghiChu || null,
      };

      await onSave(ungTuyenData);
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error);
      alert('Không thể lưu thông tin ứng tuyển');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Cập nhật ứng tuyển' : 'Gán ứng viên cho tin'}
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

        {fixedTinTuyenDung ? (
          <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Công ty ứng tuyển</p>
            <p className="text-sm font-bold text-blue-700 truncate">{fixedTinTuyenDung.congTy?.tenCongTy}</p>
          </div>
        ) : (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Chọn công ty
            </label>
            <select
              {...register('congTyId')}
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all ${errors.congTyId ? 'border-red-300' : 'border-slate-200'}`}
            >
              <option value="">-- Chọn công ty --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.tenCongTy}</option>
              ))}
            </select>
            {errors.congTyId && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.congTyId.message}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Thông tin ứng viên
            </label>
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              {/* CCCD First */}
              <div>
                <input
                  {...register('cccd')}
                  onChange={handleCCCDChange}
                  placeholder="Số CCCD (12 số)"
                  maxLength={12}
                  className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 font-mono ${errors.cccd ? 'border-red-300' : 'border-slate-200'}`}
                />
                {errors.cccd && <p className="mt-1 text-[10px] text-red-500 font-bold">{errors.cccd.message}</p>}
                {existingWorker && (
                  <p className="mt-1 text-[10px] text-green-600 font-bold">✓ Đã tìm thấy hồ sơ</p>
                )}
              </div>
              
              <div>
                <input
                  {...register('tenNguoiLaoDong')}
                  placeholder="Họ và tên"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.tenNguoiLaoDong && <p className="mt-1 text-[10px] text-red-500 font-bold">{errors.tenNguoiLaoDong.message}</p>}
              </div>
              
              <input
                {...register('soDienThoai')}
                placeholder="Số điện thoại"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  {...register('namSinh', { valueAsNumber: true })}
                  placeholder="Năm sinh"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
                <select
                  {...register('gioiTinh')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value={GioiTinh.NAM}>Nam</option>
                  <option value={GioiTinh.NU}>Nữ</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Ngày phỏng vấn
              </label>
              <input
                type="date"
                {...register('ngayPhongVan')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Trạng thái
              </label>
              <select
                {...register('trangThaiTuyen')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Ghi chú / Phản hồi
            </label>
            <textarea
              {...register('ghiChu')}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              placeholder="Nhập ghi chú quan trọng..."
            />
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
              {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Ứng tuyển'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UngTuyenModal;
