import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCourse, subscribeToSchedule } from './schedule';
import type { Schedule } from '../types/schedule';

interface SnapshotStub {
  exists: () => boolean;
  data: () => unknown;
}

const firebase = vi.hoisted(() => ({
  database: {},
  reference: {},
  doc: vi.fn(),
  unsubscribe: vi.fn(),
  onSnapshot: vi.fn<(
    reference: unknown,
    onData: (snapshot: SnapshotStub) => void,
    onError: (error: Error) => void,
  ) => () => void>(),
  runTransaction: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
}));

vi.mock('./firebase', () => ({ database: firebase.database }));
vi.mock('firebase/firestore', () => ({
  doc: firebase.doc, onSnapshot: firebase.onSnapshot, runTransaction: firebase.runTransaction,
  FieldPath: class { constructor(...segments: string[]) { Object.assign(this, { segments }); } },
}));

const data = {
  title: 'Sample schedule',
  courses: { F101: { title: 'AI', term: 'Fall', number: '101', meets: '' } },
} satisfies Schedule;

beforeEach(() => {
  vi.clearAllMocks();
  firebase.doc.mockReturnValue(firebase.reference);
  firebase.onSnapshot.mockReturnValue(firebase.unsubscribe);
  firebase.get.mockResolvedValue({ exists: () => true, data: () => data });
  firebase.runTransaction.mockImplementation(async (_db, callback) => callback({ get: firebase.get, update: firebase.update }));
});

describe('saveCourse', () => {
  const original = data.courses.F101;
  const changed = { ...original, title: 'New title' };

  it('validates before writing and skips unchanged normalized values', async () => {
    await expect(saveCourse('F101', original, { ...changed, title: 'X' })).rejects.toThrow();
    await saveCourse('F101', original, { ...original, title: ' AI ' });
    expect(firebase.runTransaction).not.toHaveBeenCalled();
  });

  it('updates only the requested course using a literal field path', async () => {
    await saveCourse('F101', original, { ...changed, title: ' New title ' });
    expect(firebase.update).toHaveBeenCalledWith(firebase.reference,
      { segments: ['courses', 'F101'] }, changed, 'lastEditedCourseId', 'F101');
  });

  it.each([
    { exists: () => false, data: () => data },
    { exists: () => true, data: () => ({ ...data, courses: {} }) },
    { exists: () => true, data: () => ({ ...data, courses: { F101: { ...original, title: 'Someone else edited it' } } }) },
  ])('rejects missing or changed data without overwriting it', async (snapshot) => {
    firebase.get.mockResolvedValue(snapshot);
    await expect(saveCourse('F101', original, changed)).rejects.toThrow();
    expect(firebase.update).not.toHaveBeenCalled();
  });

  it('preserves an unrelated course updated by another user', async () => {
    firebase.get.mockResolvedValue({ exists: () => true, data: () => ({
      ...data, courses: { ...data.courses, W101: { ...original, term: 'Winter', title: 'Other edit' } },
    }) });
    await saveCourse('F101', original, changed);
    expect(firebase.update).toHaveBeenCalledTimes(1);
  });

  it('forwards database failures so the form can offer a retry', async () => {
    firebase.runTransaction.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(saveCourse('F101', original, changed)).rejects.toThrow('Permission denied');
  });
});

describe('subscribeToSchedule', () => {
  it('reads only the intended project document and returns the unsubscribe function', () => {
    const onData = vi.fn();
    const unsubscribe = subscribeToSchedule(onData, vi.fn());
    expect(firebase.doc).toHaveBeenCalledWith(firebase.database, 'schedules', 'CS-2018-2019');
    expect(unsubscribe).toBe(firebase.unsubscribe);
    firebase.onSnapshot.mock.calls[0][1]({ exists: () => true, data: () => data });
    expect(onData).toHaveBeenCalledWith(data);
  });

  it('reports a missing document instead of substituting the old PHP source', () => {
    const onData = vi.fn();
    const onError = vi.fn();
    subscribeToSchedule(onData, onError);
    firebase.onSnapshot.mock.calls[0][1]({ exists: () => false, data: () => undefined });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not been imported') }));
    expect(onData).not.toHaveBeenCalled();
  });

  it('reports invalid fields instead of passing malformed data into course cards', () => {
    const onData = vi.fn();
    const onError = vi.fn();
    subscribeToSchedule(onData, onError);
    firebase.onSnapshot.mock.calls[0][1]({ exists: () => true, data: () => ({ title: 'Broken' }) });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'The course schedule contains invalid data.' }));
    expect(onData).not.toHaveBeenCalled();
  });

  it('forwards permission and connection errors to the caller', () => {
    const onError = vi.fn();
    subscribeToSchedule(vi.fn(), onError);
    const error = new Error('Permission denied');
    firebase.onSnapshot.mock.calls[0][2](error);
    expect(onError).toHaveBeenCalledWith(error);
  });
});
