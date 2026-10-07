import { supabase } from './supabase';
import { Habit, CheckInRecord, DayProgress, WeekStats, MonthStats, YearStats } from '../types/habit';
import { getTodayString, getDayOfWeekName, getDaysInMonth, getRecentDays } from '../utils/date';

const DEFAULT_HABITS = [
  {
    name: '早起晨光 (07:00 前)',
    description: '唤醒身体，开启精力充沛的一天',
    icon: '☀️',
    color: '#FF9500',
    frequency: 'daily' as const,
  },
  {
    name: '深阅读 30 分钟',
    description: '放下手机，沉浸式阅读书籍',
    icon: '📖',
    color: '#007AFF',
    frequency: 'daily' as const,
  },
  {
    name: '每日饮水 2000ml',
    description: '充足水分，保持身体代谢通畅',
    icon: '💧',
    color: '#34C759',
    frequency: 'daily' as const,
  },
  {
    name: '运动健身 45 分钟',
    description: '跑步、力量训练或瑜伽拉伸',
    icon: '🏃',
    color: '#FF2D55',
    frequency: 'daily' as const,
  },
  {
    name: '晚间总结与冥想',
    description: '回顾今日收获，放松身心安睡',
    icon: '🌙',
    color: '#5856D6',
    frequency: 'daily' as const,
  },
];

class SupabaseHabitService {
  /**
   * 初始化新用户的默认习惯
   */
  async initDefaultHabits(): Promise<Habit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const inserts = DEFAULT_HABITS.map((h) => ({
      ...h,
      user_id: user.id,
      archived: false,
    }));

    const { data, error } = await supabase.from('habits').insert(inserts).select();
    if (error || !data) {
      console.error('初始化默认习惯失败:', error);
      return [];
    }

    return data.map(this.mapDbHabit);
  }

  private mapDbHabit(row: any): Habit {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      icon: row.icon || '☀️',
      color: row.color || '#007AFF',
      frequency: row.frequency || 'daily',
      archived: row.archived,
      createdAt: row.created_at,
    };
  }

  private mapDbRecord(row: any): CheckInRecord {
    return {
      habitId: row.habit_id,
      date: row.date,
      completedAt: row.completed_at,
    };
  }

  /**
   * 获取当前用户所有未归档习惯
   */
  async getHabits(): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取习惯列表失败:', error);
      return [];
    }

    // 如果新用户没有任何习惯，自动创建默认习惯
    if (!data || data.length === 0) {
      return this.initDefaultHabits();
    }

    return data.map(this.mapDbHabit);
  }

  /**
   * 添加新习惯
   */
  async createHabit(habitData: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('habits')
      .insert({
        name: habitData.name,
        description: habitData.description,
        icon: habitData.icon,
        color: habitData.color,
        frequency: habitData.frequency,
        user_id: user.id,
        archived: false,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || '创建习惯失败');
    }

    return this.mapDbHabit(data);
  }

  /**
   * 软删除（归档）习惯
   */
  async deleteHabit(habitId: string): Promise<boolean> {
    const { error } = await supabase
      .from('habits')
      .update({ archived: true })
      .eq('id', habitId);

    if (error) {
      console.error('删除习惯失败:', error);
      return false;
    }
    return true;
  }

  /**
   * 获取某天的打卡记录列表
   */
  async getRecordsByDate(dateStr: string): Promise<CheckInRecord[]> {
    const { data, error } = await supabase
      .from('check_in_records')
      .select('*')
      .eq('date', dateStr);

    if (error || !data) return [];
    return data.map(this.mapDbRecord);
  }

  /**
   * 切换打卡状态（打卡 / 取消打卡）
   */
  async toggleCheckIn(habitId: string, dateStr: string = getTodayString()): Promise<{ completed: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    // 检查是否已有打卡记录
    const { data: existing } = await supabase
      .from('check_in_records')
      .select('id')
      .eq('habit_id', habitId)
      .eq('date', dateStr)
      .maybeSingle();

    if (existing) {
      // 取消打卡
      await supabase.from('check_in_records').delete().eq('id', existing.id);
      return { completed: false };
    } else {
      // 打卡
      await supabase.from('check_in_records').insert({
        habit_id: habitId,
        date: dateStr,
        user_id: user.id,
      });
      return { completed: true };
    }
  }

  /**
   * 获取某一天的打卡进度
   */
  async getDayProgress(dateStr: string = getTodayString()): Promise<DayProgress> {
    const [habits, records] = await Promise.all([
      this.getHabits(),
      this.getRecordsByDate(dateStr),
    ]);

    const total = habits.length;
    const completed = records.length;
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
    const recent7Dates = getRecentDays(7);
    const startDate = recent7Dates[0];
    const endDate = recent7Dates[recent7Dates.length - 1];

    const [habits, { data: records }] = await Promise.all([
      this.getHabits(),
      supabase
        .from('check_in_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate),
    ]);

    const total = habits.length;
    const allRecords = (records || []).map(this.mapDbRecord);

    let totalRateSum = 0;
    const days = recent7Dates.map((dateStr) => {
      const count = allRecords.filter((r) => r.date === dateStr).length;
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
      startDate,
      endDate,
      days,
      averageRate: Math.round(totalRateSum / 7),
    };
  }

  /**
   * 获取当月的打卡热力图统计
   */
  async getMonthStats(year: number = new Date().getFullYear(), month: number = new Date().getMonth() + 1): Promise<MonthStats> {
    const daysCount = getDaysInMonth(year, month);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysCount).padStart(2, '0')}`;

    const [habits, { data: records }] = await Promise.all([
      this.getHabits(),
      supabase
        .from('check_in_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate),
    ]);

    const total = habits.length;
    const allRecords = (records || []).map(this.mapDbRecord);

    const days = [];
    let totalCheckIns = 0;

    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = allRecords.filter((r) => r.date === dateStr).length;
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
   * 获取年度全局统计与热力图 (最近 120 天)
   */
  async getYearStats(year: number = new Date().getFullYear()): Promise<YearStats> {
    const dates = getRecentDays(120);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const [habits, { data: records }] = await Promise.all([
      this.getHabits(),
      supabase
        .from('check_in_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate),
    ]);

    const total = habits.length;
    const allRecords = (records || []).map(this.mapDbRecord);

    let totalCheckIns = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const heatmap = dates.map((dateStr) => {
      const count = allRecords.filter((r) => r.date === dateStr).length;
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

    for (let i = dates.length - 1; i >= 0; i--) {
      const dateStr = dates[i];
      const count = allRecords.filter((r) => r.date === dateStr).length;
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

export const habitService = new SupabaseHabitService();
