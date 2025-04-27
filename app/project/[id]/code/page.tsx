'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import AuthStatus from '@/components/AuthStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; 
import { toast } from "@/components/ui/use-toast";
import dynamic from 'next/dynamic';
import { Save, ArrowLeft, Check, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dynamically import the CodeEditor component to avoid hydration issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse rounded" />
});

// Dynamically import the FileExplorer component
const FileExplorer = dynamic(() => import('@/components/FileExplorer'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse rounded" />
});

// Dynamically import the PreviewComponent component
const PreviewComponent = dynamic(() => import('@/components/PreviewComponent'), { ssr: false });

// Define interfaces for file data
interface FileData {
  content: string;
  language: string;
  lastModified?: number | Date;
}

// Define interfaces for project data
interface UserJourneyStep {
  id: string;
  title: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  projectType: string;
  status: string;
  createdAt: Timestamp;
  userId: string;
  targetAudience?: string;
  valueProposition?: string;
  userFlow?: UserJourneyStep[];
  files?: Record<string, FileData>;
  aiResponse?: string;
}

export default function ProjectCodePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<Record<string, FileData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('html');
  const [isDirty, setIsDirty] = useState(false);
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStatus, setBuildStatus] = useState('');
  const [isFullPage] = useState(false);
  
  // Add state for tab management
  const [activeTab, setActiveTab] = useState<string>('code');
  
  // Create a ref to track build progress updates
  const buildProgressInterval = useRef<NodeJS.Timeout | null>(null);

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
          const projectData = projectSnap.data() as Project;
          setProject(projectData);

          // If status is 'planning', we're in build mode
          setIsBuildMode(projectData.status === 'planning' || projectData.status === 'planning_complete');

          // If files exist, load them
          if (projectData.files && Object.keys(projectData.files).length > 0) {
            setProjectFiles(projectData.files);
            
            // Set default file
            const firstFileName = Object.keys(projectData.files)[0];
            setCurrentFile(firstFileName);
            setCurrentFileContent(projectData.files[firstFileName].content);
            setCurrentLanguage(projectData.files[firstFileName].language);
          } else {
            // Create default files based on project type
            const defaultFiles = createDefaultFiles(projectData);
            setProjectFiles(defaultFiles);
            
            // Set default file
            const firstFileName = Object.keys(defaultFiles)[0];
            setCurrentFile(firstFileName);
            setCurrentFileContent(defaultFiles[firstFileName].content);
            setCurrentLanguage(defaultFiles[firstFileName].language);
            
            // Save default files to the project
            await updateDoc(projectRef, { files: defaultFiles });
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
  }, [projectId, user, loading, router, isBuildMode]);

  // Function to create default files based on project type
  const createDefaultFiles = (project: Project) => {
    console.log('Creating default files for project type:', project.projectType);
    
    const defaultFiles: Record<string, FileData> = {};
    
    if (project.projectType === 'website' || project.projectType === 'web') {
      // Simple website defaults
      defaultFiles['index.html'] = {
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name || 'My Website'}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>${project.name || 'My Website'}</h1>
    <nav>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section id="home">
      <h2>Welcome to ${project.name || 'My Website'}</h2>
      <p>${project.description || 'This is a website created with Marble.'}</p>
    </section>
    
    <section id="about">
      <h2>About Us</h2>
      <p>We are dedicated to providing the best service to our customers.</p>
    </section>
    
    <section id="contact">
      <h2>Contact Us</h2>
      <form id="contact-form">
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
          <label for="message">Message:</label>
          <textarea id="message" name="message" rows="5" required></textarea>
        </div>
        
        <button type="submit">Send Message</button>
      </form>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${project.name || 'My Website'}. All rights reserved.</p>
  </footer>
  
  <script src="script.js"></script>
</body>
</html>`,
        language: 'html',
        lastModified: Date.now()
      };
      
      defaultFiles['styles.css'] = {
        content: `/* Styles for ${project.name || 'My Website'} */

/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header styles */
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
}

nav ul {
  display: flex;
  list-style: none;
}

nav li {
  margin-left: 20px;
}

nav a {
  text-decoration: none;
  color: #333;
}

nav a:hover {
  color: #0066cc;
}

/* Section styles */
section {
  margin-bottom: 40px;
  padding: 20px;
  border-radius: 5px;
  background-color: #f9f9f9;
}

h1, h2 {
  margin-bottom: 15px;
  color: #0066cc;
}

/* Form styles */
.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0055aa;
}

/* Footer styles */
footer {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #eee;
  margin-top: 30px;
}`,
        language: 'css',
        lastModified: Date.now()
      };
      
      defaultFiles['script.js'] = {
        content: `// JavaScript for ${project.name || 'My Website'}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Document is ready!');
  
  // Handle form submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      
      // Log form data (in a real app, you would send this to a server)
      console.log('Form submitted:', { name, email, message });
      
      // Show success message
      alert('Thank you for your message! We will get back to you soon.');
      
      // Reset form
      contactForm.reset();
    });
  }
  
  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 50,
          behavior: 'smooth'
        });
      }
    });
  });
});`,
        language: 'javascript',
        lastModified: Date.now()
      };
    } else if (project.projectType === 'app' || project.projectType === 'webapp') {
      // Simple web app defaults (similar, but with more interactive elements)
      // ... app files would go here
      // For now, just use the same defaults
      defaultFiles['index.html'] = {
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name || 'My Web App'}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>${project.name || 'My Web App'}</h1>
    <nav>
      <ul>
        <li><a href="#" class="nav-link" data-page="home">Home</a></li>
        <li><a href="#" class="nav-link" data-page="about">About</a></li>
        <li><a href="#" class="nav-link" data-page="contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <div id="page-container">
      <div id="home-page" class="page active">
        <h2>Welcome to ${project.name || 'My Web App'}</h2>
        <p>${project.description || 'This is a web application created with Marble.'}</p>
        <button id="cta-button" class="primary-button">Get Started</button>
      </div>
      
      <div id="about-page" class="page">
        <h2>About Our App</h2>
        <p>This web application helps users accomplish their goals efficiently.</p>
        <div class="features">
          <div class="feature">
            <h3>Feature 1</h3>
            <p>Description of the first amazing feature.</p>
          </div>
          <div class="feature">
            <h3>Feature 2</h3>
            <p>Description of the second amazing feature.</p>
          </div>
          <div class="feature">
            <h3>Feature 3</h3>
            <p>Description of the third amazing feature.</p>
          </div>
        </div>
      </div>
      
      <div id="contact-page" class="page">
        <h2>Contact Us</h2>
        <form id="contact-form">
          <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required>
          </div>
          
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
          </div>
          
          <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" name="message" rows="5" required></textarea>
          </div>
          
          <button type="submit" class="primary-button">Send Message</button>
        </form>
      </div>
    </div>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${project.name || 'My Web App'}. All rights reserved.</p>
  </footer>
  
  <script src="script.js"></script>
</body>
</html>`,
        language: 'html',
        lastModified: Date.now()
      };
      
      defaultFiles['styles.css'] = {
        content: `/* Styles for ${project.name || 'My Web App'} */

/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #4a6cf7;
  --secondary-color: #f9f9f9;
  --text-color: #333;
  --light-text: #666;
  --border-color: #ddd;
}

body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
}

/* Header styles */
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 30px;
}

nav ul {
  display: flex;
  list-style: none;
}

nav li {
  margin-left: 20px;
}

nav a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  transition: color 0.3s;
}

nav a:hover {
  color: var(--primary-color);
}

/* Page container and pages */
#page-container {
  position: relative;
  min-height: 400px;
}

.page {
  display: none;
  animation: fadeIn 0.5s;
}

.page.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Button styles */
.primary-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.primary-button:hover {
  background-color: #3a5ce5;
}

/* Features section */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature {
  background-color: var(--secondary-color);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.feature h3 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

/* Section and typography styles */
section, .page {
  margin-bottom: 40px;
}

h1, h2, h3 {
  margin-bottom: 15px;
}

h1 {
  color: var(--primary-color);
}

h2 {
  color: var(--text-color);
  font-size: 1.8rem;
}

p {
  margin-bottom: 15px;
  color: var(--light-text);
}

/* Form styles */
.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
}

/* Footer styles */
footer {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid var(--border-color);
  margin-top: 30px;
  color: var(--light-text);
  font-size: 0.9rem;
}`,
        language: 'css',
        lastModified: Date.now()
      };
      
      defaultFiles['script.js'] = {
        content: `// JavaScript for ${project.name || 'My Web App'}

document.addEventListener('DOMContentLoaded', function() {
  console.log('App initialized');
  
  // Navigation handling
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  
  // Function to show a specific page
  function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
      page.classList.remove('active');
    });
    
    // Show the selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
      targetPage.classList.add('active');
    }
  }
  
  // Add click handlers to navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the page to show from the data attribute
      const pageToShow = this.getAttribute('data-page');
      showPage(pageToShow);
      
      // Update active state on navigation
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Handle the CTA button
  const ctaButton = document.getElementById('cta-button');
  if (ctaButton) {
    ctaButton.addEventListener('click', function() {
      showPage('about');
      // Update the navigation active state
      navLinks.forEach(link => {
        if (link.getAttribute('data-page') === 'about') {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    });
  }
  
  // Handle form submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      
      // Log form data (in a real app, you would send this to a server)
      console.log('Form submitted:', { name, email, message });
      
      // Show success message
      alert('Thank you for your message! We will get back to you soon.');
      
      // Reset form
      contactForm.reset();
      
      // Go back to home page
      showPage('home');
      navLinks.forEach(link => {
        if (link.getAttribute('data-page') === 'home') {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    });
  }
});`,
        language: 'javascript',
        lastModified: Date.now()
      };
    }
    
    // Update project with default files in Firestore
    updateDoc(doc(db, 'projects', projectId), {
      files: defaultFiles,
      status: 'built'
    }).then(() => {
      console.log('Default files saved to Firestore');
      
      // Update local state
      setProjectFiles(defaultFiles);
      
      // Set the first file as current
      const firstFileName = Object.keys(defaultFiles)[0];
      if (firstFileName) {
        setCurrentFile(firstFileName);
        setCurrentFileContent(defaultFiles[firstFileName].content);
        setCurrentLanguage(defaultFiles[firstFileName].language);
      }
      
      // Transition to editor view
      setIsBuildMode(false);
    }).catch(error => {
      console.error('Error saving default files:', error);
    });
    
    return defaultFiles;
  };

  // Handle file selection
  const handleFileSelect = (fileName: string) => {
    if (fileName === currentFile) return;
    
    // Save current file before switching
    if (currentFile && projectFiles[currentFile]) {
      const updatedFiles = { ...projectFiles };
      updatedFiles[currentFile] = {
        ...updatedFiles[currentFile],
        content: currentFileContent
      };
      setProjectFiles(updatedFiles);
    }
    
    // Set new current file
    setCurrentFile(fileName);
    setCurrentFileContent(projectFiles[fileName]?.content || '');
    setCurrentLanguage(projectFiles[fileName]?.language || getLanguageFromFileName(fileName));
  };

  // Handle file content change
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCurrentFileContent(value);
      setIsDirty(true);
    }
  };

  // Handle file creation
  const handleFileCreate = (fileName: string) => {
    if (projectFiles[fileName]) {
      alert(`File ${fileName} already exists.`);
      return;
    }
    
    const language = getLanguageFromFileName(fileName);
    
    // Create new file
    const updatedFiles = { ...projectFiles };
    updatedFiles[fileName] = {
      content: '',
      language
    };
    
    setProjectFiles(updatedFiles);
    setCurrentFile(fileName);
    setCurrentFileContent('');
    setCurrentLanguage(language);
    
    // Save to Firebase
    saveProject(updatedFiles);
  };

  // Build the project
  const buildProject = async () => {
    if (!projectId || !project) return;
    
    setIsBuilding(true);
    setBuildProgress(0);
    setBuildStatus('Starting build process...');
    
    // Simulate build progress
    let progress = 0;
    buildProgressInterval.current = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      setBuildProgress(Math.round(progress));
      
      // Update status message based on progress
      if (progress < 30) {
        setBuildStatus('Analyzing project requirements...');
      } else if (progress < 60) {
        setBuildStatus('Generating code structure...');
      } else if (progress < 90) {
        setBuildStatus('Writing code files...');
      }
    }, 800);
    
    try {
      // If there are no files yet, create the default ones
      if (!projectFiles || Object.keys(projectFiles).length === 0) {
        createDefaultFiles(project);
      }
      
      // Now make the API call to generate code
      setBuildStatus('Generating code in the background...');
      
      // Show toast that files are being generated
      toast({
        title: "Editor ready",
        description: "Basic files loaded. AI code generation is continuing in the background."
      });
      
      // Make API call to generate code
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: params.id as string,
          name: project.name,
          description: project.description,
          projectType: project.projectType,
          targetAudience: project.targetAudience || '',
          valueProposition: project.valueProposition || '',
          userFlow: project.userFlow || [],
          aiResponse: project.aiResponse || ''
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.files && Object.keys(data.files).length > 0) {
          // Update each file individually to avoid JSON parsing issues
          for (const [fileName, fileData] of Object.entries(data.files)) {
            // Skip invalid file data
            if (!fileData || typeof fileData !== 'object') continue;
            
            // Type assertion to help TypeScript understand our file data structure
            const typedFileData = fileData as FileData;
            
            // Update this file in Firebase
            await updateDoc(doc(db, 'projects', projectId), {
              [`files.${fileName}`]: {
                content: typedFileData.content || '// Generated content',
                language: typedFileData.language || 'text',
                lastModified: Date.now()
              }
            });
            
            // Also update in local state
            if (projectFiles) {
              setProjectFiles({
                ...projectFiles,
                [fileName]: {
                  content: typedFileData.content || '// Generated content',
                  language: typedFileData.language || 'text',
                  lastModified: Date.now()
                }
              });
            }
            
            // If this is the currently viewed file, update its content in editor
            if (currentFile === fileName) {
              setCurrentFileContent(typedFileData.content || '// Generated content');
              setCurrentLanguage(typedFileData.language || 'text');
            }
          }
          
          // Mark project as fully built
          await updateDoc(doc(db, 'projects', projectId), {
            status: 'built'
          });
          
          // Update local state
          setProject({
            ...project,
            status: 'built'
          });
          
          // Complete the build
          setBuildProgress(100);
          setBuildStatus('Code generation completed successfully!');
          
          toast({
            title: "Code generation completed",
            description: "Your project code has been generated successfully!"
          });
        }
      } else {
        // API call failed but we already have default files loaded, so just notify the user
        toast({
          title: "Code generation issue",
          description: "We encountered an issue generating custom code. Default templates loaded instead.",
          variant: "destructive"
        });
        
        // Mark project as built anyway since we have the default files
        await updateDoc(doc(db, 'projects', projectId), {
          status: 'built'
        });
        
        // Update local state
        setProject({
          ...project,
          status: 'built'
        });
      }
      
      // Clear interval if it's still running
      if (buildProgressInterval.current) {
        clearInterval(buildProgressInterval.current);
        buildProgressInterval.current = null;
      }
    } catch (error) {
      console.error('Error in build process:', error);
      
      // Even if there's an error, we still have default files
      toast({
        title: "Code generation issue",
        description: "We encountered an issue during the build process. Default templates loaded.",
        variant: "destructive"
      });
      
      setBuildStatus('Build completed with default templates.');
      setBuildProgress(100);
      
      // Make sure the editor is showing
      setIsBuildMode(false);
      setIsBuilding(false);
      
      // Clear interval if it's running
      if (buildProgressInterval.current) {
        clearInterval(buildProgressInterval.current);
        buildProgressInterval.current = null;
      }
    }
  };

  // Download all project files as a ZIP
  const downloadProjectFiles = () => {
    if (!projectFiles || Object.keys(projectFiles).length === 0) {
      toast({
        title: "No files to download",
        description: "Your project doesn't have any files to download yet.",
        variant: "destructive"
      });
      return;
    }

    // Get the files to download
    const files = projectFiles;

    // Dynamically import JSZip
    import('jszip').then((JSZipModule) => {
      const JSZip = JSZipModule.default;
      const zip = new JSZip();
      
      // Add all files to the zip
      Object.entries(files).forEach(([fileName, fileData]) => {
        zip.file(fileName, fileData.content);
      });
      
      // Generate the zip file
      zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        // Create a download link
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name?.replace(/\s+/g, '-').toLowerCase() || 'project'}-files.zip`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        
        toast({
          title: "Download started",
          description: "Your project files are being downloaded."
        });
      }).catch((err: Error) => {
        console.error('Error generating zip:', err);
        toast({
          title: "Download failed",
          description: "There was a problem downloading your files.",
          variant: "destructive"
        });
      });
    }).catch((err: Error) => {
      console.error('Error loading JSZip:', err);
      toast({
        title: "Download failed",
        description: "Could not load the ZIP utility. Please try again later.",
        variant: "destructive"
      });
    });
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'html' || extension === 'htm') return 'html';
    if (extension === 'css') return 'css';
    if (['js', 'jsx'].includes(extension)) return 'javascript';
    if (['ts', 'tsx'].includes(extension)) return 'typescript';
    
    return 'text';
  };

  const saveCurrentFile = async () => {
    if (!currentFile) return;
    
    const updatedFiles = { ...projectFiles };
    updatedFiles[currentFile] = {
      ...updatedFiles[currentFile],
      content: currentFileContent
    };
    
    setProjectFiles(updatedFiles);
    await saveProject(updatedFiles);
  };
  
  const saveProject = async (files: Record<string, FileData>) => {
    if (!projectId || !project) return;
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { files });
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  // Function to generate file content using Claude
  const generateFileContent = async () => {
    if (!currentFile) return;
    
    try {
      toast({
        title: "Generating code",
        description: `Creating ${currentFile} with Claude 3.7...`,
      });
      
      // Get list of other files in the project
      const existingFiles = Object.keys(projectFiles);
      
      // Call our API endpoint
      const response = await fetch('/api/generate-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: currentFile,
          language: currentLanguage,
          projectName: project?.name || '',
          projectDescription: project?.description || '',
          projectType: project?.projectType || 'web',
          existingFiles
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.content) {
          // Update the editor content
          setCurrentFileContent(data.content);
          setIsDirty(true);
          
          toast({
            title: "Code generated",
            description: `${currentFile} has been created with Claude 3.7. Remember to save your changes!`,
          });
        } else {
          toast({
            title: "Generation issue",
            description: "No content was returned. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: "Generation failed",
          description: error.error || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating file content:', error);
      toast({
        title: "Generation error",
        description: "Failed to generate code. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-md mb-2"></div>
          <p className="text-zinc-400 text-sm">Loading editor...</p>
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

  // Render build mode UI
  if (isBuildMode || isBuilding) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50">
        <header className="py-3 px-6 border-b bg-white shadow-sm">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
                <div className="relative w-7 h-7">
                  <Image 
                    src="/images/marble_blocks_2.png" 
                    alt="Marble Blocks Logo" 
                    width={28} 
                    height={28} 
                    className="object-contain"
                    priority
                  />
                </div>
                <h1 className="text-xl font-bold tracking-tight ml-2">Marble</h1>
              </Link>
              <span className="text-zinc-300 mx-2">|</span>
              <h2 className="text-zinc-600 truncate max-w-[200px]">{project?.name}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                asChild
              >
                <Link href={`/project/${projectId}`}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Project
                </Link>
              </Button>
              <AuthStatus />
            </div>
          </div>
        </header>

        <main className="flex-grow flex justify-center items-center p-8">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                  <Image 
                    src="/images/marble_blocks_2.png" 
                    alt="Marble Logo" 
                    width={64} 
                    height={64} 
                    className="mx-auto mb-4" 
                  />
                  <h2 className="text-2xl font-bold mb-2">Ready to Build Your Project?</h2>
                  <p className="text-zinc-600 mb-4">
                    Marble will generate the initial code structure for your {project?.projectType || 'project'} 
                    based on your project requirements.
                  </p>
                </div>
                
                {isBuilding && (
                  <div className="w-full mb-6">
                    <p className="font-medium text-zinc-700 mb-2">{buildStatus}</p>
                    <Progress value={buildProgress} className="h-2 mb-2" />
                    <p className="text-sm text-zinc-500">
                      This may take a moment...
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  {!isBuilding ? (
                    <Button 
                      onClick={buildProject}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Build Project
                    </Button>
                  ) : buildProgress === 100 ? (
                    <div className="text-green-600 font-medium flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      Build Complete!
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <footer className="py-4 px-6 border-t bg-white">
          <div className="container mx-auto text-center text-zinc-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Marble. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Render code editor UI
  return (
    <div className={`${isFullPage ? 'fixed inset-0 z-50 bg-background' : ''} flex flex-col h-full w-full`}>
      <header className="py-3 px-6 border-b bg-white shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
              <div className="relative w-7 h-7">
                <Image 
                  src="/images/marble_blocks_2.png" 
                  alt="Marble Blocks Logo" 
                  width={28} 
                  height={28} 
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-bold tracking-tight ml-2">Marble</h1>
            </Link>
            <span className="text-zinc-300 mx-2">|</span>
            <h2 className="text-zinc-600 truncate max-w-[200px]">{project?.name}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={saveCurrentFile}
              disabled={!isDirty}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadProjectFiles}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <Link href={`/project/${projectId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Project
              </Link>
            </Button>
            <AuthStatus />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          <div className="w-64 border-r border-zinc-200 bg-white overflow-y-auto">
            {Object.keys(projectFiles).length > 0 ? (
              <FileExplorer
                files={projectFiles}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                selectedFile={currentFile}
              />
            ) : (
              <div className="p-4 text-center text-zinc-400">
                <p>No files available</p>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-auto">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full h-full flex flex-col"
            >
              <div className="border-b bg-white">
                <TabsList className="border-b-0">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="code" className="flex-1 p-0 m-0 h-full">
                {currentFile && (
                  <div className="h-full flex flex-col">
                    <div className="p-2 bg-white border-b flex justify-between items-center">
                      <span className="text-sm font-medium text-zinc-700">{currentFile}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        onClick={generateFileContent}
                      >
                        Generate with Claude
                      </Button>
                    </div>
                    <div className="flex-1">
                      <CodeEditor
                        value={currentFileContent}
                        language={currentLanguage}
                        onChange={handleEditorChange}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 p-0 m-0 h-full">
                <div className="w-full h-[calc(100vh-200px)] bg-white overflow-hidden">
                  <PreviewComponent 
                    files={projectFiles}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 