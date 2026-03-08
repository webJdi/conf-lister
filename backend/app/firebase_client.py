import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from app.config import settings

_initialized = False


def init_firebase():
    global _initialized
    if _initialized:
        return
    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
    _initialized = True


def get_firestore_client():
    init_firebase()
    return firestore.client()


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims."""
    init_firebase()
    return firebase_auth.verify_id_token(id_token)
