import { existsSync, realpathSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { scheduleDocumentId, scheduleSchema } from '../src/types/schedule.ts';

const projectId = 'xiance-cs392-courses-2026';
const sourceUrl = 'https://courses.cs.northwestern.edu/394/guides/data/cs-courses.php';
const documentPath = `projects/${projectId}/databases/(default)/documents/schedules/${scheduleDocumentId}`;

const encodeValue = (value) => {
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value && typeof value === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)])) } };
  }
  throw new Error('Unexpected value in the sample schedule.');
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--write')) throw new Error('Only --write is supported; omit it for a dry run.');

  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Schedule source returned HTTP ${response.status}.`);
  const schedule = scheduleSchema.parse(await response.json());
  const courseOrder = Object.keys(schedule.courses);
  if (!courseOrder.length) throw new Error('Refusing to import an empty sample schedule.');
  console.log(`Validated ${courseOrder.length} courses for ${documentPath}.`);
  if (!args.includes('--write')) {
    console.log('Dry run only. Add --write to create the document; existing data is never overwritten.');
    return;
  }

  // Reuse the official Firebase CLI login in memory. Never print or copy tokens.
  // npm exec puts its temporary firebase binary on PATH; no CLI dependency is added to this app.
  const binary = process.env.PATH.split(delimiter).map((directory) => join(directory, 'firebase')).find(existsSync);
  if (!binary) throw new Error('Run with: npm exec --package=firebase-tools -- node scripts/import-schedule.mjs --write');
  const cliLib = resolve(dirname(realpathSync(binary)), '..');
  const require = createRequire(import.meta.url);
  const auth = require(join(cliLib, 'auth.js'));
  const account = auth.getProjectDefaultAccount(process.cwd());
  if (!account) throw new Error('Sign in with firebase login before importing.');
  const options = { project: projectId, nonInteractive: true };
  auth.setActiveAccount(options, account);
  await require(join(cliLib, 'requireAuth.js')).requireAuth(options);
  const { Client } = require(join(cliLib, 'apiv2.js'));
  const client = new Client({ urlPrefix: 'https://firestore.googleapis.com', apiVersion: 'v1' });
  await client.post(`/projects/${projectId}/databases/(default)/documents:commit`, {
    writes: [{
      update: { name: documentPath, fields: encodeValue({ ...schedule, courseOrder }).mapValue.fields },
      currentDocument: { exists: false },
    }],
  });
  console.log(`Created ${scheduleDocumentId} with ${courseOrder.length} courses. Browser writes remain disabled.`);
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
