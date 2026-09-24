import type { Course, CourseDay, Lesson, LessonSource, ReadingSection, UnderstandingPrompt } from '../types';

// Helpers assign identities only. No prose or screen sequence is generated.
const section = (kind: ReadingSection['kind'], title: string, ...paragraphs: string[]): ReadingSection => ({ kind, title, paragraphs });
const reading = (number: number, title: string, sections: ReadingSection[], reviewCard: Lesson['reviewCard'], sources?: LessonSource[]): Lesson =>
  ({ id: 'lesson-' + String(number).padStart(2, '0'), number, title, sections, reviewCard, ...(sources ? { sources } : {}) });
type PromptDraft = UnderstandingPrompt extends infer P ? P extends UnderstandingPrompt ? Omit<P, 'id' | 'conceptId'> : never : never;
const situation = (title: string, prompt: string, options: [string, string] | [string, string, string], answer: string, explanation: string, alternativeExplanation: string): PromptDraft =>
  ({ kind: 'scenario', title, prompt, options, answer, explanation, alternativeExplanation });
const consider = (title: string, prompt: string, explanation: string, kind: 'consider' | 'connection' = 'consider'): PromptDraft =>
  ({ kind, title, prompt, explanation });
const day = (number: number, title: string, introduction: string, closing: string, lessons: Lesson[], prompts: PromptDraft[]): CourseDay => {
  const id = 'day-' + String(number).padStart(2, '0');
  return { id, number, week: Math.ceil(number / 7), title, introduction, closing, lessons,
    understanding: { id: id + '-understanding-v2', prompts: prompts.map((prompt, index) => ({ ...prompt, id: id + '-meaning-' + (index + 1), conceptId: id + '-meaning-' + (index + 1) })) } };
};
const oneness: LessonSource = {
  type: 'Quran', reference: 'Quran 112:1–4', url: 'https://legacy.quran.com/112',
  arabicText: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ\nٱللَّهُ ٱلصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ',
  translationText: 'Say, "He is Allah, [who is] One,\nAllah, the Eternal Refuge.\nHe neither begets nor is born,\nNor is there to Him any equivalent."',
  translationName: 'Sahih International',
  explanation: 'This chapter describes God as without equal or dependence. Muslims understand it as a reason to direct worship to God alone, rather than to any person or part of creation.',
};
const trust: LessonSource = {
  type: 'Quran', reference: 'Quran 33:72', url: 'https://legacy.quran.com/33/72',
  arabicText: 'إِنَّا عَرَضْنَا ٱلْأَمَانَةَ عَلَى ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ وَٱلْجِبَالِ فَأَبَيْنَ أَن يَحْمِلْنَهَا وَأَشْفَقْنَ مِنْهَا وَحَمَلَهَا ٱلْإِنسَـٰنُ ۖ إِنَّهُۥ كَانَ ظَلُومًۭا جَهُولًۭا',
  translationText: 'Indeed, we offered the Trust to the heavens and the earth and the mountains, and they declined to bear it and feared it; but man [undertook to] bear it. Indeed, he was unjust and ignorant.',
  translationName: 'Sahih International',
  explanation: 'Many commentators understand the Trust as religious and moral responsibility. This is an interpretation; the verse does not say each person selected their family or hardships before birth.',
};
const covenant: LessonSource = {
  type: 'Quran', reference: 'Quran 7:172', url: 'https://legacy.quran.com/7/172',
  arabicText: 'وَإِذْ أَخَذَ رَبُّكَ مِنۢ بَنِىٓ ءَادَمَ مِن ظُهُورِهِمْ ذُرِّيَّتَهُمْ وَأَشْهَدَهُمْ عَلَىٰٓ أَنفُسِهِمْ أَلَسْتُ بِرَبِّكُمْ ۖ قَالُوا۟ بَلَىٰ ۛ شَهِدْنَآ ۛ أَن تَقُولُوا۟ يَوْمَ ٱلْقِيَـٰمَةِ إِنَّا كُنَّا عَنْ هَـٰذَا غَـٰفِلِينَ',
  translationText: 'And [mention] when your Lord took from the children of Adam - from their loins - their descendants and made them testify of themselves, [saying to them], "Am I not your Lord?" They said, "Yes, we have testified." [This] - lest you should say on the day of Resurrection, "Indeed, we were of this unaware."',
  translationName: 'Sahih International',
  explanation: 'This passage speaks about people recognizing God and being responsible to Him. Scholars explain the event in different ways. It does not give a detailed story about choosing a future life.',
};
export const enCourse: Course = {
  id: 'islam-from-zero', title: 'Islam, Simply',
  subtitle: 'A patient introduction to a way of seeing life',
  weeks: ['Getting started', 'Worship and daily life', 'Purpose and our choices', 'People and questions'],
  nextCourses: [
    { title: 'Read the Quran with context', description: 'Begin with short passages, a named translation, and a reliable commentary. Notice where explanation goes beyond the words of the text.' },
    { title: 'Meet the tradition in person', description: 'A welcoming mosque or knowledgeable teacher can help you explore the questions this introduction leaves open.' },
  ],
  days: [
    day(1, "Getting to know Islam",
      "Before learning names and practices, let’s begin with a bigger question: what does Islam say life is for?",
      "Islam connects belief in one God with the way people live each day. You can understand this invitation without deciding yet whether you accept it.", [
      reading(1, "What is Islam about?", [
        section('opening', "What is life for?", "You can have work, friends, and plans and still wonder what life is for. Islam begins with an answer to that question. Muslims believe life is a gift from one God. Knowing Him and living by His guidance gives life a purpose."),
        section('reading', "Faith in everyday life", "Worship includes prayer, but it also reaches into daily life. Being honest, caring for your family, and treating people fairly can be ways of serving God.", "Islam means submitting to God: trying to follow His guidance. It does not mean obeying every person who claims authority over you."),
        section('example', "A choice no one sees", "Imagine someone returning money after a shop has given them too much change. No one noticed the mistake. A Muslim may see returning it as part of faith: the money belongs to someone else, and God matters even when no one is watching."),
        section('reflection', "Something to think about", "If an ordinary act of honesty can be worship, where does faith fit into the rest of a person’s day?"),
      ], {"front":"Faith in daily choices","back":"Muslims worship one God and try to follow His guidance. This includes ordinary acts of honesty and care.","reconsider":"What might worship change when no one is watching?"}),
      reading(2, "Who can be Muslim?", [
        section('opening', "People from many backgrounds", "A Muslim is someone who follows Islam. It is a faith, not an ethnic group. Muslims live in many countries and speak many languages. There is no single way that a Muslim must look."),
        section('example', "Different meals, shared faith", "One Muslim family ends a day of fasting with rice. Another has soup and bread. Both may show gratitude and welcome guests. The faith is shared; the recipes come from different cultures."),
        section('distinction', "People and their faith", "Muslims differ in how much they know and how they live. Some follow religious teachings closely; others do not. A Muslim’s action does not become an Islamic teaching just because a Muslim did it.", "When you see a practice, it helps to ask: is this a religious teaching, a local custom, or one person’s choice?"),
      ], {"front":"A faith for many people","back":"Muslim means someone who follows Islam. Muslims can share a faith without sharing the same language, appearance, or customs."}),
      reading(3, "Who is Allah?", [
        section('opening', "The Arabic word for God", "Allah is the Arabic word for God. Arabic-speaking Christians use it too. Muslims believe there is one Creator of everyone and everything, not a separate god for one group of people."),
        section('reading', "God is not like a person", "Islam teaches that God has no equal and needs nothing. He does not grow old, need food, or gain power from praise. Muslims also believe He is merciful, knows them fully, and hears them when they pray."),
        section('distinction', "Why worship a God who needs nothing?", "Muslims believe people need God, but God does not need people. Prayer is not meant to give Him something He lacks. It can help a person remember Him, give thanks, and live with greater care."),
        section('reflection', "Look at the source", "The short Quran chapter below calls God One and the Eternal Refuge. What might it mean to turn for help to God, who needs nothing Himself?"),
      ], {"front":"God needs nothing","back":"Muslims believe God is the one Creator, with no equal or need.","reconsider":"If God does not need worship, who is worship meant to change?"}, [oneness]),
    ], [
      situation("An honest choice", "A shopkeeper returns money a customer paid by mistake. How could this be worship?",
        ["The person is respecting someone’s rights for God’s sake.", "Doing one good deed means prayer is no longer needed."],
        "The person is respecting someone’s rights for God’s sake.",
        "An ordinary good action can be worship when done for God’s sake. Honesty and prayer both belong in a Muslim’s life. One does not replace the other.",
        "Being honest does not replace prayer. The point is that worship can include both prayer and the way people treat each other."),
      consider("Why worship matters", "God needs nothing, yet worship matters. How can both be true?",
        "Muslims believe worship is a response to God. It can change a person’s habits, attention, and care for others. It does not need to make God more powerful to have meaning.", 'connection'),
    ]),
    day(2, "Muhammad’s message",
      "Why would God send guidance through a person? Let’s look at who Muslims believe Muhammad was and why they listen to him.",
      "Muslims trust Muhammad as a messenger and study his example. His teaching points people toward God; it does not make him God.", [
      reading(4, "Why would God send a person?", [
        section('opening', "Guidance someone can live", "Muslims believe Muhammad was a human being chosen by God as His final prophet. He lived in Arabia in the seventh century. He taught people to worship one God and built a community around that message."),
        section('example', "Seeing a teaching in action", "Generosity is easier to understand when you see someone share. Patience becomes clearer when you see how someone handles an argument. Muslims study Muhammad’s life to learn how God’s guidance can be put into practice."),
        section('distinction', "A messenger is not God", "Muslims believe prophets receive messages from God. That does not make them divine. Muhammad’s human life matters because he lived among people facing real needs, choices, and difficulties."),
      ], {"front":"A human messenger","back":"Muslims believe Muhammad brought God’s message and showed how to live by it. Being a prophet does not make him God."}),
      reading(5, "Do Muslims worship Muhammad?", [
        section('opening', "Love and respect", "Muslims often speak of Muhammad with love and ask God to bless him. If you are new to Islam, it is understandable to wonder how this differs from worship."),
        section('distinction', "Who receives worship?", "Muslims believe Muhammad is God’s messenger, not God. They honor him and follow his teaching. Worship belongs to God alone. Following the messenger should help a person turn toward God."),
        section('reading', "Some practices are debated", "Muslims share this belief about worship. They still disagree about some practices, such as certain ways of asking for intercession—asking someone to pray or speak on another person’s behalf. Those differences should be explained, not hidden."),
        section('reflection', "Following his example", "What would it mean to follow a teacher whose main message is to worship God?"),
      ], {"front":"Love is not worship","back":"Muslims honor Muhammad as a messenger and worship God. They disagree about some practices used to express their devotion."}),
      reading(6, "Why do Muslims trust Muhammad?", [
        section('opening', "A fair question", "Calling someone a prophet does not explain why people trust him. Muslims point to Muhammad’s message, the Quran, and reports about his life and character. These are things a curious person can look into."),
        section('reading', "Why the message matters to believers", "In the Quran, Muslims hear a call to worship one God, care for people in need, and answer for wrongdoing. In reports about Muhammad’s life, they look for how he lived by that message. Many find the link between the teaching and the life convincing."),
        section('reading', "Different reasons need different questions", "You can read the Quran for yourself. A story about Muhammad needs a source and a check of how it was passed down. A believer’s personal experience is another kind of reason. These are related, but they are not the same kind of evidence."),
        section('distinction', "You can take time to look", "Muslim accounts describe a trustworthy messenger. Historians also ask when those accounts were written and how reliable they are. This short course cannot settle every question. You can first understand why Muslims trust him, then look more closely at particular claims."),
      ], {"front":"Reasons for trust","back":"Muslims connect trust in Muhammad with his message, the Quran, and reports about his life.","reconsider":"Is this reason a text, a historical report, or a person’s experience?"}),
    ], [
      consider("A message someone lives", "If Muslims have the Quran, why also study how Muhammad lived?",
        "The Quran gives teaching. A life shows how teaching can be put into practice. Muslims trust Muhammad’s example because they believe he was God’s messenger. They still need to check particular reports about his life.", 'connection'),
      situation("Looking into a story", "Someone says a story proves Muhammad was a prophet. What could help you look into it?",
        ["Ask where the story comes from and what it shows.", "Accept every story because Muslims respect him.", "Reject every story told by a believer."],
        "Ask where the story comes from and what it shows.",
        "It helps to ask both where a story comes from and what it shows. Respecting a faith does not stop someone from checking its reports carefully.",
        "Accepting or rejecting every story without checking does not tell us much. Asking about the source and what it shows gives us something we can examine."),
    ]),
    day(3, "Reading the Quran",
      "We have met the messenger. Now we turn to the text Muslims believe he received, and how to read it carefully.",
      "The Quran, its translations, and explanations are related but different. Knowing which one you are reading makes it easier to ask clear questions.", [
      reading(7, "What is the Quran?", [
        section('opening', "A book of guidance", "Muslims believe the Quran is God’s message to Muhammad. It speaks about God, gratitude, injustice, earlier prophets, and life after death. Muslims read it for guidance about how to live, not only for information."),
        section('reading', "What it asks people to notice", "The Quran often asks people to think about the world and their actions. A passage may move from nature to helping others, or from a prophet’s story to a question for the reader. It does not follow the order of a modern textbook."),
        section('distinction', "Read around a verse", "One translated sentence may be hard to understand on its own. The verses around it and a reliable commentary can help. A commentary is someone’s explanation of the Quran; it is not part of the Quran itself."),
      ], {"front":"Read around a verse","back":"Nearby verses and a reliable commentary can help us understand a passage. The commentary is an explanation, not part of the Quran."}),
      reading(8, "How did the Quran reach people?", [
        section('opening', "A message received over time", "Muslims believe the angel Gabriel brought God’s message to Muhammad over about twenty-three years. The message came during real events: prayer, opposition, travel, family life, and the growth of a community."),
        section('example', "Life helps explain the words", "Words about patience may carry a different weight when someone is being mistreated. Teaching about justice matters in a new way when people gain power. Knowing the setting can help us understand what a passage is addressing."),
        section('reading', "Remembering and writing", "Muslim tradition describes people reciting, learning by heart, and writing down the message. The Quran’s chapters are not arranged as a simple timeline. Muslims believe Gabriel brought the message; he did not create it."),
        section('distinction', "Check the history too", "Stories about why a verse was revealed are historical reports. Some are better supported than others. A helpful explanation should say what is known and where there is doubt."),
      ], {"front":"A message received over time","back":"Muslims believe the Quran was revealed during the life of Muhammad and his community. Knowing the setting can help explain a passage."}),
      reading(9, "Do I need to know Arabic?", [
        section('opening', "You can begin with a translation", "The Quran was revealed in Arabic. Muslims keep and recite that wording, but you can begin learning what it means through a translation. You do not need to speak Arabic before you can ask questions."),
        section('distinction', "Three different kinds of text", "The Arabic is the Quranic text. The English translation is a translator’s way of expressing its meaning. Our explanation adds help for the reader. Clear labels let you see which one you are reading."),
        section('reflection', "Why translations differ", "Two translations may use different English words for the same Arabic passage. That does not make them two different Qurans. It can help to compare the wording and ask why the translators made different choices."),
      ], {"front":"Text, translation, explanation","back":"The Quran’s Arabic, a named translation, and the app’s explanation have different roles.","reconsider":"Which kind of text am I reading now?"}),
    ], [
      situation("Which words are the source?", "An app adds an explanation below a translated verse. How should we read that explanation?",
        ["The explanation is another Quran verse.", "The explanation helps us understand but is not the Quran."],
        "The explanation helps us understand but is not the Quran.",
        "Labels help us see the Arabic, the translator’s words, and the app’s explanation separately. An explanation may be helpful without being part of the Quran.",
        "An explanation is someone’s attempt to help us understand. Putting it beside a verse does not make it another verse."),
      consider("When a verse is unclear", "A verse sounds confusing in English. What could you read alongside it before deciding what it means?",
        "Nearby verses, a named translation, and a reliable commentary can help. The historical setting may matter too. A difficult question may stay difficult, but these give us a better place to begin."),
    ]),
    day(4, "The main beliefs",
      "How do God, revelation, and a messenger fit into one view of life? Today connects the main ideas before we go further.",
      "Islam describes a Creator who guides people, choices that matter, and a return to God in which no injustice is forgotten.", [
      reading(10, "How do the main beliefs fit together?", [
        section('opening', "Start with the connections", "A common Sunni summary names six beliefs: God, angels, revealed books, messengers, the Last Day, and God’s decree. Sunni Muslims are the largest Muslim tradition. Other Muslim traditions group the main beliefs in somewhat different ways."),
        section('reading', "One view of life", "God gives life and guidance. Angels and messengers help explain how that guidance reaches people. Revelation speaks to how people live. The Last Day means our actions matter beyond this life. God’s decree means nothing is outside His knowledge and power."),
        section('reflection', "Questions we will return to", "This brings up real questions. If God knows everything, how do people choose? How can justice take every person’s life into account? We will come back to these. For now, notice the link between guidance and responsibility."),
      ], {"front":"Guidance and responsibility","back":"Islam connects God, His guidance, our choices, and our return to Him. Muslim traditions group the main beliefs in different ways."}),
      reading(11, "Why does Islam include earlier prophets?", [
        section('opening', "Guidance before Muhammad", "Muslims believe God sent prophets before Muhammad. The Quran honors Abraham, Moses, and Jesus, among others. Muslims see Muhammad as the final messenger in a long history of guidance."),
        section('reading', "Shared names, different beliefs", "Islam teaches that these prophets called people to worship one God. This does not mean every community had the same rules. It also does not mean Jews, Christians, and Muslims agree about each prophet."),
        section('example', "Meeting a familiar name", "A Christian reader may recognize Jesus in the Quran and then find teachings that differ from those in church. A shared name can open a conversation. It does not mean every belief about that person is shared."),
      ], {"front":"Prophets before Muhammad","back":"Muslims believe many prophets called people toward God before Muhammad. Shared figures do not mean all faiths agree about them."}),
      reading(12, "Why do our choices matter?", [
        section('opening', "What if no one notices?", "A kind act may go unseen. A wrong may never reach a court. Islam teaches that death does not erase these actions. People return to God, who knows their lives fully."),
        section('distinction', "God’s knowledge is not an excuse", "Muslims also believe in Qadr, often called divine decree or God’s plan. Nothing is outside God’s knowledge and power. This belief does not give someone permission to hurt others and blame fate."),
        section('reading', "Begin with the choice in front of you", "You do not have to solve every difficult question today. The practical teaching is clear: what people choose matters, even when nobody else sees it. Later lessons look more closely at God’s knowledge and human choice."),
      ], {"front":"An unseen act still matters","back":"Muslims believe God knows our lives fully and that we return to Him.","reconsider":"How might this affect a choice nobody else will notice?"}),
    ], [
      consider("A kindness no one sees", "Muslims believe God knows everything and that people return to Him. What does that mean for a kindness no one notices?",
        "The kindness is not lost because people forget it. Muslims believe God knows it and that actions matter beyond this life. This connects daily choices with both hope and responsibility.", 'connection'),
      consider("A familiar prophet", "Why might finding Jesus or Moses in the Quran feel familiar and also raise new questions?",
        "Islam honors these figures within its own teaching about God. Other faiths understand them differently. A shared history can begin a conversation without meaning every belief is shared."),
    ]),
    day(5, "The unseen",
      "Muslims believe there is more to reality than we can see. That does not mean every story about the unseen should be accepted.",
      "Belief in the unseen is not a reason to invent hidden causes for every event. We still need sources, evidence, and practical care.", [
      reading(13, "What do Muslims believe about angels?", [
        section('opening', "Beings created by God", "Muslims believe angels are beings God created to serve Him. They carry out tasks He gives them. Muslims believe Gabriel brought revelation to Muhammad, which connects angels with what we have learned about the Quran."),
        section('distinction', "Angels are not gods", "Angels are not smaller gods or powers that compete with God. They belong to His creation. Muslims worship the Creator, not the angels who serve Him."),
        section('reading', "What can we know?", "For Muslims, there is more to reality than the human world we see. But that does not mean we know every detail of unseen life. Claims about angels need religious sources, not made-up details."),
      ], {"front":"Angels serve God","back":"Islam describes angels as beings created to serve God. They are not gods or independent powers."}),
      reading(14, "What are jinn?", [
        section('opening', "Teaching and stories", "The Quran describes jinn as beings different from humans who can make moral choices. They are not angels or the spirits of dead people. Many popular stories about them go beyond what the Quran says."),
        section('reading', "Choices beyond human life", "Islam describes jinn as able to accept or reject guidance. So the teaching is about more than unusual beings: it also describes responsibility among a creation different from us."),
        section('distinction', "Do not rush to blame jinn", "Believing in jinn does not prove they caused an illness, a noise, or a difficult event. People still need evidence and practical help. A popular story is not automatically an Islamic teaching."),
      ], {"front":"Teaching and popular stories","back":"Islam describes jinn as a different creation with moral choices. A story about a particular event still needs its own evidence."}),
      reading(15, "How can we talk about the unseen?", [
        section('opening', "Not seeing is not proof", "We cannot see everything that exists. But that alone does not prove that angels or jinn exist. Muslims believe in them because of revelation—what they believe God has told them."),
        section('distinction', "An example has limits", "Some people compare the unseen to another dimension. That might help someone imagine the idea, but it is not a Quranic description. Islam does not give jinn a numbered dimension or give us a scientific map of angels."),
        section('reflection', "Knowing when to stop", "What is the difference between “there may be more than I can see” and “I know exactly what it is like”?"),
      ], {"front":"An example is not proof","back":"A comparison can make an idea easier to picture without proving it.","reconsider":"Where does the source end and someone’s guess begin?"},
      [{ type: 'Analogy note', reference: 'The comparison with dimensions', note: 'This is a modern explanatory comparison, not a Quran verse, hadith, or scientific demonstration of angels or jinn.' }]),
    ], [
      situation("Before blaming jinn", "Someone blames several difficult events on jinn. Does believing in jinn give enough reason to accept that explanation?",
        ["Believing in jinn is enough to prove they caused it.", "This event needs evidence of its own."],
        "This event needs evidence of its own.",
        "A claim about one event needs evidence of its own. Belief in the unseen does not remove the need to look for causes and seek practical help.",
        "Believing jinn exist and knowing they caused this event are different claims. The first does not prove the second."),
      consider("Not seeing and knowing", "Why does “we cannot see everything” not prove that angels exist?",
        "It tells us our senses have limits. It does not tell us exactly what lies beyond them. Muslims base their belief in angels on revelation, so the next question is why they trust that source.", 'connection'),
    ]),
    day(6, "Choice and responsibility",
      "We did not choose where or how our lives began. What does responsibility mean within a life we do not fully control?",
      "The Trust and the covenant are two Quranic passages about people and God. Neither says that a person chose every hardship before birth.", [
      reading(16, "What does the Quran mean by a trust?", [
        section('opening', "A serious responsibility", "The Quran describes the heavens, earth, and mountains refusing a great Trust that humanity carries. It is a striking passage. Human responsibility appears as something serious, not simply a special privilege."),
        section('reading', "How scholars explain it", "Many Muslim scholars connect this Trust with religious duties, moral choices, and answering for our actions. They differ about its exact meaning. In this reading, our abilities bring duties toward God and other people."),
        section('example', "Something in your care", "If someone asks you to look after their property, you can use it only in ways they allow. You have power over it, but also a duty to care for it. This comparison helps explain responsibility; it is not the wording of the verse."),
        section('reflection', "Using what we have", "What changes if a person sees an ability as something they must use with care, rather than something they can use however they like?"),
      ], {"front":"A trust brings responsibility","back":"Many scholars understand the Quran’s Trust as moral and religious responsibility. It is not a story about choosing every detail of life before birth."}, [trust]),
      reading(17, "Did we choose our hardships?", [
        section('opening', "We do not control everything", "A person does not choose their birthplace, family, or many things that happen to them. The Quran’s passage about the Trust does not say each person chose every hardship before birth."),
        section('example', "Different starting points", "Two people may have very different chances to learn, earn money, or live safely. Calling both responsible does not mean their lives are the same. Islam teaches that God knows what each person faced."),
        section('distinction', "Focus on what a person can choose", "Responsibility depends on what people intend, can do, and choose to do. It does not mean blaming someone for being in pain. A person who is suffering may need help, justice, or someone to listen—not a story that they asked for it."),
      ], {"front":"We did not choose everything","back":"Responsibility does not mean a person chose everything that happened to them. Belief should not become blame for someone’s hardship."}),
      reading(18, "What is the covenant with God?", [
        section('opening', "Recognizing God as Lord", "Quran 7:172 describes the descendants of Adam recognizing God as their Lord. Muslims often call this the covenant: a passage about the bond between humanity and God, and our responsibility to Him."),
        section('distinction', "Scholars explain it differently", "Some scholars understand this as an event before earthly life. Others connect it with a natural human ability to recognize God. The verse is not a story about choosing a future family, job, or every event in a life."),
        section('reading', "Two passages, not one story", "The Trust is in Quran 33:72. The covenant is a separate passage. Both help Muslims think about their relationship with God. We can see that connection without adding details neither passage gives us."),
      ], {"front":"Keep the two passages separate","back":"The covenant speaks about recognizing God. The Trust is often explained through responsibility. Neither describes choosing all our future circumstances."}, [covenant]),
    ], [
      situation("A claim about someone’s pain", "Someone says, “You accepted the Trust, so you chose this hardship before birth.” What is wrong with that claim?",
        ["The verse does not say each person chose their hardships.", "It must be true if the hardship later feels meaningful."],
        "The verse does not say each person chose their hardships.",
        "The verse speaks about responsibility. It does not say each person chose their suffering. We should not add a story about someone’s life that the passage does not give.",
        "A person may find meaning in something without having chosen it. The verse does not tell us that everyone agreed in advance to every hardship."),
      consider("Different chances to act", "Why does God’s full knowledge matter when two people have very different chances to help?",
        "Islam teaches that God knows what people understood, intended, and could do. People have equal worth without having the same resources or facing the same demands.", 'connection'),
    ]),
    day(7, "Life after death",
      "We began with the purpose of life. This week ends with why Muslims believe our lives still matter beyond death.",
      "God needs nothing, yet gives guidance. People’s choices matter, and mercy remains possible. These ideas begin to show how Islam understands a human life.", [
      reading(19, "What do Muslims believe happens after death?", [
        section('opening', "Life does not simply end", "Islam teaches that people will be raised after death and return to God. Muslims believe each life remains known to Him, and people will answer for how they lived. This is called resurrection."),
        section('reading', "Why it matters today", "A small kindness is not lost because no one remembers it. A wrong is not forgotten because no court dealt with it. Belief in the next life gives Muslims hope for justice and a reason to take this life seriously."),
        section('distinction', "This life still matters", "Belief in another life does not make suffering here unimportant. Caring for people and protecting life are part of our responsibility now. Islam teaches resurrection, not repeated lives on earth through reincarnation."),
      ], {"front":"Life beyond death","back":"Muslims believe people will be raised after death and return to God. This gives care and justice in this life lasting meaning."}),
      reading(20, "How does God judge fairly?", [
        section('opening', "We do not see the whole story", "We may see what someone did without knowing their reasons, what they knew, or whether they were forced. Islam teaches that God knows all of this. His judgment does not miss the things people miss."),
        section('example', "The same result, different reasons", "Two people fail to bring help they promised. One had an emergency; the other did not bother. The result looks the same. Their reasons and what they could do make a difference to their responsibility."),
        section('reading', "Be careful when judging others", "Muslims believe God already knows the whole story. He does not need to find out new facts. This can encourage people to look honestly at their own actions and be careful about claiming to know someone else’s place with God."),
        section('reflection', "More than the result", "What would be missing if justice looked only at the result and never at what happened behind it?"),
      ], {"front":"More than what we see","back":"Islam teaches that God knows our actions, reasons, knowledge, and circumstances.","reconsider":"What might I not know when I judge a result?"}),
      reading(21, "Can God forgive and still be just?", [
        section('opening', "Wrongdoing matters, and change is possible", "Muslims believe in Paradise and Hell, and in God’s mercy and forgiveness. Wrongdoing is serious. But a person can repent—turn away from wrong and try to change. Their worst action does not have to be their last word."),
        section('distinction', "Forgiveness does not make harm unimportant", "Repentance means trying to stop the wrong. If someone else was harmed, their rights matter too. Hope in God’s mercy is not permission to keep hurting people. Nor should we claim that someone else has no hope of forgiveness."),
        section('reflection', "Hope and a fresh start", "How might hope of forgiveness help someone admit a wrong and begin to put it right?"),
      ], {"front":"Hope can help us change","back":"Islam connects responsibility with mercy and repentance. Turning away from wrong does not remove another person’s rights.","reconsider":"How might hope help someone admit a wrong and put it right?"}),
    ], [
      consider("Hope that helps someone change", "How might belief in forgiveness help someone take responsibility for a wrong?",
        "If change is possible, admitting a wrong does not have to mean giving up. Islam connects repentance with stopping the wrong and trying to repair harm. Mercy is not permission to keep hurting others.", 'connection'),
      situation("The same result, different reasons", "Two people fail to keep a promise. One had an emergency; the other did not bother. What matters when judging their actions?",
        ["Only whether they kept the promise.", "The result, their reasons, and what each could do."],
        "The result, their reasons, and what each could do.",
        "Muslims believe God knows the whole situation. What someone intended and could do matters alongside the result.",
        "The result matters to the person waiting for help. But it does not tell the whole story. We also need to consider the reasons and what each person could do."),
    ]),
    day(8, "Daily prayer",
      "Faith reaches into ordinary life. Daily prayer gives Muslims a regular way to remember that connection.",
      "Prayer helps people turn back to God throughout the day. Its direction and words serve that purpose; Muslims worship God, not a building or an object.", [
      reading(22, "Why do Muslims pause to pray?", [
        section('opening', "Remembering what matters", "Work, worries, and messages can fill a whole day. Muslims pray to worship God and remember Him. The regular prayer, called salah, gives them a way to return to Him during daily life."),
        section('example', "In the middle of work", "A Muslim leaves a task to pray, then comes back to it. The work still matters. Prayer is a reminder that earning a living is part of life, but not its whole purpose."),
        section('distinction', "More than a way to relax", "Prayer may bring calm, but Muslims understand it first as worship. A prayer can still matter when someone feels distracted or upset. God does not need the prayer; the person is responding to His guidance."),
        section('reflection', "Back to the same task", "How might prayer change the way someone approaches the work they return to?"),
      ], {"front":"Prayer helps people remember","back":"Muslims pray to worship and remember God during daily life. Calm may come from prayer, but it is not prayer’s only purpose."}),
      reading(23, "Why pray five times a day?", [
        section('opening', "Across the whole day", "The five daily prayers take place around dawn, midday, afternoon, sunset, and night. They bring worship into different parts of the day, rather than leaving it for one weekly visit."),
        section('reading', "We need reminders", "Understanding something once does not mean we always remember it. A familiar prayer can help someone return after becoming distracted. The same words may also mean more to them as their life changes."),
        section('distinction', "Lives and schedules differ", "Muslims differ about some prayer times and when prayers may be combined. Travel and illness also bring different needs. Five prayers are shared across Muslim practice, but not every person’s schedule looks the same."),
      ], {"front":"We need reminders","back":"Daily prayer brings people back to God at different times. Understanding something once does not mean we always remember it."}),
      reading(24, "Why face Mecca when praying?", [
        section('opening', "A shared direction", "Muslims face the Kaaba in Mecca during formal prayer. This direction is called the qibla. It connects people praying in different homes, mosques, and countries."),
        section('distinction', "God is not inside the building", "Muslims do not believe the Kaaba is God or that He lives inside it. They face the building, but worship God. The direction of prayer and the one being worshipped are different."),
        section('example', "Prayer away from a mosque", "A traveler may pray in an ordinary room, finding the direction as best they can. Prayer does not need to happen in one special building. Muslims believe they can turn to God wherever they are."),
      ], {"front":"A shared direction","back":"Muslims face the Kaaba and worship God. A shared direction does not make the building divine."}),
    ], [
      situation("A pause during work", "A Muslim stops working for a few minutes to pray. What is the prayer meant to help them remember?",
        ["God and the wider purpose of life.", "That work and daily duties have no religious value."],
        "God and the wider purpose of life.",
        "Prayer helps people remember God and the purpose of life. Their work still matters. Honesty and care at work can also be part of faith.",
        "Prayer is not a reason to neglect daily duties. A Muslim can return to work seeing honesty, care, and effort as part of serving God."),
      consider("Facing a place, worshipping God", "How can Muslims face the Kaaba without believing God lives inside it?",
        "The direction brings the people praying into a shared practice. It does not limit God to that place. Muslims face the Kaaba and pray to God.", 'connection'),
    ]),
    day(9, "Preparing for prayer",
      "Prayer includes the body, words, washing, and sometimes other people. How do these parts help someone worship?",
      "A mosque, washing, and prayer movements help people prepare and worship. The teaching also recognizes that bodies and abilities differ.", [
      reading(25, "What is a mosque for?", [
        section('opening', "Prayer and community", "A mosque is a place for Muslim prayer. It may also offer classes, shared meals, or help for neighbors. What matters is the worship and care that happen there. Muslims do not believe the building contains God."),
        section('example', "Standing beside someone new", "At a mosque, people may pray beside someone they would not otherwise meet. This can bring people together. Whether a visitor feels welcome also depends on how the community treats them."),
        section('reading', "Visiting for the first time", "You can ask a local mosque when to visit, what to wear, and where to sit. Arrangements differ. You can watch respectfully without knowing the prayer or saying you share the faith."),
      ], {"front":"Prayer and community","back":"A mosque brings people together for worship, learning, and care. A welcoming building still needs welcoming people."}),
      reading(26, "Why wash before prayer?", [
        section('opening', "Getting ready", "Wudu is a set way of washing and wiping parts of the body before prayer. It prepares a Muslim for worship. This religious state of being ready is called ritual purity; it is not just about removing dirt."),
        section('distinction', "Clean hands are not the whole question", "A person with clean hands may still need wudu. Someone whose wudu has not been broken may not need to repeat it. Muslim schools differ on some details of what breaks wudu."),
        section('reflection', "A change of attention", "How might washing help someone move from a busy task to giving their attention to prayer?"),
      ], {"front":"Getting ready for prayer","back":"Wudu is a religious preparation for prayer. Needing wudu is not the same question as having visible dirt on the body."}),
      reading(27, "Why bow during prayer?", [
        section('opening', "The body joins the words", "Muslim prayer includes standing, reciting, bowing, sitting, and placing the forehead on the ground. This last movement is called prostration. These actions express respect and humility before God."),
        section('example', "Actions can carry meaning", "Standing to greet someone or speaking gently can show respect. Prayer also uses actions to express something. The bowing and prostration are worship of God, not of the floor or anything in front of the person."),
        section('reading', "People have different abilities", "Someone who cannot stand or move in the usual way can pray in ways suited to their ability. How easily a person can move does not tell us how sincere their worship is."),
        section('reflection', "More than words", "What can an action express that words alone may not show?"),
      ], {"front":"The body joins the words","back":"Muslim prayer uses words and movements to express worship. The practice makes allowances for different physical abilities."}),
    ], [
      consider("Clean hands and wudu", "Why might someone with clean hands still need wudu?",
        "Wudu is a religious preparation for prayer, not only a way to remove dirt. Whether someone needs it depends on the rules of that preparation, not only on how clean their hands look."),
      consider("Different ways of moving", "One person stands to pray. Another sits because they cannot stand. What purpose do they share?",
        "Both are turning to God in worship. Prayer makes allowances for people’s abilities. A difference in movement does not mean one person is less sincere.", 'connection'),
    ]),
    day(10, "Fasting and Ramadan",
      "Fasting changes when people eat, but its purpose goes further. It also connects desire, gratitude, and care for others.",
      "Fasting teaches self-control and remembrance of God. Rules for people who cannot fast are part of the teaching, not a failure to follow it.", [
      reading(28, "Why is Ramadan special?", [
        section('opening', "A month for worship", "Ramadan is a month in the Islamic lunar calendar. Muslims connect it with fasting and the revelation of the Quran. Many give more time to prayer, reading the Quran, and helping others."),
        section('example', "Sharing an evening meal", "At sunset, people may gather to end the fast. A meal can be a time to give thanks and welcome others. But experiences differ: some people also face tiredness, loneliness, or long hours at work."),
        section('distinction', "Not every day feels the same", "A Muslim does not have to feel peaceful every day for Ramadan to matter. Its meaning does not depend on one mood, one kind of family, or one way of celebrating."),
      ], {"front":"A month for worship","back":"Ramadan brings fasting, Quran reading, and giving into daily life. It can matter without feeling the same to everyone."}),
      reading(29, "What is fasting meant to teach?", [
        section('opening', "Wanting something and waiting", "During Ramadan, Muslims who are required and able to fast avoid food, drink, and sexual activity from dawn to sunset. Fasting is worship. It is meant to help people remember God and learn self-control."),
        section('reading', "Food is not the enemy", "The fast does not teach that food or enjoyment is bad. People eat again at sunset. Waiting can help a person notice a desire without immediately following it, and feel grateful for things they usually take for granted."),
        section('distinction', "More than being hungry", "A person can be hungry and still treat others badly. Islamic teaching connects fasting with behavior too. Care for others should continue when the fast ends."),
        section('reflection', "Beyond meal times", "If a fast changes when someone eats but not how they treat people, what might be missing?"),
      ], {"front":"Fasting reaches beyond hunger","back":"Fasting is worship that teaches attention and self-control. It does not teach that food is bad.","reconsider":"What might someone carry from fasting into the rest of the day?"}),
      reading(30, "What if someone cannot fast?", [
        section('opening', "Different needs are recognized", "Fasting rules make allowances for illness, travel, menstruation, pregnancy, breastfeeding, and lasting inability to fast. These situations do not all have the same rules. The details depend on the person’s needs and the religious guidance they follow."),
        section('distinction', "An allowance is part of the teaching", "Someone who cannot safely fast is not simply choosing comfort over faith. They may need to make up days later or feed people in need. What applies depends on their situation."),
        section('reading', "Get advice for the actual situation", "Health questions need suitable medical advice as well as qualified religious guidance. Taking faith seriously does not mean ignoring the body or judging someone else without knowing what they face."),
      ], {"front":"Human limits matter","back":"Fasting rules take ability and circumstances into account. Seeing someone eat does not tell us their health or faith."}),
    ], [
      situation("When someone cannot fast", "Someone cannot safely fast because of illness. How should we understand the allowance not to fast?",
        ["It is part of the guidance for people with different needs.", "It means worship matters only when it is easy."],
        "It is part of the guidance for people with different needs.",
        "The teaching takes human limits into account. A person may need medical and religious advice about their own situation. Watching whether they eat does not tell us everything we need to know.",
        "Using an allowance can be part of following the teaching. How hard something is does not by itself measure a person’s faith."),
      consider("After the fast ends", "How could fasting still affect someone after sunset, when they can eat again?",
        "The hours of fasting end, but gratitude, self-control, and care for others can continue. Its purpose is wider than getting through a set time without food.", 'connection'),
    ]),
    day(11, "Giving and pilgrimage",
      "What does faith ask of someone’s money and ability? Giving and Hajj bring those questions into practice.",
      "Wealth and ability affect religious duties. Shared worship can connect people without pretending they all have the same resources.", [
      reading(31, "Why is giving part of faith?", [
        section('opening', "What we have brings duties", "Islam teaches that helping people in need is part of religious life. Wealth brings responsibility as well as comfort. Giving can express thanks to God and respect for other people’s rights."),
        section('example', "How we give matters", "A gift may help someone while the way it is given embarrasses them. Islamic teaching asks people to care about both. Someone who needs help deserves respect, not a place in a story about how generous the giver is."),
        section('reflection', "A gift or something owed?", "What changes if a person sees some of their giving as a duty toward others, not only a kind extra?"),
      ], {"front":"Giving includes care","back":"Islam connects wealth with duties toward others. How a gift is given can respect or embarrass the person receiving it."}),
      reading(32, "What is zakat?", [
        section('opening', "Giving that is required", "Zakat is required giving for Muslims whose wealth meets certain conditions. There are rules about what wealth counts and who can receive it. Sadaqah usually means giving freely beyond what is required."),
        section('distinction', "Duty and extra kindness", "Giving freely does not always replace a person’s zakat duty. And someone who does not have enough qualifying wealth does not owe the same as someone who does. The details matter."),
        section('reading', "Not a way to buy permission", "Zakat is part of obeying God and caring for people. It does not buy permission to harm others. Working out what one person owes takes more detail than this introduction can provide."),
      ], {"front":"Required and freely given","back":"Zakat is required when certain conditions are met; sadaqah is giving freely. Neither buys permission to ignore other people’s rights."}),
      reading(33, "Why do Muslims go on Hajj?", [
        section('opening', "A journey for worship", "Hajj is the major pilgrimage to Mecca. Muslims who are able to make the journey are required to go once in their lifetime. Its practices connect them with Abraham’s story and Muslims from around the world."),
        section('example', "A simpler appearance", "Male pilgrims wear simple unstitched cloths; women wear suitable modest clothing. Shared acts of worship can make differences in wealth and status less visible. They do not remove every inequality people face."),
        section('distinction', "Being able to go matters", "Health, money, and practical safety affect whether someone can go. A person who cannot make the journey has not simply failed. Hajj is worship of God, not of the places or objects people visit."),
      ], {"front":"A journey for worship","back":"Hajj connects worshippers with God, Abraham’s story, and a worldwide community. The duty depends on being able to go."}),
    ], [
      consider("Giving as a duty", "How does calling some giving a duty change the relationship between the giver and someone in need?",
        "The person’s right to help does not depend only on whether a giver feels generous. Zakat gives helping others a required place in religious life. People can still give more freely."),
      consider("What people are able to do", "What do zakat and Hajj show about the link between resources and religious duties?",
        "Both have conditions about what a person has and can do. Sharing a faith does not mean people with very different means all face the same demand.", 'connection'),
    ]),
    day(12, "Everyday choices",
      "Food, money, and clear judgment may seem like separate subjects. Islam connects them through guidance about how people live.",
      "A religious rule and a person’s explanation for it are different things. So are meeting one rule and treating people fairly in every part of life.", [
      reading(34, "What do halal and haram mean?", [
        section('opening', "Guidance for daily choices", "Halal means allowed; haram means forbidden. Muslims use these words about food, money, relationships, and behavior. They are part of trying to follow God’s guidance in daily life."),
        section('example', "More than a food label", "A shop may sell halal food but cheat its workers. The ingredients answer one question; the treatment of workers raises another. A halal label does not make every part of the business fair."),
        section('distinction', "Not every answer is a simple label", "Islamic law also describes duties, recommended actions, and things best avoided. Scholars disagree about some cases. Knowing two words does not mean every new situation is easy to judge."),
      ], {"front":"Halal is wider than food","back":"Allowed and forbidden also apply to money and behavior.","reconsider":"What does a label tell us, and what does it leave unanswered?"}),
      reading(35, "Why do Muslims avoid pork?", [
        section('opening', "Following a religious teaching", "The Quran forbids pork, while allowing it in cases of necessity. Muslims follow this as a religious rule. The rule does not depend on proving that every portion of pork would make someone ill."),
        section('reading', "A rule and reasons offered for it", "Muslims may discuss the wisdom behind a rule. But a person’s suggested explanation is not the same as God’s words. A doubtful health claim should not be presented as the foundation of the teaching."),
        section('reflection', "Trust and explanation", "Can you understand why someone trusts a command while questioning some reasons people give for it?"),
      ], {"front":"A rule and a suggested reason","back":"Muslims avoid pork because of a religious command. A person’s suggested health reason is a separate claim that can be checked."}),
      reading(36, "Why do Muslims avoid alcohol?", [
        section('opening', "Protecting clear judgment", "Mainstream Islamic teaching forbids intoxicating drinks—drinks that affect a person’s judgment. Clear judgment matters for prayer, relationships, and daily duties. The teaching is not only about people with an addiction."),
        section('example', "Other people can be affected", "When a person cannot think clearly, others may be harmed or left without needed care. Islam asks people to think about these effects, not only how a drink makes them feel."),
        section('distinction', "A rule does not remove care", "A person struggling with alcohol still deserves care and practical help. Detailed questions about medicines or very small amounts in ingredients need their own religious guidance."),
      ], {"front":"Clear judgment matters","back":"Mainstream Islam forbids intoxicating drinks. A person’s judgment affects prayer, daily duties, and other people."}),
    ], [
      situation("A label is not the whole story", "A shop sells halal food but refuses to pay its workers. What does the halal label tell us?",
        ["Every part of the business meets Islamic teachings.", "The food meets one rule; paying workers fairly still matters."],
        "The food meets one rule; paying workers fairly still matters.",
        "Islamic guidance includes fair business and care for people, not only food ingredients. Meeting one rule does not settle every question about the business.",
        "A food label does not give permission to harm workers. Their right to be paid is still part of the religious teaching."),
      consider("A rule and an explanation", "Someone offers a weak health reason for avoiding pork. How is that different from the religious reason Muslims give?",
        "Muslims base the rule on a religious command. A suggested health explanation is a separate claim that can be checked. You can understand that difference without agreeing with the command yourself."),
    ]),
    day(13, "Modesty and clothing",
      "Clothing is easy to notice. Modesty also asks about speech, attention, and responsibility for our own actions.",
      "Modesty concerns men and women. A person’s clothing cannot tell their whole story, and it never excuses someone else’s harmful behavior.", [
      reading(37, "What does modesty mean?", [
        section('opening', "More than clothing", "In Islam, modesty includes how people dress, look at others, speak, and behave. Hijab often means a Muslim woman’s head covering in everyday speech. That is one part of a wider subject."),
        section('example', "Clothes and words", "Someone may dress modestly but hurt others through gossip. Clothing and speech both matter. Following one teaching does not make the other unimportant."),
        section('distinction', "Faith and local style", "Muslims wear different clothes across cultures. A particular color or national style is not automatically required for every Muslim. It helps to separate a religious principle from the local way it is expressed."),
      ], {"front":"Modesty includes behavior","back":"Islamic modesty includes clothing, attention, speech, and actions. One cultural outfit does not define the whole teaching."}),
      reading(38, "Why do some women wear hijab?", [
        section('opening', "Faith and personal experience", "Many Muslim women cover their hair because they believe God asks them to. Most traditional legal scholars consider it a duty around men outside certain close family relationships. Some Muslims today disagree with that interpretation, and practice varies."),
        section('reading', "Listen to the person", "A woman may speak about faith, belonging, pressure, or a change in her life. Her clothing alone cannot tell a stranger her story. Women who do not cover also have their own lives and relationship with religion."),
        section('reflection', "What can we really know?", "What can clothing show, and what would you need to ask the person herself?"),
      ], {"front":"Clothing is not a whole story","back":"Many women wear hijab as part of obeying God. Their beliefs and experiences differ.","reconsider":"What am I assuming that this person has not told me?"}),
      reading(39, "Does modesty apply to men too?", [
        section('opening', "Men have responsibilities too", "The Quran speaks to men about how they look at others and how they behave. Men also have teachings about clothing, sexual behavior, and respect. Modesty is not only a task for women."),
        section('distinction', "Each person answers for their behavior", "Another person’s clothing is not permission to harass or hurt them. Appeals to modesty should not become excuses for someone’s harmful choices."),
        section('reading', "A link with what we learned", "People do not choose everything they encounter. But they remain responsible for how they choose to treat another person. This is the same difference we saw between a situation and a person’s response to it."),
      ], {"front":"Each person answers for their actions","back":"Modesty also addresses men’s behavior. Another person’s clothing does not remove our responsibility for our choices."}),
    ], [
      consider("What clothing cannot tell us", "Why can hijab matter to a woman’s faith without telling us whether she felt pressure to wear it?",
        "The practice has a religious meaning, but each person has her own story. We should not assume pressure, or assume there was none, without listening to her."),
      situation("Who chose the harmful action?", "Someone excuses harassment by criticizing another person’s clothes. What needs to be made clear?",
        ["The person who harasses is responsible for that choice.", "The clothes make the person being harassed responsible."],
        "The person who harasses is responsible for that choice.",
        "Modesty includes responsibility for one’s own behavior. Another person’s appearance is not an excuse to harm them.",
        "Responsibility cannot be passed to the person being harassed. Whatever someone thinks about clothing, the choice to harass belongs to the person doing it."),
    ]),
    day(14, "Marriage and family",
      "Marriage involves a relationship, an agreement, and duties toward another person. Local customs can make these harder to tell apart.",
      "Consent, rights, and fairness matter. Family help differs from force, and a practice being allowed does not make it required or wise in every case.", [
      reading(40, "What does marriage mean in Islam?", [
        section('opening', "An agreement with responsibilities", "Islamic marriage is an agreement that creates rights and duties. Muslim guidance today stresses that both people must agree to marry. Mahr is a gift or payment owed by the husband to the wife; it belongs to her."),
        section('reading', "The gift does not buy a person", "Mahr does not make a wife her husband’s property. Marriage comes with teachings about care, fairness, and responsibility. Family customs should not hide the wife’s right to her mahr."),
        section('distinction', "The details are not the same everywhere", "Scholars in the past disagreed about the powers of marriage guardians, including powers many dispute today. Religious guidance and civil law also differ by place. A short introduction cannot give one legal answer for every marriage."),
      ], {"front":"Marriage brings duties","back":"Islamic marriage involves rights, duties, and agreement between the spouses. Mahr belongs to the wife; it does not buy her."}, [{ type: 'Scholar explanation', reference: 'Egypt’s Dar al-Ifta, fatwa 8172 (2015)', url: 'https://www.dar-alifta.org/en/fatwa/details/8172/what-is-the-islamic-ruling-on-forcing-an-adult-female-to-marry-against-her-will', note: 'This institution rules against forcing an adult woman into marriage while documenting differing historical positions on guardianship. The ruling and the historical positions should not be conflated. This is a scholarly legal discussion, not a Quran quotation.' }]),
      reading(41, "Is an arranged marriage a forced marriage?", [
        section('opening', "Help can still leave a choice", "A family may introduce two people or help them arrange a marriage. That is different from forcing them to marry. The key question is whether both people can freely agree or refuse."),
        section('example', "Two different situations", "In one family, a person can turn down a suggested match. In another, saying no brings threats. Both may be called “arranged,” but pressure and threats make an important difference."),
        section('reflection', "A real choice", "What would make saying no a real option, rather than something a person is only told they can do?"),
      ], {"front":"Help should leave a choice","back":"An arranged introduction is different from a forced marriage.","reconsider":"Can the people involved really say no?"}),
      reading(42, "Marriage, fairness, and divorce", [
        section('opening', "Permission is not a duty", "Traditional Islamic law allows a man to have up to four wives under conditions that include duties of fairness. It does not require every man to do so. Muslim views and modern laws differ on how this applies."),
        section('distinction', "Rights still matter", "An arrangement being permitted does not end questions about fairness, rights, and harm. Religious permission does not mean someone may do anything they want without caring about the effects."),
        section('reading', "When a marriage ends", "Islamic legal traditions allow routes to divorce. Husbands and wives have often had different procedures and powers. The law and practical access differ by place. Knowing divorce exists does not mean it is equally easy for everyone to obtain."),
      ], {"front":"Allowed is not required","back":"Traditional permission for more than one wife does not remove duties of fairness. Divorce exists, but procedures and access differ."}),
    ], [
      situation("A choice that can be refused", "A family suggests a spouse and accepts the person’s choice to say no. How is this different from forced marriage?",
        ["The family did not help at all.", "The person had a real choice."],
        "The person had a real choice.",
        "Family help does not automatically remove choice. Threats or force do. What matters is whether the person can really agree or refuse.",
        "A family can help while leaving the person free to choose. The key is whether they can say no without threats or force."),
      consider("Allowed does not mean required", "Why does a practice being allowed not make it required or wise in every situation?",
        "Permission answers one question. Other people’s rights, the situation, and possible harm still matter. Something allowed is not automatically the best choice for everyone.", 'connection'),
    ]),
    day(15, "Life’s purpose",
      "We return to a question from the first day: if God needs nothing, why does worship matter?",
      "For Muslims, purpose can shape quiet work, family care, and daily choices. A good aim still needs a good way of acting.", [
      reading(43, "Does God need us?", [
        section('opening', "Worth is more than usefulness", "People often measure their worth by what they can do for others. Islam teaches that God needs nothing from us. Our worship does not keep Him alive or make Him stronger or less lonely."),
        section('distinction', "A relationship without need", "Muslims believe God guides people, shows mercy, and hears their prayers. People need Him, but He does not need them in return. A person can matter to God without filling a gap in His life."),
        section('reflection', "When a person needs help", "If God does not gain power from our success, what might that mean for someone who is weak or needs care from others?"),
      ], {"front":"Worth is more than usefulness","back":"Islam teaches that God does not need us, while our lives still matter to Him.","reconsider":"Must a person be useful in order to matter?"}),
      reading(44, "What is life for?", [
        section('opening', "A purpose for the whole day", "Islam teaches that human life is for knowing and worshipping God. That includes care for others, honest work, fairness, and preparing to return to Him. This purpose reaches beyond prayer times."),
        section('example', "Work that few people notice", "Caring for a family member can be tiring and repetitive. Other people may hardly notice it. A Muslim may see that care as important to God, even when it brings no praise or public success."),
        section('reading', "Rest belongs in life too", "Worship does not mean looking serious every moment. Rest and permitted enjoyment have a place in life. They can help a person meet their responsibilities, while responsibilities keep pleasure from becoming the only aim."),
      ], {"front":"Quiet work can matter","back":"An ordinary duty can matter to God even when no one praises it. Rest and permitted enjoyment also have a place in life."}),
      reading(45, "Can ordinary work be worship?", [
        section('opening', "What we do and why", "Islam teaches that ordinary good actions can be worship when done sincerely for God and in ways He permits. A person might support a family, share food, or keep a promise with that intention."),
        section('distinction', "A good aim does not excuse harm", "Wanting to help one person does not make it right to cheat another. The reason for an action matters, but so does the action itself. Calling something worship does not make every method acceptable."),
        section('example', "Earning for a family", "Supporting a family can be part of faith. Getting that money through fraud still harms others and violates their rights. Both the aim and the way of reaching it matter."),
        section('reflection', "One life, different duties", "How can prayer and honest work serve the same purpose without one replacing the other?"),
      ], {"front":"The reason and the action matter","back":"Ordinary good actions can be worship when done sincerely for God. A good aim does not automatically excuse a harmful method."}),
    ], [
      consider("Who is worship for?", "If God needs nothing, what purpose can worship have?",
        "Muslims worship to respond to God with gratitude, obedience, and love. Worship can shape their lives and care for others. It matters without supplying something God lacks.", 'connection'),
      situation("A good aim and a harmful method", "Someone cheats a customer to earn money for their family. What two things need to be considered?",
        ["The good aim makes cheating acceptable.", "The family matters, and so do the customer’s rights."],
        "The family matters, and so do the customer’s rights.",
        "Supporting a family is a good aim. Cheating a customer still harms someone. Islam asks people to consider both their reasons and their actions.",
        "A good aim does not cancel another person’s rights. Worship cannot be used to excuse a harmful way of reaching that aim."),
    ]),
    day(16, "God’s knowledge",
      "People wait, guess, and find things out. What do Muslims mean when they say God knows everything?",
      "Muslims believe God’s knowledge is complete. Examples can help us picture one part of this idea without explaining every question about time and choice.", [
      reading(46, "What does it mean that God knows everything?", [
        section('opening', "How people find things out", "We live through events one after another. We remember the past, guess about the future, and sometimes discover we were wrong. It is natural to imagine all knowledge working this way."),
        section('reading', "God does not need to find out", "Islam teaches that God does not learn by waiting and watching. He knows an event before it happens. Our way of finding things out helps us ask the question, but Muslims do not believe it sets the limits of His knowledge."),
        section('reflection', "Knowing without guessing", "How is knowing an outcome different from making a prediction that might turn out to be right?"),
      ], {"front":"Knowing is not guessing","back":"People find things out over time. Muslims believe God’s knowledge is complete.","reconsider":"Am I imagining knowledge or a prediction that could fail?"}),
      reading(47, "Does God wait for the future?", [
        section('opening', "No new information for God", "Muslims believe God does not age, forget, or become better informed. Nothing happens that surprises Him. This connects with the idea we met earlier: God does not depend on anything."),
        section('distinction', "A shared belief, different explanations", "Muslim thinkers explain God’s relationship with time in different ways. “Outside time” is one way people discuss it. It is not a complete explanation that all Muslims express in exactly the same way."),
        section('reading', "Keep the main idea clear", "The belief here is that God knows fully. It does not mean He is simply very old and has seen more history than us. Deeper questions about time need more discussion than one short lesson."),
      ], {"front":"God does not learn new facts","back":"Islam teaches that no event brings new information to God. Muslim thinkers differ on how to explain His relationship with time."}),
      reading(48, "Can an example help us understand?", [
        section('opening', "Reading a story again", "Imagine reading a story for the second time. You know what will happen next, while the character does not. This can help us think about the difference between living through events and knowing how they unfold."),
        section('distinction', "Where the example stops helping", "God is not a reader learning from a book, and people are not fictional characters. The example cannot explain how God’s will relates to our choices. It is a comparison, not a proof or a Quranic description."),
        section('reading', "Use it for one small point", "What is still in the future for one person may already be known from another point of view. That is the point of the example. The religious belief about God comes from religious teaching, not from the story."),
      ], {"front":"An example helps with one point","back":"The story example separates living through events from knowing them. It does not make people fictional or solve every question about Qadr."},
      [{ type: 'Analogy note', reference: 'Reading a story again', note: 'An app-created comparison about perspectives on a sequence. It is not revelation or a demonstration of how God creates human actions.' }]),
    ], [
      consider("Knowing or guessing?", "How is God’s full knowledge different from a prediction that turns out to be right?",
        "A prediction uses limited information and can be wrong. Muslims believe God does not guess or wait to find out. How His knowledge fits with our choices still deserves further thought."),
      consider("Where the story example stops", "What can reading a story twice help us picture, and what does it leave unexplained?",
        "It helps separate living through events from knowing how they unfold. It does not explain how God’s will relates to a human choice. An example can be useful without answering everything.", 'connection'),
    ]),
    day(17, "God’s plan",
      "God’s knowledge is only part of Qadr. How do His will and power fit with choices that people answer for?",
      "Islam holds together God’s power and human responsibility. Muslim schools explain the details differently. We can understand the question without pretending it is easy.", [
      reading(49, "What is predestination?", [
        section('opening', "More than knowing the future", "Qadr is often translated as divine decree or predestination. Muslims believe nothing is outside God’s knowledge and power. Creation depends on Him. He is not simply watching a world that runs on its own."),
        section('reading', "Why the question is hard", "If God only watched, we might say that knowing a choice is not the same as forcing it. But Muslims also believe God wills and creates. How this fits with our choices is a real question that Muslim thinkers discuss."),
        section('distinction', "Keep both parts in view", "Islam teaches that God rules over creation and that people answer for their choices. Saying people are completely independent of God leaves out one part. Saying our choices do not matter leaves out the other."),
      ], {"front":"Qadr is more than foreknowledge","back":"Muslims connect Qadr with God’s knowledge, will, and power over creation. Human responsibility remains part of the teaching."}),
      reading(50, "How do Muslims explain God’s plan?", [
        section('opening', "One common explanation", "A common Sunni explanation speaks about God’s knowledge, recording, will, and creation. These ideas express the belief that nothing happens beyond His knowledge or power."),
        section('distinction', "Muslims do not all explain it alike", "Sunni schools differ about how our choices fit with God’s power. Shia traditions also offer their own explanations. Learning a list of terms does not settle the difficult question behind them."),
        section('reading', "Happening does not mean being right", "Muslim thinkers often distinguish what God allows to happen from what He commands people to do. The fact that a harmful act happened does not mean God approves of it or asks people to repeat it."),
        section('reflection', "A reason for moral guidance", "What would happen to ideas of right and wrong if everything that happened was automatically called good?"),
      ], {"front":"Happening does not make it right","back":"Muslim thinkers distinguish what happens within God’s decree from what He commands people to do. Otherwise every wrong could excuse itself."}, [{ type: 'Scholar explanation', reference: 'Shaykh al-Saduq, A Shi’ite Creed: constraint and delegation', url: 'https://al-islam.org/shiite-creed-shaykh-saduq/regarding-denial-both-constraint-and-delegation', note: 'This Shia theological text rejects both complete compulsion and complete independence. It offers one tradition’s account of the relation between divine sovereignty and agency; it is not the four-part Sunni summary or an account of every Muslim school.' }]),
      reading(51, "Why try if life is already planned?", [
        section('opening', "Our efforts are part of life", "Muslims are taught to seek good, avoid harm, and take practical steps. Their efforts are not outside God’s plan. They are part of the life in which people make choices and take responsibility."),
        section('example', "A promise to keep", "Someone who can keep a promise cannot avoid it by saying the future is already written. They do not know that future. What they have now is a choice and a duty to the person waiting."),
        section('reading', "A reason to act", "This explains why belief in Qadr need not stop people from trying. It does not solve every question about freedom. We can understand what the teaching asks people to do while still exploring how it all fits together."),
      ], {"front":"Effort still matters","back":"Muslims are taught to choose responsibly and take practical steps. Belief in God’s plan does not remove these duties.","reconsider":"What can this person responsibly do now?"}),
    ], [
      situation("Using fate as an excuse", "Someone breaks a promise on purpose and says, “It happened, so God must approve.” What is missing?",
        ["An act happening does not mean God approves of it.", "Anything that was going to happen must be right."],
        "An act happening does not mean God approves of it.",
        "What happens and what God commands are different questions. People still have guidance about how to act and responsibility for harm.",
        "If happening made an action right, every wrong would excuse itself. Belief in God’s decree is not permission to ignore moral duties."),
      consider("One answer is not the whole answer", "Why does “knowing a choice is not forcing it” help without settling every question about Qadr?",
        "It separates knowing from forcing. But Muslims also believe God wills and creates. How this fits with our choices needs more explanation, and Muslim schools differ on the details.", 'connection'),
    ]),
    day(18, "Our choices",
      "We do not control everything. That does not mean every choice is empty, or that every hardship is our fault.",
      "Responsibility depends on what people know, mean, and can do. Limits do not erase all choice, and choice does not give us control over everything.", [
      reading(52, "Is knowing a choice the same as forcing it?", [
        section('opening', "Two different claims", "Knowing what someone will choose and forcing them to choose it are different things. Separating them helps us avoid one common misunderstanding about God’s knowledge."),
        section('example', "A friend’s usual meal", "A friend may expect you to order your favorite meal. That expectation does not make you order it. The example shows a difference between guessing and forcing—but a friend’s guess can be wrong."),
        section('distinction', "The comparison has limits", "Muslims believe God’s knowledge is complete, unlike a human guess. The example also says nothing about how He creates or wills. It can help us ask a clearer question, but it does not settle the whole discussion."),
      ], {"front":"Knowing and forcing differ","back":"Knowing about a choice is not the same as forcing it. Human predictions are limited examples, not complete models of God’s knowledge."},
      [{ type: 'Analogy note', reference: 'A friend anticipating a meal choice', note: 'An everyday comparison that separates expectation from pressure. It cannot represent God’s complete knowledge or creative will.' }]),
      reading(53, "What parts of life do we not choose?", [
        section('opening', "The life we begin with", "We do not choose our birthplace, inherited traits, or many things that happen around us. Islam does not treat simply receiving these circumstances as something a person did wrong."),
        section('example', "Different chances to help", "One person can give time and money. Another struggles to pay for basic needs. Looking only at how much they give cannot tell us all about their effort, generosity, or ability."),
        section('reading', "Be careful with comparisons", "Muslims believe God knows what each person faces. This gives a reason not to judge people only by visible success. Painful circumstances do not automatically mean someone has done something wrong."),
      ], {"front":"Our starting point is not our choice","back":"Being born into difficult conditions is not wrongdoing. Visible success cannot show the whole story of effort or generosity."}),
      reading(54, "What choices do we have within our limits?", [
        section('opening', "Choice does not mean total control", "People have different levels of freedom, knowledge, and ability. Islamic teaching takes these into account. Being forced, being unable to act, or not knowing something can affect responsibility. The details need careful judgment."),
        section('distinction', "What help is possible?", "Not being able to fix a whole injustice is different from refusing help you can give. But having some choices does not make you responsible for everything you cannot prevent."),
        section('reflection', "A smaller choice can still matter", "What could someone do responsibly when they can change one part of a situation but cannot control the result?"),
      ], {"front":"A small choice can be real","back":"Responsibility relates to what someone can understand, intend, and do.","reconsider":"What is possible here, and what is beyond this person’s power?"}),
    ], [
      consider("A small action can help", "Someone cannot solve a neighbor’s hardship but can bring a meal. How could this small action still matter?",
        "It meets a real need. Islam connects responsibility with what a person can do, not with control over every result. They can help without becoming responsible for fixing everything."),
      situation("The amount is not the whole story", "Two people give the same amount, but one has much less money. What can the amount alone tell us about their sincerity?",
        ["The same amount proves the same sincerity.", "The amount alone cannot show their reasons or sacrifice."],
        "The amount alone cannot show their reasons or sacrifice.",
        "Muslims believe God knows what each person had, meant, and gave up. The visible amount is only one part of the story.",
        "We can count the money. We cannot read a person’s heart from that number. Their reasons and circumstances matter too."),
    ]),
    day(19, "Intention and change",
      "Two actions can look the same and have different reasons behind them. Islam asks us to notice this inward part of life too.",
      "Our reasons matter, but they do not cancel harm. Repentance joins a change of heart with stopping the wrong and repairing what we can.", [
      reading(55, "Why do our reasons matter?", [
        section('opening', "What is the action for?", "Islam gives great importance to intention: what someone means or hopes to do. People may give to help, to please God, to gain praise, or for several reasons at once. The same outward action can have different aims."),
        section('example', "Giving where others can see", "A public gift might encourage more people to help. It might also be a way to gain praise. Seeing the gift does not tell us which. A private action can have mixed reasons too."),
        section('distinction', "We cannot see another person’s heart", "Taking intention seriously invites people to look at their own reasons. It does not let them know everyone else’s. The source below is a hadith—a report of Muhammad’s teaching—not a Quran verse."),
      ], {"front":"Our reasons matter","back":"Islam cares about what a person means to do, not only how an action looks. Public or private actions can have different motives."}, [{ type: 'Hadith', reference: 'Sahih al-Bukhari 1 · excerpt', url: 'https://sunnah.com/bukhari:1', translationText: 'The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.', translationName: 'English translation published by Sunnah.com · excerpt', explanation: 'This report attributes the teaching to Muhammad. It connects the value of an act with its purpose. The excerpt is part of a longer report discussing migration; it is not Quranic text.' }]),
      reading(56, "Does a good effort count if we cannot finish?", [
        section('opening', "The result is not everything", "Islamic teaching values a sincere plan to do good, even when an obstacle stops someone from finishing. A person’s effort does not lose all meaning just because the result was not reached."),
        section('reading', "Being stopped and choosing not to act", "Wanting to help but being prevented is different from saying “I meant to” while refusing a chance to help. Intention is inward, but it usually connects with a willingness to act."),
        section('reflection', "An unfinished effort", "What would we miss if we counted only finished results and never the effort that illness or another obstacle stopped?"),
      ], {"front":"An unfinished effort can count","back":"Islam values sincere intention and effort when someone is prevented from finishing. This is different from refusing a chance to act."}),
      reading(57, "What does repentance involve?", [
        section('opening', "A person can turn back", "Repentance means turning away from wrong: stopping it, regretting it, and sincerely trying not to return to it. When another person’s rights were harmed, putting things right also matters."),
        section('example', "When something belongs to someone else", "Feeling sorry for taking money does not give the money back. The response needs to care for the person harmed too. Some situations need careful advice about how to make things right safely and fairly."),
        section('reading', "Hope does not erase the past", "Repentance is not pretending the wrong never happened. It is a chance to respond differently now. This is one way mercy and responsibility work together."),
        section('reflection', "After an apology", "What could turn an apology into the beginning of real change?"),
      ], {"front":"Turning back may mean repair","back":"Repentance includes regret, stopping the wrong, and taking responsibility. Feeling better does not remove the rights of someone who was harmed."}),
    ], [
      consider("Giving in public", "Why should we not assume every public donation is only for praise?",
        "Someone may give publicly to encourage others. They may have other reasons too. We do not know their heart just because we see the action."),
      consider("Feeling sorry and putting things right", "How does returning someone’s property connect repentance with responsibility?",
        "Feeling sorry is part of the response. Returning the property deals with the other person’s right. Feeling better inside does not by itself repair what was taken.", 'connection'),
    ]),
    day(20, "Facing suffering",
      "Questions about suffering may come from grief as well as thought. A careful answer must leave room for pain and what we do not know.",
      "Islam offers ways to think about hardship without telling us the reason for every loss. Care and justice do not need to wait for a complete explanation.", [
      reading(58, "Why would a merciful God allow suffering?", [
        section('opening', "A hard question deserves care", "People ask this because of grief, anger, concern for others, or a wish to understand. Muslim thinkers discuss human choices, natural causes, life as a test, and justice after death. A short list cannot remove the pain of a loss."),
        section('reading', "Two questions to keep apart", "Asking why a world can contain suffering is different from knowing why one person suffered one event. A general religious explanation does not reveal the hidden meaning of a particular tragedy."),
        section('distinction', "Do not make pain sound simple", "An example about a parent caring for a child cannot explain every war, illness, or death. It may make a person feel their pain has been dismissed. A better start is to admit what is hard and what we do not know."),
      ], {"front":"We do not know every reason","back":"Muslim thought offers ways to understand suffering without explaining every tragedy. An example cannot make another person’s pain simple."}),
      reading(59, "What can we admit we do not know?", [
        section('opening', "Trust without made-up answers", "Muslims believe God knows more than they do. That belief can help them trust Him in hard times. It does not mean they know a hidden reason for every event."),
        section('example', "Beside a grieving friend", "A friend can bring food, listen, or help with daily tasks without explaining why a loss happened. Saying “I do not know why” can leave room for grief instead of filling it with guesses."),
        section('reflection', "Making room to listen", "What might change in a conversation when someone stops trying to explain another person’s pain?"),
      ], {"front":"Trust can include “I do not know”","back":"Believing God knows more does not mean we have His knowledge. Admitting uncertainty can make room to listen and care."}),
      reading(60, "How should we respond to someone’s pain?", [
        section('opening', "Pain is not proof of blame", "Islamic tradition describes prophets and good people facing hardship. Illness or loss alone therefore cannot prove that God hates or is punishing a particular person."),
        section('distinction', "We can still look for causes", "A hardship may have natural or human causes even when its religious meaning is unknown. Looking for causes, preventing harm, and seeking justice are not a rejection of faith."),
        section('reading', "People still have duties", "When people cause harm, blaming fate must not hide their actions. When help is possible, guesses about hidden reasons must not replace it. We can ask “What can we do?” even without a full answer to “Why?”"),
        section('reflection', "Care without a full explanation", "What help is possible before we know the meaning of an event?"),
      ], {"front":"Pain is not proof of blame","back":"Suffering alone does not show God’s judgment of a person.","reconsider":"What care or justice is possible without knowing the hidden reason?"}),
    ], [
      situation("A friend facing a loss", "A friend has lost someone. Which response respects both faith and what we do not know?",
        ["Tell them exactly why God caused this loss.", "Offer help and admit we do not know the exact reason."],
        "Offer help and admit we do not know the exact reason.",
        "We can care without knowing God’s hidden reasons. A person can trust, grieve, and help without claiming the loss has been fully explained.",
        "A general belief that God is wise does not tell us why this loss happened. Making up a reason may stop us from hearing the person who needs care."),
      consider("Faith and seeking justice", "Can someone seek justice for harm while believing in God’s decree?",
        "Yes. Islam still holds people responsible for their choices. Looking into wrongdoing and protecting others does not require knowing the hidden meaning of the event.", 'connection'),
    ]),
    day(21, "Trust and effort",
      "What can someone do when the result is uncertain or a past choice cannot be undone?",
      "Trust can go with preparation, help, and effort. Accepting the past can also leave room to repair harm and choose differently now.", [
      reading(61, "What does trusting God involve?", [
        section('opening', "Trust and practical action", "Tawakkul means trust in God. Muslims commonly teach it alongside taking practical steps. People still prepare, ask for help, and make decisions. Trust includes turning to God through those efforts and with what lies beyond their control."),
        section('example', "Looking for work", "Someone can prepare an application and ask for advice. They cannot decide who gets hired. A Muslim may place that uncertainty with God while continuing to take useful steps."),
        section('distinction', "Trust is not a promise of success", "Effort and faith do not guarantee the result someone wants. An unwanted result is not proof that they trusted badly. This teaching is about living with uncertainty, not removing it."),
      ], {"front":"Trust goes with action","back":"Muslims are encouraged to take useful steps and trust God with what they cannot control. Trust does not guarantee the result they want."}),
      reading(62, "What can we do with regret?", [
        section('opening', "Learn from what happened", "A mistake can show us what to change. Muslim teaching encourages people to seek what helps them and warns against becoming stuck in endless “if only” thoughts about the past."),
        section('distinction', "Learning is different from punishing yourself", "Looking back may reveal a step to change or harm to repair. Replaying imagined alternatives again and again may teach nothing new. This is not a demand to stop grieving or a judgment on someone with distressing thoughts."),
        section('reading', "Asking for help can fit with faith", "A person does not have to face lasting distress alone. Seeking suitable help can be part of taking useful steps. It does not mean they have given up on faith."),
      ], {"front":"Learn without endless replay","back":"Looking back can help someone repair harm or act differently. Endless “if only” thoughts may not help. Asking for support can fit with faith."}),
      reading(63, "How can someone begin again?", [
        section('opening', "There is still a next step", "Islam teaches that repentance is possible after wrongdoing. A useful response asks what went wrong, who was harmed, and what can be changed now."),
        section('example', "A broken promise", "Someone misses a commitment through carelessness. They can admit it, make things right where possible, and change the habit behind it. Calling it fate does none of those things for them."),
        section('reflection', "Accepting the past, changing the next step", "How can a person accept that the past happened and still choose not to repeat the part they can change?"),
      ], {"front":"The past leaves a next step","back":"After a wrong, people may learn, put things right, and change their behavior.","reconsider":"What remains possible now?"}),
    ], [
      consider("Trying without a guarantee", "How can someone try their best without thinking God owes them the result they want?",
        "They can prepare, seek help, and care about the result while knowing it is not fully in their control. Trust is not a deal that guarantees success.", 'connection'),
      situation("After a mistake", "Someone says, “I accept what happened, and I need to put things right.” Does that go against trust in God?",
        ["No. A person can accept the past and take responsibility now.", "Yes. Accepting it means nothing should change."],
        "No. A person can accept the past and take responsibility now.",
        "Accepting the past does not mean approving the wrong. Repairing harm and changing behavior can both be part of trusting God.",
        "Accepting that something happened does not make it right. A person can still learn from it and repair what they can."),
    ]),
    day(22, "Jesus and Mary",
      "Jesus and Mary have an important place in Islam. Familiar names can open a conversation, while different beliefs still matter.",
      "Muslims honor Jesus and Mary within worship of one God. Respect for another faith includes describing its beliefs fairly, even when we disagree.", [
      reading(64, "What do Muslims believe about Jesus?", [
        section('opening', "A prophet and the Messiah", "Muslims believe Jesus was the Messiah and a messenger of God, born miraculously to Mary. They believe he performed miracles with God’s permission. He has an important place in Islam’s story of guidance."),
        section('distinction', "A miracle does not make someone God", "Muslims believe God makes miracles possible. A miracle through a prophet does not make that prophet divine. This is one important difference between Islam and mainstream Christian belief about Jesus."),
        section('reading', "A familiar word can mean different things", "Muslims and Christians both use the word “Messiah,” but explain Jesus’ role differently. To understand either view, we need to ask what the word means within that faith."),
      ], {"front":"Jesus is honored differently","back":"Muslims honor Jesus as Messiah and messenger, but do not believe he is God. The same title can sit within different beliefs."}),
      reading(65, "Why is Mary important in Islam?", [
        section('opening', "A woman honored in the Quran", "The Quran honors Mary for her faith and as the mother of Jesus. A chapter is named after her. Muslims believe Jesus was born to her without a human father."),
        section('reading', "Honor is not worship", "The Quran describes Mary turning to God for help. Her honored place does not make her divine. Most Muslim scholars do not call her a prophet, though some have understood this differently."),
        section('reflection', "Part of a longer history", "What does Mary’s place in the Quran show about Islam’s connection with earlier religious history?"),
      ], {"front":"Mary has an honored place","back":"The Quran honors Mary without making her divine. Her story connects Islam with a history before Muhammad."}),
      reading(66, "How does Islam differ from Christianity?", [
        section('opening', "Shared figures, real differences", "Islam and Christianity both speak about Jesus, Mary, and earlier prophets. They differ about who Jesus is, the crucifixion, scripture, and salvation—how people are saved. Christians also differ among themselves on some beliefs."),
        section('distinction', "Describe the other view fairly", "Mainstream Christians do not describe the Trinity as three separate gods. Islam rejects the Trinity, but understanding that disagreement means first listening to what Christians say they believe."),
        section('example', "A conversation can begin with listening", "Two neighbors can ask how each understands Jesus before debating whose belief is true. They can respect each other and still recognize that the difference matters."),
      ], {"front":"Respect does not require agreement","back":"Islam and Christianity share important figures but disagree about them. Explain a faith in words its followers could recognize."}),
    ], [
      consider("A miracle and its source", "Why do Muslims believe Jesus could perform miracles without being God?",
        "Muslims believe the power behind the miracle is God’s. A miracle through a messenger does not make that messenger the Creator.", 'connection'),
      consider("Respect and disagreement", "How can Islam and Christianity both honor Jesus while disagreeing about who he is?",
        "Muslims call Jesus a messenger and the Messiah. Mainstream Christians believe he is divine. Honoring the same person does not mean holding the same belief about him."),
    ]),
    day(23, "Shared history",
      "Islam has connections with earlier faiths and is lived within many cultures. How can we notice those links without confusing them?",
      "Shared words do not always mean shared beliefs. Practices can have several roots, so it helps to ask about the actual source and situation.", [
      reading(67, "Who are the People of the Book?", [
        section('opening', "A connection with earlier scripture", "The Quran uses “People of the Book” especially for Jews and Christians. The term recognizes their connection with earlier revelation and prophets in Islam’s account of religious history."),
        section('reading', "A connection is not complete agreement", "Quranic passages address these communities in different situations and tones. The term does not mean Islam accepts all their beliefs or that people always lived peacefully together. It names an important religious connection."),
        section('distinction', "A label is not the whole person", "Knowing someone is Jewish or Christian does not tell us everything they believe or do. The same is true of a Muslim. Listening to the person helps us understand more than a label can."),
      ], {"front":"A connection with earlier scripture","back":"“People of the Book” especially refers to Jews and Christians in the Quran. It does not mean complete agreement or describe every individual."}),
      reading(68, "What do these faiths share?", [
        section('opening', "A shared history, different teachings", "Judaism, Christianity, and Islam connect themselves with Abraham and other figures. They still differ about scripture, God’s promises, prophets, religious law, and Jesus. Each faith also has differences within it."),
        section('example', "The same word in different settings", "People from all three faiths may speak about revelation but mean different texts and ways of receiving guidance. A familiar word becomes clearer when we ask how that tradition uses it."),
        section('reflection', "Look for both", "What would we miss by looking only at what these faiths share? What would we miss by looking only at their differences?"),
      ], {"front":"Shared roots, different beliefs","back":"Faiths can have connected histories and still differ on major teachings.","reconsider":"Have we noticed both the similarities and the differences?"}),
      reading(69, "How do culture and religion differ?", [
        section('opening', "A practice can have several roots", "A Muslim wedding, home, or government may reflect religion, culture, money, politics, and habit. Seeing a practice does not tell us where every part of it came from."),
        section('distinction', "Do not explain everything away as culture", "Some harmful acts go against religious teachings. Others involve disputed interpretations or historical religious rules. Calling every difficult example “just culture” can hide a question that deserves an honest answer."),
        section('reading', "Ask about the particular practice", "What source is being used? How is it explained? Do scholars disagree? Is a family custom being treated as God’s command? These questions help separate different kinds of authority without pretending they never overlap."),
        section('example', "A wedding example", "A large wedding party may be expected by a family without being required by Islam. The marriage agreement raises different religious and legal questions. Happening on the same day does not make both equally required."),
      ], {"front":"Ask where a practice comes from","back":"Muslim behavior can reflect religion, interpretation, culture, politics, and habit. Calling something “just culture” should not end an honest question."}),
    ], [
      situation("Ask about the actual practice", "A harmful custom is dismissed as “just culture.” What would help us understand it more honestly?",
        ["Ask which sources and explanations are used to defend it.", "Assume every custom is required by religion."],
        "Ask which sources and explanations are used to defend it.",
        "Some customs have no religious basis. Others are defended with interpretations that should be examined. Asking about the source helps us understand the actual claim.",
        "Calling everything religion is no more careful than calling everything culture. We need to ask about this practice and the reasons given for it."),
      consider("The same word, different meanings", "Why might a Jew, a Christian, and a Muslim mean different things by revelation?",
        "They connect God’s guidance with different scriptures and accounts of religious authority. A shared word gives a reason to ask what each means, not to assume all three beliefs are identical.", 'connection'),
    ]),
    day(24, "Sunni and Shia",
      "Muslims share much of their faith, yet differ about leadership and authority. These differences have a history.",
      "Sunni and Shia traditions developed over time. We understand them better when we notice both their shared faith and their real differences.", [
      reading(70, "How did Sunni and Shia traditions begin?", [
        section('opening', "Leadership after Muhammad", "After Muhammad died in 632, Muslims faced questions about who should lead. Disagreements about authority, including the role of Ali and Muhammad’s family, helped shape what later became Sunni and Shia traditions."),
        section('reading', "Why leadership mattered", "A leader could affect whose advice people trusted, how they remembered the past, and how religious teaching was passed down. Questions about power and faith became closely connected."),
        section('distinction', "The differences grew over time", "The traditions did not appear fully formed at one meeting. Later events, scholars, and communities also shaped them. Their beginnings help explain the differences, but do not tell the whole story."),
      ], {"front":"Leadership shaped later traditions","back":"Disagreements about leadership after Muhammad helped shape Sunni and Shia traditions. These traditions developed over time."}, [{ type: 'Historical reference', reference: 'Harvard Pluralism Project: Sunni and Shi’i Interpretations', url: 'https://pluralism.org/sunni-and-shi%E2%80%99i-interpretations', note: 'An academic overview of leadership and authority in Sunni and Shia history. Historical description is distinct from either tradition’s claims about which leadership was divinely intended.' }]),
      reading(71, "What does Sunni mean?", [
        section('opening', "The largest Muslim tradition", "Sunni Muslims are the largest branch of Islam. Sunni traditions recognize the early caliphs, or leaders, and study the Quran and Muhammad’s example through hadith, religious law, and teachings about belief."),
        section('reading', "Many schools within one tradition", "Sunni Muslims have different schools of law and belief. They share sources but may understand details differently. There is no single modern Sunni organization whose every decision is accepted by all Sunni Muslims."),
        section('reflection', "A widely held belief", "Knowing that many people hold a view tells us it is common. What would we still need to ask to understand why they hold it?"),
      ], {"front":"Sunni Muslims also differ","back":"Sunni Islam includes several schools of law and belief. Being the largest branch does not mean every Sunni agrees on every detail."}),
      reading(72, "What does Shia mean?", [
        section('opening', "The Prophet’s family and leadership", "Shia Muslims give special importance to Ali and leadership connected with Muhammad’s family. Leaders called Imams have an important religious role, but different Shia branches understand that role and line of leaders differently."),
        section('distinction', "Different branches", "Twelver, Ismaili, and Zaydi are different Shia traditions. They should not all be described as holding exactly the same beliefs. The importance of the Prophet’s family is a starting point for learning more."),
        section('reading', "Shared faith and differences", "Sunni and Shia Muslims share belief in one God, the Quran, Muhammad, and core practices. They differ about religious authority, some reports, and some rules. We can explain those differences without deciding who deserves to belong to the faith."),
      ], {"front":"Family and religious leadership","back":"Shia traditions give special importance to leadership through Muhammad’s family. Different branches understand the Imams differently."}),
    ], [
      consider("Why leadership mattered", "How could a disagreement about leadership change which teachers or reports a community trusts?",
        "A leader can influence how teaching is passed down and understood. So a disagreement about who should lead may also become a disagreement about religious guidance.", 'connection'),
      consider("Shared beliefs and real differences", "What do we miss by saying Sunni and Shia Muslims are “exactly the same” or “have nothing in common”?",
        "The first hides real differences about authority and practice. The second hides shared beliefs, scripture, and worship. We need both parts to understand the relationship."),
    ]),
    day(25, "Religious law",
      "How does a teaching become a practical answer? Today looks at guidance, interpretation, and why scholars sometimes disagree.",
      "A useful religious answer includes reasons and the situation it addresses. The source, the scholar’s reading, and a state’s law should not be treated as one thing.", [
      reading(73, "What is Sharia?", [
        section('opening', "Guidance and human understanding", "Sharia broadly means the guidance or path Muslims believe God has given. Fiqh is the human work of understanding religious sources and reaching practical rulings. People sometimes use these terms loosely in everyday speech."),
        section('reading', "More than criminal law", "Prayer, family life, trade, charity, and personal behavior all belong to this subject. Criminal law is part of its history, but treating it as the whole of Sharia leaves out much of Muslim daily life."),
        section('distinction', "Hard questions still deserve answers", "This wider meaning does not make every historical rule easy to accept. It helps to ask whether we are discussing a religious text, a scholar’s ruling, or a state’s law. Then a difficult question can be more specific."),
      ], {"front":"Guidance and human understanding","back":"Sharia refers to God’s guidance; fiqh is the human work of understanding practical religious rules. A state’s law is not automatically the same."}),
      reading(74, "What is a fatwa?", [
        section('opening', "A scholar answers a question", "A fatwa is an opinion on religious law, usually given by a qualified scholar in response to a question. It can be about an everyday act of worship or a difficult practical situation."),
        section('example', "The details can change the answer", "A question about a new kind of contract needs knowledge of both the agreement and religious teaching. Different facts may lead to a different answer. Repeating the answer without the situation can be misleading."),
        section('distinction', "Not automatically a court order", "A fatwa is not automatically a death sentence or a binding court decision. Its effects depend on the setting. Some states give fatwas a formal role; many people seek them as religious advice."),
      ], {"front":"A fatwa answers a question","back":"A fatwa is a scholar’s opinion on religious law. The original facts and reasons matter when deciding where it applies."}),
      reading(75, "Why do scholars reach different answers?", [
        section('opening', "Understanding takes work", "Scholars may disagree about whether a report is reliable, what a word means, or how a rule applies to a new case. Schools of law developed ways to work through these questions."),
        section('distinction', "Different does not mean equally strong", "Disagreement does not mean every answer is equally convincing. It also does not mean everyone who differs is dishonest. We can examine the reasons while remembering that people can make mistakes."),
        section('reading', "Questions a beginner can ask", "Who holds this view? What reasons support it? Is it widely shared or debated? A helpful teacher can explain a difference without expecting a beginner to learn every technical detail."),
        section('reflection', "Reasons as well as answers", "What makes an answer with reasons more useful than simply being told to agree?"),
      ], {"front":"Disagreement can have reasons","back":"Scholars may weigh sources and apply them differently.","reconsider":"What sources, reasons, and facts support this answer?"}),
    ], [
      situation("An answer without its question", "A short video quotes a fatwa but leaves out the question it answered. What would help you understand it?",
        ["The original question, reasons, and where the answer applies.", "Only whether the speaker sounds confident."],
        "The original question, reasons, and where the answer applies.",
        "The answer may depend on facts missing from the video. The original question and reasons help us see where the ruling applies.",
        "A confident voice does not show where a ruling applies or why. The original situation and reasons still matter."),
      consider("God’s guidance and human understanding", "How does the difference between Sharia and fiqh help explain why scholars disagree?",
        "Muslims can believe guidance comes from God while recognizing that people must work to understand it. Scholars may reach different practical answers without claiming to have received a new revelation.", 'connection'),
    ]),
    day(26, "Jihad and violence",
      "Some religious words appear in frightening headlines. Clear explanations need to face difficult meanings without hiding them or making them the whole story.",
      "A quotation does not settle a claim. Texts, history, and actions need careful study, and responsibility belongs with particular people and what they do.", [
      reading(76, "What does jihad mean?", [
        section('opening', "Start with how the word is used", "Jihad means striving or making an effort. Muslim texts use it in different settings, including religious effort and armed struggle. In much classical legal writing, it is specifically about warfare."),
        section('distinction', "Avoid two shortcuts", "Calling jihad simply terrorism is inaccurate. Saying it can never refer to fighting is inaccurate too. We need to know which text, speaker, and situation we are discussing."),
        section('reflection', "Ask what is meant here", "Is someone talking about personal effort, a historical war, or a religious argument for violence? Those need different questions, even when the same word is used."),
      ], {"front":"Ask how jihad is being used","back":"Jihad can refer to religious effort and, in some settings, armed struggle. “Only terrorism” and “never fighting” both leave things out."}),
      reading(77, "What does Islam teach about war?", [
        section('opening', "Teaching has a history", "Islamic sources and scholars discuss when fighting may take place and limits on how it is fought. Older legal discussions also reflect the political world of their time. Muslims today disagree about how some of these rules apply."),
        section('reading', "A rule and what people did", "Having a rule does not prove an army followed it. An army’s behavior also does not, by itself, prove what a religious text taught. We need to examine both the teaching and the historical events."),
        section('distinction', "Ask direct questions", "An honest account cannot reduce the tradition to peaceful personal effort or only to conquest. Questions about who may authorize war, harm to civilians, force, and political power need careful study in their setting."),
      ], {"front":"Teaching and history are different","back":"Islamic traditions discuss war and limits on fighting. What people did did not always match the rules they stated.","reconsider":"Are we discussing a text, a legal view, or an army’s action?"}),
      reading(78, "How should we examine extremist claims?", [
        section('opening', "Look at the claim itself", "Extremist groups have used Islamic texts to justify violence. Muslim scholars and communities have challenged those readings. We should neither deny that religious arguments are being made nor assume all Muslims accept them."),
        section('example', "A quotation is not the whole account", "A group may quote a verse while leaving out its setting and other interpretations. We need to examine the quotation, the group’s aims, and what it does to people. Its religious label cannot answer all those questions."),
        section('reading', "Keep responsibility specific", "Responsibility belongs with actions and people supported by evidence. It should not become suspicion of every person who shares a religion. We can criticize violence without making millions of strangers answer for it."),
      ], {"front":"Examine the claim, keep blame specific","back":"Extremist claims need careful study of texts, history, and politics. A group does not speak for every person who shares its religion."}),
    ], [
      consider("Look beyond the quotation", "A violent group quotes a religious text. What should we examine before accepting that it speaks for Islam?",
        "The surrounding passage, other scholarly readings, and the group’s actions all matter. Its political aims and history matter too. Quoting a source does not prove the group has understood or used it fairly."),
      situation("One word, different uses", "One person says jihad always means terrorism. Another says it never refers to war. What would help?",
        ["Choose whichever answer sounds more comforting.", "Ask how the word is used in this text or discussion."],
        "Ask how the word is used in this text or discussion.",
        "Both descriptions leave out real uses of the word. Looking at the particular text and situation helps us understand which meaning is being used.",
        "Choosing the answer that feels more comforting does not make it accurate. The setting helps us tell personal effort, legal discussion, and historical conflict apart."),
    ]),
    day(27, "Questions about God",
      "Why does anything exist, and what would count as a reason to believe in God? We will look at one line of thought and its limits.",
      "Understanding an argument is different from accepting it. One conclusion should not be used to claim more than the reasons behind it can show.", [
      reading(79, "Why do Muslims believe in God?", [
        section('opening', "Asking why anything exists", "Some Muslim thinkers ask why things that depend on other things exist at all. They are asking more than what happened first. They want to know whether the whole chain needs a deeper explanation."),
        section('reading', "People have different reasons", "Muslims may find reasons for belief in thinking about nature, philosophical arguments, revelation, community, or personal experience. These reasons are not all the same kind of evidence. They should not be described as one scientific experiment."),
        section('reflection', "Make the question clear", "What kind of answer would address the question being asked? Clarifying this can help people avoid talking past each other."),
      ], {"front":"Ask which question needs an answer","back":"Asking why dependent things exist is different from tracing one event to another. Philosophy, personal experience, and scientific observation have different roles."}),
      reading(80, "Why ask about a first source?", [
        section('opening', "Things that depend on other things", "One argument says that things which depend on something else must ultimately have a source that does not depend on anything. Muslim thinkers identify this source with God. There are different versions of this argument."),
        section('distinction', "The argument can be questioned", "Critics ask whether such a source is needed, whether a chain could go on forever, and whether the reasoning works. Explaining the argument does not make those questions disappear."),
        section('reading', "One answer cannot prove every claim", "Even accepting an independent source does not by itself prove that the Quran is from God or Muhammad is a prophet. Those claims need further reasons and sources of their own."),
      ], {"front":"One argument has limits","back":"An argument may propose a source that depends on nothing. Accepting that idea does not by itself establish every Islamic belief."}),
      reading(81, "Who created God?", [
        section('opening', "What the belief means", "Islam describes God as uncreated. In the argument we just met, God is not another thing that depends on a creator. He is proposed as the source that explains why dependent things exist at all."),
        section('distinction', "An explanation is not a proof", "This helps explain why the argument does not ask for a creator of God. But calling something independent does not prove it exists. The reasons for believing in such a source still need to be examined."),
        section('reflection', "Understanding and agreeing", "Can you understand what an argument means by God while still having questions about whether it is convincing?"),
      ], {"front":"Understanding is not proof","back":"Islam describes God as uncreated, not another dependent link.","reconsider":"Have I understood the claim, examined its reasons, or both?"}),
    ], [
      consider("What would still need support?", "Suppose someone accepts an argument for a source that depends on nothing. What would they still need to consider before accepting Islam?",
        "They would still need to look at claims about revelation, Muhammad, and the Quran. One argument should not be asked to prove more than its reasons support.", 'connection'),
      consider("Explaining a claim is not proving it", "Why does calling God uncreated help explain the belief without, by itself, proving God exists?",
        "A definition tells us what someone means. Reasons or evidence are still needed to show that it is true. Keeping these apart makes the discussion clearer."),
    ]),
    day(28, "Where to go next",
      "We return to trust in Muhammad and the Quran with more context. You can choose what to explore next without being pushed to agree.",
      "You have met a view of God, human purpose, worship, and responsibility. There is room to keep reading, ask questions, and take time with what you think.", [
      reading(82, "How can I look more closely at Muhammad’s life?", [
        section('opening', "Return to the reasons for trust", "Muslims point to Muhammad’s message, the Quran, and reports about his character as reasons to trust him. We can now connect those reasons with the view of God and daily life we have been exploring."),
        section('reading', "Choose one claim to examine", "Where does a report come from? When was it recorded? How do scholars judge it? What would it show if it were reliable? Being admired or gaining political success does not alone prove someone was sent by God."),
        section('distinction', "Take time with the evidence", "Religious scholars and academic historians may ask different questions and use different methods. Understanding their reasons is more useful than expecting one short paragraph to settle every claim about Muhammad."),
      ], {"front":"Look at a specific claim","back":"Studying a claim of prophethood means checking sources and what they show. Admiration or political success alone cannot prove a divine message."}),
      reading(83, "Why do Muslims trust the Quran?", [
        section('opening', "Several reasons can matter", "Muslims point to the Quran’s message, Arabic language, how it was passed down, and its place in their lives. Some also describe feeling personally addressed by it. These reasons can matter together without being the same kind of evidence."),
        section('distinction', "Keeping a text and knowing its source", "Evidence about how a text was preserved tells us what was passed down and how. It does not alone prove that the text came from God. These are connected questions, but they need different kinds of support."),
        section('reading', "Begin with a real passage", "Read a short passage in a named translation, with nearby verses and a reliable explanation. Notice what it says about God and human behavior. Then choose one question to explore more closely."),
        section('reflection', "Which question comes next?", "What kind of evidence would help with the particular claim you want to examine?"),
      ], {"front":"Keeping a text and knowing its source","back":"Muslims give several reasons for trusting the Quran. Showing that a text was preserved is different from showing that it came from God."}),
      reading(84, "Where can I go from here?", [
        section('opening', "You do not have to agree", "You can finish this course without accepting Islam. The aim is to help you understand its main beliefs and why they matter to Muslims. Understanding is not the same as becoming Muslim."),
        section('reading', "Choose a question you want to explore", "You might read more about God’s mercy, look into the history of the Quran, or visit a mosque. A knowledgeable teacher can explain which views are shared and which are debated. You can ask for sources and take your time."),
        section('reflection', "Leave room to keep thinking", "If worship can shape a whole life, what part of that idea would you like to understand better? You do not need to make a decision about faith today."),
      ], {"front":"Understanding leaves a choice","back":"An introduction can make Islam clearer without deciding what you must believe.","reconsider":"Which question could benefit from a source, a conversation, or more time?"}),
    ], [
      consider("Preserved words and their source", "Why does evidence that a text was carefully passed down not alone prove that it came from God?",
        "One question is how the text reached later readers. Another is where it first came from. We can examine both, but evidence for one does not automatically settle the other.", 'connection'),
      consider("Explain it to a friend", "How would you connect God, guidance, worship, and responsibility in the Islamic view of life?",
        "One way to explain it is: Muslims believe life comes from one God, who needs nothing and gives guidance. Worship includes prayer and daily choices. People’s actions matter, and they return to God hoping for mercy and answering for what they did. You can understand this view without accepting it."),
    ]),
  ],
};
