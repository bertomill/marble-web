'use client';

import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-sm font-medium">Loading auth...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && (
          <Image 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            width={24}
            height={24}
            className="rounded-full"
          />
        )}
        <span className="text-sm font-medium">
          {user.displayName || user.email || 'Authenticated User'}
        </span>
      </div>
    );
  }

  return <div className="text-sm font-medium">Not authenticated</div>;
} 