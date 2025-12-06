import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { tutorId, summary, studentName, topic } = await request.json();

    console.log('[meet/create] Creating meeting:', { tutorId, summary, studentName, topic });

    // Check if Google Calendar credentials are configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      console.log('[meet/create] Google Calendar not configured');
      return NextResponse.json({
        error: 'Google Calendar API not configured',
        message: 'Please set up Google Calendar credentials in .env.local',
        setupGuide: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'
      }, { status: 501 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // For now, we need user to authenticate first
    // In production, you would store and reuse refresh tokens
    
    // Generate auth URL for user to authenticate
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      state: JSON.stringify({ tutorId, summary, studentName, topic })
    });

    return NextResponse.json({
      needsAuth: true,
      authUrl,
      message: 'Please authenticate with Google Calendar first'
    });

  } catch (error) {
    console.error('[meet/create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
