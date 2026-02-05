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

export interface AppEvent {
  id: string;
  nguoiLaoDongId: string;
  congTyId: string;
  tenCongTy?: string;
  date: Date;
  trangThaiTuyen: TrangThaiTuyen;
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

export const flattenAppEvents = (ungTuyenList: UngTuyen[]): AppEvent[] => {
    const events: AppEvent[] = [];
    
    ungTuyenList.forEach(app => {
        // Current state
        const currentDate = toDate(app.updatedAt || app.createdAt);
        if (currentDate) {
            events.push({
                id: app.id,
                nguoiLaoDongId: app.nguoiLaoDongId,
                congTyId: app.congTyId,
                date: currentDate,
                trangThaiTuyen: app.trangThaiTuyen
            });
        }
        
        // History events
        if (app.lichSuPhongVan) {
            app.lichSuPhongVan.forEach((h, index) => {
                const hDate = toDate(h.ngayCapNhat);
                if (hDate) {
                    events.push({
                        id: `${app.id}_h${index}`,
                        nguoiLaoDongId: app.nguoiLaoDongId,
                        congTyId: app.congTyId,
                        tenCongTy: h.tenCongTy,
                        date: hDate,
                        trangThaiTuyen: h.trangThaiTuyen
                    });
                }
            });
        }
    });
    
    return events;
};

export const filterEventsByDate = (
  events: AppEvent[],
  range: DateRange
) => {
  const start = startOfDay(range.startDate);
  const end = endOfDay(range.endDate);

  return events.filter((event) => {
    return isWithinInterval(event.date, { start, end });
  });
};

export const getOverviewStats = (
  filteredEvents: AppEvent[],
  allCompanies: CongTy[],
): StatsOverview => {
    const activeWorkerIds = new Set(filteredEvents.map(e => e.nguoiLaoDongId));
    const successCount = filteredEvents.filter(item => item.trangThaiTuyen === TrangThaiTuyen.DANG_NHAN_VIEC).length;
    const rate = filteredEvents.length > 0 ? (successCount / filteredEvents.length) * 100 : 0;

  return {
    totalUngTuyen: filteredEvents.length,
    totalNguoiLaoDong: activeWorkerIds.size,
    totalCongTy: allCompanies.length, 
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

export const getJobStatusStats = (events: AppEvent[]): JobStatusStat[] => {
  const statusCounts: Record<string, number> = {};
  
  events.forEach((item) => {
    const status = item.trangThaiTuyen;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const mapColor = (status: string) => {
      switch(status) {
          case TrangThaiTuyen.DANG_NHAN_VIEC: return '#6366f1'; 
          case TrangThaiTuyen.TU_CHOI: return '#f43f5e'; 
          case TrangThaiTuyen.CHO_PHONG_VAN: return '#3b82f6'; 
          case TrangThaiTuyen.DA_NGHI_VIEC: return '#94a3b8'; 
          default: return '#cbd5e1'; 
      }
  }

  return Object.entries(statusCounts).map(([name, value]) => ({
    name: formatStatusName(name),
    value,
    color: mapColor(name),
  }));
};

const formatStatusName = (status: string) => {
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
  events: AppEvent[], 
  nguoiLaoDongList: NguoiLaoDong[]
): GenderStat[] => {
    const workerGenderMap = nguoiLaoDongList.reduce((acc, curr) => {
        acc[curr.id] = curr.gioiTinh;
        return acc;
    }, {} as Record<string, string>);
    
    let nam = 0;
    let nu = 0;

    events.forEach(app => {
        const gender = workerGenderMap[app.nguoiLaoDongId];
        if (gender === 'NAM' || gender === 'Nam') nam++;
        else if (gender === 'NU' || gender === 'Nu' || gender === 'Nữ') nu++;
    });

    return [
        { name: 'Nam', value: nam, color: '#3b82f6' },
        { name: 'Nữ', value: nu, color: '#ec4899' }
    ];
};

export const getTopCompanies = (
  events: AppEvent[],
  congTyList: CongTy[]
): CompanyStat[] => {
    const companiesMap = congTyList.reduce((acc, curr) => {
        acc[curr.id] = curr.tenCongTy;
        return acc;
    }, {} as Record<string, string>);

    const stats: Record<string, CompanyStat> = {};

    events.forEach(app => {
        const name = app.tenCongTy || companiesMap[app.congTyId] || 'Unknown';
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
        .slice(0, 10); 
};

export const getGrowthStats = (
    events: AppEvent[],
    allWorkerList: NguoiLaoDong[],
    range: DateRange
): GrowthStat[] => {
    const statsMap: Record<string, { ungTuyen: number, nguoiLaoDong: number }> = {};
    
    let current = startOfDay(range.startDate);
    const end = endOfDay(range.endDate);
    
    while (current <= end) {
        const key = format(current, 'dd/MM');
        statsMap[key] = { ungTuyen: 0, nguoiLaoDong: 0 };
        current = new Date(current.setDate(current.getDate() + 1));
    }

    const appStart = startOfDay(range.startDate);
    const appEnd = endOfDay(range.endDate);

    events.forEach(event => {
        if (isWithinInterval(event.date, { start: appStart, end: appEnd })) {
             const key = format(event.date, 'dd/MM');
             if (statsMap[key]) statsMap[key].ungTuyen++;
        }
    });

    allWorkerList.forEach(worker => {
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
    events: AppEvent[],
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

    events.forEach(event => {
        if (isWithinInterval(event.date, { 
            start: startOfDay(range.startDate), 
            end: endOfDay(range.endDate) 
        })) {
             const key = format(event.date, 'dd/MM');
             if (statsMap[key]) {
                 if (event.trangThaiTuyen === TrangThaiTuyen.DANG_NHAN_VIEC) statsMap[key].dangNhanViec++;
                 else if (event.trangThaiTuyen === TrangThaiTuyen.TU_CHOI) statsMap[key].tuChoi++;
                 else if (event.trangThaiTuyen === TrangThaiTuyen.CHO_PHONG_VAN) statsMap[key].choPhongVan++;
                 else if (event.trangThaiTuyen === TrangThaiTuyen.DA_NGHI_VIEC) statsMap[key].daNghiViec++;
                 else statsMap[key].khac++;
             }
        }
    });

    return Object.values(statsMap);
};
