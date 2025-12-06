'use client';

import { useState, FormEvent } from 'react';
import { StudentFormData } from '@/types';

interface AddStudentFormProps {
  onSubmit: (data: StudentFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: StudentFormData;
}

export default function AddStudentForm({ onSubmit, onCancel, initialData }: AddStudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>(initialData || {
    name: '',
    email: '',
    age: 10,
    subject: '',
    level: '',
    goals: '',
    interests: '',
    learningStyle: 'examples',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name" className="form-label">Name *</label>
        <input
          type="text"
          id="name"
          className="form-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Student name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email * <span className="text-sm text-gray-500">(for Student Portal login)</span>
        </label>
        <input
          type="email"
          id="email"
          className="form-input"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="student@gmail.com"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          📧 Student will use this Google email to login to Student Portal
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="age" className="form-label">Age *</label>
        <input
          type="number"
          id="age"
          className="form-input"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
          min={5}
          max={100}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject" className="form-label">Subject *</label>
        <input
          type="text"
          id="subject"
          className="form-input"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g., Mathematics, English, Physics"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="level" className="form-label">Level *</label>
        <input
          type="text"
          id="level"
          className="form-input"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          placeholder="e.g., Beginner, Intermediate, Advanced"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="goals" className="form-label">Goals</label>
        <textarea
          id="goals"
          className="form-input"
          value={formData.goals}
          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
          placeholder="What does this student want to achieve?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="interests" className="form-label">Interests (comma-separated)</label>
        <input
          type="text"
          id="interests"
          className="form-input"
          value={formData.interests}
          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
          placeholder="e.g., gaming, soccer, music, drawing"
        />
      </div>

      <div className="form-group">
        <label htmlFor="learningStyle" className="form-label">Learning Style</label>
        <select
          id="learningStyle"
          className="form-input"
          value={formData.learningStyle}
          onChange={(e) => setFormData({ ...formData, learningStyle: e.target.value as StudentFormData['learningStyle'] })}
        >
          <option value="examples">Learning by Examples</option>
          <option value="practice">Practice-Based</option>
          <option value="discussion">Discussion-Based</option>
          <option value="visual">Visual Learning</option>
          <option value="reading">Reading/Writing</option>
        </select>
      </div>

      <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Student'}
        </button>
      </div>
    </form>
  );
}
