"""
News Article Scraper
====================
Collects news articles from RSS feeds and stores them in the database.

Usage:
    python -m src.data.scrapers.news_scraper --limit 100
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass
from typing import List, Optional
from urllib.parse import urlparse

import feedparser
import requests
from bs4 import BeautifulSoup
from loguru import logger


# ── RSS Feeds to scrape ───────────────────────────────────────────────────────

RSS_FEEDS = {
    # Reliable sources
    "reuters":       "https://feeds.reuters.com/reuters/topNews",
    "bbc":           "http://feeds.bbci.co.uk/news/rss.xml",
    "ap_news":       "https://rsshub.app/apnews/topics/apf-topnews",
    "guardian":      "https://www.theguardian.com/world/rss",
    # Fact-checking sources
    "snopes":        "https://www.snopes.com/feed/",
    "politifact":    "https://www.politifact.com/rss/all/",
    "factcheck_org": "https://www.factcheck.org/feed/",
}


@dataclass
class Article:
    title: str
    text: str
    url: str
    source: str
    published: Optional[str]
    content_hash: str


# ── Scraper ───────────────────────────────────────────────────────────────────

class NewsScraper:
    """
    Scrapes news articles from RSS feeds.
    Deduplicates by content hash.
    """

    def __init__(self, delay_seconds: float = 1.0):
        self.delay = delay_seconds
        self._seen_hashes: set[str] = set()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; MisinformationDetector/1.0)"
        })

    def scrape_all(self, limit_per_feed: int = 20) -> List[Article]:
        """Scrape all configured RSS feeds."""
        all_articles: List[Article] = []
        for source, url in RSS_FEEDS.items():
            try:
                articles = self.scrape_feed(source, url, limit_per_feed)
                all_articles.extend(articles)
                logger.info(f"[{source}] Scraped {len(articles)} articles")
                time.sleep(self.delay)
            except Exception as exc:
                logger.error(f"[{source}] Failed: {exc}")
        return all_articles

    def scrape_feed(self, source: str, feed_url: str, limit: int) -> List[Article]:
        """Scrape a single RSS feed."""
        feed = feedparser.parse(feed_url)
        articles: List[Article] = []

        for entry in feed.entries[:limit]:
            try:
                url = entry.get("link", "")
                title = entry.get("title", "")
                published = entry.get("published", "")

                # Fetch full article text
                text = self._fetch_article_text(url)
                if not text or len(text) < 100:
                    continue

                # Deduplicate
                content_hash = hashlib.md5(text[:500].encode()).hexdigest()
                if content_hash in self._seen_hashes:
                    continue
                self._seen_hashes.add(content_hash)

                articles.append(Article(
                    title=title,
                    text=text,
                    url=url,
                    source=source,
                    published=published,
                    content_hash=content_hash,
                ))
                time.sleep(self.delay * 0.5)  # Polite delay between article fetches

            except Exception as exc:
                logger.debug(f"Skipping entry: {exc}")

        return articles

    def _fetch_article_text(self, url: str) -> str:
        """Fetch and extract main text from an article URL."""
        try:
            resp = self.session.get(url, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove noise
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()

            # Try common article containers
            for selector in ["article", "main", ".article-body", ".story-body", "#content"]:
                container = soup.select_one(selector)
                if container:
                    return container.get_text(separator=" ", strip=True)

            # Fallback: all paragraph text
            paragraphs = soup.find_all("p")
            return " ".join(p.get_text(strip=True) for p in paragraphs)

        except Exception as exc:
            logger.debug(f"Could not fetch {url}: {exc}")
            return ""


# ── CLI Entry Point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Scrape news articles")
    parser.add_argument("--limit", type=int, default=10, help="Articles per feed")
    parser.add_argument("--output", type=str, default="data/raw/articles.jsonl")
    args = parser.parse_args()

    scraper = NewsScraper(delay_seconds=1.5)
    articles = scraper.scrape_all(limit_per_feed=args.limit)

    import os
    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as f:
        for article in articles:
            f.write(json.dumps({
                "title": article.title,
                "text": article.text[:2000],
                "url": article.url,
                "source": article.source,
                "published": article.published,
                "hash": article.content_hash,
            }, ensure_ascii=False) + "\n")

    logger.success(f"✅ Saved {len(articles)} articles to {args.output}")
