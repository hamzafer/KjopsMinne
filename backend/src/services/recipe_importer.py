"""Recipe importer service for fetching and parsing recipes from URLs."""

import json
import re
from decimal import Decimal
from typing import Any


class RecipeImporter:
    """Service for importing recipes from URLs."""

    # Common units for ingredient parsing (ordered by length to match longer units first)
    UNITS = [
        # Full names (longest first)
        "tablespoons",
        "tablespoon",
        "teaspoons",
        "teaspoon",
        "kilograms",
        "kilogram",
        "ounces",
        "ounce",
        "pounds",
        "pound",
        "liters",
        "liter",
        "pieces",
        "piece",
        "slices",
        "slice",
        "grams",
        "gram",
        "cups",
        "cup",
        # Abbreviations
        "tbsp",
        "tsp",
        "pcs",
        "oz",
        "lb",
        "kg",
        "ml",
        "dl",  # Norwegian deciliter
        "g",
        "l",
    ]

    def parse_ingredient_line(self, line: str) -> dict[str, Any]:
        """
        Parse a single ingredient line into structured data.

        Args:
            line: Raw ingredient text like "2 cups flour" or "1/2 cup sugar"

        Returns:
            Dictionary with quantity, unit, raw_text, notes, and ingredient_id
        """
        line = line.strip()

        result: dict[str, Any] = {
            "raw_text": line,
            "quantity": None,
            "unit": None,
            "notes": None,
            "ingredient_id": None,
        }

        if not line:
            return result

        remaining = line

        # Try to extract quantity (handles mixed numbers like "1 1/2", fractions, decimals)
        quantity, remaining = self._extract_quantity(remaining)
        result["quantity"] = quantity

        # Try to extract unit
        if result["quantity"] is not None:
            unit, remaining = self._extract_unit(remaining)
            result["unit"] = unit

        # Extract notes from parentheses
        notes = self._extract_notes(line)
        if notes:
            result["notes"] = notes

        return result

    def _extract_quantity(self, text: str) -> tuple[float | None, str]:
        """
        Extract quantity from the beginning of text.

        Handles:
        - Simple numbers: "2"
        - Decimals: "0.5"
        - Fractions: "1/2"
        - Mixed numbers: "1 1/2"

        Returns:
            Tuple of (quantity as float or None, remaining text)
        """
        text = text.strip()

        # Pattern for mixed numbers like "1 1/2"
        mixed_match = re.match(r"^(\d+)\s+(\d+)/(\d+)\s*", text)
        if mixed_match:
            whole = int(mixed_match.group(1))
            num = int(mixed_match.group(2))
            denom = int(mixed_match.group(3))
            if denom != 0:
                return float(whole + num / denom), text[mixed_match.end() :].strip()

        # Pattern for simple fraction like "1/2"
        fraction_match = re.match(r"^(\d+)/(\d+)\s*", text)
        if fraction_match:
            num = int(fraction_match.group(1))
            denom = int(fraction_match.group(2))
            if denom != 0:
                return float(num / denom), text[fraction_match.end() :].strip()

        # Pattern for decimal or integer
        number_match = re.match(r"^(\d+\.?\d*)\s*", text)
        if number_match:
            return float(number_match.group(1)), text[number_match.end() :].strip()

        return None, text

    def _extract_unit(self, text: str) -> tuple[str | None, str]:
        """
        Extract unit from the beginning of text.

        Returns:
            Tuple of (unit or None, remaining text)
        """
        text_lower = text.lower()

        for unit in self.UNITS:
            # Check if text starts with unit followed by space or end of string
            if text_lower.startswith(unit + " ") or text_lower == unit:
                return unit, text[len(unit) :].strip()

        return None, text

    def _extract_notes(self, text: str) -> str | None:
        """
        Extract notes from parentheses in text.

        Args:
            text: Full ingredient line

        Returns:
            Content of parentheses or None
        """
        match = re.search(r"\(([^)]+)\)", text)
        if match:
            return match.group(1)
        return None

    def extract_recipe_data(self, html: str, source_url: str) -> dict[str, Any]:
        """
        Extract recipe data from HTML content.

        Attempts to extract from:
        1. JSON-LD structured data (preferred)
        2. HTML elements (fallback)

        Args:
            html: Raw HTML content
            source_url: URL the recipe was fetched from

        Returns:
            Dictionary with recipe data including name, instructions, ingredients, etc.
        """
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")

        # Try JSON-LD extraction first (highest quality)
        json_ld_result = self._extract_from_json_ld(soup, source_url)
        if json_ld_result:
            return json_ld_result

        # Fallback to HTML extraction
        return self._extract_from_html(soup, source_url)

    def _extract_from_json_ld(self, soup: Any, source_url: str) -> dict[str, Any] | None:
        """
        Extract recipe data from JSON-LD structured data.

        Args:
            soup: BeautifulSoup object
            source_url: URL of the recipe

        Returns:
            Recipe data dict or None if no JSON-LD recipe found
        """
        scripts = soup.find_all("script", type="application/ld+json")

        for script in scripts:
            try:
                data = json.loads(script.string)

                # Handle array of objects
                if isinstance(data, list):
                    for item in data:
                        if self._is_recipe_object(item):
                            return self._parse_json_ld_recipe(item, source_url)
                # Handle single object
                elif self._is_recipe_object(data):
                    return self._parse_json_ld_recipe(data, source_url)
                # Handle @graph structure
                elif isinstance(data, dict) and "@graph" in data:
                    for item in data["@graph"]:
                        if self._is_recipe_object(item):
                            return self._parse_json_ld_recipe(item, source_url)
            except (json.JSONDecodeError, TypeError):
                continue

        return None

    def _is_recipe_object(self, obj: Any) -> bool:
        """Check if object is a Recipe type in JSON-LD."""
        if not isinstance(obj, dict):
            return False
        obj_type = obj.get("@type", "")
        if isinstance(obj_type, list):
            return "Recipe" in obj_type
        return obj_type == "Recipe"

    def _parse_json_ld_recipe(self, data: dict, source_url: str) -> dict[str, Any]:
        """
        Parse JSON-LD recipe object into our format.

        Args:
            data: JSON-LD recipe object
            source_url: URL of the recipe

        Returns:
            Recipe data dictionary
        """
        name = data.get("name", "Untitled Recipe")

        # Parse ingredients
        raw_ingredients = data.get("recipeIngredient", [])
        ingredients = [self.parse_ingredient_line(ing) for ing in raw_ingredients]

        # Parse instructions
        instructions = self._parse_instructions(data.get("recipeInstructions", ""))

        # Parse servings
        servings = self._parse_servings(data.get("recipeYield", "2"))

        return {
            "name": name,
            "source_url": source_url,
            "instructions": instructions,
            "servings": servings,
            "ingredients": ingredients,
            "tags": data.get("keywords", "").split(",") if data.get("keywords") else [],
            "confidence": Decimal("0.9"),  # High confidence for JSON-LD
        }

    def _parse_instructions(self, instructions: Any) -> str:
        """
        Parse instructions from various formats.

        Args:
            instructions: Can be string, list of strings, or list of HowToStep objects

        Returns:
            Instructions as a single string
        """
        if isinstance(instructions, str):
            return instructions

        if isinstance(instructions, list):
            steps = []
            for item in instructions:
                if isinstance(item, str):
                    steps.append(item)
                elif isinstance(item, dict):
                    # HowToStep or HowToSection
                    if "text" in item:
                        steps.append(item["text"])
                    elif "itemListElement" in item:
                        # HowToSection with nested steps
                        for sub_item in item["itemListElement"]:
                            if isinstance(sub_item, dict) and "text" in sub_item:
                                steps.append(sub_item["text"])
            return "\n".join(steps)

        return ""

    def _parse_servings(self, yield_value: Any) -> int:
        """
        Parse servings from recipeYield.

        Args:
            yield_value: Can be string like "4 servings" or int

        Returns:
            Number of servings as integer
        """
        if isinstance(yield_value, int):
            return yield_value

        if isinstance(yield_value, str):
            # Try to extract number from string like "4 servings"
            match = re.search(r"(\d+)", yield_value)
            if match:
                return int(match.group(1))

        return 2  # Default

    def _extract_from_html(self, soup: Any, source_url: str) -> dict[str, Any]:
        """
        Extract recipe data from HTML elements (fallback method).

        Args:
            soup: BeautifulSoup object
            source_url: URL of the recipe

        Returns:
            Recipe data dictionary
        """
        # Try to find recipe name from h1 or title
        name = None
        h1 = soup.find("h1")
        if h1:
            name = h1.get_text(strip=True)
        elif soup.title:
            name = soup.title.get_text(strip=True)

        # Get body text as instructions (simplified)
        body = soup.find("body")
        instructions = body.get_text(separator="\n", strip=True) if body else ""

        return {
            "name": name or "Untitled Recipe",
            "source_url": source_url,
            "instructions": instructions,
            "servings": 2,
            "ingredients": [],
            "tags": [],
            "confidence": Decimal("0.5"),  # Lower confidence for HTML fallback
        }
