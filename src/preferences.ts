import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCalendars } from 'expo-localization';

export type PaceId = 'gentle' | 'standard' | 'focused';
export type ReminderId = 'morning' | 'afternoon' | 'evening' | 'custom' | 'none';
export type LanguageId = 'en' | 'ar' | 'fr' | 'es' | 'id' | 'tr';
export type AccountMode = 'guest';

export type Preferences = {
  onboardingComplete: boolean;
  language: LanguageId;
  pace: PaceId;
  reminder: ReminderId;
  customReminderTime: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  timezone: string;
  accountMode: AccountMode;
};

export type LearningProgress = {
  version: 2;
  activeDayIndex: number;
  completedLessonIds: string[];
  completedDayIds: string[];
  consideredPromptIds: string[];
  savedReviewIds: string[];
  reviewLaterIds: string[];
  conceptLastReviewedAt: Record<string, number>;
  activityByDate: Record<string, string[]>;
};

export const languageOptions = [
  { id: 'en', flag: '🇬🇧', name: 'English', nativeName: 'English', available: true },
  { id: 'ar', flag: '🇸🇦', name: 'Arabic', nativeName: 'العربية', available: false },
  { id: 'fr', flag: '🇫🇷', name: 'French', nativeName: 'Français', available: false },
  { id: 'es', flag: '🇪🇸', name: 'Spanish', nativeName: 'Español', available: false },
  { id: 'id', flag: '🇮🇩', name: 'Indonesian', nativeName: 'Bahasa Indonesia', available: false },
  { id: 'tr', flag: '🇹🇷', name: 'Turkish', nativeName: 'Türkçe', available: false },
] as const;

export const paceOptions = [
  { id: 'gentle', lessons: 1 },
  { id: 'standard', lessons: 3 },
  { id: 'focused', lessons: 6 },
] as const;

export const reminderOptions = [
  { id: 'morning' },
  { id: 'afternoon' },
  { id: 'evening' },
  { id: 'custom' },
  { id: 'none' },
] as const;

function detectTimeZone() {
  try {
    return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  }
}

export const defaultPreferences: Preferences = {
  onboardingComplete: false,
  language: 'en',
  pace: 'standard',
  reminder: 'morning',
  customReminderTime: '20:00',
  notificationsEnabled: true,
  soundEnabled: true,
  timezone: detectTimeZone(),
  accountMode: 'guest',
};

const storageKey = 'islam-simply.preferences.v1';
const progressStorageKey = 'islam-simply.progress.v2';
const legacyProgressStorageKey = 'islam-simply.progress.v1';

export const defaultLearningProgress: LearningProgress = {
  version: 2, activeDayIndex: 0, completedLessonIds: [], completedDayIds: [],
  consideredPromptIds: [], savedReviewIds: [], reviewLaterIds: [],
  conceptLastReviewedAt: {}, activityByDate: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLanguage(value: unknown): value is LanguageId {
  return typeof value === 'string' && languageOptions.some((option) => option.id === value && option.available);
}

function isPace(value: unknown): value is PaceId {
  return typeof value === 'string' && paceOptions.some((option) => option.id === value);
}

function isReminder(value: unknown): value is ReminderId {
  return typeof value === 'string' && reminderOptions.some((option) => option.id === value);
}

function isClockTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = value.match(/^(\d{2}):(\d{2})$/);
  return Boolean(match && Number(match[1]) <= 23 && Number(match[2]) <= 59);
}

export async function loadPreferences(): Promise<Preferences> {
  const stored = await AsyncStorage.getItem(storageKey);
  if (!stored) return defaultPreferences;

  try {
    const value: unknown = JSON.parse(stored);
    if (!isRecord(value)) return defaultPreferences;
    return {
      onboardingComplete: value.onboardingComplete === true,
      language: isLanguage(value.language) ? value.language : defaultPreferences.language,
      pace: isPace(value.pace) ? value.pace : defaultPreferences.pace,
      reminder: isReminder(value.reminder) ? value.reminder : defaultPreferences.reminder,
      customReminderTime: isClockTime(value.customReminderTime) ? value.customReminderTime : defaultPreferences.customReminderTime,
      notificationsEnabled: value.notificationsEnabled !== false && value.reminder !== 'none',
      soundEnabled: value.soundEnabled !== false,
      timezone: typeof value.timezone === 'string' && value.timezone.trim() ? value.timezone : defaultPreferences.timezone,
      accountMode: 'guest',
    };
  } catch {
    return defaultPreferences;
  }
}

export async function savePreferences(preferences: Preferences) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(preferences));
}

export async function loadLearningProgress(): Promise<unknown> {
  const stored = await AsyncStorage.getItem(progressStorageKey) ?? await AsyncStorage.getItem(legacyProgressStorageKey);
  // Parse/read errors must reach the retry screen, never overwrite a damaged save.
  return stored === null ? defaultLearningProgress : JSON.parse(stored);
}

let pendingProgressWrite: Promise<void> = Promise.resolve();
export function saveLearningProgress(progress: LearningProgress) {
  const serialized = JSON.stringify(progress);
  // Preserve action order even if a previous write failed or storage is slow.
  pendingProgressWrite = pendingProgressWrite.catch(() => undefined)
    .then(() => AsyncStorage.setItem(progressStorageKey, serialized));
  return pendingProgressWrite;
}
