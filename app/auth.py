import firebase_admin
from fastapi import HTTPException, Request
from firebase_admin import auth as firebase_auth

firebase_admin.initialize_app()


def get_current_user_id(request: Request) -> str:
    """
    FastAPI dependency — verifies the Firebase ID token sent as
    `Authorization: Bearer <token>` and returns the signed-in user's uid.
    Raises 401 if the header is missing or the token is invalid/expired.
    """
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ")
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return decoded["uid"]


def get_optional_user_id(request: Request) -> str | None:
    """
    FastAPI dependency — like get_current_user_id but returns None for
    unauthenticated requests instead of raising 401.
    Used for public read endpoints that work for both guests and signed-in users.
    """
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None

    token = authorization.removeprefix("Bearer ")
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        return None
