from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.session import get_db
from src.services.mock_ocr import MockOCRService
from src.services.ocr import OCRService

DbSession = Annotated[AsyncSession, Depends(get_db)]


def get_ocr_service() -> OCRService:
    if settings.use_mock_ocr:
        return MockOCRService()
    # Future: return TextractOCRService()
    return MockOCRService()


OCRServiceDep = Annotated[OCRService, Depends(get_ocr_service)]
