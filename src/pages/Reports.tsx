import { useState } from 'react';
import { useStore, Product } from '@/store/useStore';
import { downloadExcel, downloadPDF } from '@/lib/exportUtils';
import { FileSpreadsheet, FileText, CheckCircle, Edit2, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

const TOP_SIZES = ['S (90)', 'M (95)', 'L (100)', 'XL (105)', 'XXL (110)', 'XXXL (115)', 'XXXXL (120)'];
const BOTTOM_SIZES = Array.from({ length: 15 }, (_, i) => `${26 + i}`);
const getSizes = (type: string) => type === '하의' ? BOTTOM_SIZES : TOP_SIZES;

export default function Reports() {
  const { role, inventory, categories, updateProduct, deleteProduct } = useStore();
  const todayDate = format(new Date(), 'yyyy-MM-dd');

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

  // 다운로드 핸들러 - 공장용
  const handleFactoryExcel = () => {
    const excelData = inventory.map(item => ({
      '제품 ID': item.id,
      '분류': item.category,
      '타입': item.type,
      '요약': `[${item.size}] ${item.color}`,
      '공장재고 (출고대기)': item.factoryStock,
      '상태': item.status
    }));
    downloadExcel(excelData, `공장출고_확인보고서_${todayDate}`);
  };

  const handleFactoryPdf = () => {
    downloadPDF('factory-report-element', `공장출고_확인보고서_${todayDate}`);
  };

  // 다운로드 핸들러 - 매입자용
  const handleBuyerExcel = () => {
    const excelData = inventory.map(item => ({
      '제품 ID': item.id,
      '분류': item.category,
      '타입': item.type,
      '요약': `[${item.size}] ${item.color}`,
      '정상 안전재고량': item.maxStock,
      '현재 보유재고': item.buyerStock,
      '상태': item.buyerStock < (item.maxStock * 0.3) ? '재고 부족' : '정상'
    }));
    downloadExcel(excelData, `매입자_재고관리_보고서_${todayDate}`);
  };

  const handleBuyerPdf = () => {
    downloadPDF('buyer-report-element', `매입자_재고관리_보고서_${todayDate}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">보고서 내보내기</h1>
        <p className="text-sm text-slate-500 mt-1">
          {role === 'FACTORY' 
            ? '공장 출고 확인을 위한 내보내기 및 인쇄 기능을 제공합니다.' 
            : '매입자 실시간 재고 관리 및 결산 보고서를 내보냅니다.'}
        </p>
      </div>

      {role === 'FACTORY' && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-indigo-500" />
              공장 출고확인 보고서
            </h2>
            <div className="flex gap-2">
              <button onClick={handleFactoryExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel 다운로드
              </button>
              <button onClick={handleFactoryPdf} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                <FileText className="w-4 h-4 mr-2" />
                PDF 다운로드
              </button>
            </div>
          </div>
          
          {/* PDF 캡처 대상 뷰 (화면에 보여주면서 동시에 캡처용으로 사용) */}
          <div id="factory-report-element" className="p-8 bg-white overflow-x-auto">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold tracking-tighter mb-2">출고 확인 보고서</h3>
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
              </tbody>
            </table>
          </div>
        </section>
      )}

      {role === 'BUYER' && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
              매입자 재고관리 보고서
            </h2>
            <div className="flex gap-2">
              <button onClick={handleBuyerExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel 다운로드
              </button>
              <button onClick={handleBuyerPdf} className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                <FileText className="w-4 h-4 mr-2" />
                PDF 다운로드
              </button>
            </div>
          </div>
          
          <div id="buyer-report-element" className="p-8 bg-white overflow-x-auto">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold tracking-tighter mb-2">재고 관리 보고서</h3>
              <p className="text-sm text-slate-500">생성일자: {todayDate}</p>
            </div>
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="py-3 px-4 font-semibold text-slate-700">제품 ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">분류/사양</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-right">보유 재고량</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-right">기준 재고량</th>
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
              </tbody>
            </table>
          </div>
        </section>
      )}

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
