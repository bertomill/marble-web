'use client';
// use client is used to ensure that the component is rendered on the client side
// the client side is the browser that the user is using to view the page

import { useAuth } from '@/contexts/AuthContext';
// useAuth is used to access the authentication context
// the authentication context is used to manage the user's authentication state
//the authentication state is stored in the user object
// The user object contains the user's authentication data
import Image from 'next/image';
// Image is used to display the user's profile picture

export default function AuthStatus() {
  const { user, loading } = useAuth();
  // useAuth is used to access the authentication context
  if (loading) {
    return <div className="text-sm font-medium">Loading auth...</div>;
  }

  // if the user is loading, return a loading message

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

  // if the user is not authenticated, return a not authenticated message

  return <div className="text-sm font-medium">Not authenticated</div>;
} 

// this component is used to display the user's authentication status