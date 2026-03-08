import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Link,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EventIcon from "@mui/icons-material/Event";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { getConferences, deleteConference, getStats } from "../services/api";

const categoryColors = {
  conference: "primary",
  award: "secondary",
};

export default function Dashboard() {
  const [conferences, setConferences] = useState([]);
  const [stats, setStats] = useState({ total: 0, conferences: 0, awards: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0); // 0=all, 1=conferences, 2=awards

  const categoryFilter = tab === 1 ? "conference" : tab === 2 ? "award" : null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [confRes, statsRes] = await Promise.all([
        getConferences(categoryFilter),
        getStats(),
      ]);
      setConferences(confRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError("Failed to load data. Make sure the backend is running.");
    }
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteConference(id);
      fetchData();
    } catch {
      setError("Failed to delete");
    }
  }

  const statCards = [
    { label: "Total Entries", value: stats.total, icon: <ListAltIcon />, color: "#1976d2" },
    { label: "Conferences", value: stats.conferences, icon: <EventIcon />, color: "#2e7d32" },
    { label: "Awards", value: stats.awards, icon: <EmojiEventsIcon />, color: "#ed6c02" },
    { label: "Upcoming", value: stats.upcoming, icon: <TrendingUpIcon />, color: "#9c27b0" },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card
              sx={{
                borderRadius: 2,
                borderLeft: `4px solid ${s.color}`,
                height: "100%",
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ color: s.color, display: "flex" }}>{s.icon}</Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {loading ? "-" : s.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All" />
        <Tab label="Conferences" />
        <Tab label="Awards" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Conference Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : conferences.length === 0 ? (
        <Alert severity="info">
          No entries found. Use the Scrape Control panel to fetch conference data.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Conference / Award</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Venue</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Topics</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conferences.map((conf) => (
                <TableRow key={conf.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {conf.name}
                    </Typography>
                    {conf.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          maxWidth: 400,
                        }}
                      >
                        {conf.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {conf.date || "TBD"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {conf.venue || "TBD"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={conf.category}
                      size="small"
                      color={categoryColors[conf.category] || "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {conf.topics?.map((t) => (
                        <Chip key={t} label={t} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {conf.url && (
                        <Tooltip title="Open link">
                          <IconButton
                            size="small"
                            component={Link}
                            href={conf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(conf.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
