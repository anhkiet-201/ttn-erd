import React from 'react';
import { StatsOverview } from '@/utils/statsData';
import GlassCard from '../glass/GlassCard';

interface StatsOverviewCardsProps {
  stats: StatsOverview;
}

export const StatsOverviewCards: React.FC<StatsOverviewCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <GlassCard className="!p-6 group hover:shadow-blue-500/10 transition-all duration-300 border-blue-50">
        <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             </div>
             <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                ACTIVE
             </span>
        </div>
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tổng Ứng Viên</h3>
        <p className="text-3xl font-black text-gray-800 group-hover:text-blue-600 transition-colors">{stats.totalNguoiLaoDong}</p>
      </GlassCard>
      
      <GlassCard className="!p-6 group hover:shadow-purple-500/10 transition-all duration-300 border-purple-50">
        <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
        </div>
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Lượt Ứng Tuyển</h3>
        <p className="text-3xl font-black text-gray-800 group-hover:text-purple-600 transition-colors">{stats.totalUngTuyen}</p>
      </GlassCard>

      <GlassCard className="!p-6 group hover:shadow-orange-500/10 transition-all duration-300 border-orange-50">
        <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
             </div>
        </div>
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Công Ty</h3>
        <p className="text-3xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">{stats.totalCongTy}</p>
      </GlassCard>

      <GlassCard className="!p-6 group hover:shadow-emerald-500/10 transition-all duration-300 border-emerald-50">
        <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
        </div>
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tỷ Lệ Nhận Việc</h3>
        <p className="text-3xl font-black text-gray-800 group-hover:text-emerald-600 transition-colors">{stats.recruitmentRate}%</p>
      </GlassCard>
    </div>
  );
};
