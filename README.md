# PowerPlace (iOS)

A minimalist place of power for your mental health: diary, notes, planner, motivation, reflection, focus timer, and an AI you can talk to. The theme adapts to your mood.

## Highlights
- Mood-adaptive theme
- Diary and notes
- Planner with tasks and events (EventKit integration)
- Focus timer (Pomodoro-style)
- Daily reflection + motivation
- AI assistant for advice, adding tasks/events, and talking
- Local-first storage (JSON), designed to be swapped for SwiftData later

## Requirements
- macOS with Xcode 15+ (iOS 17+ recommended)
- An OpenAI API key (optional; app works in offline/stub mode if not provided)

## Quick start
1. In Xcode, create a new iOS App project named "PowerPlace" with SwiftUI + Swift.
2. Close Xcode.
3. Replace the auto-generated contents of your new project's folder with this repository's `ios/PowerPlace` sources. Keep your `.xcodeproj` created by Xcode.
4. Re-open the project in Xcode.
5. Set your team and bundle identifier for signing if needed.
6. If you want AI enabled, set environment variables `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in your scheme (Edit Scheme > Run > Arguments).
7. Run on an iPhone simulator or device.

## AI notes
- By default, a stub AI is used. If `OPENAI_API_KEY` is present, the app will use the OpenAI Chat Completions API.
- You can replace the `OpenAIClient` with any provider implementing `AIClient`.

## Storage notes
- The project ships with a simple JSON-based storage service to keep the code portable.
- You can replace `StorageService` with SwiftData when you are ready (iOS 17+).

## Calendar notes
- EventKit integration is conditionally compiled on iOS. On non-iOS platforms it no-ops.
- When first adding calendar items, you will be asked for permission.

## Privacy
- Data is stored locally on-device by default. See `PRIVACY.md`.

## Roadmap (short)
- Natural language intent extraction for tasks/events
- SwiftData persistence
- iCloud sync
- Rich insights/reflections

---

This repository is a scaffold to get you started quickly. The UI is intentionally minimal and clean. Customize it to your taste.