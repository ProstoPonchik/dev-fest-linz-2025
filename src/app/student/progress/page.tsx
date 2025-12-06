'use client';

import { useStudent } from '@/context/StudentContext';
import { useEffect, useState } from 'react';
import { getLessonsByStudent, getHomeworksByStudent, calculateStudentMetrics } from '@/lib/firestore';
import type { Lesson, Homework } from '@/types';

export default function StudentProgressPage() {
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

  // Prepare data for charts
  const sortedLessons = [...lessons].sort(
    (a, b) => a.startTime.toMillis() - b.startTime.toMillis()
  );

  const sortedHomeworks = [...homeworks]
    .filter(hw => hw.submittedAt)
    .sort((a, b) => a.assignedAt.toMillis() - b.assignedAt.toMillis());

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Progress 📈</h1>
      </div>

      {/* Overall Metrics */}
      <section className="section">
        <div className="stats-grid">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #00a8ff 0%, #0077cc 100%)' }}>
            <div className="stat-value">{metrics.totalLessons}</div>
            <div className="stat-label">Total Lessons</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #00e68a 0%, #00c471 100%)' }}>
            <div className="stat-value">
              {metrics.avgUnderstanding.toFixed(1)}<span style={{ fontSize: '1.25rem' }}>/4</span>
            </div>
            <div className="stat-label">Avg Understanding</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="stat-value">
              {metrics.homeworkOnTimePercent.toFixed(0)}<span style={{ fontSize: '1.25rem' }}>%</span>
            </div>
            <div className="stat-label">Homework On-Time</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)' }}>
            <div className="stat-value">
              {metrics.avgGrade.toFixed(0)}<span style={{ fontSize: '1.25rem' }}>%</span>
            </div>
            <div className="stat-label">Avg Grade</div>
          </div>
        </div>
      </section>

      {/* Learning Profile */}
      <section className="section">
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Learning Profile</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Subject & Level</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {student.subject} • {student.level}
              </p>
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Learning Style</h3>
              <p style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{student.learningStyle}</p>
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Goals</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>{student.goals}</p>
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Interests</h3>
              <div className="tags-list">
                {student.interests.map((interest, i) => (
                  <span key={i} className="tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Trend */}
      {sortedLessons.length > 0 && (
        <section className="section">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              Understanding Progress Over Time
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sortedLessons.map((lesson) => (
                <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', width: '6rem' }}>
                    {lesson.startTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div style={{ flex: 1, background: 'var(--color-bg-input)', borderRadius: '9999px', height: '1.5rem' }}>
                    <div
                      style={{ 
                        width: `${(lesson.understanding / 4) * 100}%`,
                        background: 'linear-gradient(135deg, #00a8ff 0%, #0077cc 100%)',
                        height: '1.5rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {lesson.understanding}/4
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', width: '8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lesson.topic}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Homework Performance */}
      {sortedHomeworks.length > 0 && (
        <section className="section">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              Homework Performance
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sortedHomeworks.map((hw, i) => (
                <div key={hw.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', width: '6rem' }}>HW {i + 1}</span>
                  <div style={{ flex: 1, background: 'var(--color-bg-input)', borderRadius: '9999px', height: '1.5rem' }}>
                    <div
                      style={{ 
                        width: `${hw.grade}%`,
                        background: hw.grade >= 90
                          ? 'linear-gradient(135deg, #00e68a 0%, #00c471 100%)'
                          : hw.grade >= 70
                          ? 'linear-gradient(135deg, #00a8ff 0%, #0077cc 100%)'
                          : hw.grade >= 50
                          ? 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)'
                          : 'linear-gradient(135deg, #ff4d4d 0%, #cc0000 100%)',
                        height: '1.5rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {hw.grade}%
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', width: '8rem' }}>
                    {hw.assignedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section className="section">
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Recent Activity</h2>
          {lessons.length === 0 && homeworks.length === 0 ? (
            <div className="empty-state">
              <p>No activity yet. Keep learning! 🚀</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...lessons.slice(0, 5), ...homeworks.slice(0, 5)]
                .sort((a, b) => {
                  const timeA = 'startTime' in a ? a.startTime : a.assignedAt;
                  const timeB = 'startTime' in b ? b.startTime : b.assignedAt;
                  return timeB.toMillis() - timeA.toMillis();
                })
                .slice(0, 10)
                .map((item, i) => {
                  const isLesson = 'topic' in item;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>
                        {isLesson ? '📚' : '📝'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500 }}>
                          {isLesson ? (item as Lesson).topic : 'Homework Assignment'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          {isLesson
                            ? (item as Lesson).startTime.toDate().toLocaleDateString()
                            : (item as Homework).assignedAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
