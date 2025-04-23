'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  User 
} from 'firebase/auth';
import { app } from '@/lib/firebase';

type FirebaseError = {
  code: string;
  message: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth(app);

  const clearError = () => setError(null);

  const handleAuthError = (error: FirebaseError) => {
    console.error('Auth error:', error);
    switch (error.code) {
      case 'auth/invalid-email':
        setError('Invalid email address format.');
        break;
      case 'auth/user-disabled':
        setError('This user account has been disabled.');
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        setError('Invalid email or password.');
        break;
      case 'auth/email-already-in-use':
        setError('This email is already in use.');
        break;
      case 'auth/weak-password':
        setError('Password should be at least 6 characters.');
        break;
      case 'auth/operation-not-allowed':
        setError('Operation not allowed.');
        break;
      case 'auth/popup-closed-by-user':
        setError('Sign-in was canceled.');
        break;
      case 'auth/network-request-failed':
        setError('Network error. Please check your connection.');
        break;
      default:
        setError('An error occurred during authentication.');
        break;
    }
  };

  const signInWithGoogle = async () => {
    try {
      clearError();
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      handleAuthError(error as FirebaseError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      clearError();
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      handleAuthError(error as FirebaseError);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (email: string, password: string, name?: string) => {
    try {
      clearError();
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (name && credential.user) {
        await updateProfile(credential.user, {
          displayName: name
        });
        setUser({ ...credential.user });
      }
    } catch (error) {
      handleAuthError(error as FirebaseError);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      clearError();
      await firebaseSignOut(auth);
    } catch (error) {
      handleAuthError(error as FirebaseError);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      signInWithGoogle, 
      signInWithEmail,
      createAccount,
      signOut,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 