from fastapi import APIRouter, File, HTTPException, UploadFile
from google.cloud import language_v1, vision

router = APIRouter(prefix="/scan", tags=["scan"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/ingredients")
async def scan_ingredients(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, or WEBP images are allowed.",
        )

    contents = await file.read()

    vision_client = vision.ImageAnnotatorClient()
    image = vision.Image(content=contents)
    response = vision_client.text_detection(image=image)
    if response.error.message:
        raise HTTPException(status_code=502, detail=f"Vision AI error: {response.error.message}")

    raw_text = response.text_annotations[0].description if response.text_annotations else ""
    candidate_lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    language_client = language_v1.LanguageServiceClient()
    ingredient_lines = []
    for line in candidate_lines:
        document = language_v1.Document(content=line, type_=language_v1.Document.Type.PLAIN_TEXT)
        try:
            syntax = language_client.analyze_syntax(document=document)
        except Exception:
            ingredient_lines.append(line)
            continue
        has_noun = any(
            token.part_of_speech.tag == language_v1.PartOfSpeech.Tag.NOUN
            for token in syntax.tokens
        )
        if has_noun:
            ingredient_lines.append(line)

    return {"lines": ingredient_lines}