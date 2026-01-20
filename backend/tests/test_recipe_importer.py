"""Tests for recipe importer service."""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from src.services.mock_llm import MockLLMService
from src.services.recipe_importer import RecipeImporter


class TestRecipeImporter:
    """Tests for RecipeImporter service."""

    def setup_method(self):
        self.importer = RecipeImporter()

    # Ingredient line parsing tests

    def test_parse_ingredient_line_simple(self):
        """Parse a simple ingredient line."""
        result = self.importer.parse_ingredient_line("2 cups flour")

        assert result["quantity"] == 2.0
        assert result["unit"] == "cups"
        assert result["raw_text"] == "2 cups flour"

    def test_parse_ingredient_line_no_quantity(self):
        """Parse ingredient with no explicit quantity."""
        result = self.importer.parse_ingredient_line("salt to taste")

        assert result["quantity"] is None
        assert result["unit"] is None
        assert result["raw_text"] == "salt to taste"

    def test_parse_ingredient_line_fraction(self):
        """Parse ingredient with fraction."""
        result = self.importer.parse_ingredient_line("1/2 cup sugar")

        assert result["quantity"] == 0.5
        assert result["unit"] == "cup"
        assert result["raw_text"] == "1/2 cup sugar"

    def test_parse_ingredient_line_mixed_number(self):
        """Parse ingredient with mixed number like 1 1/2."""
        result = self.importer.parse_ingredient_line("1 1/2 cups milk")

        assert result["quantity"] == 1.5
        assert result["unit"] == "cups"
        assert result["raw_text"] == "1 1/2 cups milk"

    def test_parse_ingredient_line_decimal(self):
        """Parse ingredient with decimal quantity."""
        result = self.importer.parse_ingredient_line("0.5 kg potatoes")

        assert result["quantity"] == 0.5
        assert result["unit"] == "kg"
        assert result["raw_text"] == "0.5 kg potatoes"

    def test_parse_ingredient_line_tablespoon(self):
        """Parse ingredient with tablespoon unit."""
        result = self.importer.parse_ingredient_line("2 tablespoons olive oil")

        assert result["quantity"] == 2.0
        assert result["unit"] == "tablespoons"
        assert result["raw_text"] == "2 tablespoons olive oil"

    def test_parse_ingredient_line_tbsp_abbreviation(self):
        """Parse ingredient with tbsp abbreviation."""
        result = self.importer.parse_ingredient_line("1 tbsp butter")

        assert result["quantity"] == 1.0
        assert result["unit"] == "tbsp"
        assert result["raw_text"] == "1 tbsp butter"

    def test_parse_ingredient_line_grams(self):
        """Parse ingredient with grams."""
        result = self.importer.parse_ingredient_line("200 g pasta")

        assert result["quantity"] == 200.0
        assert result["unit"] == "g"
        assert result["raw_text"] == "200 g pasta"

    def test_parse_ingredient_line_with_parenthetical_notes(self):
        """Parse ingredient with notes in parentheses."""
        result = self.importer.parse_ingredient_line("2 eggs (large)")

        assert result["quantity"] == 2.0
        assert result["raw_text"] == "2 eggs (large)"
        assert result["notes"] == "large"

    def test_parse_ingredient_line_norwegian_dl(self):
        """Parse Norwegian deciliter unit."""
        result = self.importer.parse_ingredient_line("3 dl melk")

        assert result["quantity"] == 3.0
        assert result["unit"] == "dl"
        assert result["raw_text"] == "3 dl melk"

    # HTML extraction tests

    def test_extract_recipe_data_minimal(self):
        """Extract recipe data from minimal HTML."""
        html = """
        <html>
        <head><title>Simple Recipe</title></head>
        <body>
            <h1>Test Recipe</h1>
            <p>Mix ingredients and bake.</p>
        </body>
        </html>
        """
        result = self.importer.extract_recipe_data(html, "https://example.com/recipe")

        assert result["name"] == "Test Recipe"
        assert result["source_url"] == "https://example.com/recipe"
        assert result["instructions"] is not None

    def test_extract_recipe_data_no_h1_uses_title(self):
        """Use page title when no h1 present."""
        html = """
        <html>
        <head><title>Fallback Recipe Title</title></head>
        <body>
            <p>Instructions here.</p>
        </body>
        </html>
        """
        result = self.importer.extract_recipe_data(html, "https://example.com/recipe")

        assert result["name"] == "Fallback Recipe Title"

    def test_extract_recipe_data_with_json_ld(self):
        """Extract recipe from JSON-LD structured data."""
        html = """
        <html>
        <head>
            <title>Page Title</title>
            <script type="application/ld+json">
            {
                "@type": "Recipe",
                "name": "JSON-LD Recipe Name",
                "recipeIngredient": ["2 cups flour", "1 cup sugar"],
                "recipeInstructions": "Mix and bake.",
                "recipeYield": "4 servings"
            }
            </script>
        </head>
        <body><h1>Different H1</h1></body>
        </html>
        """
        result = self.importer.extract_recipe_data(html, "https://example.com/recipe")

        # JSON-LD should take precedence
        assert result["name"] == "JSON-LD Recipe Name"
        assert len(result["ingredients"]) == 2
        assert result["servings"] == 4

    def test_extract_recipe_data_returns_default_servings(self):
        """Default to 2 servings when not specified."""
        html = "<html><body><h1>Recipe</h1></body></html>"
        result = self.importer.extract_recipe_data(html, "https://example.com/recipe")

        assert result["servings"] == 2

    def test_extract_recipe_data_untitled_fallback(self):
        """Use 'Untitled Recipe' when no name found."""
        html = "<html><body><p>Just text</p></body></html>"
        result = self.importer.extract_recipe_data(html, "https://example.com/recipe")

        assert result["name"] == "Untitled Recipe"

    def test_extract_recipe_data_includes_confidence(self):
        """Result includes confidence score."""
        html = "<html><body><h1>Recipe</h1></body></html>"
        result = self.importer.extract_recipe_data(html, "https://example.com/recipe")

        assert "confidence" in result
        assert 0 <= float(result["confidence"]) <= 1

    # Edge cases

    def test_parse_ingredient_line_empty_string(self):
        """Handle empty string gracefully."""
        result = self.importer.parse_ingredient_line("")

        assert result["quantity"] is None
        assert result["unit"] is None
        assert result["raw_text"] == ""

    def test_parse_ingredient_line_whitespace_only(self):
        """Handle whitespace-only string."""
        result = self.importer.parse_ingredient_line("   ")

        assert result["quantity"] is None
        assert result["unit"] is None
        assert result["raw_text"] == ""


class TestRecipeImporterWithLLM:
    """Tests for RecipeImporter with LLM service."""

    def setup_method(self):
        self.mock_llm = MockLLMService()
        self.importer = RecipeImporter(llm_service=self.mock_llm)

    def test_importer_accepts_llm_service(self):
        """Importer can be initialized with LLM service."""
        assert self.importer.llm_service is not None

    def test_importer_works_without_llm_service(self):
        """Importer works when no LLM service provided."""
        importer = RecipeImporter()
        assert importer.llm_service is None

        # Should still extract recipes
        html = "<html><body><h1>Test Recipe</h1></body></html>"
        result = importer.extract_recipe_data(html, "https://example.com/recipe")
        assert result["name"] == "Test Recipe"


class TestMockLLMService:
    """Tests for MockLLMService."""

    def setup_method(self):
        self.llm = MockLLMService()

    @pytest.mark.asyncio
    async def test_extract_recipe_basic(self):
        """Extract basic recipe data from HTML."""
        html = """
        <html>
        <head><title>Page Title</title></head>
        <body>
            <h1>Chocolate Cake</h1>
            <p>Mix flour and sugar.</p>
        </body>
        </html>
        """
        result = await self.llm.extract_recipe(html)

        assert result["name"] == "Chocolate Cake"
        assert "Mix flour and sugar" in result["instructions"]
        assert result["servings"] == 4  # Default

    @pytest.mark.asyncio
    async def test_extract_recipe_uses_title_when_no_h1(self):
        """Uses title tag when no h1 present."""
        html = """
        <html>
        <head><title>Vanilla Pudding Recipe</title></head>
        <body><p>Instructions here.</p></body>
        </html>
        """
        result = await self.llm.extract_recipe(html)

        assert result["name"] == "Vanilla Pudding Recipe"

    @pytest.mark.asyncio
    async def test_extract_recipe_untitled_fallback(self):
        """Uses 'Untitled Recipe' when no name found."""
        html = "<html><body><p>Just text</p></body></html>"
        result = await self.llm.extract_recipe(html)

        assert result["name"] == "Untitled Recipe"

    @pytest.mark.asyncio
    async def test_extract_recipe_finds_servings(self):
        """Extracts servings from text patterns."""
        html = """
        <html><body>
            <h1>Recipe</h1>
            <p>Serves 6 people</p>
        </body></html>
        """
        result = await self.llm.extract_recipe(html)

        assert result["servings"] == 6

    @pytest.mark.asyncio
    async def test_extract_recipe_finds_servings_norwegian(self):
        """Extracts servings from Norwegian text."""
        html = """
        <html><body>
            <h1>Oppskrift</h1>
            <p>8 porsjoner</p>
        </body></html>
        """
        result = await self.llm.extract_recipe(html)

        assert result["servings"] == 8

    @pytest.mark.asyncio
    async def test_extract_recipe_finds_ingredients_list(self):
        """Extracts ingredients from HTML lists with ingredient class."""
        html = """
        <html><body>
            <h1>Recipe</h1>
            <ul class="ingredients-list">
                <li>2 cups flour</li>
                <li>1 cup sugar</li>
            </ul>
        </body></html>
        """
        result = await self.llm.extract_recipe(html)

        assert len(result["ingredients"]) == 2
        assert "2 cups flour" in result["ingredients"]
        assert "1 cup sugar" in result["ingredients"]


class TestImportFromUrl:
    """Tests for import_from_url method."""

    def setup_method(self):
        self.mock_llm = MockLLMService()
        self.importer = RecipeImporter(llm_service=self.mock_llm)
        self.household_id = uuid4()

    @pytest.mark.asyncio
    async def test_import_from_url_with_json_ld(self):
        """Import uses JSON-LD when available."""
        html = """
        <html>
        <head>
            <script type="application/ld+json">
            {
                "@type": "Recipe",
                "name": "JSON-LD Recipe",
                "recipeIngredient": ["2 cups flour"],
                "recipeInstructions": "Mix well.",
                "recipeYield": "4 servings"
            }
            </script>
        </head>
        <body><h1>Different Title</h1></body>
        </html>
        """

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.text = html
            mock_response.raise_for_status = MagicMock()

            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client.return_value = mock_client_instance

            result = await self.importer.import_from_url(
                "https://example.com/recipe", self.household_id
            )

        # JSON-LD should be used (high confidence)
        assert result["name"] == "JSON-LD Recipe"
        assert result["confidence"] == Decimal("0.9")
        assert result["household_id"] == self.household_id

    @pytest.mark.asyncio
    async def test_import_from_url_falls_back_to_llm(self):
        """Import falls back to LLM when no JSON-LD."""
        html = """
        <html>
        <head><title>Page Title</title></head>
        <body>
            <h1>LLM Extracted Recipe</h1>
            <p>Serves 6</p>
            <p>Mix and bake.</p>
        </body>
        </html>
        """

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.text = html
            mock_response.raise_for_status = MagicMock()

            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client.return_value = mock_client_instance

            result = await self.importer.import_from_url(
                "https://example.com/recipe", self.household_id
            )

        # LLM extraction should be used (medium confidence)
        assert result["name"] == "LLM Extracted Recipe"
        assert result["confidence"] == Decimal("0.6")
        assert result["servings"] == 6
        assert result["household_id"] == self.household_id

    @pytest.mark.asyncio
    async def test_import_from_url_without_llm_service(self):
        """Import works without LLM service (basic HTML extraction)."""
        importer = RecipeImporter()  # No LLM service
        html = """
        <html>
        <head><title>Page Title</title></head>
        <body>
            <h1>Basic Recipe</h1>
            <p>Instructions here.</p>
        </body>
        </html>
        """

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.text = html
            mock_response.raise_for_status = MagicMock()

            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client.return_value = mock_client_instance

            result = await importer.import_from_url(
                "https://example.com/recipe", self.household_id
            )

        # Basic HTML extraction (low confidence)
        assert result["name"] == "Basic Recipe"
        assert result["confidence"] == Decimal("0.5")
        assert result["household_id"] == self.household_id

    @pytest.mark.asyncio
    async def test_import_from_url_preserves_source_url(self):
        """Source URL is preserved in result."""
        html = "<html><body><h1>Recipe</h1></body></html>"
        url = "https://example.com/my-recipe"

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.text = html
            mock_response.raise_for_status = MagicMock()

            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client.return_value = mock_client_instance

            result = await self.importer.import_from_url(url, self.household_id)

        assert result["source_url"] == url


class TestExtractWithLLM:
    """Tests for _extract_with_llm private method."""

    def setup_method(self):
        self.mock_llm = MockLLMService()
        self.importer = RecipeImporter(llm_service=self.mock_llm)

    @pytest.mark.asyncio
    async def test_extract_with_llm_parses_ingredients(self):
        """LLM extraction parses ingredient strings."""
        html = """
        <html><body>
            <h1>Recipe</h1>
            <ul class="ingredients">
                <li>2 cups flour</li>
                <li>1 tsp salt</li>
            </ul>
        </body></html>
        """

        result = await self.importer._extract_with_llm(html, "https://example.com")

        assert result is not None
        assert len(result["ingredients"]) == 2
        # Ingredients should be parsed
        assert result["ingredients"][0]["quantity"] == 2.0
        assert result["ingredients"][0]["unit"] == "cups"

    @pytest.mark.asyncio
    async def test_extract_with_llm_returns_none_without_service(self):
        """Returns None when no LLM service configured."""
        importer = RecipeImporter()  # No LLM service

        result = await importer._extract_with_llm("<html></html>", "https://example.com")

        assert result is None

    @pytest.mark.asyncio
    async def test_extract_with_llm_handles_errors(self):
        """Returns None when LLM extraction fails."""
        # Create a mock that raises an exception
        failing_llm = AsyncMock()
        failing_llm.extract_recipe = AsyncMock(side_effect=Exception("LLM error"))

        importer = RecipeImporter(llm_service=failing_llm)

        result = await importer._extract_with_llm("<html></html>", "https://example.com")

        assert result is None
