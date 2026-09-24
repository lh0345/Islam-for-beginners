import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { enCourse as course } from '../src/locales/en/course.ts';
import {
  reconcileProgress, completeReading, completePrompt, remainingPrompts,
  nextLearningAction, promptExplanation, buildPracticeQueue, buildReviewNotes, setReviewChoice,
} from '../src/learning.ts';

const empty = () => reconcileProgress(course, {});
const readDay = (progress, day) => day.lessons.reduce((state, lesson) => completeReading(course, state, lesson.id), progress);

test('the authored catalog supports varied reading arcs and every prompt is reachable', () => {
  assert.equal(course.days.length, 28);
  const lessons = course.days.flatMap(day => day.lessons);
  const prompts = course.days.flatMap(day => day.understanding.prompts);
  assert.equal(lessons.length, 84);
  assert.equal(prompts.length, 56);
  assert.equal(new Set(lessons.map(item => item.id)).size, lessons.length);
  assert.equal(new Set(prompts.map(item => item.id)).size, prompts.length);
  assert.ok(new Set(lessons.map(item => item.sections.map(part => part.kind).join(','))).size >= 8);
  assert.ok(prompts.filter(item => item.kind !== 'scenario').length > prompts.length / 2);
  for (const day of course.days) {
    assert.ok(day.understanding.prompts.length >= 2 && day.understanding.prompts.length <= 3);
    for (const lesson of day.lessons) {
      assert.ok(lesson.sections.length >= 3 && lesson.sections.length <= 6);
      assert.ok(lesson.sections.every(part => part.title && part.paragraphs.length && part.paragraphs.every(text => text.trim())));
      assert.ok(lesson.reviewCard.front && lesson.reviewCard.back);
      assert.equal('body' in lesson, false);
    }
    for (const prompt of day.understanding.prompts) {
      assert.ok(prompt.prompt && prompt.explanation);
      if (prompt.kind === 'scenario') {
        assert.ok(prompt.options.includes(prompt.answer));
        assert.equal(new Set(prompt.options).size, prompt.options.length);
        assert.ok(prompt.alternativeExplanation);
      }
    }
  }
});

test('all 28 days progress through reading and consideration without scoring or retries', () => {
  let progress = empty();
  for (const [index, day] of course.days.entries()) {
    progress = { ...progress, activeDayIndex: index };
    for (const [lessonIndex, lesson] of day.lessons.entries()) {
      assert.deepEqual(nextLearningAction(course, progress), { name: 'lesson', dayIndex: index, lessonIndex });
      progress = completeReading(course, progress, lesson.id);
      assert.equal(completeReading(course, progress, lesson.id), progress);
    }
    assert.equal(nextLearningAction(course, progress).name, 'understanding');
    for (const prompt of day.understanding.prompts) {
      assert.equal(remainingPrompts(course, progress)[0].id, prompt.id);
      // An explanation is available for both readings of a situation.
      if (prompt.kind === 'scenario') {
        for (const option of prompt.options) assert.ok(promptExplanation(prompt, option));
      } else assert.ok(promptExplanation(prompt));
      progress = completePrompt(course, progress, prompt.id);
      assert.equal(completePrompt(course, progress, prompt.id), progress);
    }
    assert.equal(nextLearningAction(course, progress).name, 'complete');
    assert.ok(progress.completedDayIds.includes(day.id));
  }
  assert.equal(progress.completedLessonIds.length, 84);
  assert.equal(progress.consideredPromptIds.length, 56);
  assert.equal(progress.completedDayIds.length, 28);
  assert.equal('points' in progress, false);
  assert.deepEqual(reconcileProgress(course, JSON.parse(JSON.stringify(progress))), progress);
});

test('legacy completion survives while trivia mastery and queues do not grant new understanding', () => {
  const raw = {
    activeDayIndex: 25, completedDayIds: ['day-01', 'unknown'], completedLessonIds: ['lesson-04', 'unknown'],
    masteredConceptIds: ['islam_is_religion', 'day-02-q1'], quizQueue: ['day-02-q2'], points: 190,
    activityByDate: { '2026-09-08': ['lesson-01'] },
  };
  const before = JSON.stringify(raw);
  const migrated = reconcileProgress(course, raw);
  assert.equal(JSON.stringify(raw), before);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.activeDayIndex, 1);
  assert.deepEqual(migrated.completedDayIds, ['day-01']);
  assert.deepEqual(new Set(migrated.completedLessonIds), new Set(['lesson-01', 'lesson-02', 'lesson-03', 'lesson-04']));
  assert.deepEqual(migrated.consideredPromptIds, []);
  assert.deepEqual(nextLearningAction(course, migrated), { name: 'lesson', dayIndex: 1, lessonIndex: 1 });
  assert.deepEqual(migrated.activityByDate, raw.activityByDate);
});

test('an unfinished day resumes at its remaining prompt after serialization', () => {
  let progress = readDay(empty(), course.days[0]);
  progress = completePrompt(course, progress, course.days[0].understanding.prompts[0].id);
  const resumed = reconcileProgress(course, JSON.parse(JSON.stringify(progress)));
  assert.deepEqual(resumed.completedDayIds, []);
  assert.equal(remainingPrompts(course, resumed)[0].id, course.days[0].understanding.prompts[1].id);
  assert.equal(nextLearningAction(course, resumed).name, 'understanding');
});

test('unread and out-of-order content cannot be completed or enter practice', () => {
  const progress = empty();
  assert.equal(completeReading(course, progress, 'lesson-84'), progress);
  assert.equal(completeReading(course, progress, 'lesson-02'), progress);
  assert.equal(completePrompt(course, progress, course.days[0].understanding.prompts[0].id), progress);
  assert.deepEqual(buildPracticeQueue(course, progress), []);
  assert.deepEqual(buildReviewNotes(course, progress), []);
  const repaired = reconcileProgress(course, { ...progress, consideredPromptIds: ['day-28-meaning-1'], savedReviewIds: ['lesson-84'], reviewLaterIds: ['lesson-84'] });
  assert.deepEqual(repaired.consideredPromptIds, []);
  assert.deepEqual(repaired.savedReviewIds, []);
  assert.deepEqual(repaired.reviewLaterIds, []);
});

test('practice uses completed days and returns least recently considered meaningful ideas', () => {
  const progress = reconcileProgress(course, { version: 2, completedDayIds: ['day-01', 'day-02'], conceptLastReviewedAt: { 'day-01-meaning-1': 100, 'day-02-meaning-1': 50 } });
  const queue = buildPracticeQueue(course, progress);
  assert.equal(queue.length, 3);
  assert.equal(new Set(queue.map(item => item.id)).size, 3);
  assert.ok(queue.every(item => /day-0[12]-meaning/.test(item.id)));
  assert.equal(queue.at(-1).id, 'day-02-meaning-1');
  assert.ok(queue.every(item => ['scenario', 'connection', 'consider'].includes(item.kind)));
});

test('review choices survive reload, remain exclusive, and never change learning completion', () => {
  let progress = readDay(empty(), course.days[0]);
  progress = setReviewChoice(progress, 'lesson-02', 'later');
  progress = setReviewChoice(progress, 'lesson-01', 'keep');
  progress = reconcileProgress(course, JSON.parse(JSON.stringify(progress)));
  assert.equal(buildReviewNotes(course, progress)[0].id, 'lesson-02');
  assert.deepEqual(progress.savedReviewIds, ['lesson-01']);
  assert.deepEqual(progress.completedDayIds, []);
  progress = setReviewChoice(progress, 'lesson-02', 'keep');
  assert.deepEqual(progress.reviewLaterIds, []);
  assert.deepEqual(progress.savedReviewIds, ['lesson-01', 'lesson-02']);
  assert.equal(setReviewChoice(progress, 'lesson-84', 'later'), progress);
});

test('sources preserve published translation separately from app explanation and classify analogies', () => {
  const sources = course.days.flatMap(day => day.lessons.flatMap(lesson => lesson.sources ?? []));
  const quran = sources.filter(source => source.type === 'Quran');
  assert.deepEqual(quran.map(source => source.reference), ['Quran 112:1–4', 'Quran 33:72', 'Quran 7:172']);
  for (const source of quran) {
    assert.match(source.arabicText, /[\u0600-\u06ff]/);
    assert.equal(source.translationName, 'Sahih International');
    assert.ok(source.translationText && source.explanation && source.url);
    assert.notEqual(source.translationText, source.explanation);
  }
  assert.equal(quran[0].translationText, 'Say, "He is Allah, [who is] One,\nAllah, the Eternal Refuge.\nHe neither begets nor is born,\nNor is there to Him any equivalent."');
  assert.equal(quran[1].translationText, 'Indeed, we offered the Trust to the heavens and the earth and the mountains, and they declined to bear it and feared it; but man [undertook to] bear it. Indeed, he was unjust and ignorant.');
  assert.ok(sources.some(source => source.type === 'Analogy note'));
});

test('malformed and future-version save roots do not silently become empty progress', () => {
  for (const raw of [null, [], 'broken', 4, { version: 3 }]) assert.throws(() => reconcileProgress(course, raw));
});

// Run the real storage module with an in-memory AsyncStorage boundary.
function storageModule(storage) {
  const code = ts.transpileModule(fs.readFileSync(new URL('../src/preferences.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (name === '@react-native-async-storage/async-storage') return storage;
    if (name === 'expo-localization') return { getCalendars: () => [{ timeZone: 'UTC' }] };
    throw new Error(name);
  }, Intl });
  return exports;
}

test('storage migrates beside v1, orders writes, recovers after failure, and exposes corrupt saves', async () => {
  const values = new Map([['islam-simply.progress.v1', JSON.stringify({ completedDayIds: ['day-01'] })]]);
  let fail = false;
  const writes = [];
  const storage = {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => {
      if (fail) { fail = false; throw new Error('storage unavailable'); }
      await Promise.resolve();
      writes.push(JSON.parse(value).completedLessonIds.length);
      values.set(key, value);
    },
  };
  const module = storageModule(storage);
  const original = values.get('islam-simply.progress.v1');
  const migrated = reconcileProgress(course, await module.loadLearningProgress());
  const next = completeReading(course, migrated, 'lesson-04');
  await Promise.all([module.saveLearningProgress(migrated), module.saveLearningProgress(next)]);
  assert.deepEqual(writes, [3, 4]);
  assert.equal(values.get('islam-simply.progress.v1'), original);
  assert.equal(reconcileProgress(course, await module.loadLearningProgress()).completedLessonIds.length, 4);
  fail = true;
  await assert.rejects(module.saveLearningProgress(migrated));
  await module.saveLearningProgress(next);
  values.set('islam-simply.progress.v2', '{broken');
  await assert.rejects(module.loadLearningProgress());
  assert.equal(values.get('islam-simply.progress.v2'), '{broken');
  assert.equal(values.get('islam-simply.progress.v1'), original);
});
