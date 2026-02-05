 'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { subDays, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { 
    DateRange, 
    fetchStatsData, 
    flattenAppEvents,
    filterEventsByDate, 
    getOverviewStats, 
    getJobStatusStats, 
    getGenderStats, 
    filterWorkersAndCompaniesByDate,
    getTopCompanies,
    getGrowthStats,
    getStatusTrendStats
} from '@/utils/statsData';
import { DateRangeFilter } from '@/components/stats/DateRangeFilter';
import { StatsOverviewCards } from '@/components/stats/StatsOverviewCards';
import { JobStatusPieChart } from '@/components/stats/charts/JobStatusPieChart';
import { GenderDonutChart } from '@/components/stats/charts/GenderDonutChart';
import { TopCompaniesBarChart } from '@/components/stats/charts/TopCompaniesBarChart';
import { GrowthLineChart } from '@/components/stats/charts/GrowthLineChart';
import { StatusTrendChart } from '@/components/stats/charts/StatusTrendChart';
import GlassLayout from '@/components/glass/GlassLayout';
import GlassPageHeader from '@/components/glass/GlassPageHeader';
import { UngTuyen, NguoiLaoDong, CongTy } from '@/types';

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
      ungTuyenList: UngTuyen[];
      nguoiLaoDongList: NguoiLaoDong[];
      congTyList: CongTy[];
  }>({ ungTuyenList: [], nguoiLaoDongList: [], congTyList: [] });

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfMonth(new Date()),
    endDate: endOfDay(new Date()),
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const fetchedData = await fetchStatsData();
        setData(fetchedData);
      } catch (error) {
        console.error('Failed to load stats data', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const { ungTuyenList, nguoiLaoDongList, congTyList } = data;

    const events = flattenAppEvents(ungTuyenList);
    const filteredEvents = filterEventsByDate(events, dateRange);
    
    const overview = getOverviewStats(filteredEvents, congTyList);
    const jobStatusData = getJobStatusStats(filteredEvents);
    const genderData = getGenderStats(filteredEvents, nguoiLaoDongList);
    const topCompaniesData = getTopCompanies(filteredEvents, congTyList);
    const growthData = getGrowthStats(filteredEvents, nguoiLaoDongList, dateRange);
    const statusTrendData = getStatusTrendStats(filteredEvents, dateRange);

    return {
      overview,
      jobStatusData,
      genderData,
      topCompaniesData,
      growthData,
      statusTrendData
    };
  }, [data, dateRange]);

  return (
    <GlassLayout>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-10">
         <GlassPageHeader 
            title="BÁO CÁO THỐNG KÊ"
            subtitle="Tổng hợp số liệu thời gian thực"
         />
         <div className="mb-2 lg:mb-10">
            <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
             <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
             <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Đang nạp dữ liệu thống kê...</p>
        </div>
      ) : (
        <div className="fade-in space-y-8 pb-20">
            <StatsOverviewCards stats={stats.overview} />

            <TopCompaniesBarChart data={stats.topCompaniesData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatusTrendChart data={stats.statusTrendData} />
                <GrowthLineChart data={stats.growthData} />
                <JobStatusPieChart data={stats.jobStatusData} />
                <GenderDonutChart data={stats.genderData} />
            </div>
        </div>
      )}
    </GlassLayout>
  );
}
