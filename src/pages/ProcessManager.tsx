import { useStore, ProductStatus } from '@/store/useStore';
import { ArrowRight, PackageOpen, Truck, Landmark, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const STATUS_FLOW: ProductStatus[] = ['생산중', '운송중', '통관중', '납품대기'];

const STATUS_ICONS = {
  '생산중': PackageOpen,
  '운송중': Truck,
  '통관중': Landmark,
  '납품대기': CheckCircle,
};

export default function ProcessManager() {
  const { inventory, updateProductStatus, categories, user } = useStore();

  // 제품 분류별로 그룹화
  const groupedInventory = useMemo(() => {
    const groups: Record<string, typeof inventory> = {};
    categories.forEach(cat => groups[cat] = []);
    
    inventory.forEach(item => {
      // 팩토리 모드에서 관리 가능한 상태인 것들만 표시
      if (STATUS_FLOW.includes(item.status)) {
        if (!groups[item.category]) {
          groups[item.category] = [];
        }
        groups[item.category].push(item);
      }
    });

    return groups;
  }, [inventory, categories]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">공정 상태 관리</h1>
        <p className="text-sm text-slate-500 mt-1">제품 분류별로 현재 공정(생산/운송/통관) 상태를 관리합니다.</p>
      </div>

      <div className="space-y-6">
        {Object.entries<any[]>(groupedInventory).map(([category, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                  {category}
                </h2>
              </div>
              
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 font-mono tracking-wider">
                          {item.id}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-900">
                        {item.type} ({item.size}) - {item.color}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        납품 대기 수량: {item.factoryStock}벌
                      </p>
                    </div>

                    {/* 상태 변경 플로우 */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar shrink-0">
                      {STATUS_FLOW.map((status, index) => {
                        const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
                        const isActive = item.status === status;
                        const isPast = STATUS_FLOW.indexOf(item.status) > index; // 이미 지나간 상태인지 여부 (옵션)
                        
                        return (
                          <div key={status} className="flex items-center">
                            <button
                              onClick={() => updateProductStatus(item.id, status)}
                              className={cn(
                                "flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all duration-200 border-2",
                                isActive 
                                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                                  : isPast 
                                    ? "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                    : "bg-white border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                              )}
                            >
                              <Icon className={cn("w-6 h-6 mb-1.5", isActive ? "text-indigo-600" : "")} />
                              <span className={cn("text-xs font-semibold", isActive ? "text-indigo-700" : "")}>
                                {status}
                              </span>
                            </button>
                            {index < STATUS_FLOW.length - 1 && (
                              <ArrowRight className={cn(
                                "w-4 h-4 mx-2",
                                item.status === STATUS_FLOW[index + 1] ? "text-indigo-400" : "text-slate-300"
                              )} />
                            )}
                          </div>
                        );
                      })}
                      {item.status === '납품대기' && (
                        <>
                          <ArrowRight className="w-4 h-4 mx-2 text-emerald-400" />
                          <button
                            onClick={() => {
                              if (confirm('납품을 완료 처리하고 구매자 재고에 추가하시겠습니까?')) {
                                useStore.getState().completeDelivery(item.id, user?.email || 'Unknown');
                              }
                            }}
                            className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-700 shadow-sm hover:bg-emerald-100 transition-all duration-200"
                          >
                            <CheckCircle className="w-6 h-6 mb-1.5 text-emerald-600" />
                            <span className="text-xs font-semibold text-emerald-700">납품 완료</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {Object.values<any[]>(groupedInventory).every(items => items.length === 0) && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">관리할 진행중인 공정 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
