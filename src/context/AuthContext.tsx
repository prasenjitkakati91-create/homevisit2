import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User } from 'firebase/auth';
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
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[Auth] session verified:', firebaseUser.uid);
        setUser({
          ...firebaseUser,
          name: firebaseUser.displayName || 'Dr. Trishnamoni Haloi',
          role: 'Physiotherapist',
          isMock: false
        });
        setLoading(false);
      } else {
        console.log('[Auth] No session, setting default guest user...');
        setUser({ 
            uid: 'default_physio', 
            name: 'Dr. Trishnamoni Haloi',
            role: 'Physiotherapist',
            isMock: true
        });
        setLoading(false);
      }
    }, (error) => {
      console.error('[Auth] critical system error:', error);
      setLoading(false);
    });

    // Seatbelt to ensure app doesn't hang forever
    const authTimeout = setTimeout(() => {
        setLoading(prev => {
            if (prev) {
                console.warn('[Auth] Initialization stall detected, forcing bypass...');
                return false;
            }
            return prev;
        });
    }, 5000);

    return () => {
        unsubscribe();
        clearTimeout(authTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
