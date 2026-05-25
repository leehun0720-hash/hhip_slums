import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { differenceInDays, parseISO } from 'date-fns';
import { Package, Users, AlertTriangle, Clock, Target, Factory, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { role, inventory, summary } = useStore();

  // 매입자 모드: 안전 재고 30% 미만 제품 계산
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => (item.buyerStock / item.maxStock) < 0.3);
  }, [inventory]);

  // 공장 모드: 생산중 제품
  const productionItems = useMemo(() => {
    return inventory.filter((item) => item.status === '생산중' || item.status === '운송중' || item.status === '통관중');
  }, [inventory]);

  // 생산 리드타임 계산 로직
  const calculateLeadTime = (startStr: string | null, endStr: string | null) => {
    if (!startStr || !endStr) return null;
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    const today = new Date();
    
    const totalDays = differenceInDays(end, start);
    const passedDays = differenceInDays(today, start);
    const remainingDays = differenceInDays(end, today);
    
    let progress = Math.round((passedDays / totalDays) * 100);
    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;
    
    return { progress, remainingDays, totalDays };
  };

  // 공장 총 통계량
  const actualFactoryTotal = useMemo(() => inventory.reduce((acc, curr) => acc + curr.factoryStock, 0), [inventory]);
  const actualBuyerTotal = useMemo(() => inventory.reduce((acc, curr) => acc + curr.buyerStock, 0), [inventory]);

  const showFactory = role === 'FACTORY' || role === 'ADMIN';
  const showBuyer = role === 'BUYER' || role === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold tracking-widest text-indigo-200 uppercase">{role} MODE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            {role === 'ADMIN' ? '통합 대시보드' : role === 'FACTORY' ? '공장 관제 센터' : '매입자 관제 센터'}
          </h1>
          <p className="text-indigo-100/80 max-w-lg">
            {role === 'ADMIN' ? '전체 시스템의 실시간 현황을 통합하여 한눈에 파악합니다.' : role === 'FACTORY' ? '현재 공장의 생산 현황과 납품 대기(출고) 물량을 실시간으로 모니터링합니다.' : '입출고 히스토리 및 현재 물류 재고 상황을 실시간으로 추적합니다.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {showFactory && (
          <>
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center group relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mr-5 shrink-0 z-10 shadow-sm">
                <Factory className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-bold text-slate-500 mb-1">출고 대기 물량</p>
                <p className="text-4xl font-black tracking-tighter text-slate-800">{actualFactoryTotal.toLocaleString()} <span className="text-lg text-slate-400 font-bold tracking-normal">벌</span></p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center group relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mr-5 shrink-0 z-10 shadow-sm">
                <Target className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-bold text-slate-500 mb-1">진행중인 생산 건수</p>
                <p className="text-4xl font-black tracking-tighter text-slate-800">{productionItems.length} <span className="text-lg text-slate-400 font-bold tracking-normal">건</span></p>
              </div>
            </div>
          </>
        )}
        
        {showBuyer && (
          <>
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center group relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mr-5 shrink-0 z-10 shadow-sm">
                <Package className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-bold text-slate-500 mb-1">전체 보유 재고</p>
                <p className="text-4xl font-black tracking-tighter text-slate-800">{actualBuyerTotal.toLocaleString()} <span className="text-lg text-slate-400 font-bold tracking-normal">벌</span></p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center group relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mr-5 shrink-0 z-10 shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-sm font-bold text-slate-500 mb-1">지급 대상 직원 수</p>
                <p className="text-4xl font-black tracking-tighter text-slate-800">{summary.totalEmployees.toLocaleString()} <span className="text-lg text-slate-400 font-bold tracking-normal">명</span></p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 매입자 모드: 안전재고 경고 섹션 */}
        {showBuyer && (
          <section className="bg-white rounded-3xl p-7 border border-rose-100 shadow-sm flex flex-col xl:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-orange-400"></div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black flex items-center text-slate-800 tracking-tight">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                재고 부족 알림
              </h2>
              <span className="bg-rose-100 text-rose-700 text-xs font-black px-3 py-1 rounded-full shadow-sm">
                {lowStockItems.length}건
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold">부족한 재고가 없습니다.</p>
                  <p className="text-xs mt-1 text-slate-400">안전하게 유지 중입니다.</p>
                </div>
              ) : (
                lowStockItems.map(item => {
                  const ratio = Math.round((item.buyerStock / item.maxStock) * 100);
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/50 to-rose-50/50 border border-rose-100/50 flex justify-between items-center transition-all hover:shadow-sm">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">[{item.category}] {item.type}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{item.size} / {item.color}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-rose-600 tracking-tight">{item.buyerStock} <span className="font-bold text-[10px] text-rose-400">/ {item.maxStock}</span></p>
                        <div className="w-16 h-1.5 bg-rose-100 rounded-full mt-1.5 ml-auto overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${ratio}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
            {lowStockItems.length > 0 && (
              <Link to="/buyer-order" className="mt-6 flex items-center justify-center w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors shadow-md">
                발주 등록하러 가기 <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            )}
          </section>
        )}

        {/* 생산 리드타임 섹션 */}
        <section className={cn("bg-white rounded-3xl p-7 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden", showBuyer ? 'xl:col-span-2' : 'xl:col-span-3')}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-400"></div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black flex items-center text-slate-800 tracking-tight">
              <Clock className="w-5 h-5 mr-2 text-indigo-500" />
              진행중인 공정 D-Day
            </h2>
            <Link to="/process" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-3 py-1.5 rounded-full transition-colors">
              전체 보기 <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="flex-1 grid grid-cols-1 gap-5 md:grid-cols-2">
            {productionItems.length === 0 && (
              <div className="h-full col-span-full flex flex-col items-center justify-center text-slate-400 py-16">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Factory className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-600">진행중인 공정 내역이 없습니다.</p>
                <p className="text-sm mt-1">새로운 발주를 등록하거나 생산을 시작하세요.</p>
              </div>
            )}
            
            {productionItems.slice(0, 4).map(item => {
              const leadTime = calculateLeadTime(item.leadTimeStart, item.leadTimeEnd);
              if (!leadTime) return null;

              return (
                <div key={`lt-${item.id}`} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors h-fit group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded tracking-wide">
                          {item.status}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{item.id}</span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm">
                        [{item.category}] {item.type} <span className="text-slate-500 font-medium">({item.size})</span>
                      </p>
                    </div>
                    <div className="text-right">
                      {leadTime.remainingDays > 0 ? (
                        <div className="text-2xl font-black text-indigo-600 tracking-tighter drop-shadow-sm">
                          D-{leadTime.remainingDays}
                        </div>
                      ) : (
                        <div className="text-xl font-black text-emerald-600 tracking-tighter drop-shadow-sm">
                          완료 임박
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div className="text-right w-full">
                        <span className="text-[10px] font-bold inline-block text-indigo-600">
                          {leadTime.progress}% 진행
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-slate-200 shadow-inner">
                      <div 
                        style={{ width: `${leadTime.progress}%` }} 
                        className={cn(
                          "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000",
                          leadTime.progress >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                        )}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>시작: {item.leadTimeStart?.split('T')[0]}</span>
                      <span>목표: {item.leadTimeEnd?.split('T')[0]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
