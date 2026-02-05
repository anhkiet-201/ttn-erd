'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CompanyStat } from '@/utils/statsData';
import GlassCard from '@/components/glass/GlassCard';

interface TopCompaniesBarChartProps {
  data: CompanyStat[];
}

export const TopCompaniesBarChart: React.FC<TopCompaniesBarChartProps> = ({ data }) => {
  return (
    <GlassCard className="h-[450px] flex flex-col">
       <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
        <h3 className="text-gray-800 text-lg font-black uppercase tracking-tight">Top Công Ty Được Ứng Tuyển</h3>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} horizontal={true} />
            <XAxis 
                dataKey="name" 
                interval={0} 
                angle={0} 
                textAnchor="middle"
                stroke="#9ca3af" 
                fontSize={10} 
                fontWeight={600}
                tickLine={false} 
                axisLine={false} 
                height={30}
                dy={10}
            />
            <YAxis 
                type="number" 
                stroke="#4b5563" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#1f2937', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
            <Bar dataKey="dangNhanViec" name="Đang nhận" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} barSize={30} />
            <Bar dataKey="choPhongVan" name="Chờ PV" stackId="a" fill="#3b82f6" barSize={30} />
            <Bar dataKey="tuChoi" name="Từ chối" stackId="a" fill="#f43f5e" barSize={30} />
            <Bar dataKey="daNghiViec" name="Đã nghỉ" stackId="a" fill="#94a3b8" barSize={30} />
            <Bar dataKey="khac" name="Khác" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
