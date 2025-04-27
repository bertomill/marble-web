# Marble

Marble is a web application that helps users plan and manage their software projects. It provides an AI-powered planning tool to help define project requirements, generate development plans, and track progress.

## Features

- Create new project plans with AI assistance
- Define project details including name, description, target audience, and value proposition
- Outline user experience journeys
- Get AI-generated technical recommendations and development plans
- Find similar projects for inspiration
- Track project progress through a dashboard
- Enhanced competitor search with visualized progress
- Caching mechanism for AI-generated responses
- Toast notifications for user feedback
- Decorative marble blocks background on the dashboard for enhanced visual appeal
- Consistent header design across all pages with clickable logo for easy navigation

## Technologies Used

- Next.js 13+ with App Router
- React
- TypeScript
- Firebase (Authentication and Firestore)
- Tailwind CSS
- shadcn/ui component library
- OpenAI Web Search for competitor research

## Development

To start the development server:

```bash
npm run dev
```

## ESLint Configuration

The project includes an ESLint configuration file (.eslintrc.json) that sets specific rules for the codebase:
- TypeScript unused variables are set to "warn" instead of "error"
- React Hook dependency rules are set to "warn"

## Recent Updates

### Enhanced Project Experience
- Added UI toast components for better user feedback
- Enhanced competitor search with loading progress indicators and status messages
- Improved caching mechanism for AI-generated responses
- Added detailed ESLint configuration
- Fixed build issues for better deployment
- Added robust JSON response handling for Claude API interactions
- Implemented code generation for projects with intelligent error recovery

### Code Generation Capabilities
- Added a code editor feature with Monaco Editor integration
- Implemented AI-powered code generation for project scaffolding
- Built a file explorer for managing project files
- Added robust JSON response parsing with automatic error correction
- Created fallback mechanisms for when AI services are unavailable

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with your Firebase and AI service configurations:

```
# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# AI services
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Development Philosophy

This project is built incrementally, starting with the most basic version and adding features step by step to ensure a solid understanding of all components and functionality.

## User Experience

The project creation process follows a natural, conversational flow:

1. Users select the type of project they're building (website or mobile app)
2. They fill in a narrative-style form that feels like completing a paragraph about their project
   - Each field has a "magic button" that generates AI-powered content suggestions
   - Voice input is available for all fields via the microphone button
3. They describe the user journey using an interactive card-based interface with reorderable steps
4. The AI generates a personalized response with recommendations
5. Users can optionally search for similar successful projects for inspiration

## API Routes

The application includes several key API routes:

- `/api/generate-field`: Generates AI-powered content for specific form fields
- `/api/generate-plan`: Creates a comprehensive project plan based on user inputs
- `/api/search-competitors`: Finds similar projects for competitive analysis
- `/api/generate-code`: Generates starter code files based on project specifications
