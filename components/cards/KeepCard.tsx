'use client';

import React from 'react';
import { TinTuyenDung, TrangThai } from '@/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface KeepCardProps {
  data: TinTuyenDung;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function KeepCard({ data, onClick, onDelete }: KeepCardProps) {
  if (!data) return null;

  const isExpired = data.trangThai === TrangThai.DA_NGUNG;
  const cardColor = isExpired ? 'bg-gray-100' : 'bg-white';

  // Defensive parsing of dates
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

  return (
    <div 
      className={`
        group block relative w-full ${cardColor} border border-gray-200 rounded-lg p-4 mb-4
        hover:shadow-md transition-shadow duration-200 cursor-default
        ring-inset hover:ring-1 hover:ring-gray-300 min-h-[100px]
      `}
    >
      {/* Pin Icon */}
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

        <div className="flex flex-wrap gap-1.5 mb-2">
          {/* Yêu Cầu - Slate (Neutral) */}
          {Array.isArray(data.yeuCau) && data.yeuCau.map((item) => (
            <span key={item.id} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-600 font-medium whitespace-nowrap">
              {item.noiDung}
            </span>
          ))}

          {/* Phúc Lợi - Emerald (Green) */}
          {Array.isArray(data.phucLoi) && data.phucLoi.map((item) => (
            <span key={item.id} className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] text-emerald-700 font-medium whitespace-nowrap">
              {item.noiDung}
            </span>
          ))}

          {/* Phụ Cấp - Rose (Warm) */}
          {Array.isArray(data.phuCap) && data.phuCap.map((item) => (
            <span key={item.id} className="px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-md text-[10px] text-rose-700 font-medium whitespace-nowrap">
              {item.noiDung}
            </span>
          ))}

          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap ${isExpired ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-blue-100 text-blue-600 shadow-sm'}`}>
            {data.trangThai === TrangThai.DANG_TUYEN ? 'Đang tuyển' : 'Đã ngừng'}
          </span>
        </div>
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
