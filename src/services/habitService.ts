import { Habit, CheckInRecord, DayProgress, WeekStats, MonthStats, YearStats } from '../types/habit';
import { formatDate, getTodayString, getDayOfWeekName, getDaysInMonth, getRecentDays } from '../utils/date';

const STORAGE_KEY_HABITS = 'habit_tracker_habits_v1';
const STORAGE_KEY_RECORDS = 'habit_tracker_records_v1';

// 初始预设习惯
const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: '早起晨光 (07:00 前)',
    description: '唤醒身体，开启精力充沛的一天',
    icon: '☀️',
    color: '#FF9500',
    createdAt: new Date().toISOString(),
    frequency: 'daily',
  },
  {
    id: 'habit-2',
    name: '深阅读 30 分钟',
    description: '放下手机，沉浸式阅读书籍',
    icon: '📖',
    color: '#007AFF',
    createdAt: new Date().toISOString(),
    frequency: 'daily',
  },
  {
    id: 'habit-3',
    name: '每日饮水 2000ml',
    description: '充足水分，保持身体代谢通畅',
    icon: '💧',
    color: '#34C759',
    createdAt: new Date().toISOString(),
    frequency: 'daily',
  },
  {
    id: 'habit-4',
    name: '运动健身 45 分钟',
    description: '跑步、力量训练或瑜伽拉伸',
    icon: '🏃',
    color: '#FF2D55',
    createdAt: new Date().toISOString(),
    frequency: 'daily',
  },
  {
    id: 'habit-5',
    name: '晚间总结与冥想',
    description: '回顾今日收获，放松身心安睡',
    icon: '🌙',
    color: '#5856D6',
    createdAt: new Date().toISOString(),
    frequency: 'daily',
  },
];

// 生成一些近期的真实感模拟打卡历史（为了让初次打开时周/月/年统计有直观数据）
function generateInitialRecords(): CheckInRecord[] {
  const records: CheckInRecord[] = [];
  const habits = DEFAULT_HABITS;
  const today = new Date();

  // 模拟过去 60 天的数据
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);

    // 随机完成一部分习惯
    habits.forEach((h) => {
      // 70% 概率完成
      if (Math.random() < 0.72) {
        records.push({
          habitId: h.id,
          date: dateStr,
          completedAt: new Date(d.setHours(10, 0, 0)).toISOString(),
        });
      }
    });
  }

  return records;
}

class MockHabitService {
  private habits: Habit[] = [];
  private records: CheckInRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedHabits = localStorage.getItem(STORAGE_KEY_HABITS);
      if (storedHabits) {
        this.habits = JSON.parse(storedHabits);
      } else {
        this.habits = DEFAULT_HABITS;
        this.saveHabits();
      }

      const storedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (storedRecords) {
        this.records = JSON.parse(storedRecords);
      } else {
        this.records = generateInitialRecords();
        this.saveRecords();
      }
    } catch {
      this.habits = DEFAULT_HABITS;
      this.records = [];
    }
  }

  private saveHabits() {
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(this.habits));
  }

  private saveRecords() {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(this.records));
  }

  // 模拟轻微网络延时，保持真实接口手感
  private async delay(ms = 60): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }

  /**
   * 获取所有活跃习惯
   */
  async getHabits(): Promise<Habit[]> {
    await this.delay();
    return [...this.habits.filter((h) => !h.archived)];
  }

  /**
   * 添加新习惯
   */
  async createHabit(habitData: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> {
    await this.delay();
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.habits.push(newHabit);
    this.saveHabits();
    return newHabit;
  }

  /**
   * 删除习惯（软删除归档）
   */
  async deleteHabit(habitId: string): Promise<boolean> {
    await this.delay();
    const index = this.habits.findIndex((h) => h.id === habitId);
    if (index !== -1) {
      this.habits[index].archived = true;
      this.saveHabits();
      return true;
    }
    return false;
  }

  /**
   * 获取某天的打卡记录列表
   */
  async getRecordsByDate(dateStr: string): Promise<CheckInRecord[]> {
    await this.delay();
    return this.records.filter((r) => r.date === dateStr);
  }

  /**
   * 切换打卡状态（打卡 / 取消打卡）
   */
  async toggleCheckIn(habitId: string, dateStr: string = getTodayString()): Promise<{ completed: boolean }> {
    await this.delay(40);
    const existingIndex = this.records.findIndex((r) => r.habitId === habitId && r.date === dateStr);
    if (existingIndex !== -1) {
      // 取消打卡
      this.records.splice(existingIndex, 1);
      this.saveRecords();
      return { completed: false };
    } else {
      // 打卡
      this.records.push({
        habitId,
        date: dateStr,
        completedAt: new Date().toISOString(),
      });
      this.saveRecords();
      return { completed: true };
    }
  }

  /**
   * 获取某一天的打卡进度
   */
  async getDayProgress(dateStr: string = getTodayString()): Promise<DayProgress> {
    await this.delay();
    const activeHabits = this.habits.filter((h) => !h.archived);
    const dayRecords = this.records.filter((r) => r.date === dateStr);
    const total = activeHabits.length;
    const completed = dayRecords.length;
    const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    return {
      date: dateStr,
      total,
      completed,
      percentage,
    };
  }

  /**
   * 获取最近 7 天的统计
   */
  async getWeekStats(): Promise<WeekStats> {
    await this.delay();
    const recent7Dates = getRecentDays(7);
    const activeHabits = this.habits.filter((h) => !h.archived);
    const total = activeHabits.length;

    let totalRateSum = 0;
    const days = recent7Dates.map((dateStr) => {
      const dayRecords = this.records.filter((r) => r.date === dateStr);
      const count = dayRecords.length;
      const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
      totalRateSum += pct;
      return {
        date: dateStr,
        dayOfWeek: getDayOfWeekName(dateStr),
        completedCount: count,
        totalCount: total,
        percentage: pct,
      };
    });

    return {
      startDate: recent7Dates[0],
      endDate: recent7Dates[recent7Dates.length - 1],
      days,
      averageRate: Math.round(totalRateSum / 7),
    };
  }

  /**
   * 获取当月的打卡热力图统计
   */
  async getMonthStats(year: number = new Date().getFullYear(), month: number = new Date().getMonth() + 1): Promise<MonthStats> {
    await this.delay();
    const daysCount = getDaysInMonth(year, month);
    const activeHabits = this.habits.filter((h) => !h.archived);
    const total = activeHabits.length;

    const days = [];
    let totalCheckIns = 0;

    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = this.records.filter((r) => r.date === dateStr).length;
      totalCheckIns += count;

      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (pct > 0 && pct < 25) level = 1;
      else if (pct >= 25 && pct < 60) level = 2;
      else if (pct >= 60 && pct < 90) level = 3;
      else if (pct >= 90) level = 4;

      days.push({
        date: dateStr,
        day,
        percentage: pct,
        completedCount: count,
        level,
      });
    }

    const possibleTotal = daysCount * total;
    const completionRate = possibleTotal > 0 ? Math.round((totalCheckIns / possibleTotal) * 100) : 0;

    return {
      year,
      month,
      days,
      totalCheckIns,
      completionRate,
    };
  }

  /**
   * 获取年度全局统计与热力图 (最近 120 天以紧凑美观呈现)
   */
  async getYearStats(year: number = new Date().getFullYear()): Promise<YearStats> {
    await this.delay();
    // 取最近 120 天展示 GitHub 风格的热力图
    const dates = getRecentDays(120);
    const activeHabits = this.habits.filter((h) => !h.archived);
    const total = activeHabits.length;

    let totalCheckIns = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const heatmap = dates.map((dateStr) => {
      const count = this.records.filter((r) => r.date === dateStr).length;
      totalCheckIns += count;

      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      if (pct >= 50) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (pct > 0 && pct < 25) level = 1;
      else if (pct >= 25 && pct < 60) level = 2;
      else if (pct >= 60 && pct < 90) level = 3;
      else if (pct >= 90) level = 4;

      return {
        date: dateStr,
        count,
        level,
      };
    });

    // 计算当前连续打卡天数
    for (let i = dates.length - 1; i >= 0; i--) {
      const dateStr = dates[i];
      const count = this.records.filter((r) => r.date === dateStr).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      if (pct >= 50) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      year,
      totalCheckIns,
      heatmap,
      bestStreak,
      currentStreak,
    };
  }
}

export const habitService = new MockHabitService();
