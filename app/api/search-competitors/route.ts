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

// Mock competitors for development or when API is unavailable
const mockCompetitors = [
  {
    name: "CreativeSuite",
    description: "An all-in-one platform for creative professionals with integrated design tools and project management features.",
    url: "https://example.com/creativesuite"
  },
  {
    name: "DesignHub",
    description: "A collaborative workspace for designers that streamlines workflow and client communication.",
    url: "https://example.com/designhub"
  },
  {
    name: "ArtistFlow",
    description: "Digital asset management platform with AI-powered organization tools specifically built for creative teams.",
    url: "https://example.com/artistflow"
  }
];

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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key found, using mock competitors");
      return NextResponse.json({ competitors: mockCompetitors });
    }

    try {
      // Use the correct web search approach with gpt-4.1
      const response = await openai.responses.create({
        model: "gpt-4.1",
        tools: [{ type: "web_search_preview" }],
        input: `Find 3-4 current major competitors for a ${projectType} called "${projectName}".
        
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
        
        Format the results as a valid JSON array of objects with this structure:
        [
          {
            "name": "Competitor Name",
            "description": "Description explaining what they do and why they're relevant",
            "url": "https://example.com"
          }
        ]
        
        Make sure to ONLY return the JSON array - no other text or explanation.`
      });

      // Extract the competitor information from the response
      const content = response.output_text;
      
      if (!content) {
        console.error('No content in response');
        return NextResponse.json(
          { competitors: mockCompetitors },
          { status: 200 }
        );
      }

      // Find the JSON in the response (in case the model adds any extra text)
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (!jsonMatch) {
        console.error('Failed to extract JSON from response:', content);
        return NextResponse.json(
          { competitors: mockCompetitors },
          { status: 200 }
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
          { competitors: mockCompetitors },
          { status: 200 }
        );
      }
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      return NextResponse.json(
        { competitors: mockCompetitors },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error searching competitors:', error);
    return NextResponse.json(
      { competitors: mockCompetitors },
      { status: 200 }
    );
  }
} 