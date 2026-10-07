import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddHabitModal.css';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; description: string; icon: string; color: string }) => void;
}

const EMOJI_OPTIONS = ['☀️', '📖', '💧', '🏃', '🌙', '🧘', '🍎', '✍️', '💪', '🎯'];
const COLOR_OPTIONS = ['#FF9500', '#007AFF', '#34C759', '#FF2D55', '#5856D6', '#AF52DE', '#FF3B30'];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('☀️');
  const [selectedColor, setSelectedColor] = useState('#007AFF');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">新建习惯</h3>
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
              {EMOJI_OPTIONS.map((emoji) => (
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
              {COLOR_OPTIONS.map((color) => (
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
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              确认创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
