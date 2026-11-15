import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { authentication, database } from './firebase';

export const maxCourseNoteLength = 1000;

const noteReference = (uid: string, courseId: string) =>
  doc(database, 'users', uid, 'courseNotes', courseId);

const assertActiveUser = (uid: string) => {
  if (authentication.currentUser?.uid !== uid) {
    throw new Error('Sign in again to access your course notes.');
  }
};

const readNoteText = (data: unknown) => {
  if (data === undefined) return '';
  if (typeof data === 'object' && data !== null && 'text' in data && typeof data.text === 'string') {
    return data.text;
  }
  throw new Error('This course note contains invalid data.');
};

export const loadCourseNote = async (uid: string, courseId: string) => {
  assertActiveUser(uid);
  const snapshot = await getDocFromServer(noteReference(uid, courseId));
  assertActiveUser(uid);
  return readNoteText(snapshot.data());
};

type SaveCourseNoteResult =
  | { status: 'saved'; text: string }
  | { status: 'conflict'; text: string };

export const saveCourseNote = async (
  uid: string, courseId: string, original: string, draft: string,
): Promise<SaveCourseNoteResult> => {
  assertActiveUser(uid);
  const text = draft.trim();
  if (text.length > maxCourseNoteLength) throw new Error('Course notes can have up to 1,000 characters.');

  return runTransaction(database, async (transaction) => {
    const reference = noteReference(uid, courseId);
    const snapshot = await transaction.get(reference);
    assertActiveUser(uid);
    const current = readNoteText(snapshot.data());
    if (text === current) return { status: 'saved', text };
    if (original !== current) return { status: 'conflict', text: current };
    if (text) transaction.set(reference, { text });
    else transaction.delete(reference);
    return { status: 'saved', text };
  });
};
