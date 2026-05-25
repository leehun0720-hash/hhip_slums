import React, { useState } from 'react';
import { useStore, Product, Transaction } from '@/store/useStore';
import { Package, Search, Edit2, Trash2, X, Box, History, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

const TOP_SIZES = ['S (90)', 'M (95)', 'L (100)', 'XL (105)', 'XXL (110)', 'XXXL (115)', 'XXXXL (120)'];
const BOTTOM_SIZES = Array.from({ length: 15 }, (_, i) => `${26 + i}`);
const getSizes = (type: string) => type === '하의' ? BOTTOM_SIZES : TOP_SIZES;

export default function BuyerInventory() {
  const { inventory, categories, updateProduct, deleteProduct, adjustStock, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const filteredInventory = inventory.filter(item => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = (updated: Product) => {
    updateProduct(updated.id, updated);
    setEditingProduct(null);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteProduct(deletingId);
      setDeletingId(null);
    }
  };

  const handleAdjustSubmit = () => {
    if (adjustingProduct && adjustAmount !== 0 && adjustReason.trim() !== '') {
      const email = user?.email || 'Unknown User';
      adjustStock(adjustingProduct.id, adjustAmount, adjustReason, email);
      
      // Update local state of adjustingProduct so modal shows updated history immediately
      const newTx: Transaction = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        type: 'ADJUST',
        amount: adjustAmount,
        reason: adjustReason,
        by: email
      };
      setAdjustingProduct({
        ...adjustingProduct,
        buyerStock: Number(adjustingProduct.buyerStock) + Number(adjustAmount),
        history: [...(adjustingProduct.history || []), newTx]
      });

      setAdjustAmount(0);
      setAdjustReason('');
    } else {
      alert('변동 수량과 사유를 모두 입력해주세요.');
    }
  };

  const renderTransactionType = (type: string) => {
    switch (type) {
      case 'IN': return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">입고</span>;
      case 'OUT': return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">출고</span>;
      case 'ADJUST': return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">조정</span>;
      case 'INIT': return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">초기등록</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">{type}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            재고 및 내역 관리
          </h1>
          <p className="text-sm text-slate-600 mt-1">발주하신 제품의 내역을 확인하고 현재 보유 중인 재고를 실시간으로 추적합니다.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input 
            type="text" 
            placeholder="제품명, 카테고리 등 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-none shadow-sm rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80 backdrop-blur-sm transition-all"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-5 font-semibold text-slate-700">제품 정보</th>
                <th className="py-4 px-5 font-semibold text-slate-700 text-right">보유 재고량</th>
                <th className="py-4 px-5 font-semibold text-slate-700 text-right">안전 기준</th>
                <th className="py-4 px-5 font-semibold text-slate-700">상태</th>
                <th className="py-4 px-5 font-semibold text-slate-700 text-center w-32">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {filteredInventory.map(item => {
                const isLowStock = item.status === '정상' && item.buyerStock < (item.maxStock * 0.3); // 30% 이하
                
                return (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-slate-400 mb-0.5">{item.id}</span>
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">{item.category}</span>
                          {item.type}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{item.size} / {item.color}</div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-xl font-bold tracking-tight ${isLowStock ? 'text-rose-600' : 'text-blue-600'}`}>
                          {item.buyerStock.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">벌</span>
                        {item.factoryStock > 0 && item.status !== '정상' && (
                           <div className="text-[11px] text-emerald-600 font-semibold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                             +{item.factoryStock} 입고 대기
                           </div>
                        )}
                        {isLowStock && (
                           <div className="text-[10px] text-rose-500 font-bold mt-1 bg-rose-50 px-1.5 py-0.5 rounded inline-block animate-pulse">
                             재고 부족 주의
                           </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right text-slate-500 font-medium">
                      {item.maxStock.toLocaleString()} 벌
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                        item.status === '생산중' || item.status === '운송중' || item.status === '통관중'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : item.status === '납품대기'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setAdjustingProduct(item)} 
                          className="p-2 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-xl transition-all shadow-sm bg-white border border-indigo-100"
                          title="재고 변동 및 이력"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingProduct(item)} 
                          className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-xl transition-all shadow-sm bg-white border border-slate-200"
                          title="정보 수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingId(item.id)} 
                          className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm bg-white border border-rose-100"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
                    <Box className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    검색 결과가 없거나 아직 등록된 제품 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal (Legacy but styled better) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 transform transition-all scale-100">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">제품 정보 수정</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">제품 ID</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 font-mono" 
                  value={editingProduct.id} 
                  disabled 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">분류</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-shadow"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">타입</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-shadow"
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
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">사이즈</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-shadow"
                    value={editingProduct.size}
                    onChange={e => setEditingProduct({...editingProduct, size: e.target.value})}
                  >
                    {getSizes(editingProduct.type).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">색상</label>
                  <input 
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-shadow"
                    value={editingProduct.color}
                    onChange={e => setEditingProduct({...editingProduct, color: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2">
                 <label className="block text-xs font-bold text-slate-500 mb-1.5">안전 기준 수량</label>
                 <input 
                   type="number" 
                   className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-shadow" 
                   value={editingProduct.maxStock} 
                   onChange={e => setEditingProduct({...editingProduct, maxStock: Number(e.target.value)})} 
                 />
                 <p className="text-[10px] text-slate-400 mt-1">※ 실제 재고 조정은 히스토리 관리를 위해 [재고 변동 및 이력] 버튼을 사용해 주세요.</p>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingProduct(null)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => handleUpdate(editingProduct)} 
                className="px-5 py-2.5 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors shadow-md shadow-slate-900/10"
              >
                저장 및 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust & History Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row">
            
            {/* Left: History Timeline */}
            <div className="w-full md:w-3/5 bg-slate-50 flex flex-col h-full max-h-[50vh] md:max-h-[90vh]">
              <div className="p-6 border-b border-slate-200 bg-white">
                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                  <History className="w-5 h-5 mr-2 text-indigo-500" />
                  입출고 히스토리
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">{adjustingProduct.id} | {adjustingProduct.type}({adjustingProduct.size})</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {adjustingProduct.history && adjustingProduct.history.length > 0 ? (
                    [...adjustingProduct.history].reverse().map((tx) => (
                      <div key={tx.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          tx.type === 'IN' || tx.amount > 0 ? 'bg-emerald-500' : tx.type === 'OUT' || tx.amount < 0 ? 'bg-rose-500' : 'bg-indigo-500'
                        }`} />
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {renderTransactionType(tx.type)}
                              <span className="text-xs font-bold text-slate-500">
                                {format(new Date(tx.date), 'yyyy.MM.dd HH:mm')}
                              </span>
                            </div>
                            <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-600' : tx.amount < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">{tx.reason}</p>
                          <p className="text-[10px] text-slate-400 mt-1.5 text-right">담당: {tx.by}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 text-sm py-10">기록된 히스토리가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Adjustment Form */}
            <div className="w-full md:w-2/5 bg-white flex flex-col border-t md:border-t-0 md:border-l border-slate-200 h-full max-h-[50vh] md:max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                  <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-500" />
                  수동 재고 조정
                </h3>
                <button onClick={() => setAdjustingProduct(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
                
                <div className="text-center bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">현재 보유 재고</p>
                  <p className="text-5xl font-black text-blue-700 tracking-tighter">{adjustingProduct.buyerStock}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">변동 수량 (-, +)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold text-center focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-shadow" 
                        value={adjustAmount || ''} 
                        onChange={(e) => setAdjustAmount(Number(e.target.value))}
                        placeholder="0"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                        <button onClick={() => setAdjustAmount(prev => prev + 1)} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-emerald-100 hover:text-emerald-700"><TrendingUp className="w-4 h-4"/></button>
                        <button onClick={() => setAdjustAmount(prev => prev - 1)} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-rose-100 hover:text-rose-700"><TrendingDown className="w-4 h-4"/></button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-center">차감 시 -를 붙이거나 아래 화살표를 누르세요.</p>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-700 mb-2">조정 사유</label>
                     <input 
                        type="text" 
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-shadow" 
                        value={adjustReason} 
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="예: 샘플 증정, 불량 폐기 등"
                      />
                  </div>
                </div>

                <button 
                  onClick={handleAdjustSubmit} 
                  disabled={!adjustAmount || !adjustReason}
                  className="w-full py-3.5 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                >
                  기록 추가 및 반영
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Modal (Legacy) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-800">내역 삭제</h3>
              <p className="text-sm text-slate-500 leading-relaxed">이 발주 내역/재고를 목록에서 완전히 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center gap-2">
              <button 
                onClick={() => setDeletingId(null)} 
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors w-full"
              >
                취소
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2.5 text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 w-full"
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
