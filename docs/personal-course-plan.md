# Save a personal course plan

## Specification / GenAI prompt

Extend the existing course scheduler so each signed-in user has a private saved plan. Automatically save course selections to Firestore, restore them after refresh/sign-in, and synchronize changes across active pages. Keep guest browsing and temporary selections, term filtering, conflict checks, course-plan popup, administrator editing, and existing course data working.

- Store each plan at `users/{uid}/plans/CS-2018-2019`, separately from the protected administrator role at `users/{uid}`. Store only unique course IDs and a monotonically increasing integer revision.
- All signed-in users, including non-administrators, can read/create/update their own plan. No browser user, including an administrator, can access someone else's plan. Reject guests, collection listing, document deletion, unknown schedules, unknown/duplicate course IDs, extra fields and invalid revisions. A user clears their plan by saving an empty selection.
- Load the confirmed cloud plan before allowing signed-in selection changes. Do not save the initial empty render or let a missing cached snapshot overwrite a real cloud plan.
- Show immediate selection feedback and Saving/Saved/loading/error states. Serialize rapid clicks and update one selection at a time in a Firestore transaction, retaining other devices' changes and rechecking course availability/conflicts against the latest data.
- Use document revisions to reject stale listener events or save responses. On save failure, cancel remaining queued changes, restore the last confirmed plan, and clearly tell the user. Provide Retry for initial load errors.
- Separate UI state from database services. Observe plans in a hook and clean up the subscription when its account-scoped component unmounts. Account changes/sign-out must clear private selections, discard queued work that has not started and ignore late callbacks. Never copy one account's plan into another account or a guest session.
- Guests can create an in-memory temporary plan. Signing in loads that account's saved plan; guest choices are not automatically merged into it. Make this behavior clear in the interface.
- Deploy to the existing Firebase project, push to GitHub, verify a real save/reload, cross-page synchronization and sign-out/sign-in restoration, then restore test selections. Prepare a short learning report.

## Data and access

```text
users/{uid}                         { admin: true }          Owner-managed role
users/{uid}/plans/CS-2018-2019        { selectedCourseIds, revision }  Private plan
```

A missing plan represents an empty plan at revision zero and does not cause a write. The first selection creates revision one; each later change increments the revision. Transactions change one course's selected state and preserve unrelated selections. Rules separately enforce ownership, known course IDs, shape and revision increments.

Course conflict checks run locally for immediate feedback and again in the transaction against the current catalog and saved choices. Existing plans are not silently rewritten when an administrator edits the catalog. If a course ID has been removed from the catalog, it is omitted from the displayed selection count and pruned from the stored plan on its next change.

## Implementation

- `src/types/personal-plan.ts`: runtime validation of saved plans.
- `src/services/personal-plan.ts`: confirmed snapshot listener and transactional selection changes.
- `src/hooks/usePersonalPlan.ts`: guest state, account-scoped load/save state, ordered write queue, optimistic selections, revision checks, rollback and retry.
- `src/components/TermPage.tsx`: an account-keyed child keeps private plans isolated while preserving the selected term across account changes. The plan subscription remains mounted across the list/editor route switch.
- `src/components/CourseCard.tsx`: temporarily disables selection before the account's plan has loaded.
- `firestore.rules`: permits only the account owner's plan operations and preserves administrator-role restrictions.

## Behavior and limits

Signing in loads the chosen account's saved plan. Signing out starts a fresh temporary guest plan. Guest choices do not survive refresh. Wait for the saved status before leaving the page; this feature does not provide offline background uploads. Failed changes are rolled back with an explicit message, so the UI does not claim unsaved choices were persisted.

Concurrent edits to different courses are merged through transactions. For opposing changes to the same course, the order of committed transactions determines its final state. There is one plan per user for the current sample schedule; named alternative plans, search, weekly calendar views and exports are separate tasks.

## Verification

```sh
npx vitest run
npm run build
npm exec --package=firebase-tools -- node scripts/test-firestore-rules.mjs
npx firebase-tools deploy --only firestore:rules,hosting --project xiance-cs392-courses-2026
```

The rules checks use synthetic request/resource fixtures and exact-path catalog/role mocks, without writing production data. The shared in-memory plan boundary fixture supports the pre-existing UI tests; dedicated service/hook tests cover persistence, errors, races and privacy boundaries.

The repository's unavailable ESLint rule is overridden only for changed-file lint. The pre-existing large Firebase bundle warning remains a separate performance follow-up. No dependencies, Auth providers, account roles or billing changes were added.

## References

- [Course guidelines for custom tasks](https://courses.cs.northwestern.edu/394/guides/react-challenges.html)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore snapshot listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firestore field restrictions](https://firebase.google.com/docs/firestore/security/rules-fields)
