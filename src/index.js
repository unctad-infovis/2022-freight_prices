import React from 'react';

import { createRoot } from 'react-dom/client';

import App from './jsx/App.jsx';

const container = document.getElementById('app-root-2022-freight_prices');
const root = createRoot(container);
root.render(<App />);