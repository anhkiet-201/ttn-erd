'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { QuanLy } from '@/types';
import QuanLyModal from '@/components/modals/QuanLyModal';
import Sidebar from '@/components/layout/Sidebar';
import { useUI } from '@/components/providers/UIProvider';

const repository = new QuanLyRepository();

export default function QuanLyPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [data, setData] = useState<QuanLy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QuanLy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = repository.subscribeAll((items) => {
      setData(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (item: QuanLy) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      await repository.delete(id);
    }
  };

  const filteredData = data.filter(item => 
    item.tenQuanLy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.soDienThoai.includes(searchQuery)
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
              placeholder="Tìm kiếm nhân viên..."
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
            <h2 className="text-2xl font-bold text-gray-800">Quản Lý</h2>
            <button 
              onClick={handleAdd}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-semibold">Thêm Nhân Viên</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Nhân Viên</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Số Điện Thoại</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">Không tìm thấy nhân viên nào</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{item.tenQuanLy}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.soDienThoai}
                      </td>
                      <td className="px-6 py-4 text-right">
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
                Không tìm thấy nhân viên nào
              </div>
            ) : (
              filteredData.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 mb-1 break-words">{item.tenQuanLy}</h3>
                      <p className="text-sm text-gray-600">{item.soDienThoai}</p>
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

      <QuanLyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedItem}
      />
    </div>
  );
}
