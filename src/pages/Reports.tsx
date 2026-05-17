import { useState } from 'react';
import { useStore, Product } from '@/store/useStore';
import { downloadExcel, downloadPDF } from '@/lib/exportUtils';
import { FileSpreadsheet, FileText, Edit2, Trash2, X, Activity, Package, ShoppingCart, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ReportType = 'FACTORY_PROCESS' | 'FACTORY_INVENTORY' | 'BUYER_ORDER' | 'BUYER_INVENTORY';

const TOP_SIZES = ['S (90)', 'M (95)', 'L (100)', 'XL (105)', 'XXL (110)', 'XXXL (115)', 'XXXXL (120)'];
const BOTTOM_SIZES = Array.from({ length: 15 }, (_, i) => `${26 + i}`);
const getSizes = (type: string) => type === '하의' ? BOTTOM_SIZES : TOP_SIZES;

export default function Reports() {
  const { role, inventory, categories, updateProduct, deleteProduct } = useStore();
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const [activeTab, setActiveTab] = useState<ReportType>(() => {
    if (role === 'BUYER') return 'BUYER_ORDER';
    return 'FACTORY_PROCESS';
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpdate = (updated: Product) => {
    updateProduct(updated.id, updated);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteProduct(deletingId);
      setDeletingId(null);
    }
  };

  // --- FACTORY_PROCESS ---
  const processItems = inventory.filter(item => ['생산중', '운송중', '통관중', '납품대기'].includes(item.status));
  const handleFactoryProcessExcel = () => {
    const excelData = processItems.map(item => ({
      '제품 ID': item.id,
      '분류': item.category,
      '타입': item.type,
      '사양': `[${item.size}] ${item.color}`,
      '공장재고': item.factoryStock,
      '진행상태': item.status
    }));
    downloadExcel(excelData, `공정관리_보고서_${todayDate}`);
  };

  // --- FACTORY_INVENTORY ---
  const handleFactoryInventoryExcel = () => {
    const excelData = inventory.map(item => ({
      '제품 ID': item.id,
      '분류': item.category,
      '타입': item.type,
      '사양': `[${item.size}] ${item.color}`,
      '공장재고 (출고대기)': item.factoryStock,
      '상태': item.status
    }));
    downloadExcel(excelData, `제품등록_관리보고서_${todayDate}`);
  };

  // --- BUYER_ORDER ---
  const handleBuyerOrderExcel = () => {
    const excelData = inventory.map(item => ({
      '제품 ID': item.id,
      '분류': item.category,
      '타입': item.type,
      '사양': `[${item.size}] ${item.color}`,
      '발주수량(기준재고)': item.maxStock,
      '입고대기(공장재고)': item.factoryStock,
      '진행상태': item.status
    }));
    downloadExcel(excelData, `신규발주_내역보고서_${todayDate}`);
  };

  // --- BUYER_INVENTORY ---
  const handleBuyerInventoryExcel = () => {
    const excelData = inventory.map(item => ({
      '제품 ID': item.id,
      '분류': item.category,
      '타입': item.type,
      '사양': `[${item.size}] ${item.color}`,
      '정상 안전재고량': item.maxStock,
      '현재 보유재고': item.buyerStock,
      '상태': item.buyerStock < (item.maxStock * 0.3) ? '재고 부족' : '정상'
    }));
    downloadExcel(excelData, `재고및내역_보고서_${todayDate}`);
  };

  const handlePdfDownload = (filename: string) => {
    downloadPDF('report-element', `${filename}_${todayDate}`);
  };

  const TABS = [
    { id: 'FACTORY_PROCESS', label: '공정 관리', icon: Activity, roles: ['ADMIN', 'FACTORY'] },
    { id: 'FACTORY_INVENTORY', label: '제품 등록/관리', icon: Package, roles: ['ADMIN', 'FACTORY'] },
    { id: 'BUYER_ORDER', label: '신규 발주', icon: ShoppingCart, roles: ['ADMIN', 'BUYER'] },
    { id: 'BUYER_INVENTORY', label: '재고 및 내역', icon: Archive, roles: ['ADMIN', 'BUYER'] },
  ];

  const visibleTabs = TABS.filter(tab => tab.roles.includes(role));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">보고서 내보내기</h1>
        <p className="text-sm text-slate-500 mt-1">
          조회하고자 하는 보고서 탭을 선택하고 엑셀(Excel) 또는 PDF로 다운로드하세요.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportType)}
            className={cn(
              "flex items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <tab.icon className={cn("w-4 h-4 mr-2", activeTab === tab.id ? "text-indigo-100" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* --- FACTORY_PROCESS --- */}
        {activeTab === 'FACTORY_PROCESS' && (
          <>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-500" />
                공정 관리 보고서
              </h2>
              <div className="flex gap-2">
                <button onClick={handleFactoryProcessExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </button>
                <button onClick={() => handlePdfDownload('공정관리_보고서')} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </button>
              </div>
            </div>
            <div id="report-element" className="p-8 bg-white overflow-x-auto">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold tracking-tighter mb-2">공정 관리 보고서</h3>
                <p className="text-sm text-slate-500">생성일자: {todayDate}</p>
              </div>
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200">
                    <th className="py-3 px-4 font-semibold text-slate-700">제품 ID</th>
                    <th className="py-3 px-4 font-semibold text-slate-700">분류/사양</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-right">공장 재고량</th>
                    <th className="py-3 px-4 font-semibold text-slate-700">진행 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {processItems.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-3 px-4 font-mono text-xs">{item.id}</td>
                      <td className="py-3 px-4">[{item.category}] {item.type} ({item.size}) - {item.color}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-600">{item.factoryStock} 벌</td>
                      <td className="py-3 px-4 font-semibold text-amber-600">{item.status}</td>
                    </tr>
                  ))}
                  {processItems.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">진행중인 공정 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- FACTORY_INVENTORY --- */}
        {activeTab === 'FACTORY_INVENTORY' && (
          <>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-500" />
                제품 등록/관리 보고서
              </h2>
              <div className="flex gap-2">
                <button onClick={handleFactoryInventoryExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </button>
                <button onClick={() => handlePdfDownload('제품등록_관리보고서')} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </button>
              </div>
            </div>
            <div id="report-element" className="p-8 bg-white overflow-x-auto">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold tracking-tighter mb-2">제품 등록/관리 보고서</h3>
                <p className="text-sm text-slate-500">생성일자: {todayDate}</p>
              </div>
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200">
                    <th className="py-3 px-4 font-semibold text-slate-700">제품 ID</th>
                    <th className="py-3 px-4 font-semibold text-slate-700">분류/사양</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-right">공장 재고량</th>
                    <th className="py-3 px-4 font-semibold text-slate-700">상태</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-center w-20" data-html2canvas-ignore="true">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-3 px-4 font-mono text-xs">{item.id}</td>
                      <td className="py-3 px-4">[{item.category}] {item.type} ({item.size}) - {item.color}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-600">{item.factoryStock} 벌</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{item.status}</td>
                      <td className="py-3 px-4 flex justify-center gap-1" data-html2canvas-ignore="true">
                        <button onClick={() => setEditingProduct(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">등록된 제품이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- BUYER_ORDER --- */}
        {activeTab === 'BUYER_ORDER' && (
          <>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-blue-500" />
                신규 발주 내역 보고서
              </h2>
              <div className="flex gap-2">
                <button onClick={handleBuyerOrderExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </button>
                <button onClick={() => handlePdfDownload('신규발주_내역보고서')} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </button>
              </div>
            </div>
            <div id="report-element" className="p-8 bg-white overflow-x-auto">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold tracking-tighter mb-2">신규 발주 내역 보고서</h3>
                <p className="text-sm text-slate-500">생성일자: {todayDate}</p>
              </div>
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200">
                    <th className="py-3 px-4 font-semibold text-slate-700">제품 ID</th>
                    <th className="py-3 px-4 font-semibold text-slate-700">분류/사양</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-right">발주 수량(기준)</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-right">입고 대기(공장)</th>
                    <th className="py-3 px-4 font-semibold text-slate-700">진행 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-3 px-4 font-mono text-xs">{item.id}</td>
                      <td className="py-3 px-4">[{item.category}] {item.type} ({item.size}) - {item.color}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">{item.maxStock} 벌</td>
                      <td className="py-3 px-4 text-right text-emerald-600">{item.factoryStock} 벌</td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600">{item.status}</td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- BUYER_INVENTORY --- */}
        {activeTab === 'BUYER_INVENTORY' && (
          <>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Archive className="w-5 h-5 mr-2 text-blue-500" />
                재고 및 내역 보고서
              </h2>
              <div className="flex gap-2">
                <button onClick={handleBuyerInventoryExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </button>
                <button onClick={() => handlePdfDownload('재고및내역_보고서')} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </button>
              </div>
            </div>
            <div id="report-element" className="p-8 bg-white overflow-x-auto">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold tracking-tighter mb-2">재고 및 내역 보고서</h3>
                <p className="text-sm text-slate-500">생성일자: {todayDate}</p>
              </div>
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200">
                    <th className="py-3 px-4 font-semibold text-slate-700">제품 ID</th>
                    <th className="py-3 px-4 font-semibold text-slate-700">분류/사양</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-right">보유 재고량</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-right">안전 재고 기준</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-center w-20" data-html2canvas-ignore="true">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => {
                     const isLow = item.buyerStock < (item.maxStock * 0.3);
                     return (
                      <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        <td className="py-3 px-4 font-mono text-xs">{item.id}</td>
                        <td className="py-3 px-4">[{item.category}] {item.type} ({item.size}) - {item.color}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                          {item.buyerStock} 벌
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">{item.maxStock} 벌</td>
                        <td className="py-3 px-4 flex justify-center gap-1" data-html2canvas-ignore="true">
                          <button onClick={() => setEditingProduct(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {inventory.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">재고 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 모달 (수정, 삭제) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">제품 정보 관리</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">제품 ID (고유 식별자)</label>
                <input 
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 font-mono" 
                  value={editingProduct.id} 
                  disabled 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">분류</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">타입</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    value={editingProduct.type}
                    onChange={e => {
                      const newType = e.target.value;
                      setEditingProduct({
                        ...editingProduct, 
                        type: newType,
                        size: newType === '하의' ? BOTTOM_SIZES[0] : TOP_SIZES[2]
                      });
                    }}
                  >
                    <option value="상의">상의</option>
                    <option value="하의">하의</option>
                    <option value="세트">세트</option>
                    <option value="안전모">안전모</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">사이즈</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    value={editingProduct.size}
                    onChange={e => setEditingProduct({...editingProduct, size: e.target.value})}
                  >
                    {getSizes(editingProduct.type).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">색상</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    value={editingProduct.color}
                    onChange={e => setEditingProduct({...editingProduct, color: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                <div className="col-span-4 mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">상태</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    value={editingProduct.status}
                    onChange={e => setEditingProduct({...editingProduct, status: e.target.value as any})}
                  >
                    <option value="생산중">생산중</option>
                    <option value="운송중">운송중</option>
                    <option value="통관중">통관중</option>
                    <option value="납품대기">납품대기</option>
                    <option value="정상">정상</option>
                    <option value="부족">부족</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">안전재고</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" 
                    value={editingProduct.maxStock} 
                    onChange={e => setEditingProduct({...editingProduct, maxStock: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">공장 재고</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" 
                    value={editingProduct.factoryStock} 
                    onChange={e => setEditingProduct({...editingProduct, factoryStock: Number(e.target.value)})} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">매입자 재고</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" 
                    value={editingProduct.buyerStock} 
                    onChange={e => setEditingProduct({...editingProduct, buyerStock: Number(e.target.value)})} 
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button 
                onClick={() => setEditingProduct(null)} 
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => handleUpdate(editingProduct)} 
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                저장 및 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">제품 삭제</h3>
              <p className="text-sm text-slate-500">정말로 이 제품을 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-center gap-2">
              <button 
                onClick={() => setDeletingId(null)} 
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors w-full"
              >
                취소
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition-colors shadow-sm w-full"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

