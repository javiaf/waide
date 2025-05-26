import React, { useEffect, useState, useRef } from 'react';
import './RSSFeed.css';
import FeedControls from './FeedControls';

interface Article {
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
}

interface Classification {
  topic: string;
  location: string;
  importance: string;
}

interface ActionConfig {
  feed: string;
  mode: string;
  category: string;
  location: string;
  importance: string;
  action: string;
  target: string;
}

const RSSFeed: React.FC = () => {
  const [feeds, setFeeds] = useState<{ name: string; url: string }[]>([]);
  const [selectedFeedUrl, setSelectedFeedUrl] = useState<string>('');
  const [items, setItems] = useState<Article[]>([]);
  const [classifications, setClassifications] = useState<Record<string, Classification>>({});
  const BACKEND_URL = 'http://localhost:4000';
  const seenLinksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/feeds`);
        const data = await res.json();
        setFeeds(data);
        if (data.length > 0) setSelectedFeedUrl(data[0].url);
      } catch (err) {
        console.error('Error loading feeds:', err);
      }
    };
    loadFeeds();
  }, []);

  useEffect(() => {
    if (!selectedFeedUrl) return;

    const fetchFeed = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rss?url=${encodeURIComponent(selectedFeedUrl)}`);
        const data = await res.json();
        setItems(data);

        const newArticles = data.filter((item: Article) => !seenLinksRef.current.has(item.link));
        newArticles.forEach((item : Article) => seenLinksRef.current.add(item.link));

        if (newArticles.length > 0) {
          const res = await fetch(`${BACKEND_URL}/api/classify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              articles: newArticles.map((item : Article) => ({
                title: item.title,
                content: item.contentSnippet || item.content || ''
              }))
            })
          });
          const json = await res.json();
          newArticles.forEach((item: Article, index: number) => {
            setClassifications(prev => ({
              ...prev,
              [item.link]: json.classification[index]
            }));
          });
        }

      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchFeed();
  }, [selectedFeedUrl]);

  const handleAction = (config: ActionConfig) => {
    console.log('User action config:', config);
  };

  return (
    <div className="rss-container">
      
    <div className="rss-header">
      <img src="/logo.png" alt="App Logo" className="rss-logo" />
      <h1 className="rss-title">📰 WorldFact AI Decision Engine</h1>
  </div>
      <FeedControls
        feeds={feeds}
        selectedFeedUrl={selectedFeedUrl}
        onFeedChange={setSelectedFeedUrl}
        onAction={handleAction}
      />

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
          {items.map((item, idx) => {
            const classification = classifications[item.link] || {} as Classification;
            return (
              <tr key={idx}>
                <td><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></td>
                <td>{classification.topic || '-'}</td>
                <td>{classification.location || '-'}</td>
                <td className={`importance ${classification.importance?.toLowerCase() || ''}`}>{classification.importance || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RSSFeed;