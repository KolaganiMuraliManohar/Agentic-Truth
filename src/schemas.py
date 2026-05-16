"""
Shared data schemas / Pydantic models used across the entire project.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────────

class ContentType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    URL = "url"


class Verdict(str, Enum):
    LIKELY_FAKE = "likely_fake"
    LIKELY_REAL = "likely_real"
    UNCERTAIN = "uncertain"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ── Input Schemas ─────────────────────────────────────────────────────────────

class TextInput(BaseModel):
    text: str = Field(..., min_length=3, max_length=10000, description="Text to analyze")
    source_url: Optional[str] = Field(None, description="Source URL if available")
    language: str = Field("en", description="Language code")


class URLInput(BaseModel):
    url: str = Field(..., description="URL to analyze")


# ── Evidence / Explanation ────────────────────────────────────────────────────

class Evidence(BaseModel):
    type: str = Field(..., description="Type of evidence (biological, physical, metadata, etc.)")
    description: str = Field(..., description="Human-readable explanation")
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: Severity = Severity.MEDIUM
    source_url: Optional[str] = Field(None, description="Link back to the evidence source")
    proof_quote: Optional[str] = Field(None, description="Direct quote from the source")


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    label: str


# ── Module Results ────────────────────────────────────────────────────────────

class TextAnalysisResult(BaseModel):
    claims: List[str] = Field(default_factory=list)
    fact_check_score: float = Field(0.5, ge=0.0, le=1.0)
    sentiment: str = "neutral"
    source_credibility: float = Field(0.5, ge=0.0, le=1.0)
    evidence: List[Evidence] = Field(default_factory=list)
    
    # Phase 13: IFAI Structured Rationale
    ifai_style: Optional[str] = None
    ifai_content: Optional[str] = None
    ifai_consistency: Optional[str] = None


class MediaAnalysisResult(BaseModel):
    deepfake_score: float = Field(0.0, ge=0.0, le=1.0)
    biological_signals_score: float = Field(0.5, ge=0.0, le=1.0)
    physical_consistency_score: float = Field(0.5, ge=0.0, le=1.0)
    metadata_score: float = Field(0.5, ge=0.0, le=1.0)
    temporal_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    metadata_authenticity_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    cross_modal_risk: Optional[float] = Field(None, ge=0.0, le=1.0)
    extracted_text: Optional[str] = None
    suspicious_regions: List[BoundingBox] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)


class GraphAnalysisResult(BaseModel):
    propagation_score: float = Field(0.0, ge=0.0, le=1.0)
    bot_probability: float = Field(0.0, ge=0.0, le=1.0)
    coordinated_campaign: bool = False
    network_size: int = 0
    evidence: List[Evidence] = Field(default_factory=list)


# ── Final Detection Result ────────────────────────────────────────────────────

class DetectionResult(BaseModel):
    """The final output returned to the user."""

    # Core prediction
    verdict: Verdict = Verdict.UNCERTAIN
    confidence: float = Field(0.5, ge=0.0, le=1.0, description="Overall confidence (0-1)")
    uncertainty: float = Field(0.5, ge=0.0, le=1.0, description="Uncertainty estimate")

    # Module scores
    text_score: Optional[float] = None
    media_score: Optional[float] = None
    graph_score: Optional[float] = None

    # Detailed results
    text_analysis: Optional[TextAnalysisResult] = None
    media_analysis: Optional[MediaAnalysisResult] = None
    graph_analysis: Optional[GraphAnalysisResult] = None

    # Explainability
    evidence: List[Evidence] = Field(default_factory=list)
    suspicious_regions: List[BoundingBox] = Field(default_factory=list)

    # Recommendation
    human_review_needed: bool = False
    recommendation: str = ""

    class Config:
        use_enum_values = True
