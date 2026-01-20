"""Mock LLM service for testing and development."""

import re


class MockLLMService:
    """Mock LLM implementation that extracts basic data from HTML."""

    async def extract_recipe(self, html: str) -> dict:
        """
        Mock LLM extraction - returns basic data parsed from HTML.

        This is a simple fallback that extracts title and body text
        without any actual LLM processing. Useful for testing and
        development before integrating a real LLM service.

        Args:
            html: Raw HTML content

        Returns:
            Dictionary with basic extracted recipe data
        """
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")

        # Extract title from h1 or title tag
        title = None
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)
        elif soup.title:
            title = soup.title.get_text(strip=True)

        # Get body text as instructions
        body = soup.find("body")
        instructions = body.get_text(separator="\n", strip=True) if body else ""

        # Try to extract ingredients from lists
        ingredients = self._extract_ingredients_from_html(soup)

        # Try to extract servings from text
        servings = self._extract_servings_from_text(html)

        return {
            "name": title or "Untitled Recipe",
            "instructions": instructions,
            "servings": servings,
            "ingredients": ingredients,
            "tags": [],
            "prep_time_minutes": None,
            "cook_time_minutes": None,
        }

    def _extract_ingredients_from_html(self, soup) -> list[str]:
        """
        Try to extract ingredients from HTML lists.

        Looks for lists that might contain ingredients based on
        common patterns like class names or content.
        """
        ingredients = []

        # Look for lists with ingredient-related class names
        ingredient_lists = soup.find_all(
            ["ul", "ol"], class_=lambda c: c and "ingredient" in c.lower() if c else False
        )

        for ul in ingredient_lists:
            for li in ul.find_all("li"):
                text = li.get_text(strip=True)
                if text:
                    ingredients.append(text)

        return ingredients

    def _extract_servings_from_text(self, html: str) -> int:
        """
        Try to extract servings from text patterns.

        Looks for common patterns like "Serves 4" or "4 servings".
        """
        # Common patterns for servings
        patterns = [
            r"serves?\s*:?\s*(\d+)",
            r"(\d+)\s*servings?",
            r"(\d+)\s*porsjoner",  # Norwegian
            r"porsjoner?\s*:?\s*(\d+)",  # Norwegian
        ]

        text = html.lower()
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return int(match.group(1))

        return 4  # Default servings for LLM extraction
