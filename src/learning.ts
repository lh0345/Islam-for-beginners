import type { Course, UnderstandingPrompt } from './locales/types';
import type { LearningProgress, PaceId } from './preferences';

export function localDateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function dailyProgress(activity: Record<string, string[]>, pace: PaceId, date = new Date()) {
  const target = pace === 'gentle' ? 1 : pace === 'focused' ? 8 : 4;
  const completed = Math.min(target, new Set(activity[localDateKey(date)] ?? []).size);
  return { completed, target, complete: completed >= target };
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const strings = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : [];

// v1 remains untouched on disk. Reading identities survive; old quiz mastery does
// not grant completion of newly authored prompts. Unknown/future data fails closed.
export function reconcileProgress(course: Course, raw: unknown): LearningProgress {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid progress');
  const stored = record(raw);
  if (stored.version !== undefined && stored.version !== 2) throw new Error('Unsupported progress version');
  const lessons = new Set(course.days.flatMap(day => day.lessons.map(lesson => lesson.id)));
  const days = new Set(course.days.map(day => day.id));
  const completedDayIds = strings(stored.completedDayIds).filter(id => days.has(id));
  const completedLessonIds = new Set(strings(stored.completedLessonIds).filter(id => lessons.has(id)));
  for (const day of course.days) {
    if (completedDayIds.includes(day.id)) day.lessons.forEach(lesson => completedLessonIds.add(lesson.id));
  }
  const eligiblePrompts = new Set(course.days.filter(day => day.lessons.every(lesson => completedLessonIds.has(lesson.id)))
    .flatMap(day => day.understanding.prompts.map(prompt => prompt.id)));
  const consideredPromptIds = stored.version === 2 ? strings(stored.consideredPromptIds).filter(id => eligiblePrompts.has(id)) : [];
  for (const day of course.days) {
    if (day.understanding.prompts.every(prompt => consideredPromptIds.includes(prompt.id)) && !completedDayIds.includes(day.id)) completedDayIds.push(day.id);
  }
  const firstIncomplete = course.days.findIndex(day => !completedDayIds.includes(day.id));
  const timestamps = Object.fromEntries(Object.entries(record(stored.conceptLastReviewedAt))
    .filter(([id, value]) => eligiblePrompts.has(id) && typeof value === 'number' && Number.isFinite(value) && value >= 0)) as Record<string, number>;
  const activityByDate: Record<string, string[]> = {};
  for (const [date, entries] of Object.entries(record(stored.activityByDate))) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) activityByDate[date] = strings(entries);
  }
  const savedReviewIds = strings(stored.savedReviewIds).filter(id => completedLessonIds.has(id));
  return {
    version: 2,
    activeDayIndex: firstIncomplete < 0 ? course.days.length - 1 : firstIncomplete,
    completedLessonIds: [...completedLessonIds], completedDayIds, consideredPromptIds,
    savedReviewIds,
    reviewLaterIds: strings(stored.reviewLaterIds).filter(id => completedLessonIds.has(id) && !savedReviewIds.includes(id)),
    conceptLastReviewedAt: timestamps, activityByDate,
  };
}

function withActivity(progress: LearningProgress, id: string): LearningProgress {
  const today = localDateKey();
  return { ...progress, activityByDate: { ...progress.activityByDate, [today]: [...new Set([...(progress.activityByDate[today] ?? []), id])] } };
}

export function nextLearningAction(course: Course, progress: LearningProgress) {
  const dayIndex = progress.activeDayIndex;
  const day = course.days[dayIndex];
  if (progress.completedDayIds.includes(day.id)) return { name: 'complete' as const, dayIndex };
  const lessonIndex = day.lessons.findIndex(lesson => !progress.completedLessonIds.includes(lesson.id));
  return lessonIndex >= 0
    ? { name: 'lesson' as const, dayIndex, lessonIndex }
    : { name: 'understanding' as const, dayIndex };
}

export function completeReading(course: Course, progress: LearningProgress, lessonId: string) {
  const day = course.days[progress.activeDayIndex];
  const next = day.lessons.find(lesson => !progress.completedLessonIds.includes(lesson.id));
  if (next?.id !== lessonId) return progress;
  return withActivity({ ...progress, completedLessonIds: [...progress.completedLessonIds, lessonId] }, lessonId);
}

export function remainingPrompts(course: Course, progress: LearningProgress) {
  const day = course.days[progress.activeDayIndex];
  if (!day.lessons.every(lesson => progress.completedLessonIds.includes(lesson.id))) return [];
  return day.understanding.prompts.filter(prompt => !progress.consideredPromptIds.includes(prompt.id));
}

export function completePrompt(course: Course, progress: LearningProgress, promptId: string): LearningProgress {
  const remaining = remainingPrompts(course, progress);
  if (remaining[0]?.id !== promptId) return progress;
  const day = course.days[progress.activeDayIndex];
  const consideredPromptIds = [...progress.consideredPromptIds, promptId];
  const finished = remaining.length === 1;
  const next = {
    ...progress, consideredPromptIds,
    completedDayIds: finished ? [...new Set([...progress.completedDayIds, day.id])] : progress.completedDayIds,
    conceptLastReviewedAt: { ...progress.conceptLastReviewedAt, [promptId]: Date.now() },
  };
  return finished ? withActivity(next, day.understanding.id) : next;
}

export function promptExplanation(prompt: UnderstandingPrompt, selected?: string) {
  if (prompt.kind !== 'scenario') return prompt.explanation;
  if (!selected || !prompt.options.includes(selected)) return null;
  return selected === prompt.answer ? prompt.explanation : prompt.alternativeExplanation;
}

export function completedPracticeQuestions(course: Course, completedDayIds: string[]) {
  return course.days.flatMap(day => completedDayIds.includes(day.id) ? day.understanding.prompts : []);
}

export function buildPracticeQueue(course: Course, progress: LearningProgress, limit = 3) {
  return completedPracticeQuestions(course, progress.completedDayIds)
    .sort((a, b) => (progress.conceptLastReviewedAt[a.id] ?? 0) - (progress.conceptLastReviewedAt[b.id] ?? 0))
    .slice(0, limit);
}

export function buildReviewNotes(course: Course, progress: LearningProgress) {
  return course.days.flatMap(day => day.lessons.filter(lesson => progress.completedLessonIds.includes(lesson.id)))
    .sort((a, b) => Number(progress.reviewLaterIds.includes(b.id)) - Number(progress.reviewLaterIds.includes(a.id)));
}

export function setReviewChoice(progress: LearningProgress, lessonId: string, choice: 'keep' | 'later'): LearningProgress {
  if (!progress.completedLessonIds.includes(lessonId)) return progress;
  return {
    ...progress,
    savedReviewIds: [...progress.savedReviewIds.filter(id => id !== lessonId), ...(choice === 'keep' ? [lessonId] : [])],
    reviewLaterIds: [...progress.reviewLaterIds.filter(id => id !== lessonId), ...(choice === 'later' ? [lessonId] : [])],
  };
}
