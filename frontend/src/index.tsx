import React from 'react';
import ReactDOM from 'react-dom/client';
import RSSFeed from './components/RSSFeed';
import MultiStepSetup from './components/MultiStepSetup';

import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MultiStepSetup />
  </React.StrictMode>
);