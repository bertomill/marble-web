'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import EnhancedCodeEditor from '@/components/EnhancedCodeEditor';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { use } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type BuildStep = {
  phase: string;
  tasks: string[];
};

type DataSchemaEntity = {
  entity: string;
  fields: string[];
  relationships: string[];
};

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
    buildSteps: BuildStep[];
    dataSchema: DataSchemaEntity[];
    folderStructure: string[];
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
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<ProjectData | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);

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

  // Enable editing of the AI plan
  const startEditingPlan = () => {
    setEditingPlan(true);
    setEditData(project);
  };

  // Save edited AI plan
  const saveEditedPlan = async () => {
    if (!editData || !projectId) return;
    
    try {
      setIsGenerating(true);
      
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        'aiPlan': editData.aiPlan
      });
      
      setProject(prevProject => {
        if (!prevProject) return null;
        return { ...prevProject, aiPlan: editData.aiPlan };
      });
      
      setEditingPlan(false);
    } catch (error) {
      console.error('Error saving AI plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Cancel editing the AI plan
  const cancelEditingPlan = () => {
    setEditingPlan(false);
    setEditData(project);
  };
  
  // Handle changes to AI plan fields
  const handlePlanChange = (field: string, value: any) => {
    if (!editData) return;
    
    setEditData(prev => {
      if (!prev || !prev.aiPlan) return prev;
      return {
        ...prev,
        aiPlan: {
          ...prev.aiPlan,
          [field]: value
        }
      };
    });
  };
  
  // Handle changes to a specific feature
  const handleFeatureChange = (index: number, value: string) => {
    if (!editData || !editData.aiPlan) return;
    
    const newFeatures = [...editData.aiPlan.features];
    newFeatures[index] = value;
    
    handlePlanChange('features', newFeatures);
  };
  
  // Handle changes to a specific tech stack item
  const handleTechStackChange = (index: number, value: string) => {
    if (!editData || !editData.aiPlan) return;
    
    const newTechStack = [...editData.aiPlan.techStack];
    newTechStack[index] = value;
    
    handlePlanChange('techStack', newTechStack);
  };
  
  // Handle changes to build steps
  const handleBuildStepChange = (phaseIndex: number, field: 'phase' | 'tasks', value: string | string[]) => {
    if (!editData || !editData.aiPlan) return;
    
    const newBuildSteps = [...editData.aiPlan.buildSteps];
    newBuildSteps[phaseIndex] = {
      ...newBuildSteps[phaseIndex],
      [field]: value
    };
    
    handlePlanChange('buildSteps', newBuildSteps);
  };
  
  // Handle changes to a specific task in build steps
  const handleTaskChange = (phaseIndex: number, taskIndex: number, value: string) => {
    if (!editData || !editData.aiPlan) return;
    
    const newBuildSteps = [...editData.aiPlan.buildSteps];
    const newTasks = [...newBuildSteps[phaseIndex].tasks];
    newTasks[taskIndex] = value;
    
    newBuildSteps[phaseIndex] = {
      ...newBuildSteps[phaseIndex],
      tasks: newTasks
    };
    
    handlePlanChange('buildSteps', newBuildSteps);
  };
  
  // Toggle task completion state
  const toggleTaskCompletion = (phaseIndex: number, taskIndex: number) => {
    if (!project || !project.aiPlan) return;
    
    const task = project.aiPlan.buildSteps[phaseIndex].tasks[taskIndex];
    const isCompleted = task.startsWith('✅ ');
    
    const newBuildSteps = [...project.aiPlan.buildSteps];
    const newTasks = [...newBuildSteps[phaseIndex].tasks];
    
    if (isCompleted) {
      newTasks[taskIndex] = task.substring(2).trim();
    } else {
      newTasks[taskIndex] = `✅ ${task}`;
    }
    
    newBuildSteps[phaseIndex] = {
      ...newBuildSteps[phaseIndex],
      tasks: newTasks
    };
    
    const projectRef = doc(db, 'projects', projectId);
    updateDoc(projectRef, {
      'aiPlan.buildSteps': newBuildSteps
    });
    
    setProject(prev => {
      if (!prev || !prev.aiPlan) return prev;
      return {
        ...prev,
        aiPlan: {
          ...prev.aiPlan,
          buildSteps: newBuildSteps
        }
      };
    });
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
                  <div className="flex gap-2">
                    {!editingPlan && (
                      <Button 
                        onClick={startEditingPlan} 
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit Plan
                      </Button>
                    )}
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
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                {/* Summary Section */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Summary</h4>
                  {editingPlan ? (
                    <Textarea
                      value={editData?.aiPlan?.summary || ''}
                      onChange={(e) => handlePlanChange('summary', e.target.value)}
                      rows={3}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-zinc-600">{project.aiPlan.summary}</p>
                  )}
                </div>
                
                {/* Features Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommended Features</h4>
                  {editingPlan ? (
                    <div className="space-y-2">
                      {editData?.aiPlan?.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <Input
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="flex-grow"
                          />
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (!editData?.aiPlan?.features) return;
                          handlePlanChange('features', [...editData.aiPlan.features, '']);
                        }}
                        className="mt-2"
                      >
                        Add Feature
                      </Button>
                    </div>
                  ) : (
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
                  )}
                </div>
                
                {/* Tech Stack Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommended Tech Stack</h4>
                  {editingPlan ? (
                    <div className="space-y-2">
                      {editData?.aiPlan?.techStack.map((tech, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="w-4 h-4 text-indigo-600 flex-shrink-0"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                          </svg>
                          <Input
                            value={tech}
                            onChange={(e) => handleTechStackChange(index, e.target.value)}
                            className="flex-grow"
                          />
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (!editData?.aiPlan?.techStack) return;
                          handlePlanChange('techStack', [...editData.aiPlan.techStack, '']);
                        }}
                        className="mt-2"
                      >
                        Add Technology
                      </Button>
                    </div>
                  ) : (
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
                  )}
                </div>
                
                {/* Build Steps / Implementation Plan Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Build Process</h4>
                  {editingPlan ? (
                    <div className="space-y-4">
                      {editData?.aiPlan?.buildSteps?.map((phase, phaseIndex) => (
                        <div key={phaseIndex} className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-2">
                            <label className="text-xs text-gray-500">Phase Name</label>
                            <Input
                              value={phase.phase}
                              onChange={(e) => handleBuildStepChange(phaseIndex, 'phase', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Tasks</label>
                            <div className="space-y-2 mt-1">
                              {phase.tasks.map((task, taskIndex) => (
                                <div key={taskIndex} className="flex items-center gap-2">
                                  <span className="text-gray-400 text-xs">{taskIndex + 1}.</span>
                                  <Input
                                    value={task}
                                    onChange={(e) => handleTaskChange(phaseIndex, taskIndex, e.target.value)}
                                    className="flex-grow"
                                  />
                                </div>
                              ))}
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const newBuildSteps = [...editData.aiPlan!.buildSteps];
                                  newBuildSteps[phaseIndex].tasks.push('');
                                  handlePlanChange('buildSteps', newBuildSteps);
                                }}
                                className="mt-2"
                              >
                                Add Task
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          if (!editData?.aiPlan?.buildSteps) return;
                          const newSteps = [...editData.aiPlan.buildSteps, { phase: 'New Phase', tasks: [''] }];
                          handlePlanChange('buildSteps', newSteps);
                        }}
                      >
                        Add Phase
                      </Button>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {project.aiPlan.buildSteps?.map((phase, phaseIndex) => (
                        <AccordionItem key={phaseIndex} value={`phase-${phaseIndex}`} className="border border-green-100 bg-green-50 rounded-lg mb-3 overflow-hidden">
                          <AccordionTrigger className="px-4 py-2 text-green-800 hover:bg-green-100 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <span className="bg-green-200 text-green-800 rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium">
                                {phaseIndex + 1}
                              </span>
                              <span className="font-medium">{phase.phase}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3 pt-1">
                            <ul className="space-y-2">
                              {phase.tasks.map((task, taskIndex) => (
                                <li key={taskIndex} className="flex items-start gap-2">
                                  <Checkbox 
                                    id={`task-${phaseIndex}-${taskIndex}`}
                                    checked={task.startsWith('✅')}
                                    onCheckedChange={() => toggleTaskCompletion(phaseIndex, taskIndex)}
                                    className="mt-1"
                                  />
                                  <label 
                                    htmlFor={`task-${phaseIndex}-${taskIndex}`}
                                    className={`text-sm leading-tight ${task.startsWith('✅') ? 'line-through text-green-700' : 'text-zinc-700'}`}
                                  >
                                    {task.startsWith('✅') ? task.substring(2).trim() : task}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
                
                {/* Data Schema Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Data Schema</h4>
                  {editingPlan ? (
                    <div className="space-y-4">
                      {editData?.aiPlan?.dataSchema?.map((entity, entityIndex) => (
                        <div key={entityIndex} className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-2">
                            <label className="text-xs text-gray-500">Entity Name</label>
                            <Input
                              value={entity.entity}
                              onChange={(e) => {
                                const newSchema = [...editData.aiPlan!.dataSchema];
                                newSchema[entityIndex] = {
                                  ...newSchema[entityIndex],
                                  entity: e.target.value
                                };
                                handlePlanChange('dataSchema', newSchema);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="mb-2">
                            <label className="text-xs text-gray-500">Fields</label>
                            <div className="space-y-2 mt-1">
                              {entity.fields.map((field, fieldIndex) => (
                                <div key={fieldIndex} className="flex items-center gap-2">
                                  <Input
                                    value={field}
                                    onChange={(e) => {
                                      const newSchema = [...editData.aiPlan!.dataSchema];
                                      const newFields = [...newSchema[entityIndex].fields];
                                      newFields[fieldIndex] = e.target.value;
                                      newSchema[entityIndex] = {
                                        ...newSchema[entityIndex],
                                        fields: newFields
                                      };
                                      handlePlanChange('dataSchema', newSchema);
                                    }}
                                    className="flex-grow"
                                  />
                                </div>
                              ))}
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const newSchema = [...editData.aiPlan!.dataSchema];
                                  newSchema[entityIndex].fields.push('');
                                  handlePlanChange('dataSchema', newSchema);
                                }}
                              >
                                Add Field
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Relationships</label>
                            <div className="space-y-2 mt-1">
                              {entity.relationships.map((rel, relIndex) => (
                                <div key={relIndex} className="flex items-center gap-2">
                                  <Input
                                    value={rel}
                                    onChange={(e) => {
                                      const newSchema = [...editData.aiPlan!.dataSchema];
                                      const newRels = [...newSchema[entityIndex].relationships];
                                      newRels[relIndex] = e.target.value;
                                      newSchema[entityIndex] = {
                                        ...newSchema[entityIndex],
                                        relationships: newRels
                                      };
                                      handlePlanChange('dataSchema', newSchema);
                                    }}
                                    className="flex-grow"
                                  />
                                </div>
                              ))}
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const newSchema = [...editData.aiPlan!.dataSchema];
                                  newSchema[entityIndex].relationships.push('');
                                  handlePlanChange('dataSchema', newSchema);
                                }}
                              >
                                Add Relationship
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          if (!editData?.aiPlan?.dataSchema) return;
                          const newSchema = [...editData.aiPlan.dataSchema, { entity: 'New Entity', fields: [''], relationships: [''] }];
                          handlePlanChange('dataSchema', newSchema);
                        }}
                      >
                        Add Entity
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {project.aiPlan.dataSchema?.map((entity, entityIndex) => (
                        <div key={entityIndex} className="bg-violet-50 border border-violet-100 rounded-lg p-4">
                          <div className="font-medium text-violet-800 mb-2 flex items-center">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              strokeWidth={1.5} 
                              stroke="currentColor" 
                              className="w-4 h-4 mr-2"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                            </svg>
                            {entity.entity}
                          </div>
                          <div className="pl-6 mb-2">
                            <h5 className="text-xs font-medium text-violet-600 mb-1">Fields:</h5>
                            <ul className="space-y-1">
                              {entity.fields.map((field, fieldIndex) => (
                                <li key={fieldIndex} className="text-sm text-violet-700">
                                  • {field}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {entity.relationships.length > 0 && (
                            <div className="pl-6">
                              <h5 className="text-xs font-medium text-violet-600 mb-1">Relationships:</h5>
                              <ul className="space-y-1">
                                {entity.relationships.map((rel, relIndex) => (
                                  <li key={relIndex} className="text-sm text-violet-700">
                                    • {rel}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Folder Structure Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Folder Structure</h4>
                  {editingPlan ? (
                    <div>
                      <Textarea
                        value={editData?.aiPlan?.folderStructure.join('\n') || ''}
                        onChange={(e) => {
                          const folders = e.target.value.split('\n').filter(line => line.trim() !== '');
                          handlePlanChange('folderStructure', folders);
                        }}
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-zinc-500 mt-1">
                        Each line represents a file or folder. Use indentation to show hierarchy.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="font-mono text-sm whitespace-pre">
                        {project.aiPlan.folderStructure?.join('\n')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {editingPlan ? (
                <CardFooter className="border-t bg-zinc-50/50 flex justify-end gap-3">
                  <Button 
                    onClick={cancelEditingPlan}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveEditedPlan}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                </CardFooter>
              ) : (
                project.status === 'planning_complete' && (
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
                )
              )}
            </CardContent>
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
                <EnhancedCodeEditor 
                  projectId={projectId} 
                  projectContext={{
                    name: project.name,
                    description: project.description,
                    businessType: project.businessType,
                    goals: project.goals,
                    targetAudience: project.targetAudience,
                    userFlow: project.userFlow,
                    features: project.aiPlan?.features || [],
                    techStack: project.aiPlan?.techStack || [],
                    buildSteps: project.aiPlan?.buildSteps || [],
                    dataSchema: project.aiPlan?.dataSchema || [],
                    folderStructure: project.aiPlan?.folderStructure || []
                  }}
                />
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