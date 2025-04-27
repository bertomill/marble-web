import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

export const maxDuration = 60;

// Initialize Anthropic client with API key
const apiKey = process.env.ANTHROPIC_API_KEY;
const isDevelopment = process.env.NODE_ENV === 'development';

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

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received in chat-code');
    const body = await request.json();
    console.log('Received body:', body);
    
    const { message, currentFile, currentFileContent, projectFiles, projectContext } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Get Anthropic client
    const anthropic = getAnthropicClient();
    
    if (!anthropic) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Create system prompt for code modifications
    const systemPrompt = `You are an expert software developer assistant who helps write and modify code. 
    
When the user asks you to:
1. Create new code: Provide complete, well-structured code that's ready to use
2. Modify existing code: Make precise changes while preserving the existing structure and style
3. Fix bugs: Identify issues and explain how to resolve them

Important guidelines:
- If asked to modify or create code, respond ONLY with the complete code without explanation
- If asked a general question about the code or programming concepts, provide helpful explanations
- When writing code, follow best practices and include appropriate comments
- Always consider the context of the current file, project type, and related files

The user is currently working in: ${currentFile || 'No file selected'}
`;

    // Prepare context for the AI
    let filesContext = '';
    if (projectFiles && Object.keys(projectFiles).length > 0) {
      filesContext = 'Project files:\n';
      Object.entries(projectFiles).forEach(([fileName, fileData]) => {
        if (fileName === currentFile) {
          filesContext += `- ${fileName} (current file)\n`;
        } else {
          filesContext += `- ${fileName}\n`;
        }
      });
    }

    let projectInfo = '';
    if (projectContext) {
      projectInfo = `
Project information:
- Name: ${projectContext.name || 'Unnamed'}
- Type: ${projectContext.type || 'Web application'} 
- Description: ${projectContext.description || 'No description'}
`;
    }

    // Prepare message for Anthropic
    const userMessage = `${projectInfo}
${filesContext}

${currentFile ? `Current file (${currentFile}) content:
\`\`\`
${currentFileContent || 'Empty file'}
\`\`\`
` : 'No file is currently selected.'}

User message: ${message}`;

    console.log('Sending message to Anthropic');
    
    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20240307",
      max_tokens: 4000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage }
      ]
    });
    
    console.log('Received response from Anthropic');
    
    // Extract the response
    let responseText = '';
    if (Array.isArray(response.content)) {
      for (const contentBlock of response.content) {
        if (contentBlock.type === 'text') {
          responseText += contentBlock.text;
        }
      }
    } else if (typeof response.content === 'string') {
      responseText = response.content;
    }
    
    // Try to extract code blocks if present
    const codeBlocks = responseText.match(/```(?:\w+)?\s*([\s\S]*?)```/g);
    let codeContent = null;
    
    if (codeBlocks && codeBlocks.length > 0) {
      // Extract content from the first code block without the backticks and language identifier
      const extractedCode = codeBlocks[0].replace(/```(?:\w+)?\s*([\s\S]*?)```/, '$1').trim();
      codeContent = extractedCode;
    }
    
    return NextResponse.json({
      message: responseText,
      codeContent: codeContent
    });
    
  } catch (error) {
    console.error('Error in chat-code API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
} 