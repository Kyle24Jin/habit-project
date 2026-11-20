import React, { useState, useEffect } from 'react';
import { X, Check, User } from 'lucide-react';
import { validateUsername } from '../utils/userValidation';
import './EditUsernameModal.css';

interface EditUsernameModalProps {
  isOpen: boolean;
  currentUsername: string;
  email?: string;
  onClose: () => void;
  onSave: (newUsername: string) => Promise<void>;
}

export const EditUsernameModal: React.FC<EditUsernameModalProps> = ({
  isOpen,
  currentUsername,
  email,
  onClose,
  onSave,
}) => {
  const [username, setUsername] = useState(currentUsername);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername);
      setErrorMessage('');
    }
  }, [isOpen, currentUsername]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateUsername(username);
    if (!validation.valid) {
      setErrorMessage(validation.error || '用户名不合法');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSave(username.trim());
      onClose();
    } catch (err: any) {
      console.error('修改用户名失败:', err);
      setErrorMessage(err?.message || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarInitial = username.trim()
    ? username.trim().charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card edit-user-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">修改用户名</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        {/* 头像与账号信息预览 */}
        <div className="user-preview-section">
          <div className="user-preview-avatar">
            {avatarInitial ? <span>{avatarInitial}</span> : <User size={28} />}
          </div>
          <div className="user-preview-info">
            <span className="user-preview-tip">显示头像与昵称预览</span>
            {email && <span className="user-preview-email">绑定账号: {email}</span>}
          </div>
        </div>

        {errorMessage && (
          <div className="modal-error-alert" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <div className="label-with-counter">
              <label htmlFor="edit-username-input" className="form-label">
                用户名 / 昵称
              </label>
              <span className="char-counter">{username.trim().length} / 20</span>
            </div>
            <input
              id="edit-username-input"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="请输入新的用户名"
              maxLength={20}
              autoFocus
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !username.trim()}
            >
              <Check size={18} />
              <span>{isSubmitting ? '保存中...' : '保存修改'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
