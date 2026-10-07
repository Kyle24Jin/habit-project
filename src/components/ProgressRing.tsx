import React from 'react';
import './ProgressRing.css';

interface ProgressRingProps {
  percentage: number;
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  completed,
  total,
  size = 130,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-card">
      <div className="progress-ring-visual" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="progress-ring-svg">
          {/* 背景轨 */}
          <circle
            className="progress-ring-circle-bg"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* 进度轨 */}
          <circle
            className="progress-ring-circle-indicator"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="progress-ring-content">
          <span className="progress-ring-pct">{percentage}%</span>
          <span className="progress-ring-sub">今日进度</span>
        </div>
      </div>

      <div className="progress-ring-info">
        <div className="progress-status-title">
          {percentage === 100
            ? '太棒了！已全部完成 🎉'
            : percentage >= 50
            ? '进度过半，继续保持 💪'
            : '今天也要元气满满 🌟'}
        </div>
        <div className="progress-status-desc">
          已完成 <strong>{completed}</strong> 项，共 <strong>{total}</strong> 项习惯
        </div>
      </div>
    </div>
  );
};
