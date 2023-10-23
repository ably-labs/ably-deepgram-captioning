import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Ably from 'ably/promises';
import { AblyProvider } from 'ably/react';

const client = new Ably.Realtime({ authUrl: '/api/token' });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AblyProvider client={client}>
      <App />
    </AblyProvider>
  </React.StrictMode>,
)
