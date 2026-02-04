interface Tag {
    id: string;
    noiDung: String;
}

interface YeuCau extends Tag {}

interface PhucLoi extends Tag {}

interface PhuCap extends Tag {}

interface GhiChu extends Tag {}

interface QuanLy {
    id: string;
    tenQuanLy: string;
    soDienThoai: string;
}

enum TrangThai {
    DANG_TUYEN = "DANG_TUYEN",
    DA_NGUNG = "DA_NGUNG",
}

interface TinTuyenDung {
    id: string;
    moTa: string;
    yeuCau: YeuCau[];
    phucLoi: PhucLoi[];
    phuCap: PhuCap[];
    congTy: CongTy;
    ghiChu: GhiChu[];
    quanLy: QuanLy[];
    mapUrl: string | null;
    diaChi: string | null;
    trangThai: TrangThai;
}

interface KhuVuc {
    id: string;
    tenKhuVuc: string;
    congTy: CongTy[];
}

interface CongTy {
    id: string;
    tenCongTy: string;
    khuVuc: KhuVuc;
    tinTuyenDung: TinTuyenDung[];
}

enum GioiTinh {
    NAM = "NAM",
    NU = "NU",
}

interface NguoiLaoDong {
    id: string;
    tenNguoiLaoDong: string;
    soDienThoai: string | null;
    namSinh: number;
    gioiTinh: GioiTinh;
}

enum TrangThaiTuyen {
    CHO_PHONG_VAN = "CHO_PHONG_VAN",
    TOI_LICH_PHONG_VAN = "TOI_LICH_PHONG_VAN",
    CHO_XAC_NHAN = "CHO_XAC_NHAN",
    KHONG_DEN_PHONG_VAN = "KHONG_DEN_PHONG_VAN",
    TU_CHOI = "TU_CHOI",
    DANG_NHAN_VIEC = "DANG_NHAN_VIEC",
    DA_NGHI_VIEC = "DA_NGHI_VIEC",
    CONG_TY_NGUNG_TUYEN = "CONG_TY_NGUNG_TUYEN",
}

interface NguoiLaoDong_TinTuyenDung {
    nguoiLaoDong: NguoiLaoDong;
    tinTuyenDung: TinTuyenDung;
    ngayPhongVan: Date;
    trangThaiTuyen: TrangThaiTuyen;
    ghiChu: GhiChu[];
}
