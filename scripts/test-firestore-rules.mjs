// Tests candidate rules with synthetic fixtures; does not deploy or change database data.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, delimiter, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const project = 'xiance-cs392-courses-2026';
const path = '/databases/(default)/documents/schedules/CS-2018-2019';
const course = { title: 'AI', term: 'Fall', number: '101', meets: 'MWF 9:00-10:00' };
const before = { title: 'Example', courseOrder: ['F101', 'W101'], courses: {
  F101: course, W101: { ...course, term: 'Winter' },
} };
const changed = { ...before, courses: { ...before.courses, F101: { ...course, title: 'New title' } }, lastEditedCourseId: 'F101' };
const cases = [];
const add = (label, expectation, data, method = 'update', target = path) => {
  cases.push({ label, test: { expectation, request: { method, path: target, resource: { data },
    auth: { uid: 'signed-in-student', token: { firebase: { sign_in_provider: 'google.com' } } },
  }, resource: { data: before } } });
};
const edit = (patch) => ({ ...changed, courses: { ...changed.courses, F101: { ...changed.courses.F101, ...patch } } });

add('read sample schedule', 'ALLOW', before, 'get');
add('edit one existing course', 'ALLOW', changed);
add('empty TBA', 'ALLOW', edit({ meets: '' }));
add('Summer and section number', 'ALLOW', edit({ term: 'Summer', number: '213-2' }));
add('boundary time and unordered days', 'ALLOW', edit({ meets: 'FThM 0:00-23:59' }));
add('zero padded hours', 'ALLOW', edit({ meets: 'TuTh 09:00-10:00' }));
add('multiple spaces', 'ALLOW', edit({ meets: 'M   9:00-10:00' }));
for (const [label, patch] of [
  ['short title', { title: 'X' }], ['whitespace title', { title: '  ' }],
  ['wrong title type', { title: 12 }], ['wrong term', { term: 'Autumn' }],
  ['wrong number', { number: 'CS 101' }], ['number type', { number: 101 }],
  ['extra property', { admin: true }], ['bad meeting format', { meets: 'MWF' }],
  ['hour overflow', { meets: 'M 24:00-25:00' }], ['minute overflow', { meets: 'M 9:60-10:00' }],
  ['reversed time', { meets: 'M 10:00-9:00' }], ['equal time', { meets: 'M 9:00-9:00' }],
  ...['M', 'Tu', 'W', 'Th', 'F'].map((day) => [`duplicate ${day}`, { meets: `${day}${day} 9:00-10:00` }]),
]) add(label, 'DENY', edit(patch));
const missingField = edit({});
delete missingField.courses.F101.meets;
add('missing course field', 'DENY', missingField);
add('no changes', 'DENY', { ...before, lastEditedCourseId: 'F101' });
add('change schedule title', 'DENY', { ...changed, title: 'Overwrite' });
add('change display order', 'DENY', { ...changed, courseOrder: [] });
add('unrelated top-level field', 'DENY', { ...changed, admin: true });
add('missing edit marker', 'DENY', { ...before, courses: changed.courses });
add('wrong edit marker', 'DENY', { ...changed, lastEditedCourseId: 'W101' });
add('add course', 'DENY', { ...changed, courses: { ...changed.courses, F999: course } });
add('remove course', 'DENY', { ...changed, courses: { F101: changed.courses.F101 } });
add('edit two courses', 'DENY', { ...changed, courses: { ...changed.courses, W101: { ...course, title: 'Changed too' } } });
add('create schedule', 'DENY', changed, 'create');
add('delete schedule', 'DENY', before, 'delete');
add('list schedules', 'DENY', before, 'list', '/databases/(default)/documents/schedules');
add('read unrelated document', 'DENY', before, 'get', '/databases/(default)/documents/private/test');
add('write unrelated schedule', 'DENY', changed, 'update', '/databases/(default)/documents/schedules/other');
for (const [label, expectation, method, data] of [
  ['signed-out schedule read', 'ALLOW', 'get', before],
  ['signed-out valid update', 'DENY', 'update', changed],
  ['signed-out invalid update', 'DENY', 'update', edit({ title: 'X' })],
]) {
  add(label, expectation, data, method);
  delete cases.at(-1).test.request.auth;
}

const main = async () => {
  const binary = process.env.PATH.split(delimiter).map((directory) => join(directory, 'firebase')).find(existsSync);
  if (!binary) throw new Error('Run with: npm exec --package=firebase-tools -- node scripts/test-firestore-rules.mjs');
  const lib = resolve(dirname(realpathSync(binary)), '..');
  const require = createRequire(import.meta.url);
  const auth = require(join(lib, 'auth.js'));
  const account = auth.getProjectDefaultAccount(process.cwd());
  if (!account) throw new Error('Sign in with firebase login first.');
  const options = { project, nonInteractive: true };
  auth.setActiveAccount(options, account);
  await require(join(lib, 'requireAuth.js')).requireAuth(options);
  const { Client } = require(join(lib, 'apiv2.js'));
  const client = new Client({ urlPrefix: 'https://firebaserules.googleapis.com', apiVersion: 'v1' });
  const { body } = await client.post(`/projects/${project}:test`, {
    source: { files: [{ name: 'firestore.rules', content: readFileSync('firestore.rules', 'utf8') }] },
    testSuite: { testCases: cases.map(({ test }) => test) },
  });
  const failures = (body.testResults ?? []).flatMap((result, i) => result.state === 'SUCCESS' ? [] : [{ label: cases[i].label, state: result.state, errors: result.errors }]);
  if (body.issues?.length) console.log(JSON.stringify(body.issues));
  if (failures.length || body.testResults?.length !== cases.length) {
    throw new Error(JSON.stringify({ failures, received: body.testResults?.length, expected: cases.length }));
  }
  console.log(`Firestore rules: ${cases.length} synthetic cases passed. No database data was changed.`);
};

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
