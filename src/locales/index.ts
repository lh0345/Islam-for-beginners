import { enCourse } from './en/course';
import { enUi } from './en/ui';

export const localeRegistry = {
  en: {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
    course: enCourse,
    ui: enUi,
  },
} as const;

export type LocaleCode = keyof typeof localeRegistry;

export const availableLocales = Object.values(localeRegistry);

export function getLocale(code?: string | null) {
  return localeRegistry[code as LocaleCode] ?? localeRegistry.en;
}

export function format(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
