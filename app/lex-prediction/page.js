'use client';

import { useEffect, useMemo, useState } from 'react';
import '../predictions/predictions.css';
import './lex.css';
import { gradeMarket, loadScorecard, saveScorecard, stats } from './scorecard';

const starter = { previousHome: '', previousAway: '', previousResult: '', nextHome: '', nextAway: '' };

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
    reason: `The previous result was ${previousResult || 'not available'}, giving ${goals ?? 'an unknown'} total goals. Lex carries forward a conservative goal pattern; the latest result is evidence, not certainty.`,
    teamNote: nextHome ? `${nextHome} is the next home side.` : 'Waiting for the next fixture.'
  };
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function LexPredictionPage() {
  const [data, setData] = useState(starter);
  const [feed, setFeed] = useState({ previous: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [rows, setRows] = useState([]);
  const [score, setScore] = useState({});
  const prediction = useMemo(() => buildPrediction(data.previousResult, data.nextHome), [data.previousResult, data.nextHome]);
  const metrics = useMemo(() => stats(rows), [rows]);

  useEffect(() => setRows(loadScorecard()), []);
  useEffect(() => saveScorecard(rows), [rows]);

  useEffect(() => {
    let active = true;
    async function loadFeed() {
      try {
        setLoading(true);
        const response = await fetch('/api/lex', { cache: 'no-store' });
        if (!response.ok) throw new Error('Feed unavailable');
        const result = await response.json();
        if (!active) return;
        setFeed(result);
        const previous = result.previous?.[0];
        const upcoming = result.upcoming?.find((match) => previous && (match.home === previous.home || match.away === previous.home || match.home === previous.away || match.away === previous.away)) || result.upcoming?.[0];
        if (previous || upcoming) {
          setData({
            previousHome: previous?.home || '', previousAway: previous?.away || '',
            previousResult: previous ? `${previous.homeScore}-${previous.awayScore}` : '',
            nextHome: upcoming?.home || '', nextAway: upcoming?.away || ''
          });
        }
        setFeedError('');
      } catch {
        if (active) setFeedError('Live fixture feed is temporarily unavailable.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFeed();
    return () => { active = false; };
  }, []);

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
          <h1>Live fixture.<br/><span>Pattern analysis.</span></h1>
          <p>Lex automatically pulls the latest completed result and the next available fixture, then turns the latest evidence into a measured prediction signal.</p>
          <div className="hero-actions"><a href="#analysis" className="primary-btn">View Lex's analysis ↓</a><span className="disclaimer">Analysis only. No guaranteed outcome.</span></div>
        </div>
        <div className="hero-card lex-card"><div className="card-top"><span>LEX SIGNAL</span><strong>{loading ? 'LOADING' : prediction.confidence.toUpperCase()}</strong></div><div className="lex-pick"><small>PRIMARY PICK</small><b>{loading ? '—' : prediction.primary}</b><span>{data.nextHome || 'Next fixture'} {data.nextAway ? `vs ${data.nextAway}` : ''}</span></div></div>
      </section>

      <section id="analysis" className="lex-workspace">
        <div className="section-heading"><div><div className="eyebrow">AUTOMATIC DATA FEED</div><h2>Lex is using the latest match</h2></div><span className="data-note">{loading ? 'Updating…' : feedError || 'Live schedule feed'}</span></div>
        <div className="lex-grid">
          <div className="lex-panel feed-panel">
            <div className="feed-label"><span className="status-dot" /> LATEST COMPLETED MATCH</div>
            {loading ? <div className="feed-loading">Loading the latest confirmed result…</div> : feed.previous?.[0] ? <><div className="fixture-teams"><b>{data.previousHome}</b><span>{data.previousResult}</span><b>{data.previousAway}</b></div><div className="feed-meta">{formatDate(feed.previous[0].date)} · Final result</div></> : <div className="feed-loading">No completed fixture found in the current feed.</div>}
          </div>
          <div className="lex-panel feed-panel">
            <div className="feed-label"><span className="status-dot upcoming-dot" /> NEXT MATCH</div>
            {loading ? <div className="feed-loading">Finding the next fixture…</div> : data.nextHome ? <><div className="fixture-teams"><b>{data.nextHome}</b><span>VS</span><b>{data.nextAway}</b></div><div className="feed-meta">{formatDate(feed.upcoming?.find((m) => m.home === data.nextHome && m.away === data.nextAway)?.date)} · Upcoming fixture</div></> : <div className="feed-loading">No upcoming fixture found.</div>}
          </div>
        </div>
      </section>

      <section className="lex-result">
        <div className="section-heading"><div><div className="eyebrow">LEX'S READ</div><h2>{data.nextHome || 'Next match'} {data.nextAway ? `vs ${data.nextAway}` : ''}</h2></div><span className="data-note">Previous: {data.previousResult || '—'}</span></div>
        <div className="prediction-grid">
          <article><small>PRIMARY</small><strong>{prediction.primary}</strong><p>{prediction.reason}</p></article>
          <article><small>SECONDARY</small><strong>{prediction.secondary}</strong><p>{prediction.teamNote} Supporting signal only; it is not a promise the market will land.</p></article>
        </div>
        <div className="lex-action"><button className="primary-btn" onClick={addPrediction} disabled={!data.nextHome || !data.nextAway}>Save Lex's prediction</button><span>Save this exact signal before kickoff to measure it later.</span></div>
      </section>

      <section className="lex-scorecard">
        <div className="section-heading"><div><div className="eyebrow">TRACK RECORD</div><h2>Lex Scorecard</h2></div><span className="data-note">Saved on this device</span></div>
        <div className="score-stats"><div><small>PREDICTIONS</small><strong>{metrics.total}</strong></div><div><small>GRADED</small><strong>{metrics.graded}</strong></div><div><small>WINS</small><strong>{metrics.wins}</strong></div><div><small>LOSSES</small><strong>{metrics.losses}</strong></div><div><small>ACCURACY</small><strong>{metrics.accuracy === null ? '—' : `${metrics.accuracy}%`}</strong></div><div><small>LAST 10</small><strong>{metrics.last10 === null ? '—' : `${metrics.last10}%`}</strong></div></div>
        <div className="score-list">
          {rows.length === 0 && <div className="empty-score">No saved predictions yet. Save the live signal above and the ledger starts here.</div>}
          {rows.map((row) => <article key={row.id} className="score-row"><div><b>{row.fixture}</b><span>{row.market} · previous {row.previousResult || '—'}</span></div>{typeof row.won !== 'boolean' ? <div className="grade-controls"><input type="number" min="0" placeholder="H" value={score[row.id]?.home ?? ''} onChange={(e) => setScore((s) => ({ ...s, [row.id]: { ...s[row.id], home: e.target.value } }))}/><span>–</span><input type="number" min="0" placeholder="A" value={score[row.id]?.away ?? ''} onChange={(e) => setScore((s) => ({ ...s, [row.id]: { ...s[row.id], away: e.target.value } }))}/><button onClick={() => grade(row.id)}>Grade</button></div> : <strong className={row.won ? 'win' : 'loss'}>{row.won ? 'WIN' : 'LOSS'} · {row.resultHome}-{row.resultAway}</strong>}</article>)}
        </div>
        {rows.length > 0 && <button className="secondary-btn" onClick={clearScorecard}>Clear device scorecard</button>}
      </section>

      <section className="method"><div><div className="eyebrow">LEX METHOD</div><h2>Predict. Record. Learn.</h2></div><p>Every saved prediction becomes a measurable record. MatchPattern automatically supplies the fixture data, while the scorecard records outcomes for future analysis. No manual match entry is required.</p></section>
      <footer><b>MatchPattern</b><span>Lex's Prediction</span><span>•</span><span>For analysis and entertainment. No result is guaranteed.</span></footer>
    </main>
  );
}
