import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToRole } from './roles';

interface Snapshot {
  exists: () => boolean;
  data: () => Record<string, unknown>;
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
}
const sdk = vi.hoisted(() => ({ database: {}, reference: {}, doc: vi.fn(), onSnapshot: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('./firebase', () => ({ database: sdk.database }));
vi.mock('firebase/firestore', () => ({ doc: sdk.doc, onSnapshot: sdk.onSnapshot }));
beforeEach(() => {
  vi.clearAllMocks(); sdk.doc.mockReturnValue(sdk.reference); sdk.onSnapshot.mockReturnValue(sdk.unsubscribe);
});

describe('role subscription', () => {
  it('subscribes only to the signed-in UID and returns cleanup', () => {
    expect(subscribeToRole('student', vi.fn(), vi.fn())).toBe(sdk.unsubscribe);
    expect(sdk.doc).toHaveBeenCalledWith(sdk.database, 'users', 'student');
    expect(sdk.onSnapshot).toHaveBeenCalledWith(sdk.reference, { includeMetadataChanges: true }, expect.any(Function), expect.any(Function));
  });

  it.each([
    [true, { admin: true }, false, false, true],
    [false, {}, false, false, false],
    [true, {}, false, false, false],
    [true, { admin: false }, false, false, false],
    [true, { admin: 'true' }, false, false, false],
    [true, { admin: true }, true, false, false],
    [true, { admin: true }, false, true, false],
  ] as const)('grants editing only for a confirmed true role (%j, %j, cache=%s, pending=%s)', (exists, data, fromCache, hasPendingWrites, expected) => {
    const onRole = vi.fn(); subscribeToRole('student', onRole, vi.fn());
    const notify = sdk.onSnapshot.mock.calls[0][2] as (snapshot: Snapshot) => void;
    notify({ exists: () => exists, data: () => data, metadata: { fromCache, hasPendingWrites } });
    expect(onRole).toHaveBeenCalledWith(expected);
  });

  it('forwards permission errors instead of granting access', () => {
    const onError = vi.fn(); subscribeToRole('student', vi.fn(), onError);
    expect(sdk.onSnapshot.mock.calls[0][3]).toBe(onError);
  });
});
