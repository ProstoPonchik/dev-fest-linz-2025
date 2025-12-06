'use client';

import { useState, FormEvent } from 'react';
import { HomeworkFormData } from '@/types';

interface AddHomeworkFormProps {
  onSubmit: (data: HomeworkFormData) => Promise<void>;
  onCancel: () => void;
}

export default function AddHomeworkForm({ onSubmit, onCancel }: AddHomeworkFormProps) {
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  const [formData, setFormData] = useState<HomeworkFormData>({
    assignedAt: formatDate(now),
    dueAt: formatDate(oneWeekLater),
    submittedAt: '',
    status: 'on_time',
    grade: 0,
    notes: '',
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="assignedAt" className="form-label">Assigned Date *</label>
          <input
            type="date"
            id="assignedAt"
            className="form-input"
            value={formData.assignedAt}
            onChange={(e) => setFormData({ ...formData, assignedAt: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dueAt" className="form-label">Due Date *</label>
          <input
            type="date"
            id="dueAt"
            className="form-input"
            value={formData.dueAt}
            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="submittedAt" className="form-label">Submitted Date (if submitted)</label>
        <input
          type="date"
          id="submittedAt"
          className="form-input"
          value={formData.submittedAt}
          onChange={(e) => setFormData({ ...formData, submittedAt: e.target.value })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="status" className="form-label">Status *</label>
          <select
            id="status"
            className="form-input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as HomeworkFormData['status'] })}
          >
            <option value="on_time">On Time</option>
            <option value="late">Late</option>
            <option value="missing">Missing</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="grade" className="form-label">Grade (0-100) *</label>
          <input
            type="number"
            id="grade"
            className="form-input"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) || 0 })}
            min={0}
            max={100}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes" className="form-label">Notes</label>
        <textarea
          id="notes"
          className="form-input"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any comments about this homework assignment..."
        />
      </div>

      <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Homework'}
        </button>
      </div>
    </form>
  );
}
