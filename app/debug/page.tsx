'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [envData, setEnvData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkEnv() {
      try {
        setLoading(true);
        const response = await fetch('/api/check-env');
        if (!response.ok) {
          throw new Error(`API response: ${response.status}`);
        }
        const data = await response.json();
        setEnvData(data);
        setError(null);
      } catch (err) {
        console.error('Debug page error:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    checkEnv();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Marble Deployment Debug</h1>
      
      {loading && <p>Loading environment data...</p>}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-6">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      )}
      
      {envData && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="font-bold mb-2">Environment Variables Status</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(envData, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8 bg-yellow-50 p-4 rounded-md">
        <h2 className="font-bold mb-2">Client-Side Rendering Check</h2>
        <p>If you can see this text, client-side rendering is working correctly.</p>
        <p className="mt-2 text-sm text-gray-600">
          Current client time: {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
} 