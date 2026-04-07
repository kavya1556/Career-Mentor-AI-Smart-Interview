import axios from 'axios';

const baseURL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
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
