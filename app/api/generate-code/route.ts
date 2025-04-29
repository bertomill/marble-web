import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import { kv } from '@vercel/kv';

export const maxDuration = 60;

// Initialize Anthropic client with API key
const apiKey = process.env.ANTHROPIC_API_KEY;
// isDevelopment is a boolean that is true if the NODE_ENV is development
console.log('Environment:', process.env.NODE_ENV);

// Function to get the Anthropic client
function getAnthropicClient() {
  if (!apiKey) {
    console.log('ANTHROPIC_API_KEY not set in environment variables');
    return null;
  }
  
  return new Anthropic({
    apiKey
  });
}

// Create a cache directory for development
const cacheDir = path.join(process.cwd(), '.cache');
if (process.env.NODE_ENV === 'development' && !fs.existsSync(cacheDir)) {
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
async function saveToCache(key: string, data: unknown): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    try {
      console.log(`Saving to cache with key: ${key}`);
      await kv.set(key, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  }
}

// Function to get response from cache
async function getFromCache(key: string): Promise<unknown | null> {
  if (process.env.NODE_ENV === 'development') {
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

// Mock response for testing
const mockResponse = {
  files: {
    "index.html": mockIndexHtml,
    "styles.css": mockStylesCss,
    "script.js": mockScriptJs
  }
};

// Handle POST requests to /api/generate-code
export async function POST(request: Request) {
  try {
    console.log('POST request received in generate-code');
    const body = await request.json();
    console.log('Received body:', body);
    
    // Validate the request body using Zod
    const schema = z.object({
      projectName: z.string(),
      projectType: z.string(),
      projectDescription: z.string().optional(),
    });
    
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      console.error('Validation error:', parsed.error);
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error },
        { status: 400 }
      );
    }
    
    const { projectName, projectType, projectDescription } = parsed.data;
    
    // Check cache first to avoid API calls during development/testing
    const cacheKey = generateCacheKey({
      projectName,
      projectType,
      projectDescription
    });
    
    const cachedData = await getFromCache(cacheKey);
    
    if (cachedData) {
      console.log('Using cached response');
      
      return NextResponse.json(cachedData);
    }
    
    // Get Anthropic client
    const anthropic = getAnthropicClient();
    
    if (!anthropic && process.env.NODE_ENV === 'development') {
      console.log('Using mock response in development mode');
      await saveToCache(cacheKey, mockResponse);
      
      return NextResponse.json(mockResponse);
    }
    
    if (!anthropic) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }
    
    // Prepare message for Anthropic
    const userMessage = `You are a senior full-stack developer. You need to create a simple ${projectType} application based on this description: "${projectDescription || projectName}".

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
    
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text;
    } else {
      console.error('Unexpected response format from Anthropic:', response.content);
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
    }
    
    // Parse JSON from response
    let jsonData;
    try {
      // First try to parse it directly
      jsonData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing JSON from response:', error);
      
      // Attempt to repair the JSON
      const repairedJson = attemptJsonRepair(responseText);
      
      if (repairedJson) {
        try {
          jsonData = JSON.parse(repairedJson);
          console.log('Successfully repaired and parsed JSON');
        } catch (error) {
          console.error('Failed to parse repaired JSON:', error);
          return NextResponse.json(
            { error: 'Invalid JSON in AI response', details: String(error) },
            { status: 500 }
          );
        }
      } else {
        console.error('Failed to repair JSON');
        return NextResponse.json(
          { error: 'Invalid JSON in AI response that could not be repaired' },
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
    
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to attempt to repair malformed JSON
function attemptJsonRepair(jsonString: string): string | null {
  // If it's already valid, return it
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch {
    // Continue with repair attempts
  }

  console.log("Attempting to repair malformed JSON");

  // Function to extract potential JSON from a text string
  const extractPotentialJson = (text: string): string => {
    // Look for content between triple backticks if present
    const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/g;
    const codeBlockMatches = [...text.matchAll(codeBlockRegex)];
    
    if (codeBlockMatches.length > 0) {
      // Return the last code block (most likely to be the complete one)
      return codeBlockMatches[codeBlockMatches.length - 1][1].trim();
    }
    
    // Look for content that appears to be JSON (starts with { and ends with })
    const jsonLikeRegex = /(\{[\s\S]*\})/g;
    const jsonLikeMatches = [...text.matchAll(jsonLikeRegex)];
    
    if (jsonLikeMatches.length > 0) {
      // Return the last match (most likely to be complete)
      return jsonLikeMatches[jsonLikeMatches.length - 1][1].trim();
    }
    
    // If no clear JSON structure is found, return the original
    return text;
  };

  // Function to rebuild JSON structure from malformed input
  const rebuildJson = (input: string): string => {
    // Fix missing colons between property names and values
    let result = input.replace(/(?<="[^"]+"\s*)(?=\s*[{["0-9])/g, ': ');
    
    // Fix unescaped quotes within string values
    let inString = false;
    let tempStr = '';
    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      const prevChar = i > 0 ? result[i-1] : '';
      
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      }
      
      if (inString && char === '"' && prevChar !== '\\' && i !== 0 && i !== result.length - 1) {
        tempStr += '\\"';
      } else {
        tempStr += char;
      }
    }
    result = tempStr;
    
    // Fix missing commas between array elements or object properties
    result = result.replace(/}(\s*){/g, '},\n$1{');
    result = result.replace(/](\s*)\[/g, '],\n$1[');
    result = result.replace(/"(\s*){/g, '",\n$1{');
    
    return result;
  };

  // Try different repair strategies
  try {
    // First, extract potential JSON content
    const potentialJson = extractPotentialJson(jsonString);
    
    // Try simple fixes first
    try {
      const tempObj = JSON.parse(potentialJson);
      return JSON.stringify(tempObj);
    } catch {
      // Continue with more complex repairs
    }
    
    // Try rebuilding the JSON structure
    const rebuiltJson = rebuildJson(potentialJson);
    
    try {
      const tempObj = JSON.parse(rebuiltJson);
      return JSON.stringify(tempObj);
    } catch (error) {
      console.log("Could not parse rebuilt JSON:", error);
    }
    
    // If we got here, our repair attempts failed
    console.log("All JSON repair attempts failed");
    return null;
  } catch (error) {
    console.error("Error in JSON repair process:", error);
    return null;
  }
} 