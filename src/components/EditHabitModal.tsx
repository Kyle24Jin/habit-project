import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Habit } from '../types/habit';
import './AddHabitModal.css';

interface EditHabitModalProps {
  isOpen: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSave: (
    habitId: string,
    data: { name: string; description: string; icon: string; color: string }
  ) => Promise<void> | void;
}

const EMOJI_OPTIONS = ['☀️', '📖', '💧', '🏃', '🌙', '🧘', '🍎', '✍️', '💪', '🎯'];
const COLOR_OPTIONS = ['#FF9500', '#007AFF', '#34C759', '#FF2D55', '#5856D6', '#AF52DE', '#FF3B30'];

export const EditHabitModal: React.FC<EditHabitModalProps> = ({
  isOpen,
  habit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('☀️');
  const [selectedColor, setSelectedColor] = useState('#007AFF');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name || '');
      setDescription(habit.description || '');
      setSelectedIcon(habit.icon || '☀️');
      setSelectedColor(habit.color || '#007AFF');
    }
  }, [habit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !habit) return null;

  const emojiList = habit.icon && !EMOJI_OPTIONS.includes(habit.icon)
    ? [habit.icon, ...EMOJI_OPTIONS]
    : EMOJI_OPTIONS;

  const colorList = habit.color && !COLOR_OPTIONS.includes(habit.color)
    ? [habit.color, ...COLOR_OPTIONS]
    : COLOR_OPTIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave(habit.id, {
        name: trimmedName,
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
      onClose();
    } catch (err: any) {
      console.error('保存习惯修改失败:', err);
      alert(err?.message || '保存修改失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">编辑习惯</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="关闭">
            <X size={20} color="#8E8E93" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">习惯名称</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：早起喝一杯温水"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">习惯备注 (可选)</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：唤醒肠胃与代谢"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="form-group">
            <label className="form-label">选择图标</label>
            <div className="emoji-picker">
              {emojiList.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  className={`emoji-btn ${selectedIcon === emoji ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">选择主题色</label>
            <div className="color-picker">
              {colorList.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
