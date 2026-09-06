'use client';

import { useMemo, useState } from 'react';
import '../predictions/predictions.css';
import './lex.css';

const starter = {
  previousHome: 'Manchester United',
  previousAway: 'Everton',
  previousResult: '2-2',
  nextHome: 'Manchester United',
  nextAway: 'Manchester City',
};

function totalGoals(score) {
  const m = String(score).match(/(\d+)\s*[-:]\s*(\d+)/);
  return m ? Number(m[1]) + Number(m[2]) : null;
}

function buildPrediction(previousResult, nextHome, nextAway) {
  const goals = totalGoals(previousResult);
  const first = Number(String(previousResult).split(/[-:]/)[0]);
  const second = Number(String(previousResult).split(/[-:]/)[1]);
  const over15 = goals !== null && goals >= 2;
  const both = goals !== null && first > 0 && second > 0;

  if (nextHome.toLowerCase().includes('manchester united')) {
    return {
      primary: over15 ? 'Over 1.5' : 'Over 0.5',
      secondary: both ? 'Both Teams to Score' : 'Over 0.5',
      confidence: over15 ? 'Pattern signal' : 'Cautious signal',
      reason: `The provided previous result was ${previousResult}, producing ${goals ?? 'an unknown number of'} total goals. Lex carries forward the lowest-risk goal pattern rather than treating one result as a guarantee.`,
    };
  }

  return {
    primary: over15 ? 'Over 1.5' : 'Over 0.5',
    secondary: both ? 'Both Teams to Score' : 'Goal in Match',
    confidence: over15 ? 'Pattern signal' : 'Cautious signal',
    reason: `The previous result ${previousResult} is used as a supplied data point. The next-match pick is deliberately based on a simple repeatable goal pattern, not certainty.`,
  };
}

export default function LexPredictionPage() {
  const [data, setData] = useState(starter);
  const prediction = useMemo(() => buildPrediction(data.previousResult, data.nextHome, data.nextAway), [data]);
  const update = (key) => (e) => setData((current) => ({ ...current, [key]: e.target.value }));

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
          <p>Give Lex the confirmed result from the previous weekend and the next fixture. The page turns that supplied result into a transparent pattern signal for the next match.</p>
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
          </div>
        </div>
      </section>

      <section className="lex-result">
        <div className="section-heading"><div><div className="eyebrow">LEX'S READ</div><h2>{data.nextHome} vs {data.nextAway}</h2></div><span className="data-note">Based on supplied result: {data.previousResult || '—'}</span></div>
        <div className="prediction-grid">
          <article><small>PRIMARY</small><strong>{prediction.primary}</strong><p>{prediction.reason}</p></article>
          <article><small>SECONDARY</small><strong>{prediction.secondary}</strong><p>Use this as supporting information, not as a promise that the market will land.</p></article>
        </div>
      </section>

      <section className="method"><div><div className="eyebrow">LEX METHOD</div><h2>Result first. Pattern second.</h2></div><p>Lex uses the supplied previous result as evidence, checks the goal pattern, and produces a conservative next-match signal. When real fixture data is available, MatchPattern can combine this with the tracked-club history. A single previous result is never enough to establish certainty.</p></section>
      <footer><b>MatchPattern</b><span>Lex's Prediction</span><span>•</span><span>For analysis and entertainment. No result is guaranteed.</span></footer>
    </main>
  );
}
