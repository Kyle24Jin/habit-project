import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { resolveInitialUsername, validateUsername } from '../utils/userValidation';

export const userService = {
  /**
   * 获取当前用户名称，优先读取本地缓存，其次是元数据或 email 前缀
   */
  getUsername(user: User | null): string {
    if (!user) return '习惯达人';

    try {
      const local = localStorage.getItem(`habit_username_${user.id}`);
      if (local && local.trim()) {
        return local.trim();
      }
    } catch {}

    return resolveInitialUsername(user);
  },

  /**
   * 更新当前登录用户的用户名
   */
  async updateUsername(newUsername: string): Promise<string> {
    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      throw new Error(validation.error || '用户名格式不正确');
    }

    const trimmed = newUsername.trim();

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError || !user) {
      throw new Error('用户未登录或会话已过期');
    }

    // 缓存至本地
    try {
      localStorage.setItem(`habit_username_${user.id}`, trimmed);
    } catch {}

    // 同步更新至 Supabase Auth user_metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        username: trimmed,
      },
    });

    if (error) {
      console.error('更新用户名失败:', error);
      throw new Error(error.message || '更新用户名失败');
    }

    return data.user?.user_metadata?.username || trimmed;
  },
};
