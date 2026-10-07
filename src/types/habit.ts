export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string; // Emoji 或 图标名
  color: string; // 主题色 hex
  createdAt: string; // ISO 8601
  frequency: 'daily'; // 后续可拓展 'weekly' 等
  archived?: boolean;
}

export interface CheckInRecord {
  habitId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO 8601
}

export interface DayProgress {
  date: string; // YYYY-MM-DD
  total: number;
  completed: number;
  percentage: number;
}

export interface WeekStats {
  startDate: string;
  endDate: string;
  days: {
    date: string;
    dayOfWeek: string; // "周一", "Mon" 等
    completedCount: number;
    totalCount: number;
    percentage: number;
  }[];
  averageRate: number;
}

export interface MonthStats {
  year: number;
  month: number; // 1 - 12
  days: {
    date: string;
    day: number;
    percentage: number;
    completedCount: number;
    level: 0 | 1 | 2 | 3 | 4; // 用于热力图色块深浅
  }[];
  totalCheckIns: number;
  completionRate: number;
}

export interface YearStats {
  year: number;
  totalCheckIns: number;
  heatmap: {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }[];
  bestStreak: number;
  currentStreak: number;
}
