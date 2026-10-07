import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Habit } from '../types/habit';
import './HabitItem.css';

interface HabitItemProps {
  habit: Habit;
  completed: boolean;
  onToggle: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  completed,
  onToggle,
  onDelete,
}) => {
  return (
    <div className={`habit-item ${completed ? 'completed' : ''}`}>
      <div className="habit-item-left">
        <div
          className="habit-icon-badge"
          style={{
            backgroundColor: `${habit.color}15`,
            color: habit.color,
          }}
        >
          <span>{habit.icon}</span>
        </div>
        <div className="habit-info">
          <div className="habit-name">{habit.name}</div>
          {habit.description && (
            <div className="habit-desc">{habit.description}</div>
          )}
        </div>
      </div>

      <div className="habit-item-actions">
        {onDelete && (
          <button
            type="button"
            className="habit-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`确定要删除“${habit.name}”习惯吗？`)) {
                onDelete(habit.id);
              }
            }}
            aria-label="删除习惯"
            title="删除习惯"
          >
            <Trash2 size={16} />
          </button>
        )}

        <button
          type="button"
          className={`habit-check-btn ${completed ? 'checked' : ''}`}
          style={{
            backgroundColor: completed ? habit.color : 'transparent',
            borderColor: completed ? habit.color : '#C7C7CC',
          }}
          onClick={() => onToggle(habit.id)}
          aria-label={completed ? '取消打卡' : '完成打卡'}
        >
          {completed && <Check size={18} strokeWidth={3} color="#FFFFFF" />}
        </button>
      </div>
    </div>
  );
};
