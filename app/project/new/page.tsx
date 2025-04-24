'use client';
//useState is a hook that allows you to create a state variable
import { useState, useEffect } from 'react';
//useRouter is a hook that allows you to navigate to a different page
import { useRouter } from 'next/navigation';
//Link is a component that allows you to navigate to a different page
import Link from 'next/link';
//useAuth is a hook that allows you to access the user's authentication state
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export default function NewProject() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    businessType: [] as string[],
    goals: '',
    targetAudience: '',
    userFlow: '',
    competitors: [] as Competitor[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for businessType input field
    if (name === 'businessType') {
      // Parse comma-separated values into an array
      const types = value.split(',').map(type => type.trim()).filter(type => type !== '');
      setFormData(prev => ({ ...prev, [name]: types }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Toggle a business type selection
  const toggleBusinessType = (type: string) => {
    setFormData(prev => {
      const currentTypes = [...prev.businessType];
      
      if (currentTypes.includes(type)) {
        // Remove type if already selected
        return { ...prev, businessType: currentTypes.filter(t => t !== type) };
      } else {
        // Add type if not selected
        return { ...prev, businessType: [...currentTypes, type] };
      }
    });
  };

  const nextStep = () => {
    setStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    console.log('Creating new project:', formData);
    setIsSubmitting(true);
    
    try {
      console.log('Starting project creation in Firestore');
      // Create a new project in Firestore
      const projectsRef = collection(db, 'projects');
      const newProjectRef = doc(projectsRef);
      
      await setDoc(newProjectRef, {
        ...formData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'planning', // planning, building, completed
      });
      
      console.log('Project created successfully with ID:', newProjectRef.id);
      // Redirect to the project page
      router.push(`/project/${newProjectRef.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setIsSubmitting(false);
    }
  };

  // Generate example user flow based on business type
  const generateUserFlowExample = () => {
    const businessTypeString = formData.businessType.join(', ').toLowerCase();
    let example = "";

    if (businessTypeString.includes('ecommerce') || businessTypeString.includes('shop') || businessTypeString.includes('store') || businessTypeString.includes('marketplace')) {
      example = "1. User lands on the homepage and sees featured products\n2. User navigates to product categories or uses search\n3. User views product details, images, and reviews\n4. User adds items to cart and proceeds to checkout\n5. User creates account or logs in\n6. User enters shipping and payment information\n7. User receives order confirmation and tracking details";
    } 
    else if (businessTypeString.includes('blog') || businessTypeString.includes('content') || businessTypeString.includes('news')) {
      example = "1. User discovers content through search or social media\n2. User reads article and explores related content\n3. User subscribes to newsletter for updates\n4. User creates account to comment on articles\n5. User shares content with their network\n6. User receives personalized content recommendations";
    }
    else if (businessTypeString.includes('saas') || businessTypeString.includes('software') || businessTypeString.includes('tool')) {
      example = "1. User signs up for a free trial\n2. User completes onboarding tutorial\n3. User configures basic settings and preferences\n4. User invites team members and assigns roles\n5. User integrates with other tools via API\n6. User upgrades to paid plan after trial\n7. User receives regular feature updates";
    }
    else {
      example = "1. User discovers app through marketing or word-of-mouth\n2. User signs up for an account\n3. User completes initial profile setup\n4. User explores key features through guided onboarding\n5. User performs core actions (e.g., creating content, connecting with others)\n6. User receives notifications and engages regularly\n7. User invites others and becomes a power user";
    }

    setFormData({
      ...formData,
      userFlow: example
    });
  };

  // Generate example business goals based on business type
  const generateBusinessGoalsExample = () => {
    const businessTypeString = formData.businessType.join(', ').toLowerCase();
    let example = "";

    if (businessTypeString.includes('ecommerce') || businessTypeString.includes('shop') || businessTypeString.includes('store') || businessTypeString.includes('marketplace')) {
      example = "• Increase online sales by 30% in the first year\n• Achieve a 15% conversion rate for site visitors\n• Build a loyal customer base with 40% returning customers\n• Expand product catalog to include 200+ items by end of year\n• Reduce cart abandonment rate to under 20%\n• Integrate with social media platforms for social commerce\n• Implement customer reviews and ratings to build trust";
    } 
    else if (businessTypeString.includes('blog') || businessTypeString.includes('content') || businessTypeString.includes('news')) {
      example = "• Grow readership to 10,000 monthly active users\n• Build email subscriber list to 5,000 within first year\n• Generate revenue through premium content subscriptions\n• Increase social media following by 50% each quarter\n• Establish the platform as an authoritative source in the industry\n• Create a community of engaged readers through comments and forums\n• Monetize through strategic sponsorships and native advertising";
    }
    else if (businessTypeString.includes('saas') || businessTypeString.includes('software') || businessTypeString.includes('tool')) {
      example = "• Achieve 1,000 paid users in the first year\n• Maintain a monthly churn rate below 5%\n• Achieve product-market fit with a Net Promoter Score above 40\n• Develop 3 premium tiers with clear upgrade paths\n• Integrate with 5 complementary tools/platforms\n• Establish a customer success program to drive retention\n• Build a developer community around our API";
    }
    else {
      example = "• Launch an MVP within 3 months\n• Onboard 500 users within the first quarter\n• Achieve product-market fit based on user feedback\n• Implement a scalable business model for sustainable growth\n• Develop a comprehensive marketing strategy to increase brand awareness\n• Secure initial funding or revenue to support ongoing development\n• Build a talented team to support growth and innovation";
    }

    setFormData({
      ...formData,
      goals: example
    });
  };

  // Generate example target audience based on business type
  const generateTargetAudienceExample = () => {
    const businessTypeString = formData.businessType.join(', ').toLowerCase();
    let example = "";

    if (businessTypeString.includes('ecommerce') || businessTypeString.includes('shop') || businessTypeString.includes('store') || businessTypeString.includes('marketplace')) {
      example = "• Primary: Tech-savvy consumers aged 25-45 with disposable income\n• Professionals looking for high-quality products in our niche\n• Urban dwellers who prefer online shopping over in-store visits\n• Value-conscious shoppers who research before purchasing\n• Gift buyers looking for unique and personalized options\n• Fashion-forward individuals who follow the latest trends\n• International customers seeking products not available locally";
    } 
    else if (businessTypeString.includes('blog') || businessTypeString.includes('content') || businessTypeString.includes('news')) {
      example = "• Industry professionals seeking in-depth knowledge and analysis\n• Students and academics researching topics in our field\n• Enthusiasts and hobbyists passionate about our subject matter\n• Decision-makers looking for trends and insights\n• Professionals aged 30-50 who want to stay informed on industry developments\n• Newcomers to the field seeking educational content and guidance\n• Opinion leaders who share valuable content with their networks";
    }
    else if (businessTypeString.includes('saas') || businessTypeString.includes('software') || businessTypeString.includes('tool')) {
      example = "• Small to medium-sized businesses looking to improve efficiency\n• Startup founders and entrepreneurs building their tech stack\n• Department managers with budget authority for software decisions\n• Technical professionals like developers, designers, and project managers\n• Remote teams needing collaboration tools\n• Enterprise clients seeking customizable solutions\n• Non-technical users who need intuitive, user-friendly interfaces";
    }
    else {
      example = "• Early adopters who embrace new technologies and solutions\n• Specific demographic group: [age range, location, income level]\n• Users with the specific pain point our product addresses\n• People with particular interests or lifestyle choices related to our offering\n• Professional roles that would benefit from our solution\n• Existing users of complementary or competing products\n• Decision-makers with purchasing authority in relevant organizations";
    }

    setFormData({
      ...formData,
      targetAudience: example
    });
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
          projectDescription: formData.description,
          businessType: formData.businessType.join(', '),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search competitors');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, competitors: data.competitors }));
    } catch (error) {
      console.error('Error searching competitors:', error);
      setSearchError('Failed to search for competitors. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Speech recognition functionality
  const startListening = (fieldName: string) => {
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
      
      if (fieldName === 'businessType') {
        // Handle business type as an array
        const types = transcript.split(',').map(type => type.trim()).filter(type => type !== '');
        setFormData(prev => ({ ...prev, businessType: [...prev.businessType, ...types] }));
      } else {
        // Handle other fields normally
        const currentValue = formData[fieldName as keyof typeof formData] as string;
        setFormData(prev => ({ 
          ...prev, 
          [fieldName]: currentValue 
            ? `${currentValue}\n${transcript}` 
            : transcript
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
  };

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
  }, [formData]);

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
              : "Start dictation (F4)"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
        <div className="container mx-auto max-w-2xl">
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
          
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Tell us about your project to help our AI create a tailored development plan.
              </CardDescription>
              <div className="mt-2">
                <Progress value={step * 25} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-zinc-500">
                  <span>Basic Info</span>
                  <span>Goals & Audience</span>
                  <span>User Experience</span>
                  <span>Competition</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form id="project-form" onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="name">
                        Project Name
                      </label>
                      <div className="relative">
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="My Awesome App"
                          className="pr-10"
                        />
                        {renderMicButton('name')}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="description">
                        Description
                      </label>
                      <div className="relative">
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          required
                          placeholder="Briefly describe what your project is about"
                          rows={4}
                          className="pr-10"
                        />
                        {renderMicButton('description')}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="businessType">
                        Business Type
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {['E-commerce', 'SaaS', 'Blog/Content', 'Social Network', 'Marketplace', 'Mobile App', 'Educational'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleBusinessType(type)}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                              formData.businessType.includes(type)
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <Input
                          id="businessType"
                          name="businessType"
                          value={formData.businessType.join(', ')}
                          onChange={handleChange}
                          required
                          placeholder="Select or type business types (comma separated)"
                          className="pr-10"
                        />
                        {renderMicButton('businessType')}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Select multiple types or type your own (separate with commas).
                      </p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium" htmlFor="goals">
                          Business Goals
                        </label>
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateBusinessGoalsExample}
                          className="text-xs px-2 py-1 h-auto border-dashed border-zinc-300 text-zinc-600 hover:text-zinc-800"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          See Example
                        </Button>
                      </div>
                      <div className="relative">
                        <Textarea
                          id="goals"
                          name="goals"
                          value={formData.goals}
                          onChange={handleChange}
                          required
                          placeholder="What are your key business objectives? Consider revenue targets, user growth, market positioning, etc."
                          rows={4}
                          className="pr-10"
                        />
                        {renderMicButton('goals')}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        List specific, measurable goals your project should help you achieve.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium" htmlFor="targetAudience">
                          Target Audience
                        </label>
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateTargetAudienceExample}
                          className="text-xs px-2 py-1 h-auto border-dashed border-zinc-300 text-zinc-600 hover:text-zinc-800"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          See Example
                        </Button>
                      </div>
                      <div className="relative">
                        <Textarea
                          id="targetAudience"
                          name="targetAudience"
                          value={formData.targetAudience}
                          onChange={handleChange}
                          required
                          placeholder="Describe your ideal users. Consider demographics, behaviors, needs, and pain points."
                          rows={4}
                          className="pr-10"
                        />
                        {renderMicButton('targetAudience')}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Understanding your audience helps create a more targeted and effective solution.
                      </p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium" htmlFor="userFlow">
                          User Experience & Flow
                        </label>
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateUserFlowExample}
                          className="text-xs px-2 py-1 h-auto border-dashed border-zinc-300 text-zinc-600 hover:text-zinc-800"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          See Example
                        </Button>
                      </div>
                      <div className="relative">
                        <Textarea
                          id="userFlow"
                          name="userFlow"
                          value={formData.userFlow}
                          onChange={handleChange}
                          required
                          placeholder="Describe how a typical user would interact with your app or website."
                          rows={6}
                          className="pr-10"
                        />
                        {renderMicButton('userFlow')}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Outline the steps a user takes from first discovering your product to becoming a regular user.
                      </p>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <>
                    <h2 className="text-2xl font-bold mb-4">Competitor Research</h2>
                    <p className="mb-6">Let&apos;s analyze your competition to better position your product in the market.</p>
                    
                    {formData.competitors.length === 0 ? (
                      <div className="mb-6">
                        <p className="mb-4">We&apos;ll use AI to search the web for competitors similar to your business idea.</p>
                        <Button 
                          onClick={searchCompetitors} 
                          disabled={isSearching}
                          className="w-full md:w-auto mb-4"
                        >
                          {isSearching ? 'Searching...' : 'Find Competitors'}
                        </Button>
                        {searchError && <p className="text-red-500 mt-2">{searchError}</p>}
                      </div>
                    ) : (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Top Competitors Found:</h3>
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
                        <Button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, competitors: [] }));
                          }}
                          variant="outline"
                          className="mt-4"
                        >
                          Reset Search
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 1 ? (
                <Button 
                  type="button" 
                  onClick={prevStep} 
                  variant="outline"
                >
                  Previous
                </Button>
              ) : (
                <div></div>
              )}
              
              {step < 4 ? (
                <Button 
                  type="button" 
                  onClick={nextStep} 
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit"
                  form="project-form"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => console.log('Create Project button clicked')}
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              )}
            </CardFooter>
          </Card>
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