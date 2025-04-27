import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
function generateCacheKey(data: ProjectInput): string {
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

// Fix 'any' type on line 32:33 by adding a proper type interface
interface ProjectInput {
  projectId: string;
  name: string;
  description: string;
  projectType: string;
  targetAudience?: string;
  valueProposition?: string;
  userFlow?: Array<{id: string; content?: string; title?: string; description?: string}>;
  aiResponse?: string;
}

// Fix the line with 'tempObj' using 'let' on line 411:9
const attemptJsonRepair = (jsonStr: string) => {
  console.log("Attempting to repair JSON:", jsonStr.substring(0, 100) + "...");
  
  try {
    // Try parsing as is first
    return JSON.parse(jsonStr);
  } catch {
    console.log("Initial JSON parse failed, attempting repairs...");
    
    // Basic repair: Fix missing colons
    let repairedJson = jsonStr.replace(/("[\w\s]+")\s+(["{[])/g, '$1: $2');
    
    // Fix unescaped quotes within strings
    repairedJson = repairedJson.replace(/([^\\])"/g, '$1\\"');
    repairedJson = repairedJson.replace(/^"/, '\\"');
    
    // Fix trailing commas in objects/arrays
    repairedJson = repairedJson.replace(/,\s*([\]}])/g, '$1');
    
    try {
      return JSON.parse(repairedJson);
    } catch {
      console.log("Basic repairs failed, trying extraction...");
      
      // Try to extract valid JSON
      const matches = jsonStr.match(/{.*}/);
      if (matches && matches[0]) {
        try {
          return JSON.parse(matches[0]);
        } catch {
          console.log("Extraction failed, trying to rebuild...");
          
          const jsonObject = rebuildJsonFromMalformedInput(jsonStr);
          if (jsonObject) {
            return jsonObject;
          }
          
          console.log("All repairs failed.");
          throw new Error("Unable to repair malformed JSON");
        }
      }
      
      console.log("No JSON-like structure found.");
      throw new Error("No valid JSON-like structure found");
    }
  }
};

// Fix error handling in all catch blocks
const rebuildJsonFromMalformedInput = (input: string) => {
  try {
    // Try to find key-value pairs
    const tempObj: Record<string, unknown> = {};
    const keyValueRegex = /"([^"]+)"\s*:\s*("[^"]*"|[0-9]+|true|false|\{[^}]*\}|\[[^\]]*\])/g;
    let match;
    
    while ((match = keyValueRegex.exec(input)) !== null) {
      const key = match[1];
      let value = match[2];
      
      try {
        // If it looks like an object or array, try to parse it
        if ((value.startsWith('{') && value.endsWith('}')) || 
            (value.startsWith('[') && value.endsWith(']'))) {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if parsing fails
          }
        }
        // Otherwise, try to parse it directly
        else {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if parsing fails
          }
        }
        
        tempObj[key] = value;
      } catch {
        // Skip problematic key-value pairs
      }
    }
    
    if (Object.keys(tempObj).length > 0) {
      return tempObj;
    }
    
    return null;
  } catch {
    return null;
  }
};

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
    
    !!!CRITICAL FORMATTING REQUIREMENTS!!!
    1. Output ONLY a raw JSON object with NO explanation text whatsoever
    2. Your response must start with { and end with } with no other characters
    3. Every property name must be in double quotes followed immediately by a colon
    4. NO markdown formatting, NO code blocks with backticks, NO comments outside the code content
    5. Properly escape ALL quotes within code strings using backslash: \\"
    6. Escape newlines in code as \\n
    7. The entire response must be parseable by JSON.parse()
    
    Example of correct format:
    {"index.html":{"content":"<!DOCTYPE html>\\n<html>\\n<head>\\n  <title>Example</title>\\n</head>\\n<body>\\n  <h1>Hello World</h1>\\n</body>\\n</html>","language":"html"}}
    
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
        temperature: 0.5,  // Lower temperature for more consistent formatting
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