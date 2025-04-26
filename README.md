# Marble

Marble is an application that helps people create websites and apps by guiding them through describing their business, goals, target audience, and user experience. The app then leverages AI to generate a development plan that users can accept or modify before beginning the build process.

## Features

- Interactive business requirements gathering
- AI-powered plan generation
- Plan approval/rejection workflow
- Side-by-side editor and preview interface

## Tech Stack

- Frontend: Next.js with React
- Styling: TailwindCSS with shadcn/ui components
- Database: Firebase Firestore
- Authentication: Firebase Auth with Google provider
- AI Integration: OpenAI API

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Philosophy

This project is built incrementally, starting with the most basic version and adding features step by step to ensure a solid understanding of all components and functionality.
