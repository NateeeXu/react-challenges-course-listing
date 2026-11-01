# Authentication

## Specification / GenAI prompt

Add Google sign-in and sign-out to the existing React course scheduler using Firebase Authentication. Keep the schedule publicly readable and allow guests to filter/select courses and view their plan. Only signed-in users may edit course information.

- Show an account banner on every screen, including loading/error states and edit URLs. Show the user's display name and Sign out when authenticated; otherwise show Sign in with Google.
- Observe Firebase auth state in a shared context with a loading state and cleanup. Do not show edit links until session restoration completes. Use Firebase's normal browser session persistence; do not manually store tokens.
- Hide Edit links for guests and guard the edit URL itself. Signing out while editing must remove the form immediately. Switching accounts must start a fresh draft.
- Keep Firebase SDK operations in service modules. Use the same Firebase app for Auth and Firestore. Reject signed-out save calls in the service.
- Require request.auth != null in the Firestore update rule, retaining the existing one-course update restrictions and schema validation. Public schedule reads remain allowed. Do not add administrator roles; that is the next task.
- Handle cancelled/blocked login popups, connection/configuration errors and failed sign-out. Prevent repeated authentication requests while pending. Do not request contacts, Drive, Gmail or other additional OAuth scopes.
- Enable Google in the existing Firebase project's Authentication settings. Use the owner-approved support email and the public app name CS Course Scheduler. Authorize the two Firebase Hosting domains plus localhost and 127.0.0.1 for development. Keep the Spark plan.
- Test, push, deploy and verify a real Google login, authenticated save, reload persistence, sign-out, guest editing restrictions and an anonymous database-write denial. Restore test course edits afterward.

## Implementation

- `src/services/firebase.ts`: initializes Auth for the existing Firebase app.
- `src/services/auth.ts`: Google popup sign-in, sign-out, auth observer and actionable error mapping. Only uid/displayName/email are passed to React, not credentials.
- `src/context/auth.ts`, `src/components/AuthProvider.tsx`, `src/hooks/useAuth.ts`: one shared session observer with cleanup and fail-closed initial state.
- `src/components/AuthBanner.tsx`: account status/actions on every App screen.
- `src/components/CourseCard.tsx`: conditional Edit link; selection still works for guests.
- `src/components/CourseEditPage.tsx`: loading/guest guard and account-specific draft key.
- `src/services/schedule.ts`, `firestore.rules`: independent client-service and server-rule checks for authenticated writes.

## Backend setup

Firebase Authentication and its Google provider were enabled through the existing project's Firebase console. No paid Identity Platform upgrade, password provider, anonymous provider, phone authentication, role assignment, or additional billing plan was added. The OAuth client secret remains managed by Firebase; no secrets are copied into the repository.

The app asks only for Google's default basic sign-in profile scopes. The Firebase web configuration is public identification; verified Firebase ID tokens and Firestore rules determine write access.

## Verification

```sh
npx vitest run
npm run build
npm exec --package=firebase-tools -- node scripts/test-firestore-rules.mjs
npx firebase-tools deploy --only firestore:rules,hosting --project xiance-cs392-courses-2026
```

The rule checks use synthetic authenticated/guest contexts against the official Rules test API without writing production data. Real Google popup verification was performed in Chrome: the embedded browser did not expose its popup. Use Chrome for the public-site login check.

Existing caveats: the repository's unavailable ESLint rule is overridden only during changed-file lint, and the full Firebase bundle still produces the pre-existing Vite size warning. The existing CLI helper scripts rely on internal Firebase CLI interfaces; updates may require maintenance.

## References

- [Assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#add-authentication)
- [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [Auth state observer](https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user)
- [Firestore authentication rules](https://firebase.google.com/docs/firestore/security/rules-conditions#authentication)
