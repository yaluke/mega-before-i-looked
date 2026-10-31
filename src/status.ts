import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RigConfig } from './config.js';
import { parseLine } from './digest/read.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightEntry[];
};

export type Counts = { ok: number; retry: number; fail: number };
export type NightEntry = { night: string; counts: Counts };

// Count parsed log lines per status; unreadable file or bad lines count as nothing.
export function countStatuses(runsDir: string, night: string): Counts {
  const counts: Counts = { ok: 0, retry: 0, fail: 0 };
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return counts;
  }
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const l = parseLine(raw);
    if (l) counts[l.status] += 1;
  }
  return counts;
}

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((night) => ({ night, counts: countStatuses(config.runsDir, night) })),
  };
}
