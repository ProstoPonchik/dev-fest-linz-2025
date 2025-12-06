import { NextRequest, NextResponse } from 'next/server';
import { addLiveTranscriptionSegment } from '@/lib/firestore';
import type { TranscriptionSegment } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { 
      transcriptionId, 
      speaker, 
      text, 
      startTime, 
      endTime, 
      confidence 
    } = await request.json();

    if (!transcriptionId || !speaker || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const segment: TranscriptionSegment = {
      speaker: speaker as 'tutor' | 'student',
      text,
      startTime: startTime || Date.now(),
      endTime: endTime || Date.now(),
      confidence: confidence || 1.0,
    };

    await addLiveTranscriptionSegment(transcriptionId, segment);

    return NextResponse.json({
      status: 'segment_added',
      segment,
    });
  } catch (error) {
    console.error('Error adding transcription segment:', error);
    return NextResponse.json(
      { error: 'Failed to add segment' },
      { status: 500 }
    );
  }
}
