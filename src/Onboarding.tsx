import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  defaultPreferences,
  languageOptions,
  paceOptions,
  reminderOptions,
  type LanguageId,
  type PaceId,
  type Preferences,
  type ReminderId,
} from './preferences';
import { FlagIcon } from './FlagIcon';
import { AppText as Text, fonts } from './design';
import type { enUi } from './locales/en/ui';

const ink = '#17231D';
const green = '#1D5B42';
const cream = '#FAF8F2';
const line = '#E6E3DB';
const muted = '#747872';

export function Onboarding({ onComplete, t }: { onComplete: (preferences: Preferences) => void; t: typeof enUi }) {
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<LanguageId>(defaultPreferences.language);
  const [pace, setPace] = useState<PaceId>(defaultPreferences.pace);
  const [reminder, setReminder] = useState<ReminderId>(defaultPreferences.reminder);
  const [customReminderTime, setCustomReminderTime] = useState(defaultPreferences.customReminderTime);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entrance.setValue(0);
    Animated.spring(entrance, {
      toValue: 1,
      damping: 18,
      stiffness: 150,
      mass: 0.75,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [entrance, step]);

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
    ],
  };

  function finish() {
    onComplete({
      ...defaultPreferences,
      onboardingComplete: true,
      language,
      pace,
      reminder,
      customReminderTime,
      notificationsEnabled: reminder !== 'none',
    });
  }

  const customTimeValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(customReminderTime);
  const paceCopy = (id: PaceId) => id === 'gentle'
    ? { title: t.gentle, subtitle: t.gentleBody }
    : id === 'focused'
      ? { title: t.focused, subtitle: t.focusedBody }
      : { title: t.standard, subtitle: t.standardBody };
  const reminderCopy = (id: ReminderId) => {
    if (id === 'morning') return { title: t.morning, subtitle: t.morningTime };
    if (id === 'afternoon') return { title: t.afternoon, subtitle: t.afternoonTime };
    if (id === 'evening') return { title: t.evening, subtitle: t.eveningTime };
    if (id === 'custom') return { title: t.customTime, subtitle: t.chooseTime };
    return { title: t.noReminders, subtitle: t.noRemindersBody };
  };

  if (step === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Animated.View style={[styles.welcome, entranceStyle]}>
          <ImageBackground
            source={require('../assets/onboarding-hero.png')}
            style={styles.hero}
            resizeMode="cover"
          >
            <View style={styles.heroWash} />
          </ImageBackground>
          <View style={styles.welcomeCopy}>
            <Text style={styles.wordmark}>{t.brand}</Text>
            <Text style={styles.tagline}>{t.onboardingTagline}</Text>
            <PrimaryButton label={t.getStarted} onPress={() => setStep(1)} />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.flowShell}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel={t.back} accessibilityRole="button" onPress={() => setStep((current) => Math.max(0, current - 1))} style={styles.backButton}>
            <Ionicons color={ink} name="chevron-back" size={24} />
          </Pressable>
          <View style={styles.stepTrack}>
            {[1, 2, 3, 4].map((item) => <View key={item} style={[styles.stepSegment, item <= step && styles.stepSegmentActive]} />)}
          </View>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.flowContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={entranceStyle}>
          {step === 1 && (
            <ChoiceScreen title={t.chooseLanguage} subtitle={t.changeLater}>
              {languageOptions.filter((option) => option.available).map((option) => {
                const languageName = String(option.name);
                const nativeName = String(option.nativeName);
                const subtitle = languageName === nativeName ? undefined : languageName;
                return (
                  <ChoiceRow
                    key={option.id}
                    disabled={!option.available}
                    selected={language === option.id}
                    leading={<FlagIcon language={option.id} />}
                    title={option.nativeName}
                    subtitle={subtitle}
                    onPress={() => setLanguage(option.id)}
                  />
                );
              })}
            </ChoiceScreen>
          )}

          {step === 2 && (
            <ChoiceScreen title={t.chooseDailyGoal} subtitle={t.changeAnytime}>
              {paceOptions.map((option) => (
                <ChoiceRow
                  key={option.id}
                  selected={pace === option.id}
                  leading={String(option.lessons)}
                  title={paceCopy(option.id).title}
                  subtitle={paceCopy(option.id).subtitle}
                  onPress={() => setPace(option.id)}
                />
              ))}
            </ChoiceScreen>
          )}

          {step === 3 && (
            <ChoiceScreen title={t.chooseReminder} subtitle={t.reminderSubtitle}>
              {reminderOptions.map((option) => {
                const copy = reminderCopy(option.id);
                return (
                <ChoiceRow
                  key={option.id}
                  selected={reminder === option.id}
                  leading={<Ionicons color={green} name={option.id === 'morning' ? 'sunny-outline' : option.id === 'afternoon' ? 'partly-sunny-outline' : option.id === 'evening' ? 'moon-outline' : option.id === 'custom' ? 'time-outline' : 'remove-outline'} size={22} />}
                  title={copy.title}
                  subtitle={option.id === 'custom' && reminder === 'custom' ? customReminderTime : copy.subtitle}
                  onPress={() => setReminder(option.id)}
                />
                );
              })}
              {reminder === 'custom' && (
                <View style={styles.timeFieldWrap}>
                  <Text style={styles.timeLabel}>{t.reminderTime24}</Text>
                  <TextInput
                    accessibilityLabel={t.customReminderTime}
                    maxLength={5}
                    onChangeText={setCustomReminderTime}
                    placeholder="20:00"
                    placeholderTextColor="#999D98"
                    style={[styles.timeField, !customTimeValid && styles.timeFieldInvalid]}
                    value={customReminderTime}
                  />
                  {!customTimeValid && <Text style={styles.timeError}>{t.reminderTimeInvalid}</Text>}
                </View>
              )}
              <View style={styles.kindNote}>
                <Ionicons color={green} name="heart-outline" size={20} />
                <Text style={styles.kindNoteText}>{t.reminderKindNote}</Text>
              </View>
            </ChoiceScreen>
          )}

          {step === 4 && (
            <ChoiceScreen title={t.almostThere} subtitle={t.guestOnboardingBody}>
              <ChoiceRow selected leading="S" title={t.continueGuest} subtitle={t.continueGuestBody} onPress={() => undefined} />
            </ChoiceScreen>
          )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            disabled={step === 3 && reminder === 'custom' && !customTimeValid}
            label={step === 4 ? t.startLearning : t.continue}
            onPress={step === 4 ? finish : () => setStep((current) => current + 1)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ChoiceScreen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.flowTitle}>{title}</Text>
      <Text style={styles.flowSubtitle}>{subtitle}</Text>
      <View style={styles.choiceList}>{children}</View>
    </View>
  );
}

function ChoiceRow({ selected, disabled = false, leading, title, subtitle, onPress }: { selected: boolean; disabled?: boolean; leading: ReactNode; title: string; subtitle?: string; onPress: () => void }) {
  const selection = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(selection, {
      toValue: selected ? 1 : 0,
      damping: 13,
      stiffness: 240,
      mass: 0.55,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [selected, selection]);

  return (
    <Animated.View style={{ transform: [{ scale: selection.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] }) }] }}>
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} aria-checked={selected} aria-disabled={disabled} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, disabled && styles.choiceDisabled, pressed && styles.choicePressed]}>
        <View style={styles.choiceLeading}>{typeof leading === 'string' ? <Text style={styles.choiceLeadingText}>{leading}</Text> : leading}</View>
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>{title}</Text>
          {subtitle && <Text style={styles.choiceSubtitle}>{subtitle}</Text>}
        </View>
        <Animated.View style={[styles.radio, selected && styles.radioSelected, { transform: [{ scale: selection.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }]}>{selected && <Ionicons color="#FFFFFF" name="checkmark" size={14} />}</Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function PrimaryButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.primaryButtonDisabled, pressed && !disabled && styles.primaryButtonPressed]}><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cream, alignItems: 'center' },
  welcome: { flex: 1, width: '100%', maxWidth: 430, backgroundColor: cream },
  hero: { flex: 1.25, justifyContent: 'flex-end' },
  heroWash: { height: 110, backgroundColor: 'rgba(250,248,242,0.30)' },
  welcomeCopy: { flex: 0.78, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 20, justifyContent: 'flex-end' },
  wordmark: { color: ink, fontFamily: fonts.displayBold, fontSize: 36, lineHeight: 44, fontWeight: '700', textAlign: 'center', letterSpacing: -0.8 },
  tagline: { color: '#4F5752', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, marginBottom: 27 },
  primaryButton: { minHeight: 54, borderRadius: 28, backgroundColor: green, borderBottomWidth: 4, borderBottomColor: '#123D2D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryButtonPressed: { backgroundColor: '#154833', borderBottomWidth: 2, transform: [{ translateY: 2 }, { scale: 0.985 }] },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  flowShell: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center' },
  topBar: { height: 68, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  stepTrack: { flex: 1, flexDirection: 'row', gap: 6 },
  stepSegment: { flex: 1, height: 4, borderRadius: 4, backgroundColor: '#E1E2DC' },
  stepSegmentActive: { backgroundColor: green },
  flowContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 120 },
  flowTitle: { color: ink, fontFamily: fonts.displayBold, fontSize: 29, lineHeight: 37, fontWeight: '700', letterSpacing: -0.45 },
  flowSubtitle: { color: muted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  choiceList: { gap: 10, marginTop: 28 },
  choice: { minHeight: 68, borderRadius: 13, borderWidth: 1, borderColor: line, backgroundColor: '#FFFEFB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  choiceSelected: { borderColor: green, backgroundColor: '#F2F7F3' },
  choiceDisabled: { opacity: 0.58, backgroundColor: '#F3F0E9' },
  choicePressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  choiceLeading: { width: 43, alignItems: 'center', justifyContent: 'center' },
  choiceLeadingText: { color: ink, fontSize: 21, textAlign: 'center' },
  choiceCopy: { flex: 1, marginLeft: 8 },
  choiceTitle: { color: ink, fontSize: 15, fontWeight: '700', textAlign: 'left', writingDirection: 'ltr' },
  choiceSubtitle: { color: muted, fontSize: 11, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#B8BDB9', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: green, borderColor: green },
  kindNote: { flexDirection: 'row', gap: 11, borderRadius: 13, backgroundColor: '#EDF3ED', padding: 15, marginTop: 7 },
  kindNoteText: { flex: 1, color: '#4C5D53', fontSize: 12, lineHeight: 18 },
  timeFieldWrap: { borderRadius: 13, borderWidth: 1, borderColor: line, backgroundColor: '#FFFEFB', padding: 14 },
  timeLabel: { color: ink, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  timeField: { minHeight: 48, borderRadius: 10, borderWidth: 1.5, borderColor: green, color: ink, fontFamily: fonts.bold, fontSize: 18, fontWeight: '700', paddingHorizontal: 14 },
  timeFieldInvalid: { borderColor: '#C58A37' },
  timeError: { color: '#785227', fontSize: 11, marginTop: 7 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 20, backgroundColor: cream, borderTopWidth: 1, borderTopColor: '#F0EEE8' },
});
