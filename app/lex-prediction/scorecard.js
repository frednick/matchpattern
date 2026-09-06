'use client';

export const STORAGE_KEY = 'matchpattern-lex-scorecard-v1';

export function loadScorecard() {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function saveScorecard(rows) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function gradeMarket(prediction, homeGoals, awayGoals) {
  const h = Number(homeGoals), a = Number(awayGoals), total = h + a;
  if (!Number.isFinite(h) || !Number.isFinite(a) || h < 0 || a < 0) return null;
  if (prediction === 'Over 0.5') return total > 0;
  if (prediction === 'Over 1.5') return total > 1;
  if (prediction === 'Over 2.5') return total > 2;
  if (prediction === 'Both Teams to Score') return h > 0 && a > 0;
  if (prediction === 'Home') return h > a;
  if (prediction === 'Away') return a > h;
  return null;
}

export function stats(rows) {
  const graded = rows.filter((r) => typeof r.won === 'boolean');
  const wins = graded.filter((r) => r.won).length;
  const latest = [...graded].sort((a, b) => new Date(b.gradedAt || b.createdAt || 0) - new Date(a.gradedAt || a.createdAt || 0));
  const last10 = latest.slice(0, 10);
  const last10Wins = last10.filter((r) => r.won).length;
  const byMarket = {};
  graded.forEach((r) => {
    byMarket[r.market] ||= { total: 0, wins: 0 };
    byMarket[r.market].total += 1;
    if (r.won) byMarket[r.market].wins += 1;
  });
  return {
    total: rows.length,
    graded: graded.length,
    wins,
    losses: graded.length - wins,
    accuracy: graded.length ? Math.round((wins / graded.length) * 100) : null,
    last10: last10.length ? Math.round((last10Wins / last10.length) * 100) : null,
    byMarket,
  };
}
