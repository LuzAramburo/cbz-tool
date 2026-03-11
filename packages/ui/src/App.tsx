import { useState, useEffect } from 'react';

export default function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/greet')
      .then((r) => r.json())
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-500">Hello world</h1>
      <h2>{message || 'Loading...'}</h2>
    </div>
  );
}
