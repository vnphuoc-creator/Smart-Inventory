/**
 * Type definitions for Smart Inventory Management System
 * Hệ Thống Quản Lý Vật Tư Xuất - Nhập - Tồn Thông Minh
 */

export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  stt: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  roleName: 'Quản lý' | 'Nhân viên';
  note: string;
  department?: string;
  avatarColor?: string;
  password?: string;
  defaultPassword?: string;
}

export interface Material {
  id: string;
  code: string; // Strictly starts with DN_ (e.g. DN_CC_00ACB_01)
  name: string;
  category: string;
  unit: string; // Cái, Cuộn, Mét, Bộ, Cây, Thùng, Kg, v.v.
  specification: string;
  location: string; // Vị trí kho (e.g. Kệ A1-02, Kho Tổng, Kho Cụm 1)
  initialStock: number; // Tồn đầu kỳ
  minStock: number; // Định mức tồn tối thiểu (ngưỡng an toàn)
  maxStock: number; // Định mức tồn tối đa
  unitPrice: number; // Đơn giá tiêu chuẩn (VNĐ)
  allocatedStaffEmails?: string[]; // Phân bổ quyền theo dõi/quản lý cho nhân viên cụ thể
  notes?: string;
  image?: string;
  updatedAt?: string;
}

export type TransactionType = 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'ADJUSTMENT';

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';

export interface TransactionItem {
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currentStockAtCreation: number;
  proposalNumber?: string; // Số tờ trình cụ thể (e.g. 17-DNCT/PKT, 26-DNCT/PKT, 21-DNCT/PKT...)
  notes?: string;
}

export interface ProposalItem {
  materialCode: string;
  materialName: string;
  specification?: string;
  unit: string;
  requestedQuantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface PurchaseProposal {
  id: string;
  proposalNumber: string; // e.g. "17-DNCT/PKT", "26-DNCT/PKT", "31-DNCT/PKT", "08-DNCT/PKT"
  title: string; // Tiêu đề / Nội dung tờ trình
  date: string; // YYYY-MM-DD
  creatorName: string;
  creatorEmail: string;
  department: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'PARTIALLY_IMPORTED' | 'CLOSED_EARLY' | 'DRAFT' | 'SUBMITTED' | 'REJECTED';
  isClosedEarly?: boolean;
  closedEarlyReason?: string;
  closedEarlyDate?: string;
  closedEarlyBy?: string;
  attachmentUrl?: string; // Data URL or Image/PDF link
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf' | 'document';
  attachmentHtml?: string; // Rich HTML rendered from docx for in-app viewing without downloading
  items: ProposalItem[];
  notes?: string;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  code: string; // Mã chứng từ: PN-2026-..., PX-2026-..., DN-2026-...
  type: TransactionType;
  title: string;
  proposalNumber?: string; // Số tờ trình phê duyệt nhập/xuất (e.g. 17-DNCT/PKT, 26-DNCT/PKT, 21-DNCT/PKT)
  proposalAttachmentUrl?: string; // Ảnh/File tờ trình đính kèm
  proposalAttachmentName?: string;
  proposalAttachmentType?: 'image' | 'pdf' | 'document';
  proposalAttachmentHtml?: string; // Rendered HTML for docx
  attachmentUrl?: string; // Tương thích đính kèm
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf' | 'document';
  attachmentHtml?: string;
  date: string; // YYYY-MM-DD
  creatorEmail: string;
  creatorName: string;
  creatorRole: UserRole;
  partner: string; // Nhà cung cấp (nếu Nhập) hoặc Đơn vị nhận/Công trình (nếu Xuất)
  warehouse: string; // Kho thực hiện
  status: TransactionStatus;
  items: TransactionItem[];
  totalQuantity: number;
  totalAmount: number;
  reason: string;
  notes?: string;
  approverEmail?: string;
  approverName?: string;
  approvalDate?: string;
  approvalNote?: string;
  createdAt: string;
}

export interface CalculatedMaterialStock extends Material {
  totalImported: number; // Tổng đã nhập (từ phiếu APPROVED)
  totalExported: number; // Tổng đã xuất (từ phiếu APPROVED)
  currentStock: number; // Tồn thực tế = initialStock + totalImported - totalExported
  pendingImport: number; // Chờ nhập (phiếu PENDING)
  pendingExport: number; // Chờ xuất (phiếu PENDING)
  availableStock: number; // Khả dụng = currentStock - pendingExport
  totalValue: number; // Giá trị tồn = currentStock * unitPrice
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OVER_STOCK' | 'OPTIMAL';
}

export interface StockCardEntry {
  id: string;
  date: string;
  documentCode: string;
  documentType: TransactionType;
  documentTitle: string;
  partner: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  unitPrice: number;
  amount: number;
  operator: string;
  notes?: string;
}

export interface StockSummaryReportItem {
  materialCode: string;
  materialName: string;
  unit: string;
  category: string;
  openingStock: number; // Tồn đầu
  openingValue: number;
  periodImportQty: number; // Nhập trong kỳ
  periodImportValue: number;
  periodExportQty: number; // Xuất trong kỳ
  periodExportValue: number;
  closingStock: number; // Tồn cuối kỳ
  closingValue: number;
  unitPrice: number;
}

export interface NaturalSearchFilters {
  searchKeyword?: string;
  category?: string;
  stockStatus?: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVER_STOCK' | 'OPTIMAL';
  transactionStatus?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
  materialCodePrefix?: string;
  minPrice?: number;
  maxPrice?: number;
}

export type ActivityActionType =
  | 'IMPORT_TX'
  | 'EXPORT_TX'
  | 'APPROVE_TX'
  | 'REJECT_TX'
  | 'UPDATE_TX'
  | 'DELETE_TX'
  | 'CREATE_PROPOSAL'
  | 'UPDATE_PROPOSAL'
  | 'DELETE_PROPOSAL'
  | 'EXCEL_IMPORT'
  | 'UPDATE_MATERIAL'
  | 'DELETE_MATERIAL'
  | 'CLEAR_DATA'
  | 'RESET_DEMO'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO 8601 string
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  action: ActivityActionType;
  actionTitle: string; // Tiêu đề ngắn gọn: Lập phiếu nhập kho, Phê duyệt xuất kho, Xóa chứng từ...
  details: string; // Diễn giải chi tiết
  documentCode?: string; // Mã phiếu PN-..., PX-...
  proposalNumber?: string; // Số tờ trình
  targetType?: 'TRANSACTION' | 'PROPOSAL' | 'MATERIAL' | 'SYSTEM' | 'AUTH';
  amount?: number;
  ipAddress?: string;
}

export type Transaction = InventoryTransaction;

export interface ReconciledProposalItem extends ProposalItem {
  totalImported: number;
  remainingNeeded: number;
  isComplete: boolean;
  currentAvailableStock?: number;
}

export interface ProposalReconciliation {
  proposal: PurchaseProposal;
  reconciledItems: ReconciledProposalItem[];
  missingItems: ReconciledProposalItem[];
  isFullyImported: boolean;
  totalRequestedQty: number;
  totalImportedQty: number;
  relatedImportTxs: InventoryTransaction[];
}

export type ThemeColorPreset =
  | 'aht-default'
  | 'emerald-airport'
  | 'royal-indigo'
  | 'cyber-amber'
  | 'crimson-tech'
  | 'monochrome-titan'
  | 'midnight-oled'
  | 'light-corporate';

export type CanvasMode = 'dark-slate' | 'dark-oled' | 'dark-navy' | 'light-modern';
export type TableDensity = 'compact' | 'standard' | 'comfortable';
export type FontSizeScale = 'small' | 'standard' | 'large';
export type BorderRadiusOption = 'sharp' | 'standard' | 'rounded' | 'full';
export type NavigationStyle = 'floating' | 'solid' | 'compact';

export interface UIThemeConfig {
  preset: ThemeColorPreset;
  canvasMode: CanvasMode;
  primaryColor: string;
  accentColor: string;
  tableDensity: TableDensity;
  fontSizeScale: FontSizeScale;
  borderRadius: BorderRadiusOption;
  enableGlassmorphism: boolean;
  enableCardGlow: boolean;
  enableAnimations: boolean;
  navigationStyle: NavigationStyle;
  showAirportBanner: boolean;
  customBannerUrl?: string;
  sidebarCollapsedDefault: boolean;
  customAppTitle?: string;
}

export const DEFAULT_THEME_CONFIG: UIThemeConfig = {
  preset: 'aht-default',
  canvasMode: 'dark-slate',
  primaryColor: '#2563eb',
  accentColor: '#3b82f6',
  tableDensity: 'standard',
  fontSizeScale: 'standard',
  borderRadius: 'standard',
  enableGlassmorphism: true,
  enableCardGlow: true,
  enableAnimations: true,
  navigationStyle: 'solid',
  showAirportBanner: true,
  customBannerUrl: '',
  sidebarCollapsedDefault: false,
  customAppTitle: 'Hệ Thống Quản Lý Kho Vật Tư AHT',
};

