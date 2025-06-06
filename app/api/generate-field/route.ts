import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fieldType, projectType } = body;

    if (!fieldType) {
      return NextResponse.json(
        { error: 'Field type is required' },
        { status: 400 }
      );
    }

    // Create appropriate prompt based on field type
    let prompt = '';
    switch (fieldType) {
      case 'name':
        prompt = `Generate a creative and professional name for a ${projectType || 'digital'} project. Keep it concise (2-5 words).`;
        break;
      case 'description':
        prompt = `Generate a compelling description for a ${projectType || 'digital'} project. The description should be 2-3 sentences long and highlight the project's purpose.`;
        break;
      case 'targetAudience':
        prompt = `Generate a concise target audience description for a ${projectType || 'digital'} project. Keep it to 1-2 sentences focusing on demographics and needs.`;
        break;
      case 'valueProposition':
        prompt = `Generate a clear value proposition for a ${projectType || 'digital'} project. Express in 1-2 sentences what unique value this project offers to users.`;
        break;
      case 'userJourneyText':
        prompt = `Generate a detailed user journey narrative for a ${projectType || 'digital'} project. This should be a paragraph (4-6 sentences) describing the complete user flow from discovery to achieving their goals. Format it as a coherent narrative with each step in the journey clearly defined.`;
        break;
      case 'new-step':
      case 'journey-step-1':
        prompt = `Generate a user journey step for a ${projectType || 'digital'} project. This should be a short phrase describing a key interaction point.`;
        break;
      default:
        // Handle journey step fields that follow the pattern journey-step-X
        if (fieldType.startsWith('journey-step-')) {
          prompt = `Generate a user journey step for a ${projectType || 'digital'} project. This should be a short phrase describing a key interaction point.`;
        } else {
          return NextResponse.json(
            { error: 'Invalid field type' },
            { status: 400 }
          );
        }
    }

    // In a real application, this would call an actual AI service with the prompt
    // For now, we'll use our mock function
    const content = mockGenerateContent(fieldType, projectType, prompt);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error in generate-field API:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// Mock function to simulate AI content generation
function mockGenerateContent(fieldType: string, projectType?: string, prompt?: string): string {
  // Log the prompt for debugging purposes
  console.log(`Would use this prompt with a real AI service: ${prompt}`);
  
  const projectDesc = projectType || 'digital';
  
  const responses: Record<string, string[]> = {
    name: [
      `${projectDesc.charAt(0).toUpperCase() + projectDesc.slice(1)} Nexus`,
      'Horizon Flow',
      'Quantum Connect',
      'Stellar Vision',
      'Prism Portal',
    ],
    description: [
      `A cutting-edge ${projectDesc} solution that streamlines user experiences and offers innovative features. Our platform integrates seamlessly with existing workflows to maximize productivity.`,
      `This ${projectDesc} platform transforms how users interact with technology, focusing on intuitive design and powerful functionality. We aim to solve common pain points through thoughtful innovation.`,
      `An advanced ${projectDesc} tool built to enhance user engagement and satisfaction. Our solution addresses key market gaps with a focus on reliability and performance.`,
    ],
    targetAudience: [
      `Tech-savvy professionals aged 25-45 who value efficiency and innovation in their ${projectDesc} tools.`,
      `Small to medium businesses looking to optimize their ${projectDesc} operations with minimal overhead and maximum ROI.`,
      `Creative professionals who need reliable ${projectDesc} solutions that won't disrupt their workflow.`,
    ],
    valueProposition: [
      `Our ${projectDesc} solution reduces task completion time by 40% while improving accuracy and user satisfaction.`,
      `Unlike competitors, our ${projectDesc} platform integrates all essential tools in one intuitive interface, eliminating the need for multiple subscriptions.`,
      `We provide enterprise-grade ${projectDesc} capabilities at accessible price points, democratizing access to powerful tools.`,
    ],
    userJourneyText: [
      `First, the user discovers our ${projectDesc} through social media or search. Upon visiting, they're greeted with a clean interface explaining key benefits. After signing up, they complete a brief onboarding process customizing their experience. Users then explore core features with helpful tooltips guiding them. Finally, they complete their first task and receive a confirmation, feeling satisfied with the intuitive experience.`,
      `Initially, users find our ${projectDesc} through word-of-mouth or online reviews. They visit our landing page and immediately understand our value proposition. After registration, a quick tutorial highlights main features. Users then navigate to solve their specific problem, easily finding the right tools. They successfully complete their task and are prompted to save their work or share results with colleagues.`,
      `Users begin by searching for solutions to their ${projectDesc} needs. Upon landing on our site, they're drawn in by testimonials and feature highlights. After signing up, they explore a personalized dashboard showing recommended starting points. They experiment with core functionality, receiving contextual help when needed. Once comfortable, users integrate our solution into their workflow and experience the productivity benefits firsthand.`,
    ],
  };

  // Handle any journey step field types (new-step or journey-step-X)
  if (fieldType === 'new-step' || fieldType.startsWith('journey-step-')) {
    const journeySteps = [
      'Discovery & Onboarding',
      'Feature Exploration',
      'Problem Resolution',
      'Account Customization',
      'Sharing & Collaboration',
    ];
    const randomIndex = Math.floor(Math.random() * journeySteps.length);
    return journeySteps[randomIndex];
  }

  const options = responses[fieldType];
  if (!options) {
    return `Content for ${fieldType}`;
  }
  
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}