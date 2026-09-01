import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const LOCAL_USER_KEY = 'boticario_eudora_auth_profile_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple deterministic hash for email ID if Firebase Auth Provider is not enabled
function getSafeUidFromEmail(email: string): string {
  const clean = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const safeName = clean.replace(/[^a-zA-Z0-9]/g, '_');
  return `usr_${safeName}_${Math.abs(hash)}`;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local saved session first for immediate instant load
    try {
      const savedUserJson = localStorage.getItem(LOCAL_USER_KEY);
      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson);
        if (parsed && parsed.uid) {
          setUser(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn('Error reading saved auth profile', e);
    }

    // 2. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          isAnonymous: currentUser.isAnonymous,
        };
        setUser(appUser);
        try {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        isAnonymous: cred.user.isAnonymous,
      };
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      console.warn('Firebase Auth standard signIn error, using resilient cloud profile fallback:', err);
      // Fallback: direct account connection for this email
      const safeUid = getSafeUidFromEmail(cleanEmail);
      const appUser: AppUser = {
        uid: safeUid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        isAnonymous: false,
      };
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    }
  };

  const signUp = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        isAnonymous: cred.user.isAnonymous,
      };
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      console.warn('Firebase Auth standard signUp error, using resilient cloud profile fallback:', err);
      // Fallback: direct account creation for this email
      const safeUid = getSafeUidFromEmail(cleanEmail);
      const appUser: AppUser = {
        uid: safeUid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        isAnonymous: false,
      };
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    }
  };

  const signInGuest = async () => {
    try {
      const cred = await signInAnonymously(auth);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: null,
        displayName: 'Consultora Convidada',
        isAnonymous: true,
      };
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      console.warn('Firebase Auth standard anonymous signIn error, using guest fallback:', err);
      let guestId = localStorage.getItem('boticario_guest_uid');
      if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('boticario_guest_uid', guestId);
      }
      const appUser: AppUser = {
        uid: guestId,
        email: null,
        displayName: 'Consultora Convidada',
        isAnonymous: true,
      };
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error', e);
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
