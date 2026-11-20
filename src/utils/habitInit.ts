export interface ShouldInitHabitsParams {
  unarchivedCount: number;
  totalHabitsCount: number;
  localInitialized: boolean;
  userMetadataInitialized: boolean;
}

/**
 * 判断是否需要为用户初始化默认习惯
 * 
 * 规则：
 * 1. 如果当前已有未归档（活跃）习惯，无需初始化
 * 2. 如果本地缓存已标记为已初始化，无需初始化
 * 3. 如果用户元数据已标记为已初始化，无需初始化
 * 4. 如果数据库中存在任何习惯历史（包括已归档/已删除习惯），说明该用户不是全新用户，无需初始化
 * 5. 仅在确实没有任何习惯历史的全新用户首次登录时，才初始化默认习惯
 */
export function shouldInitDefaultHabits({
  unarchivedCount,
  totalHabitsCount,
  localInitialized,
  userMetadataInitialized,
}: ShouldInitHabitsParams): boolean {
  if (unarchivedCount > 0) return false;
  if (localInitialized) return false;
  if (userMetadataInitialized) return false;
  if (totalHabitsCount > 0) return false;
  return true;
}
