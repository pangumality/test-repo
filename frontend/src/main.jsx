import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
  });

  const [uiColor, setUiColor] = useState(() => {
    if (typeof window === 'undefined') return 'purple';
    const stored = localStorage.getItem('uiColor');
    if (stored === 'purple' || stored === 'blue' || stored === 'white') return stored;
    return 'purple';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.uiColor = uiColor;
    localStorage.setItem('uiColor', uiColor);
  }, [uiColor]);

  return React.cloneElement(children, { theme, setTheme, uiColor, setUiColor });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
