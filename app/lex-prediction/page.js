'use client';

import { useEffect, useMemo, useState } from 'react';
import '../predictions/predictions.css';
import './lex.css';
import { gradeMarket, loadScorecard, saveScorecard, stats } from './scorecard';

const starter = { previousHome: 'Manchester United', previousAway: 'Everton', previousResult: '2-2', nextHome: 'Manchester United', nextAway: 'Manchester City' };

function totalGoals(score) {
  const m = String(score).match(/(\d+)\s*[-:]\s*(\d+)/);
  return m ? Number(m[1]) + Number(m[2]) : null;
}

function buildPrediction(previousResult, nextHome) {
  const goals = totalGoals(previousResult);
  const parts = String(previousResult).split(/[-:]/).map(Number);
  const both = parts.length === 2 && parts.every(Number.isFinite) && parts[0] > 0 && parts[1] > 0;
  const over15 = goals !== null && goals >= 2;
  return {
    primary: over15 ? 'Over 1.5' : 'Over 0.5',
    secondary: both ? 'Both Teams to Score' : 'Over 0.5',
    confidence: over15 ? 'Pattern signal' : 'Cautious signal',
    reason: `The previous result was ${previousResult || 'not supplied'}, giving ${goals ?? 'an unknown'} total goals. Lex carries forward a conservative goal pattern; one match is evidence, not certainty.`,
    teamNote: nextHome ? `${nextHome} is the next home side in the supplied fixture.` : 'Enter the next home team to complete the fixture.'
  };
}

export default function LexPredictionPage() {
  const [data, setData] = useState(starter);
  const [rows, setRows] = useState([]);
  const [score, setScore] = useState({});
  const prediction = useMemo(() => buildPrediction(data.previousResult, data.nextHome), [data.previousResult, data.nextHome]);
  const metrics = useMemo(() => stats(rows), [rows]);

  useEffect(() => setRows(loadScorecard()), []);
  useEffect(() => saveScorecard(rows), [rows]);
  const update = (key) => (e) => setData((current) => ({ ...current, [key]: e.target.value }));

  function addPrediction() {
    if (!data.nextHome || !data.nextAway || !prediction.primary) return;
    setRows((current) => [{ id: `${Date.now()}`, createdAt: new Date().toISOString(), fixture: `${data.nextHome} vs ${data.nextAway}`, market: prediction.primary, secondary: prediction.secondary, previousResult: data.previousResult, won: undefined }, ...current]);
  }

  function grade(id) {
    const home = score[id]?.home, away = score[id]?.away;
    const row = rows.find((r) => r.id === id);
    if (!row || home === undefined || away === undefined || home === '' || away === '') return;
    const won = gradeMarket(row.market, home, away);
    setRows((current) => current.map((r) => r.id === id ? { ...r, resultHome: Number(home), resultAway: Number(away), gradedAt: new Date().toISOString(), won } : r));
  }

  function clearScorecard() {
    if (window.confirm('Clear the Lex scorecard saved on this device?')) setRows([]);
  }

  return (
    <main className="predictor-shell lex-page">
      <header className="predictor-header">
        <a className="brand" href="/predictions/weekend">Match<span>Pattern</span></a>
        <nav><a href="/predictions/weekend">Next Weekend</a><a className="active" href="/lex-prediction">Lex's Prediction</a><a href="/predictions">History</a></nav>
        <div className="header-pill">LEX MODE ⚽</div>
      </header>

      <section className="hero lex-hero">
        <div className="hero-copy">
          <div className="eyebrow">LEX'S PREDICTION ENGINE</div>
          <h1>Previous result.<br/><span>Next-match pattern.</span></h1>
          <p>Enter confirmed results, generate a signal, then record the final score. Lex's track record improves through measurement—not promises.</p>
          <div className="hero-actions"><a href="#input" className="primary-btn">Enter result ↓</a><span className="disclaimer">Analysis only. No guaranteed outcome.</span></div>
        </div>
        <div className="hero-card lex-card"><div className="card-top"><span>LEX SIGNAL</span><strong>{prediction.confidence.toUpperCase()}</strong></div><div className="lex-pick"><small>PRIMARY PICK</small><b>{prediction.primary}</b><span>{data.nextHome} vs {data.nextAway}</span></div></div>
      </section>

      <section id="input" className="lex-workspace">
        <div className="section-heading"><div><div className="eyebrow">PROVIDED RESULT</div><h2>Feed Lex the previous match</h2></div><span className="data-note">Manual confirmation</span></div>
        <div className="lex-grid">
          <div className="lex-panel">
            <label>Previous home team<input value={data.previousHome} onChange={update('previousHome')} /></label>
            <label>Previous away team<input value={data.previousAway} onChange={update('previousAway')} /></label>
            <label>Confirmed result<input value={data.previousResult} onChange={update('previousResult')} placeholder="e.g. 2-2" /></label>
          </div>
          <div className="lex-panel">
            <div className="eyebrow">NEXT MATCH</div>
            <label>Home team<input value={data.nextHome} onChange={update('nextHome')} /></label>
            <label>Away team<input value={data.nextAway} onChange={update('nextAway')} /></label>
            <button className="primary-btn" onClick={addPrediction}>Save prediction to scorecard</button>
          </div>
        </div>
      </section>

      <section className="lex-result">
        <div className="section-heading"><div><div className="eyebrow">LEX'S READ</div><h2>{data.nextHome} vs {data.nextAway}</h2></div><span className="data-note">Previous: {data.previousResult || '—'}</span></div>
        <div className="prediction-grid">
          <article><small>PRIMARY</small><strong>{prediction.primary}</strong><p>{prediction.reason}</p></article>
          <article><small>SECONDARY</small><strong>{prediction.secondary}</strong><p>{prediction.teamNote} Supporting signal only; it is not a promise the market will land.</p></article>
        </div>
      </section>

      <section className="lex-scorecard">
        <div className="section-heading"><div><div className="eyebrow">TRACK RECORD</div><h2>Lex Scorecard</h2></div><span className="data-note">Saved on this device</span></div>
        <div className="score-stats">
          <div><small>PREDICTIONS</small><strong>{metrics.total}</strong></div><div><small>GRADED</small><strong>{metrics.graded}</strong></div><div><small>WINS</small><strong>{metrics.wins}</strong></div><div><small>LOSSES</small><strong>{metrics.losses}</strong></div><div><small>ACCURACY</small><strong>{metrics.accuracy === null ? '—' : `${metrics.accuracy}%`}</strong></div><div><small>LAST 10</small><strong>{metrics.last10 === null ? '—' : `${metrics.last10}%`}</strong></div>
        </div>
        <div className="score-list">
          {rows.length === 0 && <div className="empty-score">No saved predictions yet. Generate one above and the ledger starts here.</div>}
          {rows.map((row) => <article key={row.id} className="score-row"><div><b>{row.fixture}</b><span>{row.market} · previous {row.previousResult || '—'}</span></div>{typeof row.won !== 'boolean' ? <div className="grade-controls"><input type="number" min="0" placeholder="H" value={score[row.id]?.home ?? ''} onChange={(e) => setScore((s) => ({ ...s, [row.id]: { ...s[row.id], home: e.target.value } }))}/><span>–</span><input type="number" min="0" placeholder="A" value={score[row.id]?.away ?? ''} onChange={(e) => setScore((s) => ({ ...s, [row.id]: { ...s[row.id], away: e.target.value } }))}/><button onClick={() => grade(row.id)}>Grade</button></div> : <strong className={row.won ? 'win' : 'loss'}>{row.won ? 'WIN' : 'LOSS'} · {row.resultHome}-{row.resultAway}</strong>}</article>)}
        </div>
        {rows.length > 0 && <button className="secondary-btn" onClick={clearScorecard}>Clear device scorecard</button>}
      </section>

      <section className="method"><div><div className="eyebrow">LEX METHOD</div><h2>Predict. Record. Learn.</h2></div><p>Every saved prediction becomes a measurable record. After the final score is entered, MatchPattern grades the primary market, updates the win rate and last-10 record, and keeps the result visible. Later, we can add stronger historical samples, market breakdowns and automated fixture data.</p></section>
      <footer><b>MatchPattern</b><span>Lex's Prediction</span><span>•</span><span>For analysis and entertainment. No result is guaranteed.</span></footer>
    </main>
  );
}
