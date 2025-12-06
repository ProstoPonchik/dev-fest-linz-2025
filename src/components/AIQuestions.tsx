'use client';

import { useState, useEffect } from 'react';
import { generatePersonalizedQuestions, type GeneratedQuestion, type StudentContextData } from '@/lib/ai-service';
import { getStudentById, getLessonsByStudent } from '@/lib/firestore';

interface AIQuestionsProps {
  studentId: string;
  currentTopic: string;
}

export default function AIQuestions({ studentId, currentTopic }: AIQuestionsProps) {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [showAnswers, setShowAnswers] = useState<Set<number>>(new Set());
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [studentContext, setStudentContext] = useState<StudentContextData | null>(null);

  useEffect(() => {
    // Fetch student context on mount
    async function fetchContext() {
      try {
        const student = await getStudentById(studentId);
        if (!student) return;

        const lessons = await getLessonsByStudent(studentId);
        const lastThree = lessons.slice(0, 3);

        const avgEngagement = lastThree.length > 0
          ? lastThree.reduce((sum, l) => sum + l.engagement, 0) / lastThree.length
          : 2;
        const avgUnderstanding = lastThree.length > 0
          ? lastThree.reduce((sum, l) => sum + l.understanding, 0) / lastThree.length
          : 2;

        setStudentContext({
          name: student.name,
          subject: student.subject,
          level: student.level,
          learningStyle: student.learningStyle,
          interests: student.interests,
          goals: student.goals,
          avgEngagement,
          avgUnderstanding,
          emotionalState: lastThree[0]?.emotionalTag || 'neutral',
          recentTopics: lastThree.map(l => l.topic)
        });
      } catch (error) {
        console.error('Error fetching student context:', error);
      }
    }
    fetchContext();
  }, [studentId]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await generatePersonalizedQuestions(
        studentId, 
        currentTopic, 
        difficulty,
        studentContext || undefined
      );
      setQuestions(response.questions);
      setShowAnswers(new Set());
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (index: number) => {
    const newShowAnswers = new Set(showAnswers);
    if (newShowAnswers.has(index)) {
      newShowAnswers.delete(index);
    } else {
      newShowAnswers.add(index);
    }
    setShowAnswers(newShowAnswers);
  };

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">🤖 AI-Generated Questions</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="input-field"
            style={{ width: 'auto', padding: '0.5rem' }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading || !currentTopic}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? '⏳ Generating...' : '✨ Generate Questions'}
          </button>
        </div>
      </div>

      {!currentTopic && (
        <div className="empty-state">
          <p>Enter a topic above to generate personalized questions</p>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, index) => (
            <div
              key={index}
              className="card"
              style={{
                background: selectedQuestion === index ? 'rgba(0, 168, 255, 0.1)' : 'var(--color-bg-input)',
                border: selectedQuestion === index ? '2px solid #00a8ff' : '1px solid var(--color-border)',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedQuestion(index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-info">Q{index + 1}</span>
                    <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{q.question}</h3>
                  </div>

                  {/* Interest Link */}
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.5rem', 
                    background: 'rgba(102, 126, 234, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ fontWeight: 600, color: '#667eea' }}>💡 Connection:</span>{' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>{q.interestLink}</span>
                  </div>

                  {/* Hint */}
                  <details style={{ marginTop: '0.75rem' }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      color: '#ffaa00', 
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    }}>
                      💭 Show Hint
                    </summary>
                    <p style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      background: 'rgba(255, 170, 0, 0.1)', 
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {q.hint}
                    </p>
                  </details>

                  {/* Answer Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAnswer(index);
                    }}
                    className="btn btn-secondary"
                    style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}
                  >
                    {showAnswers.has(index) ? '👁️ Hide Answer' : '✓ Show Answer'}
                  </button>

                  {/* Answer */}
                  {showAnswers.has(index) && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '1rem', 
                      background: 'rgba(0, 230, 138, 0.1)', 
                      border: '1px solid rgba(0, 230, 138, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#00e68a', 
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        ✓ Answer:
                      </div>
                      <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>{q.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'rgba(0, 230, 138, 0.05)', 
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)'
        }}>
          <strong>💡 Tip:</strong> These questions are personalized based on student&apos;s interests, learning style, and recent performance.
          Click on any question to focus on it, use hints for guidance, and reveal answers when ready.
        </div>
      )}
    </div>
  );
}
