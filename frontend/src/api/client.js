import axios from 'axios';

// Change API_URL to use a relative path handled by Nginx proxy
const API_URL = '/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;