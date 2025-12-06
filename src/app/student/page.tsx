'use client';

import { useStudent } from '@/context/StudentContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getLessonsByStudent, getHomeworksByStudent, calculateStudentMetrics } from '@/lib/firestore';
import type { Lesson, Homework } from '@/types';

export default function StudentDashboard() {
  const { student } = useStudent();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    Promise.all([
      getLessonsByStudent(student.id),
      getHomeworksByStudent(student.id)
    ]).then(([lessonsData, homeworksData]) => {
      setLessons(lessonsData);
      setHomeworks(homeworksData);
      setLoading(false);
    });
  }, [student]);

  if (!student || loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  const metrics = calculateStudentMetrics(lessons, homeworks);
  const upcomingHomeworks = homeworks
    .filter(hw => !hw.submittedAt)
    .slice(0, 3);
  const recentLessons = lessons.slice(0, 3);

  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div className="page-header">
        <h1>Welcome, {student.name}! 👋</h1>
        <p className="subtitle">
          Subject: {student.subject} • Level: {student.level}
        </p>
      </div>

      {/* Metrics Cards */}
      <section className="section">
        <h2 className="section-title">Your Progress</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{metrics.totalLessons}</div>
            <div className="stat-label">Total Lessons</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#00e68a' }}>
              {metrics.avgUnderstanding.toFixed(1)}/4
            </div>
            <div className="stat-label">Understanding</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#667eea' }}>
              {metrics.homeworkOnTimePercent.toFixed(0)}%
            </div>
            <div className="stat-label">Homework On-Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ffaa00' }}>
              {metrics.avgGrade.toFixed(0)}%
            </div>
            <div className="stat-label">Average Grade</div>
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Upcoming Homework */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">📝 Upcoming Homework</h2>
            <Link href="/student/homework" className="link-secondary">
              View All
            </Link>
          </div>
          {upcomingHomeworks.length === 0 ? (
            <div className="empty-state">
              <p>No pending homework 🎉</p>
            </div>
          ) : (
            <ul className="lessons-list">
              {upcomingHomeworks.map((hw) => (
                <li key={hw.id} className="lesson-item" style={{ borderLeftColor: '#ffaa00' }}>
                  <p className="lesson-topic">
                    Due: {hw.dueAt.toDate().toLocaleDateString()}
                  </p>
                  <p className="lesson-date">{hw.notes}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Lessons */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">🎓 Recent Lessons</h2>
            <Link href="/student/lessons" className="link-secondary">
              View All
            </Link>
          </div>
          {recentLessons.length === 0 ? (
            <div className="empty-state">
              <p>No lessons yet</p>
            </div>
          ) : (
            <ul className="lessons-list">
              {recentLessons.map((lesson) => (
                <li key={lesson.id} className="lesson-item" style={{ borderLeftColor: '#00a8ff' }}>
                  <p className="lesson-topic">{lesson.topic}</p>
                  <p className="lesson-date">
                    {lesson.startTime.toDate().toLocaleDateString()}
                  </p>
                  <div className="tags-list" style={{ marginTop: '0.5rem' }}>
                    <span className="badge badge-success">
                      Understanding: {lesson.understanding}/4
                    </span>
                    <span className="badge badge-info">
                      Engagement: {lesson.engagement}/3
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <section className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <Link
            href="/student/lessons"
            className="card"
            style={{ 
              background: 'linear-gradient(135deg, #00a8ff 0%, #0077cc 100%)',
              textDecoration: 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>My Lessons 📚</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>View lesson history and transcripts</p>
          </Link>
          <Link
            href="/student/homework"
            className="card"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textDecoration: 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Homework 📝</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Check assignments and grades</p>
          </Link>
          <Link
            href="/student/progress"
            className="card"
            style={{ 
              background: 'linear-gradient(135deg, #00e68a 0%, #00c471 100%)',
              textDecoration: 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>My Progress 📈</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Track your learning journey</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
