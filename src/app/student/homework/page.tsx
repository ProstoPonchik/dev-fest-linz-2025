'use client';

import { useStudent } from '@/context/StudentContext';
import { useEffect, useState } from 'react';
import { getHomeworksByStudent } from '@/lib/firestore';
import type { Homework } from '@/types';

export default function StudentHomeworkPage() {
  const { student } = useStudent();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!student) return;

    getHomeworksByStudent(student.id).then((data) => {
      setHomeworks(data);
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

  const filteredHomeworks = homeworks.filter((hw) => {
    if (filter === 'pending') return !hw.submittedAt;
    if (filter === 'completed') return hw.submittedAt;
    return true;
  });

  const pendingCount = homeworks.filter(hw => !hw.submittedAt).length;
  const completedCount = homeworks.filter(hw => hw.submittedAt).length;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Homework 📝</h1>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            All ({homeworks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className="btn"
            style={{
              background: filter === 'pending' ? '#ffaa00' : 'var(--color-bg-card)',
              color: filter === 'pending' ? '#000' : 'var(--color-text)'
            }}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className="btn"
            style={{
              background: filter === 'completed' ? '#00e68a' : 'var(--color-bg-card)',
              color: filter === 'completed' ? '#000' : 'var(--color-text)'
            }}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {filteredHomeworks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>
              {filter === 'pending' && 'No pending homework 🎉'}
              {filter === 'completed' && 'No completed homework yet'}
              {filter === 'all' && 'No homework assigned yet'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredHomeworks.map((hw) => {
            const isOverdue = !hw.submittedAt && hw.dueAt.toDate() < new Date();
            const daysUntilDue = Math.ceil(
              (hw.dueAt.toDate().getTime() - now) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={hw.id}
                className="card"
                style={{
                  borderLeft: hw.submittedAt
                    ? '4px solid #00e68a'
                    : isOverdue
                    ? '4px solid #ff4d4d'
                    : '4px solid #ffaa00'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <h3 className="lesson-topic">
                        {hw.notes || 'Homework Assignment'}
                      </h3>
                      <span
                        className={`badge ${
                          hw.status === 'on_time'
                            ? 'badge-success'
                            : hw.status === 'late'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {hw.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      <p>
                        <span style={{ fontWeight: 600 }}>Assigned:</span>{' '}
                        {hw.assignedAt.toDate().toLocaleDateString()}
                      </p>
                      <p>
                        <span style={{ fontWeight: 600 }}>Due:</span>{' '}
                        {hw.dueAt.toDate().toLocaleDateString()}
                        {!hw.submittedAt && !isOverdue && daysUntilDue >= 0 && (
                          <span style={{ marginLeft: '0.5rem', color: '#ffaa00', fontWeight: 500 }}>
                            ({daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} left)
                          </span>
                        )}
                        {isOverdue && (
                          <span style={{ marginLeft: '0.5rem', color: '#ff4d4d', fontWeight: 500 }}>
                            (Overdue!)
                          </span>
                        )}
                      </p>
                      {hw.submittedAt && (
                        <p>
                          <span style={{ fontWeight: 600 }}>Submitted:</span>{' '}
                          {hw.submittedAt.toDate().toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {hw.submittedAt && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div>
                            <p className="stat-label">Grade</p>
                            <p className="stat-value" style={{ fontSize: '2rem' }}>{hw.grade}%</p>
                          </div>
                          {hw.correctAnswers !== undefined && hw.totalQuestions !== undefined && (
                            <div>
                              <p className="stat-label">Score</p>
                              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                {hw.correctAnswers}/{hw.totalQuestions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!hw.submittedAt && (
                    <div>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '4rem', 
                        height: '4rem', 
                        borderRadius: '50%', 
                        background: 'rgba(255, 170, 0, 0.15)', 
                        fontSize: '1.5rem' 
                      }}>
                        ⏰
                      </span>
                    </div>
                  )}
                  {hw.submittedAt && (
                    <div>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '4rem', 
                        height: '4rem', 
                        borderRadius: '50%', 
                        background: 'rgba(0, 230, 138, 0.15)', 
                        fontSize: '1.5rem' 
                      }}>
                        ✓
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
