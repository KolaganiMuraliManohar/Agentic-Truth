"""
Ensemble Detector Module
========================
Aggregates multimodal scores from text, media, and graph modules
to produce the final verdict and explainability breakdown.
"""

from __future__ import annotations

from typing import Optional, List
from src.schemas import (
    DetectionResult, TextAnalysisResult, MediaAnalysisResult,
    GraphAnalysisResult, Verdict, Evidence
)


class EnsembleDetector:
    """Ensemble aggregation and Bayesian verdict engine."""

    def __init__(self):
        pass

    def predict(
        self,
        text_result: Optional[TextAnalysisResult] = None,
        media_result: Optional[MediaAnalysisResult] = None,
        graph_result: Optional[GraphAnalysisResult] = None
    ) -> DetectionResult:
        evidence: List[Evidence] = []
        scores: List[float] = []

        text_score = None
        media_score = None
        graph_score = None

        if text_result:
            evidence.extend(text_result.evidence)
            # Higher fact_check_score = more likely real. Misinformation score = 1 - fact_check_score
            text_score = 1.0 - text_result.fact_check_score
            scores.append(text_score)

        if media_result:
            evidence.extend(media_result.evidence)
            media_score = media_result.deepfake_score
            scores.append(media_score)

        if graph_result:
            evidence.extend(graph_result.evidence)
            graph_score = graph_result.propagation_score
            scores.append(graph_score)

        if not scores:
            return DetectionResult(
                verdict=Verdict.UNCERTAIN,
                confidence=0.5,
                uncertainty=0.5,
                recommendation="Insufficient input data to form a definitive verdict."
            )

        # Average misinformation score across active modalities
        avg_score = sum(scores) / len(scores)

        if avg_score >= 0.60:
            verdict = Verdict.LIKELY_FAKE
            confidence = min(0.98, max(0.65, avg_score))
            recommendation = (
                "⚠️ High risk of misinformation detected. This claim or media exhibits strong indicators of "
                "synthetic manipulation or deliberate factual falsehoods. Do not amplify without primary verification."
            )
        elif avg_score <= 0.35:
            verdict = Verdict.LIKELY_REAL
            confidence = min(0.98, max(0.65, 1.0 - avg_score))
            recommendation = (
                "✅ Content appears authentic and corroborated by authoritative sources. "
                "Standard journalistic and physical consistency standards are met."
            )
        else:
            verdict = Verdict.UNCERTAIN
            confidence = 0.50 + abs(0.5 - avg_score)
            recommendation = (
                "🔍 Ambiguous or conflicting signals found. Further cross-verification with independent primary "
                "sources or human forensic review is recommended."
            )

        return DetectionResult(
            verdict=verdict,
            confidence=round(confidence, 2),
            uncertainty=round(1.0 - confidence, 2),
            text_score=text_score,
            media_score=media_score,
            graph_score=graph_score,
            text_analysis=text_result,
            media_analysis=media_result,
            graph_analysis=graph_result,
            evidence=evidence,
            suspicious_regions=media_result.suspicious_regions if media_result else [],
            human_review_needed=(verdict == Verdict.UNCERTAIN),
            recommendation=recommendation
        )
