import { useState } from 'react';
import { Router, Switch, Route } from 'wouter';
import NavHeader from './components/NavHeader';
import HomeView from './views/HomeView';
import EditorView from './views/EditorView';
import MergeView from './views/MergeView';

export default function App() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark');
    return isDark;
  });

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <NavHeader dark={dark} toggleDark={toggleDark} />
        <Switch>
          <Route path="/" component={HomeView} />
          <Route path="/editor" component={EditorView} />
          <Route path="/merge" component={MergeView} />
        </Switch>
      </div>
    </Router>
  );
}
