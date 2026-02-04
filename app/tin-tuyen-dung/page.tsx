'use client';

import React, { useEffect, useState } from 'react';
import { MasonryGrid } from '@/components/layout/MasonryGrid';
import { KeepCard } from '@/components/cards/KeepCard';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { TinTuyenDungRepository } from '@/repositories/tinTuyenDung.repository';
import { TinTuyenDung } from '@/types';
import { AddTinModal } from '@/components/modals/AddTinModal';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUI } from '@/components/providers/UIProvider';

const repository = new TinTuyenDungRepository();

export default function TinTuyenDungPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [data, setData] = useState<TinTuyenDung[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTin, setSelectedTin] = useState<TinTuyenDung | null>(null);

  useEffect(() => {
    const unsubscribe = repository.subscribeAll((items) => {
      setData(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditTin = (tin: TinTuyenDung) => {
    setSelectedTin(tin);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedTin(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header phong cách Google Keep */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-2 md:gap-4">
        {/* ... (Header content unchanged) ... */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <span className="text-lg md:text-xl font-bold">E</span>
            </div>
            <span className="text-xl md:text-[22px] font-medium text-gray-700 tracking-tight hidden min-[400px]:block">ERD</span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-2 md:mx-4 min-w-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full h-10 md:h-11 bg-gray-100 border-none rounded-lg pl-10 md:pl-11 pr-4 focus:bg-white focus:ring-0 focus:shadow-md transition-all text-sm text-gray-700 truncate"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 ml-auto flex-shrink-0">
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors hidden md:block">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 font-bold">
            {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar />

        {/* Main Grid Content */}
        <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-4 md:p-8 max-w-full overflow-x-hidden">
          {/* Quick Add Bar (đặc đặc trưng Keep) */}
          <div className="mb-6 max-w-2xl">
            <div 
              onClick={() => {
                setSelectedTin(null);
                setIsAddModalOpen(true);
              }}
              className="w-full bg-white rounded-lg px-4 py-3.5 md:py-3 flex items-center justify-between cursor-text transition-all hover:shadow-md border border-gray-200 min-h-[52px]"
            >
              <span className="text-gray-500 text-sm md:text-base">Tạo tin tuyển dụng mới...</span>
              <div className="flex items-center gap-2">
                <button className="p-2.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Đang tìm tin...</p>
            </div>
          ) : data.length > 0 ? (
            <MasonryGrid>
              {data
                .filter(item => {
                  const search = searchQuery.toLowerCase();
                  return (item.moTa?.toLowerCase().includes(search) || 
                          item.congTy?.tenCongTy?.toLowerCase().includes(search));
                })
                .map((item) => (
                  <KeepCard 
                    key={item.id} 
                    data={item} 
                    onClick={() => handleEditTin(item)}
                    onDelete={async (id) => {
                      try {
                        await repository.delete(id);
                      } catch (error) {
                        console.error('Không thể xóa tin:', error);
                        alert('Xóa tin thất bại!');
                      }
                    }}
                  />
                ))}
            </MasonryGrid>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-400">Ghi chú tuyển dụng của bạn sẽ xuất hiện ở đây</h3>
            </div>
          )}
        </main>
      </div>

      <AddTinModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={() => {}} 
        initialData={selectedTin}
      />
    </div>
  );
}



