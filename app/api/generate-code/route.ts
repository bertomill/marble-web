import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isDevelopment } from '@/lib/utils';
import { saveProject } from '@/lib/db';
import { kv } from '@vercel/kv';

export const maxDuration = 180;

// Enhanced logging utility
const logger = {
  requestId: '',
  setRequestId: (id: string) => { logger.requestId = id; },
  info: (message: string, data?: unknown) => {
    console.log(`[INFO][${new Date().toISOString()}]${logger.requestId ? `[${logger.requestId}]` : ''}: ${message}`, data ? data : '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR][${new Date().toISOString()}]${logger.requestId ? `[${logger.requestId}]` : ''}: ${message}`, error ? error : '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN][${new Date().toISOString()}]${logger.requestId ? `[${logger.requestId}]` : ''}: ${message}`, data ? data : '');
  },
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.debug(`[DEBUG][${new Date().toISOString()}]${logger.requestId ? `[${logger.requestId}]` : ''}: ${message}`, data ? data : '');
    }
  },
  time: (label: string) => {
    if (isDevelopment) {
      console.time(`[TIME]${logger.requestId ? `[${logger.requestId}]` : ''}: ${label}`);
    }
  },
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(`[TIME]${logger.requestId ? `[${logger.requestId}]` : ''}: ${label}`);
    }
  }
};

// Initialize Anthropic client with API key
const apiKey = process.env.ANTHROPIC_API_KEY;
// isDevelopment is a boolean that is true if the NODE_ENV is development
console.log('Environment:', process.env.NODE_ENV);
logger.info('Environment initialized', { env: process.env.NODE_ENV });

// Function to get the Anthropic client
function getAnthropicClient() {
  if (!apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set in environment variables');
    return null;
  }
  
  logger.debug('Anthropic client initialized');
  return new Anthropic({
    apiKey
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
  return `generate-code-${hash}`;
}

// Function to save response to cache
async function saveToCache(key: string, data: Record<string, unknown>): Promise<void> {
  if (isDevelopment) {
    try {
      console.log(`Saving to cache with key: ${key}`);
      await kv.set(key, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  }
}

// Function to get response from cache
async function getFromCache(key: string): Promise<Record<string, unknown> | null> {
  if (isDevelopment) {
    try {
      console.log(`Attempting to get from cache with key: ${key}`);
      const data = await kv.get(key);
      if (data) {
        try {
          return JSON.parse(data as string);
        } catch (error) {
          console.error('Error parsing cached data:', error);
          return null;
        }
      }
    } catch (err) {
      console.error('Error getting from cache:', err);
    }
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

// Mock files for testing
const mockIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Todo App</h1>
        <div class="input-container">
            <input type="text" id="todoInput" placeholder="Add a new task...">
            <button id="addBtn">Add</button>
        </div>
        <ul id="todoList"></ul>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

const mockStylesCss = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
}

body {
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    padding-top: 50px;
}

.container {
    width: 500px;
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
}

.input-container {
    display: flex;
    margin-bottom: 20px;
}

input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    font-size: 16px;
}

button {
    padding: 10px 15px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background-color: #45a049;
}

ul {
    list-style-type: none;
}

li {
    padding: 10px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

li:last-child {
    border-bottom: none;
}

.delete-btn {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
}

.delete-btn:hover {
    background-color: #d32f2f;
}

.completed {
    text-decoration: line-through;
    color: #888;
}`;

const mockScriptJs = `document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todoInput');
    const addBtn = document.getElementById('addBtn');
    const todoList = document.getElementById('todoList');
    
    // Load todos from localStorage
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    // Render initial todos
    renderTodos();
    
    // Add event listener to the Add button
    addBtn.addEventListener('click', addTodo);
    
    // Add event listener for the Enter key
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // Function to add a new todo
    function addTodo() {
        const todoText = todoInput.value.trim();
        
        if (todoText !== '') {
            todos.push({
                id: Date.now(),
                text: todoText,
                completed: false
            });
            
            saveToLocalStorage();
            renderTodos();
            todoInput.value = '';
        }
    }
    
    // Function to toggle todo completion status
    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return {
                    ...todo,
                    completed: !todo.completed
                };
            }
            return todo;
        });
        
        saveToLocalStorage();
        renderTodos();
    }
    
    // Function to delete a todo
    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        
        saveToLocalStorage();
        renderTodos();
    }
    
    // Function to save todos to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    // Function to render todos
    function renderTodos() {
        todoList.innerHTML = '';
        
        todos.forEach(todo => {
            const li = document.createElement('li');
            
            // Create a span for the todo text
            const todoText = document.createElement('span');
            todoText.textContent = todo.text;
            if (todo.completed) {
                todoText.classList.add('completed');
            }
            
            // Add click event to toggle completion
            todoText.addEventListener('click', () => toggleTodo(todo.id));
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
            
            // Append elements to the list item
            li.appendChild(todoText);
            li.appendChild(deleteBtn);
            
            // Append list item to the todo list
            todoList.appendChild(li);
        });
    }
});`;

// Define mockFiles to fix reference error
const mockFiles = {
  "index.html": mockIndexHtml,
  "styles.css": mockStylesCss,
  "script.js": mockScriptJs
};

// Fix mockResponse - make sure it's used
export const mockResponse = {
  files: mockFiles
};

// POST endpoint for generating code
export async function POST(req: NextRequest) {
  try {
    // Generate a unique request ID for tracking
    const requestId = crypto.randomUUID();
    logger.setRequestId(requestId);
    
    logger.info('Received code generation request');
    logger.time('Total request processing time');
    
    const body = await req.json();
    logger.debug('Received body', body);

    // Get the body data
    const { prompt, projectType, id } = body;
    
    // Generate a cache key
    const cacheKey = generateCacheKey({ prompt, projectType });
    logger.debug('Generated cache key', { cacheKey });
    
    // Check if we have a cached response
    const cachedResponse = await getFromCache(cacheKey);
    if (cachedResponse) {
      logger.info('Using cached response');
      logger.timeEnd('Total request processing time');
      return NextResponse.json(cachedResponse);
    }
    
    // If we don't have a cached response, generate a new one
    const anthropic = getAnthropicClient();
    
    // If the anthropic client is not initialized, return an error
    if (!anthropic && !isDevelopment) {
      logger.error('Anthropic client not initialized');
      logger.timeEnd('Total request processing time');
      return NextResponse.json({ error: 'Anthropic API key not set' }, { status: 500 });
    }
    
    // If we're in development mode, return a mock response
    if (isDevelopment && !apiKey) {
      logger.info('Using mock response in development mode');
      logger.timeEnd('Total request processing time');
      return NextResponse.json({ files: mockCodeFiles });
    }
    
    // Prepare message for Anthropic
    const userMessage = `You are a senior full-stack developer. You need to create a simple ${projectType} application based on this description: "${prompt || projectType}".

Please generate the code for this application. Focus on clean, well-structured code with good comments. The application should be built using standard HTML, CSS, and vanilla JavaScript - no frameworks.

Your response should contain a JSON object with the following structure:
{
  "files": {
    "index.html": "... HTML code here ...",
    "styles.css": "... CSS code here ...",
    "script.js": "... JavaScript code here ...",
    // Add any additional files if needed
  }
}

Keep your code as simple as possible while fulfilling the requirements. Don't explain the code, just provide the JSON response.`;

    console.log('Sending message to Anthropic:', userMessage);
    
    // Call Anthropic API
    if (!anthropic) {
      logger.error('Anthropic client is null');
      logger.timeEnd('Total request processing time');
      return NextResponse.json({ error: 'Anthropic API key not set' }, { status: 500 });
    }
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20240307",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are an expert full-stack developer who creates clean, well-structured code with good comments. Always return valid, well-formed JSON responses exactly as requested.",
      messages: [
        { role: "user", content: userMessage }
      ]
    });
    
    console.log('Received response from Anthropic');
    
    // Extract the response text properly
    let responseContent = '';
    if (Array.isArray(response.content)) {
      for (const contentBlock of response.content) {
        if (contentBlock.type === 'text') {
          responseContent += contentBlock.text;
        }
      }
    }
    
    // Parse JSON from response
    let jsonData;
    try {
      // First try to parse it directly
      jsonData = JSON.parse(responseContent);
    } catch (e) {
      console.error('Error parsing JSON from response:', e);
      
      // Ensure we have a valid string before attempting repair
      if (responseContent) {
        // Attempt to repair the JSON
        jsonData = attemptJsonRepair(responseContent);
      } else {
        console.error('Response content is empty');
        return NextResponse.json(
          { error: 'Empty response from AI' },
          { status: 500 }
        );
      }
    }
    
    if (!jsonData || !jsonData.files) {
      return NextResponse.json(
        { error: 'No files found in AI response' },
        { status: 500 }
      );
    }
    
    // Save to cache for future requests
    await saveToCache(cacheKey, jsonData);
    
    // If user info is provided, save to database
    if (id) {
      console.log('Saving project to database');
      await saveProject(id, "", "", {
        name: prompt || projectType,
        type: projectType,
        description: prompt || '',
        files: jsonData.files
      });
    }
    
    logger.timeEnd('Total request processing time');
    return NextResponse.json(jsonData);
  } catch (e) {
    console.error('Error in API route:', e);
    logger.error('Internal server error', e);
    logger.timeEnd('Total request processing time');
    return NextResponse.json(
      { error: 'Internal server error', details: String(e) },
      { status: 500 }
    );
  }
}

function attemptJsonRepair(content: string): Record<string, unknown> {
  try {
    // First try direct parse
    return JSON.parse(content);
  } catch {
    console.log("Failed to parse JSON directly, attempting repairs...");
    
    // Try cleaning and repairing
    const rebuiltJson = cleanAndRepairJson(content);
    
    try {
      return JSON.parse(rebuiltJson);
    } catch {
      console.log("Failed to parse after cleanup, returning empty object");
      return {};
    }
  }
}

function cleanAndRepairJson(jsonString: string): string {
  // Handle empty strings
  if (!jsonString || jsonString.trim() === '') return "{}";
  
  // Try to fix common JSON issues
  const repaired = jsonString
    // Fix missing colons
    .replace(/([{,]\s*"[^"]+"\s*)\s+(")/g, '$1: $2')
    .replace(/([{,]\s*"[^"]+"\s*)\s+([^\s"{}\[\]:,]+)/g, '$1: $2')
    // Fix missing commas between array elements or object properties
    .replace(/}(\s*){/g, '},\n$1{')
    .replace(/](\s*)\[/g, '],\n$1[');
  
  return repaired;
} 