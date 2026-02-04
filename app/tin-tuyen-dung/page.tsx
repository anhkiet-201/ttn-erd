'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { MasonryGrid } from '@/components/layout/MasonryGrid';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { TinTuyenDungRepository } from '@/repositories/tinTuyenDung.repository';
import { QuanLyRepository } from '@/repositories/quanLy.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { KhuVucRepository } from '@/repositories/khuVuc.repository';
import { TinTuyenDung, QuanLy, CongTy, KhuVuc } from '@/types';
import AddTinModal from '@/components/modals/AddTinModal';
import { useUI } from '@/components/providers/UIProvider';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import { GlassFilterBar, GlassSelect } from '@/components/glass/GlassForm';
import GlassJobCard from '@/components/glass/GlassJobCard';

const tinRepository = new TinTuyenDungRepository();
const quanLyRepository = new QuanLyRepository();
const congTyRepository = new CongTyRepository();
const khuVucRepository = new KhuVucRepository();

export default function TinTuyenDungPage() {
  const { user } = useAuthContext();
  const { toggleSidebar } = useUI();
  const [tins, setTins] = useState<TinTuyenDung[]>([]);
  const [quanLys, setQuanLys] = useState<QuanLy[]>([]);
  const [congTys, setCongTys] = useState<CongTy[]>([]);
  const [khuVucs, setKhuVucs] = useState<KhuVuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTin, setSelectedTin] = useState<TinTuyenDung | undefined>();
  const [selectedKhuVuc, setSelectedKhuVuc] = useState<string>('all');

  useEffect(() => {
    const unsubTin = tinRepository.subscribeAll(setTins);
    const unsubQuanLy = quanLyRepository.subscribeAll(setQuanLys);
    const unsubCongTy = congTyRepository.subscribeAll(setCongTys);
    const unsubKhuVuc = khuVucRepository.subscribeAll(setKhuVucs);

    setLoading(false);

    return () => {
      unsubTin();
      unsubQuanLy();
      unsubCongTy();
      unsubKhuVuc();
    };
  }, []);

  const data = useMemo(() => {
    return tins.map(tin => ({
      ...tin,
      congTy: congTys.find(c => c.id === tin.congTy?.id) || tin.congTy
    }));
  }, [tins, congTys]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = item.moTa?.toLowerCase().includes(search) || 
                            item.congTy?.tenCongTy?.toLowerCase().includes(search);
      
      const matchesKhuVuc = selectedKhuVuc === 'all' || item.congTy?.khuVuc?.id === selectedKhuVuc;

      return matchesSearch && matchesKhuVuc;
    });
  }, [data, searchQuery, selectedKhuVuc]);

  const handleEditTin = (tin: TinTuyenDung) => {
    setSelectedTin(tin);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setSelectedTin(undefined);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedTin(undefined);
  };

  const handleDeleteTin = async (id: string) => {
    try {
      await tinRepository.delete(id);
    } catch (error) {
      console.error('Không thể xóa tin:', error);
    }
  };

  const handleToggleTag = async (id: string, category: 'yeuCau' | 'phucLoi' | 'phuCap', tagId: string) => {
    try {
      const tin = tins.find(t => t.id === id);
      if (!tin) return;
      
      const categoryTags = tin[category] as any[];
      const newTags = categoryTags.map(tag => 
        tag.id === tagId 
        ? { ...tag, isDeactivated: !tag.isDeactivated } 
        : tag
      );

      await tinRepository.update(id, { [category]: newTags });
    } catch (error) {
      console.error('Lỗi cập nhật tag:', error);
    }
  };

  return (
    <GlassLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Tìm kiếm mô tả, công ty..."
    >
      <GlassPageHeader 
        title="Ghi Chú Tuyển Dụng"
        subtitle={`Hiện có ${filteredData.length} tin đăng đang hiển thị`}
        action={{
          label: "Tạo Tin Mới",
          onClick: handleOpenAddModal
        }}
      />

      <GlassFilterBar className="mb-8">
        <GlassSelect 
          value={selectedKhuVuc}
          onChange={(e) => setSelectedKhuVuc(e.target.value)}
          className="w-64"
        >
          <option value="all">TẤT CẢ KHU VỰC</option>
          {khuVucs.map(kv => (
            <option key={kv.id} value={kv.id}>{kv.tenKhuVuc.toUpperCase()}</option>
          ))}
        </GlassSelect>
      </GlassFilterBar>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Đang nạp dữ liệu tuyển dụng...</p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="pb-20">
            <MasonryGrid>
              {filteredData.map((item) => (
                <div key={item.id} className="mb-6">
                  <GlassJobCard 
                    data={item} 
                    onClick={() => handleEditTin(item)}
                    onDelete={handleDeleteTin}
                    onToggleTag={handleToggleTag}
                  />
                </div>
              ))}
            </MasonryGrid>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50/10 rounded-[3rem] border-2 border-dashed border-gray-100 mb-20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/20 transition-colors duration-700" />
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm relative z-10 border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-12 h-12 text-gray-300 group-hover:text-blue-400 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            <h3 className="text-xl font-black text-gray-800 relative z-10 uppercase tracking-tight">Khoe không có tin nào</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto relative z-10 font-bold uppercase tracking-wider italic">Hãy nhấn nút "Tạo Tin Mới" để bắt đầu nạp hồ sơ tuyển dụng vào hệ thống.</p>
        </div>
      )}

      <AddTinModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={() => {}} 
        initialData={selectedTin}
      />
    </GlassLayout>
  );
}
