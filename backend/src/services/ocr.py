from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class OCRService(ABC):
    """Abstract base class for OCR services."""

    @abstractmethod
    async def extract_text(self, image_path: Path) -> dict[str, Any]:
        """
        Extract text from a receipt image.

        Returns a dict with:
        - lines: list of text lines
        - blocks: list of text blocks with confidence scores
        - raw: raw OCR response
        """
        ...
