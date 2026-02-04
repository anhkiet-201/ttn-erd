'use client';

import React, { useState } from 'react';
import { TinTuyenDung, TrangThai, UngTuyen, HinhThucTuyen } from '@/types';
import UngTuyenModal from '../modals/UngTuyenModal';
import { UngTuyenRepository } from '@/repositories/ungTuyen.repository';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { copyToClipboard } from '@/lib/utils';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

interface GlassJobCardProps {
  data: TinTuyenDung;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleTag?: (id: string, category: 'yeuCau' | 'phucLoi' | 'phuCap', tagId: string) => void;
}

const ungTuyenRepo = new UngTuyenRepository();

export default function GlassJobCard({ data, onClick, onDelete, onToggleTag }: GlassJobCardProps) {
  const [isUngTuyenModalOpen, setIsUngTuyenModalOpen] = useState(false);

  if (!data) return null;

  const isExpired = data.trangThai === TrangThai.DA_NGUNG;

  const safeDate = (date: any) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const updatedAt = safeDate(data.updatedAt);

  const handleSaveUngTuyen = async (ungTuyenData: Omit<UngTuyen, 'id'>) => {
    try {
      await ungTuyenRepo.create(ungTuyenData);
      toast.success('Gán ứng viên thành công!');
      setIsUngTuyenModalOpen(false);
    } catch (error) {
      console.error('Lỗi khi ứng tuyển:', error);
      toast.error('Có lỗi xảy ra khi lưu ứng tuyển');
    }
  };

  const renderTag = (item: any, category: 'yeuCau' | 'phucLoi' | 'phuCap', baseClasses: string) => (
    <div 
      key={item.id} 
      className={`
        inline-flex items-center gap-2 px-2.5 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
        ${item.isDeactivated ? 'line-through opacity-30 bg-gray-50 text-gray-400 border-gray-100' : baseClasses}
      `}
    >
      <span className="flex-1">{item.noiDung}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleTag?.(data.id, category, item.id);
        }}
        className={`
          flex-shrink-0 p-0.5 rounded transition-colors
          ${item.isDeactivated ? 'text-gray-300' : 'text-gray-400 hover:text-red-500'}
        `}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {item.isDeactivated ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
          )}
        </svg>
      </button>
    </div>
  );

  return (
    <>
      <GlassCard 
        noPadding
        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 ${isExpired ? 'grayscale opacity-60' : ''} border-gray-100/80`}
      >
        <div className="p-5">
            {/* Top Row: Company & Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-base shadow-sm group-hover:bg-gray-100 group-hover:text-gray-600 transition-all duration-300">
                        {data.congTy?.tenCongTy?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{data.congTy?.tenCongTy || 'ẨN DANH'}</div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                        data.hinhThucTuyen === HinhThucTuyen.CHINH_THUC 
                            ? 'bg-gray-50 text-gray-600 border-gray-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {data.hinhThucTuyen === HinhThucTuyen.CHINH_THUC ? 'CHÍNH THỨC' : 'THỜI VỤ'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-1">
                    <button 
                        onClick={async (e) => {
                            e.stopPropagation();
                            const success = await copyToClipboard(data.moTa || '');
                            if (success) toast.success('Đã sao chép nội dung');
                        }}
                        className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                </div>
            </div>

            {/* Description */}
            <h3 className="text-sm font-medium text-gray-600 mb-6 leading-relaxed whitespace-pre-wrap break-words min-h-[3rem]">
                {data.moTa || 'Không có mô tả chi tiết cho tin này.'}
            </h3>

            {/* Location & Managers */}
            <div className="space-y-2 mb-6">
                {(() => {
                    const congTy = data.congTy;
                    const address = congTy?.diaChi || congTy?.khuVuc?.diaChi;
                    if (!address) return null;
                    return (
                        <div className="flex items-start gap-2 text-gray-400">
                             <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             <span className="text-[11px] font-medium line-clamp-1">{address}</span>
                        </div>
                    );
                })()}

                {/* Managers List */}
                <div className="flex flex-wrap gap-1.5">
                    {(data.congTy?.quanLy || []).map((ql, idx) => (
                        <div 
                            key={ql.id || idx} 
                            onClick={async (e) => {
                                e.stopPropagation();
                                const success = await copyToClipboard(ql.soDienThoai);
                                if (success) toast.success(`Đã sao chép SĐT: ${ql.tenQuanLy}`);
                            }}
                            className="bg-gray-50/50 px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1.5 hover:bg-gray-100 hover:border-gray-200 transition-all cursor-pointer group/mgr"
                        >
                            <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">{ql.tenQuanLy}</span>
                            <span className="text-[10px] font-medium text-gray-400 font-mono leading-none">{ql.soDienThoai}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tags Section */}
            <div className="flex flex-wrap gap-1 mb-6">
                {(data.yeuCau || []).map((item) => renderTag(item, 'yeuCau', 'bg-gray-50 border-gray-100 text-gray-500'))}
                {(data.phucLoi || []).map((item) => renderTag(item, 'phucLoi', 'bg-gray-50 border-gray-100 text-gray-500 uppercase'))}
                {(data.phuCap || []).map((item) => renderTag(item, 'phuCap', 'bg-gray-50 border-gray-100 text-gray-500'))}
            </div>

            {/* Internal Notes */}
            {(data.ghiChu || data.ghiChuPV) && (
                <div className="space-y-2 mb-6">
                    {data.ghiChu && (
                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 relative group/note">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nội bộ</div>
                            <p className="text-xs text-gray-500 leading-relaxed italic">{data.ghiChu}</p>
                        </div>
                    )}
                    {data.ghiChuPV && (
                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 relative group/note-pv">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phỏng vấn</div>
                            <p className="text-xs text-gray-500 leading-relaxed italic">{data.ghiChuPV}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex gap-1">
                    <GlassButton 
                        variant="ghost" 
                        className="!p-2 !rounded-lg !bg-gray-50 hover:!bg-blue-50 hover:!text-blue-600 transition-colors"
                        onClick={() => setIsUngTuyenModalOpen(true)}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>}
                    />
                    <GlassButton 
                        variant="ghost" 
                        className="!p-2 !rounded-lg !bg-gray-50 hover:!bg-gray-100 transition-colors"
                        onClick={() => onClick?.(data.id)}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                    />
                    <GlassButton 
                        variant="ghost" 
                        className="!p-2 !rounded-lg !bg-gray-50 hover:!bg-red-50 hover:!text-red-600 transition-colors"
                        onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa tin này?')) onDelete?.(data.id);
                        }}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                    />
                </div>
                
                {updatedAt && (
                    <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1">
                        {format(updatedAt, 'dd/MM', { locale: vi })}
                    </div>
                )}
            </div>
        </div>
      </GlassCard>

      <UngTuyenModal
        isOpen={isUngTuyenModalOpen}
        onClose={() => setIsUngTuyenModalOpen(false)}
        onSave={handleSaveUngTuyen}
        fixedTinTuyenDung={data}
      />
    </>
  );
}
