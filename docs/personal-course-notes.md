# Personal course notes

Add a My note link to each course card for signed-in users. Users should be able to open a course, write a short private note, save it, and read it again after refreshing or signing in on another device. Use one Firestore document per user and course. Save an empty note to clear it.

Enforce ownership in Firestore rules. Show loading, save, and error feedback. If the same note was edited elsewhere, show the latest version while keeping the current draft.
