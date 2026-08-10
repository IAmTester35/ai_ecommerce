import axios from 'axios';

// Thay thế URL bằng địa chỉ FastAPI Backend thực tế (ví dụ: dùng ngrok hoặc IP local)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const aiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
