# Learning report draft — Add Database

This describes the AI-assisted implementation. Adjust the learning statements to match your actual understanding; the code excerpts are not an independent pre-AI attempt.

## Learning goals

Learn how to store course data in Firestore and read it in React while keeping the existing interface working.

## Specification

Import the existing course schedule into my Firebase project. Load it from Firestore instead of the original JSON URL. Keep the same course cards and features, and only allow the website to read the data for now.

## Plan

Initialize Firebase, import the schedule into a Firestore document, and listen for its data in a service. Use a custom hook to handle loading, data, errors, and cleanup. Add rules that allow reading the course schedule but block public writes.

## Resources

- [Add Database assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#add-database)
- [Firestore setup](https://firebase.google.com/docs/firestore/quickstart)
- [Realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Security rules](https://firebase.google.com/docs/firestore/security/get-started)

## Commit — core code, AI-assisted

Relevant imports and document reference from `src/services/schedule.ts`:

```ts
import { doc, onSnapshot } from 'firebase/firestore';
import { database } from './firebase';
import { parseSchedule, scheduleDocumentId } from '../types/schedule';

doc(database, 'schedules', scheduleDocumentId)
```

The actual listener wraps that reference in `onSnapshot`, checks `snapshot.exists()`, validates `snapshot.data()` with `parseSchedule`, and returns an unsubscribe function.

App now gets its data from:

```tsx
const { schedule, isLoading, error } = useSchedule();
```

## GenAI Output tab — Prompt

Copy the Specification section in [add-database.md](./add-database.md).

## GenAI Output tab — Output

The AI added Firebase initialization, a Firestore service, a useSchedule hook, schema validation for database data, read-only security rules, and a one-time import script. App now uses the hook instead of fetching the PHP URL.

Core snapshot handling from the service:

```ts
if (!snapshot.exists()) {
  onError(new Error('The course schedule has not been imported into Firestore yet.'));
  return;
}
```

The hook's effect returns cleanup that calls `unsubscribe()` when the component unmounts.

## Consult

The main difference from the old code is that Firestore uses a snapshot listener instead of a one-time fetch. The AI also separated database access from React state and added rules so visitors can read the schedule without being allowed to change it.

## Ask

Why is it okay for the Firebase web configuration to be public, but important to protect the database with security rules?

## Integration summary

The main challenge was keeping the database data in the same structure and order as the original schedule. I also learned that TypeScript types do not check incoming data at runtime, and database rules control who can read or change it.

## Implementation notes

- Firestore Standard edition was created in the existing project, in us-central1, on the free tier. No billing upgrade was made.
- 91 existing courses were imported with a create-only write. Form submission is still intentionally not implemented.
- The current course order is explicitly retained in the document rather than relying on Firestore map ordering.
- The public schedule document can be read without sign-in. Anonymous collection listing, unrelated reads, and writes were checked and denied with HTTP 403.
- Automated tests: 119 passed. The production build passed. Direct Firestore Web SDK reads matched the original dataset exactly: Fall 27, Winter 31, Spring 33.
- The deployed website was checked after the hosting update: all 91 courses load, and Fall/Winter/Spring show 27/31/33 courses. Local browser checks also confirmed selection persistence, the course-plan popup, editor prefilling, validation, and Cancel.
- The existing invalid ESLint rule configuration and dependency audit warnings were not changed. Changed-file lint is checked with the unavailable rule disabled only for that run.
- Importing the full Firestore SDK produces a Vite bundle-size warning. This is a performance follow-up, not a failed build.
