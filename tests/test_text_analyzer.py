"""
Tests for the Text Analyzer module.
Run with: pytest tests/ -v
"""

import pytest
from src.models.text.text_analyzer import (
    ClaimExtractor, SentimentAnalyzer, SourceCredibilityScorer
)
from src.schemas import TextAnalysisResult


# ── Claim Extractor ───────────────────────────────────────────────────────────

class TestClaimExtractor:
    def setup_method(self):
        self.extractor = ClaimExtractor()

    def test_extracts_claims_from_text(self):
        text = (
            "Scientists have discovered a new planet. "
            "The planet is twice the size of Earth. "
            "Researchers say it could support life."
        )
        claims = self.extractor.extract(text)
        assert isinstance(claims, list)
        assert len(claims) > 0

    def test_empty_text_returns_empty(self):
        claims = self.extractor.extract("")
        assert claims == []

    def test_short_text_handled(self):
        claims = self.extractor.extract("Hello world.")
        assert isinstance(claims, list)


# ── Sentiment Analyzer ────────────────────────────────────────────────────────

class TestSentimentAnalyzer:
    def setup_method(self):
        self.analyzer = SentimentAnalyzer()

    def test_returns_valid_sentiment(self):
        result = self.analyzer.analyze("This is a great day!")
        assert result in ("positive", "negative", "neutral")

    def test_handles_empty_string(self):
        result = self.analyzer.analyze("")
        assert result in ("positive", "negative", "neutral")


# ── Source Credibility Scorer ─────────────────────────────────────────────────

class TestSourceCredibilityScorer:
    def setup_method(self):
        self.scorer = SourceCredibilityScorer()

    def test_reliable_source_high_score(self):
        score = self.scorer.score("https://www.reuters.com/article/123")
        assert score >= 0.8

    def test_unreliable_source_low_score(self):
        score = self.scorer.score("https://www.infowars.com/article/123")
        assert score <= 0.2

    def test_unknown_source_neutral(self):
        score = self.scorer.score("https://www.randomnewssite.com/article")
        assert 0.3 <= score <= 0.8

    def test_none_source_neutral(self):
        score = self.scorer.score(None)
        assert score == 0.5

    def test_gov_domain_bonus(self):
        score = self.scorer.score("https://www.cdc.gov/health/article")
        assert score > 0.5

    def test_https_bonus(self):
        http_score = self.scorer.score("http://www.somesite.com/article")
        https_score = self.scorer.score("https://www.somesite.com/article")
        assert https_score >= http_score


# ── Integration Test ──────────────────────────────────────────────────────────

class TestTextAnalyzerIntegration:
    """
    Integration test — uses fallback models so no GPU/internet needed.
    """

    def test_full_pipeline_returns_result(self):
        from src.models.text.text_analyzer import TextAnalyzer
        analyzer = TextAnalyzer()
        result = analyzer.analyze(
            "Breaking news: Scientists claim to have found life on Mars. "
            "The discovery was made yesterday by NASA researchers.",
            source_url="https://www.reuters.com/science/mars-life-2024"
        )
        assert isinstance(result, TextAnalysisResult)
        assert 0.0 <= result.fact_check_score <= 1.0
        assert 0.0 <= result.source_credibility <= 1.0
        assert result.sentiment in ("positive", "negative", "neutral")

    def test_misinformation_text_flagged(self):
        from src.models.text.text_analyzer import TextAnalyzer
        analyzer = TextAnalyzer()
        result = analyzer.analyze(
            "SHOCKING: Government admits 5G towers cause COVID-19! "
            "Doctors are being silenced! Share before they delete this!",
            source_url="https://www.infowars.com/5g-covid"
        )
        # Source credibility should be low for infowars
        assert result.source_credibility < 0.3
