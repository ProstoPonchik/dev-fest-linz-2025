'use client';

import { useState, FormEvent } from 'react';
import { LessonFormData } from '@/types';

interface AddLessonFormProps {
  onSubmit: (data: LessonFormData) => Promise<void>;
  onCancel: () => void;
}

export default function AddLessonForm({ onSubmit, onCancel }: AddLessonFormProps) {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<LessonFormData>({
    topic: '',
    startTime: formatDateTime(now),
    endTime: formatDateTime(oneHourLater),
    understanding: 3,
    engagement: 2,
    emotionalTag: 'engaged',
    notes: '',
    tags: '',
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
        <label htmlFor="topic" className="form-label">Topic *</label>
        <input
          type="text"
          id="topic"
          className="form-input"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="What was covered in this lesson?"
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="startTime" className="form-label">Start Time *</label>
          <input
            type="datetime-local"
            id="startTime"
            className="form-input"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime" className="form-label">End Time *</label>
          <input
            type="datetime-local"
            id="endTime"
            className="form-input"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="understanding" className="form-label">Understanding (1-4) *</label>
          <select
            id="understanding"
            className="form-input"
            value={formData.understanding}
            onChange={(e) => setFormData({ ...formData, understanding: parseInt(e.target.value) as 1 | 2 | 3 | 4 })}
          >
            <option value={1}>1 - Struggling</option>
            <option value={2}>2 - Needs Work</option>
            <option value={3}>3 - Good</option>
            <option value={4}>4 - Excellent</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="engagement" className="form-label">Engagement (1-3) *</label>
          <select
            id="engagement"
            className="form-input"
            value={formData.engagement}
            onChange={(e) => setFormData({ ...formData, engagement: parseInt(e.target.value) as 1 | 2 | 3 })}
          >
            <option value={1}>1 - Low</option>
            <option value={2}>2 - Medium</option>
            <option value={3}>3 - High</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="emotionalTag" className="form-label">Emotional State</label>
        <select
          id="emotionalTag"
          className="form-input"
          value={formData.emotionalTag}
          onChange={(e) => setFormData({ ...formData, emotionalTag: e.target.value as LessonFormData['emotionalTag'] })}
        >
          <option value="engaged">Engaged</option>
          <option value="bored">Bored</option>
          <option value="frustrated">Frustrated</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="notes" className="form-label">Notes</label>
        <textarea
          id="notes"
          className="form-input"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional observations about the lesson..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="tags" className="form-label">Tags (comma-separated)</label>
        <input
          type="text"
          id="tags"
          className="form-input"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="e.g., review, new-topic, homework-help"
        />
      </div>

      <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Lesson'}
        </button>
      </div>
    </form>
  );
}
