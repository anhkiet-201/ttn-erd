'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { CongTy, QuanLy } from '@/types';
import CongTyModal from '@/components/modals/CongTyModal';
import Sidebar from '@/components/layout/Sidebar';
import { useUI } from '@/components/providers/UIProvider';

const repository = new CongTyRepository();
const quanLyRepository = new QuanLyRepository();

export default function CongTyPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [data, setData] = useState<CongTy[]>([]);
  const [quanLys, setQuanLys] = useState<QuanLy[]>([]); // State for live managers
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CongTy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubCongTy = repository.subscribeAll((items) => {
      setData(items);
      setLoading(false);
    });

    const unsubQuanLy = quanLyRepository.subscribeAll((items) => {
      setQuanLys(items);
    });

    return () => {
      unsubCongTy();
      unsubQuanLy();
    };
  }, []);

  const handleEdit = (item: CongTy) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa công ty này?')) {
      await repository.delete(id);
    }
  };

  const filteredData = data.map(congTy => {
    // Deep join: Map managers inside company to live managers data
    let updatedCongTy = { ...congTy };
    if (Array.isArray(updatedCongTy.quanLy)) {
      updatedCongTy.quanLy = updatedCongTy.quanLy.map(q => {
        const liveManager = quanLys.find(m => m.id === q.id);
        return liveManager || q;
      });
    }
    return updatedCongTy;
  }).filter(item => 
    item.tenCongTy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.khuVuc?.tenKhuVuc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    // Search by manager
    (Array.isArray(item.quanLy) && item.quanLy.some(q => 
      q.tenQuanLy.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.soDienThoai.includes(searchQuery)
    ))
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header phong cách Google Keep */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-2 md:gap-4">
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
              placeholder="Tìm kiếm công ty..."
              className="block w-full h-10 md:h-11 bg-gray-100 border-none rounded-lg pl-10 md:pl-11 pr-4 focus:bg-white focus:ring-0 focus:shadow-md transition-all text-sm text-gray-700 truncate"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 ml-auto flex-shrink-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 font-bold">
            {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-4 md:p-8">
          <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800">Quản Lý Công Ty</h2>
            <button 
              onClick={handleAdd}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-semibold">Thêm Công Ty</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">Tên Công Ty</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Khu Vực / Địa Chỉ</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Quản Lý</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Không tìm thấy công ty nào</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 align-top">
                        <div className="text-sm font-semibold text-gray-900">{item.tenCongTy}</div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex w-fit px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase tracking-wider">
                            {item.khuVuc?.tenKhuVuc || 'N/A'}
                          </span>
                          {(item.diaChi || item.khuVuc?.diaChi) && (
                            <span className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                              {item.diaChi || item.khuVuc?.diaChi}
                            </span>
                          )}
                          {(item.mapUrl || item.khuVuc?.mapUrl) && (
                            <a 
                              href={item.mapUrl || item.khuVuc?.mapUrl || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              Xem bản đồ
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {Array.isArray(item.quanLy) && item.quanLy.length > 0 ? (
                          <div className="space-y-1.5">
                            {item.quanLy.map((ql, idx) => (
                              <div key={idx} className="flex flex-col">
                                <span className="text-xs font-bold text-gray-700">{ql.tenQuanLy}</span>
                                <span className="text-[11px] text-blue-600 font-medium">{ql.soDienThoai}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa có quản lý</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 max-w-4xl mx-auto">
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
                Đang tải dữ liệu...
              </div>
            ) : filteredData.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
                Không tìm thấy công ty nào
              </div>
            ) : (
              filteredData.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 mb-1 break-words">{item.tenCongTy}</h3>
                      <div className="flex flex-wrap gap-2 items-center mt-1">
                        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {item.khuVuc?.tenKhuVuc || 'N/A'}
                        </span>
                        {Array.isArray(item.quanLy) && item.quanLy.length > 0 && (
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {item.quanLy.length} quản lý
                          </span>
                        )}
                      </div>

                      {(item.diaChi || item.khuVuc?.diaChi) && (
                        <div className="mt-2 text-[11px] text-gray-500 flex items-start gap-1.5">
                          <svg className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="break-words">{item.diaChi || item.khuVuc?.diaChi}</span>
                        </div>
                      )}
                      
                      {/* Mobile Manager List */}
                      {Array.isArray(item.quanLy) && item.quanLy.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          {item.quanLy.map((ql, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-700">{ql.tenQuanLy}</span>
                                <span className="text-[10px] text-blue-600 font-medium">{ql.soDienThoai}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors min-h-[44px]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors min-h-[44px]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01" />
                      </svg>
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <CongTyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedItem}
      />
    </div>
  );
}
