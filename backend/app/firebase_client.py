"""Firebase initialisation and token verification using the Admin SDK."""

import os
import json
import base64
import logging
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from app.config import settings

logger = logging.getLogger(__name__)
_initialized = False


def _build_credentials():
    """Return a firebase_admin Credentials object.

    Priority:
      1. FIREBASE_SERVICE_ACCOUNT_JSON env var (raw JSON or base64) — used on Vercel.
      2. File at FIREBASE_SERVICE_ACCOUNT_PATH — used locally.
    """
    sa_json = settings.FIREBASE_SERVICE_ACCOUNT_JSON
    if sa_json:
        try:
            payload = sa_json.strip()
            if not payload.startswith("{"):
                payload = base64.b64decode(payload).decode("utf-8")
            sa_dict = json.loads(payload)
            logger.info("Loading Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var")
            return credentials.Certificate(sa_dict)
        except Exception as exc:
            raise RuntimeError(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {exc}")

    sa_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
    if not os.path.exists(sa_path):
        raise RuntimeError(
            f"Firebase service account key not found at '{sa_path}'.\n"
            "  Either place serviceAccountKey.json in the backend folder, "
            "or set the FIREBASE_SERVICE_ACCOUNT_JSON environment variable."
        )
    logger.info("Loading Firebase credentials from file: %s", sa_path)
    return credentials.Certificate(sa_path)


def init_firebase():
    global _initialized
    if _initialized:
        return

    project_id = settings.FIREBASE_PROJECT_ID
    if not project_id:
        raise RuntimeError("FIREBASE_PROJECT_ID is not set in backend/.env")

    cred = _build_credentials()
    firebase_admin.initialize_app(cred, {"projectId": project_id})
    _initialized = True
    logger.info("Firebase Admin SDK initialised for project: %s", project_id)


def get_firestore_client():
    init_firebase()
    return firestore.client()


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims."""
    init_firebase()
    try:
        return firebase_auth.verify_id_token(id_token)
    except Exception as exc:
        logger.error("Token verification failed: %s", exc)
        raise
