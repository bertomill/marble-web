'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthStatus from '@/components/AuthStatus';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { user, signOut, loading } = useAuth();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
      
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
                onClick={() => setAuthModalOpen(true)}
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-zinc-50 to-white relative overflow-hidden">
        {/* Marble sketch background */}
        <div className="absolute inset-0 flex justify-center items-center opacity-[0.07] pointer-events-none z-0">
          <div className="w-full md:w-3/4 2xl:w-1/2">
            <Image 
              src="/images/marble_sketch.png" 
              alt="Marble wireframe sketch" 
              width={1200} 
              height={800}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Build Your Website or App with AI
          </h2>
          <p className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Marble helps you describe your business, define your goals, and identify your target audience.
            Then we use AI to create a custom plan to build your digital presence.
          </p>
          {!user ? (
            <Button
              onClick={() => setAuthModalOpen(true)}
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
              onClick={() => setAuthModalOpen(true)}
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
