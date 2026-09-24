import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold, useFonts } from '@expo-google-fonts/dm-sans';
import { Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, BackHandler, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { format, getLocale } from './src/locales';
import { AppText as Text, fonts } from './src/design';
import type { Course, CourseDay, Lesson, LessonSource, UnderstandingPrompt } from './src/locales/types';
import { Onboarding } from './src/Onboarding';
import { FlagIcon } from './src/FlagIcon';
import { syncLearningReminder } from './src/notifications';
import { buildPracticeQueue, buildReviewNotes, completePrompt, completeReading, dailyProgress, nextLearningAction, promptExplanation, reconcileProgress, remainingPrompts, setReviewChoice } from './src/learning';
import { defaultPreferences, defaultLearningProgress, languageOptions, loadLearningProgress, loadPreferences, paceOptions, reminderOptions, savePreferences, saveLearningProgress, type LanguageId, type LearningProgress, type PaceId, type Preferences, type ReminderId } from './src/preferences';

type MainTab = 'home' | 'review' | 'progress' | 'profile';
type Screen =
  | { name: MainTab }
  | { name: 'lesson'; dayIndex: number; lessonIndex: number; review: boolean }
  | { name: 'understanding' }
  | { name: 'practice'; prompts: UnderstandingPrompt[]; index: number }
  | { name: 'complete' | 'practice-complete' | 'review-cards' | 'help' | 'about' }
  | { name: 'language'; returnTo: 'profile' };
type Ui = ReturnType<typeof getLocale>['ui'];
type AppIconName = 'home' | 'learn' | 'progress' | 'profile' | 'pace' | 'clock' | 'bell' | 'settings' | 'download' | 'help' | 'info';
const colors = { background: '#F6F1E8', surface: '#FFFCF6', charcoal: '#242A26', muted: '#626C65', green: '#174D3A', greenPressed: '#103B2C', mint: '#DDEDE3', mintDark: '#2F6B51', line: '#E5DED1', amber: '#F4DFC0', amberText: '#785227', gold: '#D7A83B', white: '#FFFFFF' };

export default function App() {
  return <SafeAreaProvider><AppContent /></SafeAreaProvider>;
}

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold, Lora_600SemiBold, Lora_700Bold });
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const { course, ui } = getLocale(preferences.language);
  const [progress, setProgress] = useState<LearningProgress>(defaultLearningProgress);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [persistenceWarning, setPersistenceWarning] = useState(false);
  const [notificationWarning, setNotificationWarning] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  useEffect(() => {
    let active = true;
    setLoadError(false);
    void Promise.all([loadPreferences(), loadLearningProgress()]).then(([prefs, stored]) => {
      const safe = reconcileProgress(course, stored);
      if (active) { setPreferences(prefs); setProgress(safe); setLoaded(true); }
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    if (!loaded) return;
    void saveLearningProgress(progress).catch(() => setPersistenceWarning(true));
  }, [loaded, progress]);

  const day = course.days[progress.activeDayIndex];
  const goalComplete = dailyProgress(progress.activityByDate, preferences.pace).complete;
  useEffect(() => {
    if (!loaded || !preferences.onboardingComplete) return;
    const next = day.lessons.find(lesson => !progress.completedLessonIds.includes(lesson.id)) ?? day.lessons[0];
    void syncLearningReminder(preferences, { title: ui.notificationTitle, body: format(ui.notificationBody, { lesson: next.title }), channel: ui.notificationChannel }, goalComplete, false)
      .then(result => setNotificationWarning(result.status === 'denied' ? ui.notificationsBlocked : null))
      .catch(() => setNotificationWarning(ui.reminderUpdateFailedProfile));
  }, [loaded, preferences, day, goalComplete, progress.completedLessonIds]);

  function leaveReading() {
    setScreen({ name: screen.name === 'lesson' && screen.review ? 'progress' : 'home' });
  }
  function back() {
    if (screen.name === 'lesson') leaveReading();
    else if (['practice', 'practice-complete', 'review-cards'].includes(screen.name)) setScreen({ name: 'review' });
    else if (['help', 'about', 'language'].includes(screen.name)) setScreen({ name: 'profile' });
    else setScreen({ name: 'home' });
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen.name === 'home') return false;
      back();
      return true;
    });
    return () => subscription.remove();
  }, [screen]);

  function continueJourney() {
    const action = nextLearningAction(course, progress);
    setScreen(action.name === 'lesson'
      ? { name: 'lesson', dayIndex: action.dayIndex, lessonIndex: action.lessonIndex, review: false }
      : action.name === 'complete' ? { name: 'complete' } : { name: 'understanding' });
  }
  function finishReading(dayIndex: number, lessonIndex: number, review: boolean) {
    const readingDay = course.days[dayIndex];
    if (!review) setProgress(current => completeReading(course, current, readingDay.lessons[lessonIndex].id));
    setScreen(lessonIndex < readingDay.lessons.length - 1
      ? { name: 'lesson', dayIndex, lessonIndex: lessonIndex + 1, review }
      : review ? { name: 'progress' } : { name: 'understanding' });
  }
  function finishPrompt(promptId: string) {
    const next = completePrompt(course, progress, promptId);
    setProgress(next);
    if (next.completedDayIds.includes(day.id)) setScreen({ name: 'complete' });
  }
  function startPractice() {
    const prompts = buildPracticeQueue(course, progress);
    if (prompts.length) setScreen({ name: 'practice', prompts, index: 0 });
  }
  function advanceDay(start: boolean) {
    if (progress.activeDayIndex >= course.days.length - 1) { setScreen({ name: 'progress' }); return; }
    const nextIndex = progress.activeDayIndex + 1;
    setProgress(current => ({ ...current, activeDayIndex: nextIndex }));
    setScreen(start ? { name: 'lesson', dayIndex: nextIndex, lessonIndex: 0, review: false } : { name: 'home' });
  }
  function updatePreferences(change: Partial<Preferences>, requestPermission = false) {
    const next = { ...preferences, ...change };
    setPreferences(next);
    void savePreferences(next).catch(() => setPersistenceWarning(true));
    if (requestPermission) {
      void syncLearningReminder(next, { title: ui.notificationTitle, body: format(ui.notificationBody, { lesson: day.lessons[0].title }), channel: ui.notificationChannel }, goalComplete, true)
        .then(result => setNotificationWarning(result.status === 'denied' ? ui.notificationsBlocked : null))
        .catch(() => setNotificationWarning(ui.reminderSetFailed));
    }
  }

  if (loadError) return <SafeAreaView style={styles.safeArea}><View style={styles.readingColumn}><Text style={styles.articleTitle}>Your place could not be opened.</Text><Text style={styles.prose}>Your existing saved progress has been left untouched. Try opening it again.</Text><PrimaryButton label="Try again" onPress={() => setLoadAttempt(value => value + 1)} /></View></SafeAreaView>;
  if ((!fontsLoaded && !fontError) || !loaded) return <SafeAreaView style={styles.safeArea}><View style={styles.loadingScreen}><ActivityIndicator color={colors.green} /></View></SafeAreaView>;
  if (!preferences.onboardingComplete) return <Onboarding t={ui} onComplete={next => updatePreferences(next, next.notificationsEnabled)} />;

  const mainTab = ['home', 'review', 'progress', 'profile'].includes(screen.name);
  const currentPrompt = remainingPrompts(course, progress)[0];
  const selectedLanguage = languageOptions.find(option => option.id === preferences.language) ?? languageOptions[0];
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.page}><View style={styles.phoneFrame}>
        {persistenceWarning && <View accessibilityRole="alert" style={styles.saveNotice}><Text style={styles.saveNoticeText}>Recent changes could not be saved on this device.</Text><Pressable accessibilityRole="button" onPress={() => {
          void Promise.all([saveLearningProgress(progress), savePreferences(preferences)]).then(() => setPersistenceWarning(false)).catch(() => setPersistenceWarning(true));
        }}><Text style={styles.textLink}>Retry save</Text></Pressable></View>}
        <View style={styles.screen}>
          {screen.name === 'home' && <HomeScreen course={course} day={day} completedDayIds={progress.completedDayIds} completedLessonIds={progress.completedLessonIds} t={ui} onContinue={continueJourney} />}
          {screen.name === 'lesson' && <LessonScreen key={course.days[screen.dayIndex].lessons[screen.lessonIndex].id}
            day={course.days[screen.dayIndex]} lessonIndex={screen.lessonIndex} review={screen.review} onBack={leaveReading}
            onContinue={() => finishReading(screen.dayIndex, screen.lessonIndex, screen.review)} />}
          {screen.name === 'understanding' && currentPrompt && <UnderstandingScreen key={currentPrompt.id} prompt={currentPrompt} onBack={back} onContinue={() => finishPrompt(currentPrompt.id)} />}
          {screen.name === 'understanding' && !currentPrompt && <EndNote title="Return to the reading" body="The next part of this journey begins with the readings for today." onDone={continueJourney} label="Continue reading" />}
          {screen.name === 'practice' && <UnderstandingScreen key={screen.prompts[screen.index].id} prompt={screen.prompts[screen.index]} onBack={back} onContinue={() => {
            const id = screen.prompts[screen.index].id;
            setProgress(current => ({ ...current, conceptLastReviewedAt: { ...current.conceptLastReviewedAt, [id]: Date.now() } }));
            setScreen(screen.index + 1 < screen.prompts.length ? { ...screen, index: screen.index + 1 } : { name: 'practice-complete' });
          }} />}
          {screen.name === 'practice-complete' && <EndNote title="You can return anytime." body="You can return to these connections whenever they are useful. Reading them again may bring a different question." label="Back to Review" onDone={() => setScreen({ name: 'review' })} />}
          {screen.name === 'complete' && <CompleteScreen day={day} course={course} onNext={() => advanceDay(true)} onDone={() => advanceDay(false)} onHome={() => setScreen({ name: 'home' })} />}
          {screen.name === 'review' && <ReviewScreen course={course} progress={progress} completedDayIds={progress.completedDayIds} completedLessonIds={progress.completedLessonIds} t={ui} onPractice={startPractice} onReviewCards={() => setScreen({ name: 'review-cards' })} />}
          {screen.name === 'review-cards' && <ReviewCardsScreen notes={buildReviewNotes(course, progress)} progress={progress} onBack={back} onChoice={(id, choice) => setProgress(current => setReviewChoice(current, id, choice))} />}
          {screen.name === 'progress' && <ProgressScreen activeDayIndex={progress.activeDayIndex} completedDayIds={progress.completedDayIds} course={course} t={ui} onSelectDay={index => {
            if (progress.completedDayIds.includes(course.days[index].id)) setScreen({ name: 'lesson', dayIndex: index, lessonIndex: 0, review: true });
            else continueJourney();
          }} />}
          {screen.name === 'profile' && <ProfileScreen language={selectedLanguage} pace={paceOptions.find(option => option.id === preferences.pace) ?? paceOptions[1]} reminder={reminderOptions.find(option => option.id === preferences.reminder) ?? reminderOptions[0]}
            preferences={preferences} persistenceWarning={persistenceWarning} notificationWarning={notificationWarning} t={ui}
            onLanguage={() => setScreen({ name: 'language', returnTo: 'profile' })}
            onPace={pace => updatePreferences({ pace })}
            onReminder={reminder => updatePreferences({ reminder, notificationsEnabled: reminder !== 'none' }, reminder !== 'none')}
            onCustomTime={customReminderTime => updatePreferences({ customReminderTime })}
            onNotifications={notificationsEnabled => updatePreferences({ notificationsEnabled, ...(notificationsEnabled && preferences.reminder === 'none' ? { reminder: 'morning' as const } : {}) }, notificationsEnabled)}
            onHelp={() => setScreen({ name: 'help' })} onAbout={() => setScreen({ name: 'about' })} />}
          {screen.name === 'language' && <LanguageScreen activeLocale={preferences.language} t={ui} onClose={back} onSelect={language => updatePreferences({ language })} />}
          {(screen.name === 'help' || screen.name === 'about') && <InfoScreen kind={screen.name} t={ui} onBack={back} />}
        </View>
        {mainTab && <BottomNav active={screen.name as MainTab} t={ui} onSelect={name => setScreen({ name })} />}
      </View></View>
    </SafeAreaView>
  );
}

function HomeScreen({
  completedDayIds,
  completedLessonIds,
  course,
  day,
  t,
  onContinue,
}: {
  completedDayIds: string[];
  completedLessonIds: string[];
  course: Course;
  day: CourseDay;
  t: Ui;
  onContinue: () => void;
}) {
  const { height, width } = useWindowDimensions();
  const compact = height < 760;
  const narrow = Math.min(width, 430) < 380;
  const firstIncomplete = day.lessons.findIndex((lesson) => !completedLessonIds.includes(lesson.id));
  const lessonIndex = firstIncomplete < 0 ? day.lessons.length - 1 : firstIncomplete;
  const lesson = day.lessons[lessonIndex];
  const wordCount = lesson.sections.flatMap(part => part.paragraphs).join(' ').split(/\s+/).length;
  const minutes = firstIncomplete < 0 ? 2 : Math.max(3, Math.ceil(wordCount / 110));
  const dayComplete = completedDayIds.includes(day.id);
  const startDay = Math.min(Math.max(1, day.number - 3), Math.max(1, course.days.length - 6));
  const visibleDays = course.days.slice(startDay - 1, startDay + 6);
  const currentVisibleIndex = visibleDays.findIndex((railDay) => railDay.number === day.number);
  const completedTrackWidth = `${Math.max(0, currentVisibleIndex) / Math.max(1, visibleDays.length - 1) * 85.714}%` as `${number}%`;

  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.homeHero, compact && styles.homeHeroCompact]}>
        <Text style={[styles.homeDayTitle, compact && styles.homeDayTitleCompact, narrow && styles.homeDayTitleNarrow]}>{format(t.courseDay, { day: day.number, total: course.days.length })}</Text>
        <Text style={[styles.homeTagline, compact && styles.homeTaglineCompact]}>{t.homeTagline}</Text>

        <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: course.days.length, now: day.number }} style={[styles.dayRail, compact && styles.dayRailCompact]}>
          <View style={[styles.dayRailTrack, compact && styles.dayRailTrackCompact]} />
          <View style={[styles.dayRailTrack, styles.dayRailTrackComplete, compact && styles.dayRailTrackCompact, { width: completedTrackWidth }]} />
          {visibleDays.map((railDay) => {
            const complete = completedDayIds.includes(railDay.id) || railDay.number < day.number;
            const current = railDay.number === day.number;
            return (
              <View key={railDay.id} style={styles.dayRailItem}>
                <View style={[styles.dayRailDot, compact && styles.dayRailDotCompact, complete && styles.dayRailDotComplete, current && styles.dayRailDotCurrent, current && compact && styles.dayRailDotCurrentCompact]}>
                  {complete ? <Ionicons color={colors.white} name="checkmark" size={compact ? 17 : 19} /> : <Text style={[styles.dayRailText, compact && styles.dayRailTextCompact, current && styles.dayRailTextActive]}>{railDay.number}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.featuredLessonCard, compact && styles.featuredLessonCardCompact, narrow && styles.featuredLessonCardNarrow]}>
        <Text style={styles.featuredEyebrow}>{firstIncomplete < 0 ? 'AFTER TODAY’S LESSONS' : format(t.lessonCatalogPosition, { current: lesson.number, total: course.days.flatMap(item => item.lessons).length }).toLocaleUpperCase()}</Text>
        <View style={[styles.featuredMain, compact && styles.featuredMainCompact]}>
          <View style={[styles.featuredCopy, compact && styles.featuredCopyCompact]}>
            <Text style={[styles.featuredTitle, compact && styles.featuredTitleCompact, narrow && styles.featuredTitleNarrow]}>{dayComplete ? 'A moment to pause' : firstIncomplete < 0 ? 'Think it through' : lesson.title}</Text>
            <Text style={[styles.featuredSubtitle, compact && styles.featuredSubtitleCompact]}>{firstIncomplete < 0 ? 'Two questions to help you understand today’s ideas.' : 'A simple explanation in everyday language.'}</Text>
          </View>
          <LessonLandscape compact={compact} />
        </View>
        <View style={[styles.lessonMetaRow, compact && styles.lessonMetaRowCompact, narrow && styles.lessonMetaRowNarrow]}>
          <View style={styles.lessonMetaItem}><AppIcon name="clock" /><Text style={styles.lessonMetaText}>~ {minutes} min</Text></View>
          <View style={styles.lessonMetaDivider} />
          <View style={styles.lessonMetaItem}><AppIcon name="learn" /><Text style={styles.lessonMetaText}>{dayComplete ? 'Today’s reading finished' : firstIncomplete < 0 ? '2 questions to consider' : format(t.lessonToday, { current: lessonIndex + 1, total: day.lessons.length })}</Text></View>
        </View>
        <View style={[styles.featuredButton, compact && styles.featuredButtonCompact]}><PrimaryButton label={dayComplete ? 'Finish this day' : firstIncomplete < 0 ? 'Think it through' : firstIncomplete === 0 ? t.startLesson : t.continue} onPress={onContinue} /></View>
      </View>
    </ScrollView>
  );
}

function LessonScreen({ day, lessonIndex, review, onBack, onContinue }: { day: CourseDay; lessonIndex: number; review: boolean; onBack: () => void; onContinue: () => void }) {
  const lesson = day.lessons[lessonIndex];
  const [inSections, setInSections] = useState(false);
  const [page, setPage] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const completed = useRef(false);
  const sections = inSections ? [lesson.sections[page]] : lesson.sections;
  const lastPage = !inSections || page === lesson.sections.length - 1;
  function movePage(index: number) { setPage(index); scroll.current?.scrollTo({ y: 0, animated: false }); }
  return <View style={styles.screen}>
    <SimpleHeader title={'Day ' + day.number + ' · ' + day.title} backLabel="Leave reading" onBack={onBack} />
    <ScrollView ref={scroll} contentContainerStyle={styles.articleContent}>
      <View style={styles.readerTools}><Text style={styles.smallLabel}>{'LESSON ' + (lessonIndex + 1)}</Text><Pressable accessibilityRole="button" onPress={() => { setInSections(value => !value); movePage(0); }}><Text style={styles.textLink}>{inSections ? 'Read as one page' : 'Read in sections'}</Text></Pressable></View>
      {(!inSections || page === 0) && <Text accessibilityRole="header" style={styles.articleTitle}>{lesson.title}</Text>}
      {sections.map(part => <View key={part.title} style={[
        styles.articleSection,
        part.kind === 'example' && styles.exampleSection,
        part.kind === 'distinction' && styles.distinctionSection,
        part.kind === 'reflection' && styles.reflectionSection,
      ]}>
        {part.kind === 'example' && <Text style={styles.smallLabel}>AN EVERYDAY EXAMPLE</Text>}
        <Text accessibilityRole="header" style={[styles.sectionHeading, part.kind === 'opening' && styles.openingHeading, part.kind === 'reflection' && styles.reflectionHeading]}>{part.title}</Text>
        {part.paragraphs.map(paragraph => <Text key={paragraph} selectable style={[styles.prose, part.kind === 'opening' && styles.leadProse, part.kind === 'reflection' && styles.reflectionProse]}>{paragraph}</Text>)}
      </View>)}
      {lesson.sources?.length && lastPage ? <Pressable accessibilityRole="button" onPress={() => setSourcesOpen(true)} style={styles.sourceReadLink}><Text style={styles.textLink}>Read the source and explanation</Text><Ionicons name="arrow-forward" size={18} color={colors.green} /></Pressable> : null}
      {inSections && <View style={styles.readerPageRow}><Pressable accessibilityRole="button" accessibilityState={{ disabled: page === 0 }} disabled={page === 0} onPress={() => movePage(page - 1)}><Text style={[styles.textLink, page === 0 && { opacity: 0.4 }]}>Previous section</Text></Pressable><Text style={styles.smallLabel}>{page + 1} / {lesson.sections.length}</Text></View>}
      <View style={styles.articleEnding}>
        <Text style={styles.endingPreview}>{lastPage ? lessonIndex < day.lessons.length - 1 ? 'Next: ' + day.lessons[lessonIndex + 1].title : review ? 'These readings remain here whenever you want to return.' : 'Next, spend a little time with today’s ideas.' : 'Next: ' + lesson.sections[page + 1].title}</Text>
        <PrimaryButton label={lastPage ? lessonIndex < day.lessons.length - 1 ? 'Continue the reading' : review ? 'Back to Progress' : 'Think it through' : 'Continue reading'} onPress={() => {
          if (!lastPage) { movePage(page + 1); return; }
          if (completed.current) return;
          completed.current = true;
          onContinue();
        }} />
      </View>
    </ScrollView>
    <SourceSheet lesson={lesson} open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
  </View>;
}

function SourceSheet({ lesson, open, onClose }: { lesson: Lesson; open: boolean; onClose: () => void }) {
  return <Modal animationType="none" onRequestClose={onClose} transparent visible={open}>
    <View style={styles.sheetBackdrop}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close sources" onPress={onClose} style={styles.sheetDismissArea} />
      <View style={styles.sourceSheet}>
        <View style={styles.sourceSheetHeader}><Text accessibilityRole="header" style={styles.sourceSheetTitle}>Sources and notes</Text><Pressable accessibilityRole="button" accessibilityLabel="Close sources" onPress={onClose} style={styles.closeSource}><Ionicons name="close" size={24} color={colors.green} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.sourceSheetScroll}>
          {lesson.sources?.map(source => <SourceText key={source.reference} source={source} />)}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function SourceText({ source }: { source: LessonSource }) {
  return <View style={styles.sourceRow}>
    <Text style={styles.smallLabel}>{source.type.toUpperCase()}</Text>
    <Text accessibilityRole="header" style={styles.sourceReference}>{source.reference}</Text>
    {source.type === 'Quran' || source.type === 'Hadith' ? <>
      {source.arabicText && <><Text style={styles.sourceSectionLabel}>ARABIC</Text><Text selectable style={styles.sourceArabic}>{source.arabicText}</Text></>}
      <View style={styles.translationBlock}><Text style={styles.sourceSectionLabel}>ENGLISH TRANSLATION</Text><Text selectable style={styles.sourceTranslation}>{source.translationText}</Text><Text style={styles.sourceTranslationName}>{source.translationName}</Text></View>
      <View style={styles.explanationBlock}><Text style={styles.sourceSectionLabel}>SIMPLE EXPLANATION</Text><Text style={styles.sourceNote}>{source.explanation}</Text></View>
    </> : <Text style={styles.sourceNote}>{source.note}</Text>}
    {source.url && <Text accessibilityRole="link" style={styles.textLink} onPress={() => void Linking.openURL(source.url!)}>Open published source</Text>}
  </View>;
}

function UnderstandingScreen({ prompt, onBack, onContinue }: { prompt: UnderstandingPrompt; onBack: () => void; onContinue: () => void }) {
  const [selection, setSelection] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false);
  const locked = useRef(false);
  const moved = useRef(false);
  const feedback = revealed ? selection ? promptExplanation(prompt, selection) : prompt.explanation : null;
  function reveal(answer?: string) {
    if (locked.current) return;
    locked.current = true;
    setSelection(answer);
    setRevealed(true);
  }
  return <View style={styles.screen}>
    <SimpleHeader title={prompt.kind === 'connection' ? 'How the ideas fit' : 'Think it through'} backLabel="Leave this prompt" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.articleContent}>
      <Text style={styles.eyebrow}>{prompt.kind === 'scenario' ? 'A SITUATION' : prompt.kind === 'connection' ? 'TWO IDEAS TOGETHER' : 'TAKE A MOMENT'}</Text>
      <Text accessibilityRole="header" style={styles.articleTitle}>{prompt.title}</Text>
      <Text style={styles.promptProse}>{prompt.prompt}</Text>
      {prompt.kind === 'scenario' ? <View accessibilityRole="radiogroup" accessibilityLabel="Ways to understand this situation" style={styles.meaningOptions}>
        {prompt.options.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityLabel={option}
          aria-checked={selection === option} accessibilityState={{ checked: selection === option, disabled: revealed }} disabled={revealed} onPress={() => reveal(option)}
          style={({ pressed }) => [styles.meaningOption, selection === option && styles.meaningOptionSelected, selection === option && option !== prompt.answer && styles.meaningOptionIncorrect, pressed && styles.lightPressed]}>
          <View style={[styles.choiceDot, selection === option && styles.choiceDotSelected, selection === option && option !== prompt.answer && styles.choiceDotIncorrect]} /><Text style={styles.meaningOptionText}>{option}</Text>
        </Pressable>)}
      </View> : null}
      {!revealed && prompt.kind === 'scenario' && <SecondaryButton label="Read the explanation instead" onPress={() => reveal()} />}
      {!revealed && prompt.kind !== 'scenario' && <>
        <View style={styles.reflectionHint}>
          <Ionicons color={colors.mintDark} name="bulb-outline" size={20} />
          <Text style={styles.reflectionHintText}>Take a moment to think. Nothing needs to be typed or submitted.</Text>
        </View>
        <PrimaryButton label="Continue to an explanation" onPress={() => reveal()} />
      </>}
      {feedback && <View accessibilityLiveRegion="polite" style={styles.meaningExplanation}>
        <Text style={styles.smallLabel}>{prompt.kind === 'scenario' ? 'WHAT THIS MEANS' : 'A WAY TO THINK ABOUT IT'}</Text>
        <Text selectable style={styles.prose}>{feedback}</Text>
      </View>}
      {revealed && <PrimaryButton label="Continue when ready" onPress={() => { if (!moved.current) { moved.current = true; onContinue(); } }} />}
    </ScrollView>
  </View>;
}

function CompleteScreen({ day, course, onNext, onDone, onHome }: { day: CourseDay; course: Course; onNext: () => void; onDone: () => void; onHome: () => void }) {
  const next = course.days[day.number];
  return <ScrollView contentContainerStyle={styles.articleContent}>
    <Text style={styles.eyebrow}>{'AFTER DAY ' + day.number}</Text>
    <Text accessibilityRole="header" style={styles.articleTitle}>{next ? 'You can pause here.' : 'The questions can continue.'}</Text>
    <Text style={styles.promptProse}>{day.closing}</Text>
    {next ? <View style={styles.nextReading}><Text style={styles.smallLabel}>WHEN YOU RETURN</Text><Text style={styles.sectionHeading}>{next.title}</Text><Text style={styles.prose}>{next.introduction}</Text></View>
      : course.nextCourses.map(item => <View key={item.title} style={styles.articleSection}><Text style={styles.sectionHeading}>{item.title}</Text><Text style={styles.prose}>{item.description}</Text></View>)}
    <PrimaryButton label={next ? 'Finish for today' : 'Back to Progress'} onPress={onDone} />
    {next ? <SecondaryButton label="Start the next day" onPress={onNext} /> : <SecondaryButton label="Back to Home" onPress={onHome} />}
  </ScrollView>;
}

function ReviewScreen({ completedDayIds, completedLessonIds, course, progress, t, onPractice, onReviewCards }: { completedDayIds: string[]; completedLessonIds: string[]; course: Course; progress: LearningProgress; t: Ui; onPractice: () => void; onReviewCards: () => void }) {
  const { height, width } = useWindowDimensions();
  const compact = height < 650;
  const narrow = Math.min(width, 430) < 370;
  const canReviewLessons = completedLessonIds.length > 0;
  const flashcardCount = buildReviewNotes(course, progress).length;
  const practiceQuestionCount = course.days.filter(day => completedDayIds.includes(day.id)).flatMap(day => day.understanding.prompts).length;

  return (
    <ScrollView contentContainerStyle={[styles.learnContent, compact && styles.learnContentCompact]} showsVerticalScrollIndicator={false}>
      <View style={styles.learnHeaderRow}>
        <View style={styles.learnHeaderCopy}>
          <Text style={[styles.learnTitle, compact && styles.learnTitleCompact]}>{t.reviewTitle}</Text>
          <Text style={[styles.learnSubtitle, compact && styles.learnSubtitleCompact]}>{t.reviewSubtitle}</Text>
        </View>
      </View>

      <View style={[styles.learnCardList, compact && styles.learnCardListCompact]}>
        <ReviewFeatureCard
          compact={compact}
          count={format(t.cardsCount, { count: flashcardCount })}
          description={t.reviewCardsBody}
          disabled={!canReviewLessons}
          kind="cards"
          narrow={narrow}
          onPress={onReviewCards}
          title={t.reviewCardsTitle}
        />
        <ReviewFeatureCard
          compact={compact}
          count={format(t.questionsCount, { count: practiceQuestionCount })}
          description={t.practiceBody}
          disabled={practiceQuestionCount === 0}
          kind="practice"
          narrow={narrow}
          onPress={onPractice}
          title={t.practiceTitle}
        />
      </View>
    </ScrollView>
  );
}

function ReviewCardsScreen({ notes, progress, onBack, onChoice }: { notes: Lesson[]; progress: LearningProgress; onBack: () => void; onChoice: (id: string, choice: 'keep' | 'later') => void }) {
  const [filter, setFilter] = useState<'all' | 'kept' | 'later'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const note = notes.find(item => item.id === selected);
  const visible = notes.filter(item => filter === 'all' || (filter === 'kept' ? progress.savedReviewIds : progress.reviewLaterIds).includes(item.id));
  return <View style={styles.screen}>
    <SimpleHeader title="Reading notes" backLabel={note ? 'Back to notes' : 'Back to Review'} onBack={() => note ? setSelected(null) : onBack()} />
    <ScrollView key={selected ?? filter} contentContainerStyle={styles.articleContent}>
      {note ? <>
        <Text style={styles.eyebrow}>FROM YOUR READING</Text>
        <Text accessibilityRole="header" style={styles.articleTitle}>{note.reviewCard.front}</Text>
        <Text style={styles.promptProse}>{note.reviewCard.back}</Text>
        {note.reviewCard.why && <View style={styles.articleSection}><Text style={styles.smallLabel}>WHY IT MATTERS</Text><Text style={styles.prose}>{note.reviewCard.why}</Text></View>}
        {note.reviewCard.distinction && <View style={styles.distinctionSection}><Text style={styles.smallLabel}>A DISTINCTION TO KEEP</Text><Text style={styles.prose}>{note.reviewCard.distinction}</Text></View>}
        {note.reviewCard.reconsider && <View style={styles.reflectionSection}><Text style={styles.reflectionProse}>{note.reviewCard.reconsider}</Text></View>}
        <Text style={styles.emptyNote}>Keep this close, or place it first for a later visit.</Text>
        <PrimaryButton label="Keep this" onPress={() => { onChoice(note.id, 'keep'); setNotice('Kept in your collection.'); setSelected(null); }} />
        <SecondaryButton label="Revisit later" onPress={() => { onChoice(note.id, 'later'); setNotice('Set aside for your next visit.'); setSelected(null); }} />
      </> : <>
        <Text accessibilityRole="header" style={styles.articleTitle}>Choose an idea.</Text>
        <Text style={styles.prose}>These notes gather ideas from your readings. Keep what you want close, or set something aside to revisit.</Text>
        <View style={styles.noteFilters}>{(['all', 'kept', 'later'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === filter }} onPress={() => setFilter(value)} style={[styles.noteFilter, filter === value && styles.noteFilterSelected]}><Text style={filter === value ? styles.noteFilterTextSelected : styles.textLink}>{value === 'all' ? 'All notes' : value === 'kept' ? 'Kept' : 'Revisit later'}</Text></Pressable>)}</View>
        {!!notice && <Text accessibilityLiveRegion="polite" style={styles.savedNotice}>{notice}</Text>}
        {!visible.length && <Text style={styles.emptyNote}>No notes here yet. Choose one from All notes to keep or revisit.</Text>}
        {visible.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => { setSelected(item.id); setNotice(''); }} style={styles.readingListRow}><Text style={[styles.readingListTitle, { flex: 1 }]}>{item.reviewCard.front}</Text><Ionicons name="arrow-forward" size={18} color={colors.green} /></Pressable>)}
      </>}
    </ScrollView>
  </View>;
}

function EndNote({ title, body, label, onDone }: { title: string; body: string; label: string; onDone: () => void }) {
  return <ScrollView contentContainerStyle={styles.articleContent}><Text accessibilityRole="header" style={styles.articleTitle}>{title}</Text><Text style={styles.promptProse}>{body}</Text><PrimaryButton label={label} onPress={onDone} /></ScrollView>;
}

function ProgressScreen({ activeDayIndex, completedDayIds, course, t, onSelectDay }: { activeDayIndex: number; completedDayIds: string[]; course: Course; t: Ui; onSelectDay: (index: number) => void }) {
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const currentWeekIndex = Math.floor(activeDayIndex / 7);
  const [expandedWeekIndex, setExpandedWeekIndex] = useState(currentWeekIndex);
  return (
    <ScrollView contentContainerStyle={[styles.progressContent, compact && styles.progressContentCompact]} showsVerticalScrollIndicator={false}>
      <View style={styles.learnHeaderRow}>
        <View style={styles.learnHeaderCopy}>
          <Text style={[styles.progressPageTitle, compact && styles.progressPageTitleCompact]}>{t.progressTitle}</Text>
          <Text style={[styles.progressPageSubtitle, compact && styles.progressPageSubtitleCompact]}>{t.progressSubtitle}</Text>
        </View>
      </View>

      <View style={[styles.weekJourneyList, compact && styles.weekJourneyListCompact]}>
        {course.weeks.map((title, weekIndex) => {
          const weekDays = course.days.filter((weekDay) => weekDay.week === weekIndex + 1);
          const completedCount = weekDays.filter((weekDay) => completedDayIds.includes(weekDay.id)).length;
          const weekComplete = completedCount === weekDays.length;
          const weekLocked = weekIndex > currentWeekIndex;
          const expanded = expandedWeekIndex === weekIndex && !weekLocked;
          const firstDay = weekDays[0]?.number ?? weekIndex * 7 + 1;
          const lastDay = weekDays.at(-1)?.number ?? firstDay + 6;
          return (
            <View key={title} style={[styles.weekJourneyCard, expanded && styles.weekJourneyCardExpanded]}>
              <Pressable
                accessibilityLabel={`${format(t.weekLabel, { week: weekIndex + 1 })}. ${title}. ${format(t.weekCompleteCount, { done: completedCount })}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: weekLocked, expanded }}
                disabled={weekLocked}
                onPress={() => setExpandedWeekIndex(expanded ? -1 : weekIndex)}
                style={({ pressed }) => [styles.weekJourneyHeader, compact && styles.weekJourneyHeaderCompact, pressed && !weekLocked && styles.lightPressed]}
              >
                <WeekProgressMark complete={weekComplete} completedCount={completedCount} locked={weekLocked} />
                <View style={styles.weekJourneyCopy}>
                  <View style={styles.weekJourneyTitleRow}>
                    <Text style={styles.weekJourneyNumber}>{format(t.weekLabel, { week: weekIndex + 1 })}</Text>
                    <Text numberOfLines={2} style={styles.weekJourneyTitle}>{title}</Text>
                  </View>
                  <Text style={styles.weekJourneyRange}>{format(t.weekDays, { start: firstDay, end: lastDay })}</Text>
                </View>
                {!weekLocked && <Text style={[styles.weekJourneyCount, weekComplete && styles.weekJourneyCountComplete]}>{format(t.weekCompleteCount, { done: completedCount })}</Text>}
                <Ionicons color="#626D78" name={expanded ? 'chevron-up' : 'chevron-down'} size={22} />
              </Pressable>

              {expanded && (
                <View style={styles.dayJourneyList}>
                  {weekDays.map((weekDay, dayOffset) => {
                    const dayIndex = weekDay.number - 1;
                    const complete = completedDayIds.includes(weekDay.id);
                    const active = dayIndex === activeDayIndex && !complete;
                    const locked = dayIndex > activeDayIndex;
                    return (
                      <View key={weekDay.id} style={styles.dayJourneyRow}>
                        <View style={styles.dayJourneyRail}>
                          {dayOffset < weekDays.length - 1 && <View style={[styles.dayJourneyLine, complete && styles.dayJourneyLineComplete]} />}
                          <View style={[styles.dayJourneyMark, complete && styles.dayJourneyMarkComplete, active && styles.dayJourneyMarkActive]}>
                            {complete && <Ionicons color={colors.white} name="checkmark" size={14} />}
                          </View>
                        </View>
                        <Pressable
                          accessibilityLabel={`${format(t.dayLabel, { day: weekDay.number })}. ${weekDay.title}`}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: locked }}
                          disabled={locked}
                          onPress={() => onSelectDay(dayIndex)}
                          style={({ pressed }) => [styles.dayJourneyButton, active && styles.dayJourneyButtonActive, pressed && !locked && styles.dayJourneyButtonPressed]}
                        >
                          <Text style={[styles.dayJourneyNumber, locked && styles.dayJourneyTextLocked]}>{format(t.dayLabel, { day: weekDay.number })}</Text>
                          <Text numberOfLines={2} style={[styles.dayJourneyTitle, locked && styles.dayJourneyTextLocked]}>{weekDay.title}</Text>
                          {active && <Ionicons color={colors.green} name="chevron-forward" size={21} />}
                          {locked && <Ionicons color="#737B78" name="lock-closed-outline" size={19} />}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}


function AppIcon({ name, active = false, inverted = false }: { name: AppIconName; active?: boolean; inverted?: boolean }) {
  const color = inverted ? '#F2D58C' : active ? colors.green : '#68736E';
  const names: Record<AppIconName, { active: ComponentProps<typeof Ionicons>['name']; idle: ComponentProps<typeof Ionicons>['name'] }> = {
    home: { active: 'home', idle: 'home-outline' },
    learn: { active: 'book', idle: 'book-outline' },
    progress: { active: 'stats-chart', idle: 'stats-chart-outline' },
    profile: { active: 'person', idle: 'person-outline' },
    pace: { active: 'speedometer', idle: 'speedometer-outline' },
    clock: { active: 'time', idle: 'time-outline' },
    bell: { active: 'notifications', idle: 'notifications-outline' },
    settings: { active: 'options', idle: 'options-outline' },
    download: { active: 'cloud-download', idle: 'cloud-download-outline' },
    help: { active: 'help-circle', idle: 'help-circle-outline' },
    info: { active: 'information-circle', idle: 'information-circle-outline' },
  };
  return <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" color={color} name={active ? names[name].active : names[name].idle} size={name === 'clock' ? 25 : 26} />;
}

function LanguageScreen({ activeLocale, t, onClose, onSelect }: { activeLocale: LanguageId; t: Ui; onClose: () => void; onSelect: (locale: LanguageId) => void }) {
  return (
    <View style={styles.screen}>
      <SimpleHeader backLabel={t.back} title={t.languageTitle} onBack={onClose} />
      <View style={styles.languageContent}>
        <Text style={styles.languageTitle}>{t.languageTitle}</Text>
        <Text style={styles.languageBody}>{t.languageBody}</Text>
        <View style={styles.languageList}>
          {languageOptions.filter((locale) => locale.available).map((locale) => {
            const languageName = String(locale.name);
            const nativeName = String(locale.nativeName);
            const subtitle = languageName === nativeName ? undefined : languageName;
            return (
              <Pressable key={locale.id} accessibilityRole="radio" accessibilityState={{ checked: locale.id === activeLocale, disabled: !locale.available }} aria-checked={locale.id === activeLocale} aria-disabled={!locale.available} disabled={!locale.available} onPress={() => onSelect(locale.id)} style={[styles.languageOption, locale.id === activeLocale && styles.languageOptionActive, !locale.available && styles.languageOptionDisabled]}>
                <View style={styles.languageFlag}><FlagIcon language={locale.id} /></View>
                <View style={styles.languageOptionCopy}>
                  <Text style={styles.languageOptionText}>{locale.nativeName}</Text>
                  {subtitle && <Text style={styles.languageOptionSubtitle}>{subtitle}</Text>}
                </View>
                {locale.id === activeLocale ? <Ionicons color={colors.green} name="checkmark-circle" size={20} /> : <View style={styles.languageCheckSpacer} />}
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton label={t.close} onPress={onClose} />
      </View>
    </View>
  );
}

function BottomNav({ active, t, onSelect }: { active: MainTab; t: Ui; onSelect: (tab: MainTab) => void }) {
  const items: Array<{ id: MainTab; label: string; icon: AppIconName }> = [
    { id: 'home', label: t.navHome, icon: 'home' },
    { id: 'review', label: t.navReview, icon: 'learn' },
    { id: 'progress', label: t.navProgress, icon: 'progress' },
    { id: 'profile', label: t.navProfile, icon: 'profile' },
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: active === item.id }} aria-selected={active === item.id} onPress={() => onSelect(item.id)} style={({ pressed }) => [styles.navItem, active === item.id && styles.navItemActive, pressed && styles.navItemPressed]}>
          <AppIcon name={item.icon} active={active === item.id} />
          <Text style={[styles.navLabel, active === item.id && styles.navLabelActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ProfileScreen({ language, pace, preferences, reminder, persistenceWarning, notificationWarning, t, onLanguage, onPace, onReminder, onCustomTime, onNotifications, onHelp, onAbout }: { language: (typeof languageOptions)[number]; pace: (typeof paceOptions)[number]; preferences: Preferences; reminder: (typeof reminderOptions)[number]; persistenceWarning: boolean; notificationWarning: string | null; t: Ui; onLanguage: () => void; onPace: (pace: PaceId) => void; onReminder: (reminder: ReminderId) => void; onCustomTime: (time: string) => void; onNotifications: (enabled: boolean) => void; onHelp: () => void; onAbout: () => void }) {
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const [expandedSetting, setExpandedSetting] = useState<'pace' | 'reminder' | null>(null);
  const paceName = (id: PaceId) => id === 'gentle' ? t.gentle : id === 'focused' ? t.focused : t.standard;
  const reminderName = (id: ReminderId) => id === 'morning' ? t.morning : id === 'afternoon' ? t.afternoon : id === 'evening' ? t.evening : id === 'custom' ? t.customTime : t.noReminders;
  const reminderDetail = (id: ReminderId) => id === 'morning' ? t.morningTime : id === 'afternoon' ? t.afternoonTime : id === 'evening' ? t.eveningTime : id === 'custom' ? t.chooseTime : t.noRemindersBody;
  const notificationsOn = preferences.notificationsEnabled && reminder.id !== 'none';
  const reminderValue = reminder.id === 'none' ? t.off : reminder.id === 'custom' ? preferences.customReminderTime : reminderDetail(reminder.id);
  return (
    <ScrollView contentContainerStyle={[styles.profileContent, compact && styles.profileContentCompact]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.profilePageTitle, compact && styles.profilePageTitleCompact]}>{t.profileTitle}</Text>
      <Text style={[styles.profilePageSubtitle, compact && styles.profilePageSubtitleCompact]}>{t.profileSubtitle}</Text>
      {persistenceWarning && <View style={styles.storageWarning}><Text style={styles.storageWarningTitle}>{t.progressSaveFailed}</Text><Text style={styles.storageWarningText}>{t.progressSaveFailedBody}</Text></View>}

      <ProfileSettingsSection label={t.profileLearning}>
        <ProfileSettingRow
          icon="stats-chart-outline"
          onPress={() => setExpandedSetting(expandedSetting === 'pace' ? null : 'pace')}
          subtitle={t.chosenOnboarding}
          title={t.dailyPace}
          value={paceName(pace.id)}
        />
        {expandedSetting === 'pace' && <View style={styles.profileInlineOptions}>{paceOptions.map((option) => <PreferenceChip key={option.id} layout="equal" selected={pace.id === option.id} label={paceName(option.id)} onPress={() => { onPace(option.id); setExpandedSetting(null); }} />)}</View>}
      </ProfileSettingsSection>

      <ProfileSettingsSection label={t.profileNotifications}>
        <ProfileSettingRow icon="notifications-outline" onPress={() => onNotifications(!notificationsOn)} subtitle={notificationsOn ? t.on : t.off} title={t.notifications} />
        <ProfileSettingRow
          icon="time-outline"
          last={expandedSetting !== 'reminder'}
          onPress={() => setExpandedSetting(expandedSetting === 'reminder' ? null : 'reminder')}
          subtitle={t.dailyReminder}
          title={t.reminder}
          value={reminderValue}
        />
        {expandedSetting === 'reminder' && <View style={styles.profileInlineOptions}>{reminderOptions.map((option) => <PreferenceChip key={option.id} layout="grid" selected={reminder.id === option.id} label={reminderName(option.id)} onPress={() => onReminder(option.id)} />)}{reminder.id === 'custom' && <CustomTimeField t={t} value={preferences.customReminderTime} onSave={onCustomTime} />}</View>}
      </ProfileSettingsSection>
      {notificationWarning && <View accessibilityLiveRegion="polite" style={styles.profileInlineWarning}><Text style={styles.inlineWarningText}>{notificationWarning}</Text></View>}

      <ProfileSettingsSection label={t.profileApp}>
        <ProfileSettingRow icon="globe-outline" last onPress={onLanguage} subtitle={t.appLanguage} title={t.language} value={language.nativeName} />
      </ProfileSettingsSection>

      <ProfileSettingsSection label={t.profileSupport}>
        <ProfileSettingRow icon="person-outline" subtitle={t.guestAccount} title={t.account} />
        <ProfileSettingRow icon="help-circle-outline" onPress={onHelp} subtitle={t.faqsSupport} title={t.help} />
        <ProfileSettingRow icon="information-circle-outline" last onPress={onAbout} subtitle={t.versionInfo} title={t.about} />
      </ProfileSettingsSection>
    </ScrollView>
  );
}

function ProfileSettingsSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.profileSettingsSection}>
      <Text style={styles.profileSettingsLabel}>{label}</Text>
      <View style={styles.profileSettingsCard}>{children}</View>
    </View>
  );
}

function ProfileSettingRow({ icon, last = false, onPress, subtitle, title, value }: { icon: ComponentProps<typeof Ionicons>['name']; last?: boolean; onPress?: () => void; subtitle: string; title: string; value?: string }) {
  const content = (
    <>
      <View style={styles.profileSettingIcon}><Ionicons color="#087B57" name={icon} size={25} /></View>
      <View style={styles.profileSettingCopy}>
        <Text style={styles.profileSettingTitle}>{title}</Text>
        <Text style={styles.profileSettingSubtitle}>{subtitle}</Text>
      </View>
      {value && <Text numberOfLines={1} style={styles.profileSettingValue}>{value}</Text>}
      <Ionicons color="#5F6C76" name="chevron-forward" size={22} />
    </>
  );
  if (!onPress) return <View style={[styles.profileSettingRow, last && styles.profileSettingRowLast]}>{content}</View>;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.profileSettingRow, last && styles.profileSettingRowLast, pressed && styles.lightPressed]}>{content}</Pressable>;
}

function InfoScreen({ kind, t, onBack }: { kind: 'help' | 'about'; t: Ui; onBack: () => void }) {
  const helpItems = [
    { icon: 'learn' as const, title: t.helpLearningTitle, body: t.helpLearningBody },
    { icon: 'help' as const, title: t.helpQuizTitle, body: t.helpQuizBody },
    { icon: 'download' as const, title: t.helpOfflineTitle, body: t.helpOfflineBody },
    { icon: 'bell' as const, title: t.helpReminderTitle, body: t.helpReminderBody },
  ];
  const aboutItems = [
    { icon: 'progress' as const, title: t.aboutCourseTitle, body: t.aboutCourseBody },
    { icon: 'info' as const, title: t.aboutContentTitle, body: t.aboutContentBody },
    { icon: 'profile' as const, title: t.aboutPrivacyTitle, body: t.aboutPrivacyBody },
  ];
  const isHelp = kind === 'help';
  const items = isHelp ? helpItems : aboutItems;
  return (
    <View style={styles.screen}>
      <SimpleHeader backLabel={t.back} title={isHelp ? t.helpTitle : t.aboutTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.infoContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.infoIntro}>{isHelp ? t.helpIntro : t.aboutIntro}</Text>
        <View style={styles.infoList}>
          {items.map((item, index) => (
            <View key={item.title} style={[styles.infoRow, index === items.length - 1 && styles.infoRowLast]}>
              <View style={styles.infoRowIcon}><AppIcon name={item.icon} active /></View>
              <View style={styles.infoRowCopy}><Text style={styles.infoRowTitle}>{item.title}</Text><Text style={styles.infoRowBody}>{item.body}</Text></View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CustomTimeField({ t, value, onSave }: { t: Ui; value: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(draft);
  useEffect(() => setDraft(value), [value]);
  return (
    <View style={styles.profileTimeField}>
      <TextInput
        accessibilityLabel={t.customReminderTime}
        maxLength={5}
        onBlur={() => { if (valid && draft !== value) onSave(draft); }}
        onChangeText={setDraft}
        placeholder="20:00"
        placeholderTextColor="#999D98"
        style={[styles.profileTimeInput, !valid && styles.profileTimeInputInvalid]}
        value={draft}
      />
      <Text style={[styles.profileTimeHint, !valid && styles.profileTimeHintInvalid]}>{valid ? t.customTimeSaved : t.customTimeInvalid}</Text>
    </View>
  );
}

function PreferenceChip({ selected, label, layout, onPress }: { selected: boolean; label: string; layout?: 'equal' | 'grid'; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected} onPress={onPress} style={({ pressed }) => [styles.preferenceChip, layout === 'equal' && styles.preferenceChipEqual, layout === 'grid' && styles.preferenceChipGrid, selected && styles.preferenceChipSelected, pressed && styles.preferenceChipPressed]}><Text numberOfLines={1} style={[styles.preferenceChipText, selected && styles.preferenceChipTextSelected]}>{label}</Text></Pressable>;
}

function SimpleHeader({ backLabel, title, onBack }: { backLabel: string; title: string; onBack: () => void }) {
  return (
    <View style={styles.simpleHeader}>
      <Pressable accessibilityLabel={backLabel} accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.lightPressed]}><Ionicons color={colors.charcoal} name="chevron-back" size={24} /></Pressable>
      <Text style={styles.simpleHeaderTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function PrimaryButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.primaryButtonDisabled, pressed && !disabled && styles.primaryButtonPressed]}>
      <Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>{label}</Text><Ionicons color={disabled ? '#94918A' : colors.white} name="arrow-forward" size={19} style={styles.primaryArrow} />
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.lightPressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

function LessonLandscape({ compact }: { compact: boolean }) {
  return (
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      resizeMode="contain"
      source={require('./assets/lesson-landscape.png')}
      style={[styles.landscapeImage, compact && styles.landscapeImageCompact]}
    />
  );
}

function ReviewFeatureCard({ compact, count, description, disabled, kind, narrow, onPress, title }: { compact: boolean; count: string; description: string; disabled: boolean; kind: 'cards' | 'practice'; narrow: boolean; onPress: () => void; title: string }) {
  return (
    <Pressable
      accessibilityLabel={`${title}. ${description} ${count}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.learnFeatureCard,
        kind === 'practice' && styles.learnFeatureCardQuiz,
        compact && styles.learnFeatureCardCompact,
        disabled && styles.learnFeatureCardDisabled,
        pressed && !disabled && styles.learnFeatureCardPressed,
      ]}
    >
      <View style={[styles.learnCardArt, compact && styles.learnCardArtCompact, narrow && styles.learnCardArtNarrow]}>
        {kind === 'cards' ? (
          <>
            <View style={[styles.flashcardSheet, styles.flashcardSheetBack]} />
            <View style={[styles.flashcardSheet, styles.flashcardSheetMiddle]} />
            <View style={[styles.flashcardSheet, styles.flashcardSheetFront]}>
              <Ionicons color="#3C8B69" name="leaf" size={compact ? 36 : 42} />
            </View>
          </>
        ) : (
          <View style={styles.quizPaper}>
            <View style={styles.quizClip} />
            {[0, 1, 2].map((item) => <View key={item} style={styles.quizLineRow}><View style={styles.quizLineDot} /><View style={[styles.quizLine, item === 2 && styles.quizLineShort]} /></View>)}
            <View style={styles.quizCheck}><Ionicons color={colors.white} name="checkmark" size={17} /></View>
          </View>
        )}
      </View>
      <View style={styles.learnCardCopy}>
        <Text style={[styles.learnCardTitle, compact && styles.learnCardTitleCompact, narrow && styles.learnCardTitleNarrow]}>{title}</Text>
        <Text style={[styles.learnCardDescription, compact && styles.learnCardDescriptionCompact]}>{description}</Text>
        <View style={styles.learnCardCountRow}>
          <Ionicons color="#79827D" name={kind === 'cards' ? 'book-outline' : 'help-circle-outline'} size={21} />
          <Text style={styles.learnCardCount}>{count}</Text>
        </View>
      </View>
      <Ionicons color="#67716C" name="chevron-forward" size={25} />
    </Pressable>
  );
}

function WeekProgressMark({ complete, completedCount, locked }: { complete: boolean; completedCount: number; locked: boolean }) {
  if (complete) {
    return <View style={[styles.weekProgressMark, styles.weekProgressMarkComplete]}><Ionicons color={colors.white} name="checkmark" size={27} /></View>;
  }
  if (locked) {
    return <View style={[styles.weekProgressMark, styles.weekProgressMarkLocked]}><Ionicons color="#68716D" name="lock-closed" size={20} /></View>;
  }
  return (
    <View style={styles.weekProgressMark}>
      {[0, 1, 2, 3, 4, 5, 6].map((segment) => {
        const angle = (-90 + segment * (360 / 7)) * (Math.PI / 180);
        return <View key={segment} style={[styles.weekProgressDot, segment < completedCount && styles.weekProgressDotComplete, { left: 23 + Math.cos(angle) * 18, top: 23 + Math.sin(angle) * 18 }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  homeContent: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 0, paddingBottom: 96 },
  homeHero: { paddingHorizontal: 4, paddingTop: 30 },
  homeHeroCompact: { paddingTop: 20 },
  homeDayTitle: { maxWidth: 330, color: '#07141B', fontFamily: fonts.displayBold, fontSize: 36, lineHeight: 45, fontWeight: '700', letterSpacing: -0.6 },
  homeDayTitleCompact: { fontSize: 33, lineHeight: 39 },
  homeDayTitleNarrow: { fontSize: 30, lineHeight: 36 },
  homeTagline: { maxWidth: 310, color: '#65707B', fontSize: 16, lineHeight: 23, marginTop: 3 },
  homeTaglineCompact: { fontSize: 15, lineHeight: 21, marginTop: 1 },
  dayRail: { flexDirection: 'row', alignItems: 'center', marginTop: 26, marginHorizontal: 7 },
  dayRailCompact: { marginTop: 18 },
  dayRailTrack: { position: 'absolute', left: '7.143%', right: '7.143%', top: 18, height: 2, backgroundColor: '#DFE1DC', zIndex: 0 },
  dayRailTrackCompact: { top: 16 },
  dayRailTrackComplete: { right: undefined, backgroundColor: '#62A784' },
  dayRailItem: { flex: 1, alignItems: 'center', position: 'relative' },
  dayRailDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFEFEB', zIndex: 1 },
  dayRailDotCompact: { width: 32, height: 32, borderRadius: 16 },
  dayRailDotComplete: { backgroundColor: '#58A27D' },
  dayRailDotCurrent: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#006B50' },
  dayRailDotCurrentCompact: { width: 35, height: 35, borderRadius: 18 },
  dayRailText: { color: '#5D6873', fontSize: 14, fontWeight: '500' },
  dayRailTextCompact: { fontSize: 13 },
  dayRailTextActive: { color: colors.white, fontSize: 15 },
  featuredLessonCard: { position: 'relative', marginTop: 30, borderRadius: 18, paddingHorizontal: 27, paddingTop: 25, paddingBottom: 20, backgroundColor: '#FFFDFC', borderWidth: 1, borderColor: '#ECEBE6', overflow: 'hidden', shadowColor: '#B9B6AC', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.13, shadowRadius: 16, elevation: 4 },
  featuredLessonCardCompact: { marginTop: 22, paddingHorizontal: 23, paddingTop: 20 },
  featuredLessonCardNarrow: { paddingHorizontal: 20 },
  featuredEyebrow: { width: '100%', color: '#5E6A76', fontSize: 10, lineHeight: 15, fontWeight: '600', letterSpacing: 2.3, textAlign: 'left' },
  featuredMain: { position: 'relative', minHeight: 225, marginTop: 22 },
  featuredMainCompact: { minHeight: 196, marginTop: 15 },
  featuredCopy: { maxWidth: 242, zIndex: 3 },
  featuredCopyCompact: { maxWidth: 225 },
  featuredTitle: { maxWidth: 260, color: '#06131B', fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 40, fontWeight: '700', letterSpacing: -0.35 },
  featuredTitleCompact: { fontSize: 29, lineHeight: 34 },
  featuredTitleNarrow: { fontSize: 27, lineHeight: 32 },
  featuredSubtitle: { maxWidth: 225, color: '#52616B', fontSize: 16, lineHeight: 24, marginTop: 9, marginLeft: -6, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 9, backgroundColor: 'rgba(255,253,252,0.82)' },
  featuredSubtitleCompact: { maxWidth: 215, fontSize: 15, lineHeight: 21, marginTop: 7 },
  lessonMetaRow: { minHeight: 33, flexDirection: 'row', alignItems: 'center', marginTop: 3, marginBottom: 15, zIndex: 4 },
  lessonMetaRowCompact: { marginTop: 0, marginBottom: 10 },
  lessonMetaRowNarrow: { paddingHorizontal: 0 },
  lessonMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  lessonMetaText: { color: '#596572', fontSize: 13, lineHeight: 19 },
  lessonMetaDivider: { width: 1, height: 24, backgroundColor: '#E5E3DE', marginHorizontal: 16 },
  featuredButton: { marginHorizontal: 5, zIndex: 5 },
  featuredButtonCompact: { marginHorizontal: 3 },
  learnContent: { flexGrow: 1, paddingHorizontal: 7, paddingTop: 29, paddingBottom: 104 },
  learnContentCompact: { paddingTop: 20, paddingBottom: 92 },
  learnHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingHorizontal: 12 },
  learnHeaderCopy: { flex: 1, minWidth: 0 },
  learnTitle: { color: '#07141B', fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 48, fontWeight: '700', letterSpacing: -0.8 },
  learnTitleCompact: { fontSize: 34, lineHeight: 41 },
  learnSubtitle: { maxWidth: 300, color: '#65707B', fontSize: 16, lineHeight: 23, marginTop: 4 },
  learnSubtitleCompact: { fontSize: 15, lineHeight: 21 },
  learnCardList: { gap: 14, marginTop: 34 },
  learnCardListCompact: { gap: 11, marginTop: 24 },
  progressContent: { flexGrow: 1, paddingHorizontal: 7, paddingTop: 29, paddingBottom: 104 },
  progressContentCompact: { paddingTop: 20, paddingBottom: 92 },
  progressPageTitle: { color: '#07141B', fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 48, fontWeight: '700', letterSpacing: -0.8 },
  progressPageTitleCompact: { fontSize: 35, lineHeight: 42 },
  progressPageSubtitle: { color: '#65707B', fontSize: 16, lineHeight: 23, marginTop: 2 },
  progressPageSubtitleCompact: { fontSize: 15, lineHeight: 21 },
  weekJourneyList: { gap: 10, marginTop: 25 },
  weekJourneyListCompact: { gap: 8, marginTop: 19 },
  weekJourneyCard: { borderRadius: 16, borderWidth: 1, borderColor: '#E8E5DE', backgroundColor: '#FFFDF8', overflow: 'hidden', shadowColor: '#8C887F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 9, elevation: 2 },
  weekJourneyCardExpanded: { paddingBottom: 8 },
  weekJourneyHeader: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 13 },
  weekJourneyHeaderCompact: { minHeight: 76, paddingVertical: 10 },
  weekJourneyCopy: { flex: 1, minWidth: 0 },
  weekJourneyTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  weekJourneyNumber: { color: '#101B23', fontSize: 14, lineHeight: 20, fontWeight: '800' },
  weekJourneyTitle: { flex: 1, color: '#122029', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  weekJourneyRange: { color: '#8B918D', fontSize: 12, lineHeight: 17, marginTop: 2 },
  weekJourneyCount: { color: '#16815D', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'right' },
  weekJourneyCountComplete: { color: '#07885E' },
  dayJourneyList: { paddingHorizontal: 13, paddingBottom: 2 },
  dayJourneyRow: { minHeight: 52, flexDirection: 'row' },
  dayJourneyRail: { position: 'relative', width: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  dayJourneyLine: { position: 'absolute', top: 26, bottom: -26, width: 1.5, backgroundColor: '#AEB5B2' },
  dayJourneyLineComplete: { backgroundColor: '#5BB98F' },
  dayJourneyMark: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#9DA5A1', backgroundColor: '#FFFDF8', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dayJourneyMarkComplete: { width: 23, height: 23, borderRadius: 12, borderWidth: 0, backgroundColor: '#25A46F' },
  dayJourneyMarkActive: { width: 21, height: 21, borderRadius: 11, borderWidth: 3, borderColor: '#149266', backgroundColor: '#FFFDF8' },
  dayJourneyButton: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#ECEAE4' },
  dayJourneyButtonActive: { borderBottomWidth: 0, borderRadius: 13, backgroundColor: '#E8F4EC' },
  dayJourneyButtonPressed: { opacity: 0.72 },
  dayJourneyNumber: { width: 57, flexShrink: 0, color: '#5B6670', fontSize: 12, lineHeight: 18, fontWeight: '600' },
  dayJourneyTextLocked: { color: '#77807C' },
  dayJourneyTitle: { flex: 1, minWidth: 0, color: '#33404A', fontSize: 13, lineHeight: 18, fontWeight: '500' },
  landscapeImage: { position: 'absolute', right: -6, top: -5, width: 396, height: 264, opacity: 0.96, zIndex: 1 },
  landscapeImageCompact: { right: -20, top: -13, width: 370, height: 247 },
  learnFeatureCard: { minHeight: 174, borderRadius: 20, borderWidth: 1, borderColor: '#D9E6DC', backgroundColor: '#EAF3ED', flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 18, paddingVertical: 18, overflow: 'hidden' },
  learnFeatureCardQuiz: { borderColor: '#E7E0D2', backgroundColor: '#F4EFE5' },
  learnFeatureCardCompact: { minHeight: 150, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 15, gap: 13 },
  learnFeatureCardDisabled: { opacity: 0.52 },
  learnFeatureCardPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  learnCardArt: { width: 112, height: 128, alignItems: 'center', justifyContent: 'center' },
  learnCardArtCompact: { width: 96, height: 110 },
  learnCardArtNarrow: { width: 82 },
  flashcardSheet: { position: 'absolute', width: 82, height: 98, borderRadius: 11, shadowColor: '#335A48', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 9, elevation: 3 },
  flashcardSheetBack: { backgroundColor: '#A7CDB7', transform: [{ rotate: '-12deg' }, { translateX: -9 }] },
  flashcardSheetMiddle: { backgroundColor: '#C2DDCB', transform: [{ rotate: '-5deg' }, { translateX: -3 }] },
  flashcardSheetFront: { backgroundColor: '#FFFDF7', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '5deg' }] },
  quizPaper: { width: 82, height: 101, borderRadius: 10, backgroundColor: '#FFFDF8', paddingHorizontal: 14, paddingTop: 29, shadowColor: '#6B6151', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.12, shadowRadius: 9, elevation: 3, transform: [{ rotate: '-5deg' }] },
  quizClip: { position: 'absolute', top: -10, left: 24, width: 36, height: 20, borderRadius: 7, backgroundColor: '#7E827F' },
  quizLineRow: { height: 18, flexDirection: 'row', alignItems: 'center', gap: 7 },
  quizLineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#BEC1BE' },
  quizLine: { height: 6, flex: 1, borderRadius: 3, backgroundColor: '#D9DCD8' },
  quizLineShort: { flex: 0, width: 29 },
  quizCheck: { position: 'absolute', right: -6, bottom: 9, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0C7556', shadowColor: '#0C6048', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 5, elevation: 3 },
  learnCardCopy: { flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center' },
  learnCardTitle: { color: '#07141B', fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  learnCardTitleCompact: { fontSize: 22, lineHeight: 27 },
  learnCardTitleNarrow: { fontSize: 20, lineHeight: 25 },
  learnCardDescription: { color: '#66706B', fontSize: 14, lineHeight: 20, marginTop: 7 },
  learnCardDescriptionCompact: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  learnCardCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  learnCardCount: { color: '#626B67', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  weekProgressMark: { position: 'relative', width: 52, height: 52, borderRadius: 26, flexShrink: 0, backgroundColor: '#E9F4ED', alignItems: 'center', justifyContent: 'center' },
  weekProgressMarkComplete: { backgroundColor: '#24A36D' },
  weekProgressMarkLocked: { backgroundColor: '#EEF0EF' },
  weekProgressDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#CDE7D9' },
  weekProgressDotComplete: { backgroundColor: '#079668' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { backgroundColor: '#D9D5CD' },
  primaryButtonTextDisabled: { color: '#94918A' },
  primaryArrow: { color: colors.white, fontSize: 20, marginLeft: 10, marginTop: -1 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ECE6DB', alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 42 },
  lightPressed: { opacity: 0.7 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(23, 31, 27, 0.34)', justifyContent: 'flex-end' },
  sheetDismissArea: { position: 'absolute', inset: 0 },
  sourceSheetTitle: { color: colors.charcoal, fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 31, fontWeight: '700' },
  sourceSheetScroll: { paddingBottom: 4 },
  sourceRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 15 },
  sourceReference: { color: colors.charcoal, fontSize: 15, fontWeight: '800', marginTop: 5 },
  languageContent: { paddingHorizontal: 25, paddingTop: 28 },
  languageTitle: { color: colors.charcoal, fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 40, fontWeight: '700', letterSpacing: -0.45 },
  languageBody: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10, marginBottom: 24 },
  languageList: { gap: 10, marginBottom: 18 },
  languageOption: { minHeight: 64, borderWidth: 1.5, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  languageOptionActive: { borderColor: colors.green, backgroundColor: '#EDF4EF' },
  languageOptionDisabled: { opacity: 0.58, backgroundColor: '#F2EFE8' },
  languageFlag: { width: 35, alignItems: 'center' },
  languageOptionCopy: { flex: 1, marginLeft: 12 },
  languageOptionText: { color: colors.charcoal, fontSize: 15, fontWeight: '700', textAlign: 'left', writingDirection: 'ltr' },
  languageOptionSubtitle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  languageCheckSpacer: { width: 20, height: 20 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 78, paddingHorizontal: 9, paddingTop: 7, paddingBottom: 7, backgroundColor: '#FFFEFB', borderTopWidth: 1, borderTopColor: '#E6E6E1', flexDirection: 'row', gap: 5, zIndex: 10 },
  navItem: { flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navItemActive: { backgroundColor: '#E7F1EA' },
  navItemPressed: { transform: [{ translateY: 1 }, { scale: 0.92 }] },
  navLabel: { color: '#626D78', fontSize: 12, fontWeight: '500' },
  navLabelActive: { color: colors.green, fontWeight: '800' },
  profileContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 29, paddingBottom: 104 },
  profileContentCompact: { paddingTop: 20, paddingBottom: 92 },
  profilePageTitle: { color: '#07141B', fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 48, fontWeight: '700', letterSpacing: -0.8 },
  profilePageTitleCompact: { fontSize: 35, lineHeight: 42 },
  profilePageSubtitle: { color: '#65707B', fontSize: 16, lineHeight: 23, marginTop: 2 },
  profilePageSubtitleCompact: { fontSize: 15, lineHeight: 21 },
  profileSettingsSection: { marginTop: 18 },
  profileSettingsLabel: { color: '#57636C', fontSize: 10, lineHeight: 15, fontWeight: '700', letterSpacing: 1.8, marginBottom: 6, marginLeft: 12 },
  profileSettingsCard: { borderRadius: 14, borderWidth: 1, borderColor: '#E8E5DE', backgroundColor: '#FFFDF8', overflow: 'hidden', shadowColor: '#8C887F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 1 },
  profileSettingRow: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E9E7E1' },
  profileSettingRowLast: { borderBottomWidth: 0 },
  profileSettingIcon: { width: 38, height: 38, borderRadius: 19, flexShrink: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4F2E9' },
  profileSettingCopy: { flex: 1, minWidth: 0 },
  profileSettingTitle: { color: '#101B23', fontSize: 14, lineHeight: 18, fontWeight: '700' },
  profileSettingSubtitle: { color: '#727A80', fontSize: 11, lineHeight: 15, marginTop: 1 },
  profileSettingValue: { maxWidth: 88, color: '#56616A', fontSize: 12, lineHeight: 17, fontWeight: '500', textAlign: 'right' },
  profileInlineOptions: { borderTopWidth: 1, borderTopColor: '#E9E7E1', padding: 12, backgroundColor: '#FAF8F2' },
  profileInlineWarning: { borderRadius: 12, borderWidth: 1, borderColor: '#D8A85D', backgroundColor: colors.amber, padding: 11, marginTop: 8 },
  storageWarning: { borderRadius: 13, borderWidth: 1, borderColor: '#D8A85D', backgroundColor: colors.amber, padding: 13, marginTop: 14 },
  storageWarningTitle: { color: colors.amberText, fontSize: 13, fontWeight: '800' },
  storageWarningText: { color: colors.amberText, fontSize: 11, lineHeight: 16, marginTop: 3 },
  inlineWarningText: { flex: 1, color: colors.amberText, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  preferenceChip: { minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  preferenceChipEqual: { flex: 1, minWidth: 0, paddingHorizontal: 7 },
  preferenceChipGrid: { flexBasis: '47%', flexGrow: 1, paddingHorizontal: 8 },
  preferenceChipSelected: { borderColor: colors.green, backgroundColor: colors.green },
  preferenceChipPressed: { transform: [{ scale: 0.96 }] },
  preferenceChipText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  preferenceChipTextSelected: { color: colors.white },
  profileTimeField: { marginTop: 12 },
  profileTimeInput: { minHeight: 46, borderRadius: 10, borderWidth: 1.5, borderColor: colors.green, backgroundColor: colors.background, color: colors.charcoal, fontFamily: fonts.bold, fontSize: 17, fontWeight: '700', paddingHorizontal: 13 },
  profileTimeInputInvalid: { borderColor: '#C58A37' },
  profileTimeHint: { color: colors.muted, fontSize: 10, marginTop: 6 },
  profileTimeHintInvalid: { color: colors.amberText },
  infoContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 34 },
  infoIntro: { color: colors.muted, fontSize: 16, lineHeight: 24, marginHorizontal: 4 },
  infoList: { marginTop: 22, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: 17, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoRowLast: { borderBottomWidth: 0 },
  infoRowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  infoRowCopy: { flex: 1 },
  infoRowTitle: { color: colors.charcoal, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  infoRowBody: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, alignItems: 'center', backgroundColor: '#ECE8DF' },
  phoneFrame: { width: '100%', maxWidth: 430, flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  screen: { flex: 1, minHeight: 0 },
  readingColumn: { width: '100%', maxWidth: 660, alignSelf: 'center', padding: 28, gap: 22 },
  eyebrow: { color: colors.green, fontSize: 11, lineHeight: 18, letterSpacing: 1.3, fontWeight: '600', marginBottom: 18 },
  smallLabel: { color: colors.muted, fontSize: 10, lineHeight: 17, letterSpacing: 1.3, fontWeight: '600' },
  readingListRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.line },
  readingListTitle: { color: colors.charcoal, fontSize: 16, lineHeight: 24 },
  articleContent: { width: '100%', maxWidth: 672, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 56 },
  readerTools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 32 },
  textLink: { color: colors.green, fontSize: 14, lineHeight: 23, fontWeight: '600' },
  articleTitle: { fontFamily: fonts.display, fontSize: 34, lineHeight: 45, color: colors.green, letterSpacing: -0.5, marginBottom: 32 },
  articleSection: { marginBottom: 32 },
  sectionHeading: { fontFamily: fonts.display, fontSize: 23, lineHeight: 32, color: colors.green, marginBottom: 12 },
  openingHeading: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, marginBottom: 12 },
  prose: { fontSize: 17, lineHeight: 29, color: '#37443B', marginBottom: 14 },
  leadProse: { fontSize: 19, lineHeight: 32, color: '#344739' },
  exampleSection: { backgroundColor: '#EDE5D7', borderRadius: 18, padding: 24, gap: 9 },
  distinctionSection: { borderLeftWidth: 2, borderLeftColor: '#72917B', paddingLeft: 20, marginBottom: 32, paddingVertical: 4 },
  reflectionSection: { backgroundColor: '#E4EDE2', borderRadius: 18, padding: 24, marginBottom: 32 },
  reflectionHeading: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, color: colors.muted },
  reflectionProse: { fontFamily: fonts.display, color: colors.green, fontSize: 21, lineHeight: 33 },
  articleEnding: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 26, marginTop: 4 },
  endingPreview: { color: colors.muted, fontSize: 14, lineHeight: 23, marginBottom: 24 },
  readerPageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sourceReadLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 18, marginBottom: 24 },
  promptProse: { color: colors.charcoal, fontSize: 20, lineHeight: 33, marginBottom: 28 },
  reflectionHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderRadius: 14, backgroundColor: colors.mint, padding: 15, marginBottom: 16 },
  reflectionHintText: { flex: 1, color: colors.mintDark, fontSize: 14, lineHeight: 21 },
  meaningOptions: { gap: 14, marginBottom: 18 },
  meaningOption: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 20, borderWidth: 1, borderColor: '#CACDBF', borderRadius: 16, backgroundColor: colors.surface },
  meaningOptionSelected: { borderColor: colors.green, backgroundColor: colors.mint },
  meaningOptionIncorrect: { borderColor: '#B96E24', backgroundColor: '#F8E5CF' },
  meaningOptionText: { flex: 1, fontSize: 16, lineHeight: 26, color: colors.charcoal },
  choiceDot: { width: 16, height: 16, borderRadius: 8, borderColor: '#738273', borderWidth: 1, marginTop: 5 },
  choiceDotSelected: { borderWidth: 5, borderColor: colors.green },
  choiceDotIncorrect: { borderColor: '#B96E24' },
  meaningExplanation: { borderTopWidth: 1, borderTopColor: '#9CAD9B', marginTop: 20, paddingTop: 24, marginBottom: 26, gap: 12 },
  nextReading: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 24, marginBottom: 28, gap: 8 },
  emptyNote: { color: colors.muted, fontSize: 16, lineHeight: 26, marginBottom: 24 },
  noteFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  noteFilter: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: colors.line },
  noteFilterSelected: { backgroundColor: colors.green, borderColor: colors.green },
  noteFilterTextSelected: { color: colors.white, fontSize: 14, lineHeight: 23, fontWeight: '600' },
  savedNotice: { color: colors.green, fontSize: 14, lineHeight: 24, marginBottom: 18 },
  saveNotice: { padding: 12, backgroundColor: colors.amber, gap: 4 },
  saveNoticeText: { color: colors.amberText, fontSize: 13, lineHeight: 20 },
  sourceSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  closeSource: { padding: 10 },
  translationBlock: { backgroundColor: colors.surface, padding: 18, borderRadius: 12, marginVertical: 20 },
  explanationBlock: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 22, marginBottom: 20 },
  primaryButton: { minHeight: 56, borderRadius: 28, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 20, gap: 14, marginTop: 4 },
  primaryButtonPressed: { backgroundColor: colors.greenPressed },
  primaryButtonText: { flexShrink: 1, color: colors.white, fontSize: 16, lineHeight: 24, fontWeight: '600', textAlign: 'center' },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12, marginTop: 8 },
  secondaryButtonText: { color: colors.green, fontSize: 14, lineHeight: 23, textAlign: 'center' },
  simpleHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.line },
  simpleHeaderTitle: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 12 },
  sourceSheet: { width: '100%', maxWidth: 720, alignSelf: 'center', maxHeight: '90%', backgroundColor: colors.background, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sourceArabic: { color: colors.charcoal, fontSize: 26, lineHeight: 48, textAlign: 'right', writingDirection: 'rtl', marginTop: 12, fontFamily: Platform.OS === 'web' ? 'serif' : undefined },
  sourceTranslation: { color: colors.charcoal, fontSize: 17, lineHeight: 29 },
  sourceNote: { color: colors.charcoal, fontSize: 16, lineHeight: 27, marginBottom: 18 },
  sourceSectionLabel: { color: colors.muted, fontSize: 10, letterSpacing: 1.4, lineHeight: 18, marginBottom: 10 },
  sourceTranslationName: { color: colors.muted, fontSize: 12, marginTop: 14 }
});
