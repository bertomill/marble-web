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
    businessType: '',
    goals: '',
    targetAudience: '',
    userFlow: '',
    competitors: [] as Competitor[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    const businessType = formData.businessType.toLowerCase();
    let example = "";

    if (businessType.includes('ecommerce') || businessType.includes('shop') || businessType.includes('store')) {
      example = "1. User lands on the homepage and sees featured products\n2. User navigates to product categories or uses search\n3. User views product details, images, and reviews\n4. User adds items to cart and proceeds to checkout\n5. User creates account or logs in\n6. User enters shipping and payment information\n7. User receives order confirmation and tracking details";
    } 
    else if (businessType.includes('blog') || businessType.includes('content') || businessType.includes('news')) {
      example = "1. User discovers content through search or social media\n2. User reads article and explores related content\n3. User subscribes to newsletter for updates\n4. User creates account to comment on articles\n5. User shares content with their network\n6. User receives personalized content recommendations";
    }
    else if (businessType.includes('saas') || businessType.includes('software') || businessType.includes('tool')) {
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
          businessType: formData.businessType,
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
          <h2 className="text-3xl font-bold tracking-tight mb-8">Create New Project</h2>
          
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
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="My Awesome App"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="description">
                        Description
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="Briefly describe what your project is about"
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="businessType">
                        Business Type
                      </label>
                      <Input
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        required
                        placeholder="E-commerce, Blog, Social Network, etc."
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="goals">
                        Business Goals
                      </label>
                      <Textarea
                        id="goals"
                        name="goals"
                        value={formData.goals}
                        onChange={handleChange}
                        required
                        placeholder="What are you hoping to achieve with this app or website?"
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="targetAudience">
                        Target Audience
                      </label>
                      <Textarea
                        id="targetAudience"
                        name="targetAudience"
                        value={formData.targetAudience}
                        onChange={handleChange}
                        required
                        placeholder="Who will be using your app or website?"
                        rows={4}
                      />
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
                      <Textarea
                        id="userFlow"
                        name="userFlow"
                        value={formData.userFlow}
                        onChange={handleChange}
                        required
                        placeholder="Describe how a typical user would interact with your app or website."
                        rows={6}
                      />
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