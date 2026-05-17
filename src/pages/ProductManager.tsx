import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Barcode from 'react-barcode';
import { PlusCircle, Barcode as BarcodeIcon, Edit2, Trash2, X, Printer, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useStore, Product } from '@/store/useStore';

const TOP_SIZES = ['S (90)', 'M (95)', 'L (100)', 'XL (105)', 'XXL (110)', 'XXXL (115)', 'XXXXL (120)'];
const BOTTOM_SIZES = Array.from({ length: 15 }, (_, i) => `${26 + i}`);
const getSizes = (type: string) => type === '하의' ? BOTTOM_SIZES : TOP_SIZES;

export default function ProductManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, setRole, inventory, addProduct, categories, addCategory, removeCategory, updateProduct, deleteProduct, addNotification } = useStore();
  
  const isBuyerMode = role === 'BUYER' || location.pathname === '/buyer-order';
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (barcodeRef.current) {
      const canvas = await html2canvas(barcodeRef.current);
      const imgData = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head><title>Print Barcode</title></head>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
              <img src="${imgData}" />
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 100);
                }
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  const handleCopyImage = async () => {
    if (barcodeRef.current) {
      try {
        const canvas = await html2canvas(barcodeRef.current);
        canvas.toBlob(async (blob) => {
          if (blob) {
             const item = new ClipboardItem({ 'image/png': blob });
             await navigator.clipboard.write([item]);
             alert('바코드 이미지가 클립보드에 복사되었습니다.');
          }
        });
      } catch (err) {
        console.error('Failed to copy image: ', err);
        alert('클립보드 복사를 지원하지 않는 브라우저입니다.');
      }
    }
  };
  
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: categories[0] || '작업복',
    type: '상의',
    size: 'L (100)',
    color: '네이비',
    initialStock: 100
  });
  
  const [generatedProduct, setGeneratedProduct] = useState<{id: string, data: typeof formData} | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 가짜 ID 생성
    const newId = `PRD-NEW-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    setGeneratedProduct({
      id: newId,
      data: { ...formData }
    });

    const newProduct: Product = {
      id: newId,
      category: formData.category,
      type: formData.type,
      size: formData.size,
      color: formData.color,
      maxStock: formData.initialStock, // 구매자 발주 시 요청 수량이 안전재고
      buyerStock: 0,
      factoryStock: formData.initialStock,
      leadTimeStart: new Date().toISOString(),
      leadTimeEnd: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString(), // 임시 80일 리드타임
      status: '생산중'
    };
    
    addProduct(newProduct);
    
    if (isBuyerMode) {
      addNotification('/process');
      addNotification('/buyer-inventory');
      alert('요청하신 제품의 발주가 공장으로 전달되었습니다. 재고 관리 메뉴에서 내역을 확인하실 수 있습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {isBuyerMode ? '신규 제품 발주 및 등록' : '제품 등록 및 바코드 생성'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isBuyerMode 
            ? '필요한 유니폼의 사양과 수량을 등록하여 공장으로 생산을 요청(발주)합니다.' 
            : '새로운 유니폼을 생산 등록하고 납품/입고 시에 쓸 고유 바코드를 발급합니다.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 입력 폼 영역 */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">제품 분류</label>
                  <button 
                    type="button" 
                    onClick={() => setIsManagingCategories(!isManagingCategories)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {isManagingCategories ? '닫기' : '분류 목록 관리'}
                  </button>
                </div>
                
                {isManagingCategories ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-indigo-400"
                        placeholder="새 분류 이름"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCategoryName.trim()) {
                              addCategory(newCategoryName.trim());
                              setNewCategoryName('');
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            addCategory(newCategoryName.trim());
                            setNewCategoryName('');
                          }
                        }}
                        className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        추가
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {categories.map((cat) => (
                        <li key={cat} className="flex items-center justify-between bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm">
                          <span>{cat}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              if (categories.length > 1) {
                                removeCategory(cat);
                                if (formData.category === cat) {
                                  setFormData({ ...formData, category: categories.find(c => c !== cat) || '' });
                                }
                              } else {
                                alert('최소 1개의 분류가 필요합니다.');
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 font-medium text-xs"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select 
                      className="w-1/3 min-w-[120px] shrink-0 rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                      value={isCustomCategory ? 'custom' : formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCategory(true);
                          setFormData({...formData, category: ''});
                        } else {
                          setIsCustomCategory(false);
                          setFormData({...formData, category: e.target.value});
                        }
                      }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="custom">직접 입력 (1회성)</option>
                    </select>
                    {isCustomCategory && (
                      <input 
                        type="text" 
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="분류를 직접 입력하세요"
                        required
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">타입</label>
                  <select 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData, 
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">사이즈</label>
                  <select 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                  >
                    {getSizes(formData.type).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">색상</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="예: 네이비, 블랙, 카키"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {isBuyerMode ? '발주 수량' : '초기 생산(납품대기)량'}
                  </label>
                  <input 
                    type="number" 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({...formData, initialStock: parseInt(e.target.value) || 0})}
                    placeholder="예: 100"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl py-3.5 px-4 flex items-center justify-center transition-all duration-200 shadow-md shadow-slate-900/10"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {isBuyerMode ? '공장으로 발주 등록' : '신규 생산 분 등록 (입고 처리)'}
            </button>
          </form>
        </div>

        {/* QR 코드 생성 결과 영역 */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white rounded-2xl flex-1 border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center">
                <BarcodeIcon className="w-4 h-4 mr-1.5 text-slate-500" />
                생성된 바코드
              </h3>
              {generatedProduct && (
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="바코드 인쇄">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={handleCopyImage} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="이미지로 복사">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              {generatedProduct ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <div ref={barcodeRef} className="bg-white p-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.06)] border border-slate-100 inline-block print-area max-w-full overflow-x-auto">
                    <Barcode 
                      value={generatedProduct.id} 
                      width={2}
                      height={60}
                      displayValue={false}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-2 font-mono">
                      {generatedProduct.id}
                    </div>
                    <p className="text-lg font-semibold text-slate-800">
                      [{generatedProduct.data.category}] {generatedProduct.data.type}
                    </p>
                    <p className="text-sm text-slate-500">
                      Size: {generatedProduct.data.size} / Color: {generatedProduct.data.color}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 space-y-3">
                  <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-2xl mx-auto flex items-center justify-center">
                    <BarcodeIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm">정보를 입력하고 등록하면<br/>여기에 바코드가 생성됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {(role === 'FACTORY' || role === 'ADMIN') && (
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">등록된 제품 목록</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-700">제품 ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">분류/사양</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-right">초기 생산량 (재고)</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">상태</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-center w-20">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="py-3 px-4">[{item.category}] {item.type} ({item.size}) - {item.color}</td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-600">{item.factoryStock} 벌</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{item.status}</td>
                    <td className="py-3 px-4 flex justify-center gap-1">
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
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">등록된 제품이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
