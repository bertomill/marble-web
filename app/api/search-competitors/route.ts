import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the competitor interface
interface Competitor {
  name: string;
  description: string;
  url: string;
}

export async function POST(request: Request) {
  try {
    // Get the body of the request
    const body = await request.json();
    const { 
      projectName, 
      description, 
      projectType = 'website', 
      businessType,
      targetAudience,
      valueProposition 
    } = body;

    if (!projectName || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log("Searching for competitors...");

    // Call OpenAI with web search tool using the latest approach
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that searches for real, current competitor information. Your goal is to provide accurate and up-to-date information about companies in specific industries."
        },
        {
          role: "user",
          content: `Find 3-4 current major competitors for a ${projectType} called "${projectName}".
          
          Project details:
          - Description: "${description}"
          ${businessType ? `- Business Type: ${businessType}` : ''}
          ${targetAudience ? `- Target Audience: "${targetAudience}"` : ''}
          ${valueProposition ? `- Value Proposition: "${valueProposition}"` : ''}
          
          Please search the web for real, existing companies that are top competitors in this specific space.
          For each competitor, provide:
          1. Company name
          2. Brief description of what they do and why they're similar to this project
          3. Their website URL
          
          Format the results as a valid JSON array of objects with this structure (and nothing else):
          [
            {
              "name": "Competitor Name",
              "description": "Description explaining what they do and why they're relevant",
              "url": "https://example.com"
            }
          ]
          
          Make sure to ONLY return the JSON array - no other text or explanation.`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "web_search",
            description: "Search the web for current information",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        }
      ],
      tool_choice: {
        type: "function",
        function: {
          name: "web_search"
        }
      }
    });

    // Extract the competitor information from the response
    const assistantMessage = response.choices[0]?.message;
    
    if (!assistantMessage || !assistantMessage.content) {
      return NextResponse.json(
        { error: 'Unexpected response format', competitors: [] },
        { status: 500 }
      );
    }

    const content = assistantMessage.content;
    
    // Find the JSON in the response (in case the model adds any extra text)
    const jsonMatch = typeof content === 'string' ? content.match(/\[\s*\{[\s\S]*\}\s*\]/) : null;
    
    if (!jsonMatch) {
      console.error('Failed to extract JSON from response:', content);
      return NextResponse.json(
        { error: 'Failed to parse competitors', competitors: [] },
        { status: 500 }
      );
    }

    try {
      // Parse the competitors from the response
      const competitors = JSON.parse(jsonMatch[0]) as Competitor[];
      
      // Log the found competitors for debugging
      console.log(`Found ${competitors.length} competitors:`, 
        competitors.map((c: Competitor) => c.name).join(', '));
      
      // Return the competitors
      return NextResponse.json({ competitors });
    } catch (parseError) {
      console.error('Error parsing competitors JSON:', parseError, jsonMatch[0]);
      return NextResponse.json(
        { error: 'Failed to parse competitors', competitors: [] },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error searching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to search competitors', competitors: [] },
      { status: 500 }
    );
  }
} 