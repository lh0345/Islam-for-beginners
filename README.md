# Islam, Simply

Islam, Simply is an Expo and React Native app for people who are beginning to learn about Islam. It uses guided reading, reflection prompts, progress tracking, optional reminders, and language-ready course content instead of quiz-heavy memorization.

The app is designed to be respectful, clear, and honest about differences in interpretation. It is currently an early open-source project and is still being prepared for public store release.

## Run locally

Requirements:

- Node.js
- npm
- Expo CLI through the project scripts

Install dependencies and start the app:

```bash
npm install
npm start
```

You can then open it in Expo Go, an Android emulator, an iOS simulator, or a web browser. Useful commands are:

```bash
npm run android
npm run ios
npm run web
```

## Check the project

```bash
npm run typecheck
npm test
```

## Contributing

Contributions are welcome. Useful contributions include:

- improving clarity, accessibility, and beginner experience
- reviewing course content carefully and respectfully
- adding or improving translations
- fixing bugs and improving tests
- improving Android, iOS, and web support

Please explain the reason for a content change, preserve stable lesson and progress IDs, and run the typecheck and tests before opening a pull request. Translation guidance is in [src/locales/README.md](src/locales/README.md).

## Privacy

The core app does not require an account. Learning progress and preferences are stored on the device. Notifications are optional. The app does not need location, contacts, camera, or microphone access for its core learning experience.

This project still needs a published privacy policy and a completed store privacy review before release on Google Play or the App Store.

## Content and attribution

Course content is maintained in [src/locales/en/course.ts](src/locales/en/course.ts). The content audit is documented in [src/locales/CONTENT_AUDIT.md](src/locales/CONTENT_AUDIT.md).

Before redistributing or publishing the app, verify the licenses and attribution requirements for all Quran translations, quotations, fonts, icons, and other assets. Do not assume that content included in the repository is public domain.

## License

MIT