import { Platform } from 'react-native';

import type { Preferences } from './preferences';

const reminderIdentifier = 'islam-simply-daily-reminder';

let handlerConfigured = false;

function reminderTime(preferences: Preferences) {
  if (preferences.reminder === 'morning') return { hour: 8, minute: 0 };
  if (preferences.reminder === 'afternoon') return { hour: 13, minute: 0 };
  if (preferences.reminder === 'evening') return { hour: 19, minute: 0 };
  const [hour, minute] = preferences.customReminderTime.split(':').map(Number);
  return { hour, minute };
}

function nextReminderDate(preferences: Preferences, goalComplete: boolean) {
  const { hour, minute } = reminderTime(preferences);
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (goalComplete || next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next;
}

export async function syncLearningReminder(
  preferences: Preferences,
  notification: { title: string; body: string; channel: string },
  goalComplete: boolean,
  requestPermission: boolean,
) {
  if (Platform.OS === 'web') return { status: 'web' as const };
  const Notifications = await import('expo-notifications');

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  await Notifications.cancelScheduledNotificationAsync(reminderIdentifier).catch(() => undefined);
  if (!preferences.notificationsEnabled || preferences.reminder === 'none') {
    return { status: 'disabled' as const };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('learning-reminders', {
      name: notification.channel,
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: preferences.soundEnabled ? 'default' : null,
      vibrationPattern: preferences.soundEnabled ? [0, 180] : null,
    });
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && requestPermission && permissions.canAskAgain) {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (!permissions.granted) return { status: 'denied' as const };

  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier,
    content: {
      title: notification.title,
      body: notification.body,
      sound: preferences.soundEnabled ? 'default' : false,
      data: { screen: 'home' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextReminderDate(preferences, goalComplete),
      channelId: Platform.OS === 'android' ? 'learning-reminders' : undefined,
    },
  });
  return { status: 'scheduled' as const };
}
