import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { lessons, quizConcepts, type ConceptId } from './src/content';

type Screen =
  | { name: 'home' }
  | { name: 'lesson'; lessonIndex: number }
  | { name: 'quiz' }
  | { name: 'complete' };

type Feedback = {
  kind: 'correct' | 'retry';
  title: string;
  body: string;
};

const colors = {
  background: '#F6F1E8',
  surface: '#FFFCF6',
  charcoal: '#242A26',
  muted: '#6D746F',
  green: '#174D3A',
  greenPressed: '#103B2C',
  mint: '#DDEDE3',
  mintDark: '#2F6B51',
  line: '#E5DED1',
  amber: '#F4DFC0',
  amberText: '#785227',
  gold: '#D7A83B',
  white: '#FFFFFF',
};

const initialQueue = quizConcepts.map((concept) => concept.id);

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [completedLessons, setCompletedLessons] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [quizQueue, setQuizQueue] = useState<ConceptId[]>(initialQueue);
  const [misses, setMisses] = useState<Partial<Record<ConceptId, number>>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [points, setPoints] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const celebration = useRef(new Animated.Value(0)).current;

  const dailyCompleted =
    completedLessons.filter(Boolean).length + (quizComplete ? 1 : 0);

  useEffect(() => {
    Animated.spring(progressAnimation, {
      toValue: dailyCompleted / 4,
      damping: 18,
      stiffness: 120,
      mass: 0.7,
      useNativeDriver: false,
    }).start();
  }, [dailyCompleted, progressAnimation]);

  useEffect(() => {
    if (screen.name !== 'complete') return;
    Animated.spring(celebration, {
      toValue: 1,
      damping: 11,
      stiffness: 110,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [celebration, screen.name]);

  const nextLessonIndex = completedLessons.findIndex((complete) => !complete);

  function continueDailyGoal() {
    if (nextLessonIndex >= 0) {
      setSourcesOpen(false);
      setScreen({ name: 'lesson', lessonIndex: nextLessonIndex });
      return;
    }
    setScreen(quizComplete ? { name: 'complete' } : { name: 'quiz' });
  }

  function completeLesson(lessonIndex: number) {
    if (!completedLessons[lessonIndex]) {
      setCompletedLessons((current) =>
        current.map((complete, index) =>
          index === lessonIndex ? true : complete,
        ),
      );
      setPoints((current) => current + 10);
    }

    setSourcesOpen(false);
    setScreen(
      lessonIndex < lessons.length - 1
        ? { name: 'lesson', lessonIndex: lessonIndex + 1 }
        : { name: 'quiz' },
    );
  }

  function toggleAnswer(answer: string, multiple: boolean) {
    if (feedback) return;
    if (!multiple) {
      setSelectedAnswers([answer]);
      return;
    }
    setSelectedAnswers((current) =>
      current.includes(answer)
        ? current.filter((item) => item !== answer)
        : [...current, answer],
    );
  }

  function checkAnswer() {
    const conceptId = quizQueue[0];
    if (!conceptId || selectedAnswers.length === 0) return;
    const concept = quizConcepts.find((item) => item.id === conceptId);
    if (!concept) return;

    const variantIndex = Math.min(
      misses[conceptId] ?? 0,
      concept.variants.length - 1,
    );
    const expected = [...concept.variants[variantIndex].answers].sort().join('|');
    const received = [...selectedAnswers].sort().join('|');

    if (expected === received) {
      setFeedback({
        kind: 'correct',
        title: 'Exactly! 🔥',
        body: concept.confirmation,
      });
      return;
    }

    const nextMissCount = (misses[conceptId] ?? 0) + 1;
    setMisses((current) => ({ ...current, [conceptId]: nextMissCount }));
    setFeedback({
      kind: 'retry',
      title:
        nextMissCount === 1
          ? 'So close.'
          : nextMissCount === 2
            ? "Let's make this simpler."
            : "Here's an example.",
      body: concept.reteach[Math.min(nextMissCount - 1, 2)],
    });
  }

  function continueQuiz() {
    const conceptId = quizQueue[0];
    if (!conceptId || !feedback) return;
    setSelectedAnswers([]);

    if (feedback.kind === 'retry') {
      setQuizQueue((current) => [...current.slice(1), current[0]]);
      setFeedback(null);
      return;
    }

    setPoints((current) => current + 20);
    const remaining = quizQueue.slice(1);
    setQuizQueue(remaining);
    setFeedback(null);

    if (remaining.length === 0) {
      const perfectBonus = Object.keys(misses).length === 0 ? 50 : 0;
      setPoints((current) => current + 200 + perfectBonus);
      setQuizComplete(true);
      setScreen({ name: 'complete' });
    }
  }

  function resetDemo() {
    setCompletedLessons([false, false, false]);
    setQuizQueue(initialQueue);
    setMisses({});
    setSelectedAnswers([]);
    setFeedback(null);
    setQuizComplete(false);
    setPoints(0);
    setSourcesOpen(false);
    progressAnimation.setValue(0);
    celebration.setValue(0);
    setScreen({ name: 'home' });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.phoneFrame}>
          {screen.name === 'home' && (
            <HomeScreen
              completedLessons={completedLessons}
              dailyCompleted={dailyCompleted}
              points={points}
              progressAnimation={progressAnimation}
              quizComplete={quizComplete}
              onContinue={continueDailyGoal}
            />
          )}
          {screen.name === 'lesson' && (
            <LessonScreen
              lessonIndex={screen.lessonIndex}
              sourcesOpen={sourcesOpen}
              onBack={() => setScreen({ name: 'home' })}
              onContinue={() => completeLesson(screen.lessonIndex)}
              onToggleSources={() => setSourcesOpen((current) => !current)}
            />
          )}
          {screen.name === 'quiz' && (
            <QuizScreen
              feedback={feedback}
              misses={misses}
              quizQueue={quizQueue}
              selectedAnswers={selectedAnswers}
              onBack={() => setScreen({ name: 'home' })}
              onCheck={checkAnswer}
              onContinue={continueQuiz}
              onToggleAnswer={toggleAnswer}
            />
          )}
          {screen.name === 'complete' && (
            <CompleteScreen
              celebration={celebration}
              misses={misses}
              points={points}
              onHome={() => setScreen({ name: 'home' })}
              onReset={resetDemo}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <View style={styles.brandMoon} />
      </View>
      <Text style={styles.brandText}>Islam, Simply</Text>
    </View>
  );
}

function HomeScreen({
  completedLessons,
  dailyCompleted,
  points,
  progressAnimation,
  quizComplete,
  onContinue,
}: {
  completedLessons: boolean[];
  dailyCompleted: number;
  points: number;
  progressAnimation: Animated.Value;
  quizComplete: boolean;
  onContinue: () => void;
}) {
  const minutesLeft = quizComplete ? 0 : Math.max(2, 10 - dailyCompleted * 2);
  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScrollView
      contentContainerStyle={styles.homeContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.homeTopRow}>
        <Brand />
        <View style={styles.pointsPill}>
          <Text style={styles.pointsSpark}>✦</Text>
          <Text style={styles.pointsText}>{points}</Text>
        </View>
      </View>

      <View style={styles.eyebrowRow}>
        <View style={styles.eyebrowLine} />
        <Text style={styles.eyebrow}>YOUR LEARNING PATH</Text>
      </View>
      <Text style={styles.homeTitle}>Day 8 of 28</Text>
      <Text style={styles.homeSubtitle}>
        {quizComplete
          ? 'Today’s learning is complete. Nicely done.'
          : 'A few clear ideas. About ten quiet minutes.'}
      </Text>

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.cardLabel}>TODAY’S GOAL</Text>
            <Text style={styles.goalCount}>{dailyCompleted} of 4 complete</Text>
          </View>
          <View style={styles.standardPill}>
            <Text style={styles.standardText}>STANDARD</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <View style={styles.steps}>
          {lessons.map((lesson, index) => (
            <GoalStep
              key={lesson.id}
              active={!quizComplete && completedLessons.findIndex((done) => !done) === index}
              complete={completedLessons[index]}
              label={`Lesson ${22 + index}`}
              title={lesson.title}
            />
          ))}
          <GoalStep
            active={completedLessons.every(Boolean) && !quizComplete}
            complete={quizComplete}
            label="Quiz"
            locked={!completedLessons.every(Boolean)}
            title="Make it stick"
          />
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeIcon}>◷</Text>
          <Text style={styles.timeText}>
            {quizComplete ? 'Goal complete for today' : `About ${minutesLeft} minutes left`}
          </Text>
        </View>
        <PrimaryButton
          label={quizComplete ? 'View what you learned' : 'Continue'}
          onPress={onContinue}
        />
      </View>

      <View style={styles.statRow}>
        <Stat value={`${24 + completedLessons.filter(Boolean).length} / 84`} label="lessons" />
        <View style={styles.statDivider} />
        <Stat value={quizComplete ? '8' : '7'} label="quizzes" />
        <View style={styles.statDivider} />
        <Stat value="🔥 6" label="day streak" />
      </View>

      <View style={styles.thoughtCard}>
        <Text style={styles.thoughtQuote}>“</Text>
        <View style={styles.thoughtCopy}>
          <Text style={styles.thoughtLabel}>A THOUGHT FOR TODAY</Text>
          <Text style={styles.thoughtText}>
            Learning is not about rushing. It is about seeing one thing clearly.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function GoalStep({
  active,
  complete,
  label,
  locked = false,
  title,
}: {
  active: boolean;
  complete: boolean;
  label: string;
  locked?: boolean;
  title: string;
}) {
  return (
    <View style={styles.stepRow}>
      <View
        style={[
          styles.stepDot,
          complete && styles.stepDotComplete,
          active && styles.stepDotActive,
        ]}
      >
        <Text style={[styles.stepDotText, complete && styles.stepDotTextComplete]}>
          {complete ? '✓' : locked ? '⌁' : ''}
        </Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
        <Text style={[styles.stepTitle, locked && styles.stepTitleLocked]}>{title}</Text>
      </View>
      {active && (
        <View style={styles.nowPill}>
          <Text style={styles.nowText}>NEXT</Text>
        </View>
      )}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LessonScreen({
  lessonIndex,
  sourcesOpen,
  onBack,
  onContinue,
  onToggleSources,
}: {
  lessonIndex: number;
  sourcesOpen: boolean;
  onBack: () => void;
  onContinue: () => void;
  onToggleSources: () => void;
}) {
  const lesson = lessons[lessonIndex];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        label={`Lesson ${lessonIndex + 1} of ${lessons.length}`}
        progress={(lessonIndex + 0.35) / lessons.length}
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.lessonContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lessonNumber}>
          <Text style={styles.lessonNumberText}>{String(lessonIndex + 1).padStart(2, '0')}</Text>
        </View>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.shortAnswer}>{lesson.shortAnswer}</Text>
        <View style={styles.lessonRule} />
        <Text style={styles.lessonBody}>{lesson.explanation}</Text>

        <InfoCard label="FOR EXAMPLE" tone="green" text={lesson.example} />
        <InfoCard
          label="A COMMON CONFUSION"
          tone="amber"
          text={lesson.commonConfusion}
        />

        <View style={styles.rememberCard}>
          <View style={styles.rememberIcon}>
            <Text style={styles.rememberIconText}>✦</Text>
          </View>
          <View style={styles.rememberCopy}>
            <Text style={styles.rememberLabel}>REMEMBER THIS</Text>
            <Text style={styles.rememberText}>{lesson.remember}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onToggleSources}
          style={({ pressed }) => [styles.sourceButton, pressed && styles.lightPressed]}
        >
          <View>
            <Text style={styles.sourceButtonTitle}>Where does this come from?</Text>
            <Text style={styles.sourceButtonSubtitle}>Quran and scholarly context</Text>
          </View>
          <Text style={styles.sourceChevron}>{sourcesOpen ? '−' : '+'}</Text>
        </Pressable>

        {sourcesOpen && (
          <View style={styles.sourcesPanel}>
            {lesson.sources.map((source) => (
              <View key={source.reference} style={styles.sourceItem}>
                <Text style={styles.sourceType}>{source.type.toUpperCase()}</Text>
                <Text style={styles.sourceReference}>{source.reference}</Text>
                <Text style={styles.sourceNote}>{source.note}</Text>
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          label={lessonIndex === lessons.length - 1 ? 'Start the quiz' : 'Continue'}
          onPress={onContinue}
        />
      </ScrollView>
    </View>
  );
}

function InfoCard({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: 'green' | 'amber';
}) {
  return (
    <View style={[styles.infoCard, tone === 'amber' && styles.infoCardAmber]}>
      <Text style={[styles.infoLabel, tone === 'amber' && styles.infoLabelAmber]}>
        {label}
      </Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function ScreenHeader({
  label,
  progress,
  onBack,
}: {
  label: string;
  progress: number;
  onBack: () => void;
}) {
  return (
    <View style={styles.screenHeader}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.lightPressed]}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerLabel}>{label}</Text>
        <View style={styles.headerProgressTrack}>
          <View style={[styles.headerProgressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function QuizScreen({
  feedback,
  misses,
  quizQueue,
  selectedAnswers,
  onBack,
  onCheck,
  onContinue,
  onToggleAnswer,
}: {
  feedback: Feedback | null;
  misses: Partial<Record<ConceptId, number>>;
  quizQueue: ConceptId[];
  selectedAnswers: string[];
  onBack: () => void;
  onCheck: () => void;
  onContinue: () => void;
  onToggleAnswer: (answer: string, multiple: boolean) => void;
}) {
  const conceptId = quizQueue[0];
  const concept = quizConcepts.find((item) => item.id === conceptId);
  const question = useMemo(() => {
    if (!concept || !conceptId) return null;
    const currentMisses = misses[conceptId] ?? 0;
    const variantIndex = Math.min(
      feedback?.kind === 'retry' ? Math.max(0, currentMisses - 1) : currentMisses,
      concept.variants.length - 1,
    );
    return concept.variants[variantIndex];
  }, [concept, conceptId, feedback?.kind, misses]);

  if (!concept || !question) return null;
  const masteredCount = quizConcepts.length - quizQueue.length;
  const questionNumber = Math.min(masteredCount + 1, quizConcepts.length);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        label={`Question ${questionNumber} of ${quizConcepts.length}`}
        progress={masteredCount / quizConcepts.length}
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.quizContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizTypeRow}>
          <Text style={styles.quizType}>{question.type}</Text>
          {(misses[conceptId] ?? 0) > 0 && feedback?.kind !== 'retry' && (
            <Text style={styles.returnedLabel}>A fresh angle</Text>
          )}
        </View>
        <Text style={styles.questionText}>{question.prompt}</Text>
        {question.multiple && (
          <Text style={styles.questionHint}>Choose every answer that fits.</Text>
        )}

        <View style={styles.answerList}>
          {question.options.map((option, index) => {
            const selected = selectedAnswers.includes(option);
            return (
              <Pressable
                accessibilityRole={question.multiple ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: selected, disabled: Boolean(feedback) }}
                disabled={Boolean(feedback)}
                key={option}
                onPress={() => onToggleAnswer(option, question.multiple)}
                style={({ pressed }) => [
                  styles.answerButton,
                  selected && styles.answerButtonSelected,
                  pressed && !feedback && styles.answerButtonPressed,
                ]}
              >
                <View style={[styles.answerKey, selected && styles.answerKeySelected]}>
                  <Text style={[styles.answerKeyText, selected && styles.answerKeyTextSelected]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[styles.answerText, selected && styles.answerTextSelected]}>
                  {option}
                </Text>
                <View style={[styles.answerChoice, selected && styles.answerChoiceSelected]}>
                  {selected && <View style={styles.answerChoiceInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {feedback && (
          <View
            style={[
              styles.feedbackCard,
              feedback.kind === 'retry' && styles.feedbackCardRetry,
            ]}
          >
            <Text
              style={[
                styles.feedbackTitle,
                feedback.kind === 'retry' && styles.feedbackTitleRetry,
              ]}
            >
              {feedback.title}
            </Text>
            <Text style={styles.feedbackBody}>{feedback.body}</Text>
          </View>
        )}

        <PrimaryButton
          disabled={!feedback && selectedAnswers.length === 0}
          label={feedback ? (feedback.kind === 'retry' ? 'Keep going' : 'Continue') : 'Check answer'}
          onPress={feedback ? onContinue : onCheck}
        />
      </ScrollView>
    </View>
  );
}

function CompleteScreen({
  celebration,
  misses,
  points,
  onHome,
  onReset,
}: {
  celebration: Animated.Value;
  misses: Partial<Record<ConceptId, number>>;
  points: number;
  onHome: () => void;
  onReset: () => void;
}) {
  const perfect = Object.keys(misses).length === 0;

  return (
    <ScrollView
      contentContainerStyle={styles.completeContent}
      showsVerticalScrollIndicator={false}
    >
      <Brand />
      <Animated.View
        style={[
          styles.unlockMark,
          {
            opacity: celebration,
            transform: [
              {
                scale: celebration.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.65, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.unlockSpark}>✦</Text>
        <View style={styles.unlockRing} />
      </Animated.View>

      <Text style={styles.completeEyebrow}>CHAPTER 8 COMPLETE</Text>
      <Text style={styles.completeTitle}>You made it clear.</Text>
      <Text style={styles.completeSubtitle}>
        You mastered every idea—not just a score.
      </Text>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsCardLabel}>TODAY’S POINTS</Text>
        <Text style={styles.pointsCardValue}>+{points}</Text>
        <View style={styles.pointsBreakdown}>
          <Text style={styles.pointsBreakdownText}>3 lessons · 5 answers · chapter</Text>
          {perfect && <Text style={styles.perfectText}>Perfect first try +50</Text>}
        </View>
      </View>

      <View style={styles.masteryCard}>
        <Text style={styles.masteryTitle}>What you understand</Text>
        {quizConcepts.map((concept) => (
          <View key={concept.id} style={styles.masteryRow}>
            <View style={styles.masteryCheck}>
              <Text style={styles.masteryCheckText}>✓</Text>
            </View>
            <Text style={styles.masteryText}>{concept.masteryLabel}</Text>
          </View>
        ))}
      </View>

      <View style={styles.nextChapterCard}>
        <Text style={styles.nextChapterLabel}>UNLOCKED</Text>
        <Text style={styles.nextChapterTitle}>Chapter 9 · Daily worship</Text>
        <Text style={styles.nextChapterText}>Why Muslims pray, fast, and give.</Text>
      </View>

      <PrimaryButton label="Back to home" onPress={onHome} />
      <Pressable accessibilityRole="button" onPress={onReset} style={styles.resetButton}>
        <Text style={styles.resetText}>Restart demo</Text>
      </Pressable>
    </ScrollView>
  );
}

function PrimaryButton({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.primaryButtonPressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>
        {label}
      </Text>
      <Text style={[styles.primaryArrow, disabled && styles.primaryButtonTextDisabled]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, alignItems: 'center', backgroundColor: colors.background },
  phoneFrame: { width: '100%', maxWidth: 560, flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  homeContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 42 },
  homeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 52 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandMoon: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.background, transform: [{ translateX: -2 }], borderRightWidth: 4, borderRightColor: colors.green },
  brandText: { color: colors.charcoal, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  pointsPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFE7D6', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 },
  pointsSpark: { color: colors.gold, fontSize: 15 },
  pointsText: { color: colors.charcoal, fontSize: 14, fontWeight: '700' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  eyebrowLine: { width: 24, height: 2, backgroundColor: colors.gold },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  homeTitle: { color: colors.charcoal, fontSize: 38, lineHeight: 43, fontWeight: '800', letterSpacing: -1.4 },
  homeSubtitle: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 8, marginBottom: 28 },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    ...Platform.select({
      web: { boxShadow: '0 10px 22px rgba(64, 53, 37, 0.06)' },
      default: {
        shadowColor: '#403525',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 22,
        elevation: 2,
      },
    }),
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  goalCount: { color: colors.charcoal, fontSize: 20, fontWeight: '700', marginTop: 5 },
  standardPill: { backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  standardText: { color: colors.mintDark, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  progressTrack: { height: 7, backgroundColor: '#E9E3D9', borderRadius: 99, marginTop: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: 99 },
  steps: { marginTop: 20, gap: 3 },
  stepRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: '#C8C3B9', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: colors.green, borderWidth: 6 },
  stepDotComplete: { backgroundColor: colors.green, borderColor: colors.green },
  stepDotText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  stepDotTextComplete: { color: colors.white },
  stepCopy: { flex: 1, marginLeft: 13 },
  stepLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  stepLabelActive: { color: colors.green },
  stepTitle: { color: colors.charcoal, fontSize: 14, fontWeight: '600', marginTop: 2 },
  stepTitleLocked: { color: '#A39F97' },
  nowPill: { backgroundColor: '#E8EFEA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  nowText: { color: colors.green, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16, marginBottom: 14 },
  timeIcon: { color: colors.muted, fontSize: 17 },
  timeText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  primaryButton: { minHeight: 56, borderRadius: 16, paddingHorizontal: 20, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButtonPressed: { backgroundColor: colors.greenPressed, transform: [{ scale: 0.992 }] },
  primaryButtonDisabled: { backgroundColor: '#D9D5CD' },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  primaryButtonTextDisabled: { color: '#94918A' },
  primaryArrow: { color: colors.white, fontSize: 20, marginLeft: 10, marginTop: -1 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 25, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.charcoal, fontSize: 17, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.line },
  thoughtCard: { flexDirection: 'row', backgroundColor: '#EEE8DC', borderRadius: 18, padding: 18, gap: 12 },
  thoughtQuote: { color: colors.gold, fontSize: 36, lineHeight: 35, fontWeight: '700' },
  thoughtCopy: { flex: 1 },
  thoughtLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  thoughtText: { color: colors.charcoal, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ECE6DB', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: colors.charcoal, fontSize: 31, lineHeight: 34, marginTop: -3 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  headerLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  headerProgressTrack: { width: '100%', maxWidth: 260, height: 5, backgroundColor: '#E4DDD2', borderRadius: 5, overflow: 'hidden', marginTop: 8 },
  headerProgressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.green },
  headerSpacer: { width: 42 },
  lightPressed: { opacity: 0.7 },
  lessonContent: { paddingHorizontal: 26, paddingTop: 34, paddingBottom: 42 },
  lessonNumber: { width: 46, height: 30, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  lessonNumberText: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  lessonTitle: { color: colors.charcoal, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1.2 },
  shortAnswer: { color: colors.green, fontSize: 20, lineHeight: 29, fontWeight: '700', marginTop: 13 },
  lessonRule: { width: 40, height: 3, borderRadius: 2, backgroundColor: colors.gold, marginVertical: 25 },
  lessonBody: { color: colors.charcoal, fontSize: 17, lineHeight: 28, marginBottom: 24 },
  infoCard: { borderRadius: 18, padding: 19, backgroundColor: colors.mint, marginBottom: 14 },
  infoCardAmber: { backgroundColor: colors.amber },
  infoLabel: { color: colors.mintDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8 },
  infoLabelAmber: { color: colors.amberText },
  infoText: { color: colors.charcoal, fontSize: 15, lineHeight: 23, fontWeight: '500' },
  rememberCard: { flexDirection: 'row', borderRadius: 19, padding: 19, backgroundColor: colors.green, marginTop: 5, marginBottom: 16, gap: 14 },
  rememberIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: '#2C6751', alignItems: 'center', justifyContent: 'center' },
  rememberIconText: { color: '#F0C85A', fontSize: 17 },
  rememberCopy: { flex: 1 },
  rememberLabel: { color: '#AED1BF', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 6 },
  rememberText: { color: colors.white, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  sourceButton: { minHeight: 68, borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, marginBottom: 10 },
  sourceButtonTitle: { color: colors.charcoal, fontSize: 14, fontWeight: '700' },
  sourceButtonSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  sourceChevron: { color: colors.green, fontSize: 24, fontWeight: '500' },
  sourcesPanel: { backgroundColor: '#EEE9DF', borderRadius: 16, padding: 17, marginBottom: 12 },
  sourceItem: { paddingVertical: 7 },
  sourceType: { color: colors.mintDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sourceReference: { color: colors.charcoal, fontSize: 14, fontWeight: '800', marginTop: 3 },
  sourceNote: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  quizContent: { paddingHorizontal: 24, paddingTop: 34, paddingBottom: 42 },
  quizTypeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  quizType: { color: colors.green, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase' },
  returnedLabel: { color: colors.amberText, fontSize: 10, fontWeight: '800', backgroundColor: colors.amber, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  questionText: { color: colors.charcoal, fontSize: 29, lineHeight: 37, fontWeight: '800', letterSpacing: -0.7, marginBottom: 8 },
  questionHint: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 3 },
  answerList: { gap: 11, marginTop: 26, marginBottom: 14 },
  answerButton: { minHeight: 68, borderRadius: 17, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
  answerButtonSelected: { borderColor: colors.green, backgroundColor: '#EDF4EF' },
  answerButtonPressed: { borderColor: '#A8B9AF' },
  answerKey: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EEE9DF', alignItems: 'center', justifyContent: 'center' },
  answerKeySelected: { backgroundColor: colors.green },
  answerKeyText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  answerKeyTextSelected: { color: colors.white },
  answerText: { flex: 1, color: colors.charcoal, fontSize: 15, lineHeight: 21, fontWeight: '600', marginHorizontal: 13 },
  answerTextSelected: { color: colors.green },
  answerChoice: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#BEB9B0', alignItems: 'center', justifyContent: 'center' },
  answerChoiceSelected: { borderColor: colors.green },
  answerChoiceInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  feedbackCard: { backgroundColor: colors.mint, borderRadius: 17, padding: 18, marginTop: 4, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: colors.mintDark },
  feedbackCardRetry: { backgroundColor: colors.amber, borderLeftColor: '#C58A37' },
  feedbackTitle: { color: colors.mintDark, fontSize: 18, fontWeight: '800', marginBottom: 5 },
  feedbackTitleRetry: { color: colors.amberText },
  feedbackBody: { color: colors.charcoal, fontSize: 14, lineHeight: 21 },
  completeContent: { paddingHorizontal: 25, paddingTop: 22, paddingBottom: 40, alignItems: 'stretch' },
  unlockMark: { width: 112, height: 112, borderRadius: 56, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, marginTop: 42, marginBottom: 26, overflow: 'hidden' },
  unlockSpark: { color: '#F2C65D', fontSize: 40, zIndex: 2 },
  unlockRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: '#5E8B78' },
  completeEyebrow: { color: colors.green, textAlign: 'center', fontSize: 11, fontWeight: '900', letterSpacing: 1.7 },
  completeTitle: { color: colors.charcoal, textAlign: 'center', fontSize: 35, lineHeight: 42, fontWeight: '800', letterSpacing: -1.1, marginTop: 9 },
  completeSubtitle: { color: colors.muted, textAlign: 'center', fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: 24 },
  pointsCard: { backgroundColor: '#EFE6D2', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14 },
  pointsCardLabel: { color: colors.amberText, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  pointsCardValue: { color: colors.charcoal, fontSize: 38, fontWeight: '800', marginVertical: 5 },
  pointsBreakdown: { alignItems: 'center', gap: 5 },
  pointsBreakdownText: { color: colors.muted, fontSize: 12 },
  perfectText: { color: colors.amberText, fontSize: 11, fontWeight: '800' },
  masteryCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 19, marginBottom: 14 },
  masteryTitle: { color: colors.charcoal, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  masteryRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center' },
  masteryCheck: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  masteryCheckText: { color: colors.green, fontSize: 11, fontWeight: '900' },
  masteryText: { flex: 1, color: colors.charcoal, fontSize: 14, fontWeight: '600' },
  nextChapterCard: { borderRadius: 20, padding: 20, backgroundColor: colors.green, marginBottom: 14 },
  nextChapterLabel: { color: '#F2C65D', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  nextChapterTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 8 },
  nextChapterText: { color: '#C1D9CD', fontSize: 14, marginTop: 5 },
  resetButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  resetText: { color: colors.muted, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
