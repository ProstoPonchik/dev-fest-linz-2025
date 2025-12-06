import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Student, Lesson, Homework, StudentFormData, LessonFormData, HomeworkFormData, LessonTranscription, TranscriptionSegment } from '@/types';

function getDb() {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db;
}

// Students
export async function getStudentsByTutor(tutorId: string): Promise<Student[]> {
  const q = query(
    collection(getDb(), 'students'),
    where('tutorId', '==', tutorId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Student[];
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  const docRef = doc(getDb(), 'students', studentId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Student;
}

export async function createStudent(
  tutorId: string,
  data: StudentFormData
): Promise<DocumentReference> {
  const studentData = {
    ...data,
    tutorId,
    interests: data.interests.split(',').map((i) => i.trim()).filter(Boolean),
    createdAt: Timestamp.now(),
  };
  return addDoc(collection(getDb(), 'students'), studentData);
}

export async function updateStudent(studentId: string, data: Partial<StudentFormData>): Promise<void> {
  const docRef = doc(getDb(), 'students', studentId);
  const updateData: Record<string, unknown> = { ...data };
  if (data.interests) {
    updateData.interests = data.interests.split(',').map((i) => i.trim()).filter(Boolean);
  }
  await updateDoc(docRef, updateData);
}

export async function deleteStudent(studentId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'students', studentId));
}

// Get student by email (for Student Portal login)
export async function getStudentByEmail(email: string): Promise<Student | null> {
  const q = query(
    collection(getDb(), 'students'),
    where('email', '==', email)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Student;
}

// Link student with Google account
export async function linkStudentWithGoogle(studentId: string, email: string, googleUserId: string): Promise<void> {
  const docRef = doc(getDb(), 'students', studentId);
  await updateDoc(docRef, { email, googleUserId });
}

// Lessons
export async function getLessonsByStudent(studentId: string): Promise<Lesson[]> {
  const q = query(
    collection(getDb(), 'lessons'),
    where('studentId', '==', studentId),
    orderBy('startTime', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Lesson[];
}

export async function createLesson(
  tutorId: string,
  studentId: string,
  data: LessonFormData
): Promise<DocumentReference> {
  const lessonData = {
    tutorId,
    studentId,
    topic: data.topic,
    startTime: Timestamp.fromDate(new Date(data.startTime)),
    endTime: Timestamp.fromDate(new Date(data.endTime)),
    understanding: data.understanding,
    engagement: data.engagement,
    emotionalTag: data.emotionalTag,
    notes: data.notes,
    tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
  };
  return addDoc(collection(getDb(), 'lessons'), lessonData);
}

// Homeworks
export async function getHomeworksByStudent(studentId: string): Promise<Homework[]> {
  const q = query(
    collection(getDb(), 'homeworks'),
    where('studentId', '==', studentId),
    orderBy('assignedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Homework[];
}

export async function createHomework(
  tutorId: string,
  studentId: string,
  data: HomeworkFormData
): Promise<DocumentReference> {
  const homeworkData = {
    tutorId,
    studentId,
    assignedAt: Timestamp.fromDate(new Date(data.assignedAt)),
    dueAt: Timestamp.fromDate(new Date(data.dueAt)),
    submittedAt: data.submittedAt ? Timestamp.fromDate(new Date(data.submittedAt)) : null,
    status: data.status,
    grade: data.grade,
    notes: data.notes,
  };
  return addDoc(collection(getDb(), 'homeworks'), homeworkData);
}

// Metrics calculation
export function calculateStudentMetrics(lessons: Lesson[], homeworks: Homework[]) {
  const totalLessons = lessons.length;
  const totalHomeworks = homeworks.length;

  // Average understanding (1-4 scale)
  const avgUnderstanding = totalLessons > 0
    ? lessons.reduce((sum, l) => sum + l.understanding, 0) / totalLessons
    : 0;

  // Average engagement (1-3 scale)
  const avgEngagement = totalLessons > 0
    ? lessons.reduce((sum, l) => sum + l.engagement, 0) / totalLessons
    : 0;

  // Homework on-time percentage
  const onTimeCount = homeworks.filter((h) => h.status === 'on_time').length;
  const homeworkOnTimePercent = totalHomeworks > 0
    ? (onTimeCount / totalHomeworks) * 100
    : 0;

  // Average grade
  const avgGrade = totalHomeworks > 0
    ? homeworks.reduce((sum, h) => sum + h.grade, 0) / totalHomeworks
    : 0;

  // Risk assessment: at risk if avg understanding < 2.5 OR on-time < 70%
  const isAtRisk = avgUnderstanding < 2.5 || homeworkOnTimePercent < 70;

  return {
    avgUnderstanding,
    avgEngagement,
    homeworkOnTimePercent,
    avgGrade,
    totalLessons,
    totalHomeworks,
    isAtRisk,
  };
}

// Transcriptions
export async function createTranscription(
  lessonId: string,
  segments: TranscriptionSegment[]
): Promise<DocumentReference> {
  const fullText = segments.map(s => s.text).join(' ');
  const transcriptionData = {
    lessonId,
    segments,
    fullText,
    createdAt: Timestamp.now(),
    status: 'recording',
  };
  return addDoc(collection(getDb(), 'transcriptions'), transcriptionData);
}

export async function updateTranscription(
  transcriptionId: string,
  data: Partial<LessonTranscription>
): Promise<void> {
  const docRef = doc(getDb(), 'transcriptions', transcriptionId);
  await updateDoc(docRef, data);
}

export async function getTranscriptionByLesson(lessonId: string): Promise<LessonTranscription | null> {
  const q = query(
    collection(getDb(), 'transcriptions'),
    where('lessonId', '==', lessonId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as LessonTranscription;
}

export async function addTranscriptionSegment(
  transcriptionId: string,
  segment: TranscriptionSegment
): Promise<void> {
  const docRef = doc(getDb(), 'transcriptions', transcriptionId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) throw new Error('Transcription not found');

  const current = snapshot.data() as LessonTranscription;
  const newSegments = [...current.segments, segment];
  const newFullText = newSegments.map(s => s.text).join(' ');

  await updateDoc(docRef, {
    segments: newSegments,
    fullText: newFullText,
  });
}

// Get tutor info by student (for student portal)
export async function getTutorByStudent(studentId: string): Promise<{ id: string; name: string; email: string } | null> {
  const student = await getStudentById(studentId);
  if (!student) return null;

  // For now, we use the tutor's ID as their document ID
  // In a real app, we'd have a separate tutors collection
  return {
    id: student.tutorId,
    name: 'Tutor', // Would come from tutors collection
    email: '', // Would come from tutors collection
  };
}

// ===== Google Meet Integration Functions =====

// Meeting Sessions
export async function createMeetingSession(
  lessonId: string,
  meetingId: string,
  meetingLink: string,
  tutorGoogleId: string
): Promise<DocumentReference> {
  const sessionData = {
    lessonId,
    meetingId,
    meetingLink,
    tutorGoogleId,
    startedAt: Timestamp.now(),
    status: 'live',
  };
  return addDoc(collection(getDb(), 'meetingSessions'), sessionData);
}

export async function endMeetingSession(
  sessionId: string,
  recordingUrl?: string
): Promise<void> {
  const docRef = doc(getDb(), 'meetingSessions', sessionId);
  await updateDoc(docRef, {
    endedAt: Timestamp.now(),
    status: 'ended',
    ...(recordingUrl && { recordingUrl }),
  });
}

export async function getMeetingSessionByMeetingId(meetingId: string) {
  const q = query(
    collection(getDb(), 'meetingSessions'),
    where('meetingId', '==', meetingId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// Live Transcription
export async function createLiveTranscription(
  meetingSessionId: string
): Promise<DocumentReference> {
  const transcriptionData = {
    meetingSessionId,
    segments: [],
    lastUpdated: Timestamp.now(),
    status: 'active',
  };
  return addDoc(collection(getDb(), 'liveTranscriptions'), transcriptionData);
}

export async function addLiveTranscriptionSegment(
  liveTranscriptionId: string,
  segment: TranscriptionSegment
): Promise<void> {
  const docRef = doc(getDb(), 'liveTranscriptions', liveTranscriptionId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) throw new Error('Live transcription not found');

  const current = snapshot.data();
  const newSegments = [...(current.segments || []), segment];

  await updateDoc(docRef, {
    segments: newSegments,
    lastUpdated: Timestamp.now(),
  });
}

export async function getLiveTranscription(liveTranscriptionId: string) {
  const docRef = doc(getDb(), 'liveTranscriptions', liveTranscriptionId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function endLiveTranscription(liveTranscriptionId: string): Promise<void> {
  const docRef = doc(getDb(), 'liveTranscriptions', liveTranscriptionId);
  await updateDoc(docRef, {
    status: 'ended',
    lastUpdated: Timestamp.now(),
  });
}

// Live Suggestions
export async function createLiveSuggestion(
  meetingSessionId: string,
  type: 'tip' | 'question' | 'topic_change' | 'engagement_alert',
  content: string,
  priority: 'low' | 'medium' | 'high'
): Promise<DocumentReference> {
  const suggestionData = {
    meetingSessionId,
    createdAt: Timestamp.now(),
    type,
    content,
    priority,
    shown: false,
  };
  return addDoc(collection(getDb(), 'liveSuggestions'), suggestionData);
}

export async function getUnshownSuggestions(meetingSessionId: string) {
  const q = query(
    collection(getDb(), 'liveSuggestions'),
    where('meetingSessionId', '==', meetingSessionId),
    where('shown', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function markSuggestionAsShown(suggestionId: string): Promise<void> {
  const docRef = doc(getDb(), 'liveSuggestions', suggestionId);
  await updateDoc(docRef, { shown: true });
}

// Student Accounts
export async function createStudentAccount(
  email: string,
  googleUserId: string,
  studentId: string,
  tutorId: string
): Promise<DocumentReference> {
  const accountData = {
    email,
    googleUserId,
    studentId,
    tutorId,
    createdAt: Timestamp.now(),
  };
  return addDoc(collection(getDb(), 'studentAccounts'), accountData);
}

export async function getStudentAccountByGoogleId(googleUserId: string) {
  const q = query(
    collection(getDb(), 'studentAccounts'),
    where('googleUserId', '==', googleUserId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

export async function updateStudentLastLogin(accountId: string): Promise<void> {
  const docRef = doc(getDb(), 'studentAccounts', accountId);
  await updateDoc(docRef, {
    lastLogin: Timestamp.now(),
  });
}

