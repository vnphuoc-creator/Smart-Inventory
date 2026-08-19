import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Package,
  Boxes,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Material,
  CalculatedMaterialStock,
  InventoryTransaction,
  StockCardEntry,
} from '../types';
import {
  formatVND,
  formatNumber,
  generateStockCard,
  generateStockSummaryReport,
} from '../utils/inventoryEngine';
import { MATERIAL_CATEGORIES } from '../data/seedData';

interface StockLedgerViewProps {
  materials: Material[];
  calculatedStocks: CalculatedMaterialStock[];
  transactions: InventoryTransaction[];
  initialMaterialCode?: string;
}

export const StockLedgerView: React.FC<StockLedgerViewProps> = ({
  materials,
  calculatedStocks,
  transactions,
  initialMaterialCode,
}) => {
  const [subTab, setSubTab] = useState<'CARD' | 'REPORT'>('CARD');
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>(
    initialMaterialCode || materials[0]?.code || 'DN_CC_00ACB_01'
  );
  const [reportCategory, setReportCategory] = useState('ALL');
  const [reportPeriod, setReportPeriod] = useState('2026-08');

  // Update if initial code changes
  React.useEffect(() => {
    if (initialMaterialCode) {
      setSelectedMaterialCode(initialMaterialCode);
    }
  }, [initialMaterialCode]);

  // Active Material details
  const activeMaterial = useMemo(() => {
    return (
      calculatedStocks.find((m) => m.code === selectedMaterialCode) ||
      materials.find((m) => m.code === selectedMaterialCode) ||
      materials[0]
    );
  }, [calculatedStocks, materials, selectedMaterialCode]);

  // Stock Card entries for selected material
  const stockCardEntries: StockCardEntry[] = useMemo(() => {
    if (!selectedMaterialCode) return [];
    return generateStockCard(selectedMaterialCode, materials, transactions);
  }, [selectedMaterialCode, materials, transactions]);

  // Chart data for stock card balance
  const balanceChartData = useMemo(() => {
    return stockCardEntries.map((e) => ({
      name: `${e.date.slice(5)} (${e.documentCode})`,
      'Tồn kho': e.balance,
      'Nhập': e.quantityIn,
      'Xuất': e.quantityOut,
    }));
  }, [stockCardEntries]);

  // Summary Report data
  const summaryReportData = useMemo(() => {
    const report = generateStockSummaryReport(materials, transactions);
    if (reportCategory === 'ALL') return report;
    return report.filter((r) => r.category === reportCategory);
  }, [materials, transactions, reportCategory]);

  const reportTotals = useMemo(() => {
    return summaryReportData.reduce(
      (acc, item) => {
        acc.openingQty += item.openingStock;
        acc.openingValue += item.openingValue;
        acc.importQty += item.periodImportQty;
        acc.importValue += item.periodImportValue;
        acc.exportQty += item.periodExportQty;
        acc.exportValue += item.periodExportValue;
        acc.closingQty += item.closingStock;
        acc.closingValue += item.closingValue;
        return acc;
      },
      {
        openingQty: 0,
        openingValue: 0,
        importQty: 0,
        importValue: 0,
        exportQty: 0,
        exportValue: 0,
        closingQty: 0,
        closingValue: 0,
      }
    );
  }, [summaryReportData]);

  // Export Stock Card CSV
  const handleExportStockCardCSV = () => {
    if (!activeMaterial) return;
    const headers = [
      'STT',
      'Ngày Chứng Từ',
      'Số Chứng Từ',
      'Loại Nghiệp Vụ',
      'Diễn Giải',
      'Đối Tác',
      'Số Lượng Nhập',
      'Số Lượng Xuất',
      'Tồn Sau Nghiệp Vụ',
      'Đơn Giá (VNĐ)',
      'Thành Tiền (VNĐ)',
      'Người Thực Hiện',
    ];

    const rows = stockCardEntries.map((e, idx) => [
      idx + 1,
      e.date,
      e.documentCode,
      e.documentType,
      `"${e.documentTitle.replace(/"/g, '""')}"`,
      `"${e.partner}"`,
      e.quantityIn,
      e.quantityOut,
      e.balance,
      e.unitPrice,
      e.amount,
      `"${e.operator}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `The_Kho_${activeMaterial.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Summary Report CSV
  const handleExportSummaryCSV = () => {
    const headers = [
      'STT',
      'Mã Vật Tư (DN_*)',
      'Tên Vật Tư',
      'ĐVT',
      'Nhóm Ngành Hàng',
      'Tồn Đầu Kỳ (SL)',
      'Tồn Đầu Kỳ (Tiền)',
      'Nhập Trong Kỳ (SL)',
      'Nhập Trong Kỳ (Tiền)',
      'Xuất Trong Kỳ (SL)',
      'Xuất Trong Kỳ (Tiền)',
      'Tồn Cuối Kỳ (SL)',
      'Tồn Cuối Kỳ (Tiền)',
    ];

    const rows = summaryReportData.map((r, idx) => [
      idx + 1,
      r.materialCode,
      `"${r.materialName.replace(/"/g, '""')}"`,
      r.unit,
      `"${r.category}"`,
      r.openingStock,
      r.openingValue,
      r.periodImportQty,
      r.periodImportValue,
      r.periodExportQty,
      r.periodExportValue,
      r.closingStock,
      r.closingValue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_NXT_${reportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sổ Thẻ Kho & Báo Cáo Tổng Hợp NXT</h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi chi tiết luồng biến động hàng hóa và báo cáo tổng hợp Nhập - Xuất - Tồn theo chuẩn kế toán
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            id="subtab-stock-card"
            onClick={() => setSubTab('CARD')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'CARD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Sổ Thẻ Kho Chi Tiết
          </button>
          <button
            id="subtab-summary-report"
            onClick={() => setSubTab('REPORT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'REPORT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Báo Cáo Tổng Hợp (N-X-T)
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: STOCK CARD (SỔ THẺ KHO) */}
      {subTab === 'CARD' && (
        <div className="space-y-6">
          {/* Material Selector Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Chọn Mã Vật Tư Cần Tra Cứu Thẻ Kho (DN_*):
                </label>
                <select
                  id="select-material-stock-card"
                  value={selectedMaterialCode}
                  onChange={(e) => setSelectedMaterialCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  {materials.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportStockCardCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" /> Xuất Excel Thẻ Kho
                </button>
              </div>
            </div>

            {/* Active Material Infocard */}
            {activeMaterial && (
              <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mã Vật Tư</span>
                  <span className="font-mono font-bold text-blue-400 text-sm mt-0.5 block">
                    {activeMaterial.code}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Đơn Vị Tính</span>
                  <span className="font-medium text-white text-sm mt-0.5 block">{activeMaterial.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tồn Đầu Kỳ</span>
                  <span className="font-mono text-slate-300 text-sm mt-0.5 block">
                    {formatNumber(activeMaterial.initialStock)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tồn Hiện Tại</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                    {'currentStock' in activeMaterial ? formatNumber(activeMaterial.currentStock) : activeMaterial.initialStock}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Đơn Giá Chuẩn</span>
                  <span className="font-mono text-slate-300 text-sm mt-0.5 block">
                    {formatVND(activeMaterial.unitPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vị Trí Kho</span>
                  <span className="text-slate-300 text-xs mt-0.5 block truncate">
                    {activeMaterial.location}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Running Balance Trend Line Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Diễn Biến Tồn Kho Sau Từng Nghiệp Vụ (Mã {selectedMaterialCode})
              </h2>
              <p className="text-xs text-slate-400">Số lượng tồn được tính toán liên tục sau mỗi phiếu được duyệt</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Tồn kho"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Card Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                Sổ Thẻ Kho Điện Tử — {activeMaterial?.name} ({selectedMaterialCode})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Tổng {stockCardEntries.length} dòng biến động
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3">Ngày Ghi Sổ</th>
                    <th className="py-3 px-3 font-mono">Số Chứng Từ</th>
                    <th className="py-3 px-4 min-w-[200px]">Diễn Giải Nghiệp Vụ</th>
                    <th className="py-3 px-3">Đối Tác / Đơn Vị</th>
                    <th className="py-3 px-3 text-right text-blue-400">Số Lượng Nhập</th>
                    <th className="py-3 px-3 text-right text-amber-400">Số Lượng Xuất</th>
                    <th className="py-3 px-3 text-right font-bold text-white bg-slate-800/40">
                      Tồn Sau Giao Dịch
                    </th>
                    <th className="py-3 px-3 text-right">Đơn Giá</th>
                    <th className="py-3 px-4 text-right">Thành Tiền</th>
                    <th className="py-3 px-3">Người Phụ Trách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stockCardEntries.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{entry.date}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                          {entry.documentCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">{entry.documentTitle}</td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[130px]">{entry.partner}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-blue-400">
                        {entry.quantityIn > 0 ? `+${formatNumber(entry.quantityIn)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-amber-400">
                        {entry.quantityOut > 0 ? `-${formatNumber(entry.quantityOut)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm text-white bg-slate-800/40">
                        {formatNumber(entry.balance)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                        {formatVND(entry.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                        {formatVND(entry.amount)}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{entry.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUMMARY REPORT (BÁO CÁO TỔNG HỢP NXT) */}
      {subTab === 'REPORT' && (
        <div className="space-y-6">
          {/* Report Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Kỳ Báo Cáo:
                </label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="2026-08">Tháng 08/2026 (Hiện tại)</option>
                  <option value="2026-Q3">Quý 3 / 2026</option>
                  <option value="2026-YTD">Cả Năm 2026 (Lũy kế)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Nhóm Ngành Hàng:
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả nhóm vật tư</option>
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSummaryCSV}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/30"
              >
                <Download className="w-4 h-4" /> Xuất Báo Cáo Excel
              </button>
            </div>
          </div>

          {/* Aggregate Overview Cards for the Period */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Tổng Giá Trị Tồn Đầu</span>
              <div className="text-base font-bold text-white font-mono mt-1">
                {formatVND(reportTotals.openingValue)}
              </div>
              <span className="text-[11px] text-slate-500">SL: {formatNumber(reportTotals.openingQty)}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-blue-400">Tổng Giá Trị Đã Nhập</span>
              <div className="text-base font-bold text-blue-400 font-mono mt-1">
                +{formatVND(reportTotals.importValue)}
              </div>
              <span className="text-[11px] text-blue-500">SL: +{formatNumber(reportTotals.importQty)}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-amber-400">Tổng Giá Trị Đã Xuất</span>
              <div className="text-base font-bold text-amber-400 font-mono mt-1">
                -{formatVND(reportTotals.exportValue)}
              </div>
              <span className="text-[11px] text-amber-500">SL: -{formatNumber(reportTotals.exportQty)}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-emerald-400">Tổng Giá Trị Tồn Cuối</span>
              <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                {formatVND(reportTotals.closingValue)}
              </div>
              <span className="text-[11px] text-emerald-500">SL: {formatNumber(reportTotals.closingQty)}</span>
            </div>
          </div>

          {/* Full NXT Report Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-850 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                  <tr>
                    <th rowSpan={2} className="py-3 px-3 border-r border-slate-800 text-left">
                      Mã VT (DN_*) & Tên
                    </th>
                    <th rowSpan={2} className="py-3 px-2 border-r border-slate-800">
                      ĐVT
                    </th>
                    <th colSpan={2} className="py-2 px-3 border-r border-slate-800 bg-slate-800/40">
                      TỒN ĐẦU KỲ
                    </th>
                    <th colSpan={2} className="py-2 px-3 border-r border-slate-800 bg-blue-950/30 text-blue-300">
                      NHẬP TRONG KỲ
                    </th>
                    <th colSpan={2} className="py-2 px-3 border-r border-slate-800 bg-amber-950/30 text-amber-300">
                      XUẤT TRONG KỲ
                    </th>
                    <th colSpan={2} className="py-2 px-3 bg-emerald-950/30 text-emerald-300">
                      TỒN CUỐI KỲ
                    </th>
                  </tr>
                  <tr className="border-t border-slate-800 text-[10px]">
                    <th className="py-2 px-3 text-right">SL</th>
                    <th className="py-2 px-3 text-right border-r border-slate-800">Thành Tiền</th>
                    <th className="py-2 px-3 text-right">SL</th>
                    <th className="py-2 px-3 text-right border-r border-slate-800">Thành Tiền</th>
                    <th className="py-2 px-3 text-right">SL</th>
                    <th className="py-2 px-3 text-right border-r border-slate-800">Thành Tiền</th>
                    <th className="py-2 px-3 text-right">SL</th>
                    <th className="py-2 px-3 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {summaryReportData.map((row, idx) => (
                    <tr key={row.materialCode} className="hover:bg-slate-800/60 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3 px-3 border-r border-slate-800">
                        <div className="font-mono font-bold text-blue-400 text-xs">{row.materialCode}</div>
                        <div className="text-white text-xs font-medium truncate max-w-xs">{row.materialName}</div>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-2 text-center text-slate-400 border-r border-slate-800 font-medium">
                        {row.unit}
                      </td>

                      {/* Opening Stock */}
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatNumber(row.openingStock)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400 border-r border-slate-800">
                        {formatVND(row.openingValue)}
                      </td>

                      {/* Period In */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-blue-400">
                        {row.periodImportQty > 0 ? `+${formatNumber(row.periodImportQty)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-400 border-r border-slate-800">
                        {row.periodImportValue > 0 ? formatVND(row.periodImportValue) : '-'}
                      </td>

                      {/* Period Out */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-amber-400">
                        {row.periodExportQty > 0 ? `-${formatNumber(row.periodExportQty)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400 border-r border-slate-800">
                        {row.periodExportValue > 0 ? formatVND(row.periodExportValue) : '-'}
                      </td>

                      {/* Closing Stock */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-white text-sm bg-slate-800/30">
                        {formatNumber(row.closingStock)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 bg-slate-800/30">
                        {formatVND(row.closingValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-850 font-bold text-xs border-t-2 border-slate-700 text-white">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-center uppercase border-r border-slate-800">
                      TỔNG CỘNG ({summaryReportData.length} VẬT TƯ)
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatNumber(reportTotals.openingQty)}</td>
                    <td className="py-3 px-3 text-right font-mono border-r border-slate-800">
                      {formatVND(reportTotals.openingValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-400">
                      +{formatNumber(reportTotals.importQty)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-400 border-r border-slate-800">
                      +{formatVND(reportTotals.importValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400">
                      -{formatNumber(reportTotals.exportQty)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400 border-r border-slate-800">
                      -{formatVND(reportTotals.exportValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-white">
                      {formatNumber(reportTotals.closingQty)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">
                      {formatVND(reportTotals.closingValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
