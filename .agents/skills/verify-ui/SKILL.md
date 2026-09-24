---
name: verify-ui
description: Verifies a user-visible UI change in the closest real environment. Use after changing web or Expo-web UI, or when the user asks to verify the UI.
icon: app-window
color: gray
disable-model-invocation: true
---

# Verify UI

Load only after a user-visible UI change, or when the user asks to verify.

This app is Expo/React Native. Use the browser only for Expo web. For native screens, use the closest substitute (running app, tests, or say what you could not verify).

## Do

- Exercise the changed flow the way a user would. A single screenshot is not enough.
- Check other routes that share the state or components you touched.
- Check empty, error, and flag/route variants the change can affect.
- For layout changes, check a desktop and a mobile width when the surface is web.
- If verification finds a bug, fix it and re-check.

Do not start a browser session for copy-only or native-only work.
