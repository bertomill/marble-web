'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FileTreeItem = {
  name: string;
  path: string;
  type: string;
  active?: boolean;
  children?: FileTreeItem[];
};

type Message = {
  id?: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

type ProjectContext = {
  name: string;
  description: string;
  businessType: string;
  goals: string;
  targetAudience: string;
  userFlow: string;
  features: string[];
  techStack: string[];
};

type EnhancedCodeEditorProps = {
  projectId: string;
  initialCode?: string;
  projectContext?: ProjectContext;
};

export default function EnhancedCodeEditor({ 
  projectId, 
  initialCode = '',
  projectContext
}: EnhancedCodeEditorProps) {
  const { user } = useAuth();
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'terminal'>('code');
  const [activeSection, setActiveSection] = useState<'editor' | 'assistant'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! I'm your AI assistant. How can I help you build your project today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([
    { name: 'index.html', path: '/index.html', type: 'file' },
    { name: 'styles.css', path: '/styles.css', type: 'file' },
    { name: 'app.js', path: '/app.js', type: 'file', active: true },
    { name: 'components', path: '/components', type: 'folder', children: [
      { name: 'Header.jsx', path: '/components/Header.jsx', type: 'file' },
      { name: 'Footer.jsx', path: '/components/Footer.jsx', type: 'file' }
    ]}
  ]);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Save code to Firebase
  const saveCode = async () => {
    if (!user) return;

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

  // Send a new message to AI assistant
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const userMessage: Message = {
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // In a real implementation, you would call your AI API here
    // and pass the project context to give the AI more information
    setIsAIGenerating(true);
    
    setTimeout(() => {
      let aiResponse: Message;
      
      // Check if message is about the project context
      if (newMessage.toLowerCase().includes('about this project') || 
          newMessage.toLowerCase().includes('what is this project')) {
        aiResponse = {
          text: `This project is for a ${projectContext?.businessType || 'business'} called "${projectContext?.name || 'Your Project'}". 
          
The goal is to ${projectContext?.goals || 'build a web application'} targeting ${projectContext?.targetAudience || 'users'}. 

I can help you implement any of the planned features including: ${projectContext?.features?.join(', ') || 'various web features'}.`,
          sender: 'assistant',
          timestamp: new Date()
        };
      } else if (newMessage.toLowerCase().includes('generate') || 
                newMessage.includes('create') ||
                newMessage.includes('build')) {
        // Generate some example code based on the request
        aiResponse = {
          text: `I'll help you implement that. Here's some code to get started:

\`\`\`jsx
import React, { useState } from 'react';

function FeatureComponent() {
  const [isActive, setIsActive] = useState(false);
  
  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-2">New Feature</h2>
      <p className="text-gray-600 mb-4">
        This is a new feature component based on your request.
      </p>
      <button 
        className={\`px-4 py-2 rounded \${isActive ? 'bg-green-500' : 'bg-blue-500'} text-white\`}
        onClick={() => setIsActive(!isActive)}
      >
        {isActive ? 'Activated' : 'Activate Feature'}
      </button>
    </div>
  );
}

export default FeatureComponent;
\`\`\`

Would you like me to update the main code with this component?`,
          sender: 'assistant',
          timestamp: new Date()
        };
      } else {
        aiResponse = {
          text: `I'll help you with that! Based on your project details, I recommend using a modern React approach with clean UI components and responsive design. 

Let me know if you'd like me to help you implement a specific feature or explain any part of the code.`,
          sender: 'assistant',
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
      setIsAIGenerating(false);
    }, 1500);
  };

  // Generate code based on a prompt
  const generateCode = async () => {
    if (!generationPrompt.trim()) return;
    
    setIsAIGenerating(true);
    
    // In a real implementation, you would call your AI API here
    setTimeout(() => {
      // Example generated code
      const generatedCode = `import React, { useState, useEffect } from 'react';

// ${generationPrompt}
export default function GeneratedComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from an API
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        const response = await fetch('https://api.example.com/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Generated Component</h2>
      <p className="text-gray-600 mb-6">${generationPrompt}</p>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`;
      
      setCode(generatedCode);
      setGenerationPrompt('');
      setIsAIGenerating(false);
      setActiveTab('code');
    }, 2000);
  };

  // Download the code
  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'app.jsx';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Simple preview renderer
  const renderPreview = () => {
    try {
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
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold">Building Your Project</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSection('editor')}
              className={activeSection === 'editor' ? 'bg-zinc-100' : ''}
            >
              Editor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSection('assistant')}
              className={activeSection === 'assistant' ? 'bg-zinc-100' : ''}
            >
              AI Assistant
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="text-green-600 text-sm">Changes saved successfully!</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 text-sm">Error saving changes</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </Button>
          <Button 
            onClick={saveCode}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4" style={{ height: '700px' }}>
        {/* Left sidebar: File explorer */}
        <div className="col-span-2 border rounded-lg overflow-hidden bg-zinc-50">
          <div className="bg-zinc-800 text-white p-2 text-sm font-medium flex justify-between items-center">
            <span>Files</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-zinc-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="overflow-y-auto h-[calc(100%-36px)] p-2">
            {fileTree.map((item) => (
              <div key={item.path} className="mb-1">
                {item.type === 'file' ? (
                  <div 
                    className={`flex items-center p-1.5 rounded cursor-pointer text-sm ${item.active ? 'bg-blue-100 text-blue-800' : 'hover:bg-zinc-200'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-zinc-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    {item.name}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center p-1.5 rounded cursor-pointer text-sm hover:bg-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-zinc-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      {item.name}
                    </div>
                    <div className="ml-4">
                      {item.children?.map((child) => (
                        <div 
                          key={child.path}
                          className={`flex items-center p-1.5 rounded cursor-pointer text-sm ${child.active ? 'bg-blue-100 text-blue-800' : 'hover:bg-zinc-200'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 text-zinc-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          {child.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main area: Editor or Assistant */}
        {activeSection === 'editor' ? (
          <>
            {/* Middle panel: Code editor and tabs */}
            <div className="col-span-7 border rounded-lg overflow-hidden flex flex-col">
              <Tabs defaultValue="code" className="w-full h-full">
                <TabsList className="bg-zinc-800 w-full justify-start rounded-none border-b border-zinc-700 px-2">
                  <TabsTrigger 
                    value="code" 
                    className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
                  >
                    Code
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preview" 
                    className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
                  >
                    Preview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="terminal" 
                    className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400"
                  >
                    Terminal
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="code" className="h-[calc(100%-43px)] m-0 p-0">
                  <div className="bg-zinc-800 text-white p-2 text-sm flex items-center gap-2 border-b border-zinc-700">
                    <span className="font-mono">app.js</span>
                  </div>
                  <textarea 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-[calc(100%-36px)] p-4 font-mono text-sm bg-zinc-900 text-gray-100 resize-none focus:outline-none"
                  />
                </TabsContent>
                <TabsContent value="preview" className="h-[calc(100%-43px)] m-0 p-0">
                  <div className="bg-zinc-800 text-white p-2 text-sm">Preview</div>
                  <div className="h-[calc(100%-36px)] overflow-auto bg-white">
                    {renderPreview()}
                  </div>
                </TabsContent>
                <TabsContent value="terminal" className="h-[calc(100%-43px)] m-0 p-0">
                  <div className="bg-zinc-800 text-white p-2 text-sm">Terminal</div>
                  <div className="h-[calc(100%-36px)] bg-black text-green-400 p-3 font-mono text-sm overflow-auto">
                    <p>$ npm start</p>
                    <p>Starting development server...</p>
                    <p>Compiled successfully!</p>
                    <p>Local: http://localhost:3000</p>
                    <p className="animate-pulse">_</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right panel: AI code generation */}
            <div className="col-span-3 border rounded-lg overflow-hidden flex flex-col">
              <div className="bg-indigo-700 text-white p-2 text-sm font-medium">AI Code Generator</div>
              <div className="p-3 bg-white flex-grow flex flex-col gap-3">
                <p className="text-sm text-zinc-600">Describe what you want to create, and the AI will generate code for it.</p>
                <textarea
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="E.g., Create a responsive navigation bar with dropdown menus"
                  className="w-full h-32 p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <Button
                  onClick={generateCode}
                  disabled={isAIGenerating || !generationPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                >
                  {isAIGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Code'
                  )}
                </Button>
                
                <div className="bg-zinc-50 rounded-md p-3 mt-3 flex-grow">
                  <h4 className="font-medium text-sm mb-2">Project Context</h4>
                  <div className="text-xs text-zinc-600 space-y-2">
                    <p><span className="font-semibold">Project:</span> {projectContext?.name || 'Your Project'}</p>
                    <p><span className="font-semibold">Business Type:</span> {projectContext?.businessType || 'N/A'}</p>
                    <p><span className="font-semibold">Goals:</span> {projectContext?.goals || 'N/A'}</p>
                    <p><span className="font-semibold">Target Audience:</span> {projectContext?.targetAudience || 'N/A'}</p>
                    {projectContext?.features && projectContext.features.length > 0 && (
                      <div>
                        <p className="font-semibold">Key Features:</p>
                        <ul className="list-disc list-inside ml-2">
                          {projectContext.features.slice(0, 3).map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                          {projectContext.features.length > 3 && <li>+ {projectContext.features.length - 3} more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* AI Assistant Interface */}
            <div className="col-span-10 border rounded-lg overflow-hidden flex flex-col">
              <div className="bg-indigo-700 text-white p-2 text-sm font-medium">AI Assistant</div>
              <div className="flex-grow overflow-y-auto bg-gray-50 p-3">
                <div className="flex flex-col space-y-3">
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`rounded-lg p-3 max-w-[80%] ${
                        msg.sender === 'user' 
                          ? 'bg-blue-500 text-white ml-auto' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <div 
                        className={`text-xs mt-1 ${
                          msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  ))}
                  {isAIGenerating && (
                    <div className="bg-white text-gray-800 border border-gray-200 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
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
                    placeholder="Ask me about your project or how to implement features..."
                    className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isAIGenerating}
                  />
                  <Button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-indigo-600 text-white"
                    disabled={isAIGenerating || !newMessage.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 