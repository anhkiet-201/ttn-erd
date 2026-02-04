'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { 
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', 
    label: 'Tin Tuyển Dụng', 
    path: '/tin-tuyen-dung' 
  },
  { 
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', 
    label: 'Khu Vực', 
    path: '/khu-vuc' 
  },
  { 
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', 
    label: 'Ứng tuyển', 
    path: '/ung-tuyen' 
  },
  { 
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', 
    label: 'Người lao động', 
    path: '/nguoi-lao-dong' 
  },
  { 
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1', 
    label: 'Công Ty', 
    path: '/cong-ty' 
  },
  { 
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', 
    label: 'Quản Lý Khu Vực', 
    path: '/quan-ly' 
  },
  { 
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', 
    label: 'Lưu Trữ', 
    path: '#' 
  },
  { 
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01', 
    label: 'Thùng Rác', 
    path: '#' 
  },
];

import { useUI } from '@/components/providers/UIProvider';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useUI();

  return (
    <>
      {/* Overlay cho mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        w-72 fixed left-0 top-16 bottom-0 overflow-y-auto z-40 bg-white
        transition-all duration-300 md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:w-20 lg:w-72 md:pr-0 py-2
      `}>
        <div className="flex flex-col gap-0.5">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={idx} 
                href={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-5 pl-6 py-3 cursor-pointer rounded-r-full transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#feefc3] text-[#202124] font-bold shadow-sm' 
                    : 'hover:bg-[#f1f3f4] text-[#5f6368] font-medium'
                }`}
              >
                <div className="flex-shrink-0">
                  <svg className={`w-6 h-6 transition-colors ${isActive ? 'text-[#202124]' : 'text-[#5f6368]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                  </svg>
                </div>
                <span className={`text-[14px] truncate hidden lg:block`}>{item.label}</span>
                <span className={`text-[14px] truncate ${isSidebarOpen ? 'block' : 'hidden'} md:hidden`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
