import sys
import os

# Ensure 'app.*' imports resolve when Vercel runs this file from backend/api/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mangum import Mangum  # noqa: E402
from app.main import app   # noqa: E402

# Vercel (Lambda-compatible) entry point
handler = Mangum(app, lifespan="off")
