'use client';

import { useStudent } from '@/context/StudentContext';
import { useEffect, useState } from 'react';
import { getLessonsByStudent, getTranscriptionByLesson } from '@/lib/firestore';
import type { Lesson, LessonTranscription } from '@/types';

export default function StudentLessonsPage() {
  const { student } = useStudent();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [transcription, setTranscription] = useState<LessonTranscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    getLessonsByStudent(student.id).then((data) => {
      setLessons(data);
      setLoading(false);
    });
  }, [student]);

  const handleLessonClick = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setTranscription(null);
    
    // Load transcription if available
    const trans = await getTranscriptionByLesson(lesson.id);
    setTranscription(trans);
  };

  if (!student || loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Lessons 📚</h1>
      </div>

      {lessons.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>No lessons yet. Your first lesson will appear here!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Lessons List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: selectedLesson?.id === lesson.id ? '2px solid #00a8ff' : '1px solid var(--color-border)'
                }}
              >
                <h3 className="lesson-topic">{lesson.topic}</h3>
                <p className="lesson-date">
                  {lesson.startTime.toDate().toLocaleDateString()} • 
                  {lesson.startTime.toDate().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                
                <div className="tags-list" style={{ marginTop: '1rem' }}>
                  <span className="badge badge-success">
                    Understanding: {lesson.understanding}/4
                  </span>
                  <span className="badge badge-info">
                    Engagement: {lesson.engagement}/3
                  </span>
                  <span className={`badge ${
                    lesson.emotionalTag === 'engaged' 
                      ? 'badge-success'
                      : lesson.emotionalTag === 'frustrated'
                      ? 'badge-danger'
                      : 'badge-neutral'
                  }`}>
                    {lesson.emotionalTag}
                  </span>
                </div>

                {lesson.tags && lesson.tags.length > 0 && (
                  <div className="tags-list" style={{ marginTop: '0.5rem' }}>
                    {lesson.tags.map((tag, i) => (
                      <span key={i} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Lesson Details */}
          <div className="card" style={{ position: 'sticky', top: '1.5rem', maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}>
            {!selectedLesson ? (
              <p className="text-gray-500 text-center py-12">
                Select a lesson to view details
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedLesson.topic}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedLesson.startTime.toDate().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {selectedLesson.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tutor Notes:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedLesson.notes}</p>
                  </div>
                )}

                {selectedLesson.meetingInfo && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Meeting Link:</h3>
                    <a
                      href={selectedLesson.meetingInfo.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Google Meet
                    </a>
                  </div>
                )}

                {transcription && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Lesson Transcript:</h3>
                    {transcription.status === 'completed' ? (
                      <div className="space-y-4">
                        {transcription.aiSummary && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">AI Summary:</h4>
                            <p className="text-sm text-blue-800">{transcription.aiSummary}</p>
                          </div>
                        )}
                        
                        {transcription.keyTopics && transcription.keyTopics.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Key Topics:</h4>
                            <div className="flex flex-wrap gap-2">
                              {transcription.keyTopics.map((topic, i) => (
                                <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <h4 className="font-semibold text-gray-900 mb-2">Full Transcript:</h4>
                          <div className="space-y-2">
                            {transcription.segments.map((segment, i) => (
                              <div key={i} className="text-sm">
                                <span className={`font-semibold ${
                                  segment.speaker === 'tutor' ? 'text-blue-600' : 'text-green-600'
                                }`}>
                                  {segment.speaker === 'tutor' ? 'Tutor' : 'You'}:
                                </span>
                                <span className="text-gray-700 ml-2">{segment.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Transcription status: {transcription.status}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
