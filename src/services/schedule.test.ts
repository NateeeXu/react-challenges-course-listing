import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToSchedule } from './schedule';

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
}));

vi.mock('./firebase', () => ({ database: firebase.database }));
vi.mock('firebase/firestore', () => ({ doc: firebase.doc, onSnapshot: firebase.onSnapshot }));

const data = {
  title: 'Sample schedule',
  courses: { F101: { title: 'AI', term: 'Fall', number: '101', meets: '' } },
};

beforeEach(() => {
  vi.clearAllMocks();
  firebase.doc.mockReturnValue(firebase.reference);
  firebase.onSnapshot.mockReturnValue(firebase.unsubscribe);
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
