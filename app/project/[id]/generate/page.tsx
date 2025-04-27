'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Code, RefreshCw } from 'lucide-react';

// Define interfaces
interface UserJourneyStep {
  id: string;
  content: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  projectType: string;
  status: string;
  createdAt: Date | number | { seconds: number; nanoseconds: number };
  userId: string;
  targetAudience?: string;
  valueProposition?: string;
  userFlow?: UserJourneyStep[];
  aiResponse?: string;
}

export default function GenerateCodePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{ [key: string]: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [activePreviewTab, setActivePreviewTab] = useState('code');
  const [prompt, setPrompt] = useState('');

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
          
          // Set default prompt based on project data
          setPrompt(
            `Create a simple ${projectData.projectType || 'website'} for ${projectData.name || 'my project'} that ${projectData.description || 'showcases the main features'}. Include HTML, CSS, and JavaScript. The target audience is ${projectData.targetAudience || 'general users'} and the main value proposition is ${projectData.valueProposition || 'providing value to users'}.`
          );
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

  // Function to generate code
  const generateCode = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a description of what you want to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Starting code generation...');
    
    // Start progress simulation
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 95) {
          clearInterval(interval);
          return 95;
        }
        return newProgress;
      });

      // Update status messages based on progress
      setGenerationProgress(prev => {
        if (prev < 20) {
          setGenerationStatus('Analyzing project requirements...');
        } else if (prev < 40) {
          setGenerationStatus('Designing code structure...');
        } else if (prev < 60) {
          setGenerationStatus('Writing HTML and CSS...');
        } else if (prev < 80) {
          setGenerationStatus('Adding JavaScript functionality...');
        } else {
          setGenerationStatus('Finalizing code...');
        }
        return prev;
      });
    }, 500);

    try {
      // Make API call
      const response = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          projectName: project?.name || '',
          projectDescription: project?.description || '',
          projectType: project?.projectType || 'website',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedCode(data.files || {});
        
        // Set to 100% complete
        setGenerationProgress(100);
        setGenerationStatus('Code generation complete!');
        
        toast({
          title: "Code generated successfully",
          description: "Your code has been generated and is ready to preview."
        });

        // Auto-select first tab if available
        if (data.files && Object.keys(data.files).length > 0) {
          setActiveTab(Object.keys(data.files)[0]);
        }
      } else {
        // Handle error
        const errorData = await response.json();
        toast({
          title: "Generation failed",
          description: errorData.error || "Failed to generate code.",
          variant: "destructive"
        });
        
        // Set error status
        setGenerationStatus('Code generation failed.');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "An error occurred",
        description: "There was a problem generating your code.",
        variant: "destructive"
      });
      
      // Set error status
      setGenerationStatus('Error during code generation.');
    } finally {
      // Clear interval and set as no longer generating
      clearInterval(interval);
      setIsGenerating(false);
    }
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

      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="grid gap-6 md:grid-cols-12">
          {/* Generation Controls */}
          <Card className="md:col-span-12">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                AI Code Generation
              </CardTitle>
              <CardDescription>
                Generate code for your project using Claude 3.7. Describe what you want to build and the AI will create the code for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Textarea 
                    placeholder="Describe what you want to build. Be specific about features, design, and functionality."
                    className="min-h-[120px]"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                
                {isGenerating && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-700">{generationStatus}</p>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setPrompt('')}
                disabled={isGenerating || !prompt}
              >
                Clear
              </Button>
              <Button
                onClick={generateCode}
                disabled={isGenerating || !prompt.trim()}
                className={isGenerating ? "bg-indigo-600 opacity-80" : "bg-indigo-600 hover:bg-indigo-700"}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Code and Preview */}
          {Object.keys(generatedCode).length > 0 && (
            <div className="md:col-span-12 space-y-4">
              <Tabs
                value={activePreviewTab}
                onValueChange={setActivePreviewTab}
                className="w-full"
              >
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="preview">Live Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="code" className="space-y-4 mt-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Generated Code</CardTitle>
                        <TabsList className="h-9">
                          {Object.keys(generatedCode).map(filename => (
                            <TabsTrigger
                              key={filename}
                              value={filename}
                              onClick={() => setActiveTab(filename)}
                              className={activeTab === filename ? "bg-primary text-primary-foreground" : ""}
                            >
                              {filename}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <pre className="bg-zinc-950 text-zinc-50 p-4 rounded-md overflow-x-auto max-h-[500px] overflow-y-auto">
                        <code>{generatedCode[activeTab] || 'Select a file to view its code'}</code>
                      </pre>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode[activeTab] || '');
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
                        Copy Code
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preview" className="mt-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Preview</CardTitle>
                      <CardDescription>See how your generated code looks and functions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md w-full overflow-hidden bg-white">
                        <iframe 
                          className="w-full h-[600px]"
                          srcDoc={`
                            ${generatedCode['index.html'] || ''}
                            <style>${generatedCode['styles.css'] || ''}</style>
                            <script>${generatedCode['script.js'] || ''}</script>
                          `}
                          sandbox="allow-scripts allow-popups"
                          title="Code Preview"
                        ></iframe>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 