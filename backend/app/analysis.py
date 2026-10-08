"""Concrete text analyses and the dispatcher used by the worker.

``run_analysis`` maps a requested analysis type onto one of three small, pure
text evaluations and returns a short human-readable English result string.
"""

from __future__ import annotations

import math
import string
from collections import Counter

from .schemas import AnalysisType

WORDS_PER_MINUTE = 200
TOP_WORDS_LIMIT = 5


def run_analysis(analysis: AnalysisType, text: str) -> str:
    """Dispatch to the requested analysis and return a readable result string.

    ``analysis`` may be an :class:`AnalysisType` member or its plain string value
    (the worker reads it back from the database as a string). An unknown analysis
    type raises a ``ValueError`` naming the offending value.
    """
    try:
        kind = AnalysisType(analysis)
    except ValueError as exc:
        raise ValueError(f"Unknown analysis type: {analysis!r}") from exc

    if kind is AnalysisType.WORD_COUNT:
        return _word_count(text)
    if kind is AnalysisType.TOP_WORDS:
        return _top_words(text)
    if kind is AnalysisType.READING_TIME:
        return _reading_time(text)
    # Defensive: an enum member added later without a handler must not pass.
    raise ValueError(f"Unknown analysis type: {analysis!r}")


def _word_count(text: str) -> str:
    """Count whitespace-separated words."""
    count = len(text.split())
    noun = "word" if count == 1 else "words"
    return f"The text contains {count} {noun}."


def _top_words(text: str) -> str:
    """List the most frequent words, case-folded and stripped of punctuation."""
    words = _normalised_words(text)
    if not words:
        return "No words to rank (empty text)."

    ranked = Counter(words).most_common(TOP_WORDS_LIMIT)
    listing = ", ".join(f"{word} ({count})" for word, count in ranked)
    label = "Top word" if len(ranked) == 1 else "Top words"
    return f"{label}: {listing}."


def _reading_time(text: str) -> str:
    """Estimate reading minutes from the word count at a fixed rate."""
    words = len(text.split())
    if words == 0:
        return "Estimated reading time: 0 minutes (empty text)."

    minutes = max(1, math.ceil(words / WORDS_PER_MINUTE))
    minute_noun = "minute" if minutes == 1 else "minutes"
    word_noun = "word" if words == 1 else "words"
    return (
        f"Estimated reading time: {minutes} {minute_noun} "
        f"({words} {word_noun} at {WORDS_PER_MINUTE} words per minute)."
    )


def _normalised_words(text: str) -> list[str]:
    """Split on whitespace, drop surrounding punctuation and case-fold."""
    words: list[str] = []
    for token in text.split():
        word = token.strip(string.punctuation).lower()
        if word:
            words.append(word)
    return words
