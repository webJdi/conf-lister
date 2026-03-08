import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to every request
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

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
