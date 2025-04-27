import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

// Initialize Anthropic client with API key
const apiKey = process.env.ANTHROPIC_API_KEY;

// Function to get the Anthropic client
function getAnthropicClient() {
  return new Anthropic({
    apiKey: apiKey || 'dummy-key-for-development'
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get data from the request
    const data = await request.json();
    const { 
      fileName, 
      language, 
      projectName, 
      projectDescription, 
      projectType,
      existingFiles = [] 
    } = data;

    if (!fileName || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName and language' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY is not set, returning mock content');
      
      let mockContent = '';
      
      if (language === 'html') {
        mockContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName || 'My Project'}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>${projectName || 'Welcome to My Project'}</h1>
  <p>${projectDescription || 'This is a sample project description.'}</p>
  
  <script src="script.js"></script>
</body>
</html>`;
      } else if (language === 'css') {
        mockContent = `/* Styles for ${projectName || 'My Project'} */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  margin-bottom: 20px;
}`;
      } else if (language === 'javascript' || language === 'js') {
        mockContent = `// JavaScript for ${projectName || 'My Project'}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Document is ready!');
  
  // Add your JavaScript code here
});`;
      } else {
        mockContent = `// Generated content for ${fileName}
// This is a placeholder for ${language} content.
// Add your code here.`;
      }
      
      return NextResponse.json(
        { content: mockContent },
        { status: 200 }
      );
    }

    // Initialize Anthropic client
    const anthropic = getAnthropicClient();

    // Create a system prompt for Claude
    const systemPrompt = `You are an expert developer tasked with generating a single code file for a ${projectType || 'web'} project. 
Your goal is to create high-quality, production-ready code that follows best practices and modern standards.

You will be given the following information:
- File name: The name of the file to create
- Language: The programming language to use
- Project name: The name of the project
- Project description: A brief description of the project
- Project type: The type of project (website, web app, etc.)
- Existing files: A list of other files in the project (optional)

IMPORTANT: Your response should ONLY contain the raw code content for the file, with NO explanations, markdown, or decorative elements.
Do not use \`\`\` code blocks or any other non-code text in your response.
The entire response will be inserted directly into the code editor.

Please provide clear, well-commented, and structured code that would serve as a strong foundation for the requested file.`;

    // Create the user message with file details
    const userMessage = `
Please generate the code for a file with the following details:

File name: ${fileName}
Language: ${language}
Project name: ${projectName || 'Not specified'}
Project description: ${projectDescription || 'Not specified'}
Project type: ${projectType || 'Web project'}

${existingFiles.length > 0 ? `
Other files in the project:
${existingFiles.join('\n')}
` : ''}

Please generate high-quality, well-structured, and commented code for this file. The code should follow best practices for the specified language and be ready to use in a real project.

Remember, your response should ONLY contain the code content, with no surrounding text, explanations, or markdown formatting.`;

    console.log("Calling Anthropic API to generate file content...");
    
    try {
      // Call Claude API to generate the code content
      const message = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        temperature: 0.2,  // Lower temperature for more consistent output
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
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

      // Extract code content if wrapped in code blocks
      let codeContent = responseText;
      const codeMatch = responseText.match(/```(?:\w+)?\s*([\s\S]*?)```/);
      if (codeMatch) {
        codeContent = codeMatch[1].trim();
        console.log('Found code block in response, extracted code length:', codeContent.length);
      }

      return NextResponse.json({ content: codeContent }, { status: 200 });
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      return NextResponse.json(
        { error: 'Failed to generate code content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 