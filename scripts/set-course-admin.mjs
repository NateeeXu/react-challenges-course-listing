// Owner-only helper. Browser clients can never assign roles.
// Dry run by default; --grant/--revoke must be explicitly requested.
import { existsSync, realpathSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const project = 'xiance-cs392-courses-2026';
const main = async () => {
  const args = process.argv.slice(2);
  const emailIndex = args.indexOf('--email');
  const email = emailIndex >= 0 ? args[emailIndex + 1] : undefined;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    args.some((arg, index) => !['--email', '--grant', '--revoke'].includes(arg) && index !== emailIndex + 1) ||
    (args.includes('--grant') && args.includes('--revoke'))) {
    throw new Error('Usage: npm exec --package=firebase-tools -- node scripts/set-course-admin.mjs --email <email> [--grant|--revoke]');
  }
  const binary = process.env.PATH.split(delimiter).map((directory) => join(directory, 'firebase')).find(existsSync);
  if (!binary) throw new Error('Run through npm exec --package=firebase-tools.');
  const lib = resolve(dirname(realpathSync(binary)), '..');
  const require = createRequire(import.meta.url);
  const auth = require(join(lib, 'auth.js'));
  const account = auth.getProjectDefaultAccount(process.cwd());
  if (!account) throw new Error('Sign in with firebase login first.');
  const options = { project, nonInteractive: true };
  auth.setActiveAccount(options, account);
  await require(join(lib, 'requireAuth.js')).requireAuth(options);
  const { Client } = require(join(lib, 'apiv2.js'));
  const identity = new Client({ urlPrefix: 'https://identitytoolkit.googleapis.com', apiVersion: 'v1' });
  const { body } = await identity.post(`/projects/${project}/accounts:lookup`, { email: [email] });
  const users = (body.users ?? []).filter((user) => user.email?.toLowerCase() === email.toLowerCase() && !user.disabled);
  if (users.length !== 1) throw new Error('Expected one existing, active Firebase user. Sign in to the course app first.');
  const uid = users[0].localId;
  if (!uid || uid.includes('/')) throw new Error('Invalid Firebase UID.');
  const client = new Client({ urlPrefix: 'https://firestore.googleapis.com', apiVersion: 'v1' });
  const path = `/projects/${project}/databases/(default)/documents/users/${uid}`;
  let existing;
  try { existing = (await client.get(path)).body; }
  catch (error) { if (error.status !== 404) throw error; }
  const current = existing?.fields?.admin?.booleanValue === true;
  console.log(`Resolved one existing account. Current course administrator: ${current}.`);
  const write = args.includes('--grant') || args.includes('--revoke');
  if (!write) { console.log('Dry run. No role was changed.'); return; }
  const admin = args.includes('--grant');
  if (existing && current === admin) { console.log('Requested role is already set. No write needed.'); return; }
  const queryParams = { 'updateMask.fieldPaths': 'admin', ...(existing
    ? { 'currentDocument.updateTime': existing.updateTime }
    : { 'currentDocument.exists': 'false' }) };
  await client.patch(path, { fields: { admin: { booleanValue: admin } } }, { queryParams });
  console.log(`Course administrator set to ${admin} for the specified account in ${project}.`);
};
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
