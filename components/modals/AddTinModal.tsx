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

  trangThai: z.nativeEnum(TrangThai),
  hinhThucTuyen: z.nativeEnum(HinhThucTuyen).default(HinhThucTuyen.THOI_VU),
  yeuCau: z.array(z.any()).optional(),
  phucLoi: z.array(z.any()).optional(),
  phuCap: z.array(z.any()).optional(),
  ghiChu: z.string().optional(),
  ghiChuPV: z.string().optional(),
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

import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

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
  const [showTags, setShowTags] = useState(false);
  const [showGhiChu, setShowGhiChu] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isValid } } = useForm<TinTuyenDungFormValues>({
    resolver: zodResolver(tinTuyenDungSchema),
    mode: 'onChange',
    defaultValues: {
      trangThai: TrangThai.DANG_TUYEN,
      yeuCau: [],
      phucLoi: [],
      phuCap: [],
      ghiChu: '',
      ghiChuPV: '',
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
          trangThai: initialData.trangThai,
          hinhThucTuyen: initialData.hinhThucTuyen || HinhThucTuyen.THOI_VU,
          yeuCau: Array.isArray(initialData.yeuCau) ? initialData.yeuCau : [],
          phucLoi: Array.isArray(initialData.phucLoi) ? initialData.phucLoi : [],
          phuCap: Array.isArray(initialData.phuCap) ? initialData.phuCap : [],
          ghiChu: initialData.ghiChu || '',
          ghiChuPV: initialData.ghiChuPV || '',
        });

        if (initialData.congTy) setShowCongTy(true);
        if (initialData.yeuCau?.length || initialData.phucLoi?.length || initialData.phuCap?.length) setShowTags(true);
        if (initialData.ghiChu || initialData.ghiChuPV) setShowGhiChu(true);
      } else {
        reset({
          trangThai: TrangThai.DANG_TUYEN,
          hinhThucTuyen: HinhThucTuyen.THOI_VU,
          moTa: '',
          congTyId: '',
          quanLyIds: [],
          yeuCau: [],
          phucLoi: [],
          phuCap: [],
          ghiChu: '',
          ghiChuPV: '',
        });
        setShowCongTy(false);
        setShowTags(false);
        setShowGhiChu(false);
      }
    }
  }, [isOpen, initialData, reset]);

  const onInvalid = (data: any) => {
    console.error('Lỗi xác thực:', data);
  };

  const handleSave = async (values: TinTuyenDungFormValues) => {
    if (!values.moTa.trim()) return;

    setIsSaving(true);
    try {
      const selectedCongTy = congTys.find(c => c.id === values.congTyId);
      const tinData = {
        moTa: values.moTa,
        congTy: selectedCongTy as any, 
        quanLy: [],
        trangThai: values.trangThai,
        hinhThucTuyen: values.hinhThucTuyen,
        yeuCau: values.yeuCau || [],
        phucLoi: values.phucLoi || [],
        phuCap: values.phuCap || [],
        ghiChu: values.ghiChu || null,
        ghiChuPV: values.ghiChuPV || null,
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
    } finally {
      setIsSaving(false);
    }
  };

  const footer = (
    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-0">
      <div className="flex items-center justify-between w-full md:w-auto gap-2">
        <div className="flex items-center gap-1.5">
          <button 
            type="button" 
            onClick={() => setShowCongTy(!showCongTy)}
            className={`p-2.5 rounded-2xl transition-all active:scale-90 ${showCongTy || watch('congTyId') ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
            title="Đơn vị"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </button>

          <button 
            type="button" 
            onClick={() => setShowTags(!showTags)}
            className={`p-2.5 rounded-2xl transition-all active:scale-90 ${showTags ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
            title="Thông tin nhãn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>

          <button 
            type="button" 
            onClick={() => setShowGhiChu(!showGhiChu)}
            className={`p-2.5 rounded-2xl transition-all active:scale-90 ${showGhiChu ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
            title="Ghi chú thêm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        <div className="h-5 w-px bg-gray-100 mx-1 hidden md:block"></div>

        <select 
          {...register('hinhThucTuyen')}
          className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border-none outline-none focus:ring-0 cursor-pointer px-3 py-2 rounded-xl"
        >
          <option value={HinhThucTuyen.CHINH_THUC}>Chính thức</option>
          <option value={HinhThucTuyen.THOI_VU}>Thời vụ</option>
        </select>
      </div>

      <div className="flex gap-3 w-full md:w-auto">
        <GlassButton
          onClick={handleSubmit(handleSave, onInvalid)}
          disabled={isSaving || !isValid}
          className="w-full md:w-auto flex-1 md:flex-none justify-center"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu & Đăng'}
        </GlassButton>
      </div>
    </div>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Sửa tin tuyển dụng' : 'Tạo tin mới'}
      subtitle={initialData ? `Mã tin: ${initialData.id.slice(0, 8)}` : 'Đăng bài tuyển dụng mới lên hệ thống'}
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nội dung tuyển dụng</label>
          <TextareaAutosize
            {...register('moTa')}
            placeholder="Mô tả công việc, mức lương, địa điểm..."
            className="w-full resize-none border-gray-100 bg-gray-50/50 rounded-2xl p-4 outline-none text-sm font-bold text-gray-800 placeholder-gray-400 min-h-[100px] focus:ring-2 focus:ring-blue-100 transition-all border"
            autoFocus={!initialData} 
          />
        </div>

        <div className="space-y-4">
          {(showCongTy || watch('congTyId')) && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đơn vị chủ quản</label>
              <select
                {...register('congTyId')}
                className={`w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-blue-100 outline-none ${errors.congTyId ? 'border-red-300' : 'border-gray-100'}`}
              >
                <option value="">-- Chọn công ty --</option>
                {congTys.map(c => (
                  <option key={c.id} value={c.id}>{c.tenCongTy}</option>
                ))}
              </select>
            </div>
          )}

          {(showTags || yeuCauTags.length > 0 || phucLoiTags.length > 0 || phuCapTags.length > 0) && (
            <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
               <TagInput 
                  label="Yêu Cầu Tuyển Dụng" 
                  tags={yeuCauTags} 
                  onChange={(tags) => setValue('yeuCau', tags)} 
                  colorClass="blue"
                  placeholder="Ví dụ: Nam, sức khỏe tốt..."
                  suggestions={suggestedTags.yeuCau}
                />
                <TagInput 
                  label="Chế Độ Phúc Lợi" 
                  tags={phucLoiTags} 
                  onChange={(tags) => setValue('phucLoi', tags)} 
                  colorClass="green"
                  placeholder="Ví dụ: Bao cơm trưa..."
                  suggestions={suggestedTags.phucLoi}
                />
                <TagInput 
                  label="Các Khoản Phụ Cấp" 
                  tags={phuCapTags} 
                  onChange={(tags) => setValue('phuCap', tags)} 
                  colorClass="orange"
                  placeholder="Ví dụ: Phụ cấp xăng xe..."
                  suggestions={suggestedTags.phuCap}
                />
            </div>
          )}

          {(showGhiChu || watch('ghiChu') || watch('ghiChuPV')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Ghi chú nội bộ</label>
                <TextareaAutosize
                  {...register('ghiChu')}
                  placeholder="Lưu ý cho admin..."
                  className="w-full bg-amber-50/20 border border-amber-100/50 rounded-2xl p-4 text-sm font-bold text-gray-700 outline-none placeholder-amber-200"
                  minRows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Ghi chú phỏng vấn</label>
                <TextareaAutosize
                  {...register('ghiChuPV')}
                  placeholder="Lưu ý cho ứng viên..."
                  className="w-full bg-blue-50/20 border border-blue-100/50 rounded-2xl p-4 text-sm font-bold text-gray-700 outline-none placeholder-blue-200"
                  minRows={2}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassModal>
  );
}
