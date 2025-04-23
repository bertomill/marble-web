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
    userFlow: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                <Progress value={step * 33.33} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-zinc-500">
                  <span>Basic Info</span>
                  <span>Goals & Audience</span>
                  <span>User Experience</span>
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
                      <label className="text-sm font-medium" htmlFor="userFlow">
                        User Experience & Flow
                      </label>
                      <Textarea
                        id="userFlow"
                        name="userFlow"
                        value={formData.userFlow}
                        onChange={handleChange}
                        required
                        placeholder="Describe how a typical user would interact with your app or website."
                        rows={6}
                      />
                    </div>
                  </div>
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
              
              {step < 3 ? (
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