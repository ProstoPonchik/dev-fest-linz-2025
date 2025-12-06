import { NextRequest, NextResponse } from 'next/server';
import { createMeetingSession, createLiveTranscription } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const { lessonId, meetingId, meetingLink, tutorGoogleId } = await request.json();

    if (!lessonId || !meetingId || !meetingLink || !tutorGoogleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create meeting session
    const sessionRef = await createMeetingSession(
      lessonId,
      meetingId,
      meetingLink,
      tutorGoogleId
    );

    // Create live transcription
    const transcriptionRef = await createLiveTranscription(sessionRef.id);

    return NextResponse.json({
      sessionId: sessionRef.id,
      transcriptionId: transcriptionRef.id,
      status: 'started',
    });
  } catch (error) {
    console.error('Error starting meeting session:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}
