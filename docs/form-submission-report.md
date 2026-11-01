# Learning Report — Form Submission

Name: Xiance Xu  
Task: Form Submission

These are short drafts for the report. The code was AI-assisted; do not describe it as an independent pre-AI attempt. Adjust personal learning statements to match what you understand and experienced.

## Learning goals

Learn how to submit form data to Firestore and handle validation, unchanged values, and saving errors in React.

## Specification

Add a Submit button to the course editor. Save changes to Firestore only when the form is valid and the values have changed. Return to the course list after a successful save, and show an error if saving fails. Cancel should discard the edits.

## Plan

Compare the validated form values with the original course. Use an async submit handler to call a database service, track whether a save is in progress, and handle errors. Update only the edited course and let the existing database listener refresh the list.

## Resources

- [Form submission assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#store-data)
- [React form](https://react.dev/reference/react-dom/components/form)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore field restrictions](https://firebase.google.com/docs/firestore/security/rules-fields)

## Commit — core code (AI-assisted reference)

The important lines in the actual submit handler are:

```tsx
event.preventDefault();
if (!parsed.success || !canSubmit || savingRef.current) return;
await saveCourse(courseId, original, parsed.data);
navigate('/');
```

Submit is enabled only for valid changes when no save is pending:

```tsx
const canSubmit = parsed.success && !coursesEqual(original, parsed.data) && !isSaving;
```

The full handler also sets/reset the saving state, prevents duplicate requests, and catches errors. These excerpts omit that surrounding code for comparison.

## GenAI Output tab — Prompt

Add form submission to my existing course editor. Save valid changes to the existing Firestore database when Submit is clicked. Block invalid, unchanged, and duplicate submissions. Show saving and error states, keep the draft if saving fails, and return to the list after success. Cancel must not save. Preserve other courses and prevent overwriting a concurrent edit to the same course.

For the complete specification, use the Specification section of `form-submission.md`.

## GenAI Output tab — Output

The AI added a guarded async submit handler, a saving state, an error message, and a Firestore transaction. It also added database rules to allow only one valid existing course to change per request.

Core transaction lines from the generated service:

```ts
if (!coursesEqual(courses[courseId], original)) {
  throw new Error('This course changed while you were editing. Reload the page to review the latest version.');
}
transaction.update(reference, new FieldPath('courses', courseId), values, 'lastEditedCourseId', courseId);
```

The service validates values before starting the transaction and checks that the schedule/course still exists. The existing snapshot listener updates the UI after saving.

## Consult

The basic idea was to validate the form and save the changes. The AI also checked for unchanged values and repeated clicks. It used a transaction to avoid overwriting someone else's edit, which made the save more reliable.

## Ask

If two users edit the same course at the same time, how should the app help them resolve their changes?

## Integration summary

The main challenge was making sure the form only saved valid changes and kept my edits when saving failed. I also learned that updating one nested field helps preserve the other courses in the database.

## Implementation notes

- The project already uses Cloud Firestore; this task keeps that database rather than adding Realtime Database.
- Visitors can edit the public sample courses at this coursework stage. Sign-in and administrator authorization are separate upcoming tasks.
- Schedule title/order, added/removed courses, invalid course data, unrelated documents, and collection listing remain protected by database rules.
- 131 automated tests passed across 8 files; production build and changed-file lint passed (using the documented override for the pre-existing unavailable ESLint rule).
- 39 synthetic Firebase Rules cases passed through the official Rules test API without changing production data.
- Deployed the rules and app to https://xiance-cs392-courses-2026.web.app/.
- Browser verification confirmed initial/invalid Submit disabling, saving state, a real successful save, persistence after reload, stale-edit rejection with the draft retained, and Cancel returning to the list.
- Restored the test course through the same Submit flow; an independent database read confirmed all 91 course records, schedule title, and course order match the before-test snapshot exactly. The new lastEditedCourseId marker remains as designed.
- Screenshot: `/Users/natecece/.codex/visualizations/2026/11/01/form-submission.png`.
- Authentication is intentionally not part of this task; the validated public sample-course edits are available without signing in.
