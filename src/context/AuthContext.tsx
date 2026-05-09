import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously, type User } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // After logout, sign in anonymously again to maintain storage access
      await signInAnonymously(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[Auth] Authenticated as:', firebaseUser.uid, firebaseUser.isAnonymous ? '(Anonymous)' : '(Google)');
        setUser({
          ...firebaseUser,
          name: firebaseUser.displayName || 'Dr. Trishnamoni Haloi',
          role: 'Physiotherapist',
          isMock: false
        });
      } else {
        console.log('[Auth] No session, initiating anonymous handover...');
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error('[Auth] Anonymous sync failed. Storage will be locked.', err);
          setUser({ 
              uid: 'default_physio', 
              name: 'Dr. Trishnamoni Haloi',
              role: 'Physiotherapist',
              isMock: true
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
