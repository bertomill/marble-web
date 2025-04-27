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
- Code editor with Claude 3.5 Haiku AI-powered code generation capabilities
- Simplified code preview directly on the project page
- AI Chat interface for generating and modifying code directly in the editor
- Showcase of marble artwork on the dashboard for visual inspiration

## Technologies Used

- Next.js 13+ with App Router
- React
- TypeScript
- Firebase (Authentication and Firestore)
- Tailwind CSS
- shadcn/ui component library
- Anthropic Claude 3.5 Haiku for AI-powered code generation
- OpenAI Web Search for competitor research
- Monaco Editor for code editing

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

### AI Chat Interface for Code Generation
- Added a chat interface that allows users to communicate with Claude AI directly in the editor
- Implemented code generation through chat conversations
- Added ability to apply AI-generated code directly to the current file
- Integrated code block highlighting in the chat messages
- Enabled toggling the chat interface visibility for better workspace layout

### Simplified Code Preview on Project Page
- Added a code preview section directly on the project page
- Implemented a simplified file explorer to navigate project files
- Included a toggle between code view and rendered preview
- Provided quick access to the full code editor for more advanced editing

### Enhanced Code Generation with Claude 3.5 Haiku
- Added a "Generate with Claude" button to create AI-generated code directly in the editor
- Created a dedicated API endpoint for single-file code generation
- Integrated file-specific code generation that considers project context and existing files
- Improved error handling and feedback for code generation processes
- Added real-time preview of generated code within the editor environment

### Enhanced Project Experience
- Added marble artwork showcase on the dashboard for visual inspiration
- Added AI-powered user journey text generation for more comprehensive user flow descriptions
- Added UI toast components for better user feedback
- Enhanced competitor search with loading progress indicators and status messages
- Improved caching mechanism for AI-generated responses
- Added detailed ESLint configuration
- Fixed build issues for better deployment
- Added robust JSON response handling for Claude API interactions
- Implemented code generation for projects with intelligent error recovery
- Improved UI with larger project logo for better visibility

### Code Generation Capabilities
- Enhanced code generation with Claude 3.5 Haiku
- Added a code editor feature with Monaco Editor integration
- Implemented AI-powered code generation for project scaffolding
- Built a file explorer for managing project files
- Added robust JSON response parsing with automatic error correction
- Created fallback mechanisms for when AI services are unavailable
- Added a 'Generate with Claude' button to create AI-generated code directly in the editor

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
3. They describe the user journey using a text area that allows for a detailed narrative of how users will interact with the application
   - Full user journey text can be auto-generated with a single click
4. The AI generates a personalized response with recommendations
5. Users can optionally search for similar successful projects for inspiration
6. Users can preview code samples directly on the project details page 
7. Users can generate code for their project and edit it in the dedicated code editor
8. For individual files, users can use the "Generate with Claude" button to have AI create or improve specific files
9. Users can communicate with the AI through a chat interface to get help with coding tasks or generate code

## API Routes

The application includes several key API routes:

- `/api/generate-field`: Generates AI-powered content for specific form fields
- `/api/generate-plan`: Creates a comprehensive project plan based on user inputs
- `/api/search-competitors`: Finds similar projects for competitive analysis
- `/api/generate-code`: Generates starter code files based on project specifications
- `/api/generate-file`: Generates code for individual files using Claude 3.5 Haiku
- `/api/chat-code`: Handles AI chat conversations for code generation and assistance
