'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Meeting {
  summary: string;
  startTime: string;
  link: string;
}

export default function MeetIntegrationPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [meetLink, setMeetLink] = useState('');
  const [activeMeetings] = useState<Meeting[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for successful meeting creation from OAuth callback
    const linkFromUrl = searchParams.get('meetLink');
    const errorFromUrl = searchParams.get('error');
    
    if (linkFromUrl) {
      setMeetLink(linkFromUrl);
      window.open(linkFromUrl, '_blank');
    }
    
    if (errorFromUrl) {
      if (errorFromUrl === 'auth_failed') {
        setError('Authentication failed. Please try again.');
      } else if (errorFromUrl === 'creation_failed') {
        setError('Failed to create meeting. Please try again.');
      }
    }
  }, [searchParams]);

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/meet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: user?.uid,
          summary: 'LessonBrain Tutoring Session',
          studentName: 'Student',
          topic: 'Lesson'
        })
      });

      const data = await response.json();
      
      if (data.needsAuth && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else if (data.meetLink) {
        setMeetLink(data.meetLink);
        window.open(data.meetLink, '_blank');
      } else if (data.error) {
        alert(data.message || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please check your Google Calendar connection.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Google Meet Integration</h1>
          <p className="page-subtitle">Create and manage tutoring sessions with Google Meet</p>
        </div>

        {error && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem', 
            background: 'var(--danger-bg)', 
            border: '1px solid var(--danger)', 
            borderRadius: '0.5rem',
            color: 'var(--danger)'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Create New Meeting */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Create New Meeting</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Start a new Google Meet session with automatic transcription
            </p>
            <button
              onClick={handleCreateMeeting}
              disabled={isCreating}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {isCreating ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Creating...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15.5 5H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5" />
                    <path d="M12 5V19M5 12h14" />
                  </svg>
                  Create Meeting
                </>
              )}
            </button>

            {meetLink && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--success-bg)', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                  Meeting created! Link:
                </p>
                <input
                  type="text"
                  value={meetLink}
                  readOnly
                  className="form-input"
                  style={{ fontSize: '0.875rem' }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Setup Required</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <p style={{ marginBottom: '0.75rem' }}>To use Google Meet integration:</p>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Enable Google Calendar API in Google Cloud Console</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add credentials to environment variables</li>
                <li>Grant calendar access permissions</li>
              </ol>
              <p style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--warning-bg)', borderRadius: '0.5rem', color: 'var(--warning)' }}>
                ⚠️ See GOOGLE_MEET_SETUP.md for detailed instructions
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Features</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Real-time Transcription</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Automatic audio-to-text during lessons
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>AI Assistance</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Live suggestions based on conversation
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Automatic Recording</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Save and analyze lesson data
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Meetings */}
        {activeMeetings.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Active Meetings</h2>
            <div className="card">
              {activeMeetings.map((meeting, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderBottom: index < activeMeetings.length - 1 ? '1px solid var(--border)' : 'none'
                  }}
                >
                  <div>
                    <strong>{meeting.summary}</strong>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {meeting.startTime}
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinMeeting(meeting.link)}
                    className="btn btn-primary"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
