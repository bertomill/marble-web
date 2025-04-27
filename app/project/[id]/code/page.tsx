'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "@/components/ui/use-toast";
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { File } from 'lucide-react';

// Dynamically import the CodeEditor component to avoid hydration issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse rounded" />
});

// Define project data interface
interface ProjectData {
  name: string;
  description: string;
  projectType: string;
  status: string;
  files?: Record<string, FileData>;
}

interface FileData {
  content: string;
  language: string;
  lastModified: number | Date;
}

type FileSystemType = Record<string, FileData>;

export default function ProjectCodePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('javascript');
  const [isDirty, setIsDirty] = useState(false);

  // Fetch project data
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    const fetchProject = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (projectSnap.exists()) {
          const projectData = projectSnap.data() as ProjectData;
          setProject(projectData);

          // Initialize with default files if none exist
          if (!projectData.files || Object.keys(projectData.files).length === 0) {
            const defaultFiles = createDefaultFiles(projectData.projectType);
            setProject({
              ...projectData,
              files: defaultFiles
            });

            // Set the first file as current
            const firstFileName = Object.keys(defaultFiles)[0];
            setCurrentFile(firstFileName);
            setCurrentFileContent(defaultFiles[firstFileName].content);
            setCurrentLanguage(defaultFiles[firstFileName].language);
          } else {
            // Set the first existing file as current
            const firstFileName = Object.keys(projectData.files)[0];
            setCurrentFile(firstFileName);
            setCurrentFileContent(projectData.files[firstFileName].content);
            setCurrentLanguage(projectData.files[firstFileName].language);
          }
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProject();
    }
  }, [projectId, user, loading, router]);

  // Create default files based on project type
  const createDefaultFiles = (projectType: string): FileSystemType => {
    if (projectType === 'website') {
      return {
        'index.html': {
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
    <nav>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <section id="home">
      <h2>Home</h2>
      <p>This is the home section of my website.</p>
    </section>
    <section id="about">
      <h2>About</h2>
      <p>Learn more about what we do.</p>
    </section>
    <section id="contact">
      <h2>Contact</h2>
      <p>Get in touch with us.</p>
    </section>
  </main>
  <footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`,
          language: 'html',
          lastModified: Date.now()
        },
        'styles.css': {
          content: `/* Basic reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
}

nav ul {
  display: flex;
  list-style: none;
}

nav li {
  margin-left: 20px;
}

nav a {
  text-decoration: none;
  color: #333;
}

nav a:hover {
  color: #0066cc;
}

section {
  margin-bottom: 40px;
}

h1, h2 {
  margin-bottom: 15px;
}

footer {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #eee;
  margin-top: 30px;
}`,
          language: 'css',
          lastModified: Date.now()
        },
        'script.js': {
          content: `// Main JavaScript file

document.addEventListener('DOMContentLoaded', function() {
  console.log('Document is ready!');
  
  // Add smooth scrolling for navigation
  document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const href = this.getAttribute('href');
      if (!href) return;
      
      const targetSection = document.querySelector(href);
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Example of form handling
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Form submitted');
      // Add form handling logic here
    });
  }
});`,
          language: 'javascript',
          lastModified: Date.now()
        }
      };
    } else if (projectType === 'app') {
      return {
        'App.js': {
          content: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to My App</h1>
        <p>This is a simple React application.</p>
        <div className="counter">
          <p>You clicked {count} times</p>
          <button onClick={() => setCount(count + 1)}>
            Increase Count
          </button>
          <button onClick={() => setCount(count - 1)}>
            Decrease Count
          </button>
          <button onClick={() => setCount(0)}>
            Reset Count
          </button>
        </div>
      </header>
      <main>
        <section className="features">
          <h2>Features</h2>
          <ul>
            <li>Simple state management</li>
            <li>Responsive design</li>
            <li>Easy to customize</li>
          </ul>
        </section>
      </main>
      <footer>
        <p>&copy; 2024 My App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;`,
          language: 'javascript',
          lastModified: Date.now()
        },
        'App.css': {
          content: `.App {
  text-align: center;
  font-family: Arial, sans-serif;
}

.App-header {
  background-color: #282c34;
  min-height: 40vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 2rem;
}

.counter {
  margin: 2rem 0;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

button {
  background-color: #61dafb;
  border: none;
  color: #282c34;
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #4fa8c7;
}

main {
  padding: 2rem;
}

.features {
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
}

.features ul {
  list-style-type: circle;
  padding-left: 2rem;
}

footer {
  background-color: #f8f9fa;
  padding: 1rem;
  margin-top: 2rem;
}`,
          language: 'css',
          lastModified: Date.now()
        },
        'index.js': {
          content: `import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
          language: 'javascript',
          lastModified: Date.now()
        },
        'index.css': {
          content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
          language: 'css',
          lastModified: Date.now()
        }
      };
    } else {
      // Generic default file for any other project type
      return {
        'main.js': {
          content: `// Main application file
console.log('Application started');

// Define main application class
class Application {
  constructor() {
    this.initialized = false;
    console.log('Application class instantiated');
  }

  initialize() {
    if (this.initialized) {
      console.warn('Application already initialized');
      return;
    }
    
    console.log('Initializing application...');
    this.initialized = true;
    console.log('Application initialized successfully');
  }

  start() {
    if (!this.initialized) {
      console.error('Cannot start application: not initialized');
      return;
    }
    
    console.log('Starting application...');
    console.log('Application running');
  }
}

// Create and run the application
const app = new Application();
app.initialize();
app.start();`,
          language: 'javascript',
          lastModified: Date.now()
        },
        'index.html': {
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>My Project</h1>
    <p>Welcome to my project!</p>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
          language: 'html',
          lastModified: Date.now()
        },
        'styles.css': {
          content: `body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background-color: #f8f9fa;
}

#app {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}`,
          language: 'css',
          lastModified: Date.now()
        }
      };
    }
  };

  // Handle file selection
  const handleFileSelect = (fileName: string) => {
    // Prompt to save if current file is dirty
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Save before switching files?')) {
        saveCurrentFile();
      }
      setIsDirty(false);
    }
    
    if (project?.files && project.files[fileName]) {
      setCurrentFile(fileName);
      setCurrentFileContent(project.files[fileName].content);
      setCurrentLanguage(project.files[fileName].language);
    }
  };

  // Handle file content change
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCurrentFileContent(value);
      setIsDirty(true);
    }
  };

  // Save the current file
  const saveCurrentFile = async () => {
    if (!currentFile || !project || !user) return;
    
    try {
      // Update local state
      const updatedFiles = {
        ...project.files,
        [currentFile]: {
          content: currentFileContent,
          language: currentLanguage,
          lastModified: Date.now()
        }
      };
      
      setProject({
        ...project,
        files: updatedFiles
      });
      
      // Update in Firebase 
      await updateDoc(doc(db, 'projects', projectId), {
        [`files.${currentFile}`]: {
          content: currentFileContent,
          language: currentLanguage,
          lastModified: Date.now()
        }
      });
      
      setIsDirty(false);
      toast({
        title: "File saved",
        description: `${currentFile} has been saved successfully.`
      });
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Error saving file",
        description: "There was a problem saving your file.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-md mb-2"></div>
          <p className="text-zinc-400 text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <header className="py-3 px-6 border-b bg-white shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
              <div className="relative w-7 h-7">
                <Image 
                  src="/images/marble_blocks_2.png" 
                  alt="Marble Blocks Logo" 
                  width={28} 
                  height={28} 
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-bold tracking-tight ml-2">Marble</h1>
            </Link>
            <span className="text-zinc-300 mx-2">|</span>
            <h2 className="text-zinc-600 truncate max-w-[200px]">{project?.name}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={saveCurrentFile}
              disabled={!isDirty}
            >
              Save
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <Link href={`/project/${projectId}`}>Back to Project</Link>
            </Button>
            <AuthStatus />
          </div>
        </div>
      </header>

      <div className="flex-grow flex">
        {/* File Explorer */}
        <div className="w-64 border-r border-zinc-200 bg-white overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-sm mb-2">Files</h3>
            {project?.files && Object.keys(project.files).map((fileName) => (
              <div 
                key={fileName}
                className={`flex items-center p-2 cursor-pointer rounded text-sm ${
                  currentFile === fileName ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-zinc-100'
                }`}
                onClick={() => handleFileSelect(fileName)}
              >
                <File className="h-4 w-4 mr-2" />
                <span>{fileName}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-grow">
          {currentFile ? (
            <div className="h-full">
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm flex justify-between">
                <span>{currentFile}{isDirty && ' •'}</span>
                <span className="text-zinc-400">{currentLanguage}</span>
              </div>
              <div className="h-[calc(100%-35px)]">
                <CodeEditor
                  language={currentLanguage}
                  value={currentFileContent}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-zinc-400">Select a file to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 