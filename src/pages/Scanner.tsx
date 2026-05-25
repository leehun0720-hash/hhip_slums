import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { PackagePlus, PackageMinus, RefreshCw, SendToBack, UserCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, Employee } from '@/store/useStore';

export default function Scanner() {
  const { role, scanProduct, employees } = useStore();
  const [scanResult, setScanResult] = useState<{ id: string, message: string, success: boolean, type: 'EMPLOYEE' | 'PRODUCT' } | null>(null);
  const [scanMode, setScanMode] = useState<'INBOUND' | 'OUTBOUND' | 'FACTORY_OUTBOUND'>('INBOUND');
  const [scannedEmployee, setScannedEmployee] = useState<Employee | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // 최신 상태를 콜백에서 접근할 수 있도록 ref 사용 (카메라 재시작 방지)
  const stateRef = useRef({ role, scanMode, scannedEmployee, employees, scanProduct });
  useEffect(() => {
    stateRef.current = { role, scanMode, scannedEmployee, employees, scanProduct };
  });

  useEffect(() => {
    // 실제 카메라 환경을 위해 html5-qrcode 스캐너 초기화
    // (모바일 디바이스 또는 웹캠이 있는 경우에만 동작)
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 300, height: 150 },
        videoConstraints: {
          facingMode: "environment"
        },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
        ]
      },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        const { role, scanMode, scannedEmployee, employees, scanProduct } = stateRef.current;
        
        let storeMode: 'FACTORY_OUTBOUND' | 'BUYER_INBOUND' | 'BUYER_OUTBOUND';
        if (role === 'FACTORY' || scanMode === 'FACTORY_OUTBOUND') {
          storeMode = 'FACTORY_OUTBOUND';
        } else {
          storeMode = scanMode === 'INBOUND' ? 'BUYER_INBOUND' : 'BUYER_OUTBOUND';
        }

        if (storeMode === 'BUYER_OUTBOUND') {
           if (!scannedEmployee) {
              const emp = employees.find(e => e.id === decodedText);
              if (emp) {
                 setScannedEmployee(emp);
                 setScanResult({
                     id: decodedText,
                     message: `${emp.name}(${emp.department}) 사원 인식 성공! 이제 유니폼을 스캔하세요.`,
                     success: true,
                     type: 'EMPLOYEE'
                 });
              } else {
                 setScanResult({
                     id: decodedText,
                     message: `등록되지 않은 사번입니다: ${decodedText}. 직원을 먼저 스캔해주세요.`,
                     success: false,
                     type: 'EMPLOYEE'
                 });
              }
              scanner.pause(true);
              return;
           }
        }

        const result = scanProduct(decodedText, storeMode, scannedEmployee?.id);
        
        setScanResult({
            id: decodedText,
            message: result.message,
            success: result.success,
            type: 'PRODUCT'
        });
        
        scanner.pause(true); // 스캔 후 일시정지
      },
      (error) => {}
    );

    return () => {
      scanner.clear().catch(console.error);
      scannerRef.current = null;
    };
  }, []); // 의존성 배열 비움: 컴포넌트 마운트 시 한 번만 실행

  const resetScanner = () => {
    setScanResult(null);
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (e) {
        // In some states resume might throw, fallback to ignoring
      }
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in duration-500 pb-10">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {role === 'FACTORY' ? '공장 납품(출고) 스캐너' : '매입자 입출고 스캐너'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {role === 'FACTORY' ? '생산된 제품의 바코드를 찍어 납품 대기 처리합니다.' : '물품 입고 확인 또는 직원 지급(출고) 처리를 합니다.'}
        </p>
      </div>

      {/* 모드 선택 (매입자/관리자 모드일 때 표시) */}
      {(role === 'BUYER' || role === 'ADMIN') && (
        <div className="bg-slate-100 p-1 rounded-xl flex mb-6 shadow-inner overflow-x-auto hide-scrollbar">
          {(role === 'ADMIN') && (
             <button
              onClick={() => setScanMode('FACTORY_OUTBOUND')}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-all min-w-[max-content]",
                scanMode === 'FACTORY_OUTBOUND' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <SendToBack className="w-4 h-4 mr-2" />
              업체 (공장) 납품 스캔
            </button>
          )}
          <button
            onClick={() => setScanMode('INBOUND')}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-all min-w-[max-content]",
              scanMode === 'INBOUND' 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <PackagePlus className="w-4 h-4 mr-2" />
            매입처 입고 스캔
          </button>
          <button
            onClick={() => setScanMode('OUTBOUND')}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-all min-w-[max-content]",
              scanMode === 'OUTBOUND' 
                ? "bg-white text-rose-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <PackageMinus className="w-4 h-4 mr-2" />
            직원 지급 스캔
          </button>
        </div>
      )}

      {/* 공장 모드일때 고정 라벨 표기 */}
      {role === 'FACTORY' && (
        <div className="bg-slate-100 p-1 rounded-xl flex mb-6 shadow-inner">
          <button className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center bg-white text-indigo-600 shadow-sm cursor-default">
            <SendToBack className="w-4 h-4 mr-2" />
            납품(출고) 처리중
          </button>
        </div>
      )}

      {/* 스캐너 화면 영역 */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 mb-6 relative">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-sm font-medium">
          <span>
            {role === 'FACTORY' || scanMode === 'FACTORY_OUTBOUND' 
              ? '업체 (공장) 납품 스캔 모드' 
              : (scanMode === 'INBOUND' ? '매입처 입고 스캔 모드' : '직원 지급 모드')}
          </span>
          <span className="flex items-center text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
            Ready
          </span>
        </div>
        
        {scanMode === 'OUTBOUND' && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex justify-between items-center text-sm">
            {scannedEmployee ? (
              <>
                <div className="flex items-center text-indigo-700 font-bold">
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  {scannedEmployee.name} ({scannedEmployee.department})
                </div>
                <button 
                  onClick={() => setScannedEmployee(null)} 
                  className="px-3 py-1 bg-white text-indigo-600 rounded-md shadow-sm border border-indigo-100 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  직원 변경
                </button>
              </>
            ) : (
              <div className="text-slate-600 font-bold w-full text-center py-1">
                현재 켜져있는 이 카메라에 직원 사원증(바코드)을 먼저 스캔해주세요.
              </div>
            )}
          </div>
        )}
        
        {/* html5-qrcode가 렌더링될 영역 */}
        <div id="reader" className="w-full bg-black min-h-[300px]"></div>

        {/* 결과 오버레이 */}
        {scanResult && (
          <div className="absolute inset-0 z-10 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center transform animate-in zoom-in slide-in-from-bottom-4 duration-300">
              <div className={cn(
                "w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4",
                scanResult.success ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {scanResult.type === 'EMPLOYEE' 
                   ? <UserCheck className="w-8 h-8" />
                   : (scanResult.success ? <PackagePlus className="w-8 h-8" /> : <PackageMinus className="w-8 h-8" />)}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {scanResult.type === 'EMPLOYEE' ? '직원 스캔' : (scanResult.success ? '처리 완료' : '처리 실패')}
              </h3>
              <p className="text-sm font-semibold text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {scanResult.message}
              </p>
              <button 
                onClick={resetScanner}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium flex items-center justify-center transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다음 스캔하기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs tracking-tight text-slate-400 px-6">
        <p>카메라 권한을 허용해야 스캔이 가능합니다.<br/>바코드를 사각형 안에 위치시켜 주세요.</p>
      </div>

      <style>{`
        #reader { border: none !important; }
        #reader video { max-width: 100% !important; height: auto !important; }
        #reader__dashboard_section_csr span, #reader__dashboard_section_swaplink { color: white !important; font-size: 14px; margin-bottom: 8px;}
        #reader__dashboard_section_csr button { background: #334155 !important; color: white !important; border: none !important; padding: 8px 16px !important; border-radius: 8px !important; font-weight: 600 !important; margin: 4px; }
      `}</style>
    </div>
  );
}
