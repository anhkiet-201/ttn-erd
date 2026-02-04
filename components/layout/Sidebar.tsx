'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUI } from '@/components/providers/UIProvider';

const menuSections = [
  {
    title: 'Tuyển Dụng',
    items: [
      { 
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', 
        label: 'Tin Tuyển Dụng', 
        path: '/tin-tuyen-dung' 
      },
      { 
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', 
        label: 'Hồ Sơ Ứng Tuyển', 
        path: '/ung-tuyen' 
      },
    ]
  },
  {
    title: 'Dữ Liệu',
    items: [
      { 
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', 
        label: 'Người Lao Động', 
        path: '/nguoi-lao-dong' 
      },
      { 
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1', 
        label: 'Danh Sách Công Ty', 
        path: '/cong-ty' 
      },
    ]
  },
  {
    title: 'Vận Hành',
    items: [
      { 
        icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', 
        label: 'Khu Vực Làm Việc', 
        path: '/khu-vuc' 
      },
      { 
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', 
        label: 'Quản Lý Hệ Thống', 
        path: '/quan-ly' 
      },
    ]
  },
  {
    title: 'Hệ Thống',
    items: [
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
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useUI();

  return (
    <>
      {/* Overlay cho mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        fixed left-0 top-16 bottom-0 z-40
        bg-white/70 backdrop-blur-xl border-r border-white/40
        transition-all duration-500 ease-in-out
        ${isSidebarOpen ? 'w-72 shadow-[20px_0_50px_rgba(30,41,59,0.05)]' : 'w-20 md:w-20 lg:w-72'}
        overflow-y-auto custom-scrollbar
        md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col py-6 px-4 space-y-8">
          {menuSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="space-y-3">
              <h3 className={`
                px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]
                transition-opacity duration-300
                ${!isSidebarOpen ? 'lg:opacity-100 opacity-0 md:opacity-0 pointer-events-none' : 'opacity-100'}
              `}>
                {section.title}
              </h3>
              
              <div className="space-y-1">
                {section.items.map((item, idx) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={idx} 
                      href={item.path}
                      onClick={closeSidebar}
                      className={`
                        group relative flex items-center h-12 px-4 rounded-2xl transition-all duration-300
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'text-slate-500 hover:bg-white hover:shadow-md hover:text-blue-600 active:scale-95'
                        }
                      `}
                    >
                      <div className={`
                        flex-shrink-0 w-6 h-6 flex items-center justify-center
                        transition-transform duration-300 group-hover:scale-110
                      `}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                        </svg>
                      </div>
                      
                      <span className={`
                        ml-4 text-sm font-bold truncate transition-all duration-300
                        ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'lg:opacity-100 opacity-0 -translate-x-4 lg:translate-x-0 md:opacity-0'}
                      `}>
                        {item.label}
                      </span>

                      {/* Tooltip for collapsed state */}
                      {!isSidebarOpen && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all pointer-events-none z-50 whitespace-nowrap hidden md:block lg:hidden">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
