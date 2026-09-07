import base64

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal

from ai_service import analyze_copy, detect_copy_context, enhance_feedback, extract_uploaded_content, rewrite_weak_phrases
from generate_image import generate_image


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FeedbackRequest(BaseModel):
    feedback: str
    task: Literal["improve", "write", "review", "translate"] = "improve"
    channel: str = "Other"
    audience: str = "Unknown"


class ContextRequest(BaseModel):
    feedback: str


class AnalysisRequest(BaseModel):
    generated: str
    original: str = ""


class WeakRewriteRequest(BaseModel):
    generated: str
    findings: list[dict] = []


class ImageRequest(BaseModel):
    prompt: str
    image: str | None = None
    size: str = "1024 x 1024"
    samples: int = 1
    quality: Literal["low", "medium", "high"] = "medium"


@app.get("/")
def home():
    return {
        "message": "AI Advertising Feedback API is running"
    }


@app.post("/enhance")
def enhance(request: FeedbackRequest):
    enhanced = enhance_feedback(request.feedback, request.task, request.channel, request.audience)

    return {
        "original": request.feedback,
        "enhanced": enhanced,
        "channel": request.channel,
        "audience": request.audience,
    }


@app.post("/detect-context")
def detect_context(request: ContextRequest):
    try:
        return detect_copy_context(request.feedback)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Could not detect the channel and audience.") from error


@app.post("/analyze")
def analyze(request: AnalysisRequest):
    try:
        return analyze_copy(request.generated, request.original)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Guideline analysis failed.") from error


@app.post("/rewrite-weak")
def rewrite_weak(request: WeakRewriteRequest):
    try:
        rewritten = rewrite_weak_phrases(request.generated, request.findings)
        return {"rewritten": rewritten}
    except Exception as error:
        raise HTTPException(status_code=502, detail="Weak phrase rewrite failed.") from error


@app.post("/extract-upload")
async def extract_upload(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please choose a file to upload.")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Files must be smaller than 10 MB.")

    try:
        text = extract_uploaded_content(file.filename, file.content_type or "", file_bytes)
        if not text:
            raise HTTPException(status_code=422, detail="No readable text was found in this file.")
        return {"filename": file.filename, "text": text}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=422, detail="The file could not be read. Try a clearer image or a supported document.") from error


@app.post("/api/generate")
def generate_visuals(request: ImageRequest):
    try:
        source_image = base64.b64decode(request.image) if request.image else None
        images = generate_image(
            request.prompt,
            request.size,
            request.samples,
            request.quality,
            source_image,
        )
        return {"images": images}
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Image generation failed. Check the Azure image deployment configuration.",
        ) from error
