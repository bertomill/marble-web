'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; 
import { toast } from "@/components/ui/use-toast";
import dynamic from 'next/dynamic';
import { Save, ArrowLeft, Check, Download, MessageSquare, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dynamically import the CodeEditor component to avoid hydration issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse rounded" />
});

// Dynamically import the FileExplorer component
const FileExplorer = dynamic(() => import('@/components/FileExplorer'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse rounded" />
});

// Dynamically import the PreviewComponent component
const PreviewComponent = dynamic(() => import('@/components/PreviewComponent'), { ssr: false });

// Dynamically import the ChatCodeInterface component
const ChatCodeInterface = dynamic(() => import('@/components/ChatCodeInterface'), { ssr: false });

// Define interfaces for file data
interface FileData {
  content: string;
  language: string;
  lastModified?: number | Date;
}

// Define interfaces for project data
interface UserJourneyStep {
  id: string;
  title: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  projectType: string;
  status: string;
  createdAt: Timestamp;
  userId: string;
  targetAudience?: string;
  valueProposition?: string;
  userFlow?: UserJourneyStep[];
  files?: Record<string, FileData>;
  aiResponse?: string;
}

export default function ProjectCodePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('javascript');
  const [isDirty, setIsDirty] = useState(false);
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStatus, setBuildStatus] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('code');
  const [projectFiles, setProjectFiles] = useState<Record<string, FileData>>({});
  const [showChatInterface, setShowChatInterface] = useState(false);

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
          const projectData = projectSnap.data() as Project;
          setProject(projectData);

          // If status is 'planning', we're in build mode
          setIsBuildMode(projectData.status === 'planning' || projectData.status === 'planning_complete');

          // If files exist, load them
          if (projectData.files && Object.keys(projectData.files).length > 0) {
            setProjectFiles(projectData.files);
            
            // Set default file
            const firstFileName = Object.keys(projectData.files)[0];
            setCurrentFile(firstFileName);
            setCurrentFileContent(projectData.files[firstFileName].content);
            setCurrentLanguage(projectData.files[firstFileName].language);
          } else {
            // Create default files based on project type
            const defaultFiles = createDefaultFiles(projectData);
            setProjectFiles(defaultFiles);
            
            // Set default file
            const firstFileName = Object.keys(defaultFiles)[0];
            setCurrentFile(firstFileName);
            setCurrentFileContent(defaultFiles[firstFileName].content);
            setCurrentLanguage(defaultFiles[firstFileName].language);
            
            // Save default files to the project
            await updateDoc(projectRef, { files: defaultFiles });
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
  }, [projectId, user, loading, router, isBuildMode]);

  // Function to create default files based on project type
  const createDefaultFiles = (project: Project) => {
    const files: Record<string, FileData> = {};
    
    // Default files for all projects
    files['index.html'] = {
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name || 'New Project'}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>${project.name || 'New Project'}</h1>
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
      <h2>Welcome to ${project.name || 'Our Project'}</h2>
      <p>${project.description || 'This is a description of our amazing project.'}</p>
    </section>
    
    <section id="about">
      <h2>About Us</h2>
      <p>We are dedicated to creating high-quality solutions.</p>
    </section>
    
    <section id="contact">
      <h2>Contact Us</h2>
      <form>
        <div>
          <label for="name">Name:</label>
          <input type="text" id="name" name="name">
        </div>
        <div>
          <label for="email">Email:</label>
          <input type="email" id="email" name="email">
        </div>
        <div>
          <label for="message">Message:</label>
          <textarea id="message" name="message"></textarea>
        </div>
        <button type="submit">Send</button>
      </form>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${project.name || 'Our Project'}. All rights reserved.</p>
  </footer>
  
  <script src="script.js"></script>
</body>
</html>`,
      language: 'html'
    };
    
    files['styles.css'] = {
      content: `/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

a {
  text-decoration: none;
  color: #007bff;
}

/* Header */
header {
  background-color: #f8f9fa;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
  margin-bottom: 1rem;
}

nav ul {
  display: flex;
  list-style: none;
}

nav ul li {
  margin-right: 1rem;
}

/* Main Content */
main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

section {
  margin-bottom: 3rem;
}

section h2 {
  margin-bottom: 1rem;
  color: #0056b3;
}

/* Form Styles */
form div {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

/* Footer */
footer {
  background-color: #f8f9fa;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
}`,
      language: 'css'
    };
    
    files['script.js'] = {
      content: `// Navigation smooth scroll
document.querySelectorAll('nav a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  });
});

// Form submission
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    
    // Simple validation
    if (!nameInput.value || !emailInput.value || !messageInput.value) {
      alert('Please fill out all fields');
      return;
    }
    
    // In a real application, you would send this data to a server
    alert('Thanks for your message! We will get back to you soon.');
    form.reset();
  });
}

// Add dynamic year to footer
const yearElement = document.querySelector('footer p');
if (yearElement) {
  const currentYear = new Date().getFullYear();
  yearElement.textContent = yearElement.textContent.replace(currentYear, currentYear);
}`,
      language: 'javascript'
    };
    
    return files;
  };

  // Handle file selection
  const handleFileSelect = (fileName: string) => {
    if (fileName === currentFile) return;
    
    // Save current file before switching
    if (currentFile && projectFiles[currentFile]) {
      const updatedFiles = { ...projectFiles };
      updatedFiles[currentFile] = {
        ...updatedFiles[currentFile],
        content: currentFileContent
      };
      setProjectFiles(updatedFiles);
    }
    
    // Set new current file
    setCurrentFile(fileName);
    setCurrentFileContent(projectFiles[fileName]?.content || '');
    setCurrentLanguage(projectFiles[fileName]?.language || getLanguageFromFileName(fileName));
  };

  // Handle file content change
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCurrentFileContent(value);
      setIsDirty(true);
    }
  };

  // Handle file creation
  const handleFileCreate = (fileName: string) => {
    if (projectFiles[fileName]) {
      alert(`File ${fileName} already exists.`);
      return;
    }
    
    const language = getLanguageFromFileName(fileName);
    
    // Create new file
    const updatedFiles = { ...projectFiles };
    updatedFiles[fileName] = {
      content: '',
      language
    };
    
    setProjectFiles(updatedFiles);
    setCurrentFile(fileName);
    setCurrentFileContent('');
    setCurrentLanguage(language);
    
    // Save to Firebase
    saveProject(updatedFiles);
  };

  // Build the project
  const buildProject = async () => {
    if (!project || !user) return;
    
    setIsBuilding(true);
    setBuildProgress(0);
    setBuildStatus('Preparing to build project...');
    
    try {
      // Start progress simulation
      const buildProgressInterval = setInterval(() => {
        setBuildProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(buildProgressInterval);
            return 95;
          }
          return newProgress;
        });
        
        // Update status message based on progress
        setBuildProgress(prev => {
          if (prev < 20) {
            setBuildStatus('Analyzing project requirements...');
          } else if (prev < 40) {
            setBuildStatus('Generating code structure...');
          } else if (prev < 60) {
            setBuildStatus('Writing core functionality...');
          } else if (prev < 80) {
            setBuildStatus('Setting up styles and UI components...');
          } else {
            setBuildStatus('Finalizing project files...');
          }
          return prev;
        });
      }, 500);
      
      // Create empty default file structure first
      const defaultFiles = createDefaultFiles(project);
      
      // Update project with default files immediately
      await updateDoc(doc(db, 'projects', projectId), {
        files: defaultFiles,
        status: 'building' // Change status to indicate that files are being created
      });
      
      // Update local state
      setProjectFiles(defaultFiles);
      
      // Set the first file as current to show editor with default content
      const firstFileName = Object.keys(defaultFiles)[0];
      setCurrentFile(firstFileName);
      setCurrentFileContent(defaultFiles[firstFileName].content);
      setCurrentLanguage(defaultFiles[firstFileName].language);
      
      // Transition to editor view immediately
      setIsBuildMode(false);
      setIsBuilding(false);
      
      // Now make the API call to generate code
      setBuildStatus('Generating code in the background...');
      
      // Show toast that files are being generated
      toast({
        title: "Editor ready",
        description: "Basic files loaded. AI code generation is continuing in the background."
      });
      
      // Make API call to generate code
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: params.id as string,
          name: project.name,
          description: project.description,
          projectType: project.projectType,
          targetAudience: project.targetAudience || '',
          valueProposition: project.valueProposition || '',
          userFlow: project.userFlow || [],
          aiResponse: project.aiResponse || ''
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.files && Object.keys(data.files).length > 0) {
          // Update each file individually to avoid JSON parsing issues
          for (const [fileName, fileData] of Object.entries(data.files)) {
            // Skip invalid file data
            if (!fileData || typeof fileData !== 'object') continue;
            
            // Type assertion to help TypeScript understand our file data structure
            const typedFileData = fileData as FileData;
            
            // Update this file in Firebase
            await updateDoc(doc(db, 'projects', projectId), {
              [`files.${fileName}`]: {
                content: typedFileData.content || '// Generated content',
                language: typedFileData.language || 'text',
                lastModified: Date.now()
              }
            });
            
            // Also update in local state
            if (projectFiles) {
              setProjectFiles({
                ...projectFiles,
                [fileName]: {
                  content: typedFileData.content || '// Generated content',
                  language: typedFileData.language || 'text',
                  lastModified: Date.now()
                }
              });
            }
            
            // If this is the currently viewed file, update its content in editor
            if (currentFile === fileName) {
              setCurrentFileContent(typedFileData.content || '// Generated content');
              setCurrentLanguage(typedFileData.language || 'text');
            }
          }
          
          // Mark project as fully built
          await updateDoc(doc(db, 'projects', projectId), {
            status: 'built'
          });
          
          // Update local state
          setProject({
            ...project,
            status: 'built'
          });
          
          // Complete the build
          setBuildProgress(100);
          setBuildStatus('Code generation completed successfully!');
          
          toast({
            title: "Code generation completed",
            description: "Your project code has been generated successfully!"
          });
        }
      } else {
        // API call failed but we already have default files loaded, so just notify the user
        toast({
          title: "Code generation issue",
          description: "We encountered an issue generating custom code. Default templates loaded instead.",
          variant: "destructive"
        });
        
        // Mark project as built anyway since we have the default files
        await updateDoc(doc(db, 'projects', projectId), {
          status: 'built'
        });
        
        // Update local state
        setProject({
          ...project,
          status: 'built'
        });
      }
      
      // Clear interval if it's still running
      clearInterval(buildProgressInterval);
    } catch (error) {
      console.error('Error in build process:', error);
      
      // Even if there's an error, we still have default files
      toast({
        title: "Code generation issue",
        description: "We encountered an issue during the build process. Default templates loaded.",
        variant: "destructive"
      });
      
      setBuildStatus('Build completed with default templates.');
      setBuildProgress(100);
      
      // Make sure the editor is showing
      setIsBuildMode(false);
      setIsBuilding(false);
    }
  };

  // Download all project files as a ZIP
  const downloadProjectFiles = () => {
    if (!projectFiles || Object.keys(projectFiles).length === 0) {
      toast({
        title: "No files to download",
        description: "Your project doesn't have any files to download yet.",
        variant: "destructive"
      });
      return;
    }

    // Get the files to download
    const files = projectFiles;

    // Dynamically import JSZip
    import('jszip').then((JSZipModule) => {
      const JSZip = JSZipModule.default;
      const zip = new JSZip();
      
      // Add all files to the zip
      Object.entries(files).forEach(([fileName, fileData]) => {
        zip.file(fileName, fileData.content);
      });
      
      // Generate the zip file
      zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        // Create a download link
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name?.replace(/\s+/g, '-').toLowerCase() || 'project'}-files.zip`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        
        toast({
          title: "Download started",
          description: "Your project files are being downloaded."
        });
      }).catch((err: Error) => {
        console.error('Error generating zip:', err);
        toast({
          title: "Download failed",
          description: "There was a problem downloading your files.",
          variant: "destructive"
        });
      });
    }).catch((err: Error) => {
      console.error('Error loading JSZip:', err);
      toast({
        title: "Download failed",
        description: "Could not load the ZIP utility. Please try again later.",
        variant: "destructive"
      });
    });
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'html' || extension === 'htm') return 'html';
    if (extension === 'css') return 'css';
    if (['js', 'jsx'].includes(extension)) return 'javascript';
    if (['ts', 'tsx'].includes(extension)) return 'typescript';
    
    return 'text';
  };

  const saveCurrentFile = async () => {
    if (!currentFile) return;
    
    const updatedFiles = { ...projectFiles };
    updatedFiles[currentFile] = {
      ...updatedFiles[currentFile],
      content: currentFileContent
    };
    
    setProjectFiles(updatedFiles);
    await saveProject(updatedFiles);
  };
  
  const saveProject = async (files: Record<string, FileData>) => {
    if (!projectId || !project) return;
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { files });
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  // Function to generate file content using Claude
  const generateFileContent = async () => {
    if (!currentFile) return;
    
    try {
      toast({
        title: "Generating code",
        description: `Creating ${currentFile} with Claude 3.7...`,
      });
      
      // Get list of other files in the project
      const existingFiles = Object.keys(projectFiles);
      
      // Call our API endpoint
      const response = await fetch('/api/generate-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: currentFile,
          language: currentLanguage,
          projectName: project?.name || '',
          projectDescription: project?.description || '',
          projectType: project?.projectType || 'web',
          existingFiles
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.content) {
          // Update the editor content
          setCurrentFileContent(data.content);
          setIsDirty(true);
          
          toast({
            title: "Code generated",
            description: `${currentFile} has been created with Claude 3.7. Remember to save your changes!`,
          });
        } else {
          toast({
            title: "Generation issue",
            description: "No content was returned. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: "Generation failed",
          description: error.error || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating file content:', error);
      toast({
        title: "Generation error",
        description: "Failed to generate code. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Function to apply code from the AI to the current file
  const applyGeneratedCode = (codeContent: string) => {
    if (!currentFile) {
      toast({
        title: "Error",
        description: "No file is currently selected to apply the code.",
        variant: "destructive"
      });
      return;
    }

    setCurrentFileContent(codeContent);
    setIsDirty(true);
    
    toast({
      title: "Code applied",
      description: `The generated code has been applied to ${currentFile}. Remember to save your changes!`,
    });
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

  // Render build mode UI
  if (isBuildMode || isBuilding) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50">
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
                <h1 className="text-xl font-bold tracking-tight ml-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Marble</h1>
              </Link>
              <span className="text-zinc-300 mx-2">|</span>
              <h2 className="text-zinc-600 truncate max-w-[200px]">{project?.name}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                asChild
              >
                <Link href={`/project/${projectId}`}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Project
                </Link>
              </Button>
              <AuthStatus />
            </div>
          </div>
        </header>

        <main className="flex-grow flex justify-center items-center p-8">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                  <Image 
                    src="/images/marble_blocks_2.png" 
                    alt="Marble Logo" 
                    width={240} 
                    height={240} 
                    className="mx-auto mb-4" 
                  />
                  <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Ready to Build Your Project?</h2>
                  <p className="text-zinc-600 mb-4">
                    Marble will generate the initial code structure for your {project?.projectType || 'project'} 
                    based on your project requirements.
                  </p>
                </div>
                
                {isBuilding && (
                  <div className="w-full mb-6">
                    <p className="font-medium text-zinc-700 mb-2">{buildStatus}</p>
                    <Progress value={buildProgress} className="h-2 mb-2" />
                    <p className="text-sm text-zinc-500">
                      This may take a moment...
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  {!isBuilding ? (
                    <Button 
                      onClick={buildProject}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Build Project
                    </Button>
                  ) : buildProgress === 100 ? (
                    <div className="text-green-600 font-medium flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      Build Complete!
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <footer className="py-4 px-6 border-t bg-white">
          <div className="container mx-auto text-center text-zinc-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Marble. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Normal editor view
  return (
    <div className="flex flex-col min-h-screen">
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
              <h1 className="text-xl font-bold tracking-tight ml-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Marble</h1>
            </Link>
            <span className="text-zinc-300 mx-2">|</span>
            <h2 className="text-zinc-600 truncate max-w-[200px]">{project?.name}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-amber-600 text-sm mr-1">• Unsaved changes</span>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={!isDirty}
              onClick={saveCurrentFile}
              className={`${
                isDirty 
                  ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' 
                  : ''
              }`}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setShowChatInterface(!showChatInterface)}
              className={showChatInterface ? 'bg-indigo-100 text-indigo-700' : ''}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {showChatInterface ? 'Hide AI Chat' : 'Show AI Chat'}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={downloadProjectFiles}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <Link href={`/project/${projectId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Project
              </Link>
            </Button>
            
            <AuthStatus />
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Left sidebar: File Explorer */}
            <div className="col-span-2">
              <FileExplorer 
                files={projectFiles}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                selectedFile={currentFile}
              />
            </div>
            
            {/* Main Content Area */}
            <div className={`${showChatInterface ? 'col-span-7' : 'col-span-10'}`}>
              <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                <Tabs defaultValue="code" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="bg-zinc-800 w-full justify-start rounded-none border-b border-zinc-700 px-2">
                    <TabsTrigger 
                      value="code" 
                      className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 rounded-sm"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 rounded-sm"
                    >
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="code" className="flex-grow overflow-hidden flex flex-col">
                    <div className="bg-zinc-800 text-white px-3 py-1.5 text-sm font-medium flex justify-between items-center border-b border-zinc-700 flex-shrink-0">
                      <div className="flex items-center">
                        <span className="font-mono">{currentFile || 'No file selected'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-zinc-300 hover:text-white hover:bg-zinc-700"
                          onClick={generateFileContent}
                        >
                          Generate with Claude
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-grow overflow-hidden">
                      {currentFile ? (
                        <CodeEditor 
                          language={currentLanguage}
                          value={currentFileContent}
                          onChange={handleEditorChange}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-400">
                          <p>Select a file to edit or create a new one</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="flex-grow overflow-hidden">
                    <div className="h-full">
                      <PreviewComponent files={projectFiles} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Right sidebar: Chat Interface */}
            {showChatInterface && (
              <div className="col-span-3">
                <ChatCodeInterface
                  currentFile={currentFile}
                  currentFileContent={currentFileContent}
                  projectFiles={projectFiles}
                  projectName={project?.name}
                  projectType={project?.projectType}
                  projectDescription={project?.description}
                  onApplyCode={applyGeneratedCode}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 