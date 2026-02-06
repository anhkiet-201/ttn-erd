'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UngTuyen, NguoiLaoDong, TinTuyenDung, TrangThaiTuyen, GioiTinh, CongTy, NguoiLaoDongBiCam } from '@/types';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { NguoiLaoDongBiCamRepository } from '@/repositories/nguoiLaoDongBiCam.repository';

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
  soDienThoai: z.string().nullable().optional().refine(val => !val || val.length >= 10, {
    message: "SĐT phải có ít nhất 10 số"
  }),
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
  onSave: (data: Omit<UngTuyen, 'id'>, id?: string) => Promise<void>;
  initialData?: UngTuyen | null;
  fixedTinTuyenDung?: TinTuyenDung | null;
  existingUngTuyens?: UngTuyen[];
}

const workerRepo = new NguoiLaoDongRepository();
const congTyRepo = new CongTyRepository();
const bannedRepo = new NguoiLaoDongBiCamRepository();

import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

const UngTuyenModal: React.FC<UngTuyenModalProps> = ({ isOpen, onClose, onSave, initialData, fixedTinTuyenDung, existingUngTuyens = [] }) => {
  const [workers, setWorkers] = useState<NguoiLaoDong[]>([]);
  const [companies, setCompanies] = useState<CongTy[]>([]);
  const [existingWorker, setExistingWorker] = useState<NguoiLaoDong | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [bannedInfo, setBannedInfo] = useState<NguoiLaoDongBiCam | null>(null);
  const [isCheckingCCCD, setIsCheckingCCCD] = useState(false);
  
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

  const cccdValue = watch('cccd');

  // Debounced CCCD check for banned list
  useEffect(() => {
    if (cccdValue && cccdValue.length > 9) { 
      const timeoutId = setTimeout(async () => {
        setIsCheckingCCCD(true);
        setBannedInfo(null);
        try {
          const found = await bannedRepo.findByCCCD(cccdValue);
          if (found) {
             setBannedInfo(found);
          }
        } catch (error) {
           console.error('Error checking banned CCCD', error);
        } finally {
            setIsCheckingCCCD(false);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
        setBannedInfo(null);
    }
  }, [cccdValue]);

  // Track modal opening to reset initialization state
  useEffect(() => {
    if (isOpen) {
      setIsInitialized(false);
      setBannedInfo(null);
    }
  }, [isOpen, initialData?.id]);

  // Subscribe to metadata
  useEffect(() => {
    if (isOpen) {
      const unsubWorkers = workerRepo.subscribeAll(setWorkers);
      const unsubCompanies = congTyRepo.subscribeAll(setCompanies);
      return () => {
        unsubWorkers();
        unsubCompanies();
      };
    }
  }, [isOpen]);

  // Handle form initialization
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (initialData) {
        // Edit mode: Wait until worker data is available in the list
        const worker = workers.find(w => w.id === initialData.nguoiLaoDongId);
        if (worker) {
          setExistingWorker(worker);
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
          setIsInitialized(true);
        }
      } else {
        // Create mode: Reset to defaults immediately
        setExistingWorker(null);
        reset({
          cccd: '',
          tenNguoiLaoDong: '',
          soDienThoai: '',
          namSinh: new Date().getFullYear() - 20,
          gioiTinh: GioiTinh.NAM,
          congTyId: fixedTinTuyenDung?.congTy?.id || '',
          ngayPhongVan: null,
          trangThaiTuyen: TrangThaiTuyen.CHO_PHONG_VAN,
          ghiChu: '',
        });
        setIsInitialized(true);
      }
    }
  }, [isOpen, isInitialized, initialData, workers, reset, fixedTinTuyenDung]);

  const handleCCCDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('cccd', value);

    if (value.length === 12) {
      const foundWorker = workers.find(w => w.cccd === value);
      if (foundWorker) {
        setExistingWorker(foundWorker);
        setValue('tenNguoiLaoDong', foundWorker.tenNguoiLaoDong, { shouldValidate: true });
        setValue('soDienThoai', foundWorker.soDienThoai || '', { shouldValidate: true });
        setValue('namSinh', foundWorker.namSinh, { shouldValidate: true });
        setValue('gioiTinh', foundWorker.gioiTinh, { shouldValidate: true });
      } else {
        setExistingWorker(null);
        const parsed = parseCCCD(value);
        if (parsed) {
          setValue('namSinh', parsed.namSinh, { shouldValidate: true });
          setValue('gioiTinh', parsed.gioiTinh, { shouldValidate: true });
        }
      }
    }
  };

  const onSubmit = async (values: UngTuyenFormValues) => {
    try {
      let workerId: string;
      const workerByCCCD = workers.find(w => w.cccd === values.cccd);
      const targetWorker = existingWorker || workerByCCCD;

      const workerData = {
        tenNguoiLaoDong: values.tenNguoiLaoDong.toUpperCase(),
        soDienThoai: values.soDienThoai || null,
        namSinh: values.namSinh,
        gioiTinh: values.gioiTinh,
        cccd: values.cccd,
      };

      if (targetWorker) {
        await workerRepo.update(targetWorker.id, workerData as any);
        workerId = targetWorker.id;
      } else {
        workerId = await workerRepo.create(workerData as any);
      }

      let existingApp: UngTuyen | undefined;
      let historyToKeep: any[] = [];
      
      if (!initialData && workerId) {
        existingApp = existingUngTuyens.find(ut => ut.nguoiLaoDongId === workerId);
        if (existingApp) {
           let archivedStatus = existingApp.trangThaiTuyen;
           if (archivedStatus === TrangThaiTuyen.CHO_PHONG_VAN) archivedStatus = TrangThaiTuyen.TU_CHOI;
           if (archivedStatus === TrangThaiTuyen.DANG_NHAN_VIEC) archivedStatus = TrangThaiTuyen.DA_NGHI_VIEC;

           const oldCompany = companies.find(c => c.id === existingApp?.congTyId);
           const historyEntry = {
             ngayPhongVanCu: existingApp.ngayPhongVan,
             lyDo: 'Ứng tuyển mới (Thay thế)',
             tenCongTy: oldCompany?.tenCongTy || 'N/A',
             quanLy: oldCompany?.quanLy || [],
             ngayCapNhat: new Date().toISOString(),
             trangThaiTuyen: archivedStatus
           };
           historyToKeep = [...(existingApp.lichSuPhongVan || []), historyEntry];
        }
      }

      const ungTuyenData: Omit<UngTuyen, 'id'> = {
        nguoiLaoDongId: workerId,
        congTyId: values.congTyId,
        ngayPhongVan: values.ngayPhongVan || null,
        trangThaiTuyen: values.trangThaiTuyen,
        ghiChu: values.ghiChu || null,
        lichSuPhongVan: existingApp ? historyToKeep : (initialData?.lichSuPhongVan || [])
      };
      
      const idToUpdate = existingApp ? existingApp.id : undefined;
      await onSave(ungTuyenData, idToUpdate);
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error);
      alert('Không thể lưu thông tin ứng tuyển');
    }
  };

  const footer = (
    <div className="flex gap-3 w-full">
      <GlassButton
        type="button"
        variant="secondary"
        onClick={onClose}
        className="flex-1"
      >
        Hủy
      </GlassButton>
      <GlassButton
        type="submit"
        disabled={isSubmitting}
        className="flex-1"
        onClick={handleSubmit(onSubmit)}
      >
        {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Ứng tuyển'}
      </GlassButton>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Cập nhật ứng tuyển' : 'Gán ứng viên'}
      subtitle={initialData ? `Đang chỉnh sửa hồ sơ: ${initialData.id.slice(0, 8)}` : 'Gán hồ sơ vào đơn vị tuyển dụng'}
      footer={footer}
    >
      <div className="space-y-6">
        {fixedTinTuyenDung ? (
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Đơn vị ứng tuyển</p>
            <p className="text-sm font-black text-blue-700">{fixedTinTuyenDung.congTy?.tenCongTy}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chọn công ty</label>
            <select
              {...register('congTyId')}
              className={`w-full px-4 py-3 bg-gray-50/50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none ${errors.congTyId ? 'border-red-300' : 'border-gray-100'}`}
            >
              <option value="">-- Chọn công ty --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.tenCongTy}</option>
              ))}
            </select>
          </div>
        )}

        <div className={`space-y-4 p-5 rounded-[28px] border transition-colors ${bannedInfo ? 'bg-red-50 border-red-200' : 'bg-gray-50/50 border-gray-100/50'}`}>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex justify-between items-center">
             <span>Hồ sơ người lao động</span>
             {isCheckingCCCD && <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />}
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                {...register('cccd')}
                onChange={handleCCCDChange}
                placeholder="Số CCCD (12 số)"
                maxLength={12}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-100 ${errors.cccd ? 'border-red-300' : 'border-gray-100'} ${bannedInfo ? '!border-red-500 text-red-700' : ''}`}
              />
              {errors.cccd && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.cccd.message}</p>}
              {existingWorker && !bannedInfo && <p className="mt-1 text-[10px] text-emerald-600 font-black ml-1 uppercase">✓ Đã tìm thấy hồ sơ hệ thống</p>}
            </div>

            {bannedInfo && (
                <div className="p-3 bg-white/80 border border-red-100 rounded-xl animate-fadeIn shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-red-600">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-wide">Cảnh báo: Hồ sơ vi phạm</span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                        {bannedInfo.nguyenNhanCam?.map((reason, idx) => (
                            <div key={idx} className="bg-red-50 p-2 rounded-lg text-xs border border-red-100/50">
                                 <div className="flex justify-between font-bold text-gray-500 text-[9px] mb-0.5 uppercase">
                                    <span className="truncate max-w-[120px]">
                                        {companies.find(c => c.id === reason.congty.id)?.tenCongTy || reason.congty.tenCongTy}
                                    </span>
                                    {reason.ngayNghiViec && <span>{new Date(reason.ngayNghiViec).toLocaleDateString('vi-VN')}</span>}
                                 </div>
                                 <div className="text-red-700 font-medium leading-tight">{reason.nguyenNhan}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div>
              <input
                {...register('tenNguoiLaoDong')}
                placeholder="Họ và tên"
                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 uppercase ${errors.tenNguoiLaoDong ? 'border-red-300' : 'border-gray-100'}`}
              />
              {errors.tenNguoiLaoDong && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.tenNguoiLaoDong.message}</p>}
            </div>
            

            <div>
              <input
                {...register('soDienThoai')}
                placeholder="Số điện thoại"
                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-blue-100 ${errors.soDienThoai ? 'border-red-300' : 'border-gray-100'}`}
              />
              {errors.soDienThoai && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.soDienThoai.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                {...register('namSinh', { valueAsNumber: true })}
                placeholder="Năm sinh"
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-blue-100"
              />
              <select
                {...register('gioiTinh')}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value={GioiTinh.NAM}>Nam</option>
                <option value={GioiTinh.NU}>Nữ</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày phỏng vấn</label>
            <input
              type="date"
              {...register('ngayPhongVan')}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái</label>
            <select
              {...register('trangThaiTuyen')}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              {Object.entries(TrangThaiTuyen).map(([key, value]) => (
                <option key={key} value={value}>{value.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ghi chú tuyển dụng</label>
          <textarea
            {...register('ghiChu')}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none italic"
            placeholder="Nhập phản hồi hoặc ghi chú..."
          />
        </div>
      </div>
    </GlassModal>
  );
};

export default UngTuyenModal;
