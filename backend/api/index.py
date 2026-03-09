import sys
import os
import traceback

# Ensure 'app.*' imports resolve when Vercel runs this file from backend/api/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from mangum import Mangum        # noqa: E402
    from app.main import app         # noqa: E402
    handler = Mangum(app, lifespan="off")
except Exception:
    # Surface the real error as a readable response instead of a silent Lambda crash
    _tb = traceback.format_exc()

    async def _error_app(scope, receive, send):
        body = f"Startup error:\n{_tb}".encode()
        await send({"type": "http.response.start", "status": 500,
                    "headers": [[b"content-type", b"text/plain"]]})
        await send({"type": "http.response.body", "body": body})

    from mangum import Mangum        # noqa: E402
    handler = Mangum(_error_app, lifespan="off")
