import React, { useState, useEffect } from 'react';
import './FeedControls.css';
//import { getListOfQueues } from '../utils/GCUtils';

interface Feed {
  name: string;
  url: string;
}

interface FeedControlsProps {
  feeds: Feed[];
  selectedFeedUrl: string;
  onFeedChange: (url: string) => void;
  onAction: (config: {
    feed: string;
    mode: string;
    category: string;
    location: string;
    importance: string;
    action: string;
    target: string;
  }) => void;
}

const FeedControls: React.FC<FeedControlsProps> = ({
  feeds,
  selectedFeedUrl,
  onFeedChange,
  onAction
}) => {
  const [mode, setMode] = useState<string>('automatic');
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [importance, setImportance] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [queues, setQueues] = useState<string[]>([]);

  const prompts = ['Prompt A', 'Prompt B', 'Prompt C'];
  useEffect(() => {
   /*if (actionType === 'queue') {
      getListOfQueues()
        .then(result => setQueues(result))
        .catch(err => console.error('Error fetching queues:', err));
    }*/
  }, [actionType]);
  const handleSubmit = async () => {
    const payload = {
      feed: selectedFeedUrl,
      mode,
      category,
      location,
      importance,
      action: actionType,
      target: selectedOption
    };

    try {
      const response = await fetch('http://localhost:4000/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('API response:', result);
      onAction(payload);
    } catch (error) {
      console.error('Failed to dispatch action:', error);
    }
  };

  return (
    <div className="rss-controls fancy">
      <div className="control-group">
        <label>News Source:</label>
        <select value={selectedFeedUrl} onChange={e => onFeedChange(e.target.value)}>
          {feeds.map((feed, idx) => (
            <option key={idx} value={feed.url}>{feed.name}</option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label>Mode:</label>
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div className="control-group">
        <label>Category:</label>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">-- Select --</option>
          <option value="Finance">Finance</option>
          <option value="Environment">Environment</option>
          <option value="Travel">Travel</option>
          <option value="Media">Media</option>
          <option value="Humanitarian">Humanitarian</option>
        </select>
      </div>

      <div className="control-group">
        <label>Location:</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
      </div>

      <div className="control-group">
        <label>Importance:</label>
        <select value={importance} onChange={e => setImportance(e.target.value)}>
          <option value="">-- Select --</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      <div className="control-group">
        <label>Action:</label>
        <select
          value={actionType}
          onChange={e => {
            setActionType(e.target.value);
            setSelectedOption('');
          }}
        >
          <option value="">-- Select Action --</option>
          <option value="play">Play Prompt</option>
          <option value="queue">Add Agents to Queue</option>
        </select>
      </div>

      {actionType === 'play' && (
        <div className="control-group">
          <label>Select Prompt:</label>
          <select value={selectedOption} onChange={e => setSelectedOption(e.target.value)}>
            <option value="">-- Select Prompt --</option>
            {prompts.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
          </select>
        </div>
      )}

      {actionType === 'queue' && (
        <div className="control-group">
          <label>Select Queue:</label>
          <select value={selectedOption} onChange={e => setSelectedOption(e.target.value)}>
            <option value="">-- Select Queue --</option>
            {queues.map((q, idx) => <option key={idx} value={q}>{q}</option>)}
          </select>
        </div>
      )}

      <div className="control-actions">
        <button disabled={!actionType || !selectedOption} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default FeedControls;