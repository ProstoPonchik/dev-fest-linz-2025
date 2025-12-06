'use client';

import { useState, useEffect } from 'react';
import StudentNavbar from '@/components/StudentNavbar';
import StudentProtectedRoute from '@/components/StudentProtectedRoute';
import { useStudent } from '@/context/StudentContext';
import { getLessonsByStudent, getTranscriptionByLesson } from '@/lib/firestore';
import type { Lesson, LessonTranscription } from '@/types';

export default function StudentLessonsPage() {
  const { student } = useStudent();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [transcription, setTranscription] = useState<LessonTranscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);

  useEffect(() => {
    async function fetchLessons() {
      if (!student) return;

      try {
        const lessonsData = await getLessonsByStudent(student.id);
        setLessons(lessonsData);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, [student]);

  const handleLessonClick = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setTranscriptionLoading(true);

    try {
      const trans = await getTranscriptionByLesson(lesson.id);
      setTranscription(trans);
    } catch (error) {
      console.error('Error fetching transcription:', error);
      setTranscription(null);
    } finally {
      setTranscriptionLoading(false);
    }
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = (end.getTime() - start.getTime()) / 1000 / 60;
    return `${Math.round(diff)} min`;
  };

  const getUnderstandingLabel = (value: number) => {
    const labels = ['', 'Needs Work', 'Developing', 'Good', 'Excellent'];
    return labels[value] || '';
  };

  const getEngagementLabel = (value: number) => {
    const labels = ['', 'Low', 'Medium', 'High'];
    return labels[value] || '';
  };

  return (
    <StudentProtectedRoute>
      <StudentNavbar />
      <main className="page-container">
        <div className="page-header">
          <h1>My Lessons</h1>
          <p className="subtitle">Review your past lessons and notes</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="lessons-layout">
            {/* Lessons List */}
            <div className="lessons-list-panel">
              {lessons.length > 0 ? (
                <div className="lessons-list">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`lesson-list-item ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                      onClick={() => handleLessonClick(lesson)}
                    >
                      <div className="lesson-item-header">
                        <h3>{lesson.topic}</h3>
                        <span className="lesson-date">
                          {lesson.startTime.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="lesson-item-meta">
                        <span className="duration">
                          {formatDuration(lesson.startTime.toDate(), lesson.endTime.toDate())}
                        </span>
                        <span className={`mood-tag ${lesson.emotionalTag}`}>
                          {lesson.emotionalTag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No lessons recorded yet.</p>
              )}
            </div>

            {/* Lesson Detail */}
            <div className="lesson-detail-panel">
              {selectedLesson ? (
                <div className="lesson-detail">
                  <h2>{selectedLesson.topic}</h2>
                  <p className="lesson-datetime">
                    {selectedLesson.startTime.toDate().toLocaleString()} -
                    {selectedLesson.endTime.toDate().toLocaleTimeString()}
                  </p>

                  <div className="lesson-metrics">
                    <div className="metric">
                      <span className="metric-label">Understanding</span>
                      <div className="metric-value">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${(selectedLesson.understanding / 4) * 100}%` }}
                          ></div>
                        </div>
                        <span>{getUnderstandingLabel(selectedLesson.understanding)}</span>
                      </div>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Engagement</span>
                      <div className="metric-value">
                        <div className="progress-bar">
                          <div
                            className="progress-fill engagement"
                            style={{ width: `${(selectedLesson.engagement / 3) * 100}%` }}
                          ></div>
                        </div>
                        <span>{getEngagementLabel(selectedLesson.engagement)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedLesson.tags.length > 0 && (
                    <div className="lesson-tags">
                      <h4>Topics Covered</h4>
                      <div className="tags-list">
                        {selectedLesson.tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLesson.notes && (
                    <div className="lesson-notes-section">
                      <h4>Tutor Notes</h4>
                      <p>{selectedLesson.notes}</p>
                    </div>
                  )}

                  {/* Transcription Section */}
                  <div className="transcription-section">
                    <h4>Lesson Transcription</h4>
                    {transcriptionLoading ? (
                      <div className="loading-inline">
                        <div className="spinner-sm"></div>
                        <span>Loading transcription...</span>
                      </div>
                    ) : transcription ? (
                      <div className="transcription-content">
                        {transcription.aiSummary && (
                          <div className="ai-summary">
                            <h5>AI Summary</h5>
                            <p>{transcription.aiSummary}</p>
                          </div>
                        )}
                        {transcription.keyTopics && transcription.keyTopics.length > 0 && (
                          <div className="key-topics">
                            <h5>Key Topics</h5>
                            <ul>
                              {transcription.keyTopics.map((topic, idx) => (
                                <li key={idx}>{topic}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {transcription.areasOfDifficulty && transcription.areasOfDifficulty.length > 0 && (
                          <div className="difficulty-areas">
                            <h5>Areas to Review</h5>
                            <ul>
                              {transcription.areasOfDifficulty.map((area, idx) => (
                                <li key={idx}>{area}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <details className="full-transcript">
                          <summary>View Full Transcript</summary>
                          <div className="transcript-text">
                            {transcription.segments.map((segment, idx) => (
                              <div key={idx} className={`transcript-segment ${segment.speaker}`}>
                                <span className="speaker">{segment.speaker === 'tutor' ? 'Tutor' : 'You'}:</span>
                                <span className="text">{segment.text}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    ) : (
                      <p className="no-transcription">No transcription available for this lesson.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <p>Select a lesson to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </StudentProtectedRoute>
  );
}
