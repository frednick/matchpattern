import { NextResponse } from 'next/server';

const LEAGUES = ['eng.1','eng.2','esp.1','esp.2','ita.1','ger.1','fra.1','ned.1','bel.1','sco.1'];
const TRACKED = new Set(['KVC Westerlo','SV Zulte Waregem','Union Saint-Gilloise','Royal Antwerp FC','Club Brugge','FC Twente Enschede','SC Heerenveen','SC Telstar','Ajax','PSV Eindhoven','Rennes','Marseille','Strasbourg','Monaco','Celta Vigo','Malaga CF','Getafe','Deportivo La Coruna','Real Madrid','Rayo Vallecano','Lazio','AC Milan','Atalanta','Cagliari','SC Freiburg','Borussia Monchengladbach','FC Augsburg','Bayer Leverkusen','1. FC Cologne','Werder Bremen','Union Berlin','Schalke 04','Crystal Palace','Ipswich Town','Sunderland AFC','Arsenal','Chelsea','Hull City','Manchester United','Manchester City','Leeds United','Newcastle United']);
const ALIASES = {
  manunited:'Manchester United', manutd:'Manchester United', manchesterunited:'Manchester United',
  mancity:'Manchester City', manchestercity:'Manchester City',
  freiburg:'SC Freiburg', augsburg:'FC Augsburg', cologne:'1. FC Cologne',
  schalke:'Schalke 04', monchengladbach:'Borussia Monchengladbach',
  twente:'FC Twente Enschede', heerenveen:'SC Heerenveen', telstar:'SC Telstar',
  psv:'PSV Eindhoven', ajax:'Ajax', ajaxamsterdam:'Ajax', brugge:'Club Brugge', antwerp:'Royal Antwerp FC',
  unionstgilloise:'Union Saint-Gilloise', westerlo:'KVC Westerlo', waregem:'SV Zulte Waregem',
  rennes:'Rennes', marseille:'Marseille', strasbourg:'Strasbourg', monaco:'Monaco',
  celta:'Celta Vigo', malaga:'Malaga CF', getafe:'Getafe', deportivolacoruna:'Deportivo La Coruna',
  rcdeportivodelacoruna:'Deportivo La Coruna', realmadrid:'Real Madrid', rayovallecano:'Rayo Vallecano', lazio:'Lazio', acmilan:'AC Milan',
  atalanta:'Atalanta', cagliari:'Cagliari', werderbremen:'Werder Bremen', unionberlin:'Union Berlin',
  '1unionberlin':'Union Berlin',
  crystalpalace:'Crystal Palace', ipswichtown:'Ipswich Town', sunderland:'Sunderland AFC', arsenal:'Arsenal',
  chelsea:'Chelsea', hullcity:'Hull City', leeds:'Leeds United', leedsunited:'Leeds United', newcastle:'Newcastle United'
};

function norm(s='') { return s.toLowerCase().replace(/\b(fc|afc|cf|sc|sv)\b/g,'').replace(/[^a-z0-9]/g,''); }
function canonical(name='') { const n=norm(name); return ALIASES[n] || name; }
function tracked(name='') { return TRACKED.has(canonical(name)); }
function isoDate(d) { return d.toISOString().slice(0,10).replaceAll('-',''); }
function windowDates(daysBack, daysForward) {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysBack));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysForward));
  return { from: isoDate(from), to: isoDate(to) };
}

async function fetchLeague(league, from, to) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${from}-${to}&limit=500`;
    const r = await fetch(url, { next: { revalidate: 900 } });
    if (!r.ok) return [];
    const d = await r.json();
    return d.events || [];
  } catch { return []; }
}

function mapEvent(event) {
  const c = event.competitions?.[0];
  const cs = c?.competitors || [];
  const h = cs.find(x => x.homeAway === 'home');
  const a = cs.find(x => x.homeAway === 'away');
  if (!h || !a) return null;
  const home = canonical(h.team?.displayName || '');
  const away = canonical(a.team?.displayName || '');
  if (!tracked(home) && !tracked(away)) return null;
  const kickoff = new Date(event.date);
  const hs = Number(h.score), as = Number(a.score);
  return {
    id: String(event.id), date: kickoff.toISOString(), home, away,
    homeScore: Number.isFinite(hs) ? hs : null,
    awayScore: Number.isFinite(as) ? as : null,
    status: event.status?.type?.name || '',
    completed: event.status?.type?.completed === true || (Number.isFinite(hs) && Number.isFinite(as))
  };
}

export async function GET() {
  const previousWindow = windowDates(21, 0);
  const upcomingWindow = windowDates(0, 21);
  const [previousEvents, upcomingEvents] = await Promise.all([
    Promise.all(LEAGUES.map(l => fetchLeague(l, previousWindow.from, previousWindow.to))),
    Promise.all(LEAGUES.map(l => fetchLeague(l, upcomingWindow.from, upcomingWindow.to)))
  ]);

  const previous = previousEvents.flat().map(mapEvent).filter(Boolean)
    .filter(m => m.homeScore !== null && m.awayScore !== null)
    .sort((a,b) => new Date(b.date) - new Date(a.date));
  const upcoming = upcomingEvents.flat().map(mapEvent).filter(Boolean)
    .filter(m => m.homeScore === null && m.awayScore === null)
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    previous: previous.slice(0, 60),
    upcoming: upcoming.slice(0, 60),
    provider: 'ESPN public soccer schedule feed',
    windows: { previousDays: 21, upcomingDays: 21 }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
