'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { NguoiLaoDongBiCam, GioiTinh, CongTy } from '@/types';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { NguoiLaoDongBiCamRepository } from '@/repositories/nguoiLaoDongBiCam.repository';
import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

const congTyRepo = new CongTyRepository();
const nldRepo = new NguoiLaoDongRepository();
const biCamRepo = new NguoiLaoDongBiCamRepository();

const nguoiLaoDongBiCamSchema = z.object({
  tenNguoiLaoDong: z.string().min(1, 'Vui lòng nhập tên người lao động'),
  soDienThoai: z.string().nullable().optional().refine(val => !val || val.length >= 10, {
    message: "SĐT phải có ít nhất 10 số"
  }),
  namSinh: z.number().min(1900, 'Năm sinh không hợp lệ').max(new Date().getFullYear()),
  gioiTinh: z.nativeEnum(GioiTinh),
  cccd: z.string().nullable(),
  nguyenNhanCam: z.array(z.object({
    congTyId: z.string().min(1, 'Chọn công ty'),
    nguyenNhan: z.string().min(1, 'Nhập lý do'),
    ngayNghiViec: z.string().optional(),
  })),
});

type NguoiLaoDongBiCamFormValues = z.infer<typeof nguoiLaoDongBiCamSchema>;

interface NguoiLaoDongBiCamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<NguoiLaoDongBiCam, 'id'>) => Promise<void>;
  initialData?: NguoiLaoDongBiCam | null;
}

const NguoiLaoDongBiCamModal: React.FC<NguoiLaoDongBiCamModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [congTies, setCongTies] = useState<CongTy[]>([]);
  const [isCheckingCCCD, setIsCheckingCCCD] = useState(false);
  const [foundBannedId, setFoundBannedId] = useState<string | null>(null);
  
  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting, isValid } } = useForm<NguoiLaoDongBiCamFormValues>({
    resolver: zodResolver(nguoiLaoDongBiCamSchema),
    mode: 'onChange',
    defaultValues: {
      tenNguoiLaoDong: '',
      soDienThoai: '',
      namSinh: new Date().getFullYear() - 20,
      gioiTinh: GioiTinh.NAM,
      cccd: '',
      nguyenNhanCam: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "nguyenNhanCam",
  });

  const cccdValue = watch('cccd');

  // Debounced CCCD check
  useEffect(() => {
    if (!initialData && cccdValue && cccdValue.length > 9) { // Only check on create mode and when enough chars
      const timeoutId = setTimeout(async () => {
        setIsCheckingCCCD(true);
        setFoundBannedId(null);
        try {
          // 1. Check if already banned FIRST
          const bannedFound = await biCamRepo.findByCCCD(cccdValue);
          
          if (bannedFound) {
             setFoundBannedId(bannedFound.id);
             setValue('tenNguoiLaoDong', bannedFound.tenNguoiLaoDong);
             setValue('soDienThoai', bannedFound.soDienThoai || '');
             setValue('namSinh', bannedFound.namSinh);
             setValue('gioiTinh', bannedFound.gioiTinh);
             
             // Fill existing violations
             if (bannedFound.nguyenNhanCam) {
                 const mappedReasons = bannedFound.nguyenNhanCam.map(r => ({
                     congTyId: r.congty.id,
                     nguyenNhan: r.nguyenNhan,
                     ngayNghiViec: r.ngayNghiViec ? new Date(r.ngayNghiViec).toISOString().split('T')[0] : ''
                 }));
                 replace(mappedReasons);
             }
             return;
          }

          // 2. If not banned, check regular worker list
          const found = await nldRepo.findByCCCD(cccdValue);
          if (found) {
            setValue('tenNguoiLaoDong', found.tenNguoiLaoDong);
            setValue('soDienThoai', found.soDienThoai || '');
            setValue('namSinh', found.namSinh);
            setValue('gioiTinh', found.gioiTinh);
            replace([]); // Clear violations if just a worker found
          }
        } catch (error) {
           console.error('Error checking CCCD', error);
        } finally {
            setIsCheckingCCCD(false);
        }
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [cccdValue, initialData, setValue, replace]);

  useEffect(() => {
    congTyRepo.getAll().then(setCongTies);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFoundBannedId(null);
      if (initialData) {
        reset({
          tenNguoiLaoDong: initialData.tenNguoiLaoDong,
          soDienThoai: initialData.soDienThoai,
          namSinh: initialData.namSinh,
          gioiTinh: initialData.gioiTinh,
          cccd: initialData.cccd || '',
          nguyenNhanCam: initialData.nguyenNhanCam?.map(n => ({
            congTyId: n.congty.id,
            nguyenNhan: n.nguyenNhan,
            ngayNghiViec: n.ngayNghiViec ? new Date(n.ngayNghiViec).toISOString().split('T')[0] : ''
          })) || [],
        });
      } else {
        reset({
          tenNguoiLaoDong: '',
          soDienThoai: '',
          namSinh: new Date().getFullYear() - 20,
          gioiTinh: GioiTinh.NAM,
          cccd: '',
          nguyenNhanCam: [],
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: NguoiLaoDongBiCamFormValues) => {
    const processedNguyenNhan = values.nguyenNhanCam.map(item => {
      const ct = congTies.find(c => c.id === item.congTyId);
      if (!ct) throw new Error('Công ty không tồn tại');
      return {
        congty: ct,
        nguyenNhan: item.nguyenNhan,
        ngayNghiViec: item.ngayNghiViec ? new Date(item.ngayNghiViec).getTime() : undefined
      };
    });

    await onSave({
      ...values,
      soDienThoai: values.soDienThoai || null,
      cccd: values.cccd || null,
      nguyenNhanCam: processedNguyenNhan,
    });
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
        disabled={isSubmitting || !isValid}
        className="flex-1"
      >
        {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm mới'}
      </GlassButton>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Sửa Hồ Sơ Bị Cấm' : 'Thêm Người Lao Động Vào DS Cấm'}
      subtitle={initialData ? `Mã hồ sơ: ${initialData.id.slice(0, 8)}` : 'Hồ sơ người lao động vi phạm'}
      footer={footer}
      maxWidth="md:max-w-2xl"
    >
      <div className="space-y-6">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b pb-2">Thông tin cá nhân</h3>
        
        {/* CCCD Moved to Top */}
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số CCCD (Nhập để tự động điền)</label>
                 {isCheckingCCCD && <span className="text-[9px] font-bold text-blue-500 animate-pulse">Đang kiểm tra...</span>}
            </div>
            <input
                {...register('cccd')}
                className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border border-gray-100 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="Nhập CCCD để tìm kiếm..."
                autoFocus={!initialData} 
            />
             {foundBannedId && (
                 <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2 animate-fadeIn">
                     <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     <div>
                         <div className="text-[10px] font-black text-red-500 uppercase">Cảnh báo: Hồ sơ đã tồn tại</div>
                         <div className="text-[10px] font-bold text-red-400">Người này đã có trong danh sách cấm. Hệ thống đã tự động tải các vi phạm cũ và sẽ gộp thông tin mới vào hồ sơ này.</div>
                     </div>
                 </div>
             )}
         </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và Tên</label>
            <input
                {...register('tenNguoiLaoDong')}
                className={`w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.tenNguoiLaoDong ? 'border-red-300' : 'border-gray-100'}`}
                placeholder="Nhập tên..."
            />
             {errors.tenNguoiLaoDong && <p className="mt-1 text-[10px] text-red-500 font-black ml-1 uppercase">{errors.tenNguoiLaoDong.message}</p>}
            </div>

            <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số Điện Thoại</label>
            <input
                {...register('soDienThoai')}
                className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border border-gray-100 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="09xx..."
            />
            </div>
            
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Năm sinh</label>
                <input
                type="number"
                {...register('namSinh', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border border-gray-100 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giới tính</label>
                <select
                {...register('gioiTinh')}
                className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border border-gray-100 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                <option value={GioiTinh.NAM}>Nam</option>
                <option value={GioiTinh.NU}>Nữ</option>
                </select>
            </div>
        </div>

        <div className="pt-4">
             <h3 className="text-sm font-black text-red-600 uppercase tracking-widest border-b border-red-100 pb-2 mb-4 flex justify-between items-center">
                 <span>Thông tin vi phạm</span>
                 <button 
                  type="button" 
                  onClick={() => append({ congTyId: '', nguyenNhan: '', ngayNghiViec: '' })}
                  className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                 >
                     + Thêm lý do
                 </button>
             </h3>

             <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="bg-red-50/50 p-4 rounded-xl border border-red-100 space-y-3 relative group">
                        <button 
                           type="button" 
                           onClick={() => remove(index)}
                           className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Công ty báo cáo</label>
                            <select
                                {...register(`nguyenNhanCam.${index}.congTyId` as const)}
                                className="w-full px-4 py-2.5 bg-white rounded-xl text-xs font-bold border border-red-100 focus:ring-2 focus:ring-red-200 outline-none"
                            >
                                <option value="">-- Chọn công ty --</option>
                                {congTies.map(c => (
                                    <option key={c.id} value={c.id}>{c.tenCongTy}</option>
                                ))}
                            </select>
                            {errors.nguyenNhanCam?.[index]?.congTyId && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.nguyenNhanCam[index]?.nguyenNhan?.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lý do cụ thể</label>
                             <textarea
                                {...register(`nguyenNhanCam.${index}.nguyenNhan` as const)}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white rounded-xl text-xs font-medium border border-red-100 focus:ring-2 focus:ring-red-200 outline-none"
                                placeholder="Nhập lý do vi phạm..."
                             />
                             {errors.nguyenNhanCam?.[index]?.nguyenNhan && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.nguyenNhanCam[index]?.nguyenNhan?.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày nghỉ việc / Vi phạm</label>
                            <input
                                type="date"
                                {...register(`nguyenNhanCam.${index}.ngayNghiViec` as const)}
                                className="w-full px-4 py-2.5 bg-white rounded-xl text-xs font-medium border border-red-100 focus:ring-2 focus:ring-red-200 outline-none"
                            />
                        </div>
                    </div>
                ))}
                {fields.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <span className="text-xs text-gray-400 font-medium">Chưa có lý do vi phạm nào</span>
                    </div>
                )}
             </div>
        </div>
      </div>
    </GlassModal>
  );
};

export default NguoiLaoDongBiCamModal;
