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
  onToggleTag?: (id: string, tagId: string) => void;
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

  const renderTag = (item: any) => (
    <div 
      key={item.id} 
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 border rounded-lg text-[10px] font-black uppercase tracking-tight transition-all
        ${item.isDeactivated 
            ? 'line-through opacity-20 bg-gray-50 text-gray-400 border-gray-100' 
            : 'bg-blue-50 border-blue-100 text-blue-700'
        }
      `}
    >
      {!item.isDeactivated && <div className={`w-1 h-1 rounded-full bg-blue-500 shadow-sm shadow-current/30`} />}
      <span className="flex-1">{item.noiDung}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleTag?.(data.id, item.id);
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
        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 ${isExpired ? 'grayscale opacity-60' : ''} border-gray-100/80 !rounded-3xl`}
      >
        <div className="p-5">
            {/* Top Row: Company & Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-base shadow-sm group-hover:from-blue-600 group-hover:to-blue-500 group-hover:text-white group-hover:border-blue-400 transition-all duration-300">
                        {data.congTy?.tenCongTy?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{data.congTy?.tenCongTy || 'ẨN DANH'}</div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                        data.hinhThucTuyen === HinhThucTuyen.CHINH_THUC 
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-orange-50 text-orange-600 border-orange-100'
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
            <h3 className="text-[14px] text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap break-words min-h-[3rem]">
                {data.moTa || 'Không có mô tả chi tiết cho tin này.'}
            </h3>

            {/* Location & Managers */}
            <div className="space-y-2 mb-6">
                {(() => {
                    const congTy = data.congTy;
                    const address = congTy?.diaChi;
                    const mapUrl = congTy?.mapUrl;
                    
                    const displayText = address || mapUrl;
                    if (!displayText) return null;

                    const copyText = mapUrl || address;

                    return (
                        <div 
                            className="flex items-start gap-2 text-gray-500 cursor-pointer group/addr hover:text-blue-600 transition-colors"
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (copyText) {
                                    const success = await copyToClipboard(copyText);
                                    if (success) toast.success(mapUrl ? 'Đã sao chép liên kết bản đồ' : 'Đã sao chép địa chỉ');
                                }
                            }}
                            title={copyText || ''}
                        >
                             <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             <span className="text-[11px] font-bold italic line-clamp-1 border-b border-transparent group-hover/addr:border-blue-200">{displayText}</span>
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
                            className="bg-white px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1.5 hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group/mgr shadow-sm"
                        >
                            <span className="text-[10px] font-black text-gray-700 uppercase leading-none group-hover/mgr:text-blue-700">{ql.tenQuanLy}</span>
                            <span className="text-[10px] font-black text-blue-600 font-mono leading-none">{ql.soDienThoai}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tags Section */}
            <div className="flex flex-wrap gap-1.5 mb-6">
                {(data.tags || []).map((item) => renderTag(item))}
            </div>

            {/* Internal Notes */}
            {(data.ghiChu || data.ghiChuPV) && (
                <div className="space-y-3 mb-6">
                    {data.ghiChu && (
                        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-3.5 rounded-2xl border border-amber-100/50 relative group/note overflow-hidden shadow-sm shadow-amber-900/5">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400/60" />
                            <div className="flex justify-between items-center mb-1.5 ml-1.5">
                                <div className="text-[9px] font-black text-amber-700 uppercase tracking-[0.2em]">Ghi chú Nội bộ</div>
                                <button 
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const success = await copyToClipboard(data.ghiChu!);
                                        if (success) toast.success('Đã sao chép ghi chú nội bộ');
                                    }}
                                    className="opacity-0 group-hover/note:opacity-100 p-1.5 hover:bg-amber-100/50 rounded-xl transition-all text-amber-600 active:scale-90"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                            <p className="text-[13px] text-gray-700 font-bold leading-relaxed italic ml-1.5">{data.ghiChu}</p>
                        </div>
                    )}
                    {data.ghiChuPV && (
                        <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-3.5 rounded-2xl border border-blue-100/50 relative group/note-pv overflow-hidden shadow-sm shadow-blue-900/5">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400/60" />
                            <div className="flex justify-between items-center mb-1.5 ml-1.5">
                                <div className="text-[9px] font-black text-blue-700 uppercase tracking-[0.2em]">Ghi chú Phỏng vấn</div>
                                <button 
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const success = await copyToClipboard(data.ghiChuPV!);
                                        if (success) toast.success('Đã sao chép ghi chú phỏng vấn');
                                    }}
                                    className="opacity-0 group-hover/note-pv:opacity-100 p-1.5 hover:bg-blue-100/50 rounded-xl transition-all text-blue-600 active:scale-90"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                            <p className="text-[13px] text-gray-700 font-bold leading-relaxed italic ml-1.5">{data.ghiChuPV}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex gap-1.5">
                    <GlassButton 
                        variant="ghost" 
                        className="!p-2.5 !rounded-lg !bg-gray-50 hover:!bg-blue-600 hover:!text-white transition-all shadow-sm"
                        onClick={() => setIsUngTuyenModalOpen(true)}
                        icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>}
                    />
                    <GlassButton 
                        variant="ghost" 
                        className="!p-2.5 !rounded-lg !bg-gray-50 hover:!bg-gray-200 transition-all shadow-sm"
                        onClick={() => onClick?.(data.id)}
                        icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                    />
                    <GlassButton 
                        variant="ghost" 
                        className="!p-2.5 !rounded-lg !bg-gray-50 hover:!bg-red-600 hover:!text-white transition-all shadow-sm"
                        onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa tin này?')) onDelete?.(data.id);
                        }}
                        icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2" /></svg>}
                    />
                </div>
                
                {updatedAt && (
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
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
