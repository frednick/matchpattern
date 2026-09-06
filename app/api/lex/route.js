import { NextResponse } from 'next/server';

const LEAGUES = ['eng.1','eng.2','esp.1','esp.2','ita.1','ger.1','fra.1','ned.1','bel.1','sco.1'];
const TRACKED = new Set(['KVC Westerlo','SV Zulte Waregem','Union Saint-Gilloise','Royal Antwerp FC','Club Brugge','FC Twente Enschede','SC Heerenveen','SC Telstar','Ajax','PSV Eindhoven','Rennes','Marseille','Strasbourg','Monaco','Celta Vigo','Malaga CF','Getafe','Deportivo La Coruna','Real Madrid','Rayo Vallecano','Lazio','AC Milan','Atalanta','Cagliari','SC Freiburg','Borussia Monchengladbach','FC Augsburg','Bayer Leverkusen','1. FC Cologne','Werder Bremen','Union Berlin','Schalke 04','Crystal Palace','Ipswich Town','Sunderland AFC','Arsenal','Chelsea','Hull City','Manchester United','Manchester City','Leeds United','Newcastle United']);
function norm(s=''){return s.toLowerCase().replace(/\b(fc|afc|cf|sc|sv)\b/g,'').replace(/[^a-z0-9]/g,'')}
function tracked(name=''){return [...TRACKED].some(k=>norm(k)===norm(name))}
async function fetchLeague(league, from, to){
  try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${from}-${to}&limit=200`,{next:{revalidate:900}});if(!r.ok)return [];const d=await r.json();return d.events||[]}catch{return []}
}
function datesForWeekend(offset){
 const now=new Date(); const day=now.getUTCDay(); const daysToFriday=(5-day+7)%7 || 7; const friday=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+daysToFriday+offset)); const sunday=new Date(friday); sunday.setUTCDate(friday.getUTCDate()+2); const iso=d=>d.toISOString().slice(0,10).replaceAll('-',''); return {friday,sunday,from:iso(friday),to:iso(sunday)};
}
function mapEvent(event, completed){
 const c=event.competitions?.[0], cs=c?.competitors||[]; const h=cs.find(x=>x.homeAway==='home'), a=cs.find(x=>x.homeAway==='away'); if(!h||!a||!tracked(h.team?.displayName)||!tracked(a.team?.displayName)) return null;
 const kickoff=new Date(event.date); const hs=Number(h.score), as=Number(a.score); return {id:String(event.id),date:kickoff.toISOString(),home:h.team.displayName,away:a.team.displayName,homeScore:Number.isFinite(hs)?hs:null,awayScore:Number.isFinite(as)?as:null,status:event.status?.type?.name||'',completed};
}
export async function GET(){
 const previous=datesForWeekend(-7), upcoming=datesForWeekend(0);
 const [prevEvents,nextEvents]=await Promise.all([Promise.all(LEAGUES.map(l=>fetchLeague(l,previous.from,previous.to))),Promise.all(LEAGUES.map(l=>fetchLeague(l,upcoming.from,upcoming.to)))]);
 const prev=prevEvents.flat().map(e=>mapEvent(e,true)).filter(Boolean).filter(m=>m.homeScore!==null&&m.awayScore!==null);
 const next=nextEvents.flat().map(e=>mapEvent(e,false)).filter(Boolean).filter(m=>m.homeScore===null).sort((a,b)=>new Date(a.date)-new Date(b.date));
 return NextResponse.json({generatedAt:new Date().toISOString(),previous:prev.slice(0,40),upcoming:next.slice(0,40),provider:'ESPN public soccer schedule feed'});
}
