import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n).not.toBeNull();
    expect(n!.badLines).toBe(1);
    expect(n!.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const f = n!.rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(f).toMatchObject({ owner: 'rook', runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(f.firstAt).toBe('2026-10-29T01:30:00+01:00');
    expect(f.lastAt).toBe('2026-10-29T01:37:00+01:00');
    expect(n!.rows.find((r) => r.job === 'notes/backup')).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
    expect(n!.rows.find((r) => r.job === 'digest/render')!.owner).toBeNull();
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
    expect(readNight('runs', '../etc/passwd')).toBeNull();
  });

  it('an empty file is a night with no rows', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    expect(readNight(dir, '2026-01-01')).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
  });

  it('counts bad lines instead of throwing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(
      join(dir, '2026-01-02.jsonl'),
      ['not json', '{"at":"x","job":"a","status":"weird","owner":null}', '{"at":"2026-01-02T01:00:00+01:00","job":"a","status":"ok","owner":null}'].join('\n'),
    );
    const n = readNight(dir, '2026-01-02')!;
    expect(n.badLines).toBe(2);
    expect(n.rows).toHaveLength(1);
  });
});
