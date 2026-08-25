import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from google.cloud import storage

from app.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WEBP, or GIF images are allowed.",
        )

    contents = await file.read()
    extension = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    blob_name = f"{uuid.uuid4().hex}.{extension}"

    client = storage.Client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)
    blob = bucket.blob(blob_name)
    blob.upload_from_string(contents, content_type=file.content_type)

    public_url = f"https://storage.googleapis.com/{settings.GCS_BUCKET_NAME}/{blob_name}"
    return {"url": public_url}