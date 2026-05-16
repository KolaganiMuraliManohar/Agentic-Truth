"""
FastAPI Application
===================
Exposes REST endpoints for the Misinformation Detection System.

Endpoints:
  POST /api/analyze/text    — Analyze a text snippet
  POST /api/analyze/image   — Analyze an uploaded image
  POST /api/analyze/video   — Analyze an uploaded video
  POST /api/analyze/url     — Fetch & analyze a URL
  GET  /api/health          — Health check
  GET  /api/docs            — Auto-generated Swagger UI
"""

from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel

from src import config
from src.schemas import DetectionResult, TextInput, URLInput
from src.models.text.text_analyzer import TextAnalyzer
from src.models.media.media_analyzer import MediaAnalyzer
from src.models.graph.graph_analyzer import GraphAnalyzer
from src.models.ensemble.ensemble_detector import EnsembleDetector


# ── Lazy-loaded singletons (loaded once on first request) ─────────────────────
_text_analyzer: Optional[TextAnalyzer] = None
_media_analyzer: Optional[MediaAnalyzer] = None
_graph_analyzer: Optional[GraphAnalyzer] = None
_ensemble: Optional[EnsembleDetector] = None


def get_text_analyzer() -> TextAnalyzer:
    global _text_analyzer
    if _text_analyzer is None:
        _text_analyzer = TextAnalyzer()
    return _text_analyzer


def get_media_analyzer() -> MediaAnalyzer:
    global _media_analyzer
    if _media_analyzer is None:
        _media_analyzer = MediaAnalyzer()
    return _media_analyzer


def get_graph_analyzer() -> GraphAnalyzer:
    global _graph_analyzer
    if _graph_analyzer is None:
        _graph_analyzer = GraphAnalyzer()
    return _graph_analyzer


def get_ensemble() -> EnsembleDetector:
    global _ensemble
    if _ensemble is None:
        _ensemble = EnsembleDetector()
    return _ensemble


# ── App factory ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Misinformation Detector API starting …")
    # Pre-warm models in background (optional)
    yield
    logger.info("🛑 API shutting down …")


app = FastAPI(
    title="Misinformation Detection API",
    description=(
        "Real-time multi-modal misinformation detection using NLP, "
        "Computer Vision, and Graph Neural Networks."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "app": config.APP_NAME,
        "env": config.APP_ENV,
        "timestamp": time.time(),
    }


# ── Text Analysis ─────────────────────────────────────────────────────────────

@app.post("/api/analyze/text", response_model=DetectionResult, tags=["Analysis"])
async def analyze_text(body: TextInput):
    """
    Analyze a text snippet for misinformation.

    - Extracts factual claims
    - Fact-checks via NLI
    - Scores source credibility
    - Returns verdict with evidence
    """
    start = time.time()
    logger.info(f"[text] Received {len(body.text)} chars")

    text_result = get_text_analyzer().analyze(body.text, body.source_url)
    result = get_ensemble().predict(text_result=text_result)

    logger.info(f"[text] Done in {time.time() - start:.2f}s | verdict={result.verdict}")
    return result


# ── Image Analysis ────────────────────────────────────────────────────────────

@app.post("/api/analyze/image", response_model=DetectionResult, tags=["Analysis"])
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image for deepfake / AI-generation artifacts.

    Accepts: JPG, PNG, WEBP, BMP
    """
    if not any(file.filename.lower().endswith(ext)
               for ext in config.SUPPORTED_IMAGE_TYPES):
        raise HTTPException(status_code=400, detail="Unsupported image format")

    start = time.time()
    image_bytes = await file.read()

    if len(image_bytes) > config.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    logger.info(f"[image] Received {len(image_bytes) / 1024:.1f} KB")

    media_result = get_media_analyzer().analyze_image(image_bytes=image_bytes)
    
    text_result = None
    if media_result.extracted_text:
        logger.info(f"[image] Running OCR text through Fact Checker: '{media_result.extracted_text[:30]}...'")
        text_result = get_text_analyzer().analyze(media_result.extracted_text)

    result = get_ensemble().predict(media_result=media_result, text_result=text_result)

    logger.info(f"[image] Done in {time.time() - start:.2f}s | verdict={result.verdict}")
    return result


# ── Video Analysis ────────────────────────────────────────────────────────────

@app.post("/api/analyze/video", response_model=DetectionResult, tags=["Analysis"])
async def analyze_video(file: UploadFile = File(...)):
    """
    Analyze an uploaded video for deepfake manipulation.

    Accepts: MP4, AVI, MOV, MKV, WEBM
    """
    if not any(file.filename.lower().endswith(ext)
               for ext in config.SUPPORTED_VIDEO_TYPES):
        raise HTTPException(status_code=400, detail="Unsupported video format")

    start = time.time()
    logger.info(f"==> Starting to read upload stream for {file.filename}...")
    video_bytes = await file.read()
    logger.info(f"==> Finished reading {len(video_bytes)} bytes into memory.")

    if len(video_bytes) > config.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    import tempfile
    tmp_dir = Path(tempfile.gettempdir())
    tmp_path = tmp_dir / f"{uuid.uuid4()}.mp4"
    logger.info(f"==> Writing to temp file {tmp_path}...")
    tmp_path.write_bytes(video_bytes)
    logger.info(f"==> Temp file written. Starting analyze_video...")

    try:
        logger.info(f"[video] Received {len(video_bytes) / 1024 / 1024:.1f} MB")
        media_result = get_media_analyzer().analyze_video(str(tmp_path))
        result = get_ensemble().predict(media_result=media_result)
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except PermissionError:
            logger.warning(f"Could not delete temp video file {tmp_path} (in use).")

    logger.info(f"[video] Done in {time.time() - start:.2f}s | verdict={result.verdict}")
    return result


# ── URL Analysis ──────────────────────────────────────────────────────────────

@app.post("/api/analyze/url", response_model=DetectionResult, tags=["Analysis"])
async def analyze_url(body: URLInput):
    """
    Fetch a URL and analyze its text content for misinformation.
    """
    start = time.time()
    logger.info(f"[url] Fetching {body.url}")

    try:
        # verify=False prevents SSL: CERTIFICATE_VERIFY_FAILED on local Windows
        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.get(body.url, follow_redirects=True)
            resp.raise_for_status()
            # Very basic HTML → text stripping
            from html.parser import HTMLParser

            class _TextExtractor(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self._parts: list[str] = []
                def handle_data(self, data):
                    self._parts.append(data)
                def get_text(self):
                    return " ".join(self._parts)

            parser = _TextExtractor()
            parser.feed(resp.text)
            text = parser.get_text()[:5000]  # Limit to 5k chars

    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {exc}")

    text_result = get_text_analyzer().analyze(text, source_url=body.url)
    graph_result = get_graph_analyzer().analyze(body.url)
    result = get_ensemble().predict(text_result=text_result, graph_result=graph_result)

    logger.info(f"[url] Done in {time.time() - start:.2f}s | verdict={result.verdict}")
    return result
