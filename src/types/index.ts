import { Timestamp } from 'firebase/firestore';

// User roles
export type UserRole = 'tutor' | 'student';

export interface Tutor {
  id: string;
  name: string;
  email: string;
}

export interface Student {
  id: string;
  tutorId: string;
  name: string;
  email?: string; // Google email for student portal login
  age: number;
  subject: string;
  level: string;
  goals: string;
  interests: string[];
  learningStyle: 'examples' | 'practice' | 'discussion' | 'visual' | 'reading';
  createdAt: Timestamp;
  // Google Meet integration
  googleUserId?: string; // For linking with Google Meet
}

// Lesson with Google Meet integration
export interface MeetingInfo {
  meetingId: string;
  meetingLink: string;
  calendarEventId?: string;
}

export interface Lesson {
  id: string;
  tutorId: string;
  studentId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  topic: string;
  understanding: 1 | 2 | 3 | 4;
  engagement: 1 | 2 | 3;
  correctAnswers?: number;
  totalQuestions?: number;
  notes: string;
  tags: string[];
  emotionalTag: 'engaged' | 'bored' | 'frustrated';
  // Google Meet integration
  meetingInfo?: MeetingInfo;
  // Transcription
  transcription?: LessonTranscription;
}

// Transcription types
export interface TranscriptionSegment {
  speaker: 'tutor' | 'student';
  text: string;
  startTime: number; // seconds from lesson start
  endTime: number;
  confidence: number;
}

export interface LessonTranscription {
  id: string;
  lessonId: string;
  segments: TranscriptionSegment[];
  fullText: string;
  createdAt: Timestamp;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  // AI Analysis
  aiSummary?: string;
  keyTopics?: string[];
  studentQuestions?: string[];
  areasOfDifficulty?: string[];
}

export interface Homework {
  id: string;
  tutorId: string;
  studentId: string;
  assignedAt: Timestamp;
  dueAt: Timestamp;
  submittedAt?: Timestamp | null;
  status: 'on_time' | 'late' | 'missing';
  grade: number;
  correctAnswers?: number;
  totalQuestions?: number;
  notes: string;
}

export interface Analytics {
  id: string;
  studentId: string;
  tutorId: string;
  type: 'lesson_brief' | 'biweekly_report';
  createdAt: Timestamp;
  content: string;
}

// Google Meet Integration Types
export interface MeetingSession {
  id: string;
  lessonId: string;
  meetingId: string;
  meetingLink: string;
  tutorGoogleId: string;
  studentGoogleId?: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  status: 'live' | 'ended' | 'processing';
  recordingUrl?: string;
  // Real-time transcription reference
  liveTranscriptionId?: string;
}

// Real-time transcription (live during meeting)
export interface LiveTranscription {
  id: string;
  meetingSessionId: string;
  segments: TranscriptionSegment[];
  lastUpdated: Timestamp;
  status: 'active' | 'paused' | 'ended';
}

// AI Live Suggestions for tutor
export interface LiveSuggestion {
  id: string;
  meetingSessionId: string;
  createdAt: Timestamp;
  type: 'tip' | 'question' | 'topic_change' | 'engagement_alert';
  content: string;
  priority: 'low' | 'medium' | 'high';
  shown: boolean;
}

// Student account for portal access
export interface StudentAccount {
  id: string;
  email: string;
  googleUserId: string;
  studentId: string; // Reference to Student document
  tutorId: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

// Form data types (without Timestamp for form inputs)
export interface StudentFormData {
  name: string;
  email: string; // Google email for student portal (REQUIRED)
  age: number;
  subject: string;
  level: string;
  goals: string;
  interests: string;
  learningStyle: Student['learningStyle'];
}

export interface LessonFormData {
  topic: string;
  startTime: string;
  endTime: string;
  understanding: 1 | 2 | 3 | 4;
  engagement: 1 | 2 | 3;
  emotionalTag: Lesson['emotionalTag'];
  notes: string;
  tags: string;
}

export interface HomeworkFormData {
  assignedAt: string;
  dueAt: string;
  submittedAt?: string;
  status: Homework['status'];
  grade: number;
  notes: string;
}

// Metrics types
export interface StudentMetrics {
  avgUnderstanding: number;
  avgEngagement: number;
  homeworkOnTimePercent: number;
  avgGrade: number;
  totalLessons: number;
  totalHomeworks: number;
  isAtRisk: boolean;
}
