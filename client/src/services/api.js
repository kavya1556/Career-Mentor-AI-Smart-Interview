import axios from 'axios';

// Validate env var has a proper http protocol prefix; ignore it if wrong
let envBase = process.env.REACT_APP_API_BASE || '';

// Automatically append /api if the user forgot it in their environment variable
if (envBase && !envBase.endsWith('/api')) {
    envBase = envBase.replace(/\/$/, '') + '/api';
}

const baseURL = envBase.startsWith('http')
    ? envBase
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : 'https://backend-server-smartai.onrender.com/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default api;
