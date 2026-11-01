# Form Submission

## Specification / GenAI prompt

Add form submission to the existing course editor. Save valid, changed course details to the existing Cloud Firestore schedule when Submit is clicked. Do not submit invalid or unchanged values, including edits reverted to their original values. Compare the validated values so title whitespace alone does not count as a change.

- Keep the existing form validation, course cards, term filters, selections, conflict checks, and course-plan popup.
- Disable Submit when invalid, unchanged, or saving. Prevent duplicate requests and disable editing/Cancel during the pending save.
- Wait for database confirmation before returning to the course list. Keep the draft and show an accessible error if saving fails; allow retry. Cancel must not write anything.
- Keep Firebase calls in a service. Validate again before writing. Use a transaction to reject a missing/deleted course or concurrent changes to the same course. Preserve other courses and schedule metadata.
- Keep the opened course as the draft baseline even if a live snapshot arrives while editing.
- Use a literal FieldPath for the existing course ID. Update only that course and a lastEditedCourseId marker used for rule validation.
- Restrict database updates to one existing, valid course per request in schedules/CS-2018-2019. Reject creation/deletion, added/removed courses, changed schedule title/order, malformed data, unrelated access, and collection listing.
- This is the form-submission coursework stage. Authentication is the next challenge: visitors can currently edit the public sample courses within these constraints.
- Test the form and service, validate security rules with synthetic fixtures, build, push to GitHub, deploy to xiance-cs392-courses-2026, and verify a browser save survives reload. Restore the test edit afterward.

## Implementation

- `src/components/CourseEditPage.tsx`: submission guard, pending state, retryable error, Cancel, redirect on success.
- `src/types/course.ts`: explicit four-field comparison alongside the existing Zod schema.
- `src/services/schedule.ts`: validated transaction with a stale-edit check and nested update.
- `firestore.rules`: validates the changed course independently of browser validation. `lastEditedCourseId` lets the rules identify the one changed map entry without iterating over all courses.
- The existing onSnapshot listener refreshes the course cards after saves. No second database, data migration, or local-only fallback is introduced.

## Verification commands

```sh
npx vitest run
npm run build
npm exec --package=firebase-tools -- node scripts/test-firestore-rules.mjs
npx firebase-tools deploy --only firestore:rules,hosting --project xiance-cs392-courses-2026
```

The rules test command uses the official Firebase Rules test API with synthetic request/resource fixtures; it neither deploys rules nor writes production data. Like the existing import helper, it reuses Firebase CLI authentication in memory and relies on CLI internal interfaces, which may need adjustment after a CLI upgrade.

The repository's pre-existing unavailable ESLint rule remains unchanged. Check changed TypeScript files with `--rule 'react-hooks/react-compiler: off'` for this run. The existing large-bundle build warning is a separate performance follow-up.

## References

- [Assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#store-data)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Field restrictions in Firestore rules](https://firebase.google.com/docs/firestore/security/rules-fields)
- [React forms and submit events](https://react.dev/reference/react-dom/components/form)
