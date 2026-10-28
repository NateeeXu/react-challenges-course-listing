# Add Database — Firestore

## Specification

Move the existing sample course schedule into Cloud Firestore in the Firebase project `xiance-cs392-courses-2026`. The deployed React app must read its schedule from this database, not the instructor's PHP endpoint. Keep the same title, 91 courses, course order, card styling, term filter, selections, conflict checks, popup, and course editor.

- Store the schedule at `schedules/CS-2018-2019` in the default Firestore database.
- Store title and the existing courses map. Include a courseOrder array so Firestore's map-key sorting does not change the display order.
- Use the installed Firebase modular SDK and a snapshot listener. Keep Firebase access in services, React state in a hook, and validate incoming data with the shared schemas.
- Support loading, missing-document, invalid-data, permission-error, and empty-course-list states. Unsubscribe on unmount. Do not silently fall back to the PHP endpoint.
- Permit unauthenticated reads of this one public schedule document only. Deny collection listing, writes, and access to unrelated documents.
- Import the existing JSON with a create-only, administrator-authenticated helper. Never overwrite an existing document or temporarily open public writes.
- Do not add form submission or authentication in this task. Cancel must still discard drafts.
- Test, commit, push, deploy, and verify the public website.

## Provisioned resources

- Project: `xiance-cs392-courses-2026` (the existing hosting project).
- Web app: `CS Course Scheduler`.
- Firestore database: `(default)`, Standard edition, `us-central1`, free tier at creation. No billing upgrade was performed.
- Document: `schedules/CS-2018-2019`.
- Rules: `firestore.rules`, tracked and deployed through `firebase.json`.

The Firebase web configuration in `src/services/firebase.ts` identifies the app; it is not an administrator credential. Rules protect the data. No service-account key or login token is stored in this repository.

## Importing the sample schedule

Node 24+ and the existing Firebase CLI login are required. The import helper uses the CLI's internal authentication/request helpers, so those internal interfaces may need adjustment after a CLI upgrade.

Dry run, which only fetches and validates the public JSON:

```sh
node scripts/import-schedule.mjs
```

One-time creation, using the official CLI made available on PATH:

```sh
npm exec --package=firebase-tools -- node scripts/import-schedule.mjs --write
```

The target project is fixed in the script. The write uses Firestore's `currentDocument.exists: false` precondition and therefore cannot replace an existing schedule. Do not rerun it expecting to update courses. Public browser writes remain denied throughout.

## Deploying

```sh
npm run build
npx firebase-tools deploy --only firestore:rules,hosting --project xiance-cs392-courses-2026
```

The old generic JSON hook remains as unused historical code; App no longer imports it. The instructor's endpoint is used by the one-time import script, not by the deployed app.

## References

- [Assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#add-database)
- [Firestore setup](https://firebase.google.com/docs/firestore/quickstart)
- [Snapshot listeners and cleanup](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started)
