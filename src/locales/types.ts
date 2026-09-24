export type UnderstandingPrompt = {
  id: string;
  conceptId: string;
  title: string;
  prompt: string;
  explanation: string;
} & (
  | { kind: 'scenario'; options: [string, string] | [string, string, string]; answer: string; alternativeExplanation: string }
  | { kind: 'consider' | 'connection' }
);

type ReligiousSource = {
  reference: string;
  url: string;
  arabicText?: string;
  translationText: string;
  translationName: string;
  explanation: string;
};

export type LessonSource =
  | ({ type: 'Quran' } & ReligiousSource & { arabicText: string })
  | ({ type: 'Hadith' } & ReligiousSource)
  | { type: 'Scholar explanation' | 'Historical reference' | 'Analogy note'; reference: string; url?: string; note: string };

export type ReadingSection = {
  kind: 'opening' | 'reading' | 'example' | 'distinction' | 'reflection';
  title: string;
  paragraphs: string[];
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  sections: ReadingSection[];
  reviewCard: { front: string; back: string; why?: string; distinction?: string; reconsider?: string };
  sources?: LessonSource[];
};

export type CourseDay = {
  id: string;
  number: number;
  week: number;
  title: string;
  introduction: string;
  closing: string;
  lessons: Lesson[];
  understanding: { id: string; prompts: UnderstandingPrompt[] };
};

export type Course = {
  id: string;
  title: string;
  subtitle: string;
  weeks: [string, string, string, string];
  days: CourseDay[];
  nextCourses: Array<{ title: string; description: string }>;
};
