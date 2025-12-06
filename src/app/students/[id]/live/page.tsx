'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import AIQuestions from '@/components/AIQuestions';
import { useAuth } from '@/context/AuthContext';
import { getStudentById } from '@/lib/firestore';
import { generateLiveTip, TipType } from '@/lib/ai-service';
import type { Student } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LiveSessionPage({ params }: PageProps) {
  const { id: studentId } = use(params);
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTopic, setCurrentTopic] = useState('');
  const [tipContent, setTipContent] = useState<string | null>(null);
  const [activeTipType, setActiveTipType] = useState<TipType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studentContext, setStudentContext] = useState<any>(null);

  useEffect(() => {
    if (user && studentId) {
      loadStudent();
      loadStudentContext();
    }
  }, [user, studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const studentData = await getStudentById(studentId);
      setStudent(studentData);
    } catch (error) {
      console.error('Error loading student:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentContext = async () => {
    try {
      const { getStudentById, getLessonsByStudent } = await import('@/lib/firestore');
      const student = await getStudentById(studentId);
      const lessons = await getLessonsByStudent(studentId);
      const recentLessons = lessons.slice(0, 3);

      const avgEngagement = recentLessons.length > 0
        ? recentLessons.reduce((sum, l) => sum + (l.engagement || 0), 0) / recentLessons.length
        : 2;

      const avgUnderstanding = recentLessons.length > 0
        ? recentLessons.reduce((sum, l) => sum + (l.understanding || 0), 0) / recentLessons.length
        : 2.5;

      const recentTopics = recentLessons
        .map(l => l.topic)
        .filter(Boolean);

      const emotionalState = avgEngagement >= 2.5 ? 'engaged' : avgEngagement >= 1.5 ? 'neutral' : 'struggling';

      if (student) {
        setStudentContext({
          name: student.name,
          subject: student.subject,
          level: student.level,
          learningStyle: student.learningStyle,
          interests: student.interests || [],
          goals: student.goals || 'Master the subject',
          avgEngagement,
          avgUnderstanding,
          emotionalState,
          recentTopics
        });
      }
    } catch (error) {
      console.error('Error loading student context:', error);
    }
  };

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*\((.*?)\)\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .trim();
  };

  const handleGenerateTip = async (tipType: TipType) => {
    if (!currentTopic.trim()) {
      alert('Please enter a current topic first');
      return;
    }

    setIsGenerating(true);
    setActiveTipType(tipType);
    try {
      const result = await generateLiveTip(studentId, currentTopic, tipType, studentContext);
      setTipContent(cleanMarkdown(result.content));
    } catch (error) {
      console.error('Error generating tip:', error);
      setTipContent('Failed to generate tip. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTipTypeLabel = (type: TipType) => {
    switch (type) {
      case 'EASY':
        return 'Easy Explanation';
      case 'PRACTICE':
        return 'Practice Question';
      case 'CHECK':
        return 'Comprehension Check';
    }
  };

  const getLearningStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      examples: 'Learning by Examples',
      practice: 'Practice-Based',
      discussion: 'Discussion-Based',
      visual: 'Visual Learning',
      reading: 'Reading/Writing',
    };
    return labels[style] || style;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="page-container">
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!student) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="page-container">
          <div className="card">
            <div className="empty-state">
              <h3>Student not found</h3>
              <Link href="/students" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Back to Students
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="page-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/students">Students</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href={`/students/${studentId}`}>{student.name}</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Live Session</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">Live Session Prompter</h1>
        </div>

        <div className="live-container">
          {/* Sidebar */}
          <div className="live-sidebar">
            {/* Student Info Card */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Student Info</h3>

              <div className="profile-detail" style={{ marginBottom: '0.75rem' }}>
                <span className="profile-detail-label">Name</span>
                <span className="profile-detail-value">{student.name}</span>
              </div>

              <div className="profile-detail" style={{ marginBottom: '0.75rem' }}>
                <span className="profile-detail-label">Subject</span>
                <span className="profile-detail-value">{student.subject}</span>
              </div>

              <div className="profile-detail" style={{ marginBottom: '0.75rem' }}>
                <span className="profile-detail-label">Level</span>
                <span className="profile-detail-value">{student.level}</span>
              </div>

              <div className="profile-detail" style={{ marginBottom: '0.75rem' }}>
                <span className="profile-detail-label">Learning Style</span>
                <span className="profile-detail-value">{getLearningStyleLabel(student.learningStyle)}</span>
              </div>

              {student.interests.length > 0 && (
                <div className="profile-detail">
                  <span className="profile-detail-label">Interests</span>
                  <div className="tags-list" style={{ marginTop: '0.25rem' }}>
                    {student.interests.map((interest, i) => (
                      <span key={i} className="tag">{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Topic Input */}
            <div className="card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="currentTopic" className="form-label">Current Topic</label>
                <input
                  type="text"
                  id="currentTopic"
                  className="form-input"
                  value={currentTopic}
                  onChange={(e) => setCurrentTopic(e.target.value)}
                  placeholder="e.g., Quadratic equations"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Get AI Suggestions</h3>
              <div className="live-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerateTip('EASY')}
                  disabled={isGenerating}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {isGenerating && activeTipType === 'EASY' ? (
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  )}
                  Easy Explanation
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerateTip('PRACTICE')}
                  disabled={isGenerating}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {isGenerating && activeTipType === 'PRACTICE' ? (
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  )}
                  Practice Question
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerateTip('CHECK')}
                  disabled={isGenerating}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {isGenerating && activeTipType === 'CHECK' ? (
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  )}
                  Comprehension Check
                </button>
              </div>
            </div>
          </div>

          {/* Main Output Area */}
          <div className="live-output">
            {tipContent ? (
              <div className="ai-card" style={{ height: '100%' }}>
                <div className="ai-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {activeTipType && getTipTypeLabel(activeTipType)}
                </div>
                <div className="ai-card-content">{tipContent}</div>
              </div>
            ) : (
              <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                  <h3>Ready to assist</h3>
                  <p>Enter a topic and click one of the buttons to get AI-powered suggestions tailored to {student.name}&apos;s learning style and interests.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Questions Section */}
        <div style={{ marginTop: '2rem' }}>
          <AIQuestions studentId={studentId} currentTopic={currentTopic} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
