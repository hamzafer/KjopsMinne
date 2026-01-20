from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.session import get_db
from src.services.mock_llm import MockLLMService
from src.services.mock_ocr import MockOCRService
from src.services.ocr import OCRService
from src.services.recipe_importer import RecipeImporter

DbSession = Annotated[AsyncSession, Depends(get_db)]


def get_ocr_service() -> OCRService:
    if settings.use_mock_ocr:
        return MockOCRService()
    # Future: return TextractOCRService()
    return MockOCRService()


OCRServiceDep = Annotated[OCRService, Depends(get_ocr_service)]


def get_recipe_importer() -> RecipeImporter:
    llm_service = MockLLMService()
    return RecipeImporter(llm_service=llm_service)


RecipeImporterDep = Annotated[RecipeImporter, Depends(get_recipe_importer)]
