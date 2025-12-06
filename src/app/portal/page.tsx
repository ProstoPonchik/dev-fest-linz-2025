'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/StudentNavbar';
import StudentProtectedRoute from '@/components/StudentProtectedRoute';
import { useStudent } from '@/context/StudentContext';
import { getLessonsByStudent, getHomeworksByStudent, calculateStudentMetrics } from '@/lib/firestore';
import type { Lesson, Homework, StudentMetrics } from '@/types';

export default function StudentDashboard() {
  const { student } = useStudent();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!student) return;

      try {
        const [lessonsData, homeworksData] = await Promise.all([
          getLessonsByStudent(student.id),
          getHomeworksByStudent(student.id),
        ]);

        setLessons(lessonsData);
        setHomeworks(homeworksData);
        setMetrics(calculateStudentMetrics(lessonsData, homeworksData));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [student]);

  const recentLessons = lessons.slice(0, 3);
  const pendingHomeworks = homeworks.filter(h => h.status === 'missing' ||
    (h.dueAt.toDate() > new Date() && !h.submittedAt));
  const upcomingDue = pendingHomeworks.slice(0, 3);

  return (
    <StudentProtectedRoute>
      <StudentNavbar />
      <main className="page-container">
        <div className="page-header">
          <h1>Welcome, {student?.name}!</h1>
          <p className="subtitle">{student?.subject} | Level: {student?.level}</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Metrics Overview */}
            <section className="section">
              <h2 className="section-title">Your Progress</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{metrics?.totalLessons || 0}</div>
                  <div className="stat-label">Total Lessons</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{metrics?.avgUnderstanding.toFixed(1) || '0'}/4</div>
                  <div className="stat-label">Avg Understanding</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{metrics?.avgGrade.toFixed(0) || '0'}%</div>
                  <div className="stat-label">Avg Grade</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{metrics?.homeworkOnTimePercent.toFixed(0) || '0'}%</div>
                  <div className="stat-label">On-time Homework</div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions">
                <Link href="/portal/lessons" className="action-card">
                  <span className="action-icon">📚</span>
                  <span className="action-label">View All Lessons</span>
                </Link>
                <Link href="/portal/homework" className="action-card">
                  <span className="action-icon">📝</span>
                  <span className="action-label">My Homework</span>
                </Link>
                <Link href="/portal/progress" className="action-card">
                  <span className="action-icon">📊</span>
                  <span className="action-label">Progress Report</span>
                </Link>
              </div>
            </section>

            {/* Recent Lessons */}
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Recent Lessons</h2>
                <Link href="/portal/lessons" className="view-all-link">View all</Link>
              </div>
              {recentLessons.length > 0 ? (
                <div className="cards-list">
                  {recentLessons.map((lesson) => (
                    <div key={lesson.id} className="lesson-card">
                      <div className="lesson-card-header">
                        <h3>{lesson.topic}</h3>
                        <span className="lesson-date">
                          {lesson.startTime.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="lesson-card-body">
                        <div className="lesson-stat">
                          <span className="label">Understanding:</span>
                          <span className="value">{lesson.understanding}/4</span>
                        </div>
                        <div className="lesson-stat">
                          <span className="label">Engagement:</span>
                          <span className="value">{lesson.engagement}/3</span>
                        </div>
                      </div>
                      {lesson.notes && (
                        <p className="lesson-notes">{lesson.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No lessons yet. Your tutor will add them after each session.</p>
              )}
            </section>

            {/* Upcoming Homework */}
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Upcoming Homework</h2>
                <Link href="/portal/homework" className="view-all-link">View all</Link>
              </div>
              {upcomingDue.length > 0 ? (
                <div className="cards-list">
                  {upcomingDue.map((hw) => (
                    <div key={hw.id} className="homework-card">
                      <div className="homework-card-header">
                        <span className={`status-badge ${hw.status}`}>
                          {hw.status === 'missing' ? 'Pending' : 'Due Soon'}
                        </span>
                        <span className="due-date">
                          Due: {hw.dueAt.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <p className="homework-notes">{hw.notes || 'No description'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No pending homework. Great job!</p>
              )}
            </section>

            {/* Goals */}
            {student?.goals && (
              <section className="section">
                <h2 className="section-title">Your Goals</h2>
                <div className="goals-card">
                  <p>{student.goals}</p>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </StudentProtectedRoute>
  );
}
