import sys
import os

# Ensure 'app.*' imports resolve when Vercel runs this from backend/api/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401 — Vercel detects the ASGI 'app' export
