export type ConceptId =
  | 'allah-god'
  | 'one-god'
  | 'muhammad-prophet'
  | 'worship-god-alone'
  | 'allah-language';

type LessonSource = {
  type: 'Quran' | 'Context';
  reference: string;
  note: string;
};

type Lesson = {
  id: string;
  title: string;
  shortAnswer: string;
  explanation: string;
  example: string;
  commonConfusion: string;
  remember: string;
  sources: LessonSource[];
  quizConcepts: ConceptId[];
};

type QuestionVariant = {
  type:
    | 'Pick one'
    | 'True or false'
    | 'Pick all that fit'
    | 'Finish the sentence'
    | 'Short situation';
  prompt: string;
  options: string[];
  answers: string[];
  multiple: boolean;
};

type QuizConcept = {
  id: ConceptId;
  masteryLabel: string;
  confirmation: string;
  reteach: [string, string, string];
  variants: QuestionVariant[];
};

export const lessons: Lesson[] = [
  {
    id: 'who-is-allah',
    title: 'Who is Allah?',
    shortAnswer: 'Allah is the Arabic word for God.',
    explanation:
      'Muslims believe Allah created everything, knows everything, and has no equal. “Allah” is not the name of a different Muslim god. It is simply how Arabic speakers say “God.”',
    example:
      'Arabic-speaking Christians also use the word Allah when they speak about God.',
    commonConfusion:
      'Muslims do not believe Allah is one god among many. They believe there is only one God.',
    remember: 'Allah = God.',
    sources: [
      {
        type: 'Quran',
        reference: 'Quran 112:1–4',
        note: 'A short chapter describing God as one, eternal, and without equal.',
      },
      {
        type: 'Context',
        reference: 'Arabic language usage',
        note: 'Allah is the ordinary Arabic word used for God, including by Arab Christians.',
      },
    ],
    quizConcepts: ['allah-god', 'one-god', 'allah-language'],
  },
  {
    id: 'who-was-muhammad',
    title: 'Who was Muhammad?',
    shortAnswer: 'Muhammad was a prophet and messenger of God.',
    explanation:
      'Muslims believe Muhammad received and shared the Quran. They respect him deeply, but he was human. He is not God and is not worshipped.',
    example:
      'Like earlier prophets, Muhammad called people to worship God and live with honesty, mercy, and justice.',
    commonConfusion:
      'Respecting Muhammad does not mean worshipping him. Worship belongs to God alone.',
    remember: 'Muhammad was a prophet, not God.',
    sources: [
      {
        type: 'Quran',
        reference: 'Quran 18:110',
        note: 'Muhammad is instructed to say that he is a human being who receives revelation.',
      },
      {
        type: 'Quran',
        reference: 'Quran 33:40',
        note: 'Describes Muhammad as the Messenger of God and the final prophet.',
      },
    ],
    quizConcepts: ['muhammad-prophet', 'worship-god-alone'],
  },
  {
    id: 'who-do-muslims-worship',
    title: 'Who do Muslims worship?',
    shortAnswer: 'Muslims worship God alone.',
    explanation:
      'The central Muslim belief is that only God deserves worship. Muslims pray directly to God—without treating a prophet, object, or place as divine.',
    example:
      'A Muslim may love the Prophet Muhammad and visit a mosque, but prayer itself is directed to God.',
    commonConfusion:
      'The Kaaba is the direction Muslims face together in prayer. Muslims do not believe the building is God.',
    remember: 'Respect many. Worship One.',
    sources: [
      {
        type: 'Quran',
        reference: 'Quran 1:5',
        note: 'Muslims say to God: You alone we worship, and You alone we ask for help.',
      },
      {
        type: 'Quran',
        reference: 'Quran 2:144',
        note: 'Explains the shared direction Muslims face during prayer.',
      },
    ],
    quizConcepts: ['worship-god-alone', 'one-god'],
  },
];

export const quizConcepts: QuizConcept[] = [
  {
    id: 'allah-god',
    masteryLabel: 'Allah means God',
    confirmation: 'Allah is the Arabic word for God.',
    reteach: [
      'The word “Allah” simply means God in Arabic.',
      'Think language, not a different deity: English says “God”; Arabic says “Allah.”',
      'For example, an Arabic-speaking Christian also calls God “Allah.”',
    ],
    variants: [
      {
        type: 'Pick one',
        prompt: 'What does the word “Allah” mean?',
        options: ['An angel', 'God', 'A prophet', 'A holy place'],
        answers: ['God'],
        multiple: false,
      },
      {
        type: 'Finish the sentence',
        prompt: 'In Arabic, the ordinary word for God is…',
        options: ['Allah', 'Muhammad', 'Quran', 'Kaaba'],
        answers: ['Allah'],
        multiple: false,
      },
      {
        type: 'Short situation',
        prompt: 'Omar says Allah is a separate Muslim god. What is the clearest correction?',
        options: [
          'Allah means God in Arabic',
          'Allah is the name of a prophet',
          'Muslims believe in several gods',
          'Allah means a place of prayer',
        ],
        answers: ['Allah means God in Arabic'],
        multiple: false,
      },
    ],
  },
  {
    id: 'muhammad-prophet',
    masteryLabel: 'Muhammad was a prophet',
    confirmation: 'Muhammad was human and a messenger of God.',
    reteach: [
      'Muslims respect Muhammad as a prophet and messenger, not as God.',
      'A prophet carries God’s message. A prophet is not the one being worshipped.',
      'Like earlier prophets, Muhammad called people to worship God—not himself.',
    ],
    variants: [
      {
        type: 'Pick one',
        prompt: 'Which statement best describes Muhammad in Islam?',
        options: ['He was God', 'He was an angel', 'He was a prophet', 'He was a king'],
        answers: ['He was a prophet'],
        multiple: false,
      },
      {
        type: 'True or false',
        prompt: 'Muslims believe Muhammad was human.',
        options: ['True', 'False'],
        answers: ['True'],
        multiple: false,
      },
      {
        type: 'Short situation',
        prompt: 'Sara says Muslims believe Muhammad is God. Is Sara right?',
        options: ['Yes', 'No—he was a prophet', 'Only during prayer', 'Muslims do not know'],
        answers: ['No—he was a prophet'],
        multiple: false,
      },
    ],
  },
  {
    id: 'worship-god-alone',
    masteryLabel: 'Muslims worship God alone',
    confirmation: 'In Islam, worship is directed to God alone.',
    reteach: [
      'Muslims respect prophets, but direct worship only to God.',
      'Respect and worship are different. Deep respect does not make someone divine.',
      'A Muslim can love Muhammad while praying only to God.',
    ],
    variants: [
      {
        type: 'Pick all that fit',
        prompt: 'Which statements match what Muslims believe?',
        options: [
          'God alone deserves worship',
          'Muhammad was a prophet',
          'Prophets should be worshipped',
          'The Kaaba is God',
        ],
        answers: ['God alone deserves worship', 'Muhammad was a prophet'],
        multiple: true,
      },
      {
        type: 'Pick one',
        prompt: 'Who do Muslims worship?',
        options: ['God alone', 'Muhammad', 'The Kaaba', 'Angels'],
        answers: ['God alone'],
        multiple: false,
      },
      {
        type: 'Short situation',
        prompt: 'A Muslim admires a prophet. Does that make the prophet an object of worship?',
        options: ['Yes', 'No—worship is for God', 'Only on Fridays', 'Only in a mosque'],
        answers: ['No—worship is for God'],
        multiple: false,
      },
    ],
  },
  {
    id: 'one-god',
    masteryLabel: 'God is one and has no equal',
    confirmation: 'Muslims believe there is one God, without equal.',
    reteach: [
      'Islam teaches that God is one—not one member of a group of gods.',
      '“One” here means unique and without an equal or partner.',
      'For example, nothing in creation shares God’s divinity.',
    ],
    variants: [
      {
        type: 'True or false',
        prompt: 'Muslims believe God has no equal.',
        options: ['True', 'False'],
        answers: ['True'],
        multiple: false,
      },
      {
        type: 'Finish the sentence',
        prompt: 'The central Muslim belief is that God is…',
        options: ['One and without equal', 'One of many', 'Only present in mosques', 'A human being'],
        answers: ['One and without equal'],
        multiple: false,
      },
      {
        type: 'Pick one',
        prompt: 'Which idea does Islam reject?',
        options: ['God created everything', 'God is one', 'God has divine partners', 'God has no equal'],
        answers: ['God has divine partners'],
        multiple: false,
      },
    ],
  },
  {
    id: 'allah-language',
    masteryLabel: 'Arabic speakers use the word Allah',
    confirmation: 'The word Allah is used by Arabic speakers of different faiths.',
    reteach: [
      '“Allah” belongs to the Arabic language, not to one ethnicity.',
      'Arabic speakers can use the same word while belonging to different faiths.',
      'For example, an Arab Christian may say “Allah” when speaking about God.',
    ],
    variants: [
      {
        type: 'Short situation',
        prompt: 'An Arabic-speaking Christian says “Allah.” Is that unusual?',
        options: ['No—it is Arabic for God', 'Yes—only Muslims use it', 'Yes—it means prophet', 'No—it means church'],
        answers: ['No—it is Arabic for God'],
        multiple: false,
      },
      {
        type: 'True or false',
        prompt: 'Only Muslims use the Arabic word “Allah.”',
        options: ['True', 'False'],
        answers: ['False'],
        multiple: false,
      },
      {
        type: 'Pick one',
        prompt: 'Why might an Arab Christian say “Allah”?',
        options: ['It is Arabic for God', 'It means church', 'It is a greeting', 'It means prophet'],
        answers: ['It is Arabic for God'],
        multiple: false,
      },
    ],
  },
];
