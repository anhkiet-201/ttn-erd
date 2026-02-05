'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GenderStat } from '@/utils/statsData';
import GlassCard from '@/components/glass/GlassCard';

interface GenderDonutChartProps {
  data: GenderStat[];
}

export const GenderDonutChart: React.FC<GenderDonutChartProps> = ({ data }) => {
  return (
    <GlassCard className="h-[450px] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
        <h3 className="text-gray-800 text-lg font-black uppercase tracking-tight">Tỷ Lệ Giới Tính</h3>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
               itemStyle={{ color: '#1f2937', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
