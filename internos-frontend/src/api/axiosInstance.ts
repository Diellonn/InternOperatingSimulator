import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://dielli-api-frejb9euegeycngb.germanywestcentral-01.azurewebsites.net/api', // Sigurohu që porti përputhet me launchSettings.json të .NET
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shto Token-in automatikisht nëse ekziston
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses - redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('fullName');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
