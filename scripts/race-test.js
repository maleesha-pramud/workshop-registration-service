#!/usr/bin/env node
/**
 * Concurrency proof for the capacity rule, run against a live API.
 *
 *   npm run test:race
 *   API_URL=http://localhost:4000/api CAPACITY=20 REQUESTS=50 npm run test:race
 *
 * Needs a MANAGER account (the demo seed creates manager@centre.local).
 * Scenarios, each fired with Promise.all so the requests really overlap:
 *   1. REQUESTS different attendees race for CAPACITY seats -> exactly CAPACITY succeed.
 *   2. The same attendee is submitted 10 times at once on a fresh workshop -> exactly 1 succeeds.
 *   3. One registration is cancelled 10 times at once -> exactly 1 succeeds, seat freed once.
 *   4. After the cancel, REQUESTS attendees race for the single freed seat -> exactly 1 succeeds.
 */

const API = process.env.API_URL ?? 'http://localhost:4000/api';
const EMAIL = process.env.RACE_EMAIL ?? 'manager@centre.local';
const PASSWORD = process.env.RACE_PASSWORD ?? 'Manager@12345';
const CAPACITY = Number(process.env.CAPACITY ?? 20);
const REQUESTS = Number(process.env.REQUESTS ?? 50);

let token;
let failures = 0;

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = res.status === 204 ? null : await res.json();
  return { status: res.status, json };
}

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: expected ${expected}, got ${actual}`);
}

function tally(results) {
  const counts = {};
  for (const r of results) {
    const key = r.status >= 400 ? `${r.status} ${r.json?.error?.code}` : String(r.status);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

async function createWorkshop(capacity) {
  const start = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  const locations = await call('GET', '/locations');
  const { status, json } = await call('POST', '/workshops', {
    code: `RACE-${Date.now().toString(36).toUpperCase()}`,
    title: 'Race condition test',
    instructor: 'Test Runner',
    locationId: locations.json.data[0].id,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 3600 * 1000).toISOString(),
    capacity,
  });
  if (status !== 201) throw new Error(`Could not create workshop: ${JSON.stringify(json)}`);
  return json.data;
}

const register = (workshopId, i, tag = 'p') =>
  call('POST', `/workshops/${workshopId}/registrations`, {
    attendeeName: `Attendee ${tag}${i}`,
    attendeeEmail: `${tag}${i}.${workshopId}@race.test`,
  });

async function main() {
  const login = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (login.status !== 200) throw new Error(`Login failed: ${JSON.stringify(login.json)}`);
  token = login.json.data.token;

  console.log(`\n1) ${REQUESTS} simultaneous registrations for ${CAPACITY} seats`);
  const w = await createWorkshop(CAPACITY);
  const t0 = Date.now();
  const results = await Promise.all(Array.from({ length: REQUESTS }, (_, i) => register(w.id, i)));
  console.log(`  ${JSON.stringify(tally(results))} in ${Date.now() - t0}ms`);
  check('successful registrations', results.filter((r) => r.status === 201).length, CAPACITY);
  check(
    'rejected as WORKSHOP_FULL',
    results.filter((r) => r.json?.error?.code === 'WORKSHOP_FULL').length,
    REQUESTS - CAPACITY,
  );
  let after = (await call('GET', `/workshops/${w.id}`)).json.data;
  check('workshop.activeCount', after.activeCount, CAPACITY);
  let active = (await call('GET', `/workshops/${w.id}/registrations?status=ACTIVE`)).json.data;
  check('ACTIVE registration rows', active.length, CAPACITY);

  console.log('\n2) Same attendee submitted 10 times at once');
  const w2 = await createWorkshop(5);
  const dupes = await Promise.all(Array.from({ length: 10 }, () => register(w2.id, 0, 'same')));
  console.log(`  ${JSON.stringify(tally(dupes))}`);
  check('successful registrations', dupes.filter((r) => r.status === 201).length, 1);

  console.log('\n3) One registration cancelled 10 times at once');
  const target = active[0];
  const cancels = await Promise.all(
    Array.from({ length: 10 }, () => call('POST', `/registrations/${target.id}/cancel`, {})),
  );
  console.log(`  ${JSON.stringify(tally(cancels))}`);
  check('successful cancellations', cancels.filter((r) => r.status === 200).length, 1);
  after = (await call('GET', `/workshops/${w.id}`)).json.data;
  check('workshop.activeCount after cancel', after.activeCount, CAPACITY - 1);

  console.log(`\n4) ${REQUESTS} simultaneous registrations for the 1 freed seat`);
  const second = await Promise.all(
    Array.from({ length: REQUESTS }, (_, i) => register(w.id, i, 'q')),
  );
  console.log(`  ${JSON.stringify(tally(second))}`);
  check('successful registrations', second.filter((r) => r.status === 201).length, 1);
  after = (await call('GET', `/workshops/${w.id}`)).json.data;
  check('workshop.activeCount', after.activeCount, CAPACITY);
  active = (await call('GET', `/workshops/${w.id}/registrations?status=ACTIVE`)).json.data;
  check('ACTIVE registration rows', active.length, CAPACITY);
  const history = (await call('GET', `/workshops/${w.id}/registrations`)).json.data;
  check('history keeps the cancelled row', history.filter((r) => r.status === 'CANCELLED').length, 1);

  console.log(failures ? `\n${failures} check(s) FAILED\n` : '\nAll checks passed\n');
  process.exitCode = failures ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
