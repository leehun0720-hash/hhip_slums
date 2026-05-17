import { Box, LayoutDashboard, Barcode, ScanLine, FileBarChart, UserSquare2, Factory, Activity, LogOut, Settings, Key, FileText } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { auth } from '@/lib/firebase';
import { signOut, updatePassword } from 'firebase/auth';
import React, { useState } from 'react';

export default function Layout() {
  const { role, user, notifications, removeNotification } = useStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && newPassword.length >= 6) {
      try {
        await updatePassword(user, newPassword);
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setIsChangingPassword(false);
        setNewPassword('');
      } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/requires-recent-login') {
          alert('보안을 위해 로그아웃 후 다시 로그인한 뒤 시도해주세요.');
          signOut(auth);
        } else {
          alert('오류가 발생했습니다: ' + error.message);
        }
      }
    } else {
      alert('비밀번호는 최소 6자리 이상이어야 합니다.');
    }
  };

  const menuGroups = [
    {
      groupLabel: '공통',
      showFor: ['ADMIN', 'FACTORY', 'BUYER'],
      items: [
        { to: '/', label: '대시보드', icon: LayoutDashboard },
        { to: '/reports', label: '보고서', icon: FileBarChart },
      ]
    },
    {
      groupLabel: '공장',
      showFor: ['ADMIN', 'FACTORY'],
      items: [
        { to: '/product', label: '제품 등록/관리', icon: Barcode },
        { to: '/process', label: '공정 관리', icon: Activity },
        { to: '/scanner', label: '스캐너', icon: ScanLine },
      ]
    },
    {
      groupLabel: '구매자',
      showFor: ['ADMIN', 'BUYER'],
      items: [
        { to: '/buyer-order', label: '신규 발주', icon: Barcode },
        { to: '/buyer-inventory', label: '재고 및 내역', icon: Activity },
      ]
    },
    {
      groupLabel: '관리자 전용',
      showFor: ['ADMIN'],
      items: [
        { to: '/contract', label: '계약서 작성', icon: FileText },
        { to: '/admin', label: '권한 관리', icon: Settings },
      ]
    }
  ];

  // Mobile nav flattened list
  const visibleNavItems = menuGroups.flatMap(group => 
    group.showFor.includes(role || '') ? group.items : []
  );

  return (
    <div className="flex h-screen w-full bg-[#f5f5f5] text-slate-900 font-sans">
      {/* Sidebar - Hidden on mobile, bottom tab on mobile instead */}
      <aside className="w-64 border-r border-[#e5e5e5] bg-white hidden md:flex flex-col">
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#e5e5e5]">
          <div className="flex items-center">
            <Box className="w-6 h-6 mr-3 text-slate-800" />
            <span className="font-bold text-lg tracking-tight">HHIP SLUMS</span>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="text-sm font-semibold truncate">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
              <span className="text-xs text-slate-500">{role}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setIsChangingPassword(true)} title="비밀번호 변경" className="p-2 text-slate-400 hover:text-slate-700 bg-white shadow-sm rounded-lg border border-slate-200">
                <Key className="w-4 h-4" />
              </button>
              <button onClick={() => signOut(auth)} title="로그아웃" className="p-2 text-slate-400 hover:text-slate-700 bg-white shadow-sm rounded-lg border border-slate-200">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {menuGroups.filter(g => g.showFor.includes(role || '')).map(group => (
            <div key={group.groupLabel} className="space-y-1">
              {role === 'ADMIN' && (
                <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupLabel}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => removeNotification(item.to)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {notifications.includes(item.to) && (
                    <span className="absolute right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-[#e5e5e5] bg-white shrink-0 md:hidden">
          <div className="flex items-center">
            <Box className="w-5 h-5 mr-2 text-slate-800" />
            <span className="font-bold text-base tracking-tight">HHIP SLUMS</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-semibold text-slate-600 border border-slate-200 px-2 py-1 rounded bg-slate-50">{role}</span>
             <button onClick={() => setIsChangingPassword(true)} className="text-slate-500 p-1">
               <Key className="w-5 h-5" />
             </button>
             <button onClick={() => signOut(auth)} className="text-slate-500 p-1">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e5e5e5] flex">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => removeNotification(item.to)}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs font-medium transition-colors relative',
                  isActive ? 'text-slate-900' : 'text-slate-500'
                )
              }
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {notifications.includes(item.to) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <span className="truncate w-full text-center px-0.5">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </main>

      {/* Password Change Dialog */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">비밀번호 변경</h3>
              <button onClick={() => setIsChangingPassword(false)} className="text-slate-400 hover:text-slate-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="최소 6자리 이상 기입"
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-slate-500">주의: 이메일 로그인 계정만 변경할 수 있습니다. 구글 로그인은 구글 계정 설정에서 변경해야 합니다.</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  설정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
