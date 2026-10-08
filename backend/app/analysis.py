"""Text analysis entry point.

The three concrete analyses are implemented by their own ticket. Until then this
signature exists so every other module can import it.
"""

from __future__ import annotations

from .schemas import AnalysisType


def run_analysis(analysis: AnalysisType, text: str) -> str:
    raise NotImplementedError
