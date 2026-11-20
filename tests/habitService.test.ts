import test from 'node:test';
import assert from 'node:assert/strict';

// Test mapping and payload generation logic for habit update
interface HabitUpdatePayload {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency?: 'daily';
}

function buildUpdatePayload(updates: HabitUpdatePayload) {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.frequency !== undefined) payload.frequency = updates.frequency;
  return payload;
}

test('buildUpdatePayload constructs payload correctly when updating habit name', () => {
  const payload = buildUpdatePayload({
    name: '  早晨慢跑 5 公里  ',
    description: '保持晨练',
    icon: '🏃',
    color: '#FF2D55',
  });

  assert.deepStrictEqual(payload, {
    name: '早晨慢跑 5 公里',
    description: '保持晨练',
    icon: '🏃',
    color: '#FF2D55',
  });
});

test('buildUpdatePayload handles partial name updates', () => {
  const payload = buildUpdatePayload({
    name: '新的习惯名称',
  });

  assert.deepStrictEqual(payload, {
    name: '新的习惯名称',
  });
  assert.strictEqual(payload.description, undefined);
  assert.strictEqual(payload.icon, undefined);
  assert.strictEqual(payload.color, undefined);
});

test('Habit name validation prevents empty or whitespace-only name', () => {
  const validateName = (name: string): boolean => {
    return name.trim().length > 0;
  };

  assert.strictEqual(validateName(''), false);
  assert.strictEqual(validateName('   '), false);
  assert.strictEqual(validateName('读书 30 分钟'), true);
});

test('Habit state update correctly modifies habit in collection', () => {
  const initialHabits = [
    {
      id: 'habit-1',
      name: '原习惯名',
      description: '原描述',
      icon: '☀️',
      color: '#FF9500',
      frequency: 'daily' as const,
      createdAt: '2026-10-25T00:00:00.000Z',
    },
    {
      id: 'habit-2',
      name: '另一习惯',
      description: '',
      icon: '💧',
      color: '#007AFF',
      frequency: 'daily' as const,
      createdAt: '2026-10-25T00:00:00.000Z',
    },
  ];

  const updatedHabitData = {
    name: '修改后的习惯名',
    description: '新描述',
    icon: '📖',
    color: '#34C759',
  };

  const updatedHabits = initialHabits.map((h) =>
    h.id === 'habit-1' ? { ...h, ...updatedHabitData } : h
  );

  assert.strictEqual(updatedHabits[0].name, '修改后的习惯名');
  assert.strictEqual(updatedHabits[0].description, '新描述');
  assert.strictEqual(updatedHabits[0].icon, '📖');
  assert.strictEqual(updatedHabits[0].color, '#34C759');
  assert.strictEqual(updatedHabits[1].name, '另一习惯');
});

// Import shouldInitDefaultHabits from habitInit utility
import { shouldInitDefaultHabits } from '../src/utils/habitInit.ts';

test('shouldInitDefaultHabits allows initialization only for genuine new users', () => {
  // Brand new user: 0 active habits, 0 total in DB, no flags
  const isNewUser = shouldInitDefaultHabits({
    unarchivedCount: 0,
    totalHabitsCount: 0,
    localInitialized: false,
    userMetadataInitialized: false,
  });
  assert.strictEqual(isNewUser, true);
});

test('shouldInitDefaultHabits blocks initialization when user has active habits', () => {
  const result = shouldInitDefaultHabits({
    unarchivedCount: 5,
    totalHabitsCount: 5,
    localInitialized: true,
    userMetadataInitialized: true,
  });
  assert.strictEqual(result, false);
});

test('shouldInitDefaultHabits blocks re-initialization when user deletes all habits (bugfix scenario)', () => {
  // When user deletes all 5 default habits: unarchived is 0, but DB has 5 archived habits
  const resultWithFlags = shouldInitDefaultHabits({
    unarchivedCount: 0,
    totalHabitsCount: 5,
    localInitialized: true,
    userMetadataInitialized: true,
  });
  assert.strictEqual(resultWithFlags, false);

  // Even if localStorage was cleared on this device:
  const resultStorageCleared = shouldInitDefaultHabits({
    unarchivedCount: 0,
    totalHabitsCount: 5,
    localInitialized: false,
    userMetadataInitialized: true,
  });
  assert.strictEqual(resultStorageCleared, false);

  // Even on a brand new browser / incognito where both local and metadata flags are false:
  // DB record count > 0 protects from resurrecting default habits
  const resultIncognito = shouldInitDefaultHabits({
    unarchivedCount: 0,
    totalHabitsCount: 5,
    localInitialized: false,
    userMetadataInitialized: false,
  });
  assert.strictEqual(resultIncognito, false);
});

test('shouldInitDefaultHabits blocks initialization when user created and deleted custom habits', () => {
  const result = shouldInitDefaultHabits({
    unarchivedCount: 0,
    totalHabitsCount: 1,
    localInitialized: false,
    userMetadataInitialized: false,
  });
  assert.strictEqual(result, false);
});

test('Deleting habits properly removes items and handles deleting all habits', () => {
  let habits = [
    { id: 'h1', name: '习惯 1' },
    { id: 'h2', name: '习惯 2' },
  ];

  // Delete h1
  habits = habits.filter((h) => h.id !== 'h1');
  assert.strictEqual(habits.length, 1);
  assert.strictEqual(habits[0].id, 'h2');

  // Delete remaining h2 -> empty habit list
  habits = habits.filter((h) => h.id !== 'h2');
  assert.strictEqual(habits.length, 0);
  assert.deepStrictEqual(habits, []);
});

test('Day progress calculation ignores lingering records of archived/deleted habits', () => {
  const activeHabits: { id: string; name: string }[] = [];
  const records = [
    { habitId: 'archived-habit-1', date: '2026-11-20', completedAt: '2026-11-20T10:00:00Z' },
  ];

  const activeHabitIds = new Set(activeHabits.map((h) => h.id));
  const activeRecords = records.filter((r) => activeHabitIds.has(r.habitId));

  const total = activeHabits.length;
  const completed = activeRecords.length;
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  assert.strictEqual(total, 0);
  assert.strictEqual(completed, 0);
  assert.strictEqual(percentage, 0);
});

// Import user validation and resolution functions
import { validateUsername, resolveInitialUsername } from '../src/utils/userValidation.ts';

test('validateUsername validates empty and whitespace usernames', () => {
  assert.deepStrictEqual(validateUsername(''), { valid: false, error: '用户名不能为空' });
  assert.deepStrictEqual(validateUsername('   '), { valid: false, error: '用户名不能为空' });
});

test('validateUsername validates length limits (max 20 characters)', () => {
  const exact20 = 'a'.repeat(20);
  const over20 = 'a'.repeat(21);
  assert.deepStrictEqual(validateUsername(exact20), { valid: true });
  assert.deepStrictEqual(validateUsername(over20), { valid: false, error: '用户名长度不能超过 20 个字符' });
});

test('validateUsername accepts normal usernames', () => {
  assert.deepStrictEqual(validateUsername('Kyle Jin'), { valid: true });
  assert.deepStrictEqual(validateUsername('自律挑战者'), { valid: true });
  assert.deepStrictEqual(validateUsername('  晨跑达人  '), { valid: true });
});

test('resolveInitialUsername resolves username with correct priority', () => {
  // 1. null user fallback
  assert.strictEqual(resolveInitialUsername(null), '习惯达人');

  // 2. Email prefix fallback
  assert.strictEqual(
    resolveInitialUsername({ email: 'developer@example.com' }),
    'developer'
  );

  // 3. display_name priority over email
  assert.strictEqual(
    resolveInitialUsername({
      email: 'user@example.com',
      user_metadata: { display_name: '晨光行者' },
    }),
    '晨光行者'
  );

  // 4. username highest priority
  assert.strictEqual(
    resolveInitialUsername({
      email: 'user@example.com',
      user_metadata: { username: 'Kyle', display_name: '其他名称' },
    }),
    'Kyle'
  );
});


