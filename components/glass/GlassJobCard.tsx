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

  const renderTag = (item: any, category: 'yeuCau' | 'phucLoi' | 'phuCap', baseClasses: string, dotColor: string) => (
    <div 
      key={item.id} 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
        ${item.isDeactivated ? 'line-through opacity-40 bg-gray-50 text-gray-400 border-gray-100' : baseClasses}
      `}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${item.isDeactivated ? 'bg-gray-300' : dotColor}`} />
      <span className="flex-1">{item.noiDung}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleTag?.(data.id, category, item.id);
        }}
        className={`
          flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors
          ${item.isDeactivated ? 'text-gray-400' : 'text-gray-500 hover:text-red-500'}
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
        className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 ${isExpired ? 'grayscale opacity-70' : ''}`}
      >
        {/* Header Decor */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${data.hinhThucTuyen === HinhThucTuyen.CHINH_THUC ? 'bg-gradient-to-r from-blue-600 via-blue-400 to-transparent' : 'bg-gradient-to-r from-orange-500 via-orange-300 to-transparent'}`} />

        <div className="p-5">
            {/* Top Row: Company & Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center text-gray-400 font-black text-lg shadow-inner group-hover:from-blue-600 group-hover:to-blue-400 group-hover:text-white transition-all duration-500">
                        {data.congTy?.tenCongTy?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{data.congTy?.tenCongTy || 'ẨN DANH'}</div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${
                        data.hinhThucTuyen === HinhThucTuyen.CHINH_THUC 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-orange-50 text-orange-700 border-orange-100'
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
                        className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                </div>
            </div>

            {/* Description */}
            <h3 className="text-sm font-bold text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap break-words min-h-[4rem]">
                {data.moTa || 'Không có mô tả chi tiết cho tin này.'}
            </h3>

            {/* Location & Managers */}
            <div className="space-y-3 mb-6">
                {(() => {
                    const congTy = data.congTy;
                    const address = congTy?.diaChi || congTy?.khuVuc?.diaChi;
                    if (!address) return null;
                    return (
                        <div className="flex items-start gap-3 text-gray-500">
                             <div className="w-8 h-8 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-500 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             </div>
                             <span className="text-[11px] font-semibold italic line-clamp-2 pt-1">{address}</span>
                        </div>
                    );
                })()}

                {/* Managers List */}
                <div className="flex flex-wrap gap-2">
                    {(data.congTy?.quanLy || []).map((ql, idx) => (
                        <div 
                            key={ql.id || idx} 
                            onClick={async (e) => {
                                e.stopPropagation();
                                const success = await copyToClipboard(ql.soDienThoai);
                                if (success) toast.success(`Đã sao chép SĐT: ${ql.tenQuanLy}`);
                            }}
                            className="bg-gray-50 p-2 pr-3 rounded-2xl border border-gray-100 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group/mgr"
                        >
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm border border-blue-50 group-hover/mgr:scale-110 transition-transform">
                                {ql.tenQuanLy.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-700 uppercase leading-none mb-0.5">{ql.tenQuanLy}</span>
                                <span className="text-[10px] font-bold text-blue-600 font-mono leading-none">{ql.soDienThoai}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tags Section */}
            <div className="flex flex-wrap gap-1.5 mb-6">
                {(data.yeuCau || []).map((item) => renderTag(item, 'yeuCau', 'bg-slate-50 border-slate-100 text-slate-500', 'bg-slate-400'))}
                {(data.phucLoi || []).map((item) => renderTag(item, 'phucLoi', 'bg-emerald-50 border-emerald-100 text-emerald-600', 'bg-emerald-500'))}
                {(data.phuCap || []).map((item) => renderTag(item, 'phuCap', 'bg-rose-50 border-rose-100 text-rose-600', 'bg-rose-500'))}
            </div>

            {/* Internal Notes */}
            {(data.ghiChu || data.ghiChuPV) && (
                <div className="space-y-3 mb-6">
                    {data.ghiChu && (
                        <div className="bg-amber-50/30 p-4 rounded-3xl border border-amber-100/30 relative overflow-hidden group/note">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                            <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Ghi chú nội bộ</div>
                            <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{data.ghiChu}</p>
                        </div>
                    )}
                    {data.ghiChuPV && (
                        <div className="bg-blue-50/30 p-4 rounded-3xl border border-blue-100/30 relative overflow-hidden group/note-pv">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Ghi chú phỏng vấn</div>
                            <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{data.ghiChuPV}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex gap-1.5">
                    <GlassButton 
                        variant="primary" 
                        className="!p-2.5 !rounded-xl"
                        onClick={() => setIsUngTuyenModalOpen(true)}
                        icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>}
                    />
                    <GlassButton 
                        variant="secondary" 
                        className="!p-2.5 !rounded-xl"
                        onClick={() => onClick?.(data.id)}
                        icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                    />
                    <GlassButton 
                        variant="danger" 
                        className="!p-2.5 !rounded-xl"
                        onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa tin này?')) onDelete?.(data.id);
                        }}
                        icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                    />
                </div>
                
                {updatedAt && (
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
