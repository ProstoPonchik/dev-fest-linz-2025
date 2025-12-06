'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Modal from '@/components/Modal';
import AddStudentForm from '@/components/AddStudentForm';
import { useAuth } from '@/context/AuthContext';
import { getStudentsByTutor, getLessonsByStudent, getHomeworksByStudent, createStudent, updateStudent, deleteStudent, calculateStudentMetrics } from '@/lib/firestore';
import type { Student, StudentFormData, StudentMetrics } from '@/types';

interface StudentWithMetrics extends Student {
  metrics: StudentMetrics;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const studentsList = await getStudentsByTutor(user.uid);

      // Load metrics for each student
      const studentsWithMetrics: StudentWithMetrics[] = await Promise.all(
        studentsList.map(async (student) => {
          const [lessons, homeworks] = await Promise.all([
            getLessonsByStudent(student.id),
            getHomeworksByStudent(student.id),
          ]);
          const metrics = calculateStudentMetrics(lessons, homeworks);
          return { ...student, metrics };
        })
      );

      setStudents(studentsWithMetrics);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (data: StudentFormData) => {
    if (!user) return;

    try {
      await createStudent(user.uid, data);
      setIsModalOpen(false);
      await loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleEditStudent = async (data: StudentFormData) => {
    if (!editingStudent) return;

    try {
      await updateStudent(editingStudent.id, data);
      setIsEditModalOpen(false);
      setEditingStudent(null);
      await loadStudents();
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      await deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
      await loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const getRiskBadge = (isAtRisk: boolean) => {
    if (isAtRisk) {
      return <span className="badge badge-warning">At Risk</span>;
    }
    return <span className="badge badge-success">OK</span>;
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Students</h1>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Student
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : students.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <h3>No students yet</h3>
              <p>Add your first student to get started</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Subject</th>
                    <th>Avg Understanding</th>
                    <th>Homework On-Time</th>
                    <th>Status</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td 
                        style={{ fontWeight: 500, cursor: 'pointer' }}
                        onClick={() => router.push(`/students/${student.id}`)}
                      >
                        {student.name}
                      </td>
                      <td onClick={() => router.push(`/students/${student.id}`)} style={{ cursor: 'pointer' }}>
                        {student.subject}
                      </td>
                      <td onClick={() => router.push(`/students/${student.id}`)} style={{ cursor: 'pointer' }}>
                        {student.metrics.totalLessons > 0
                          ? `${student.metrics.avgUnderstanding.toFixed(1)} / 4`
                          : '-'}
                      </td>
                      <td onClick={() => router.push(`/students/${student.id}`)} style={{ cursor: 'pointer' }}>
                        {student.metrics.totalHomeworks > 0
                          ? `${student.metrics.homeworkOnTimePercent.toFixed(0)}%`
                          : '-'}
                      </td>
                      <td onClick={() => router.push(`/students/${student.id}`)} style={{ cursor: 'pointer' }}>
                        {getRiskBadge(student.metrics.isAtRisk)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(student);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                            title="Edit student"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToDelete(student);
                            }}
                            className="btn btn-danger"
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                            title="Delete student"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Student">
        <AddStudentForm onSubmit={handleAddStudent} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }} 
        title="Edit Student"
      >
        {editingStudent && (
          <AddStudentForm 
            onSubmit={handleEditStudent} 
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingStudent(null);
            }}
            initialData={{
              name: editingStudent.name,
              email: editingStudent.email,
              age: editingStudent.age,
              subject: editingStudent.subject,
              level: editingStudent.level,
              learningStyle: editingStudent.learningStyle,
              interests: editingStudent.interests.join(', '),
              goals: editingStudent.goals
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Delete Student"
      >
        <div>
          <p style={{ marginBottom: '1.5rem' }}>
            Are you sure you want to delete <strong>{studentToDelete?.name}</strong>?
          </p>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            This will also delete all lessons, homework, and transcriptions associated with this student. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setStudentToDelete(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStudent}
              className="btn btn-danger"
            >
              Delete Student
            </button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
