import { UngTuyenRepository } from '@/repositories/ungTuyen.repository';
import { NguoiLaoDongRepository } from '@/repositories/nguoiLaoDong.repository';
import { CongTyRepository } from '@/repositories/congTy.repository';
import { UngTuyen, NguoiLaoDong, CongTy, TrangThaiTuyen } from '@/types';
import { startOfDay, endOfDay, isWithinInterval, subDays, format, parseISO } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StatsOverview {
  totalUngTuyen: number;
  totalNguoiLaoDong: number;
  totalCongTy: number;
  recruitmentRate: number; // percentage
}

export interface JobStatusStat {
  name: string;
  value: number;
  color: string;
}

export interface GenderStat {
  name: string;
  value: number;
  color: string;
}

// Interface moved to getTopCompanies implementation block or defining it here matching the new implementation
// Deleting this block as I'm updating the function block entirely which includes the interface logic or just update the interface here.
// Actually, it's cleaner to update the interface in place.

export interface CompanyStat {
  name: string;
  total: number;
  dangNhanViec: number;
  tuChoi: number;
  choPhongVan: number;
  daNghiViec: number;
  khac: number;
}

export interface GrowthStat {
  date: string;
  ungTuyen: number;
  nguoiLaoDong: number;
}

const ungTuyenRepo = new UngTuyenRepository();
const nguoiLaoDongRepo = new NguoiLaoDongRepository();
const congTyRepo = new CongTyRepository();

export const fetchStatsData = async () => {
  const [ungTuyenList, nguoiLaoDongList, congTyList] = await Promise.all([
    ungTuyenRepo.getAll(),
    nguoiLaoDongRepo.getAll(),
    congTyRepo.getAll(),
  ]);

  return { ungTuyenList, nguoiLaoDongList, congTyList };
};

const toDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(val);
    if (typeof val === 'string') return parseISO(val);
    return new Date(val);
};

export const filterDataByDate = (
  ungTuyenList: UngTuyen[],
  range: DateRange
) => {
  const start = startOfDay(range.startDate);
  const end = endOfDay(range.endDate);

  return ungTuyenList.filter((item) => {
    const createdDate = toDate(item.createdAt);
    if (!createdDate) return false;
    return isWithinInterval(createdDate, { start, end });
  });
};

export const getOverviewStats = (
  ungTuyenList: UngTuyen[],
  nguoiLaoDongList: NguoiLaoDong[],
  congTyList: CongTy[]
): StatsOverview => {
    // For Candidates and Companies, since they don't always have a clear 'date' associated with the 'application' context in the same way,
    // we might just return the filtered counts if we filtered them, OR the total counts.
    // However, usually "Growth" implies we filter them by their creation date.
    // The previous plan said "Active in range", so we should probably filter them too.
    // But typically Overview cards show the current state of the filtered dataset.
    
    // NOTE: Application list passed here is ALREADY filtered by date.
    // But Workers and Companies lists are NOT. 
    // We should probably filter workers/companies by their createdAt if we want "New Workers in Period".
    // Or just show Total Workers.
    // Let's assume standard dashboard behavior:
    // 1. "Total Applications" = count of filtered applications.
    // 2. "Candidates" = count of UNIQUE candidates in those applications OR total candidates created in that period.
    // Let's go with "Candidates involved in applications" for relevance, OR "New Candidates".
    // "Tỷ lệ tăng trưởng người lao động mới" (Growth rate of new workers) was requested.
    // So let's calculate "New Workers" in this period.
    
    // Calculating success rate:
    const successCount = ungTuyenList.filter(item => item.trangThaiTuyen === TrangThaiTuyen.DANG_NHAN_VIEC).length;
    const rate = ungTuyenList.length > 0 ? (successCount / ungTuyenList.length) * 100 : 0;

  return {
    totalUngTuyen: ungTuyenList.length,
    totalNguoiLaoDong: nguoiLaoDongList.length, // Placeholder, needs explicit filtering if we want "New"
    totalCongTy: congTyList.length, // Placeholder
    recruitmentRate: parseFloat(rate.toFixed(2)),
  };
};

export const filterWorkersAndCompaniesByDate = (
    list: (NguoiLaoDong | CongTy)[],
    range: DateRange
) => {
    const start = startOfDay(range.startDate);
    const end = endOfDay(range.endDate);

    return list.filter(item => {
        const createdDate = toDate(item.createdAt);
        if (!createdDate) return false;
        return isWithinInterval(createdDate, { start, end });
    });
}

export const getJobStatusStats = (ungTuyenList: UngTuyen[]): JobStatusStat[] => {
  const statusCounts: Record<string, number> = {};
  
  ungTuyenList.forEach((item) => {
    const status = item.trangThaiTuyen;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const mapColor = (status: string) => {
      switch(status) {
          case TrangThaiTuyen.DANG_NHAN_VIEC: return '#6366f1'; // Indigo-500
          case TrangThaiTuyen.TU_CHOI: return '#f43f5e'; // Rose-500
          case TrangThaiTuyen.CHO_PHONG_VAN: return '#3b82f6'; // Blue-500
          case TrangThaiTuyen.DA_NGHI_VIEC: return '#94a3b8'; // Slate-400
          default: return '#cbd5e1'; // Slate-300
      }
  }

  return Object.entries(statusCounts).map(([name, value]) => ({
    name: formatStatusName(name),
    value,
    color: mapColor(name),
  }));
};

const formatStatusName = (status: string) => {
    // Map enum values to readable Vietnamese
     switch(status) {
          case TrangThaiTuyen.DANG_NHAN_VIEC: return 'Đang nhận việc';
          case TrangThaiTuyen.TU_CHOI: return 'Từ chối';
          case TrangThaiTuyen.CHO_PHONG_VAN: return 'Chờ phỏng vấn';
          case TrangThaiTuyen.TOI_LICH_PHONG_VAN: return 'Tới lịch PV';
          case TrangThaiTuyen.KHONG_DEN_PHONG_VAN: return 'Không đến PV';
          case TrangThaiTuyen.DA_NGHI_VIEC: return 'Đã nghỉ việc';
          case TrangThaiTuyen.CONG_TY_NGUNG_TUYEN: return 'Công ty ngừng tuyển';
          case TrangThaiTuyen.CHO_XAC_NHAN: return 'Chờ xác nhận';
          default: return status;
      }
}

export const getGenderStats = (
  ungTuyenList: UngTuyen[], 
  nguoiLaoDongList: NguoiLaoDong[]
): GenderStat[] => {
    // Create a lookup map for worker gender
    const workerGenderMap = nguoiLaoDongList.reduce((acc, curr) => {
        acc[curr.id] = curr.gioiTinh;
        return acc;
    }, {} as Record<string, string>);
    
    let nam = 0;
    let nu = 0;

    ungTuyenList.forEach(app => {
        const gender = workerGenderMap[app.nguoiLaoDongId];
        if (gender === 'NAM' || gender === 'Nam') nam++;
        else if (gender === 'NU' || gender === 'Nu' || gender === 'Nữ') nu++;
    });

    return [
        { name: 'Nam', value: nam, color: '#3b82f6' },
        { name: 'Nữ', value: nu, color: '#ec4899' }
    ];
};

export interface CompanyStat {
  name: string;
  total: number;
  dangNhanViec: number;
  tuChoi: number;
  choPhongVan: number;
  khac: number;
}

export const getTopCompanies = (
  ungTuyenList: UngTuyen[],
  congTyList: CongTy[]
): CompanyStat[] => {
    const companiesMap = congTyList.reduce((acc, curr) => {
        acc[curr.id] = curr.tenCongTy;
        return acc;
    }, {} as Record<string, string>);

    const stats: Record<string, CompanyStat> = {};

    ungTuyenList.forEach(app => {
        const name = companiesMap[app.congTyId] || 'Unknown';
        if (!stats[name]) {
            stats[name] = { 
                name, 
                total: 0, 
                dangNhanViec: 0, 
                tuChoi: 0, 
                choPhongVan: 0, 
                daNghiViec: 0,
                khac: 0 
            };
        }
        
        stats[name].total += 1;

        switch (app.trangThaiTuyen) {
            case TrangThaiTuyen.DANG_NHAN_VIEC:
                stats[name].dangNhanViec += 1;
                break;
            case TrangThaiTuyen.TU_CHOI:
                stats[name].tuChoi += 1;
                break;
            case TrangThaiTuyen.CHO_PHONG_VAN:
                stats[name].choPhongVan += 1;
                break;
            case TrangThaiTuyen.DA_NGHI_VIEC:
                stats[name].daNghiViec += 1;
                break;
            default:
                stats[name].khac += 1;
                break;
        }
    });

    return Object.values(stats)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // Top 10
};

export const getGrowthStats = (
    ungTuyenList: UngTuyen[],
    nguoiLaoDongList: NguoiLaoDong[],
    range: DateRange
): GrowthStat[] => {
    // Group by Day or Month depending on range size. 
    // For default 1 month, Day is good.
    const statsMap: Record<string, { ungTuyen: number, nguoiLaoDong: number }> = {};
    
    // Initialize map for all days in range to ensure continuous line
    let current = startOfDay(range.startDate);
    const end = endOfDay(range.endDate);
    
    while (current <= end) {
        const key = format(current, 'dd/MM');
        statsMap[key] = { ungTuyen: 0, nguoiLaoDong: 0 };
        current = new Date(current.setDate(current.getDate() + 1));
    }

    // Count Applications
    const appStart = startOfDay(range.startDate);
    const appEnd = endOfDay(range.endDate);

    ungTuyenList.forEach(app => {
        const date = toDate(app.createdAt);
        if (date && isWithinInterval(date, { start: appStart, end: appEnd })) {
             const key = format(date, 'dd/MM');
             if (statsMap[key]) statsMap[key].ungTuyen++;
        }
    });

    // Count New Workers
    nguoiLaoDongList.forEach(worker => {
        const date = toDate(worker.createdAt);
         if (date && isWithinInterval(date, { start: appStart, end: appEnd })) {
             const key = format(date, 'dd/MM');
             if (statsMap[key]) statsMap[key].nguoiLaoDong++;
        }
    });

    return Object.entries(statsMap).map(([date, stats]) => ({
        date,
        ...stats,
    }));
};

export interface StatusTrendStat {
    date: string;
    dangNhanViec: number;
    tuChoi: number;
    choPhongVan: number;
    daNghiViec: number;
    khac: number;
}

export const getStatusTrendStats = (
    ungTuyenList: UngTuyen[],
    range: DateRange
): StatusTrendStat[] => {
    const statsMap: Record<string, StatusTrendStat> = {};
    
    let current = startOfDay(range.startDate);
    const end = endOfDay(range.endDate);
    
    while (current <= end) {
        const key = format(current, 'dd/MM');
        statsMap[key] = { 
            date: key, 
            dangNhanViec: 0, 
            tuChoi: 0, 
            choPhongVan: 0,
            daNghiViec: 0,
            khac: 0 
        };
        current = new Date(current.setDate(current.getDate() + 1));
    }

    ungTuyenList.forEach(app => {
        const date = toDate(app.createdAt);
        if (date && isWithinInterval(date, { 
            start: startOfDay(range.startDate), 
            end: endOfDay(range.endDate) 
        })) {
             const key = format(date, 'dd/MM');
             if (statsMap[key]) {
                 if (app.trangThaiTuyen === TrangThaiTuyen.DANG_NHAN_VIEC) statsMap[key].dangNhanViec++;
                 else if (app.trangThaiTuyen === TrangThaiTuyen.TU_CHOI) statsMap[key].tuChoi++;
                 else if (app.trangThaiTuyen === TrangThaiTuyen.CHO_PHONG_VAN) statsMap[key].choPhongVan++;
                 else if (app.trangThaiTuyen === TrangThaiTuyen.DA_NGHI_VIEC) statsMap[key].daNghiViec++;
                 else statsMap[key].khac++;
             }
        }
    });

    return Object.values(statsMap);
};

