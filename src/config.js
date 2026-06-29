const normalizedApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const API_URL = normalizedApiUrl || 'http://localhost:5000/api';