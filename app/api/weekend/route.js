import { NextResponse } from 'next/server';

const CLUB_PATTERNS = {
  'KVC Westerlo': 'Home Team or Over 2.5',
  'SV Zulte Waregem': 'Home Team or Over 2.5',
  'Union Saint-Gilloise': 'Home Team or Over 2.5',
  'Royal Antwerp FC': 'Over 1.5',
  'Club Brugge': 'Over 1.5',
  'FC Twente Enschede': 'Over 1.5',
  'SC Heerenveen': 'Over 2.5',
  'SC Telstar': 'Over 2.5',
  'Ajax': 'Over 2.5',
  'PSV Eindhoven': 'Over 2.5',
  'Rennes': 'Over 2.5',
  'Marseille': 'Over 2.5',
  'Strasbourg': 'Home Team or Over 2.5',
  'Monaco': 'Home Team or Over 2.5',
  'Celta Vigo': 'Over 1.5',
  'Malaga CF': 'Over 1.5',
  'Getafe': 'Over 1.5',
  'Deportivo La Coruna': 'Over 1.5',
  'Real Madrid': 'Over 2.5',
  'Rayo Vallecano': 'Over 2.5',
  'Lazio': 'Over 0.5',
  'AC Milan': 'Over 0.5',
  'Atalanta': 'Away or Over 2.5',
  'Cagliari': 'Away or Over 2.5',
  'SC Freiburg': 'Over 0.5',
  'Borussia Monchengladbach': 'Over 0.5',
  'FC Augsburg': 'Over 1.5',
  'Bayer Leverkusen': 'Over 1.5',
  '1. FC Cologne': 'Over 0.5',
  'Werder Bremen': 'Over 0.5',
  'Union Berlin': 'Over 1.5',
  'Schalke 04': 'Over 1.5',
  'Crystal Palace': 'Home',
  'Ipswich Town': 'Home',
  'Sunderland AFC': 'Over 0.5',
  'Arsenal': 'Over 0.5',
  'Chelsea': 'Home Team or Over 2.5',
  'Hull City': 'Home Team or Over 2.5',
  'Manchester United': 'Home',
  'Manchester City': 'Home',
  'Leeds United': 'Over 1.5',
  'Newcastle United': 'Over 1.5',
};

const LEAGUES = ['eng.1', 'eng.2', 'esp.1', 'esp.2', 'ita.1', 'ger.1', 'fra.1', 'ned.1', 'bel.1', 'sco.1'];

function normalize(name = '') {
  return name.toLowerCase().replace(/\b(fc|afc|cf|sc|sv)\b/g, '').replace(/[^a-z0-9]/g, '');
}

function patternFor(home, away) {
  const exactHome = Object.keys(CLUB_PATTERNS).find(k => normalize(k) === normalize(home));
  const exactAway = Object.keys(CLUB_PATTERNS).find(k => normalize(k) === normalize(away));
  const chosen = exactHome || exactAway;
  return chosen ? CLUB_PATTERNS[chosen] : 'Pattern review';
}

function sourceFor(home, away) {
  const hits = Object.keys(CLUB_PATTERNS).filter(k => [home, away].some(t => normalize(k) === normalize(t)));
  return hits.length ? `${hits.join(' / ')} pattern` : 'Club pattern review';
}

async function fetchLeague(league, from, to) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${from}-${to}&limit=200`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export async function GET() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  const friday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilFriday));
  const sunday = new Date(friday);
  sunday.setUTCDate(friday.getUTCDate() + 2);
  const iso = d => d.toISOString().slice(0, 10).replaceAll('-', '');
  const from = iso(friday);
  const to = iso(sunday);

  const events = (await Promise.all(LEAGUES.map(l => fetchLeague(l, from, to)))).flat();
  const matches = events.map(event => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors || [];
    const home = competitors.find(c => c.homeAway === 'home')?.team?.displayName;
    const away = competitors.find(c => c.homeAway === 'away')?.team?.displayName;
    if (!home || !away) return null;
    const tracked = Object.keys(CLUB_PATTERNS).some(k => normalize(k) === normalize(home) || normalize(k) === normalize(away));
    if (!tracked) return null;
    const kickoff = new Date(event.date);
    return {
      id: String(event.id),
      date: kickoff.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'Africa/Lagos' }),
      time: kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' }),
      home,
      away,
      prediction: patternFor(home, away),
      source: sourceFor(home, away),
    };
  }).filter(Boolean).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return NextResponse.json({
    generatedAt: now.toISOString(),
    window: { from: friday.toISOString(), to: sunday.toISOString() },
    matches,
    trackedClubs: Object.keys(CLUB_PATTERNS),
    provider: 'ESPN public soccer schedule feed',
  });
}
