'use client';

import React from 'react';
import { TinTuyenDung, TrangThai } from '@/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface KeepCardProps {
  data: TinTuyenDung;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleTag?: (id: string, category: 'yeuCau' | 'phucLoi' | 'phuCap', tagId: string) => void;
}

export function KeepCard({ data, onClick, onDelete, onToggleTag }: KeepCardProps) {
  if (!data) return null;

  const isExpired = data.trangThai === TrangThai.DA_NGUNG;
  const cardColor = isExpired ? 'bg-gray-100 opacity-90' : 'bg-white';

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

  const renderTag = (item: any, category: 'yeuCau' | 'phucLoi' | 'phuCap', baseClasses: string) => (
    <span 
      key={item.id} 
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 border rounded-md text-[10px] font-medium whitespace-nowrap transition-all
        ${item.isDeactivated ? 'line-through opacity-50 bg-gray-100 text-gray-400 border-gray-200' : baseClasses}
      `}
    >
      <span className="flex-1">{item.noiDung}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleTag?.(data.id, category, item.id);
        }}
        className={`
          flex-shrink-0 p-0.5 rounded-full hover:bg-black/5 transition-colors
          ${item.isDeactivated ? 'text-gray-400' : 'text-gray-500 hover:text-red-500'}
        `}
        title={item.isDeactivated ? "Kích hoạt lại" : "Tạm dừng"}
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {item.isDeactivated ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          )}
        </svg>
      </button>
    </span>
  );

  return (
    <div 
      className={`
        group block relative w-full ${cardColor} border border-gray-200 rounded-lg p-4 mb-4
        hover:shadow-md transition-shadow duration-200 cursor-default
        ring-inset hover:ring-1 hover:ring-gray-300 min-h-[100px]
      `}
    >
      {/* Copy Content Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(data.moTa || '');
        }}
        className="absolute top-2 right-2 p-2.5 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 z-10 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
        title="Sao chép nội dung"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {data.congTy?.tenCongTy || 'Công ty ẩn danh'}
          </p>
        </div>
        
        <h3 className="text-[14px] font-medium text-gray-800 mb-2 leading-relaxed whitespace-pre-wrap break-words">
          {data.moTa || 'Không có mô tả'}
        </h3>

        {/* Manager Info */}
        {/* Manager Info - Compact Chips */}
        {Array.isArray(data.quanLy) && data.quanLy.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.quanLy.map((ql, idx) => (
              <div 
                key={ql.id || idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(ql.soDienThoai);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 border border-blue-100/50 rounded-md hover:bg-blue-50 transition-colors cursor-pointer group/ql active:scale-95 duration-75"
                title={`Sao chép SĐT: ${ql.soDienThoai}`}
              >
                <div className="w-4 h-4 rounded-full bg-white border border-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0 shadow-sm">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] font-bold text-gray-700 leading-none">{ql.tenQuanLy}</span>
                  <span className="text-[11px] font-bold text-blue-600/80 group-hover/ql:text-blue-700 leading-none">{ql.soDienThoai}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {(data.diaChi || data.mapUrl) && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 group/map">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover/map:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            
            {data.mapUrl ? (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(data.mapUrl || '');
                }}
                className="truncate hover:text-blue-600 hover:underline transition-colors decoration-blue-500/30 underline-offset-2 flex-1 text-left"
                title="Sao chép link bản đồ"
              >
                {data.diaChi || 'Sao chép vị trí'}
              </button>
            ) : (
              <span className="truncate flex-1">{data.diaChi}</span>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {Array.isArray(data.yeuCau) && data.yeuCau.map((item) => 
            renderTag(item, 'yeuCau', 'bg-slate-50 border-slate-200 text-slate-600')
          )}
          {Array.isArray(data.phucLoi) && data.phucLoi.map((item) => 
            renderTag(item, 'phucLoi', 'bg-emerald-50 border-emerald-100 text-emerald-700')
          )}
          {Array.isArray(data.phuCap) && data.phuCap.map((item) => 
            renderTag(item, 'phuCap', 'bg-rose-50 border-rose-100 text-rose-700')
          )}
        </div>

        {/* Ghi chú nội bộ - Premium sticky note style */}
        {data.ghiChu && (
          <div className="mt-3 relative group/note">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-r-lg rounded-l-sm border-l-2 border-amber-400/70" />
            <div className="relative p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60">Ghi chú</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(data.ghiChu || '');
                  }}
                  className="p-2 hover:bg-amber-100 rounded-md text-amber-600/60 hover:text-amber-700 transition-all duration-200"
                  title="Sao chép"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
              <p className="text-[12.5px] text-amber-900/80 leading-relaxed font-medium whitespace-pre-wrap pl-0.5">
                {data.ghiChu}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-t border-transparent group-hover:border-gray-50">
        <div className="flex items-center gap-0.5 -ml-1.5">
          {/* Edit Button */}
          <button 
            onClick={() => onClick?.(data.id)}
            className="p-2 hover:bg-black/5 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
            title="Chỉnh sửa tin"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Delete Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Bạn có chắc chắn muốn xóa tin này không?')) {
                onDelete?.(data.id);
              }
            }}
            className="p-2 hover:bg-black/5 rounded-full text-gray-400 hover:text-red-600 transition-colors"
            title="Xóa tin"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        {updatedAt && (
          <span className="text-[10px] text-gray-400 font-medium">
            {format(updatedAt, 'dd MMM', { locale: vi })}
          </span>
        )}
      </div>
    </div>
  );
}
