'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="py-4 px-6 border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Marble</h1>
          <div>
            {loading ? (
              <div className="h-10 w-24 bg-zinc-100 animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <AuthStatus />
                <Button 
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
                <Button asChild size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" className="fill-white"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" className="fill-white"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" className="fill-white"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" className="fill-white"/>
                </svg>
                Sign in with Google
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-zinc-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Build Your Website or App with AI
          </h2>
          <p className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Marble helps you describe your business, define your goals, and identify your target audience.
            Then we use AI to create a custom plan to build your digital presence.
          </p>
          {!user ? (
            <Button
              onClick={signInWithGoogle}
              size="lg"
              className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Get Started
            </Button>
          ) : (
            <Button asChild size="lg" className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">How Marble Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Describe Your Business</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600">Tell us about your business, goals, target audience, and how you envision users interacting with your app.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>2. Get an AI Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600">Our AI creates a personalized development plan with recommended features and technology stack.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>3. Start Building</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600">Approve the plan and begin building your application with our integrated development environment.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Build Your Digital Presence?</h3>
          <p className="text-lg text-zinc-600 mb-8 max-w-xl mx-auto">
            Start creating your website or app today with Marble&apos;s AI-powered platform.
          </p>
          {!user ? (
            <Button
              onClick={signInWithGoogle}
              size="lg"
              className="rounded-full px-8"
            >
              Sign Up Now
            </Button>
          ) : (
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Marble. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
