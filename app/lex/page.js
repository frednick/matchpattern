'use client';
import { useEffect, useMemo, useState } from 'react';
import '../predictions/predictions.css';
import './lex.css';

function analyze(prev, next, history){
  if(!prev || !next) return null;
  const totalGoals=prev.homeScore+prev.awayScore;
  const prevSignal=totalGoals>=2?'Goals 2+':'Low-goal result';
  const nextName=`${next.home} vs ${next.away}`;
  const related=history.filter(m=>m.home===prev.home||m.away===prev.home||m.home===prev.away||m.away===prev.away);
  const relatedAvg=related.length?related.reduce((s,m)=>s+m.homeScore+m.awayScore,0)/related.length:null;
  let primary=totalGoals>=2?'Over 1.5 goals':'Over 0.5 goals';
  if(next.home===prev.home && prev.homeScore>prev.awayScore) primary='Home team or Over 1.5';
  if(next.away===prev.away && prev.awayScore>prev.homeScore) primary='Away team or Over 1.5';
  const confidence=Math.min(86,Math.max(55,60+(totalGoals>=2?10:0)+(relatedAvg&&relatedAvg>=2?8:0)+(related.length>=2?5:0)));
  return {nextName,prevSignal,primary,confidence,relatedCount:related.length,relatedAvg};
}

export default function LexPage(){
 const [data,setData]=useState({previous:[],upcoming:[]}); const [loading,setLoading]=useState(true); const [prevId,setPrevId]=useState(''); const [nextId,setNextId]=useState(''); const [manualHome,setManualHome]=useState(''); const [manualAway,setManualAway]=useState(''); const [saved,setSaved]=useState([]);
 useEffect(()=>{fetch('/api/lex',{cache:'no-store'}).then(r=>r.json()).then(d=>setData(d)).catch(()=>{}).finally(()=>setLoading(false)); try{setSaved(JSON.parse(localStorage.getItem('lex-ledger')||'[]'))}catch{}} ,[]);
 const previous=data.previous; const upcoming=data.upcoming;
 const prev=previous.find(x=>x.id===prevId); const next=upcoming.find(x=>x.id===nextId);
 const analysis=useMemo(()=>analyze(prev,next,previous),[prev,next,previous]);
 const manual={homeScore:Number(manualHome),awayScore:Number(manualAway)};
 function savePrediction(){ if(!analysis)return; const item={id:Date.now(),match:analysis.nextName,prediction:analysis.primary,confidence:analysis.confidence,createdAt:new Date().toISOString()}; const updated=[item,...saved].slice(0,30);setSaved(updated);localStorage.setItem('lex-ledger',JSON.stringify(updated)); }
 function grade(item,home,away){const p=item.prediction.toLowerCase(); const goals=home+away; if(p.includes('over 1.5'))return goals>=2; if(p.includes('over 0.5'))return goals>=1; if(p.startsWith('home'))return home>away; if(p.startsWith('away'))return away>home; return null}
 return <main className="predictor-shell lex-shell"><header className="predictor-header"><a className="brand" href="/predictions/weekend">Match<span>Pattern</span></a><nav><a href="/predictions/weekend">Weekend</a><a className="active" href="/lex">Lex's Prediction</a><a href="/predictions">History</a></nav><div className="header-pill">LEX ENGINE</div></header>
 <section className="lex-hero"><div><div className="eyebrow">LEX'S PREDICTION LAB</div><h1>Result → Pattern →<br/><span>Next-match signal.</span></h1><p>This is the analysis page named after Lex. It turns a confirmed previous result into a transparent next-match signal, then keeps a prediction ledger so we can measure what worked and what did not.</p><div className="lex-badge">NO GUARANTEED WIN • EVIDENCE FIRST</div></div><div className="lex-orbit"><div className="orbit-core">LEX<small>ANALYSIS</small></div><div className="orbit-item one">RESULT</div><div className="orbit-item two">PATTERN</div><div className="orbit-item three">PICK</div></div></section>
 <section className="lex-grid"><div className="lex-card"><div className="eyebrow">01 • PREVIOUS WEEKEND</div><h2>Use the confirmed result</h2><p className="muted">Choose a completed tracked match. Its actual score becomes the starting evidence.</p><select value={prevId} onChange={e=>setPrevId(e.target.value)}><option value="">Select previous result…</option>{previous.map(m=><option key={m.id} value={m.id}>{m.home} {m.homeScore}–{m.awayScore} {m.away}</option>)}</select><div className="manual-row"><input type="number" min="0" placeholder="Home" value={manualHome} onChange={e=>setManualHome(e.target.value)}/><span>–</span><input type="number" min="0" placeholder="Away" value={manualAway} onChange={e=>setManualAway(e.target.value)}/></div><small>Manual score is optional for testing a scenario.</small></div>
 <div className="lex-card"><div className="eyebrow">02 • NEXT MATCH</div><h2>Choose the next fixture</h2><p className="muted">The list comes from the automatic weekend schedule feed.</p><select value={nextId} onChange={e=>setNextId(e.target.value)}><option value="">Select next match…</option>{upcoming.map(m=><option key={m.id} value={m.id}>{new Date(m.date).toLocaleString('en-GB',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} • {m.home} vs {m.away}</option>)}</select><div className="feed-status">{loading?'Updating fixtures…':`${upcoming.length} upcoming tracked fixtures found`}</div></div></section>
 <section className="lex-result"><div className="eyebrow">03 • LEX'S READ</div><h2>{analysis?analysis.nextName:'Select both matches to generate the read'}</h2>{analysis?<div className="result-layout"><div className="big-pick"><span>PRIMARY SIGNAL</span><strong>{analysis.primary}</strong><em>{analysis.confidence}% model confidence</em></div><div className="reason"><b>Why this signal?</b><p>The previous result produced <strong>{analysis.prevSignal}</strong>. {analysis.relatedCount?`The selected clubs also have ${analysis.relatedCount} related completed match${analysis.relatedCount===1?'':'es'} in the available history.`:'There is limited related history, so the signal is intentionally conservative.'} This is a pattern indicator, not a guarantee.</p><button className="primary-btn" onClick={savePrediction}>Save to Lex ledger</button></div></div>:<div className="empty">Choose a previous result and a next fixture.</div>}</section>
 <section className="ledger"><div className="section-heading"><div><div className="eyebrow">04 • TRACK RECORD</div><h2>Lex ledger</h2></div><span className="data-note">Saved on this device</span></div>{saved.length?<div className="ledger-list">{saved.map(item=><div className="ledger-row" key={item.id}><div><b>{item.match}</b><span>{new Date(item.createdAt).toLocaleString('en-GB')}</span></div><strong>{item.prediction}</strong><em>{item.confidence}%</em></div>)}</div>:<div className="empty">No saved predictions yet. Generate one above and save it.</div>}</section>
 <section className="method"><div><div className="eyebrow">THE PROMISE</div><h2>Build wealth through discipline, not certainty.</h2></div><p>Football outcomes are uncertain. Lex is designed to help users analyze evidence, record predictions, review results and improve decision-making over time. It cannot promise profit, and no prediction should be treated as a guaranteed win.</p></section><footer><b>MatchPattern • Lex's Prediction</b><span>Independent football analysis</span><span>•</span><span>No guaranteed outcomes.</span></footer></main>
}
