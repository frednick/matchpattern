import { NextResponse } from 'next/server';
import { HISTORICAL_27 } from '../../data/historical27';
import { RECENT_29 } from '../../data/recent29';

const LEAGUES = ['eng.1','eng.2','esp.1','esp.2','ita.1','ger.1','fra.1','ned.1','bel.1','sco.1'];

function normalize(name=''){return name.toLowerCase().replace(/\b(fc|afc|cf|sc|sv|kv)\b/g,'').replace(/[^a-z0-9]/g,'')}
function canonical(name=''){
  const aliases={manunited:'Man Utd',manutd:'Man Utd',mancity:'Man City',freiburg:'Freiburg',augsburg:'Augsburg',cologne:'1. FC Cologne',schalke:'Schalke',monchengladbach:'Borussia Monchengladbach',twente:'FC Twente Enschede',heerenveen:'SC Heerenveen',telstar:'SC Telstar',psv:'PSV Eindhoven',ajaxamsterdam:'Ajax',brugge:'Club Brugge',antwerp:'Royal Antwerp FC',unionstgilloise:'Union Gilloise',uniongilloise:'Union Gilloise',westerlo:'KVC Westerlo',waregem:'SV Zulte Waregem',rennes:'Rennes',stadrennais:'Rennes',marseille:'Marseille',strasbourg:'Strasbourg',monaco:'Monaco',celta:'Celta',malaga:'Malaga CF',getafe:'Getafe',deportivolacoruna:'RC Deportivo De La Coruna',rcdeportivodelacoruna:'RC Deportivo De La Coruna',realmadrid:'Real Madrid',rayovallecano:'Rayo Vallecano',lazio:'Lazio',acmilan:'AC Milan',atalanta:'Atalanta',cagliari:'Cagliari',werderbremen:'Werder Bremen',unionberlin:'Union Berlin',crystalpalace:'Crystal Palace',ipswichtown:'Ipswich Town',sunderland:'Sunderland AFC',arsenal:'Arsenal',chelsea:'Chelsea',hullcity:'Hull City',leeds:'Leeds United',leedsunited:'Leeds United',newcastle:'Newcastle',newcastleunited:'Newcastle',standardliege:'Standard Liege',adodenhaag:'ADO Den Haag',fortunasittard:'Fortuna Sittard',lommelsk:'Lommel SK',royalcharleroisc:'Royal Charleroi SC',spartotterdam:'Sparta Rotterdam',sttruindensevv:'St. Truidense VV',stmirrenfc:'St Mirren FC',motherwellfc:'Motherwell FC',kvmechelen:'Yellow-Red KV Mechelen',cerclebrugge:'Cercle Brugge',athleticbilbao:'Athletic Bilbao',atleticoadrid:'Atletico Madrid',brighton:'Brighton',brentford:'Brentford',bournemouth:'Bournemouth',coventrycity:'Coventry City',nacionaldamadeira:'Nacional da Madeira',fiorentina:'Fiorentina',torino:'Torino',udinese:'Udinese',napoli:'Napoli',inter:'Inter',everton:'Everton',rangers:'Rangers',angers:'Angers',alkmaar:'Alkmaar',excelsiorrotterdam:'Excelsior Rotterdam',groningen:'FC Groningen',necnijmegen:'NEC Nijmegen',paderborn:'Paderborn',eintrachtfrankfurt:'Eintracht Frankfurt',borussiadortmund:'Borussia Dortmund',villarreal:'Villarreal',parisfc:'Paris FC',nice:'Nice',fulham:'Fulham',valencia:'Valencia',lemansfc:'Le Mans FC',rscanderlecht:'RSC Anderlecht',leverkusen:'Bayer Leverkusen',bayerleverkusen:'Bayer Leverkusen',mainz:'Mainz',wolfsburg:'Wolfsburg'};
  return aliases[normalize(name)]||name;
}
function parseScore(score=''){const m=String(score).match(/^(\d+)\s*-\s*(\d+)$/);return m?{homeScore:Number(m[1]),awayScore:Number(m[2])}:null;}
function toEvidence(row,source,index){const parsed=parseScore(row.score);if(!parsed)return null;const market=row.market||row.pick||'Pattern review';return{source,index,date:row.date||'',home:canonical(row.home),away:canonical(row.away),homeScore:parsed.homeScore,awayScore:parsed.awayScore,market,pick:row.pick||market,odds:row.odds,result:row.result||row.status};}
const FOUNDATION=HISTORICAL_27.map((r,i)=>toEvidence(r,'Original 27',i)).filter(Boolean);
const LATEST=RECENT_29.map((r,i)=>toEvidence(r,'Latest 29',i)).filter(Boolean);
const ALL_EVIDENCE=[...FOUNDATION,...LATEST];
function marketWon(e){const total=e.homeScore+e.awayScore;const p=e.pick||'';const m=e.market||'';if(/Home Team or Over 2\.5/i.test(m))return e.homeScore>e.awayScore||total>=3;if(/Away or Over 2\.5/i.test(m))return e.awayScore>e.homeScore||total>=3;if(/Over 2\.5/i.test(p)||/Over 2\.5/i.test(m))return total>=3;if(/Over 1\.5/i.test(p)||/Over 1\.5/i.test(m))return total>=2;if(/Over 0\.5/i.test(p)||/Over 0\.5/i.test(m))return total>=1;if(/^Home$/i.test(p)||/^Home$/i.test(m))return e.homeScore>e.awayScore;if(/^Away$/i.test(p)||/^Away$/i.test(m))return e.awayScore>e.homeScore;return String(e.result||'').toLowerCase()!=='no';}
function buildProfiles(){const profiles={};for(const e of ALL_EVIDENCE){for(const club of [e.home,e.away]){if(!profiles[club])profiles[club]={club,entries:[],wins:0};profiles[club].entries.push(e);if(marketWon(e))profiles[club].wins++;}}for(const p of Object.values(profiles)){p.entries.sort((a,b)=>String(b.date).localeCompare(String(a.date)));const recent=p.entries.slice(0,5);p.sample=p.entries.length;p.recentSample=recent.length;p.hitRate=p.sample?Math.round((p.wins/p.sample)*1000)/10:0;p.latest=recent[0]||null;p.recentWins=recent.filter(marketWon).length;p.recentRate=recent.length?Math.round((p.recentWins/recent.length)*1000)/10:0;p.pattern=p.latest?.market||p.latest?.pick||'Pattern review';}return profiles;}
const PROFILES=buildProfiles();
function profileFor(name){return PROFILES[canonical(name)]||null;}
function profileScore(p){return p?(p.recentRate*0.65+p.hitRate*0.35)+Math.min(p.sample,10):0;}
function bestProfile(home,away){return[profileFor(home),profileFor(away)].filter(Boolean).sort((a,b)=>profileScore(b)-profileScore(a))[0]||null;}
function predictionFor(home,away){const p=bestProfile(home,away);return p?.pattern||'Pattern review';}
function signalFor(home,away){const hp=profileFor(home),ap=profileFor(away),p=bestProfile(home,away);if(!p)return'Cautious';const rate=p.recentRate;if(rate>=80&&p.sample>=2)return'Strong';if(rate>=60||(hp&&ap&&Math.abs(hp.recentRate-ap.recentRate)<15))return'Balanced';return'Cautious';}
function sourceFor(home,away){const ps=[profileFor(home),profileFor(away)].filter(Boolean);if(!ps.length)return'No dataset evidence';return ps.map(p=>`${p.club} ${p.recentRate}% recent / ${p.hitRate}% overall`).join(' • ');}
function lastResultFor(name){const e=profileFor(name)?.latest;return e?`${e.homeScore}-${e.awayScore}`:null;}
async function fetchLeague(league,from,to){try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${from}-${to}&limit=500`,{next:{revalidate:900}});if(!r.ok)return[];const d=await r.json();return d.events||[];}catch{return[];}}
function mapEvent(event){const cs=event.competitions?.[0]?.competitors||[],h=cs.find(x=>x.homeAway==='home'),a=cs.find(x=>x.homeAway==='away');if(!h||!a)return null;const home=canonical(h.team?.displayName||''),away=canonical(a.team?.displayName||''),hs=Number(h.score),as=Number(a.score);return{id:String(event.id),date:new Date(event.date).toISOString(),home,away,homeScore:Number.isFinite(hs)?hs:null,awayScore:Number.isFinite(as)?as:null,completed:event.status?.type?.completed===true||Number.isFinite(hs)&&Number.isFinite(as)};}
function fallbackFixtures(){
  const rows=[
    ['2026-09-11T19:45:00+01:00','Rennes','Marseille'],
    ['2026-09-12T15:00:00+01:00','Chelsea','Hull City'],
    ['2026-09-12T17:30:00+01:00','Tottenham Hotspur','Everton'],
    ['2026-09-12T20:00:00+01:00','Sunderland AFC','Arsenal'],
    ['2026-09-12T14:30:00+01:00','Augsburg','Bayer Leverkusen'],
    ['2026-09-12T14:30:00+01:00','Borussia Dortmund','Paderborn'],
    ['2026-09-12T14:30:00+01:00','Freiburg','Borussia Monchengladbach'],
    ['2026-09-12T14:30:00+01:00','Mainz','Eintracht Frankfurt'],
    ['2026-09-12T16:30:00+01:00','1. FC Cologne','Werder Bremen'],
    ['2026-09-12T16:00:00+01:00','Atalanta','Cagliari'],
    ['2026-09-12T15:15:00+01:00','Strasbourg','Monaco'],
    ['2026-09-12T19:00:00+01:00','Paris FC','Lyon'],
    ['2026-09-12T19:00:00+01:00','Sunderland AFC','Arsenal'],
    ['2026-09-13T14:00:00+01:00','Coventry City','Brighton'],
    ['2026-09-13T16:30:00+01:00','Man Utd','Man City'],
    ['2026-09-13T15:00:00+01:00','Celta','Malaga CF'],
    ['2026-09-13T17:15:00+01:00','Getafe','RC Deportivo De La Coruna'],
    ['2026-09-13T19:45:00+01:00','Lazio','AC Milan'],
    ['2026-09-13T17:00:00+01:00','Napoli','Bologna'],
    ['2026-09-13T17:00:00+01:00','Torino','Roma'],
    ['2026-09-13T17:15:00+01:00','Le Mans FC','Lens'],
  ];
  return rows.map(([date,home,away],i)=>({id:`fallback-${i+1}`,date:new Date(date).toISOString(),home:canonical(home),away:canonical(away),homeScore:null,awayScore:null,completed:false,source:'schedule fallback'}));
}
const fmtDate=d=>d.toISOString().slice(0,10).replaceAll('-','');
const labelTime=date=>({dateLabel:new Date(date).toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',timeZone:'Africa/Lagos'}),time:new Date(date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Lagos'})});
export async function GET(){const now=new Date();const friday=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+((5-now.getUTCDay()+7)%7||7)));const sunday=new Date(friday);sunday.setUTCDate(friday.getUTCDate()+2);const futureTo=new Date(friday);futureTo.setUTCDate(friday.getUTCDate()+9);const recentFrom=new Date(now);recentFrom.setUTCDate(now.getUTCDate()-8);const[recentRaw,futureRaw]=await Promise.all([Promise.all(LEAGUES.map(l=>fetchLeague(l,fmtDate(recentFrom),fmtDate(now)))),Promise.all(LEAGUES.map(l=>fetchLeague(l,fmtDate(friday),fmtDate(futureTo))))]);const recent=recentRaw.flat().map(mapEvent).filter(Boolean).filter(m=>m.homeScore!==null&&m.awayScore!==null).sort((a,b)=>new Date(b.date)-new Date(a.date));const apiFuture=futureRaw.flat().map(mapEvent).filter(Boolean).filter(m=>m.homeScore===null&&m.awayScore===null);const future=[...apiFuture,...fallbackFixtures()].filter((m,i,arr)=>arr.findIndex(x=>x.home===m.home&&x.away===m.away&&x.date.slice(0,10)===m.date.slice(0,10))===i).sort((a,b)=>new Date(a.date)-new Date(b.date));const upcoming=future.filter(m=>new Date(m.date)<=new Date(sunday.getTime()+86399999));const decorate=m=>{const p=bestProfile(m.home,m.away),lt=labelTime(m.date);return{...m,...lt,prediction:predictionFor(m.home,m.away),source:sourceFor(m.home,m.away),signal:signalFor(m.home,m.away),lastResult:lastResultFor(m.home)||lastResultFor(m.away),lastMatch:p?.latest?`${p.latest.home} ${p.latest.homeScore}-${p.latest.awayScore} ${p.latest.away}`:null,tracked:Boolean(p),evidence:{sample:p?.sample||0,hitRate:p?.hitRate||0,recentSample:p?.recentSample||0,recentRate:p?.recentRate||0,latestPattern:p?.pattern||null}};};const matches=upcoming.filter(m=>profileFor(m.home)||profileFor(m.away)).map(decorate);const futureMatches=future.map(decorate);const recentReview=recent.slice(0,30).map(m=>({...m,...labelTime(m.date),result:`${m.homeScore}-${m.awayScore}`}));const datasetStats={original27:FOUNDATION.length,latest29:RECENT_29.length,combinedEvidence:ALL_EVIDENCE.length,latestCompleted:RECENT_29.filter(r=>r.status!=='Not Started').length,latestWon:RECENT_29.filter(r=>r.status==='Won').length,latestLost:RECENT_29.filter(r=>r.status==='Lost').length};return NextResponse.json({generatedAt:now.toISOString(),window:{from:friday.toISOString(),to:sunday.toISOString()},matches,recentReview,futureMatches,trackedClubs:Object.keys(PROFILES),datasetStats,provider:'MatchPattern datasets + live schedule feed with verified fallback'},{headers:{'Cache-Control':'no-store'}});}
