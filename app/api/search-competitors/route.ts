import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectName, projectDescription, businessType } = body;

    if (!projectName || !projectDescription || !businessType) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Create prompt for Claude to search for competitors
    const messages = [
      {
        role: 'user' as const,
        content: `I'm creating a new ${businessType} called "${projectName}". Here's a description: "${projectDescription}".
                  
                  Please find 3-5 top competitors in this market space. For each competitor, provide:
                  1. Name
                  2. Brief description of what they do
                  3. Website URL if available
                  
                  Please format your response as a valid JSON array of objects with the following structure:
                  [{ "name": "Competitor Name", "description": "Brief description", "url": "https://example.com" }]
                  
                  Only return the JSON array, no other text.`
      }
    ];

    // Call Claude's API
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: messages,
      temperature: 0.5,
    });

    // Extract and parse the competitors from Claude's response
    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Find JSON in response (in case Claude adds any extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse competitors', competitors: [] }, 
        { status: 500 }
      );
    }
    
    const competitors = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ competitors });
  } catch (error) {
    console.error('Error searching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to search competitors', competitors: [] }, 
      { status: 500 }
    );
  }
} 