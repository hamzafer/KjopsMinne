from pathlib import Path
from typing import Any

from src.services.ocr import OCRService


class TextractOCRService(OCRService):
    """AWS Textract OCR service implementation."""

    def __init__(self):
        # Lazy import to avoid dependency when using mock
        try:
            import boto3
            self.client = boto3.client("textract")
        except ImportError:
            raise ImportError("boto3 is required for Textract. Install with: uv add boto3")

    async def extract_text(self, image_path: Path) -> dict[str, Any]:
        """Extract text using AWS Textract."""
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        response = self.client.detect_document_text(
            Document={"Bytes": image_bytes}
        )

        lines = []
        blocks = []

        for block in response.get("Blocks", []):
            if block["BlockType"] == "LINE":
                text = block.get("Text", "")
                confidence = block.get("Confidence", 0) / 100
                lines.append(text)
                blocks.append({"text": text, "confidence": confidence})

        return {
            "lines": lines,
            "blocks": blocks,
            "raw": response,
        }
