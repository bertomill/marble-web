'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { use } from 'react';
import { Code, Check, Pencil, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Define interfaces for the plan data
interface PlanEntity {
  entity: string;
  fields: string[];
  description: string;
}

interface PlanPhase {
  phase: string;
  tasks: string[];
  duration: string;
}

interface ProjectPlan {
  summary: string;
  keyFeatures: string[];
  techStack: string[];
  dataSchema: PlanEntity[];
  buildSteps: PlanPhase[];
  folderStructure?: string[];
}

interface Competitor {
  name: string;
  description: string;
  url?: string;
}

type ProjectData = {
  name: string;
  description: string;
  businessType: string;
  goals: string;
  targetAudience: string;
  valueProposition: string;
  userFlow: {id: string, content: string}[];
  userId: string;
  createdAt: Timestamp | Date | null;
  status: string;
  aiResponse?: string;
  competitors?: Competitor[];
  projectType?: string;
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [parsedPlan, setParsedPlan] = useState<ProjectPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
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
          
          // Parse AI response if it exists
          if (projectData.aiResponse) {
            try {
              const parsedResponse = JSON.parse(projectData.aiResponse);
              setParsedPlan(parsedResponse);
            } catch (parseError) {
              console.error('Error parsing AI response:', parseError);
              // If direct parsing fails, try to extract structured data
              try {
                // Extract sections from the text
                const extractedPlan = {
                  summary: extractSection(projectData.aiResponse, "Summary", "Key Features") || 
                           extractSection(projectData.aiResponse, "Project Summary", "Key Features") || "",
                  keyFeatures: extractListItems(projectData.aiResponse, "Key Features", "Tech Stack") || 
                               extractListItems(projectData.aiResponse, "Key Features", "Recommended Tech Stack") || [],
                  techStack: extractListItems(projectData.aiResponse, "Tech Stack", "Data Schema") || 
                             extractListItems(projectData.aiResponse, "Recommended Tech Stack", "Data Schema") ||
                             extractListItems(projectData.aiResponse, "Tech Stack", null) || [],
                  dataSchema: [],
                  buildSteps: []
                };
                setParsedPlan(extractedPlan as ProjectPlan);
              } catch (extractError) {
                console.error('Error extracting plan data:', extractError);
              }
            }
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

  // Helper function to extract a section of text between two headings
  const extractSection = (text: string, startSection: string, endSection: string | null): string => {
    const startRegex = new RegExp(`(?:##?\\s*${startSection}|${startSection})[:\\s]*(.*?)(?:##?\\s*${endSection}|$)`, 'is');
    const match = text.match(startRegex);
    return match ? match[1].trim() : '';
  };
  
  // Helper function to extract list items from a section
  const extractListItems = (text: string, section: string, endSection: string | null): string[] => {
    const sectionText = extractSection(text, section, endSection);
    if (!sectionText) return [];
    
    // Match list items that start with - or * or numbers (1. 2. etc)
    const listItemRegex = /(?:^|\n)(?:[-*]|\d+\.)\s*([^\n]+)/g;
    const items: string[] = [];
    let match;
    
    while ((match = listItemRegex.exec(sectionText)) !== null) {
      items.push(match[1].trim());
    }
    
    return items;
  };

  // Toggle edit mode for a section
  const toggleEditSection = (section: string) => {
    setEditingSections(prev => {
      // If we're turning off editing, reset the edited fields for this section
      if (prev[section]) {
        setEditedFields(prevFields => {
          const newFields = { ...prevFields };
          delete newFields[section];
          return newFields;
        });
      } else if (project) {
        // If we're turning on editing, initialize the edited field with the current value
        const fieldValue = project[section as keyof ProjectData];
        if (typeof fieldValue === 'string') {
          setEditedFields(prevFields => ({
            ...prevFields,
            [section]: fieldValue
          }));
        }
      }
      
      return {
        ...prev,
        [section]: !prev[section]
      };
    });
  };

  // Handle changes to edited fields
  const handleFieldChange = (section: string, value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [section]: value
    }));
  };

  // Save changes to Firestore
  const saveChanges = async (section: string) => {
    if (!user || !project || !projectId) return;
    
    setIsSaving(true);
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // Update only the edited field
      await updateDoc(projectRef, {
        [section]: editedFields[section]
      });
      
      // Update the local project state
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [section]: editedFields[section]
        };
      });
      
      // Close edit mode for this section
      toggleEditSection(section);
      
      console.log(`Changes saved for ${section}`);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle generating a new AI plan
  const handleGeneratePlan = async () => {
    if (!user || !project || !projectId) return;
    
    setIsGeneratingPlan(true);
    
    try {
      // Implement the logic to generate a new AI plan
      // This is a placeholder and should be replaced with the actual implementation
      console.log('Generating new AI plan');
      
      // After generating the plan, update the project state
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'planning_complete'
        };
      });
      
      // Parse the new AI response
      const newPlan = {
        summary: 'New AI-generated summary',
        keyFeatures: ['New feature 1', 'New feature 2'],
        techStack: ['New tech 1', 'New tech 2'],
        dataSchema: [],
        buildSteps: []
      } as ProjectPlan;
      setParsedPlan(newPlan);
    } catch (error) {
      console.error('Error generating new AI plan:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Loading state
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

  // Not found state
  if (!project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
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

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">
              {editingSections.name ? (
                <Input
                  value={editedFields.name || ''}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  className="text-3xl font-bold h-auto py-1"
                />
              ) : (
                <div className="flex items-center gap-3">
                  {project?.name}
                  <Badge variant="outline" className="capitalize">
                    {project?.status?.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </h2>
            <div className="flex items-center space-x-2">
              {editingSections.name ? (
                <Button 
                  size="sm" 
                  onClick={() => saveChanges('name')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => toggleEditSection('name')}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Project Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Information about your project requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-medium">Project Type</h3>
                    {!editingSections.projectType ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleEditSection('projectType')}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => saveChanges('projectType')}
                        className="h-7 p-0 px-2"
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                  {editingSections.projectType ? (
                    <Input
                      value={editedFields.projectType || ''}
                      onChange={e => handleFieldChange('projectType', e.target.value)}
                      className="text-sm"
                      placeholder="e.g., website, app, platform"
                    />
                  ) : (
                    <p className="text-sm text-zinc-600">{project?.projectType || "Not specified"}</p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-medium">Description</h3>
                    {!editingSections.description ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleEditSection('description')}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => saveChanges('description')}
                        className="h-7 p-0 px-2"
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                  {editingSections.description ? (
                    <Textarea
                      value={editedFields.description || ''}
                      onChange={e => handleFieldChange('description', e.target.value)}
                      className="text-sm"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-zinc-600">{project?.description}</p>
                  )}
                </div>
                
                {project?.businessType && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium">Business Type</h3>
                      {!editingSections.businessType ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleEditSection('businessType')}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => saveChanges('businessType')}
                          className="h-7 p-0 px-2"
                          disabled={isSaving}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>
                    {editingSections.businessType ? (
                      <Input
                        value={editedFields.businessType || ''}
                        onChange={e => handleFieldChange('businessType', e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-zinc-600">{project.businessType}</p>
                    )}
                  </div>
                )}
                
                {project?.goals && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium">Goals</h3>
                      {!editingSections.goals ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleEditSection('goals')}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => saveChanges('goals')}
                          className="h-7 p-0 px-2"
                          disabled={isSaving}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>
                    {editingSections.goals ? (
                      <Textarea
                        value={editedFields.goals || ''}
                        onChange={e => handleFieldChange('goals', e.target.value)}
                        className="text-sm"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-zinc-600">{project.goals}</p>
                    )}
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-medium">Target Audience</h3>
                    {!editingSections.targetAudience ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleEditSection('targetAudience')}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => saveChanges('targetAudience')}
                        className="h-7 p-0 px-2"
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                  {editingSections.targetAudience ? (
                    <Textarea
                      value={editedFields.targetAudience || ''}
                      onChange={e => handleFieldChange('targetAudience', e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-zinc-600">{project?.targetAudience}</p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-medium">Value Proposition</h3>
                    {!editingSections.valueProposition ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleEditSection('valueProposition')}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => saveChanges('valueProposition')}
                        className="h-7 p-0 px-2"
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                  {editingSections.valueProposition ? (
                    <Textarea
                      value={editedFields.valueProposition || ''}
                      onChange={e => handleFieldChange('valueProposition', e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-zinc-600">{project?.valueProposition}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">User Flow</h3>
                  {Array.isArray(project?.userFlow) && project.userFlow.length > 0 && project.userFlow[0].content ? (
                    <div className="space-y-2">
                      {project.userFlow.map((step, index) => (
                        <div key={step.id || index} className="pl-4 border-l border-zinc-200">
                          <p className="text-sm text-zinc-600">
                            <span className="font-medium">Step {index + 1}:</span> {step.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600">No user flow defined</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* AI-Generated Plan */}
          {parsedPlan && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Project Plan</CardTitle>
                <CardDescription>AI-generated development plan for your project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {/* Project Summary */}
                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    <CardHeader className="px-4 py-2 bg-white border-b border-gray-200">
                      <CardTitle className="text-lg font-semibold">Project Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 bg-white flex-1">
                      <p className="text-gray-700 whitespace-pre-line text-sm">{parsedPlan.summary}</p>
                    </CardContent>
                  </Card>
                  
                  {/* Features */}
                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    <CardHeader className="px-4 py-2 bg-white border-b border-gray-200">
                      <CardTitle className="text-lg font-semibold">Key Features</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 bg-white flex-1">
                      <ul className="list-disc pl-4 space-y-0.5 text-gray-700 text-sm">
                        {Array.isArray(parsedPlan.keyFeatures) && parsedPlan.keyFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start mb-1">
                            <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* Tech Stack */}
                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    <CardHeader className="px-4 py-2 bg-white border-b border-gray-200">
                      <CardTitle className="text-lg font-semibold">Recommended Tech Stack</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 bg-white flex-1">
                      <div className="flex flex-wrap">
                        {Array.isArray(parsedPlan.techStack) && parsedPlan.techStack.map((tech, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-1">
                            <Code className="h-3 w-3 mr-1" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Data Schema */}
                {parsedPlan.dataSchema && parsedPlan.dataSchema.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Data Schema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {parsedPlan.dataSchema.map((entity, index) => (
                        <div key={index} className="border-l-2 border-green-500 pl-3 bg-white p-2 rounded shadow-sm">
                          <h4 className="font-medium text-green-700 text-sm">{entity.entity}</h4>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div>
                              <h5 className="font-medium text-gray-600">Fields</h5>
                              <ul className="list-disc pl-4 text-gray-700">
                                {Array.isArray(entity.fields) && entity.fields.map((field, fieldIndex) => (
                                  <li key={fieldIndex}>{field}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-600">Description</h5>
                              <p className="text-gray-700">{entity.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Build Steps */}
                {parsedPlan.buildSteps && parsedPlan.buildSteps.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Development Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {parsedPlan.buildSteps.map((phase, index) => (
                        <div key={index} className="border-l-2 border-indigo-500 pl-3 bg-white p-2 rounded shadow-sm">
                          <h4 className="font-medium text-indigo-700 text-sm">{phase.phase}</h4>
                          <ul className="list-disc pl-4 text-gray-700 text-xs">
                            {Array.isArray(phase.tasks) && phase.tasks.map((task, taskIndex) => (
                              <li key={taskIndex}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Folder Structure */}
                {parsedPlan.folderStructure && parsedPlan.folderStructure.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Folder Structure</h3>
                    <pre className="bg-gray-50 p-2 rounded text-gray-700 text-xs overflow-x-auto border border-gray-100">
                      {parsedPlan.folderStructure.join('\n')}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Competitors */}
          {project?.competitors && project.competitors.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Similar Projects for Inspiration</CardTitle>
                <CardDescription>
                  Competitors and similar {project.projectType || 'projects'} for reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.competitors.map((competitor, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardHeader>
                        <CardTitle>{competitor.name}</CardTitle>
                        {competitor.url && (
                          <CardDescription>
                            <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              {competitor.url}
                            </a>
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p>{competitor.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Code Editor Access Card - show when project has built code */}
          {(project?.status === 'built' || project?.status === 'building_complete') && (
            <Card className="mb-8 border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-indigo-700 flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Project Code
                    </h3>
                    <p className="text-zinc-600 mb-2">
                      Your project code has been generated and is ready to edit.
                      Access the code editor to view and modify your files.
                    </p>
                    <ul className="text-sm text-zinc-500 list-disc list-inside mb-4">
                      <li>All code is saved automatically to your project</li>
                      <li>Edit files and add new ones in the code editor</li>
                      <li>Download your project files for local development</li>
                    </ul>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Link href={`/project/${projectId}/code`}>
                      <Code className="h-4 w-4 mr-2" />
                      Open Code Editor
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-8">
            {project.status === 'planning' && (
              <Button 
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
              >
                {isGeneratingPlan ? 'Generating...' : 'Generate AI Plan'}
              </Button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 border-t bg-white mt-auto">
        <div className="container mx-auto text-center text-zinc-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Marble. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
