'use client';

import { ReactNode, Suspense } from 'react';
import { FirebaseErrorBoundary } from './FirebaseErrorBoundary';

export default function ClientErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FirebaseErrorBoundary>
        {children}
      </FirebaseErrorBoundary>
    </Suspense>
  );
} 