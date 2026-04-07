"""
services/connection_service.py — Entry Connection System
Finds and marks related entries by keyword similarity.
"""

import re
from database import entries_collection


def find_related_entries(entry_id: str, limit: int = 5) -> list[dict]:
    """
    Find entries related to a given entry by keyword matching.
    Returns list of related entries with relevance score.
    """
    entry = entries_collection.find_one({"_id": _to_object_id(entry_id)})
    if not entry:
        return []

    keywords = _extract_keywords(
        entry.get("content", "") + " " + (entry.get("title", "") or "")
    )
    if not keywords:
        return []

    all_entries = list(
        entries_collection.find({"_id": {"$ne": _to_object_id(entry_id)}})
    )

    scored = []
    for other in all_entries:
        other_text = other.get("content", "") + " " + (other.get("title", "") or "")
        other_keywords = _extract_keywords(other_text)

        if not other_keywords:
            continue

        common = set(keywords) & set(other_keywords)
        if not common:
            continue

        score = len(common) / max(len(keywords), len(other_keywords))

        if score > 0.1:
            relevance = "high" if score > 0.4 else "medium" if score > 0.2 else "low"
            scored.append(
                {
                    "id": str(other["_id"]),
                    "title": other.get("title", other.get("content", "")[:60]),
                    "type": other.get("type", "note"),
                    "relevance": relevance,
                    "reason": f"Shares keywords: {', '.join(list(common)[:3])}",
                    "score": score,
                }
            )

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def update_related_ids(entry_id: str) -> list[str]:
    """Find related entries and update the entry's related_ids field."""
    related = find_related_entries(entry_id, limit=5)
    related_ids = [r["id"] for r in related]

    entries_collection.update_one(
        {"_id": _to_object_id(entry_id)},
        {"$set": {"related_ids": related_ids}},
    )

    return related_ids


def _extract_keywords(text: str) -> list[str]:
    """Extract meaningful keywords from text."""
    stop_words = {
        "the",
        "a",
        "an",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "shall",
        "can",
        "need",
        "dare",
        "ought",
        "used",
        "to",
        "of",
        "in",
        "for",
        "on",
        "with",
        "at",
        "by",
        "from",
        "as",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "between",
        "out",
        "off",
        "over",
        "under",
        "again",
        "further",
        "then",
        "once",
        "here",
        "there",
        "when",
        "where",
        "why",
        "how",
        "all",
        "both",
        "each",
        "few",
        "more",
        "most",
        "other",
        "some",
        "such",
        "no",
        "nor",
        "not",
        "only",
        "own",
        "same",
        "so",
        "than",
        "too",
        "very",
        "just",
        "because",
        "but",
        "and",
        "or",
        "if",
        "while",
        "about",
        "up",
        "that",
        "this",
        "these",
        "those",
        "i",
        "me",
        "my",
        "myself",
        "we",
        "our",
        "ours",
        "you",
        "your",
        "he",
        "him",
        "his",
        "she",
        "her",
        "it",
        "its",
        "they",
        "them",
        "what",
        "which",
        "who",
        "whom",
    }

    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return [w for w in words if w not in stop_words]


def _to_object_id(id_str: str):
    """Convert string ID to MongoDB ObjectId."""
    from bson import ObjectId

    try:
        return ObjectId(id_str)
    except Exception:
        return None
