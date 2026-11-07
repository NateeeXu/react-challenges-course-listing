import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changePersonalSelection, subscribeToPersonalPlan } from './personal-plan';

const sdk = vi.hoisted(() => ({
  database: {}, authentication: { currentUser: { uid: 'student' } as { uid: string } | null },
  doc: vi.fn(), onSnapshot: vi.fn(), unsubscribe: vi.fn(), runTransaction: vi.fn(),
  get: vi.fn(), set: vi.fn(), readPlan: vi.fn(), readSchedule: vi.fn(),
}));
vi.mock('./firebase', () => ({ database: sdk.database, authentication: sdk.authentication }));
vi.mock('firebase/firestore', () => ({ doc: sdk.doc, onSnapshot: sdk.onSnapshot, runTransaction: sdk.runTransaction }));
const courses = {
  F101: { term: 'Fall', number: '101', title: 'First course', meets: 'MWF 11:00-11:50' },
  F102: { term: 'Fall', number: '102', title: 'Second course', meets: 'MWF 12:00-12:50' },
  F103: { term: 'Fall', number: '103', title: 'Conflicting course', meets: 'W 11:30-12:20' },
  W201: { term: 'Winter', number: '201', title: 'Winter course', meets: 'MWF 11:00-11:50' },
};
const snapshot = (data: unknown, exists = true, fromCache = false, hasPendingWrites = false) => ({
  exists: () => exists, data: () => data, metadata: { fromCache, hasPendingWrites },
});
beforeEach(() => {
  vi.clearAllMocks(); sdk.authentication.currentUser = { uid: 'student' };
  sdk.doc.mockImplementation((_database, ...segments) => ({ path: segments.join('/') }));
  sdk.onSnapshot.mockReturnValue(sdk.unsubscribe);
  sdk.readPlan.mockResolvedValue(snapshot({ selectedCourseIds: ['F101'], revision: 1 }));
  sdk.readSchedule.mockResolvedValue(snapshot({ title: 'Schedule', courses }));
  sdk.get.mockImplementation((reference: { path: string }) => reference.path.startsWith('users/') ? sdk.readPlan() : sdk.readSchedule());
  sdk.runTransaction.mockImplementation(async (_database, callback) => callback({ get: sdk.get, set: sdk.set }));
});

describe('personal plan persistence', () => {
  it('listens only to the supplied user and schedule, with cleanup', () => {
    expect(subscribeToPersonalPlan('student', vi.fn(), vi.fn())).toBe(sdk.unsubscribe);
    expect(sdk.doc).toHaveBeenCalledWith(sdk.database, 'users', 'student', 'plans', 'CS-2018-2019');
    expect(sdk.onSnapshot.mock.calls[0][1]).toEqual({ includeMetadataChanges: true });
  });

  it('ignores cached missing data and restores only a confirmed saved plan', () => {
    const onData = vi.fn(); subscribeToPersonalPlan('student', onData, vi.fn());
    const notify = sdk.onSnapshot.mock.calls[0][2];
    notify(snapshot(undefined, false, true)); expect(onData).not.toHaveBeenCalled();
    notify(snapshot({ selectedCourseIds: ['F101'], revision: 2 }, true, false, true));
    expect(onData).not.toHaveBeenCalled();
    notify(snapshot({ selectedCourseIds: ['F101'], revision: 2 }));
    expect(onData).toHaveBeenCalledWith({ selectedCourseIds: ['F101'], revision: 2 });
  });

  it('treats a confirmed missing document as an empty plan without creating one', () => {
    const onData = vi.fn(); subscribeToPersonalPlan('student', onData, vi.fn());
    sdk.onSnapshot.mock.calls[0][2](snapshot(undefined, false));
    expect(onData).toHaveBeenCalledWith({ selectedCourseIds: [], revision: 0 });
    expect(sdk.set).not.toHaveBeenCalled();
  });

  it.each([
    { selectedCourseIds: ['F101', 'F101'], revision: 1 },
    { selectedCourseIds: ['F101'] },
    { selectedCourseIds: [1], revision: 1 },
    { selectedCourseIds: [], revision: 0 },
    { selectedCourseIds: [], revision: 1, admin: true },
  ])('reports malformed saved data instead of passing it to React: %j', (data) => {
    const onData = vi.fn(); const onError = vi.fn(); subscribeToPersonalPlan('student', onData, onError);
    sdk.onSnapshot.mock.calls[0][2](snapshot(data));
    expect(onData).not.toHaveBeenCalled(); expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Your saved plan contains invalid data.' }));
  });

  it('merges one selection with the latest server plan and increments its revision', async () => {
    sdk.readPlan.mockResolvedValue(snapshot({ selectedCourseIds: ['F101', 'W201'], revision: 5 }));
    const saved = await changePersonalSelection('student', 'F102', true);
    expect(saved).toEqual({ selectedCourseIds: ['F101', 'W201', 'F102'], revision: 6 });
    expect(sdk.set).toHaveBeenCalledWith({ path: 'users/student/plans/CS-2018-2019' }, saved);
    expect(sdk.get).toHaveBeenCalledWith({ path: 'schedules/CS-2018-2019' });
  });

  it('creates a first selection at revision one and persists clearing the last selection', async () => {
    sdk.readPlan.mockResolvedValueOnce(snapshot(undefined, false));
    expect(await changePersonalSelection('student', 'F102', true)).toEqual({ selectedCourseIds: ['F102'], revision: 1 });
    expect(await changePersonalSelection('student', 'F101', false)).toEqual({ selectedCourseIds: [], revision: 2 });
  });

  it('skips redundant writes and prunes IDs removed from the catalog on the next change', async () => {
    await changePersonalSelection('student', 'F101', true); expect(sdk.set).not.toHaveBeenCalled();
    sdk.readPlan.mockResolvedValueOnce(snapshot({ selectedCourseIds: ['REMOVED', 'F101'], revision: 4 }));
    expect(await changePersonalSelection('student', 'F102', true)).toEqual({ selectedCourseIds: ['F101', 'F102'], revision: 5 });
  });

  it('checks conflicts against the latest saved choices, including another devices changes', async () => {
    await expect(changePersonalSelection('student', 'F103', true)).rejects.toThrow('conflicts');
    expect(sdk.set).not.toHaveBeenCalled();
    expect((await changePersonalSelection('student', 'W201', true)).selectedCourseIds).toEqual(['F101', 'W201']);
  });

  it('rejects missing courses and foreign or signed-out users without writing', async () => {
    await expect(changePersonalSelection('student', 'MISSING', true)).rejects.toThrow('no longer available');
    sdk.authentication.currentUser = { uid: 'other-user' };
    await expect(changePersonalSelection('student', 'F102', true)).rejects.toThrow('Sign in again');
    sdk.authentication.currentUser = null;
    await expect(changePersonalSelection('student', 'F102', true)).rejects.toThrow('Sign in again');
    expect(sdk.set).not.toHaveBeenCalled();
  });

  it('does not write to a previous account after the active session changes', async () => {
    sdk.readSchedule.mockImplementationOnce(async () => {
      sdk.authentication.currentUser = { uid: 'other-user' };
      return snapshot({ title: 'Schedule', courses });
    });
    await expect(changePersonalSelection('student', 'F102', true)).rejects.toThrow('account changed');
    expect(sdk.set).not.toHaveBeenCalled();
  });
});
