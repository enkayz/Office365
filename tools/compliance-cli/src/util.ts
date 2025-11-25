export function parseSince(since: string): {start: string; end: string} {
  // Supports Nd, Nh, Nmn (e.g., 7d, 24h, 90m). Multiple parts like 1d2h are allowed.
  const now = new Date();
  let ms = 0;
  const re = /(\d+)([dhm])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(since))) {
    const n = Number(m[1]);
    const u = m[2].toLowerCase();
    if (u === 'd') ms += n * 24 * 60 * 60 * 1000;
    else if (u === 'h') ms += n * 60 * 60 * 1000;
    else if (u === 'm') ms += n * 60 * 1000;
  }
  if (ms === 0) throw new Error(`Invalid --since value: ${since}`);
  const end = now.toISOString();
  const start = new Date(now.getTime() - ms).toISOString();
  return {start, end};
}

export function isoRangeOrSince(opts: {since?: string; start?: string; end?: string}): {start: string; end: string} {
  if (opts.since) return parseSince(opts.since);
  if (opts.start && opts.end) return {start: opts.start, end: opts.end};
  throw new Error('Provide --since <duration> (e.g., 24h) or both --start and --end (ISO)');
}

export function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 200);
}
