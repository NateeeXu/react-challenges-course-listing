import { doc, onSnapshot } from 'firebase/firestore';
import { database } from './firebase';

export const subscribeToRole = (
  uid: string,
  onRole: (isAdmin: boolean) => void,
  onError: (error: Error) => void,
) => onSnapshot(doc(database, 'users', uid), { includeMetadataChanges: true }, (snapshot) => {
  // Cached permissions must not grant editing after a role was revoked offline.
  onRole(!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites &&
    snapshot.exists() && snapshot.data().admin === true);
}, onError);
