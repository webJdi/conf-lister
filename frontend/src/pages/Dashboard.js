import React, { useEffect, useState, useCallback } from "react";
import { alpha } from "@mui/material/styles";
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EventIcon from "@mui/icons-material/Event";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { getConferences, deleteConference, updateConference, getStats } from "../services/api";

// ── Edit-name dialog ───────────────────────────────────────────────────────
function EditNameDialog({ conf, onClose, onSaved }) {
  const [name, setName] = useState(conf?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { setError("Name cannot be empty"); return; }
    setSaving(true);
    setError("");
    try {
      await updateConference(conf.id, { name: trimmed });
      onSaved();
    } catch {
      setError("Failed to save — try again");
    }
    setSaving(false);
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Rename Entry</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const categoryColors = { conference: "primary", award: "secondary" };

// ── Mobile card for a single conference entry ──────────────────────────────
function ConferenceCard({ conf, onDelete, onEdit }) {
  return (
    <Card sx={{ borderRadius: 2, mb: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.75 }}>
              {conf.name}
            </Typography>
            <Chip
              label={conf.category}
              size="small"
              color={categoryColors[conf.category] || "default"}
              sx={{ mb: 1 }}
            />
            {conf.date && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <CalendarTodayIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">{conf.date}</Typography>
              </Box>
            )}
            {conf.venue && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" noWrap>{conf.venue}</Typography>
              </Box>
            )}
            {conf.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  mt: 0.75,
                }}
              >
                {conf.description}
              </Typography>
            )}
            {conf.topics?.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                {conf.topics.map((t) => (
                  <Chip key={t} label={t} size="small" variant="outlined" />
                ))}
              </Box>
            )}
          </Box>
          <Stack direction="column" spacing={0.5} sx={{ flexShrink: 0 }}>
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
            <Tooltip title="Rename">
              <IconButton size="small" onClick={() => onEdit(conf)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => onDelete(conf.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [conferences, setConferences] = useState([]);
  const [stats, setStats] = useState({ total: 0, conferences: 0, awards: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [editTarget, setEditTarget] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
    } catch {
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

  function handleEditSaved() {
    setEditTarget(null);
    fetchData();
  }

  const statCards = [
    { label: "Total", value: stats.total, icon: <ListAltIcon />, color: theme.palette.primary.main },
    { label: "Conferences", value: stats.conferences, icon: <EventIcon />, color: theme.palette.success.light },
    { label: "Awards", value: stats.awards, icon: <EmojiEventsIcon />, color: theme.palette.warning.main },
    { label: "Upcoming", value: stats.upcoming, icon: <TrendingUpIcon />, color: theme.palette.secondary.main },
  ];

  return (
    <Box>
      {editTarget && (
        <EditNameDialog
          conf={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}

      <Typography
        component="h1"
        fontWeight={700}
        sx={{ mb: 3, fontSize: { xs: "1.5rem", md: "2rem" } }}
      >
        Dashboard
      </Typography>

      {/* ── Stat cards: 2-per-row on mobile, 4 on desktop ── */}
      <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3 }}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={{ borderRadius: 2, bgcolor: alpha(s.color, 0.18), height: "100%" }}>
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, md: 2 },
                  p: { xs: 1.5, md: 2 },
                  "&:last-child": { pb: { xs: 1.5, md: 2 } },
                }}
              >
                <Box sx={{ color: s.color, display: "flex" }}>{s.icon}</Box>
                <Box>
                  <Typography
                    fontWeight={700}
                    sx={{ fontSize: { xs: "1.4rem", md: "1.8rem" }, lineHeight: 1 }}
                  >
                    {loading ? "-" : s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Filter tabs ── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label="All" />
        <Tab label="Conferences" />
        <Tab label="Awards" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : conferences.length === 0 ? (
        <Alert severity="info">
          No entries found. Use the Scrape Control panel to fetch conference data.
        </Alert>
      ) : isMobile ? (
        // ── Mobile: card list ──────────────────────────────────────────
        <Box>
          {conferences.map((conf) => (
            <ConferenceCard key={conf.id} conf={conf} onDelete={handleDelete} onEdit={setEditTarget} />
          ))}
        </Box>
      ) : (
        // ── Desktop: table ─────────────────────────────────────────────
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 700 }}>Conference / Award</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Venue</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Topics</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conferences.map((conf) => (
                <TableRow key={conf.id} hover>
                  <TableCell sx={{ maxWidth: 340 }}>
                    <Typography variant="body2" fontWeight={600}>{conf.name}</Typography>
                    {conf.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {conf.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>{conf.date || "TBD"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{conf.venue || "TBD"}</Typography>
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
                      <Tooltip title="Rename">
                        <IconButton size="small" onClick={() => setEditTarget(conf)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
