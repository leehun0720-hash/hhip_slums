import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection } from 'firebase/firestore';
import { useStore, Product } from '../store/useStore';
import { Box, LogIn, UserPlus } from 'lucide-react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { role, setRole, setUser, user, setInventory } = useStore();
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Firebase 콘솔에서 "이메일/비밀번호" 로그인을 활성화해주세요.');
      } else if (error.code === 'auth/invalid-credential') {
        setAuthError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setAuthError(error.message || '인증에 실패했습니다.');
      }
    }
  };

  useEffect(() => {
    let timeout: any;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch or create user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (error) {
          console.error("Error fetching user doc:", error);
          setLoading(false);
          setRole('LOADING');
          return;
        }
        
        let currentRole = 'PENDING';
        
        if (userDoc.exists()) {
          currentRole = userDoc.data().role;
          // Force admin if email matches
          if (currentUser.email === 'leehun0720@gmail.com' && currentRole !== 'ADMIN') {
             currentRole = 'ADMIN';
             try {
                await setDoc(userDocRef, { role: 'ADMIN', updatedAt: serverTimestamp() }, { merge: true });
             } catch (error) {
                console.error("Failed to force admin role:", error);
             }
          }
        } else {
          // If first user, make admin
          const newRole = currentUser.email === 'leehun0720@gmail.com' ? 'ADMIN' : 'PENDING';
          currentRole = newRole;
          
          try {
            await setDoc(userDocRef, {
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown User',
              role: newRole,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (error) {
            console.error("Failed to create user doc:", error);
          }
        }
        
        setRole(currentRole as any);
        setLoading(false);

      } else {
        setRole('LOADING');
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, [setRole, setUser]);

  // Listen for user document role changes
  useEffect(() => {
    let unsubUser: (() => void) | undefined;
    if (user) {
      unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          setRole(snap.data().role as any);
        }
      }, (error) => {
        console.error("User document subscription error:", error);
      });
    }
    return () => {
      if (unsubUser) unsubUser();
    };
  }, [user, setRole]);

  // Listen for products if authorized
  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    if (user && role !== 'PENDING' && role !== 'LOADING') {
      unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snap) => {
          const products: Product[] = [];
          snap.forEach(doc => {
             products.push(doc.data() as Product);
          });
          setInventory(products);
        },
        (error) => {
          console.error("Products subscription error:", error);
        }
      );
    } else {
      setInventory([]);
    }
    return () => {
      if (unsubProducts) unsubProducts();
    };
  }, [user, role, setInventory]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin text-slate-400">
           <Box className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[#f5f5f5] p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <Box className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-2xl text-center font-bold tracking-tight text-slate-900 mb-2">HHIP SLUMS</h1>
          <p className="text-slate-500 text-center mb-6 text-sm">진입을 위해 로그인이 필요합니다.</p>
          
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="********"
              />
            </div>
            
            {authError && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
            >
              {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isRegistering ? '회원가입' : '로그인'}
            </button>
            <div className="text-center mt-2 flex items-center justify-center gap-2 text-xs">
              <span className="text-slate-500">{isRegistering ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}</span>
              <button 
                type="button" 
                onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                className="text-indigo-600 font-semibold hover:underline"
              >
                {isRegistering ? '로그인하기' : '가입하기'}
              </button>
            </div>
          </form>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-slate-400">또는</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
            className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google 계정으로 시작하기
          </button>
        </div>
      </div>
    );
  }

  if (role === 'PENDING') {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[#f5f5f5] p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
           <div className="flex justify-center mb-6">
            <Box className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">승인 대기 중</h2>
          <p className="text-slate-500 text-sm mb-8">관리자의 승인이 필요합니다. 관리자에게 문의해 주세요.</p>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
