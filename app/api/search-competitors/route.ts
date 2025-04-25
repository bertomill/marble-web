import { NextResponse } from 'next/server';
// NextResponse is a class that allows you to create a response to a request
import { Anthropic } from '@anthropic-ai/sdk';
// Anthropic is a class that allows you to interact with the Anthropic API
const anthropic = new Anthropic({
  // apiKey is the key for the Anthropic API
  apiKey: process.env.ANTHROPIC_API_KEY,
  // apiKey is required
});

export async function POST(request: Request) {
  // try to get the body of the request
  try {
    // get the body of the request
    const body = await request.json();
    // get the projectName, projectDescription, and businessType from the body
    const { projectName, projectDescription, businessType } = body;

    if (!projectName || !projectDescription || !businessType) {
      // if the projectName, projectDescription, or businessType is not set, return an error
      return NextResponse.json(
        // return a json object with an error message
        { error: 'Missing required fields' }, 
        // return a status of 400
      );
    }

    // Create prompt for Claude to search for competitors
    const messages = [
      // create a message object with a role and content
      {
        // role is the role of the message
        role: 'user' as const,
        // content is the content of the message
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
      // model is the model to use
      model: 'claude-3-haiku-20240307',
      // max_tokens is the maximum number of tokens to generate
      max_tokens: 2000,
      // messages is the messages to send to the API
      messages: messages,
      // temperature is the temperature of the response
      temperature: 0.5,
    });

    // Extract and parse the competitors from Claude's response
    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Find JSON in response (in case Claude adds any extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    // if the jsonMatch is not found, return an error
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse competitors', competitors: [] }, 
        { status: 500 }
      );
    }

    // parse the competitors from the response
    const competitors = JSON.parse(jsonMatch[0]);

    // return the competitors
    return NextResponse.json({ competitors });
  } catch (error) {
    // if an error occurs, return an error
    console.error('Error searching competitors:', error);
    return NextResponse.json(
      // return a json object with an error message
      { error: 'Failed to search competitors', competitors: [] }, 
      { status: 500 }
    );
  }
} 