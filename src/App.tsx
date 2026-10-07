import { useState, useEffect } from 'react';
import { Habit, CheckInRecord, DayProgress } from './types/habit';
import { habitService } from './services/habitService';
import { getTodayString, getDayOfWeekName } from './utils/date';
import { ProgressRing } from './components/ProgressRing';
import { HabitItem } from './components/HabitItem';
import { StatsView } from './components/StatsView';
import { AddHabitModal } from './components/AddHabitModal';
import { CheckCircle2, BarChart3, Plus, Sparkles } from 'lucide-react';
import './App.css';

export function App() {
  const [currentTab, setCurrentTab] = useState<'today' | 'stats'>('today');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayRecords, setTodayRecords] = useState<CheckInRecord[]>([]);
  const [progress, setProgress] = useState<DayProgress>({
    date: getTodayString(),
    total: 0,
    completed: 0,
    percentage: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayStr = getTodayString();
  const dayOfWeek = getDayOfWeekName(todayStr);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedHabits, records, dayProg] = await Promise.all([
      habitService.getHabits(),
      habitService.getRecordsByDate(todayStr),
      habitService.getDayProgress(todayStr),
    ]);
    setHabits(fetchedHabits);
    setTodayRecords(records);
    setProgress(dayProg);
    setLoading(false);
  };

  const handleToggleHabit = async (habitId: string) => {
    await habitService.toggleCheckIn(habitId, todayStr);
    // 快速刷新今日记录和进度
    const [records, dayProg] = await Promise.all([
      habitService.getRecordsByDate(todayStr),
      habitService.getDayProgress(todayStr),
    ]);
    setTodayRecords(records);
    setProgress(dayProg);
  };

  const handleAddHabit = async (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
  }) => {
    await habitService.createHabit({
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      frequency: 'daily',
    });
    await loadData();
  };

  const isHabitCompletedToday = (habitId: string) => {
    return todayRecords.some((r) => r.habitId === habitId);
  };

  return (
    <div className="app-shell">
      {/* 顶部标题栏 */}
      <header className="app-header">
        <div className="header-text-group">
          <span className="header-subtitle">{todayStr} · {dayOfWeek}</span>
          <h1 className="header-title">
            {currentTab === 'today' ? '今日习惯' : '统计与趋势'}
          </h1>
        </div>

        {currentTab === 'today' && (
          <button
            className="add-habit-trigger"
            onClick={() => setIsAddModalOpen(true)}
            aria-label="添加新习惯"
          >
            <Plus size={20} color="#007AFF" />
            <span>新习惯</span>
          </button>
        )}
      </header>

      {/* 主体内容滚动区 */}
      <main className="app-content">
        {currentTab === 'today' ? (
          <div className="today-view">
            {/* 今日完成度环形指示器 */}
            <ProgressRing
              percentage={progress.percentage}
              completed={progress.completed}
              total={progress.total}
            />

            {/* 习惯列表 */}
            <div className="section-title-wrap">
              <span className="section-title-text">我的习惯清单</span>
              <span className="section-count-tag">{habits.length} 项</span>
            </div>

            {loading ? (
              <div className="loading-state">正在同步习惯...</div>
            ) : habits.length === 0 ? (
              <div className="empty-state">
                <Sparkles size={36} color="#8E8E93" />
                <p>还没有添加任何习惯，点击右上角开启第一个习惯吧！</p>
              </div>
            ) : (
              <div className="habits-list">
                {habits.map((habit) => (
                  <HabitItem
                    key={habit.id}
                    habit={habit}
                    completed={isHabitCompletedToday(habit.id)}
                    onToggle={handleToggleHabit}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <StatsView />
        )}
      </main>

      {/* 底部 TabBar 导航 */}
      <nav className="tab-bar">
        <button
          className={`tab-item ${currentTab === 'today' ? 'active' : ''}`}
          onClick={() => setCurrentTab('today')}
        >
          <CheckCircle2 size={22} />
          <span className="tab-label">今日打卡</span>
        </button>

        <button
          className={`tab-item ${currentTab === 'stats' ? 'active' : ''}`}
          onClick={() => setCurrentTab('stats')}
        >
          <BarChart3 size={22} />
          <span className="tab-label">数据统计</span>
        </button>
      </nav>

      {/* 新增习惯弹窗 */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddHabit}
      />
    </div>
  );
}

export default App;
