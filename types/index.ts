// Base Tag interface
export interface Tag {
  id: string;
  noiDung: string;
  isDeactivated?: boolean;
}

export interface YeuCau extends Tag {}
export interface PhucLoi extends Tag {}
export interface PhuCap extends Tag {}

export interface QuanLy {
  id: string;
  tenQuanLy: string;
  soDienThoai: string;
}

export enum TrangThai {
  DANG_TUYEN = 'DANG_TUYEN',
  DA_NGUNG = 'DA_NGUNG',
}

export interface TinTuyenDung {
  id: string;
  moTa: string;
  yeuCau: YeuCau[];
  phucLoi: PhucLoi[];
  phuCap: PhuCap[];
  congTy: CongTy;
  ghiChu: string | null;
  quanLy: QuanLy | null;
  mapUrl: string | null;
  diaChi: string | null;
  trangThai: TrangThai;
  createdAt?: number;
  updatedAt?: number;
}

export interface KhuVuc {
  id: string;
  tenKhuVuc: string;
  congTy: CongTy[];
  createdAt?: number;
  updatedAt?: number;
}

export interface CongTy {
  id: string;
  tenCongTy: string;
  khuVuc: KhuVuc;
  tinTuyenDung: TinTuyenDung[];
  createdAt?: number;
  updatedAt?: number;
}

export enum GioiTinh {
  NAM = 'NAM',
  NU = 'NU',
}

export interface NguoiLaoDong {
  id: string;
  tenNguoiLaoDong: string;
  soDienThoai: string | null;
  namSinh: number;
  gioiTinh: GioiTinh;
  createdAt?: number;
  updatedAt?: number;
}

export enum TrangThaiTuyen {
  CHO_PHONG_VAN = 'CHO_PHONG_VAN',
  TOI_LICH_PHONG_VAN = 'TOI_LICH_PHONG_VAN',
  CHO_XAC_NHAN = 'CHO_XAC_NHAN',
  KHONG_DEN_PHONG_VAN = 'KHONG_DEN_PHONG_VAN',
  TU_CHOI = 'TU_CHOI',
  DANG_NHAN_VIEC = 'DANG_NHAN_VIEC',
  DA_NGHI_VIEC = 'DA_NGHI_VIEC',
  CONG_TY_NGUNG_TUYEN = 'CONG_TY_NGUNG_TUYEN',
}

export interface NguoiLaoDong_TinTuyenDung {
  nguoiLaoDong: NguoiLaoDong;
  tinTuyenDung: TinTuyenDung;
  ngayPhongVan: Date;
  trangThaiTuyen: TrangThaiTuyen;
  ghiChu: GhiChu[];
  createdAt?: number;
  updatedAt?: number;
}

// Lock interface for edit locking
export interface Lock {
  userId: string;
  userName: string;
  userEmail: string;
  lockedAt: number;
  expiresAt: number;
}

// User interface
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: number;
}
