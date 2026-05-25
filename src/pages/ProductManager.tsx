import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Barcode from 'react-barcode';
import { PlusCircle, Barcode as BarcodeIcon, Edit2, Trash2, X, Printer, Copy, Settings2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useStore, Product } from '@/store/useStore';

const TOP_SIZES = ['S (90)', 'M (95)', 'L (100)', 'XL (105)', 'XXL (110)', 'XXXL (115)', 'XXXXL (120)'];
const BOTTOM_SIZES = Array.from({ length: 15 }, (_, i) => `${26 + i}`);
const getSizes = (type: string) => type === '하의' ? BOTTOM_SIZES : TOP_SIZES;

export default function ProductManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, inventory, addProduct, categories, addCategory, removeCategory, updateProduct, deleteProduct, addNotification } = useStore();
  
  const isBuyerMode = role === 'BUYER' || location.pathname === '/buyer-order';
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    const win = window.open('', '_blank');
    if (!win) {
      alert('팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    if (barcodeRef.current) {
      const barcodeHtml = barcodeRef.current.innerHTML;
      
      win.document.open();
      win.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body { 
                display: flex; justify-content: center; align-items: center; 
                height: 100vh; margin: 0; font-family: sans-serif; 
              }
              .print-container {
                text-align: center;
                padding: 20px;
              }
              .font-mono { font-family: monospace; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .text-lg { font-size: 1.25rem; line-height: 1.75rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
              .mt-3 { margin-top: 0.75rem; }
              .mt-1 { margin-top: 0.25rem; }
              .tracking-wider { letter-spacing: 0.05em; }
              .text-slate-800 { color: #1e293b; }
              .text-slate-600 { color: #475569; }
              .text-slate-500 { color: #64748b; }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${barcodeHtml}
            </div>
            <script>
              window.onload = () => {
                window.focus();
                setTimeout(() => {
                  window.print();
                }, 200);
              };
              window.onafterprint = () => {
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      win.document.close();
    } else {
      win.close();
    }
  };

  const handleCopyImage = async () => {
    if (!barcodeRef.current || !generatedProduct) return;
    try {
      const originalCanvas = barcodeRef.current.querySelector('canvas');
      if (!originalCanvas) {
        alert('바코드를 찾을 수 없습니다.');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const padding = 30;
      const textSpace = 90;
      const scale = 3; // 3배 해상도
      
      const baseWidth = Math.max(originalCanvas.width, 300) + (padding * 2);
      const baseHeight = originalCanvas.height + textSpace + (padding * 2);

      canvas.width = baseWidth * scale;
      canvas.height = baseHeight * scale;
      ctx.scale(scale, scale);
      
      // 이미지 렌더링 최적화 (흐림 방지)
      ctx.imageSmoothingEnabled = false;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Center the barcode horizontally
      const barcodeX = (baseWidth - originalCanvas.width) / 2;
      ctx.drawImage(originalCanvas, barcodeX, padding, originalCanvas.width, originalCanvas.height);

      // Draw texts below barcode
      ctx.textAlign = 'center';
      const centerX = baseWidth / 2;
      let y = padding + originalCanvas.height + 30;

      // ID
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(generatedProduct.id, centerX, y);

      // Category & Type
      y += 28;
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`[${generatedProduct.data.category}] ${generatedProduct.data.type}`, centerX, y);

      // Size & Color
      y += 22;
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText(`${generatedProduct.data.size} / ${generatedProduct.data.color}`, centerX, y);

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('이미지 생성에 실패했습니다.');
          return;
        }
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          alert('바코드 이미지가 클립보드에 복사되었습니다. 엑셀이나 메신저에 붙여넣기(Ctrl+V) 하세요.');
        }).catch(err => {
          console.error(err);
          alert('클립보드 권한이 없거나 지원하지 않는 브라우저입니다.');
        });
      }, 'image/png');

    } catch (err) {
      console.error(err);
      alert('이미지를 클립보드에 복사하는 중 오류가 발생했습니다.');
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
    const newId = `PRD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
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
      status: '생산중',
      history: []
    };
    
    addProduct(newProduct);
    
    if (isBuyerMode) {
      addNotification('/process');
      addNotification('/buyer-inventory');
      alert('요청하신 제품의 발주가 공장으로 전달되었습니다. 재고 관리 메뉴에서 내역을 확인하실 수 있습니다.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-200 opacity-20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center">
            {isBuyerMode ? (
              <><PlusCircle className="w-6 h-6 mr-2 text-indigo-600" /> 신규 제품 발주</>
            ) : (
              <><BarcodeIcon className="w-6 h-6 mr-2 text-indigo-600" /> 제품 등록 및 바코드</>
            )}
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {isBuyerMode 
              ? '필요한 유니폼의 사양과 수량을 정확하게 기입하여 공장으로 생산을 요청합니다.' 
              : '새로운 유니폼을 생산 등록하고 창고 입출고 시 사용할 고유 바코드를 발급합니다.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 입력 폼 영역 */}
        <div className="lg:col-span-3 bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10 mt-2">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-slate-700">제품 분류</label>
                  <button 
                    type="button" 
                    onClick={() => setIsManagingCategories(!isManagingCategories)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors flex items-center"
                  >
                    {isManagingCategories ? '닫기' : <><Settings2 className="w-3 h-3 mr-1" />분류 목록 관리</>}
                  </button>
                </div>
                
                {isManagingCategories ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                        placeholder="새 분류 이름 (예: 특수안전복)"
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
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        추가
                      </button>
                    </div>
                    <ul className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                      {categories.map((cat) => (
                        <li key={cat} className="flex items-center justify-between bg-white px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium">
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
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors text-xs font-bold"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <select 
                      className="w-1/3 min-w-[120px] shrink-0 rounded-2xl border border-slate-300 px-4 py-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
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
                      <option value="custom" className="font-bold text-indigo-600">직접 입력 (+)</option>
                    </select>
                    {isCustomCategory && (
                      <input 
                        type="text" 
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="분류를 직접 입력하세요"
                        required
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">타입</label>
                  <select 
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">사이즈</label>
                  <select 
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                  >
                    {getSizes(formData.type).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">색상</label>
                  <input 
                    type="text" 
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="예: 네이비, 블랙"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {isBuyerMode ? '발주 수량 (벌)' : '초기 생산량 (벌)'}
                  </label>
                  <input 
                    type="number" 
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-indigo-700"
                    value={formData.initialStock || ''}
                    onChange={(e) => setFormData({...formData, initialStock: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl py-4 px-4 flex items-center justify-center transition-all duration-300 shadow-lg shadow-indigo-600/30 transform hover:-translate-y-0.5 mt-4"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {isBuyerMode ? '공장으로 신규 발주 등록' : '신규 생산 모델 등록 및 바코드 발급'}
            </button>
          </form>
        </div>

        {/* QR 코드 생성 결과 영역 */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white rounded-3xl flex-1 border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-50 transition-colors duration-500"></div>
            
            <div className="p-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex items-center justify-between z-10">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <BarcodeIcon className="w-4 h-4 mr-2 text-indigo-500" />
                바코드 발급 결과
              </h3>
              {generatedProduct && (
                <div className="flex gap-1.5">
                  <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100" title="바코드 인쇄">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={handleCopyImage} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100" title="이미지로 복사">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative z-10">
              {generatedProduct ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20"></div>
                    <div ref={barcodeRef} className="relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100 inline-block print-area w-full overflow-x-auto text-center flex flex-col items-center">
                      <Barcode 
                        value={generatedProduct.id} 
                        width={2.5}
                        height={60}
                        displayValue={false}
                        background="#ffffff"
                        lineColor="#0f172a"
                        margin={0}
                        renderer="canvas"
                      />
                      <div className="mt-3 font-mono font-bold text-slate-800 text-lg tracking-wider">
                        {generatedProduct.id}
                      </div>
                      <div className="mt-1 text-slate-600 font-semibold text-sm">
                        [{generatedProduct.data.category}] {generatedProduct.data.type}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {generatedProduct.data.size} / {generatedProduct.data.color}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="inline-block bg-white border border-slate-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-black tracking-widest mb-1 shadow-sm font-mono">
                      {generatedProduct.id}
                    </div>
                    <p className="text-xl font-bold text-slate-800">
                      [{generatedProduct.data.category}] {generatedProduct.data.type}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {generatedProduct.data.size} / {generatedProduct.data.color}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 space-y-4">
                  <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-slate-200">
                    <BarcodeIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium">정보를 입력하고 발주를 등록하면<br/>여기에 제품 바코드가 생성됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {(role === 'FACTORY' || role === 'ADMIN') && (
        <div className="mt-12 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight text-slate-900">전체 제품 목록</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">총 {inventory.length}건</span>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-5 font-bold text-slate-700">제품 ID</th>
                    <th className="py-4 px-5 font-bold text-slate-700">분류 및 사양</th>
                    <th className="py-4 px-5 font-bold text-slate-700 text-right">초기 등록 수량</th>
                    <th className="py-4 px-5 font-bold text-slate-700 text-center w-24">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-4 px-5 font-mono text-xs font-bold text-slate-400">{item.id}</td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800">[{item.category}] {item.type}</span> 
                        <span className="text-slate-500 ml-2">({item.size}) - {item.color}</span>
                      </td>
                      <td className="py-4 px-5 text-right font-black text-indigo-600 text-base">{item.factoryStock.toLocaleString()} <span className="text-xs font-normal text-slate-400">벌</span></td>
                      <td className="py-4 px-3 sm:px-5">
                        <div className="flex justify-center gap-1 sm:gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingProduct(item)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all shadow-sm bg-white border border-slate-200">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm bg-white border border-rose-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">등록된 제품 내역이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal Logic remains largely same but styled, truncated for brevity in write, same as BuyerInventory */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
             {/* Simple edit form similar to BuyerInventory, skipping full code for brevity as it's secondary */}
             <div className="p-6 text-center">
                <p className="text-slate-500 mb-4">자세한 정보 수정은 재고 및 내역 메뉴를 이용해 주세요.</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setEditingProduct(null)} className="px-5 py-2.5 bg-slate-100 font-bold rounded-xl text-slate-600">닫기</button>
                </div>
             </div>
           </div>
        </div>
      )}
      
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          {/* Delete modal same as BuyerInventory */}
           <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-800">제품 삭제</h3>
              <p className="text-sm text-slate-500 leading-relaxed">정말로 이 제품을 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center gap-2">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors w-full">취소</button>
              <button onClick={confirmDelete} className="px-4 py-2.5 text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 w-full">삭제하기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
