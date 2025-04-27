'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Code, Users, LucideFileType2, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import AuthStatus from '@/components/AuthStatus';
import { Progress } from '@/components/ui/progress';
import { toast } from "@/components/ui/use-toast";
import CompetitorCard from '@/components/CompetitorCard';
import dynamic from 'next/dynamic';

// Dynamically import the PreviewComponent component to avoid hydration issues
const PreviewComponent = dynamic(() => import('@/components/PreviewComponent'), { ssr: false });

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

interface Competitor {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
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
  competitors?: Competitor[];
  aiResponse?: string;
  files?: Record<string, FileData>;
}

export default function ProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('code');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string>('');
  const [projectFiles, setProjectFiles] = useState<Record<string, FileData>>({});

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
          
          // Load project files if they exist
          if (projectData.files && Object.keys(projectData.files).length > 0) {
            setProjectFiles(projectData.files);
            
            // Set first file as default
            const firstFileName = Object.keys(projectData.files)[0];
            setCurrentFile(firstFileName);
            setCurrentFileContent(projectData.files[firstFileName].content);
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

  // Function to handle competitor search
  const searchCompetitors = async () => {
    if (!project) return;
    
    // Check for required fields
    if (!project.name || !project.description) {
      toast({
        title: "Missing information",
        description: "Please provide a project name and description before searching for competitors.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setSearchStatus('Initiating competitor search...');
    
    // Status messages to show during the search
    const statusMessages = [
      'Analyzing your project details...',
      'Identifying market segments...',
      'Searching for relevant competitors...',
      'Analyzing competitor strengths and weaknesses...',
      'Compiling competitor insights...',
      'Finalizing competitor analysis...'
    ];
    
    // Simulate progress with randomly timed updates
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        // Update status message based on progress
        const messageIndex = Math.min(
          Math.floor((prev / 100) * statusMessages.length),
          statusMessages.length - 1
        );
        setSearchStatus(statusMessages[messageIndex]);
        
        // Increment progress
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 95 ? 95 : newProgress;
      });
    }, 800);
    
    try {
      const response = await fetch('/api/search-competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          name: project.name,
          description: project.description,
          projectType: project.projectType
        }),
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Failed to search competitors');
      }
      
      const data = await response.json();
      
      // Update project with competitors
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        competitors: data.competitors,
        status: 'planning_complete'
      });
      
      // Update local state
      setProject({
        ...project,
        competitors: data.competitors,
        status: 'planning_complete'
      });
      
      // Complete the progress bar
      setSearchProgress(100);
      setSearchStatus('Competitor analysis complete!');
      
      // Reset after delay
      setTimeout(() => {
        setIsSearching(false);
        setSearchProgress(0);
        setSearchStatus(null);
      }, 1000);
      
      toast({
        title: "Analysis complete",
        description: "Competitor analysis has been completed successfully."
      });
    } catch (error) {
      console.error('Error searching competitors:', error);
      clearInterval(progressInterval);
      
      setIsSearching(false);
      setSearchProgress(0);
      setSearchStatus(null);
      
      toast({
        title: "Search failed",
        description: "There was a problem searching for competitors. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (fileName: string) => {
    if (!projectFiles || !fileName) return;
    
    setCurrentFile(fileName);
    setCurrentFileContent(projectFiles[fileName]?.content || '');
  };
  
  // Go to full code editor
  const goToCodeEditor = () => {
    router.push(`/project/${projectId}/code`);
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
      });
    });
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-md mb-2"></div>
          <p className="text-zinc-400 text-sm">Loading project...</p>
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
              <h1 className="text-xl font-bold tracking-tight ml-2">Marble</h1>
            </Link>
            <span className="text-zinc-300 mx-2">|</span>
            <h2 className="text-zinc-600 truncate max-w-[200px]">{project?.name}</h2>
          </div>
          
          <div className="flex items-center">
            <AuthStatus />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
            <span className="font-medium text-zinc-900">{project?.name}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToCodeEditor}
            >
              <Code className="h-4 w-4 mr-1" />
              Full Code Editor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadProjectFiles}
            >
              <Download className="h-4 w-4 mr-1" />
              Download Files
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Project Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Project Name</h3>
                  <p className="text-zinc-700">{project?.name}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Description</h3>
                  <p className="text-zinc-700">{project?.description}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Project Type</h3>
                  <p className="text-zinc-700 capitalize">{project?.projectType}</p>
                </div>
                {project?.targetAudience && (
                  <div>
                    <h3 className="font-medium mb-1">Target Audience</h3>
                    <p className="text-zinc-700">{project.targetAudience}</p>
                  </div>
                )}
                {project?.valueProposition && (
                  <div>
                    <h3 className="font-medium mb-1">Value Proposition</h3>
                    <p className="text-zinc-700">{project.valueProposition}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {project?.userFlow && project.userFlow.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>User Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-6">
                    {project?.userFlow?.map((step, index) => (
                      <div key={step.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          {index < (project?.userFlow?.length || 0) - 1 && (
                            <div className="w-0.5 h-full bg-indigo-100 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{step.title}</h3>
                          <p className="text-zinc-600 mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Code Preview Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Code Preview</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToCodeEditor}
                  >
                    <Code className="h-4 w-4 mr-1" />
                    Open Full Editor
                  </Button>
                </CardTitle>
                <CardDescription>
                  Preview your project code and see how it looks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="flex border-b">
                    <div className="w-64 border-r overflow-y-auto max-h-[300px]">
                      <div className="bg-zinc-800 text-white p-2 text-sm font-medium">
                        Files
                      </div>
                      <ul className="py-1">
                        {projectFiles && Object.keys(projectFiles).map((fileName) => (
                          <li 
                            key={fileName}
                            className={`px-3 py-1.5 text-sm cursor-pointer flex items-center ${
                              currentFile === fileName ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-zinc-100'
                            }`}
                            onClick={() => handleFileSelect(fileName)}
                          >
                            <LucideFileType2 className="h-4 w-4 mr-2 text-zinc-400" />
                            {fileName}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1">
                      <Tabs value={activeCodeTab} onValueChange={setActiveCodeTab} className="w-full">
                        <div className="bg-zinc-800 px-2">
                          <TabsList className="bg-transparent h-10">
                            <TabsTrigger 
                              value="code"
                              className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white rounded-none"
                            >
                              Code
                            </TabsTrigger>
                            <TabsTrigger 
                              value="preview"
                              className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white rounded-none"
                            >
                              Preview
                            </TabsTrigger>
                          </TabsList>
                        </div>
                        
                        <TabsContent value="code" className="p-0 m-0 border-0">
                          <div className="bg-zinc-800 text-white p-2 text-sm flex items-center border-b border-zinc-700">
                            {currentFile}
                          </div>
                          <div className="overflow-auto bg-zinc-900 w-full" style={{height: '300px'}}>
                            <pre className="p-4 text-gray-200 text-sm font-mono">
                              {currentFileContent}
                            </pre>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="preview" className="p-0 m-0 border-0">
                          <div className="h-[340px] overflow-auto bg-white">
                            <PreviewComponent files={projectFiles} />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={goToCodeEditor} className="w-full">
                  Open Full Code Editor
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project?.status === 'planning' 
                        ? 'bg-blue-100 text-blue-800' 
                        : project?.status === 'planning_complete'
                          ? 'bg-indigo-100 text-indigo-800'
                          : project?.status === 'built'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-zinc-100 text-zinc-800'
                    }`}>
                      {project?.status === 'planning' 
                        ? 'Planning' 
                        : project?.status === 'planning_complete'
                          ? 'Planning Complete'
                          : project?.status === 'built'
                            ? 'Built'
                            : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600">
                      Created {project?.createdAt.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600">
                      {project?.targetAudience || 'No target audience specified'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t">
                  {project?.status === 'planning' ? (
                    <>
                      <h3 className="text-sm font-medium mb-3">Next Steps:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">Project plan created</span>
                        </li>
                        {project?.userFlow && project.userFlow.length > 0 ? (
                          <li className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm">User journey defined</span>
                          </li>
                        ) : (
                          <li className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                              </svg>
                            </div>
                            <span className="text-sm text-zinc-500">Define user journey</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            </svg>
                          </div>
                          <span className="text-sm text-zinc-500">Analyze competitors</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            </svg>
                          </div>
                          <span className="text-sm text-zinc-500">Build your project</span>
                        </li>
                      </ul>
                      
                      <div className="mt-6">
                        <Button 
                          onClick={searchCompetitors}
                          disabled={isSearching}
                          className="w-full"
                        >
                          {isSearching ? 'Searching...' : 'Analyze Competitors'}
                        </Button>
                        
                        {isSearching && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-zinc-600 mb-1">
                              <span>{searchStatus}</span>
                              <span>{Math.round(searchProgress)}%</span>
                            </div>
                            <Progress value={searchProgress} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    </>
                  ) : project?.status === 'planning_complete' ? (
                    <>
                      <h3 className="text-sm font-medium mb-3">Next Steps:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">Project plan created</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">User journey defined</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">Competitors analyzed</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            </svg>
                          </div>
                          <span className="text-sm text-zinc-500">Build your project</span>
                        </li>
                      </ul>
                      
                      <div className="mt-6">
                        <Button 
                          onClick={goToCodeEditor}
                          className="w-full mb-2 bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Code className="h-4 w-4 mr-2" />
                          Generate Code
                        </Button>
                      </div>
                    </>
                  ) : project?.status === 'built' ? (
                    <>
                      <h3 className="text-sm font-medium mb-3">Completed Steps:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">Project plan created</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">User journey defined</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">Competitors analyzed</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm">Project built with code</span>
                        </li>
                      </ul>
                      
                      <div className="mt-6">
                        <Button 
                          onClick={goToCodeEditor}
                          className="w-full mb-2"
                        >
                          <Code className="h-4 w-4 mr-2" />
                          Open Code Editor
                        </Button>
                        <Button
                          variant="outline"
                          onClick={downloadProjectFiles}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Project
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            
            {/* Competitor Analysis Card */}
            {project?.competitors && project.competitors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                  <CardDescription>
                    Key competitors for your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.competitors.map((competitor) => (
                    <CompetitorCard 
                      key={competitor.id}
                      competitor={competitor}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
