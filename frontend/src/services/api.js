import axios from "axios";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

// Attach a fresh Firebase ID token to every outgoing request.
// Firebase SDK transparently refreshes expired tokens, so this is always valid.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Kept for backward compatibility — no-op now that the interceptor handles auth.
export function setAuthToken() {}

// Conferences
export const getConferences = (category) =>
  api.get("/api/conferences", { params: category ? { category } : {} });

export const getConference = (id) => api.get(`/api/conferences/${id}`);

export const deleteConference = (id) => api.delete(`/api/conferences/${id}`);

export const updateConference = (id, data) =>
  api.put(`/api/conferences/${id}`, data);

// Scraping
export const triggerScrape = (keywords, maxResults = 10) =>
  api.post("/api/scrape", {
    keywords,
    max_results_per_keyword: maxResults,
  });

export const getScrapeStatus = () => api.get("/api/scrape/status");

// Stats
export const getStats = () => api.get("/api/stats");

// Download
export const downloadCSV = async (category) => {
  const response = await api.get("/api/conferences/download", {
    params: category ? { category } : {},
    responseType: "blob",
  });
  return response.data;
};

export default api;
