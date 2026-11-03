# Role-based authorization

## Specification / GenAI prompt

Restrict course editing to administrators in the existing Firebase course scheduler. Keep Google sign-in and public browsing, term filters, selections, conflict checks and the course-plan popup working.

- Store administrator assignments by Firebase UID at `users/{uid}` with a boolean `admin` field. Missing documents/fields, non-boolean values and `admin: false` mean no editing permission.
- Signed-in users may read only their own role document. No browser client, including an administrator, may list, create, update or delete role documents. A project-owner-authenticated helper manages assignments.
- Extend the shared auth context with administrator state, permission loading and permission errors. Observe the current user's role in real time, clean up old listeners and reject stale callbacks after switching accounts or signing out.
- Do not grant editing while permissions are unknown or based only on a cached role. Hide Edit links for non-administrators and guard direct edit URLs. Removing a role must remove an open form and discard its draft. Account/role changes must preserve the course plan.
- Display Administrator or Read only beside the signed-in user's name. Handle permission-read failures by disabling editing and displaying a useful message.
- Read the current user's role inside the save transaction, alongside the existing course checks. Firestore rules must independently verify the UID's database role before accepting any course update. Keep all existing validation and one-course update restrictions.
- Provision only the administrator account explicitly designated by the owner. Do not hardcode emails/UIDs into the frontend, infer roles from email addresses, trust local storage, or allow self-promotion.
- Test administrator, member, guest, loading, missing/malformed roles, live revocation, account-switch races, direct-route access, role privacy and role-write denials. Deploy to the existing project, push code, verify the public site, and restore test course edits.

## Data and permission model

| Visitor | Browse and select | Read own role | Edit courses | Assign roles in browser |
| --- | --- | --- | --- | --- |
| Guest | Yes | No | No | No |
| Signed-in member | Yes | Yes | No | No |
| Signed-in administrator | Yes | Yes | Yes, valid existing courses only | No |

This project uses Firestore, so the assignment's Firebase Realtime role data is implemented as Firestore documents. Google Authentication establishes identity; the server-owned `users/{uid}.admin` value establishes editing authority. The current Firebase project and free Spark plan are retained.

## Owner role management

After the designated user has signed in to the app at least once, the project owner can resolve that existing account using the Firebase CLI's authenticated session. Dry run:

```sh
npm exec --package=firebase-tools -- node scripts/set-course-admin.mjs --email '<account-email>'
```

Add `--grant` or `--revoke` only when intentionally assigning or removing course-administrator access. The script updates only the `admin` field, preserving unrelated profile data, and uses a create-only or update-time precondition to avoid overwriting a concurrent change. It does not create Auth accounts or service-account keys, and does not print credentials. Like the existing import/rules scripts, it relies on Firebase CLI internal helpers, which may need updating after CLI upgrades.

## Implementation

- `src/services/roles.ts`: own-role listener with explicit boolean checks and cached-permission rejection.
- `src/components/AuthProvider.tsx`, `src/context/auth.ts`: shared role state, listener replacement, cleanup and generation checks against stale callbacks.
- `src/components/TermPage.tsx`, `src/components/CourseEditPage.tsx`, `src/components/AuthBanner.tsx`: role-based controls, route guard and role labels.
- `src/services/schedule.ts`: checks the live role within the save transaction and rejects mid-save account changes.
- `firestore.rules`: checks the role independently and denies all browser role writes.
- `scripts/test-firestore-rules.mjs`: authenticated/admin/member/guest request fixtures and exact-path mocks for the current UID's role read.

## Verification commands

```sh
npx vitest run
npm run build
npm exec --package=firebase-tools -- node scripts/test-firestore-rules.mjs
npx firebase-tools deploy --only firestore:rules,hosting --project xiance-cs392-courses-2026
```

The repository's unavailable ESLint rule is overridden only during changed-file lint. The existing Firebase bundle-size warning remains a separate performance follow-up.

## References

- [Assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#role-based-authorization)
- [Firestore role checks and cross-document rules](https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents)
- [Firestore realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen)
