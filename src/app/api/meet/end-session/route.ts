import { NextRequest, NextResponse } from 'next/server';
import { 
  endMeetingSession, 
  endLiveTranscription, 
  getLiveTranscription,
  updateTranscription,
  getTranscriptionByLesson 
} from '@/lib/firestore';
import type { LiveTranscription } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, transcriptionId, lessonId } = await request.json();

    if (!sessionId || !transcriptionId) {
      return NextResponse.json(
        { error: 'Missing sessionId or transcriptionId' },
        { status: 400 }
      );
    }

    // End session
    await endMeetingSession(sessionId);
    await endLiveTranscription(transcriptionId);

    // Get full transcription
    const liveTranscription = await getLiveTranscription(transcriptionId) as LiveTranscription | null;

    if (liveTranscription && liveTranscription.segments?.length > 0) {
      // For now, just save the transcription
      // AI analysis will be implemented separately
      const transcription = await getTranscriptionByLesson(lessonId);
      
      if (transcription) {
        // Update existing
        await updateTranscription(transcription.id, {
          segments: liveTranscription.segments,
          fullText: liveTranscription.segments.map((s) => s.text).join(' '),
          status: 'completed',
        });
      }

      return NextResponse.json({
        status: 'completed',
        segmentCount: liveTranscription.segments.length,
      });
    }

    return NextResponse.json({ status: 'completed' });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
