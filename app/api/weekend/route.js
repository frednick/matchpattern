import { NextResponse } from 'next/server';

const CLUB_PATTERNS = {
  'KVC Westerlo': 'Home Team or Over 2.5', 'SV Zulte Waregem': 'Home Team or Over 2.5', 'Union Saint-Gilloise': 'Home Team or Over 2.5',
  'Royal Antwerp FC': 'Over 1.5', 'Club Brugge': 'Over 1.5', 'FC Twente Enschede': 'Over 1.5', 'SC Heerenveen': 'Over 2.5', 'SC Telstar': 'Over 2.5',
  Ajax: 'Over 2.5', 'PSV Eindhoven': 'Over 2.5', Rennes: 'Over 2.5', Marseille: 'Over 2.5', Strasbourg: 'Home Team or Over 2.5', Monaco: 'Home Team or Over 2.5',
  'Celta Vigo': 'Over 1.5', 'Malaga CF': 'Over 1.5', Getafe: 'Over 1.5', 'Deportivo La Coruna': 'Over 1.5', 'Real Madrid': 'Over 2.5', 'Rayo Vallecano': 'Over 2.5',
  Lazio: 'Over 0.5', 'AC Milan': 'Over 0.5', Atalanta: 'Away or Over 2.5', Cagliari: 'Away or Over 2.5', 'SC Freiburg': 'Over 0.5', 'Borussia Monchengladbach': 'Over 0.5',
  'FC Augsburg': 'Over 1.5', 'Bayer Leverkusen': 'Over 1.5', '1. FC Cologne': 'Over 0.5', 'Werder Bremen': 'Over 0.5', 'Union Berlin': 'Over 1.5', 'Schalke 04': 'Over 1.5',
  'Crystal Palace': 'Home', 'Ipswich Town': 'Home', 'Sunderland AFC': 'Over 0.5', Arsenal: 'Over 0.5', Chelsea: 'Home Team or Over 2.5', 'Hull City': 'Home Team or Over 2.5',
  'Manchester United': 'Home', 'Manchester City': 'Home', 'Leeds United': 'Over 1.5', 'Newcastle United': 'Over 1.5',
  'Standard Liege': 'Over 1.5', 'ADO Den Haag': 'Over 1.5', 'Fortuna Sittard': 'Over 1.5', 'Lommel SK': 'Over 1.5', 'Royal Charleroi SC': 'Over 1.5', 'Sparta Rotterdam': 'Over 1.5'
};

const LEAGUES = ['eng.1','eng.2','esp.1','esp.2','ita.1','ger.1','fra.1','ned.1','bel.1','sco.1'];

function normalize(name=''){return name.toLowerCase().replace(/\b(fc|afc|cf|sc|sv)\b/g,'').replace(/[^a-z0-9]/g,'')}
function canonical(name=''){
  const aliases={manunited:'Manchester United',manutd:'Manchester United',mancity:'Manchester City',freiburg:'SC Freiburg',augsburg:'FC Augsburg',cologne:'1. FC Cologne',schalke:'Schalke 04',monchengladbach:'Borussia Monchengladbach',twente:'FC Twente Enschede',heerenveen:'SC Heerenveen',telstar:'SC Telstar',psv:'PSV Eindhoven',ajaxamsterdam:'Ajax',brugge:'Club Brugge',antwerp:'Royal Antwerp FC',unionstgilloise:'Union Saint-Gilloise',westerlo:'KVC Westerlo',waregem:'SV Zulte Waregem',rennes:'Rennes',marseille:'Marseille',strasbourg:'Strasbourg',monaco:'Monaco',celta:'Celta Vigo',malaga:'Malaga CF',getafe:'Getafe',deportivolacoruna:'Deportivo La Coruna',rcdeportivodelacoruna:'Deportivo La Coruna',realmadrid:'Real Madrid',rayovallecano:'Rayo Vallecano',lazio:'Lazio',acmilan:'AC Milan',atalanta:'Atalanta',cagliari:'Cagliari',werderbremen:'Werder Bremen',unionberlin:'Union Berlin',crystalpalace:'Crystal Palace',ipswichtown:'Ipswich Town',sunderland:'Sunderland AFC',arsenal:'Arsenal',chelsea:'Chelsea',hullcity:'Hull City',leeds:'Leeds United',leedsunited:'Leeds United',newcastle:'Newcastle United',standardliege:'Standard Liege',adodenhaag:'ADO Den Haag',fortunasittard:'Fortuna Sittard',lommelsk:'Lommel SK',royalcharleroisc:'Royal Charleroi SC',spartotterdam:'Sparta Rotterdam'};
  return aliases[normalize(name)]||name;
}
function patternFor(home,away){const h=canonical(home),a=canonical(away);return CLUB_PATTERNS[h]||CLUB_PATTERNS[a]||'Pattern review'}
function sourceFor(home,away){const hits=[canonical(home),canonical(away)].filter(t=>CLUB_PATTERNS[t]);return hits.length?`${hits.join(' / ')} pattern`:'Club pattern review'}
function signalFor(pattern,last){
  if(!last)return 'Cautious';
  const total=last.homeScore+last.awayScore;
  const homeWon=last.homeScore>last.awayScore;
  if(pattern==='Home') return homeWon?'Strong':'Cautious';
  if(pattern==='Over 0.5') return total>=1?'Strong':'Cautious';
  if(pattern==='Over 1.5') return total>=2?'Strong':'Balanced';
  if(pattern==='Over 2.5') return total>=3?'Strong':'Balanced';
  if(pattern.includes('Home Team')) return homeWon||total>=3?'Strong':'Balanced';
  if(pattern.includes('Away')) return !homeWon||total>=3?'Strong':'Balanced';
  return total>=2?'Balanced':'Cautious';
}
async function fetchLeague(league,from,to){try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${from}-${to}&limit=500`,{next:{revalidate:900}});if(!r.ok)return [];const d=await r.json();return d.events||[]}catch{return []}}
function mapEvent(event){const cs=event.competitions?.[0]?.competitors||[];const h=cs.find(x=>x.homeAway==='home'),a=cs.find(x=>x.homeAway==='away');if(!h||!a)return null;const home=canonical(h.team?.displayName||''),away=canonical(a.team?.displayName||'');if(!CLUB_PATTERNS[home]&&!CLUB_PATTERNS[away])return null;const hs=Number(h.score),as=Number(a.score);return{id:String(event.id),date:new Date(event.date).toISOString(),home,away,homeScore:Number.isFinite(hs)?hs:null,awayScore:Number.isFinite(as)?as:null,completed:event.status?.type?.completed===true||Number.isFinite(hs)&&Number.isFinite(as)}}
const fmtDate=d=>d.toISOString().slice(0,10).replaceAll('-','');

export async function GET(){
  const now=new Date();
  const friday=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+((5-now.getUTCDay()+7)%7||7)));
  const sunday=new Date(friday); sunday.setUTCDate(friday.getUTCDate()+2);
  const recentFrom=new Date(now); recentFrom.setUTCDate(now.getUTCDate()-8);
  const [recentRaw,nextRaw]=await Promise.all([
    Promise.all(LEAGUES.map(l=>fetchLeague(l,fmtDate(recentFrom),fmtDate(now)))),
    Promise.all(LEAGUES.map(l=>fetchLeague(l,fmtDate(friday),fmtDate(sunday))))
  ]);
  const recent=recentRaw.flat().map(mapEvent).filter(Boolean).filter(m=>m.homeScore!==null&&m.awayScore!==null).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const upcoming=nextRaw.flat().map(mapEvent).filter(Boolean).filter(m=>m.homeScore===null&&m.awayScore===null).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const lastByClub={};
  for(const m of recent){if(!lastByClub[m.home])lastByClub[m.home]=m;if(!lastByClub[m.away])lastByClub[m.away]=m}
  const matches=upcoming.map(m=>{const pattern=patternFor(m.home,m.away);const last=lastByClub[canonical(m.home)]||lastByClub[canonical(m.away)];return{...m,dateLabel:new Date(m.date).toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',timeZone:'Africa/Lagos'}),time:new Date(m.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Lagos'}),prediction:pattern,source:sourceFor(m.home,m.away),signal:signalFor(pattern,last),lastResult:last?`${last.homeScore}-${last.awayScore}`:null,lastMatch:last?`${last.home} ${last.homeScore}-${last.awayScore} ${last.away}`:null}});
  const recentReview=recent.slice(0,30).map(m=>({...m,dateLabel:new Date(m.date).toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',timeZone:'Africa/Lagos'}),time:new Date(m.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Lagos'}),result:`${m.homeScore}-${m.awayScore}`}));
  return NextResponse.json({generatedAt:now.toISOString(),window:{from:friday.toISOString(),to:sunday.toISOString()},matches,recentReview,trackedClubs:Object.keys(CLUB_PATTERNS),provider:'ESPN public soccer schedule feed'},{headers:{'Cache-Control':'no-store'}});
}
