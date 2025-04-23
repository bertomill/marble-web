//This is the dashboard page
'use client';
//use client is a directive that tells Next.js to render this page on the client
import { useEffect, useState } from 'react';
//useEffect is a hook that allows you to perform side effects in your component
import { useRouter } from 'next/navigation';
//useRouter is a hook that allows you to navigate to a different route
import Link from 'next/link';
//Link is a component that allows you to navigate to a different route
import { useAuth } from '@/contexts/AuthContext';
//useAuth is a hook that allows you to access the user's authentication state
import { db } from '@/lib/firebase';
//db is the firestore database
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
//collection, query, where, getDocs, Timestamp are firestore functions
import AuthStatus from '@/components/AuthStatus';
//AuthStatus is a component that allows you to access the user's authentication state
import { Button } from '@/components/ui/button';
//Button is a component that allows you to create a button
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
//Card is a component that allows you to create a card
import { Badge } from '@/components/ui/badge';
//Badge is a component that allows you to create a badge

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: Timestamp | Date | null;
};

// Helper function to safely convert Firestore timestamps to Date objects
const getDateFromTimestamp = (timestamp: Timestamp | Date | null | unknown): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};
// this function is used to convert the timestamp to a date
export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // this is the main function that is used to render the dashboard

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(projectsQuery);
        const projectsList: Project[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          projectsList.push({
            id: doc.id,
            name: data.name || 'Untitled Project',
            description: data.description || '',
            status: data.status || 'planning',
            createdAt: data.createdAt || null,
          });
        });
        
        // Sort projects by creation date (newest first) - safely handling date conversion
        projectsList.sort((a, b) => {
          const dateA = getDateFromTimestamp(a.createdAt);
          const dateB = getDateFromTimestamp(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setProjects(projectsList);
        setError(null);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProjects();
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [user, loading]);

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

  // Format date for display
  const formatDate = (timestamp: Timestamp | Date | null | unknown): string => {
    if (!timestamp) return 'Unknown date';
    const date = getDateFromTimestamp(timestamp);
    return date.toLocaleDateString();
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

  if (!user) {
    return null; // Will redirect in useEffect
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
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <Button asChild>
              <Link href="/project/new">Create New Project</Link>
            </Button>
          </div>
          
          <Card className="mb-8 border-blue-100 bg-blue-50/50">
            <CardHeader>
              <CardTitle>Welcome to Marble!</CardTitle>
              <CardDescription>
                This is your personal dashboard where you can create and manage app projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                Get started by creating a new project or continue working on an existing one.
                Marble will help you define your app requirements and generate a development plan.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Your Projects</span>
                {isLoading && 
                  <Badge variant="outline" className="animate-pulse">
                    Loading...
                  </Badge>
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-md text-red-600">
                  {error}
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={1.5} 
                      stroke="currentColor" 
                      className="w-12 h-12 mx-auto text-zinc-300"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" 
                      />
                    </svg>
                  </div>
                  <p className="text-zinc-500 mb-4">
                    You don&apos;t have any projects yet. Create one to get started!
                  </p>
                  <Button asChild>
                    <Link href="/project/new">Create Your First Project</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="overflow-hidden hover:border-blue-200 transition-colors">
                      <Link href={`/project/${project.id}`} className="block h-full">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            {getStatusBadge(project.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-zinc-600 line-clamp-2 mb-4">
                            {project.description || "No description provided"}
                          </p>
                          <div className="text-xs text-zinc-400">Created: {formatDate(project.createdAt)}</div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
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