import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 15000,
  withCredentials: true  // Cookie'leri gönder (session authentication için gerekli)
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Error object'i daha iyi formatla
    const apiError = {
      message: error.response?.data?.message || error.response?.data?.detail || error.message || 'Unknown API error',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      response: error.response  // Tüm response'u da ekle
    };
    return Promise.reject(apiError);
  }
);

export default apiClient;

