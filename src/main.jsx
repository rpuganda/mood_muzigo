    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App.jsx'; // Make sure this path is correct

    // If you have a global CSS file, e.g., for Tailwind directives, uncomment this:
    // import './index.css';

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    