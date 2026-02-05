'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GrowthStat } from '@/utils/statsData';
import GlassCard from '@/components/glass/GlassCard';

interface GrowthLineChartProps {
  data: GrowthStat[];
}

export const GrowthLineChart: React.FC<GrowthLineChartProps> = ({ data }) => {
  return (
    <GlassCard className="h-[450px] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
        <h3 className="text-gray-800 text-lg font-black uppercase tracking-tight">Biểu Đồ Tăng Trưởng</h3>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
            />
            <YAxis 
                stroke="#9ca3af" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dx={-10}
            />
            <Tooltip 
               contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
               itemStyle={{ color: '#1f2937', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Line type="monotone" dataKey="ungTuyen" name="Lượt Ứng Tuyển" stroke="#8884d8" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="nguoiLaoDong" name="Người Lao Động Mới" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
