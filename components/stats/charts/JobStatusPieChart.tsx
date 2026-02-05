'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { JobStatusStat } from '@/utils/statsData';
import GlassCard from '@/components/glass/GlassCard';

interface JobStatusPieChartProps {
  data: JobStatusStat[];
}

export const JobStatusPieChart: React.FC<JobStatusPieChartProps> = ({ data }) => {
  return (
    <GlassCard className="h-[450px] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
        <h3 className="text-gray-800 text-lg font-black uppercase tracking-tight">Trạng Thái Công Việc</h3>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
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
