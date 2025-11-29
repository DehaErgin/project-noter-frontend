import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 15000
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data || {
      message: error.message || 'Unknown API error'
    };
    return Promise.reject({
      status: error.response?.status,
      ...apiError
    });
  }
);

export default apiClient;

