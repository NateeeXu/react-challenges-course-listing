# Learning Report — Save a personal course plan

Name: Xiance Xu  
Task: Save a personal course plan (custom extension)

These are short report drafts. The code was AI-assisted, not an independent pre-AI attempt. Adjust personal learning statements to match your actual understanding.

## Learning goals

Learn how to save each user's course selections in Firestore and restore them after refreshing or signing in again.

## Specification

Automatically save a signed-in user's selected courses to their own private plan. Restore it after refreshing and sync changes across pages. Guests can still select courses temporarily, but users must not be able to read or change someone else's plan.

## Plan

Store course IDs under the user's Firebase UID. Load the saved plan before accepting changes, listen for updates, and save each selection with a transaction. Clear private selections when the account changes and use database rules to protect each plan.

## Resources

- [React Challenges custom tasks](https://courses.cs.northwestern.edu/394/guides/react-challenges.html)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Database field restrictions](https://firebase.google.com/docs/firestore/security/rules-fields)

## Commit — core code (AI-assisted reference)

The plan is stored separately for each user:

```ts
doc(database, 'users', uid, 'plans', scheduleDocumentId)
```

Inside the transaction, the generated service saves the changed selection and a new revision:

```ts
const next = { selectedCourseIds, revision: current.revision + 1 };
transaction.set(reference, next);
return next;
```

These are relevant excerpts; the complete service also checks the active account, reads the latest plan/catalog and validates course availability and conflicts before writing.

## GenAI Output tab — Prompt

Add private saved course plans to my existing React scheduler. Automatically save each signed-in user's selections in Firestore, restore them after refreshing or signing in again, and sync changes across pages. Keep guest plans temporary, protect each user's data, show loading/saving/error states, and prevent account changes or simultaneous edits from mixing up plans.

The complete specification is in `personal-course-plan.md`.

## GenAI Output tab — Output

The AI added a personal-plan service, a state hook, schema validation, an automatic saving indicator, and account-specific database rules. It also used a queue and document revisions to handle fast clicks and simultaneous changes.

The actual listener ignores unconfirmed cache/pending-write snapshots before restoring the saved plan:

```ts
if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
```

The rules check ownership before granting plan access:

```text
request.auth != null && request.auth.uid == userId
```

The full condition also restricts the schedule ID, and writes must pass plan schema and revision checks.

## Consult

The old code only kept selections in React state. The AI added database storage and also handled loading, account changes and failed saves. I learned why saving the initial empty state could accidentally overwrite an existing plan.

## Ask

How should an app handle two devices changing the same saved course plan at the same time?

## Integration summary

The tricky part was restoring the saved plan without overwriting it during loading. I also learned how listeners and transactions work together to keep changes from different pages in sync.

## Verification notes

- 188 tests passed across 14 files. Build and changed-file lint passed with the documented override for the pre-existing unavailable ESLint rule.
- 84 synthetic security-rule cases passed, including private plan ownership, administrator access denials for other users' plans, member saves and malformed data denials.
- In Chrome, a guest selection disappeared after refresh as intended. A signed-in selection was automatically saved and restored after refresh.
- A second browser tab loaded the same plan, and a selection made there appeared in the first tab. These were independent page instances, rather than two physical devices.
- Signing out removed private selections from both tabs. Signing back in restored the saved selections. Test selections were then removed through the normal UI, restoring the account's original empty selection.
- The verification account originally had no plan document. Testing created an empty saved-plan record after restoring its selections; no course data or administrator role was changed.
- The app and rules are deployed to https://xiance-cs392-courses-2026.web.app/. Browser proof is saved under `/Users/natecece/.codex/visualizations/2026/11/06/`.
