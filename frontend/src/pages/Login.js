import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Tab,
  Tabs,
  Container,
} from "@mui/material";
import OilBarrelIcon from "@mui/icons-material/OilBarrel";

export default function Login() {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === 0) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.code === "auth/email-already-in-use"
          ? "Email already in use"
          : err.code === "auth/weak-password"
          ? "Password should be at least 6 characters"
          : err.message || "Authentication failed"
      );
    }
    setLoading(false);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)",
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <OilBarrelIcon sx={{ fontSize: 48, color: "#1976d2", mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                Conf-Lister
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Oil & Gas Conference Tracker
              </Typography>
            </Box>

            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setError(""); }}
              centered
              sx={{ mb: 3 }}
            >
              <Tab label="Sign In" />
              <Tab label="Sign Up" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                autoComplete={tab === 0 ? "current-password" : "new-password"}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                {loading ? "Please wait..." : tab === 0 ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
