# Learning Report — Role-based authorization

Name: Xiance Xu  
Task: Role-based authorization

These are short report drafts. Code was AI-assisted, not an independent pre-AI attempt. Adjust personal learning statements to match your actual understanding.

## Learning goals

Learn the difference between authentication and authorization, and use database roles to control who can edit courses.

## Specification

Only signed-in administrators should be able to edit courses. Other users can still browse and select courses. Store administrator roles in Firestore, hide editing controls for non-admin users, and enforce the same restrictions in database rules.

## Plan

Read the signed-in user's role using their Firebase UID. Share the administrator state through React Context and use it to control Edit buttons and the edit page. Check the role again when saving, and prevent users from changing their own roles.

## Resources

- [Role-based authorization assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#role-based-authorization)
- [Firestore access conditions](https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents)
- [Realtime database listeners](https://firebase.google.com/docs/firestore/query-data/listen)

## Commit — core code (AI-assisted reference)

Show the Edit link only after administrator access is confirmed:

```tsx
canEdit={isAdmin && !isRoleLoading}
```

Check the current user's role in the actual save transaction:

```ts
const role = await transaction.get(doc(database, 'users', user.uid));
if (!role.exists() || role.data().admin !== true) {
  throw new Error('Administrator access is required to edit courses.');
}
```

The database independently enforces:

```text
allow update: if isAdmin() && validUpdate();
```

The `isAdmin()` rule checks the authenticated UID's protected role document.

## GenAI Output tab — Prompt

Add role-based authorization to my course scheduler. Store an admin flag for designated Firebase users in Firestore. Only administrators should see editing controls or save course changes. Guests and ordinary users can still browse and select courses. Protect edit URLs and database writes, prevent self-promotion, and update permissions when the account or role changes.

The complete specification is in `role-based-authorization.md`.

## GenAI Output tab — Output

The AI added a role listener and extended the shared auth context with administrator, loading and error states. It updated the Edit buttons, protected the edit page, checked roles during saving, and added Firestore rules to prevent non-admin edits and client-side role changes.

The role listener accepts only a confirmed boolean `admin: true`, and the provider ignores callbacks from previous accounts.

## Consult

The AI also handled missing roles, permission-loading states and account switching. I learned that hiding an Edit button is only part of the solution; the database must check the user's role too.

## Ask

If someone's administrator role is removed while they are editing, what should happen to their unsaved changes?

## Integration summary

The tricky part was keeping editing permissions in sync when accounts or roles changed. I also learned that being signed in identifies a user, but does not automatically give them permission to edit.

## Verification notes

- 167 tests passed across 12 files. Production build and changed-file lint passed with the documented override for the pre-existing unavailable ESLint rule.
- 56 synthetic database-rule cases passed, including admin writes, non-admin/guest denials, role privacy and attempts to change roles.
- The deployed member view was verified: an ordinary signed-in user sees Read only, can select courses, has no Edit links, and cannot open the editor by URL.
- The owner designated their existing Google account as administrator. Its Firebase UID was resolved through the owner-authenticated helper and assigned `admin: true`; no UID or email is hardcoded into the frontend.
- Granting the role changed the open member-only screen into an editor without a reload. A real administrator save persisted after reloading, and the original course was restored through the same Submit flow.
- A temporary revocation immediately closed the editor and discarded its unsaved draft. Administrator access was then restored and verified, leaving the designated account with administrator access.
- An independent production check confirmed public schedule reads return HTTP 200, anonymous course edits and role listing return HTTP 403, and all 91 course records/title/order match the before-test snapshot after restoring edits.
- The app and rules are deployed to https://xiance-cs392-courses-2026.web.app/. Screenshots: `/Users/natecece/.codex/visualizations/2026/11/03/role-admin.png` and `/Users/natecece/.codex/visualizations/2026/11/03/role-member-blocked.png`.
