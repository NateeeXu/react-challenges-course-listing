# Learning Report — Authentication

Name: Xiance Xu  
Task: Authentication

These are short report drafts. Code was AI-assisted, not an independent pre-AI attempt. Adjust first-person learning statements to match your actual experience.

## Learning goals

Learn how to add Google sign-in with Firebase and use login state to control editing in React.

## Specification

Add Google sign-in and sign-out to my course scheduler. Everyone can browse and select courses, but only signed-in users can edit them. Show the login controls on every page and protect database writes with Firebase rules.

## Plan

Enable Google sign-in in Firebase. Track the current user with an auth listener and share that state through React Context. Hide Edit buttons for guests, protect the edit route, and require authentication in the database rules.

## Resources

- [Authentication assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#add-authentication)
- [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [Tracking the current user](https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user)
- [Firestore authentication rules](https://firebase.google.com/docs/firestore/security/rules-conditions#authentication)

## Commit — core code (AI-assisted reference)

Key calls used by the auth service:

```ts
onAuthStateChanged(authentication, (user) => onUser(user ? {
  uid: user.uid, displayName: user.displayName, email: user.email,
} : null), onError);

signInWithPopup(authentication, new GoogleAuthProvider());
signOut(authentication);
```

The actual observer returns cleanup to the provider. The CourseCard only renders its Edit link when canEdit is true. The corresponding server rule is:

```text
allow update: if request.auth != null && validUpdate();
```

## GenAI Output tab — Prompt

Add Firebase Google authentication to my existing course scheduler. Put sign-in and sign-out controls on every page. Allow guests to browse and select courses, but hide editing controls and block the edit route unless the user is signed in. Also require authentication for database writes. Keep the current course features working and handle login errors.

The complete implementation specification is in `authentication.md`.

## GenAI Output tab — Output

The AI added an auth service, a shared AuthProvider, a useAuth hook, and an account banner. It also added edit-route protection and updated Firestore rules to block signed-out writes.

The course editor uses this guard before rendering the form:

```tsx
if (isLoading) return <p role="status" className="status-message">Checking sign-in…</p>;
```

When user is null, it shows a Sign in to edit courses message and a Return to courses link. Signing out removes the form immediately.

## Consult

The AI did more than hide the Edit buttons. It also protected the edit URL and database writes. That helped me understand why checking login state in the interface alone is not enough.

## Ask

How does Firebase check that a database request really comes from a signed-in user?

## Integration summary

The tricky part was keeping the login state and editing permissions in sync, especially after refreshing or signing out. I also learned how React Context shares the current user across components.

## Verification notes

- 148 tests passed across 10 files; production build and changed-file lint passed with the documented override for the pre-existing unavailable ESLint rule.
- 42 synthetic security-rule checks passed, covering authenticated valid/invalid updates and signed-out access. The existing Firebase bundle-size warning remains a performance follow-up.
- Google sign-in was enabled in the existing Firebase project with the support email approved by the owner. The project remains on the free Spark plan.
- A real Google login, authenticated edit/save, login persistence after reload and sign-out were verified in Chrome. Guests can still select courses; Edit links disappear and a direct edit URL displays a sign-in message.
- A valid anonymous Firestore edit was rejected with HTTP 403, while the public schedule read returned HTTP 200.
- Test edits were restored, and all 91 original course records, schedule title and course order were independently compared with the before-test snapshot.
- Authentication grants editing to signed-in users for this task. Restricting editing to administrators belongs to the separate role-based authorization challenge.
- The code and rules are deployed to https://xiance-cs392-courses-2026.web.app/. Use Chrome for Google popup login; the embedded browser did not expose the popup during verification.
- Screenshots: `/Users/natecece/.codex/visualizations/2026/11/01/authentication-signed-in.png` and `/Users/natecece/.codex/visualizations/2026/11/01/authentication-signed-out.png`.
