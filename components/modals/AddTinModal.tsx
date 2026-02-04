'use client';

import React, { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TinTuyenDung, TrangThai, CongTy, QuanLy, HinhThucTuyen } from '@/types';
import { TinTuyenDungRepository } from '@/repositories/tinTuyenDung.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { v4 as uuidv4 } from 'uuid';
import TextareaAutosize from 'react-textarea-autosize';

// Tag type as defined in types/index.ts
interface TagObj {
  id: string;
  noiDung: string;
  isDeactivated?: boolean;
}

// Schema Validation
const tinTuyenDungSchema = z.object({
  moTa: z.string().min(1, 'Vui lòng nhập nội dung'),
  congTyId: z.string().min(1, 'Vui lòng chọn công ty'),
  quanLyIds: z.array(z.string()).optional().default([]),
  diaChi: z.string().optional(),
  mapUrl: z.string().optional(),
  trangThai: z.nativeEnum(TrangThai),
  hinhThucTuyen: z.nativeEnum(HinhThucTuyen).default(HinhThucTuyen.THOI_VU),
  yeuCau: z.array(z.any()).optional(),
  phucLoi: z.array(z.any()).optional(),
  phuCap: z.array(z.any()).optional(),
  ghiChu: z.string().optional(),
});

type TinTuyenDungFormValues = z.infer<typeof tinTuyenDungSchema>;

const tinRepo = new TinTuyenDungRepository();
const congTyRepo = new CongTyRepository();
const quanLyRepo = new QuanLyRepository();

// ... (TagInput component remains unchanged) ...
// Note: To avoid re-sending the entire file, I will rely on the `replace_file_content` finding the correct context, 
// but since I need to update the imports and schema at the top, and the form fields in the middle, and this file is small enough, 
// I will just supply the updated imports and schema, and then use a separate call or a larger range if needed. 
// However, the tool allows replacing chunks. Let's do imports and schema first.

// Wait, I should implement the UI part as well. 
// I'll assume valid ranges for replacement. 
// Actually, let's just use `replace_file_content` to inject the new field specific logic and UI components.

// This is tricky with `replace_file_content` if I want to update multiple disparate parts (imports + schema + UI). 
// `multi_replace_file_content` is better for this.




// --- Tag Input Component ---
interface TagInputProps {
  label: string;
  tags: TagObj[];
  onChange: (tags: TagObj[]) => void;
  colorClass: string;
  placeholder?: string;
  suggestions?: string[];
}

const TagInput = ({ label, tags, onChange, colorClass, placeholder, suggestions = [] }: TagInputProps) => {
  const [inputVal, setInputVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions
    .filter(s => s.toLowerCase().includes(inputVal.toLowerCase()) && !tags.some(t => t.noiDung === s))
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.some(t => t.noiDung === trimmed)) {
      onChange([...tags, { id: uuidv4(), noiDung: trimmed, isDeactivated: false }]);
      setInputVal('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (id: string) => {
    onChange(tags.filter(tag => tag.id !== id));
  };

  const styles = {
    blue: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', placeholder: 'placeholder-slate-400', tagBg: 'bg-slate-100', tagText: 'text-slate-700' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', placeholder: 'placeholder-emerald-400', tagBg: 'bg-emerald-100', tagText: 'text-emerald-800' },
    orange: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', placeholder: 'placeholder-rose-400', tagBg: 'bg-rose-100', tagText: 'text-rose-800' },
  }[colorClass] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', placeholder: 'placeholder-gray-400', tagBg: 'bg-gray-200', tagText: 'text-gray-800' };

  return (
    <div ref={containerRef} className={`relative w-full px-3 py-3 rounded-xl ${styles.bg} border ${styles.border} transition-all`}>
      <span className={`absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider opacity-70 ${styles.text}`}>
        {label}
      </span>
      <div className="flex flex-wrap gap-2 mt-4 relative">
        {tags.map((tag) => (
          <span key={tag.id} className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${styles.tagBg} ${styles.tagText} ${tag.isDeactivated ? 'line-through opacity-50' : ''}`}>
            {tag.noiDung}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="ml-1.5 hover:text-red-500 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : '...'}
            className={`w-full bg-transparent outline-none text-sm ${styles.text} ${styles.placeholder}`}
          />
          
          {showSuggestions && inputVal && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
              {filteredSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addTag(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors truncate"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AddTinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: TinTuyenDung | null;
}

export default function AddTinModal({ isOpen, onClose, onSuccess, initialData }: AddTinModalProps) {
  const [congTys, setCongTys] = useState<CongTy[]>([]);
  const [quanLys, setQuanLys] = useState<QuanLy[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [suggestedTags, setSuggestedTags] = useState({
    yeuCau: [] as string[],
    phucLoi: [] as string[],
    phuCap: [] as string[]
  });

  const [showCongTy, setShowCongTy] = useState(false);
  const [showDiaChi, setShowDiaChi] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showGhiChu, setShowGhiChu] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isValid } } = useForm<TinTuyenDungFormValues>({
    resolver: zodResolver(tinTuyenDungSchema),
    mode: 'onChange', // Validate on every change for reactive button state
    defaultValues: {
      trangThai: TrangThai.DANG_TUYEN,
      yeuCau: [],
      phucLoi: [],
      phuCap: [],
      ghiChu: '',
      congTyId: '',
      quanLyIds: [],
    }
  });

  const yeuCauTags = watch('yeuCau') || [];
  const phucLoiTags = watch('phucLoi') || [];
  const phuCapTags = watch('phuCap') || [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const unsubCongTys = congTyRepo.subscribeAll(setCongTys);
      // Không cần subscribeAll QuanLy nữa, vì sẽ lấy từ CongTy
      
      tinRepo.getAll().then(tins => {
        const uniqueYeuCau = new Set<string>();
        const uniquePhucLoi = new Set<string>();
        const uniquePhuCap = new Set<string>();

        tins.forEach(tin => {
          if (Array.isArray(tin.yeuCau)) tin.yeuCau.forEach(t => uniqueYeuCau.add(t.noiDung));
          if (Array.isArray(tin.phucLoi)) tin.phucLoi.forEach(t => uniquePhucLoi.add(t.noiDung));
          if (Array.isArray(tin.phuCap)) tin.phuCap.forEach(t => uniquePhuCap.add(t.noiDung));
        });

        setSuggestedTags({
          yeuCau: Array.from(uniqueYeuCau),
          phucLoi: Array.from(uniquePhucLoi),
          phuCap: Array.from(uniquePhuCap)
        });
      });

      return () => {
        unsubCongTys();
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          moTa: initialData.moTa,
          congTyId: initialData.congTy?.id || '',
          quanLyIds: Array.isArray(initialData.quanLy) 
            ? initialData.quanLy.map(q => q.id) 
            : (initialData.quanLy ? [(initialData.quanLy as any).id] : []),
          diaChi: initialData.diaChi || '',
          mapUrl: initialData.mapUrl || '',
          trangThai: initialData.trangThai,
          hinhThucTuyen: initialData.hinhThucTuyen || HinhThucTuyen.THOI_VU,
          yeuCau: Array.isArray(initialData.yeuCau) ? initialData.yeuCau : [],
          phucLoi: Array.isArray(initialData.phucLoi) ? initialData.phucLoi : [],
          phuCap: Array.isArray(initialData.phuCap) ? initialData.phuCap : [],
          ghiChu: initialData.ghiChu || '',
        });

        if (initialData.congTy) setShowCongTy(true);
        if (initialData.diaChi || initialData.mapUrl) setShowDiaChi(true);
        if (initialData.yeuCau?.length || initialData.phucLoi?.length || initialData.phuCap?.length) setShowTags(true);
        if (initialData.ghiChu) setShowGhiChu(true);
      } else {
        reset({
          trangThai: TrangThai.DANG_TUYEN,
          hinhThucTuyen: HinhThucTuyen.THOI_VU,
          moTa: '',
          congTyId: '',
          quanLyIds: [],
          diaChi: '',
          mapUrl: '',
          yeuCau: [],
          phucLoi: [],
          phuCap: [],
          ghiChu: '',
        });
        setShowCongTy(false);
        setShowDiaChi(false);
        setShowTags(false);
        setShowGhiChu(false);
      }
    }
  }, [isOpen, initialData, reset]);

  const onInvalid = (data: any) => {
    console.error('Lỗi xác thực:', data);
    const firstError = Object.values(data)[0] as any;
    if (firstError) {
      alert(`Vui lòng kiểm tra lại: ${firstError.message}`);
    }
  };

  const handleSave = async (values: TinTuyenDungFormValues) => {
    if (!values.moTa.trim()) {
      onClose();
      return;
    }

    console.log('Bắt đầu lưu Tin tuyển dụng:', values);
    setIsSaving(true);
    try {
      const selectedCongTy = congTys.find(c => c.id === values.congTyId);
      
      const tinData = {
        moTa: values.moTa,
        congTy: selectedCongTy as any, 
        quanLy: [], // Luôn rỗng vì giờ dùng quản lý của công ty
        mapUrl: values.mapUrl || null,
        diaChi: values.diaChi || null,
        trangThai: values.trangThai,
        hinhThucTuyen: values.hinhThucTuyen,
        yeuCau: values.yeuCau || [],
        phucLoi: values.phucLoi || [],
        phuCap: values.phuCap || [],
        ghiChu: values.ghiChu || null,
      }; 

      if (initialData?.id) {
        await tinRepo.update(initialData.id, tinData);
      } else {
        await tinRepo.create(tinData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Lỗi chi tiết khi lưu:', error);
      alert('Lỗi lưu dữ liệu: ' + (error as any)?.message || 'Vui lòng kiểm tra lại');
    } finally {
      setIsSaving(false);
    }
  };

  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div 
        ref={modalRef}
        className="w-full max-w-[600px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        style={{
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.302), 0 2px 6px 2px rgba(60,64,67,0.149)'
        }}
      >
        <div className="overflow-y-auto px-4 py-3 md:px-6 md:py-4 flex-1">
          <TextareaAutosize
            {...register('moTa')}
            placeholder="Nội dung tuyển dụng..."
            className="w-full resize-none border-none outline-none text-[14px] text-gray-800 placeholder-gray-500 font-medium min-h-[60px] bg-transparent"
            minRows={3}
            autoFocus={!initialData} 
          />
          {errors.moTa && <p className="text-[11px] text-red-500 font-bold mb-2 ml-1">{errors.moTa.message}</p>}

          <div className="space-y-4 mt-4">
            {(showCongTy || watch('congTyId')) && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                  <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500/80">Công ty tuyển dụng</span>
                </div>
                <select
                  {...register('congTyId')}
                  className={`w-full px-3 py-2.5 bg-gray-50/50 rounded-xl text-sm border transition-all focus:ring-1 focus:ring-slate-200 text-gray-700 outline-none ${errors.congTyId ? 'border-red-300 bg-red-50/10' : 'border-gray-100'}`}
                >
                  <option value="">-- Chọn công ty --</option>
                  {congTys.map(c => (
                    <option key={c.id} value={c.id}>{c.tenCongTy}</option>
                  ))}
                </select>
                {errors.congTyId && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{errors.congTyId.message}</p>}
              </div>
            )}


            {(showDiaChi || watch('diaChi') || watch('mapUrl')) && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  {...register('diaChi')}
                  placeholder="Địa chỉ làm việc..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-gray-200 text-gray-700 outline-none"
                />
                <input
                  {...register('mapUrl')}
                  placeholder="Link Google Maps..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-gray-200 text-gray-700 outline-none"
                />
              </div>
            )}

            {(showTags || yeuCauTags.length > 0 || phucLoiTags.length > 0 || phuCapTags.length > 0) && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200 pt-2 border-t border-gray-100">
                <TagInput 
                  label="Yêu Cầu" 
                  tags={yeuCauTags} 
                  onChange={(tags) => setValue('yeuCau', tags)} 
                  colorClass="blue"
                  placeholder="Nam, 18-30 tuổi..."
                  suggestions={suggestedTags.yeuCau}
                />
                <TagInput 
                  label="Phúc Lợi" 
                  tags={phucLoiTags} 
                  onChange={(tags) => setValue('phucLoi', tags)} 
                  colorClass="green"
                  placeholder="Lương tháng 13..."
                  suggestions={suggestedTags.phucLoi}
                />
                <TagInput 
                  label="Phụ Cấp" 
                  tags={phuCapTags} 
                  onChange={(tags) => setValue('phuCap', tags)} 
                  colorClass="orange"
                  placeholder="Xăng xe, Cơm trưa..."
                  suggestions={suggestedTags.phuCap}
                />
              </div>
            )}

            {/* Ghi chú nội bộ */}
            {(showGhiChu || watch('ghiChu')) && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="relative w-full px-3 py-3 rounded-xl bg-orange-50/20 border border-orange-100/50 transition-all focus-within:border-orange-200 focus-within:bg-orange-50/40">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-700/60 font-sans">
                      Ghi chú nội bộ
                    </span>
                  </div>
                  <TextareaAutosize
                    {...register('ghiChu')}
                    placeholder="Nhập ghi chú quan trọng cho tin này..."
                    className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-orange-300 resize-none font-medium leading-relaxed"
                    minRows={1}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-2 py-2 md:px-4 md:py-2 border-t border-transparent bg-white">
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              onClick={() => setShowCongTy(!showCongTy)}
              className={`p-2 rounded-full transition-colors ${showCongTy || watch('congTyId') ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Thêm Công Ty"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </button>


            <button 
              type="button" 
              onClick={() => setShowDiaChi(!showDiaChi)}
              className={`p-2 rounded-full transition-colors ${showDiaChi ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Địa điểm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button 
              type="button" 
              onClick={() => setShowTags(!showTags)}
              className={`p-2 rounded-full transition-colors ${showTags ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Thêm Tags"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </button>

            <button 
              type="button" 
              onClick={() => setShowGhiChu(!showGhiChu)}
              className={`p-2 rounded-full transition-colors ${showGhiChu ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Thêm Ghi Chú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            <select 
              {...register('trangThai')}
              className="text-xs font-bold text-gray-600 bg-transparent border-none outline-none focus:ring-0 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded"
            >
              <option value={TrangThai.DANG_TUYEN}>Đang tuyển</option>
              <option value={TrangThai.DA_NGUNG}>Đã ngừng</option>
            </select>

            <div className="h-4 w-px bg-gray-300 mx-1"></div>

            <select 
              {...register('hinhThucTuyen')}
              className="text-xs font-bold text-blue-600 bg-blue-50/50 border-none outline-none focus:ring-0 cursor-pointer hover:bg-blue-100 py-1 px-2 rounded"
            >
              <option value={HinhThucTuyen.CHINH_THUC}>Chính thức</option>
              <option value={HinhThucTuyen.THOI_VU}>Thời vụ</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              type="button"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit(handleSave, onInvalid)}
              disabled={isSaving || !isValid}
              className={`px-5 py-2 text-sm font-medium rounded-[4px] transition-all border shadow-sm ${
                isSaving || !isValid 
                  ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100 active:scale-95'
              }`}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu & Đóng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
