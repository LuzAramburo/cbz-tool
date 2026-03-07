import { useState, useEffect } from 'react';

export default function App() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/greet')
            .then(r => r.json())
            .then(data => setMessage(data.message));
    }, []);

    return <h1>{message || 'Loading...'}</h1>;
}