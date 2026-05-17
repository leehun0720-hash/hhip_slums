import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { differenceInDays, parseISO } from 'date-fns';
import { Package, Users, AlertTriangle, Clock, Target, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { role, inventory, summary } = useStore();

  // 매입자 모드: 안전 재고 30% 미만 제품 계산
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => (item.buyerStock / item.maxStock) < 0.3);
  }, [inventory]);

  // 공장 모드: 생산중 제품
  const productionItems = useMemo(() => {
    return inventory.filter((item) => item.status === '생산중');
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
  const totalFactoryStock = summary.totalInventoryInStock; // 임의 값 매핑 또는 계산
  const actualFactoryTotal = useMemo(() => inventory.reduce((acc, curr) => acc + curr.factoryStock, 0), [inventory]);
  const actualBuyerTotal = useMemo(() => inventory.reduce((acc, curr) => acc + curr.buyerStock, 0), [inventory]);

  const showFactory = role === 'FACTORY' || role === 'ADMIN';
  const showBuyer = role === 'BUYER' || role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {role === 'ADMIN' ? '통합 대시보드' : role === 'FACTORY' ? '공장 대시보드' : '매입자 대시보드'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {role === 'ADMIN' ? '전체 현황을 통합하여 요약합니다.' : role === 'FACTORY' ? '현재 공장의 생산 현황과 납품 대기(출고) 현황을 요약합니다.' : '물류 재고 및 납품 완료된 입출고 현황을 요약합니다.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showFactory && (
          <>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mr-4">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">출고 대기(생산완료) 물량</p>
                <p className="text-3xl font-light tracking-tight mt-1">{actualFactoryTotal.toLocaleString()} <span className="text-lg text-slate-400 font-normal">벌</span></p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mr-4">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">진행중인 생산 건수</p>
                <p className="text-3xl font-light tracking-tight mt-1">{productionItems.length} <span className="text-lg text-slate-400 font-normal">종류</span></p>
              </div>
            </div>
          </>
        )}
        
        {showBuyer && (
          <>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-4">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">전체 보유 재고 (매입 완료)</p>
                <p className="text-3xl font-light tracking-tight mt-1">{actualBuyerTotal.toLocaleString()} <span className="text-lg text-slate-400 font-normal">벌</span></p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mr-4">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">지급 대상 직원 수</p>
                <p className="text-3xl font-light tracking-tight mt-1">{summary.totalEmployees.toLocaleString()} <span className="text-lg text-slate-400 font-normal">명</span></p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매입자 모드: 안전재고 경고 섹션 */}
        {showBuyer && (
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                재고 부족 알림 (안전재고 30% 미만)
              </h2>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {lowStockItems.length}건
              </span>
            </div>

            <div className="flex-1 space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  부족한 재고가 없습니다. 안전하게 유지 중입니다.
                </div>
              ) : (
                lowStockItems.map(item => {
                  const ratio = Math.round((item.buyerStock / item.maxStock) * 100);
                  return (
                    <div key={item.id} className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 flex justify-between items-center transition-colors hover:bg-orange-50">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">[{item.category}] {item.type} ({item.size})</p>
                        <p className="text-xs text-slate-500 mt-1">ID: {item.id} / 색상: {item.color}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-rose-600">{item.buyerStock} <span className="font-normal text-xs text-rose-400">/ {item.maxStock}</span></p>
                        <p className="text-xs font-semibold text-rose-500 mt-0.5">{ratio}% 보유</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        )}

        {/* 공장/매입자 공통: 생산 리드타임 센션 */}
        <section className={cn("bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col", role === 'FACTORY' ? 'col-span-1 lg:col-span-2' : '')}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-500" />
              {role === 'FACTORY' ? '공장 납품 리드타임 관리' : '생산 진행 및 입고 D-Day'}
            </h2>
          </div>

          <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {productionItems.length === 0 && (
              <div className="h-full col-span-full flex items-center justify-center text-sm text-slate-400 pb-10">
                진행중인 납품 내역이 없습니다.
              </div>
            )}
            
            {productionItems.map(item => {
              const leadTime = calculateLeadTime(item.leadTimeStart, item.leadTimeEnd);
              if (!leadTime) return null;

              return (
                <div key={`lt-${item.id}`} className="p-4 rounded-xl border border-slate-100 bg-slate-50 relative overflow-hidden h-fit">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm flex gap-1">
                        <span className="text-indigo-600">[{item.category}]</span> 
                        {item.type} ({item.size})
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">총 {leadTime.totalDays}일 소요 예상</p>
                    </div>
                    <div className="text-right">
                      {leadTime.remainingDays > 0 ? (
                        <div className="text-xl font-bold text-indigo-600 tracking-tight">D-{leadTime.remainingDays}</div>
                      ) : (
                        <div className="text-lg font-bold text-emerald-600">납품 완료</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-1000",
                        leadTime.progress >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                      )} 
                      style={{ width: `${leadTime.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{role === 'FACTORY' ? '생산 진행률' : '입고 진행률'} {leadTime.progress}%</span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium">기한: {item.leadTimeEnd}</span>
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
