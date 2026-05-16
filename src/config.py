"""
Central configuration for the Misinformation Detection System.
All settings are loaded from environment variables via .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ── Base Paths ────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
LOGS_DIR = BASE_DIR / "logs"

# Create directories if they don't exist
for d in [DATA_DIR / "raw", DATA_DIR / "processed", DATA_DIR / "chroma_db",
          MODELS_DIR, LOGS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ── Application ───────────────────────────────────────────────────────────────
APP_NAME = os.getenv("APP_NAME", "MisinformationDetector")
APP_ENV = os.getenv("APP_ENV", "development")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/misinformation_db")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/misinformation_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ── Vector Database ───────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR = str(DATA_DIR / "chroma_db")

# ── Hugging Face ──────────────────────────────────────────────────────────────
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")

# ── MLOps ─────────────────────────────────────────────────────────────────────
WANDB_PROJECT = os.getenv("WANDB_PROJECT", "misinformation-detector")
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", str(BASE_DIR / "mlruns"))

# ── Model Paths ───────────────────────────────────────────────────────────────
TEXT_MODEL_PATH = os.getenv("TEXT_MODEL_PATH", str(MODELS_DIR / "text_classifier"))
IMAGE_MODEL_PATH = os.getenv("IMAGE_MODEL_PATH", str(MODELS_DIR / "image_classifier"))
VIDEO_MODEL_PATH = os.getenv("VIDEO_MODEL_PATH", str(MODELS_DIR / "video_classifier"))
ENSEMBLE_MODEL_PATH = os.getenv("ENSEMBLE_MODEL_PATH", str(MODELS_DIR / "ensemble"))

# ── Processing ────────────────────────────────────────────────────────────────
MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "512"))
MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", "1024"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))
NUM_WORKERS = int(os.getenv("NUM_WORKERS", "4"))

# ── API ───────────────────────────────────────────────────────────────────────
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:8080"]

# ── Pre-trained Model Names (from Hugging Face Hub) ──────────────────────────
CLAIM_EXTRACTION_MODEL = "dslim/bert-base-NER"
SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
FACT_CHECK_MODEL = "roberta-large-mnli"

# ── Thresholds ────────────────────────────────────────────────────────────────
DEEPFAKE_THRESHOLD = 0.6       # Above this = likely fake
UNCERTAINTY_THRESHOLD = 0.3    # Below this confidence = uncertain
CREDIBILITY_THRESHOLD = 0.4    # Below this = low credibility source

# ── Supported File Types ──────────────────────────────────────────────────────
SUPPORTED_IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
SUPPORTED_VIDEO_TYPES = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
MAX_FILE_SIZE_MB = 100
