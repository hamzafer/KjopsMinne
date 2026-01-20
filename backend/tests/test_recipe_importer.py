"""Tests for recipe importer service."""

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
