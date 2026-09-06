'use client';
import {useMemo,useState} from 'react';
import '../predictions.css';

const weekend=[
['Fri 11 Sep','20:30','Union Berlin','Schalke 04','Over 1.5','Schalke pattern'],
['Fri 11 Sep','20:45','Rennes','Marseille','Over 2.5','Rennes / Marseille pattern'],
['Sat 12 Sep','15:00','Crystal Palace','Ipswich Town','Home','Ipswich / 1X2 pattern'],
['Sat 12 Sep','15:00','Chelsea','Hull City','Home Team or Over 2.5','Chelsea pattern'],
['Sat 12 Sep','15:30','FC Twente Enschede','ADO Den Haag','Over 1.5','Twente pattern'],
['Sat 12 Sep','15:30','SC Freiburg','Borussia Monchengladbach','Over 0.5','Freiburg pattern'],
['Sat 12 Sep','15:30','FC Augsburg','Bayer Leverkusen','Over 1.5','Augsburg pattern'],
['Sat 12 Sep','17:15','KVC Westerlo','Standard Liege','Home Team or Over 2.5','Westerlo pattern'],
['Sat 12 Sep','17:15','Strasbourg','Monaco','Home Team or Over 2.5','Monaco pattern'],
['Sat 12 Sep','18:00','Lazio','AC Milan','Over 0.5','Lazio pattern'],
['Sat 12 Sep','18:30','1. FC Cologne','Werder Bremen','Over 0.5','Werder Bremen / Freiburg pattern'],
['Sat 12 Sep','19:00','Fortuna Sittard','Ajax','Over 2.5','Ajax pattern'],
['Sat 12 Sep','19:45','Union Saint-Gilloise','Lommel SK','Home Team or Over 2.5','Union pattern'],
['Sat 12 Sep','20:00','Sunderland AFC','Arsenal','Over 0.5','Sunderland pattern'],
['Sat 12 Sep','20:45','Atalanta','Cagliari','Away or Over 2.5','Cagliari pattern'],
['Sat 12 Sep','21:00','Real Madrid','Rayo Vallecano','Over 2.5','Real Madrid pattern'],
['Sun 13 Sep','12:30','Club Brugge','Royal Antwerp FC','Over 1.5','Antwerp / Club Brugge pattern'],
['Sun 13 Sep','14:00','Celta Vigo','Malaga CF','Over 1.5','Celta pattern'],
['Sun 13 Sep','16:30','Manchester United','Manchester City','Home','Man Utd pattern'],
['Sun 13 Sep','16:30','Leeds United','Newcastle United','Over 1.5','Leeds pattern'],
['Sun 13 Sep','17:30','SV Zulte Waregem','Royal Charleroi SC','Home Team or Over 2.5','Zulte Waregem pattern'],
['Sun 13 Sep','18:30','Getafe','Deportivo La Coruna','Over 1.5','Deportivo pattern'],
['Sun 13 Sep','19:00','PSV Eindhoven','Sparta Rotterdam','Over 2.5','PSV pattern'],
['Sun 13 Sep','13:30','SC Heerenveen','SC Telstar','Over 2.5','Telstar pattern']
].map((x,i)=>({id:i+1,date:x[0],time:x[1],home:x[2],away:x[3],prediction:x[4],source:x[5]}));

export default function WeekendPredictionsPage(){const [search,setSearch]=useState('');const filtered=useMemo(()=>weekend.filter(m=>`${m.home} ${m.away}`.toLowerCase().includes(search.toLowerCase())),[search]);return <main className="predictor-shell"><header className="predictor-header"><a className="brand" href="/predictions/weekend">Match<span>Pattern</span></a><nav><a className="active" href="/predictions/weekend">Next Weekend</a><a href="/predictions">History</a></nav><div className="header-pill">{weekend.length} MATCHES ⚽</div></header><section className="hero"><div className="hero-copy"><div className="eyebrow">NEXT WEEKEND • 11–13 SEPTEMBER 2026</div><h1>Next fixtures.<br/><span>Pattern-based picks.</span></h1><p>Independent football analysis built from the historical match and pick data supplied for this project. These selections are estimates, not guaranteed outcomes.</p><div className="hero-actions"><a href="#weekend" className="primary-btn">View weekend picks ↓</a><span className="disclaimer">Analysis & entertainment only.</span></div></div><div className="hero-card"><div className="card-top"><span>WEEKEND BOARD</span><strong>{weekend.length} MATCHES</strong></div><div className="ring"><span>{weekend.length}</span><small>featured games</small></div><div className="hero-stat"><b>Data-led</b><span>using previous match patterns</span></div></div></section><section id="weekend" className="matches-section"><div className="section-heading"><div><div className="eyebrow">FEATURE MATCHES</div><h2>Next weekend predictions</h2></div><span className="data-note">Pattern analysis only</span></div><div className="filters"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search club..." aria-label="Search club"/></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Date</th><th>Match</th><th>Prediction</th><th>Pattern used</th></tr></thead><tbody>{filtered.map(m=><tr key={m.id}><td className="muted">{m.id}</td><td className="muted">{m.date}<br/>{m.time}</td><td><div className="teams"><b>{m.home}</b><span>vs</span><b>{m.away}</b></div></td><td><span className="pick">{m.prediction}</span></td><td className="market">{m.source}</td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">No club found.</div>}</div></section><section className="method"><div><div className="eyebrow">HOW IT WORKS</div><h2>Use the pattern. Not a promise.</h2></div><p>MatchPattern carries forward relevant markets from the original historical dataset. It is a transparent pattern-based approach rather than a guarantee. Future versions can incorporate form, home/away records, injuries, lineups and recent results.</p></section><footer><b>MatchPattern</b><span>Independent football match analysis</span><span>•</span><span>No result is guaranteed.</span></footer></main>}
