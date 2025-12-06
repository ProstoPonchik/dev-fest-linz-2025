# Uptum

AI-powered tutoring platform for tracking student progress and generating personalized learning insights using Google Gemini AI.

## Features

### For Tutors
- **Student Management**: Add, edit, and track students with detailed profiles
- **Lesson Tracking**: Record lessons with understanding, engagement, and emotional state metrics
- **Homework Management**: Create and track homework assignments with deadlines and grades
- **Dashboard Analytics**: Real-time metrics including:
  - Average understanding scores (1-4 scale)
  - Engagement levels (1-3 scale)
  - Homework completion rates
  - At-risk student identification
- **AI-Powered Tools**:
  - Live session assistant with personalized explanations and practice questions
  - Automatic question generation based on student interests and learning style
  - Custom difficulty levels (easy, medium, hard)
- **Google Meet Integration**: Create meetings with automatic transcription (OAuth)

### For Students
- **Student Portal**: Dedicated dashboard with lessons, homework, and progress tracking
- **Progress Visualization**: Charts showing understanding trends and homework performance
- **Learning Profile**: View personal learning style, interests, and goals

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, Turbopack), React 19, TypeScript
- **Backend**: Firebase (Authentication, Firestore Database)
- **AI**: Google Gemini 2.5 Flash API for content generation
- **APIs**: Google Calendar API, Google Meet API
- **Styling**: Custom CSS with dark theme, no Tailwind
- **Deployment**: Vercel-ready

## Project Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── generateQuestions/    # AI question generation endpoint
│   │   ├── generateLiveTip/      # AI live tips endpoint
│   │   ├── meet/                 # Google Meet integration
│   │   │   └── create/          # Create meeting with OAuth
│   │   └── auth/google/         # Google OAuth callback
│   │       └── callback/
│   ├── login/                    # Tutor login page
│   ├── students/                 # Tutor dashboard
│   │   ├── page.tsx             # Students list with metrics
│   │   └── [id]/                # Individual student pages
│   │       ├── page.tsx         # Student profile & details
│   │       └── live/            # Live session assistant
│   ├── student/                  # Student portal
│   │   ├── page.tsx             # Student dashboard
│   │   ├── lessons/             # View lessons & transcriptions
│   │   ├── homework/            # Homework assignments
│   │   ├── progress/            # Progress analytics
│   │   └── login/               # Student login
│   ├── meet/                     # Google Meet page
│   └── globals.css               # Global styles & dark theme
├── components/
│   ├── Navbar.tsx                # Tutor navigation
│   ├── StudentNavbar.tsx         # Student navigation
│   ├── AIQuestions.tsx           # AI question generator UI
│   ├── AddStudentForm.tsx        # Student creation/edit form
│   ├── AddLessonForm.tsx         # Lesson recording form
│   ├── AddHomeworkForm.tsx       # Homework creation form
│   ├── Modal.tsx                 # Reusable modal component
│   ├── ProtectedRoute.tsx        # Tutor auth wrapper
│   └── StudentProtectedRoute.tsx # Student auth wrapper
├── context/
│   ├── AuthContext.tsx           # Firebase auth state management
│   └── StudentContext.tsx        # Student auth state
├── lib/
│   ├── firebase.ts               # Firebase initialization
│   ├── firestore.ts              # Firestore CRUD operations
│   └── ai-service.ts             # Gemini AI API calls
└── types/
    └── index.ts                  # TypeScript interfaces

```

### Data Models

**Students Collection**
```typescript
{
  id: string;
  tutorId: string;              // References tutor user
  name: string;
  email?: string;               // For student portal login
  googleUserId?: string;        // Google OAuth ID
  age: number;
  subject: string;
  level: string;
  learningStyle: 'examples' | 'practice' | 'discussion' | 'visual' | 'reading';
  interests: string[];
  goals: string;
  createdAt: Timestamp;
}
```

**Lessons Collection**
```typescript
{
  id: string;
  studentId: string;
  tutorId: string;
  topic: string;
  startTime: Timestamp;
  duration: number;              // minutes
  understanding: number;         // 1-4 scale
  engagement: number;            // 1-3 scale
  emotionalState: string;
  notes: string;
  createdAt: Timestamp;
}
```

**Homework Collection**
```typescript
{
  id: string;
  studentId: string;
  tutorId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  status: 'pending' | 'completed' | 'graded';
  grade?: number;
  feedback?: string;
  submittedAt?: Timestamp;
  createdAt: Timestamp;
}
```

**Transcriptions Collection**
```typescript
{
  id: string;
  lessonId: string;
  studentId: string;
  fullText: string;
  segments: Array<{
    timestamp: string;
    speaker: string;
    text: string;
  }>;
  summary?: string;
  keyPoints?: string[];
  createdAt: Timestamp;
}
```

### Authentication Flow

**Tutor Authentication:**
1. Firebase Email/Password authentication
2. Context provider manages auth state globally
3. Protected routes redirect to `/login` if not authenticated

**Student Authentication:**
1. Google OAuth via Firebase
2. Student record linked by email
3. Separate context and protected routes for student portal

### AI Integration

**Question Generation Pipeline:**
```
Client (AIQuestions.tsx)
  ↓ Fetch student profile + recent lessons
  ↓ Calculate metrics (engagement, understanding)
  ↓ Build context object
  ↓ POST /api/generateQuestions
    ↓ Build personalized prompt
    ↓ Call Gemini 2.5 Flash API
    ↓ Parse response (format: QUESTION:/HINT:/ANSWER:/INTEREST_LINK:)
    ↓ Clean markdown symbols
    ↓ Return 5 personalized questions
  ↓ Display in UI with hints/answers
```

**Live Tips Pipeline:**
```
Client (live session page)
  ↓ Enter topic
  ↓ Click tip type (Easy/Practice/Check)
  ↓ POST /api/generateLiveTip
    ↓ Build context-aware prompt
    ↓ Call Gemini API
    ↓ Clean markdown
    ↓ Return formatted tip
  ↓ Display in session panel
```

### Google Meet Integration

**Meeting Creation Flow:**
```
User clicks "Create Meeting"
  ↓ POST /api/meet/create
  ↓ Redirect to Google OAuth consent
  ↓ User authorizes calendar access
  ↓ Callback to /api/auth/google/callback
    ↓ Exchange code for tokens
    ↓ Call Google Calendar API
    ↓ Create event with Meet link
  ↓ Redirect back with Meet URL
  ↓ Auto-open meeting in new tab
```

### State Management

- **Firebase Context**: Global auth state for tutors
- **Student Context**: Global auth state for students  
- **Local State**: Component-level state with React hooks
- **No Redux/Zustand**: Kept simple for hackathon scope

### API Security

- Environment variables for sensitive keys (`.env.local`)
- Firebase security rules control database access
- OAuth tokens never exposed to client
- API routes validate requests server-side

### Styling Architecture

- **No Tailwind**: Pure CSS for full control
- **CSS Variables**: Theme colors in `:root`
- **Dark Theme**: Default and only theme
- **Reusable Classes**: `.btn`, `.card`, `.form-input`, etc.
- **Component-scoped**: Styles in `globals.css`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Firebase project with Firestore and Authentication enabled

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication** with Email/Password provider:
   - Go to Authentication -> Sign-in method -> Email/Password -> Enable
4. Enable **Firestore Database**:
   - Go to Firestore Database -> Create database
   - Start in production mode or test mode
5. Add a Web App:
   - Go to Project Settings -> General -> Your apps -> Add app -> Web
   - Copy the Firebase configuration values

### Firestore Indexes

You need to create composite indexes for the queries. Go to Firestore -> Indexes and add:

1. Collection: `students`
   - Fields: `tutorId` (Ascending), `createdAt` (Descending)

2. Collection: `lessons`
   - Fields: `studentId` (Ascending), `startTime` (Descending)

3. Collection: `homeworks`
   - Fields: `studentId` (Ascending), `assignedAt` (Descending)

Alternatively, when you first run the app and access pages that require these queries, Firebase will show an error in the console with a link to create the required index automatically.

### Create a Tutor Account

Since there's no registration UI, create a tutor account manually:

1. Go to Firebase Console -> Authentication -> Users
2. Click "Add user"
3. Enter email and password for the tutor

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd hakaton
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generateLessonBrief/route.ts
│   │   ├── generateBiWeeklyReport/route.ts
│   │   └── generateLiveTip/route.ts
│   ├── login/page.tsx
│   ├── students/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── live/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AddHomeworkForm.tsx
│   ├── AddLessonForm.tsx
│   ├── AddStudentForm.tsx
│   ├── Modal.tsx
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── context/
│   └── AuthContext.tsx
├── lib/
│   ├── ai-service.ts
│   ├── firebase.ts
│   └── firestore.ts
└── types/
    └── index.ts
```

## Data Model

### Students
- name, age, subject, level
- goals, interests, learning style
- Associated with a tutor via `tutorId`

### Lessons
- topic, start/end time
- understanding (1-4), engagement (1-3)
- emotional tag (engaged/bored/frustrated)
- notes, tags

### Homeworks
- assigned/due/submitted dates
- status (on_time/late/missing)
- grade, notes

## AI Integration

The AI features currently use mock responses. The API routes are structured to easily integrate with real AI services:

- `/api/generateLessonBrief` - Pre-lesson preparation suggestions
- `/api/generateBiWeeklyReport` - Student progress summaries
- `/api/generateLiveTip` - Real-time teaching assistance

To integrate real AI (e.g., Gemini/Vertex AI), modify the API route handlers to call your AI service instead of returning mock data.

## Color Palette

- Background: `#181c25`
- Card Background: `#202633`
- Text: `#ffffff`
- Secondary Text: `#a0a8b8`
- Accent: `#00e68a`
- Warning: `#ffaa00`
- Danger: `#ff4d4d`

## License

MIT
