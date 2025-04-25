'use client';
// this is a client side component

import { useState, useRef, useEffect } from 'react';
// useState is used to manage the state of the component
// useRef is used to manage the ref of the component
// useEffect is used to manage the effect of the component
import { db } from '@/lib/firebase';
// db is the firebase database
import { doc, updateDoc } from 'firebase/firestore';
// doc is used to get the document from the database
// updateDoc is used to update the document in the database

type Message = {
  id?: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};
// Message is the type of the message object
type BuildingInterfaceProps = {
  projectId: string;
  initialCode?: string;
};
// BuildingInterfaceProps is the type of the props of the component

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
// initialCode is the initial code of the component
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! I'm your AI assistant. How can I help you build your project today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  // messages is the messages of the component
  const [newMessage, setNewMessage] = useState('');
  // newMessage is the new message of the component
  const chatEndRef = useRef<HTMLDivElement>(null);
  // chatEndRef is the ref of the chat end of the component
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Save code to Firebase
  const saveCode = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    // setIsSaving is the is saving of the component
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        code: code,
        updatedAt: new Date()
      });
      // updateDoc is used to update the document in the database
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving code:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };
  // saveCode is the save code of the component
  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const userMessage: Message = {
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    // userMessage is the user message of the component
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // Simulate AI response (in a real app, this would call your AI API)
    setTimeout(() => {
      const aiResponse: Message = {
        text: `I'll help you with that! You might consider updating your code to add more interactive elements.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
  // renderPreview is the render preview of the component
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
      
      <div className="grid grid-cols-12 gap-4 h-[700px]">
        {/* Left panel: Code editor and preview tabs (mobile) */}
        <div className="col-span-12 md:col-span-6 border rounded-lg overflow-hidden flex flex-col">
          <div className="flex border-b bg-gray-100">
            <button 
              className={`py-2 px-4 font-medium ${activeTab === 'code' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
            <button 
              className={`py-2 px-4 font-medium ${activeTab === 'preview' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          </div>
          
          {/* Mobile view: show active tab */}
          <div className={`flex-grow ${activeTab === 'code' ? 'block' : 'hidden'} md:block h-full`}>
            <div className="bg-gray-800 text-white p-2 font-medium">Code Editor</div>
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[calc(100%-40px)] p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none"
            />
          </div>
          
          <div className={`flex-grow ${activeTab === 'preview' ? 'block' : 'hidden'} md:hidden h-full`}>
            <div className="bg-gray-100 p-2 font-medium">Preview</div>
            <div className="h-[calc(100%-40px)] overflow-auto bg-white">
              {renderPreview()}
            </div>
          </div>
        </div>
        
        {/* Middle panel: Preview (desktop only) */}
        <div className="hidden md:block md:col-span-3 border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-2 font-medium">Preview</div>
          <div className="h-[calc(100%-40px)] overflow-auto bg-white">
            {renderPreview()}
          </div>
        </div>
        
        {/* Right panel: Chat */}
        <div className="col-span-12 md:col-span-3 border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-indigo-700 text-white p-2 font-medium">AI Assistant</div>
          <div className="flex-grow overflow-y-auto bg-gray-50 p-3">
            <div className="flex flex-col space-y-3">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`rounded-lg p-3 max-w-[90%] ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white ml-auto' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div 
                    className={`text-xs mt-1 ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          <div className="border-t p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask me how to improve your code..."
                className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          Note: This is a simplified development interface. Chat with the AI assistant for help with your code.
        </p>
      </div>
    </div>
  );
} 