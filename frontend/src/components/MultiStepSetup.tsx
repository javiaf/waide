// ===== FRONTEND: src/components/MultiStepSetup.tsx =====

import React, { useState, useEffect } from 'react';
import './RSSFeed.css';
import { authenticate, getListOfQueues } from '../utils/GCUtils';

interface Article {
  title: string;
  link: string;
  topic?: string;
  location?: string;
  importance?: string;
}

const MultiStepSetup: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [selectedFeed, setSelectedFeed] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [importance, setImportance] = useState<string>('');
  const [mode, setMode] = useState<string>('automatic');
  const [actionType, setActionType] = useState<string>('');
  const [actionTarget, setActionTarget] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<{ name: string; url: string }[]>([]);
  const [queues, setQueues] = useState<{ name: string; id: string }[]>([]);
  const [newsItems, setNewsItems] = useState<Article[]>([]);

  const BACKEND_URL = 'http://localhost:4000';


  useEffect(() => {
    fetch(`${BACKEND_URL}/api/queues`)
      .then(res => res.json())
      .then(setQueues)
      .catch(err => console.error('Failed to fetch feeds:', err));
  }, []);
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/feeds`)
      .then(res => res.json())
      .then(setFeeds)
      .catch(err => console.error('Failed to fetch feeds:', err));
  }, []);

  useEffect(() => {
    if (!selectedFeed) return;
    fetch(`${BACKEND_URL}/api/rss?url=${encodeURIComponent(selectedFeed)}`)
      .then(res => res.json())
      .then(async (items: Article[]) => {
        const response = await fetch(`${BACKEND_URL}/api/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articles: items.map(item => ({
              title: item.title,
              content: item.title // simplify input content for now
            }))
          })
        });
        const classified = await response.json();
        const combined = items.map((item, index) => ({
          ...item,
          ...classified.classification[index]
        }));
        setNewsItems(combined);
      })
      .catch(err => console.error('Failed to fetch or classify RSS:', err));
  }, [selectedFeed]);

  const handleSubmit = async () => {
    setEvents(prev => [...prev, {
      feed: selectedFeed,
      category,
      location,
      importance,
      mode,
      action: actionType,
      target: actionTarget
    }]);

      if (category === 'International Relationships' && importance === 'CRITICAL' && actionType === 'queue') {
    try {
      const res =await fetch(`${BACKEND_URL}/api/extragroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'International Relationships',
          severity: 'CRITICAL',
          queueId: actionTarget
        })
      });
      console.log('✔️ Sent /api/extragroup');
      if (res.ok) {
        alert(`🚨 New members have been added to the queue due to a CRITICAL Finance alert based on news: ${newsItems[0]?.title || 'Unknown headline'}`);
      }
    } catch (err) {
      console.error('❌ Failed to send to /api/extragroup', err);
    }
  }

    setStep(3);
  };

  return (
    <div className="rss-container">
    <div className="rss-header">
      <img src="/logo.png" alt="App Logo" className="rss-logo" />
  </div>
<div className="step-indicator">
  <div className={step === 1 ? 'active' : ''}>Config</div>
  <div className={step === 2 ? 'active' : ''}>Action</div>
  <div className={step === 3 ? 'active' : ''}>Summary</div>
</div>

      <div className="rss-controls fancy horizontal">
        {step === 1 && (
          <>
            <div className="control-row">
              <div className="control-group">
                <label>News Source:</label>
                <select value={selectedFeed} onChange={e => setSelectedFeed(e.target.value)}>
                  <option value="">-- Select Feed --</option>
                  {feeds.map((feed, idx) => <option key={idx} value={feed.url}>{feed.name}</option>)}
                </select>
              </div>

              <div className="control-group">
                <label>Category:</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Finance">Finance</option>
                  <option value="Environment">Environment</option>
                  <option value="International Relationships">International Relationships</option>
                  <option value="Disaster">Disaster</option>
                  <option value="Travel">Travel</option>
                  <option value="Media">Media</option>
                  <option value="Humanitarian">Humanitarian</option>
                </select>
              </div>

              <div className="control-group">
                <label>Location:</label>
                <input value={location} onChange={e => setLocation(e.target.value)} />
              </div>

              <div className="control-group">
                <label>Importance:</label>
                <select value={importance} onChange={e => setImportance(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="control-actions">
              <button onClick={() => setStep(2)}>Next →</button>
            </div>

            <h3>Preview News</h3>
            <table className="rss-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Location</th>
                  <th>Importance</th>
                </tr>
              </thead>
              <tbody>
                {newsItems.map((item, idx) => (
                  <tr key={idx}>
                    <td><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></td>
                    <td>{item.topic || '-'}</td>
                    <td>{item.location || '-'}</td>
                    <td className={`importance ${item.importance?.toLowerCase() || ''}`}>{item.importance || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {step === 2 && (
          <>
            <div className="control-row">
              <div className="control-group">
                <label>Mode:</label>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="control-group">
                <label>Action:</label>
                <select value={actionType} onChange={e => setActionType(e.target.value)}>
                  <option value="">-- Select Action --</option>
                  <option value="play">Play Prompt</option>
                  <option value="queue">Add Agents to Queue</option>
                </select>
              </div>

{actionType === 'queue' && (
  <div className="control-group">
    <label>Select Queue:</label>
<select value={actionTarget} onChange={e => setActionTarget(e.target.value)}>
  <option value="">-- Select Queue --</option>
  {queues.map((q) => (
    <option key={q.id} value={q.id}>{q.name}</option>
  ))}
</select>
  </div>
)}


            </div>

            <div className="control-actions">
              <button onClick={() => setStep(1)}>← Back</button>
              <button onClick={handleSubmit} disabled={!actionType || !actionTarget}>Submit</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>📋 Configured Events</h2>
            <table className="rss-table">
              <thead>
                <tr>
                  <th>Feed</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Importance</th>
                  <th>Mode</th>
                  <th>Action</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt, idx) => (
                  <tr key={idx}>
                    <td>{evt.feed}</td>
                    <td>{evt.category}</td>
                    <td>{evt.location}</td>
                    <td>{evt.importance}</td>
                    <td>{evt.mode}</td>
                    <td>{evt.action}</td>
                    <td>{evt.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="control-actions">
      <button onClick={() => setStep(1)}>➕ Add New</button>
    </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MultiStepSetup;
