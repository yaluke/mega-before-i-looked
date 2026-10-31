import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { DigestRow } from '../src/digest/types.js';

type Body = { night: string; rows: DigestRow[]; badLines: number };

let runsDir: string;
const get = (path: string) =>
  createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir }).request(path);

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  copyFileSync('runs/2026-10-28.jsonl', join(runsDir, '2026-10-28.jsonl'));
  writeFileSync(join(runsDir, '2026-10-20.jsonl'), '');
  writeFileSync(
    join(runsDir, '2026-10-21.jsonl'),
    [
      '{"at":"2026-10-21T23:00:02+01:00","job":"b/job","status":"ok","owner":"rook"}',
      'not json at all',
      '{"at":"2026-10-21T23:00:05+01:00","job":"a/job","status":"fail","owner":null,"error":"boom"}',
      '',
    ].join('\n'),
  );
});

describe('GET /digest/:night', () => {
  it('renders the jobs in job order', async () => {
    const res = await get('/digest/2026-10-28');
    expect(res.status).toBe(200);
    const html = await res.text();
    const jobs = ((await (await get('/api/digest/2026-10-28')).json()) as Body).rows.map((r) => r.job);
    expect(jobs.length).toBeGreaterThan(0);
    expect(html).toContain('<table');
    const idx = jobs.map((j) => html.indexOf(j));
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });

  it('404 for a night with no file', async () => {
    expect((await get('/digest/2000-01-01')).status).toBe(404);
  });

  it('empty file says nothing ran', async () => {
    const res = await get('/digest/2026-10-20');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('bad line still renders the good jobs', async () => {
    const res = await get('/digest/2026-10-21');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('a/job');
    expect(html).toContain('b/job');
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
  });
});

describe('GET /api/digest/:night', () => {
  it('returns night, rows sorted by job, badLines', async () => {
    const res = await get('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Body;
    expect(body.night).toBe('2026-10-28');
    expect(body.badLines).toBe(0);
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual([...jobs].sort());
    for (const r of body.rows) {
      expect(Object.keys(r).sort()).toEqual(
        ['firstAt', 'job', 'lastAt', 'lastError', 'lastStatus', 'owner', 'retries', 'runs'].sort(),
      );
    }
  });

  it('404 for no file', async () => {
    expect((await get('/api/digest/2000-01-01')).status).toBe(404);
  });

  it('empty file gives no rows', async () => {
    const res = await get('/api/digest/2026-10-20');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-10-20', rows: [], badLines: 0 });
  });

  it('bad line is counted, good rows kept', async () => {
    const body = (await (await get('/api/digest/2026-10-21')).json()) as Body;
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
  });
});
