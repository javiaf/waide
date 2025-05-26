import React from 'react';
import RSSFeed from './components/RSSFeed';
import { authenticate, getUserByEmail, getUserMe } from './utils/GCUtils';
import { Models } from 'purecloud-platform-client-v2';

const App = () => {
  return (
    <div className="App">
      <RSSFeed />
    </div>
  );
};

export default App;