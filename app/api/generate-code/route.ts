import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const maxDuration = 60;

// Initialize Anthropic client with API key
const apiKey = process.env.ANTHROPIC_API_KEY;
// isDevelopment is a boolean that is true if the NODE_ENV is development
const isDevelopment = process.env.NODE_ENV === 'development';

console.log('Environment:', process.env.NODE_ENV);

// Function to get the Anthropic client
function getAnthropicClient() {
  return new Anthropic({
    apiKey: apiKey || 'dummy-key-for-development'
  });
}

// Create a cache directory for development
const cacheDir = path.join(process.cwd(), '.cache');
if (isDevelopment && !fs.existsSync(cacheDir)) {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create cache directory:', err);
  }
}

// Function to generate a cache key
function generateCacheKey(data: Record<string, unknown>): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `generate-code-${hash}.json`;
}

// Function to save response to cache
function saveToCache(key: string, data: string): void {
  if (!isDevelopment) return;
  
  try {
    const filePath = path.join(cacheDir, key);
    fs.writeFileSync(filePath, data);
    console.log(`Cached response to ${filePath}`);
  } catch (err) {
    console.error('Failed to cache response:', err);
  }
}

// Function to get response from cache
function getFromCache(key: string): string | null {
  if (!isDevelopment) return null;
  
  try {
    const filePath = path.join(cacheDir, key);
    if (fs.existsSync(filePath)) {
      console.log(`Loading response from cache: ${filePath}`);
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    console.error('Failed to read from cache:', err);
  }
  
  return null;
}

// Mock code files for testing
const mockCodeFiles = {
  'index.html': {
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
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
      <h2>Home</h2>
      <p>This is the home section of my website.</p>
    </section>
    <section id="about">
      <h2>About</h2>
      <p>Learn more about what we do.</p>
    </section>
    <section id="contact">
      <h2>Contact</h2>
      <p>Get in touch with us.</p>
    </section>
  </main>
  <footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`,
    language: 'html',
  },
  'styles.css': {
    content: `/* Basic reset */
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

section {
  margin-bottom: 40px;
}

h1, h2 {
  margin-bottom: 15px;
}

footer {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #eee;
  margin-top: 30px;
}`,
    language: 'css',
  },
  'script.js': {
    content: `// Main JavaScript file

document.addEventListener('DOMContentLoaded', function() {
  console.log('Document is ready!');
  
  // Add smooth scrolling for navigation
  document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const href = this.getAttribute('href');
      if (!href) return;
      
      const targetSection = document.querySelector(href);
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    });
  });
});`,
    language: 'javascript',
  }
};

// Utility function to clean and repair potential JSON issues
function attemptJsonRepair(jsonStr: string): string {
  try {
    // First, try simple parse to see if it's already valid
    JSON.parse(jsonStr);
    return jsonStr; // Already valid, no need to repair
  } catch (error) {
    console.log('JSON parsing failed, attempting repairs...', error);

    // Strip any markdown or explanation text that might surround the JSON
    // Look for the first { and last }
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    // Replace common escaped characters that might be problematic
    jsonStr = jsonStr
      .replace(/\\\\n/g, '\\n') // Double escaped newlines
      .replace(/\\\\"/g, '\\"') // Double escaped quotes
      .replace(/\\'/g, "'")     // Escaped single quotes (not needed in JSON)
      .replace(/\\\\/g, '\\');  // Double backslashes
    
    // Fix unescaped quotes within JSON strings
    let inString = false;
    let result = '';
    
    for (let i = 0; i < jsonStr.length; i++) {
      const current = jsonStr[i];
      const next = jsonStr[i + 1];
      
      // Toggle string state when we see an unescaped quote
      if (current === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
        inString = !inString;
      }
      
      // When in string and see an unescaped inner quote that would terminate the string
      if (inString && current === '"' && next !== ',' && next !== '}' && next !== ']' && next !== ':' && next !== '"' && next !== undefined) {
        result += '\\"'; // Escape the inner quote
        i++; // Skip the original quote
      } else {
        result += current;
      }
    }
    
    // Fix common trailing issues
    result = result.trim();
    if (!result.endsWith('}')) {
      // Find the last valid closing brace
      const lastValidBrace = result.lastIndexOf('}');
      if (lastValidBrace !== -1) {
        result = result.substring(0, lastValidBrace + 1);
      }
    }
    
    // Verify the repair worked
    try {
      JSON.parse(result);
      console.log('JSON repair successful');
    } catch (e) {
      console.error('JSON repair failed:', e);
    }
    
    return result;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get project data from the request
    const projectData = await request.json();
    const { 
      projectId, 
      name, 
      description, 
      projectType, 
      targetAudience, 
      valueProposition, 
      userFlow, 
      aiResponse 
    } = projectData;

    if (!projectId || !name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a cache key for this request
    const cacheKey = generateCacheKey(projectData);
    
    // Check cache first (in development mode)
    const cachedResponse = getFromCache(cacheKey);
    if (cachedResponse) {
      try {
        const parsedResponse = JSON.parse(cachedResponse);
        return NextResponse.json({ files: parsedResponse });
      } catch (e) {
        console.error('Failed to parse cached response:', e);
        // Continue with API call if parsing fails
      }
    }

    // Check for API key
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY is not set, using mock code files for development');
      
      if (isDevelopment) {
        console.log('In development mode, please check your .env.local file has the correct ANTHROPIC_API_KEY value');
        saveToCache(cacheKey, JSON.stringify(mockCodeFiles));
      }
      
      return NextResponse.json(
        { files: mockCodeFiles },
        { status: 200 }
      );
    }

    // Initialize Anthropic client
    const anthropic = getAnthropicClient();

    // Parse the AI response if available
    let parsedAiResponse = null;
    if (aiResponse) {
      try {
        parsedAiResponse = JSON.parse(aiResponse);
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        // Continue without parsed AI response
      }
    }

    // Create a system prompt for Claude
    const systemPrompt = `You are an expert web developer tasked with generating code files for a ${projectType || 'web'} project. Your goal is to create the initial code structure based on the project description and requirements.

    Generate the essential files for this project that would provide a strong starting point for the user. The code should be production-ready, following best practices and modern standards for the technology stack.
    
    For a website project, typically include:
    - HTML files for the main pages
    - CSS files for styling
    - JavaScript files for interactivity
    
    For a web app project, typically include:
    - Main React/Next.js components
    - CSS or styled-components for styling
    - JavaScript/TypeScript utility functions
    
    Your response MUST be a valid JSON object with the following structure:
    {
      "filename1": {
        "content": "The complete file content here",
        "language": "programming language (html, css, javascript, typescript, etc.)"
      },
      "filename2": {
        "content": "The complete file content here",
        "language": "programming language (html, css, javascript, typescript, etc.)"
      }
    }
    
    IMPORTANT JSON FORMATTING REQUIREMENTS:
    1. Double-check that all strings in your JSON are properly escaped, especially when they contain code with quotes
    2. Ensure all quotes are properly closed
    3. Do not include any backticks, markdown code block syntax, or explanations in your response
    4. YOUR ENTIRE RESPONSE MUST BE ONLY THE JSON OBJECT - nothing else
    
    Additional guidelines:
    1. Generate complete, functional code files that work together
    2. Follow modern best practices for the given technology stack
    3. Include helpful comments in the code to explain key sections
    4. Ensure the code accurately reflects the project requirements
    5. Focus on quality over quantity - include only essential files
    6. Make the code clean, readable, and maintainable
    7. For complex projects, focus on the core functionality first
    
    If you fail to produce valid, parseable JSON, the user's project will fail to build properly. Triple-check your JSON formatting before responding.`;

    // Create the user message with project details
    const userMessage = `
      I need you to generate the initial code files for a ${projectType || 'web'} project with the following details:
      
      Project Name: ${name}
      Description: ${description}
      Target Audience: ${targetAudience || 'General users'}
      Value Proposition: ${valueProposition || 'Not specified'}
      User Flow: ${Array.isArray(userFlow) ? userFlow.map((step, index) => `Step ${index + 1}: ${step.content || step}`).join('\n') : 'Not specified'}
      
      ${parsedAiResponse ? `
      Additionally, here's an AI-generated development plan for this project:
      
      Summary: ${parsedAiResponse.summary || ''}
      
      Key Features:
      ${parsedAiResponse.keyFeatures ? parsedAiResponse.keyFeatures.map((feature: string) => `- ${feature}`).join('\n') : ''}
      
      Tech Stack:
      ${parsedAiResponse.techStack ? parsedAiResponse.techStack.map((tech: string) => `- ${tech}`).join('\n') : ''}
      ` : ''}
      
      Please generate well-structured, functional code files that will serve as a strong starting point for this project. Focus on creating a complete, cohesive set of files that work together.
      
      Note: Your response must be a valid JSON object containing the code files as specified in the system instructions.
    `;

    console.log("Calling Anthropic API to generate code files...");
    
    try {
      // Call Claude API to generate the code files with more explicit parameters
      const message = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ],
        stop_sequences: ["```"],
      });

      // Extract the response text
      let responseText = '';
      
      if (Array.isArray(message.content)) {
        for (const contentBlock of message.content) {
          if (contentBlock.type === 'text') {
            responseText += contentBlock.text;
          }
        }
      }

      if (!responseText) {
        console.error('No text content found in response');
        return NextResponse.json(
          { error: 'No content in API response' },
          { status: 500 }
        );
      }

      console.log('Received response from Claude, length:', responseText.length);

      // Try to extract JSON from the response
      let jsonResponse = responseText;
      const jsonMatch = responseText.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch) {
        jsonResponse = jsonMatch[1].trim();
        console.log('Found code block in response. Extracted JSON length:', jsonResponse.length);
      } else {
        // Try alternative patterns to extract JSON
        const altMatch = responseText.match(/\{[\s\S]*\}/);
        if (altMatch) {
          jsonResponse = altMatch[0].trim();
          console.log('Found JSON object using alternative pattern. Length:', jsonResponse.length);
        } else {
          console.warn('Could not find JSON code block in Claude response, attempting to parse full response');
        }
      }
      
      try {
        // Attempt to repair and parse the JSON response
        const repairedJson = attemptJsonRepair(jsonResponse);
        const parsedFiles = JSON.parse(repairedJson);
        
        // Cache the successful response
        if (isDevelopment) {
          saveToCache(cacheKey, JSON.stringify(parsedFiles));
        }
        
        return NextResponse.json({ files: parsedFiles });
      } catch (e) {
        console.error('Failed to parse JSON from response:', e);
        
        // Return mock files as fallback
        if (isDevelopment) {
          saveToCache(cacheKey, JSON.stringify(mockCodeFiles));
        }
        
        return NextResponse.json(
          { files: mockCodeFiles, error: 'Failed to parse generated code' },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error('Error generating code files:', error);
      
      // Return mock files as fallback
      return NextResponse.json(
        { files: mockCodeFiles, error: 'Failed to generate code files' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in generate-code API:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 