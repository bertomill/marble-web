'use client';

// This is the AuthContext component

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

// FirebaseError is the type of the error of the firebase

type FirebaseError = {
  code: string;
  message: string;
};

// AuthContextType is the type of the context of the auth

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

// AuthContext is the context of the auth
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth(app);

  const clearError = () => setError(null);

  // handleAuthError is the function of the auth

  const handleAuthError = (error: FirebaseError) => {
    console.error('Auth error:', error);
    switch (error.code) {
      // auth/invalid-email is the error of the auth
      case 'auth/invalid-email':
        setError('Invalid email address format.');
        break;
      // auth/user-disabled is the error of the auth
      case 'auth/user-disabled':
        setError('This user account has been disabled.');
        break;
      // auth/user-not-found is the error of the auth
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        setError('Invalid email or password.');
        break;
      // auth/email-already-in-use is the error of the auth
      case 'auth/email-already-in-use':
        setError('This email is already in use.');
        break;
      // auth/weak-password is the error of the auth
      case 'auth/weak-password':
        setError('Password should be at least 6 characters.');
        break;
      // auth/operation-not-allowed is the error of the auth
      case 'auth/operation-not-allowed':
        setError('Operation not allowed.');
        break;
      // auth/popup-closed-by-user is the error of the auth
      case 'auth/popup-closed-by-user':
        setError('Sign-in was canceled.');
        break;
      // auth/network-request-failed is the error of the auth
      case 'auth/network-request-failed':
        setError('Network error. Please check your connection.');
        break;
      default:
        // default is the error of the auth
        setError('An error occurred during authentication.');
        break;
    }
  };

  // signInWithGoogle is the function of the auth

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

  // createAccount is the function of the auth

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

    // signOut is the function of the auth
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

    // unsubscribe is the function of the auth

    return () => unsubscribe();
  }, [auth]);

  // return is the return of the auth

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

// useAuth is the function of the auth

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 

// useAuth is the function of the auth