import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('[auth/callback] OAuth error:', error);
      return NextResponse.redirect(new URL('/meet?error=auth_failed', request.url));
    }

    if (!code) {
      return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('[auth/callback] Got tokens, creating meeting...');

    // Parse state to get meeting details
    interface MeetingDetails {
      summary?: string;
      studentName?: string;
      topic?: string;
      tutorId?: string;
    }
    
    let meetingDetails: MeetingDetails = { summary: 'LessonBrain Session' };
    if (state) {
      try {
        meetingDetails = JSON.parse(state);
      } catch {
        console.log('[auth/callback] Could not parse state');
      }
    }

    // Create calendar event with Meet link
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: meetingDetails.summary || 'LessonBrain Tutoring Session',
        description: `Student: ${meetingDetails.studentName || 'N/A'}\nTopic: ${meetingDetails.topic || 'N/A'}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId: `lessonbrain-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      }
    });

    const meetLink = event.data.hangoutLink;
    const eventId = event.data.id;

    console.log('[auth/callback] Meeting created:', meetLink);

    // Redirect to meet page with success
    const redirectUrl = new URL('/meet', request.url);
    redirectUrl.searchParams.set('meetLink', meetLink || '');
    redirectUrl.searchParams.set('eventId', eventId || '');
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('[auth/callback] Error:', error);
    return NextResponse.redirect(new URL('/meet?error=creation_failed', request.url));
  }
}
