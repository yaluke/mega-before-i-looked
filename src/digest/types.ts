// Plan morning-digest § 1. The contract every part of § 2 builds on.

export type RunStatus = 'ok' | 'retry' | 'fail';

/** One line of runs/<night>.jsonl, after parsing. */
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

/** One row per job for the night. Times keep the log's offset. */
export type DigestRow = {
  job: string;
  /** null when the log says so; views show it as `—`. */
  owner: string | null;
  runs: number;
  /** Lines with status `retry`. */
  retries: number;
  lastStatus: RunStatus;
  /** Error of the last line that had one; null if none. */
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

/** A night read from disk. Rows are sorted by job. */
export type Night = {
  night: string;
  rows: DigestRow[];
  /** Lines that did not parse; counted, never thrown. */
  badLines: number;
};

/** Returns null when runs/<night>.jsonl does not exist (404), a Night otherwise (empty file → no rows). */
export type ReadNight = (runsDir: string, night: string) => Night | null;
