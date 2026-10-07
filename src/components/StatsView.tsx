import React, { useState, useEffect } from 'react';
import { WeekStats, MonthStats, YearStats } from '../types/habit';
import { habitService } from '../services/habitService';
import { Flame, Award } from 'lucide-react';
import './StatsView.css';

type Dimension = 'week' | 'month' | 'year';

export const StatsView: React.FC = () => {
  const [dimension, setDimension] = useState<Dimension>('week');
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [yearStats, setYearStats] = useState<YearStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    const [w, m, y] = await Promise.all([
      habitService.getWeekStats(),
      habitService.getMonthStats(),
      habitService.getYearStats(),
    ]);
    setWeekStats(w);
    setMonthStats(m);
    setYearStats(y);
    setLoading(false);
  };

  if (loading && !weekStats) {
    return <div className="stats-loading">加载统计数据中...</div>;
  }

  return (
    <div className="stats-container">
      {/* 顶部指标摘要卡片 */}
      <div className="metrics-summary-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap streak">
            <Flame size={20} color="#FF9500" />
          </div>
          <div className="metric-data">
            <span className="metric-value">{yearStats?.currentStreak || 0} 天</span>
            <span className="metric-label">当前连续打卡</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap best">
            <Award size={20} color="#34C759" />
          </div>
          <div className="metric-data">
            <span className="metric-value">{yearStats?.bestStreak || 0} 天</span>
            <span className="metric-label">历史最佳连击</span>
          </div>
        </div>
      </div>

      {/* 维度切换 Segments */}
      <div className="dimension-selector">
        <button
          className={`seg-btn ${dimension === 'week' ? 'active' : ''}`}
          onClick={() => setDimension('week')}
        >
          周统计
        </button>
        <button
          className={`seg-btn ${dimension === 'month' ? 'active' : ''}`}
          onClick={() => setDimension('month')}
        >
          月度热力
        </button>
        <button
          className={`seg-btn ${dimension === 'year' ? 'active' : ''}`}
          onClick={() => setDimension('year')}
        >
          年度全景
        </button>
      </div>

      {/* 1. 周统计视图 */}
      {dimension === 'week' && weekStats && (
        <div className="stats-section-card">
          <div className="section-header">
            <h4 className="section-title">近 7 天打卡趋势</h4>
            <span className="section-badge">均完成率 {weekStats.averageRate}%</span>
          </div>
          <div className="week-bars-container">
            {weekStats.days.map((day) => (
              <div key={day.date} className="bar-column">
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ height: `${Math.max(day.percentage, 6)}%` }}
                  >
                    <span className="bar-tooltip">{day.completedCount}项</span>
                  </div>
                </div>
                <span className="bar-label">{day.dayOfWeek}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. 月度打卡热力图 */}
      {dimension === 'month' && monthStats && (
        <div className="stats-section-card">
          <div className="section-header">
            <h4 className="section-title">
              {monthStats.year}年 {monthStats.month}月打卡日历
            </h4>
            <span className="section-badge">月达成率 {monthStats.completionRate}%</span>
          </div>
          <div className="month-grid">
            {monthStats.days.map((day) => (
              <div
                key={day.date}
                className={`month-cell level-${day.level}`}
                title={`${day.date}: 完成 ${day.completedCount} 项 (${day.percentage}%)`}
              >
                <span className="cell-day-num">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span className="legend-text">较少</span>
            <div className="legend-cell level-0"></div>
            <div className="legend-cell level-1"></div>
            <div className="legend-cell level-2"></div>
            <div className="legend-cell level-3"></div>
            <div className="legend-cell level-4"></div>
            <span className="legend-text">完美</span>
          </div>
        </div>
      )}

      {/* 3. 年度全局热力矩阵 */}
      {dimension === 'year' && yearStats && (
        <div className="stats-section-card">
          <div className="section-header">
            <h4 className="section-title">近 120 天全景热力图</h4>
            <span className="section-badge">累计 {yearStats.totalCheckIns} 次</span>
          </div>
          <div className="year-matrix">
            {yearStats.heatmap.map((item) => (
              <div
                key={item.date}
                className={`matrix-cell level-${item.level}`}
                title={`${item.date}: 完成 ${item.count} 项`}
              />
            ))}
          </div>
          <div className="heatmap-legend" style={{ marginTop: '16px' }}>
            <span className="legend-text">少</span>
            <div className="legend-cell level-0"></div>
            <div className="legend-cell level-1"></div>
            <div className="legend-cell level-2"></div>
            <div className="legend-cell level-3"></div>
            <div className="legend-cell level-4"></div>
            <span className="legend-text">多</span>
          </div>
        </div>
      )}
    </div>
  );
};
