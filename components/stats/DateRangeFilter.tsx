import React from 'react';
import { DateRange } from '@/utils/statsData';
import { format, startOfDay, endOfDay } from 'date-fns';
import GlassCard from '../glass/GlassCard';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onChange,
}) => {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.valueAsDate;
    if (newStart) {
        const normalizedStart = startOfDay(newStart);
        if (normalizedStart > dateRange.endDate) {
             onChange({ startDate: normalizedStart, endDate: normalizedStart }); 
        } else {
             onChange({ ...dateRange, startDate: normalizedStart });
        }
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const newEnd = e.target.valueAsDate;
     if (newEnd) {
         const normalizedEnd = endOfDay(newEnd);
         if (normalizedEnd < dateRange.startDate) {
             onChange({ startDate: normalizedEnd, endDate: normalizedEnd });
         } else {
             onChange({ ...dateRange, endDate: normalizedEnd });
         }
     }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 backdrop-blur-xl border border-white/60 p-2 rounded-2xl shadow-sm">
      <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-blue-100">
        <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Thống kê từ</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="bg-transparent border-none text-gray-700 font-bold text-sm outline-none focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
          style={{ colorScheme: 'light' }}
          value={format(dateRange.startDate, 'yyyy-MM-dd')}
          onChange={handleStartChange}
        />
        <span className="text-gray-400 font-light px-2">—</span>
        <input
          type="date"
          className="bg-transparent border-none text-gray-700 font-bold text-sm outline-none focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
          style={{ colorScheme: 'light' }}
          value={format(dateRange.endDate, 'yyyy-MM-dd')}
          onChange={handleEndChange}
        />
      </div>
    </div>
  );
};
