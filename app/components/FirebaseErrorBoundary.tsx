'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';

interface FirebaseErrorBoundaryProps {
  children: ReactNode;
}

export function FirebaseErrorBoundary({ children }: FirebaseErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    // Check if Firebase is properly initialized
    const checkFirebase = async () => {
      try {
        // Try to dynamically import firebase
        const { auth } = await import('../../lib/firebase');
        
        // If auth is an empty object, it means Firebase failed to initialize
        if (!auth || Object.keys(auth).length === 0) {
          throw new Error('Firebase authentication not properly initialized');
        }
        
        // Reset error state if Firebase is properly initialized
        setHasError(false);
        setErrorMessage('');
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize Firebase');
      }
    };
    
    checkFirebase();
  }, []);
  
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-red-600">Firebase Connection Error</h1>
            <div className="my-4 p-4 bg-gray-100 rounded-md w-full text-left overflow-auto">
              <p className="text-sm font-mono text-gray-800">{errorMessage}</p>
            </div>
            <p className="text-gray-600 mb-6">
              This application requires Firebase to function properly. Please check your configuration.
            </p>
            
            <div className="flex flex-col space-y-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
              
              <Link
                href="/debug"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
              >
                View debug info
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 