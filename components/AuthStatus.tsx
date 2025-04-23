'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-sm font-medium">Loading auth...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            className="w-6 h-6 rounded-full"
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