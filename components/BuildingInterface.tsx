'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type BuildingInterfaceProps = {
  projectId: string;
  initialCode?: string;
};

export default function BuildingInterface({ projectId, initialCode = '' }: BuildingInterfaceProps) {
  const [code, setCode] = useState(initialCode || 
`// Edit your code here
import React from 'react';

export default function App() {
  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Hello World</h1>
        <p className="text-gray-600">
          This is a preview of your application. Edit the code on the left to see changes.
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Click me
        </button>
      </div>
    </div>
  );
}`);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Save code to Firebase
  const saveCode = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        code: code,
        updatedAt: new Date()
      });
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving code:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // This is a very basic preview implementation
  // In a real app, you would use an iframe or more sophisticated approach
  const renderPreview = () => {
    try {
      // This is just a visual representation - in a real app you would
      // need to properly sandbox and render the code
      return (
        <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Hello World</h1>
            <p className="text-gray-600">
              This is a preview of your application. Edit the code on the left to see changes.
            </p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Click me
            </button>
          </div>
        </div>
      );
    } catch (e) {
      return (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          Error rendering preview: {(e as Error).message}
        </div>
      );
    }
  };

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Building Your Project</h3>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="text-green-600 text-sm">Changes saved successfully!</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 text-sm">Error saving changes</span>
          )}
          <button 
            onClick={saveCode}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      <div className="flex border rounded-lg overflow-hidden h-[600px]">
        {/* Code Editor */}
        <div className="w-1/2 border-r">
          <div className="bg-gray-800 text-white p-2 font-medium">Code Editor</div>
          <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[calc(100%-40px)] p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none"
          />
        </div>
        
        {/* Preview */}
        <div className="w-1/2">
          <div className="bg-gray-100 p-2 font-medium">Preview</div>
          <div className="h-[calc(100%-40px)] overflow-auto bg-white">
            {renderPreview()}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          Note: This is a simplified preview. In a real application, you would have a more advanced
          code editor and live preview capabilities.
        </p>
      </div>
    </div>
  );
} 