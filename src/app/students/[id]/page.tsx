'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Modal from '@/components/Modal';
import AddLessonForm from '@/components/AddLessonForm';
import AddHomeworkForm from '@/components/AddHomeworkForm';
import { useAuth } from '@/context/AuthContext';
import {
  getStudentById,
  getLessonsByStudent,
  getHomeworksByStudent,
  createLesson,
  createHomework,
  calculateStudentMetrics,
} from '@/lib/firestore';
import { generateLessonBrief, generateBiWeeklyReport } from '@/lib/ai-service';
import type { Student, Lesson, Homework, LessonFormData, HomeworkFormData, StudentMetrics } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentDetailPage({ params }: PageProps) {
  const { id: studentId } = use(params);
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);

  const [lessonBrief, setLessonBrief] = useState<string | null>(null);
  const [biWeeklyReport, setBiWeeklyReport] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (user && studentId) {
      loadStudentData();
    }
  }, [user, studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [studentData, lessonsData, homeworksData] = await Promise.all([
        getStudentById(studentId),
        getLessonsByStudent(studentId),
        getHomeworksByStudent(studentId),
      ]);

      setStudent(studentData);
      setLessons(lessonsData);
      setHomeworks(homeworksData);

      if (studentData) {
        const metricsData = calculateStudentMetrics(lessonsData, homeworksData);
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (data: LessonFormData) => {
    if (!user) return;
    try {
      await createLesson(user.uid, studentId, data);
      setIsLessonModalOpen(false);
      await loadStudentData();
    } catch (error) {
      console.error('Error adding lesson:', error);
    }
  };

  const handleAddHomework = async (data: HomeworkFormData) => {
    if (!user) return;
    try {
      await createHomework(user.uid, studentId, data);
      setIsHomeworkModalOpen(false);
      await loadStudentData();
    } catch (error) {
      console.error('Error adding homework:', error);
    }
  };

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      const result = await generateLessonBrief(studentId);
      setLessonBrief(result.content);
    } catch (error) {
      console.error('Error generating lesson brief:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const result = await generateBiWeeklyReport(studentId);
      setBiWeeklyReport(result.content);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const formatDate = (timestamp: { toDate: () => Date }) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (timestamp: { toDate: () => Date }) => {
    return timestamp.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEmotionalBadge = (tag: string) => {
    switch (tag) {
      case 'engaged':
        return <span className="badge badge-success">Engaged</span>;
      case 'bored':
        return <span className="badge badge-warning">Bored</span>;
      case 'frustrated':
        return <span className="badge badge-danger">Frustrated</span>;
      default:
        return <span className="badge badge-neutral">{tag}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_time':
        return <span className="badge badge-success">On Time</span>;
      case 'late':
        return <span className="badge badge-warning">Late</span>;
      case 'missing':
        return <span className="badge badge-danger">Missing</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
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
          <span>{student.name}</span>
        </div>

        {/* Profile Card */}
        <div className="card section">
          <div className="profile-card">
            <div className="profile-info">
              <div>
                <h1 className="profile-name">{student.name}</h1>
                <p className="profile-subject">{student.subject} - {student.level}</p>
              </div>

              {student.goals && (
                <div className="profile-detail">
                  <span className="profile-detail-label">Goals</span>
                  <span className="profile-detail-value">{student.goals}</span>
                </div>
              )}

              <div className="profile-detail">
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href={`/students/${studentId}/live`} className="btn btn-primary">
                Live Session
              </Link>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Avg Understanding</div>
              <div className="stat-value">
                {metrics.totalLessons > 0 ? metrics.avgUnderstanding.toFixed(1) : '-'}
                <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}> / 4</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Engagement</div>
              <div className="stat-value">
                {metrics.totalLessons > 0 ? metrics.avgEngagement.toFixed(1) : '-'}
                <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}> / 3</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Homework On-Time</div>
              <div className="stat-value accent">
                {metrics.totalHomeworks > 0 ? `${metrics.homeworkOnTimePercent.toFixed(0)}%` : '-'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Grade</div>
              <div className="stat-value">
                {metrics.totalHomeworks > 0 ? metrics.avgGrade.toFixed(0) : '-'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Lessons</div>
              <div className="stat-value">{metrics.totalLessons}</div>
            </div>
          </div>
        )}

        {/* Lessons Section */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Lessons</h2>
            <button className="btn btn-primary" onClick={() => setIsLessonModalOpen(true)}>
              + Add Lesson
            </button>
          </div>

          <div className="card">
            {lessons.length === 0 ? (
              <div className="empty-state">
                <p>No lessons recorded yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Topic</th>
                      <th>Understanding</th>
                      <th>Engagement</th>
                      <th>Mood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((lesson) => (
                      <tr key={lesson.id}>
                        <td>{formatDateTime(lesson.startTime)}</td>
                        <td>{lesson.topic}</td>
                        <td>{lesson.understanding} / 4</td>
                        <td>{lesson.engagement} / 3</td>
                        <td>{getEmotionalBadge(lesson.emotionalTag)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Homeworks Section */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Homework</h2>
            <button className="btn btn-primary" onClick={() => setIsHomeworkModalOpen(true)}>
              + Add Homework
            </button>
          </div>

          <div className="card">
            {homeworks.length === 0 ? (
              <div className="empty-state">
                <p>No homework recorded yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Assigned</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeworks.map((hw) => (
                      <tr key={hw.id}>
                        <td>{formatDate(hw.assignedAt)}</td>
                        <td>{formatDate(hw.dueAt)}</td>
                        <td>{getStatusBadge(hw.status)}</td>
                        <td>{hw.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* AI Section */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">AI Insights</h2>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleGenerateBrief}
              disabled={isGeneratingBrief}
            >
              {isGeneratingBrief ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Generating...
                </>
              ) : (
                'Generate Lesson Brief (AI)'
              )}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Generating...
                </>
              ) : (
                'Generate Bi-Weekly Report (AI)'
              )}
            </button>
          </div>

          {lessonBrief && (
            <div className="ai-card">
              <div className="ai-card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Lesson Brief
              </div>
              <div className="ai-card-content">{lessonBrief}</div>
            </div>
          )}

          {biWeeklyReport && (
            <div className="ai-card">
              <div className="ai-card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                Bi-Weekly Report
              </div>
              <div className="ai-card-content">{biWeeklyReport}</div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title="Add Lesson">
        <AddLessonForm onSubmit={handleAddLesson} onCancel={() => setIsLessonModalOpen(false)} />
      </Modal>

      <Modal isOpen={isHomeworkModalOpen} onClose={() => setIsHomeworkModalOpen(false)} title="Add Homework">
        <AddHomeworkForm onSubmit={handleAddHomework} onCancel={() => setIsHomeworkModalOpen(false)} />
      </Modal>
    </ProtectedRoute>
  );
}
