'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-red-600">Something went wrong</h1>
          <div className="my-4 p-4 bg-gray-100 rounded-md w-full text-left overflow-auto">
            <p className="text-sm font-mono text-gray-800">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs font-mono text-gray-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <p className="text-gray-600 mb-6">
            This might be due to a temporary issue or missing configuration.
          </p>
          
          <div className="flex flex-col space-y-3 w-full">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            
            <Link
              href="/debug"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
            >
              View debug info
            </Link>
            
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 text-gray-800 rounded-md hover:bg-gray-100 transition-colors text-center"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 