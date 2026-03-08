from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.firebase_client import verify_firebase_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validate Firebase ID token from Authorization header."""
    try:
        decoded_token = verify_firebase_token(credentials.credentials)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
