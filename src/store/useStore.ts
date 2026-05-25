import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export type Role = 'FACTORY' | 'BUYER' | 'ADMIN' | 'PENDING' | 'LOADING';
export type ProductStatus = '생산중' | '운송중' | '통관중' | '납품대기' | '정상' | '부족';
export type TransactionType = 'IN' | 'OUT' | 'ADJUST' | 'INIT';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  reason: string;
  by: string; // user role or email
  employeeId?: string; // Optional: Linked employee for outbound
  employeeName?: string;
}

export interface Employee {
  id: string; // Format: EMP-0001
  name: string;
  department: string;
  createdAt: string;
}

export interface Product {
  id: string;
  category: string;
  type: string;
  size: string;
  color: string;
  maxStock: number;
  buyerStock: number;
  factoryStock: number;
  leadTimeStart: string | null;
  leadTimeEnd: string | null;
  status: ProductStatus;
  history: Transaction[];
}

export interface StoreState {
  role: Role;
  setRole: (role: Role) => void;
  user: any | null; // Firebase User
  setUser: (user: any | null) => void;
  inventory: Product[];
  setInventory: (inventory: Product[]) => void;
  categories: string[];
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  summary: { totalEmployees: number; totalInventoryInStock: number };
  addProduct: (p: Product) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductStatus: (id: string, status: ProductStatus) => void;
  adjustStock: (id: string, amount: number, reason: string, by: string, employeeId?: string, employeeName?: string) => void;
  completeDelivery: (id: string, by: string) => void;
  scanProduct: (id: string, mode: 'FACTORY_OUTBOUND' | 'BUYER_INBOUND' | 'BUYER_OUTBOUND', scannedEmployeeId?: string) => { success: boolean; message: string };
  notifications: string[];
  addNotification: (path: string) => void;
  removeNotification: (path: string) => void;

  // Employee State
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  bulkAddEmployees: (employees: Employee[]) => void;
}

const initialInventory: Product[] = [
  { id: 'PRD-0001', category: '작업복', type: '상의', size: 'L (100)', color: '네이비', maxStock: 100, buyerStock: 25, factoryStock: 50, leadTimeStart: '2026-03-01', leadTimeEnd: '2026-05-30', status: '생산중', history: [] },
  { id: 'PRD-0002', category: '작업복', type: '하의', size: '32', color: '네이비', maxStock: 100, buyerStock: 80, factoryStock: 0, leadTimeStart: null, leadTimeEnd: null, status: '정상', history: [] },
  { id: 'PRD-0003', category: '근무복', type: '상의', size: 'M (95)', color: '화이트', maxStock: 50, buyerStock: 10, factoryStock: 30, leadTimeStart: '2026-04-15', leadTimeEnd: '2026-07-14', status: '생산중', history: [] },
];

export const useStore = create<StoreState>((set) => ({
  role: 'LOADING', 
  setRole: (role) => set({ role }),
  user: null,
  setUser: (user) => set({ user }),
  inventory: initialInventory,
  setInventory: (inventory) => set({ inventory }),
  categories: ['작업복', '근무복', '안전장비'],
  addCategory: (category) => set((state) => ({ 
    categories: state.categories.includes(category) ? state.categories : [...state.categories, category] 
  })),
  removeCategory: (category) => set((state) => ({ 
    categories: state.categories.filter(c => c !== category) 
  })),
  summary: { totalEmployees: 450, totalInventoryInStock: 2150 },
  employees: [],
  setEmployees: (employees) => set({ employees }),
  addEmployee: (employee) => {
    setDoc(doc(db, 'employees', employee.id), employee).catch(console.error);
    set((state) => ({ employees: [...state.employees, employee] }));
  },
  deleteEmployee: (id) => {
    deleteDoc(doc(db, 'employees', id)).catch(console.error);
    set((state) => ({ employees: state.employees.filter((e) => e.id !== id) }));
  },
  bulkAddEmployees: (newEmployees) => {
    newEmployees.forEach(emp => {
      setDoc(doc(db, 'employees', emp.id), emp).catch(console.error);
    });
    set((state) => ({ employees: [...state.employees, ...newEmployees] }));
  },
  addProduct: (p) => {
    // Ensure history is initialized
    const newProduct = { ...p, history: p.history || [] };
    if (newProduct.history.length === 0) {
      newProduct.history.push({
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        type: 'INIT',
        amount: newProduct.factoryStock,
        reason: '초기 생산 등록',
        by: 'System'
      });
    }
    setDoc(doc(db, 'products', p.id), newProduct).catch(console.error);
    set((state) => ({ inventory: [...state.inventory, newProduct] }));
  },
  updateProduct: (id, updated) => {
    updateDoc(doc(db, 'products', id), updated).catch(console.error);
    set((state) => ({
      inventory: state.inventory.map((item) => (item.id === id ? { ...item, ...updated } : item)),
    }));
  },
  deleteProduct: (id) => {
    deleteDoc(doc(db, 'products', id)).catch(console.error);
    set((state) => ({
      inventory: state.inventory.filter((item) => item.id !== id),
    }));
  },
  updateProductStatus: (id, status) => {
    updateDoc(doc(db, 'products', id), { status }).catch(console.error);
    set((state) => ({
      inventory: state.inventory.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  },
  adjustStock: async (id, amount, reason, by, employeeId, employeeName) => {
    const item = useStore.getState().inventory.find(i => i.id === id);
    if (!item) return;
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      type: 'ADJUST',
      amount,
      reason,
      by,
      employeeId,
      employeeName
    };
    
    const newBuyerStock = Number(item.buyerStock) + Number(amount);
    const newHistory = [...(item.history || []), newTx];
    
    try {
      await updateDoc(doc(db, 'products', id), { buyerStock: newBuyerStock, history: newHistory });
    } catch (err) {
      console.error(err);
      return;
    }
    
    set((state) => ({
      inventory: state.inventory.map((i) => (i.id === id ? { ...i, buyerStock: newBuyerStock, history: newHistory } : i)),
    }));
  },
  completeDelivery: async (id, by) => {
    const item = useStore.getState().inventory.find(i => i.id === id);
    if (!item) return;

    const newBuyerStock = Number(item.buyerStock) + Number(item.factoryStock);
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      type: 'IN',
      amount: item.factoryStock,
      reason: '공장 납품 완료',
      by
    };
    
    const newHistory = [...(item.history || []), newTx];
    const updatedStock = { buyerStock: newBuyerStock, factoryStock: 0, status: '정상' as ProductStatus, history: newHistory };
    
    try {
      await updateDoc(doc(db, 'products', id), updatedStock);
      alert('납품이 확정되어 구매자(매입자) 재고에 추가되었습니다.');
    } catch (err: any) {
      console.error('Delivery update error:', err);
      alert('재고 업데이트에 실패했습니다: ' + err.message);
      return; 
    }

    set((state) => ({
      inventory: state.inventory.map((i) => (i.id === id ? { ...i, ...updatedStock } : i)),
    }));
  },
  notifications: [],
  addNotification: (path) => set((state) => ({ notifications: Array.from(new Set([...state.notifications, path])) })),
  removeNotification: (path) => set((state) => ({ notifications: state.notifications.filter(p => p !== path) })),
  scanProduct: (id, mode, scannedEmployeeId) => {
    let resultMessage = '';
    let resultSuccess = false;
    let pendingUpdate: any = null;
    let updateId: string | null = null;
    
    set((state) => {
      const newInventory = state.inventory.map((item) => {
        if (!id.includes(item.id)) return item;

        updateId = item.id;
        const currentHistory = item.history || [];
        
        if (mode === 'FACTORY_OUTBOUND') {
          if (item.factoryStock > 0) {
            resultSuccess = true;
            resultMessage = `[${item.id}] 공장 출고 성공! 매입자로 1건 납품 되었습니다.`;
            
            const newTx: Transaction = {
              id: Math.random().toString(36).substring(2, 9),
              date: new Date().toISOString(),
              type: 'IN',
              amount: 1,
              reason: '스캐너: 매입자 직접 입고',
              by: 'Scanner'
            };
            
            pendingUpdate = { factoryStock: item.factoryStock - 1, buyerStock: item.buyerStock + 1, history: [...currentHistory, newTx] };
            return { ...item, ...pendingUpdate };
          } else {
            resultMessage = `[${item.id}] 공장 재고가 부족하여 출고할 수 없습니다.`;
          }
        } else if (mode === 'BUYER_INBOUND') {
          resultSuccess = true;
          resultMessage = `[${item.id}] 매입 입고 확인! 재고 1건이 추가되었습니다.`;
          
          const newTx: Transaction = {
             id: Math.random().toString(36).substring(2, 9),
             date: new Date().toISOString(),
             type: 'IN',
             amount: 1,
             reason: '스캐너: 입고 처리',
             by: 'Scanner'
          };
          pendingUpdate = { buyerStock: item.buyerStock + 1, history: [...currentHistory, newTx] };
          return { ...item, ...pendingUpdate };
        } else if (mode === 'BUYER_OUTBOUND') {
          if (item.buyerStock > 0) {
            resultSuccess = true;
            
            let employeeInfo = {};
            if (scannedEmployeeId) {
               const emp = state.employees.find(e => e.id === scannedEmployeeId);
               if (emp) {
                 employeeInfo = { employeeId: emp.id, employeeName: emp.name };
                 resultMessage = `[${item.id}] ${emp.name}(${emp.department}) 직원에게 지급 (출고) 완료!`;
               } else {
                 resultMessage = `[${item.id}] 등록되지 않은 직원 ID입니다. 재고만 차감됩니다.`;
               }
            } else {
               resultMessage = `[${item.id}] 직원 지급 (출고) 완료! 재고가 1건 차감되었습니다.`;
            }
            
            const newTx: Transaction = {
             id: Math.random().toString(36).substring(2, 9),
             date: new Date().toISOString(),
             type: 'OUT',
             amount: -1,
             reason: scannedEmployeeId ? '스캐너: 직원 지급' : '스캐너: 일반 출고',
             by: 'Scanner',
             ...employeeInfo
            };
            pendingUpdate = { buyerStock: item.buyerStock - 1, history: [...currentHistory, newTx] };
            return { ...item, ...pendingUpdate };
          } else {
            resultMessage = `[${item.id}] 매입처 재고가 부족하여 출고할 수 없습니다.`;
          }
        }
        return item;
      });
      return { inventory: newInventory };
    });
    
    if (resultSuccess && updateId && pendingUpdate) {
       updateDoc(doc(db, 'products', updateId), pendingUpdate).catch(console.error);
    }
    
    return { success: resultSuccess, message: resultMessage || '등록되지 않은 상품입니다.' };
  }
}));
