import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  Slider,
  IconButton,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import { triggerScrape, downloadCSV } from "../services/api";
import { saveAs } from "file-saver";

const DEFAULT_KEYWORDS = [
  "oil gas digital transformation conference 2026",
  "oil gas AI ML conference 2026",
  "petroleum technology conference",
  "oil gas innovation awards 2026",
  "energy digital transformation summit",
  "oil gas artificial intelligence conference",
  "offshore technology conference",
  "oil gas data analytics summit",
];

export default function ScrapeControl() {
  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS);
  const [newKeyword, setNewKeyword] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [scraping, setScraping] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function addKeyword() {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeyword("");
    }
  }

  function removeKeyword(kw) {
    setKeywords(keywords.filter((k) => k !== kw));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  }

  async function handleScrape() {
    if (keywords.length === 0) {
      setError("Add at least one keyword");
      return;
    }

    setScraping(true);
    setError("");
    setResult(null);

    try {
      const res = await triggerScrape(keywords, maxResults);
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Scrape failed. Check backend connection."
      );
    }

    setScraping(false);
  }

  async function handleDownload() {
    try {
      const blob = await downloadCSV();
      saveAs(blob, "conferences.csv");
    } catch {
      setError("Download failed");
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Scrape Control
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download CSV
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Search Keywords
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add or remove search keywords used to find Oil & Gas conferences and awards.
          </Typography>

          {/* Keywords chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {keywords.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                onDelete={() => removeKeyword(kw)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          {/* Add keyword */}
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <TextField
              size="small"
              placeholder="Add a search keyword..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
            />
            <IconButton color="primary" onClick={addKeyword}>
              <AddIcon />
            </IconButton>
          </Stack>

          {/* Max results slider */}
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
            Max results per keyword: {maxResults}
          </Typography>
          <Slider
            value={maxResults}
            onChange={(_, v) => setMaxResults(v)}
            min={1}
            max={50}
            valueLabelDisplay="auto"
            sx={{ maxWidth: 400, mb: 3 }}
          />

          {/* Scrape button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            onClick={handleScrape}
            disabled={scraping}
            sx={{ py: 1.5, px: 4, fontWeight: 600 }}
          >
            {scraping ? "Scraping..." : "Start Scrape"}
          </Button>

          {scraping && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert
          severity={result.status === "completed" ? "success" : "warning"}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" fontWeight={600}>
            {result.message}
          </Typography>
          <Typography variant="caption">
            Keywords processed: {result.keywords_processed} | Total found: {result.total_found}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
