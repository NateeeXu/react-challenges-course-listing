# Learning Report — Personal course notes

Name: Xiance Xu

Task: Personal course notes (custom extension)

## Learning goals

Learn how to save a user’s private text for a specific item and handle two edits to the same data.

## Specification

Add a My note link to each course card. Signed-in users can write, edit, and clear a private note for that course, then reopen it later.

## Plan

Use the signed-in user's UID and the course ID to find the note in Firestore. Load it when the note page opens, put the text into a controlled textarea, and save with a transaction. Use Firestore rules to check that the signed-in user owns the note.

## Resources

- [React textarea](https://react.dev/reference/react-dom/components/textarea)
- [Firestore Security Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)

## Commit — core code (AI-assisted)

```ts
const noteReference = (uid: string, courseId: string) =>
  doc(database, 'users', uid, 'courseNotes', courseId);
```

## GenAI Output tab — Prompt

Add a My note link to each course card for signed-in users. Users should be able to open a course, write a short private note, save it, and read it again after refreshing or signing in on another device. Use one Firestore document per user and course. Save an empty note to clear it.

Enforce ownership in Firestore rules. Show loading, save, and error feedback. If the same note was edited elsewhere, show the latest version while keeping the current draft.

## GenAI Output tab — Output

```ts
const current = readNoteText(snapshot.data());
if (text === current) return { status: 'saved', text };
if (original !== current) return { status: 'conflict', text: current };
if (text) transaction.set(reference, { text });
else transaction.delete(reference);
return { status: 'saved', text };
```

```text
function ownsNote() {
  return request.auth != null && request.auth.uid == userId;
}
allow get, delete: if ownsNote();
allow create, update: if ownsNote() && validNote();
```

## Consult

My plan was to load a note by account and course ID and save it from a textarea. The AI also checked the previous text inside a transaction. That makes it possible to warn the user when another tab saves a different version.

## Ask

If I edit the same note in two tabs, should the app show both drafts or try to merge them?

## Integration summary

The extra work was testing account ownership and handling edits from two tabs. I learned how a transaction can protect an older draft from overwriting the latest saved note.
