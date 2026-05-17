import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Shield, UserCog, UserCheck, Clock, Trash2, UserPlus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const secondaryApp = initializeApp(firebaseConfig, "SecondaryAdminApp");
const secondaryAuth = getAuth(secondaryApp);

export default function AdminSettings() {
  const { role } = useStore();
  const [users, setUsers] = useState<any[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('FACTORY');
  const [addError, setAddError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const u = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(u);
    });
    return () => unsub();
  }, [role]);

  const handleUpdateRole = async (userId: string, targetRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: targetRole,
        updatedAt: serverTimestamp()
      });
      alert('권한이 변경되었습니다.');
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setIsLoading(true);
    setAddError('');
    try {
      // Configure secondary auth to NOT persist the session in IndexedDB
      await setPersistence(secondaryAuth, inMemoryPersistence);
      
      // Create user using secondary auth so the admin doesn't get logged out
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUser = userCredential.user;
      
      // Immediately sign out from the secondary app
      await signOut(secondaryAuth);
      
      // Create the user document using the MAIN db connection (admin has permission)
      await setDoc(doc(db, 'users', newUser.uid), {
        email: newUser.email,
        name: newName || newEmail.split('@')[0],
        role: newRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setIsAddingUser(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      alert('새 사용자가 생성되었습니다.');
    } catch (error: any) {
      console.error("Create user error:", error);
      if (error.code === 'auth/operation-not-allowed') {
         setAddError('Firebase 콘솔에서 [Authentication] > [Sign-in method] 메뉴로 이동하여 "이메일/비밀번호" 제공업체를 사용 설정해주세요.');
      } else {
         setAddError(error.message || '사용자 생성에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (role !== 'ADMIN') {
    return <div className="p-8 text-center text-slate-500">접근 권한이 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            권한 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">시스템 사용자의 역할과 권한을 관리합니다.</p>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          사용자 계정 생성
        </button>
      </div>

      {isAddingUser && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">새 사용자 만들기</h2>
            <button onClick={() => setIsAddingUser(false)} className="text-slate-400 hover:text-slate-600">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이메일 *</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl" placeholder="example@test.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">임시 비밀번호 *</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl" placeholder="최소 6자리 기입" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl" placeholder="이름 입력 (생략 시 이메일 앞자리)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">초기 권한 *</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  <option value="FACTORY">공장 (FACTORY)</option>
                  <option value="BUYER">매입자 (BUYER)</option>
                  <option value="ADMIN">관리자 (ADMIN)</option>
                </select>
              </div>
            </div>
            
            {addError && <div className="text-red-500 text-sm mt-2">{addError}</div>}
            
            <div className="flex justify-end pt-4">
              <button disabled={isLoading} type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50">
                {isLoading ? '생성 중...' : '계정 생성 완료'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-3 px-4 font-semibold text-slate-700">이름</th>
              <th className="py-3 px-4 font-semibold text-slate-700">이메일</th>
              <th className="py-3 px-4 font-semibold text-slate-700">현재 상태/역할</th>
              <th className="py-3 px-4 font-semibold text-slate-700 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-900">{user.name}</td>
                <td className="py-3 px-4 text-slate-500">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'FACTORY' ? 'bg-indigo-100 text-indigo-700' :
                    user.role === 'BUYER' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {user.role === 'PENDING' ? <Clock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => handleUpdateRole(user.id, 'FACTORY')} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                    공장 지정
                  </button>
                  <button onClick={() => handleUpdateRole(user.id, 'BUYER')} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                    매입자 지정
                  </button>
                  <button onClick={() => handleUpdateRole(user.id, 'PENDING')} className="text-slate-400 hover:text-red-500 p-1.5 bg-slate-50 rounded-lg hover:bg-red-50 transition-colors" title="접근 제한">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
