import { supabase } from './supabase';
import { Habit, CheckInRecord, DayProgress, WeekStats, MonthStats, YearStats } from '../types/habit';
import { getTodayString, getDayOfWeekName, getDaysInMonth, getRecentDays } from '../utils/date';
import { shouldInitDefaultHabits } from '../utils/habitInit';

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

function getLocalInitialized(userId: string): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage?.getItem(`habits_initialized_${userId}`) === 'true';
  } catch {
    return false;
  }
}

function setLocalInitialized(userId: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`habits_initialized_${userId}`, 'true');
    }
  } catch {}
}

class SupabaseHabitService {
  private initPromise: Promise<Habit[]> | null = null;

  /**
   * 初始化新用户的默认习惯
   */
  async initDefaultHabits(): Promise<Habit[]> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 标记本地已初始化，防止任何重复调用
      setLocalInitialized(user.id);

      // 更新 Supabase 用户元数据
      supabase.auth.updateUser({
        data: { habits_initialized: true },
      }).catch((err) => {
        console.warn('更新用户 habits_initialized 元数据失败:', err);
      });

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
    })();

    try {
      return await this.initPromise;
    } finally {
      this.initPromise = null;
    }
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

    // 如果未归档习惯为空，检查是否为全新用户
    if (!data || data.length === 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const localInitialized = getLocalInitialized(user.id);
      const userMetadataInitialized = !!user.user_metadata?.habits_initialized;

      // 如果已在本地缓存或元数据中标记过初始化，直接返回空习惯列表
      if (localInitialized || userMetadataInitialized) {
        return [];
      }

      // 检查数据库中是否存在历史记录（包括已归档/删除的习惯）
      const { count, error: countError } = await supabase
        .from('habits')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        console.error('检查习惯总数失败:', countError);
        return [];
      }

      const totalHabitsCount = count ?? 0;

      const shouldInit = shouldInitDefaultHabits({
        unarchivedCount: 0,
        totalHabitsCount,
        localInitialized,
        userMetadataInitialized,
      });

      if (!shouldInit) {
        setLocalInitialized(user.id);
        return [];
      }

      return this.initDefaultHabits();
    }

    // 当前有未归档习惯，确保本地标记为已初始化
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLocalInitialized(user.id);
      }
    } catch {}

    return data.map(this.mapDbHabit);
  }

  /**
   * 添加新习惯
   */
  async createHabit(habitData: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    setLocalInitialized(user.id);

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
   * 更新习惯信息（名称、备注、图标、主题色等）
   */
  async updateHabit(
    habitId: string,
    updates: Partial<Pick<Habit, 'name' | 'description' | 'icon' | 'color' | 'frequency'>>
  ): Promise<Habit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const updatePayload: Record<string, any> = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.icon !== undefined) updatePayload.icon = updates.icon;
    if (updates.color !== undefined) updatePayload.color = updates.color;
    if (updates.frequency !== undefined) updatePayload.frequency = updates.frequency;

    const { data, error } = await supabase
      .from('habits')
      .update(updatePayload)
      .eq('id', habitId)
      .select()
      .single();

    if (error || !data) {
      console.error('更新习惯失败:', error);
      throw new Error(error?.message || '更新习惯失败');
    }

    return this.mapDbHabit(data);
  }

  /**
   * 软删除（归档）习惯
   */
  async deleteHabit(habitId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setLocalInitialized(user.id);
    }

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

    const activeHabitIds = new Set(habits.map((h) => h.id));
    const activeRecords = records.filter((r) => activeHabitIds.has(r.habitId));

    const total = habits.length;
    const completed = activeRecords.length;
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
