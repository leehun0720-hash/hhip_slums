import React, { useState } from 'react';
import { useStore, Product } from '@/store/useStore';
import { Package, Search, Edit2, Trash2, X, Box } from 'lucide-react';

const TOP_SIZES = ['S (90)', 'M (95)', 'L (100)', 'XL (105)', 'XXL (110)', 'XXXL (115)', 'XXXXL (120)'];
const BOTTOM_SIZES = Array.from({ length: 15 }, (_, i) => `${26 + i}`);
const getSizes = (type: string) => type === '하의' ? BOTTOM_SIZES : TOP_SIZES;

export default function BuyerInventory() {
  const { inventory, categories, updateProduct, deleteProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteProduct(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">재고 및 내역 관리</h1>
          <p className="text-sm text-slate-500 mt-1">발주하신 제품의 내역을 확인하고 현재 보유 중인 재고를 관리합니다.</p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="제품 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-700">제품 ID</th>
                <th className="py-3 px-4 font-semibold text-slate-700">분류/사양</th>
                <th className="py-3 px-4 font-semibold text-slate-700 text-right">보유 재고량</th>
                <th className="py-3 px-4 font-semibold text-slate-700 text-right">안전 기준 수량</th>
                <th className="py-3 px-4 font-semibold text-slate-700">상태</th>
                <th className="py-3 px-4 font-semibold text-slate-700 text-center w-20">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map(item => {
                const isLowStock = item.status === '정상' && item.buyerStock < (item.maxStock * 0.2); // 20% 미만이면 위험
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="py-3 px-4 pt-4">
                      <div className="font-medium text-slate-900">[{item.category}] {item.type}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.size} / {item.color}</div>
                    </td>
                    <td className="py-3 px-4 pt-4 text-right">
                      <span className={`font-semibold ${isLowStock ? 'text-rose-600' : 'text-blue-600'}`}>
                        {item.buyerStock} 
                      </span>
                      <span className="text-slate-500 ml-1">벌</span>
                      {item.factoryStock > 0 && item.status !== '정상' && (
                         <div className="text-[11px] text-emerald-600 font-medium mt-1">
                           +{item.factoryStock}벌 입고/납품대기
                         </div>
                      )}
                      {isLowStock && (
                         <div className="text-[10px] text-rose-500 mt-1">재고 부족</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">{item.maxStock} 벌</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.status === '생산중' || item.status === '운송중' || item.status === '통관중'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === '납품대기'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex justify-center gap-1 mt-2">
                      <button onClick={() => setEditingProduct(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    검색 결과가 없거나 아직 등록된 제품 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">재고 정보 관리</h3>
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">타입</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    value={editingProduct.color}
                    onChange={e => setEditingProduct({...editingProduct, color: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">현재 보유 재고</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-400" 
                    value={editingProduct.buyerStock} 
                    onChange={e => setEditingProduct({...editingProduct, buyerStock: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">안전 기준 수량</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-slate-500" 
                    value={editingProduct.maxStock} 
                    onChange={e => setEditingProduct({...editingProduct, maxStock: Number(e.target.value)})} 
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
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
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
              <h3 className="text-lg font-bold text-slate-800">내역 삭제</h3>
              <p className="text-sm text-slate-500">이 발주 내역/재고를 목록에서 완전히 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</p>
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
