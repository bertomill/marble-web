'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import BuildingInterface from '@/components/BuildingInterface';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { use } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ProjectData = {
  name: string;
  description: string;
  businessType: string;
  goals: string;
  targetAudience: string;
  userFlow: string;
  userId: string;
  createdAt: Timestamp | Date | null;
  status: string;
  aiPlan?: {
    summary: string;
    features: string[];
    techStack: string[];
    timeline: string;
  };
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<ProjectData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const projectId = use(params).id;

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
          setEditedProject(projectData);
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

  // Handle input changes when editing project
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProject(prev => {
      if (!prev) return prev;
      return { ...prev, [name]: value };
    });
  };

  // Save edited project details
  const saveProjectDetails = async () => {
    if (!editedProject) return;
    
    setIsSaving(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        name: editedProject.name,
        description: editedProject.description,
        businessType: editedProject.businessType,
        goals: editedProject.goals,
        targetAudience: editedProject.targetAudience,
        userFlow: editedProject.userFlow
      });
      
      setProject(editedProject);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving project details:', err);
      setError('Failed to save project details');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  // Function to generate AI plan
  const generatePlan = async () => {
    if (!project) return;
    
    setIsGenerating(true);
    setError(null); // Clear any previous errors
    
    try {
      setGenerationStage('Analyzing your project requirements...');
      
      // Simulate first stage (in a real app, this could be a separate API call or streaming response)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationStage('Researching technology options...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationStage('Creating development timeline...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationStage('Finalizing recommendations...');
      
      // Call our API endpoint for plan generation
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }
      
      if (!data.plan) {
        throw new Error('No plan data received from API');
      }
      
      const aiPlan = data.plan;
      
      // Update the project with the AI plan
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        aiPlan,
        status: 'planning_complete'
      });
      
      // Update local state
      setProject({
        ...project,
        aiPlan,
        status: 'planning_complete'
      });
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      // Show error message to user
      setTimeout(() => {
        alert(`Error: ${err instanceof Error ? err.message : 'Failed to generate plan'}`);
      }, 100);
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  // Function to approve the plan
  const approvePlan = async () => {
    if (!project) return;
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'building'
      });
      
      // Update local state
      setProject({
        ...project,
        status: 'building'
      });
    } catch (err) {
      console.error('Error approving plan:', err);
      setError('Failed to approve plan');
    }
  };

  // Function to reject the plan
  const rejectPlan = async () => {
    if (!project) return;
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'planning',
        aiPlan: null
      });
      
      // Update local state
      setProject({
        ...project,
        status: 'planning',
        aiPlan: undefined
      });
    } catch (err) {
      console.error('Error rejecting plan:', err);
      setError('Failed to reject plan');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200">
            Planning
          </Badge>
        );
      case 'planning_complete':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
            Plan Ready
          </Badge>
        );
      case 'building':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
            Building
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-zinc-50 text-zinc-700 hover:bg-zinc-50 border-zinc-200">
            {status}
          </Badge>
        );
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-md mb-2"></div>
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

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

  if (!project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="py-4 px-6 border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Marble</h1>
          <div className="flex items-center gap-4">
            <AuthStatus />
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            {!isEditing ? (
              <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
            ) : (
              <div className="w-full pr-8">
                <Input
                  name="name"
                  value={editedProject?.name || ''}
                  onChange={handleEditChange}
                  className="text-2xl font-bold h-12"
                  placeholder="Project Name"
                />
              </div>
            )}
            <div className="flex-shrink-0">
              {getStatusBadge(project.status)}
            </div>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Information about your project requirements
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={saveProjectDetails}
                      disabled={isSaving}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditing ? (
                // View mode
                <>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-zinc-600">{project.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Business Type</h4>
                    <p className="text-zinc-600">{project.businessType}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Goals</h4>
                    <p className="text-zinc-600">{project.goals}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Target Audience</h4>
                    <p className="text-zinc-600">{project.targetAudience}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">User Flow</h4>
                    <p className="text-zinc-600">{project.userFlow}</p>
                  </div>
                </>
              ) : (
                // Edit mode
                <>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Project Name</h4>
                    <Input
                      name="name"
                      value={editedProject?.name || ''}
                      onChange={handleEditChange}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <Textarea
                      name="description"
                      value={editedProject?.description || ''}
                      onChange={handleEditChange}
                      rows={3}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Business Type</h4>
                    <Input
                      name="businessType"
                      value={editedProject?.businessType || ''}
                      onChange={handleEditChange}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Goals</h4>
                    <Textarea
                      name="goals"
                      value={editedProject?.goals || ''}
                      onChange={handleEditChange}
                      rows={3}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Target Audience</h4>
                    <Textarea
                      name="targetAudience"
                      value={editedProject?.targetAudience || ''}
                      onChange={handleEditChange}
                      rows={3}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">User Flow</h4>
                    <Textarea
                      name="userFlow"
                      value={editedProject?.userFlow || ''}
                      onChange={handleEditChange}
                      rows={5}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* AI Plan Section */}
          {project.status === 'planning' && (
            <Card className="mb-8 border-blue-100 bg-blue-50/30">
              <CardHeader>
                <CardTitle>Generate AI Plan</CardTitle>
                <CardDescription>
                  Get AI-powered recommendations for your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-zinc-600">
                  Ready to generate an AI-powered plan for your project? Click the button below to create a customized plan based on your requirements.
                </p>
                
                {isGenerating && (
                  <div className="mt-4 mb-2">
                    <div className="h-1 w-full bg-blue-100 rounded-full mb-3">
                      <div className="h-1 bg-blue-500 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-sm text-blue-700 animate-pulse">{generationStage}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={generatePlan} 
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? 'Generating...' : 'Generate Plan'}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {project.aiPlan && (
            <Card className="mb-8 border-indigo-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>AI-Generated Plan</CardTitle>
                    <CardDescription>
                      Custom recommendations based on your project requirements
                    </CardDescription>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className="w-6 h-6 text-indigo-500"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-1">Summary</h4>
                  <p className="text-zinc-600">{project.aiPlan.summary}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommended Features</h4>
                  <ul className="space-y-2">
                    {project.aiPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                          <span className="text-xs font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <span className="text-zinc-700">{feature}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommended Tech Stack</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {project.aiPlan.techStack.map((tech, index) => (
                      <div key={index} className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-zinc-700">
                        <div className="flex items-center mb-1">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="w-4 h-4 text-indigo-600 mr-2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                          </svg>
                          <span className="font-medium">{tech.split(':')[0] || tech}</span>
                        </div>
                        {tech.includes(':') && (
                          <p className="text-sm text-zinc-600 ml-6">{tech.split(':')[1].trim()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Timeline</h4>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="flex">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      <p className="text-zinc-700">{project.aiPlan.timeline}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {project.status === 'planning_complete' && (
                <CardFooter className="border-t bg-zinc-50/50 flex justify-end gap-3">
                  <Button 
                    onClick={rejectPlan}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Reject Plan
                  </Button>
                  <Button 
                    onClick={approvePlan}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Plan
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
          
          {/* Building Interface */}
          {project.status === 'building' && (
            <Card>
              <CardHeader>
                <CardTitle>Building Your Project</CardTitle>
                <CardDescription>
                  Your plan has been approved! Use the editor below to build your project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BuildingInterface projectId={projectId} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t bg-white mt-auto">
        <div className="container mx-auto text-center text-zinc-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Marble. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 