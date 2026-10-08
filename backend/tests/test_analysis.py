"""Tests for the three text analyses and the analysis dispatcher."""

from __future__ import annotations

import pytest

from backend.app.analysis import (
    TOP_WORDS_LIMIT,
    WORDS_PER_MINUTE,
    run_analysis,
)
from backend.app.schemas import AnalysisType


def test_word_count_whitespace_separated():
    assert run_analysis(AnalysisType.WORD_COUNT, "hello world") == ("The text contains 2 words.")


def test_word_count_counts_punctuation_attached_tokens():
    text = "Hello, world! How are you?"
    assert run_analysis(AnalysisType.WORD_COUNT, text) == "The text contains 5 words."


def test_word_count_single_word():
    assert run_analysis(AnalysisType.WORD_COUNT, "Hello") == "The text contains 1 word."


def test_word_count_empty_text():
    assert run_analysis(AnalysisType.WORD_COUNT, "   ") == "The text contains 0 words."


def test_top_words_ranks_by_frequency():
    text = "the cat and the dog and the bird"
    result = run_analysis(AnalysisType.TOP_WORDS, text)
    assert result == "Top words: the (3), and (2), cat (1), dog (1), bird (1)."


def test_top_words_normalises_case_and_punctuation():
    text = "The cat, the dog. The bird!"
    result = run_analysis(AnalysisType.TOP_WORDS, text)
    assert result == "Top words: the (3), cat (1), dog (1), bird (1)."


def test_top_words_single_word():
    assert run_analysis(AnalysisType.TOP_WORDS, "Hello") == "Top word: hello (1)."


def test_top_words_empty_text():
    assert run_analysis(AnalysisType.TOP_WORDS, "") == "No words to rank (empty text)."


def test_top_words_limits_listing():
    text = " ".join(f"word{i}" for i in range(TOP_WORDS_LIMIT + 3))
    result = run_analysis(AnalysisType.TOP_WORDS, text)
    assert result.count("(") == TOP_WORDS_LIMIT


def test_reading_time_two_minutes_for_400_words():
    text = " ".join(["word"] * (WORDS_PER_MINUTE * 2))
    result = run_analysis(AnalysisType.READING_TIME, text)
    assert result == (
        f"Estimated reading time: 2 minutes ({WORDS_PER_MINUTE * 2} words at "
        f"{WORDS_PER_MINUTE} words per minute)."
    )


def test_reading_time_single_word_is_one_minute():
    result = run_analysis(AnalysisType.READING_TIME, "Hello")
    assert result == (
        f"Estimated reading time: 1 minute (1 word at {WORDS_PER_MINUTE} words per minute)."
    )


def test_reading_time_empty_text():
    assert run_analysis(AnalysisType.READING_TIME, "") == (
        "Estimated reading time: 0 minutes (empty text)."
    )


def test_run_analysis_accepts_string_value():
    assert run_analysis("word_count", "a b c") == "The text contains 3 words."


def test_run_analysis_unknown_type_raises_clear_error():
    with pytest.raises(ValueError, match="Unknown analysis type"):
        run_analysis("summarise", "some text")
