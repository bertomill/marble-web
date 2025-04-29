import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import dynamic from 'next/dynamic';

// Dynamically import the FirebaseErrorBoundary with no SSR
const FirebaseErrorBoundary = dynamic(
  () => import('@/app/components/FirebaseErrorBoundary').then(mod => ({ default: mod.FirebaseErrorBoundary })),
  { ssr: false }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marble - AI-Powered App Builder",
  description: "Create your website or app with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <FirebaseErrorBoundary>
            {children}
          </FirebaseErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
} 