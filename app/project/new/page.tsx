'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
// doc, setDoc, collection, serverTimestamp, getDocs, query, where are firebase function
import { doc, setDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Pencil, Check, Code } from 'lucide-react';

// TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

// Define competitor type
type Competitor = {
  name: string;
  description: string;
  url?: string;
};

// Define UserJourneyStep type
interface UserJourneyStep {
  id: string;
  content: string;
}

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
  dataSchema: PlanEntity[];
  buildSteps: PlanPhase[];
  techStack: string[];
}

// For project form data
interface ProjectFormData {
  name: string;
  projectType: string;
  description: string;
  targetAudience: string;
  valueProposition: string;
  userFlow: UserJourneyStep[];
  competitors: Competitor[];
}

// For the editedContent state
interface EditedContent {
  summary?: string;
  keyFeatures?: string[];
  dataSchema?: PlanEntity[];
  buildSteps?: PlanPhase[];
  techStack?: string[];
  userFlow?: UserJourneyStep[];
  [key: string]: string | string[] | PlanEntity[] | PlanPhase[] | UserJourneyStep[] | undefined;
}

export default function NewProject() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    projectType: 'website',
    description: '',
    targetAudience: '',
    valueProposition: '',
    userFlow: [],
    competitors: [],
  });
  // State for journey steps as an array of step objects
  const [journeySteps, setJourneySteps] = useState<UserJourneyStep[]>([
    { id: '1', content: '' }
  ]);
  const [aiResponse, setAiResponse] = useState('');
  const [showCompetitorSearch, setShowCompetitorSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [newStepContent, setNewStepContent] = useState('');
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  // Add progress tracking states
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [editedContent, setEditedContent] = useState<EditedContent>({});
  const [parsedPlan, setParsedPlan] = useState<ProjectPlan | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setSpeechSupported(isSpeechRecognitionSupported);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Update userFlow in formData when journeySteps change
  useEffect(() => {
    // Convert journey steps to text for storage compatibility
    setFormData(prev => ({ 
      ...prev, 
      // Convert the actual userFlow array to just the steps array
      userFlow: journeySteps 
    }));
  }, [journeySteps]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle journey step content change
  const handleStepChange = (id: string, content: string) => {
    setJourneySteps(steps => 
      steps.map(step => step.id === id ? { ...step, content } : step)
    );
  };

  // Add a new journey step
  const addJourneyStep = () => {
    if (!newStepContent.trim()) return;
    
    const newId = String(journeySteps.length + 1);
    setJourneySteps([...journeySteps, { id: newId, content: newStepContent }]);
    setNewStepContent('');
  };

  // Remove a journey step
  const removeJourneyStep = (id: string) => {
    if (journeySteps.length <= 1) return;
    
    setJourneySteps(steps => steps.filter(step => step.id !== id));
  };

  // Move a step up in the list
  const moveStepUp = (id: string) => {
    setJourneySteps(steps => {
      const index = steps.findIndex(step => step.id === id);
      if (index <= 0) return steps;
      
      const newSteps = [...steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index - 1];
      newSteps[index - 1] = temp;
      
      return newSteps;
    });
  };

  // Move a step down in the list
  const moveStepDown = (id: string) => {
    setJourneySteps(steps => {
      const index = steps.findIndex(step => step.id === id);
      if (index >= steps.length - 1) return steps;
      
      const newSteps = [...steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index + 1];
      newSteps[index + 1] = temp;
      
      return newSteps;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    setProgress(10);
    setStatusMessage('Validating project information...');
    
    try {
      // After a brief delay, update progress
      setTimeout(() => {
        setProgress(20);
        setStatusMessage('Preparing to generate project plan...');
      }, 500);
      
      // Set up progress simulation for the long-running AI operation
      let progressInterval: NodeJS.Timeout | null = null;
      const startProgressSimulation = () => {
        // Start at 25% and gradually increase to 60% while waiting for API response
        setProgress(25);
        setStatusMessage('Generating personalized project plan with AI...');
        
        let currentProgress = 25;
        progressInterval = setInterval(() => {
          // Increment by larger amounts (5% at a time) with less frequent updates
          if (currentProgress < 60) {
            // Use larger increments (5% instead of 1%)
            currentProgress += 5;
            setProgress(currentProgress);
            
            // Update messages at certain thresholds to provide more feedback
            if (currentProgress === 30) {
              setStatusMessage('Analyzing project requirements...');
            } else if (currentProgress === 45) {
              setStatusMessage('Designing technical architecture...');
            } else if (currentProgress === 55) {
              setStatusMessage('Finalizing project recommendations...');
            }
          }
        }, 2000); // Update less frequently - every 2 seconds instead of 500ms
      };
      
      startProgressSimulation();
      
      // Generate a personalized AI response based on the project details
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: formData.name,
          projectType: formData.projectType,
          description: formData.description,
          targetAudience: formData.targetAudience,
          valueProposition: formData.valueProposition,
          userFlow: formData.userFlow,
        }),
      });

      // Clear the progress simulation interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (!response.ok) {
        throw new Error('Failed to generate project plan');
      }

      setProgress(70);
      setStatusMessage('Plan generated successfully. Processing results...');
      
      const data = await response.json();
      setAiResponse(data.response);
      
      // Create a new project in Firestore
      setTimeout(() => {
        setProgress(85);
        setStatusMessage('Creating project in database...');
      }, 500);
      
      const projectsRef = collection(db, 'projects');
      const newProjectRef = doc(projectsRef);
      
      await setDoc(newProjectRef, {
        ...formData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'planning', // planning, building, completed
        aiResponse: data.response,
        journeySteps // store the structured journey steps
      });
      
      setProgress(100);
      setStatusMessage('Project successfully created!');
      
      // Short delay before showing competitor search
      setTimeout(() => {
        setShowCompetitorSearch(true);
        setIsSubmitting(false);
        setProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating project:', error);
      setStatusMessage('Error creating project. Please try again.');
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  // Search for competitors using OpenAI's web search API
  const searchCompetitors = async () => {
    setIsSearching(true);
    setSearchError('');
    try {
      const response = await fetch('/api/search-competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: formData.name,
          projectType: formData.projectType,
          description: formData.description,
          targetAudience: formData.targetAudience,
          valueProposition: formData.valueProposition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search competitors');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, competitors: data.competitors }));
      
      // After finding competitors, update the project in Firestore
      if (user) {
        try {
          const projectsRef = collection(db, 'projects');
          const q = query(projectsRef, where("userId", "==", user.uid), where("name", "==", formData.name));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const projectDoc = querySnapshot.docs[0];
            await setDoc(doc(db, 'projects', projectDoc.id), {
              competitors: data.competitors
            }, { merge: true });
          }
        } catch (error) {
          console.error("Error updating project with competitors:", error);
        }
      }
    } catch (error) {
      console.error('Error searching competitors:', error);
      setSearchError('Failed to search for competitors. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Speech recognition functionality
  const startListening = useCallback((fieldName: string) => {
    if (!speechSupported) return;

    setIsListening(true);
    setCurrentField(fieldName);

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      
      // Check if it's a journey step field
      if (fieldName.startsWith('journey-step-')) {
        const stepId = fieldName.replace('journey-step-', '');
        const step = journeySteps.find(s => s.id === stepId);
        
        if (step) {
          const newContent = step.content ? `${step.content} ${transcript}` : transcript;
          handleStepChange(stepId, newContent);
        }
      } else if (fieldName === 'new-step') {
        setNewStepContent(prev => prev ? `${prev} ${transcript}` : transcript);
      } else {
        // For other form fields
        const currentValue = formData[fieldName as keyof typeof formData] as string;
        setFormData(prev => ({ 
          ...prev, 
          [fieldName]: currentValue ? `${currentValue} ${transcript}` : transcript
        }));
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setCurrentField(null);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setCurrentField(null);
    };
    
    recognition.start();
  }, [speechSupported, formData, journeySteps]);

  // Stop listening
  const stopListening = () => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.stop();
      setIsListening(false);
      setCurrentField(null);
    }
  };

  // Render microphone button for each field
  const renderMicButton = (fieldName: string) => {
    if (!speechSupported) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => isListening && currentField === fieldName ? stopListening() : startListening(fieldName)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full 
                ${isListening && currentField === fieldName 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
              aria-label={isListening && currentField === fieldName ? "Stop dictation" : "Start dictation"}
            >
              {isListening && currentField === fieldName ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening && currentField === fieldName 
              ? "Stop dictation" 
              : "Start dictation"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // Handle keyboard shortcut (F4) to trigger speech recognition
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F4 shortcut
      if (e.key === 'F4') {
        e.preventDefault();
        
        // Find focused element
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.id) {
          const fieldName = activeElement.id;
          if (formData.hasOwnProperty(fieldName)) {
            startListening(fieldName);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [formData, startListening]);

  // Navigate to dashboard after completing the flow
  const goToDashboard = () => {
    router.push('/dashboard');
  };

  // Component for a journey step card - enhance with numbers and better visuals
  const JourneyStepCard = ({ step, index, total }: { step: UserJourneyStep; index: number; total: number }) => {
    return (
      <div className="mb-3">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex">
              {/* Step number */}
              <div className="flex-none bg-indigo-50 border-r border-gray-200 flex flex-col items-center justify-center px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={step.content}
                      onChange={(e) => handleStepChange(step.id, e.target.value)}
                      placeholder={`Step ${index + 1}: Describe what the user does...`}
                      className="min-h-[60px] pr-10 resize-none border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    {renderMagicButton(`journey-step-${step.id}`)}
                    {renderMicButton(`journey-step-${step.id}`)}
                  </div>
                  
                  <div className="flex flex-col space-y-1 p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStepUp(step.id)}
                      disabled={index === 0}
                      className="p-1 h-7 w-7 text-gray-400 hover:text-gray-600"
                      aria-label="Move step up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 15l-6-6-6 6"/>
                      </svg>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStepDown(step.id)}
                      disabled={index === total - 1}
                      className="p-1 h-7 w-7 text-gray-400 hover:text-gray-600"
                      aria-label="Move step down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </Button>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJourneyStep(step.id)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={journeySteps.length <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Generate field content with AI
  const generateFieldContent = async (fieldName: string) => {
    setGeneratingField(fieldName);
    
    try {
      const response = await fetch('/api/generate-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldType: fieldName,
          projectType: formData.projectType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      if (fieldName === 'new-step') {
        setNewStepContent(data.content);
      } else if (fieldName.startsWith('journey-step-')) {
        const stepId = fieldName.replace('journey-step-', '');
        handleStepChange(stepId, data.content);
      } else {
        setFormData(prev => ({ 
          ...prev, 
          [fieldName]: data.content
        }));
      }
    } catch (error) {
      console.error('Error generating field content:', error);
    } finally {
      setGeneratingField(null);
    }
  };

  // Render content generation button for each field
  const renderMagicButton = (fieldName: string) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => generateFieldContent(fieldName)}
              className={`absolute right-9 top-1/2 -translate-y-1/2 p-1.5 rounded-full 
                ${generatingField === fieldName 
                  ? 'bg-purple-100 text-purple-600 animate-pulse' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-purple-100 hover:text-purple-600'}`}
              aria-label="Generate content with AI"
              disabled={generatingField !== null}
            >
              {generatingField === fieldName ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{generatingField === fieldName 
              ? "Generating..." 
              : "Generate with AI"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  useEffect(() => {
    if (aiResponse) {
      try {
        // Try to extract JSON from the response if it's wrapped in markdown code blocks
        const jsonMatch = aiResponse.match(/```(?:json)?([\s\S]*?)```/);
        const jsonContent = jsonMatch ? jsonMatch[1].trim() : aiResponse;
        const parsed = JSON.parse(jsonContent);
        setParsedPlan(parsed);
        
        // Initialize edited content with the parsed data
        setEditedContent(parsed);
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        // If parsing fails, just display the raw text
      }
    }
  }, [aiResponse]);

  const toggleEditSection = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleContentChange = (section: string, value: string | string[] | PlanEntity[] | PlanPhase[]) => {
    setEditedContent(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const saveProjectUpdates = () => {
    // Exit all edit modes
    setEditingSections({
      summary: false,
      keyFeatures: false,
      techStack: false,
      dataSchema: false,
      folderStructure: false,
      developmentPlan: false
    });

    // Save the edited content back to formData
    setFormData(prev => ({
      ...prev,
      name: typeof editedContent.name === 'string' ? editedContent.name : prev.name,
      description: typeof editedContent.summary === 'string' ? editedContent.summary : prev.description,
      userFlow: prev.userFlow,
      projectType: prev.projectType,
      targetAudience: prev.targetAudience,
      valueProposition: prev.valueProposition,
      competitors: prev.competitors
    }));

    console.log("Changes saved. Your project plan has been updated.");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-md mb-2"></div>
          <p className="text-zinc-400 text-sm">Loading authentication...</p>
        </div>
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
        <div className="container mx-auto">
          {!showCompetitorSearch ? (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
                {speechSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const activeElement = document.activeElement as HTMLElement;
                      if (activeElement && activeElement.id && formData.hasOwnProperty(activeElement.id)) {
                        startListening(activeElement.id);
                      }
                    }}
                    className="text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    Start dictation (F4)
                  </Button>
                )}
              </div>
              
              {!speechSupported && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <p>Speech-to-text is not supported in your browser. For the best experience, use Chrome, Edge, or Safari.</p>
                </div>
              )}
              
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Tell Me About Your Project</CardTitle>
                  <CardDescription>
                    Fill in the details below to create your project description.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Project Type Selection */}
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3">I&apos;m building a:</p>
                      <div className="flex gap-4">
                        <label className={`flex items-center justify-center p-4 rounded-lg border ${formData.projectType === 'website' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} cursor-pointer transition-all hover:border-indigo-200 w-1/2`}>
                          <input
                            type="radio"
                            name="projectType"
                            value="website"
                            checked={formData.projectType === 'website'}
                            onChange={handleFormChange}
                            className="sr-only"
                          />
                          <span className="flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <span className={`font-medium ${formData.projectType === 'website' ? 'text-indigo-700' : 'text-gray-700'}`}>Website</span>
                          </span>
                        </label>
                        
                        <label className={`flex items-center justify-center p-4 rounded-lg border ${formData.projectType === 'app' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} cursor-pointer transition-all hover:border-indigo-200 w-1/2`}>
                          <input
                            type="radio"
                            name="projectType"
                            value="app"
                            checked={formData.projectType === 'app'}
                            onChange={handleFormChange}
                            className="sr-only"
                          />
                          <span className="flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className={`font-medium ${formData.projectType === 'app' ? 'text-indigo-700' : 'text-gray-700'}`}>Mobile App</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  
                    {/* Narrative Paragraph */}
                    <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-lg leading-relaxed">
                        I&apos;m building a {formData.projectType} called{" "}
                        <span className="relative inline-block">
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            required
                            placeholder="Project Name"
                            className="w-48 px-0 border-0 border-b border-dashed text-center bg-transparent focus:ring-0 focus-visible:ring-0"
                          />
                          {renderMagicButton('name')}
                          {renderMicButton('name')}
                        </span>
                        {" "}that{" "}
                        <span className="relative inline-block mb-2 w-full">
                          <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleFormChange}
                            required
                            placeholder="describes what your project does"
                            className="min-h-[40px] w-full border-0 border-b border-dashed bg-transparent focus:ring-0 focus-visible:ring-0 resize-none px-0"
                          />
                          {renderMagicButton('description')}
                          {renderMicButton('description')}
                        </span>
                        {" "}for{" "}
                        <span className="relative inline-block mb-2 w-full">
                          <Textarea
                            id="targetAudience"
                            name="targetAudience"
                            value={formData.targetAudience}
                            onChange={handleFormChange}
                            required
                            placeholder="describe your target users"
                            className="min-h-[40px] w-full border-0 border-b border-dashed bg-transparent focus:ring-0 focus-visible:ring-0 resize-none px-0"
                          />
                          {renderMagicButton('targetAudience')}
                          {renderMicButton('targetAudience')}
                        </span>
                        {" "}to{" "}
                        <span className="relative inline-block mb-2 w-full">
                          <Textarea
                            id="valueProposition"
                            name="valueProposition"
                            value={formData.valueProposition}
                            onChange={handleFormChange}
                            required
                            placeholder="describe the value proposition (what problem does it solve?)"
                            className="min-h-[40px] w-full border-0 border-b border-dashed bg-transparent focus:ring-0 focus-visible:ring-0 resize-none px-0"
                          />
                          {renderMagicButton('valueProposition')}
                          {renderMicButton('valueProposition')}
                        </span>
                        .
                      </p>
                    </div>
                    
                    {/* User Flow Section with Cards */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-2">User Experience Journey</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Create and order the cards to outline a step-by-step journey of how a user will interact with your {formData.projectType}.
                      </p>
                      
                      <div className="space-y-2 mb-5">
                        {journeySteps.map((step, index) => (
                          <JourneyStepCard 
                            key={step.id} 
                            step={step} 
                            index={index} 
                            total={journeySteps.length} 
                          />
                        ))}
                      </div>
                      
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Journey Step</h4>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 relative">
                            <Textarea
                              id="new-step"
                              value={newStepContent}
                              onChange={(e) => setNewStepContent(e.target.value)}
                              placeholder="Add a new step here..."
                              className="min-h-[60px] pr-10 resize-none border-gray-200 border-dashed focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            {renderMagicButton('new-step')}
                            {renderMicButton('new-step')}
                          </div>
                          <Button
                            type="button"
                            onClick={addJourneyStep}
                            disabled={!newStepContent.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                              <path d="M12 5v14" />
                              <path d="M5 12h14" />
                            </svg>
                            Add Step
                          </Button>
                        </div>
                      </div>
                      
                      <input type="hidden" name="userFlowText" value={JSON.stringify(formData.userFlow)} />
                    </div>
                  
                    <div className="mt-8">
                      {isSubmitting && (
                        <div className="mb-4">
                          <div className="mb-1">
                            <p className="text-zinc-600 font-medium">{statusMessage}</p>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                      <div className="text-right">
                        <Button 
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating Project...
                            </>
                          ) : 'Create Project'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight mb-6">Project Created</h2>
              
              {parsedPlan ? (
                <div className="space-y-6">
                  <Card className="mb-6 w-full shadow-sm border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b pb-3">
                      <div>
                        <CardTitle>Project Plan: {formData.name}</CardTitle>
                        <CardDescription>
                          Here&apos;s your personalized development plan
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={saveProjectUpdates}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Save Changes
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Dashboard Grid Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* Project Summary */}
                        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                          <CardHeader className="px-4 py-3 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg font-semibold">Project Summary</CardTitle>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleEditSection('summary')}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 bg-white flex-1">
                            {editingSections.summary ? (
                              <Textarea
                                value={editedContent.summary || ''}
                                onChange={e => handleContentChange('summary', e.target.value)}
                                className="min-h-[120px] font-normal"
                              />
                            ) : (
                              <p className="text-gray-700 whitespace-pre-line">{editedContent.summary}</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Features */}
                        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                          <CardHeader className="px-4 py-3 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg font-semibold">Key Features</CardTitle>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleEditSection('keyFeatures')}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 bg-white flex-1">
                            {editingSections.keyFeatures ? (
                              <Textarea
                                value={Array.isArray(editedContent.keyFeatures) ? editedContent.keyFeatures.join('\n') : ''}
                                onChange={e => handleContentChange('keyFeatures', e.target.value.split('\n'))}
                                className="min-h-[150px] font-normal"
                              />
                            ) : (
                              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                {Array.isArray(editedContent.keyFeatures) && editedContent.keyFeatures.map((feature, index) => (
                                  <li key={index} className="flex items-start mb-2">
                                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Tech Stack */}
                        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                          <CardHeader className="px-4 py-3 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg font-semibold">Recommended Tech Stack</CardTitle>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleEditSection('techStack')}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 bg-white flex-1">
                            {editingSections.techStack ? (
                              <Textarea
                                className="min-h-20 focus:ring-0 focus:outline-none resize-none"
                                value={Array.isArray(editedContent.techStack) 
                                  ? editedContent.techStack.join('\n') 
                                  : editedContent.techStack || ''}
                                onChange={(e) => setEditedContent({
                                  ...editedContent,
                                  techStack: e.target.value.split('\n')
                                })}
                                disabled={!editingSections.techStack}
                              />
                            ) : (
                              <div className="flex flex-wrap">
                                {Array.isArray(editedContent.techStack) && editedContent.techStack.map((tech, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                                    <Code className="h-3 w-3 mr-1" />
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Data Schema - Spans full width */}
                        {editedContent.dataSchema && (
                          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2 xl:col-span-3">
                            <CardHeader className="px-4 py-3 bg-white border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold">Data Schema</CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleEditSection('dataSchema')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 bg-white">
                              {editingSections.dataSchema ? (
                                <Textarea
                                  value={JSON.stringify(editedContent.dataSchema, null, 2)}
                                  onChange={e => {
                                    try {
                                      handleContentChange('dataSchema', JSON.parse(e.target.value));
                                    } catch {
                                      // Ignore invalid JSON until user completes editing
                                    }
                                  }}
                                  className="min-h-[200px] font-mono text-sm"
                                />
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {Array.isArray(editedContent.dataSchema) && (editedContent.dataSchema as PlanEntity[]).map((entity, index) => (
                                    <div key={index} className="border-l-2 border-green-500 pl-4 bg-white p-3 rounded shadow-sm">
                                      <h4 className="font-medium text-green-700">{entity.entity}</h4>
                                      <div className="grid grid-cols-1 gap-4 text-sm">
                                        <div>
                                          <h5 className="font-medium text-gray-600">Fields</h5>
                                          <ul className="list-disc pl-5 text-gray-700">
                                            {Array.isArray(entity.fields) && entity.fields.map((field: string, fieldIndex: number) => (
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
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Build Steps - Spans full width */}
                        {editedContent.buildSteps && (
                          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2 xl:col-span-3">
                            <CardHeader className="px-4 py-3 bg-white border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold">Development Plan</CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleEditSection('buildSteps')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 bg-white">
                              {editingSections.buildSteps ? (
                                <Textarea
                                  value={JSON.stringify(editedContent.buildSteps, null, 2)}
                                  onChange={e => {
                                    try {
                                      handleContentChange('buildSteps', JSON.parse(e.target.value));
                                    } catch {
                                      // Ignore invalid JSON until user completes editing
                                    }
                                  }}
                                  className="min-h-[200px] font-mono text-sm"
                                />
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {Array.isArray(editedContent.buildSteps) && (editedContent.buildSteps as PlanPhase[]).map((phase, index) => (
                                    <div key={index} className="border-l-2 border-indigo-500 pl-4 bg-white p-3 rounded shadow-sm">
                                      <h4 className="font-medium text-indigo-700">{phase.phase}</h4>
                                      <ul className="list-disc pl-5 text-gray-700 text-sm">
                                        {Array.isArray(phase.tasks) && phase.tasks.map((task: string, taskIndex: number) => (
                                          <li key={taskIndex}>{task}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Folder Structure - Spans full width */}
                        {editedContent.folderStructure && (
                          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2 xl:col-span-3">
                            <CardHeader className="px-4 py-3 bg-white border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold">Folder Structure</CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleEditSection('folderStructure')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 bg-white">
                              {editingSections.folderStructure ? (
                                <Textarea
                                  value={Array.isArray(editedContent.folderStructure) ? editedContent.folderStructure.join('\n') : ''}
                                  onChange={e => handleContentChange('folderStructure', e.target.value.split('\n'))}
                                  className="min-h-[200px] font-mono text-sm"
                                />
                              ) : (
                                <pre className="bg-gray-50 p-3 rounded text-gray-700 text-sm overflow-x-auto border border-gray-100">
                                  {Array.isArray(editedContent.folderStructure) && editedContent.folderStructure.join('\n')}
                                </pre>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>AI Analysis</CardTitle>
                    <CardDescription>
                      Here&apos;s your personalized project analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="prose">
                    <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
                  </CardContent>
                </Card>
              )}
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Want Some Inspiration?</CardTitle>
                  <CardDescription>
                    We can find similar successful {formData.projectType}s to help inspire your project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formData.competitors.length === 0 ? (
                    <div className="flex flex-col items-center p-6 text-center">
                      <p className="mb-4">Would you like us to find some similar successful {formData.projectType}s on the market for inspiration?</p>
                      <div className="flex gap-3">
                        <Button
                          onClick={searchCompetitors}
                          disabled={isSearching}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {isSearching ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Searching...
                            </>
                          ) : 'Yes, Find Examples'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={goToDashboard}
                        >
                          No, Go to Dashboard
                        </Button>
                      </div>
                      {searchError && <p className="text-red-500 mt-4">{searchError}</p>}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Similar Projects for Inspiration</h3>
                      <div className="space-y-4">
                        {formData.competitors.map((competitor, index) => (
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
                      <div className="mt-6 text-center">
                        <Button onClick={goToDashboard} className="bg-green-600 hover:bg-green-700 text-white">
                          Continue to Dashboard
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
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