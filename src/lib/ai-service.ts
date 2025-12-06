// AI Service - client-side functions to call AI API routes

export interface AIResponse {
  content: string;
}

export interface GeneratedQuestion {
  question: string;
  hint: string;
  answer: string;
  interestLink: string;
}

export interface QuestionsResponse {
  questions: GeneratedQuestion[];
  source: 'gemini' | 'mock' | 'mock_fallback';
  context?: {
    avgEngagement: number;
    avgUnderstanding: number;
    emotionalState: string;
  };
}

export async function generateLessonBrief(studentId: string): Promise<AIResponse> {
  const response = await fetch('/api/generateLessonBrief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate lesson brief');
  }

  return response.json();
}

export async function generateBiWeeklyReport(studentId: string): Promise<AIResponse> {
  const response = await fetch('/api/generateBiWeeklyReport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate bi-weekly report');
  }

  return response.json();
}

export type TipType = 'EASY' | 'PRACTICE' | 'CHECK';

export async function generateLiveTip(
  studentId: string,
  currentTopic: string,
  tipType: TipType,
  studentContext?: StudentContextData
): Promise<AIResponse> {
  const response = await fetch('/api/generateLiveTip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, currentTopic, tipType, studentContext }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate live tip');
  }

  return response.json();
}

export interface StudentContextData {
  name: string;
  subject: string;
  level: string;
  learningStyle: string;
  interests: string[];
  goals: string;
  avgEngagement: number;
  avgUnderstanding: number;
  emotionalState: string;
  recentTopics: string[];
}

export async function generatePersonalizedQuestions(
  studentId: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  studentContext?: StudentContextData
): Promise<QuestionsResponse> {
  const response = await fetch('/api/generateQuestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, topic, difficulty, studentContext }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('API Error:', error);
    throw new Error(error.error || 'Failed to generate questions');
  }

  return response.json();
}
