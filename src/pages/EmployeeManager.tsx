import React, { useState, useRef } from 'react';
import { useStore, Employee } from '@/store/useStore';
import { Upload, Plus, Trash2, Printer, Search, Users, Copy, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import * as XLSX from 'xlsx';

export default function EmployeeManager() {
  const { employees, addEmployee, bulkAddEmployees, deleteEmployee } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handleAddSubmit = () => {
    if (!newName.trim() || !newDept.trim()) {
      alert('이름과 부서를 모두 입력해주세요.');
      return;
    }
    const id = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    addEmployee({
      id,
      name: newName.trim(),
      department: newDept.trim(),
      createdAt: new Date().toISOString()
    });
    setNewName('');
    setNewDept('');
    setIsAdding(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        const newEmployees: Employee[] = [];
        data.forEach((row, i) => {
          const name = row['이름'] || row['성명'] || row['Name'];
          const dept = row['부서'] || row['소속'] || row['Department'];
          
          if (name && dept) {
             const id = row['사번'] || row['ID'] || `EMP-${Math.floor(10000 + Math.random() * 90000)}`;
             newEmployees.push({
               id: id.toString(),
               name: name.toString().trim(),
               department: dept.toString().trim(),
               createdAt: new Date().toISOString()
             });
          }
        });

        if (newEmployees.length > 0) {
          bulkAddEmployees(newEmployees);
          alert(`${newEmployees.length}명의 직원이 성공적으로 등록되었습니다.`);
        } else {
          alert('유효한 데이터(이름, 부서)를 찾지 못했습니다. 첫 줄에 헤더(이름, 부서)가 있는지 확인하세요.');
        }
      } catch (err) {
        console.error(err);
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { '사번': 'EMP-001', '이름': '홍길동', '부서': '영업1팀' },
      { '사번': 'EMP-002', '이름': '김철수', '부서': '물류센터' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "직원등록_양식.xlsx");
  };

  const handlePrintBarcode = () => {
    if (!barcodeRef.current) return;
    const win = window.open('', '_blank');
    if (!win) {
      alert('팝업 차단을 해제해주세요.');
      return;
    }
    const html = barcodeRef.current.innerHTML;
    win.document.write(`
      <html>
        <head>
          <title>직원 바코드 인쇄</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 1.25rem; }
            .text-sm { font-size: 0.875rem; }
            .text-slate-800 { color: #1e293b; }
            .text-slate-500 { color: #64748b; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .print-container { padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="print-container">${html}</div>
          <script>
            window.onload = () => {
              window.focus();
              setTimeout(() => { window.print(); window.close(); }, 200);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleCopyBarcode = async () => {
    if (!barcodeRef.current || !selectedEmployee) return;
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
      const textSpace = 100;
      const scale = 3; // 3배 해상도
      
      const baseWidth = Math.max(originalCanvas.width, 250) + (padding * 2);
      const baseHeight = originalCanvas.height + textSpace + (padding * 2);

      canvas.width = baseWidth * scale;
      canvas.height = baseHeight * scale;
      ctx.scale(scale, scale);
      
      // 흐림 방지
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
      let y = padding + originalCanvas.height + 35;

      // Name
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(selectedEmployee.name, centerX, y);

      // Department
      y += 26;
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.fillText(selectedEmployee.department, centerX, y);

      // ID
      y += 24;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(selectedEmployee.id, centerX, y);

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('이미지 생성에 실패했습니다.');
          return;
        }
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          alert('사원증 바코드가 클립보드에 복사되었습니다. (Ctrl+V로 붙여넣기)');
        }).catch(err => {
          console.error(err);
          alert('클립보드 권한이 없거나 지원하지 않는 브라우저입니다.');
        });
      }, 'image/png');

    } catch (err) {
      console.error(err);
      alert('클립보드에 복사하는 중 오류가 발생했습니다.');
    }
  };

  const filtered = employees.filter(e => 
    e.name.includes(searchTerm) || e.department.includes(searchTerm) || e.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Users className="w-6 h-6 mr-2 text-indigo-600" />
            직원 관리
          </h2>
          <p className="text-slate-500 mt-1">유니폼 지급 대상 직원을 관리하고 바코드를 발급합니다.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-white text-slate-600 rounded-xl font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            엑셀 양식
          </button>
          
          <label className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold shadow-sm border border-indigo-100 hover:bg-indigo-100 transition-all cursor-pointer text-sm">
            <Upload className="w-4 h-4 mr-2" />
            엑셀 등록
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            개별 등록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Employee List */}
        <div className="flex-1 border-r border-slate-100 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="이름, 부서, 사번으로 검색" 
                className="w-full bg-slate-50 border border-transparent rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isAdding && (
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="사번 (선택/자동)" disabled className="w-1/3 px-3 py-2 rounded-lg text-sm bg-slate-100 border border-transparent text-slate-400" />
                  <input type="text" placeholder="이름" value={newName} onChange={e=>setNewName(e.target.value)} className="w-1/3 px-3 py-2 rounded-lg text-sm border border-slate-200" autoFocus />
                  <input type="text" placeholder="부서 (예: 영업부)" value={newDept} onChange={e=>setNewDept(e.target.value)} className="w-1/3 px-3 py-2 rounded-lg text-sm border border-slate-200" onKeyDown={e => e.key === 'Enter' && handleAddSubmit()} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">취소</button>
                  <button onClick={handleAddSubmit} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">등록 완료</button>
                </div>
              </div>
            )}

            {filtered.length === 0 && !isAdding ? (
              <div className="text-center py-12 text-slate-500">등록된 직원이 없거나 검색 결과가 없습니다.</div>
            ) : (
              filtered.map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedEmployee?.id === emp.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedEmployee?.id === emp.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{emp.name}</h4>
                      <p className="text-xs text-slate-500">{emp.department} • {emp.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteEmployee(emp.id); if(selectedEmployee?.id===emp.id) setSelectedEmployee(null); }}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Barcode Preview */}
        <div className="w-full md:w-80 bg-slate-50 flex flex-col items-center justify-center p-8 relative">
          {selectedEmployee ? (
            <div className="w-full animate-in zoom-in-95 duration-300 flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">사원증 바코드 발급</h3>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center w-full relative group">
                <div ref={barcodeRef} className="flex flex-col items-center">
                  <Barcode 
                    value={selectedEmployee.id}
                    height={50}
                    width={2}
                    displayValue={false}
                    margin={0}
                    renderer="canvas"
                  />
                  <div className="mt-4 font-bold text-lg text-slate-800">{selectedEmployee.name}</div>
                  <div className="text-sm text-slate-500">{selectedEmployee.department}</div>
                  <div className="mt-1 text-xs font-mono text-slate-400">{selectedEmployee.id}</div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 w-full">
                <button onClick={handlePrintBarcode} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-sm">
                  <Printer className="w-4 h-4" />
                  인쇄
                </button>
                <button onClick={handleCopyBarcode} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-all shadow-sm">
                  <Copy className="w-4 h-4" />
                  이미지 복사
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center mt-4">
                이 바코드를 인쇄하여 사원증에 부착하면<br/>재고 지급 시 스캐너로 빠른 출고가 가능합니다.
              </p>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>좌측에서 직원을 선택하면<br/>바코드를 발급할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
