import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { setAuthToken } from "./services/api";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ScrapeControl from "./pages/ScrapeControl";

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#ed6c02" },
  },
  shape: { borderRadius: 8 },
});

function TokenSync({ children }) {
  const { token } = useAuth();
  useEffect(() => {
    setAuthToken(token);
  }, [token]);
  return children;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <TokenSync>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/scrape" element={<ScrapeControl />} />
              </Route>
            </Routes>
          </TokenSync>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
