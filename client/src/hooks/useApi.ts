import axios from "axios";
import { useStore } from "../store/useStore";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

export const useApi = () => api;
