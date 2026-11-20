export interface UserLike {
  user_metadata?: {
    username?: string;
    display_name?: string;
    [key: string]: any;
  };
  email?: string;
}

/**
 * 校验用户名合法性
 */
export function validateUsername(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: '用户名不能为空' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: '用户名长度不能超过 20 个字符' };
  }
  return { valid: true };
}

/**
 * 解析用户默认或已保存的显示用户名
 */
export function resolveInitialUsername(user: UserLike | null): string {
  if (!user) return '习惯达人';

  const metaUsername = user.user_metadata?.username;
  if (metaUsername && typeof metaUsername === 'string' && metaUsername.trim()) {
    return metaUsername.trim();
  }

  const displayName = user.user_metadata?.display_name;
  if (displayName && typeof displayName === 'string' && displayName.trim()) {
    return displayName.trim();
  }

  if (user.email && typeof user.email === 'string') {
    const prefix = user.email.split('@')[0];
    if (prefix && prefix.trim()) {
      return prefix.trim();
    }
  }

  return '习惯达人';
}
