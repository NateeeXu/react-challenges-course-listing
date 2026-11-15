import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCourseNote, saveCourseNote } from './course-notes';

const sdk = vi.hoisted(() => ({
  database: {}, authentication: { currentUser: { uid: 'student' } as { uid: string } | null },
  doc: vi.fn(), getDocFromServer: vi.fn(), runTransaction: vi.fn(),
  get: vi.fn(), set: vi.fn(), delete: vi.fn(),
}));
vi.mock('./firebase', () => ({ database: sdk.database, authentication: sdk.authentication }));
vi.mock('firebase/firestore', () => ({
  doc: sdk.doc, getDocFromServer: sdk.getDocFromServer, runTransaction: sdk.runTransaction,
}));

const snapshot = (data: unknown) => ({ data: () => data });
const reference = { path: 'users/student/courseNotes/F101' };

beforeEach(() => {
  vi.resetAllMocks();
  sdk.authentication.currentUser = { uid: 'student' };
  sdk.doc.mockImplementation((_database, ...path) => ({ path: path.join('/') }));
  sdk.getDocFromServer.mockResolvedValue(snapshot(undefined));
  sdk.get.mockResolvedValue(snapshot(undefined));
  sdk.runTransaction.mockImplementation(async (_database, callback) =>
    callback({ get: sdk.get, set: sdk.set, delete: sdk.delete }));
});

describe('course note persistence', () => {
  it('reads the current account’s note and treats missing data as empty', async () => {
    expect(await loadCourseNote('student', 'F101')).toBe('');
    expect(sdk.getDocFromServer).toHaveBeenCalledWith(reference);
    sdk.getDocFromServer.mockResolvedValue(snapshot({ text: '我的备注' }));
    expect(await loadCourseNote('student', 'F101')).toBe('我的备注');
  });

  it('writes note text and deletes the document when the note is cleared', async () => {
    expect(await saveCourseNote('student', 'F101', '', '  Ask about labs.  ')).toEqual({
      status: 'saved', text: 'Ask about labs.',
    });
    expect(sdk.set).toHaveBeenCalledWith(reference, { text: 'Ask about labs.' });
    sdk.get.mockResolvedValue(snapshot({ text: 'Ask about labs.' }));
    expect(await saveCourseNote('student', 'F101', 'Ask about labs.', ' ')).toEqual({ status: 'saved', text: '' });
    expect(sdk.delete).toHaveBeenCalledWith(reference);
  });

  it('preserves a newer note when an editor submits a stale draft', async () => {
    sdk.get.mockResolvedValue(snapshot({ text: 'Newer note' }));
    expect(await saveCourseNote('student', 'F101', 'Old note', 'My draft')).toEqual({
      status: 'conflict', text: 'Newer note',
    });
    expect(sdk.set).not.toHaveBeenCalled();
    expect(sdk.delete).not.toHaveBeenCalled();
  });

  it('does not write when account changes during a transaction', async () => {
    sdk.get.mockImplementationOnce(async () => {
      sdk.authentication.currentUser = { uid: 'different-user' };
      return snapshot(undefined);
    });
    await expect(saveCourseNote('student', 'F101', '', 'My draft')).rejects.toThrow('Sign in again');
    expect(sdk.set).not.toHaveBeenCalled();
  });
});
