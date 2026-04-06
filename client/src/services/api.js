import axios from 'axios';

// Validate env var has a proper http protocol prefix; ignore it if wrong
const envBase = process.env.REACT_APP_API_BASE || '';
const baseURL = envBase.startsWith('http')
    ? envBase
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
